/**
 * 발급기관(CA) 정확한 기관명 및 공식 인증센터 명세 유틸리티
 * 대한민국 5대 공인인증기관(금융결제원, 코스콤, 한국정보인증, 한국전자인증, 한국무역정보통신) 및
 * 행정안전부(GPKI), 교육부(EPKI), 국방부(MPKI), 대법원 등 정부/공공 전자서명인증센터의
 * 정확한 공식 기관명과 식별 브랜드를 매핑하여 표시합니다.
 */

export interface AccurateIssuerInfo {
  officialOrgName: string; // 공식 정식 기관명 (예: 금융결제원, (주)코스콤, 한국정보인증(주), 행정안전부 행정전자서명인증센터 등)
  orgShort: string;        // 대표 기관명 (예: 금융결제원, 코스콤, 한국정보인증, 행정안전부(GPKI) 등)
  brandTag: string;        // 식별 브랜드/코드 (예: yessign, SignKorea, KICA, CrossCert, TradeSign, GPKI, EPKI, MPKI)
  centerName: string;      // 상세 인증센터 명칭 (예: 금융결제원 전자인증센터, (주)코스콤 증권전산인증센터 등)
  badgeClass: string;      // 시각적 뱃지 색상 클래스
  isGov: boolean;          // 정부/공공기관 여부
}

/**
 * 주어진 issuer, caSignatureName, subjectDn 문자열을 분석하여
 * 대한민국 공인 전자서명 인증기관 및 글로벌 CA의 정확한 기관명을 반환합니다.
 */
export function getAccurateIssuerInfo(
  issuer?: string,
  caSignatureName?: string,
  subjectDn?: string
): AccurateIssuerInfo {
  const rawText = `${issuer || ''} ${caSignatureName || ''} ${subjectDn || ''}`.trim();
  const lower = rawText.toLowerCase();

  // 1. 금융결제원 (yessign)
  if (
    lower.includes('yessign') ||
    lower.includes('financial telecommunications') ||
    lower.includes('금융결제원') ||
    lower.includes('금결원')
  ) {
    return {
      officialOrgName: '금융결제원 (yessign)',
      orgShort: '금융결제원',
      brandTag: 'yessign',
      centerName: '금융결제원 전자인증센터',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700',
      isGov: false,
    };
  }

  // 2. 코스콤 (SignKorea)
  if (
    lower.includes('signkorea') ||
    lower.includes('koscom') ||
    lower.includes('코스콤') ||
    lower.includes('사인코리아')
  ) {
    return {
      officialOrgName: '(주)코스콤 (SignKorea)',
      orgShort: '코스콤',
      brandTag: 'SignKorea',
      centerName: '(주)코스콤 증권전산인증센터',
      badgeClass: 'bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-700',
      isGov: false,
    };
  }

  // 3. 한국정보인증 (KICA)
  if (
    lower.includes('kica') ||
    lower.includes('signgate') ||
    lower.includes('사인게이트') ||
    lower.includes('한국정보인증') ||
    lower.includes('information certificate authority')
  ) {
    return {
      officialOrgName: '한국정보인증(주) (KICA)',
      orgShort: '한국정보인증',
      brandTag: 'KICA',
      centerName: '한국정보인증(주) 공인인증센터',
      badgeClass: 'bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-700',
      isGov: false,
    };
  }

  // 4. 한국전자인증 (CrossCert)
  if (
    lower.includes('crosscert') ||
    lower.includes('한국전자인증') ||
    lower.includes('electronic certification') ||
    lower.includes('크로스써트')
  ) {
    return {
      officialOrgName: '한국전자인증(주) (CrossCert)',
      orgShort: '한국전자인증',
      brandTag: 'CrossCert',
      centerName: '한국전자인증(주) 전자인증센터',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700',
      isGov: false,
    };
  }

  // 5. 한국무역정보통신 (TradeSign / KTNET)
  if (
    lower.includes('tradesign') ||
    lower.includes('트레이드사인') ||
    lower.includes('ktnet') ||
    lower.includes('한국무역정보통신') ||
    lower.includes('무역정보통신') ||
    lower.includes('trade network')
  ) {
    return {
      officialOrgName: '한국무역정보통신(주) (TradeSign)',
      orgShort: '한국무역정보통신',
      brandTag: 'TradeSign',
      centerName: '한국무역정보통신 무역인증센터',
      badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-300 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-700',
      isGov: false,
    };
  }

  // 6. 행정안전부 행정전자서명인증센터 (GPKI)
  if (
    lower.includes('gpki') ||
    lower.includes('government of korea') ||
    lower.includes('대한민국정부') ||
    lower.includes('행정안전부') ||
    lower.includes('행정전자서명') ||
    lower.includes('ca134') ||
    lower.includes('mois') ||
    lower.includes('1.2.410.100001')
  ) {
    let subCenter = '행정안전부 정부인증센터';
    if (lower.includes('ca134040001')) subCenter = '행정기관용 전자인증센터 (CA134040001)';
    else if (lower.includes('ca134040002')) subCenter = '공공기관용 전자인증센터 (CA134040002)';
    else if (lower.includes('ca134040003')) subCenter = '특수목적용 전자인증센터 (CA134040003)';
    else if (lower.includes('gpkiroot')) subCenter = '행정전자서명 최상위인증센터 (GPKIRootCA)';

    return {
      officialOrgName: '행정안전부 행정전자서명인증센터 (GPKI)',
      orgShort: '행정안전부(GPKI)',
      brandTag: 'GPKI',
      centerName: subCenter,
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-700',
      isGov: true,
    };
  }

  // 7. 교육부 교육행정전자서명인증센터 (EPKI)
  if (
    lower.includes('epki') ||
    lower.includes('korea education') ||
    lower.includes('교육부') ||
    lower.includes('교육학술정보원') ||
    lower.includes('keris') ||
    lower.includes('나이스') ||
    lower.includes('neis') ||
    lower.includes('에듀파인') ||
    lower.includes('ca974') ||
    lower.includes('ca973') ||
    lower.includes('1.2.410.200005')
  ) {
    let subCenter = '교육부 교육행정정보인증센터';
    if (lower.includes('ca974')) subCenter = '교육부 인증센터 (EPKI CA974)';
    else if (lower.includes('ca973')) subCenter = '한국교육학술정보원 인증센터 (KERIS CA973)';
    else if (lower.includes('epkiroot')) subCenter = '교육부 최상위인증센터 (EPKIRootCA)';

    return {
      officialOrgName: '교육부 교육행정전자서명인증센터 (EPKI)',
      orgShort: '교육부(EPKI)',
      brandTag: 'EPKI',
      centerName: subCenter,
      badgeClass: 'bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-700',
      isGov: true,
    };
  }

  // 8. 국방부 국방전자서명인증센터 (MPKI)
  if (
    lower.includes('mpki') ||
    lower.includes('국방전자서명') ||
    lower.includes('국방부') ||
    lower.includes('mnd')
  ) {
    return {
      officialOrgName: '국방부 국방전자서명인증센터 (MPKI)',
      orgShort: '국방부(MPKI)',
      brandTag: 'MPKI',
      centerName: '대한민국 국방부 인증센터',
      badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600',
      isGov: true,
    };
  }

  // 9. 사법부 대법원 전자인증센터
  if (
    lower.includes('ca128') ||
    lower.includes('대법원') ||
    lower.includes('사법부') ||
    lower.includes('court')
  ) {
    return {
      officialOrgName: '대한민국 대법원 전자인증센터',
      orgShort: '대법원(사법부)',
      brandTag: '사법부',
      centerName: '법원행정처 사법전자서명센터 (CA128)',
      badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-700',
      isGov: true,
    };
  }

  // 10. 이니텍 (Inisign)
  if (
    lower.includes('initech') ||
    lower.includes('이니텍') ||
    lower.includes('inisign')
  ) {
    return {
      officialOrgName: '이니텍(주) (Inisign)',
      orgShort: '이니텍',
      brandTag: 'Inisign',
      centerName: '이니텍(주) 전자인증서비스',
      badgeClass: 'bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
      isGov: false,
    };
  }

  // 11. 글로벌 공인 SSL/TLS CA (Let's Encrypt, DigiCert, Sectigo 등)
  if (lower.includes("let's encrypt") || lower.includes('isrg')) {
    return {
      officialOrgName: "Let's Encrypt (ISRG)",
      orgShort: "Let's Encrypt",
      brandTag: 'ISRG',
      centerName: 'Internet Security Research Group',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300',
      isGov: false,
    };
  }

  if (lower.includes('digicert')) {
    return {
      officialOrgName: 'DigiCert Inc.',
      orgShort: 'DigiCert',
      brandTag: 'DigiCert',
      centerName: 'DigiCert Global Root CA',
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300',
      isGov: false,
    };
  }

  if (lower.includes('sectigo') || lower.includes('comodo')) {
    return {
      officialOrgName: 'Sectigo Limited (구 Comodo)',
      orgShort: 'Sectigo',
      brandTag: 'Sectigo',
      centerName: 'Sectigo Certificate Authority',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300',
      isGov: false,
    };
  }

  // 12. 알 수 없거나 DN 문자열 형태인 경우 정제
  let cleanIssuer = issuer || '공동인증기관';
  if (cleanIssuer.includes('=')) {
    const cnMatch = cleanIssuer.match(/cn=([^,]+)/i);
    const oMatch = cleanIssuer.match(/o=([^,]+)/i);
    cleanIssuer = (cnMatch && cnMatch[1]) || (oMatch && oMatch[1]) || cleanIssuer;
  }

  return {
    officialOrgName: cleanIssuer,
    orgShort: cleanIssuer.length > 12 ? cleanIssuer.substring(0, 12) + '...' : cleanIssuer,
    brandTag: '인증기관',
    centerName: caSignatureName || cleanIssuer,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
    isGov: false,
  };
}
