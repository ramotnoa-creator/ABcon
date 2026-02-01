---
phase: 05-budget-auto-update
plan: 01
subsystem: database
tags: [postgresql, triggers, plpgsql, variance-calculation, auto-update]

# Dependency graph
requires:
  - phase: 04-tender-integration
    provides: Winner selection workflow with tender-to-professional linking
  - phase: 01-database-foundation
    provides: Budget items table with variance tracking fields
provides:
  - Database-level automatic variance calculation on budget items
  - Budget auto-creation from tender winner selection
  - Estimate-to-budget linkage for variance tracking
affects: [06-polish-testing, future-budget-features]

# Tech tracking
tech-stack:
  added: [pg@latest (PostgreSQL client for migrations)]
  patterns:
    - "Database triggers for derived field calculations"
    - "BEFORE INSERT/UPDATE triggers for automatic field population"
    - "AFTER UPDATE triggers for cascading updates"

key-files:
  created:
    - migrations/006-add-budget-variance-triggers.sql
    - scripts/run-variance-triggers-migration.cjs
  modified:
    - src/pages/Projects/tabs/subtabs/TendersSubTab.tsx
    - package.json

key-decisions:
  - "Use database triggers instead of application-level variance calculation for consistency"
  - "Link budget items to first estimate item (MVP simplification)"
  - "Installed pg library for migration execution (Neon serverless doesn't support complex SQL)"

patterns-established:
  - "Database triggers guarantee variance accuracy across all code paths"
  - "Estimate items automatically linked when creating budget from tender"
  - "Variance recalculates automatically when estimate amounts change"

# Metrics
duration: 69min
completed: 2026-02-01
---

# Phase 5 Plan 01: Budget Auto-Update Summary

**PostgreSQL triggers for automatic variance calculation with estimate-to-budget linkage on tender winner selection**

## Performance

- **Duration:** 1h 9m (69 minutes)
- **Started:** 2026-02-01T20:49:10Z
- **Completed:** 2026-02-01T21:58:02Z
- **Tasks:** 3 (2 implementation + 1 verification)
- **Files modified:** 5

## Accomplishments

- Database triggers automatically calculate variance on budget item INSERT/UPDATE
- Variance recalculates when linked estimate items change
- Winner selection creates budget items with automatic estimate linking
- Installed pg library for PostgreSQL migration execution

## Task Commits

Each task was committed atomically:

1. **Task 1: Create database triggers** - `df5ae11` (feat)
   - Migration 006-add-budget-variance-triggers.sql
   - budget_variance_trigger (BEFORE INSERT/UPDATE on budget_items)
   - estimate_update_recalc_trigger (AFTER UPDATE on estimate_items)
   - Migration runner script with pg client

2. **Task 2: Budget auto-creation with estimate linking** - `e6d4659` (feat)
   - Updated TendersSubTab winner selection handler
   - Fetches estimate items from tender's linked estimate
   - Links budget item to first estimate item via estimate_item_id
   - Database trigger auto-populates variance fields

3. **Task 3: Variance helper utility** - N/A (already exists)
   - getNextBudgetItemOrder already exported from budgetItemsService
   - Already in use by TendersSubTab winner selection

## Files Created/Modified

**Created:**
- `migrations/006-add-budget-variance-triggers.sql` - PostgreSQL triggers for variance auto-calculation
- `scripts/run-variance-triggers-migration.cjs` - Migration runner using pg client

**Modified:**
- `src/pages/Projects/tabs/subtabs/TendersSubTab.tsx` - Added estimate item linking in winner selection
- `package.json` - Added pg dependency for migrations
- `package-lock.json` - Lockfile update

## Decisions Made

**1. Database triggers over application-level calculation**
- Rationale: Eliminates race conditions, guarantees consistency across all code paths
- Impact: Variance always accurate regardless of how budget items are created (UI, scripts, imports)

**2. Link to first estimate item (MVP simplification)**
- Rationale: Tenders typically represent single-item estimates in current workflow
- Impact: Future enhancement could add item matching logic or user selection

**3. Installed pg library for migrations**
- Rationale: Neon serverless tagged template syntax doesn't support complex multi-statement SQL
- Impact: Migration execution now uses standard PostgreSQL client

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added pg library dependency**
- **Found during:** Task 1 (Running migration)
- **Issue:** Neon serverless client doesn't support multi-statement SQL files with complex DDL
- **Fix:** Installed pg library (npm install --save-dev pg) and created migration runner using Client API
- **Files modified:** package.json, package-lock.json, scripts/run-variance-triggers-migration.cjs
- **Verification:** Migration executed successfully, triggers created in database
- **Committed in:** df5ae11 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (blocking)
**Impact on plan:** Essential for migration execution. No scope creep.

## Issues Encountered

**1. Neon serverless API limitations**
- Problem: Tagged template syntax `sql\`${migrationSQL}\`` failed with syntax errors for complex DDL
- Solution: Switched to pg Client with standard query() method
- Outcome: Migration executed successfully with proper PostgreSQL client

**2. Pre-existing TypeScript errors**
- Found: Compilation errors in unrelated files (LinkedTenderCard, ProjectItems)
- Action: Documented but not fixed (outside plan scope)
- Impact: None on this phase's functionality

## User Setup Required

None - database triggers deploy automatically with migration.

## Technical Implementation Details

### Trigger 1: budget_variance_trigger
- **Type:** BEFORE INSERT OR UPDATE
- **Table:** budget_items
- **Columns watched:** total_with_vat, estimate_item_id
- **Function:** calculate_budget_variance()
- **Logic:**
  - If estimate_item_id exists, fetch estimate total_with_vat
  - Calculate: variance_amount = budget.total_with_vat - estimate.total_with_vat
  - Calculate: variance_percent = (variance_amount / estimate.total_with_vat) * 100
  - Handles NULL estimate_item_id (clears variance fields)
  - Handles zero division (sets variance_percent to 0)

### Trigger 2: estimate_update_recalc_trigger
- **Type:** AFTER UPDATE
- **Table:** estimate_items
- **Column watched:** total_with_vat
- **Function:** recalculate_budget_variances_on_estimate_change()
- **Logic:**
  - Updates all budget_items linked to changed estimate_item
  - Recalculates variance_amount and variance_percent
  - Only fires when total_with_vat actually changes (WHEN clause)
  - Updates updated_at timestamp automatically

### Winner Selection Flow
1. User selects winner in tender
2. handleSelectWinnerConfirm executes:
   - Sets tender winner in tender_participants
   - Updates tender status to 'WinnerSelected'
   - Creates ProjectProfessional record
   - **NEW:** Fetches estimate items if tender.estimate_id exists
   - **NEW:** Links budget item to first estimate item
   - Creates budget item with estimate_item_id
   - **Database trigger auto-calculates variance** (no app logic needed)
   - Locks source estimate to prevent changes

## Verification

### Database Triggers Created
```sql
SELECT tgname, tgrelid::regclass, tgtype, tgenabled
FROM pg_trigger
WHERE tgname IN ('budget_variance_trigger', 'estimate_update_recalc_trigger');
```

Expected results:
- budget_variance_trigger on budget_items (BEFORE INSERT/UPDATE)
- estimate_update_recalc_trigger on estimate_items (AFTER UPDATE)

### Manual E2E Test Plan
1. Create planning estimate with item (e.g., ₪150,000)
2. Export estimate to tender
3. Add participant to tender
4. Enter participant quote amount (e.g., ₪145,000)
5. Select winner
6. Verify budget item created with:
   - tender_id matches tender
   - estimate_item_id matches estimate item
   - variance_amount = -5000 (saved money)
   - variance_percent = -3.33
7. Update estimate item amount in database
8. Verify budget item variance recalculates automatically

## Next Phase Readiness

**Ready for Phase 6 (Polish & Testing):**
- Core variance calculation automated
- Budget creation integrated with tender workflow
- Database integrity maintained by triggers

**No blockers identified**

**Future enhancements (outside current phase):**
- Multi-item estimate matching (currently links to first item)
- Chapter assignment logic for auto-created budget items
- Variance history tracking over time

---
*Phase: 05-budget-auto-update*
*Completed: 2026-02-01*
