---
phase: 01-database-foundation
plan: 03
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/smoke-test-services.cjs
autonomous: true
gap_closure: true

must_haves:
  truths:
    - "Services can be imported without errors"
    - "Services can perform basic CRUD operations"
    - "Application code can access services"
  artifacts:
    - path: "scripts/smoke-test-services.cjs"
      provides: "Service import and functionality smoke test"
      min_lines: 80
  key_links:
    - from: "scripts/smoke-test-services.cjs"
      to: "src/services/estimatesService.ts"
      via: "import statement"
      pattern: "import.*estimatesService"
    - from: "scripts/smoke-test-services.cjs"
      to: "src/services/estimateItemsService.ts"
      via: "import statement"
      pattern: "import.*estimateItemsService"
    - from: "scripts/smoke-test-services.cjs"
      to: "src/services/bomFilesService.ts"
      via: "import statement"
      pattern: "import.*bomFilesService"
    - from: "scripts/smoke-test-services.cjs"
      to: "src/services/varianceService.ts"
      via: "import statement"
      pattern: "import.*varianceService"
---

<objective>
Prove services are accessible and functional by creating smoke test that imports and exercises them.

Purpose: Close verification gap by demonstrating services can be imported and used by application code.
Output: Smoke test script that imports all 4 services and verifies basic CRUD operations work.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/estimate-integration/ROADMAP.md
@.planning/STATE.md
@.planning/estimate-integration/phases/01-database-foundation/01-SUMMARY.md
@src/services/estimatesService.ts
@src/services/estimateItemsService.ts
@src/services/bomFilesService.ts
@src/services/varianceService.ts
</context>

<tasks>

<task type="auto">
  <name>Create service smoke test script</name>
  <files>scripts/smoke-test-services.cjs</files>
  <action>
Create Node.js script that imports and exercises all 4 estimate services.

**Import all services:**
```javascript
const { getAllEstimates, getEstimate, createEstimate, updateEstimate, deleteEstimate } = require('../src/services/estimatesService');
const { getEstimateItems, createEstimateItem, updateEstimateItem, deleteEstimateItem, calculateItemTotals } = require('../src/services/estimateItemsService');
const { getBOMFilesByTender, getBOMFile } = require('../src/services/bomFilesService');
const { calculateVariance, calculateProjectVariance } = require('../src/services/varianceService');
```

**Test sequence:**
1. **Import verification**: Confirm all imports succeed without circular dependency errors
2. **estimatesService smoke test**:
   - Call getAllEstimates() and verify it returns array
   - Find a [SEED] estimate from seed data
   - Call getEstimate(id) and verify it returns estimate object with expected properties
3. **estimateItemsService smoke test**:
   - Call getEstimateItems(estimateId) using seed estimate
   - Verify returns array of items
   - Call calculateItemTotals() with sample item data and verify VAT calculation (17%)
4. **bomFilesService smoke test**:
   - Call getBOMFilesByTender(tenderId) with any tender ID (may return empty array)
   - Verify function executes without error
5. **varianceService smoke test**:
   - Create test variance data: { estimate_amount: 100000, budget_amount: 95000 }
   - Call calculateVariance() and verify returns object with variance_amount = -5000 (saved)
   - Verify variance_percent = -5%

**Output format:**
Print test progress with step-by-step results:
```
Testing service imports...
✓ estimatesService imported successfully
✓ estimateItemsService imported successfully
✓ bomFilesService imported successfully
✓ varianceService imported successfully

Testing estimatesService...
✓ getAllEstimates() returned 4 estimates
✓ getEstimate() returned estimate with correct structure

Testing estimateItemsService...
✓ getEstimateItems() returned 13 items
✓ calculateItemTotals() VAT calculation correct (17%)

Testing bomFilesService...
✓ getBOMFilesByTender() executed without error

Testing varianceService...
✓ calculateVariance() returned correct variance_amount (-5000)
✓ variance_percent calculated correctly (-5%)

All smoke tests passed! Services are accessible and functional.
```

**Error handling:**
- Catch and display import errors clearly
- Catch and display runtime errors with context
- Exit with code 0 on success, code 1 on any failure

**Use CommonJS require() not ES6 imports** (Node.js script, not transpiled).
Read DATABASE_URL from .env file manually if needed for database calls.
  </action>
  <verify>node scripts/smoke-test-services.cjs - exits with code 0 showing all services tested successfully</verify>
  <done>All 4 services successfully imported and exercised with basic operations working correctly</done>
</task>

</tasks>

<verification>
**Gap closure criteria:**
- [ ] Script imports all 4 services without circular dependency errors
- [ ] estimatesService CRUD functions callable
- [ ] estimateItemsService VAT calculations work
- [ ] bomFilesService functions callable
- [ ] varianceService calculations accurate
- [ ] Script output shows each service tested
- [ ] Exit code 0 indicates all tests passed

**How to verify gap is closed:**
Run `node scripts/smoke-test-services.cjs` and confirm all services show ✓ green checkmarks with "All smoke tests passed!" message.
</verification>

<success_criteria>
**This plan succeeds when:**
1. Smoke test imports all services successfully
2. Each service's primary functions are called without errors
3. VAT calculation verified (17% applied correctly)
4. Variance calculation verified (budget - estimate formula)
5. Script proves services are accessible from application code
6. No circular dependency errors or import failures

**Measurable outcome:**
`node scripts/smoke-test-services.cjs` exits with code 0 and displays test results showing services are importable and functional.

**Gap addressed:**
This closes the "Services provide full CRUD functionality that can be used" gap by proving:
- Services can be imported (evidence of accessibility)
- Services can execute operations (evidence of functionality)
- Services follow expected patterns (VAT at 17%, variance formula correct)
</success_criteria>

<output>
After completion, create `.planning/estimate-integration/phases/01-database-foundation/01-03-SUMMARY.md`
</output>
