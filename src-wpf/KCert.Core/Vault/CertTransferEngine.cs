using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text.RegularExpressions;

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
        public long TotalBytesCopied { get; init; }
        public List<CopiedFileInfo> CopiedFiles { get; init; } = new();
    }

    public record CopiedFileInfo(string FileName, string FilePath, long FileSizeBytes);

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
            return Transfer(sourceDir, targetDriveLetter, relativeSubPath, null, null);
        }

        /// <summary>
        /// 지정된 인증서 파일(specificDerFilePath) 기준으로 단일 인증서와 매칭되는 개인키/동반 암호화키만 선별 전송합니다.
        /// 다수 인증서가 공존하는 공유 GPKI/EPKI 폴더(class1/class2)에서도 타 인증서 파일이 함께 복사되지 않도록 격리합니다.
        /// </summary>
        public static CertTransferResult Transfer(
            string sourceDir,
            string targetDriveLetter,
            string relativeSubPath,
            string? specificDerFilePath,
            string? specificKeyFilePath = null)
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

            // 보안 검증: 최종 목적지 경로가 반드시 대상 루트 디렉터리 하위에 속하는지 검증 (디렉터리 경계 포함 Path Traversal 원천 차단)
            string normalizedTargetRoot = fullTargetRoot.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar) + Path.DirectorySeparatorChar;
            if (!targetDir.StartsWith(normalizedTargetRoot, StringComparison.OrdinalIgnoreCase))
            {
                return result with { IsSuccess = false, Message = "보안 경고: 비정상적인 상위 경로 접근(Path Traversal)이 감지되어 전송을 차단했습니다." };
            }

            // 자가 복사 금지 검증: 원본 경로와 대상 경로가 동일한 디렉터리인지 확인
            string fullSourceDir = Path.GetFullPath(sourceDir).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            string fullTargetDir = Path.GetFullPath(targetDir).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            if (fullSourceDir.Equals(fullTargetDir, StringComparison.OrdinalIgnoreCase))
            {
                return result with { IsSuccess = false, Message = "자가 복사 금지: 원본 폴더와 대상 폴더 경로가 완전히 동일합니다." };
            }

            if (!Directory.Exists(sourceDir))
            {
                return result with { IsSuccess = false, Message = "원본 인증서 디렉터리가 존재하지 않습니다." };
            }

            // 선택된 인증서 파일 범위(단독 폴더는 전체 유효 파일, 다중 공존 폴더는 선택 인증서+매칭 키+동반 env/km 파일만) 선별
            var srcFiles = ResolveSourceFilesForCertificate(sourceDir, specificDerFilePath, specificKeyFilePath);

            if (srcFiles.Length == 0)
            {
                return result with { IsSuccess = false, Message = "원본 디렉터리에 복사할 유효한 인증서 파일(.der, .key 등)이 없습니다." };
            }

            string? normalizedSpecificDer = null;
            if (!string.IsNullOrWhiteSpace(specificDerFilePath))
            {
                try
                {
                    normalizedSpecificDer = Path.GetFullPath(specificDerFilePath);
                }
                catch
                {
                    normalizedSpecificDer = specificDerFilePath;
                }
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

                    bool isPrimaryDer = !string.IsNullOrEmpty(normalizedSpecificDer) &&
                                        string.Equals(Path.GetFullPath(srcFile), normalizedSpecificDer, StringComparison.OrdinalIgnoreCase);

                    if (isPrimaryDer)
                    {
                        primaryDerHash = hash;
                    }
                    else if (string.IsNullOrEmpty(primaryDerHash) &&
                             (fileName.EndsWith(".der", StringComparison.OrdinalIgnoreCase) || fileName.EndsWith(".cer", StringComparison.OrdinalIgnoreCase)))
                    {
                        primaryDerHash = hash;
                    }

                    File.Copy(srcFile, tmpFile, true);
                    tempFiles.Add((srcFile, tmpFile, dstFile, hash));
                }

                // 2. 임시 파일을 최종 목적지로 교체 이동 (읽기 전용 속성 강제 해제 적용)
                foreach (var item in tempFiles)
                {
                    if (File.Exists(item.dst))
                    {
                        try
                        {
                            var dstAttr = File.GetAttributes(item.dst);
                            if ((dstAttr & FileAttributes.ReadOnly) == FileAttributes.ReadOnly)
                            {
                                File.SetAttributes(item.dst, FileAttributes.Normal);
                            }
                        }
                        catch { }
                        File.Delete(item.dst);
                    }

                    try
                    {
                        var tmpAttr = File.GetAttributes(item.tmp);
                        if ((tmpAttr & FileAttributes.ReadOnly) == FileAttributes.ReadOnly)
                        {
                            File.SetAttributes(item.tmp, FileAttributes.Normal);
                        }
                    }
                    catch { }

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
                            try 
                            { 
                                if (File.Exists(rollback.dst)) 
                                {
                                    File.SetAttributes(rollback.dst, FileAttributes.Normal);
                                    File.Delete(rollback.dst); 
                                }
                            } 
                            catch { }
                        }
                        return result with { IsSuccess = false, Message = $"파일({Path.GetFileName(item.dst)})의 무결성 검증(SHA-256)에 실패하여 안전을 위해 전송을 취소했습니다." };
                    }
                }

                var copiedInfoList = new List<CopiedFileInfo>();
                long totalBytes = 0;
                foreach (var item in tempFiles)
                {
                    try
                    {
                        var fi = new FileInfo(item.dst);
                        long size = fi.Exists ? fi.Length : 0;
                        totalBytes += size;
                        copiedInfoList.Add(new CopiedFileInfo(Path.GetFileName(item.dst), item.dst, size));
                    }
                    catch
                    {
                        copiedInfoList.Add(new CopiedFileInfo(Path.GetFileName(item.dst), item.dst, 0));
                    }
                }

                return result with
                {
                    IsSuccess = true,
                    DerSha256 = primaryDerHash,
                    TotalBytesCopied = totalBytes,
                    CopiedFiles = copiedInfoList,
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
        /// 대상 디렉터리에 지정된 인증서 외의 다른 주 서명 인증서(.der/.cer/.crt)가 공존하는지 판별합니다.
        /// </summary>
        public static bool HasOtherSigningCertsInDirectory(string? dir, string? targetDerFilePath)
        {
            if (string.IsNullOrWhiteSpace(dir) || !Directory.Exists(dir)) return false;

            string targetFull = string.Empty;
            string targetFileName = string.Empty;
            if (!string.IsNullOrWhiteSpace(targetDerFilePath))
            {
                try { targetFull = Path.GetFullPath(targetDerFilePath); } catch { targetFull = targetDerFilePath; }
                targetFileName = Path.GetFileName(targetDerFilePath);
            }

            try
            {
                var certFiles = Directory.GetFiles(dir)
                    .Where(f =>
                    {
                        var ext = Path.GetExtension(f);
                        return ext.Equals(".der", StringComparison.OrdinalIgnoreCase) ||
                               ext.Equals(".cer", StringComparison.OrdinalIgnoreCase) ||
                               ext.Equals(".crt", StringComparison.OrdinalIgnoreCase);
                    });

                foreach (var file in certFiles)
                {
                    var fn = Path.GetFileName(file);
                    var lower = fn.ToLowerInvariant();

                    if (!string.IsNullOrEmpty(targetFull))
                    {
                        try
                        {
                            if (string.Equals(Path.GetFullPath(file), targetFull, StringComparison.OrdinalIgnoreCase))
                                continue;
                        }
                        catch { }
                    }
                    if (!string.IsNullOrEmpty(targetFileName) &&
                        string.Equals(fn, targetFileName, StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    // 시스템 CA / Root / CRL 제외
                    if (lower.StartsWith("root") ||
                        Regex.IsMatch(lower, @"^ca(?:\d|[._-]|cert|$)", RegexOptions.IgnoreCase) ||
                        lower.StartsWith("crl") ||
                        lower.Contains("cacert") ||
                        lower.Contains("rootcert"))
                    {
                        continue;
                    }

                    // 동반 암호화(km/env) 인증서 제외
                    if (IsCompanionEnvCertFileName(lower))
                    {
                        continue;
                    }

                    return true;
                }
            }
            catch
            {
                return false;
            }

            return false;
        }

        /// <summary>
        /// ArchiveAndCopy 정책 실행 시 공유 폴더(class1/class2)라면 타 인증서를 건드리지 않고
        /// 충돌하는 인증서의 파일만 백업 폴더로 이동하며, 단독 인증서 폴더는 전체 디렉터리를 이동합니다.
        /// </summary>
        public static void ArchiveTargetForCopy(string targetDir, string? specificDerFileName, string backupDir)
        {
            if (string.IsNullOrWhiteSpace(targetDir) || !Directory.Exists(targetDir)) return;

            string? candidateTargetDer = !string.IsNullOrWhiteSpace(specificDerFileName)
                ? Path.Combine(targetDir, specificDerFileName)
                : null;

            if (!string.IsNullOrEmpty(candidateTargetDer) &&
                HasOtherSigningCertsInDirectory(targetDir, candidateTargetDer))
            {
                var filesToArchive = ResolveSourceFilesForCertificate(targetDir, candidateTargetDer, null);
                if (filesToArchive.Length == 0) return;

                if (!Directory.Exists(backupDir))
                {
                    Directory.CreateDirectory(backupDir);
                }

                foreach (var file in filesToArchive)
                {
                    if (!File.Exists(file)) continue;
                    var destFile = Path.Combine(backupDir, Path.GetFileName(file));
                    try
                    {
                        var attr = File.GetAttributes(file);
                        if ((attr & FileAttributes.ReadOnly) == FileAttributes.ReadOnly)
                        {
                            File.SetAttributes(file, FileAttributes.Normal);
                        }
                    }
                    catch { }

                    if (File.Exists(destFile))
                    {
                        try
                        {
                            File.SetAttributes(destFile, FileAttributes.Normal);
                            File.Delete(destFile);
                        }
                        catch { }
                    }
                    File.Move(file, destFile);
                }
            }
            else
            {
                Directory.Move(targetDir, backupDir);
            }
        }

        /// <summary>
        /// 선택된 인증서 파일(specificDerFilePath)에 속한 파일 목록만 정밀 선별합니다.
        /// </summary>
        public static string[] ResolveSourceFilesForCertificate(
            string sourceDir,
            string? specificDerFilePath,
            string? specificKeyFilePath = null)
        {
            if (string.IsNullOrWhiteSpace(sourceDir) || !Directory.Exists(sourceDir))
            {
                return Array.Empty<string>();
            }

            var validFiles = Directory.GetFiles(sourceDir)
                .Where(f =>
                {
                    var ext = Path.GetExtension(f);
                    if (string.IsNullOrEmpty(ext) || !AllowedExtensions.Contains(ext)) return false;
                    var fi = new FileInfo(f);
                    return fi.Exists && fi.Length > 0 && fi.Length <= MaxAllowedCertFileSizeBytes;
                })
                .ToArray();

            if (validFiles.Length == 0 || string.IsNullOrWhiteSpace(specificDerFilePath))
            {
                return validFiles;
            }

            string normalizedSourceDir = Path.GetFullPath(sourceDir).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            string? matchedPrimaryDer = null;
            try
            {
                string candidateFull = Path.GetFullPath(specificDerFilePath);
                string candidateParent = (Path.GetDirectoryName(candidateFull) ?? string.Empty).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
                if (string.Equals(candidateParent, normalizedSourceDir, StringComparison.OrdinalIgnoreCase))
                {
                    matchedPrimaryDer = validFiles.FirstOrDefault(f =>
                        string.Equals(Path.GetFullPath(f), candidateFull, StringComparison.OrdinalIgnoreCase));
                }
            }
            catch { }

            if (string.IsNullOrEmpty(matchedPrimaryDer))
            {
                string targetFileName = Path.GetFileName(specificDerFilePath);
                matchedPrimaryDer = validFiles.FirstOrDefault(f =>
                    string.Equals(Path.GetFileName(f), targetFileName, StringComparison.OrdinalIgnoreCase));
            }

            if (string.IsNullOrEmpty(matchedPrimaryDer))
            {
                // 지정된 파일이 원본 폴더에 없을 때 다른 인증서 전체를 오복사하지 않도록 차단
                return Array.Empty<string>();
            }

            // 단독 인증서 폴더(예: NPKI\...\cn=홍길동 또는 단일 GPKI 폴더)인 경우 전체 구성 파일(signCert, signPri, kmCert, kmPri 등) 반환
            if (!HasOtherSigningCertsInDirectory(sourceDir, matchedPrimaryDer))
            {
                return validFiles;
            }

            // 다중 인증서 공존 폴더(예: GPKI\Certificate\class1|class2)인 경우 선택된 인증서 + 매칭 키 + 동반 env/km 파일만 엄격 선별
            var selected = new List<string> { matchedPrimaryDer };
            var selectedSet = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { Path.GetFullPath(matchedPrimaryDer) };

            void AddIfValidInDir(string? path)
            {
                if (string.IsNullOrWhiteSpace(path)) return;
                var match = validFiles.FirstOrDefault(f =>
                {
                    try
                    {
                        return string.Equals(Path.GetFullPath(f), Path.GetFullPath(path), StringComparison.OrdinalIgnoreCase);
                    }
                    catch
                    {
                        return string.Equals(f, path, StringComparison.OrdinalIgnoreCase);
                    }
                });
                if (!string.IsNullOrEmpty(match) && selectedSet.Add(Path.GetFullPath(match)))
                {
                    selected.Add(match);
                }
            }

            // 1. 매칭 서명 개인키(.key/.pri)
            if (!string.IsNullOrWhiteSpace(specificKeyFilePath))
            {
                AddIfValidInDir(specificKeyFilePath);
            }
            if (selected.Count == 1)
            {
                var matchedKey = KCert.Core.Discovery.CertLocationScanner.FindMatchingPrivateKey(matchedPrimaryDer);
                AddIfValidInDir(matchedKey);
            }

            // 2. 동일 스템/접두사를 공유하는 동반 암호화(env/km) 인증서 및 암호화 개인키 동봉
            string primaryStem = Path.GetFileNameWithoutExtension(matchedPrimaryDer);
            var companionCertStems = BuildCompanionCertStems(primaryStem);
            var companionKeyStems = BuildCompanionKeyStems(primaryStem);

            foreach (var file in validFiles)
            {
                var ext = Path.GetExtension(file);
                var stem = Path.GetFileNameWithoutExtension(file);
                if (ext.Equals(".der", StringComparison.OrdinalIgnoreCase) ||
                    ext.Equals(".cer", StringComparison.OrdinalIgnoreCase) ||
                    ext.Equals(".crt", StringComparison.OrdinalIgnoreCase))
                {
                    if (companionCertStems.Contains(stem))
                    {
                        AddIfValidInDir(file);
                        var companionKey = KCert.Core.Discovery.CertLocationScanner.FindMatchingPrivateKey(file);
                        AddIfValidInDir(companionKey);
                    }
                }
                else if (ext.Equals(".key", StringComparison.OrdinalIgnoreCase) ||
                         ext.Equals(".pri", StringComparison.OrdinalIgnoreCase))
                {
                    if (companionKeyStems.Contains(stem))
                    {
                        AddIfValidInDir(file);
                    }
                }
            }

            return selected.ToArray();
        }

        private static bool IsCompanionEnvCertFileName(string lowerFileName)
        {
            return lowerFileName.Contains("_env.") ||
                   lowerFileName.Contains("_km.") ||
                   lowerFileName.Contains("_env_") ||
                   lowerFileName.Contains("_km_") ||
                   lowerFileName.Contains("envcert") ||
                   lowerFileName.Contains("kmcert") ||
                   lowerFileName.StartsWith("env_") ||
                   lowerFileName.StartsWith("km_") ||
                   lowerFileName.Equals("km.der") ||
                   lowerFileName.Equals("km.cer") ||
                   lowerFileName.Equals("env.der") ||
                   lowerFileName.Equals("env.cer");
        }

        private static HashSet<string> BuildCompanionCertStems(string primaryStem)
        {
            var stems = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            if (string.IsNullOrWhiteSpace(primaryStem)) return stems;

            string prefix = primaryStem;
            if (primaryStem.EndsWith("_sig", StringComparison.OrdinalIgnoreCase) && primaryStem.Length > 4)
            {
                prefix = primaryStem.Substring(0, primaryStem.Length - 4);
            }
            else if (primaryStem.EndsWith("_sign", StringComparison.OrdinalIgnoreCase) && primaryStem.Length > 5)
            {
                prefix = primaryStem.Substring(0, primaryStem.Length - 5);
            }
            else if (primaryStem.StartsWith("sig_", StringComparison.OrdinalIgnoreCase) && primaryStem.Length > 4)
            {
                var suffix = primaryStem.Substring(4);
                stems.Add("env_" + suffix);
                stems.Add("km_" + suffix);
                return stems;
            }
            else if (primaryStem.StartsWith("sign_", StringComparison.OrdinalIgnoreCase) && primaryStem.Length > 5)
            {
                var suffix = primaryStem.Substring(5);
                stems.Add("env_" + suffix);
                stems.Add("km_" + suffix);
                return stems;
            }

            stems.Add(prefix + "_env");
            stems.Add(prefix + "_km");
            stems.Add(prefix + "_envcert");
            stems.Add(prefix + "_kmcert");
            stems.Add(prefix + "_enc");
            return stems;
        }

        private static HashSet<string> BuildCompanionKeyStems(string primaryStem)
        {
            var stems = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            if (string.IsNullOrWhiteSpace(primaryStem)) return stems;

            foreach (var certStem in BuildCompanionCertStems(primaryStem))
            {
                stems.Add(certStem);
                stems.Add(certStem + "_pri");
                stems.Add(certStem + "_key");
                stems.Add(certStem + "Pri");
                stems.Add(certStem + "Key");
            }

            string prefix = primaryStem;
            if (primaryStem.EndsWith("_sig", StringComparison.OrdinalIgnoreCase) && primaryStem.Length > 4)
            {
                prefix = primaryStem.Substring(0, primaryStem.Length - 4);
                stems.Add(prefix + "_kmPri");
                stems.Add(prefix + "_envPri");
            }
            else if (primaryStem.EndsWith("_sign", StringComparison.OrdinalIgnoreCase) && primaryStem.Length > 5)
            {
                prefix = primaryStem.Substring(0, primaryStem.Length - 5);
                stems.Add(prefix + "_kmPri");
                stems.Add(prefix + "_envPri");
            }

            return stems;
        }

        /// <summary>
        /// 인증서 원본 경로로부터 상대 표준 디렉터리 경로를 자동 도출합니다.
        /// 예: C:\Users\User\AppData\LocalLow\NPKI\yessign\User\홍길동 -> NPKI\yessign\User\홍길동
        /// 예: C:\GPKI\Certificate\class2\cn=홍길동 -> GPKI\Certificate\class2\cn=홍길동
        /// </summary>
        public static string ResolveRelativePath(string? fullPath)
        {
            if (string.IsNullOrEmpty(fullPath)) return string.Empty;

            string normalized = fullPath.Replace('/', '\\');

            // 1. 표준 디렉터리 토큰 검색 (\NPKI\, \GPKI\, \EPKI\, \MPKI\) - 중첩 복사(NPKI\NPKI 등) 시 최내부 표준 계층 선택
            string[] standards = { @"\NPKI\", @"\GPKI\", @"\EPKI\", @"\MPKI\" };
            foreach (var marker in standards)
            {
                int index = normalized.LastIndexOf(marker, StringComparison.OrdinalIgnoreCase);
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
            string classTier = Regex.IsMatch(upper, @"(?:^|[\\/])CLASS1(?:$|[\\/])") ? "class1" : "class2";
            if (Regex.IsMatch(upper, @"(?:^|[\\/])GPKI(?:$|[\\/])"))
            {
                return Path.Combine("GPKI", "Certificate", classTier, folderName);
            }
            if (Regex.IsMatch(upper, @"(?:^|[\\/])EPKI(?:$|[\\/])"))
            {
                return Path.Combine("EPKI", "Certificate", classTier, folderName);
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
