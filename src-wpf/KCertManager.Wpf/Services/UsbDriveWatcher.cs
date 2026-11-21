using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using KCert.Core.HardwareGuard;
using KCertManager.Wpf.Models;

namespace KCertManager.Wpf.Services
{
    public class UsbDriveWatcher : IDisposable
    {
        private readonly UsbStorageGuard _guard = new();
        private Timer? _heartbeatTimer;
        private HashSet<string> _lastDrivesSnapshot = new(StringComparer.OrdinalIgnoreCase);
        private readonly object _snapshotLock = new();
        private int _heartbeatRunning;

        public event EventHandler? DrivesChanged;
        public event EventHandler<string>? DriveArrived;
        public event EventHandler<string>? DriveRemoved;

        public void Start()
        {
            _guard.DrivesChanged += (s, e) =>
            {
                try
                {
                    DrivesChanged?.Invoke(this, EventArgs.Empty);
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"[DrivesChanged Event Error] {ex.Message}");
                }
            };

            _guard.DriveArrived += (s, e) =>
            {
                try
                {
                    DriveArrived?.Invoke(this, e.DriveName);
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"[DriveArrived Event Error] {ex.Message}");
                }
            };

            _guard.DriveRemoved += (s, e) =>
            {
                try
                {
                    DriveRemoved?.Invoke(this, e.DriveName);
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"[DriveRemoved Event Error] {ex.Message}");
                }
            };

            _guard.Start();

            // 백그라운드 드라이브 상태 스냅샷 폴링 (WMI 이벤트 누락 및 동일 드라이브 문자 USB 교체 완벽 감지)
            InitializeDrivesSnapshot();
            _heartbeatTimer = new Timer(CheckDrivesHeartbeat, null, 3500, 3000);
        }

        private void InitializeDrivesSnapshot()
        {
            var initial = CaptureDrivesSnapshot();
            lock (_snapshotLock)
            {
                _lastDrivesSnapshot = initial;
            }
        }

        private static bool IsCandidateLocalOrRemovableDrive(DriveInfo? d)
        {
            if (d == null) return false;
            try
            {
                var dt = d.DriveType;
                if (dt != DriveType.Fixed && dt != DriveType.Removable) return false;

                string rootPath = d.Name.EndsWith("\\") ? d.Name : d.Name + "\\";
                uint win32Type = NativeStorageInterop.GetDriveType(rootPath);
                return win32Type == NativeStorageInterop.DRIVE_FIXED ||
                       win32Type == NativeStorageInterop.DRIVE_REMOVABLE;
            }
            catch
            {
                return false;
            }
        }

        private static HashSet<string> CaptureDrivesSnapshot()
        {
            var snapshot = new ConcurrentDictionary<string, byte>(StringComparer.OrdinalIgnoreCase);
            try
            {
                var candidates = DriveInfo.GetDrives().Where(IsCandidateLocalOrRemovableDrive).ToList();
                var tasks = candidates.Select(d => Task.Run(() =>
                {
                    try
                    {
                        var probe = Task.Run(() =>
                        {
                            try
                            {
                                if (d.IsReady)
                                {
                                    snapshot.TryAdd($"{d.Name}|{d.VolumeLabel}|{d.TotalSize}|{d.DriveType}", 0);
                                }
                            }
                            catch { }
                        });
                        probe.Wait(1000);
                    }
                    catch { }
                })).ToArray();

                Task.WaitAll(tasks, 1300);
            }
            catch { }
            return new HashSet<string>(snapshot.Keys, StringComparer.OrdinalIgnoreCase);
        }

        private void CheckDrivesHeartbeat(object? state)
        {
            if (Interlocked.Exchange(ref _heartbeatRunning, 1) == 1)
            {
                return;
            }

            try
            {
                var currentSnapshot = CaptureDrivesSnapshot();
                bool changed = false;

                lock (_snapshotLock)
                {
                    if (!_lastDrivesSnapshot.SetEquals(currentSnapshot))
                    {
                        _lastDrivesSnapshot = currentSnapshot;
                        changed = true;
                    }
                }

                if (changed)
                {
                    TriggerDeviceChange();
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[Drive Heartbeat Error] {ex.Message}");
            }
            finally
            {
                Interlocked.Exchange(ref _heartbeatRunning, 0);
            }
        }

        /// <summary>
        /// 윈도우 하드웨어 메시지(WM_DEVICECHANGE) 또는 수동 알림 시 캐시를 즉시 파기하고 변경 이벤트를 발생시킵니다.
        /// </summary>
        public void TriggerDeviceChange(string? hintDrive = null)
        {
            try
            {
                UsbStorageGuard.InvalidateUsbCache();
                KCert.Core.Discovery.CertLocationScanner.ClearRemovableDriveCache();
                _guard.TriggerManualChange(UsbChangeType.DeviceArrival, hintDrive ?? string.Empty);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[TriggerDeviceChange Error] {ex.Message}");
            }
        }

        private class PhysicalDiskInfo
        {
            public string Model { get; set; } = string.Empty;
            public string BusType { get; set; } = string.Empty;
            public string DiskType { get; set; } = string.Empty;
            public string PortDetail { get; set; } = string.Empty;
            public bool IsOpticalOrCdRom { get; set; }
        }

        private static Dictionary<string, PhysicalDiskInfo> QueryPhysicalDisks(IEnumerable<DriveInfo> candidateDrives)
        {
            var map = new ConcurrentDictionary<string, PhysicalDiskInfo>(StringComparer.OrdinalIgnoreCase);
            try
            {
                var tasks = candidateDrives.Select(d => Task.Run(() =>
                {
                    try
                    {
                        string cleanKey = d.Name.TrimEnd('\\').ToUpperInvariant();
                        var probe = Task.Run(() =>
                        {
                            try
                            {
                                var details = NativeStorageInterop.QueryDriveDetails(cleanKey);
                                if (details != null)
                                {
                                    map[cleanKey] = new PhysicalDiskInfo
                                    {
                                        Model = details.Model,
                                        BusType = details.BusTypeName,
                                        DiskType = details.DiskMediaType,
                                        PortDetail = details.PhysicalPortDetail,
                                        IsOpticalOrCdRom = details.IsOpticalOrCdRom
                                    };
                                }
                            }
                            catch { }
                        });
                        probe.Wait(1000);
                    }
                    catch { }
                })).ToArray();

                Task.WaitAll(tasks, 1300);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[Native Physical Disk Query Warning] {ex.Message}");
            }

            return new Dictionary<string, PhysicalDiskInfo>(map, StringComparer.OrdinalIgnoreCase);
        }

        public static List<DriveItem> GetAvailableDrives()
        {
            var list = new List<DriveItem>();
            List<DriveInfo> candidateDrives;

            try
            {
                candidateDrives = (DriveInfo.GetDrives() ?? Array.Empty<DriveInfo>())
                    .Where(IsCandidateLocalOrRemovableDrive)
                    .ToList();
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[DriveInfo.GetDrives Error] {ex.Message}");
                return list;
            }

            if (candidateDrives.Count == 0) return list;

            var physicalMap = QueryPhysicalDisks(candidateDrives);
            string systemDriveRoot = Path.GetPathRoot(Environment.SystemDirectory) ?? "C:\\";

            var metadataMap = new ConcurrentDictionary<string, (bool IsReady, string VolumeLabel, string FileSystem, long TotalSize, long FreeSpace)>(StringComparer.OrdinalIgnoreCase);
            try
            {
                var metaTasks = candidateDrives.Select(d => Task.Run(() =>
                {
                    try
                    {
                        string key = d.Name.TrimEnd('\\').ToUpperInvariant();
                        bool isSystemDrive = string.Equals(d.Name, systemDriveRoot, StringComparison.OrdinalIgnoreCase);

                        var probe = Task.Run(() =>
                        {
                            bool ready = false;
                            string vol = "";
                            string fs = "NTFS";
                            long total = 0;
                            long free = 0;

                            try { ready = d.IsReady; } catch { ready = false; }
                            if (ready)
                            {
                                try { vol = d.VolumeLabel ?? ""; } catch { vol = ""; }
                                try { fs = d.DriveFormat ?? "NTFS"; } catch { fs = "NTFS"; }
                                try { total = d.TotalSize; } catch { total = 0; }
                                try { free = d.AvailableFreeSpace; } catch { free = 0; }
                            }

                            metadataMap[key] = (ready, vol, fs, total, free);
                        });

                        probe.Wait(isSystemDrive ? 2500 : 1200);
                    }
                    catch { }
                })).ToArray();

                Task.WaitAll(metaTasks, 1600);
            }
            catch { }

            foreach (var d in candidateDrives)
            {
                try
                {
                    if (d == null) continue;

                    string driveName = "";
                    try { driveName = d.Name; } catch { continue; }

                    bool isRemovable = false;
                    try { isRemovable = (d.DriveType == DriveType.Removable); } catch { }

                    bool isCdRom = false;
                    try { isCdRom = (d.DriveType == DriveType.CDRom); } catch { }
                    if (!isCdRom)
                    {
                        try
                        {
                            string rootPath = driveName.EndsWith("\\") ? driveName : driveName + "\\";
                            if (NativeStorageInterop.GetDriveType(rootPath) == NativeStorageInterop.DRIVE_CDROM)
                            {
                                isCdRom = true;
                            }
                        }
                        catch { }
                    }

                    bool isNonSystemFixed = (d.DriveType == DriveType.Fixed) && !string.Equals(d.Name, systemDriveRoot, StringComparison.OrdinalIgnoreCase);
                    bool isSystem = string.Equals(driveName, systemDriveRoot, StringComparison.OrdinalIgnoreCase);

                    string cleanLetter = driveName.TrimEnd('\\').ToUpperInvariant();
                    bool isReady = false;
                    string volumeLabel = "";
                    string fileSystem = "NTFS";
                    long totalSize = 0;
                    long freeSpace = 0;

                    if (metadataMap.TryGetValue(cleanLetter, out var meta))
                    {
                        isReady = meta.IsReady;
                        volumeLabel = meta.VolumeLabel;
                        fileSystem = meta.FileSystem;
                        totalSize = meta.TotalSize;
                        freeSpace = meta.FreeSpace;
                    }

                    string formatUpper = (fileSystem ?? "").ToUpperInvariant();
                    bool isOpticalFormat = formatUpper == "CDFS" || formatUpper == "UDF" || formatUpper == "ISO9660";
                    if (isOpticalFormat)
                    {
                        isCdRom = true;
                    }

                    string busType = "SATA";
                    string diskMediaType = "SSD";
                    string portDetail = "내장 SATA3 SSD";
                    string physicalModel = "";

                    if (physicalMap.TryGetValue(cleanLetter, out var phys))
                    {
                        busType = phys.BusType;
                        diskMediaType = phys.DiskType;
                        portDetail = phys.PortDetail;
                        physicalModel = phys.Model;
                        if (phys.IsOpticalOrCdRom)
                        {
                            isCdRom = true;
                        }
                    }
                    else
                    {
                        if (isCdRom)
                        {
                            busType = "CD-ROM";
                            diskMediaType = "Optical";
                            portDetail = "가상/물리 CD/DVD-ROM";
                            physicalModel = "Virtual/Physical CD-ROM Drive";
                        }
                        else if (isSystem)
                        {
                            busType = "NVMe";
                            diskMediaType = "SSD";
                            portDetail = "내장 NVMe M.2 SSD";
                            physicalModel = "System NVMe SSD";
                        }
                        else if (isNonSystemFixed)
                        {
                            busType = "SATA";
                            diskMediaType = totalSize > 400L * 1024 * 1024 * 1024 ? "HDD" : "SSD";
                            portDetail = diskMediaType == "HDD" ? "내장 SATA 포트 HDD" : "내장 SATA3 SSD";
                            physicalModel = diskMediaType == "HDD" ? "Internal SATA Harddisk" : "Internal SATA SSD";
                        }
                        else if (isRemovable)
                        {
                            busType = "USB";
                            diskMediaType = "Flash";
                            portDetail = "이동식 USB 메모리";
                            physicalModel = "USB Storage Device";
                        }
                        else
                        {
                            busType = "SATA";
                            diskMediaType = "HDD";
                            portDetail = "보조 로컬 디스크";
                            physicalModel = "Local Storage Device";
                        }
                    }

                    // 가상 시디롬, 가상 디스크, 클라우드 드라이브(구글 드라이브, 원드라이브, 드롭박스 등) 필터링
                    string modelUpper = (physicalModel ?? "").ToUpperInvariant();
                    string volUpper = (volumeLabel ?? "").ToUpperInvariant();
                    string fsUpper = (fileSystem ?? "").ToUpperInvariant();

                    bool isVirtualOrCloud = 
                        // 1. CD/DVD/광학/ISO
                        isCdRom || isOpticalFormat ||
                        modelUpper.Contains("CDROM") || modelUpper.Contains("CD-ROM") ||
                        modelUpper.Contains("DVD") || modelUpper.Contains("ISO") ||
                        volUpper.Contains("CDROM") || volUpper.Contains("CD-ROM") ||
                        volUpper.Contains("DVD") || volUpper.Contains("ISO") ||
                        // 2. 가상 디스크 (Virtual, RAMDisk, VHD, ImDisk 등)
                        busType == "Virtual" ||
                        modelUpper.Contains("VIRTUAL") || modelUpper.Contains("CLONEDRIVE") ||
                        modelUpper.Contains("WINCDE") || modelUpper.Contains("DAEMON") ||
                        modelUpper.Contains("POWERISO") || modelUpper.Contains("ULTRAISO") ||
                        modelUpper.Contains("IMDISK") || modelUpper.Contains("ALCOHOL") ||
                        modelUpper.Contains("RAMDISK") || modelUpper.Contains("VMWARE") ||
                        modelUpper.Contains("VBOX") || modelUpper.Contains("VHD") ||
                        volUpper.Contains("RAMDISK") || volUpper.Contains("VIRTUAL") ||
                        // 3. 클라우드 드라이브 (구글 드라이브, 원드라이브, 드롭박스, 레이드라이브 등)
                        modelUpper.Contains("GOOGLE") || modelUpper.Contains("ONEDRIVE") ||
                        modelUpper.Contains("DROPBOX") || modelUpper.Contains("RAIDRIVE") ||
                        modelUpper.Contains("CLOUD") || modelUpper.Contains("BOX DRIVE") ||
                        modelUpper.Contains("BOX SYNC") ||
                        volUpper.Contains("GOOGLE") || volUpper.Contains("구글") ||
                        volUpper.Contains("ONEDRIVE") || volUpper.Contains("ONE DRIVE") ||
                        volUpper.Contains("DROPBOX") || volUpper.Contains("드롭박스") ||
                        volUpper.Contains("ICLOUD") || volUpper.Contains("RAIDRIVE") ||
                        volUpper.Contains("CLOUD") || fsUpper.Contains("GOOGLE") || fsUpper.Contains("CLOUD");

                    if (isVirtualOrCloud)
                    {
                        // 시디롬, 가상디스크, 구글 드라이브/기타 클라우드 드라이브는 목록 표시에서 완전히 제외
                        continue;
                    }

                    // 외장 USB 또는 보조 고정 드라이브(Fixed)일 때 기본 라벨
                    if (string.IsNullOrWhiteSpace(volumeLabel))
                    {
                        volumeLabel = isRemovable ? "이동식 디스크" : (isNonSystemFixed ? "보조 드라이브" : "로컬 디스크");
                    }

                    string kind = "usb_flash";
                    string kindName = "이동식 USB 메모리";

                    if (busType == "NVMe")
                    {
                        kind = "internal_nvme";
                        kindName = "내장 NVMe SSD";
                    }
                    else if (busType == "SATA")
                    {
                        kind = diskMediaType == "HDD" ? "internal_sata_hdd" : "internal_sata_ssd";
                        kindName = diskMediaType == "HDD" ? "내장 SATA HDD" : "내장 SATA SSD";
                    }
                    else if (busType == "USB")
                    {
                        if (diskMediaType == "SSD" || totalSize > 200L * 1024 * 1024 * 1024)
                        {
                            kind = "external_ssd";
                            kindName = "외장 SSD";
                        }
                        else
                        {
                            kind = "usb_flash";
                            kindName = "이동식 USB 메모리";
                        }
                    }
                    else
                    {
                        kind = "internal_fixed";
                        kindName = "보조 로컬 디스크";
                    }

                    list.Add(new DriveItem
                    {
                        Name = driveName,
                        VolumeLabel = volumeLabel,
                        TotalSize = totalSize,
                        FreeSpace = freeSpace,
                        IsRemovable = (isRemovable || busType == "USB"),
                        IsReady = isReady,
                        IsCdRom = false,
                        DriveType = isRemovable ? DriveType.Removable : (isCdRom ? DriveType.CDRom : DriveType.Fixed),
                        DeviceKind = kind,
                        DeviceKindName = kindName,
                        BusType = busType,
                        DiskMediaType = diskMediaType,
                        PhysicalModel = physicalModel ?? "",
                        PhysicalPortDetail = portDetail,
                        FileSystem = fileSystem ?? "NTFS"
                    });
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"[Single Drive Parse Warning] {ex.Message}");
                }
            }

            return list;
        }

        public void Dispose()
        {
            _heartbeatTimer?.Dispose();
            _guard.Dispose();
        }
    }
}
