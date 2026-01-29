---
phase: 04-tender-integration
plan: 01
subsystem: tenders
tags: [bom-upload, estimate-export, winner-selection, variance-preview, email-modal]

# Dependency graph
requires:
  - phase: 03-estimates-ui
    provides: estimates with items, estimate CRUD operations, EstimateSummaryCard
provides:
  - Export estimate to tender workflow with bidirectional linking
  - BOM file upload/download system (base64 in Neon, 10MB limit)
  - Send BOM email modal UI (Phase 2: actual sending)
  - Winner selection with variance preview
  - Auto-budget creation on winner selection
affects: [05-budget-auto-update, future-email-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "File upload with drag-and-drop using base64 storage"
    - "Modal-based variance preview before commit"
    - "Multi-step winner selection flow"

key-files:
  created:
    - src/components/Tenders/BOMUploader.tsx
    - src/components/Tenders/SendBOMEmailModal.tsx
    - src/components/Tenders/WinnerSelectionModal.tsx
    - tests/tender-integration.spec.ts
  modified:
    - src/pages/Projects/tabs/subtabs/PlanningEstimateSubTab.tsx
    - src/pages/Projects/tabs/subtabs/ExecutionEstimateSubTab.tsx
    - src/pages/Projects/tabs/subtabs/TendersSubTab.tsx

key-decisions:
  - "BOM files stored as base64 in Neon (max 10MB)"
  - "Email modal is UI-only for MVP, actual sending deferred to Phase 2"
  - "Winner selection uses two-step modal (select → preview variance → confirm)"
  - "Variance color coding: green for savings, red for over-budget"
  - "Budget item auto-created when winner selected (if contract amount exists)"

patterns-established:
  - "Export workflow: button → create entity → link back → navigate"
  - "File upload: validate → progress indicator → store → success callback"
  - "Preview before commit: show impact → allow cancel → confirm action"

# Metrics
duration: 25min
completed: 2026-01-29
---

# Phase 4 Plan 1: Tender Integration & BOM Summary

**Complete estimate-to-tender-to-winner flow with BOM upload and variance preview**

## Performance

- **Duration:** 25 min
- **Started:** 2026-01-29T08:43:17Z
- **Completed:** 2026-01-29T09:08:28Z
- **Tasks:** 9/9 completed
- **Files modified:** 6 created, 3 modified
- **Bug fixes:** 9 TypeScript compilation errors resolved

## Accomplishments

- **End-to-end estimate → tender → winner flow** fully functional
- **BOM file system** with upload/download/delete (Word docs up to 10MB)
- **Email modal UI** ready for Phase 2 integration (copy emails, download BOM)
- **Winner selection** shows variance preview (green savings, red over-budget)
- **Auto-budget creation** on winner selection with supplier linking

## Task Commits

Each task was committed atomically:

1. **Task 4.1: Add Export to Tender button** - `f6a00d5` (feat)
2. **Task 4.2: Show source estimate in tender** - `5082bfa` (feat)
3. **Task 4.3: Create BOMUploader component** - `daa2704` (feat)
4. **Task 4.4: Integrate BOM uploader in tender** - `fef8fa8` (feat)
5. **Task 4.5: Create SendBOMEmailModal** - `a5056a0` (feat)
6. **Task 4.6: Add Send BOM button** - `0e92536` (feat)
7. **Task 4.7: Create WinnerSelectionModal** - `2e47deb` (feat)
8. **Task 4.8: Integrate winner selection modal** - `80de7e3` (feat)
9. **Task 4.9: Write integration tests** - `942467b` (test)

**Bug fixes:** `0bd6fa4` (fix: TypeScript compilation errors)

## Files Created/Modified

### Created
- `src/components/Tenders/BOMUploader.tsx` - Drag-and-drop file uploader with validation
- `src/components/Tenders/SendBOMEmailModal.tsx` - Email template modal (UI-only, Phase 2)
- `src/components/Tenders/WinnerSelectionModal.tsx` - Variance preview before winner confirmation
- `tests/tender-integration.spec.ts` - E2E tests for complete flow

### Modified
- `src/pages/Projects/tabs/subtabs/PlanningEstimateSubTab.tsx` - Added Export to Tender button
- `src/pages/Projects/tabs/subtabs/ExecutionEstimateSubTab.tsx` - Added Export to Tender button
- `src/pages/Projects/tabs/subtabs/TendersSubTab.tsx` - Integrated BOM uploader, email modal, winner selection

## Decisions Made

**1. BOM Storage Strategy**
- Store as base64 in Neon (10MB limit per Decision 001)
- Simple for MVP, avoids external storage dependency
- Upload shows progress bar (simulated for base64)

**2. Email Modal Approach**
- UI-only for MVP (copy emails, download BOM manually)
- Clear Phase 2 notice for users
- Disabled "Send" button with tooltip explaining future availability

**3. Winner Selection Flow**
- Two-step modal: select participant → preview variance → confirm
- Shows estimated budget vs contract amount
- Color-coded variance (green savings, red over-budget)
- Explains what will happen (budget creation, supplier linking)
- User can go back or cancel at any step

**4. Budget Auto-creation**
- Winner selection automatically creates budget item
- Links to: tender, estimate, supplier (professional)
- Uses contract amount (with fallback to quote amount)
- Smart chapter assignment via `findChapterForTender` utility

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript compilation errors**
- **Found during:** Final build verification
- **Issues:**
  - Null vs undefined type mismatch in AddEstimateItemForm
  - Missing null check for optional category field in EstimateItemsTable
  - Wrong function signature in neon.ts (sql() vs sql.query())
  - Missing imports for getAllBudgetCategories/getAllBudgetChapters
  - Wrong type assertion for BudgetCategoryType
  - Missing type assertions for max_order queries (returned unknown)
- **Fixes:**
  - Changed `null` to `undefined` for notes field consistency
  - Added conditional rendering for category display
  - Used sql.query() for all queries to accept string queries
  - Updated imports to use "getAll" versions for global page
  - Fixed type assertion to use BudgetCategoryType instead of hardcoded union
  - Added explicit number type assertions for max_order results
- **Files modified:**
  - src/components/Estimates/AddEstimateItemForm.tsx
  - src/components/Estimates/EstimateItemsTable.tsx
  - src/lib/neon.ts
  - src/pages/CostControl/tabs/BudgetTabContent.tsx
  - src/services/budgetCategoriesService.ts
  - src/services/budgetChaptersService.ts
  - src/services/budgetItemsService.ts
  - src/services/planningChangesService.ts
  - src/services/unitsService.ts
- **Verification:** `npm run build` succeeded without errors
- **Committed in:** `0bd6fa4` (fix commit)

## Integration Flow Verified

### Complete User Journey
1. User creates estimate with items in Planning or Execution tab
2. Clicks "Export to Tender" button
3. System creates tender pre-filled with estimate data
4. Tender shows link back to source estimate
5. User uploads BOM file (.doc/.docx, drag-and-drop or click)
6. User clicks "Send BOM to Participants" → modal shows participant emails
7. User copies emails, downloads BOM, sends manually via their email client
8. Participants submit quotes (manual entry in participant details)
9. User clicks "Select Winner" → two-step modal:
   - Step 1: Choose participant
   - Step 2: Enter contract amount (pre-filled with quote)
   - Variance preview: Shows savings or over-budget with color coding
10. System confirms winner and auto-creates budget item
11. Budget item links to tender, estimate, and supplier

### Edge Cases Handled
- BOM > 10MB rejected with clear error
- Invalid file types (.pdf, .txt) rejected
- No participants → Send BOM button hidden
- No BOM → Send BOM button hidden
- Variance handles zero and negative amounts correctly
- Budget creation only if contract amount exists
- Chapter selection uses smart mapping for tender type

## Next Phase Readiness

**Phase 5: Budget Auto-update**
- ✅ Winner selection creates budget item automatically
- ✅ Budget item links to estimate (estimate_item_id field exists)
- ✅ Variance calculation ready (varianceService exists)
- ⚠️ Need to implement: Real-time variance updates when estimate changes
- ⚠️ Need to implement: Bulk variance recalculation

**Future Email Integration (Phase 2 of Project)**
- ✅ Email modal UI ready
- ✅ Participant list and BOM download functional
- ✅ Email template designed and visible to users
- ⚠️ Need: Email service integration (SendGrid/AWS SES)
- ⚠️ Need: Email queue system for bulk sends

## Testing Coverage

**Integration Tests (Playwright):**
- ✅ Export estimate to tender
- ✅ Upload BOM file (with size/type validation)
- ✅ Send BOM modal shows participants
- ✅ Winner selection shows variance preview
- ✅ Complete flow: estimate → tender → BOM → winner

**Manual Testing Needed:**
- File download verification (different browsers)
- Email copy functionality (different OS clipboard behaviors)
- Variance color coding with various amounts
- Budget item creation with different tender types

## Known Limitations

1. **BOM File Size:** 10MB limit (Neon constraint)
2. **Email Sending:** Manual for MVP (Phase 2: automated)
3. **File Types:** Only .doc/.docx (design decision)
4. **Budget Creation:** Single item per tender (sufficient for MVP)
5. **Variance Updates:** Static at winner selection (Phase 5: real-time)

---

**Phase Status:** ✅ COMPLETE
**Blocked by:** None
**Blocking:** Phase 5 (Budget Auto-update)
**Ready for:** User acceptance testing, Phase 5 implementation
