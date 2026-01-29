# Estimate Integration Plan - AN Projects
**Based on meeting with Niv, January 2026**

## Executive Summary

The meeting identified a need to create a comprehensive **Estimate (אומדן)** module that bridges between project planning and budget execution. Currently, ABcon has well-developed Budget and Tender systems, but lacks a standalone estimation module.

**Key Changes Required:**
1. Create new Estimate module with Planning and Execution tabs
2. Implement BOM (Bill of Materials / בל"מ) file management system
3. Establish workflow: Estimate → Tender → Winner → Budget
4. Auto-update Budget and Estimate when tender winner is selected
5. Track variance between Estimate and actual Budget

**Implementation Decisions (Confirmed):**
- **Currency**: ILS (₪) only with 17% VAT
- **Email System**: UI/structure in MVP, actual email sending in Phase 2
- **Permissions**: Same as existing (Manager/Entrepreneur see own, Accountancy/Super Manager see all)
- **Historical Data**: No automatic migration - manual handling as needed
- **Variance Alerts**: Display numbers with color coding only, no automatic threshold alerts
- **Versioning**: Estimates update in place (no version history tracking)

---

## Current State Analysis

### ✅ What We Have
- **Budget System**: Fully implemented with Categories → Chapters → Items hierarchy
- **Tender System**: Functional with participants, quotes, winner selection
- **Budget-Tender Link**: Items can reference tenders via `tender_id`
- **Payment Tracking**: Comprehensive payment/invoice system
- **Basic Estimation**: Only `estimated_budget` field on tenders (not sufficient)

### ❌ What's Missing
- **Standalone Estimate Module**: No dedicated estimate page/functionality
- **Planning vs Execution Split**: No separation of design vs construction estimates
- **BOM System**: No file upload/management for Bills of Materials
- **Email Integration**: No email sending system (will be Phase 2)
- **Estimate-Budget Variance**: No dedicated variance tracking dashboard
- **Estimate Line Items**: No detailed estimate breakdown before tendering

---

## System Architecture: New Workflow

```
┌─────────────────┐
│ Estimate Module │
│  Planning Tab   │ ← Designers/Architects estimate costs up to permit
│  Execution Tab  │ ← Construction/execution estimates
└────────┬────────┘
         │
         │ Export to Tender
         ↓
┌─────────────────┐
│  Tender Module  │
│  + Add BOM      │ ← Upload Word doc with detailed requirements
│  + Participants │ ← Add professionals, collect quotes (email in Phase 2)
│  + Winner       │ ← Select best quote
└────────┬────────┘
         │
         │ Winner Selected
         ↓
┌─────────────────┐
│  Budget Module  │ ← Auto-create/update budget items
│  Track Payments │ ← Monitor actual spending vs estimate
│  Variance Report│ ← Show estimate vs budget differences
└─────────────────┘
```

---

## Phase 1: Database Schema Changes

### New Tables to Create

#### 1. `estimates` Table
```sql
CREATE TABLE estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  estimate_type VARCHAR(20) NOT NULL, -- 'planning' or 'execution'
  name VARCHAR(200) NOT NULL,
  description TEXT,
  total_amount DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft', -- draft, active, exported_to_tender
  created_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_estimates_project ON estimates(project_id);
CREATE INDEX idx_estimates_type ON estimates(estimate_type);
```

**Note:** No approval fields needed - users can create and export freely

#### 2. `estimate_items` Table
```sql
CREATE TABLE estimate_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  code VARCHAR(50),
  description TEXT NOT NULL,
  category VARCHAR(100), -- Consultants, Suppliers, Contractors
  subcategory VARCHAR(100), -- Architecture, Electrical, etc.
  unit VARCHAR(50), -- sqm, unit, hours
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
```

#### 3. `bom_files` Table (Bill of Materials)
```sql
CREATE TABLE bom_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bom_tender ON bom_files(tender_id);
```

**Note on Email Tracking:**
Email addresses are stored in the `professionals` table and accessed via `tender_participants`. No separate email tracking table needed for MVP. Email history/logging may be added in Phase 2 if required for audit purposes.

### Modify Existing Tables

#### Update `tenders` table
```sql
ALTER TABLE tenders
ADD COLUMN estimate_id UUID REFERENCES estimates(id),
ADD COLUMN bom_file_id UUID REFERENCES bom_files(id),
ADD COLUMN bom_sent_at TIMESTAMP;

CREATE INDEX idx_tenders_estimate ON tenders(estimate_id);
```

#### Update `budget_items` table
```sql
ALTER TABLE budget_items
ADD COLUMN estimate_item_id UUID REFERENCES estimate_items(id),
ADD COLUMN estimate_amount DECIMAL(15,2),
ADD COLUMN variance_amount DECIMAL(15,2), -- budget vs estimate difference
ADD COLUMN variance_percent DECIMAL(5,2);

CREATE INDEX idx_budget_items_estimate ON budget_items(estimate_item_id);
```

---

## Phase 2: Backend Services

### New Services to Create

#### 1. `estimatesService.ts`
```typescript
// Core estimate operations
- getEstimates(projectId, type?: 'planning' | 'execution')
- getEstimate(estimateId)
- createEstimate(data)
- updateEstimate(estimateId, data)
- deleteEstimate(estimateId)
- approveEstimate(estimateId, userId)
- getEstimateSummary(estimateId) // Total amounts, item counts
- exportToTender(estimateId) // Create tender from estimate
```

#### 2. `estimateItemsService.ts`
```typescript
// Estimate line items
- getEstimateItems(estimateId)
- createEstimateItem(data)
- updateEstimateItem(itemId, data)
- deleteEstimateItem(itemId)
- bulkCreateEstimateItems(estimateId, items[])
- reorderEstimateItems(estimateId, orderMap)
- calculateItemTotals(item) // Price + VAT calculations
```

#### 3. `bomFilesService.ts`
```typescript
// BOM file management
- uploadBOMFile(tenderId, file)
- getBOMFile(bomFileId)
- getBOMFilesByTender(tenderId)
- deleteBOMFile(bomFileId)
- downloadBOMFile(bomFileId)
```

**Note on Email Service:**
Email functionality deferred to Phase 2. When implemented, emails will be sent directly using professional email addresses from the `professionals` table (joined via `tender_participants`). No separate email tracking service needed for MVP.

#### 5. `varianceService.ts`
```typescript
// Estimate vs Budget variance tracking
- calculateVariance(projectId)
- getVarianceReport(projectId) // Detailed breakdown by category
- getGlobalVarianceReport() // All projects
- updateBudgetItemVariance(budgetItemId) // Recalc when budget changes
```

### Services to Modify

#### Update `tendersService.ts`
```typescript
// Add new functions:
- linkEstimateToTender(tenderId, estimateId)
- attachBOM(tenderId, bomFileId)
- getEstimateForTender(tenderId)
```

#### Update `tenderParticipantsService.ts`
```typescript
// Modify setTenderWinner():
- Auto-update linked budget items with contract amount
- Auto-update linked estimate with actual contracted value
- Calculate and store variance
- Trigger variance recalculation
```

#### Update `budgetItemsService.ts`
```typescript
// Add new functions:
- createBudgetItemFromTender(tenderId, estimateItemId)
- linkEstimateTobudgetItem(budgetItemId, estimateItemId)
- updateVarianceOnBudgetChange(budgetItemId)
```

---

## Phase 3: Frontend - Pages & Components

### Architecture Decision: Combined Cost Control Page

**Decision:** Combine Budget, Estimates, and Tenders into one unified page: **בקרת עלויות** (Cost Control) with 3 tabs

**Rationale:**
- Budget, Estimates, and Tenders are part of one workflow (Estimate → Tender → Budget)
- Better UX: less navigation, contextual information visible
- Simplified menu structure (1 item instead of 3)
- Matches natural mental model
- Emphasizes control/monitoring aspect
- Variance tracking integrated into Budget tab (no separate tab needed)

**Navigation Structure:**

**Before (2 separate menu items + future 3rd):**
- תקציב (Budget)
- מכרזים (Tenders)
- אומדן (Estimates) ← Would have been added

**After (1 unified menu item):**
- 📊 בקרת עלויות (Cost Control) - 3 tabs

---

### New Pages to Create

#### 1. `CostControlPage.tsx` (src/pages/CostControl/)
**Hebrew Name:** בקרת עלויות
**English Name:** Cost Control
**Purpose:** Unified global view of all financial data across projects

**URL Structure:**
- `/cost-control` (default: estimates tab)
- `/cost-control?tab=estimates`
- `/cost-control?tab=tenders`
- `/cost-control?tab=budget`

**Page Layout:**
```
┌──────────────────────────────────────────────────────────┐
│  בקרת עלויות | Cost Control          [+ חדש] [ייצוא]     │
├──────────────────────────────────────────────────────────┤
│  📋 [אומדן] 📄 [מכרזים] 💰 [תקציב]                      │
│  [Estimates] [Tenders] [Budget]                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  [Content based on active tab - lazy loaded]            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Tab 1: Estimates (אומדן)**
- KPI cards:
  - Total estimates count
  - Planning vs Execution split
  - Total estimated value
  - Active vs Draft status
- Filters: Project, Type (planning/execution), Status, Date range
- Table columns: Project | Name | Type | Total Amount | Status | Created Date | Actions
- Search functionality
- Export to Excel
- Click row → open estimate detail modal OR navigate to project Financial tab
- "+ New Estimate" button

**Tab 2: Tenders (מכרזים)**
- KPI cards:
  - Total tenders
  - Open tenders
  - Winners selected
  - Total contracted value
  - Total savings (estimate vs contract)
- Filters: Project, Status, Type, Date range
- Expandable tender cards with:
  - Tender details
  - Participant list with quotes
  - Price statistics (min/max/avg)
  - BOM download link
  - Source estimate link (if applicable)
  - Winner selection
- Export to CSV/Excel
- "+ New Tender" button

**Tab 3: Budget (תקציב)**
- KPI cards:
  - Total planned budget
  - Actual spending
  - Remaining balance
  - Over-budget projects count
  - Payment timeline (last paid, next planned)
- Filters:
  - Project, Category, Status, Date range
  - **"Show items with variance only"** ← Quick filter for items with estimates
- Table columns:
  - Project | Category | Chapter | **Estimate** | Budget | Paid | **Variance ₪** | **Variance %** | Status
  - **Enhanced columns:** Estimate Amount, Variance Amount, Variance Percentage
- **Variance Display:**
  - Color coding: 🟢 Green (under budget), 🔴 Red (over budget), ⚪ Gray (no estimate)
  - Calculated automatically when budget item linked to estimate
  - Example: Estimated ₪120,000 vs Budgeted ₪115,000 = -₪5,000 (-4.2%) 🟢
- Payment tracking indicators
- Tender linkage display
- Link to source estimate item (click to view)
- Export to Excel (includes variance data)
- "+ New Budget Item" button

**Shared Features (all 3 tabs):**
- Unified filters panel (collapsible)
- Consistent action buttons
- Permission-based data filtering (Manager/Entrepreneur see own, Accountancy/Super Manager see all)
- Export functionality per tab
- Global search
- Lazy loading per tab (performance optimization)
- Responsive design (mobile/tablet/desktop)
- Breadcrumb navigation

**Implementation:**
```typescript
// src/pages/CostControl/CostControlPage.tsx
const CostControlPage = () => {
  const [activeTab, setActiveTab] = useState('estimates');

  return (
    <div>
      <PageHeader
        title="בקרת עלויות"
        subtitle="Cost Control"
        actions={[
          <ExportButton />,
          <NewItemButton />
        ]}
      />

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tab label="אומדן" value="estimates" icon={<AssessmentIcon />} />
        <Tab label="מכרזים" value="tenders" icon={<DescriptionIcon />} />
        <Tab label="תקציב" value="budget" icon={<AccountBalanceIcon />} />
      </Tabs>

      <TabContent>
        {activeTab === 'estimates' && <EstimatesTabContent />}
        {activeTab === 'tenders' && <TendersTabContent />}
        {activeTab === 'budget' && <BudgetTabContent />} {/* Includes variance columns */}
      </TabContent>
    </div>
  );
};
```

---

#### 2. `FinancialTab.tsx` (src/pages/Projects/tabs/)
**Hebrew Name:** ניהול פיננסי
**English Name:** Financial Management
**Purpose:** Unified project-specific financial management

**URL Structure:**
- `/projects/123?tab=financial` (default: planning estimate)
- `/projects/123?tab=financial&subtab=planning-estimate`
- `/projects/123?tab=financial&subtab=execution-estimate`
- `/projects/123?tab=financial&subtab=tenders`
- `/projects/123?tab=financial&subtab=budget`
- `/projects/123?tab=financial&subtab=payments`

**Tab Layout:**
```
┌──────────────────────────────────────────────────────────┐
│  ניהול פיננסי | Financial Management                      │
├──────────────────────────────────────────────────────────┤
│  [אומדן תכנון] [אומדן ביצוע] [מכרזים] [תקציב] [תשלומים] │
│  [Planning]   [Execution]   [Tenders] [Budget] [Payments]│
├──────────────────────────────────────────────────────────┤
│                                                          │
│  [Content based on active sub-tab]                      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Sub-tab 1: Planning Estimate (אומדן תכנון)**
- Summary cards: Total ₪ | Items Count | Status | Last Updated
- Estimate items table:
  - Columns: Code | Description | Category | Qty | Unit Price | Total (with VAT)
  - Sortable, filterable
  - Inline editing
  - Row actions: Edit, Delete, Duplicate
- Action buttons:
  - "+ Add Item"
  - "Export to Tender" (creates new tender with estimate data)
  - "Export to Excel"
  - "Print"
- Status workflow indicator
- No approval needed - can export anytime

**Sub-tab 2: Execution Estimate (אומדן ביצוע)**
- Same structure as Planning Estimate
- Different estimate_type flag in database
- Separate totals calculation

**Sub-tab 3: Tenders (מכרזים)**
- Tender list for this project
- Create new tender:
  - Manual creation
  - OR link to existing estimate (pre-fills data)
- For each tender:
  - BOM upload/download section
  - Participant management (add professionals)
  - Quote tracking
  - Price statistics
  - Winner selection → triggers budget update
  - Email UI (disabled, Phase 2 functionality)
  - Source estimate link (if created from estimate)
- Tender status workflow

**Sub-tab 4: Budget (תקציב)**
- Existing BudgetTab functionality
- Enhanced with estimate integration:
  - **"Estimate Amount" column** (shows estimate if item linked)
  - **"Variance ₪" column** (budget - estimate)
  - **"Variance %" column** ((variance / estimate) * 100)
  - **Color coding:** 🟢 Green (under), 🔴 Red (over), ⚪ Gray (no estimate)
  - **Filter: "Show items with variance only"** (quick problem spotting)
  - Link to source estimate item (click to view details)
- Multiple view modes:
  - Tree view (Categories → Chapters → Items)
  - Table view (flat list, with variance columns)
  - Cashflow view (timeline)
- Payment indicators
- Example row:
  ```
  Architecture | Estimate: ₪150K | Budget: ₪145K | Variance: -₪5K (-3.3%) 🟢
  ```

**Sub-tab 5: Payments (תשלומים)**
- Payment list linked to budget items
- Invoice tracking
- Payment status: Pending → Approved → Paid
- Payment timeline
- Milestone linkage
- Export functionality

**Workflow Visualization:**
Display visual indicator showing progression:
```
אומדן תכנון → אומדן ביצוע → מכרז → זוכה → תקציב → תשלום
[Planning]  → [Execution]  → [Tender] → [Winner] → [Budget] → [Payment]
   ✓             ✓             ✓          ✓          📍
```

**Shared Features:**
- Quick navigation between related items
- Context-aware UI (show source estimate when viewing tender)
- Permission-based editing
- Consistent styling with global Cost Control page
- Responsive design

**Implementation:**
```typescript
// src/pages/Projects/tabs/FinancialTab.tsx
const FinancialTab = ({ projectId }) => {
  const [activeSubTab, setActiveSubTab] = useState('planning-estimate');

  return (
    <div>
      <SubTabs value={activeSubTab} onChange={setActiveSubTab}>
        <SubTab label="אומדן תכנון" value="planning-estimate" />
        <SubTab label="אומדן ביצוע" value="execution-estimate" />
        <SubTab label="מכרזים" value="tenders" />
        <SubTab label="תקציב" value="budget" />
        <SubTab label="תשלומים" value="payments" />
      </SubTabs>

      <SubTabContent>
        {activeSubTab === 'planning-estimate' && (
          <EstimateContent projectId={projectId} type="planning" />
        )}
        {activeSubTab === 'execution-estimate' && (
          <EstimateContent projectId={projectId} type="execution" />
        )}
        {activeSubTab === 'tenders' && (
          <TendersContent projectId={projectId} />
        )}
        {activeSubTab === 'budget' && (
          <BudgetContent projectId={projectId} />
        )}
        {activeSubTab === 'payments' && (
          <PaymentsContent projectId={projectId} />
        )}
      </SubTabContent>
    </div>
  );
};
```

### Components to Create

#### 1. `AddEstimateItemForm.tsx` (src/components/Estimates/)
**Props:** `estimateId, onSuccess, onCancel`

**Fields:**
- Code (optional, auto-generate)
- Description (required)
- Category dropdown (Consultants, Suppliers, Contractors)
- Subcategory dropdown (Architecture, Electrical, etc.)
- Unit dropdown (sqm, unit, hours, etc.)
- Quantity (number)
- Unit Price (currency)
- Total Price (auto-calculated)
- VAT Rate (default 17%)
- Total with VAT (auto-calculated)
- Notes (textarea)

#### 2. `EstimateItemsTable.tsx` (src/components/Estimates/)
**Props:** `estimateId, items, onEdit, onDelete`

**Features:**
- Sortable columns
- Inline edit mode
- Delete confirmation
- Drag-to-reorder rows
- Summary row at bottom (totals)

#### 3. `BOMUploader.tsx` (src/components/Tenders/)
**Props:** `tenderId, onUploadSuccess`

**Features:**
- File input (accept .doc, .docx)
- File size validation (max 10MB)
- Upload progress indicator
- Display current BOM if exists
- Replace/delete BOM file

#### 4. `SendBOMEmailModal.tsx` (src/components/Tenders/) - Phase 2
**Props:** `tenderId, participants, onSend`

**Features:**
- Email template editor
  - Subject field (pre-filled)
  - Body textarea (rich text or markdown)
  - Variable placeholders: {professional_name}, {tender_name}, {due_date}
- Participant checklist (select who receives email)
- BOM file preview/link
- "Send to All" button (disabled with tooltip: "Email system coming soon")
- Individual send buttons per participant
- Email history/log placeholder

**MVP Implementation:** Create UI structure with disabled send buttons and placeholder text. Actual email functionality in Phase 2.

#### 5. `VarianceCard.tsx` (src/components/Budget/)
**Props:** `estimated, budgeted, spent`

**Displays:**
- Three-column comparison
- Variance calculation
- Color-coded status
- Percentage indicators

### Pages to Delete/Replace

**Remove these existing separate pages:**
- ❌ `GlobalBudgetPage.tsx` → replaced by CostControlPage Budget tab
- ❌ `GlobalTendersPage.tsx` → replaced by CostControlPage Tenders tab
- ❌ Future `GlobalEstimatesPage.tsx` → replaced by CostControlPage Estimates tab

**Consolidate into:**
- ✅ `CostControlPage.tsx` (one page, four tabs)

### Existing Pages to Modify

#### Update `ProjectDetailPage.tsx`
**Changes:**
- Remove separate tabs: "Tenders", "Budget" (if standalone)
- Add new unified tab: "ניהול פיננסי" (Financial)
- This tab contains all financial sub-tabs

**Before:**
```typescript
const tabs = [
  'Overview',
  'Tasks & Milestones',
  'Budget',
  'Tenders',
  'Planning Changes',
  // ...
];
```

**After:**
```typescript
const tabs = [
  'Overview',
  'Tasks & Milestones',
  'Financial', // ← Combined tab
  'Planning Changes',
  // ...
];
```

#### Navigation Menu Update

**Before:**
```typescript
<NavItem href="/budget" icon="account_balance">
  תקציב
</NavItem>
<NavItem href="/tenders" icon="description">
  מכרזים
</NavItem>
```

**After:**
```typescript
<NavItem href="/cost-control" icon="assessment">
  בקרת עלויות
</NavItem>
```

---

## Phase 4: Integration Logic

### Workflow 1: Create Estimate → Export to Tender

**Steps:**
1. User creates estimate in EstimatesTab (Planning or Execution)
2. Adds multiple estimate items
3. Approves estimate (locks it)
4. Clicks "Export to Tender" button
5. System creates new tender:
   - `tender_name` = estimate name
   - `estimated_budget` = sum of estimate items
   - `estimate_id` = linked to source estimate
   - `status` = 'Draft'
6. User prompted to upload BOM file
7. User adds participants to tender
8. User sends BOM to participants via email

### Workflow 2: Tender Winner → Update Budget & Estimate

**Steps:**
1. User selects tender winner
2. System triggers `setTenderWinner()`:
   - Update tender: `winner_professional_id`, `contract_amount`, `status = 'WinnerSelected'`
   - Auto-create/update budget item:
     - If tender has `estimate_id`, link budget item to estimate item
     - Set `budget_item.tender_id = tender.id`
     - Set `budget_item.total_price = tender.contract_amount`
     - Set `budget_item.estimate_amount = tender.estimated_budget`
     - Calculate `variance_amount = contract_amount - estimate_amount`
     - Calculate `variance_percent = (variance / estimate) * 100`
   - Update estimate item (mark as contracted)
   - Recalculate totals
3. Show success message with variance summary
4. Navigate to Budget tab to view updated item

### Workflow 3: Budget Change → Recalculate Variance

**Trigger:** Any time a budget item is created/updated

**Logic:**
```typescript
async function updateBudgetItemVariance(budgetItemId: string) {
  const item = await getBudgetItem(budgetItemId);

  if (item.estimate_item_id) {
    const estimateItem = await getEstimateItem(item.estimate_item_id);

    item.estimate_amount = estimateItem.total_with_vat;
    item.variance_amount = item.total_with_vat - item.estimate_amount;
    item.variance_percent = (item.variance_amount / item.estimate_amount) * 100;

    await updateBudgetItem(budgetItemId, {
      estimate_amount: item.estimate_amount,
      variance_amount: item.variance_amount,
      variance_percent: item.variance_percent
    });
  }
}
```

### Workflow 4: Send BOM Email (Phase 2 - Future Implementation)

**MVP Workflow (Current):**
1. User uploads BOM file (Word doc)
2. System stores file in storage
3. Creates record in `bom_files` table
4. Links BOM to tender: `tender.bom_file_id = bom.id`
5. User clicks "Send BOM" button
6. Opens SendBOMEmailModal with:
   - List of tender participants with email addresses
   - Pre-filled email template (for reference)
   - BOM file download link
   - "Email system coming in Phase 2" message
7. User manually copies participant emails and sends via their own email client
8. Download BOM file to attach manually

**Phase 2 Implementation (Future):**
- Actual email sending functionality
- Automatic participant email collection
- Template variable replacement
- Email tracking and logging
- Delivery status monitoring

---

## Phase 5: Email Integration (Phase 2 - Future)

**Note:** Email system is planned for Phase 2, after MVP is complete and tested.

### MVP Approach (Current)
- Create database structure (`tender_emails` table)
- Build UI components (SendBOMEmailModal)
- Display participant email addresses
- Provide BOM file download
- Users send emails manually via their own email client
- Show placeholder for email history/tracking

### Phase 2: Email Service Setup (Future Implementation)

**Recommended Options:**
1. **SendGrid** (recommended for production)
   - API-based, reliable
   - 100 emails/day free tier
   - Bounce/delivery tracking

2. **Nodemailer** (for development/testing)
   - SMTP-based
   - Works with Gmail, Outlook, etc.
   - Free but requires email credentials

3. **Resend** (modern alternative)
   - Developer-friendly API
   - Good deliverability
   - Free tier: 3,000 emails/month

### Future Implementation Details
Will be documented when Phase 2 begins. For now, manual email sending is acceptable.

---

## Phase 6: File Storage

### BOM File Storage Options

#### Option 1: Local File System (Simple, Dev/Testing)
```
/public/uploads/bom/
  {tenderId}/
    {bomFileId}.docx
```

**Pros:**
- No external dependencies
- Fast local access
- Free

**Cons:**
- Not scalable
- Lost on server restart (unless persistent volume)
- Security concerns (public folder)

#### Option 2: Neon Blob Storage (Recommended)
```typescript
import { neon } from '@neondatabase/serverless';

async function uploadBOMFile(file: File, tenderId: string) {
  const sql = neon(process.env.DATABASE_URL);

  // Store file as base64 or binary
  await sql`
    INSERT INTO bom_files (tender_id, file_name, file_data, file_size)
    VALUES (${tenderId}, ${file.name}, ${file.buffer}, ${file.size})
  `;
}
```

**Pros:**
- Integrated with existing database
- Secure
- Backed up automatically

**Cons:**
- Database size increases
- Slower for large files

#### Option 3: Cloud Storage (AWS S3, Azure Blob, Google Cloud Storage)
**Best for production with many files**

```typescript
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY
});

async function uploadBOMFile(file: File, tenderId: string) {
  const key = `bom/${tenderId}/${Date.now()}_${file.name}`;

  await s3.upload({
    Bucket: 'anprojects-bom-files',
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype
  }).promise();

  return key; // Store this path in database
}
```

### Recommended Approach
**Start with Option 2 (Neon)**, migrate to Option 3 (Cloud) if file volume grows.

---

## Phase 7: Testing Strategy

### Unit Tests
- [ ] `estimatesService`: CRUD operations
- [ ] `estimateItemsService`: Item management, calculations
- [ ] `varianceService`: Variance calculations
- [ ] `tenderEmailsService`: Email sending logic
- [ ] `bomFilesService`: File upload/download

### Integration Tests
- [ ] Create estimate → Export to tender → Select winner → Update budget
- [ ] Upload BOM → Send email → Track delivery
- [ ] Budget change → Recalculate variance
- [ ] Multiple estimate items → Create tender → Create budget items

### E2E Tests (Playwright)
- [ ] User creates planning estimate with 5 items
- [ ] User exports estimate to tender
- [ ] User uploads BOM file
- [ ] User sends BOM to 3 participants
- [ ] User selects winner
- [ ] System auto-creates budget item
- [ ] Variance dashboard shows correct calculations

### Manual Test Scenarios
1. **Estimate Creation**
   - Create planning estimate with 10 items
   - Verify totals calculate correctly (with VAT)
   - Approve estimate

2. **Export to Tender**
   - Export approved estimate to tender
   - Verify all data transfers correctly
   - Add participants

3. **BOM Management**
   - Upload 2MB Word file
   - Download and verify file integrity
   - Delete and re-upload

4. **Email Sending**
   - Send BOM to 5 participants
   - Check email delivery
   - Verify attachments

5. **Winner Selection**
   - Select winner from 5 quotes
   - Verify budget item auto-created
   - Check variance calculation
   - Verify estimate updated

6. **Variance Tracking**
   - View variance dashboard
   - Filter by category
   - Export to Excel
   - Verify color coding

---

## Phase 8: UI/UX Enhancements

### Design Principles
- **Consistency**: Match existing ABcon design patterns
- **Clarity**: Clear labels, tooltips for complex features
- **Feedback**: Success/error messages for all actions
- **Efficiency**: Minimize clicks, auto-fill where possible

### Color Coding Standards
- **Green**: Under budget, positive variance
- **Red**: Over budget, negative variance
- **Yellow**: Warning, approaching budget limit
- **Blue**: Informational, neutral status
- **Gray**: Inactive, disabled

### Icons to Use (Material Symbols)
- 📊 `assessment` - Estimates, variance reports
- 📄 `description` - BOM files
- ✉️ `email` - Send email
- ✅ `check_circle` - Approved, winner selected
- ⚠️ `warning` - Variance alert
- 📈 `trending_up` - Budget increase
- 📉 `trending_down` - Budget decrease

### Responsive Design
- Mobile: Stack cards vertically, simplified tables
- Tablet: Two-column layout
- Desktop: Full feature set with multiple panels

### Accessibility
- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader friendly
- High contrast mode support

---

## Implementation Timeline

### Sprint 1 (Week 1-2): Foundation
**Goal: Database and basic services**
- [ ] Create database tables (estimates, estimate_items, bom_files, tender_emails)
- [ ] Implement `estimatesService.ts`
- [ ] Implement `estimateItemsService.ts`
- [ ] Write unit tests for services
- [ ] Set up demo data for testing

### Sprint 2 (Week 3-4): Cost Control Page Structure
**Goal: Build unified Cost Control page with 3-tab navigation**
- [ ] Create `CostControlPage.tsx` with 3-tab structure
- [ ] Migrate existing GlobalBudgetPage content to Budget tab
- [ ] Migrate existing GlobalTendersPage content to Tenders tab
- [ ] Create Estimates tab content (basic list view)
- [ ] Add variance columns to Budget tab (Estimate, Variance ₪, Variance %)
- [ ] Add "Show items with variance only" filter to Budget tab
- [ ] Implement lazy loading per tab
- [ ] Update navigation menu (remove separate items, add בקרת עלויות)
- [ ] Write E2E tests for tab navigation

### Sprint 3 (Week 5-6): Estimates & Project Financial Tab
**Goal: Build estimate functionality and unified project financial tab**
- [ ] Create `FinancialTab.tsx` for project detail page
- [ ] Implement Planning Estimate sub-tab
- [ ] Implement Execution Estimate sub-tab
- [ ] Create `AddEstimateItemForm.tsx`
- [ ] Create `EstimateItemsTable.tsx`
- [ ] Migrate existing BudgetTab content to Financial tab
- [ ] Migrate existing TendersTab content to Financial tab
- [ ] Update ProjectDetailPage to use new Financial tab
- [ ] Write E2E tests for estimate creation

### Sprint 4 (Week 7-8): Tender Integration & BOM
**Goal: Link estimates to tenders and implement BOM system**
- [ ] Add "Export to Tender" functionality
- [ ] Tenders sub-tab shows source estimate link
- [ ] Implement BOM file upload/download
- [ ] Create `BOMUploader.tsx` component
- [ ] Email UI placeholder (SendBOMEmailModal with disabled send)
- [ ] Update tender winner selection to create budget items
- [ ] Write integration tests

### Sprint 4 (Week 7-8): Email UI (Phase 2 implementation later)
**Goal: Prepare email UI structure**
- [ ] Create database table `tender_emails` (structure only)
- [ ] Create `SendBOMEmailModal.tsx` with disabled send functionality
- [ ] Display participant email addresses for manual copying
- [ ] Add BOM file download for manual attachment
- [ ] Add placeholder for email history
- [ ] Add "Email system coming soon" messaging
- [ ] Document Phase 2 email requirements

### Sprint 5 (Week 9-10): Budget Auto-Update & Variance Display
**Goal: Automate budget creation from tenders and display variance**
- [ ] Winner selection auto-creates/updates budget item
- [ ] Link budget item to estimate item (estimate_item_id)
- [ ] Calculate variance: budget - estimate (amount and %)
- [ ] Display variance in Budget tab columns
- [ ] Color coding: green/red/gray
- [ ] Filter: "Show items with variance only"
- [ ] Variance calculation tests (unit tests)
- [ ] E2E test: winner selection → budget → variance display

### Sprint 6 (Week 11-12): Polish & Testing
**Goal: Production-ready**
- [ ] Complete all E2E tests
- [ ] Security audit (file upload, email injection)
- [ ] Performance optimization (large estimate lists)
- [ ] User documentation and tooltips
- [ ] Bug fixes and edge cases
- [ ] Deployment preparation

---

## Migration Strategy

### Decision: No Automatic Migration

**Approach:**
- New Estimate module starts fresh
- Existing tenders/budgets remain as-is
- Users manually create estimates for ongoing projects as needed
- Old data accessible but not automatically converted

### Rollout Plan
1. **Launch**: Deploy Estimate module for new projects
2. **Training**: Show users how to create estimates
3. **Gradual Adoption**: Users start with new projects, eventually add estimates to active old projects
4. **Support**: Help users as they migrate project-by-project

### Communication Plan
1. **Email to Users**: Announce new Estimate feature
2. **Training Session**: Demo new workflow
3. **Quick Start Guide**: PDF with screenshots
4. **In-App Tooltips**: Help bubbles on new features
5. **Support Channel**: Dedicated communication for questions

**No automatic data conversion scripts needed.**

---

## Risk Assessment & Mitigation

### Risk 1: Email Deliverability (Phase 2)
**Risk:** BOM emails go to spam or bounce

**Mitigation:**
- MVP: Users send emails manually (no deliverability risk)
- Phase 2: Use reputable email service (SendGrid)
- Set up SPF, DKIM, DMARC records when implementing
- Always provide BOM download link as backup

### Risk 2: Large File Uploads
**Risk:** BOM files too large, server crashes

**Mitigation:**
- Enforce 10MB file size limit
- Use chunked uploads for large files
- Compress files before storage
- Implement upload progress indicator
- Provide file size warnings

### Risk 3: Data Sync Issues
**Risk:** Estimate, tender, budget get out of sync

**Mitigation:**
- Use database transactions for multi-table updates
- Implement consistency checks
- Add audit log for changes
- Periodic reconciliation job
- Clear error messages

### Risk 4: Complex Variance Calculations
**Risk:** Variance calculations incorrect or confusing

**Mitigation:**
- Write comprehensive unit tests
- Document calculation formulas
- Show breakdown in UI (not just final number)
- Add recalculate button
- Implement data validation

### Risk 5: User Adoption
**Risk:** Users continue old workflow, ignore estimates

**Mitigation:**
- Make estimate optional initially
- Highlight benefits (time saved, better tracking)
- Provide migration path for old tenders
- Gradual rollout (pilot with 1-2 projects)
- Collect feedback and iterate

---

## Success Metrics

### Quantitative Metrics
- **Adoption Rate**: % of new projects using estimate module
- **Time Saved**: Average time to create tender (before vs after)
- **Email Success Rate**: % of BOM emails delivered successfully
- **Variance Accuracy**: % of projects within 10% of estimate
- **User Activity**: Number of estimates created per week

### Qualitative Metrics
- **User Satisfaction**: Survey feedback (1-10 scale)
- **Feature Requests**: Number of enhancement requests
- **Support Tickets**: Number of bugs/issues reported
- **User Testimonials**: Positive feedback quotes

### Target Goals (6 months post-launch)
- 80% of new projects have at least one estimate
- Average tender creation time reduced by 50%
- 95% email delivery success rate
- 70% of projects within 15% variance
- User satisfaction score ≥ 8/10

---

## Open Questions for Niv

### ✅ Resolved (Confirmed Decisions)

1. **Email System**: UI in MVP, actual sending in Phase 2
2. **Variance Thresholds**: Display numbers with color coding only, no automatic alerts
3. **Historical Data**: No automatic migration - manual handling as needed
4. **Estimate Versioning**: Update in place (no version history)
5. **Multi-Currency**: ILS (₪) only with 17% VAT
6. **Permissions**: Same as existing system (Manager/Entrepreneur own, Accountancy/Super Manager all)

### ✅ All Questions Resolved

1. **Estimate Approval**: ✅ No formal approval process
   - Users can create and export estimates freely
   - No approval workflow needed
   - Simpler, faster user experience

2. **BOM Templates**: ✅ No templates - custom upload only
   - Users always upload their own Word files
   - No template library or management needed
   - Simpler implementation

3. **Professional Selection**: ✅ Keep existing approach
   - Select professionals per tender (already working this way)
   - No changes needed

---

## Conclusion

This integration plan provides a comprehensive roadmap for implementing the Estimate module and integrating it with existing Tender and Budget systems. The phased approach allows for iterative development, testing, and user feedback.

**All Requirements Confirmed:**
✅ No estimate approval workflow
✅ No BOM templates - custom upload only
✅ ILS currency only with 17% VAT
✅ Same permissions as existing system
✅ No automatic data migration
✅ No variance threshold alerts
✅ No estimate versioning
✅ Email UI in MVP, sending in Phase 2

**Next Steps:**
1. ✅ Plan reviewed and approved
2. ✅ All questions answered
3. 🚀 **Ready to start Sprint 1** (database and services)
4. Set up weekly check-ins to track progress
5. Begin development

**Estimated Total Effort:** 10-12 weeks (Phase 1 MVP with 1 developer)

**Priority Features (Must-Have for MVP):**
- ✅ Unified Cost Control page: **בקרת עלויות** (3 tabs: Estimates, Tenders, Budget)
- ✅ Unified Financial tab in project detail (5 sub-tabs)
- ✅ Estimate creation with items (Planning + Execution)
- ✅ Export estimate to tender (no approval needed)
- ✅ BOM upload and download (custom files only)
- ✅ Winner selection → budget update with variance calculation
- ✅ Variance display in Budget tab (columns with color coding)
- ✅ Simplified navigation (1 menu item instead of 2)

**Phase 2 Features (Future - 2-3 weeks):**
- ⏳ Automated email sending to tender participants
- ⏳ Email delivery tracking and logging
- ⏳ Advanced variance analytics and reports
- ⏳ Email bounce/error handling

**Explicitly Excluded from MVP:**
- ❌ Estimate approval workflow
- ❌ BOM template library
- ❌ Multi-currency support
- ❌ Automatic variance alerts/thresholds
- ❌ Estimate version history
- ❌ Automatic data migration
- ❌ Separate global pages for Budget/Tenders/Estimates (consolidated into one)
- ❌ Separate variance analysis tab (variance shown in Budget tab)
- ❌ Email tracking/logging table (`tender_emails`)

---

**Document Version:** 2.0
**Created:** January 28, 2026
**Last Updated:** January 29, 2026
**Author:** Claude (via Orchestrator)
**Status:** ✅ APPROVED - Ready for Implementation
