/**
 * Database Migration Runner
 * Executes SQL migrations for estimate integration
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get database URL from environment
const databaseUrl = process.env.VITE_NEON_DATABASE_URL;

if (!databaseUrl) {
  console.error('Error: VITE_NEON_DATABASE_URL environment variable not set');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function runMigration(filename: string) {
  console.log(`Running migration: ${filename}`);

  try {
    const migrationPath = join(__dirname, filename);
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Execute the migration
    await sql(migrationSQL);

    console.log(`✓ Successfully executed: ${filename}`);
  } catch (error) {
    console.error(`✗ Error executing ${filename}:`, error);
    throw error;
  }
}

async function main() {
  console.log('Starting database migrations...\n');

  try {
    // Run migrations in order
    await runMigration('001-create-estimates-schema.sql');
    await runMigration('002-alter-tenders-budget-items.sql');

    console.log('\n✓ All migrations completed successfully!');
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  }
}

main();
