/**
 * Database Migration Runner for 006-add-budget-variance-triggers.sql
 * Executes SQL migration for budget variance auto-calculation
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Get database URL from environment
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

async function runMigration(client) {
  const migrationFile = '006-add-budget-variance-triggers.sql';
  console.log(`Running migration: ${migrationFile}`);

  try {
    const migrationPath = path.join(__dirname, '..', 'migrations', migrationFile);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Execute the migration
    await client.query(migrationSQL);

    console.log(`✓ Successfully executed: ${migrationFile}`);
  } catch (error) {
    console.error(`✗ Error executing ${migrationFile}:`, error);
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

  console.log('Starting migration for budget variance triggers...\n');

  try {
    await runMigration(client);
    console.log('\n✓ Migration completed successfully!');
    console.log('\nCreated triggers:');
    console.log('  - budget_variance_trigger (BEFORE INSERT/UPDATE on budget_items)');
    console.log('  - estimate_update_recalc_trigger (AFTER UPDATE on estimate_items)');
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

main();
