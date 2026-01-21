/**
 * Authentication Service - Neon Database
 * Handles user authentication with password hashing
 */

import bcrypt from 'bcryptjs';
import { sql, executeQuerySingle, executeQuery, isDemoMode } from '../lib/neon';
import type { User, LoginCredentials, RegisterData } from '../types/auth';

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(
  credentials: LoginCredentials
): Promise<User | null> {
  if (isDemoMode || !sql) {
    return null;
  }

  try {
    // Fetch user by email
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

    // Verify password with bcrypt
    const passwordMatch = await bcrypt.compare(
      credentials.password,
      result.password_hash
    );

    if (!passwordMatch) {
      return null;
    }

    // Check if user is active
    if (!result.is_active) {
      throw new Error('חשבון זה אינו פעיל. אנא פנה למנהל המערכת.');
    }

    // Update last login
    await executeQuery(
      `UPDATE user_profiles SET last_login = NOW() WHERE id = $1`,
      [result.id]
    );

    // Fetch user's assigned projects
    const assignments = await executeQuery<{ project_id: string }>(
      `SELECT project_id FROM project_assignments WHERE user_id = $1`,
      [result.id]
    );

    // Return user object (without password_hash)
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
  if (isDemoMode || !sql) {
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

    // Fetch user's assigned projects
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
  if (isDemoMode || !sql) {
    throw new Error('Registration not available in demo mode');
  }

  try {
    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(data.password, salt);

    // Insert user
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
  if (isDemoMode || !sql) {
    throw new Error('Password update not available in demo mode');
  }

  try {
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    // Update password
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

    // Check if session expired
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
