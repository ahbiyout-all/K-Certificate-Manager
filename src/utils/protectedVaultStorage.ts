import { RestoredTrashItem } from '../types';

const PROTECTED_VAULT_KEY = 'kcert_protected_restored_vault_v1';
const LEGACY_VAULT_KEY = 'kcert_restored_trash_items';
const ENCRYPTION_SALT = 'KCert_ProtectedRestoredVault_AES_Salt_2026';

/**
 * 특수 암호화 보관소(Protected Restored Vault) 전용 인코딩/암호화 모듈
 */
function encryptPayload(dataStr: string): string {
  try {
    let encrypted = '';
    for (let i = 0; i < dataStr.length; i++) {
      const charCode = dataStr.charCodeAt(i) ^ ENCRYPTION_SALT.charCodeAt(i % ENCRYPTION_SALT.length);
      encrypted += String.fromCharCode(charCode);
    }
    return 'KCERT_PROTECTED_VAULT_V1:' + btoa(encodeURIComponent(encrypted));
  } catch {
    return dataStr;
  }
}

function decryptPayload(cipherStr: string): string {
  try {
    if (!cipherStr.startsWith('KCERT_PROTECTED_VAULT_V1:')) return cipherStr;
    const base64Data = cipherStr.substring('KCERT_PROTECTED_VAULT_V1:'.length);
    const decodedStr = decodeURIComponent(atob(base64Data));
    let decrypted = '';
    for (let i = 0; i < decodedStr.length; i++) {
      const charCode = decodedStr.charCodeAt(i) ^ ENCRYPTION_SALT.charCodeAt(i % ENCRYPTION_SALT.length);
      decrypted += String.fromCharCode(charCode);
    }
    return decrypted;
  } catch {
    return cipherStr;
  }
}

export function loadProtectedRestoredItems(): RestoredTrashItem[] {
  try {
    // 1. 특수 암호화 보관소 저장 키 우선 조회
    const encryptedData = localStorage.getItem(PROTECTED_VAULT_KEY);
    if (encryptedData) {
      const decryptedJson = decryptPayload(encryptedData);
      return JSON.parse(decryptedJson) || [];
    }

    // 2. 레거시 일반 저장소 호환 조회 및 암호화 자동 마이그레이션
    const legacyData = localStorage.getItem(LEGACY_VAULT_KEY);
    if (legacyData) {
      const items: RestoredTrashItem[] = JSON.parse(legacyData) || [];
      if (items.length > 0) {
        saveProtectedRestoredItems(items);
        localStorage.removeItem(LEGACY_VAULT_KEY);
      }
      return items;
    }
  } catch (e) {
    console.warn('특수 암호화 보관소 로드 오류:', e);
  }
  return [];
}

export function saveProtectedRestoredItems(items: RestoredTrashItem[]): void {
  try {
    const jsonStr = JSON.stringify(items);
    const encrypted = encryptPayload(jsonStr);
    localStorage.setItem(PROTECTED_VAULT_KEY, encrypted);
    if (localStorage.getItem(LEGACY_VAULT_KEY)) {
      localStorage.removeItem(LEGACY_VAULT_KEY);
    }
  } catch (e) {
    console.warn('특수 암호화 보관소 저장 오류:', e);
  }
}
