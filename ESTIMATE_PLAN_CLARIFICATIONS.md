# Estimate Integration Plan - Clarifications Summary
**Date:** January 29, 2026

## Confirmed Decisions

### 1. ✅ Email System
**Decision:** Prepare UI structure in MVP, actual email sending in Phase 2

**What This Means:**
- **MVP (Phase 1):**
  - Create `SendBOMEmailModal` component with UI
  - Show list of tender participants with their email addresses
  - Provide BOM file download link
  - Display message: "Email system coming in Phase 2"
  - Users manually copy emails and send via their own email client

- **Phase 2 (Future):**
  - Implement actual email sending (SendGrid or similar)
  - Automatic attachment of BOM files
  - Email delivery tracking
  - Bounce/error handling

**Why:** Focus on core estimate functionality first, add automation later.

---

### 2. ✅ Currency & VAT
**Decision:** ILS (₪) only with 17% VAT

**What This Means:**
- Remove all multi-currency code/UI
- Hard-code VAT rate at 17%
- All calculations in ILS
- No currency conversion needed

**Implementation:**
```typescript
const VAT_RATE = 17.00; // Fixed
const currency = '₪'; // Fixed
```

---

### 3. ✅ Permissions
**Decision:** Same as existing system

**Permission Matrix:**
| Role | Access |
|------|--------|
| Manager | Own projects only |
| Entrepreneur | Own projects only |
| Accountancy | All projects |
| Super Manager | All projects |

**What This Means:**
- No changes to permission logic
- Estimates follow same rules as budgets
- Use existing `userRole` checks

---

### 4. ✅ Historical Data Migration
**Decision:** No automatic migration - manual handling

**What This Means:**
- No migration scripts needed
- New estimate module starts fresh
- Existing tenders/budgets stay as-is
- Users create estimates for new projects
- Users can manually add estimates to old projects if needed

**Rollout:**
1. Launch new feature
2. Train users
3. Use for new projects immediately
4. Gradually add to old projects as needed

---

### 5. ✅ Variance Alerts
**Decision:** Display numbers with color coding only, no automatic threshold alerts

**What This Means:**
- Show variance amount and percentage
- Color coding:
  - **Green**: Under budget (negative variance %)
  - **Red**: Over budget (positive variance %)
  - **Gray**: No variance or no estimate
- No pop-ups or automatic warnings
- No threshold configuration needed
- User reviews variance manually and decides what's acceptable

**Example UI:**
```
Estimate: ₪100,000
Budget:   ₪130,000
Variance: ₪30,000 (30.0%) [RED INDICATOR]
```

---

### 6. ✅ Estimate Versioning
**Decision:** Update in place (no version history tracking)

**What This Means:**
- One estimate record per project/type
- When user updates estimate, it overwrites old data
- No "Version 1, Version 2, Version 3" tracking
- Simpler database structure
- No version comparison features needed

**Example:**
```
User creates estimate: ₪150,000
User updates estimate: ₪180,000 (overwrites ₪150,000)
System shows: ₪180,000 (old value gone)
```

**Alternative Considered (Rejected):**
Keep history like:
- Version 1 (Jan 15): ₪150,000
- Version 2 (Feb 1): ₪165,000
- Version 3 (Mar 10): ₪180,000

**Why Rejected:** Adds complexity without clear benefit. If needed in future, can add later.

---

### 7. ✅ Professionals in Tenders
**Decision:** Keep existing approach (select professionals per tender)

**What This Means:**
- Already working correctly
- No changes needed
- When creating tender, user selects which professionals participate
- Those professionals become the email recipients (in Phase 2)

---

## Updated MVP Scope

### Must-Have Features (Phase 1)
1. ✅ Estimate module with Planning + Execution tabs
2. ✅ Estimate items (line-by-line breakdown)
3. ✅ Export estimate to tender
4. ✅ BOM file upload/download
5. ✅ Winner selection → auto-update budget
6. ✅ Variance calculation and display (color coded)
7. ✅ Variance dashboard page

### Deferred to Phase 2
1. ⏳ Automated email sending
2. ⏳ Email delivery tracking
3. ⏳ BOM templates library
4. ⏳ Advanced variance analytics

---

## Database Schema Summary

### New Tables (Phase 1)
```sql
estimates           -- Planning/Execution estimates
estimate_items      -- Line items for estimates
bom_files           -- BOM file storage
budget_items        -- Add columns: estimate_item_id, estimate_amount, variance_amount, variance_percent
tenders             -- Add columns: estimate_id, bom_file_id
```

### New Tables (Phase 2 - Structure Only)
```sql
tender_emails       -- Email tracking (created in Phase 1 but not used until Phase 2)
```

---

## Implementation Timeline Adjusted

### Sprint 1-2 (Weeks 1-4): Foundation
- Database tables
- Core services (estimates, estimate items, variance)
- Unit tests

### Sprint 3 (Weeks 5-6): Estimate UI
- GlobalEstimatesPage
- EstimatesTab with two sub-tabs
- Estimate item forms and tables

### Sprint 4 (Weeks 7-8): Tender Integration
- Export to Tender functionality
- BOM upload/download
- Winner selection → budget update
- Email UI (placeholder, no sending)

### Sprint 5 (Weeks 9-10): Variance Tracking
- Variance calculations
- Variance dashboard
- Color coding throughout UI
- Excel export

### Sprint 6 (Weeks 11-12): Polish & Testing
- E2E tests
- Bug fixes
- User documentation
- Production deployment

### Phase 2 (Future - TBD)
- Email system implementation
- 2-3 additional weeks estimated

---

## ✅ All Questions Resolved

### ✅ Question 1: Estimate Approval Process
**Decision:** No formal approval process

**What This Means:**
- Users can create estimates freely
- Users can export to tender anytime (no approval gate)
- No "pending approval" status needed
- No approval workflow or buttons
- Simpler user experience - faster workflow

**Implementation:**
- Remove `approved_by` and `approved_at` fields from database
- Remove "Approve" button from UI
- Estimates can have status: `draft` or `active` (simple)

---

### ✅ Question 2: BOM Templates
**Decision:** No templates - custom upload only

**What This Means:**
- Users always upload their own Word files
- No template library needed
- No template selection UI
- No template management features
- Simpler implementation

**Implementation:**
- Just BOM upload/download functionality
- No template database table
- No template selection dropdown
- Users create BOM files in Word (outside system), then upload

---

## Next Steps

1. **Get Answers:** Resolve 2 remaining open questions above
2. **Review Plan:** Confirm timeline and scope acceptable
3. **Start Development:** Begin Sprint 1 (database and services)
4. **Weekly Check-ins:** Track progress and adjust as needed

---

**Plan Status:** ✅ COMPLETE - Ready for Implementation
**Estimated Duration:** 10-12 weeks (Phase 1 MVP)
**Blocked By:** None - all questions answered
**Next Step:** Begin Phase 1 (Database Schema + Services)
