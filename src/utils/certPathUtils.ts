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

  // 2. AppData\LocalLow (금융결제원, 행정안전부, 교육부 최우선 표준)
  if (
    p.includes('\\APPDATA\\LOCALLOW\\NPKI') ||
    p.includes('\\APPDATA\\LOCALLOW\\GPKI') ||
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

export function isNonStandardCertPath(sourceLocation: string, isRemovableMedia?: boolean): boolean {
  return !isStandardCertPath(sourceLocation, isRemovableMedia);
}

