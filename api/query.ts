/**
 * Vercel Serverless Function: SQL Query Proxy
 *
 * Proxies parameterized SQL queries to Neon PostgreSQL.
 * DB credentials stay server-side only (NEON_DATABASE_URL, no VITE_ prefix).
 * Blocks dangerous DDL operations.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

// Only allow DML operations
const ALLOWED_FIRST_WORDS = new Set(['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'WITH']);

// Block dangerous DDL patterns even if they appear mid-query
const BLOCKED_PATTERNS = /\b(DROP\s+TABLE|DROP\s+SCHEMA|DROP\s+DATABASE|ALTER\s+TABLE\s+.*DROP|TRUNCATE|GRANT|REVOKE|CREATE\s+ROLE|CREATE\s+DATABASE|DROP\s+ROLE)\b/i;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers for the frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, params } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Invalid query' });
  }

  // Validate: only allow DML operations
  const firstWord = query.trim().split(/\s+/)[0].toUpperCase();
  if (!ALLOWED_FIRST_WORDS.has(firstWord)) {
    return res.status(403).json({ error: 'Operation not allowed' });
  }

  // Block dangerous patterns
  if (BLOCKED_PATTERNS.test(query)) {
    return res.status(403).json({ error: 'Operation not allowed' });
  }

  const databaseUrl = process.env.NEON_DATABASE_URL;
  if (!databaseUrl) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  try {
    const sql = neon(databaseUrl);
    const result = await sql.query(query, params || []);
    return res.status(200).json({ data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Database query failed';
    console.error('Database query error:', message);
    return res.status(500).json({ error: 'Database query failed' });
  }
}
