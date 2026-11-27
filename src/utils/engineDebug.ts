import type { TransferDirection, TransferPlan } from './unifiedTransferEngine';

export const ENGINE_DEBUG_STORAGE_KEY = 'kcert_engine_debug_enabled';
export const ENGINE_DEBUG_CHANGED_EVENT = 'kcert:engine-debug-changed';
export const ENGINE_DEBUG_SESSION_EVENT = 'kcert:engine-debug-session';

export const ENGINE_IO_BUFFER_BYTES = 65536; // 64 KB stream write buffer
export const ENGINE_STREAM_CHUNK_BYTES = 16384; // 16 KB stream chunk window
export const ENGINE_MAX_CERT_FILE_BYTES = 524288; // 512 KB cert/key safety guard

export type RawEngineStatus =
  | 'IDLE'
  | 'PLANNING'
  | 'STREAMING'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'ERROR';

export type EngineWriteMode = 'FILE_SYSTEM_STREAM' | 'MEMORY_SYNC';

export interface EngineFileStreamMetric {
  id: string;
  fileName: string;
  certName: string;
  byteLength: number;
  bufferAllocatedBytes: number;
  elapsedMs: number;
  throughputBytesPerSec: number;
  mode: 'FS_WRITABLE' | 'MEMORY_SYNC';
  status: 'STREAMING' | 'DONE' | 'ERROR';
  sha256Prefix?: string;
  timestampIso: string;
}

export interface EngineBufferConfigSnapshot {
  ioBufferBytes: number;
  streamChunkBytes: number;
  maxCertFileBytes: number;
  writeMode: EngineWriteMode;
  totalBufferAllocatedBytes: number;
}

export interface EngineDebugSessionSnapshot {
  sessionId: string;
  planId: string | null;
  status: RawEngineStatus;
  direction: TransferDirection | 'NONE';
  targetDrive: string;
  startedAtIso: string | null;
  updatedAtIso: string;
  elapsedMs: number;
  bufferConfig: EngineBufferConfigSnapshot;
  plannedCertCount: number;
  completedCertCount: number;
  totalBytesProcessed: number;
  totalFilesProcessed: number;
  throughputBytesPerSec: number;
  peakThroughputBytesPerSec: number;
  activeStreamFile: string | null;
  streams: EngineFileStreamMetric[];
  rawEngineLine: string;
  lastError?: string;
}

const MAX_STREAM_RECORDS = 60;

export function getEngineDebugEnabled(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(ENGINE_DEBUG_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setEngineDebugEnabled(enabled: boolean): boolean {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ENGINE_DEBUG_STORAGE_KEY, enabled ? 'true' : 'false');
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent<boolean>(ENGINE_DEBUG_CHANGED_EVENT, { detail: enabled })
      );
    }
  } catch {
    // Ignore storage/window errors in restricted environments
  }
  return enabled;
}

function createIdleSnapshot(): EngineDebugSessionSnapshot {
  const nowIso = new Date().toISOString();
  return {
    sessionId: 'idle',
    planId: null,
    status: 'IDLE',
    direction: 'NONE',
    targetDrive: '-',
    startedAtIso: null,
    updatedAtIso: nowIso,
    elapsedMs: 0,
    bufferConfig: {
      ioBufferBytes: ENGINE_IO_BUFFER_BYTES,
      streamChunkBytes: ENGINE_STREAM_CHUNK_BYTES,
      maxCertFileBytes: ENGINE_MAX_CERT_FILE_BYTES,
      writeMode: 'MEMORY_SYNC',
      totalBufferAllocatedBytes: 0,
    },
    plannedCertCount: 0,
    completedCertCount: 0,
    totalBytesProcessed: 0,
    totalFilesProcessed: 0,
    throughputBytesPerSec: 0,
    peakThroughputBytesPerSec: 0,
    activeStreamFile: null,
    streams: [],
    rawEngineLine: 'ENGINE_IDLE :: awaiting transfer plan execution',
  };
}

let currentSnapshot: EngineDebugSessionSnapshot = createIdleSnapshot();
let sessionStartPerfMs = 0;
const listeners = new Set<(snapshot: EngineDebugSessionSnapshot) => void>();

function cloneSnapshot(snap: EngineDebugSessionSnapshot): EngineDebugSessionSnapshot {
  return {
    ...snap,
    bufferConfig: { ...snap.bufferConfig },
    streams: snap.streams.map(s => ({ ...s })),
  };
}

function emitSessionUpdate(): void {
  const cloned = cloneSnapshot(currentSnapshot);
  listeners.forEach(listener => {
    try {
      listener(cloned);
    } catch {
      // Ignore subscriber errors
    }
  });
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent<EngineDebugSessionSnapshot>(ENGINE_DEBUG_SESSION_EVENT, {
          detail: cloned,
        })
      );
    }
  } catch {
    // Ignore window dispatch errors
  }
}

export function getEngineDebugSession(): EngineDebugSessionSnapshot {
  return cloneSnapshot(currentSnapshot);
}

export function subscribeEngineDebugSession(
  listener: (snapshot: EngineDebugSessionSnapshot) => void
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function resetEngineDebugSession(): void {
  sessionStartPerfMs = 0;
  currentSnapshot = createIdleSnapshot();
  emitSessionUpdate();
}

export function beginEngineSession(
  plan: TransferPlan,
  writeMode: EngineWriteMode
): void {
  const nowPerf = typeof performance !== 'undefined' ? performance.now() : Date.now();
  sessionStartPerfMs = nowPerf;
  const nowIso = new Date().toISOString();

  currentSnapshot = {
    sessionId: `eng-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    planId: plan.planId,
    status: 'PLANNING',
    direction: plan.direction,
    targetDrive: plan.targetDriveLetter,
    startedAtIso: nowIso,
    updatedAtIso: nowIso,
    elapsedMs: 0,
    bufferConfig: {
      ioBufferBytes: ENGINE_IO_BUFFER_BYTES,
      streamChunkBytes: ENGINE_STREAM_CHUNK_BYTES,
      maxCertFileBytes: ENGINE_MAX_CERT_FILE_BYTES,
      writeMode,
      totalBufferAllocatedBytes: 0,
    },
    plannedCertCount: plan.executableItems.length,
    completedCertCount: 0,
    totalBytesProcessed: 0,
    totalFilesProcessed: 0,
    throughputBytesPerSec: 0,
    peakThroughputBytesPerSec: 0,
    activeStreamFile: null,
    streams: [],
    rawEngineLine: `PLAN_COMMIT :: id=${plan.planId} dir=${plan.direction} dst=${plan.targetDriveLetter} exec=${plan.executableItems.length} skip=${plan.skippedItems.length}`,
  };
  emitSessionUpdate();
}

export function updateEngineSessionStatus(
  status: RawEngineStatus,
  rawEngineLine: string,
  extra?: {
    activeStreamFile?: string | null;
    completedCertCount?: number;
  }
): void {
  const nowPerf = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const elapsedMs =
    sessionStartPerfMs > 0 ? Math.max(0.01, Number((nowPerf - sessionStartPerfMs).toFixed(2))) : 0;

  currentSnapshot = {
    ...currentSnapshot,
    status,
    updatedAtIso: new Date().toISOString(),
    elapsedMs,
    activeStreamFile:
      extra && extra.activeStreamFile !== undefined
        ? extra.activeStreamFile
        : currentSnapshot.activeStreamFile,
    completedCertCount:
      extra && extra.completedCertCount !== undefined
        ? extra.completedCertCount
        : currentSnapshot.completedCertCount,
    rawEngineLine,
  };
  emitSessionUpdate();
}

export function recordEngineStreamMetric(input: {
  fileName: string;
  certName: string;
  byteLength: number;
  bufferAllocatedBytes?: number;
  elapsedMs: number;
  mode: 'FS_WRITABLE' | 'MEMORY_SYNC';
  status?: 'STREAMING' | 'DONE' | 'ERROR';
  sha256Prefix?: string;
}): void {
  const safeBytes = Math.max(0, Math.round(input.byteLength));
  const safeBufferBytes = Math.max(
    safeBytes,
    Math.min(
      ENGINE_IO_BUFFER_BYTES,
      input.bufferAllocatedBytes ?? Math.max(safeBytes, Math.min(ENGINE_STREAM_CHUNK_BYTES, safeBytes))
    )
  );
  const safeElapsedMs = Math.max(0.01, Number(input.elapsedMs.toFixed(2)));
  const fileThroughput = Math.round((safeBytes / safeElapsedMs) * 1000);

  const metric: EngineFileStreamMetric = {
    id: `stm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    fileName: input.fileName,
    certName: input.certName,
    byteLength: safeBytes,
    bufferAllocatedBytes: safeBufferBytes,
    elapsedMs: safeElapsedMs,
    throughputBytesPerSec: fileThroughput,
    mode: input.mode,
    status: input.status || 'DONE',
    sha256Prefix: input.sha256Prefix,
    timestampIso: new Date().toISOString(),
  };

  const nowPerf = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const sessionElapsedMs =
    sessionStartPerfMs > 0
      ? Math.max(safeElapsedMs, Number((nowPerf - sessionStartPerfMs).toFixed(2)))
      : safeElapsedMs;

  const totalBytesProcessed = currentSnapshot.totalBytesProcessed + safeBytes;
  const totalFilesProcessed = currentSnapshot.totalFilesProcessed + 1;
  const totalBufferAllocatedBytes =
    currentSnapshot.bufferConfig.totalBufferAllocatedBytes + safeBufferBytes;
  const sessionThroughput =
    sessionElapsedMs > 0 ? Math.round((totalBytesProcessed / sessionElapsedMs) * 1000) : 0;
  const peakThroughputBytesPerSec = Math.max(
    currentSnapshot.peakThroughputBytesPerSec,
    fileThroughput,
    sessionThroughput
  );

  currentSnapshot = {
    ...currentSnapshot,
    status: input.status === 'ERROR' ? 'ERROR' : 'STREAMING',
    updatedAtIso: metric.timestampIso,
    elapsedMs: sessionElapsedMs,
    bufferConfig: {
      ...currentSnapshot.bufferConfig,
      totalBufferAllocatedBytes,
    },
    totalBytesProcessed,
    totalFilesProcessed,
    throughputBytesPerSec: sessionThroughput,
    peakThroughputBytesPerSec,
    activeStreamFile: input.fileName,
    streams: [metric, ...currentSnapshot.streams].slice(0, MAX_STREAM_RECORDS),
    rawEngineLine: `STREAM_${metric.mode} :: file=${metric.fileName} bytes=${safeBytes} buf=${safeBufferBytes} dt=${safeElapsedMs}ms rate=${formatThroughput(fileThroughput)}`,
  };
  emitSessionUpdate();
}

export function completeEngineSession(params: {
  completedCertCount: number;
  checksum: string;
}): void {
  const nowPerf = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const elapsedMs =
    sessionStartPerfMs > 0
      ? Math.max(0.01, Number((nowPerf - sessionStartPerfMs).toFixed(2)))
      : currentSnapshot.elapsedMs;
  const throughputBytesPerSec =
    elapsedMs > 0
      ? Math.round((currentSnapshot.totalBytesProcessed / elapsedMs) * 1000)
      : currentSnapshot.throughputBytesPerSec;

  currentSnapshot = {
    ...currentSnapshot,
    status: 'COMPLETED',
    updatedAtIso: new Date().toISOString(),
    elapsedMs,
    completedCertCount: params.completedCertCount,
    throughputBytesPerSec,
    peakThroughputBytesPerSec: Math.max(
      currentSnapshot.peakThroughputBytesPerSec,
      throughputBytesPerSec
    ),
    activeStreamFile: null,
    rawEngineLine: `ENGINE_DONE :: certs=${params.completedCertCount}/${currentSnapshot.plannedCertCount} files=${currentSnapshot.totalFilesProcessed} bytes=${currentSnapshot.totalBytesProcessed} dt=${elapsedMs}ms sha=${params.checksum}`,
  };
  emitSessionUpdate();
}

export function failEngineSession(errorMessage: string): void {
  const nowPerf = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const elapsedMs =
    sessionStartPerfMs > 0
      ? Math.max(0.01, Number((nowPerf - sessionStartPerfMs).toFixed(2)))
      : currentSnapshot.elapsedMs;

  currentSnapshot = {
    ...currentSnapshot,
    status: 'ERROR',
    updatedAtIso: new Date().toISOString(),
    elapsedMs,
    activeStreamFile: null,
    lastError: errorMessage,
    rawEngineLine: `ENGINE_ERR :: ${errorMessage}`,
  };
  emitSessionUpdate();
}

export function formatEngineBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${Math.round(bytes).toLocaleString('en-US')} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatThroughput(bytesPerSec: number): string {
  if (!Number.isFinite(bytesPerSec) || bytesPerSec <= 0) return '0 B/s';
  if (bytesPerSec < 1024) return `${Math.round(bytesPerSec).toLocaleString('en-US')} B/s`;
  if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSec / (1024 * 1024)).toFixed(2)} MB/s`;
}

export interface EngineDebugTelemetryExportPayload {
  schemaVersion: '1.0';
  exportedAtIso: string;
  session: {
    sessionId: string;
    planId: string | null;
    status: RawEngineStatus;
    direction: TransferDirection | 'NONE';
    targetDrive: string;
    startedAtIso: string | null;
    updatedAtIso: string;
    elapsedMs: number;
    plannedCertCount: number;
    completedCertCount: number;
    activeStreamFile: string | null;
    rawEngineLine: string;
    lastError: string | null;
  };
  buffer: EngineBufferConfigSnapshot & {
    formattedIoBuffer: string;
    formattedChunkWindow: string;
    formattedMaxCertFileGuard: string;
    formattedTotalBufferAllocated: string;
  };
  throughput: {
    totalBytesProcessed: number;
    totalFilesProcessed: number;
    throughputBytesPerSec: number;
    peakThroughputBytesPerSec: number;
    formattedSessionRate: string;
    formattedPeakRate: string;
    formattedTotalBytes: string;
  };
  streams: EngineFileStreamMetric[];
}

export function buildEngineDebugTelemetryExportPayload(
  snapshot: EngineDebugSessionSnapshot = getEngineDebugSession()
): EngineDebugTelemetryExportPayload {
  return {
    schemaVersion: '1.0',
    exportedAtIso: new Date().toISOString(),
    session: {
      sessionId: snapshot.sessionId,
      planId: snapshot.planId,
      status: snapshot.status,
      direction: snapshot.direction,
      targetDrive: snapshot.targetDrive,
      startedAtIso: snapshot.startedAtIso,
      updatedAtIso: snapshot.updatedAtIso,
      elapsedMs: snapshot.elapsedMs,
      plannedCertCount: snapshot.plannedCertCount,
      completedCertCount: snapshot.completedCertCount,
      activeStreamFile: snapshot.activeStreamFile,
      rawEngineLine: snapshot.rawEngineLine,
      lastError: snapshot.lastError ?? null,
    },
    buffer: {
      ...snapshot.bufferConfig,
      formattedIoBuffer: formatEngineBytes(snapshot.bufferConfig.ioBufferBytes),
      formattedChunkWindow: formatEngineBytes(snapshot.bufferConfig.streamChunkBytes),
      formattedMaxCertFileGuard: formatEngineBytes(snapshot.bufferConfig.maxCertFileBytes),
      formattedTotalBufferAllocated: formatEngineBytes(
        snapshot.bufferConfig.totalBufferAllocatedBytes
      ),
    },
    throughput: {
      totalBytesProcessed: snapshot.totalBytesProcessed,
      totalFilesProcessed: snapshot.totalFilesProcessed,
      throughputBytesPerSec: snapshot.throughputBytesPerSec,
      peakThroughputBytesPerSec: snapshot.peakThroughputBytesPerSec,
      formattedSessionRate: formatThroughput(snapshot.throughputBytesPerSec),
      formattedPeakRate: formatThroughput(snapshot.peakThroughputBytesPerSec),
      formattedTotalBytes: formatEngineBytes(snapshot.totalBytesProcessed),
    },
    streams: snapshot.streams.map(s => ({ ...s })),
  };
}

export function exportEngineDebugSessionAsJson(
  snapshot: EngineDebugSessionSnapshot = getEngineDebugSession()
): string {
  const payload = buildEngineDebugTelemetryExportPayload(snapshot);
  const jsonContent = JSON.stringify(payload, null, 2);

  if (typeof document !== 'undefined' && typeof URL !== 'undefined') {
    const safeSession = (snapshot.sessionId || 'idle').replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateTag = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kcert-engine-telemetry-${safeSession}-${dateTag}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  return jsonContent;
}

