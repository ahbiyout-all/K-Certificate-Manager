using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;

namespace KCert.Core.Vault
{
    /// <summary>
    /// 인증서 파일 전송 결과 모델
    /// </summary>
    public record CertTransferResult
    {
        public bool IsSuccess { get; init; }
        public string SourceDirectory { get; init; } = string.Empty;
        public string DestinationDirectory { get; init; } = string.Empty;
        public string DerSha256 { get; init; } = string.Empty;
        public string Message { get; init; } = string.Empty;
    }

    /// <summary>
    /// 표준 폴더 구조를 보존하며 원자적 파일 복사 및 SHA-256 무결성 검증을 수행하는 전송 엔진
    /// </summary>
    public static class CertTransferEngine
    {
        // 허용된 인증서 및 개인키 확장자 화이트리스트 (악성 실행파일 .exe, .bat, .dll 등 동반 복사 원천 차단)
        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".der", ".cer", ".crt", ".key", ".pri", ".pfx", ".p12", ".pem"
        };

        // 단일 인증서 파일 최대 허용 크기 (5 MB - 대용량 더미/DoS 파일 복사 방지)
        private const long MaxAllowedCertFileSizeBytes = 5 * 1024 * 1024;

        /// <summary>
        /// 원본 인증서 디렉터리를 대상 드라이브에 표준 구조를 유지하며 안전하게 전송합니다.
        /// (NPKI, GPKI, EPKI 파일 및 GPKI 전용 암호화키 kmCert/kmPri 완벽 동봉 복사)
        /// </summary>
        public static CertTransferResult Transfer(string sourceDir, string targetDriveLetter, string relativeSubPath)
        {
            // 드라이브 문자(예: "E:")에 백슬래시가 없는 경우 보정
            string targetRoot = targetDriveLetter;
            if (targetRoot.Length == 2 && targetRoot[1] == ':')
            {
                targetRoot += "\\";
            }

            // 상대 경로 내 경로 조작(Path Traversal: ..) 토큰 정화
            string safeRelativeSubPath = SanitizeRelativeSubPath(relativeSubPath);
            string fullTargetRoot = Path.GetFullPath(targetRoot);
            string targetDir = Path.GetFullPath(Path.Combine(fullTargetRoot, safeRelativeSubPath));

            var result = new CertTransferResult
            {
                SourceDirectory = sourceDir,
                DestinationDirectory = targetDir
            };

            // 보안 검증: 최종 목적지 경로가 반드시 대상 루트 디렉터리 하위에 속하는지 검증 (Path Traversal 원천 차단)
            if (!targetDir.StartsWith(fullTargetRoot, StringComparison.OrdinalIgnoreCase))
            {
                return result with { IsSuccess = false, Message = "보안 경고: 비정상적인 상위 경로 접근(Path Traversal)이 감지되어 전송을 차단했습니다." };
            }

            if (!Directory.Exists(sourceDir))
            {
                return result with { IsSuccess = false, Message = "원본 인증서 디렉터리가 존재하지 않습니다." };
            }

            // 화이트리스트 확장자 및 크기 제한을 통과한 안전한 인증서/키 파일만 필터링
            var srcFiles = Directory.GetFiles(sourceDir)
                .Where(f =>
                {
                    var ext = Path.GetExtension(f);
                    if (string.IsNullOrEmpty(ext) || !AllowedExtensions.Contains(ext)) return false;
                    var fi = new FileInfo(f);
                    return fi.Exists && fi.Length > 0 && fi.Length <= MaxAllowedCertFileSizeBytes;
                })
                .ToArray();

            if (srcFiles.Length == 0)
            {
                return result with { IsSuccess = false, Message = "원본 디렉터리에 복사할 유효한 인증서 파일(.der, .key 등)이 없습니다." };
            }

            var tempFiles = new List<(string src, string tmp, string dst, string srcHash)>();

            try
            {
                if (!Directory.Exists(targetDir))
                {
                    Directory.CreateDirectory(targetDir);
                }

                string primaryDerHash = string.Empty;

                // 1. 모든 인증서 구성 파일 원자적 임시 복사 및 원본 해시 산출
                foreach (var srcFile in srcFiles)
                {
                    var fileName = Path.GetFileName(srcFile);
                    var dstFile = Path.Combine(targetDir, fileName);
                    var tmpFile = dstFile + ".tmp";
                    var hash = ComputeSha256(srcFile);

                    if (string.IsNullOrEmpty(primaryDerHash) && (fileName.EndsWith(".der", StringComparison.OrdinalIgnoreCase) || fileName.EndsWith(".cer", StringComparison.OrdinalIgnoreCase)))
                    {
                        primaryDerHash = hash;
                    }

                    File.Copy(srcFile, tmpFile, true);
                    tempFiles.Add((srcFile, tmpFile, dstFile, hash));
                }

                // 2. 임시 파일을 최종 목적지로 교체 이동
                foreach (var item in tempFiles)
                {
                    if (File.Exists(item.dst)) File.Delete(item.dst);
                    File.Move(item.tmp, item.dst);
                }

                // 3. 복사된 대상 파일들에 대한 전수 무결성 해시 검증
                foreach (var item in tempFiles)
                {
                    var dstHash = ComputeSha256(item.dst);
                    if (!string.Equals(item.srcHash, dstHash, StringComparison.OrdinalIgnoreCase))
                    {
                        // 롤백 (복사 취소)
                        foreach (var rollback in tempFiles)
                        {
                            try { if (File.Exists(rollback.dst)) File.Delete(rollback.dst); } catch { }
                        }
                        return result with { IsSuccess = false, Message = $"파일({Path.GetFileName(item.dst)})의 무결성 검증(SHA-256)에 실패하여 안전을 위해 전송을 취소했습니다." };
                    }
                }

                return result with
                {
                    IsSuccess = true,
                    DerSha256 = primaryDerHash,
                    Message = $"인증서 파일 {tempFiles.Count}개 안전 전송 및 SHA-256 무결성 검증 완료"
                };
            }
            catch (Exception ex)
            {
                // 임시 파일 청소
                foreach (var item in tempFiles)
                {
                    try { if (File.Exists(item.tmp)) File.Delete(item.tmp); } catch { }
                }

                var userError = KCert.Core.Common.UserFriendlyError.Explain(ex, "인증서 복사 전송");
                return result with { IsSuccess = false, Message = $"{userError.Summary} ({userError.ActionTip.Replace("\n", " ")})" };
            }
        }

        /// <summary>
        /// 인증서 원본 경로로부터 상대 표준 디렉터리 경로를 자동 도출합니다.
        /// 예: C:\Users\User\AppData\LocalLow\NPKI\yessign\User\홍길동 -> NPKI\yessign\User\홍길동
        /// 예: C:\GPKI\Certificate\class2\cn=홍길동 -> GPKI\Certificate\class2\cn=홍길동
        /// </summary>
        public static string ResolveRelativePath(string fullPath)
        {
            if (string.IsNullOrEmpty(fullPath)) return string.Empty;

            string normalized = fullPath.Replace('/', '\\');

            // 1. 표준 디렉터리 토큰 검색 (\NPKI\, \GPKI\, \EPKI\, \MPKI\)
            string[] standards = { @"\NPKI\", @"\GPKI\", @"\EPKI\", @"\MPKI\" };
            foreach (var marker in standards)
            {
                int index = normalized.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
                if (index >= 0)
                {
                    return normalized.Substring(index + 1);
                }
            }

            // 2. 경로가 NPKI\, GPKI\, EPKI\, MPKI\로 바로 시작하는 경우
            string[] directPrefixes = { "NPKI\\", "GPKI\\", "EPKI\\", "MPKI\\" };
            foreach (var prefix in directPrefixes)
            {
                if (normalized.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                {
                    return normalized;
                }
            }

            // 3. 마커가 없는 경우 (예: 임의 백업 폴더) 체계 감지 후 표준 경로 배치
            var folderName = Path.GetFileName(fullPath.TrimEnd('\\', '/'));
            var upper = fullPath.ToUpperInvariant();
            if (upper.Contains("GPKI"))
            {
                return Path.Combine("GPKI", "Certificate", "class2", folderName);
            }
            if (upper.Contains("EPKI"))
            {
                return Path.Combine("EPKI", "Certificate", "class1", folderName);
            }

            return Path.Combine("NPKI", "yessign", "User", folderName);
        }

        /// <summary>
        /// 상대 경로 내 상위 디렉터리 이동(..) 및 불법 문자를 제거하여 Path Traversal 취약점을 차단합니다.
        /// </summary>
        private static string SanitizeRelativeSubPath(string relativeSubPath)
        {
            if (string.IsNullOrWhiteSpace(relativeSubPath)) return "NPKI";

            var invalidChars = Path.GetInvalidFileNameChars();
            var segments = relativeSubPath
                .Replace('/', '\\')
                .Split('\\', StringSplitOptions.RemoveEmptyEntries);

            var safeSegments = new List<string>();
            foreach (var seg in segments)
            {
                string trimmed = seg.Trim();
                if (trimmed == "." || trimmed == ".." || trimmed.Contains(':')) continue;

                var cleaned = new string(trimmed.Where(ch => !invalidChars.Contains(ch)).ToArray());
                if (!string.IsNullOrWhiteSpace(cleaned) && cleaned != "." && cleaned != "..")
                {
                    safeSegments.Add(cleaned);
                }
            }

            return safeSegments.Count > 0 ? Path.Combine(safeSegments.ToArray()) : "NPKI";
        }

        private static string ComputeSha256(string filePath)
        {
            using var sha = SHA256.Create();
            using var fs = File.OpenRead(filePath);
            return BitConverter.ToString(sha.ComputeHash(fs)).Replace("-", "").ToLowerInvariant();
        }
    }
}
