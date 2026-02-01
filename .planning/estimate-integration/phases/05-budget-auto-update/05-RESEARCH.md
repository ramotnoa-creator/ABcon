# Phase 5: Budget Auto-Update & Variance Display - Research

**Researched:** 2026-02-01
**Domain:** Automated financial variance tracking and real-time UI updates
**Confidence:** HIGH

## Summary

Phase 5 implements automated budget creation from tender winner selection and real-time variance calculation/display throughout the application. The research focused on three core technical challenges: (1) database-level auto-calculations vs application-level updates, (2) React patterns for real-time variance display, and (3) Excel export with conditional formatting for variance data.

The existing codebase already has variance calculation infrastructure in place (`varianceService.ts`) and database schema support (`budget_items` table with variance columns). The primary work is wiring up automatic triggers, ensuring calculations update when source data changes, and displaying variance with color coding consistently across all UI surfaces.

**Primary recommendation:** Use database triggers for automatic variance calculation on INSERT/UPDATE operations, paired with React's `useMemo` for client-side display logic. Avoid storing color codes in database - compute them on-the-fly based on variance values.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PostgreSQL Triggers | Native | Auto-calculate variance on data changes | Industry standard for maintaining derived fields, eliminates race conditions |
| React useMemo | 18.x | Memoize variance calculations in UI | Prevents unnecessary recalculation, official React hook for derived data |
| xlsx (SheetJS) | 0.18.x | Export budget data to Excel | Already in use (BudgetTabContent.tsx line 7), proven solution |
| ExcelJS | 4.x | Excel export with conditional formatting | Actively maintained, supports cell styling that SheetJS CE lacks |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| xlsx-js-style | 1.2.x | SheetJS fork with styling | If avoiding ExcelJS, but less maintained |
| Neon Serverless | Current | PostgreSQL database client | Already in use, handles parameterized queries |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Database triggers | Application-level updates | Triggers guarantee consistency, app-level is easier to debug but has race conditions |
| ExcelJS | SheetJS Pro | Pro has official support but requires commercial license |
| useMemo | useEffect + state | useMemo is cleaner for pure calculations, useEffect adds unnecessary complexity |

**Installation:**
```bash
npm install exceljs  # For Excel export with styling
```

## Architecture Patterns

### Recommended Data Flow
```
Winner Selection → Budget Item Created → Database Trigger → Variance Calculated → UI Refreshes
                                              ↓
                                    Auto-populate fields:
                                    - estimate_amount
                                    - variance_amount
                                    - variance_percent
```

### Pattern 1: Database Trigger for Auto-Calculation
**What:** PostgreSQL BEFORE INSERT/UPDATE trigger that calculates variance fields automatically
**When to use:** Whenever budget_items or estimate_items change
**Example:**
```sql
-- Source: PostgreSQL official docs (https://www.postgresql.org/docs/current/plpgsql-trigger.html)
CREATE OR REPLACE FUNCTION calculate_budget_variance()
RETURNS TRIGGER AS $$
DECLARE
  estimate_total DECIMAL(15,2);
BEGIN
  -- If estimate_item_id is provided, fetch the estimate amount
  IF NEW.estimate_item_id IS NOT NULL THEN
    SELECT total_with_vat INTO estimate_total
    FROM estimate_items
    WHERE id = NEW.estimate_item_id;

    -- Populate variance fields
    NEW.estimate_amount := estimate_total;
    NEW.variance_amount := NEW.total_with_vat - estimate_total;

    IF estimate_total > 0 THEN
      NEW.variance_percent := ((NEW.total_with_vat - estimate_total) / estimate_total) * 100;
    ELSE
      NEW.variance_percent := 0;
    END IF;
  ELSE
    -- No estimate linked, clear variance fields
    NEW.estimate_amount := NULL;
    NEW.variance_amount := NULL;
    NEW.variance_percent := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER budget_variance_trigger
BEFORE INSERT OR UPDATE OF total_with_vat, estimate_item_id ON budget_items
FOR EACH ROW
EXECUTE FUNCTION calculate_budget_variance();
```

### Pattern 2: Recalculation on Estimate Updates
**What:** Trigger on estimate_items that updates all linked budget_items
**When to use:** When estimate amounts change after budget created
**Example:**
```sql
-- Source: Derived from PostgreSQL trigger patterns
CREATE OR REPLACE FUNCTION recalculate_budget_variances_on_estimate_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all budget items linked to this estimate item
  UPDATE budget_items
  SET estimate_amount = NEW.total_with_vat,
      variance_amount = total_with_vat - NEW.total_with_vat,
      variance_percent = CASE
        WHEN NEW.total_with_vat > 0 THEN ((total_with_vat - NEW.total_with_vat) / NEW.total_with_vat) * 100
        ELSE 0
      END
  WHERE estimate_item_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER estimate_update_recalc_trigger
AFTER UPDATE OF total_with_vat ON estimate_items
FOR EACH ROW
WHEN (OLD.total_with_vat IS DISTINCT FROM NEW.total_with_vat)
EXECUTE FUNCTION recalculate_budget_variances_on_estimate_change();
```

### Pattern 3: Client-Side Variance Color Logic
**What:** Pure function that determines color based on variance, memoized in React
**When to use:** For all UI displays (tables, cards, exports)
**Example:**
```typescript
// Source: Existing pattern from BudgetTabContent.tsx, enhanced
export function getVarianceColor(
  varianceAmount: number | null | undefined,
  hasEstimate: boolean
): 'green' | 'red' | 'gray' {
  if (!hasEstimate || varianceAmount === null || varianceAmount === undefined) {
    return 'gray'; // No estimate linked
  }

  if (varianceAmount < 0) {
    return 'green'; // Saved money (budget < estimate)
  } else if (varianceAmount > 0) {
    return 'red'; // Over budget (budget > estimate)
  }

  return 'gray'; // Exact match
}

// Usage in component with useMemo
const varianceColor = useMemo(() =>
  getVarianceColor(item.variance_amount, !!item.estimate_item_id),
  [item.variance_amount, item.estimate_item_id]
);
```

### Pattern 4: Budget Creation on Winner Selection
**What:** Service method that creates budget item with all linkages
**When to use:** Winner selection confirmation in WinnerSelectionModal
**Example:**
```typescript
// Source: Derived from tenderParticipantsService.ts pattern
export async function createBudgetFromWinnerSelection(
  tenderId: string,
  participantId: string,
  projectId: string
): Promise<BudgetItem> {
  // Get tender details
  const tender = await getTenderById(tenderId);
  const participant = await getTenderParticipantById(participantId);

  if (!tender || !participant) {
    throw new Error('Tender or participant not found');
  }

  // Get estimate item if tender has estimate link
  let estimateItemId: string | undefined;
  let sourceEstimateId: string | undefined;

  if (tender.estimate_id) {
    const estimate = await getEstimateById(tender.estimate_id);
    sourceEstimateId = estimate?.id;
    // Link to first estimate item (or implement item matching logic)
    const estimateItems = await getEstimateItems(tender.estimate_id);
    estimateItemId = estimateItems[0]?.id;
  }

  // Create budget item - trigger will auto-calculate variance
  const budgetItem = await createBudgetItem({
    project_id: projectId,
    chapter_id: DEFAULT_CHAPTER_ID, // Determine appropriate chapter
    description: tender.tender_name,
    total_price: participant.total_amount || 0,
    vat_rate: 0.17,
    vat_amount: (participant.total_amount || 0) * 0.17,
    total_with_vat: (participant.total_amount || 0) * 1.17,
    status: 'contracted',
    supplier_id: participant.professional_id,
    tender_id: tenderId,
    estimate_item_id: estimateItemId,
    source_estimate_id: sourceEstimateId,
    paid_amount: 0,
    order: await getNextBudgetItemOrder(projectId, DEFAULT_CHAPTER_ID)
  });

  return budgetItem;
}
```

### Anti-Patterns to Avoid
- **Storing color codes in database:** Color is presentation logic, compute on client
- **useEffect for variance calculation:** Use useMemo instead, calculations are pure functions
- **Manual variance updates in multiple places:** Let database triggers handle it
- **Ignoring NULL vs 0 distinction:** Show dash (-) for no estimate, not ₪0

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Excel cell styling | Custom XLSX writer | ExcelJS library | Handles borders, colors, alignment, number formats - complex Excel spec |
| Monetary precision | JavaScript numbers | Existing DECIMAL(15,2) in DB | Floating point errors in financial calculations |
| Variance formula consistency | Multiple calculation functions | Single source of truth in DB trigger | Prevents drift between calculations |
| React re-render optimization | Manual shouldComponentUpdate | useMemo/useCallback | React team tested these extensively |
| Conditional color mapping | Inline style logic everywhere | Centralized utility function | DRY principle, easier to update color scheme |

**Key insight:** Financial applications require consistency and precision. Database-level calculations eliminate race conditions and ensure all code paths see the same computed values.

## Common Pitfalls

### Pitfall 1: Race Conditions in Application-Level Updates
**What goes wrong:** User updates budget amount → app calculates variance → another user updates estimate → variance is now stale
**Why it happens:** Application code can't atomically update multiple dependent fields
**How to avoid:** Use database triggers for calculations that must stay consistent
**Warning signs:** Bug reports like "variance shows wrong number after updating estimate"

### Pitfall 2: Missing Recalculation Triggers
**What goes wrong:** Estimate amount changes but budget variance doesn't update
**Why it happens:** Forgot to add trigger on estimate_items table changes
**How to avoid:** Add AFTER UPDATE trigger on estimate_items that updates linked budget_items
**Warning signs:** Users report "variance is stuck at old value"

### Pitfall 3: Infinite useEffect Loops
**What goes wrong:** useEffect triggers on variance change → updates state → triggers again
**Why it happens:** Dependencies include objects/arrays that are recreated every render
**How to avoid:** Use useMemo for calculations instead of useEffect. Per React docs: "If you can calculate something during render, you don't need an Effect"
**Warning signs:** Browser freezes, React DevTools shows thousands of renders

### Pitfall 4: Incorrect Variance Formula Direction
**What goes wrong:** Shows green for overspend, red for savings (backwards!)
**Why it happens:** Formula variance = estimate - budget instead of budget - estimate
**How to avoid:** Follow financial reporting standard: variance = actual - planned (positive = overrun)
**Warning signs:** User confusion about color meanings

### Pitfall 5: Excel Export Without Color Coding
**What goes wrong:** Excel file exports data but loses color-coded variance indicators
**Why it happens:** SheetJS Community Edition doesn't support cell styling
**How to avoid:** Use ExcelJS or xlsx-js-style for conditional formatting
**Warning signs:** User complaint "Excel export is hard to read, no colors"

### Pitfall 6: Forgetting NULL Handling in Variance Display
**What goes wrong:** Shows "₪0" or "NaN" instead of "-" when no estimate exists
**Why it happens:** Not checking for NULL/undefined before formatting
**How to avoid:** Always check `hasEstimate` flag before displaying variance
**Warning signs:** Tables show confusing "₪0.00" or "0.0%" for items without estimates

## Code Examples

Verified patterns from official sources and existing codebase:

### Winner Selection with Auto-Budget Creation
```typescript
// Source: Derived from WinnerSelectionModal.tsx and tenderParticipantsService.ts
const handleWinnerConfirm = async () => {
  try {
    // 1. Set winner in tender_participants
    await setTenderWinner(tender.id, winnerParticipant.id);

    // 2. Update tender status and contract amount
    await updateTender(tender.id, {
      status: 'WinnerSelected',
      contract_amount: winnerParticipant.total_amount,
      winner_professional_id: winnerParticipant.professional_id,
    });

    // 3. Create budget item (database trigger calculates variance)
    const budgetItem = await createBudgetFromWinnerSelection(
      tender.id,
      winnerParticipant.id,
      tender.project_id
    );

    // 4. Lock the source estimate if it exists
    if (tender.estimate_id) {
      await updateEstimate(tender.estimate_id, {
        status: 'locked',
        locked_at: new Date().toISOString(),
      });
    }

    // UI refresh happens automatically via React state update
    onConfirm();
  } catch (error) {
    console.error('Failed to create budget from winner:', error);
    // Show error toast
  }
};
```

### Variance Display Component Pattern
```typescript
// Source: Enhanced from BudgetTabContent.tsx
interface VarianceDisplayProps {
  estimateAmount?: number;
  budgetAmount: number;
  varianceAmount?: number;
  variancePercent?: number;
  size?: 'sm' | 'md' | 'lg';
}

function VarianceDisplay({
  estimateAmount,
  budgetAmount,
  varianceAmount,
  variancePercent,
  size = 'md'
}: VarianceDisplayProps) {
  const hasEstimate = estimateAmount !== null && estimateAmount !== undefined && estimateAmount > 0;

  const color = useMemo(() =>
    getVarianceColor(varianceAmount, hasEstimate),
    [varianceAmount, hasEstimate]
  );

  const colorClasses = {
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
    gray: 'text-gray-400 dark:text-gray-500',
  };

  if (!hasEstimate) {
    return <span className={colorClasses.gray}>-</span>;
  }

  return (
    <div className={colorClasses[color]}>
      <div className={size === 'lg' ? 'text-lg' : 'text-sm'}>
        {formatCurrency(varianceAmount || 0)}
      </div>
      <div className="text-xs">
        ({formatVariance(variancePercent || 0)})
      </div>
    </div>
  );
}
```

### Excel Export with Conditional Formatting
```typescript
// Source: Enhanced from BudgetTabContent.tsx with ExcelJS
import * as ExcelJS from 'exceljs';

async function exportBudgetWithVariance(items: BudgetItem[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('תקציב');

  // Add headers
  sheet.columns = [
    { header: 'פרויקט', key: 'project', width: 20 },
    { header: 'תיאור', key: 'description', width: 30 },
    { header: 'אומדן', key: 'estimate', width: 15 },
    { header: 'תקציב', key: 'budget', width: 15 },
    { header: 'חריגה ₪', key: 'variance_amount', width: 15 },
    { header: 'חריגה %', key: 'variance_percent', width: 12 },
  ];

  // Add data rows
  items.forEach(item => {
    const hasEstimate = item.estimate_amount && item.estimate_amount > 0;

    sheet.addRow({
      project: item.project?.project_name || '',
      description: item.description,
      estimate: hasEstimate ? item.estimate_amount : '-',
      budget: item.total_with_vat,
      variance_amount: hasEstimate ? item.variance_amount : '-',
      variance_percent: hasEstimate ? item.variance_percent : '-',
    });
  });

  // Apply conditional formatting to variance columns
  sheet.getColumn('variance_amount').eachCell((cell, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    const item = items[rowNumber - 2];
    const hasEstimate = item.estimate_amount && item.estimate_amount > 0;

    if (!hasEstimate) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' } // Gray
      };
    } else if (item.variance_amount! < 0) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD4EDDA' } // Light green
      };
      cell.font = { color: { argb: 'FF28A745' } }; // Green text
    } else if (item.variance_amount! > 0) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8D7DA' } // Light red
      };
      cell.font = { color: { argb: 'FFDC3545' } }; // Red text
    }
  });

  // Export file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `budget-variance-${new Date().toISOString().split('T')[0]}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
```

### Filter: Show Items with Variance Only
```typescript
// Source: Already implemented in BudgetTabContent.tsx (line 206-209)
const filteredBudgetItems = useMemo(() => {
  let filtered = budgetItemsWithDetails;

  // ... other filters ...

  // Variance only filter
  if (varianceOnlyFilter) {
    filtered = filtered.filter((item) => item.estimate_amount && item.estimate_amount > 0);
  }

  return filtered;
}, [budgetItemsWithDetails, varianceOnlyFilter]);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual variance calculation in UI | Database triggers + client display | 2023+ | Eliminates consistency issues, reduces client-side logic |
| useEffect for calculations | useMemo for pure functions | React 18 (2022) | Cleaner code, fewer bugs, better performance |
| SheetJS for all Excel needs | ExcelJS for styled exports | 2024+ | Conditional formatting support without commercial license |
| Store colors in database | Compute on client | Best practice | Separates presentation from data layer |

**Deprecated/outdated:**
- **xlsx-style:** Last updated 2018, use xlsx-js-style or ExcelJS instead
- **useEffect for derived state:** React docs explicitly say "You Might Not Need an Effect" for calculations
- **Application-level variance updates:** Database triggers are now standard for maintaining derived fields

## Open Questions

Things that couldn't be fully resolved:

1. **Multiple estimate items per tender**
   - What we know: Tenders can link to estimates with multiple items
   - What's unclear: How to map multiple estimate items to a single budget item
   - Recommendation: Create one budget item per estimate item, or aggregate estimate total for Phase 5 MVP

2. **Chapter assignment for auto-created budget items**
   - What we know: Budget items require a chapter_id
   - What's unclear: Business logic for determining correct chapter from tender
   - Recommendation: Use default chapter or add chapter field to tender creation flow

3. **Performance impact of variance recalculation triggers**
   - What we know: Triggers execute on every UPDATE to estimate_items
   - What's unclear: Performance at scale (1000+ budget items)
   - Recommendation: Monitor query performance, consider debouncing bulk updates

4. **Historical variance tracking**
   - What we know: Current variance fields show point-in-time values
   - What's unclear: Should we track variance history over time?
   - Recommendation: Out of scope for Phase 5, add to future phase if needed

## Sources

### Primary (HIGH confidence)
- [PostgreSQL Trigger Functions Documentation](https://www.postgresql.org/docs/current/plpgsql-trigger.html) - Official PostgreSQL docs
- [React useEffect Documentation](https://react.dev/reference/react/useEffect) - Official React docs
- [React: You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) - Official React guidance
- Existing codebase:
  - `src/services/varianceService.ts` - Variance calculation patterns
  - `src/services/budgetItemsService.ts` - Budget CRUD operations
  - `src/pages/CostControl/tabs/BudgetTabContent.tsx` - Variance display implementation
  - `src/types.ts` - Database schema definitions (lines 352-382, BudgetItem interface)

### Secondary (MEDIUM confidence)
- [PostgreSQL Denormalization Best Practices (Galaxy)](https://www.getgalaxy.io/learn/glossary/how-to-denormalize-data-in-postgresql) - Verified with official docs
- [ExcelJS GitHub Repository](https://github.com/exceljs/exceljs) - Active maintenance, 13k+ stars
- [Data Visualization Color Best Practices (Sigma Computing)](https://www.sigmacomputing.com/blog/7-best-practices-for-using-color-in-data-visualizations) - Industry standard guidelines
- [React Stack Patterns 2026 (patterns.dev)](https://www.patterns.dev/react/react-2026/) - Community best practices

### Tertiary (LOW confidence)
- [xlsx-js-style npm package](https://www.npmjs.com/package/xlsx-js-style) - Community fork, verify stability before use
- Medium articles on React hooks - Useful patterns but verify with official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use or officially recommended
- Architecture: HIGH - Patterns verified with PostgreSQL docs and existing codebase
- Pitfalls: HIGH - Based on React team guidance and database best practices
- Excel export: MEDIUM - ExcelJS well-documented but not yet tested in this codebase

**Research date:** 2026-02-01
**Valid until:** 60 days (stable domain - PostgreSQL and React core patterns change slowly)

**Key decision points for planner:**
1. Use database triggers for variance calculation (not application-level)
2. Install ExcelJS for conditional formatting in exports
3. Use useMemo for client-side color logic, not useEffect
4. Follow existing variance formula: budget - estimate (positive = overrun)
5. Show dash (-) for items without estimates, not zero
