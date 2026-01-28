# Phase 3: Estimates UI & Project Financial Tab - Execution Plan

```yaml
wave: 1
depends_on: ['02-cost-control-page']
files_modified:
  - src/pages/Projects/tabs/FinancialTab.tsx
  - src/pages/Projects/tabs/subtabs/PlanningEstimateSubTab.tsx
  - src/pages/Projects/tabs/subtabs/ExecutionEstimateSubTab.tsx
  - src/components/Estimates/AddEstimateItemForm.tsx
  - src/components/Estimates/EstimateItemsTable.tsx
  - src/components/Estimates/EstimateSummaryCard.tsx
  - src/pages/Projects/ProjectDetailPage.tsx
autonomous: false
```

## Objective

Build user interface for creating and managing estimates. Replace separate Budget/Tenders tabs in project detail with unified Financial tab containing 5 sub-tabs.

## Context

**Current state:**
- Phase 2 complete: Global Cost Control page exists
- Services ready: can create estimates programmatically
- Separate BudgetTab and TendersTab in project detail

**What we're building:**
- FinancialTab with 5 sub-tabs (Planning Estimate, Execution Estimate, Tenders, Budget, Payments)
- Forms to create/edit estimates and items
- Summary cards showing totals
- VAT calculations in UI

## Tasks

<task id="3.1" title="Create FinancialTab component">
<description>
Create unified financial tab for project detail page.

**File:** `src/pages/Projects/tabs/FinancialTab.tsx`

**Structure:**
```typescript
const FinancialTab = ({ projectId }) => {
  const [activeSubTab, setActiveSubTab] = useState('planning-estimate');

  return (
    <div className="financial-tab">
      <SubTabs value={activeSubTab} onChange={setActiveSubTab}>
        <SubTab label="אומדן תכנון" value="planning-estimate" />
        <SubTab label="אומדן ביצוע" value="execution-estimate" />
        <SubTab label="מכרזים" value="tenders" />
        <SubTab label="תקציב" value="budget" />
        <SubTab label="תשלומים" value="payments" />
      </SubTabs>

      <SubTabContent>
        {activeSubTab === 'planning-estimate' && (
          <PlanningEstimateSubTab projectId={projectId} />
        )}
        {activeSubTab === 'execution-estimate' && (
          <ExecutionEstimateSubTab projectId={projectId} />
        )}
        {activeSubTab === 'tenders' && (
          <TendersSubTab projectId={projectId} />
        )}
        {activeSubTab === 'budget' && (
          <BudgetSubTab projectId={projectId} />
        )}
        {activeSubTab === 'payments' && (
          <PaymentsSubTab projectId={projectId} />
        )}
      </SubTabContent>
    </div>
  );
};
```

**URL:** `/projects/:id?tab=financial&subtab=planning-estimate`

**Acceptance:**
- Tab renders in project detail
- 5 sub-tabs visible
- Switching works smoothly
- URL updates with subtab
</description>
</task>

<task id="3.2" title="Create PlanningEstimateSubTab">
<description>
Create sub-tab for planning estimates.

**File:** `src/pages/Projects/tabs/subtabs/PlanningEstimateSubTab.tsx`

**Features:**
- Load or create planning estimate for project
- Summary cards: Total ₪, Items Count, Status, Last Updated
- EstimateItemsTable showing all items
- Add/Edit/Delete item actions
- Export to Tender button
- Export to Excel button

**Data flow:**
```typescript
const { data: estimate } = useQuery(
  ['estimate', projectId, 'planning'],
  () => getEstimates(projectId, 'planning')[0] || createEstimate({
    project_id: projectId,
    estimate_type: 'planning',
    name: `${projectName} - Planning Estimate`
  })
);

const { data: items } = useQuery(
  ['estimate-items', estimate.id],
  () => getEstimateItems(estimate.id)
);
```

**Acceptance:**
- Auto-creates planning estimate if none exists
- Shows all items in table
- Summary cards calculate correctly
- Can add/edit/delete items
- Export buttons work
</description>
</task>

<task id="3.3" title="Create ExecutionEstimateSubTab">
<description>
Create sub-tab for execution estimates (same as planning but different type).

**File:** `src/pages/Projects/tabs/subtabs/ExecutionEstimateSubTab.tsx`

**Implementation:**
- Copy structure from PlanningEstimateSubTab
- Change `estimate_type` to 'execution'
- Same features, different data

**Acceptance:**
- Separate from planning estimate
- All features work identically
- Totals calculated independently
</description>
</task>

<task id="3.4" title="Create AddEstimateItemForm">
<description>
Create form component for adding/editing estimate items.

**File:** `src/components/Estimates/AddEstimateItemForm.tsx`

**Form fields:**
```typescript
{
  code: string (optional, auto-generate if empty)
  description: string (required)
  category: select (Consultants, Suppliers, Contractors)
  subcategory: select (Architecture, Electrical, etc. - depends on category)
  unit: select (sqm, unit, hours, etc.)
  quantity: number (required)
  unit_price: number (currency, required)
  total_price: calculated (quantity * unit_price)
  vat_rate: number (default 17%, readonly)
  vat_amount: calculated (total_price * vat_rate / 100)
  total_with_vat: calculated (total_price + vat_amount)
  notes: textarea (optional)
}
```

**Validation:**
- Description required
- Quantity > 0
- Unit price >= 0
- No negative totals

**Real-time calculations:**
```typescript
useEffect(() => {
  const total = quantity * unitPrice;
  const vat = total * (vatRate / 100);
  const totalWithVat = total + vat;

  setTotalPrice(total);
  setVatAmount(vat);
  setTotalWithVat(totalWithVat);
}, [quantity, unitPrice, vatRate]);
```

**Acceptance:**
- All fields editable
- Calculations update in real-time
- Validation prevents invalid data
- Can submit and save
- Can cancel without saving
</description>
</task>

<task id="3.5" title="Create EstimateItemsTable">
<description>
Create table component to display estimate items.

**File:** `src/components/Estimates/EstimateItemsTable.tsx`

**Columns:**
- Code
- Description
- Category
- Quantity
- Unit Price (₪)
- Total (₪)
- Total with VAT (₪)
- Actions (Edit, Delete)

**Features:**
- Sortable by clicking column headers
- Click row to edit inline
- Delete with confirmation
- Drag-to-reorder rows (update order_index)
- Summary row at bottom (totals)

**Summary row:**
```typescript
<tr className="summary-row">
  <td colSpan="5">Total</td>
  <td>{formatCurrency(subtotal)}</td>
  <td>{formatCurrency(totalWithVAT)}</td>
  <td></td>
</tr>
```

**Acceptance:**
- Displays all items
- Sorting works
- Inline edit functional
- Delete asks for confirmation
- Reordering persists
- Summary accurate
</description>
</task>

<task id="3.6" title="Create EstimateSummaryCard">
<description>
Create summary card component showing totals.

**File:** `src/components/Estimates/EstimateSummaryCard.tsx`

**Display:**
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Total        │ Items        │ Status       │ Last Updated │
│ ₪2,500,000   │ 12           │ Active       │ Jan 20, 2026 │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

**Calculations:**
```typescript
const totalWithoutVAT = items.reduce((sum, item) => sum + item.total_price, 0);
const totalVAT = items.reduce((sum, item) => sum + item.vat_amount, 0);
const totalWithVAT = items.reduce((sum, item) => sum + item.total_with_vat, 0);
```

**Acceptance:**
- Shows correct totals
- Updates when items change
- Responsive on mobile
- Clear formatting
</description>
</task>

<task id="3.7" title="Migrate BudgetTab to BudgetSubTab">
<description>
Move existing BudgetTab content to new BudgetSubTab.

**File:** `src/pages/Projects/tabs/subtabs/BudgetSubTab.tsx`

**Migration:**
- Copy BudgetTab component
- Rename to BudgetSubTab
- Remove tab-level wrapper
- Keep all features:
  - Tree view
  - Table view
  - Cashflow view
  - Payment tracking
  - Variance columns (from Phase 2)

**Acceptance:**
- All budget features preserved
- Variance visible
- No regressions
</description>
</task>

<task id="3.8" title="Migrate TendersTab to TendersSubTab">
<description>
Move existing TendersTab to new TendersSubTab.

**File:** `src/pages/Projects/tabs/subtabs/TendersSubTab.tsx`

**Migration:**
- Copy TendersTab component
- Rename to TendersSubTab
- Remove tab wrapper
- Keep all tender features

**Acceptance:**
- All tender features work
- No functionality lost
</description>
</task>

<task id="3.9" title="Create PaymentsSubTab">
<description>
Move payment tracking to dedicated sub-tab.

**File:** `src/pages/Projects/tabs/subtabs/PaymentsSubTab.tsx`

**Features:**
- Payment list linked to budget items
- Invoice tracking
- Payment status: Pending → Approved → Paid
- Payment timeline
- Milestone linkage
- Export functionality

**Acceptance:**
- Shows all payments for project
- Can create/edit payments
- Status workflow works
- Links to budget items
</description>
</task>

<task id="3.10" title="Update ProjectDetailPage">
<description>
Replace separate Budget/Tenders tabs with unified Financial tab.

**File:** `src/pages/Projects/ProjectDetailPage.tsx`

**Changes:**
Remove tabs:
```tsx
<Tab label="Budget" value="budget" />
<Tab label="Tenders" value="tenders" />
```

Add tab:
```tsx
<Tab label="ניהול פיננסי" value="financial" />
```

Tab content:
```tsx
{activeTab === 'financial' && <FinancialTab projectId={projectId} />}
```

**Acceptance:**
- Financial tab appears
- Separate Budget/Tenders tabs removed
- All functionality accessible via Financial tab
- Bookmarks to old tabs redirect
</description>
</task>

<task id="3.11" title="Implement auto-save">
<description>
Auto-save estimate items to prevent data loss.

**Strategy:**
- Debounced save on field change (500ms delay)
- Save indicator: "Saving..." → "Saved ✓"
- Retry on failure
- Offline queue (save when reconnected)

**Implementation:**
```typescript
const debouncedSave = useDebounce((item) => {
  updateEstimateItem(item.id, item)
    .then(() => showToast('Saved ✓', 'success'))
    .catch(() => showToast('Save failed. Retrying...', 'error'));
}, 500);

const handleFieldChange = (field, value) => {
  setItem({ ...item, [field]: value });
  debouncedSave({ ...item, [field]: value });
};
```

**Acceptance:**
- Changes save automatically
- No data loss on navigation
- User sees save status
- Works offline (queued)
</description>
</task>

<task id="3.12" title="Write E2E tests">
<description>
Test estimate creation workflow.

**File:** `tests/estimates-ui.spec.ts`

**Test cases:**
```typescript
test('Create planning estimate with items', async ({ page }) => {
  // Navigate to project → Financial tab → Planning Estimate
  // Click "Add Item" → fill form → save
  // Verify item appears in table
  // Check totals calculate correctly
});

test('Edit estimate item', async ({ page }) => {
  // Click item row → edit inline → change quantity
  // Verify total recalculates
  // Verify auto-save works
});

test('Delete estimate item', async ({ page }) => {
  // Click delete → confirm → item removed
  // Verify totals update
});

test('Switch between Planning and Execution estimates', async ({ page }) => {
  // Create item in Planning → switch to Execution
  // Verify Execution empty (separate estimates)
  // Create item in Execution
  // Switch back → Planning item still there
});
```

**Acceptance:**
- All tests pass
- Cover critical workflows
- No flaky tests
</description>
</task>

## Verification Criteria

### Must Work
- [ ] Can create planning estimate with items
- [ ] Can create execution estimate with items
- [ ] VAT calculates to 17% correctly
- [ ] Totals sum accurately
- [ ] Can edit items (inline or modal)
- [ ] Can delete items
- [ ] Auto-save prevents data loss
- [ ] Financial tab has 5 sub-tabs
- [ ] All sub-tabs functional

### Quality
- [ ] Form validation prevents errors
- [ ] Real-time calculations smooth
- [ ] Responsive on mobile
- [ ] Accessible (keyboard navigation, ARIA)
- [ ] Matches design system

### Edge Cases
- [ ] Empty estimate (no items) shows ₪0
- [ ] Large numbers format correctly (₪10,000,000)
- [ ] Decimal quantities work (0.5 units)
- [ ] Special characters in description allowed
- [ ] Delete last item leaves empty estimate

## must_haves

**For phase goal: "Build estimate creation UI and unified project financial tab"**

1. **Users can create estimates**
   - Planning estimate sub-tab works
   - Execution estimate sub-tab works
   - Add/edit/delete items functional

2. **Calculations are accurate**
   - VAT always 17%
   - Totals = sum of items
   - Real-time updates smooth

3. **Financial tab consolidates all**
   - 5 sub-tabs visible
   - Budget features preserved
   - Tender features preserved
   - Payments accessible

4. **Data persists correctly**
   - Items save to database
   - Auto-save works
   - No data loss

5. **Good UX**
   - Forms easy to use
   - Validation helpful
   - Fast performance
   - Mobile friendly

## Success Indicator

**Phase 3 is complete when:**
User can:
1. Go to project → Financial tab
2. Click "אומדן תכנון" (Planning Estimate)
3. Click "Add Item" → fill form → save
4. See item in table with correct total
5. Edit item → total recalculates
6. Switch to "אומדן ביצוע" → empty (separate)
7. Create execution estimate items
8. See totals update in summary cards
9. Navigate away and back → data persists

All without errors or data loss.
