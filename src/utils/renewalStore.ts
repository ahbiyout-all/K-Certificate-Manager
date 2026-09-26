import { CertificateItem } from '../types';
import { 
  RenewalInstitution, 
  DEFAULT_INSTITUTION_DIRECTORY, 
  CertRenewalGroup 
} from '../data/renewalInstitutions';

const STORAGE_KEY_CUSTOM_INSTITUTIONS = 'kcert_custom_institutions_v2';
const STORAGE_KEY_MODIFIED_INSTITUTIONS = 'kcert_modified_institutions_v2';

export interface InstitutionStorageState {
  customs: RenewalInstitution[];
  overrides: Record<string, Partial<RenewalInstitution>>;
}

/**
 * Loads custom and modified institution data from LocalStorage
 */
export function loadInstitutionStore(): InstitutionStorageState {
  try {
    const customRaw = localStorage.getItem(STORAGE_KEY_CUSTOM_INSTITUTIONS);
    const modifiedRaw = localStorage.getItem(STORAGE_KEY_MODIFIED_INSTITUTIONS);

    const customs: RenewalInstitution[] = customRaw ? JSON.parse(customRaw) : [];
    const overrides: Record<string, Partial<RenewalInstitution>> = modifiedRaw ? JSON.parse(modifiedRaw) : {};

    return { customs, overrides };
  } catch (err) {
    console.error('Failed to load custom institutions store', err);
    return { customs: [], overrides: {} };
  }
}

/**
 * Saves state back to LocalStorage
 */
export function saveInstitutionStore(state: InstitutionStorageState): void {
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_INSTITUTIONS, JSON.stringify(state.customs));
    localStorage.setItem(STORAGE_KEY_MODIFIED_INSTITUTIONS, JSON.stringify(state.overrides));
  } catch (err) {
    console.error('Failed to save custom institutions store', err);
  }
}

/**
 * Returns complete list of all institutions (defaults + modified overrides + user custom items)
 */
export function getAllInstitutions(): RenewalInstitution[] {
  const { customs, overrides } = loadInstitutionStore();
  const list: RenewalInstitution[] = [];

  // 1. Process default items merged with overrides
  Object.values(DEFAULT_INSTITUTION_DIRECTORY).forEach(def => {
    if (overrides[def.id]) {
      list.push({
        ...def,
        ...overrides[def.id],
        isModified: true,
      });
    } else {
      list.push({
        ...def,
        isModified: false,
      });
    }
  });

  // 2. Append custom user-created institutions
  customs.forEach(c => {
    list.push({
      ...c,
      isCustom: true,
    });
  });

  return list;
}

/**
 * Save / Update an existing default institution or user custom institution
 */
export function saveInstitution(updated: RenewalInstitution): void {
  if (!updated || !updated.id || ['__proto__', 'constructor', 'prototype'].includes(updated.id)) {
    return;
  }
  const safeUpdated: RenewalInstitution = {
    ...updated,
    portalUrl: sanitizeUrl(updated.portalUrl),
    secondaryUrl: updated.secondaryUrl ? sanitizeUrl(updated.secondaryUrl) : undefined,
  };
  if (!safeUpdated.portalUrl) return;

  const state = loadInstitutionStore();
  const isDefault = Boolean(DEFAULT_INSTITUTION_DIRECTORY[safeUpdated.id]);

  if (isDefault) {
    state.overrides[safeUpdated.id] = {
      ...safeUpdated,
      isModified: true,
      lastUpdated: new Date().toISOString(),
    };
  } else {
    // Custom institution
    const idx = state.customs.findIndex(c => c.id === safeUpdated.id);
    const itemWithMeta: RenewalInstitution = {
      ...safeUpdated,
      isCustom: true,
      lastUpdated: new Date().toISOString(),
    };
    if (idx >= 0) {
      state.customs[idx] = itemWithMeta;
    } else {
      state.customs.push(itemWithMeta);
    }
  }

  saveInstitutionStore(state);
}

/**
 * Reset a single institution to system default or delete if custom
 */
export function resetInstitution(id: string): void {
  const state = loadInstitutionStore();
  if (state.overrides[id]) {
    delete state.overrides[id];
  }
  state.customs = state.customs.filter(c => c.id !== id);
  saveInstitutionStore(state);
}

/**
 * Reset all institutions to pristine factory defaults
 */
export function resetAllInstitutionsToDefault(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_CUSTOM_INSTITUTIONS);
    localStorage.removeItem(STORAGE_KEY_MODIFIED_INSTITUTIONS);
  } catch (err) {
    console.error('Failed to reset institutions', err);
  }
}

/**
 * Export current institution directory as portable JSON string
 */
export function exportInstitutionsJSON(): string {
  const all = getAllInstitutions();
  return JSON.stringify(
    {
      app: 'K-CertManager',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      institutions: all,
    },
    null,
    2
  );
}

/**
 * Import and merge institutions from JSON string
 */
export function importInstitutionsJSON(jsonStr: string): { success: boolean; count: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    const incoming: RenewalInstitution[] = Array.isArray(parsed) 
      ? parsed 
      : Array.isArray(parsed.institutions) 
      ? parsed.institutions 
      : [];

    if (incoming.length === 0) {
      return { success: false, count: 0, error: '유효한 기관 데이터 목록을 찾을 수 없습니다.' };
    }

    const state = loadInstitutionStore();
    let count = 0;

    incoming.forEach(item => {
      if (!item || typeof item !== 'object') return;
      if (!item.id || !item.name || !item.portalUrl) return;
      if (['__proto__', 'constructor', 'prototype'].includes(String(item.id))) return;

      const safePortalUrl = sanitizeUrl(String(item.portalUrl));
      if (!safePortalUrl) return;
      const safeSecondaryUrl = item.secondaryUrl ? sanitizeUrl(String(item.secondaryUrl)) : undefined;

      const sanitizedItem: RenewalInstitution = {
        ...item,
        id: String(item.id).slice(0, 64),
        name: String(item.name).slice(0, 120),
        portalUrl: safePortalUrl,
        secondaryUrl: safeSecondaryUrl || undefined,
      };

      if (DEFAULT_INSTITUTION_DIRECTORY[sanitizedItem.id]) {
        state.overrides[sanitizedItem.id] = {
          ...sanitizedItem,
          isModified: true,
          lastUpdated: new Date().toISOString(),
        };
      } else {
        const idx = state.customs.findIndex(c => c.id === sanitizedItem.id);
        const customItem: RenewalInstitution = {
          ...sanitizedItem,
          isCustom: true,
          lastUpdated: new Date().toISOString(),
        };
        if (idx >= 0) {
          state.customs[idx] = customItem;
        } else {
          state.customs.push(customItem);
        }
      }
      count++;
    });

    saveInstitutionStore(state);
    return { success: true, count };
  } catch (err) {
    return { success: false, count: 0, error: (err as Error).message || 'JSON 파싱 오류' };
  }
}

/**
 * Generates search engine fallback query URLs in case official domain or URL changes
 */
export function getSearchFallbackUrl(
  institution: RenewalInstitution, 
  engine: 'naver' | 'google' | 'daum' = 'naver'
): string {
  const query = encodeURIComponent(`${institution.shortName || institution.name} 공동인증서 갱신 인증센터`);
  
  switch (engine) {
    case 'naver':
      return `https://search.naver.com/search.naver?query=${query}`;
    case 'google':
      return `https://www.google.com/search?q=${query}`;
    case 'daum':
      return `https://search.daum.net/search?q=${query}`;
    default:
      return `https://search.naver.com/search.naver?query=${query}`;
  }
}

/**
 * Formats and strictly validates HTTP/HTTPS url input (Blocks javascript:, data:, file:, vbscript:)
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') return '';
  let trimmed = url.trim();
  if (!trimmed) return '';

  // Block dangerous schemes explicitly
  if (/^(javascript|data|vbscript|file|blob):/i.test(trimmed)) {
    return '';
  }

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    trimmed = 'https://' + trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * Match a certificate to the most appropriate institution from the directory
 */
export function matchCertToInstitution(
  cert: CertificateItem, 
  institutions: RenewalInstitution[]
): RenewalInstitution {
  const issuer = (cert.issuer || '').toLowerCase();
  const dept = (cert.departmentOrOrg || '').toLowerCase();
  const subject = (cert.subjectDn || '').toLowerCase();
  const policy = (cert.policy || '').toLowerCase();
  const combinedText = `${issuer} ${dept} ${subject} ${policy}`;

  // 1. Check custom items first with priority
  const safeInsts = (institutions && institutions.length > 0) ? institutions : getAllInstitutions();

  for (const inst of safeInsts) {
    if (inst && inst.isCustom && inst.aliases && inst.aliases.length > 0) {
      if (inst.aliases.some(alias => alias && combinedText.includes(alias.toLowerCase()))) {
        return inst;
      }
    }
  }

  // 2. Check GPKI / Government
  if (cert && (cert.category === 'GPKI_GOV' || combinedText.includes('gpki') || combinedText.includes('행정') || combinedText.includes('공무원'))) {
    const gpki = safeInsts.find(i => i && i.id === 'GPKI');
    if (gpki) return gpki;
  }

  // 3. Check EPKI / Education
  if (cert && (cert.category === 'EPKI_EDU' || combinedText.includes('epki') || combinedText.includes('교육') || combinedText.includes('나이스') || combinedText.includes('에듀파인'))) {
    const epki = safeInsts.find(i => i && i.id === 'EPKI');
    if (epki) return epki;
  }

  // 4. Check Aliases across all institutions
  for (const inst of safeInsts) {
    if (inst && inst.aliases && inst.aliases.length > 0) {
      if (inst.aliases.some(alias => alias && alias.length >= 2 && combinedText.includes(alias.toLowerCase()))) {
        return inst;
      }
    }
  }

  // 5. Check Category Fallbacks
  if (cert && cert.category === 'NPKI_BANK') {
    const yessign = safeInsts.find(i => i && i.id === 'YESSIGN_GENERIC') || safeInsts[0];
    if (yessign) return yessign;
  }

  if (cert && cert.category === 'NPKI_CORP') {
    const kica = safeInsts.find(i => i && i.id === 'KICA') || safeInsts[0];
    if (kica) return kica;
  }

  // 6. Generic Fallback
  const fallback = safeInsts.find(i => i && i.id === 'YESSIGN_GENERIC') || safeInsts[0] || DEFAULT_INSTITUTION_DIRECTORY['YESSIGN_GENERIC'];
  return fallback || DEFAULT_INSTITUTION_DIRECTORY['YESSIGN_GENERIC'];
}

/**
 * Group certificates with dynamic institutions directory
 */
export function groupCertsWithCustomInstitutions(
  certs: CertificateItem[], 
  institutions: RenewalInstitution[]
): CertRenewalGroup[] {
  const map = new Map<string, { institution: RenewalInstitution; certs: CertificateItem[] }>();

  for (const cert of certs) {
    if (!cert) continue;
    const inst = matchCertToInstitution(cert, institutions);
    if (!inst || !inst.id) continue;
    if (!map.has(inst.id)) {
      map.set(inst.id, { institution: inst, certs: [] });
    }
    map.get(inst.id)!.certs.push(cert);
  }

  const groups: CertRenewalGroup[] = [];
  map.forEach(({ institution, certs: groupCerts }) => {
    let expiringCount = 0;
    let expiredCount = 0;
    let validCount = 0;

    for (const c of groupCerts) {
      if (c.daysRemaining <= 0) {
        expiredCount++;
      } else if (c.daysRemaining <= 30) {
        expiringCount++;
      } else {
        validCount++;
      }
    }

    groupCerts.sort((a, b) => a.daysRemaining - b.daysRemaining);

    groups.push({
      institution,
      certs: groupCerts,
      expiringCount,
      expiredCount,
      validCount,
    });
  });

  groups.sort((a, b) => {
    const aUrgent = a.expiringCount + a.expiredCount;
    const bUrgent = b.expiringCount + b.expiredCount;
    if (aUrgent !== bUrgent) {
      return bUrgent - aUrgent;
    }
    return a.institution.name.localeCompare(b.institution.name, 'ko');
  });

  return groups;
}
