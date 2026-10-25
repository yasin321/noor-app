export type LogLevel = 'info' | 'warn' | 'error';

export interface AppLogEntry {
  timestamp: string;
  level: LogLevel;
  scope: string;
  message: string;
  meta?: Record<string, unknown>;
}

const LOG_STORAGE_KEY = 'noor_diagnostic_logs_v1';
const MAX_LOGS = 100;

export function logEvent(
  level: LogLevel,
  scope: string,
  message: string,
  meta?: Record<string, unknown>
): void {
  const entry: AppLogEntry = {
    timestamp: new Date().toISOString(),
    level,
    scope,
    message,
    meta,
  };

  const formatted = `[Noor][${entry.timestamp}][${level.toUpperCase()}][${scope}] ${message}`;
  if (level === 'error') {
    console.error(formatted, meta ?? '');
  } else if (level === 'warn') {
    console.warn(formatted, meta ?? '');
  } else {
    console.info(formatted, meta ?? '');
  }

  try {
    const raw = localStorage.getItem(LOG_STORAGE_KEY);
    const existing: AppLogEntry[] = raw ? JSON.parse(raw) : [];
    const updated = [entry, ...existing].slice(0, MAX_LOGS);
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore storage errors
  }
}

export function getDiagnosticLogs(): AppLogEntry[] {
  try {
    const raw = localStorage.getItem(LOG_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearDiagnosticLogs(): void {
  try {
    localStorage.removeItem(LOG_STORAGE_KEY);
  } catch {
    // ignore
  }
}
