# Estimate Integration - Project Roadmap

## Overview

Build unified Cost Control system (בקרת עלויות) integrating Estimates, Tenders, and Budget.

**Timeline:** 10-12 weeks (6 phases)
**Status:** Ready for Execution

---

## Phase 1: Database Foundation
**Duration:** 2 weeks
**Goal:** Create database schema and core services for estimates

### What We're Building
Database tables and TypeScript services to store and manage estimates, estimate items, BOM files, and variance tracking.

### Success Criteria
- All database tables created and indexed
- CRUD operations work for estimates and items
- Variance calculations accurate (tested with sample data)
- Services have >80% test coverage
- Demo data loaded successfully

### Deliverables
- [ ] `estimates` table with indexes
- [ ] `estimate_items` table with indexes
- [ ] `bom_files` table with indexes
- [ ] Modify `tenders` table (add estimate_id, bom_file_id columns)
- [ ] Modify `budget_items` table (add estimate_item_id, estimate_amount, variance_amount, variance_percent)
- [ ] `estimatesService.ts` - CRUD for estimates
- [ ] `estimateItemsService.ts` - CRUD for estimate items with calculations
- [ ] `bomFilesService.ts` - Upload/download BOM files
- [ ] `varianceService.ts` - Calculate variance between estimate and budget
- [ ] Unit tests for all services
- [ ] Migration scripts with rollback capability
- [ ] Demo/seed data for testing

### Dependencies
None - foundational phase

### Risk Areas
- Database migration on production (plan rollback strategy)
- Variance calculation logic (needs thorough testing)

---

## Phase 2: Cost Control Page Structure
**Duration:** 2 weeks
**Goal:** Build unified global page with 3-tab navigation

### What We're Building
Single Cost Control page that replaces separate Budget and Tenders pages. All financial data accessible in one place with tab navigation.

### Success Criteria
- All 3 tabs load without errors
- Tab switching < 500ms
- Existing budget/tender data displays correctly
- Navigation menu updated (1 item instead of 2)
- Mobile responsive
- Lazy loading works (tabs only load when active)

### Deliverables
- [x] `CostControlPage.tsx` with 3-tab structure
- [x] Estimates tab - basic list view with filters
- [x] Tenders tab - migrate GlobalTendersPage content
- [x] Budget tab - migrate GlobalBudgetPage content + add variance columns
- [x] Add variance columns to Budget tab: Estimate, Variance ₪, Variance %
- [x] Add "Show items with variance only" filter
- [x] Lazy loading implementation per tab
- [x] Update navigation menu (remove תקציב, מכרזים - add בקרת עלויות)
- [x] URL routing with query params (?tab=estimates)
- [x] Responsive design (mobile/tablet/desktop)
- [x] E2E tests for tab navigation and switching

### Dependencies
- Phase 1 complete (database and services exist)
- Existing GlobalBudgetPage code
- Existing GlobalTendersPage code

### Risk Areas
- Migrating existing Budget/Tenders functionality without breaking
- Performance with many records (use pagination)

---

## Phase 3: Estimates UI & Project Financial Tab
**Duration:** 2 weeks
**Goal:** Build estimate creation UI and unified project financial tab

### What We're Building
User interface to create planning and execution estimates with line items. Replace separate Budget/Tenders tabs in project detail with unified Financial tab.

### Success Criteria
- Users can create planning/execution estimates
- Users can add/edit/delete estimate items
- Totals calculate correctly (including VAT)
- Existing budget/tender functionality preserved
- All data persists to database
- Form validation prevents errors

### Deliverables
- [x] `FinancialTab.tsx` for project detail page (5 sub-tabs)
- [x] Planning Estimate sub-tab with item table
- [x] Execution Estimate sub-tab with item table
- [x] `AddEstimateItemForm.tsx` component with validation
- [x] `EstimateItemsTable.tsx` with sorting, filtering, inline edit
- [x] Summary cards showing totals (with VAT calculation)
- [x] Migrate BudgetTab content to Financial/Budget sub-tab
- [x] Migrate TendersTab content to Financial/Tenders sub-tab
- [x] Update ProjectDetailPage to use Financial tab
- [x] Auto-save functionality (skipped - modal-based save sufficient per Decision D009)
- [x] E2E tests for estimate creation workflow

### Dependencies
- Phase 1 complete (services)
- Phase 2 complete (page structure)
- Existing BudgetTab code
- Existing TendersTab code

### Risk Areas
- Form validation complexity (lots of fields)
- VAT calculation accuracy (17% fixed)
- User experience with many estimate items (use virtual scrolling if needed)

---

## Phase 4: Tender Integration & BOM
**Duration:** 2 weeks
**Goal:** Link estimates to tenders and implement BOM file system
**Status:** ✅ Complete (2026-01-29)

### What We're Building
"Export to Tender" functionality that creates tenders pre-filled with estimate data. BOM file upload/download system. Winner selection modal with variance preview.

### Success Criteria
- ✅ Export to tender creates linked tender with all estimate data
- ✅ BOM files upload successfully (up to 10MB)
- ✅ BOM files download correctly
- ✅ Email modal shows participants (send disabled for Phase 2)
- ✅ Winner selection shows variance calculation
- ✅ File storage reliable (no corruption)

### Deliverables
- [x] "Export to Tender" button in estimate UI
- [x] Create tender pre-filled with estimate data
- [x] Link tender to source estimate (bidirectional)
- [x] `BOMUploader.tsx` component with progress indicator
- [x] BOM file upload functionality (to Neon database or cloud)
- [x] BOM file download functionality
- [x] File validation (size, type, virus scan if possible)
- [x] `SendBOMEmailModal.tsx` with disabled send button
- [x] Display participant emails for manual copying
- [x] Winner selection modal with variance preview
- [x] Budget creation confirmation dialog
- [x] Integration tests: estimate → tender → budget flow

### Dependencies
- Phase 3 complete (estimate UI)
- Existing tender creation logic
- File storage setup (Neon or S3 configured)

### Risk Areas
- Large file uploads (test with 10MB files)
- File storage reliability (use transactions)
- Browser memory with large files (chunked upload)

---

## Phase 5: Budget Auto-Update & Variance Display
**Duration:** 2 weeks
**Goal:** Automate budget creation and display variance throughout UI

### What We're Building
When tender winner selected, automatically create/update budget item with contract amount. Calculate variance between estimate and budget. Display variance with color coding throughout the UI.

### Success Criteria
- Winner selection creates budget item in < 10 seconds
- Variance calculations 100% accurate
- Color coding displays correctly (green/red/gray)
- Variance visible in both global and project pages
- Filter "show items with variance only" works
- Export includes variance data

### Deliverables
- [ ] Winner selection auto-creates budget item
- [ ] Budget item links to estimate item (estimate_item_id)
- [ ] Variance calculation: amount and percentage
- [ ] Variance update triggers (when budget or estimate changes)
- [ ] Color coding: 🟢 Green (saved), 🔴 Red (over), ⚪ Gray (no link)
- [ ] Variance columns in Budget tab (global page)
- [ ] Variance columns in Budget sub-tab (project page)
- [ ] Filter: "Show items with variance only"
- [ ] Export to Excel includes variance columns
- [ ] Recalculation when budget/estimate updated
- [ ] E2E test: winner → budget → variance display

### Dependencies
- Phase 4 complete (tender integration)
- Existing budget item creation logic

### Risk Areas
- Variance calculation edge cases (zero, negative, null)
- Performance with many budget items (use database indexes)
- Recalculation triggers (ensure consistency)

---

## Phase 6: Polish, Testing & Deployment
**Duration:** 2 weeks
**Goal:** Production-ready system with full test coverage and user training

### What We're Building
Complete test suite, security hardening, performance optimization, user documentation, and production deployment.

### Success Criteria
- All E2E tests pass (100%)
- No critical or high-priority bugs
- Page load times < 2 seconds
- Mobile experience smooth (tested on real devices)
- User training completed
- Niv approves for production
- Production deployment successful
- Rollback plan tested

### Deliverables
- [ ] Complete E2E test suite covering all workflows
- [ ] Security audit: file upload validation, SQL injection prevention, XSS protection
- [ ] Performance optimization: lazy loading verified, database indexes added, caching implemented
- [ ] User documentation: PDF quick start guide with screenshots
- [ ] In-app tooltips and help text on complex features
- [ ] Error handling throughout (user-friendly messages)
- [ ] Validation on all forms (client and server side)
- [ ] Mobile responsiveness verified (iOS/Android)
- [ ] Bug fixes from testing phase
- [ ] Production deployment checklist
- [ ] Rollback plan documented and tested
- [ ] User training session conducted with Niv
- [ ] Feedback collection form created
- [ ] Production monitoring setup (error tracking)

### Dependencies
- Phases 1-5 complete
- Test environment available
- Production environment access
- Niv available for training

### Risk Areas
- Production deployment issues (use blue-green deployment)
- Data migration on existing projects (plan carefully)
- User adoption (thorough training critical)

---

## Phase Dependencies

```
Phase 1 (Database Foundation)
    ↓
Phase 2 (Cost Control Page Structure)
    ↓
Phase 3 (Estimates UI & Project Financial Tab)
    ↓
Phase 4 (Tender Integration & BOM)
    ↓
Phase 5 (Budget Auto-Update & Variance Display)
    ↓
Phase 6 (Polish, Testing & Deployment)
```

**All phases are sequential** - each depends on the previous completing successfully.

---

## Milestones

### M1: Foundation Ready (End of Phase 1)
Database schema complete, services functional, can create estimates programmatically.

### M2: UI Framework Live (End of Phase 2)
Unified Cost Control page accessible, navigation simplified, tabs functional.

### M3: Estimates Functional (End of Phase 3)
Users can create/edit estimates through UI, data persists correctly.

### M4: Workflow Connected (End of Phase 4)
Complete workflow: Estimate → Tender → Winner selection works end-to-end.

### M5: Automation Complete (End of Phase 5)
Winner selection auto-creates budget, variance tracking live throughout UI.

### M6: Production Launch (End of Phase 6)
System live in production, users trained, feedback collection started.

---

## Success Metrics

### Development (Track During Project)
- [ ] 100% of planned features delivered
- [ ] Test coverage >80% for services
- [ ] E2E tests cover all critical workflows
- [ ] Zero critical bugs at launch
- [ ] Performance targets met (< 2s page load)

### User Adoption (Track 3 Months Post-Launch)
- [ ] 80% of new projects use estimates
- [ ] Tender creation time reduced by 50%
- [ ] Variance tracking used on 70% of active projects
- [ ] User satisfaction ≥ 8/10

---

## Not in This Roadmap (Phase 2 - Future)

**Phase 2 Features (2-3 weeks, separate project):**
- Automated email sending to tender participants
- Email delivery tracking and logging
- Advanced variance analytics
- Email bounce/error handling
- BOM template library

---

**Status:** ✅ Ready for Phase Planning
**Next Step:** Use `/gsd:plan-phase 1` to create detailed plan for Phase 1
