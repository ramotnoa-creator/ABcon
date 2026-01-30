# ✅ Migration 006 Complete - Project Items Structure

## 🎯 What Was Created

### New Tables (4)

1. **`project_items`** - Core work packages
   - Stores item identity, status, costs, links
   - Supports hierarchy (parent/child for bulk purchases)
   - Optimistic locking (version field)
   - Soft delete support
   - Full audit trail

2. **`project_item_estimates`** - Versioned estimates
   - Tracks all estimate revisions
   - One current estimate per item
   - Generated column for total_with_vat
   - Stores breakdown as JSONB

3. **`project_item_status_history`** - Audit trail
   - Logs every status change
   - Tracks who, when, why
   - Links to related tenders/change orders

4. **`project_item_change_orders`** - Contract amendments
   - Full approval workflow
   - Financial impact tracking
   - Supporting documents as JSONB

### Updated Tables (3)

1. **`tenders`**
   - Added: project_item_id, attempt_number, previous_tender_id
   - Supports retry tracking
   - Soft delete support

2. **`tender_participants`**
   - Added: quote tracking fields
   - Late quote handling
   - Quote withdrawal support

3. **`budget_items`**
   - Added: project_item_id, change order fields
   - Original + current contract amounts
   - Change order sum tracking

### Triggers (4)

1. **`update_project_items_updated_at`** - Auto-update timestamp
2. **`log_project_item_status_changes`** - Auto-log status changes
3. **`increment_project_item_version`** - Optimistic locking
4. **`prevent_project_item_hard_delete`** - Prevent orphaned data

### Views (3)

1. **`vw_project_items_with_current_estimate`** - Items + current estimate
2. **`vw_project_item_lifecycle`** - Complete lifecycle with variance
3. **`vw_item_change_order_summary`** - Change order aggregates

### Functions (5)

1. **`update_updated_at_column()`** - Update timestamp trigger
2. **`log_status_change()`** - Status change logging
3. **`increment_version()`** - Version increment
4. **`prevent_delete_if_referenced()`** - Delete protection
5. **`get_item_full_history(item_id)`** - Complete event history

## 📊 Indexes Created

### project_items
- `idx_project_items_project_id` (filtered by deleted_at)
- `idx_project_items_status` (filtered)
- `idx_project_items_type` (filtered)
- `idx_project_items_parent` (partial - where parent exists)
- `idx_project_items_deleted` (partial)
- `idx_project_items_metadata` (GIN index for JSONB)

### project_item_estimates
- `idx_estimates_item_id`
- `idx_estimates_current` (partial - where is_current)
- `idx_one_current_per_item` (unique partial)

### project_item_status_history
- `idx_status_history_item_id`
- `idx_status_history_changed_at` (DESC)

### project_item_change_orders
- `idx_change_orders_item_id`
- `idx_change_orders_status`

### tenders
- `idx_tenders_project_item` (filtered)
- `idx_tenders_attempt`

### budget_items
- `idx_budget_items_project_item`

## 🔐 Edge Cases Handled

✅ **Optimistic locking** - Prevents concurrent edit conflicts
✅ **Soft deletes** - Never lose data, always recoverable
✅ **Audit trail** - Every change logged with who/when/why
✅ **Version tracking** - Track estimate revisions over time
✅ **Change orders** - Contract amendments after award
✅ **Tender retries** - Failed tenders can be retried
✅ **Late quotes** - Track and optionally accept late quotes
✅ **Quote withdrawal** - Handle contractor quote withdrawals
✅ **Delete protection** - Cannot hard delete referenced items
✅ **Circular references** - Prevented with check constraint
✅ **Status transitions** - Full history with context
✅ **Bulk purchases** - Parent/child item relationships

## 📈 Performance Optimizations

- **Generated columns** - `total_with_vat` computed automatically
- **Partial indexes** - Only index active records (deleted_at IS NULL)
- **GIN indexes** - Fast JSONB queries on metadata
- **Filtered indexes** - Smaller, faster indexes with WHERE clauses
- **Unique partial indexes** - Efficient uniqueness checks

## 🚀 Next Steps

### 1. Create Service Layer
- [ ] `projectItemsService.ts` - CRUD for items
- [ ] `projectItemEstimatesService.ts` - Estimate versioning
- [ ] `projectItemStatusService.ts` - Status management
- [ ] `projectItemChangeOrdersService.ts` - Change order workflow

### 2. Create Components
- [ ] `AddProjectItemForm.tsx` - Create/edit items
- [ ] `ProjectItemsList.tsx` - List with filters
- [ ] `ProjectItemDetail.tsx` - Detail view with lifecycle
- [ ] `EstimateVersionHistory.tsx` - Show estimate revisions
- [ ] `ChangeOrderForm.tsx` - Create change orders

### 3. Update Existing Components
- [ ] `PlanningEstimateSubTab.tsx` → Use new structure
- [ ] `ExecutionEstimateSubTab.tsx` → Use new structure
- [ ] `TendersSubTab.tsx` → Link to project_items
- [ ] `BudgetTabContent.tsx` → Show project_item links

### 4. Data Migration
- [ ] Migrate existing `estimate_items` → `project_items`
- [ ] Create initial estimates for each item
- [ ] Link existing tenders to project_items
- [ ] Link existing budget_items to project_items
- [ ] Archive old tables

## 📝 Usage Examples

### Create Item with Estimate
```typescript
// 1. Create project item
const item = await createProjectItem({
  project_id: projectId,
  name: "Aluminum Windows",
  type: "execution",
  category: "windows",
  created_by: "user@example.com"
});

// 2. Create initial estimate
await createEstimate(item.id, {
  estimated_cost: 60000,
  vat_rate: 17,
  notes: "Initial cost estimate",
  created_by: "user@example.com"
});
```

### Get Item Full History
```sql
SELECT * FROM get_item_full_history('item-uuid');
-- Returns all events: creation, estimates, status changes, change orders
```

### View Lifecycle with Variance
```sql
SELECT * FROM vw_project_item_lifecycle
WHERE project_id = 'project-uuid';
-- Shows estimate, tender, contract, variance
```

## ⚠️ Important Notes

1. **Soft Delete Only** - Always set `deleted_at`, never hard delete
2. **Status Changes** - Automatically logged via trigger
3. **Version Increment** - Automatically handled on update
4. **Current Estimate** - Only one per item (enforced by constraint)
5. **Change Orders** - Must sum correctly (constraint enforced)
6. **Delete Protection** - Cannot delete if referenced by tenders/budget

## 🎓 Learning Resources

- **Optimistic Locking**: Prevents lost updates in concurrent edits
- **JSONB**: Flexible schema-less data storage in PostgreSQL
- **Generated Columns**: Auto-calculated, always consistent
- **Partial Indexes**: Smaller, faster indexes with WHERE filters
- **Soft Deletes**: Preserve data integrity and audit trail

---

**Migration File**: `migrations/006-complete-project-items-structure.sql`
**Status**: ✅ Complete
**Tables Created**: 4 new, 3 updated
**Indexes Created**: 15+
**Triggers**: 4
**Views**: 3
**Functions**: 5
