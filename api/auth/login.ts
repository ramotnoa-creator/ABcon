/**
 * Vercel Serverless Function: Login
 *
 * Handles user authentication server-side.
 * Password verification with bcrypt happens here, NOT in the browser.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const databaseUrl = process.env.NEON_DATABASE_URL;
  if (!databaseUrl) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  try {
    const sql = neon(databaseUrl);

    // Fetch user by email
    const users = await sql.query(
      `SELECT id, email, password_hash, full_name, phone, role, is_active,
              last_login, created_at, updated_at
       FROM user_profiles
       WHERE email = $1`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const dbUser = users[0];

    // Verify password with bcrypt (SERVER-SIDE)
    const passwordMatch = await bcrypt.compare(password, dbUser.password_hash as string);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!dbUser.is_active) {
      return res.status(403).json({ error: 'Account inactive' });
    }

    // Update last login
    await sql.query(
      `UPDATE user_profiles SET last_login = NOW() WHERE id = $1`,
      [dbUser.id]
    );

    // Fetch user's assigned projects
    const assignments = await sql.query(
      `SELECT project_id FROM project_assignments WHERE user_id = $1`,
      [dbUser.id]
    );

    return res.status(200).json({
      user: {
        id: dbUser.id,
        email: dbUser.email,
        full_name: dbUser.full_name,
        phone: dbUser.phone || undefined,
        role: dbUser.role,
        is_active: dbUser.is_active,
        last_login: new Date().toISOString(),
        created_at: dbUser.created_at,
        updated_at: dbUser.updated_at,
        assignedProjects: assignments.map((a: { project_id: string }) => a.project_id),
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    console.error('Login error:', message);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}
