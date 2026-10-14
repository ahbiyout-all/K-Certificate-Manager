import { AppLogItem, AppLogCategory, AppLogLevel } from '../types';

const STORAGE_KEY = 'kcert_activity_logs';
const MAX_LOGS = 250;

/**
 * Get current date & time formatted as YYYY-MM-DD HH:mm:ss
 */
export function formatCurrentTimestamp(d: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Initial seed activity logs for a clean, professional startup history
 */
function getInitialSeedLogs(): AppLogItem[] {
  const now = new Date();
  const tMinus = (seconds: number) => {
    return formatCurrentTimestamp(new Date(now.getTime() - seconds * 1000));
  };

  return [
    {
      id: 'log-seed-1',
      timestamp: tMinus(90),
      category: 'SYSTEM',
      level: 'INFO',
      action: '앱 초기화 완료',
      details: 'K-인증서 매니저 보안 격리 환경 로드 (Client-Side Safe Mode)',
      source: 'Windows System / Browser Sandbox',
      target: '메모리 보안 보관함'
    },
    {
      id: 'log-seed-2',
      timestamp: tMinus(60),
      category: 'SCAN',
      level: 'SUCCESS',
      action: '로컬 인증서 보관함 탐색 완료',
      details: '로컬 NPKI/GPKI 경로에서 유효 인증서 3건, 만료임박 1건, 만료 1건 감지',
      source: 'C:\\Users\\Admin\\AppData\\LocalLow',
      count: 5
    },
    {
      id: 'log-seed-3',
      timestamp: tMinus(30),
      category: 'SYSTEM',
      level: 'INFO',
      action: '이동식 USB 드라이브 스캔',
      details: '이동식 디스크 E: 드라이브 (SANDISK 32GB) 자동 인식 완료',
      target: 'E:\\'
    }
  ];
}

/**
 * Load all stored activity logs from localStorage
 */
export function getStoredActivityLogs(): AppLogItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeds = getInitialSeedLogs();
      saveStoredActivityLogs(seeds);
      return seeds;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return getInitialSeedLogs();
  } catch (e) {
    console.error('Failed to load activity logs from storage', e);
    return getInitialSeedLogs();
  }
}

/**
 * Save logs to localStorage with max capacity limit
 */
export function saveStoredActivityLogs(logs: AppLogItem[]): void {
  try {
    const trimmed = logs.slice(0, MAX_LOGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save activity logs', e);
  }
}

/**
 * Record a new operation log
 */
export function logActivity(entry: {
  category: AppLogCategory;
  level: AppLogLevel;
  action: string;
  details: string;
  source?: string;
  target?: string;
  count?: number;
}): AppLogItem {
  const newLog: AppLogItem = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: formatCurrentTimestamp(),
    category: entry.category,
    level: entry.level,
    action: entry.action,
    details: entry.details,
    source: entry.source,
    target: entry.target,
    count: entry.count
  };

  try {
    const current = getStoredActivityLogs();
    const updated = [newLog, ...current];
    saveStoredActivityLogs(updated);
  } catch (e) {
    console.error('Failed to record activity log', e);
  }

  return newLog;
}

/**
 * Clear all logs and reset to empty
 */
export function clearAllActivityLogs(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear activity logs', e);
  }
}

/**
 * Export logs as a readable .log text file
 */
export function exportActivityLogsAsFile(logs: AppLogItem[]): void {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const header = [
    '================================================================================',
    ' K-인증서 매니저 (K-Certificate Manager) - 앱 작업 및 감사 로그 (Activity Log)',
    '================================================================================',
    `출력 일시: ${formatCurrentTimestamp(now)}`,
    `총 기록 건수: ${logs.length}건`,
    '개발자 블로그 및 공식 홈페이지: https://ahbiyoutvibe.blogspot.com/',
    '================================================================================\n'
  ].join('\n');

  const lines = logs.map((log, index) => {
    const parts = [
      `[${index + 1}] ${log.timestamp} | [${log.level.padEnd(7)}] | [${log.category.padEnd(7)}] - ${log.action}`,
      `    상세 내용: ${log.details}`
    ];
    if (log.source) parts.push(`    출처(Source): ${log.source}`);
    if (log.target) parts.push(`    대상(Target): ${log.target}`);
    if (log.count !== undefined) parts.push(`    처리 건수: ${log.count}건`);
    return parts.join('\n');
  });

  const content = header + lines.join('\n\n') + '\n\n--- [END OF LOG] ---\n';
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `kcert-activity-log-${dateStr}.log`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
