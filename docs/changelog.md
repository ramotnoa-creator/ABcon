# Changelog - ANcon

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
