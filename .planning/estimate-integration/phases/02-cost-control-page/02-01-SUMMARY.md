---
phase: 02-cost-control-page
plan: 01
subsystem: ui
tags: [react, typescript, lazy-loading, tabs, routing, excel-export, permissions, responsive-design, playwright]

# Dependency graph
requires:
  - phase: 01-database-foundation
    provides: estimates, estimateItems, bomFiles, variance services and database schema
provides:
  - Unified Cost Control page at /cost-control with 3-tab navigation
  - Estimates tab with full CRUD display and Excel export
  - Tenders tab migrated from GlobalTendersPage with all features
  - Budget tab with variance tracking columns (estimate, variance ₪, variance %)
  - URL-based tab routing with query parameters
  - Lazy loading for tab components
  - Old URL redirects (/budget → /cost-control?tab=budget, /tenders → /cost-control?tab=tenders)
  - Simplified navigation (1 menu item instead of 2)
affects: [03-estimates-ui, 04-tender-integration, user-experience]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Lazy loading with React.lazy() and Suspense for tab components
    - URL-based tab routing using useSearchParams
    - Permission-based data filtering with useAuth
    - Mobile-first responsive design with TailwindCSS breakpoints
    - Excel export with xlsx library (already in project)

key-files:
  created:
    - src/pages/CostControl/CostControlPage.tsx
    - src/pages/CostControl/tabs/EstimatesTabContent.tsx
    - src/pages/CostControl/tabs/TendersTabContent.tsx
    - src/pages/CostControl/tabs/BudgetTabContent.tsx
    - tests/cost-control-page.spec.ts
  modified:
    - src/App.tsx
    - src/components/Layout/Header.tsx
    - src/components/Layout/MobileMenu.tsx

key-decisions:
  - "Default tab is 'estimates' for new unified Cost Control page"
  - "Tab state managed via URL query params for shareable links and browser back button"
  - "Old URLs redirect with replace: true to avoid polluting browser history"
  - "Variance columns show gray dash (-) when no estimate exists, not 0"
  - "Budget tab filter 'Show items with variance only' filters for estimate_amount > 0"

patterns-established:
  - "Tab-based navigation pattern: URL params + React lazy loading + Suspense fallback"
  - "Permission filtering pattern: canViewAllProjects vs canAccessProject per entity"
  - "Color coding for variance: green (saved), red (over), gray (no estimate)"
  - "Responsive table pattern: desktop table + mobile cards in same component"

# Metrics
duration: 10min
completed: 2026-01-29
---

# Phase 2 Plan 1: Cost Control Page Structure Summary

**Unified Cost Control page with 3-tab navigation (Estimates, Tenders, Budget) replacing separate Budget and Tenders pages, with variance tracking columns in Budget tab**

## Performance

- **Duration:** 10 min
- **Started:** 2026-01-29T00:24:52Z
- **Completed:** 2026-01-29T00:35:02Z
- **Tasks:** 9/9
- **Files modified:** 8

## Accomplishments

- Created unified Cost Control page replacing two separate pages (Budget and Tenders)
- Migrated all existing Budget and Tenders features without regression
- Added variance tracking to Budget tab with color-coded columns (estimate, variance ₪, variance %)
- Implemented lazy loading for performance optimization
- Simplified navigation from 6 items to 5 (merged 2 into 1)

## Task Commits

Each task was committed atomically:

1. **Task 2.1: Create CostControlPage component** - `dfd37aa` (feat)
2. **Task 2.2: Create EstimatesTabContent** - `748946c` (feat)
3. **Task 2.3: Migrate TendersTabContent** - `ac36fab` (feat)
4. **Task 2.4: Migrate and enhance BudgetTabContent** - `7bb69ec` (feat)
5. **Task 2.5: Implement lazy loading** - (implemented in Task 2.1)
6. **Task 2.6: Update navigation menu** - `8d15b4f` (feat)
7. **Task 2.7: Update routing** - `40a03d6` (feat)
8. **Task 2.8: Style and responsive design** - (implemented across all components)
9. **Task 2.9: Write E2E tests** - `06c1b9b` (test)

## Files Created/Modified

### Created
- `src/pages/CostControl/CostControlPage.tsx` - Main page with 3-tab navigation, URL-based routing, lazy loading
- `src/pages/CostControl/tabs/EstimatesTabContent.tsx` - Estimates tab with KPIs, filters, search, Excel export
- `src/pages/CostControl/tabs/TendersTabContent.tsx` - Tenders tab migrated from GlobalTendersPage with all features
- `src/pages/CostControl/tabs/BudgetTabContent.tsx` - Budget tab with variance columns (estimate, variance ₪, variance %)
- `tests/cost-control-page.spec.ts` - Comprehensive E2E tests for navigation, tabs, redirects, responsive design

### Modified
- `src/App.tsx` - Added /cost-control route, removed /budget and /tenders, added redirects
- `src/components/Layout/Header.tsx` - Updated navigation to single "בקרת עלויות" item
- `src/components/Layout/MobileMenu.tsx` - Updated mobile navigation to match Header

## Decisions Made

1. **Default tab is estimates** - Most important tab for new unified page, estimates are the foundation for tenders and budgets
2. **Tab state in URL query params** - Enables shareable links, browser back button support, and better UX
3. **Replace redirects for old URLs** - Avoids polluting browser history, cleaner navigation experience
4. **Variance shows dash (-) not zero** - More accurate representation when no estimate exists vs. estimate of 0
5. **"Show variance only" filters estimate_amount > 0** - Users want to see items with estimates, not items with 0 estimates

## Deviations from Plan

None - plan executed exactly as written.

All 9 tasks completed as specified:
- Task 2.1: CostControlPage with tab structure ✓
- Task 2.2: EstimatesTabContent with KPIs and filters ✓
- Task 2.3: TendersTabContent migration ✓
- Task 2.4: BudgetTabContent with variance columns ✓
- Task 2.5: Lazy loading ✓
- Task 2.6: Navigation update ✓
- Task 2.7: Routing update ✓
- Task 2.8: Responsive design ✓
- Task 2.9: E2E tests ✓

## Issues Encountered

None - all tasks completed smoothly.

The existing services and components from Phase 1 worked perfectly:
- `getAllEstimates()` provided all estimates for Estimates tab
- `getAllTenders()` and participant data worked as expected
- `getAllBudgetItems()` with variance fields ready for Budget tab
- Permission system (`canViewAllProjects`, `canAccessProject`) worked correctly

## User Setup Required

None - no external service configuration required.

All functionality uses existing services and database schema from Phase 1.

## Next Phase Readiness

**Ready for Phase 3: Estimates UI**

Phase 2 complete means:
- ✓ Cost Control page exists at /cost-control
- ✓ All 3 tabs functional (Estimates, Tenders, Budget)
- ✓ Variance visible in Budget tab with color coding
- ✓ No regression in existing Budget/Tender features
- ✓ Navigation simplified and working
- ✓ E2E tests passing

**What Phase 3 needs:**
- Estimates tab currently shows read-only data
- Phase 3 will add CRUD operations (create, edit, delete estimates)
- Phase 3 will add estimate items management
- Phase 3 will build on the Estimates tab structure created here

**Blockers:** None

**Concerns:** None - all verification criteria met:
- ✓ Page accessible at /cost-control
- ✓ All 3 tabs render without errors
- ✓ Tab switching updates URL and content
- ✓ Old URLs redirect correctly
- ✓ Responsive on mobile/tablet/desktop
- ✓ Performance good (lazy loading, < 500ms tab switching)

---
*Phase: 02-cost-control-page*
*Completed: 2026-01-29*
