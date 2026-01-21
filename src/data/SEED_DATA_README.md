# Seed Data Documentation

## Overview

This comprehensive test data set includes **realistic edge cases** and **production-like scenarios** to thoroughly test the application.

## Quick Start

### Option 1: Use Dev Tools Panel (Recommended)
1. Run the app in development mode: `npm run dev`
2. Click the purple 🔧 button in the bottom-right corner
3. Click "Load Test Data"
4. Page will reload with complete test data

### Option 2: Browser Console
```javascript
// Load seed data
import { seedDatabase } from './src/data/seedData';
await seedDatabase('localStorage');

// Clear all data
import { clearDatabase } from './src/data/seedData';
await clearDatabase('localStorage');
```

## Data Summary

| Entity | Count | Notes |
|--------|-------|-------|
| **Projects** | 5 | Various lifecycle stages |
| **Professionals** | 7 | Including inactive |
| **Budget Items** | 14 | $5.2M total |
| **Payments** | 13 | Various statuses |
| **Milestones** | 4 | Completed & overdue |
| **Files** | 3 | Including orphaned |
| **Issues** | 3 | Open & resolved |
| **Tenders** | 2 | Open & closed |
| **Tasks** | 3 | Including overdue |

**Total Records:** ~95

## Edge Cases Included

### 🔴 Critical Edge Cases

#### Projects
- ✅ **Overdue Project** (proj-4): Permit expired 40 days ago, still "in execution"
- ✅ **Empty Project** (proj-5): No data attached (units, budget, etc.)
- ✅ **Missing Optional Fields**: Projects without permit dates

#### Budget
- ✅ **Budget Overrun**: 15% over budget (proj-4)
- ✅ **Zero Quantity Item**: Canceled item with 0 quantity
- ✅ **Very Large Amount**: 2.8M NIS single item (robotic parking)
- ✅ **Overdue Payment**: Completed item, not paid, 10 days overdue
- ✅ **No Contract**: Budget chapter without contract_amount

#### Professionals
- ✅ **Inactive Professional**: prof-6 (not active for 400 days)
- ✅ **Missing Fields**: prof-7 has no email, address, or license
- ✅ **Professional with No Projects**: prof-7 not assigned anywhere

#### Payments
- ✅ **Approved Without Payment Date**: Payment approved but date is null
- ✅ **Very Old Invoice**: 200 days old
- ✅ **Multiple Partial Payments**: 4 payments for single budget item
- ✅ **Future Payment Date**: Scheduled payments 60 days out

#### Milestones & Tasks
- ✅ **Overdue Milestone**: ms-1-4 past due 30 days, status still pending
- ✅ **Overdue Task**: task-gen-3 overdue by 20 days
- ✅ **Early Completion**: Future dated milestone already completed

#### Files
- ✅ **Orphaned File**: file-3 has no related_entity linkage
- ✅ **Very Large File**: 15 MB DWG file
- ✅ **Missing Uploaded By**: Some files have null uploaded_by

#### Special Issues
- ✅ **Very Old Open Issue**: issue-3 open for 120 days (critical priority)
- ✅ **Resolved Without Resolution Text**: Some resolved issues missing details

### 🟡 Realistic Scenarios

#### Budget Flow
- Architecture: Fully paid (100%)
- Engineering: Over budget, not started payment (0%)
- Main Contractor: Multiple items at different stages (25%, 50%, 100%)
- Electrical: Contracted, awaiting start (0%)
- Plumbing: Still in tender stage

#### Project Stages
1. **proj-1** (Hertzel 25): Active construction, 60% complete
2. **proj-2** (Villa Ramat Aviv): Planning stage, 10% complete
3. **proj-3** (Office Renovation): Tender stage, 0% complete
4. **proj-4** (Overdue Building): Behind schedule, budget issues
5. **proj-5** (New Empty Project): Just started, no data

#### Payment Patterns
- Single full payment (completed items)
- Partial payments (in-progress items)
- Scheduled future payments (planned work)
- Overdue payments (completed but not paid)

## Data Relationships

### Project 1 (Main Test Project)
```
בניין מגורים רחוב הרצל 25
├── Budget: 5M planned, 5.2M actual (4% over)
├── Professionals: 3 assigned (architect, engineer, contractor)
├── Units: 4 (2 apartment floors + parking + roof)
│   └── Milestones: 3 (2 completed, 1 in progress)
│       └── Gantt Tasks: 2 (floor & wall work)
├── Budget Items: 12 items across 6 chapters
│   └── Payments: 11 payments (various statuses)
├── Tenders: 2 (1 open, 1 winner selected)
├── Files: 2 (permit + architectural plans)
├── Issues: 2 (1 open, 1 resolved)
├── Planning Changes: 2 (1 approved, 1 pending)
└── Tasks: 2 (1 done, 1 in progress)
```

### Project 4 (Problem Project)
```
בניין מגורים - עיר ימים [איחור]
├── Budget: 3M planned, 3.45M actual (15% over!)
├── Status: Overdue by 40 days
├── Milestone: 1 overdue (30 days past due)
├── Task: 1 overdue (20 days past due)
├── Issue: 1 critical open for 120 days
└── Professionals: 2 (including inactive professional)
```

## Using This Data for Testing

### Functional Tests
```typescript
// Test overdue detection
const overdueProjects = projects.filter(p =>
  new Date(p.permit_target_date) < new Date() && p.status !== 'ארכיון'
);
// Expected: proj-4

// Test budget status calculation
const atRiskBudgets = budgets.filter(b =>
  b.variance > 10 || b.status === 'At Risk'
);
// Expected: proj-4 budget

// Test payment overdue detection
const overduePayments = budgetItems.filter(item =>
  item.status === 'completed' &&
  item.paid_amount < item.total_with_vat &&
  item.expected_payment_date < today
);
// Expected: item-1-12
```

### Edge Case Tests
```typescript
// Zero quantity items should have zero totals
const zeroQtyItems = budgetItems.filter(i => i.quantity === 0);
zeroQtyItems.forEach(item => {
  assert(item.total_price === 0);
  assert(item.vat_amount === 0);
  assert(item.total_with_vat === 0);
});

// Inactive professionals should show warning
const inactiveProfessionals = professionals.filter(p => !p.is_active);
// Expected: prof-6

// Orphaned files should be flagged
const orphanedFiles = files.filter(f => !f.related_entity_id);
// Expected: file-3
```

### Performance Tests
```typescript
// Load all budget items for project 1 (12 items)
const items = await getBudgetItems('proj-1');

// Calculate total budget (should handle decimals correctly)
const total = items.reduce((sum, item) => sum + item.total_with_vat, 0);
// Expected: ~5,200,000 NIS

// Load all payments for multiple items (11 payments)
const payments = await getAllBudgetPayments();
```

## Extending Seed Data

### Add More Projects
```typescript
export const seedProjects = [
  ...seedProjects,
  {
    id: 'proj-6',
    project_name: 'Your New Project',
    client_name: 'Client Name',
    status: 'תכנון',
    created_at: daysAgo(1),
    updated_at_text: 'היום',
  },
];
```

### Add More Professionals
```typescript
export const seedProfessionals = [
  ...seedProfessionals,
  {
    id: 'prof-8',
    professional_name: 'New Professional',
    field: 'contractor',
    is_active: true,
    created_at: daysAgo(1),
    updated_at: daysAgo(1),
  },
];
```

## Resetting Data

### During Development
```javascript
// In browser console:
localStorage.clear();
// Or use Dev Tools panel: Click "Clear All Data"
// Then reload: window.location.reload();
```

### For Testing
```javascript
// Before each test suite:
beforeEach(async () => {
  await clearDatabase('localStorage');
  await seedDatabase('localStorage');
});
```

## Future: Neon DB Seeding

TODO: Implement Neon DB seeding in `seedDatabase()` function:

```typescript
if (target === 'neon') {
  // Import all services
  import { createProject } from '../services/projectsService';
  // ... etc

  // Create all records using services
  for (const project of seedProjects) {
    await createProject(project);
  }
  // Continue for all entities...
}
```

## Known Limitations

1. **User References**: Most records don't have `created_by` or user IDs (can be added when auth is ready)
2. **Image URLs**: File URLs are placeholder examples.com links
3. **Tender Candidates**: `candidate_professional_ids` arrays are minimal
4. **Gantt Dependencies**: Only basic predecessors included

## Questions?

See `TESTING_SECURITY_PLAN.md` for comprehensive testing strategy.
