/**
 * Neon Database Client
 * PostgreSQL connection for AB Projects
 *
 * In production (Vercel): queries go through /api/query serverless function.
 * DB credentials stay server-side only (NEON_DATABASE_URL).
 *
 * In local dev: if VITE_NEON_DATABASE_URL is set, connects directly
 * (developer already has credentials locally).
 */

import { logDbError } from './logger';

// Local dev: direct connection if VITE_NEON_DATABASE_URL is set
const rawUrl = import.meta.env.VITE_NEON_DATABASE_URL?.trim() ?? '';
const localDatabaseUrl = rawUrl ? rawUrl.split('?')[0] : '';

// Check if we're in demo/dev mode
export const isDemoMode = import.meta.env.VITE_DEV_MODE === 'true';

// Determine connection mode
const useDirectConnection = !!localDatabaseUrl && !isDemoMode;

// Only import neon driver for local dev (not loaded in production)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sql: any = null;
let sqlReady: Promise<void> | null = null;

if (useDirectConnection) {
  sqlReady = import('@neondatabase/serverless').then(({ neon }) => {
    sql = neon(localDatabaseUrl);
  });
}

/**
 * Execute a SQL query with type safety.
 * Routes through /api/query in production, direct connection in local dev.
 */
export async function executeQuery<T = unknown>(
  query: string,
  params?: unknown[]
): Promise<T[]> {
  if (isDemoMode) {
    throw new Error('Database not available in demo mode');
  }

  try {
    if (useDirectConnection) {
      // Local dev: direct Neon connection
      if (sqlReady) await sqlReady;
      if (!sql) throw new Error('Database not configured - check VITE_NEON_DATABASE_URL');
      const result = await sql.query(query, params || []);
      return result as T[];
    } else {
      // Production: proxy through Vercel serverless function
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, params: params || [] }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Database query failed' }));
        throw new Error(errorData.error || `Database query failed (${response.status})`);
      }

      const { data } = await response.json();
      return data as T[];
    }
  } catch (error) {
    logDbError('query', 'unknown', error);
    throw error;
  }
}

/**
 * Execute a SQL query and return a single row
 */
export async function executeQuerySingle<T = unknown>(
  query: string,
  params?: unknown[]
): Promise<T | null> {
  const result = await executeQuery<T>(query, params);
  return result.length > 0 ? result[0] : null;
}

// Re-export sql for backward compatibility (used by authService for isDemoMode check)
export { sql };

// Database types matching our Neon schema
export interface UserProfile {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone: string | null;
  role: 'admin' | 'project_manager' | 'entrepreneur' | 'accountant';
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  project_name: string;
  client_name: string;
  address: string | null;
  status: 'תכנון' | 'היתרים' | 'מכרזים' | 'ביצוע' | 'מסירה' | 'ארכיון';
  permit_start_date: string | null;
  permit_duration_months: number | null;
  permit_target_date: string | null;
  permit_approval_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectAssignment {
  id: string;
  user_id: string;
  project_id: string;
  assigned_at: string;
}
