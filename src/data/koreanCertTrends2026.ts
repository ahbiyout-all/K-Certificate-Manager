export type EcosystemCategory = 'file_pki' | 'cloud_mobile';

export interface CertEcosystemComparisonItem {
  id: string;
  name: string;
  shortName: string;
  category: EcosystemCategory;
  categoryLabel: string;
  operators: string;
  storageMethod: string;
  validityPeriod: string;
  authMethod: string;
  trend2026Note: string;
  statusTag: string;
}

export interface PolicyTimelineMilestone {
  date: string;
  badge: string;
  title: string;
  summary: string;
  actionTip: string;
}

export interface MobileIdTypeInfo {
  name: string;
  legalBasis: string;
  note: string;
}

export const RSA_3072_TIMELINE: PolicyTimelineMilestone[] = [
  {
    date: '2025.09',
    badge: '국가 로드맵',
    title: '범국가 양자내성암호(PQC) 전환 추진계획 확정',
    summary: 'RSA 2048-bit 단일 체계에서 벗어나 1단계 암호강도 상향(RSA 3072-bit)과 2단계 양자내성암호(PQC) 전환을 단계적으로 추진합니다.',
    actionTip: '신규·갱신 모듈 점검 및 장기 보안 계획 반영',
  },
  {
    date: '2026.04.27',
    badge: 'KISA 공지',
    title: '공동인증서 보안강도 상향(RSA 3072-bit) 사전 안내',
    summary: '한국인터넷진흥원(KISA)이 이용기관과 인증사업자에 3072-bit 전환에 대비한 시스템 호환성 검증 및 배포 일정을 공식 안내했습니다.',
    actionTip: '보유 중인 2048-bit 인증서는 만료일까지 계속 정상 사용 가능',
  },
  {
    date: '2027.02.15',
    badge: '적용 시행',
    title: '5대 공동인증기관 RSA 3072-bit 신규 발급 전환',
    summary: '금융결제원·코스콤·한국정보인증·한국전자인증·한국무역정보통신의 신규 가입자 공동인증서가 RSA 3072-bit로 발급 전환됩니다.',
    actionTip: '1024-bit 또는 SHA-1 구형 인증서는 즉시 재발급 권장',
  },
];

export const MOBILE_ID_DECREE_2026 = {
  effectiveDate: '2026.08.28',
  lawTitle: '「전자정부법 시행령」 개정안 시행',
  summary:
    '모바일 신분증이 실물과 동일한 법적 효력을 갖추며 전자서명 기능이 통합 결합되었습니다. 발급·이용 시 1인 1단말기 원칙, 엄격한 본인확인, 유효기간 3년 이내 제한이 적용됩니다.',
  securityRules: [
    '1인 1단말기 원칙 적용 (분실 시 즉시 원격 효력 정지 필요)',
    '발급·재발급 시 대면/비대면 엄격한 본인확인 절차 적용',
    '유효기간 최대 3년 이내 관리 및 행안부 모바일신분증 공통기반 연계',
    '신분증명(KYC)과 전자서명(Digital Signature) 단일 앱 동시 처리',
  ],
  types: [
    { name: '모바일 주민등록증', legalBasis: '주민등록법 제24조', note: '전 국민 실물 신분증 대체 및 온라인 전자서명' },
    { name: '모바일 운전면허증', legalBasis: '도로교통법', note: '금융·렌터카·관공서 실명확인 및 간편서명' },
    { name: '모바일 국가보훈등록증', legalBasis: '국가보훈 기본법', note: '국가유공자 자격 증명 및 우대 확인' },
    { name: '모바일 장애인등록증', legalBasis: '장애인복지법', note: '복지 혜택 확인 및 비대면 본인확인' },
    { name: '모바일 외국인등록증', legalBasis: '출입국관리법', note: '체류 외국인 금융·행정 본인확인' },
    { name: '모바일 영주증', legalBasis: '출입국관리법', note: '영주권자 신분 증명 및 전자민원' },
    { name: '모바일 외국국적동포 국내거소신고증', legalBasis: '재외동포법', note: '재외동포 금융·관공서 신원 확인' },
    { name: '모바일 공무원증', legalBasis: '국가공무원 복무규칙', note: '청사 출입 및 공직자 행정시스템(GPKI 연계) 인증' },
  ] as MobileIdTypeInfo[],
};

export const GPKI_EPKI_MODERNIZATION_NOTES = [
  {
    id: 'gpki-nonactivex',
    title: 'GPKI · EPKI 비액티브엑스(Non-ActiveX) 웹 표준 전환',
    detail:
      '행정전자서명(GPKI)과 교육행정전자서명(EPKI)은 구형 ActiveX·플러그인 의존을 없애고 Chrome·Edge 등 HTML5 브라우저 표준 인증 및 보안 토큰 방식으로 전환되었습니다.',
    checklist: '로컬 PC 저장 경로(C:\\GPKI\\Certificate\\class1·class2, AppData\\LocalLow\\EPKI)는 기존 업무망(온-나라·새올·NEIS) 호환을 위해 유지해야 합니다.',
  },
  {
    id: 'gpki-cloud-mobile',
    title: '모바일 공무원증 및 공공 클라우드(SaaS) 인증 연계',
    detail:
      '모바일 공무원증을 활용한 공직자 통합로그인과 클라우드 기반 공공 업무환경 연계가 확대되고 있으며, USB 보관 파일형 인증서와 병행 운영됩니다.',
    checklist: '기관용 특수목적(class1) 인증서는 개인키(SignPri.key) 유출 방지를 위해 반드시 잠금 가능한 보안 USB 백업을 병행하세요.',
  },
];

export const KOREA_CERT_ECOSYSTEM_MATRIX: CertEcosystemComparisonItem[] = [
  {
    id: 'npki',
    name: '공동인증서 (구 공인인증서 · NPKI)',
    shortName: '공동인증서 (NPKI)',
    category: 'file_pki',
    categoryLabel: '파일형 PKI',
    operators: '5대 기관 (금융결제원·코스콤·KICA·CrossCert·TradeSign)',
    storageMethod: 'PC(AppData\\LocalLow\\NPKI) · USB (signCert.der / signPri.key)',
    validityPeriod: '1년 (특수용도 3년)',
    authMethod: '암호(영문·숫자·특수문자)',
    trend2026Note: '2027.02.15부터 신규 가입자 인증서 RSA 3072-bit 발급 전환',
    statusTag: 'RSA 3072 전환',
  },
  {
    id: 'gpki',
    name: '행정전자서명 (GPKI)',
    shortName: 'GPKI (공무원)',
    category: 'file_pki',
    categoryLabel: '파일형 PKI',
    operators: '행정안전부 행정전자서명인증센터',
    storageMethod: 'PC(C:\\GPKI\\Certificate\\{class1,class2}) · 보안 USB',
    validityPeriod: '개인 2년 / 기관 2~3년',
    authMethod: '암호 + 2차 인증',
    trend2026Note: 'Non-ActiveX(HTML5) 전환 및 모바일 공무원증 병행 연계',
    statusTag: '비액티브엑스',
  },
  {
    id: 'epki',
    name: '교육행정전자서명 (EPKI)',
    shortName: 'EPKI (교직원)',
    category: 'file_pki',
    categoryLabel: '파일형 PKI',
    operators: '교육부 · 한국교육학술정보원(KERIS)',
    storageMethod: 'PC(AppData\\LocalLow\\EPKI) · USB',
    validityPeriod: '2년',
    authMethod: '암호 + 나이스 연계',
    trend2026Note: '나이스(NEIS)·K-에듀파인 브라우저 표준 인증 및 class1 관인 관리',
    statusTag: 'HTML5 전환',
  },
  {
    id: 'mpki',
    name: '국방전자서명 (MPKI)',
    shortName: 'MPKI (국방)',
    category: 'file_pki',
    categoryLabel: '파일형 PKI',
    operators: '대한민국 국방부',
    storageMethod: '지정 저장매체 · MPKI 보안 토큰',
    validityPeriod: '국방 규정에 따름',
    authMethod: '군 내부 인증 체계',
    trend2026Note: '국방 행정·조달·보안 결재 전용 체계 유지',
    statusTag: '특수목적',
  },
  {
    id: 'yeskey',
    name: '금융인증서 (YesKey)',
    shortName: '금융인증서 (YesKey)',
    category: 'cloud_mobile',
    categoryLabel: '클라우드·모바일',
    operators: '금융결제원 · 국내 주요 은행',
    storageMethod: '금융결제원 안전 클라우드 (파일 복사 불필요)',
    validityPeriod: '3년 (자동 연장 가능)',
    authMethod: '6자리 PIN · 패턴 · 생체인증',
    trend2026Note: '별도 프로그램·USB 이동 없이 은행/정부24/홈택스 즉시 이용',
    statusTag: '클라우드 3년',
  },
  {
    id: 'private-simple',
    name: '민간 간편인증 (전자서명인증사업자)',
    shortName: '민간 간편인증',
    category: 'cloud_mobile',
    categoryLabel: '클라우드·모바일',
    operators: '네이버·카카오·토스·PASS·신한·KB·하나·우리·NH·IBK·뱅크샐러드 등',
    storageMethod: '스마트폰 앱 보안영역 (TEE · 로컬 파일 미생성)',
    validityPeriod: '사업자별 1~3년',
    authMethod: 'PIN · 생체(지문/FaceID)',
    trend2026Note: '전자서명법상 KISA 인정 사업자로 공공·금융 로그인 및 서명 확대',
    statusTag: '간편 대체수단',
  },
  {
    id: 'mobile-id',
    name: '모바일 신분증 (전자서명 통합)',
    shortName: '모바일 신분증 8종',
    category: 'cloud_mobile',
    categoryLabel: '클라우드·모바일',
    operators: '행정안전부 (모바일신분증 공통기반)',
    storageMethod: '본인 스마트폰 보안영역 (1인 1단말기 원칙)',
    validityPeriod: '최대 3년 이내',
    authMethod: '생체인증 · 앱 PIN',
    trend2026Note: '2026.08.28 전자정부법 시행령 시행 · 8종 신분증 통합 및 전자서명 탑재',
    statusTag: '2026.08 법령',
  },
];

export const RENEWAL_ALTERNATIVE_TIPS = [
  {
    title: '개인 은행·연말정산·민원 위주라면 금융인증서(3년) 또는 민간 간편인증 병행',
    desc: '공동인증서(NPKI) 갱신 시 파일 이동·복사가 번거롭다면, 주거래 은행에서 3년 유효 클라우드 금융인증서(YesKey)를 발급받거나 네이버·카카오·토스·PASS 간편인증을 함께 쓰면 USB 없이도 대부분의 은행·공공 서비스를 이용할 수 있습니다.',
  },
  {
    title: '2027.02.15 이후 공동인증서 발급·갱신 시 RSA 3072-bit 자동 적용 안내',
    desc: '현재 사용 중인 2048-bit 인증서는 만료일까지 문제없이 동작합니다. 2027년 2월 15일 이후 갱신하거나 재발급할 때 강화된 RSA 3072-bit 규격이 순차 적용되며, 구형 1024-bit·SHA-1 인증서는 즉시 재발급을 권장합니다.',
  },
];
