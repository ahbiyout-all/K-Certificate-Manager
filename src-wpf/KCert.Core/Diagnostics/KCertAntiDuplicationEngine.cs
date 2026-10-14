using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using KCert.Core.Parser;

namespace KCert.Core.Diagnostics
{
    /// <summary>
    /// 중복 인증서 클러스터 그룹 정보
    /// </summary>
    public class DuplicateCertGroup
    {
        public string FingerprintSha256 { get; set; } = string.Empty;
        public string SerialNumber { get; set; } = string.Empty;
        public string CommonName { get; set; } = string.Empty;
        public string Issuer { get; set; } = string.Empty;
        public DateTime ValidTo { get; set; }
        public int TotalCopies => Instances.Count;
        public List<KCertMetadata> Instances { get; set; } = new();

        /// <summary>표준 경로에 위치한 기본 인스턴스 (Primary Instance)</summary>
        public KCertMetadata? PrimaryInstance => Instances.FirstOrDefault(i => Discovery.CertLocationScanner.IsStandardPath(i.DirectoryPath)) 
                                                ?? Instances.FirstOrDefault();

        /// <summary>중복 정리 가능한 잉여 복사본 목록 (Redundant Copies)</summary>
        public List<KCertMetadata> RedundantInstances => Instances.Where(i => i != PrimaryInstance).ToList();
    }

    /// <summary>
    /// 시스템 전역 인증서 중복 진단 리포트
    /// </summary>
    public class DeduplicationReport
    {
        public int TotalScannedCertCount { get; set; }
        public int UniqueCertCount { get; set; }
        public int DuplicateGroupCount => Groups.Count;
        public int RedundantCertCount => Groups.Sum(g => g.RedundantInstances.Count);
        public long EstimatedReclaimableBytes => Groups.Sum(g => g.RedundantInstances.Sum(r => r.DerFileSize + r.KeyFileSize));
        public List<DuplicateCertGroup> Groups { get; set; } = new();
    }

    /// <summary>
    /// PC 및 여러 USB 드라이브에 분산 저장된 동일/구버전 공인인증서를 감지하고
    /// 안전하게 관리할 수 있도록 지원하는 순수 창작 C# 중복 탐지 엔진
    /// </summary>
    public static class KCertAntiDuplicationEngine
    {
        /// <summary>
        /// 수집된 인증서 메타데이터 목록으로부터 중복 클러스터를 분석합니다.
        /// </summary>
        public static DeduplicationReport AnalyzeDuplicates(IEnumerable<KCertMetadata> certs)
        {
            var certList = certs?.Where(c => c != null).ToList() ?? new List<KCertMetadata>();
            var report = new DeduplicationReport
            {
                TotalScannedCertCount = certList.Count
            };

            // SHA256 해시 및 시리얼 번호 기준으로 그룹핑
            var groupedByHash = certList
                .Where(c => !string.IsNullOrEmpty(c.DerSha256))
                .GroupBy(c => c.DerSha256, StringComparer.OrdinalIgnoreCase);

            var duplicateGroups = new List<DuplicateCertGroup>();
            int uniqueCount = 0;

            foreach (var grp in groupedByHash)
            {
                uniqueCount++;
                var items = grp.ToList();
                if (items.Count > 1)
                {
                    var first = items[0];
                    duplicateGroups.Add(new DuplicateCertGroup
                    {
                        FingerprintSha256 = grp.Key,
                        SerialNumber = first.SerialNumber,
                        CommonName = first.CommonName,
                        Issuer = first.Issuer,
                        ValidTo = first.ValidTo,
                        Instances = items
                    });
                }
            }

            report.UniqueCertCount = uniqueCount;
            report.Groups = duplicateGroups.OrderByDescending(g => g.TotalCopies).ToList();
            return report;
        }
    }
}
