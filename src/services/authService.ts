/**
 * Authentication Service
 *
 * In production: auth operations go through /api/auth/* serverless functions.
 * Password hashing/verification happens server-side only.
 *
 * In local dev: if VITE_NEON_DATABASE_URL is set, uses direct connection
 * with client-side bcrypt (acceptable for development).
 */

import { executeQuerySingle, executeQuery, isDemoMode } from '../lib/neon';
import type { User, LoginCredentials, RegisterData } from '../types/auth';

// Determine if we should use API endpoints (production) or direct DB (local dev)
const useApiEndpoints = !import.meta.env.VITE_NEON_DATABASE_URL?.trim();

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(
  credentials: LoginCredentials
): Promise<User | null> {
  if (isDemoMode) {
    return null;
  }

  if (useApiEndpoints) {
    // Production: use server-side auth endpoint
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: credentials.email, password: credentials.password }),
    });

    if (response.status === 401) {
      return null;
    }

    if (response.status === 403) {
      throw new Error('חשבון זה אינו פעיל. אנא פנה למנהל המערכת.');
    }

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    const { user } = await response.json();
    return user;
  }

  // Local dev: direct DB connection with client-side bcrypt
  const bcrypt = await import('bcryptjs');

  try {
    const result = await executeQuerySingle<{
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
    }>(
      `SELECT id, email, password_hash, full_name, phone, role, is_active,
              last_login, created_at, updated_at
       FROM user_profiles
       WHERE email = $1`,
      [credentials.email]
    );

    if (!result) {
      return null;
    }

    const passwordMatch = await bcrypt.compare(
      credentials.password,
      result.password_hash
    );

    if (!passwordMatch) {
      return null;
    }

    if (!result.is_active) {
      throw new Error('חשבון זה אינו פעיל. אנא פנה למנהל המערכת.');
    }

    await executeQuery(
      `UPDATE user_profiles SET last_login = NOW() WHERE id = $1`,
      [result.id]
    );

    const assignments = await executeQuery<{ project_id: string }>(
      `SELECT project_id FROM project_assignments WHERE user_id = $1`,
      [result.id]
    );

    const user: User = {
      id: result.id,
      email: result.email,
      full_name: result.full_name,
      phone: result.phone || undefined,
      role: result.role,
      is_active: result.is_active,
      last_login: new Date().toISOString(),
      created_at: result.created_at,
      updated_at: result.updated_at,
      assignedProjects: assignments.map((a) => a.project_id),
    };

    return user;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  if (isDemoMode) {
    return null;
  }

  try {
    const result = await executeQuerySingle<{
      id: string;
      email: string;
      full_name: string;
      phone: string | null;
      role: 'admin' | 'project_manager' | 'entrepreneur' | 'accountant';
      is_active: boolean;
      last_login: string | null;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT id, email, full_name, phone, role, is_active,
              last_login, created_at, updated_at
       FROM user_profiles
       WHERE id = $1`,
      [userId]
    );

    if (!result) {
      return null;
    }

    const assignments = await executeQuery<{ project_id: string }>(
      `SELECT project_id FROM project_assignments WHERE user_id = $1`,
      [userId]
    );

    const user: User = {
      id: result.id,
      email: result.email,
      full_name: result.full_name,
      phone: result.phone || undefined,
      role: result.role,
      is_active: result.is_active,
      last_login: result.last_login || undefined,
      created_at: result.created_at,
      updated_at: result.updated_at,
      assignedProjects: assignments.map((a) => a.project_id),
    };

    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

/**
 * Register a new user (admin only)
 */
export async function registerUser(data: RegisterData): Promise<User> {
  if (isDemoMode) {
    throw new Error('Registration not available in demo mode');
  }

  if (useApiEndpoints) {
    // Production: use server-side register endpoint
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        phone: data.phone || null,
        role: data.role,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(errorData.error || 'Registration failed');
    }

    const { user } = await response.json();
    return user;
  }

  // Local dev: direct DB connection with client-side bcrypt
  const bcrypt = await import('bcryptjs');

  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(data.password, salt);

    const result = await executeQuerySingle<{
      id: string;
      email: string;
      full_name: string;
      phone: string | null;
      role: 'admin' | 'project_manager' | 'entrepreneur' | 'accountant';
      is_active: boolean;
      created_at: string;
      updated_at: string;
    }>(
      `INSERT INTO user_profiles
       (email, password_hash, full_name, phone, role, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, email, full_name, phone, role, is_active, created_at, updated_at`,
      [data.email, password_hash, data.full_name, data.phone || null, data.role]
    );

    if (!result) {
      throw new Error('Failed to create user');
    }

    const user: User = {
      id: result.id,
      email: result.email,
      full_name: result.full_name,
      phone: result.phone || undefined,
      role: result.role,
      is_active: result.is_active,
      created_at: result.created_at,
      updated_at: result.updated_at,
      assignedProjects: [],
    };

    return user;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

/**
 * Update user password
 */
export async function updateUserPassword(
  userId: string,
  newPassword: string
): Promise<void> {
  if (isDemoMode) {
    throw new Error('Password update not available in demo mode');
  }

  if (useApiEndpoints) {
    // Production: use server-side endpoint
    const response = await fetch('/api/auth/update-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, newPassword }),
    });

    if (!response.ok) {
      throw new Error('Password update failed');
    }
    return;
  }

  // Local dev: direct DB connection with client-side bcrypt
  const bcrypt = await import('bcryptjs');

  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    await executeQuery(
      `UPDATE user_profiles SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [password_hash, userId]
    );
  } catch (error) {
    console.error('Password update error:', error);
    throw error;
  }
}

/**
 * Session management using localStorage
 */
const SESSION_KEY = 'abcon_auth_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface AuthSession {
  user: User;
  expiresAt: number;
}

export function saveSession(user: User): void {
  const session: AuthSession = {
    user,
    expiresAt: Date.now() + SESSION_DURATION,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): AuthSession | null {
  const sessionData = localStorage.getItem(SESSION_KEY);
  if (!sessionData) {
    return null;
  }

  try {
    const session: AuthSession = JSON.parse(sessionData);

    if (Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }

    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function refreshSession(user: User): void {
  saveSession(user);
}
