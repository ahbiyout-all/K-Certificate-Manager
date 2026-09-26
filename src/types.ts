export type CertCategory = 'NPKI_BANK' | 'NPKI_CORP' | 'GPKI_GOV' | 'EPKI_EDU';

export type AppTheme = 'dark' | 'gray' | 'white' | 'beige' | 'pastel-white' | 'pastel-gray' | 'pastel-black' | 'pastel-beige' | 'classic';

export type CertStatus = 'valid' | 'expiring' | 'expired';

export interface CertFileDetail {
  certName: string; // signCert.der or SignCert.der
  keyName: string;  // signPri.key or SignPri.key
  kmCertName?: string; // kmCert.der (GPKI 암호화용)
  kmKeyName?: string;  // kmPri.key (GPKI 암호화용)
  hasKey: boolean;
  certSize: number;
  keySize: number;
  certData?: Uint8Array | string;
  keyData?: Uint8Array | string;
  sha256: string;
}

export interface CertificateItem {
  id: string;
  name: string; // 사용자 이름 (예: 홍길동, 김철수(주식회사 대한))
  subjectDn: string; // cn=홍길동(Hong Gildong)0000000000000,ou=HT,ou=KICA,o=SignKorea,c=KR
  category: CertCategory;
  issuer: string; // 발급기관 (금융결제원, 코스콤, 한국정보인증, 행정전자서명센터 등)
  policy: string; // 용도 (은행/신용카드/보험용, 행정업무용 등)
  serialNumber: string;
  validFrom: string; // YYYY-MM-DD
  validTo: string;   // YYYY-MM-DD
  status: CertStatus;
  daysRemaining: number;
  sourceLocation: string; // 예: C:\Users\User\AppData\LocalLow\NPKI\yessign\USER\...
  sourceDrive: string;    // 예: C: (로컬 디스크), E: (이동식 USB)
  departmentOrOrg?: string; // 소속 기관/부서 (공무원: 행정안전부 디지털안전국 등, 일반: 신한은행 등)
  caSignatureName?: string; // 기관 서명 이름 (CA Name, 예: 행정전자서명 행정기관용 인증센터 (CA134040001), 금융결제원 전자인증센터 yessignCA)
  isSystemCa?: boolean; // 시스템 루트/중계 CA 인증서 여부
  isInstitutional?: boolean; // 기관용/전자관인/특수목적용 공용 인증서 여부
  files: CertFileDetail;
  isCustomAdded?: boolean;
  isCustomPath?: boolean; // 일반 인증서 창(은행/정부 ActiveX) 미인식 비표준 경로 여부
  locationNotice?: string;
}

export interface SearchPath {
  id: string;
  name: string;
  path: string;
  type: 'default_npki' | 'default_gpki' | 'default_epki' | 'removable_usb' | 'custom';
  exists: boolean;
  enabled: boolean;
  description: string;
  countFound: number;
}

export type DiskDeviceKind = 'usb_flash' | 'fast_usb' | 'external_ssd' | 'internal_fixed' | 'network';

export interface DiskDrive {
  id: string;
  letter: string; // E:, F:, C:, D:
  name: string;
  type: 'removable' | 'fixed' | 'network';
  deviceKind?: DiskDeviceKind;
  deviceKindLabel?: '내장 디스크' | '외장 SSD' | '고속 USB 메모리' | '이동식 USB 메모리' | '네트워크 드라이브' | string;
  physicalPortDetail?: string; // e.g. "[내장 NVMe M.2 SSD]", "[내장 SATA3 SSD]", "[내장 SATA 포트 HDD]", "[외장 USB]"
  diskMediaType?: 'SSD' | 'HDD' | 'Flash' | string;
  physicalModel?: string; // e.g. "Samsung SSD 980 PRO 1TB", "WDC WD10EZEX-08WN4A0"
  isNvme?: boolean;
  isSata?: boolean;
  isHdd?: boolean;
  volumeSerialNumber?: string; // e.g. "9C3A-4F1E" (32-bit HEX Volume Serial Number)
  busType?: 'USB' | 'NVMe/SATA' | 'NVMe' | 'SATA' | 'SCSI' | 'PCIe' | 'Internal' | string;
  pnpDeviceId?: string; // e.g. "USBSTOR\DISK&VEN_SANDISK&PROD_ULTRA_3.0\..."
  fileSystem?: string; // "FAT32", "exFAT", "NTFS"
  isWritable?: boolean;
  partitionCount?: number;
  hasDriveLetter?: boolean;
  wmiStatus?: 'OK' | 'WARNING' | 'ERROR';
  wmiDiagnosticNotes?: string[];
  totalSpace: string;
  freeSpace: string;
  freePercentage: number;
  targetFolderPath: string;
  isRecommended: boolean;
  description: string;
  handle?: any; // FileSystemDirectoryHandle
}

export interface WmiQueryLogItem {
  id: string;
  timestamp: string;
  query: string;
  target: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
  resultCount: number;
  output: string;
  latencyMs: number;
  details?: Record<string, any>;
}

export interface UsbDiagnosticDeviceReport {
  driveLetter: string;
  volumeSerialNumber: string;
  deviceModel: string;
  busType: string;
  rmbFlag: 'Removable' | 'Fixed';
  fileSystem: string;
  mountStatus: 'MOUNTED' | 'NO_LETTER' | 'READ_ONLY' | 'UNRECOGNIZED' | 'HEALTHY';
  isCertRecognized: boolean;
  totalSize: string;
  freeSpace: string;
  issueSummary?: string;
  recommendedAction?: string;
  wmiRawData: Record<string, any>;
}

export interface BackupHistoryItem {
  id: string;
  timestamp: string;
  targetDisk: string;
  targetPath: string;
  certificatesCount: number;
  certNames: string[];
  status: 'success' | 'failed';
  hashCheckPassed: boolean;
}

export interface TrashItem {
  id: string;
  deletedAt: string;
  deleteReason: string;
  cert: CertificateItem;
}

export type AppLogCategory = 'BACKUP' | 'IMPORT' | 'DELETE' | 'RESTORE' | 'SCAN' | 'SYSTEM' | 'SECURITY' | 'RENEWAL';
export type AppLogLevel = 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';

export interface AppLogItem {
  id: string;
  timestamp: string;      // YYYY-MM-DD HH:mm:ss
  category: AppLogCategory;
  level: AppLogLevel;
  action: string;         // e.g. "USB 백업 완료", "인증서 복원", "USB 역방향 가져오기"
  details: string;        // 상세 설명 또는 관련 인증서명
  source?: string;        // 예: "로컬 NPKI", "E:\NPKI"
  target?: string;        // 예: "E:\NPKI", "C:\Users\Admin\AppData\LocalLow\NPKI"
  count?: number;         // 관련 인증서 건수
}

