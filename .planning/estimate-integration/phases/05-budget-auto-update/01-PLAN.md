# Phase 5: Budget Auto-Update & Variance Display - Execution Plan

```yaml
wave: 1
depends_on: ['04-tender-integration']
files_modified:
  - src/components/Tenders/WinnerSelectionModal.tsx
  - src/services/tenderParticipantsService.ts
  - src/pages/CostControl/tabs/BudgetTabContent.tsx
  - src/pages/Projects/tabs/subtabs/BudgetSubTab.tsx
  - src/components/Budget/VarianceCell.tsx
autonomous: false
```

## Objective

Complete the automation loop: Winner selection → Auto-create budget item → Calculate variance → Display throughout UI. Make variance visible and color-coded everywhere budgets appear.

## Context

**Current state:**
- Phase 4 complete: Winner selection shows preview modal
- Services ready: varianceService can calculate
- Budget tab exists but doesn't auto-create from tenders

**What we're building:**
- Winner confirmation creates/updates budget item automatically
- Budget item links to estimate item
- Variance calculated and stored
- Variance visible in both global and project budget views
- Color coding throughout (green/red/gray)

## Tasks

<task id="5.1" title="Implement budget auto-creation on winner selection">
<description>
When user confirms winner in modal, automatically create budget item.

**File:** `src/components/Tenders/WinnerSelectionModal.tsx`

**Update confirm handler:**
```typescript
const confirmWinnerSelection = async () => {
  try {
    // 1. Update tender with winner
    await updateTender(tender.id, {
      winner_professional_id: winnerParticipant.professional_id,
      winner_professional_name: winnerParticipant.professional.professional_name,
      contract_amount: winnerParticipant.total_amount,
      status: 'WinnerSelected'
    });

    // 2. Find estimate item if tender has estimate link
    let estimateItemId = null;
    let estimateAmount = null;

    if (tender.estimate_id) {
      // Get first item from estimate (simplified - could match by description)
      const estimateItems = await getEstimateItems(tender.estimate_id);
      if (estimateItems.length > 0) {
        estimateItemId = estimateItems[0].id;
        estimateAmount = estimateItems[0].total_with_vat;
      }
    }

    // 3. Create or update budget item
    const budgetItem = await createBudgetItem({
      project_id: tender.project_id,
      tender_id: tender.id,
      estimate_item_id: estimateItemId,
      description: tender.tender_name,
      total_with_vat: winnerParticipant.total_amount,
      estimate_amount: estimateAmount || tender.estimated_budget,
      supplier_id: winnerParticipant.professional_id,
      supplier_name: winnerParticipant.professional.professional_name,
      status: 'contracted'
    });

    // 4. Calculate and store variance
    if (estimateAmount) {
      const variance = await calculateVariance(budgetItem.id);
      await updateBudgetItemVariance(budgetItem.id);
    }

    showToast('Winner selected and budget item created', 'success');
    onSuccess();
  } catch (error) {
    showToast('Failed to create budget item', 'error');
    console.error(error);
  }
};
```

**Acceptance:**
- Winner confirmation creates budget item
- Budget item linked to tender (tender_id)
- Budget item linked to estimate item (estimate_item_id)
- Variance calculated and stored
- Toast notification shown
- Error handling graceful
</description>
</task>

<task id="5.2" title="Update budget item variance calculations">
<description>
Enhance budget items service to handle variance updates.

**File:** `src/services/budgetItemsService.ts`

**Add/update functions:**
```typescript
/**
 * Update budget item with variance calculations
 */
async function updateBudgetItemVariance(budgetItemId: string) {
  const item = await getBudgetItem(budgetItemId);

  if (!item.estimate_item_id) {
    // No estimate link = no variance
    return null;
  }

  const estimateItem = await getEstimateItem(item.estimate_item_id);

  const varianceAmount = item.total_with_vat - estimateItem.total_with_vat;
  const variancePercent = (varianceAmount / estimateItem.total_with_vat) * 100;

  await sql`
    UPDATE budget_items
    SET
      estimate_amount = ${estimateItem.total_with_vat},
      variance_amount = ${varianceAmount},
      variance_percent = ${variancePercent},
      updated_at = NOW()
    WHERE id = ${budgetItemId}
  `;

  return {
    estimate_amount: estimateItem.total_with_vat,
    variance_amount: varianceAmount,
    variance_percent: variancePercent
  };
}

/**
 * Recalculate variance for all items in project
 */
async function recalculateProjectVariance(projectId: string) {
  const items = await sql`
    SELECT bi.id
    FROM budget_items bi
    WHERE bi.project_id = ${projectId}
    AND bi.estimate_item_id IS NOT NULL
  `;

  for (const item of items) {
    await updateBudgetItemVariance(item.id);
  }
}
```

**Acceptance:**
- updateBudgetItemVariance calculates correctly
- Handles null estimate gracefully
- recalculateProjectVariance updates all items
- Formula accurate: variance = budget - estimate
- Percentage calculated correctly
</description>
</task>

<task id="5.3" title="Add variance columns to global Budget tab">
<description>
Display variance in global Cost Control Budget tab.

**File:** `src/pages/CostControl/tabs/BudgetTabContent.tsx`

**Add table columns:**
```tsx
<Table>
  <thead>
    <tr>
      <th>Project</th>
      <th>Category</th>
      <th>Chapter</th>
      <th>Estimate</th>
      <th>Budget</th>
      <th>Paid</th>
      <th>Variance ₪</th>
      <th>Variance %</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    {budgetItems.map(item => (
      <tr key={item.id}>
        <td>{item.project_name}</td>
        <td>{item.category_name}</td>
        <td>{item.chapter_name}</td>
        <td>
          {item.estimate_amount ? (
            <span>₪{formatCurrency(item.estimate_amount)}</span>
          ) : (
            <span className="text-gray-400">N/A</span>
          )}
        </td>
        <td>₪{formatCurrency(item.total_with_vat)}</td>
        <td>₪{formatCurrency(item.paid_amount || 0)}</td>
        <td>
          <VarianceCell
            estimateAmount={item.estimate_amount}
            budgetAmount={item.total_with_vat}
            varianceAmount={item.variance_amount}
          />
        </td>
        <td>
          <VarianceCell
            estimateAmount={item.estimate_amount}
            budgetAmount={item.total_with_vat}
            variancePercent={item.variance_percent}
            showPercent
          />
        </td>
        <td><StatusBadge status={item.status} /></td>
      </tr>
    ))}
  </tbody>
</Table>
```

**Add filter:**
```tsx
<FilterBar>
  <Checkbox
    checked={showVarianceOnly}
    onChange={setShowVarianceOnly}
    label="Show items with variance only"
  />
</FilterBar>
```

**Filtering logic:**
```typescript
const filteredItems = showVarianceOnly
  ? budgetItems.filter(item => item.estimate_item_id !== null)
  : budgetItems;
```

**Acceptance:**
- Estimate column shows amount or N/A
- Variance columns display correctly
- VarianceCell component shows color coding
- Filter hides items without estimates
- All existing columns preserved
</description>
</task>

<task id="5.4" title="Add variance columns to project Budget sub-tab">
<description>
Same variance display in project-level budget.

**File:** `src/pages/Projects/tabs/subtabs/BudgetSubTab.tsx`

**Apply same changes as 5.3:**
- Add Estimate, Variance ₪, Variance % columns
- Add "Show items with variance only" filter
- Use VarianceCell component
- Color coding

**Acceptance:**
- Same functionality as global view
- Works in tree view, table view, cashflow view
- Responsive on mobile
</description>
</task>

<task id="5.5" title="Create VarianceCell component">
<description>
Reusable component for displaying variance with color coding.

**File:** `src/components/Budget/VarianceCell.tsx`

**Implementation:**
```tsx
interface VarianceCellProps {
  estimateAmount: number | null;
  budgetAmount: number;
  varianceAmount?: number;
  variancePercent?: number;
  showPercent?: boolean;
}

const VarianceCell = ({
  estimateAmount,
  budgetAmount,
  varianceAmount,
  variancePercent,
  showPercent = false
}) => {
  // No estimate = gray
  if (!estimateAmount) {
    return <span className="text-gray-400">N/A</span>;
  }

  // Calculate if not provided
  const variance = varianceAmount ?? (budgetAmount - estimateAmount);
  const percent = variancePercent ?? ((variance / estimateAmount) * 100);

  // Determine color
  // Negative variance = saved money = green
  // Positive variance = extra cost = red
  const colorClass = variance < 0
    ? 'text-green-600 bg-green-50'
    : variance > 0
    ? 'text-red-600 bg-red-50'
    : 'text-gray-600';

  const indicator = variance < 0 ? '🟢' : variance > 0 ? '🔴' : '';

  if (showPercent) {
    return (
      <span className={`variance-cell ${colorClass}`}>
        {percent > 0 ? '+' : ''}{percent.toFixed(1)}% {indicator}
      </span>
    );
  }

  return (
    <span className={`variance-cell ${colorClass}`}>
      {variance > 0 ? '+' : ''}₪{formatCurrency(Math.abs(variance))} {indicator}
    </span>
  );
};

export default VarianceCell;
```

**Acceptance:**
- Shows N/A when no estimate
- Color codes correctly (green/red/gray)
- Shows currency or percentage based on prop
- Indicator emoji visible
- Styling consistent
</description>
</task>

<task id="5.6" title="Add variance recalculation trigger">
<description>
Recalculate variance when budget item updated.

**File:** `src/services/budgetItemsService.ts`

**Update updateBudgetItem function:**
```typescript
async function updateBudgetItem(itemId: string, data: Partial<BudgetItem>) {
  // Update item
  await sql`
    UPDATE budget_items
    SET ${sql(data)},
        updated_at = NOW()
    WHERE id = ${itemId}
  `;

  // If amount changed and has estimate link, recalculate variance
  if (
    (data.total_with_vat || data.total_price) &&
    data.estimate_item_id
  ) {
    await updateBudgetItemVariance(itemId);
  }

  return await getBudgetItem(itemId);
}
```

**Acceptance:**
- Budget changes trigger variance update
- Only recalculates if estimate linked
- Doesn't slow down unrelated updates
- Variance stays accurate
</description>
</task>

<task id="5.7" title="Add Excel export with variance">
<description>
Include variance columns in budget Excel export.

**File:** `src/pages/CostControl/tabs/BudgetTabContent.tsx`

**Update export function:**
```typescript
const exportToExcel = () => {
  const data = budgetItems.map(item => ({
    'Project': item.project_name,
    'Category': item.category_name,
    'Chapter': item.chapter_name,
    'Description': item.description,
    'Estimate (₪)': item.estimate_amount || 'N/A',
    'Budget (₪)': item.total_with_vat,
    'Paid (₪)': item.paid_amount || 0,
    'Variance (₪)': item.variance_amount || 'N/A',
    'Variance (%)': item.variance_percent
      ? `${item.variance_percent.toFixed(1)}%`
      : 'N/A',
    'Status': item.status
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Budget with Variance');

  XLSX.writeFile(workbook, `budget-variance-${Date.now()}.xlsx`);
};
```

**Acceptance:**
- Export includes all variance columns
- N/A shown for items without estimates
- Formatting clear in Excel
- File downloads successfully
</description>
</task>

<task id="5.8" title="Write E2E tests">
<description>
Test complete workflow: Winner → Budget → Variance.

**File:** `tests/budget-auto-update.spec.ts`

**Test cases:**
```typescript
test('Winner selection creates budget with variance', async ({ page }) => {
  // Create estimate with item (₪150,000)
  // Export to tender
  // Add participant with quote (₪145,000)
  // Select winner → confirm modal
  // Verify budget item created
  // Verify variance = -₪5,000 (saved)
  // Verify variance % = -3.3%
  // Verify green color coding
});

test('Budget table shows variance columns', async ({ page }) => {
  // Navigate to Cost Control → Budget tab
  // Verify Estimate column visible
  // Verify Variance ₪ column visible
  // Verify Variance % column visible
  // Verify color coding (green/red/gray)
});

test('Filter shows only items with variance', async ({ page }) => {
  // Budget tab → check "Show items with variance only"
  // Verify only items with estimate_item_id shown
  // Uncheck filter → all items visible
});

test('Variance recalculates on budget update', async ({ page }) => {
  // Edit budget item amount
  // Verify variance updates
  // Verify color changes if crossed threshold
});

test('Excel export includes variance', async ({ page }) => {
  // Budget tab → click Export
  // Download file
  // Verify variance columns present
  // Verify data matches UI
});
```

**Acceptance:**
- All tests pass
- Cover happy path
- Test edge cases (zero, negative)
- No flaky tests
</description>
</task>

## Verification Criteria

### Must Work
- [ ] Winner selection creates budget item automatically
- [ ] Budget item links to estimate item (estimate_item_id set)
- [ ] Variance calculates correctly (budget - estimate)
- [ ] Variance visible in global Budget tab
- [ ] Variance visible in project Budget sub-tab
- [ ] Color coding accurate (green/red/gray)
- [ ] Filter shows only items with variance
- [ ] Excel export includes variance

### Calculations
- [ ] Variance ₪ = budget - estimate
- [ ] Variance % = (variance / estimate) * 100
- [ ] Negative variance = saved money = green
- [ ] Positive variance = extra cost = red
- [ ] No estimate = gray/N/A

### Quality
- [ ] Responsive on mobile
- [ ] Performance good (no lag with 100+ items)
- [ ] Error handling graceful
- [ ] Toast notifications clear

## must_haves

**For phase goal: "Automate budget creation and display variance"**

1. **Winner selection creates budget**
   - Confirm winner → budget item created
   - Links to tender (tender_id)
   - Links to estimate item (estimate_item_id)
   - Contract amount stored

2. **Variance calculated automatically**
   - Formula: budget - estimate
   - Stored in variance_amount, variance_percent
   - Updates when budget changes
   - Accurate to 2 decimal places

3. **Variance visible everywhere**
   - Global Budget tab (3 new columns)
   - Project Budget sub-tab (3 new columns)
   - Color coded (green/red/gray)
   - Clear indicators

4. **Filter helps find problems**
   - "Show items with variance only" checkbox
   - Quickly spot items with estimates
   - Easy to review variances

5. **Export includes variance**
   - Excel has all variance columns
   - N/A for items without estimates
   - Formatting clear

## Success Indicator

**Phase 5 is complete when:**

User can execute this workflow:
1. Create planning estimate: ₪150,000
2. Export to tender
3. Add participant quote: ₪145,000 (saved ₪5,000!)
4. Select winner → confirm modal
5. Budget item auto-created
6. Go to Budget tab
7. See row with:
   - Estimate: ₪150,000
   - Budget: ₪145,000
   - Variance: -₪5,000 (green)
   - Variance: -3.3% (green)
8. Check "Show items with variance only"
9. Item still visible (has estimate)
10. Export to Excel
11. Variance columns in file

All numbers accurate. Colors correct. No errors.
