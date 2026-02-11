/**
 * Neon Database Client
 * PostgreSQL connection for AB Projects
 */

import { neon } from '@neondatabase/serverless';
import { logDbError } from './logger';

// Get database URL from environment — trim whitespace and strip query params
// that the neon serverless driver (HTTP-based) cannot parse
const rawUrl = import.meta.env.VITE_NEON_DATABASE_URL?.trim() ?? '';
const databaseUrl = rawUrl ? rawUrl.split('?')[0] : '';

// Check if we're in demo/dev mode (no database configured)
export const isDemoMode = !databaseUrl || import.meta.env.VITE_DEV_MODE === 'true';

// Create Neon SQL client (serverless-compatible)
export const sql = databaseUrl ? neon(databaseUrl) : null;

/**
 * Execute a SQL query with type safety
 * @param query SQL query string with $1, $2, etc. placeholders
 * @param params Query parameters (optional)
 * @returns Query results
 */
export async function executeQuery<T = unknown>(
  query: string,
  params?: unknown[]
): Promise<T[]> {
  if (!sql) {
    throw new Error('Database not configured - check VITE_NEON_DATABASE_URL');
  }

  try {
    // Use sql.query() for all queries (supports parameterized queries with $1, $2, etc.)
    const result = await sql.query(query, params || []);

    return result as T[];
  } catch (error) {
    logDbError('query', 'unknown', error);
    throw error;
  }
}

/**
 * Execute a SQL query and return a single row
 * @param query SQL query string
 * @param params Query parameters (optional)
 * @returns Single row or null
 */
export async function executeQuerySingle<T = unknown>(
  query: string,
  params?: unknown[]
): Promise<T | null> {
  const result = await executeQuery<T>(query, params);
  return result.length > 0 ? result[0] : null;
}

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
