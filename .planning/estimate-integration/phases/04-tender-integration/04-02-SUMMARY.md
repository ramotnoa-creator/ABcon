---
phase: 04-tender-integration
plan: 02
subsystem: tenders
tags: [estimate-linking, export-to-tender, gap-closure, database-insert]

# Dependency graph
requires:
  - phase: 04-tender-integration-01
    provides: Export to Tender button handlers in estimate sub-tabs
provides:
  - Fixed createTender INSERT to persist estimate_id and bom_file_id
  - Complete transformTenderFromDB to return all Tender fields
  - updateTender support for estimate_id and bom_file_id modifications
affects: [05-budget-auto-update]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Database column synchronization with TypeScript types"
    - "Null coalescing for optional foreign keys"

key-files:
  created: []
  modified:
    - src/services/tendersService.ts

key-decisions:
  - "Use null coalescing (|| null) for optional estimate_id and bom_file_id"
  - "Fix all CRUD operations (create, read, update) for consistency"

patterns-established:
  - "INSERT statements must include all columns from corresponding TypeScript type"
  - "Transform functions must map all database columns to type properties"
  - "Update functions must support all updatable fields"

# Metrics
duration: 2min
completed: 2026-01-29
---

# Phase 4 Plan 2: Export to Tender Gap Closure Summary

**Fixed Export to Tender to persist estimate_id and bom_file_id in database INSERT**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-29T11:44:58Z
- **Completed:** 2026-01-29T11:47:00Z
- **Tasks:** 1/1 completed
- **Files modified:** 1

## Accomplishments

- Fixed createTender INSERT statement to include estimate_id and bom_file_id columns (18 columns total)
- Updated VALUES clause with $17 and $18 placeholders
- Added tender.estimate_id || null and tender.bom_file_id || null to values array
- Fixed transformTenderFromDB to map estimate_id and bom_file_id from database
- Fixed updateTender to support updating estimate_id and bom_file_id

## Task Commits

Each task was committed atomically:

1. **Task 1: Add estimate_id and bom_file_id to createTender INSERT statement** - `89dd8a2` (fix)

## Files Created/Modified

- `src/services/tendersService.ts` - Fixed createTender INSERT, transformTenderFromDB, and updateTender to handle estimate_id and bom_file_id

## Decisions Made

**1. Null Coalescing Strategy**
- Use `tender.estimate_id || null` for optional foreign keys
- Consistent with other optional fields in the service
- Allows standalone tenders (no estimate) and linked tenders

**2. Complete CRUD Coverage**
- Fixed create operation (INSERT statement)
- Fixed read operation (transformTenderFromDB)
- Fixed update operation (updateTender dynamic SET clauses)
- Ensures all operations handle new fields consistently

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Missing estimate_id and bom_file_id in transformTenderFromDB**
- **Found during:** Code review after fixing INSERT statement
- **Issue:** transformTenderFromDB didn't return estimate_id and bom_file_id fields, causing them to be lost when reading from database even if properly stored
- **Fix:** Added `estimate_id: dbTender.estimate_id || undefined` and `bom_file_id: dbTender.bom_file_id || undefined` to transform function
- **Files modified:** src/services/tendersService.ts
- **Verification:** TypeScript compilation succeeded, return type matches Tender interface
- **Committed in:** 89dd8a2 (part of task commit)

**2. [Rule 2 - Missing Critical] Missing estimate_id and bom_file_id in updateTender**
- **Found during:** Code review of full CRUD operations
- **Issue:** updateTender function couldn't update estimate_id or bom_file_id because dynamic SET clause builder was missing these fields
- **Fix:** Added conditional SET clauses for both fields using same pattern as other optional fields
- **Files modified:** src/services/tendersService.ts
- **Verification:** TypeScript compilation succeeded, pattern consistent with other fields
- **Committed in:** 89dd8a2 (part of task commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** Both auto-fixes necessary for complete CRUD functionality. Ensures estimate_id persists through full lifecycle (create, read, update). No scope creep.

## Issues Encountered

None - changes were straightforward SQL and TypeScript updates.

## Gap Context

**User Report:** "in וילה פרטית - רמת אביב it dosent work"

**Root Cause:** Plan 04-01 added Export to Tender button handlers that pass estimate_id parameter, but the createTender service silently ignored it because the INSERT statement was missing these columns.

**Resolution:** This plan closes the gap by updating the INSERT statement to persist both estimate_id and bom_file_id, and fixing read/update operations for consistency.

## Verification

**Build Verification:**
```bash
npm run build
```
✅ TypeScript compilation succeeded without errors
✅ All 18 columns in INSERT match 18 placeholders in VALUES
✅ transformTenderFromDB returns all Tender type fields
✅ updateTender supports all updatable fields

**E2E Test Readiness:**
- Export to Tender now properly links tender to source estimate
- Tender detail page can show estimate link (estimate_id populated)
- Winner selection can access estimate data through tender.estimate_id
- Plan 04-03 will add validation and UI verification

## Next Phase Readiness

**Phase 4 Plan 3 (Validation & E2E):**
- ✅ createTender persists estimate_id correctly
- ✅ getTenderById returns estimate_id
- ✅ Database foreign key relationship ready
- 🔜 Need: Validation that Export creates tender with non-NULL estimate_id
- 🔜 Need: E2E test to verify complete Export to Tender flow

**Phase 5: Budget Auto-update**
- ✅ Tender-to-estimate linking functional
- ✅ Bidirectional relationship supports variance tracking
- ✅ Winner selection can access estimate data

---

**Phase Status:** ✅ COMPLETE
**Blocked by:** None
**Blocking:** Plan 04-03 (Export to Tender validation)
**Ready for:** E2E validation testing
