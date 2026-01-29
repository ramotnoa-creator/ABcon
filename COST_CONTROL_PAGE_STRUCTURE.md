# בקרת עלויות | Cost Control - Page Structure
**Date:** January 29, 2026

## Overview

Combined Budget, Estimates, and Tenders into one unified page: **בקרת עלויות** (Cost Control)

---

## Navigation Structure

### Before (3 separate menu items):
```
📊 Dashboard
📁 Projects
💰 תקציב (Budget)
📄 מכרזים (Tenders)
📋 אומדן (Estimates)  ← NEW, would have been 3rd item
👥 Professionals
```

### After (1 unified menu item):
```
📊 Dashboard
📁 Projects
📊 בקרת עלויות (Cost Control)  ← COMBINED
👥 Professionals
```

**Benefits:**
- Cleaner navigation (simpler menu)
- All financial data in one place
- Better workflow visibility

---

## Global Page: בקרת עלויות

**Route:** `/cost-control`

### Layout

```
┌────────────────────────────────────────────────────────────────┐
│  בקרת עלויות | Cost Control              [+ חדש] [ייצוא]      │
├────────────────────────────────────────────────────────────────┤
│  📋 [אומדן]  📄 [מכרזים]  💰 [תקציב]                          │
│   Estimates    Tenders     Budget (with variance columns)     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  [Tab Content - Lazy Loaded]                                  │
│                                                                │
│  • Shows all data across all projects                         │
│  • Permission-based filtering                                 │
│  • Export functionality per tab                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Tab 1: אומדן (Estimates)

**URL:** `/cost-control?tab=estimates`

**Content:**
- KPI Cards:
  - Total estimates count
  - Planning vs Execution split
  - Total estimated value (₪)
  - Active vs Draft status

- Table:
  | Project | Name | Type | Total Amount | Status | Created | Actions |
  |---------|------|------|--------------|--------|---------|---------|
  | Tower A | Architectural Planning | Planning | ₪150,000 | Active | Jan 15 | 👁️ ✏️ |
  | Tower A | Construction Execution | Execution | ₪2,500,000 | Draft | Jan 20 | 👁️ ✏️ |

- Filters: Project, Type (Planning/Execution), Status, Date Range
- Search: By name, project, description
- Actions: View, Edit, Delete, Export to Tender, Export to Excel

### Tab 2: מכרזים (Tenders)

**URL:** `/cost-control?tab=tenders`

**Content:**
- KPI Cards:
  - Total tenders
  - Open tenders
  - Winners selected
  - Total contracted value (₪)
  - Total savings (₪)

- Expandable Tender Cards:
  ```
  ┌─────────────────────────────────────────────┐
  │ Tower A - Electrical Work              [▼] │
  ├─────────────────────────────────────────────┤
  │ Status: Winner Selected                     │
  │ Estimated: ₪120,000 | Contract: ₪115,000   │
  │ Savings: ₪5,000 (4.2%) ✅                   │
  │                                             │
  │ Participants: 5                             │
  │ • Company A: ₪115,000 🏆 (Winner)           │
  │ • Company B: ₪118,000                       │
  │ • Company C: ₪122,000                       │
  │                                             │
  │ BOM: electrical_specs.docx [Download]       │
  │ Source Estimate: Execution #2 [View]        │
  └─────────────────────────────────────────────┘
  ```

- Filters: Project, Status, Type, Date Range
- Actions: View Details, Manage Participants, Select Winner, Download BOM

### Tab 3: תקציב (Budget)

**URL:** `/cost-control?tab=budget`

**Content:**
- KPI Cards:
  - Total planned budget (₪)
  - Actual spending (₪)
  - Remaining balance (₪)
  - Over-budget projects count
  - Payment timeline (last paid, next planned)

- Table:
  | Project | Category | Chapter | Planned | Actual | Paid | Variance | Status |
  |---------|----------|---------|---------|--------|------|----------|--------|
  | Tower A | Consultants | Architecture | ₪150,000 | ₪145,000 | ₪100,000 | -₪5,000 🟢 | In Progress |
  | Tower A | Contractors | Foundation | ₪800,000 | ₪850,000 | ₪500,000 | +₪50,000 🔴 | At Risk |

- Filters: Project, Category, Status, Date Range
- Color Coding:
  - 🟢 Green: Under budget
  - 🔴 Red: Over budget
  - ⚪ Gray: On budget

**Note:** Variance Analysis is integrated directly into Tab 3 (Budget) as additional columns. No separate tab needed.

---

## Project Page: Financial Tab

**Route:** `/projects/123?tab=financial`

### Layout

```
┌────────────────────────────────────────────────────────────────┐
│  Project: Tower Building A                                     │
├────────────────────────────────────────────────────────────────┤
│  [Overview] [Tasks] [Financial] [Planning Changes] [Files]...  │
├────────────────────────────────────────────────────────────────┤
│  ניהול פיננסי | Financial Management                            │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ [אומדן תכנון] [אומדן ביצוע] [מכרזים] [תקציב] [תשלומים] │ │
│  │  Planning     Execution    Tenders   Budget   Payments   │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  [Sub-tab Content]                                             │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Sub-tab 1: אומדן תכנון (Planning Estimate)

**URL:** `/projects/123?tab=financial&subtab=planning-estimate`

**Content:**
- Summary Cards:
  ```
  ┌──────────────┬──────────────┬──────────────┬──────────────┐
  │ Total        │ Items        │ Status       │ Last Updated │
  │ ₪150,000     │ 8            │ Active       │ Jan 20, 2026 │
  └──────────────┴──────────────┴──────────────┴──────────────┘
  ```

- Estimate Items Table:
  | Code | Description | Category | Qty | Unit Price | Total (incl. VAT) | Actions |
  |------|-------------|----------|-----|------------|-------------------|---------|
  | A-01 | Architectural Design | Consultants | 1 | ₪128,205 | ₪150,000 | ✏️ 🗑️ |
  | A-02 | Structural Engineering | Consultants | 1 | ₪85,470 | ₪100,000 | ✏️ 🗑️ |

- Action Buttons:
  - `[+ Add Item]`
  - `[Export to Tender]` → Creates new tender with all estimate data
  - `[Export to Excel]`
  - `[Print]`

- No approval needed - can export anytime

### Sub-tab 2: אומדן ביצוע (Execution Estimate)

**URL:** `/projects/123?tab=financial&subtab=execution-estimate`

**Content:**
- Same structure as Planning Estimate
- Different estimate type (execution vs planning)
- Typically larger amounts, more items

### Sub-tab 3: מכרזים (Tenders)

**URL:** `/projects/123?tab=financial&subtab=tenders`

**Content:**
- Tender List for this project
- Create New Tender:
  - Manual: Start from scratch
  - From Estimate: Select estimate, data pre-filled

- For Each Tender:
  ```
  ┌─────────────────────────────────────────────┐
  │ Electrical Work                             │
  ├─────────────────────────────────────────────┤
  │ Status: Open | Due: Feb 15, 2026            │
  │                                             │
  │ Source Estimate: Execution #2 [View] ←──── │
  │ Estimated Budget: ₪120,000                  │
  │                                             │
  │ BOM File: electrical_specs.docx             │
  │ [📎 Upload BOM] [📧 Send to Participants]   │
  │                                             │
  │ Participants (5):                           │
  │ ☑ Company A - ₪115,000 [Select Winner]     │
  │ ☑ Company B - ₪118,000                      │
  │ ☑ Company C - ₪122,000                      │
  │ ☐ Company D - No quote yet                 │
  │ ☐ Company E - No quote yet                 │
  │                                             │
  │ Price Statistics:                           │
  │ Min: ₪115,000 | Max: ₪122,000 | Avg: ₪118,333│
  └─────────────────────────────────────────────┘
  ```

- Winner Selection → Triggers modal:
  ```
  ╔═══════════════════════════════════════════╗
  ║  Update Budget Automatically?             ║
  ╠═══════════════════════════════════════════╣
  ║                                           ║
  ║  Winner: Company A                        ║
  ║  Contract Amount: ₪115,000                ║
  ║  Estimated: ₪120,000                      ║
  ║  Savings: ₪5,000 (4.2%) 🟢                ║
  ║                                           ║
  ║  Create budget item automatically?        ║
  ║                                           ║
  ║  [Cancel]  [Review Budget]  [Create] ←   ║
  ╚═══════════════════════════════════════════╝
  ```

### Sub-tab 4: תקציב (Budget)

**URL:** `/projects/123?tab=financial&subtab=budget`

**Content:**
- Existing BudgetTab functionality
- Enhanced with estimate integration:
  - Added columns:
    - "Estimate Amount" (if linked)
    - "Variance" with color coding
  - Added filter: "Show items with variance only"
  - Link to source estimate item

- Multiple view modes:
  - 🌳 Tree view (Categories → Chapters → Items)
  - 📊 Table view (flat list)
  - 📈 Cashflow view (timeline)

### Sub-tab 5: תשלומים (Payments)

**URL:** `/projects/123?tab=financial&subtab=payments`

**Content:**
- Payment list linked to budget items
- Invoice tracking
- Payment workflow: Pending → Approved → Paid
- Payment timeline
- Milestone linkage

---

## Workflow Visualization

The page shows the complete financial workflow:

```
Step 1: Create Estimate
┌────────────────┐
│ אומדן תכנון    │
│ Planning       │
│ ₪150,000       │
└───────┬────────┘
        │
        ↓
┌────────────────┐
│ אומדן ביצוע    │
│ Execution      │
│ ₪2,500,000     │
└───────┬────────┘
        │
        │ Export to Tender
        ↓
Step 2: Create Tender
┌────────────────┐
│ מכרז           │
│ Tender         │
│ Add BOM        │
│ Add Participants│
└───────┬────────┘
        │
        │ Select Winner
        ↓
Step 3: Budget Created
┌────────────────┐
│ תקציב          │
│ Budget         │
│ ₪2,450,000     │
│ Variance: -₪50K│
└───────┬────────┘
        │
        ↓
Step 4: Payments
┌────────────────┐
│ תשלומים        │
│ Payments       │
│ Paid: ₪1,200K  │
└────────────────┘
```

---

## Implementation Details

### File Structure

```
src/
├── pages/
│   ├── CostControl/
│   │   ├── CostControlPage.tsx          ← Main page (3 tabs)
│   │   ├── tabs/
│   │   │   ├── EstimatesTabContent.tsx
│   │   │   ├── TendersTabContent.tsx
│   │   │   └── BudgetTabContent.tsx     ← Includes variance columns
│   │   └── components/
│   │       ├── EstimateCard.tsx
│   │       ├── TenderCard.tsx
│   │       └── VarianceCell.tsx         ← Color-coded variance display
│   │
│   └── Projects/
│       └── tabs/
│           ├── FinancialTab.tsx           ← Project financial tab
│           └── subtabs/
│               ├── PlanningEstimateSubTab.tsx
│               ├── ExecutionEstimateSubTab.tsx
│               ├── TendersSubTab.tsx
│               ├── BudgetSubTab.tsx
│               └── PaymentsSubTab.tsx
│
├── components/
│   ├── Estimates/
│   │   ├── AddEstimateItemForm.tsx
│   │   ├── EstimateItemsTable.tsx
│   │   └── EstimateSummaryCard.tsx
│   │
│   ├── Tenders/
│   │   ├── BOMUploader.tsx
│   │   ├── SendBOMEmailModal.tsx
│   │   ├── TenderParticipantsList.tsx
│   │   └── WinnerSelectionModal.tsx
│   │
│   └── Budget/
│       ├── VarianceCard.tsx
│       └── VarianceChart.tsx
│
└── services/
    ├── estimatesService.ts
    ├── estimateItemsService.ts
    ├── bomFilesService.ts
    ├── tenderEmailsService.ts
    └── varianceService.ts
```

### URL Routing

**Global Cost Control:**
```typescript
// Route: /cost-control
<Route path="/cost-control" element={<CostControlPage />} />

// Tab switching via query param:
// /cost-control?tab=estimates
// /cost-control?tab=tenders
// /cost-control?tab=budget (includes variance columns)
```

**Project Financial Tab:**
```typescript
// Route: /projects/:id
<Route path="/projects/:id" element={<ProjectDetailPage />}>
  <Route path="?tab=financial" element={<FinancialTab />} />
</Route>

// Sub-tab switching via query param:
// /projects/123?tab=financial&subtab=planning-estimate
// /projects/123?tab=financial&subtab=execution-estimate
// /projects/123?tab=financial&subtab=tenders
// /projects/123?tab=financial&subtab=budget
// /projects/123?tab=financial&subtab=payments
```

### Performance Optimization

**Lazy Loading:**
```typescript
// Only load active tab content
const EstimatesTabContent = lazy(() => import('./tabs/EstimatesTabContent'));
const TendersTabContent = lazy(() => import('./tabs/TendersTabContent'));
const BudgetTabContent = lazy(() => import('./tabs/BudgetTabContent'));
const VarianceTabContent = lazy(() => import('./tabs/VarianceTabContent'));

// Load data only when tab is active
useEffect(() => {
  if (activeTab === 'estimates') {
    loadEstimates();
  }
}, [activeTab]);
```

---

## Benefits of Combined Structure

### For Users:
✅ Everything financial in one place
✅ Less navigation clicks
✅ Can compare estimate vs tender vs budget easily
✅ Clear workflow visualization
✅ Contextual information (see related data together)

### For Development:
✅ Shared components (filters, export, search)
✅ Consistent layout across tabs
✅ Easier to maintain
✅ Shared state management
✅ Less code duplication

### For Business:
✅ Better user adoption (simpler navigation)
✅ Faster workflow
✅ Better data visibility
✅ Easier training
✅ Professional appearance

---

## Migration from Separate Pages

### Pages to Remove:
- ❌ `GlobalBudgetPage.tsx` → Content moved to CostControlPage Budget tab (enhanced with variance columns)
- ❌ `GlobalTendersPage.tsx` → Content moved to CostControlPage Tenders tab

### Pages to Create:
- ✅ `CostControlPage.tsx` (new unified page with 3 tabs)
- ✅ `FinancialTab.tsx` (new unified project tab with 5 sub-tabs)

### Database Tables to Create:
- ✅ `estimates` (planning/execution estimates)
- ✅ `estimate_items` (line items)
- ✅ `bom_files` (bill of materials)
- ❌ `tender_emails` (NOT needed - emails from professionals table)

### Navigation Menu Changes:
- Remove: "תקציב", "מכרזים"
- Add: "בקרת עלויות" (1 item instead of 2)

---

**Document Status:** ✅ APPROVED
**Implementation:** Ready to Begin Phase 1
**Estimated Effort:** 10-12 weeks
