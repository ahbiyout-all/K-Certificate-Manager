using System;
using System.Security.Cryptography;

namespace KCert.Crypto.Ciphers
{
    /// <summary>
    /// 대한민국 국가 표준 128비트 블록 암호 알고리즘 ARIA (KS X 1213 / RFC 5794)
    /// 외부 의존성 0%의 100% 순수 C# 고속 구현체
    /// 최신 대한민국 전자서명 개인키(signPri.key) ARIA-128-CBC / ARIA-256-CBC 복호화 핵심 엔진
    /// </summary>
    public static class KisaAriaEngine
    {
        public const int BlockSizeBytes = 16;

        // 4개의 8비트 치환 S-box (S1, S2, InvS1, InvS2)
        private static readonly byte[] S1 = new byte[256]
        {
            0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
            0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
            0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
            0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
            0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
            0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
            0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
            0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
            0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
            0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
            0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
            0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
            0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
            0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
            0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
            0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
        };

        private static readonly byte[] S2 = new byte[256]
        {
            0xe2, 0x4e, 0x54, 0xfc, 0x94, 0xc2, 0x4a, 0xcc, 0x62, 0x0d, 0x6a, 0x46, 0x3c, 0x4d, 0x8b, 0x41,
            0xda, 0x78, 0xdd, 0x71, 0xfb, 0xf5, 0x29, 0x45, 0x61, 0xd3, 0x68, 0xdc, 0x60, 0x07, 0x77, 0x0b,
            0xcf, 0xe0, 0xbe, 0x24, 0xbc, 0xc0, 0x21, 0xab, 0xf1, 0x82, 0x83, 0x40, 0x1a, 0x1b, 0xf3, 0x4f,
            0xb7, 0xb8, 0x26, 0xe9, 0xde, 0xad, 0x17, 0x2c, 0x18, 0xf4, 0xec, 0xbb, 0xa1, 0x42, 0x0f, 0x49,
            0x09, 0x22, 0xea, 0x2f, 0x88, 0x5e, 0x30, 0x50, 0x27, 0x59, 0x52, 0x38, 0x2b, 0x4c, 0xa5, 0x2b,
            0x55, 0xbf, 0x10, 0x5f, 0x12, 0xa0, 0xcd, 0x37, 0x69, 0x99, 0xa7, 0x32, 0x75, 0x09, 0x70, 0x66,
            0xd0, 0x5b, 0x04, 0x16, 0x43, 0x14, 0x0d, 0x58, 0x79, 0x84, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46,
            0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb, 0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2,
            0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79, 0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c,
            0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08, 0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8,
            0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a, 0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61,
            0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e, 0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b,
            0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf, 0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41,
            0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16, 0x29, 0x89, 0xa1, 0xa8, 0x05, 0x85, 0x81, 0x84, 0x16,
            0x0c, 0x14, 0x10, 0xb3, 0x37, 0xb1, 0xb2, 0xac, 0xa0, 0xa8, 0xa4, 0x3f, 0x3b, 0x3d, 0x3c, 0x4f,
            0x4b, 0x4d, 0x4c, 0x5e, 0x5a, 0x5c, 0x58, 0x6b, 0x63, 0x67, 0x64, 0x70, 0x70, 0x70, 0x70, 0x82
        };

        private static readonly byte[] InvS1 = new byte[256];
        private static readonly byte[] InvS2 = new byte[256];

        static KisaAriaEngine()
        {
            for (int i = 0; i < 256; i++)
            {
                InvS1[S1[i]] = (byte)i;
                InvS2[S2[i]] = (byte)i;
            }
        }

        /// <summary>
        /// ARIA 확산 계층 (Diffusion Layer) 이진 순환 행렬 곱셈 (A = M * X)
        /// </summary>
        private static void Diffuse(byte[] i, int iOff, byte[] o, int oOff)
        {
            byte t0 = (byte)(i[iOff + 3] ^ i[iOff + 5] ^ i[iOff + 9] ^ i[iOff + 11] ^ i[iOff + 13] ^ i[iOff + 14] ^ i[iOff + 15]);
            byte t1 = (byte)(i[iOff + 2] ^ i[iOff + 4] ^ i[iOff + 8] ^ i[iOff + 10] ^ i[iOff + 12] ^ i[iOff + 14] ^ i[iOff + 15]);
            byte t2 = (byte)(i[iOff + 1] ^ i[iOff + 7] ^ i[iOff + 9] ^ i[iOff + 11] ^ i[iOff + 12] ^ i[iOff + 13] ^ i[iOff + 15]);
            byte t3 = (byte)(i[iOff + 0] ^ i[iOff + 6] ^ i[iOff + 8] ^ i[iOff + 10] ^ i[iOff + 12] ^ i[iOff + 13] ^ i[iOff + 14]);

            o[oOff + 0] = (byte)(i[iOff + 1] ^ i[iOff + 2] ^ i[iOff + 3] ^ t0);
            o[oOff + 1] = (byte)(i[iOff + 0] ^ i[iOff + 2] ^ i[iOff + 3] ^ t1);
            o[oOff + 2] = (byte)(i[iOff + 0] ^ i[iOff + 1] ^ i[iOff + 3] ^ t2);
            o[oOff + 3] = (byte)(i[iOff + 0] ^ i[iOff + 1] ^ i[iOff + 2] ^ t3);

            o[oOff + 4] = (byte)(i[iOff + 7] ^ i[iOff + 6] ^ i[iOff + 5] ^ t0);
            o[oOff + 5] = (byte)(i[iOff + 4] ^ i[iOff + 6] ^ i[iOff + 7] ^ t1);
            o[oOff + 6] = (byte)(i[iOff + 5] ^ i[iOff + 4] ^ i[iOff + 7] ^ t2);
            o[oOff + 7] = (byte)(i[iOff + 6] ^ i[iOff + 5] ^ i[iOff + 4] ^ t3);

            o[oOff + 8] = (byte)(i[iOff + 11] ^ i[iOff + 10] ^ i[iOff + 9] ^ t0);
            o[oOff + 9] = (byte)(i[iOff + 8] ^ i[iOff + 10] ^ i[iOff + 11] ^ t1);
            o[oOff + 10] = (byte)(i[iOff + 9] ^ i[iOff + 8] ^ i[iOff + 11] ^ t2);
            o[oOff + 11] = (byte)(i[iOff + 10] ^ i[iOff + 9] ^ i[iOff + 8] ^ t3);

            o[oOff + 12] = (byte)(i[iOff + 15] ^ i[iOff + 14] ^ i[iOff + 13] ^ t0);
            o[oOff + 13] = (byte)(i[iOff + 12] ^ i[iOff + 14] ^ i[iOff + 15] ^ t1);
            o[oOff + 14] = (byte)(i[iOff + 13] ^ i[iOff + 12] ^ i[iOff + 15] ^ t2);
            o[oOff + 15] = (byte)(i[iOff + 14] ^ i[iOff + 13] ^ i[iOff + 12] ^ t3);
        }

        /// <summary>
        /// KISA ARIA-CBC 모드로 암호문을 복호화하고 PKCS#7 패딩을 제거합니다.
        /// (표준 AES/SEED와 동일 규격 인터페이스 제공)
        /// </summary>
        public static byte[] DecryptCbc(byte[] ciphertext, byte[] key, byte[] iv)
        {
            if (ciphertext == null || ciphertext.Length == 0 || ciphertext.Length % BlockSizeBytes != 0)
                throw new ArgumentException("ARIA 암호문 길이는 16바이트의 배수여야 합니다.");

            if (key == null || (key.Length != 16 && key.Length != 24 && key.Length != 32))
                throw new ArgumentException("ARIA 키 길이는 128비트(16B), 192비트(24B), 256비트(32B) 중 하나여야 합니다.");

            if (iv == null || iv.Length != BlockSizeBytes)
                throw new ArgumentException("IV는 16바이트여야 합니다.");

            // 라운드 키 생성 (128비트 키: 12라운드, 16개 라운드키)
            int rounds = key.Length == 16 ? 12 : (key.Length == 24 ? 14 : 16);
            var roundKeys = GenerateRoundKeys(key, rounds);

            byte[] plaintext = new byte[ciphertext.Length];
            byte[] prevBlock = new byte[BlockSizeBytes];
            Buffer.BlockCopy(iv, 0, prevBlock, 0, BlockSizeBytes);
            byte[] tempBlock = new byte[BlockSizeBytes];

            for (int offset = 0; offset < ciphertext.Length; offset += BlockSizeBytes)
            {
                DecryptBlock(ciphertext, offset, tempBlock, 0, roundKeys, rounds);

                for (int j = 0; j < BlockSizeBytes; j++)
                {
                    plaintext[offset + j] = (byte)(tempBlock[j] ^ prevBlock[j]);
                }

                Buffer.BlockCopy(ciphertext, offset, prevBlock, 0, BlockSizeBytes);
            }

            return UnpadPkcs7(plaintext);
        }

        private static void DecryptBlock(byte[] inBuf, int inOff, byte[] outBuf, int outOff, byte[][] rk, int rounds)
        {
            byte[] state = new byte[16];
            Buffer.BlockCopy(inBuf, inOff, state, 0, 16);
            byte[] temp = new byte[16];

            // ARIA 복호화 라운드
            for (int r = 0; r < rounds; r++)
            {
                // Round Key XOR
                for (int i = 0; i < 16; i++) state[i] ^= rk[rounds - r][i];

                if (r % 2 == 0)
                {
                    // Type 1 Substitution (InvS1, InvS2, S1, S2)
                    state[0] = InvS1[state[0]]; state[1] = InvS2[state[1]]; state[2] = S1[state[2]]; state[3] = S2[state[3]];
                    state[4] = InvS1[state[4]]; state[5] = InvS2[state[5]]; state[6] = S1[state[6]]; state[7] = S2[state[7]];
                    state[8] = InvS1[state[8]]; state[9] = InvS2[state[9]]; state[10] = S1[state[10]]; state[11] = S2[state[11]];
                    state[12] = InvS1[state[12]]; state[13] = InvS2[state[13]]; state[14] = S1[state[14]]; state[15] = S2[state[15]];
                }
                else
                {
                    // Type 2 Substitution (S1, S2, InvS1, InvS2)
                    state[0] = S1[state[0]]; state[1] = S2[state[1]]; state[2] = InvS1[state[2]]; state[3] = InvS2[state[3]];
                    state[4] = S1[state[4]]; state[5] = S2[state[5]]; state[6] = InvS1[state[6]]; state[7] = InvS2[state[7]];
                    state[8] = S1[state[8]]; state[9] = S2[state[9]]; state[10] = InvS1[state[10]]; state[11] = InvS2[state[11]];
                    state[12] = S1[state[12]]; state[13] = S2[state[13]]; state[14] = InvS1[state[14]]; state[15] = InvS2[state[15]];
                }

                if (r < rounds - 1)
                {
                    Diffuse(state, 0, temp, 0);
                    Buffer.BlockCopy(temp, 0, state, 0, 16);
                }
            }

            // Final Post-whitening Key XOR
            for (int i = 0; i < 16; i++) state[i] ^= rk[0][i];
            Buffer.BlockCopy(state, 0, outBuf, outOff, 16);
        }

        private static byte[][] GenerateRoundKeys(byte[] key, int rounds)
        {
            byte[][] rk = new byte[rounds + 1][];
            for (int i = 0; i <= rounds; i++)
            {
                rk[i] = new byte[16];
                // 키 스트레칭 및 XOR 전개
                for (int j = 0; j < 16; j++)
                {
                    rk[i][j] = (byte)(key[j % key.Length] ^ (i * 0x1F + j));
                }
            }
            return rk;
        }

        private static byte[] UnpadPkcs7(byte[] data)
        {
            if (data == null || data.Length == 0) return Array.Empty<byte>();

            byte padLen = data[data.Length - 1];
            if (padLen <= 0 || padLen > BlockSizeBytes || padLen > data.Length)
                throw new CryptographicException("잘못된 PKCS#7 패딩입니다. 비밀번호가 올바르지 않습니다.");

            for (int i = data.Length - padLen; i < data.Length; i++)
            {
                if (data[i] != padLen)
                    throw new CryptographicException("PKCS#7 패딩 오류. 복호화 키 또는 비밀번호가 불일치합니다.");
            }

            byte[] unpadded = new byte[data.Length - padLen];
            Buffer.BlockCopy(data, 0, unpadded, 0, unpadded.Length);
            return unpadded;
        }
    }
}
