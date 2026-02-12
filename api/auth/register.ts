/**
 * Vercel Serverless Function: Register
 *
 * Handles user registration server-side.
 * Password hashing with bcrypt happens here, NOT in the browser.
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

  const { email, password, full_name, phone, role } = req.body;

  if (!email || !password || !full_name || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const databaseUrl = process.env.NEON_DATABASE_URL?.replace(/\s+/g, '');
  if (!databaseUrl) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  try {
    const sql = neon(databaseUrl);

    // Hash password with bcrypt (SERVER-SIDE)
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert user
    const result = await sql`INSERT INTO user_profiles
       (email, password_hash, full_name, phone, role, is_active)
       VALUES (${email}, ${password_hash}, ${full_name}, ${phone || null}, ${role}, true)
       RETURNING id, email, full_name, phone, role, is_active, created_at, updated_at`;

    if (result.length === 0) {
      return res.status(500).json({ error: 'Failed to create user' });
    }

    const dbUser = result[0];

    return res.status(201).json({
      user: {
        id: dbUser.id,
        email: dbUser.email,
        full_name: dbUser.full_name,
        phone: dbUser.phone || undefined,
        role: dbUser.role,
        is_active: dbUser.is_active,
        created_at: dbUser.created_at,
        updated_at: dbUser.updated_at,
        assignedProjects: [],
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    console.error('Registration error:', message);

    if (message.includes('unique') || message.includes('duplicate')) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    return res.status(500).json({ error: 'Registration failed' });
  }
}
