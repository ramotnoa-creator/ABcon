---
status: testing
phase: 04-tender-integration
source: 04-01-SUMMARY.md
started: 2026-01-29T10:42:00Z
updated: 2026-01-29T12:05:00Z
---

## Current Test

number: 7
name: Winner Selection - Variance Preview (Savings)
expected: |
  Add participants with quote amounts. Click "Select Winner" on a participant whose quote is LESS than the estimated budget. Modal shows variance in GREEN with negative percentage (e.g., "-5% under budget"). Preview shows savings.
awaiting: user response

## Tests

### 1. Export Estimate to Tender
expected: Click "Export to Tender" button in estimate tab. New tender created with estimate data (name, description, estimated budget). Redirects to tender detail page. Tender shows link to source estimate.
result: issue
reported: "export to tender dosent work maybe DEBUG: Exporting to tender with estimate_id: 7b7ad501-f63b-4378-9e60-583da61a4e08 tendersService.ts:95 DEBUG createTender: isDemoMode= false estimate_id= 7b7ad501-f63b-4378-9e60-583da61a4e08 tendersService.ts:116 DEBUG: Inserting into database with estimate_id: 7b7ad501-f63b-4378-9e60-583da61a4e08"
severity: major
retest_after_fix: failed again - estimate_id passing correctly but export still not working

### 2. BOM File Upload (Valid File)
expected: In tender detail, drag-and-drop a .docx file (5-10MB) onto the BOM upload area, or click to browse. Progress bar appears. File uploads successfully. File name displays with download and delete buttons.
result: pass

### 3. BOM File Upload (Invalid Size)
expected: Try uploading a file larger than 10MB. Upload rejected immediately with error message "File size exceeds 10MB limit".
result: skipped
reason: couldn't find such a big word document

### 4. BOM File Upload (Invalid Type)
expected: Try uploading a .pdf or .txt file. Upload rejected with error message "Only .doc and .docx files are supported".
result: pass
note: File picker uses accept=".doc,.docx" so invalid types don't appear - correct UX design

### 5. BOM File Download
expected: After uploading a BOM file, click the download button. File downloads to your computer with original filename. Opening the file in Word shows correct content (no corruption).
result: pass

### 6. Send BOM Email Modal
expected: With BOM uploaded and participants added to tender, click "Send BOM to Participants" button. Modal opens showing list of participant emails. "Copy Emails" button copies all emails to clipboard. "Download BOM" button downloads the file. "Send Email" button is disabled with tooltip explaining Phase 2 availability.
result: pass

### 7. Winner Selection - Variance Preview (Savings)
expected: Add participants with quote amounts. Click "Select Winner" on a participant whose quote is LESS than the estimated budget. Modal shows variance in GREEN with negative percentage (e.g., "-5% under budget"). Preview shows savings.
result: skipped
reason: blocked by Test 1 - export to tender not working

### 8. Winner Selection - Variance Preview (Over Budget)
expected: Click "Select Winner" on a participant whose quote is MORE than the estimated budget. Modal shows variance in RED with positive percentage (e.g., "+10% over budget"). Preview shows over-budget amount.
result: skipped
reason: blocked by Test 1 - export to tender not working

### 9. Winner Confirmation Creates Budget
expected: After confirming winner selection, check the Budget sub-tab in Financial tab. A new budget item should appear with the contract amount, linked to the tender and supplier. Chapter assigned automatically based on tender type.
result: skipped
reason: blocked by Test 1 - export to tender not working

### 10. End-to-End Flow
expected: Complete flow from start: Create estimate → Add items → Export to Tender → Upload BOM → Add participants → Select winner. All steps work smoothly without errors. Budget item created at the end matches contract amount.
result: skipped
reason: blocked by Test 1 - export to tender not working

## Summary

total: 10
passed: 4
issues: 3
pending: 0
skipped: 5

## Gaps

- truth: "Click Export to Tender button creates new tender with estimate data and redirects to tender page"
  status: fixed
  reason: "User reported: in וילה פרטית - רמת אביב it dosent work"
  severity: major
  test: 1
  root_cause: "createTender INSERT statement missing estimate_id and bom_file_id columns. Migration 002 added columns to schema, TypeScript types include them, but INSERT never updated. estimate_id passed by handler is silently ignored, creating tender with NULL estimate_id."
  resolution:
    - path: "src/services/tendersService.ts"
      fix: "Added estimate_id and bom_file_id to INSERT statement (lines 124, 144-145)"
    - path: "src/services/tendersService.ts"
      fix: "Added $17, $18 placeholders to VALUES clause"
    - path: "src/services/tendersService.ts"
      fix: "Added tender.estimate_id || null, tender.bom_file_id || null to values array"
  verified: 2026-01-29T11:00:00Z
  debug_session: ".planning/estimate-integration/phases/04-tender-integration/debug/export-to-tender-villa-ramataviav.md"

- truth: "All tenders must be linked to an estimate - cannot create standalone tender"
  status: fixed
  reason: "User confirmed: we should not have add a tender without a line in estimation. Then requested: i want to remove the option of adding a tender lets do that only from estimation"
  severity: blocker
  test: 0
  root_cause: "Add Tender modal has no estimate selector. Infrastructure exists (migration, types, service) but disconnected. No validation enforcing estimate requirement. Can create tenders without estimate_id."
  resolution:
    - path: "src/pages/Projects/tabs/TendersTab.tsx"
      fix: "REMOVED Add Tender button and modal entirely - tenders can ONLY be created via Export to Tender"
    - path: "src/pages/Projects/tabs/TendersTab.tsx"
      fix: "Updated empty state message to guide users: 'ליצירת מכרז, עבור ללשונית התקציר והשתמש ב\"ייצוא למכרז\"'"
    - path: "src/services/tendersService.ts"
      fix: "Enabled validation requiring estimate_id (lines 98-100)"
  architectural_decision: "UI-level enforcement - tenders can only be created through Export to Tender flow, ensuring 100% estimate linkage"
  verified: 2026-01-29T11:15:00Z
  debug_session: ".planning/estimate-integration/phases/04-tender-integration/debug/prevent-standalone-tenders.md"

- truth: "Click Export to Tender button creates new tender with estimate data and redirects to tender page"
  status: failed
  reason: "User reported: export to tender dosent work maybe DEBUG: Exporting to tender with estimate_id: 7b7ad501-f63b-4378-9e60-583da61a4e08 tendersService.ts:95 DEBUG createTender: isDemoMode= false estimate_id= 7b7ad501-f63b-4378-9e60-583da61a4e08 tendersService.ts:116 DEBUG: Inserting into database with estimate_id: 7b7ad501-f63b-4378-9e60-583da61a4e08"
  severity: major
  test: 1
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
  notes: "Retest after 04-02 fix - estimate_id passing correctly through INSERT but export still failing. Need to check: 1) INSERT success/error, 2) redirect logic, 3) browser console for runtime errors"
