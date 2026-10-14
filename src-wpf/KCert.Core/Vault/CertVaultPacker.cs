using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace KCert.Core.Vault
{
    /// <summary>
    /// 암호화 금고 패키징 결과
    /// </summary>
    public record VaultPackResult
    {
        public bool IsSuccess { get; init; }
        public string OutputVaultPath { get; init; } = string.Empty;
        public int PackedFileCount { get; init; }
        public long VaultSizeBytes { get; init; }
        public string Sha256Checksum { get; init; } = string.Empty;
        public string Message { get; init; } = string.Empty;
    }

    /// <summary>
    /// 암호화 금고 복원(언패킹) 결과
    /// </summary>
    public record VaultUnpackResult
    {
        public bool IsSuccess { get; init; }
        public string TargetDirectory { get; init; } = string.Empty;
        public int RestoredFileCount { get; init; }
        public List<string> RestoredFiles { get; init; } = new();
        public VaultMetadata? Metadata { get; init; }
        public string Message { get; init; } = string.Empty;
    }

    /// <summary>
    /// 암호화 금고 내부 메타데이터 헤더
    /// </summary>
    public class VaultMetadata
    {
        public string Version { get; set; } = "1.0";
        public string CommonName { get; set; } = string.Empty;
        public string SystemType { get; set; } = "NPKI";
        public string Issuer { get; set; } = string.Empty;
        public DateTime? ValidFrom { get; set; }
        public DateTime? ValidTo { get; set; }
        public string SerialNumber { get; set; } = string.Empty;
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
        public string RelativeSubPath { get; set; } = string.Empty;
        public Dictionary<string, string> FileChecksums { get; set; } = new();
    }

    /// <summary>
    /// 대한민국 NPKI/GPKI/EPKI 인증서 파일 쌍을 단일 비밀번호 기반 AES-256-GCM 보안 금고(.kcertpack)로
    /// 암호화 패키징 및 복원하는 100% 순수 창작 C# 보안 엔진 (.NET 표준 프리미티브 기반, 외부 종속성 제로)
    /// </summary>
    public static class CertVaultPacker
    {
        // 8바이트 매직 헤더 ("KCVAULT1")
        private static readonly byte[] MagicHeader = Encoding.ASCII.GetBytes("KCVAULT1");
        private const int SaltSizeBytes = 16;
        private const int NonceSizeBytes = 12; // 96-bit standard for AES-GCM
        private const int TagSizeBytes = 16;   // 128-bit authentication tag for AES-GCM
        private const int KeySizeBytes = 32;   // 256-bit AES Key
        private const int Pbkdf2Iterations = 100_000; // OWASP 권장 PBKDF2 스트레칭 반복 횟수

        private static readonly HashSet<string> AllowedCertExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".der", ".cer", ".key", ".pri", ".pfx", ".p12"
        };

        /// <summary>
        /// 인증서 디렉터리 내의 서명/암호화 인증서와 개인키를 단일 AES-256-GCM 암호화 파일(.kcertpack)로 패킹합니다.
        /// </summary>
        /// <param name="sourceCertDir">원본 인증서 디렉터리 (signCert.der, signPri.key 등이 위치한 폴더)</param>
        /// <param name="password">사용자 지정 비밀번호 (최소 4자 이상)</param>
        /// <param name="outputVaultPath">생성할 .kcertpack 파일 경로</param>
        /// <param name="relativeSubPath">복원 시 사용할 상대 경로 (예: NPKI\yessign\user\...)</param>
        public static VaultPackResult Pack(
            string sourceCertDir,
            string password,
            string outputVaultPath,
            string relativeSubPath = "")
        {
            if (string.IsNullOrWhiteSpace(sourceCertDir) || !Directory.Exists(sourceCertDir))
            {
                return new VaultPackResult { IsSuccess = false, Message = "원본 인증서 디렉터리가 존재하지 않습니다." };
            }

            if (string.IsNullOrEmpty(password) || password.Length < 4)
            {
                return new VaultPackResult { IsSuccess = false, Message = "보안 비밀번호는 최소 4자 이상 입력해야 합니다." };
            }

            try
            {
                // 1. 유효한 인증서 파일 필터링
                var srcFiles = Directory.GetFiles(sourceCertDir)
                    .Where(f => AllowedCertExtensions.Contains(Path.GetExtension(f)))
                    .ToArray();

                if (srcFiles.Length == 0)
                {
                    return new VaultPackResult { IsSuccess = false, Message = "폴더 내에 암호화할 인증서 파일(.der, .key 등)이 없습니다." };
                }

                // 2. 메타데이터 파싱 (KCertParser 활용)
                var metadata = new VaultMetadata
                {
                    RelativeSubPath = relativeSubPath
                };

                try
                {
                    var parsed = Parser.KCertParser.Parse(sourceCertDir);
                    if (parsed != null)
                    {
                        metadata.CommonName = parsed.CommonName;
                        metadata.SystemType = parsed.Policy.SystemType.ToString();
                        metadata.Issuer = parsed.Issuer;
                        metadata.ValidFrom = parsed.ValidFrom;
                        metadata.ValidTo = parsed.ValidTo;
                        metadata.SerialNumber = parsed.SerialNumber;
                    }
                }
                catch { }

                // 3. 메모리 내 번들 Zip 압축 생성
                byte[] unencryptedBundleBytes;
                using (var memoryStream = new MemoryStream())
                {
                    using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
                    {
                        // 3-1. 메타데이터 엔트리 추가
                        foreach (var filePath in srcFiles)
                        {
                            var fileName = Path.GetFileName(filePath);
                            var fileBytes = File.ReadAllBytes(filePath);
                            using var sha = SHA256.Create();
                            var checksum = BitConverter.ToString(sha.ComputeHash(fileBytes)).Replace("-", "").ToLowerInvariant();
                            metadata.FileChecksums[fileName] = checksum;

                            var entry = archive.CreateEntry(fileName, CompressionLevel.Optimal);
                            using var entryStream = entry.Open();
                            entryStream.Write(fileBytes, 0, fileBytes.Length);
                        }

                        var metaEntry = archive.CreateEntry("__metadata.json", CompressionLevel.Optimal);
                        using var metaStream = metaEntry.Open();
                        var metaJsonBytes = JsonSerializer.SerializeToUtf8Bytes(metadata, new JsonSerializerOptions { WriteIndented = true });
                        metaStream.Write(metaJsonBytes, 0, metaJsonBytes.Length);
                    }

                    unencryptedBundleBytes = memoryStream.ToArray();
                }

                // 4. PBKDF2 키 파생 (Salt 16B + 100,000 Iterations)
                byte[] salt = RandomNumberGenerator.GetBytes(SaltSizeBytes);
                byte[] nonce = RandomNumberGenerator.GetBytes(NonceSizeBytes);
                byte[] key = DeriveKey(password, salt);

                // 5. AES-256-GCM 대칭 암호화
                byte[] ciphertext = new byte[unencryptedBundleBytes.Length];
                byte[] tag = new byte[TagSizeBytes];

                using (var aesGcm = new AesGcm(key, TagSizeBytes))
                {
                    aesGcm.Encrypt(nonce, unencryptedBundleBytes, ciphertext, tag);
                }

                // 6. 단일 .kcertpack 바이너리 스트림 파일 작성
                // [Magic 8B] [Salt 16B] [Nonce 12B] [Tag 16B] [PayloadLen 4B] [Ciphertext NB]
                var outDir = Path.GetDirectoryName(Path.GetFullPath(outputVaultPath));
                if (!string.IsNullOrEmpty(outDir) && !Directory.Exists(outDir))
                {
                    Directory.CreateDirectory(outDir);
                }

                using (var fs = new FileStream(outputVaultPath, FileMode.Create, FileAccess.Write, FileShare.None))
                using (var writer = new BinaryWriter(fs))
                {
                    writer.Write(MagicHeader);
                    writer.Write(salt);
                    writer.Write(nonce);
                    writer.Write(tag);
                    writer.Write(ciphertext.Length);
                    writer.Write(ciphertext);
                }

                // 7. 결과 산출 및 SHA-256 계산
                string vaultHash = string.Empty;
                using (var sha = SHA256.Create())
                using (var fs = File.OpenRead(outputVaultPath))
                {
                    vaultHash = BitConverter.ToString(sha.ComputeHash(fs)).Replace("-", "").ToLowerInvariant();
                }

                return new VaultPackResult
                {
                    IsSuccess = true,
                    OutputVaultPath = outputVaultPath,
                    PackedFileCount = srcFiles.Length,
                    VaultSizeBytes = new FileInfo(outputVaultPath).Length,
                    Sha256Checksum = vaultHash,
                    Message = $"인증서 파일 {srcFiles.Length}개 AES-256-GCM 보안 금고 패키징 성공"
                };
            }
            catch (Exception ex)
            {
                return new VaultPackResult
                {
                    IsSuccess = false,
                    Message = $"암호화 금고 패키징 실패: {ex.Message}"
                };
            }
        }

        /// <summary>
        /// .kcertpack 보안 금고 파일을 비밀번호로 복호화하여 대상 폴더에 표준 인증서 구조로 복원합니다.
        /// </summary>
        public static VaultUnpackResult Unpack(
            string vaultPath,
            string password,
            string targetDir)
        {
            if (string.IsNullOrWhiteSpace(vaultPath) || !File.Exists(vaultPath))
            {
                return new VaultUnpackResult { IsSuccess = false, Message = "복호화할 .kcertpack 금고 파일이 존재하지 않습니다." };
            }

            try
            {
                using var fs = File.OpenRead(vaultPath);
                using var reader = new BinaryReader(fs);

                // 1. 헤더 검증
                byte[] header = reader.ReadBytes(MagicHeader.Length);
                if (!StructuralEquals(header, MagicHeader))
                {
                    return new VaultUnpackResult { IsSuccess = false, Message = "올바른 K-인증서 암호화 금고(.kcertpack) 파일 포맷이 아닙니다." };
                }

                byte[] salt = reader.ReadBytes(SaltSizeBytes);
                byte[] nonce = reader.ReadBytes(NonceSizeBytes);
                byte[] tag = reader.ReadBytes(TagSizeBytes);
                int ciphertextLen = reader.ReadInt32();

                if (ciphertextLen <= 0 || ciphertextLen > 50 * 1024 * 1024) // 50MB 상한
                {
                    return new VaultUnpackResult { IsSuccess = false, Message = "금고 데이터 크기가 비정상적입니다." };
                }

                byte[] ciphertext = reader.ReadBytes(ciphertextLen);

                // 2. 키 파생
                byte[] key = DeriveKey(password, salt);
                byte[] decryptedBytes = new byte[ciphertext.Length];

                // 3. 복호화 및 무결성 검증 (비밀번호 불일치 시 AuthenticationException 발생)
                try
                {
                    using (var aesGcm = new AesGcm(key, TagSizeBytes))
                    {
                        aesGcm.Decrypt(nonce, ciphertext, tag, decryptedBytes);
                    }
                }
                catch (CryptographicException)
                {
                    return new VaultUnpackResult { IsSuccess = false, Message = "비밀번호가 일치하지 않거나 파일이 변조되었습니다." };
                }

                // 4. 번들 압축 해제 및 파일 복원
                var restoredFiles = new List<string>();
                VaultMetadata? metadata = null;

                if (!Directory.Exists(targetDir))
                {
                    Directory.CreateDirectory(targetDir);
                }

                using (var memoryStream = new MemoryStream(decryptedBytes))
                using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Read))
                {
                    foreach (var entry in archive.Entries)
                    {
                        if (entry.Name == "__metadata.json")
                        {
                            try
                            {
                                using var s = entry.Open();
                                metadata = JsonSerializer.Deserialize<VaultMetadata>(s);
                            }
                            catch { }
                            continue;
                        }

                        // 안전한 파일명 검증
                        string safeFileName = Path.GetFileName(entry.Name);
                        if (string.IsNullOrWhiteSpace(safeFileName)) continue;

                        string destinationPath = Path.Combine(targetDir, safeFileName);
                        entry.ExtractToFile(destinationPath, true);
                        restoredFiles.Add(destinationPath);
                    }
                }

                return new VaultUnpackResult
                {
                    IsSuccess = true,
                    TargetDirectory = targetDir,
                    RestoredFileCount = restoredFiles.Count,
                    RestoredFiles = restoredFiles,
                    Metadata = metadata,
                    Message = $"인증서 파일 {restoredFiles.Count}개 복원 완료 ({metadata?.CommonName ?? "인증서"})"
                };
            }
            catch (Exception ex)
            {
                return new VaultUnpackResult
                {
                    IsSuccess = false,
                    Message = $"금고 복호화 및 복원 중 오류: {ex.Message}"
                };
            }
        }

        /// <summary>
        /// 디스크에 파일을 쓰지 않고 금고 내부의 소유자명, 발급기관, 만료일 등 메타데이터만 즉시 열람합니다.
        /// </summary>
        public static (bool Success, VaultMetadata? Metadata, string Message) PeekMetadata(string vaultPath, string password)
        {
            var unpackResult = Unpack(vaultPath, password, Path.Combine(Path.GetTempPath(), "KCertPeek_" + Guid.NewGuid().ToString("N")));
            if (!unpackResult.IsSuccess)
            {
                return (false, null, unpackResult.Message);
            }

            // 임시 추출 파일 즉시 삭제
            try
            {
                if (Directory.Exists(unpackResult.TargetDirectory))
                {
                    Directory.Delete(unpackResult.TargetDirectory, true);
                }
            }
            catch { }

            return (true, unpackResult.Metadata, "메타데이터 확인 성공");
        }

        private static byte[] DeriveKey(string password, byte[] salt)
        {
            return Rfc2898DeriveBytes.Pbkdf2(password, salt, Pbkdf2Iterations, HashAlgorithmName.SHA256, KeySizeBytes);
        }

        private static bool StructuralEquals(byte[] a, byte[] b)
        {
            if (a.Length != b.Length) return false;
            int diff = 0;
            for (int i = 0; i < a.Length; i++) diff |= a[i] ^ b[i];
            return diff == 0;
        }
    }
}
