/**
 * Database Table Creator
 * Creates estimates, estimate_items, and bom_files tables
 */

const { neon } = require('@neondatabase/serverless');
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
    // Ignore error
  }
}

if (!databaseUrl) {
  console.error('Error: VITE_NEON_DATABASE_URL environment variable not set');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function main() {
  console.log('Creating estimate tables...\n');

  try {
    // Create estimates table
    console.log('Creating estimates table...');
    await sql`
      CREATE TABLE IF NOT EXISTS estimates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        estimate_type VARCHAR(20) NOT NULL CHECK (estimate_type IN ('planning', 'execution')),
        name VARCHAR(200) NOT NULL,
        description TEXT,
        total_amount DECIMAL(15,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'exported_to_tender')),
        created_by UUID,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✓ Estimates table created');

    // Create indexes for estimates
    console.log('Creating indexes for estimates...');
    await sql`CREATE INDEX IF NOT EXISTS idx_estimates_project ON estimates(project_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_estimates_type ON estimates(estimate_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_estimates_status ON estimates(status)`;
    console.log('✓ Estimates indexes created');

    // Create estimate_items table
    console.log('Creating estimate_items table...');
    await sql`
      CREATE TABLE IF NOT EXISTS estimate_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
        code VARCHAR(50),
        description TEXT NOT NULL,
        category VARCHAR(100),
        subcategory VARCHAR(100),
        unit VARCHAR(50),
        quantity DECIMAL(10,2),
        unit_price DECIMAL(15,2),
        total_price DECIMAL(15,2),
        vat_rate DECIMAL(5,2) DEFAULT 17.00,
        vat_amount DECIMAL(15,2),
        total_with_vat DECIMAL(15,2),
        notes TEXT,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✓ Estimate_items table created');

    // Create indexes for estimate_items
    console.log('Creating indexes for estimate_items...');
    await sql`CREATE INDEX IF NOT EXISTS idx_estimate_items_estimate ON estimate_items(estimate_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_estimate_items_category ON estimate_items(category)`;
    console.log('✓ Estimate_items indexes created');

    // Create bom_files table
    console.log('Creating bom_files table...');
    await sql`
      CREATE TABLE IF NOT EXISTS bom_files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        uploaded_by UUID,
        uploaded_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✓ BOM_files table created');

    // Create index for bom_files
    console.log('Creating index for bom_files...');
    await sql`CREATE INDEX IF NOT EXISTS idx_bom_tender ON bom_files(tender_id)`;
    console.log('✓ BOM_files index created');

    // Alter tenders table
    console.log('Adding columns to tenders table...');
    try {
      await sql`ALTER TABLE tenders ADD COLUMN IF NOT EXISTS estimate_id UUID REFERENCES estimates(id)`;
      await sql`ALTER TABLE tenders ADD COLUMN IF NOT EXISTS bom_file_id UUID REFERENCES bom_files(id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_tenders_estimate ON tenders(estimate_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_tenders_bom ON tenders(bom_file_id)`;
      console.log('✓ Tenders table updated');
    } catch (error) {
      console.log('⚠ Tenders table columns may already exist:', error.message);
    }

    // Alter budget_items table
    console.log('Adding columns to budget_items table...');
    try {
      await sql`ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS estimate_item_id UUID REFERENCES estimate_items(id)`;
      await sql`ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS estimate_amount DECIMAL(15,2)`;
      await sql`ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS variance_amount DECIMAL(15,2)`;
      await sql`ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS variance_percent DECIMAL(5,2)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_budget_items_estimate ON budget_items(estimate_item_id)`;
      console.log('✓ Budget_items table updated');
    } catch (error) {
      console.log('⚠ Budget_items table columns may already exist:', error.message);
    }

    console.log('\n✓ All tables and indexes created successfully!');
  } catch (error) {
    console.error('\n✗ Table creation failed:', error);
    process.exit(1);
  }
}

main();
