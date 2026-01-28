# Estimate Integration Project

## Vision

Create a unified Cost Control system (בקרת עלויות) that integrates Estimates, Tenders, and Budget into one seamless workflow, enabling better financial planning, control, and variance tracking for construction projects.

## Problem Statement

Currently, ABcon has separate Budget and Tender systems, but lacks:
- Standalone estimate functionality before tendering
- Clear workflow from planning estimate → execution estimate → tender → budget
- Variance tracking between estimated, budgeted, and actual costs
- BOM (Bill of Materials) file management for tenders
- Unified view of all financial data

Users must navigate between separate pages and manually track the relationship between estimates, tenders, and budgets.

## Solution

Build a unified **בקרת עלויות (Cost Control)** system that:

1. **Consolidates Navigation**: One page with 4 tabs instead of 3 separate pages
2. **Enables Estimation**: Planning and Execution estimates with line-item detail
3. **Links Workflow**: Estimate → Export to Tender → Winner → Auto-create Budget
4. **Tracks Variance**: Automated calculation and color-coded display of estimate vs budget differences
5. **Manages BOM Files**: Upload, store, and distribute tender specifications
6. **Simplifies UX**: All financial data accessible in one place with clear workflow visualization

## Success Criteria

### User Experience
- [ ] Users can create planning and execution estimates in < 5 minutes
- [ ] Export to tender takes 1 click and pre-fills all data
- [ ] Winner selection automatically updates budget (< 10 seconds)
- [ ] Variance dashboard shows real-time estimate vs budget comparison
- [ ] Navigation simplified from 3 menu items to 1

### Technical
- [ ] All estimate, tender, and budget data stored in PostgreSQL (Neon)
- [ ] Page load time < 2 seconds per tab (lazy loading)
- [ ] Support 1000+ estimate items per project
- [ ] BOM files up to 10MB supported
- [ ] Mobile responsive design

### Business
- [ ] 80% of new projects use estimate feature within 3 months
- [ ] Average time to create tender reduced by 50%
- [ ] Variance tracking used on 70% of active projects
- [ ] User satisfaction score ≥ 8/10
- [ ] Zero data loss or corruption incidents

## Tech Stack

**Frontend:**
- React 19.2 + TypeScript 5.9
- React Router 7.10 (tab navigation via URL params)
- TailwindCSS 3.4 (styling)
- Material Symbols (icons)

**Backend:**
- Neon PostgreSQL (serverless)
- TypeScript services layer

**Architecture:**
- Service layer pattern (src/services/)
- Component-based UI (src/components/)
- Permission-based data filtering

## Constraints & Decisions

### Confirmed Decisions
1. **No Approval Workflow**: Users can create and export estimates freely
2. **No BOM Templates**: Custom upload only (users create Word files externally)
3. **ILS Currency Only**: ₪ with fixed 17% VAT
4. **No Version History**: Estimates update in place
5. **Email in Phase 2**: UI structure in MVP, actual sending later
6. **Same Permissions**: Manager/Entrepreneur see own, Accountancy/Super Manager see all
7. **No Auto Migration**: Users manually add estimates to projects as needed
8. **Variance Display Only**: Color coding but no automatic threshold alerts

### Technical Constraints
- Must integrate with existing Budget and Tender systems
- Must maintain existing database structure where possible
- Must support existing permission model
- Must work with current Neon PostgreSQL setup

### Out of Scope (Phase 2)
- Automated email sending to tender participants
- Email delivery tracking
- Advanced variance analytics
- BOM template library
- Multi-currency support
- Estimate version history

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Large file uploads crash browser | High | Medium | Enforce 10MB limit, chunked uploads, progress indicators |
| Variance calculations incorrect | High | Medium | Comprehensive unit tests, manual verification, clear formulas |
| Users confused by new structure | Medium | Medium | Training session, in-app tooltips, quick start guide |
| Data sync issues (estimate/tender/budget) | High | Low | Database transactions, consistency checks, audit logs |
| Performance issues with many estimates | Medium | Low | Lazy loading, pagination, caching, indexes |

## Team & Resources

**Development:**
- 1 Full-stack developer (TypeScript/React/PostgreSQL)

**Testing:**
- Manual testing by development team
- E2E tests with Playwright
- User acceptance testing by client (Niv)

**Timeline:**
- Phase 1: 10-12 weeks (MVP)
- Phase 2: 2-3 weeks (Email integration)

## Dependencies

**External:**
- Neon PostgreSQL availability
- Meeting with Niv for final approval
- User training session scheduling

**Internal:**
- Existing Budget system (budgetItemsService, BudgetTab)
- Existing Tender system (tendersService, TendersTab)
- Existing Professional system (participants for tenders)
- Permission system (userRole checks)

## Definition of Done

A phase is complete when:
- [ ] All code is written, tested, and reviewed
- [ ] Database migrations applied successfully
- [ ] Unit tests pass (>80% coverage for services)
- [ ] E2E tests pass for critical workflows
- [ ] Manual testing completed with no critical bugs
- [ ] Documentation updated (README, inline comments)
- [ ] Changes committed with clear commit messages
- [ ] Phase goals verified through testing

Project is complete when:
- [ ] All 6 sprints delivered
- [ ] MVP features functional and tested
- [ ] User training completed
- [ ] Production deployment successful
- [ ] User feedback collected and positive
- [ ] Niv approves the implementation
- [ ] All success criteria met

---

**Project Status:** Ready for Roadmap Creation
**Start Date:** TBD
**Target Completion:** 10-12 weeks from start
**Last Updated:** January 29, 2026
