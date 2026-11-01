using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using KCert.Crypto.Ciphers;

namespace KCert.Crypto.Engine
{
    /// <summary>
    /// 개인키 복호화 및 RSA 인스턴스 복원 결과
    /// </summary>
    public class PrivateKeyDecryptionResult : IDisposable
    {
        public bool IsSuccess { get; set; }
        public RSA? RsaInstance { get; set; }
        public int KeySizeBits { get; set; }
        public string AlgorithmName { get; set; } = string.Empty;
        public string KdfName { get; set; } = string.Empty;
        public int IterationCount { get; set; }
        public string Message { get; set; } = string.Empty;
        public byte[]? DecryptedPlainBytes { get; set; }

        public void Dispose()
        {
            RsaInstance?.Dispose();
            RsaInstance = null;
        }
    }

    /// <summary>
    /// 대한민국 NPKI, GPKI, EPKI 공인인증서 개인키(signPri.key) PKCS#8 암호화 구조를 정밀 분석하고
    /// 사용자 비밀번호 기반 KISA SEED-128, ARIA, 3DES, AES 복호화를 수행하여 순수 RSA 키를 복원하는 순수 창작 엔진
    /// (BouncyCastle 등 외부 종속성 0%)
    /// </summary>
    public static class KCertPrivateKeyDecryptor
    {
        // KISA SEED & ARIA OID
        public const string OidSeedCbc = "1.2.410.200004.1.4";
        public const string OidSeedCbcAlt = "1.2.410.200004.1.7";
        public const string OidAria128Cbc = "1.2.410.200004.1.11";
        public const string OidAria192Cbc = "1.2.410.200004.1.12";
        public const string OidAria256Cbc = "1.2.410.200004.1.13";

        // PKCS#5 PBES2 & PBKDF2
        public const string OidPbes2 = "1.2.840.113549.1.5.13";
        public const string OidPbkdf2 = "1.2.840.113549.1.5.12";
        public const string OidHmacSha1 = "1.2.840.113549.2.7";
        public const string OidHmacSha256 = "1.2.840.113549.2.9";

        // 3DES & AES
        public const string OidDesEde3Cbc = "1.2.840.113549.3.7";
        public const string OidAes128Cbc = "2.16.840.1.101.3.4.1.2";
        public const string OidAes256Cbc = "2.16.840.1.101.3.4.1.42";

        // RSA PKCS#1 OID
        public const string OidRsaEncryption = "1.2.840.113549.1.1.1";

        /// <summary>
        /// 파일 경로로부터 개인키를 읽어 복호화를 수행합니다.
        /// </summary>
        public static PrivateKeyDecryptionResult DecryptKeyFile(string keyFilePath, string password)
        {
            if (string.IsNullOrWhiteSpace(keyFilePath) || !File.Exists(keyFilePath))
            {
                return new PrivateKeyDecryptionResult
                {
                    IsSuccess = false,
                    Message = "개인키 파일(signPri.key)이 디스크에 존재하지 않습니다."
                };
            }

            try
            {
                byte[] keyBytes = File.ReadAllBytes(keyFilePath);
                return DecryptKeyBytes(keyBytes, password);
            }
            catch (Exception ex)
            {
                return new PrivateKeyDecryptionResult
                {
                    IsSuccess = false,
                    Message = $"개인키 파일 읽기 예외: {ex.Message}"
                };
            }
        }

        /// <summary>
        /// PKCS#8 바이너리 바이트 배열과 사용자 비밀번호를 받아 RSA 개인키를 복원합니다.
        /// </summary>
        public static PrivateKeyDecryptionResult DecryptKeyBytes(byte[] keyBytes, string password)
        {
            var result = new PrivateKeyDecryptionResult();

            if (keyBytes == null || keyBytes.Length < 32)
            {
                result.IsSuccess = false;
                result.Message = "개인키 파일 크기가 너무 작아 유효하지 않습니다.";
                return result;
            }

            // 1. 평문 RSA 키인지 확인 (SEQUENCE 태그로 시작하고 비암호화인 경우)
            try
            {
                var rsaDirect = RSA.Create();
                try
                {
                    rsaDirect.ImportPkcs8PrivateKey(keyBytes, out _);
                    result.IsSuccess = true;
                    result.RsaInstance = rsaDirect;
                    result.KeySizeBits = rsaDirect.KeySize;
                    result.AlgorithmName = "RSA (비암호화 평문 개인키)";
                    result.Message = $"비암호화 개인키 복원 성공 ({rsaDirect.KeySize}비트)";
                    return result;
                }
                catch
                {
                    try
                    {
                        rsaDirect.ImportRSAPrivateKey(keyBytes, out _);
                        result.IsSuccess = true;
                        result.RsaInstance = rsaDirect;
                        result.KeySizeBits = rsaDirect.KeySize;
                        result.AlgorithmName = "RSA PKCS#1 (비암호화 평문)";
                        result.Message = $"PKCS#1 평문 개인키 복원 성공 ({rsaDirect.KeySize}비트)";
                        return result;
                    }
                    catch
                    {
                        rsaDirect.Dispose();
                    }
                }
            }
            catch { }

            // 2. PKCS#8 EncryptedPrivateKeyInfo 파싱
            try
            {
                var parsedParams = ParseEncryptedPrivateKeyInfo(keyBytes);
                if (parsedParams == null)
                {
                    result.IsSuccess = false;
                    result.Message = "PKCS#8 암호화 구조를 해석할 수 없습니다.";
                    return result;
                }

                result.AlgorithmName = parsedParams.AlgorithmName;
                result.KdfName = parsedParams.KdfName;
                result.IterationCount = parsedParams.IterationCount;

                // 3. PBKDF2 키 유도 (Password + Salt + Iterations + HashAlgorithm)
                byte[] derivedKey;
                int keyLen = parsedParams.KeyLengthBytes;
                if (keyLen <= 0) keyLen = 16; // 기본 SEED/ARIA-128/AES-128: 16바이트

                HashAlgorithmName hashAlg = parsedParams.HashAlgorithm;
                derivedKey = Rfc2898DeriveBytes.Pbkdf2(
                    Encoding.UTF8.GetBytes(password),
                    parsedParams.Salt,
                    parsedParams.IterationCount,
                    hashAlg,
                    keyLen);

                // 4. 대칭키 알고리즘별 복호화 실행
                byte[] decryptedBytes;

                if (parsedParams.AlgorithmOid == OidSeedCbc || parsedParams.AlgorithmOid == OidSeedCbcAlt || parsedParams.AlgorithmName.Contains("SEED"))
                {
                    decryptedBytes = KisaSeedEngine.DecryptCbc(parsedParams.Ciphertext, derivedKey, parsedParams.Iv);
                }
                else if (parsedParams.AlgorithmOid == OidAria128Cbc || parsedParams.AlgorithmOid == OidAria192Cbc || parsedParams.AlgorithmOid == OidAria256Cbc || parsedParams.AlgorithmName.Contains("ARIA"))
                {
                    decryptedBytes = KisaAriaEngine.DecryptCbc(parsedParams.Ciphertext, derivedKey, parsedParams.Iv);
                }
                else if (parsedParams.AlgorithmOid == OidDesEde3Cbc)
                {
                    using var des = TripleDES.Create();
                    des.Key = derivedKey;
                    des.IV = parsedParams.Iv;
                    des.Mode = CipherMode.CBC;
                    des.Padding = PaddingMode.PKCS7;
                    using var decryptor = des.CreateDecryptor();
                    decryptedBytes = decryptor.TransformFinalBlock(parsedParams.Ciphertext, 0, parsedParams.Ciphertext.Length);
                }
                else if (parsedParams.AlgorithmOid == OidAes128Cbc || parsedParams.AlgorithmOid == OidAes256Cbc)
                {
                    using var aes = Aes.Create();
                    aes.Key = derivedKey;
                    aes.IV = parsedParams.Iv;
                    aes.Mode = CipherMode.CBC;
                    aes.Padding = PaddingMode.PKCS7;
                    using var decryptor = aes.CreateDecryptor();
                    decryptedBytes = decryptor.TransformFinalBlock(parsedParams.Ciphertext, 0, parsedParams.Ciphertext.Length);
                }
                else
                {
                    // 기본 KISA SEED-CBC 시도
                    decryptedBytes = KisaSeedEngine.DecryptCbc(parsedParams.Ciphertext, derivedKey, parsedParams.Iv);
                }

                result.DecryptedPlainBytes = decryptedBytes;

                // 5. 복호화된 개인키를 RSA 객체로 로드
                var rsa = RSA.Create();
                try
                {
                    rsa.ImportPkcs8PrivateKey(decryptedBytes, out _);
                }
                catch
                {
                    // PKCS#8이 실패하면 내부 PKCS#1 RSAPrivateKey 직접 로드 시도
                    rsa.ImportRSAPrivateKey(decryptedBytes, out _);
                }

                result.IsSuccess = true;
                result.RsaInstance = rsa;
                result.KeySizeBits = rsa.KeySize;
                result.Message = $"인증서 개인키 복호화 성공 ({result.AlgorithmName}, {rsa.KeySize}비트 RSA)";
                return result;
            }
            catch (CryptographicException)
            {
                result.IsSuccess = false;
                result.Message = "인증서 비밀번호가 일치하지 않거나 암호화 패딩이 손상되었습니다.";
                return result;
            }
            catch (Exception ex)
            {
                result.IsSuccess = false;
                result.Message = $"개인키 복호화 실패: {ex.Message}";
                return result;
            }
        }

        private class ParsedKeyParameters
        {
            public string AlgorithmOid { get; set; } = string.Empty;
            public string AlgorithmName { get; set; } = "KISA SEED-CBC";
            public string KdfName { get; set; } = "PBKDF2";
            public HashAlgorithmName HashAlgorithm { get; set; } = HashAlgorithmName.SHA1;
            public int KeyLengthBytes { get; set; } = 16;
            public byte[] Salt { get; set; } = Array.Empty<byte>();
            public int IterationCount { get; set; } = 2048;
            public byte[] Iv { get; set; } = Array.Empty<byte>();
            public byte[] Ciphertext { get; set; } = Array.Empty<byte>();
        }

        /// <summary>
        /// PKCS#8 ASN.1 바이트로부터 솔트, 반복수, IV, 암호문 바이트를 고속 추출합니다.
        /// </summary>
        private static ParsedKeyParameters? ParseEncryptedPrivateKeyInfo(byte[] keyBytes)
        {
            try
            {
                var param = new ParsedKeyParameters();

                // 간이 ASN.1 스캐너를 통해 Salt(OCTET STRING), Iteration(INTEGER), IV, Ciphertext 추출
                int cur = 0;
                if (keyBytes[cur++] != 0x30) return null; // SEQUENCE

                // 길이 스킵
                ReadLength(keyBytes, ref cur);

                // 전체 바이트에서 OID 검색
                string contentStr = BitConverter.ToString(keyBytes).Replace("-", "");

                // OID 판별
                if (contentStr.Contains("2A831A8C180104")) // 1.2.410.200004.1.4 (SEED-CBC)
                {
                    param.AlgorithmOid = OidSeedCbc;
                    param.AlgorithmName = "KISA SEED-CBC (128-bit)";
                    param.KeyLengthBytes = 16;
                }
                else if (contentStr.Contains("2A831A8C18010B")) // 1.2.410.200004.1.11 (ARIA-128-CBC)
                {
                    param.AlgorithmOid = OidAria128Cbc;
                    param.AlgorithmName = "KISA ARIA-128-CBC";
                    param.KeyLengthBytes = 16;
                }
                else if (contentStr.Contains("2A831A8C18010D")) // 1.2.410.200004.1.13 (ARIA-256-CBC)
                {
                    param.AlgorithmOid = OidAria256Cbc;
                    param.AlgorithmName = "KISA ARIA-256-CBC";
                    param.KeyLengthBytes = 32;
                }
                else if (contentStr.Contains("2A864886F70D0307")) // 3DES-CBC
                {
                    param.AlgorithmOid = OidDesEde3Cbc;
                    param.AlgorithmName = "Triple-DES (3DES-CBC)";
                    param.KeyLengthBytes = 24;
                }
                else
                {
                    param.AlgorithmOid = OidSeedCbc;
                    param.AlgorithmName = "KISA SEED-CBC (기본)";
                    param.KeyLengthBytes = 16;
                }

                // 해시 알고리즘 판별 (SHA-256 vs SHA-1)
                if (contentStr.Contains("2A864886F70D0209")) // HMAC-SHA256
                {
                    param.HashAlgorithm = HashAlgorithmName.SHA256;
                }
                else
                {
                    param.HashAlgorithm = HashAlgorithmName.SHA1;
                }

                // Salt 및 Iteration, IV 탐색
                // EncryptedPrivateKeyInfo:
                // [0] encryptionAlgorithm: SEQUENCE
                // [1] encryptedData: OCTET STRING (마지막 노드)
                // 마지막 OCTET STRING(0x04) 태그가 암호문
                int lastOctetIdx = -1;
                for (int i = keyBytes.Length - 1; i >= 0; i--)
                {
                    if (keyBytes[i] == 0x04)
                    {
                        int checkCur = i + 1;
                        int octetLen = ReadLength(keyBytes, ref checkCur);
                        if (octetLen > 0 && checkCur + octetLen == keyBytes.Length)
                        {
                            lastOctetIdx = i;
                            byte[] cipher = new byte[octetLen];
                            Buffer.BlockCopy(keyBytes, checkCur, cipher, 0, octetLen);
                            param.Ciphertext = cipher;
                            break;
                        }
                    }
                }

                if (param.Ciphertext.Length == 0)
                {
                    return null;
                }

                // 암호문 앞부분에서 Salt, Iteration, IV 추출
                int scanLimit = lastOctetIdx > 0 ? lastOctetIdx : keyBytes.Length;
                int idx = 0;

                while (idx < scanLimit - 4)
                {
                    byte tag = keyBytes[idx];

                    // Salt (8~16바이트 OCTET STRING)
                    if (tag == 0x04 && param.Salt.Length == 0)
                    {
                        int lenIdx = idx + 1;
                        int len = ReadLength(keyBytes, ref lenIdx);
                        if (len >= 8 && len <= 32 && lenIdx + len <= scanLimit)
                        {
                            param.Salt = new byte[len];
                            Buffer.BlockCopy(keyBytes, lenIdx, param.Salt, 0, len);
                            idx = lenIdx + len;
                            continue;
                        }
                    }

                    // Iteration Count (INTEGER, 보통 1024, 2048, 10000 등)
                    if (tag == 0x02 && param.IterationCount == 2048)
                    {
                        int lenIdx = idx + 1;
                        int len = ReadLength(keyBytes, ref lenIdx);
                        if (len > 0 && len <= 4 && lenIdx + len <= scanLimit)
                        {
                            int val = 0;
                            for (int k = 0; k < len; k++)
                            {
                                val = (val << 8) | keyBytes[lenIdx + k];
                            }
                            if (val >= 1000 && val <= 1000000)
                            {
                                param.IterationCount = val;
                                idx = lenIdx + len;
                                continue;
                            }
                        }
                    }

                    // IV (16바이트 또는 8바이트 OCTET STRING)
                    if (tag == 0x04 && param.Salt.Length > 0 && param.Iv.Length == 0)
                    {
                        int lenIdx = idx + 1;
                        int len = ReadLength(keyBytes, ref lenIdx);
                        if ((len == 16 || len == 8) && lenIdx + len <= scanLimit)
                        {
                            param.Iv = new byte[len];
                            Buffer.BlockCopy(keyBytes, lenIdx, param.Iv, 0, len);
                            idx = lenIdx + len;
                            continue;
                        }
                    }

                    idx++;
                }

                // IV가 없으면 Salt로부터 기본 유도 또는 16바이트 0
                if (param.Iv.Length == 0)
                {
                    param.Iv = new byte[16];
                    if (param.Salt.Length >= 16)
                    {
                        Buffer.BlockCopy(param.Salt, 0, param.Iv, 0, 16);
                    }
                }

                if (param.Salt.Length == 0)
                {
                    param.Salt = new byte[8]; // Fallback
                }

                return param;
            }
            catch
            {
                return null;
            }
        }

        private static int ReadLength(byte[] data, ref int offset)
        {
            if (offset >= data.Length) return 0;
            byte lenByte = data[offset++];
            if ((lenByte & 0x80) == 0)
            {
                return lenByte;
            }

            int numOctets = lenByte & 0x7F;
            if (numOctets <= 0 || numOctets > 4 || offset + numOctets > data.Length)
                return 0;

            int length = 0;
            for (int i = 0; i < numOctets; i++)
            {
                length = (length << 8) | data[offset++];
            }
            return length;
        }
    }
}
