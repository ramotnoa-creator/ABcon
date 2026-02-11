# Feature Flows - ANcon

## Flow 1: Create Estimate

**Trigger:** PM clicks "Create New Estimate" for a project

**Steps:**
1. PM selects project
2. PM adds line items (description, quantity, unit price)
3. System calculates totals
4. PM reviews and saves estimate
5. PM can lock estimate (prevents further edits)
6. PM can export to PDF/Excel

**Edge Cases:**
- Locked estimate cannot be edited (must unlock first)
- Estimate linked to tender shows comparison data

---

## Flow 2: Tender Process

**Trigger:** PM creates a tender for project work

**Steps:**
1. PM creates tender linked to an estimate
2. PM adds participants (contractors from professional network)
3. Participants submit bids
4. PM compares bids against estimate
5. PM selects winner
6. System creates budget items from winning bid

**Edge Cases:**
- No participants → tender stays in draft
- Winner selection triggers budget auto-creation (in progress)

---

## Flow 3: Budget Variance Tracking

**Trigger:** Automatic when cost items are added

**Steps:**
1. Budget items exist (from tender winners or manual entry)
2. Cost items are recorded against budget items
3. System calculates variance (budget vs actual)
4. Triggers update variance views (migration 006)
5. Dashboard shows budget health

**Edge Cases:**
- No budget items → no variance tracking
- Over-budget triggers visual warning

---

## Flow 4: Payment Schedule

**Trigger:** PM creates payment milestones for a project

**Steps:**
1. PM creates payment schedule linked to project
2. PM adds payment milestones with dates and amounts
3. Accountant/Entrepreneur approves payments
4. System tracks paid vs pending

**Schema:** See `migrations/009-create-payment-schedules.sql`
