/**
 * Database Migration Runner
 * Executes SQL migrations for estimate integration
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Get database URL from environment
// Read from .env file manually
let databaseUrl = process.env.VITE_NEON_DATABASE_URL;

if (!databaseUrl) {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/VITE_NEON_DATABASE_URL=(.+)/);
    if (match) {
      databaseUrl = match[1].trim();
    }
  } catch (error) {
    // Ignore error, will be caught below
  }
}

if (!databaseUrl) {
  console.error('Error: VITE_NEON_DATABASE_URL environment variable not set');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function runMigration(filename) {
  console.log(`Running migration: ${filename}`);

  try {
    const migrationPath = path.join(__dirname, filename);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Execute the migration using tagged template syntax
    // Create a proper tagged template by using Function constructor
    const result = await sql`${migrationSQL}`;

    console.log(`✓ Successfully executed: ${filename}`);
    return result;
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
