/**
 * DB Connection Health Check
 * Runs SELECT 1 via executeQuery (API proxy in prod, direct in local dev).
 * Called once on app load; status exposed for SystemStatusBanner.
 */

import { executeQuery, isDemoMode } from './neon';
import { log } from './logger';

export type DbStatus = 'connected' | 'disconnected' | 'demo_mode' | 'checking';

let currentStatus: DbStatus = 'checking';
let lastCheckedAt: string | null = null;

export async function checkDbHealth(): Promise<DbStatus> {
  if (isDemoMode) {
    currentStatus = 'demo_mode';
    log('info', 'system', 'DB health check: demo mode (no DB configured)');
    lastCheckedAt = new Date().toISOString();
    return currentStatus;
  }

  try {
    await executeQuery('SELECT 1');
    currentStatus = 'connected';
    log('info', 'system', 'DB health check: connected');
  } catch (error) {
    currentStatus = 'disconnected';
    log('error', 'system', 'DB health check: disconnected', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  lastCheckedAt = new Date().toISOString();
  return currentStatus;
}

export function getDbStatus(): DbStatus {
  return currentStatus;
}

export function getLastCheckedAt(): string | null {
  return lastCheckedAt;
}
