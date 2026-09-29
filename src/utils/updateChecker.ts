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
  detectionSource?: 'release_latest' | 'releases_list' | 'git_tags' | 'offline';
  checkedAt?: string;
  errorMessage?: string;
}

/**
 * Enhanced Semantic Version Comparator
 * Compares two semantic version strings (e.g., "1.4.3" vs "1.4.2", "1.4.3-rc.1", "1.4.3.0")
 * Supports pre-release identifiers (alpha, beta, rc, dev) and build metadata.
 * 
 * Returns:
 *   1 if v1 > v2
 *  -1 if v1 < v2
 *   0 if v1 === v2
 */
export function compareSemver(v1: string, v2: string): number {
  if (!v1 && !v2) return 0;
  if (!v1) return -1;
  if (!v2) return 1;

  // Clean strings (remove 'v' prefix, trim whitespace)
  const clean1 = v1.replace(/^v/i, '').trim();
  const clean2 = v2.replace(/^v/i, '').trim();

  if (clean1 === clean2) return 0;

  // Separate main version and prerelease tag (e.g., "1.4.3-beta.1" -> ["1.4.3", "beta.1"])
  const [main1, pre1] = clean1.split('-');
  const [main2, pre2] = clean2.split('-');

  // Parse main numeric version components (e.g., "1.4.3.0" -> [1, 4, 3, 0])
  const parts1 = (main1 || '').split('.').map(p => parseInt(p, 10) || 0);
  const parts2 = (main2 || '').split('.').map(p => parseInt(p, 10) || 0);

  const maxLen = Math.max(parts1.length, parts2.length, 3);
  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] !== undefined ? parts1[i] : 0;
    const num2 = parts2[i] !== undefined ? parts2[i] : 0;

    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }

  // If main version numbers are equal, compare pre-release identifiers
  // Rule: Normal release (without pre-release tag) is NEWER than a pre-release
  if (!pre1 && pre2) return 1;  // 1.4.3 > 1.4.3-rc.1
  if (pre1 && !pre2) return -1; // 1.4.3-rc.1 < 1.4.3

  // If both have pre-release suffixes, compare them lexically/numerically
  if (pre1 && pre2) {
    const preParts1 = pre1.split('.');
    const preParts2 = pre2.split('.');
    const preMax = Math.max(preParts1.length, preParts2.length);

    for (let i = 0; i < preMax; i++) {
      const p1 = preParts1[i] || '';
      const p2 = preParts2[i] || '';

      const n1 = parseInt(p1, 10);
      const n2 = parseInt(p2, 10);

      if (!isNaN(n1) && !isNaN(n2)) {
        if (n1 > n2) return 1;
        if (n1 < n2) return -1;
      } else {
        const comp = p1.localeCompare(p2, undefined, { numeric: true });
        if (comp !== 0) return comp > 0 ? 1 : -1;
      }
    }
  }

  return 0;
}

const GITHUB_REPO = 'ahbiyout-all/K-Certificate-Manager';
const RELEASES_PAGE_URL = `https://github.com/${GITHUB_REPO}/releases`;

/**
 * Robust 3-Tier GitHub Update Checker
 * 
 * Uses CORS-safelisted headers to prevent CORS preflight OPTIONS failures.
 * Handles network failures and offline environments gracefully without throwing uncaught console errors.
 */
export async function checkForAppUpdates(appVersionOverride?: string): Promise<UpdateInfo> {
  const currentVer = appVersionOverride || APP_VERSION;
  const timestamp = Date.now();
  const checkedAtStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const defaultResult: UpdateInfo = {
    hasUpdate: false,
    currentVersion: currentVer,
    latestVersion: currentVer,
    releaseName: `v${currentVer}`,
    releaseNotes: '현재 설치된 버전이 최신 버전입니다.',
    releaseUrl: RELEASES_PAGE_URL,
    isPreRelease: false,
    detectionSource: 'release_latest',
    checkedAt: checkedAtStr,
  };

  // Note: Only use CORS-safelisted headers ('Accept') to prevent preflight OPTIONS requests on cross-origin fetch
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };

  // Helper fetch with timeout & graceful offline fallback
  const fetchWithTimeout = async (url: string, timeoutMs = 4000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const targetUrl = `${url}?_t=${timestamp}`;

    try {
      const resp = await fetch(targetUrl, {
        signal: controller.signal,
        headers,
        mode: 'cors',
      });
      clearTimeout(timeoutId);
      return resp;
    } catch (err: any) {
      clearTimeout(timeoutId);
      // Log as debug information instead of console.error to avoid polluting error tracking in sandboxed/offline environments
      console.debug('[KCert UpdateChecker API Info] Remote GitHub API unreachable:', {
        url: targetUrl,
        reason: err?.message || String(err),
      });
      return null;
    }
  };

  try {
    // -------------------------------------------------------------
    // Tier 1: Check /releases/latest
    // -------------------------------------------------------------
    const latestResp = await fetchWithTimeout(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, 3500);
    if (latestResp && latestResp.ok) {
      const data = await latestResp.json();
      const tagName = (data.tag_name || '').replace(/^v/i, '').trim();
      if (tagName) {
        const compResult = compareSemver(tagName, currentVer);
        const hasUpdate = compResult > 0;

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
          currentVersion: currentVer,
          latestVersion: tagName,
          releaseName: data.name || `v${tagName}`,
          releaseNotes: data.body || '새로운 기능 추가 및 보안 안정성 패치가 적용된 최신 릴리스입니다.',
          releaseUrl: data.html_url || `${RELEASES_PAGE_URL}/tag/v${tagName}`,
          downloadUrl,
          publishedAt: data.published_at ? new Date(data.published_at).toLocaleDateString('ko-KR') : undefined,
          isPreRelease: !!data.prerelease,
          detectionSource: 'release_latest',
          checkedAt: checkedAtStr,
        };
      }
    }

    // -------------------------------------------------------------
    // Tier 2: Check /releases (List of all releases)
    // -------------------------------------------------------------
    const releasesResp = await fetchWithTimeout(`https://api.github.com/repos/${GITHUB_REPO}/releases`, 3500);
    if (releasesResp && releasesResp.ok) {
      const releases = await releasesResp.json();
      if (Array.isArray(releases) && releases.length > 0) {
        const firstRelease = releases[0];
        const tagName = (firstRelease.tag_name || '').replace(/^v/i, '').trim();
        if (tagName) {
          const compResult = compareSemver(tagName, currentVer);
          const hasUpdate = compResult > 0;

          let downloadUrl = firstRelease.html_url;
          if (Array.isArray(firstRelease.assets) && firstRelease.assets.length > 0) {
            const zipAsset = firstRelease.assets.find((a: any) => 
              a.name?.endsWith('.zip') || a.name?.endsWith('.exe')
            );
            if (zipAsset?.browser_download_url) {
              downloadUrl = zipAsset.browser_download_url;
            }
          }

          return {
            hasUpdate,
            currentVersion: currentVer,
            latestVersion: tagName,
            releaseName: firstRelease.name || `v${tagName}`,
            releaseNotes: firstRelease.body || '새로운 기능 추가 및 보안 안정성 패치가 적용된 최신 릴리스입니다.',
            releaseUrl: firstRelease.html_url || `${RELEASES_PAGE_URL}/tag/v${tagName}`,
            downloadUrl,
            publishedAt: firstRelease.published_at ? new Date(firstRelease.published_at).toLocaleDateString('ko-KR') : undefined,
            isPreRelease: !!firstRelease.prerelease,
            detectionSource: 'releases_list',
            checkedAt: checkedAtStr,
          };
        }
      }
    }

    // -------------------------------------------------------------
    // Tier 3: Check /tags (Direct Git Tags Fallback)
    // -------------------------------------------------------------
    const tagsResp = await fetchWithTimeout(`https://api.github.com/repos/${GITHUB_REPO}/tags`, 3500);
    if (tagsResp && tagsResp.ok) {
      const tags = await tagsResp.json();
      if (Array.isArray(tags) && tags.length > 0) {
        let highestTag = (tags[0].name || '').replace(/^v/i, '').trim();
        for (const t of tags) {
          const rawName = (t.name || '').replace(/^v/i, '').trim();
          if (compareSemver(rawName, highestTag) > 0) {
            highestTag = rawName;
          }
        }

        if (highestTag) {
          const compResult = compareSemver(highestTag, currentVer);
          const hasUpdate = compResult > 0;

          const releaseUrl = `https://github.com/${GITHUB_REPO}/releases/tag/v${highestTag}`;
          const zipDownloadUrl = `https://github.com/${GITHUB_REPO}/archive/refs/tags/v${highestTag}.zip`;

          return {
            hasUpdate,
            currentVersion: currentVer,
            latestVersion: highestTag,
            releaseName: `v${highestTag} 공식 배포판`,
            releaseNotes: `GitHub Git 태그(v${highestTag})가 감지되었습니다. 최신 패키지 및 릴리스 페이지에서 다운로드할 수 있습니다.`,
            releaseUrl,
            downloadUrl: zipDownloadUrl,
            publishedAt: new Date().toLocaleDateString('ko-KR'),
            isPreRelease: false,
            detectionSource: 'git_tags',
            checkedAt: checkedAtStr,
          };
        }
      }
    }

    return defaultResult;

  } catch (err: any) {
    console.debug('[KCert UpdateChecker] Update check offline fallback:', err?.message || String(err));
    return {
      ...defaultResult,
      detectionSource: 'offline',
    };
  }
}
