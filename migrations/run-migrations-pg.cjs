/**
 * Database Migration Runner using pg
 * Executes SQL migrations for estimate integration
 */

const { Client } = require('pg');
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

async function runMigration(client, filename) {
  console.log(`Running migration: ${filename}`);

  try {
    const migrationPath = path.join(__dirname, filename);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Execute the migration
    await client.query(migrationSQL);

    console.log(`✓ Successfully executed: ${filename}`);
  } catch (error) {
    console.error(`✗ Error executing ${filename}:`, error);
    throw error;
  }
}

async function main() {
  const client = new Client({
    connectionString: databaseUrl,
  });

  console.log('Connecting to database...');
  await client.connect();
  console.log('Connected successfully!\n');

  console.log('Starting database migrations...\n');

  try {
    // Run migrations in order
    await runMigration(client, '001-create-estimates-schema.sql');
    await runMigration(client, '002-alter-tenders-budget-items.sql');

    console.log('\n✓ All migrations completed successfully!');
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

main();
