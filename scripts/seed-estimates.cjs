/**
 * Seed Estimates Data
 * Creates sample estimates and estimate items for testing
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
  console.log('Seeding estimate data...\n');

  try {
    // Get existing projects
    const projects = await sql`SELECT id, project_name FROM projects LIMIT 2`;

    if (projects.length < 2) {
      console.error('Need at least 2 projects in database. Please create projects first.');
      process.exit(1);
    }

    const [project1, project2] = projects;

    console.log(`Using projects: ${project1.project_name}, ${project2.project_name}`);

    // Delete existing seed estimates (idempotent)
    console.log('\nCleaning up existing seed data...');
    await sql`DELETE FROM estimates WHERE name LIKE '%[SEED]%'`;

    // Create Planning Estimate for Project 1
    console.log('\nCreating Planning Estimate for Project 1...');
    const planningEst1 = await sql`
      INSERT INTO estimates (
        project_id, estimate_type, name, description, total_amount, status, notes
      ) VALUES (
        ${project1.id},
        'planning',
        'Architectural Planning Estimate [SEED]',
        'Initial planning phase cost estimate including architectural design and permits',
        0,
        'active',
        'Created for testing - Phase 1 of project'
      )
      RETURNING *
    `;

    // Add items to Planning Estimate 1
    console.log('Adding items to Planning Estimate 1...');
    await sql`
      INSERT INTO estimate_items (
        estimate_id, code, description, category, subcategory, unit, quantity, unit_price,
        total_price, vat_rate, vat_amount, total_with_vat, order_index
      ) VALUES
      (
        ${planningEst1[0].id}, '01.01', 'Architectural Design Services',
        'Consultants', 'Architecture', 'Service', 1, 128205.13,
        128205.13, 17.00, 21794.87, 150000.00, 1
      ),
      (
        ${planningEst1[0].id}, '01.02', 'Structural Engineering',
        'Consultants', 'Engineering', 'Service', 1, 42735.04,
        42735.04, 17.00, 7264.96, 50000.00, 2
      ),
      (
        ${planningEst1[0].id}, '01.03', 'Building Permit Fees',
        'Legal & Permits', 'Permits', 'Flat Fee', 1, 25641.03,
        25641.03, 17.00, 4358.97, 30000.00, 3
      )
    `;

    // Update total_amount for Planning Estimate 1
    await sql`
      UPDATE estimates
      SET total_amount = (
        SELECT SUM(total_with_vat) FROM estimate_items WHERE estimate_id = ${planningEst1[0].id}
      )
      WHERE id = ${planningEst1[0].id}
    `;

    console.log('✓ Planning Estimate 1 created with 3 items');

    // Create Planning Estimate for Project 2
    console.log('\nCreating Planning Estimate for Project 2...');
    const planningEst2 = await sql`
      INSERT INTO estimates (
        project_id, estimate_type, name, description, total_amount, status, notes
      ) VALUES (
        ${project2.id},
        'planning',
        'MEP Planning Estimate [SEED]',
        'Mechanical, Electrical, and Plumbing design estimates',
        0,
        'draft',
        'Created for testing - MEP consultants'
      )
      RETURNING *
    `;

    // Add items to Planning Estimate 2
    console.log('Adding items to Planning Estimate 2...');
    await sql`
      INSERT INTO estimate_items (
        estimate_id, code, description, category, subcategory, unit, quantity, unit_price,
        total_price, vat_rate, vat_amount, total_with_vat, order_index
      ) VALUES
      (
        ${planningEst2[0].id}, '02.01', 'Electrical Engineering Design',
        'Consultants', 'Electrical', 'Service', 1, 34188.03,
        34188.03, 17.00, 5811.97, 40000.00, 1
      ),
      (
        ${planningEst2[0].id}, '02.02', 'Plumbing Design',
        'Consultants', 'Plumbing', 'Service', 1, 21367.52,
        21367.52, 17.00, 3632.48, 25000.00, 2
      )
    `;

    // Update total_amount for Planning Estimate 2
    await sql`
      UPDATE estimates
      SET total_amount = (
        SELECT SUM(total_with_vat) FROM estimate_items WHERE estimate_id = ${planningEst2[0].id}
      )
      WHERE id = ${planningEst2[0].id}
    `;

    console.log('✓ Planning Estimate 2 created with 2 items');

    // Create Execution Estimate for Project 1
    console.log('\nCreating Execution Estimate for Project 1...');
    const executionEst1 = await sql`
      INSERT INTO estimates (
        project_id, estimate_type, name, description, total_amount, status, notes
      ) VALUES (
        ${project1.id},
        'execution',
        'Construction Execution Estimate [SEED]',
        'Detailed construction cost estimate for execution phase',
        0,
        'active',
        'Created for testing - Construction phase'
      )
      RETURNING *
    `;

    // Add items to Execution Estimate 1
    console.log('Adding items to Execution Estimate 1...');
    await sql`
      INSERT INTO estimate_items (
        estimate_id, code, description, category, subcategory, unit, quantity, unit_price,
        total_price, vat_rate, vat_amount, total_with_vat, order_index
      ) VALUES
      (
        ${executionEst1[0].id}, '09.01', 'Concrete Works',
        'Contractors', 'Structure', 'Cubic Meter', 150, 854.70,
        128205.00, 17.00, 21794.85, 149999.85, 1
      ),
      (
        ${executionEst1[0].id}, '09.02', 'Steel Reinforcement',
        'Contractors', 'Structure', 'Ton', 25, 6410.26,
        160256.50, 17.00, 27243.61, 187500.11, 2
      ),
      (
        ${executionEst1[0].id}, '09.03', 'Masonry Works',
        'Contractors', 'Walls', 'Square Meter', 300, 256.41,
        76923.00, 17.00, 13076.91, 89999.91, 3
      ),
      (
        ${executionEst1[0].id}, '09.04', 'Flooring - Tiles',
        'Suppliers', 'Finishes', 'Square Meter', 200, 427.35,
        85470.00, 17.00, 14529.90, 99999.90, 4
      ),
      (
        ${executionEst1[0].id}, '09.05', 'Painting Works',
        'Contractors', 'Finishes', 'Square Meter', 500, 85.47,
        42735.00, 17.00, 7264.95, 49999.95, 5
      )
    `;

    // Update total_amount for Execution Estimate 1
    await sql`
      UPDATE estimates
      SET total_amount = (
        SELECT SUM(total_with_vat) FROM estimate_items WHERE estimate_id = ${executionEst1[0].id}
      )
      WHERE id = ${executionEst1[0].id}
    `;

    console.log('✓ Execution Estimate 1 created with 5 items');

    // Create Execution Estimate for Project 2
    console.log('\nCreating Execution Estimate for Project 2...');
    const executionEst2 = await sql`
      INSERT INTO estimates (
        project_id, estimate_type, name, description, total_amount, status, notes
      ) VALUES (
        ${project2.id},
        'execution',
        'Interior Finishes Estimate [SEED]',
        'Interior finishes and fixtures cost estimate',
        0,
        'draft',
        'Created for testing - Finishes phase'
      )
      RETURNING *
    `;

    // Add items to Execution Estimate 2
    console.log('Adding items to Execution Estimate 2...');
    await sql`
      INSERT INTO estimate_items (
        estimate_id, code, description, category, subcategory, unit, quantity, unit_price,
        total_price, vat_rate, vat_amount, total_with_vat, order_index
      ) VALUES
      (
        ${executionEst2[0].id}, '10.01', 'Kitchen Cabinets',
        'Suppliers', 'Kitchen', 'Linear Meter', 12, 2136.75,
        25641.00, 17.00, 4358.97, 29999.97, 1
      ),
      (
        ${executionEst2[0].id}, '10.02', 'Bathroom Fixtures',
        'Suppliers', 'Bathroom', 'Set', 3, 6410.26,
        19230.78, 17.00, 3269.23, 22500.01, 2
      ),
      (
        ${executionEst2[0].id}, '10.03', 'Door Installation',
        'Contractors', 'Doors', 'Unit', 8, 1282.05,
        10256.40, 17.00, 1743.59, 11999.99, 3
      )
    `;

    // Update total_amount for Execution Estimate 2
    await sql`
      UPDATE estimates
      SET total_amount = (
        SELECT SUM(total_with_vat) FROM estimate_items WHERE estimate_id = ${executionEst2[0].id}
      )
      WHERE id = ${executionEst2[0].id}
    `;

    console.log('✓ Execution Estimate 2 created with 3 items');

    // Summary
    console.log('\n=== Seed Data Summary ===');
    const summary = await sql`
      SELECT
        estimate_type,
        COUNT(*) as estimate_count,
        SUM(total_amount) as total_value
      FROM estimates
      WHERE name LIKE '%[SEED]%'
      GROUP BY estimate_type
    `;

    summary.forEach((row) => {
      console.log(`${row.estimate_type}: ${row.estimate_count} estimates, ₪${parseFloat(row.total_value).toLocaleString('he-IL', { minimumFractionDigits: 2 })}`);
    });

    const itemCount = await sql`
      SELECT COUNT(*) as count
      FROM estimate_items
      WHERE estimate_id IN (SELECT id FROM estimates WHERE name LIKE '%[SEED]%')
    `;

    console.log(`Total estimate items: ${itemCount[0].count}`);

    console.log('\n✓ Seed data created successfully!');
  } catch (error) {
    console.error('\n✗ Seed data creation failed:', error);
    process.exit(1);
  }
}

main();
