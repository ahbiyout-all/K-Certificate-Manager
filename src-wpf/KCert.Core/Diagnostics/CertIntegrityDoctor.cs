using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using System.Text.RegularExpressions;
using KCert.Core.Parser;

namespace KCert.Core.Diagnostics
{
    [Flags]
    public enum CertAnomalyFlags
    {
        None = 0,
        NestedFolderError = 1 << 0,       // GPKI\GPKI, NPKI\NPKI 등 복사 실수 중첩 폴더
        MissingPrivateKey = 1 << 1,       // 공개키(signCert.der)만 있고 개인키(signPri.key) 누락
        MissingKmPairForGpki = 1 << 2,    // 행정/교육 인증서인데 암호화키(kmCert/kmPri) 누락
        OrphanedKeyWithoutDer = 1 << 3,   // 개인키만 있고 인증서가 없음
        CorruptedAsn1Header = 1 << 4,     // ASN.1 매직 바이트(0x30) 깨짐
        ZeroByteFile = 1 << 5,            // 0바이트 빈 파일
        ExpiredCertificate = 1 << 6,      // 유효기간 만료
        NonStandardRootPath = 1 << 7,     // 현대 뱅킹/정부 모듈이 미인식하는 비표준 위치
        FileNameCaseMismatch = 1 << 8     // 대소문자 변형 파일명
    }

    /// <summary>
    /// 인증서 종합 정밀 진단 결과 리포트
    /// </summary>
    public record CertDiagnosisReport
    {
        public string InspectedPath { get; init; } = string.Empty;
        public bool IsHealthy => Anomalies == CertAnomalyFlags.None;
        public CertAnomalyFlags Anomalies { get; init; } = CertAnomalyFlags.None;
        public CertSystemType SystemType { get; init; } = CertSystemType.Unknown;
        public string CommonName { get; init; } = string.Empty;
        public string IssuerName { get; init; } = string.Empty;
        public DateTime? ValidTo { get; init; }
        public int DaysRemaining { get; init; }
        public List<string> FoundFiles { get; init; } = new();
        public List<string> DetailedIssues { get; init; } = new();
        public string RecommendedAction { get; init; } = string.Empty;
        public string CanonicalSubPath { get; init; } = string.Empty;
    }

    /// <summary>
    /// 인증서 수리 및 표준화 결과
    /// </summary>
    public record CertRepairResult
    {
        public bool IsSuccess { get; init; }
        public string SourcePath { get; init; } = string.Empty;
        public string RepairedPath { get; init; } = string.Empty;
        public int RepairedFileCount { get; init; }
        public string Message { get; init; } = string.Empty;
    }

    /// <summary>
    /// 대한민국 인증서(NPKI, GPKI, EPKI)의 중첩 폴더 오류, 키 쌍 무결성, 비표준 계층 구조를 정밀 진단하고
    /// 1클릭으로 표준 디렉터리 체계로 자동 치료·수리(Auto-Repair)하는 순수 창작 C# 진단 닥터 엔진
    /// </summary>
    public static class CertIntegrityDoctor
    {
        /// <summary>
        /// 지정된 인증서 폴더의 무결성 및 구조적 이상을 정밀 진단합니다.
        /// </summary>
        public static CertDiagnosisReport Diagnose(string folderPath)
        {
            if (string.IsNullOrWhiteSpace(folderPath) || !Directory.Exists(folderPath))
            {
                return new CertDiagnosisReport
                {
                    InspectedPath = folderPath ?? string.Empty,
                    Anomalies = CertAnomalyFlags.ZeroByteFile,
                    DetailedIssues = new() { "진단 대상 디렉터리가 존재하지 않습니다." },
                    RecommendedAction = "유효한 인증서 폴더 경로를 지정해 주세요."
                };
            }

            var issues = new List<string>();
            CertAnomalyFlags flags = CertAnomalyFlags.None;
            var foundFiles = new List<string>();

            try
            {
                var files = Directory.GetFiles(folderPath);
                foundFiles.AddRange(files.Select(Path.GetFileName).Where(f => !string.IsNullOrEmpty(f))!);

                // 1. 중첩 폴더 검사 (GPKI\GPKI, NPKI\NPKI, EPKI\EPKI 등)
                string upperPath = folderPath.Replace('/', '\\').ToUpperInvariant();
                if (upperPath.Contains(@"\GPKI\GPKI") || upperPath.Contains(@"\NPKI\NPKI") || upperPath.Contains(@"\EPKI\EPKI") ||
                    upperPath.Contains(@"\BACKUP\NPKI") || upperPath.Contains(@"\인증서\NPKI"))
                {
                    flags |= CertAnomalyFlags.NestedFolderError;
                    issues.Add("폴더 복사 실수로 인증서 계층 구조가 중첩(\"...\\GPKI\\GPKI...\")되어 정부/은행 서명 모듈에서 인식되지 않습니다.");
                }

                // 2. 파일 목록 검사
                var derFile = files.FirstOrDefault(f => Path.GetFileName(f).Equals("signCert.der", StringComparison.OrdinalIgnoreCase) ||
                                                        Path.GetFileName(f).Equals("sigCert.der", StringComparison.OrdinalIgnoreCase));
                var keyFile = files.FirstOrDefault(f => Path.GetFileName(f).Equals("signPri.key", StringComparison.OrdinalIgnoreCase) ||
                                                        Path.GetFileName(f).Equals("sigPri.key", StringComparison.OrdinalIgnoreCase));
                var kmDerFile = files.FirstOrDefault(f => Path.GetFileName(f).Equals("kmCert.der", StringComparison.OrdinalIgnoreCase));
                var kmKeyFile = files.FirstOrDefault(f => Path.GetFileName(f).Equals("kmPri.key", StringComparison.OrdinalIgnoreCase));

                if (derFile == null)
                {
                    if (keyFile != null)
                    {
                        flags |= CertAnomalyFlags.OrphanedKeyWithoutDer;
                        issues.Add("개인키(signPri.key)만 존재하고 공개키 인증서(signCert.der)가 누락되었습니다.");
                    }
                    else
                    {
                        flags |= CertAnomalyFlags.ZeroByteFile;
                        issues.Add("인증서 공개키(signCert.der) 및 개인키(signPri.key) 파일이 모두 없습니다.");
                    }
                }
                else
                {
                    // DER 파일 크기 및 ASN.1 검증
                    var fi = new FileInfo(derFile);
                    if (fi.Length == 0)
                    {
                        flags |= CertAnomalyFlags.ZeroByteFile;
                        issues.Add("인증서 파일(signCert.der) 크기가 0바이트로 손상되었습니다.");
                    }
                    else
                    {
                        var bytes = File.ReadAllBytes(derFile);
                        if (bytes.Length < 32 || bytes[0] != 0x30)
                        {
                            flags |= CertAnomalyFlags.CorruptedAsn1Header;
                            issues.Add("signCert.der 파일의 ASN.1 SEQUENCE 헤더(0x30)가 깨져 유효한 인증서가 아닙니다.");
                        }
                    }

                    if (keyFile == null)
                    {
                        flags |= CertAnomalyFlags.MissingPrivateKey;
                        issues.Add("전자서명에 필수적인 개인키(signPri.key) 파일이 누락되어 실제 인증서 서명이 불가능합니다.");
                    }
                    else
                    {
                        var keyAnalysis = KCertKeyAnalyzer.AnalyzeKeyFile(keyFile);
                        if (!keyAnalysis.IsValidAsn1)
                        {
                            flags |= CertAnomalyFlags.CorruptedAsn1Header;
                            issues.Add($"signPri.key 손상: {keyAnalysis.Description}");
                        }
                    }
                }

                // 3. 메타데이터 파싱
                KCertMetadata? meta = null;
                if (derFile != null && File.Exists(derFile))
                {
                    meta = KCertParser.Parse(folderPath);
                }

                CertSystemType sysType = meta?.Policy.SystemType ?? CertSystemType.Unknown;

                // GPKI/EPKI 암호화키 쌍 누락 검사
                if ((sysType == CertSystemType.GPKI || sysType == CertSystemType.EPKI) && (kmDerFile == null || kmKeyFile == null))
                {
                    flags |= CertAnomalyFlags.MissingKmPairForGpki;
                    issues.Add("행정/교육 인증서(GPKI/EPKI)의 전자문서 암호화용 보조키 세트(kmCert.der/kmPri.key)가 누락되었습니다.");
                }

                if (meta != null && meta.Status == CertValidityStatus.Expired)
                {
                    flags |= CertAnomalyFlags.ExpiredCertificate;
                    issues.Add($"인증서 유효기간({meta.ValidTo:yyyy-MM-dd})이 만료되어 재발급 또는 갱신이 필요합니다.");
                }

                // 4. 표준 경로 여부 검사
                if (!Discovery.CertLocationScanner.IsStandardPath(folderPath))
                {
                    flags |= CertAnomalyFlags.NonStandardRootPath;
                    issues.Add("컴퓨터 또는 USB의 비표준 위치에 보관되어 있어 공공기관/금융권 웹 브라우저 플러그인에서 인식하지 못할 수 있습니다.");
                }

                // 5. 표준 정규화 서브경로(CanonicalSubPath) 도출
                string canonicalSubPath = GenerateCanonicalSubPath(meta, folderPath, sysType);

                string recAction = "인증서 상태가 양호하며 정상 사용 가능합니다.";
                if (flags != CertAnomalyFlags.None)
                {
                    if (flags.HasFlag(CertAnomalyFlags.NestedFolderError) || flags.HasFlag(CertAnomalyFlags.NonStandardRootPath))
                    {
                        recAction = "💡 [표준 위치 자동 복구(Auto-Repair)]를 실행하여 표준 계층 구조로 즉시 정돈할 것을 권장합니다.";
                    }
                    else if (flags.HasFlag(CertAnomalyFlags.MissingPrivateKey))
                    {
                        recAction = "⚠️ 개인키(signPri.key)가 없으므로 발급기관(은행/정부)에서 인증서를 재발급하거나 USB 원본에서 다시 복사해야 합니다.";
                    }
                    else if (flags.HasFlag(CertAnomalyFlags.ExpiredCertificate))
                    {
                        recAction = "🔄 유효기간이 만료되었으므로 인증서 서비스 센터에서 갱신 또는 재발급을 진행해 주세요.";
                    }
                    else
                    {
                        recAction = "⚠️ 인증서 구성 파일 손상이 감지되었습니다. 원본 백업본에서 복구를 권장합니다.";
                    }
                }

                return new CertDiagnosisReport
                {
                    InspectedPath = folderPath,
                    Anomalies = flags,
                    SystemType = sysType,
                    CommonName = meta?.CommonName ?? Path.GetFileName(folderPath),
                    IssuerName = meta?.Issuer ?? string.Empty,
                    ValidTo = meta?.ValidTo,
                    DaysRemaining = meta?.DaysRemaining ?? 0,
                    FoundFiles = foundFiles,
                    DetailedIssues = issues,
                    RecommendedAction = recAction,
                    CanonicalSubPath = canonicalSubPath
                };
            }
            catch (Exception ex)
            {
                return new CertDiagnosisReport
                {
                    InspectedPath = folderPath,
                    Anomalies = CertAnomalyFlags.CorruptedAsn1Header,
                    DetailedIssues = new() { $"진단 중 시스템 예외: {ex.Message}" },
                    RecommendedAction = "인증서 폴더 접근 권한을 확인해 주세요."
                };
            }
        }

        /// <summary>
        /// 비표준 또는 중첩된 인증서 디렉터리를 대상 루트(예: AppData\LocalLow 또는 E:\) 하위의
        /// 완벽한 대한민국 표준 계층 구조(Canonical Hierarchy)로 치료·이동합니다.
        /// </summary>
        public static CertRepairResult RepairToStandardHierarchy(string sourceFolder, string destinationRoot)
        {
            var diag = Diagnose(sourceFolder);
            if (string.IsNullOrEmpty(diag.CanonicalSubPath))
            {
                return new CertRepairResult
                {
                    IsSuccess = false,
                    SourcePath = sourceFolder,
                    Message = "표준 정규화 대상 경로를 산출할 수 없습니다."
                };
            }

            try
            {
                string targetDir = Path.Combine(destinationRoot, diag.CanonicalSubPath);
                if (!Directory.Exists(targetDir))
                {
                    Directory.CreateDirectory(targetDir);
                }

                var files = Directory.GetFiles(sourceFolder);
                int movedCount = 0;

                foreach (var file in files)
                {
                    string fileName = Path.GetFileName(file);
                    string targetFilePath = Path.Combine(targetDir, fileName);

                    // 표준 대소문자 파일명 보정
                    if (fileName.Equals("signcert.der", StringComparison.OrdinalIgnoreCase)) fileName = "signCert.der";
                    if (fileName.Equals("signpri.key", StringComparison.OrdinalIgnoreCase)) fileName = "signPri.key";
                    if (fileName.Equals("kmcert.der", StringComparison.OrdinalIgnoreCase)) fileName = "kmCert.der";
                    if (fileName.Equals("kmpri.key", StringComparison.OrdinalIgnoreCase)) fileName = "kmPri.key";

                    targetFilePath = Path.Combine(targetDir, fileName);
                    File.Copy(file, targetFilePath, true);
                    movedCount++;
                }

                return new CertRepairResult
                {
                    IsSuccess = true,
                    SourcePath = sourceFolder,
                    RepairedPath = targetDir,
                    RepairedFileCount = movedCount,
                    Message = $"표준 계층 구조({diag.CanonicalSubPath})로 치료 및 복구 완료 ({movedCount}개 파일)"
                };
            }
            catch (Exception ex)
            {
                return new CertRepairResult
                {
                    IsSuccess = false,
                    SourcePath = sourceFolder,
                    Message = $"인증서 표준화 수리 실패: {ex.Message}"
                };
            }
        }

        private static string GenerateCanonicalSubPath(KCertMetadata? meta, string folderPath, CertSystemType sysType)
        {
            string userFolder = meta?.SubjectDn ?? Path.GetFileName(folderPath);
            if (string.IsNullOrWhiteSpace(userFolder)) userFolder = "user";

            // Subject DN 내 특수문자 정리
            string safeUserFolder = SanitizeFolderName(userFolder);

            if (sysType == CertSystemType.GPKI)
            {
                return Path.Combine("GPKI", "Certificate", "class1", safeUserFolder);
            }
            if (sysType == CertSystemType.EPKI)
            {
                return Path.Combine("EPKI", "Certificate", "class1", safeUserFolder);
            }

            // NPKI 기본
            string caFolder = "yessign";
            if (!string.IsNullOrEmpty(meta?.Issuer))
            {
                if (meta.Issuer.Contains("yessign", StringComparison.OrdinalIgnoreCase) || meta.Issuer.Contains("금융결제원")) caFolder = "yessign";
                else if (meta.Issuer.Contains("SignKorea", StringComparison.OrdinalIgnoreCase) || meta.Issuer.Contains("코스콤")) caFolder = "SignKorea";
                else if (meta.Issuer.Contains("KICA", StringComparison.OrdinalIgnoreCase) || meta.Issuer.Contains("한국정보인증")) caFolder = "KICA";
                else if (meta.Issuer.Contains("CrossCert", StringComparison.OrdinalIgnoreCase) || meta.Issuer.Contains("한국전자인증")) caFolder = "CrossCert";
                else if (meta.Issuer.Contains("TradeSign", StringComparison.OrdinalIgnoreCase) || meta.Issuer.Contains("한국무역정보통신")) caFolder = "TradeSign";
            }

            return Path.Combine("NPKI", caFolder, "USER", safeUserFolder);
        }

        private static string SanitizeFolderName(string name)
        {
            var invalidChars = Path.GetInvalidFileNameChars();
            var sanitized = new string(name.Select(c => invalidChars.Contains(c) ? '_' : c).ToArray());
            return string.IsNullOrWhiteSpace(sanitized) ? "user" : sanitized;
        }
    }
}
