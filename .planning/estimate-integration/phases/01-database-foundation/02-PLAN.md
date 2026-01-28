---
phase: 01-database-foundation
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/verify-schema.cjs
autonomous: true
gap_closure: true

must_haves:
  truths:
    - "Database schema exists and is queryable"
    - "All expected tables are present in Neon database"
    - "All expected columns exist with correct types"
  artifacts:
    - path: "scripts/verify-schema.cjs"
      provides: "Database schema verification script"
      min_lines: 50
  key_links:
    - from: "scripts/verify-schema.cjs"
      to: "Neon database"
      via: "SQL queries"
      pattern: "sql`SELECT.*information_schema"
---

<objective>
Verify that database schema was successfully executed against Neon database.

Purpose: Close verification gap by proving tables exist and are accessible.
Output: Verification script that queries database schema and confirms all tables/columns present.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/estimate-integration/ROADMAP.md
@.planning/STATE.md
@.planning/estimate-integration/phases/01-database-foundation/01-SUMMARY.md
@migrations/001-create-estimates-schema.sql
@migrations/002-alter-tenders-budget-items.sql
</context>

<tasks>

<task type="auto">
  <name>Create database schema verification script</name>
  <files>scripts/verify-schema.cjs</files>
  <action>
Create Node.js script that verifies database schema completeness.

**Script requirements:**
1. Connect to Neon database using existing connection from src/lib/neon.ts pattern
2. Query information_schema.tables to verify table existence
3. Query information_schema.columns to verify column existence and types
4. Check for indexes on key foreign key columns

**Tables to verify:**
- estimates (with columns: id, project_id, estimate_type, name, total_amount, status, created_by, notes, created_at, updated_at)
- estimate_items (with columns: id, estimate_id, code, description, category, subcategory, unit, quantity, unit_price, total_price, vat_rate, vat_amount, total_with_vat, notes, order_index, created_at, updated_at)
- bom_files (with columns: id, tender_id, file_name, file_path, file_size, mime_type, uploaded_by, uploaded_at)

**Modified tables to verify:**
- tenders (new columns: estimate_id, bom_file_id)
- budget_items (new columns: estimate_item_id, estimate_amount, variance_amount, variance_percent)

**Indexes to verify:**
- idx_estimates_project
- idx_estimates_type
- idx_estimates_status
- idx_estimate_items_estimate
- idx_estimate_items_category
- idx_bom_tender
- idx_tenders_estimate
- idx_tenders_bom
- idx_budget_items_estimate

**Output format:**
Print ✓ for each verified table/column/index with green checkmarks.
Print ✗ for any missing items with red X marks.
Exit with code 0 if all verified, code 1 if any missing.

Use Neon client tagged template syntax: sql`SELECT...`
Read DATABASE_URL from .env file manually (not using dotenv package).
  </action>
  <verify>node scripts/verify-schema.cjs - exits with code 0 and shows all green checkmarks</verify>
  <done>Database schema verified as complete with all tables, columns, and indexes present</done>
</task>

</tasks>

<verification>
**Gap closure criteria:**
- [ ] Script runs without errors
- [ ] All 3 new tables found in database
- [ ] All new columns found in tenders and budget_items
- [ ] All indexes exist
- [ ] Script output clearly shows what exists
- [ ] Exit code 0 indicates success

**How to verify gap is closed:**
Run `node scripts/verify-schema.cjs` and confirm all items show ✓ green checkmarks.
</verification>

<success_criteria>
**This plan succeeds when:**
1. Verification script executes against live Neon database
2. All tables from migrations/001-create-estimates-schema.sql are found
3. All alterations from migrations/002-alter-tenders-budget-items.sql are found
4. All indexes are present
5. Script output proves schema is complete

**Measurable outcome:**
`node scripts/verify-schema.cjs` exits with code 0 and displays comprehensive schema verification results.
</success_criteria>

<output>
After completion, create `.planning/estimate-integration/phases/01-database-foundation/01-02-SUMMARY.md`
</output>
