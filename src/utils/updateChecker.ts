import { APP_VERSION } from '../version';

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  releaseUrl: string;
  downloadUrl?: string;
  publishedAt?: string;
  isPreRelease: boolean;
}

/**
 * Compare two semantic version strings (e.g. "1.4.2" vs "1.5.0")
 * Returns:
 *   1 if v1 > v2
 *  -1 if v1 < v2
 *   0 if v1 === v2
 */
export function compareSemver(v1: string, v2: string): number {
  const clean1 = v1.replace(/^v/i, '').trim();
  const clean2 = v2.replace(/^v/i, '').trim();

  const parts1 = clean1.split('.').map(p => parseInt(p, 10) || 0);
  const parts2 = clean2.split('.').map(p => parseInt(p, 10) || 0);

  const maxLength = Math.max(parts1.length, parts2.length, 3);
  for (let i = 0; i < maxLength; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

const GITHUB_REPO = 'ahbiyout-all/K-Certificate-Manager';
const API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const RELEASES_PAGE_URL = `https://github.com/${GITHUB_REPO}/releases`;

/**
 * Checks for the latest release from GitHub API
 */
export async function checkForAppUpdates(): Promise<UpdateInfo> {
  const defaultResult: UpdateInfo = {
    hasUpdate: false,
    currentVersion: APP_VERSION,
    latestVersion: APP_VERSION,
    releaseName: `v${APP_VERSION}`,
    releaseNotes: '',
    releaseUrl: RELEASES_PAGE_URL,
    isPreRelease: false,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(API_URL, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      // 404 means no releases published yet
      return defaultResult;
    }

    const data = await response.json();
    const tagName = (data.tag_name || '').replace(/^v/i, '').trim();
    if (!tagName) {
      return defaultResult;
    }

    const hasUpdate = compareSemver(tagName, APP_VERSION) > 0;

    // Find desktop zip or installer asset if available
    let downloadUrl = data.html_url;
    if (Array.isArray(data.assets) && data.assets.length > 0) {
      const zipAsset = data.assets.find((a: any) => 
        a.name?.endsWith('.zip') || a.name?.endsWith('.exe')
      );
      if (zipAsset?.browser_download_url) {
        downloadUrl = zipAsset.browser_download_url;
      }
    }

    return {
      hasUpdate,
      currentVersion: APP_VERSION,
      latestVersion: tagName,
      releaseName: data.name || `v${tagName}`,
      releaseNotes: data.body || '새로운 기능 추가 및 안정성 개선이 포함되었습니다.',
      releaseUrl: data.html_url || RELEASES_PAGE_URL,
      downloadUrl,
      publishedAt: data.published_at ? new Date(data.published_at).toLocaleDateString('ko-KR') : undefined,
      isPreRelease: !!data.prerelease,
    };
  } catch (err) {
    // Network error or timeout, silently return no update
    console.debug('[UpdateChecker] Could not check GitHub releases:', err);
    return defaultResult;
  }
}
