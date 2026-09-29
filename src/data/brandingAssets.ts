/**
 * Application branding assets (Logo and Icons)
 * Robust URL resolver and SVG fallbacks for web, desktop and portable bundles
 */

// Base URL resolver for Vite, relative paths, and standalone builds
const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as { env?: { BASE_URL?: string } }).env : undefined;
const baseUrl = metaEnv?.BASE_URL || './';

export function resolveAssetPath(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${cleanBase}${cleanPath}`;
}

export const BRANDING_ASSETS = {
  // Main high-resolution application branding logo
  logo: resolveAssetPath('assets/icons/app-logo.jpg'),
  // Squircle desktop/browser app launcher icon
  appIcon: resolveAssetPath('assets/icons/app-icon.jpg'),
  // Hardware USB certificate cryptographic sync/transfer icon
  usbCertIcon: resolveAssetPath('assets/icons/usb-cert-icon.jpg'),
  // Fallback favicon
  favicon: resolveAssetPath('assets/favicon.jpg'),
  // Alternative fallback paths
  rawLogo: '/assets/icons/app-logo.jpg',
  rawAppIcon: '/assets/icons/app-icon.jpg',
  rawUsbCertIcon: '/assets/icons/usb-cert-icon.jpg',
};

