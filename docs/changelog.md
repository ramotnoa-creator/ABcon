# Changelog - ANcon

## 2026-02-12 - Cost Item Editing + Project Parameters

**What:** Added cost item editing and project cost parameter fields (built_sqm, general_estimate, sales_sqm)
**Why:** Edit button in CostsTab had no onClick handler; built_sqm/general_estimate/sales_sqm had no edit UI
**Changes:**
- `AddCostItemForm`: Now supports both Add and Edit modes via `editItem` prop
  - Edit mode shows actual_amount field and tender fields (contract_amount, management_remarks) for tender_winner items
- `CostsTab`: Edit button now opens edit modal with pre-populated form
- `EditProjectPage`: New "Cost Parameters" section with general_estimate, built_sqm, sales_sqm fields
- `projectsService`: updateProject now handles general_estimate, built_sqm, sales_sqm fields
- API fix: auth endpoints now use tagged template literals (fixes TS2345 errors on Vercel)

**Follow-up:**
- UX: Edit button in CostsTab expanded row is confusing — user expects it to edit tender/participant info, but it edits the cost item. Need to either add a separate edit action inside the tender winner section, or make the "View Tender" link more prominent for managing participants/roles.

---

## 2026-02-11 - Vibe-System Adoption - DONE

**What:** Adopted vibe-system documentation structure
**Why:** Organize project documentation for maintainability and production readiness
**Notes:** All existing documentation preserved. New structure added on top.

---

## Prior History

This project has extensive development history documented in root-level .md files:
- `PHASE1_PROGRESS.md` - Phase 1 completion
- `PROJECT_ITEMS_IMPLEMENTATION_COMPLETE.md` - Project items feature
- `ESTIMATE_INTEGRATION_PLAN.md` - Current major feature (67% complete)
- `SESSION_SUMMARY.md` - Session summaries
- `MIGRATION-006-SUMMARY.md` - Budget variance migration

For detailed history, see `.planning/` folder and root-level documentation.

---

## Tech Debt

| Item | Impact | Effort | Added |
|---|---|---|---|
| VITE_ prefix on database URL (exposes to client) | High | Medium | 2026-02 |
| No rollback scripts for migrations 003-009 | High | Low | 2026-02 |
| bcryptjs runs client-side | Medium | Medium | 2026-02 |
| No Sentry error tracking | Medium | Low | 2026-02 |
| No dev/production database separation | High | Low | 2026-02 |
| No CI/CD pipeline (tests run manually) | Medium | Low | 2026-02 |
| Supabase references in codebase (legacy) | Low | Low | 2026-02 |
