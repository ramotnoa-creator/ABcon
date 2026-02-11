# ANcon - Project Context

## Project Essentials

**Stage:** Development (advanced - ~67% complete)
**Stack:** React 19 + TypeScript + Vite + TailwindCSS + Neon PostgreSQL + Vercel
**Language/Direction:** Hebrew RTL
**Client:** Israeli construction companies

## What This Is

Construction and real estate project management system for Israeli construction companies. Manages projects, financial workflows (estimates, tenders, budgets, payments), professional networks, tasks, and documents. Hebrew RTL interface throughout.

## Key Locations

- Source code: `/src/`
- Schema source of truth: `/migrations/` (raw SQL, no ORM)
- Documentation: `/docs/`
- Design system: `/.claude/design-system.md`
- Decisions: `/.claude/decisions/`
- GSD Planning: `/.planning/`
- Screenshots: `/screenshots/`
- Tests: `/tests/` (Playwright + axe-core accessibility)

## Project-Specific Rules

1. All UI must be Hebrew RTL - use logical CSS properties
2. Financial data is sensitive - always validate calculations
3. Direct SQL queries to Neon - always use parameterized queries
4. 4 user roles: Admin > PM > Entrepreneur > Accountant - check permissions
5. Design system in `.claude/design-system.md` must be followed
6. Preserve existing `.planning/` structure (GSD uses it)

## Current State

**Working on:** Estimate integration (Phase 5 of 6)
**Completed:** Auth, project management, professional network, budget management, tender system, estimates, file management, Gantt/tasks, exports
**Next up:** Budget auto-creation from tender winners, enhanced variance tracking
**Blockers:** Check CLIENT_QUESTIONS.md for pending client decisions

## Watch Out For

- `VITE_` variables are client-visible - never put secrets there
- Migrations 003-009 have no rollback scripts - be careful
- bcryptjs runs client-side - unusual pattern, don't break it
- Supabase references are legacy (migrated to Neon) - ignore them
- `Screenshoots/` folder is legacy - use `/screenshots/` going forward

## Existing Documentation

Root-level .md files contain historical planning docs. Key ones:
- `PROJECT.md` - comprehensive project context
- `AUTH_PERMISSIONS_PLAN.md` - role-based permissions design
- `ESTIMATE_INTEGRATION_PLAN.md` - current major feature plan
- `CLIENT_QUESTIONS.md` + `CLIENT_QUESTIONS_COSTS.md` - client Q&A

## Global Rules Reference

All agents must also follow: `~/.claude/vibe-system/WORKING_RULES.md`
