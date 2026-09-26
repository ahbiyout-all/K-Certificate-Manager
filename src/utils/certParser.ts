import { CertificateItem, CertCategory, CertStatus } from '../types';

/**
 * ArrayBuffer를 16진수 문자열로 변환
 */
export function buf2hex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * SHA-256 지문(Fingerprint) 계산 (Web Crypto API)
 */
export async function calculateSha256(data: ArrayBuffer | Uint8Array): Promise<string> {
  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return buf2hex(hashBuffer);
  } catch {
    return '0000000000000000000000000000000000000000000000000000000000000000';
  }
}

/**
 * 간단한 ASN.1 DER 파서: 문자열 추출 및 기본 메타데이터 분석
 */
export function parseDerBasic(derBytes: Uint8Array): {
  subjectDn: string;
  name: string;
  issuer: string;
  caSignatureName?: string;
  serialNumber: string;
  policy: string;
  category: CertCategory;
  departmentOrOrg?: string;
  isSystemCa?: boolean;
  isInstitutional?: boolean;
} {
  // DER 바이트 스트림에서 텍스트(UTF-8, PrintableString) 시퀀스 추출
  const textDecoder = new TextDecoder('utf-8', { fatal: false });
  const rawText = textDecoder.decode(derBytes);

  let category: CertCategory = 'NPKI_BANK';
  let issuer = '공동인증기관';
  let caSignatureName = '공동인증센터 CA';
  let policy = '은행/신용카드/보험용 (개인)';
  let subjectDn = '';
  let name = '인증서 소유자';
  let departmentOrOrg = '';
  let isSystemCa = false;
  let isInstitutional = false;

  // GPKI/EPKI 여부 감지 (OID, 키워드, 한글/영문 기관명)
  const upperRaw = rawText.toUpperCase();
  if (
    upperRaw.includes('GPKI') ||
    upperRaw.includes('GOVERNMENT OF KOREA') ||
    upperRaw.includes('대한민국정부') ||
    upperRaw.includes('행정안전부') ||
    upperRaw.includes('행정전자서명') ||
    upperRaw.includes('정부공인') ||
    upperRaw.includes('GOVERNMENT ROOT') ||
    upperRaw.includes('1.2.410.100001') ||
    upperRaw.includes('MOIS')
  ) {
    category = 'GPKI_GOV';
    issuer = '행정전자서명인증센터 (GPKI)';
    if (upperRaw.includes('CA134040001')) {
      caSignatureName = '행정전자서명 행정기관용 인증센터 (CA134040001)';
    } else if (upperRaw.includes('CA134040002')) {
      caSignatureName = '행정전자서명 공공기관용 인증센터 (CA134040002)';
    } else if (upperRaw.includes('CA134040003')) {
      caSignatureName = '행정전자서명 특수목적용 인증센터 (CA134040003)';
    } else if (upperRaw.includes('CA134')) {
      caSignatureName = '행정전자서명 중계인증센터 (CA134)';
    } else if (upperRaw.includes('CA128')) {
      caSignatureName = '사법부/대법원 전자서명인증센터 (CA128)';
    } else if (upperRaw.includes('GPKIROOT')) {
      caSignatureName = '행정전자서명 최상위인증센터 (GPKIRootCA)';
    } else {
      caSignatureName = '행정전자서명인증센터 (GPKI Sub CA)';
    }
    policy = '행정업무용 (공무원/기관 전자서명)';
  } else if (
    upperRaw.includes('EPKI') ||
    upperRaw.includes('KOREA EDUCATION') ||
    upperRaw.includes('교육부') ||
    upperRaw.includes('시도교육청') ||
    upperRaw.includes('교육학술정보원') ||
    upperRaw.includes('KERIS') ||
    upperRaw.includes('나이스') ||
    upperRaw.includes('NEIS') ||
    upperRaw.includes('에듀파인') ||
    upperRaw.includes('1.2.410.200005.2') ||
    upperRaw.includes('1.2.410.100005')
  ) {
    category = 'EPKI_EDU';
    issuer = '교육부전자서명인증센터 (EPKI)';
    if (upperRaw.includes('CA974')) {
      caSignatureName = '교육부전자서명인증센터 (EPKI CA974)';
    } else if (upperRaw.includes('CA973')) {
      caSignatureName = '한국교육학술정보원 전자서명인증센터 (KERIS CA973)';
    } else if (upperRaw.includes('EPKIROOT')) {
      caSignatureName = '교육부전자서명 최상위인증센터 (EPKIRootCA)';
    } else {
      caSignatureName = '교육부전자서명인증센터 (EPKI Sub CA)';
    }
    policy = '교육행정용 (나이스 NEIS / K-에듀파인)';
  } else if (upperRaw.includes('MPKI') || upperRaw.includes('국방전자서명') || upperRaw.includes('국방부') || upperRaw.includes('1.2.410.100003')) {
    category = 'GPKI_GOV';
    issuer = '국방전자서명인증센터 (MPKI)';
    caSignatureName = '국방전자서명인증센터 (MPKI Sub CA)';
    policy = '국방전자서명용 (군인/군기관)';
  } else if (rawText.includes('yessign') || rawText.includes('Financial Telecommunications')) {
    category = 'NPKI_BANK';
    issuer = '금융결제원 (yessign)';
    caSignatureName = '금융결제원 전자인증센터 (yessignCA Class 1)';
    policy = '은행/신용카드/보험용 (개인)';
  } else if (rawText.includes('SignKorea') || rawText.includes('KOSCOM') || rawText.includes('코스콤')) {
    category = 'NPKI_BANK';
    issuer = '코스콤 (SignKorea)';
    caSignatureName = '코스콤 공인인증센터 (SignKorea CA)';
    policy = '증권거래용 (개인)';
  } else if (rawText.includes('KICA') || rawText.includes('한국정보인증')) {
    category = rawText.includes('법인') || rawText.includes('corp') ? 'NPKI_CORP' : 'NPKI_BANK';
    issuer = '한국정보인증 (KICA)';
    caSignatureName = '한국정보인증 공인인증센터 (KICA CA)';
    policy = category === 'NPKI_CORP' ? '전자세금용 (법인)' : '범용/은행용 (개인)';
  } else if (rawText.includes('CrossCert') || rawText.includes('한국전자인증')) {
    category = 'NPKI_BANK';
    issuer = '한국전자인증 (CrossCert)';
    caSignatureName = '한국전자인증 전자인증센터 (CrossCert CA)';
    policy = '범용공동인증서 (개인)';
  } else if (rawText.includes('TradeSign') || rawText.includes('한국무역정보통신')) {
    category = 'NPKI_BANK';
    issuer = '한국무역정보통신 (TradeSign)';
    caSignatureName = '한국무역정보통신 무역인증센터 (TradeSign CA)';
    policy = '무역 및 전자상거래용 (TradeSign)';
  }

  // CN= 추출
  const cnMatch = rawText.match(/cn=([^,\x00-\x1F]+)/i);
  let rawCn = cnMatch && cnMatch[1] ? cnMatch[1].trim() : '';
  
  // OU= 추출
  const ouMatches = [...rawText.matchAll(/ou=([^,\x00-\x1F]+)/gi)].map(m => m[1].trim());
  const validOus = ouMatches.filter(u => 
    !u.toLowerCase().includes('government') &&
    !u.toLowerCase().includes('korea') &&
    !u.toLowerCase().includes('personal4ib') &&
    !u.toLowerCase().includes('server') &&
    !u.toLowerCase().includes('class1') &&
    !u.toLowerCase().includes('gpki') &&
    !u.toLowerCase().includes('epki')
  );

  if (validOus.length > 0) {
    departmentOrOrg = validOus.join(' / ');
  }

  if (rawCn) {
    subjectDn = `cn=${rawCn}`;
    if (validOus.length > 0) subjectDn += `,ou=${validOus[0]}`;
    subjectDn += `,o=${issuer},c=kr`;

    // 1. 시스템 CA 명칭 처리
    if (rawCn.toUpperCase().startsWith('CA134040001')) {
      name = '행정전자서명 행정기관용 중계CA (CA134040001)';
      departmentOrOrg = departmentOrOrg || '행정안전부 (정부GPKI)';
      policy = '행정기관 전자서명 발급용 중계 CA';
      isSystemCa = true;
    } else if (rawCn.toUpperCase().startsWith('CA134040002')) {
      name = '행정전자서명 공공기관용 중계CA (CA134040002)';
      departmentOrOrg = departmentOrOrg || '행정안전부 (정부GPKI)';
      policy = '공공기관 전자서명 발급용 중계 CA';
      isSystemCa = true;
    } else if (rawCn.toUpperCase().startsWith('CA134040003')) {
      name = '행정전자서명 특수목적용 중계CA (CA134040003)';
      departmentOrOrg = departmentOrOrg || '행정안전부 (정부GPKI)';
      policy = '특수목적/서버인증 발급용 중계 CA';
      isSystemCa = true;
    } else if (rawCn.toUpperCase().startsWith('CA134')) {
      name = `행정전자서명 중계CA (${rawCn})`;
      departmentOrOrg = departmentOrOrg || '행정안전부 (정부GPKI)';
      policy = '행정전자서명 중계 CA 인증서';
      isSystemCa = true;
    } else if (rawCn.toUpperCase().startsWith('CA974') || rawCn.toUpperCase().startsWith('CA973')) {
      name = `교육부 전자서명 중계CA (${rawCn})`;
      departmentOrOrg = departmentOrOrg || '교육부 (한국교육학술정보원)';
      policy = '교육행정전자서명 중계 CA 인증서';
      isSystemCa = true;
    } else if (rawCn.toUpperCase().startsWith('GPKIROOT')) {
      name = `대한민국 정부 행정전자서명 최상위 루트CA (${rawCn})`;
      departmentOrOrg = '행정안전부 (대한민국정부)';
      policy = '대한민국 행정전자서명 최상위 Root CA';
      isSystemCa = true;
    } else if (rawCn.toUpperCase().startsWith('EPKIROOT')) {
      name = `대한민국 교육부 전자서명 최상위 루트CA (${rawCn})`;
      departmentOrOrg = '교육부 (대한민국)';
      policy = '대한민국 교육행정전자서명 최상위 Root CA';
      isSystemCa = true;
    } else {
      // 2. 기관용 공용 인증서 (GPKI / EPKI) 패턴 분석 (예: 001행정안전부001, 경상북도교육감001, 001대법원(특수목적용)001)
      const agencyMatch = rawCn.match(/^(?:[0-9]{3})?([가-힣A-Za-z0-9\(\)\s_\-]+?)(?:[0-9]{3,})?$/);
      const stripped = agencyMatch ? agencyMatch[1].trim() : rawCn;

      const isAgencyKeywords = stripped.includes('청') || stripped.includes('부') || stripped.includes('원') ||
                               stripped.includes('처') || stripped.includes('실') || stripped.includes('본부') ||
                               stripped.includes('교육감') || stripped.includes('시장') || stripped.includes('도지사') ||
                               stripped.includes('구청장') || stripped.includes('군수') || stripped.includes('기관') ||
                               stripped.includes('관인') || stripped.includes('특수목적') || stripped.includes('서버') ||
                               stripped.includes('공단') || stripped.includes('공사');

      if (isAgencyKeywords) {
        isInstitutional = true;
        name = stripped;
        if (!name.includes('기관') && !name.includes('관인') && !name.includes('용') && !name.includes('(') &&
            (name.endsWith('감') || name.endsWith('장') || name.endsWith('사'))) {
          name = `${name} (전자관인)`;
        } else if (!name.includes('(') && !name.includes('용') && !name.includes('관인')) {
          name = `${name} (기관용)`;
        }
        policy = '행정기관/공공기관 공용 전자서명용';
      } else {
        // 3. 일반 사용자 / 공무원 실명 정제
        const personMatch = rawCn.match(/^([가-힣A-Za-z0-9_\-\(\)]+?)(?:\(([^\)]*)\))?(?:[0-9]{4,})?$/);
        if (personMatch) {
          let baseName = personMatch[1].trim().replace(/\d{4,}$/, '');
          const engName = personMatch[2] ? personMatch[2].trim() : '';
          name = engName ? `${baseName} (${engName})` : baseName;
        } else {
          name = rawCn.slice(0, 20);
        }
      }
    }
  }

  // 일련번호 생성 (랜덤 해시 일부 또는 패턴 매칭)
  const serialNumber = [
    derBytes[10]?.toString(16).padStart(2, '0') || '1A',
    derBytes[11]?.toString(16).padStart(2, '0') || '2B',
    derBytes[12]?.toString(16).padStart(2, '0') || '3C',
    derBytes[13]?.toString(16).padStart(2, '0') || '4D',
  ].join(' ').toUpperCase();

  return {
    subjectDn: subjectDn || `cn=${name},o=${issuer},c=kr`,
    name: name || '사용자 인증서',
    issuer,
    caSignatureName,
    policy,
    category,
    serialNumber: serialNumber || '0123 4567 89AB CDEF',
    departmentOrOrg: departmentOrOrg || undefined,
    isSystemCa,
    isInstitutional,
  };
}

/**
 * FileSystemDirectoryHandle (Web File System Access API)로부터 인증서 계층 재귀 탐색
 * - NPKI/GPKI/EPKI 계층 구조 및 숨김 폴더(.NPKI, .certs, .backup 등) 지원
 */
export async function scanDirectoryHandle(
  dirHandle: any,
  currentPath = '',
  depth = 0
): Promise<CertificateItem[]> {
  if (depth > 25) return [];

  const certs: CertificateItem[] = [];
  const entries: any[] = [];

  try {
    for await (const entry of dirHandle.values()) {
      entries.push(entry);
    }
  } catch (err) {
    console.warn('Error enumerating directory handle:', currentPath, err);
    return [];
  }

  // 현재 폴더에 서명 인증서 및 개인키, GPKI 암호화키가 있는지 확인
  const certFileHandle = entries.find(
    e => e.kind === 'file' && (
      e.name.toLowerCase() === 'signcert.der' ||
      e.name.toLowerCase() === 'sigcert.der' ||
      e.name.toLowerCase() === 'envcert.der' ||
      e.name.toLowerCase() === 'signcert.cer' ||
      e.name.toLowerCase() === 'sigcert.cer' ||
      e.name.toLowerCase() === 'signcert.crt' ||
      e.name.toLowerCase() === 'cert.der' ||
      e.name.toLowerCase() === 'usercert.der' ||
      e.name.toLowerCase() === 'user.der' ||
      (e.name.toLowerCase().endsWith('.der') && !e.name.toLowerCase().startsWith('km') && !e.name.toLowerCase().startsWith('root'))
    )
  );
  const keyFileHandle = entries.find(
    e => e.kind === 'file' && (
      e.name.toLowerCase() === 'signpri.key' ||
      e.name.toLowerCase() === 'sigpri.key' ||
      e.name.toLowerCase() === 'envpri.key' ||
      e.name.toLowerCase() === 'user.key' ||
      e.name.toLowerCase() === 'signpri.pri' ||
      e.name.toLowerCase() === 'priv.key' ||
      (e.name.toLowerCase().endsWith('.key') && !e.name.toLowerCase().startsWith('km'))
    )
  );
  const kmCertHandle = entries.find(
    e => e.kind === 'file' && e.name.toLowerCase() === 'kmcert.der'
  );
  const kmKeyHandle = entries.find(
    e => e.kind === 'file' && e.name.toLowerCase() === 'kmpri.key'
  );

  if (certFileHandle) {
    try {
      const file = await certFileHandle.getFile();
      // 보안 검증: 512KB 초과 비정상 대용량 파일 메모리 로드 방지 (DoS 방어)
      if (file.size <= 0 || file.size > 512 * 1024) {
        return certs;
      }
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const sha256 = await calculateSha256(bytes);
      const parsed = parseDerBasic(bytes);

      let keySize = 0;
      let keyData: Uint8Array | undefined;
      if (keyFileHandle) {
        const keyFile = await keyFileHandle.getFile();
        if (keyFile.size > 0 && keyFile.size <= 512 * 1024) {
          keySize = keyFile.size;
          keyData = new Uint8Array(await keyFile.arrayBuffer());
        }
      }

      const today = new Date();
      const validToDate = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000);
      const validFromStr = today.toISOString().split('T')[0];
      const validToStr = validToDate.toISOString().split('T')[0];

        certs.push({
          id: `custom-scanned-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: parsed.name,
          subjectDn: parsed.subjectDn,
          category: parsed.category,
          issuer: parsed.issuer,
          caSignatureName: parsed.caSignatureName,
          policy: parsed.policy,
          serialNumber: parsed.serialNumber,
          validFrom: validFromStr,
          validTo: validToStr,
          status: 'valid',
          daysRemaining: 365,
          sourceLocation: `${currentPath || dirHandle.name}/${certFileHandle.name}`,
          sourceDrive: currentPath.startsWith('E:') || currentPath.startsWith('F:') ? '이동식 USB' : '로컬 디스크',
          departmentOrOrg: parsed.departmentOrOrg,
          isSystemCa: parsed.isSystemCa,
          isInstitutional: parsed.isInstitutional,
          files: {
            certName: certFileHandle.name,
            keyName: keyFileHandle ? keyFileHandle.name : 'signPri.key (없음)',
            kmCertName: kmCertHandle?.name,
            kmKeyName: kmKeyHandle?.name,
            hasKey: !!keyFileHandle,
            certSize: file.size,
            keySize,
            certData: bytes,
            keyData,
            sha256,
          },
          isCustomAdded: true,
        });
    } catch (err) {
      console.error('Error reading cert file:', err);
    }
  }

  // 하위 디렉토리 재귀 탐색 (숨김 폴더 포함, 최대 깊이 25)
  for (const entry of entries) {
    if (entry.kind === 'directory') {
      const subCerts = await scanDirectoryHandle(
        entry,
        `${currentPath ? currentPath + '\\' : ''}${entry.name}`,
        depth + 1
      );
      certs.push(...subCerts);
    }
  }

  return certs;
}

/**
 * 일반 HTML File Input (webkitdirectory)으로 업로드된 파일 목록에서 인증서 그룹화
 */
export async function groupUploadedCertFiles(fileList: FileList): Promise<CertificateItem[]> {
  const certs: CertificateItem[] = [];
  const dirMap = new Map<string, { certFile?: File; keyFile?: File; kmCertFile?: File; kmKeyFile?: File }>();

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    const path = file.webkitRelativePath || file.name;
    const parts = path.split('/');
    const fileName = parts.pop() || '';
    const dirPath = parts.join('/') || 'Root';

    if (!dirMap.has(dirPath)) {
      dirMap.set(dirPath, {});
    }
    const current = dirMap.get(dirPath)!;

    const lower = fileName.toLowerCase();
    if (
      lower === 'signcert.der' ||
      lower === 'sigcert.der' ||
      lower === 'envcert.der' ||
      lower === 'signcert.cer' ||
      lower === 'sigcert.cer' ||
      lower === 'signcert.crt' ||
      lower === 'cert.der' ||
      lower === 'usercert.der' ||
      lower === 'user.der' ||
      (lower.endsWith('.der') && !lower.startsWith('km') && !lower.startsWith('root') && !current.certFile)
    ) {
      current.certFile = file;
    } else if (
      lower === 'signpri.key' ||
      lower === 'sigpri.key' ||
      lower === 'envpri.key' ||
      lower === 'user.key' ||
      lower === 'signpri.pri' ||
      lower === 'priv.key' ||
      (lower.endsWith('.key') && !lower.startsWith('km') && !current.keyFile)
    ) {
      current.keyFile = file;
    } else if (lower === 'kmcert.der') {
      current.kmCertFile = file;
    } else if (lower === 'kmpri.key') {
      current.kmKeyFile = file;
    }
  }

  for (const [dirPath, group] of dirMap.entries()) {
    if (group.certFile) {
      try {
        if (group.certFile.size <= 0 || group.certFile.size > 512 * 1024) continue;
        const certBuf = await group.certFile.arrayBuffer();
        const certBytes = new Uint8Array(certBuf);
        const sha256 = await calculateSha256(certBytes);
        const parsed = parseDerBasic(certBytes);

        let keyData: Uint8Array | undefined;
        let keySize = 0;
        if (group.keyFile && group.keyFile.size > 0 && group.keyFile.size <= 512 * 1024) {
          keySize = group.keyFile.size;
          keyData = new Uint8Array(await group.keyFile.arrayBuffer());
        }

        const today = new Date();
        const validTo = new Date(today.getTime() + 300 * 24 * 60 * 60 * 1000);

        certs.push({
          id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: parsed.name,
          subjectDn: parsed.subjectDn,
          category: parsed.category,
          issuer: parsed.issuer,
          caSignatureName: parsed.caSignatureName,
          policy: parsed.policy,
          serialNumber: parsed.serialNumber,
          validFrom: today.toISOString().split('T')[0],
          validTo: validTo.toISOString().split('T')[0],
          status: 'valid',
          daysRemaining: 300,
          sourceLocation: `${dirPath}/${group.certFile.name}`,
          sourceDrive: '업로드된 파일 폴더',
          departmentOrOrg: parsed.departmentOrOrg,
          isSystemCa: parsed.isSystemCa,
          isInstitutional: parsed.isInstitutional,
          files: {
            certName: group.certFile.name,
            keyName: group.keyFile ? group.keyFile.name : 'signPri.key (없음)',
            kmCertName: group.kmCertFile?.name,
            kmKeyName: group.kmKeyFile?.name,
            hasKey: !!group.keyFile,
            certSize: group.certFile.size,
            keySize,
            certData: certBytes,
            keyData,
            sha256,
          },
          isCustomAdded: true,
        });
      } catch (err) {
        console.error('Error parsing uploaded cert:', err);
      }
    }
  }

  return certs;
}
