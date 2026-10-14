using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;

namespace KCert.Core.Parser
{
    /// <summary>
    /// ASN.1 DER 태그 식별자 상수
    /// </summary>
    public static class Asn1Tags
    {
        public const byte Boolean = 0x01;
        public const byte Integer = 0x02;
        public const byte BitString = 0x03;
        public const byte OctetString = 0x04;
        public const byte Null = 0x05;
        public const byte ObjectIdentifier = 0x06;
        public const byte UTF8String = 0x0C;
        public const byte PrintableString = 0x13;
        public const byte IA5String = 0x16;
        public const byte UTCTime = 0x17;
        public const byte GeneralizedTime = 0x18;
        public const byte Sequence = 0x30;
        public const byte Set = 0x31;
        public const byte ContextSpecific0 = 0xA0;
        public const byte ContextSpecific1 = 0xA1;
        public const byte ContextSpecific2 = 0xA2;
        public const byte ContextSpecific3 = 0xA3;
    }

    /// <summary>
    /// ASN.1 DER TLV (Tag-Length-Value) 파싱 노드
    /// </summary>
    public class Asn1Node
    {
        public byte Tag { get; set; }
        public int HeaderLength { get; set; }
        public int ContentLength { get; set; }
        public int TotalLength => HeaderLength + ContentLength;
        public byte[] RawData { get; set; } = Array.Empty<byte>();
        public byte[] ContentBytes { get; set; } = Array.Empty<byte>();
        public List<Asn1Node> Children { get; set; } = new();

        public bool IsConstructed => (Tag & 0x20) != 0 || Tag == Asn1Tags.Sequence || Tag == Asn1Tags.Set;
    }

    /// <summary>
    /// 외부 종속성 없는 100% 순수 창작 고속 ASN.1 DER 바이너리 리더 및 OID 디코더/인코더 엔진
    /// </summary>
    public static class KCertAsn1Reader
    {
        /// <summary>
        /// 바이트 배열로부터 최상위 ASN.1 노드 및 하위 트리 전체를 재귀적으로 파싱합니다.
        /// </summary>
        public static Asn1Node? Parse(byte[] data, int offset = 0, int maxDepth = 16)
        {
            if (data == null || offset >= data.Length || maxDepth < 0) return null;

            try
            {
                int cur = offset;
                byte tag = data[cur++];

                // 길이 파싱
                if (cur >= data.Length) return null;
                byte lenByte = data[cur++];
                int length;

                if ((lenByte & 0x80) == 0)
                {
                    // Short form (0..127)
                    length = lenByte;
                }
                else
                {
                    // Long form
                    int numOctets = lenByte & 0x7F;
                    if (numOctets <= 0 || numOctets > 4 || cur + numOctets > data.Length)
                        return null;

                    length = 0;
                    for (int i = 0; i < numOctets; i++)
                    {
                        length = (length << 8) | data[cur++];
                    }
                }

                if (length < 0 || cur + length > data.Length) return null;

                int headerLen = cur - offset;
                byte[] content = new byte[length];
                Buffer.BlockCopy(data, cur, content, 0, length);

                byte[] raw = new byte[headerLen + length];
                Buffer.BlockCopy(data, offset, raw, 0, headerLen + length);

                var node = new Asn1Node
                {
                    Tag = tag,
                    HeaderLength = headerLen,
                    ContentLength = length,
                    RawData = raw,
                    ContentBytes = content
                };

                // Sequence, Set, ContextSpecific 태그의 경우 자식 노드 파싱
                if (node.IsConstructed && maxDepth > 0 && length > 0)
                {
                    int childOffset = 0;
                    while (childOffset < content.Length)
                    {
                        var child = Parse(content, childOffset, maxDepth - 1);
                        if (child == null || child.TotalLength <= 0) break;
                        node.Children.Add(child);
                        childOffset += child.TotalLength;
                    }
                }

                return node;
            }
            catch
            {
                return null;
            }
        }

        /// <summary>
        /// ASN.1 DER OID 바이너리 바이트(Tag=0x06의 Content)를 점(.) 구분 OID 문자열로 디코딩합니다.
        /// 예: [0x2A, 0x83, 0x1A, 0x8C, 0x19, 0x01, 0x01, 0x01] -> "1.2.410.200005.1.1.1"
        /// </summary>
        public static string DecodeOid(byte[] oidBytes)
        {
            if (oidBytes == null || oidBytes.Length == 0) return string.Empty;

            var sb = new StringBuilder();

            // 첫 번째 바이트는 (first_node * 40 + second_node)
            byte first = oidBytes[0];
            int firstNode = first / 40;
            int secondNode = first % 40;
            sb.Append(firstNode).Append('.').Append(secondNode);

            long currentValue = 0;
            for (int i = 1; i < oidBytes.Length; i++)
            {
                byte b = oidBytes[i];
                currentValue = (currentValue << 7) | (long)(b & 0x7F);

                if ((b & 0x80) == 0)
                {
                    // 최상위 비트(0x80)가 0이면 이 노드의 끝
                    sb.Append('.').Append(currentValue);
                    currentValue = 0;
                }
            }

            return sb.ToString();
        }

        /// <summary>
        /// 임의의 DER 바이트 스트림 내에서 모든 OID(Tag=0x06)를 초고속으로 추출합니다.
        /// </summary>
        public static List<string> ExtractAllOids(byte[] data)
        {
            var oids = new List<string>();
            if (data == null || data.Length < 3) return oids;

            int i = 0;
            while (i < data.Length - 2)
            {
                if (data[i] == Asn1Tags.ObjectIdentifier)
                {
                    int len = data[i + 1];
                    int contentStart = i + 2;

                    if ((len & 0x80) != 0)
                    {
                        int lenBytes = len & 0x7F;
                        if (lenBytes == 1 && contentStart < data.Length)
                        {
                            len = data[contentStart++];
                        }
                        else
                        {
                            i++;
                            continue;
                        }
                    }

                    if (len > 0 && contentStart + len <= data.Length)
                    {
                        byte[] oidBuf = new byte[len];
                        Buffer.BlockCopy(data, contentStart, oidBuf, 0, len);
                        string oid = DecodeOid(oidBuf);
                        if (!string.IsNullOrEmpty(oid) && oid.Contains('.'))
                        {
                            oids.Add(oid);
                        }
                        i = contentStart + len;
                        continue;
                    }
                }
                i++;
            }

            return oids;
        }

        /// <summary>
        /// 점(.) 구분 OID 문자열을 ASN.1 DER OID 바이너리 바이트(Content 부분)로 인코딩합니다.
        /// </summary>
        public static byte[] EncodeOid(string oidString)
        {
            if (string.IsNullOrWhiteSpace(oidString)) return Array.Empty<byte>();

            var parts = oidString.Split('.');
            if (parts.Length < 2) return Array.Empty<byte>();

            if (!long.TryParse(parts[0], out long first) || !long.TryParse(parts[1], out long second))
                return Array.Empty<byte>();

            var result = new List<byte>
            {
                (byte)(first * 40 + second)
            };

            for (int i = 2; i < parts.Length; i++)
            {
                if (!long.TryParse(parts[i], out long val)) return Array.Empty<byte>();

                var stack = new Stack<byte>();
                stack.Push((byte)(val & 0x7F));
                val >>= 7;

                while (val > 0)
                {
                    stack.Push((byte)((val & 0x7F) | 0x80));
                    val >>= 7;
                }

                while (stack.Count > 0)
                {
                    result.Add(stack.Pop());
                }
            }

            return result.ToArray();
        }
    }
}
