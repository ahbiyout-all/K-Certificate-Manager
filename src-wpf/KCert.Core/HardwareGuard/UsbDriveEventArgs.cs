using System;

namespace KCert.Core.HardwareGuard
{
    public enum UsbChangeType
    {
        DeviceArrival,
        DeviceRemoval,
        GeneralChange
    }

    public class UsbDriveEventArgs : EventArgs
    {
        public UsbChangeType ChangeType { get; }
        public string DriveName { get; }
        public DateTime Timestamp { get; }

        public UsbDriveEventArgs(UsbChangeType changeType, string driveName = "")
        {
            ChangeType = changeType;
            DriveName = driveName;
            Timestamp = DateTime.Now;
        }
    }
}
