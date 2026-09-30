using System;

namespace KCert.Core.Parser
{
    /// <summary>
    /// K-인증서 통합 상세 메타데이터 모델
    /// </summary>
    public class KCertMetadata
    {
        // -------------------------------------------------------------
        // 파일시스템 위치 정보
        // -------------------------------------------------------------
        /// <summary>인증서 폴더 전체 경로 (예: C:\Users\홍길동\AppData\LocalLow\NPKI\yessign\USER\cn=홍길동...)</summary>
        public string DirectoryPath { get; set; } = string.Empty;

        /// <summary>signCert.der 전체 경로</summary>
        public string DerFilePath { get; set; } = string.Empty;

        /// <summary>signPri.key 전체 경로</summary>
        public string KeyFilePath { get; set; } = string.Empty;

        /// <summary>저장 드라이브 루트 (예: C:\, E:\)</summary>
        public string DriveRoot { get; set; } = string.Empty;

        /// <summary>이동식 미디어(USB)에 저장되어 있는지 여부</summary>
        public bool IsOnRemovableMedia { get; set; }

        // -------------------------------------------------------------
        // X.509 주체 및 발급자 식별 정보
        // -------------------------------------------------------------
        /// <summary>소유자 실명 또는 법인명 (CN)</summary>
        public string CommonName { get; set; } = string.Empty;

        /// <summary>소속 조직 (O)</summary>
        public string Organization { get; set; } = string.Empty;

        /// <summary>부서 또는 하위 조직 (OU)</summary>
        public string OrganizationalUnit { get; set; } = string.Empty;

        /// <summary>전체 주체 DN (Subject)</summary>
        public string SubjectDn { get; set; } = string.Empty;

        /// <summary>발급 기관명 (CA)</summary>
        public string Issuer { get; set; } = string.Empty;

        /// <summary>기관 서명 이름 (CA Signature Name, 예: 행정전자서명 행정기관용 인증센터 CA134040001, 금융결제원 yessignCA)</summary>
        public string CaSignatureName { get; set; } = string.Empty;

        /// <summary>인증서 일련번호 (Hex)</summary>
        public string SerialNumber { get; set; } = string.Empty;

        /// <summary>서명 알고리즘 (예: sha256RSA)</summary>
        public string SignatureAlgorithm { get; set; } = "sha256RSA";

        // -------------------------------------------------------------
        // 정책 OID 및 용도 정보
        // -------------------------------------------------------------
        /// <summary>해석된 한국형 정책 OID 정보</summary>
        public CertPolicyInfo Policy { get; set; } = new();

        /// <summary>인증서 체계 분류 (NPKI, GPKI, EPKI)</summary>
        public CertSystemType SystemType => Policy.SystemType;

        /// <summary>사용자 친화적 용도 명칭</summary>
        public string DisplayUsage => Policy.UsageDescription;

        // -------------------------------------------------------------
        // 유효기간 및 상태
        // -------------------------------------------------------------
        /// <summary>유효기간 시작일</summary>
        public DateTime ValidFrom { get; set; }

        /// <summary>유효기간 만료일</summary>
        public DateTime ValidTo { get; set; }

        /// <summary>만료일까지 남은 일수 (음수면 만료됨)</summary>
        public int DaysRemaining { get; set; }

        /// <summary>유효 상태 (정상, 만료임박, 만료)</summary>
        public CertValidityStatus Status { get; set; } = CertValidityStatus.Valid;

        // -------------------------------------------------------------
        // 무결성 및 개인키 페어 여부
        // -------------------------------------------------------------
        /// <summary>개인키(signPri.key) 존재 여부</summary>
        public bool HasPrivateKey => !string.IsNullOrEmpty(KeyFilePath);

        /// <summary>개인키 페어 무결성 검증 통과 여부</summary>
        public bool IsPairIntegrityValid { get; set; }

        /// <summary>무결성 상태 메시지</summary>
        public string IntegrityMessage { get; set; } = string.Empty;

        /// <summary>signCert.der SHA256 해시</summary>
        public string DerSha256 { get; set; } = string.Empty;

        /// <summary>signCert.der 크기 (바이트)</summary>
        public long DerFileSize { get; set; }

        /// <summary>signPri.key 크기 (바이트)</summary>
        public long KeyFileSize { get; set; }

        /// <summary>루트/중계 CA 또는 시스템 체인 공용 인증서 여부 (개인 사용자 인증서가 아닌 시스템 인증서)</summary>
        public bool IsSystemCa { get; set; }

        /// <summary>기관용 공용 인증서 (행정기관/공공기관/지자체/전자관인/특수목적용) 여부</summary>
        public bool IsInstitutional { get; set; }

        /// <summary>정제된 사용자 친화적 서명/소유자 표기명</summary>
        public string CleanDisplayName { get; set; } = string.Empty;

        /// <summary>사용자 관리 대상 인증서 여부</summary>
        public bool IsUserCert => !IsSystemCa;
    }
}
