using System;
using System.Collections.Generic;
using System.IO;
using KCert.Core.HardwareGuard;
using KCertManager.Wpf.Models;

namespace KCertManager.Wpf.Services
{
    public class UsbDriveWatcher : IDisposable
    {
        private readonly UsbStorageGuard _guard = new();
        private System.Threading.Timer? _heartbeatTimer;
        private HashSet<string> _lastDrivesSnapshot = new(StringComparer.OrdinalIgnoreCase);
        private readonly object _snapshotLock = new();

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
            _heartbeatTimer = new System.Threading.Timer(CheckDrivesHeartbeat, null, 2000, 2000);
        }

        private void InitializeDrivesSnapshot()
        {
            lock (_snapshotLock)
            {
                _lastDrivesSnapshot = CaptureDrivesSnapshot();
            }
        }

        private static HashSet<string> CaptureDrivesSnapshot()
        {
            var snapshot = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            try
            {
                foreach (var d in DriveInfo.GetDrives())
                {
                    try
                    {
                        if (d != null && d.IsReady)
                        {
                            snapshot.Add($"{d.Name}|{d.VolumeLabel}|{d.TotalSize}|{d.DriveType}");
                        }
                    }
                    catch { }
                }
            }
            catch { }
            return snapshot;
        }

        private void CheckDrivesHeartbeat(object? state)
        {
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

        private static Dictionary<string, PhysicalDiskInfo> QueryPhysicalDisks()
        {
            var map = new Dictionary<string, PhysicalDiskInfo>(StringComparer.OrdinalIgnoreCase);
            try
            {
                var drives = DriveInfo.GetDrives();
                foreach (var d in drives)
                {
                    try
                    {
                        string cleanKey = d.Name.TrimEnd('\\').ToUpperInvariant();
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
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[Native Physical Disk Query Warning] {ex.Message}");
            }

            return map;
        }

        public static List<DriveItem> GetAvailableDrives()
        {
            var list = new List<DriveItem>();
            DriveInfo[]? drives = null;

            try
            {
                drives = DriveInfo.GetDrives();
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[DriveInfo.GetDrives Error] {ex.Message}");
                return list;
            }

            if (drives == null) return list;

            var physicalMap = QueryPhysicalDisks();
            string systemDriveRoot = Path.GetPathRoot(Environment.SystemDirectory) ?? "C:\\";

            foreach (var d in drives)
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

                    bool isReady = false;
                    try { isReady = d.IsReady; } catch { isReady = false; }

                    string volumeLabel = "";
                    string fileSystem = "NTFS";
                    long totalSize = 0;
                    long freeSpace = 0;

                    if (isReady)
                    {
                        try { volumeLabel = d.VolumeLabel ?? ""; } catch { volumeLabel = ""; }
                        try { fileSystem = d.DriveFormat ?? "NTFS"; } catch { fileSystem = "NTFS"; }
                        try { totalSize = d.TotalSize; } catch { totalSize = 0; }
                        try { freeSpace = d.AvailableFreeSpace; } catch { freeSpace = 0; }
                    }

                    string cleanLetter = driveName.TrimEnd('\\').ToUpperInvariant();

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
                        modelUpper.Contains("CLOUD") || modelUpper.Contains("BOX") ||
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
                        DeviceKind = kind,
                        DeviceKindName = kindName,
                        BusType = busType,
                        DiskMediaType = diskMediaType,
                        PhysicalModel = physicalModel,
                        PhysicalPortDetail = portDetail,
                        FileSystem = fileSystem
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
