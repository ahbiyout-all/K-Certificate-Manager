using System;
using System.IO;
using System.Security.Cryptography;

namespace KCert.Crypto.Ciphers
{
    /// <summary>
    /// KISA 표준 128비트 블록 암호 알고리즘 SEED (RFC 4269 / TTAS.KO-12.0004)
    /// 외부 라이브러리(BouncyCastle 등) 의존성 0%의 100% 순수 C# 고속 구현체
    /// 대한민국 전자서명 개인키(signPri.key) PKCS#8 SEED-CBC 복호화 핵심 엔진
    /// </summary>
    public static class KisaSeedEngine
    {
        public const int BlockSizeBytes = 16;
        public const int KeySizeBytes = 16;
        public const int NumberOfRounds = 16;

        // KISA SEED 공식 라운드 키 생성 상수 (황금비 기반)
        private static readonly uint[] KC = new uint[16]
        {
            0x9E3779B9, 0x3C6EF373, 0x78DDE6E6, 0xF1BBCCE9,
            0xE3779B93, 0xC6EF3733, 0x8DDE6E67, 0x1BBCCE9F,
            0x3779B93E, 0x6EF3733C, 0xDDE6E678, 0xBBCCE9F1,
            0x779B93E3, 0xEF3733C6, 0xDE6E678D, 0xBCCE9F1B
        };

        // KISA SEED S-box S1 및 S2 조합 사전 계산 G-Function 룩업 테이블 (SS0, SS1, SS2, SS3)
        private static readonly uint[] SS0 = new uint[256]
        {
            0x2989a1a8, 0x05858184, 0x160c1410, 0xb337b1b2, 0xaca0a8a4, 0x3f3b3d3c, 0x4f4b4d4c, 0x5e5a5c58,
            0x6b636764, 0x70707070, 0x82828080, 0x9b939794, 0xa7a3a5a4, 0xb838b8b0, 0xcd49c5c8, 0xd050d0d0,
            0xe763e5e4, 0xf672f4f4, 0x09898988, 0x1a0e1818, 0x2484a0a4, 0x3b333734, 0x48484848, 0x59515958,
            0x6e626c68, 0x77737574, 0x8a828888, 0x93939192, 0xa0a0a0a0, 0xb535b5b0, 0xc141c1c0, 0xd652d4d4,
            0xef63ebe8, 0xfa72f8f8, 0x02828280, 0x130f1112, 0x2080a0a0, 0x37333534, 0x43434142, 0x54505450,
            0x65616564, 0x7a727878, 0x8f838d8c, 0x96929494, 0xaba3a9a8, 0xbe3abcb8, 0xcb49c9c8, 0xd858d8d0,
            0xeb63e9e8, 0xf171f1f0, 0x0c8c8c88, 0x1f0f1d1c, 0x2b8ba3a8, 0x32323030, 0x4d494d4c, 0x52525050,
            0x60606060, 0x7f737d7c, 0x84848480, 0x9f939d9c, 0xaeaea8ac, 0xb232b2b0, 0xc541c5c4, 0xd959d9d8,
            0xe060e0e0, 0xfd71fdfc, 0x01818180, 0x120e1012, 0x2e8ea2ac, 0x36323434, 0x40404040, 0x57535554,
            0x6c606c68, 0x79717978, 0x88888888, 0x91919190, 0xa5a1a5a4, 0xb737b5b6, 0xc343c1c2, 0xd450d4d4,
            0xea62e8e8, 0xf773f5f4, 0x0e8e8c8c, 0x19091918, 0x2282a2a0, 0x3d393d3c, 0x46424444, 0x5b535958,
            0x68606868, 0x75717574, 0x87838584, 0x9c909c98, 0xadaba5ac, 0xb030b0b0, 0xcc4cc4c8, 0xd551d5d4,
            0xee62ece8, 0xf971f9f8, 0x04848084, 0x1b0b191a, 0x2686a2a4, 0x31313130, 0x44404444, 0x5f535d5c,
            0x62626060, 0x7c707c78, 0x89898988, 0x92929092, 0xa9a1a9a8, 0xbf3bbfbc, 0xc743c5c6, 0xd353d1d2,
            0xec60ece8, 0xf571f5f4, 0x07878584, 0x18081818, 0x2c8ca0ac, 0x35313534, 0x4a424848, 0x51515150,
            0x6f636d6c, 0x72727070, 0x8d818d8c, 0x90909090, 0xa2a2a0a0, 0xbb3bbbba, 0xce4ec6cc, 0xdd59ddd8,
            0xe662e4e4, 0xf272f0f0, 0x0b8b8988, 0x140c1414, 0x2787a3a4, 0x38383838, 0x41414140, 0x5c505c58,
            0x69616968, 0x7e727c7c, 0x85858584, 0x94909494, 0xafaba7ac, 0xb333b1b2, 0xc848c8c8, 0xda5ada58,
            0xe460e4e4, 0xfb73f9fa, 0x06868484, 0x1d0d1d1c, 0x2585a1a4, 0x34303434, 0x4e4a4c4c, 0x58505858,
            0x67636564, 0x78707878, 0x8c808c8c, 0x9d919d9c, 0xa4a0a4a4, 0xbc38bcb8, 0xc040c0c0, 0xde5ede5c,
            0xe561e5e4, 0xf470f4f4, 0x08888888, 0x150d1514, 0x2f8fa3ac, 0x3a323838, 0x45414544, 0x56525454,
            0x6a626868, 0x73737170, 0x81818180, 0x98909898, 0xa1a1a1a0, 0xba3aba38, 0xc949c9c8, 0xdb5bdb5a,
            0xed61ede8, 0xfc70fcfc, 0x03838380, 0x100c1010, 0x2a8aa2a8, 0x30303030, 0x49494948, 0x5a525858,
            0x61616160, 0x76727474, 0x8e828c8c, 0x99919998, 0xacaca8ac, 0xb430b4b0, 0xc242c0c2, 0xdf5fddde,
            0xe860e8e8, 0xfe72fefc, 0x00808080, 0x170f1516, 0x2d8da1ac, 0x39393938, 0x4c484c4c, 0x50505050,
            0x66626464, 0x7d717d7c, 0x86828484, 0x95919594, 0xa6a2a4a4, 0xb636b4b6, 0xc440c4c4, 0xd151d1d0,
            0xee62ece8, 0xf870f8f8, 0x0f8f8d8c, 0x1c0c1c1c, 0x2383a1a0, 0x3e3a3c3c, 0x47434544, 0x53535150,
            0x6d616d6c, 0x74707474, 0x8b838988, 0x9a929898, 0xa8a0a8a8, 0xbd39bdbc, 0xca4ac8ca, 0xd753d5d6,
            0xe161e1e0, 0xf070f0f0, 0x0a8a8888, 0x1e0e1e1c, 0x2888a0a8, 0x33333130, 0x4b434948, 0x55515554,
            0x64606464, 0x7b737978, 0x83838180, 0x9e929c9c, 0xaaa2a8a8, 0xb131b1b0, 0xcf4fc7ce, 0xdc5cd4d8,
            0xe961e9e8, 0xff73fdfc, 0x0d8d898c, 0x110d1110, 0x2181a1a0, 0x3c383c3c, 0x42424040, 0x5d515d58,
            0x63636160, 0x71717170, 0x80808080, 0x97939594, 0xa3a3a1a0, 0xb939b9b8, 0xc642c4c6, 0xd252d0d2
        };

        private static readonly uint[] SS1 = new uint[256];
        private static readonly uint[] SS2 = new uint[256];
        private static readonly uint[] SS3 = new uint[256];

        static KisaSeedEngine()
        {
            // SS0 배열로부터 ROL(8), ROL(16), ROL(24)를 사전 계산하여 0-오버헤드 구축
            for (int i = 0; i < 256; i++)
            {
                uint val = SS0[i];
                SS1[i] = RotateLeft(val, 8);
                SS2[i] = RotateLeft(val, 16);
                SS3[i] = RotateLeft(val, 24);
            }
        }

        private static uint RotateLeft(uint x, int n) => (x << n) | (x >> (32 - n));
        private static uint RotateRight(uint x, int n) => (x >> n) | (x << (32 - n));

        /// <summary>
        /// 128비트 비밀키로부터 16라운드 총 32개의 32비트 라운드 서브키를 유도합니다.
        /// </summary>
        public static uint[] GenerateRoundKeys(byte[] userKey)
        {
            if (userKey == null || userKey.Length != KeySizeBytes)
                throw new ArgumentException("SEED 암호화 키는 정확히 16바이트(128비트)여야 합니다.");

            uint[] roundKeys = new uint[32];

            uint a = GetUInt32BigEndian(userKey, 0);
            uint b = GetUInt32BigEndian(userKey, 4);
            uint c = GetUInt32BigEndian(userKey, 8);
            uint d = GetUInt32BigEndian(userKey, 12);

            for (int i = 0; i < 16; i++)
            {
                uint t0 = a + c - KC[i];
                uint t1 = b - d + KC[i];

                roundKeys[i * 2] = GFunction(t0);
                roundKeys[i * 2 + 1] = GFunction(t1);

                if (i % 2 == 0)
                {
                    // Even round: A, B 8비트 우측 순환 회전
                    uint tempA = a;
                    a = (a >> 8) | (b << 24);
                    b = (b >> 8) | (tempA << 24);
                }
                else
                {
                    // Odd round: C, D 8비트 좌측 순환 회전
                    uint tempC = c;
                    c = (c << 8) | (d >> 24);
                    d = (d << 8) | (tempC >> 24);
                }
            }

            return roundKeys;
        }

        private static uint GFunction(uint x)
        {
            byte b3 = (byte)(x >> 24);
            byte b2 = (byte)(x >> 16);
            byte b1 = (byte)(x >> 8);
            byte b0 = (byte)x;

            return SS0[b3] ^ SS1[b2] ^ SS2[b1] ^ SS3[b0];
        }

        /// <summary>
        /// 단일 16바이트 블록을 SEED 알고리즘으로 복호화합니다.
        /// </summary>
        public static void DecryptBlock(byte[] inBuf, int inOff, byte[] outBuf, int outOff, uint[] roundKeys)
        {
            uint l0 = GetUInt32BigEndian(inBuf, inOff);
            uint l1 = GetUInt32BigEndian(inBuf, inOff + 4);
            uint r0 = GetUInt32BigEndian(inBuf, inOff + 8);
            uint r1 = GetUInt32BigEndian(inBuf, inOff + 12);

            // 16라운드 역방향 Feistel 네트워크
            for (int i = 15; i >= 0; i--)
            {
                uint k0 = roundKeys[i * 2];
                uint k1 = roundKeys[i * 2 + 1];

                // F-Function
                uint c = r0 ^ k0;
                uint d = r1 ^ k1;
                uint t0 = GFunction(c ^ d);
                uint t1 = GFunction(c + d);
                uint t2 = t0 + t1;
                uint t3 = GFunction(t2);

                uint newL0 = r0;
                uint newL1 = r1;
                r0 = l0 ^ (t1 + t3);
                r1 = l1 ^ (t0 + t3);
                l0 = newL0;
                l1 = newL1;
            }

            PutUInt32BigEndian(outBuf, outOff, r0);
            PutUInt32BigEndian(outBuf, outOff + 4, r1);
            PutUInt32BigEndian(outBuf, outOff + 8, l0);
            PutUInt32BigEndian(outBuf, outOff + 12, l1);
        }

        /// <summary>
        /// 단일 16바이트 블록을 SEED 알고리즘으로 암호화합니다.
        /// </summary>
        public static void EncryptBlock(byte[] inBuf, int inOff, byte[] outBuf, int outOff, uint[] roundKeys)
        {
            uint l0 = GetUInt32BigEndian(inBuf, inOff);
            uint l1 = GetUInt32BigEndian(inBuf, inOff + 4);
            uint r0 = GetUInt32BigEndian(inBuf, inOff + 8);
            uint r1 = GetUInt32BigEndian(inBuf, inOff + 12);

            // 16라운드 순방향 Feistel 네트워크
            for (int i = 0; i < 16; i++)
            {
                uint k0 = roundKeys[i * 2];
                uint k1 = roundKeys[i * 2 + 1];

                // F-Function
                uint c = r0 ^ k0;
                uint d = r1 ^ k1;
                uint t0 = GFunction(c ^ d);
                uint t1 = GFunction(c + d);
                uint t2 = t0 + t1;
                uint t3 = GFunction(t2);

                uint newL0 = r0;
                uint newL1 = r1;
                r0 = l0 ^ (t1 + t3);
                r1 = l1 ^ (t0 + t3);
                l0 = newL0;
                l1 = newL1;
            }

            PutUInt32BigEndian(outBuf, outOff, r0);
            PutUInt32BigEndian(outBuf, outOff + 4, r1);
            PutUInt32BigEndian(outBuf, outOff + 8, l0);
            PutUInt32BigEndian(outBuf, outOff + 12, l1);
        }

        /// <summary>
        /// KISA SEED-CBC 모드로 암호문을 복호화하고 PKCS#7 패딩을 제거합니다.
        /// </summary>
        public static byte[] DecryptCbc(byte[] ciphertext, byte[] key, byte[] iv)
        {
            if (ciphertext == null || ciphertext.Length == 0 || ciphertext.Length % BlockSizeBytes != 0)
                throw new ArgumentException("암호문 길이는 16바이트의 배수여야 합니다.");

            if (key == null || key.Length != KeySizeBytes)
                throw new ArgumentException("키는 16바이트여야 합니다.");

            if (iv == null || iv.Length != BlockSizeBytes)
                throw new ArgumentException("IV는 16바이트여야 합니다.");

            var roundKeys = GenerateRoundKeys(key);
            byte[] plaintext = new byte[ciphertext.Length];
            byte[] prevBlock = new byte[BlockSizeBytes];
            Buffer.BlockCopy(iv, 0, prevBlock, 0, BlockSizeBytes);

            byte[] tempBlock = new byte[BlockSizeBytes];

            for (int offset = 0; offset < ciphertext.Length; offset += BlockSizeBytes)
            {
                DecryptBlock(ciphertext, offset, tempBlock, 0, roundKeys);

                for (int j = 0; j < BlockSizeBytes; j++)
                {
                    plaintext[offset + j] = (byte)(tempBlock[j] ^ prevBlock[j]);
                }

                Buffer.BlockCopy(ciphertext, offset, prevBlock, 0, BlockSizeBytes);
            }

            // PKCS#7 패딩 검증 및 제거
            return UnpadPkcs7(plaintext);
        }

        /// <summary>
        /// 평문을 PKCS#7 패딩 적용 후 KISA SEED-CBC 모드로 암호화합니다.
        /// </summary>
        public static byte[] EncryptCbc(byte[] plaintext, byte[] key, byte[] iv)
        {
            if (key == null || key.Length != KeySizeBytes)
                throw new ArgumentException("키는 16바이트여야 합니다.");

            if (iv == null || iv.Length != BlockSizeBytes)
                throw new ArgumentException("IV는 16바이트여야 합니다.");

            byte[] padded = PadPkcs7(plaintext);
            byte[] ciphertext = new byte[padded.Length];
            var roundKeys = GenerateRoundKeys(key);

            byte[] prevBlock = new byte[BlockSizeBytes];
            Buffer.BlockCopy(iv, 0, prevBlock, 0, BlockSizeBytes);

            byte[] tempBlock = new byte[BlockSizeBytes];

            for (int offset = 0; offset < padded.Length; offset += BlockSizeBytes)
            {
                for (int j = 0; j < BlockSizeBytes; j++)
                {
                    tempBlock[j] = (byte)(padded[offset + j] ^ prevBlock[j]);
                }

                EncryptBlock(tempBlock, 0, ciphertext, offset, roundKeys);
                Buffer.BlockCopy(ciphertext, offset, prevBlock, 0, BlockSizeBytes);
            }

            return ciphertext;
        }

        private static byte[] PadPkcs7(byte[] data)
        {
            int padLen = BlockSizeBytes - (data.Length % BlockSizeBytes);
            if (padLen == 0) padLen = BlockSizeBytes;

            byte[] padded = new byte[data.Length + padLen];
            Buffer.BlockCopy(data, 0, padded, 0, data.Length);
            for (int i = data.Length; i < padded.Length; i++)
            {
                padded[i] = (byte)padLen;
            }
            return padded;
        }

        private static byte[] UnpadPkcs7(byte[] data)
        {
            if (data == null || data.Length == 0) return Array.Empty<byte>();

            byte padLen = data[data.Length - 1];
            if (padLen <= 0 || padLen > BlockSizeBytes || padLen > data.Length)
                throw new CryptographicException("잘못된 PKCS#7 패딩입니다. 비밀번호가 일치하지 않습니다.");

            for (int i = data.Length - padLen; i < data.Length; i++)
            {
                if (data[i] != padLen)
                    throw new CryptographicException("PKCS#7 패딩 검증 실패. 복호화 키 또는 비밀번호가 올바르지 않습니다.");
            }

            byte[] unpadded = new byte[data.Length - padLen];
            Buffer.BlockCopy(data, 0, unpadded, 0, unpadded.Length);
            return unpadded;
        }

        private static uint GetUInt32BigEndian(byte[] buf, int offset)
        {
            return ((uint)buf[offset] << 24) |
                   ((uint)buf[offset + 1] << 16) |
                   ((uint)buf[offset + 2] << 8) |
                   buf[offset + 3];
        }

        private static void PutUInt32BigEndian(byte[] buf, int offset, uint val)
        {
            buf[offset] = (byte)(val >> 24);
            buf[offset + 1] = (byte)(val >> 16);
            buf[offset + 2] = (byte)(val >> 8);
            buf[offset + 3] = (byte)val;
        }
    }
}
