# Phase 4: Tender Integration & BOM - Execution Plan

```yaml
wave: 1
depends_on: ['03-estimates-ui']
files_modified:
  - src/pages/Projects/tabs/subtabs/PlanningEstimateSubTab.tsx
  - src/pages/Projects/tabs/subtabs/ExecutionEstimateSubTab.tsx
  - src/pages/Projects/tabs/subtabs/TendersSubTab.tsx
  - src/components/Tenders/BOMUploader.tsx
  - src/components/Tenders/SendBOMEmailModal.tsx
  - src/components/Tenders/WinnerSelectionModal.tsx
autonomous: false
```

## Objective

Connect estimates to tenders via "Export to Tender" workflow. Implement BOM (Bill of Materials) file upload/download system. Create winner selection modal that previews variance before updating budget.

## Context

**Current state:**
- Phase 3 complete: Can create estimates with items
- Tenders exist separately
- No connection between estimates and tenders

**What we're building:**
- "Export to Tender" button creates tender from estimate
- BOM file upload (Word documents up to 10MB)
- Email modal (UI only, actual sending in Phase 2)
- Winner selection shows variance preview
- Budget auto-creation (Phase 5 will implement)

## Tasks

<task id="4.1" title="Add Export to Tender button">
<description>
Add button to estimate sub-tabs that creates tender from estimate.

**Files:** Planning/ExecutionEstimateSubTab.tsx

**Button placement:**
```tsx
<div className="estimate-actions">
  <Button onClick={handleExportToTender}>
    Export to Tender
  </Button>
</div>
```

**Click handler:**
```typescript
const handleExportToTender = async () => {
  // 1. Get estimate and items
  const estimate = await getEstimate(estimateId);
  const items = await getEstimateItems(estimateId);

  // 2. Calculate total
  const estimatedBudget = items.reduce(
    (sum, item) => sum + item.total_with_vat,
    0
  );

  // 3. Create tender pre-filled with estimate data
  const tender = await createTender({
    project_id: projectId,
    tender_name: `${estimate.name} - Tender`,
    description: estimate.description,
    estimated_budget: estimatedBudget,
    estimate_id: estimate.id, // Link to source
    status: 'Draft'
  });

  // 4. Update estimate status
  await updateEstimate(estimate.id, {
    status: 'exported_to_tender'
  });

  // 5. Navigate to tender
  navigate(`/projects/${projectId}?tab=financial&subtab=tenders&tender=${tender.id}`);

  showToast('Tender created from estimate', 'success');
};
```

**Acceptance:**
- Button visible on estimate sub-tabs
- Click creates tender with estimate data
- Tender links back to estimate (estimate_id field)
- Estimate status updates to 'exported_to_tender'
- Navigates to tender after creation
</description>
</task>

<task id="4.2" title="Show source estimate in tender">
<description>
Display link to source estimate when viewing tender.

**File:** TendersSubTab.tsx

**Add to tender detail display:**
```tsx
{tender.estimate_id && (
  <div className="source-estimate">
    <span>Created from estimate:</span>
    <Link to={`?tab=financial&subtab=${estimateType}-estimate`}>
      {estimateName}
    </Link>
    <Badge>₪{formatCurrency(tender.estimated_budget)}</Badge>
  </div>
)}
```

**Acceptance:**
- If tender has estimate_id, show source link
- Click navigates to estimate sub-tab
- Shows estimated amount from estimate
- If no estimate_id, section hidden
</description>
</task>

<task id="4.3" title="Create BOMUploader component">
<description>
Create component for uploading BOM files (Word documents).

**File:** `src/components/Tenders/BOMUploader.tsx`

**Features:**
- File input (accept .doc, .docx)
- Drag-and-drop zone
- File size validation (max 10MB)
- Upload progress indicator
- Display current BOM if exists
- Replace/delete BOM options

**Implementation:**
```tsx
const BOMUploader = ({ tenderId, currentBOM, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = async (file) => {
    // Validate
    if (file.size > 10 * 1024 * 1024) {
      showToast('File too large (max 10MB)', 'error');
      return;
    }

    if (!file.name.match(/\.(doc|docx)$/i)) {
      showToast('Only .doc and .docx files allowed', 'error');
      return;
    }

    // Upload
    setUploading(true);
    try {
      const bomFile = await uploadBOMFile(tenderId, file, {
        onProgress: setProgress
      });
      onUploadSuccess(bomFile);
      showToast('BOM uploaded successfully', 'success');
    } catch (error) {
      showToast('Upload failed', 'error');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="bom-uploader">
      {currentBOM ? (
        <div className="current-bom">
          <FileIcon />
          <span>{currentBOM.file_name}</span>
          <span>{formatFileSize(currentBOM.file_size)}</span>
          <Button onClick={() => downloadBOMFile(currentBOM.id)}>
            Download
          </Button>
          <Button onClick={() => deleteBOMFile(currentBOM.id)} variant="danger">
            Delete
          </Button>
        </div>
      ) : (
        <div className="upload-zone" {...getRootProps()}>
          <input {...getInputProps()} />
          <UploadIcon />
          <p>Drag BOM file here or click to browse</p>
          <p className="hint">Max 10MB, .doc or .docx only</p>
        </div>
      )}

      {uploading && (
        <ProgressBar value={progress} />
      )}
    </div>
  );
};
```

**Acceptance:**
- Can select file via button or drag-drop
- Validates file size and type
- Shows upload progress
- Stores file successfully
- Can download uploaded file
- Can delete and re-upload
</description>
</task>

<task id="4.4" title="Integrate BOM uploader in tender">
<description>
Add BOM uploader to tender detail view.

**File:** TendersSubTab.tsx

**Add BOM section:**
```tsx
<div className="tender-section">
  <h3>Bill of Materials (בל"מ)</h3>
  <BOMUploader
    tenderId={tender.id}
    currentBOM={tender.bom_file}
    onUploadSuccess={(bomFile) => {
      // Update tender with BOM reference
      updateTender(tender.id, { bom_file_id: bomFile.id });
      // Refresh tender data
      refetch();
    }}
  />
</div>
```

**Acceptance:**
- BOM section appears in tender detail
- Can upload/download/delete BOM
- Tender.bom_file_id updates on upload
- BOM persists across page reloads
</description>
</task>

<task id="4.5" title="Create SendBOMEmailModal">
<description>
Create modal for sending BOM to tender participants (Phase 2: actual sending).

**File:** `src/components/Tenders/SendBOMEmailModal.tsx`

**Features (Phase 1 - MVP):**
- Display list of participant emails (from professionals table)
- Show BOM file name
- Email template preview (for reference)
- "Send" button disabled with tooltip "Email system coming in Phase 2"
- Download BOM button (manual attachment)
- Copy email addresses button

**Implementation:**
```tsx
const SendBOMEmailModal = ({ tender, participants, bomFile, onClose }) => {
  const participantEmails = participants
    .map(p => p.professional.email)
    .join(', ');

  const copyEmails = () => {
    navigator.clipboard.writeText(participantEmails);
    showToast('Emails copied to clipboard', 'success');
  };

  return (
    <Modal open onClose={onClose} title="Send BOM to Participants">
      <div className="email-modal">
        <div className="participants-section">
          <h4>Recipients ({participants.length})</h4>
          <ul>
            {participants.map(p => (
              <li key={p.id}>
                {p.professional.professional_name}
                <span className="email">{p.professional.email}</span>
              </li>
            ))}
          </ul>
          <Button onClick={copyEmails} variant="secondary">
            Copy All Emails
          </Button>
        </div>

        <div className="bom-section">
          <h4>Attachment</h4>
          <div className="file-info">
            <FileIcon />
            <span>{bomFile.file_name}</span>
            <Button onClick={() => downloadBOMFile(bomFile.id)}>
              Download
            </Button>
          </div>
        </div>

        <div className="template-section">
          <h4>Email Template (Preview)</h4>
          <div className="email-preview">
            <p><strong>Subject:</strong> BOM for {tender.tender_name}</p>
            <p><strong>Body:</strong></p>
            <div className="body-preview">
              Dear {'{professional_name}'},

              Please find attached the Bill of Materials for {tender.tender_name}.

              Submission deadline: {formatDate(tender.due_date)}

              Best regards,
              {'{project_manager_name}'}
            </div>
          </div>
        </div>

        <div className="actions">
          <Button
            disabled
            title="Email system coming in Phase 2"
          >
            Send Emails (Coming Soon)
          </Button>
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>

        <div className="phase-2-notice">
          <InfoIcon />
          <span>Automated email sending will be available in Phase 2.
          For now, copy emails and send manually via your email client.</span>
        </div>
      </div>
    </Modal>
  );
};
```

**Acceptance:**
- Modal shows participant list with emails
- Can copy all emails to clipboard
- Can download BOM file
- Send button disabled with clear message
- Email template visible (for manual reference)
- Phase 2 notice clear
</description>
</task>

<task id="4.6" title="Add Send BOM button">
<description>
Add button to tender detail that opens email modal.

**File:** TendersSubTab.tsx

**Add button near BOM section:**
```tsx
{tender.bom_file && participants.length > 0 && (
  <Button onClick={() => setShowEmailModal(true)}>
    📧 Send BOM to Participants
  </Button>
)}

{showEmailModal && (
  <SendBOMEmailModal
    tender={tender}
    participants={participants}
    bomFile={tender.bom_file}
    onClose={() => setShowEmailModal(false)}
  />
)}
```

**Acceptance:**
- Button appears when BOM uploaded and participants exist
- Click opens email modal
- Modal functions as designed
- Can close modal
</description>
</task>

<task id="4.7" title="Create WinnerSelectionModal">
<description>
Create modal that shows variance preview before creating budget.

**File:** `src/components/Tenders/WinnerSelectionModal.tsx`

**Features:**
- Display winner info
- Show contract amount vs estimated budget
- Calculate and display variance
- Color code variance (green/red)
- "Create Budget Item" button (Phase 5 will implement)
- "Cancel" option

**Implementation:**
```tsx
const WinnerSelectionModal = ({
  tender,
  winnerParticipant,
  onConfirm,
  onCancel
}) => {
  const variance = tender.contract_amount - tender.estimated_budget;
  const variancePercent = (variance / tender.estimated_budget) * 100;
  const variantColor = variance < 0 ? 'green' : 'red';

  return (
    <Modal open onClose={onCancel} title="Select Tender Winner">
      <div className="winner-selection">
        <div className="winner-info">
          <h4>Winner</h4>
          <p className="professional-name">
            {winnerParticipant.professional.professional_name}
          </p>
          <p className="company">
            {winnerParticipant.professional.company_name}
          </p>
        </div>

        <div className="amounts">
          <div className="amount-row">
            <span>Estimated Budget:</span>
            <span className="amount">₪{formatCurrency(tender.estimated_budget)}</span>
          </div>
          <div className="amount-row">
            <span>Contract Amount:</span>
            <span className="amount">₪{formatCurrency(tender.contract_amount)}</span>
          </div>
          <div className={`variance-row ${variantColor}`}>
            <span>Variance:</span>
            <span className="variance">
              {variance < 0 ? '-' : '+'}₪{formatCurrency(Math.abs(variance))}
              ({variancePercent > 0 ? '+' : ''}{variancePercent.toFixed(1)}%)
              {variance < 0 ? ' 🟢 Saved!' : ' 🔴 Over Budget'}
            </span>
          </div>
        </div>

        <div className="auto-budget-section">
          <h4>Budget Creation</h4>
          <p>Create budget item automatically with contract amount?</p>
          <ul>
            <li>Budget item: ₪{formatCurrency(tender.contract_amount)}</li>
            <li>Linked to estimate: ₪{formatCurrency(tender.estimated_budget)}</li>
            <li>Variance tracked automatically</li>
          </ul>
        </div>

        <div className="actions">
          <Button onClick={onConfirm} variant="primary">
            Confirm Winner & Create Budget
          </Button>
          <Button onClick={onCancel} variant="secondary">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};
```

**Acceptance:**
- Shows winner information
- Displays variance calculation
- Color codes variance correctly
- Explains what will happen (budget creation)
- Confirm/cancel options work
</description>
</task>

<task id="4.8" title="Integrate winner selection modal">
<description>
Update winner selection flow to show modal.

**File:** TendersSubTab.tsx

**Update winner selection:**
```tsx
const handleSelectWinner = (participant) => {
  // Store selected participant
  setSelectedWinner(participant);

  // Update tender with contract amount
  const updatedTender = {
    ...tender,
    winner_professional_id: participant.professional_id,
    winner_professional_name: participant.professional.professional_name,
    contract_amount: participant.total_amount,
    status: 'WinnerSelected'
  };

  // Show modal with variance preview
  setShowWinnerModal(true);
  setPendingTenderUpdate(updatedTender);
};

const confirmWinnerSelection = async () => {
  // Update tender
  await updateTender(tender.id, pendingTenderUpdate);

  // Phase 5 will implement: create budget item here

  showToast('Winner selected successfully', 'success');
  setShowWinnerModal(false);
  refetch();
};
```

**Acceptance:**
- Click "Select Winner" → modal opens
- Modal shows variance preview
- Confirm updates tender
- Cancel dismisses modal without changes
- Tender status changes to 'WinnerSelected'
</description>
</task>

<task id="4.9" title="Write integration tests">
<description>
Test complete estimate → tender → winner flow.

**File:** `tests/tender-integration.spec.ts`

**Test cases:**
```typescript
test('Export estimate to tender', async ({ page }) => {
  // Create estimate with items
  // Click "Export to Tender"
  // Verify tender created with correct data
  // Verify estimate status updated
  // Verify navigation to tender
});

test('Upload BOM file', async ({ page }) => {
  // Navigate to tender
  // Upload .docx file (< 10MB)
  // Verify file stored
  // Download file → verify same as uploaded
  // Delete file → verify removed
});

test('Send BOM modal shows participants', async ({ page }) => {
  // Add participants to tender
  // Upload BOM
  // Click "Send BOM"
  // Verify modal shows participant emails
  // Verify can copy emails
  // Verify send button disabled
});

test('Winner selection shows variance', async ({ page }) => {
  // Create tender from estimate
  // Add participants with quotes
  // Select winner
  // Verify modal shows variance
  // Verify color coding (green if saved, red if over)
  // Confirm → tender updated
});
```

**Acceptance:**
- All tests pass
- Cover happy path and errors
- No flaky tests
</description>
</task>

## Verification Criteria

### Must Work
- [ ] Can export estimate to tender (button works)
- [ ] Tender created with estimate data
- [ ] Tender shows source estimate link
- [ ] Can upload BOM file (Word doc)
- [ ] Can download BOM file
- [ ] Send BOM modal shows participants
- [ ] Winner selection shows variance preview
- [ ] Variance calculation correct
- [ ] Color coding accurate

### Quality
- [ ] BOM upload progress visible
- [ ] File validation prevents invalid files
- [ ] Email modal clear about Phase 2
- [ ] Winner modal explains what will happen
- [ ] Responsive on mobile

### Edge Cases
- [ ] BOM > 10MB rejected
- [ ] Invalid file type rejected
- [ ] No participants → can't send BOM
- [ ] No BOM → can't send email
- [ ] Variance handles zero/negative correctly

## must_haves

**For phase goal: "Link estimates to tenders and implement BOM system"**

1. **Export to tender works**
   - Button on estimate sub-tabs
   - Creates tender with estimate data
   - Links tender ↔ estimate (bidirectional)
   - Estimate status updates

2. **BOM file system functional**
   - Upload Word documents (up to 10MB)
   - Download works correctly
   - Delete and re-upload works
   - File metadata stored

3. **Email UI prepared (sending in Phase 2)**
   - Modal shows participants
   - Can copy emails manually
   - BOM downloadable for manual attachment
   - Clear Phase 2 messaging

4. **Winner selection previews variance**
   - Modal shows variance calculation
   - Color coding (green/red)
   - Explains budget creation
   - Confirm/cancel options

5. **Integration tested**
   - Estimate → Tender flow works
   - BOM upload/download reliable
   - Winner selection smooth

## Success Indicator

**Phase 4 is complete when:**
User can:
1. Create estimate with items
2. Click "Export to Tender" → tender created
3. Upload BOM (.docx file)
4. Click "Send BOM" → see participant emails, copy them
5. Add participant quotes
6. Select winner → see variance (saved or over budget)
7. Confirm winner → tender updated

All without errors. BOM files don't corrupt. Variance calculates correctly.
