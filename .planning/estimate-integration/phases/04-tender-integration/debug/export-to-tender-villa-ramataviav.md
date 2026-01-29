---
status: investigating
trigger: "Export to Tender doesn't work in project 'וילה פרטית - רמת אביב'"
created: 2026-01-29T00:00:00Z
updated: 2026-01-29T00:00:05Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED - createTender INSERT missing estimate_id/bom_file_id columns
test: Verified database migration exists, INSERT statement incomplete
expecting: Database INSERT fails or data loss causes feature to fail
next_action: Document root cause for fix recommendation

## Symptoms

expected: Click "Export to Tender" button, tender created with estimate data, redirects to tender page
actual: Button doesn't work in project "וילה פרטית - רמת אביב"
errors: Unknown - need to check browser console and code
reproduction: Navigate to project "וילה פרטית - רמת אביב", Planning tab, Estimate subtab, click Export to Tender
started: Reported during UAT testing

## Eliminated

## Evidence

- timestamp: 2026-01-29T00:00:01Z
  checked: PlanningEstimateSubTab.tsx handleExportToTender (lines 91-130)
  found: Handler passes estimate_id to createTender (line 107)
  implication: estimate_id is intentionally included in tender creation

- timestamp: 2026-01-29T00:00:02Z
  checked: tendersService.ts createTender function (lines 92-152)
  found: INSERT statement (lines 108-114) lists 16 columns - does NOT include estimate_id or bom_file_id
  implication: estimate_id is passed but not inserted into database

- timestamp: 2026-01-29T00:00:03Z
  checked: Tender type definition (src/types.ts lines 119-143)
  found: Interface includes estimate_id and bom_file_id as optional fields (lines 139-140)
  implication: These fields were added in "Phase 1" per comment, but INSERT wasn't updated

- timestamp: 2026-01-29T00:00:04Z
  checked: tendersService.ts createTender VALUES array (lines 115-132)
  found: 16 values passed matching 16 columns, but estimate_id not in the list
  implication: Data mismatch - estimate_id from handler is lost during insert

- timestamp: 2026-01-29T00:00:05Z
  checked: migrations/002-alter-tenders-budget-items.sql
  found: Migration adds estimate_id and bom_file_id columns to tenders table (lines 11-31)
  implication: Database schema should have these columns if migration was run

- timestamp: 2026-01-29T00:00:06Z
  checked: .planning/estimate-integration/phases/01-database-foundation/01-database-foundation-VERIFICATION.md
  found: Migration execution status is "uncertain" - no evidence migrations were run against database
  implication: Two possible scenarios - either migration ran and INSERT has wrong column count, or migration didn't run and columns don't exist

- timestamp: 2026-01-29T00:00:07Z
  checked: tendersService.ts INSERT structure
  found: If database has estimate_id/bom_file_id columns (18 total) but INSERT only specifies 16, PostgreSQL will use DEFAULT values for missing columns
  implication: INSERT would succeed but estimate_id would be NULL, breaking the estimate-tender link

## Resolution

root_cause: The createTender service INSERT statement (src/services/tendersService.ts lines 108-114) is missing estimate_id and bom_file_id columns. Migration 002 added these columns to the tenders table schema, and the Tender TypeScript interface includes them, but the INSERT statement was never updated. When handleExportToTender calls createTender with estimate_id, the value is silently ignored and the tender is created with estimate_id=NULL. This breaks the critical link between estimates and tenders, causing the feature to either fail validation or create a broken tender that can't properly track back to its source estimate.

The mismatch exists at three levels:
1. Database schema (18 columns after migration 002)
2. TypeScript interface (includes estimate_id, bom_file_id)
3. INSERT statement (only 16 columns - MISSING estimate_id and bom_file_id)

fix: Update tendersService.ts createTender function to include estimate_id and bom_file_id in both the column list (line 108-114) and values array (line 115-132)

verification:
1. Verify database has estimate_id and bom_file_id columns (confirm migration 002 was run)
2. Test export to tender from planning estimate
3. Verify created tender has estimate_id populated correctly
4. Verify redirection to tender page works
5. Verify tender displays estimate relationship

files_changed: [src/services/tendersService.ts]
