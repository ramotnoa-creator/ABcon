# Phase 1: Database Foundation - Execution Plan

```yaml
wave: 1
depends_on: []
files_modified:
  - src/lib/neon.ts
  - src/services/estimatesService.ts
  - src/services/estimateItemsService.ts
  - src/services/bomFilesService.ts
  - src/services/varianceService.ts
  - src/types.ts
autonomous: false
```

## Objective

Create complete database schema and TypeScript services for estimate management system. Build the foundation that all other phases depend on.

## Context

This is Phase 1 of the Estimate Integration project. We're building a Cost Control system (בקרת עלויות) that unifies Estimates, Tenders, and Budget. This phase creates the data layer.

**Current state:**
- Existing Budget and Tender systems in place
- Neon PostgreSQL database
- TypeScript services pattern established

**What we're adding:**
- Estimates (planning + execution types)
- Estimate items (line items with VAT calculations)
- BOM file storage
- Variance tracking between estimates and budgets

## Tasks

<task id="1.1" title="Create estimates table">
<description>
Create `estimates` table in Neon database with proper schema, indexes, and constraints.

**Schema:**
```sql
CREATE TABLE estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  estimate_type VARCHAR(20) NOT NULL CHECK (estimate_type IN ('planning', 'execution')),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  total_amount DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'exported_to_tender')),
  created_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_estimates_project ON estimates(project_id);
CREATE INDEX idx_estimates_type ON estimates(estimate_type);
CREATE INDEX idx_estimates_status ON estimates(status);
```

**Acceptance:**
- Table created without errors
- All indexes created
- Constraints enforce valid values
- Can insert/query test data
</description>
</task>

<task id="1.2" title="Create estimate_items table">
<description>
Create `estimate_items` table for line items within estimates.

**Schema:**
```sql
CREATE TABLE estimate_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  code VARCHAR(50),
  description TEXT NOT NULL,
  category VARCHAR(100),
  subcategory VARCHAR(100),
  unit VARCHAR(50),
  quantity DECIMAL(10,2),
  unit_price DECIMAL(15,2),
  total_price DECIMAL(15,2),
  vat_rate DECIMAL(5,2) DEFAULT 17.00,
  vat_amount DECIMAL(15,2),
  total_with_vat DECIMAL(15,2),
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_estimate_items_estimate ON estimate_items(estimate_id);
CREATE INDEX idx_estimate_items_category ON estimate_items(category);
```

**Acceptance:**
- Table created successfully
- Foreign key to estimates works
- Can store line items with VAT calculations
- Order index allows sorting
</description>
</task>

<task id="1.3" title="Create bom_files table">
<description>
Create `bom_files` table for storing Bill of Materials documents.

**Schema:**
```sql
CREATE TABLE bom_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bom_tender ON bom_files(tender_id);
```

**Acceptance:**
- Table created
- Can store file metadata
- Foreign key to tenders table works
- File size and type tracked
</description>
</task>

<task id="1.4" title="Modify tenders table">
<description>
Add columns to existing `tenders` table to link to estimates and BOM files.

**Migration:**
```sql
ALTER TABLE tenders
ADD COLUMN estimate_id UUID REFERENCES estimates(id),
ADD COLUMN bom_file_id UUID REFERENCES bom_files(id);

CREATE INDEX idx_tenders_estimate ON tenders(estimate_id);
CREATE INDEX idx_tenders_bom ON tenders(bom_file_id);
```

**Acceptance:**
- Columns added without errors
- Existing tender data preserved
- Indexes created
- Can link tender to estimate
</description>
</task>

<task id="1.5" title="Modify budget_items table">
<description>
Add variance tracking columns to existing `budget_items` table.

**Migration:**
```sql
ALTER TABLE budget_items
ADD COLUMN estimate_item_id UUID REFERENCES estimate_items(id),
ADD COLUMN estimate_amount DECIMAL(15,2),
ADD COLUMN variance_amount DECIMAL(15,2),
ADD COLUMN variance_percent DECIMAL(5,2);

CREATE INDEX idx_budget_items_estimate ON budget_items(estimate_item_id);
```

**Acceptance:**
- Columns added successfully
- Existing budget data intact
- Can calculate and store variance
- Index allows fast lookups
</description>
</task>

<task id="1.6" title="Create estimatesService.ts">
<description>
Create TypeScript service for estimate CRUD operations.

**Functions to implement:**
- `getEstimates(projectId, type?)` - Get all estimates for project
- `getEstimate(estimateId)` - Get single estimate
- `getAllEstimates()` - Get all estimates (permission-filtered)
- `createEstimate(data)` - Create new estimate
- `updateEstimate(estimateId, data)` - Update estimate
- `deleteEstimate(estimateId)` - Delete estimate
- `getEstimateSummary(estimateId)` - Calculate totals

**Requirements:**
- Follow existing service pattern (see budgetService.ts)
- Permission filtering (Manager/Entrepreneur see own, Accountancy/Super Manager see all)
- Error handling
- TypeScript types
- Demo mode fallback (localStorage)

**Acceptance:**
- All CRUD operations work
- Permission filtering correct
- Returns proper TypeScript types
- Handles errors gracefully
</description>
</task>

<task id="1.7" title="Create estimateItemsService.ts">
<description>
Create service for estimate line items with VAT calculations.

**Functions to implement:**
- `getEstimateItems(estimateId)` - Get all items for estimate
- `createEstimateItem(data)` - Create item with calculations
- `updateEstimateItem(itemId, data)` - Update item, recalculate
- `deleteEstimateItem(itemId)` - Delete item
- `bulkCreateEstimateItems(estimateId, items[])` - Create multiple
- `reorderEstimateItems(estimateId, orderMap)` - Change order
- `calculateItemTotals(item)` - VAT calculations

**VAT Calculation Logic:**
```typescript
total_price = quantity * unit_price
vat_amount = total_price * (vat_rate / 100)
total_with_vat = total_price + vat_amount
```

**Acceptance:**
- CRUD operations functional
- VAT calculations accurate (17% fixed)
- Bulk operations work
- Reordering persists
- Updates trigger estimate total recalculation
</description>
</task>

<task id="1.8" title="Create bomFilesService.ts">
<description>
Create service for BOM file management.

**Functions to implement:**
- `uploadBOMFile(tenderId, file)` - Upload file, return metadata
- `getBOMFile(bomFileId)` - Get file metadata
- `getBOMFilesByTender(tenderId)` - Get all BOM files for tender
- `downloadBOMFile(bomFileId)` - Get file for download
- `deleteBOMFile(bomFileId)` - Remove file

**Storage Strategy:**
- Phase 1: Store in Neon database as bytea/base64
- File size limit: 10MB
- Supported types: .doc, .docx

**Acceptance:**
- Can upload Word documents
- File size validation works
- Download returns correct file
- Metadata stored correctly
- Handles errors (file too large, wrong type)
</description>
</task>

<task id="1.9" title="Create varianceService.ts">
<description>
Create service for variance calculations between estimates and budgets.

**Functions to implement:**
- `calculateVariance(budgetItemId)` - Calculate for one item
- `calculateProjectVariance(projectId)` - Calculate for all items
- `updateBudgetItemVariance(budgetItemId)` - Recalculate and save

**Variance Formula:**
```typescript
variance_amount = budget_amount - estimate_amount
variance_percent = (variance_amount / estimate_amount) * 100

// Negative variance = saved money (under budget) = GREEN
// Positive variance = extra cost (over budget) = RED
// No estimate = null variance = GRAY
```

**Acceptance:**
- Variance calculations accurate
- Handles edge cases (null, zero, negative)
- Updates budget_items table correctly
- Returns color indicators
</description>
</task>

<task id="1.10" title="Add TypeScript types">
<description>
Add type definitions to `src/types.ts` for new entities.

**Types to add:**
```typescript
type EstimateType = 'planning' | 'execution';
type EstimateStatus = 'draft' | 'active' | 'exported_to_tender';

interface Estimate {
  id: string;
  project_id: string;
  estimate_type: EstimateType;
  name: string;
  description?: string;
  total_amount: number;
  status: EstimateStatus;
  created_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface EstimateItem {
  id: string;
  estimate_id: string;
  code?: string;
  description: string;
  category?: string;
  subcategory?: string;
  unit?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  vat_rate: number;
  vat_amount: number;
  total_with_vat: number;
  notes?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface BOMFile {
  id: string;
  tender_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by?: string;
  uploaded_at: string;
}

interface VarianceData {
  estimate_amount: number;
  budget_amount: number;
  variance_amount: number;
  variance_percent: number;
  color: 'green' | 'red' | 'gray';
}
```

**Acceptance:**
- Types compile without errors
- Used throughout services
- Proper optional fields
- Export from types.ts
</description>
</task>

<task id="1.11" title="Write unit tests">
<description>
Create unit tests for all services with >80% coverage.

**Test files to create:**
- `src/services/__tests__/estimatesService.test.ts`
- `src/services/__tests__/estimateItemsService.test.ts`
- `src/services/__tests__/bomFilesService.test.ts`
- `src/services/__tests__/varianceService.test.ts`

**Test coverage:**
- CRUD operations (create, read, update, delete)
- VAT calculations (various amounts, edge cases)
- Variance calculations (positive, negative, zero, null)
- Permission filtering
- Error handling
- Edge cases (empty data, invalid IDs, etc.)

**Acceptance:**
- All tests pass
- Coverage >80% for each service
- Tests run in CI/CD pipeline
- No flaky tests
</description>
</task>

<task id="1.12" title="Create demo/seed data">
<description>
Create seed data for testing and development.

**Seed data to create:**
- 2 planning estimates (one for each test project)
- 2 execution estimates
- 10-15 estimate items across estimates
- Sample BOM file metadata

**Script location:** `scripts/seed-estimates.ts`

**Acceptance:**
- Seed script runs without errors
- Creates realistic test data
- Can be run multiple times (idempotent)
- Useful for testing UI in later phases
</description>
</task>

<task id="1.13" title="Create migration scripts">
<description>
Create database migration scripts with rollback capability.

**Files to create:**
- `migrations/001-create-estimates.sql` - Forward migration
- `migrations/001-rollback-estimates.sql` - Rollback migration
- `migrations/002-alter-tenders-budget.sql` - Alter existing tables
- `migrations/002-rollback-tenders-budget.sql` - Rollback alters

**Requirements:**
- Idempotent (can run multiple times safely)
- Transactional (all or nothing)
- Documented (comments explaining each step)
- Tested on copy of production data

**Acceptance:**
- Forward migration creates all tables
- Rollback cleanly removes changes
- No data loss on rollback
- Clear documentation
</description>
</task>

## Verification Criteria

### Must Work
- [ ] All 5 tables/modifications exist in database
- [ ] Can create estimate with items via service
- [ ] VAT calculates to 17% correctly
- [ ] Variance calculation formula accurate
- [ ] Permission filtering works (test with different user roles)
- [ ] All unit tests pass
- [ ] Seed data loads successfully

### Quality Checks
- [ ] Test coverage >80% for each service
- [ ] TypeScript compiles with no errors
- [ ] Follow existing code patterns (match budgetService style)
- [ ] Error messages user-friendly
- [ ] Database indexes improve query performance

### Edge Cases Handled
- [ ] Empty estimate (no items) - totals = 0
- [ ] Deleted estimate cascades to items
- [ ] Null values handled gracefully
- [ ] Large numbers don't overflow (up to ₪10,000,000)
- [ ] Special characters in descriptions

## must_haves

**For phase goal: "Create database schema and core services for estimates"**

1. **Database schema complete and functional**
   - All tables created (estimates, estimate_items, bom_files)
   - Alterations applied (tenders, budget_items)
   - Indexes improve query speed
   - Foreign keys enforce data integrity

2. **Services provide full CRUD functionality**
   - estimatesService: create, read, update, delete estimates
   - estimateItemsService: manage line items with calculations
   - bomFilesService: upload/download files
   - varianceService: calculate estimate vs budget difference

3. **Calculations are accurate**
   - VAT always 17% on total_price
   - Totals sum correctly
   - Variance formula: budget - estimate
   - Percentages calculated correctly

4. **Code quality meets standards**
   - >80% test coverage
   - TypeScript types for all entities
   - Follows existing service patterns
   - Error handling throughout

5. **Data can be tested**
   - Seed data creates realistic examples
   - Demo mode works (localStorage fallback)
   - Can manually test via services

## Rollback Plan

If migration fails:
1. Run rollback scripts in reverse order
2. Verify existing Budget/Tender data intact
3. Check no orphaned records
4. Test existing functionality still works

## Success Indicator

**Phase 1 is complete when:**
You can run this test sequence without errors:

```typescript
// Create planning estimate
const estimate = await createEstimate({
  project_id: 'test-project-1',
  estimate_type: 'planning',
  name: 'Architectural Planning Estimate',
  description: 'Initial planning phase costs'
});

// Add items
await createEstimateItem({
  estimate_id: estimate.id,
  description: 'Architectural Design',
  quantity: 1,
  unit_price: 128205.13, // Before VAT
  vat_rate: 17
});
// total_with_vat should be 150,000

// Check totals
const summary = await getEstimateSummary(estimate.id);
assert(summary.total_with_vat === 150000);

// Check variance (if linked to budget)
const variance = await calculateVariance(budgetItemId);
assert(variance.variance_percent === -3.3); // Saved 3.3%
```

All assertions pass = Phase 1 complete.
