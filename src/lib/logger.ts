/**
 * Centralized Logger
 * Ring buffer of recent log entries — replaces scattered console.error calls.
 * Extensible: swap in Sentry/remote transport later by editing this file.
 */

export type LogLevel = 'info' | 'warn' | 'error';
export type LogCategory = 'db' | 'auth' | 'ui' | 'system';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  metadata?: Record<string, unknown>;
}

const MAX_ENTRIES = 200;
const logs: LogEntry[] = [];

export function log(
  level: LogLevel,
  category: LogCategory,
  message: string,
  metadata?: Record<string, unknown>,
): void {
  const entry: LogEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    metadata,
  };

  logs.push(entry);
  if (logs.length > MAX_ENTRIES) logs.shift();

  // Console output in development
  if (import.meta.env.DEV) {
    const fn =
      level === 'error'
        ? console.error
        : level === 'warn'
          ? console.warn
          : console.log;
    fn(`[${category}] ${message}`, metadata || '');
  }
}

/** Convenience: log a failed DB operation */
export function logDbError(operation: string, table: string, error: unknown): void {
  log('error', 'db', `DB ${operation} failed on ${table}`, {
    operation,
    table,
    error: error instanceof Error ? error.message : String(error),
  });
}

/** Convenience: log a successful DB operation */
export function logDbSuccess(operation: string, table: string, count?: number): void {
  log(
    'info',
    'db',
    `DB ${operation} on ${table}` + (count !== undefined ? ` (${count} rows)` : ''),
    { operation, table, count },
  );
}

/** Return recent log entries, optionally filtered */
export function getRecentLogs(filter?: {
  level?: LogLevel;
  category?: LogCategory;
}): LogEntry[] {
  if (!filter) return [...logs];
  return logs.filter(
    (e) =>
      (!filter.level || e.level === filter.level) &&
      (!filter.category || e.category === filter.category),
  );
}

/** Count errors in the buffer */
export function getErrorCount(): number {
  return logs.filter((e) => e.level === 'error').length;
}
