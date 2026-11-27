using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;

namespace KCert.Core.Vault
{
    public enum TransferConflictStrategy
    {
        Overwrite = 0,
        RenameBackup = 1,
        Skip = 2
    }

    public enum TransferPlanAction
    {
        CopyNew = 0,
        Overwrite = 1,
        ArchiveAndCopy = 2,
        SkipSelfCopy = 3,
        SkipDuplicateConflict = 4,
        SkipBatchDuplicate = 5,
        InvalidSource = 6
    }

    public record TransferSourceSpec
    {
        public string Id { get; init; } = string.Empty;
        public string CommonName { get; init; } = string.Empty;
        public string Category { get; init; } = "NPKI";
        public string IssuerName { get; init; } = string.Empty;
        public string SerialNumber { get; init; } = string.Empty;
        public string DirectoryPath { get; init; } = string.Empty;
        public string DerFilePath { get; init; } = string.Empty;
        public string KeyFilePath { get; init; } = string.Empty;
        public string DriveLetter { get; init; } = string.Empty;
        public bool IsRemovableSource { get; init; }
        public DateTime NotAfter { get; init; }
    }

    public record ExistingTargetCertSnapshot
    {
        public string DirectoryPath { get; init; } = string.Empty;
        public string DerFilePath { get; init; } = string.Empty;
        public string DriveLetter { get; init; } = string.Empty;
        public string Category { get; init; } = string.Empty;
        public string CommonName { get; init; } = string.Empty;
        public string IssuerName { get; init; } = string.Empty;
        public string SerialNumber { get; init; } = string.Empty;
    }

    public record TransferTargetEndpoint
    {
        public string TargetDriveRoot { get; init; } = "C:\\";
        public string TargetDriveLabel { get; init; } = "C:";
        public bool IsTargetRemovable { get; init; }
        public string TargetUsername { get; init; } = string.Empty;
    }

    public record TransferPlanItem
    {
        public TransferSourceSpec Source { get; init; } = new();
        public TransferPlanAction Action { get; init; }
        public bool IsExecutable =>
            Action == TransferPlanAction.CopyNew ||
            Action == TransferPlanAction.Overwrite ||
            Action == TransferPlanAction.ArchiveAndCopy;
        public bool IsConflict { get; init; }
        public string RelativeSubPath { get; init; } = string.Empty;
        public string DestinationRoot { get; init; } = string.Empty;
        public string ExpectedDestinationDirectory { get; init; } = string.Empty;
        public string CollidingTargetDerFilePath { get; init; } = string.Empty;
        public string NormalizedDestinationKey { get; init; } = string.Empty;
        public string Reason { get; init; } = string.Empty;
    }

    public record TransferPlanSummary
    {
        public int TotalRequested { get; init; }
        public int ExecutableCount { get; init; }
        public int CopyNewCount { get; init; }
        public int OverwriteCount { get; init; }
        public int ArchiveCount { get; init; }
        public int ConflictCount { get; init; }
        public int SkippedCount { get; init; }
        public int SkippedSelfCopyCount { get; init; }
        public int SkippedConflictCount { get; init; }
        public int SkippedBatchDuplicateCount { get; init; }
        public int InvalidSourceCount { get; init; }
        public bool HasConflicts => ConflictCount > 0;
        public bool HasExecutableItems => ExecutableCount > 0;
        public bool IsAllSelfCopy { get; init; }
        public string PreviewSummaryText { get; init; } = string.Empty;
    }

    public record TransferPlan
    {
        public string PlanId { get; init; } = string.Empty;
        public string DirectionLabel { get; init; } = string.Empty;
        public TransferTargetEndpoint TargetEndpoint { get; init; } = new();
        public TransferConflictStrategy ConflictStrategy { get; init; }
        public List<TransferPlanItem> Items { get; init; } = new();
        public TransferPlanSummary Summary { get; init; } = new();

        public IEnumerable<TransferPlanItem> ExecutableItems => Items.Where(i => i.IsExecutable);
        public IEnumerable<TransferPlanItem> ConflictItems => Items.Where(i => i.IsConflict);
    }

    public record TransferItemExecutionResult
    {
        public TransferPlanItem PlanItem { get; init; } = new();
        public bool IsSuccess { get; init; }
        public bool WasSkipped { get; init; }
        public string DestinationDirectory { get; init; } = string.Empty;
        public string BackupArchiveDirectory { get; init; } = string.Empty;
        public string DerSha256 { get; init; } = string.Empty;
        public long TotalBytesCopied { get; init; }
        public string FileSizeDetails { get; init; } = string.Empty;
        public string Message { get; init; } = string.Empty;
    }

    public record TransferBatchExecutionResult
    {
        public TransferPlan Plan { get; init; } = new();
        public int SuccessCount { get; init; }
        public int SkippedCount { get; init; }
        public int FailedCount { get; init; }
        public List<TransferItemExecutionResult> ItemResults { get; init; } = new();
        public List<string> SuccessfulDestinations { get; init; } = new();
        public List<string> FailedMessages { get; init; } = new();
        public string LastSuccessDestinationPath { get; init; } = string.Empty;
        public string LastSuccessFileSizeDetails { get; init; } = string.Empty;
    }

    public static class UnifiedTransferPlanner
    {
        public static TransferConflictStrategy ParseConflictStrategy(string? option)
        {
            if (string.Equals(option, "skip", StringComparison.OrdinalIgnoreCase))
                return TransferConflictStrategy.Skip;
            if (string.Equals(option, "rename", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(option, "archive_old", StringComparison.OrdinalIgnoreCase))
                return TransferConflictStrategy.RenameBackup;
            return TransferConflictStrategy.Overwrite;
        }

        public static string NormalizeDriveRoot(string? targetDriveLetter)
        {
            if (string.IsNullOrWhiteSpace(targetDriveLetter))
            {
                return (Path.GetPathRoot(Environment.SystemDirectory) ?? "C:\\").TrimEnd('\\', '/') + "\\";
            }

            string trimmed = targetDriveLetter.Trim();
            if (trimmed.Length == 1 && char.IsLetter(trimmed[0]))
            {
                return char.ToUpperInvariant(trimmed[0]) + ":\\";
            }
            if (trimmed.Length >= 2 && char.IsLetter(trimmed[0]) && trimmed[1] == ':')
            {
                return char.ToUpperInvariant(trimmed[0]) + ":\\";
            }

            var match = Regex.Match(trimmed, @"(?:^|[^A-Za-z])([A-Za-z]):");
            if (match.Success)
            {
                return match.Groups[1].Value.ToUpperInvariant() + ":\\";
            }

            return trimmed.TrimEnd('\\', '/') + "\\";
        }

        public static string ResolveDestinationRoot(
            string targetDriveLetter,
            string category,
            string? sourceDirectory,
            string? targetUsername = null)
        {
            string cleanDriveRoot = NormalizeDriveRoot(targetDriveLetter);
            string sysRoot = NormalizeDriveRoot(Path.GetPathRoot(Environment.SystemDirectory) ?? "C:\\");
            var userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            bool isSystemDrive = string.Equals(cleanDriveRoot, sysRoot, StringComparison.OrdinalIgnoreCase);

            bool isGpki = string.Equals(category, "GPKI", StringComparison.OrdinalIgnoreCase) ||
                          string.Equals(category, "GPKI_GOV", StringComparison.OrdinalIgnoreCase) ||
                          (!string.IsNullOrWhiteSpace(sourceDirectory) &&
                           Regex.IsMatch(sourceDirectory, @"(?:^|[\\/])GPKI(?:$|[\\/])", RegexOptions.IgnoreCase));

            if (!isSystemDrive)
            {
                return Directory.Exists(cleanDriveRoot)
                    ? cleanDriveRoot
                    : (isGpki ? sysRoot : Path.Combine(userProfile, "AppData", "LocalLow"));
            }

            if (isGpki)
            {
                try
                {
                    if (Directory.Exists(sysRoot))
                    {
                        return sysRoot;
                    }
                }
                catch
                {
                    // Fallback below if root access restricted
                }
                return Path.Combine(userProfile, "AppData", "LocalLow");
            }

            string effectiveUser = string.IsNullOrWhiteSpace(targetUsername) ? Environment.UserName : targetUsername;
            if (!Directory.Exists(cleanDriveRoot) ||
                string.Equals(effectiveUser, Environment.UserName, StringComparison.OrdinalIgnoreCase))
            {
                return Path.Combine(userProfile, "AppData", "LocalLow");
            }

            return Path.Combine(cleanDriveRoot, "Users", effectiveUser, "AppData", "LocalLow");
        }

        public static string NormalizeFullDirectoryPath(string? path)
        {
            if (string.IsNullOrWhiteSpace(path)) return string.Empty;
            try
            {
                return Path.GetFullPath(path).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            }
            catch
            {
                return path.Replace('/', '\\').TrimEnd('\\').Trim();
            }
        }

        private static bool IsSharedClassFolder(string? dirPath)
        {
            if (string.IsNullOrWhiteSpace(dirPath)) return false;
            var norm = dirPath.Replace('/', '\\').TrimEnd('\\');
            return Regex.IsMatch(
                norm,
                @"(?:^|\\)(?:GPKI|EPKI|MPKI)\\Certificate(?:\\class[123])?$",
                RegexOptions.IgnoreCase);
        }

        public static TransferPlan BuildPlan(
            IEnumerable<TransferSourceSpec> sources,
            TransferTargetEndpoint targetEndpoint,
            TransferConflictStrategy conflictStrategy = TransferConflictStrategy.Overwrite,
            IEnumerable<ExistingTargetCertSnapshot>? existingTargetCerts = null,
            bool checkPhysicalDiskForDuplicates = true)
        {
            var sourceList = (sources ?? Enumerable.Empty<TransferSourceSpec>()).Where(s => s != null).ToList();
            string cleanDriveRoot = NormalizeDriveRoot(targetEndpoint.TargetDriveRoot);
            string cleanDrivePrefix = cleanDriveRoot.TrimEnd('\\');
            var existingList = (existingTargetCerts ?? Enumerable.Empty<ExistingTargetCertSnapshot>()).ToList();

            bool anyUsbSource = sourceList.Any(s => s.IsRemovableSource);
            string directionLabel = (anyUsbSource, targetEndpoint.IsTargetRemovable) switch
            {
                (false, true) => "PC ➔ USB 백업",
                (true, false) => "USB ➔ PC 복원",
                (true, true) => "USB ➔ USB 복사",
                _ => "디스크 ➔ 디스크 복사"
            };

            var seenDestDirs = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var items = new List<TransferPlanItem>();

            foreach (var src in sourceList)
            {
                if (string.IsNullOrWhiteSpace(src.DirectoryPath))
                {
                    items.Add(new TransferPlanItem
                    {
                        Source = src,
                        Action = TransferPlanAction.InvalidSource,
                        Reason = "원본 인증서 폴더 경로가 비어 있습니다."
                    });
                    continue;
                }

                string relSubPath = CertTransferEngine.ResolveRelativePath(
                    src.DirectoryPath,
                    src.Category,
                    src.CommonName,
                    src.DerFilePath);
                string destRoot = ResolveDestinationRoot(
                    cleanDriveRoot,
                    src.Category,
                    src.DirectoryPath,
                    targetEndpoint.TargetUsername);
                string expectedDstDir = NormalizeFullDirectoryPath(Path.Combine(destRoot, relSubPath));
                string currentSrcDir = NormalizeFullDirectoryPath(src.DirectoryPath);

                string srcDerFileName = !string.IsNullOrWhiteSpace(src.DerFilePath)
                    ? Path.GetFileName(src.DerFilePath.Trim())
                    : string.Empty;
                bool isSharedTargetDir = IsSharedClassFolder(expectedDstDir);
                string normalizedDestKey = !string.IsNullOrWhiteSpace(srcDerFileName)
                    ? expectedDstDir + "\\" + srcDerFileName
                    : (isSharedTargetDir && !string.IsNullOrWhiteSpace(src.CommonName)
                        ? expectedDstDir + "\\" + src.CommonName.Trim()
                        : expectedDstDir);

                // 1. Self-Copy Guard
                if (!string.IsNullOrEmpty(currentSrcDir) &&
                    string.Equals(currentSrcDir, expectedDstDir, StringComparison.OrdinalIgnoreCase))
                {
                    items.Add(new TransferPlanItem
                    {
                        Source = src,
                        Action = TransferPlanAction.SkipSelfCopy,
                        RelativeSubPath = relSubPath,
                        DestinationRoot = destRoot,
                        ExpectedDestinationDirectory = expectedDstDir,
                        NormalizedDestinationKey = normalizedDestKey,
                        Reason = $"이미 대상 드라이브({cleanDrivePrefix})의 동일 폴더에 보관 중 (자가 복사 제외)"
                    });
                    continue;
                }

                // 2. Multi-disk Batch Deduplication Guard (공유 GPKI/EPKI 폴더에서는 개별 인증서 파일 기준으로 중복 판별)
                if (seenDestDirs.Contains(normalizedDestKey))
                {
                    items.Add(new TransferPlanItem
                    {
                        Source = src,
                        Action = TransferPlanAction.SkipBatchDuplicate,
                        RelativeSubPath = relSubPath,
                        DestinationRoot = destRoot,
                        ExpectedDestinationDirectory = expectedDstDir,
                        NormalizedDestinationKey = normalizedDestKey,
                        Reason = $"동일 작업 내 중복 대상 경로({normalizedDestKey}) 자동 병합 생략"
                    });
                    continue;
                }

                // 3. Conflict Detection (Physical disk files + loaded certificate snapshots)
                bool hasPhysicalConflict = false;
                string collidingTargetDerFilePath = string.Empty;
                if (checkPhysicalDiskForDuplicates && !string.IsNullOrEmpty(expectedDstDir))
                {
                    try
                    {
                        if (Directory.Exists(expectedDstDir))
                        {
                            string? expectedTargetDerPath = !string.IsNullOrWhiteSpace(srcDerFileName)
                                ? Path.Combine(expectedDstDir, srcDerFileName)
                                : null;
                            bool sharedDiskFolder = isSharedTargetDir ||
                                                    CertTransferEngine.HasOtherSigningCertsInDirectory(expectedDstDir, expectedTargetDerPath);

                            if (sharedDiskFolder && !string.IsNullOrWhiteSpace(srcDerFileName))
                            {
                                var physicalHit = Directory.GetFiles(expectedDstDir)
                                    .FirstOrDefault(f => string.Equals(Path.GetFileName(f), srcDerFileName, StringComparison.OrdinalIgnoreCase));
                                if (!string.IsNullOrEmpty(physicalHit))
                                {
                                    hasPhysicalConflict = true;
                                    collidingTargetDerFilePath = physicalHit;
                                }
                            }
                            else if (!sharedDiskFolder)
                            {
                                var physicalHit = Directory.GetFiles(expectedDstDir)
                                    .FirstOrDefault(f => f.EndsWith(".der", StringComparison.OrdinalIgnoreCase) ||
                                                         f.EndsWith(".cer", StringComparison.OrdinalIgnoreCase) ||
                                                         f.EndsWith(".crt", StringComparison.OrdinalIgnoreCase) ||
                                                         f.EndsWith(".key", StringComparison.OrdinalIgnoreCase));
                                if (!string.IsNullOrEmpty(physicalHit))
                                {
                                    hasPhysicalConflict = true;
                                    collidingTargetDerFilePath = physicalHit;
                                }
                            }
                        }
                    }
                    catch
                    {
                        hasPhysicalConflict = false;
                    }
                }

                var matchedSnapshot = existingList.FirstOrDefault(c =>
                {
                    if (!string.IsNullOrWhiteSpace(c.DerFilePath) && !string.IsNullOrWhiteSpace(src.DerFilePath))
                    {
                        if (string.Equals(NormalizeFullDirectoryPath(c.DerFilePath), NormalizeFullDirectoryPath(src.DerFilePath), StringComparison.OrdinalIgnoreCase))
                            return false;
                    }
                    else if (string.Equals(NormalizeFullDirectoryPath(c.DirectoryPath), currentSrcDir, StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }

                    string cDrive = (c.DriveLetter ?? string.Empty).Trim().TrimEnd('\\', '/').ToUpperInvariant();
                    string cPath = (c.DirectoryPath ?? string.Empty).ToUpperInvariant();
                    bool onTargetDrive = cDrive == cleanDrivePrefix.ToUpperInvariant() ||
                                         cPath.StartsWith(cleanDrivePrefix.ToUpperInvariant() + "\\");
                    if (!onTargetDrive) return false;

                    string cDerFileName = !string.IsNullOrWhiteSpace(c.DerFilePath)
                        ? Path.GetFileName(c.DerFilePath.Trim())
                        : string.Empty;

                    if (string.Equals(NormalizeFullDirectoryPath(c.DirectoryPath), expectedDstDir, StringComparison.OrdinalIgnoreCase))
                    {
                        if (!isSharedTargetDir)
                            return true;

                        if (!string.IsNullOrWhiteSpace(srcDerFileName) && !string.IsNullOrWhiteSpace(cDerFileName) &&
                            string.Equals(cDerFileName, srcDerFileName, StringComparison.OrdinalIgnoreCase))
                        {
                            return true;
                        }
                    }

                    if (!string.IsNullOrWhiteSpace(src.SerialNumber) &&
                        string.Equals(c.SerialNumber, src.SerialNumber, StringComparison.OrdinalIgnoreCase) &&
                        string.Equals(c.IssuerName, src.IssuerName, StringComparison.OrdinalIgnoreCase))
                        return true;

                    bool hasDistinctSerials = !string.IsNullOrWhiteSpace(src.SerialNumber) &&
                                              !string.IsNullOrWhiteSpace(c.SerialNumber) &&
                                              !string.Equals(c.SerialNumber.Trim(), src.SerialNumber.Trim(), StringComparison.OrdinalIgnoreCase);
                    if (hasDistinctSerials)
                    {
                        return false;
                    }

                    bool hasDistinctNonGenericFile =
                        isSharedTargetDir &&
                        !string.IsNullOrWhiteSpace(srcDerFileName) &&
                        !string.IsNullOrWhiteSpace(cDerFileName) &&
                        !string.Equals(srcDerFileName, "signCert.der", StringComparison.OrdinalIgnoreCase) &&
                        !string.Equals(cDerFileName, "signCert.der", StringComparison.OrdinalIgnoreCase) &&
                        !string.Equals(srcDerFileName, cDerFileName, StringComparison.OrdinalIgnoreCase);
                    if (hasDistinctNonGenericFile)
                    {
                        return false;
                    }

                    return string.Equals(c.Category, src.Category, StringComparison.OrdinalIgnoreCase) &&
                           string.Equals(c.CommonName, src.CommonName, StringComparison.OrdinalIgnoreCase) &&
                           string.Equals(c.IssuerName, src.IssuerName, StringComparison.OrdinalIgnoreCase);
                });

                if (string.IsNullOrEmpty(collidingTargetDerFilePath) && matchedSnapshot != null && !string.IsNullOrWhiteSpace(matchedSnapshot.DerFilePath))
                {
                    collidingTargetDerFilePath = matchedSnapshot.DerFilePath;
                }

                bool hasSnapshotConflict = matchedSnapshot != null;
                bool isConflict = hasPhysicalConflict || hasSnapshotConflict;
                seenDestDirs.Add(normalizedDestKey);

                TransferPlanAction action;
                string reason;
                if (isConflict)
                {
                    switch (conflictStrategy)
                    {
                        case TransferConflictStrategy.Skip:
                            action = TransferPlanAction.SkipDuplicateConflict;
                            reason = "대상 드라이브에 동일 인증서가 이미 존재하여 건너뛰기(Skip)";
                            break;
                        case TransferConflictStrategy.RenameBackup:
                            action = TransferPlanAction.ArchiveAndCopy;
                            reason = "기존 인증서를 _backup 으로 안전 보존한 뒤 새 인증서 복사";
                            break;
                        default:
                            action = TransferPlanAction.Overwrite;
                            reason = "대상 드라이브 기존 인증서를 최신 파일로 덮어쓰기";
                            break;
                    }
                }
                else
                {
                    action = TransferPlanAction.CopyNew;
                    reason = $"신규 복사 ({normalizedDestKey})";
                }

                items.Add(new TransferPlanItem
                {
                    Source = src,
                    Action = action,
                    IsConflict = isConflict,
                    RelativeSubPath = relSubPath,
                    DestinationRoot = destRoot,
                    ExpectedDestinationDirectory = expectedDstDir,
                    CollidingTargetDerFilePath = collidingTargetDerFilePath,
                    NormalizedDestinationKey = normalizedDestKey,
                    Reason = reason
                });
            }

            int executableCount = items.Count(i => i.IsExecutable);
            int copyNewCount = items.Count(i => i.Action == TransferPlanAction.CopyNew);
            int overwriteCount = items.Count(i => i.Action == TransferPlanAction.Overwrite);
            int archiveCount = items.Count(i => i.Action == TransferPlanAction.ArchiveAndCopy);
            int conflictCount = items.Count(i => i.IsConflict);
            int selfCopyCount = items.Count(i => i.Action == TransferPlanAction.SkipSelfCopy);
            int skippedConflictCount = items.Count(i => i.Action == TransferPlanAction.SkipDuplicateConflict);
            int batchDupCount = items.Count(i => i.Action == TransferPlanAction.SkipBatchDuplicate);
            int invalidCount = items.Count(i => i.Action == TransferPlanAction.InvalidSource);
            int skippedTotal = selfCopyCount + skippedConflictCount + batchDupCount;
            bool isAllSelfCopy = items.Count > 0 && selfCopyCount == items.Count;

            string previewText;
            if (items.Count == 0)
            {
                previewText = "복사할 인증서를 선택해 주세요 (0건)";
            }
            else if (isAllSelfCopy)
            {
                previewText = $"선택한 {items.Count}건 모두 동일 위치(자가 복사)로 제한됨";
            }
            else if (executableCount == 0)
            {
                previewText = $"선택 {items.Count}건 모두 건너뛰기/중복 생략 예정 (실제 복사 0건)";
            }
            else
            {
                var parts = new List<string> { $"실제 복사 {executableCount}건" };
                if (overwriteCount > 0) parts.Add($"덮어쓰기 {overwriteCount}건");
                if (archiveCount > 0) parts.Add($"보존 {archiveCount}건");
                if (skippedTotal > 0) parts.Add($"생략 {skippedTotal}건");
                previewText = string.Join(" · ", parts);
            }

            return new TransferPlan
            {
                PlanId = Guid.NewGuid().ToString("N"),
                DirectionLabel = directionLabel,
                TargetEndpoint = targetEndpoint with { TargetDriveRoot = cleanDriveRoot },
                ConflictStrategy = conflictStrategy,
                Items = items,
                Summary = new TransferPlanSummary
                {
                    TotalRequested = items.Count,
                    ExecutableCount = executableCount,
                    CopyNewCount = copyNewCount,
                    OverwriteCount = overwriteCount,
                    ArchiveCount = archiveCount,
                    ConflictCount = conflictCount,
                    SkippedCount = skippedTotal,
                    SkippedSelfCopyCount = selfCopyCount,
                    SkippedConflictCount = skippedConflictCount,
                    SkippedBatchDuplicateCount = batchDupCount,
                    InvalidSourceCount = invalidCount,
                    IsAllSelfCopy = isAllSelfCopy,
                    PreviewSummaryText = previewText
                }
            };
        }
    }

    public static class UnifiedTransferExecutor
    {
        public static TransferBatchExecutionResult ExecutePlan(TransferPlan plan)
        {
            if (plan == null) throw new ArgumentNullException(nameof(plan));

            int success = 0;
            int skipped = 0;
            int failed = 0;
            var results = new List<TransferItemExecutionResult>();
            var successfulDestinations = new List<string>();
            var failedMessages = new List<string>();
            string lastSuccessDest = string.Empty;
            string lastSuccessFileSize = string.Empty;

            foreach (var item in plan.Items)
            {
                if (!item.IsExecutable)
                {
                    if (item.Action == TransferPlanAction.InvalidSource)
                    {
                        failed++;
                        string msg = string.IsNullOrWhiteSpace(item.Reason) ? "원본 인증서 경로가 유효하지 않습니다." : item.Reason;
                        failedMessages.Add($"{item.Source.CommonName}: {msg}");
                        results.Add(new TransferItemExecutionResult
                        {
                            PlanItem = item,
                            IsSuccess = false,
                            WasSkipped = false,
                            DestinationDirectory = item.ExpectedDestinationDirectory,
                            Message = msg
                        });
                    }
                    else
                    {
                        skipped++;
                        results.Add(new TransferItemExecutionResult
                        {
                            PlanItem = item,
                            IsSuccess = true,
                            WasSkipped = true,
                            DestinationDirectory = item.ExpectedDestinationDirectory,
                            Message = item.Reason
                        });
                    }
                    continue;
                }

                if (!Directory.Exists(item.Source.DirectoryPath))
                {
                    failed++;
                    string notFoundMsg = "원본 인증서 디렉터리를 찾을 수 없습니다.";
                    failedMessages.Add($"{item.Source.CommonName}: {notFoundMsg}");
                    results.Add(new TransferItemExecutionResult
                    {
                        PlanItem = item,
                        IsSuccess = false,
                        WasSkipped = false,
                        DestinationDirectory = item.ExpectedDestinationDirectory,
                        Message = notFoundMsg
                    });
                    continue;
                }

                string archiveBackupPath = string.Empty;

                // Archive existing directory (or colliding cert files in shared GPKI/EPKI folders) before copy
                if (item.Action == TransferPlanAction.ArchiveAndCopy &&
                    !string.IsNullOrWhiteSpace(item.ExpectedDestinationDirectory) &&
                    Directory.Exists(item.ExpectedDestinationDirectory))
                {
                    try
                    {
                        string baseBackupDir = $"{item.ExpectedDestinationDirectory}_backup_{DateTime.Now:yyyyMMdd_HHmmss}";
                        string backupDir = baseBackupDir;
                        int suffix = 1;
                        while (Directory.Exists(backupDir))
                        {
                            backupDir = $"{baseBackupDir}_{suffix++}";
                        }
                        string? collidingDerName = !string.IsNullOrWhiteSpace(item.CollidingTargetDerFilePath)
                            ? Path.GetFileName(item.CollidingTargetDerFilePath)
                            : (!string.IsNullOrWhiteSpace(item.Source.DerFilePath)
                                ? Path.GetFileName(item.Source.DerFilePath)
                                : null);
                        CertTransferEngine.ArchiveTargetForCopy(
                            item.ExpectedDestinationDirectory,
                            collidingDerName,
                            backupDir);
                        archiveBackupPath = backupDir;
                    }
                    catch (Exception ex)
                    {
                        failed++;
                        string archiveFailMsg = $"기존 폴더 백업 이름 변경 실패로 덮어쓰기를 중단했습니다: {ex.Message}";
                        failedMessages.Add($"{item.Source.CommonName}: {archiveFailMsg}");
                        results.Add(new TransferItemExecutionResult
                        {
                            PlanItem = item,
                            IsSuccess = false,
                            WasSkipped = false,
                            DestinationDirectory = item.ExpectedDestinationDirectory,
                            Message = archiveFailMsg
                        });
                        continue;
                    }
                }

                // Ensure GPKI target folder exists & is writable on system drive, otherwise fallback cleanly to LocalLow
                string effectiveDestRoot = item.DestinationRoot;
                bool isGpkiCategory = string.Equals(item.Source.Category, "GPKI", StringComparison.OrdinalIgnoreCase) ||
                                      string.Equals(item.Source.Category, "GPKI_GOV", StringComparison.OrdinalIgnoreCase);
                string sysRoot = UnifiedTransferPlanner.NormalizeDriveRoot(Path.GetPathRoot(Environment.SystemDirectory) ?? "C:\\");
                if (isGpkiCategory &&
                    !string.IsNullOrWhiteSpace(effectiveDestRoot) &&
                    string.Equals(UnifiedTransferPlanner.NormalizeDriveRoot(effectiveDestRoot), sysRoot, StringComparison.OrdinalIgnoreCase))
                {
                    try
                    {
                        string gpkiClass = Regex.IsMatch(item.RelativeSubPath, @"(?:^|[\\/])class1(?:$|[\\/])", RegexOptions.IgnoreCase)
                            ? "class1"
                            : "class2";
                        var gpkiDir = Path.Combine(effectiveDestRoot, "GPKI", "Certificate", gpkiClass);
                        if (!Directory.Exists(gpkiDir)) Directory.CreateDirectory(gpkiDir);

                        string probePath = Path.Combine(gpkiDir, $".kcert_probe_{Guid.NewGuid():N}.tmp");
                        using (File.Create(probePath)) { }
                        File.Delete(probePath);
                    }
                    catch
                    {
                        var userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
                        effectiveDestRoot = Path.Combine(userProfile, "AppData", "LocalLow");
                    }
                }

                var transfer = CertTransferEngine.Transfer(
                    item.Source.DirectoryPath,
                    effectiveDestRoot,
                    item.RelativeSubPath,
                    item.Source.DerFilePath,
                    item.Source.KeyFilePath);

                if (!transfer.IsSuccess &&
                    isGpkiCategory &&
                    (transfer.Message.Contains("권한", StringComparison.OrdinalIgnoreCase) ||
                     transfer.Message.Contains("denied", StringComparison.OrdinalIgnoreCase)))
                {
                    var userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
                    string fallbackRoot = Path.Combine(userProfile, "AppData", "LocalLow");
                    if (!string.Equals(effectiveDestRoot, fallbackRoot, StringComparison.OrdinalIgnoreCase))
                    {
                        var fallbackTransfer = CertTransferEngine.Transfer(
                            item.Source.DirectoryPath,
                            fallbackRoot,
                            item.RelativeSubPath,
                            item.Source.DerFilePath,
                            item.Source.KeyFilePath);
                        if (fallbackTransfer.IsSuccess)
                        {
                            transfer = fallbackTransfer;
                        }
                    }
                }

                string sizeDetails = transfer.CopiedFiles.Count > 0
                    ? string.Join(", ", transfer.CopiedFiles.Select(f => $"{f.FileName} ({f.FileSizeBytes:N0} bytes)"))
                    : $"{transfer.TotalBytesCopied:N0} bytes";

                if (transfer.IsSuccess)
                {
                    success++;
                    lastSuccessDest = transfer.DestinationDirectory;
                    lastSuccessFileSize = sizeDetails;
                    if (!string.IsNullOrWhiteSpace(transfer.DestinationDirectory))
                    {
                        successfulDestinations.Add(transfer.DestinationDirectory);
                    }
                }
                else
                {
                    failed++;
                    failedMessages.Add($"{item.Source.CommonName}: {transfer.Message}");
                }

                results.Add(new TransferItemExecutionResult
                {
                    PlanItem = item,
                    IsSuccess = transfer.IsSuccess,
                    WasSkipped = false,
                    DestinationDirectory = transfer.DestinationDirectory,
                    BackupArchiveDirectory = archiveBackupPath,
                    DerSha256 = transfer.DerSha256,
                    TotalBytesCopied = transfer.TotalBytesCopied,
                    FileSizeDetails = sizeDetails,
                    Message = transfer.Message
                });
            }

            return new TransferBatchExecutionResult
            {
                Plan = plan,
                SuccessCount = success,
                SkippedCount = skipped,
                FailedCount = failed,
                ItemResults = results,
                SuccessfulDestinations = successfulDestinations,
                FailedMessages = failedMessages,
                LastSuccessDestinationPath = lastSuccessDest,
                LastSuccessFileSizeDetails = lastSuccessFileSize
            };
        }
    }
}
