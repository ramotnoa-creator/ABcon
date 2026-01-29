---
status: diagnosed
trigger: "Analyze requirement: prevent creating tenders without estimate linkage"
created: 2026-01-29T00:00:00Z
updated: 2026-01-29T00:10:00Z
goal: find_root_cause_only
symptoms_prefilled: true
---

## Current Focus

hypothesis: Multiple tender creation flows exist - need to identify all entry points and determine enforcement strategy
test: Search codebase for tender creation UI and service calls
expecting: Find all locations where tenders can be created, assess current estimate linkage
next_action: Investigate tender creation flows and UI entry points

## Symptoms

expected: All tenders must be linked to an estimate - cannot create standalone tender
actual: Users can currently create tenders without estimate linkage
errors: None (missing business rule enforcement)
reproduction: Navigate to tender creation UI and create tender without selecting estimate
started: Always been possible (missing requirement enforcement from beginning)

## Eliminated

## Evidence

- timestamp: 2026-01-29T00:05:00Z
  checked: Tender type definition in src/types.ts lines 119-143
  found: Tender interface includes optional estimate_id and bom_file_id fields (lines 138-140) - added in Phase 1 but not enforced
  implication: Database schema supports estimate linkage but it's not required

- timestamp: 2026-01-29T00:06:00Z
  checked: Database schema supabase/migrations/001_initial_schema_neon.sql
  found: tenders table does NOT have estimate_id or bom_file_id columns - only in TypeScript types
  implication: Migration for estimate integration hasn't been applied yet - fields are planned but not implemented

- timestamp: 2026-01-29T00:07:00Z
  checked: Tender creation UI in src/pages/Projects/tabs/TendersTab.tsx lines 265-307
  found: handleAddTender function creates tenders with project_id, no estimate_id validation or UI field
  implication: Primary tender creation flow has no estimate linkage UI or validation

- timestamp: 2026-01-29T00:08:00Z
  checked: Tender service in src/services/tendersService.ts lines 92-152
  found: createTender function accepts Omit<Tender, id|timestamps> but doesn't validate or require estimate_id
  implication: Service layer has no business rule enforcement for estimate requirement

- timestamp: 2026-01-29T00:09:00Z
  checked: TendersTab.tsx modal form lines 914-1028
  found: Add Tender Modal has fields for tender_name, tender_type, due_date, estimated_budget, description, milestone_id - NO estimate selector
  implication: UI doesn't provide way to select estimate even if user wanted to

- timestamp: 2026-01-29T00:10:00Z
  checked: Other tender creation locations
  found: TendersTabContent.tsx (Cost Control page) is read-only - only displays tenders. TendersSubTab.tsx appears to be legacy/duplicate code
  implication: Single primary creation flow in TendersTab.tsx needs modification

- timestamp: 2026-01-29T00:11:00Z
  checked: Phase 01 verification report .planning/estimate-integration/phases/01-database-foundation/01-database-foundation-VERIFICATION.md
  found: Migration files exist (migrations/002-alter-tenders-budget-items.sql) but uncertain if executed. Services exist but orphaned (not imported anywhere)
  implication: Database foundation may be in place but migrations not run, services not wired up to UI

- timestamp: 2026-01-29T00:12:00Z
  checked: Migration file migrations/002-alter-tenders-budget-items.sql
  found: Contains ALTER TABLE statements to add estimate_id and bom_file_id to tenders table with foreign key constraints
  implication: Migration exists and is idempotent - can be safely run to add columns

- timestamp: 2026-01-29T00:13:00Z
  checked: Estimates service src/services/estimatesService.ts
  found: Full CRUD service exists with getEstimates(projectId, type?) function that can return planning/execution estimates
  implication: Backend service ready to provide estimate list for dropdown selector

- timestamp: 2026-01-29T00:14:00Z
  checked: Estimate types in src/types.ts
  found: Estimate interface exists with id, name, estimate_type (planning|execution), status fields
  implication: Data model is ready for estimate selection in tender form

## Resolution

root_cause: Tenders can be created without estimate linkage due to incomplete estimate integration implementation:

**Infrastructure exists but disconnected:**
1. Database migration exists (migrations/002-alter-tenders-budget-items.sql) but may not be executed
2. TypeScript types have estimate_id/bom_file_id fields (src/types.ts lines 138-140) but optional
3. Estimates service exists (src/services/estimatesService.ts) but not imported in TendersTab
4. No UI component for estimate selection in Add Tender modal

**Root cause layers:**
- **Database layer**: Migration file ready but execution status unknown (Phase 1 verification gap)
- **Service layer**: No validation enforcing estimate_id requirement
- **UI layer**: No estimate selector dropdown in tender creation form (lines 914-1028)
- **Business logic**: Requirement "all tenders must link estimate" not encoded anywhere

**Why this happened:**
Phase 1 (database foundation) created infrastructure but was marked as having "gaps" - services orphaned, migrations uncertain. Phase 4 (tender integration) started before Phase 1 was fully verified and wired up.

fix: **Recommended implementation approach:**

**Step 1: Verify/Run Database Migration**
- Check if migrations/002-alter-tenders-budget-items.sql was executed
- If not, run migration to add estimate_id and bom_file_id columns to tenders table
- Migration is idempotent (safe to re-run)

**Step 2: Update Tender Creation UI (TendersTab.tsx)**
- Import getEstimates from estimatesService
- Add estimate selector dropdown to Add Tender modal (around line 995)
- Load available estimates for project on modal open
- Display estimate as: "[Type] Name - ₪X,XXX" (e.g., "הערכה תכנון משרד - ₪500,000")
- Make field REQUIRED with asterisk and validation

**Step 3: Update Form State and Validation**
- Add estimate_id to tenderForm state (line 174)
- Add validation in handleAddTender (line 266) to reject if !estimate_id
- Show error message: "חובה לבחור הערכה למכרז"

**Step 4: Update Service Layer**
- Modify createTender in tendersService.ts to include estimate_id in INSERT
- Add server-side validation to reject tenders without estimate_id
- Update TypeScript type to make estimate_id non-optional (breaking change consideration)

**Step 5: Handle Existing Data**
- Existing tenders without estimate_id should be grandfathered (allow viewing/editing)
- Consider adding banner in UI: "מכרז ישן - לא מקושר להערכה"
- Or: Create migration wizard to link old tenders to estimates retroactively

**Alternative: Soft requirement (recommended for MVP)**
- Keep estimate_id optional in database but REQUIRED in UI
- Allows flexibility for edge cases while enforcing business rule in normal flow
- Simpler migration path for existing data

verification:
- Cannot submit Add Tender form without selecting estimate
- Form shows validation error "חובה לבחור הערכה למכרז" if estimate not selected
- Dropdown shows all planning and execution estimates for current project
- Created tender has estimate_id populated in database
- Existing tenders without estimate_id still display (grandfathered)
- Error handling if no estimates exist: "אין הערכות זמינות - צור הערכה תחילה"

files_changed:
- migrations/002-alter-tenders-budget-items.sql (execute existing migration)
- src/pages/Projects/tabs/TendersTab.tsx (add estimate selector UI and validation)
- src/services/tendersService.ts (add estimate_id to INSERT statement)
- Optional: src/types.ts (consider making estimate_id non-optional with migration plan)
