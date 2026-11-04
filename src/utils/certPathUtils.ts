export function isStandardCertPath(sourceLocation: string, isRemovableMedia?: boolean): boolean {
  if (!sourceLocation) return true;
  const p = sourceLocation.replace(/\//g, '\\').toUpperCase();

  // 1. 중첩 폴더(복사 오류) 또는 백업/임시 폴더는 명백한 비표준
  if (
    p.includes('\\GPKI\\GPKI') ||
    p.includes('\\NPKI\\NPKI') ||
    p.includes('\\EPKI\\EPKI') ||
    p.includes('\\GPKI\\BACKUP') ||
    p.includes('\\NPKI\\BACKUP') ||
    p.includes('\\EPKI\\BACKUP') ||
    p.includes('\\인증서') ||
    p.includes('\\백업') ||
    p.includes('\\TEMP')
  ) {
    return false;
  }

  // 1-1. AppData\LocalLow\GPKI 경로는 공무원 행정전자서명(GPKI) 정부 공식 표준(C:\GPKI\Certificate\class2)이 아니며
  // 온-나라, 새올 등 실무 행정망에서 사용되지 않는 예외 경로이므로 비표준 처리
  if (p.includes('\\APPDATA\\LOCALLOW\\GPKI')) {
    return false;
  }

  // 2. AppData\LocalLow (금융결제원 NPKI, 교육부 EPKI 최우선 표준)
  if (
    p.includes('\\APPDATA\\LOCALLOW\\NPKI') ||
    p.includes('\\APPDATA\\LOCALLOW\\EPKI')
  ) {
    return true;
  }

  // 3. GPKI 표준 (C:\GPKI\Certificate 또는 [USB]:\GPKI\Certificate)
  if (/^[A-Z]:\\GPKI\\CERTIFICATE($|\\)/i.test(p)) {
    return true;
  }

  // 4. EPKI 표준 (C:\EPKI\Certificate 또는 [USB]:\EPKI\Certificate)
  if (/^[A-Z]:\\EPKI\\CERTIFICATE($|\\)/i.test(p)) {
    return true;
  }

  // 5. NPKI 이동식 USB 표준 ([USB]:\NPKI)
  if (isRemovableMedia && /^[A-Z]:\\NPKI($|\\)/i.test(p)) {
    return true;
  }

  return false;
}

export function isRareLocalLowGpkiPath(sourceLocation: string): boolean {
  if (!sourceLocation) return false;
  const p = sourceLocation.replace(/\//g, '\\').toUpperCase();
  return p.includes('\\APPDATA\\LOCALLOW\\GPKI');
}

export function isNonStandardCertPath(sourceLocation: string, isRemovableMedia?: boolean): boolean {
  return !isStandardCertPath(sourceLocation, isRemovableMedia);
}

