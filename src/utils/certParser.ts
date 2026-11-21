import { CertificateItem, CertCategory, CertStatus, CryptoPosture } from '../types';

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
 * ASN.1 DER 바이트에서 UTCTime(0x17) 또는 GeneralizedTime(0x18) 유효기간 추출
 */
export function extractDerValidityDates(derBytes: Uint8Array): {
  validFrom: string;
  validTo: string;
  daysRemaining: number;
  status: CertStatus;
} {
  const today = new Date();
  let notBeforeDate: Date | null = null;
  let notAfterDate: Date | null = null;

  try {
    for (let i = 0; i < derBytes.length - 15; i++) {
      const tag = derBytes[i];
      // 0x17: UTCTime, 0x18: GeneralizedTime
      if (tag === 0x17 || tag === 0x18) {
        const len = derBytes[i + 1];
        if (len >= 10 && len <= 20 && i + 2 + len <= derBytes.length) {
          const timeBytes = derBytes.subarray(i + 2, i + 2 + len);
          const timeStr = String.fromCharCode(...timeBytes);
          let parsedDate: Date | null = null;

          if (tag === 0x17 && /^\d{12}Z?$/i.test(timeStr)) {
            // YYMMDDHHMMSSZ
            const yy = parseInt(timeStr.substring(0, 2), 10);
            const year = yy >= 50 ? 1900 + yy : 2000 + yy;
            const month = parseInt(timeStr.substring(2, 4), 10) - 1;
            const day = parseInt(timeStr.substring(4, 6), 10);
            const hour = parseInt(timeStr.substring(6, 8), 10);
            const min = parseInt(timeStr.substring(8, 10), 10);
            const sec = parseInt(timeStr.substring(10, 12), 10);
            parsedDate = new Date(Date.UTC(year, month, day, hour, min, sec));
          } else if (tag === 0x18 && /^\d{14}Z?$/i.test(timeStr)) {
            // YYYYMMDDHHMMSSZ
            const year = parseInt(timeStr.substring(0, 4), 10);
            const month = parseInt(timeStr.substring(4, 6), 10) - 1;
            const day = parseInt(timeStr.substring(6, 8), 10);
            const hour = parseInt(timeStr.substring(8, 10), 10);
            const min = parseInt(timeStr.substring(10, 12), 10);
            const sec = parseInt(timeStr.substring(12, 14), 10);
            parsedDate = new Date(Date.UTC(year, month, day, hour, min, sec));
          }

          if (parsedDate && !isNaN(parsedDate.getTime())) {
            if (!notBeforeDate) {
              notBeforeDate = parsedDate;
            } else if (!notAfterDate) {
              notAfterDate = parsedDate;
              break; // notBefore and notAfter pair found
            }
          }
        }
      }
    }
  } catch (e) {
    // ignore
  }

  // Fallback if not extractable
  if (!notBeforeDate) {
    notBeforeDate = today;
  }
  if (!notAfterDate) {
    notAfterDate = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000);
  }

  // 한국 인증서 유효기간은 만료일자 23:59:59까지 유효함 (UTC 파싱 날짜와 로컬 달력 일자 불일치 방지)
  const endOfDay = new Date(
    notAfterDate.getUTCFullYear(),
    notAfterDate.getUTCMonth(),
    notAfterDate.getUTCDate(),
    23,
    59,
    59,
    999
  );

  const diffMs = endOfDay.getTime() - today.getTime();
  const daysRemaining = diffMs < 0
    ? Math.floor(diffMs / (1000 * 60 * 60 * 24))
    : Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let status: CertStatus = 'valid';
  if (diffMs <= 0 || daysRemaining < 0) {
    status = 'expired';
  } else if (daysRemaining <= 30) {
    status = 'expiring';
  } else {
    status = 'valid';
  }

  const formatUtcDateStr = (d: Date): string =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

  return {
    validFrom: formatUtcDateStr(notBeforeDate),
    validTo: formatUtcDateStr(notAfterDate),
    daysRemaining,
    status,
  };
}

interface DerTlvElement {
  tag: number;
  contentStart: number;
  contentEnd: number;
  nextOffset: number;
}

function readDerTlv(bytes: Uint8Array, offset: number, limit = bytes.length): DerTlvElement | null {
  if (!bytes || offset < 0 || offset + 2 > limit) return null;
  const tag = bytes[offset];
  const lenByte = bytes[offset + 1];
  let headerLen = 2;
  let length = 0;

  if ((lenByte & 0x80) === 0) {
    length = lenByte;
  } else {
    const numOctets = lenByte & 0x7f;
    if (numOctets <= 0 || numOctets > 4 || offset + 2 + numOctets > limit) return null;
    headerLen = 2 + numOctets;
    for (let i = 0; i < numOctets; i++) {
      length = length * 256 + bytes[offset + 2 + i];
    }
  }

  const contentStart = offset + headerLen;
  const contentEnd = contentStart + length;
  if (length < 0 || contentEnd > limit) return null;

  return { tag, contentStart, contentEnd, nextOffset: contentEnd };
}

function readDerChildren(bytes: Uint8Array, start: number, end: number): DerTlvElement[] {
  const children: DerTlvElement[] = [];
  let cursor = start;
  while (cursor < end) {
    const el = readDerTlv(bytes, cursor, end);
    if (!el || el.nextOffset <= cursor) break;
    children.push(el);
    cursor = el.nextOffset;
  }
  return children;
}

function decodeDerOid(bytes: Uint8Array, start: number, end: number): string {
  if (end <= start) return '';
  const first = bytes[start];
  const firstNode = Math.min(Math.floor(first / 40), 2);
  const secondNode = first - firstNode * 40;
  const parts: number[] = [firstNode, secondNode];
  let acc = 0;
  for (let i = start + 1; i < end; i++) {
    const b = bytes[i];
    acc = acc * 128 + (b & 0x7f);
    if ((b & 0x80) === 0) {
      parts.push(acc);
      acc = 0;
    }
  }
  return parts.join('.');
}

const SIGNATURE_OID_NAMES: Record<string, string> = {
  '1.2.840.113549.1.1.4': 'md5WithRSAEncryption',
  '1.2.840.113549.1.1.5': 'sha1WithRSAEncryption',
  '1.2.840.113549.1.1.10': 'RSASSA-PSS',
  '1.2.840.113549.1.1.11': 'sha256WithRSAEncryption',
  '1.2.840.113549.1.1.12': 'sha384WithRSAEncryption',
  '1.2.840.113549.1.1.13': 'sha512WithRSAEncryption',
  '1.2.840.10045.4.1': 'ecdsa-with-SHA1',
  '1.2.840.10045.4.3.2': 'ecdsa-with-SHA256',
  '1.2.840.10045.4.3.3': 'ecdsa-with-SHA384',
  '1.2.840.10045.4.3.4': 'ecdsa-with-SHA512',
  '1.2.410.200004.1.4': 'sha1WithRSAEncryption',
  '1.2.410.200004.1.15': 'sha256WithRSAEncryption',
};

const EC_CURVE_OID_BITS: Record<string, number> = {
  '1.2.840.10045.3.1.7': 256,
  '1.3.132.0.34': 384,
  '1.3.132.0.35': 521,
  '1.3.132.0.10': 256,
};

export interface X509CryptoInfo {
  keyAlgorithm: string;
  keyBitLength: number;
  signatureAlgorithm: string;
  cryptoPosture: CryptoPosture;
}

export function classifyCryptoPosture(
  keyAlgorithm = 'RSA',
  keyBitLength = 2048,
  signatureAlgorithm = 'sha256WithRSAEncryption'
): CryptoPosture {
  const sigLower = (signatureAlgorithm || '').toLowerCase();
  const algUpper = (keyAlgorithm || 'RSA').toUpperCase();

  if (sigLower.includes('sha1') || sigLower.includes('md5')) {
    return 'legacy_weak';
  }
  if (algUpper.includes('EC') || algUpper.includes('ECDSA')) {
    if (keyBitLength > 0 && keyBitLength < 256) return 'legacy_weak';
    return 'recommended_3072';
  }
  if (keyBitLength > 0 && keyBitLength < 2048) {
    return 'legacy_weak';
  }
  if (keyBitLength >= 3072) {
    return 'recommended_3072';
  }
  return 'standard_2048_transition';
}

export function getCryptoPostureMeta(
  cert: Pick<CertificateItem, 'keyAlgorithm' | 'keyBitLength' | 'signatureAlgorithm' | 'cryptoPosture'>
): {
  posture: CryptoPosture;
  specText: string;
  badgeText: string;
  detailText: string;
  colorHex: string;
  bgHex: string;
  borderHex: string;
} {
  const keyAlgorithm = cert.keyAlgorithm || 'RSA';
  const keyBitLength = cert.keyBitLength || 2048;
  const signatureAlgorithm = cert.signatureAlgorithm || 'sha256WithRSAEncryption';
  const posture = cert.cryptoPosture || classifyCryptoPosture(keyAlgorithm, keyBitLength, signatureAlgorithm);

  const specText = `${keyAlgorithm} ${keyBitLength}-bit · ${signatureAlgorithm}`;

  if (posture === 'recommended_3072') {
    return {
      posture,
      specText,
      badgeText: `차세대 규격 충족 (${keyAlgorithm} ${keyBitLength}-bit)`,
      detailText: '2027.02 KISA 보안강도 상향 기준(RSA 3072-bit+)을 충족하는 인증서입니다.',
      colorHex: '#16A34A',
      bgHex: 'rgba(22, 163, 74, 0.14)',
      borderHex: 'rgba(22, 163, 74, 0.4)',
    };
  }
  if (posture === 'legacy_weak') {
    return {
      posture,
      specText,
      badgeText: `취약 규격 교체 권장 (${keyAlgorithm} ${keyBitLength}-bit)`,
      detailText: '1024-bit 이하 또는 SHA-1 구형 서명이 감지되었습니다. 즉시 재발급을 권장합니다.',
      colorHex: '#DC2626',
      bgHex: 'rgba(220, 38, 38, 0.14)',
      borderHex: 'rgba(220, 38, 38, 0.4)',
    };
  }
  return {
    posture,
    specText,
    badgeText: `현행 유효 (${keyAlgorithm} ${keyBitLength}-bit · 2027.02 전환 예정)`,
    detailText: '만료일까지 정상 사용 가능하며, 2027.02.15 이후 신규/갱신 시 RSA 3072-bit로 전환됩니다.',
    colorHex: '#D97706',
    bgHex: 'rgba(217, 119, 6, 0.14)',
    borderHex: 'rgba(217, 119, 6, 0.4)',
  };
}

/**
 * ASN.1 DER X.509 인증서에서 서명 알고리즘 및 공개키 비트 길이 추출
 */
export function extractX509CryptoInfo(derBytes: Uint8Array): X509CryptoInfo {
  let keyAlgorithm = 'RSA';
  let keyBitLength = 2048;
  let signatureAlgorithm = 'sha256WithRSAEncryption';

  try {
    const root = readDerTlv(derBytes, 0);
    if (root && root.tag === 0x30) {
      const certChildren = readDerChildren(derBytes, root.contentStart, root.contentEnd);
      const tbs = certChildren[0];
      const outerSigAlg = certChildren[1];

      if (outerSigAlg && outerSigAlg.tag === 0x30) {
        const sigChildren = readDerChildren(derBytes, outerSigAlg.contentStart, outerSigAlg.contentEnd);
        const oidEl = sigChildren.find((c) => c.tag === 0x06);
        if (oidEl) {
          const oid = decodeDerOid(derBytes, oidEl.contentStart, oidEl.contentEnd);
          if (SIGNATURE_OID_NAMES[oid]) {
            signatureAlgorithm = SIGNATURE_OID_NAMES[oid];
          } else if (oid) {
            signatureAlgorithm = `OID ${oid}`;
          }
        }
      }

      if (tbs && tbs.tag === 0x30) {
        const tbsChildren = readDerChildren(derBytes, tbs.contentStart, tbs.contentEnd);
        const hasVersion = tbsChildren[0]?.tag === 0xa0;
        const tbsSigIdx = hasVersion ? 2 : 1;
        const spkiIdx = hasVersion ? 6 : 5;

        // Fallback check on inner tbsCertificate.signature if outer was unknown
        const innerSig = tbsChildren[tbsSigIdx];
        if (signatureAlgorithm.startsWith('OID ') && innerSig && innerSig.tag === 0x30) {
          const innerChildren = readDerChildren(derBytes, innerSig.contentStart, innerSig.contentEnd);
          const oidEl = innerChildren.find((c) => c.tag === 0x06);
          if (oidEl) {
            const oid = decodeDerOid(derBytes, oidEl.contentStart, oidEl.contentEnd);
            if (SIGNATURE_OID_NAMES[oid]) {
              signatureAlgorithm = SIGNATURE_OID_NAMES[oid];
            }
          }
        }

        const spki = tbsChildren[spkiIdx];
        if (spki && spki.tag === 0x30) {
          const spkiChildren = readDerChildren(derBytes, spki.contentStart, spki.contentEnd);
          const algSeq = spkiChildren[0];
          const pubBitStr = spkiChildren[1];

          let algOid = '';
          let paramOid = '';
          if (algSeq && algSeq.tag === 0x30) {
            const algItems = readDerChildren(derBytes, algSeq.contentStart, algSeq.contentEnd);
            if (algItems[0]?.tag === 0x06) {
              algOid = decodeDerOid(derBytes, algItems[0].contentStart, algItems[0].contentEnd);
            }
            if (algItems[1]?.tag === 0x06) {
              paramOid = decodeDerOid(derBytes, algItems[1].contentStart, algItems[1].contentEnd);
            }
          }

          if (algOid === '1.2.840.10045.2.1') {
            keyAlgorithm = 'ECDSA';
            if (EC_CURVE_OID_BITS[paramOid]) {
              keyBitLength = EC_CURVE_OID_BITS[paramOid];
            } else if (pubBitStr && pubBitStr.tag === 0x03 && pubBitStr.contentEnd - pubBitStr.contentStart > 2) {
              const coordBytes = Math.floor((pubBitStr.contentEnd - pubBitStr.contentStart - 2) / 2);
              if (coordBytes > 0) keyBitLength = coordBytes * 8;
            }
          } else if (
            (!algOid || algOid === '1.2.840.113549.1.1.1' || algOid === '1.2.840.113549.1.1.10') &&
            pubBitStr &&
            pubBitStr.tag === 0x03 &&
            pubBitStr.contentEnd - pubBitStr.contentStart > 1
          ) {
            keyAlgorithm = 'RSA';
            const keyStart = pubBitStr.contentStart + 1; // skip unusedBits byte
            const rsaSeq = readDerTlv(derBytes, keyStart, pubBitStr.contentEnd);
            if (rsaSeq && rsaSeq.tag === 0x30) {
              const rsaItems = readDerChildren(derBytes, rsaSeq.contentStart, rsaSeq.contentEnd);
              const modEl = rsaItems[0];
              if (modEl && modEl.tag === 0x02) {
                let s = modEl.contentStart;
                while (s < modEl.contentEnd && derBytes[s] === 0x00) {
                  s++;
                }
                const byteLen = modEl.contentEnd - s;
                if (byteLen > 0) {
                  keyBitLength = (byteLen - 1) * 8 + derBytes[s].toString(2).length;
                }
              }
            }
          }
        }
      }
    }
  } catch {
    // Keep safe defaults
  }

  return {
    keyAlgorithm,
    keyBitLength,
    signatureAlgorithm,
    cryptoPosture: classifyCryptoPosture(keyAlgorithm, keyBitLength, signatureAlgorithm),
  };
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
  let caSignatureName: string | undefined = '공동인증센터 CA';
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
  } else if (upperRaw.includes('YESSIGN') || upperRaw.includes('FINANCIAL TELECOMMUNICATIONS')) {
    category = 'NPKI_BANK';
    issuer = '금융결제원 (yessign)';
    caSignatureName = '금융결제원 전자인증센터 (yessignCA Class 1)';
    policy = '은행/신용카드/보험용 (개인)';
  } else if (upperRaw.includes('SIGNKOREA') || upperRaw.includes('KOSCOM') || rawText.includes('코스콤')) {
    category = 'NPKI_BANK';
    issuer = '코스콤 (SignKorea)';
    caSignatureName = '코스콤 공인인증센터 (SignKorea CA)';
    policy = '증권거래용 (개인)';
  } else if (upperRaw.includes('KICA') || rawText.includes('한국정보인증')) {
    category = rawText.includes('법인') || upperRaw.includes('CORP') ? 'NPKI_CORP' : 'NPKI_BANK';
    issuer = '한국정보인증 (KICA)';
    caSignatureName = '한국정보인증 공인인증센터 (KICA CA)';
    policy = category === 'NPKI_CORP' ? '전자세금용 (법인)' : '범용/은행용 (개인)';
  } else if (upperRaw.includes('CROSSCERT') || rawText.includes('한국전자인증')) {
    category = 'NPKI_BANK';
    issuer = '한국전자인증 (CrossCert)';
    caSignatureName = '한국전자인증 전자인증센터 (CrossCert CA)';
    policy = '범용공동인증서 (개인)';
  } else if (upperRaw.includes('TRADESIGN') || rawText.includes('한국무역정보통신')) {
    category = rawText.includes('법인') || upperRaw.includes('CORP') ? 'NPKI_CORP' : 'NPKI_BANK';
    issuer = '한국무역정보통신 (TradeSign)';
    caSignatureName = '한국무역정보통신 무역인증센터 (TradeSign CA)';
    policy = category === 'NPKI_CORP' ? '무역 및 전자상거래용 (법인·TradeSign)' : '무역 및 전자상거래용 (TradeSign)';
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
          name = rawCn.slice(0, 30);
        }
      }
    }
  } else {
    // rawCn이 없는 경우: OU 또는 부서 정보를 기반으로 명칭 보정, 없으면 미식별 안내
    if (departmentOrOrg) {
      name = `[명칭 미지정] ${departmentOrOrg}`;
    } else {
      name = '미식별 인증서 (명칭 미지정)';
    }
    subjectDn = subjectDn || `ou=${departmentOrOrg || 'Unknown'},o=${issuer},c=kr`;
    
    // 명칭이 없고 특정 발급기관도 감지되지 않은 경우 UNKNOWN 카테고리 지정
    if (category === 'NPKI_BANK' && !upperRaw.includes('YESSIGN') && !upperRaw.includes('FINANCIAL TELECOMMUNICATIONS') && !upperRaw.includes('SIGNKOREA') && !upperRaw.includes('KOSCOM') && !rawText.includes('코스콤') && !upperRaw.includes('KICA') && !rawText.includes('한국정보인증') && !upperRaw.includes('CROSSCERT') && !rawText.includes('한국전자인증') && !upperRaw.includes('TRADESIGN') && !rawText.includes('한국무역정보통신')) {
      category = 'UNKNOWN';
      policy = '미분류 / 명칭 미지정 인증서';
      issuer = '미식별 발급기관';
      caSignatureName = undefined;
    } else {
      policy = `${policy} (명칭 미지정)`;
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

const isCandidateCertFileName = (fileName: string): boolean => {
  const lower = fileName.toLowerCase();
  if (!(lower.endsWith('.der') || lower.endsWith('.cer') || lower.endsWith('.crt'))) return false;
  if (
    lower.startsWith('root') ||
    /^ca(?:\d|[._-]|cert|$)/.test(lower) ||
    lower.startsWith('crl') ||
    lower.endsWith('.crl') ||
    lower.includes('cacert') ||
    lower.includes('rootcert')
  ) {
    return false;
  }
  return true;
};

const isCompanionEnvCertName = (lower: string): boolean =>
  lower.includes('_env.') ||
  lower.includes('_km.') ||
  lower.includes('envcert') ||
  lower.includes('kmcert') ||
  lower.includes('_env_') ||
  lower.includes('_km_') ||
  lower.startsWith('env_') ||
  lower.startsWith('km_') ||
  lower.startsWith('envcert') ||
  lower.startsWith('kmcert');

const isPrimarySignCertName = (lower: string): boolean =>
  lower === 'signcert.der' ||
  lower === 'sigcert.der' ||
  lower === 'user.der' ||
  lower === 'signcert.cer' ||
  lower === 'sigcert.cer' ||
  lower === 'signcert.crt' ||
  lower.includes('_sig.') ||
  lower.includes('_sign.') ||
  lower.startsWith('sign_') ||
  lower.startsWith('sig_');

export function filterSignCertNamesInFolder<T extends { name: string }>(certItems: T[]): T[] {
  const hasAnySignFile = certItems.some(item => isPrimarySignCertName(item.name.toLowerCase()));
  if (!hasAnySignFile) return certItems;

  return certItems.filter(item => {
    const fn = item.name.toLowerCase();
    if (!isCompanionEnvCertName(fn)) return true;

    const isGenericEnvName =
      fn.startsWith('kmcert') ||
      fn.startsWith('envcert') ||
      fn === 'km.der' ||
      fn === 'km.cer' ||
      fn === 'env.der' ||
      fn === 'env.cer';

    const sigVariant1 = fn
      .replace('_env.', '_sig.')
      .replace('_km.', '_sig.')
      .replace('_env_', '_sig_')
      .replace('_km_', '_sig_')
      .replace('env_', 'sign_')
      .replace('km_', 'sign_')
      .replace('envcert', 'signcert')
      .replace('kmcert', 'signcert');
    const sigVariant2 = fn
      .replace('_env.', '_sign.')
      .replace('_km.', '_sign.')
      .replace('_env_', '_sign_')
      .replace('_km_', '_sign_')
      .replace('env_', 'sig_')
      .replace('km_', 'sig_')
      .replace('envcert', 'sigcert')
      .replace('kmcert', 'sigcert');

    const hasMatchingSign = certItems.some(other => {
      const ofn = other.name.toLowerCase();
      if (ofn === fn) return false;
      if (ofn === sigVariant1 || ofn === sigVariant2) return true;
      if (
        isGenericEnvName &&
        (ofn === 'signcert.der' ||
          ofn === 'signcert.cer' ||
          ofn === 'sigcert.der' ||
          ofn === 'sigcert.cer' ||
          ofn === 'user.der' ||
          ofn.includes('_sig.') ||
          ofn.includes('_sign.'))
      ) {
        return true;
      }
      return false;
    });

    return !hasMatchingSign;
  });
}

export function findMatchingKeyInFolder<T extends { name: string }>(
  certFileName: string,
  keyItems: T[],
  siblingCertCount: number
): T | undefined {
  if (keyItems.length === 0) return undefined;

  const lowerCert = certFileName.toLowerCase();
  const dotIdx = certFileName.lastIndexOf('.');
  const stem = dotIdx > 0 ? certFileName.slice(0, dotIdx) : certFileName;
  const stemLower = stem.toLowerCase();
  const isKmCert =
    lowerCert.startsWith('km') ||
    lowerCert.includes('_km.') ||
    lowerCert.includes('_env.') ||
    lowerCert.startsWith('env');

  const getKeyStem = (name: string): string => {
    const idx = name.lastIndexOf('.');
    return (idx > 0 ? name.slice(0, idx) : name).toLowerCase();
  };

  // 1. 동일 파일명 스템 매칭 (예: 865기관_sig.cer -> 865기관_sig.key)
  const direct = keyItems.find(k => getKeyStem(k.name) === stemLower);
  if (direct) return direct;

  // 2. 변형 스템 매칭 (_sig -> _pri, Cert -> Pri)
  const stemCandidates: string[] = [];
  if (stemLower.endsWith('_sig')) {
    const prefix = stemLower.slice(0, -4);
    stemCandidates.push(`${prefix}_pri`, `${prefix}_signpri`, `${prefix}_sigpri`, `${prefix}_key`, prefix);
  } else if (stemLower.endsWith('_sign')) {
    const prefix = stemLower.slice(0, -5);
    stemCandidates.push(`${prefix}_pri`, `${prefix}_signpri`, `${prefix}_key`, prefix);
  } else if (stemLower.endsWith('cert')) {
    const prefix = stemLower.slice(0, -4);
    stemCandidates.push(`${prefix}pri`, `${prefix}key`, `${prefix}_pri`, prefix);
  }

  for (const cand of stemCandidates) {
    const matched = keyItems.find(k => getKeyStem(k.name) === cand);
    if (matched) return matched;
  }

  // 3. 표준 대표 개인키 패턴
  const stdPatterns = isKmCert
    ? ['kmpri.key', 'envpri.key', 'kmpri.pri']
    : ['signpri.key', 'sigpri.key', 'user.key', 'userpri.key', 'signpri.pri', 'priv.key', 'envpri.key'];

  for (const pat of stdPatterns) {
    const matched = keyItems.find(k => k.name.toLowerCase() === pat);
    if (matched) return matched;
  }

  // 4. 단일 인증서 폴더 안전 폴백 (복수 인증서 혼재 폴더에서는 타 인증서 키 오매칭 방지)
  if (!isKmCert && siblingCertCount <= 1) {
    const nonKmKeys = keyItems.filter(k => {
      const kl = k.name.toLowerCase();
      return !kl.startsWith('km') && !kl.startsWith('env') && !kl.includes('_km.') && !kl.includes('_env.');
    });
    if (nonKmKeys.length > 0) return nonKmKeys[0];
  }

  return undefined;
}

/**
 * FileSystemDirectoryHandle (Web File System Access API)로부터 인증서 계층 재귀 탐색
 * - NPKI/GPKI/EPKI 계층 구조 및 숨김 폴더(.NPKI, .certs, .backup 등) 지원
 * - GPKI/EPKI class1 폴더는 항상 탐색하되 개인키(.key) 쌍이 확인된 기관 인증서만 선별 등록
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

  const fileEntries = entries.filter(e => e.kind === 'file');
  const rawCertHandles = fileEntries.filter(e => isCandidateCertFileName(e.name));
  const keyHandles = fileEntries.filter(e => {
    const l = e.name.toLowerCase();
    return l.endsWith('.key') || l.endsWith('.pri');
  });

  const certFileHandles = filterSignCertNamesInFolder(rawCertHandles);
  const kmCertHandle = fileEntries.find(e => e.name.toLowerCase() === 'kmcert.der');
  const kmKeyHandle = fileEntries.find(e => e.name.toLowerCase() === 'kmpri.key');

  const normalizedDirPath = (currentPath || dirHandle.name || 'Root').replace(/\//g, '\\');
  const isClass1 = /(?:^|[\\/])class1(?:$|[\\/])/i.test(normalizedDirPath);
  const hasLocalFixedDrive = /^[CD]:(?:\\|$)/i.test(normalizedDirPath);
  const isUsbDrivePath =
    /^(?:USB(?::|\\|$)|[E-Z]:)/i.test(normalizedDirPath) ||
    (!hasLocalFixedDrive && /(?:^|\\)(?:USB|REMOVABLE|이동식)(?:\\|$|\s)/i.test(normalizedDirPath));

  const siblingSignCount = certFileHandles.filter(c => !isCompanionEnvCertName(c.name.toLowerCase())).length;

  for (const certFileHandle of certFileHandles) {
    try {
      const file = await certFileHandle.getFile();
      // 보안 검증: 512KB 초과 비정상 대용량 파일 메모리 로드 방지 (DoS 방어) — 해당 파일만 건너뛰고 하위 폴더 탐색은 계속 진행
      if (file.size > 0 && file.size <= 512 * 1024) {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const sha256 = await calculateSha256(bytes);
        const parsed = parseDerBasic(bytes);

        const keyFileHandle = findMatchingKeyInFolder(certFileHandle.name, keyHandles, siblingSignCount);
        const hasKey = Boolean(keyFileHandle);

        // class1 폴더는 개인키(.key)와 쌍을 이루는 실사용 기관/특수목적 인증서만 허용 (CA/Root/공개키 전용 제외)
        if (isClass1 && (!hasKey || parsed.isSystemCa)) {
          continue;
        }

        let keySize = 0;
        let keyData: Uint8Array | undefined;
        if (keyFileHandle) {
          const keyFile = await keyFileHandle.getFile();
          if (keyFile.size > 0 && keyFile.size <= 512 * 1024) {
            keySize = keyFile.size;
            keyData = new Uint8Array(await keyFile.arrayBuffer());
          }
        }

        const validity = extractDerValidityDates(bytes);
        const cryptoInfo = extractX509CryptoInfo(bytes);
        const isInstitutional = Boolean(parsed.isInstitutional) || (isClass1 && !parsed.isSystemCa && hasKey);

        certs.push({
          id: `custom-scanned-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: parsed.name,
          subjectDn: parsed.subjectDn,
          category: parsed.category,
          issuer: parsed.issuer,
          caSignatureName: parsed.caSignatureName,
          policy: parsed.policy,
          serialNumber: parsed.serialNumber,
          validFrom: validity.validFrom,
          validTo: validity.validTo,
          status: validity.status,
          daysRemaining: validity.daysRemaining,
          sourceLocation: normalizedDirPath,
          sourceDrive: isUsbDrivePath ? '이동식 USB' : '로컬 디스크',
          isRemovableMedia: isUsbDrivePath,
          departmentOrOrg: parsed.departmentOrOrg,
          isSystemCa: parsed.isSystemCa,
          isInstitutional,
          isClass1,
          keyAlgorithm: cryptoInfo.keyAlgorithm,
          keyBitLength: cryptoInfo.keyBitLength,
          signatureAlgorithm: cryptoInfo.signatureAlgorithm,
          cryptoPosture: cryptoInfo.cryptoPosture,
          files: {
            certName: certFileHandle.name,
            keyName: keyFileHandle ? keyFileHandle.name : 'signPri.key (없음)',
            kmCertName: kmCertHandle?.name,
            kmKeyName: kmKeyHandle?.name,
            hasKey,
            certSize: file.size,
            keySize,
            certData: bytes,
            keyData,
            sha256,
          },
          isCustomAdded: true,
        });
      }
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
  const dirMap = new Map<string, { certFiles: File[]; keyFiles: File[]; kmCertFile?: File; kmKeyFile?: File }>();

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    const path = file.webkitRelativePath || file.name;
    const parts = path.split('/');
    const fileName = parts.pop() || '';
    const dirPath = parts.join('/') || 'Root';

    if (!dirMap.has(dirPath)) {
      dirMap.set(dirPath, { certFiles: [], keyFiles: [] });
    }
    const current = dirMap.get(dirPath)!;

    const lower = fileName.toLowerCase();
    if (isCandidateCertFileName(fileName)) {
      current.certFiles.push(file);
    } else if (lower.endsWith('.key') || lower.endsWith('.pri')) {
      current.keyFiles.push(file);
    }
    if (lower === 'kmcert.der') {
      current.kmCertFile = file;
    } else if (lower === 'kmpri.key') {
      current.kmKeyFile = file;
    }
  }

  for (const [dirPath, group] of dirMap.entries()) {
    const normalizedDirPath = dirPath.replace(/\//g, '\\');
    const isClass1 = /(?:^|[\\/])class1(?:$|[\\/])/i.test(normalizedDirPath);
    const hasLocalFixedDrive = /^[CD]:(?:\\|$)/i.test(normalizedDirPath);
    const isUsbDrivePath =
      /^(?:USB(?::|\\|$)|[E-Z]:)/i.test(normalizedDirPath) ||
      (!hasLocalFixedDrive && /(?:^|\\)(?:USB|REMOVABLE|이동식)(?:\\|$|\s)/i.test(normalizedDirPath));

    const certFiles = filterSignCertNamesInFolder(group.certFiles);
    const siblingSignCount = certFiles.filter(c => !isCompanionEnvCertName(c.name.toLowerCase())).length;

    for (const certFile of certFiles) {
      try {
        if (certFile.size <= 0 || certFile.size > 512 * 1024) continue;
        const certBuf = await certFile.arrayBuffer();
        const certBytes = new Uint8Array(certBuf);
        const sha256 = await calculateSha256(certBytes);
        const parsed = parseDerBasic(certBytes);

        const matchedKeyFile = findMatchingKeyInFolder(certFile.name, group.keyFiles, siblingSignCount);
        const hasKey = Boolean(matchedKeyFile);

        // class1 폴더는 개인키(.key) 쌍이 있는 실사용 기관/특수목적 인증서만 허용
        if (isClass1 && (!hasKey || parsed.isSystemCa)) {
          continue;
        }

        let keyData: Uint8Array | undefined;
        let keySize = 0;
        if (matchedKeyFile && matchedKeyFile.size > 0 && matchedKeyFile.size <= 512 * 1024) {
          keySize = matchedKeyFile.size;
          keyData = new Uint8Array(await matchedKeyFile.arrayBuffer());
        }

        const validity = extractDerValidityDates(certBytes);
        const cryptoInfo = extractX509CryptoInfo(certBytes);
        const isInstitutional = Boolean(parsed.isInstitutional) || (isClass1 && !parsed.isSystemCa && hasKey);

        certs.push({
          id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: parsed.name,
          subjectDn: parsed.subjectDn,
          category: parsed.category,
          issuer: parsed.issuer,
          caSignatureName: parsed.caSignatureName,
          policy: parsed.policy,
          serialNumber: parsed.serialNumber,
          validFrom: validity.validFrom,
          validTo: validity.validTo,
          status: validity.status,
          daysRemaining: validity.daysRemaining,
          sourceLocation: normalizedDirPath,
          sourceDrive: isUsbDrivePath ? '이동식 USB' : '업로드된 파일 폴더',
          isRemovableMedia: isUsbDrivePath,
          departmentOrOrg: parsed.departmentOrOrg,
          isSystemCa: parsed.isSystemCa,
          isInstitutional,
          isClass1,
          keyAlgorithm: cryptoInfo.keyAlgorithm,
          keyBitLength: cryptoInfo.keyBitLength,
          signatureAlgorithm: cryptoInfo.signatureAlgorithm,
          cryptoPosture: cryptoInfo.cryptoPosture,
          files: {
            certName: certFile.name,
            keyName: matchedKeyFile ? matchedKeyFile.name : 'signPri.key (없음)',
            kmCertName: group.kmCertFile?.name,
            kmKeyName: group.kmKeyFile?.name,
            hasKey,
            certSize: certFile.size,
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

/**
 * 인증서 만료 여부를 판별하는 통합 검사 함수
 * status가 'expired'이거나 잔여일수(daysRemaining)가 0 이하인 경우 만료로 판정하여
 * 모달, 툴바, 사이드바, 휴지통 간 카운트 불일치를 원천 차단합니다.
 */
export function isCertificateExpired(c: CertificateItem | null | undefined): boolean {
  if (!c) return false;
  return c.status === 'expired' || (typeof c.daysRemaining === 'number' && c.daysRemaining <= 0);
}
