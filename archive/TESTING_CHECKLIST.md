# AN Projects - Data Testing Checklist
## Walk every module with real data. Document what breaks.

**How to use:** Go module by module. Test each action. Mark the result.
- Put `[x]` for working
- Put `[!]` for broken/incomplete (add note)
- Put `[-]` for not applicable / not built yet

**Date started:** ___________
**Tested by:** ___________
**Data source:** Seed data / Manual entry / Both

---

## 1. Login & Authentication
**Route:** `/login`

### Actions
- [ ] Login with valid credentials
- [ ] Error message on wrong password
- [ ] Error message on non-existent user
- [ ] Redirect to dashboard after login
- [ ] Logout works
- [ ] Session persists after page refresh

### Data Check
- [ ] User roles exist in DB: admin, project_manager, entrepreneur, accountant
- [ ] Password hashing works (not stored plain text)

### Issues Found
```
(write issues here as you find them)
```

---

## 2. Dashboard
**Route:** `/dashboard`

### Display
- [ ] KPI cards show (total projects, active projects, professionals count)
- [ ] KPI numbers match actual data (not hardcoded mock)
- [ ] Recent projects list shows real projects
- [ ] Status badges display correctly in Hebrew
- [ ] Quick action buttons work (new project, view all)

### Data Check
- [ ] Project count matches what's in the system
- [ ] Active projects count is correct
- [ ] Professionals count is correct

### Issues Found
```

```

---

## 3. Projects
**Routes:** `/projects`, `/projects/new`, `/projects/:id`

### List View (`/projects`)
- [ ] All projects appear
- [ ] Search by project name works
- [ ] Search by client name works
- [ ] Filter by status works
- [ ] Status labels show in Hebrew
- [ ] Card displays: name, client, address, status, permit dates

### Create Project (`/projects/new`)
- [ ] Form opens correctly
- [ ] Required fields validated (project name, client name)
- [ ] Status dropdown has all options in Hebrew
- [ ] Date picker works for permit dates
- [ ] Permit target date auto-calculates
- [ ] Save creates project and redirects to detail
- [ ] Cancel returns to list

### Edit Project
- [ ] Edit mode toggles correctly
- [ ] All fields editable
- [ ] Save persists changes
- [ ] Cancel discards changes

### Project Detail (`/projects/:id`)
- [ ] All tabs load without errors
- [ ] Tab switching works
- [ ] Project header shows correct info
- [ ] Back navigation works

### Issues Found
```

```

---

## 4. Financial Tab (in Project Detail)

### 4a. Costs Sub-Tab (עלויות)
**Location:** Project > Financial Tab > Costs

#### Display
- [ ] Cost items table shows for project
- [ ] Summary cards show (estimate total, current status, variance)
- [ ] Category breakdown cards (consultant/supplier/contractor)
- [ ] Status badges correct (draft, tender_draft, tender_open, tender_winner)
- [ ] Color coding: amber=draft, blue=tender in process, green=winner selected

#### CRUD
- [ ] Add cost item — does it work?
- [ ] Edit cost item — does it work?
- [ ] Delete cost item — does it work?
- [ ] Expand row shows full details

#### Tender Integration
- [ ] "Create Tender" button works for draft items
- [ ] "View Tender" link navigates to specific tender (deep-link)
- [ ] Winner info shows in expanded row (name, contract, budget)
- [ ] Status updates when tender progresses

### Issues Found
```

```

---

### 4b. Tenders Sub-Tab
**Location:** Project > Financial Tab > Tenders

#### Display
- [ ] Tenders list shows for this project
- [ ] Status badges correct (Draft/Open/WinnerSelected)
- [ ] Tender type labels in Hebrew
- [ ] Participant count shows

#### Workflow: Draft -> Open -> WinnerSelected
- [ ] Create new tender (Draft status)
- [ ] Tender name required
- [ ] Tender type selectable
- [ ] Add participants (professionals) to tender
- [ ] Send BOM email (changes status to Open)
- [ ] BOM sent date recorded
- [ ] Publish date recorded
- [ ] Select winner from participants
- [ ] Winner name displayed
- [ ] Status changes to WinnerSelected
- [ ] Winner auto-added to project professionals

#### Data Check
- [ ] Tender links to correct project
- [ ] Participants link to real professionals
- [ ] Cost item link works (if applicable)
- [ ] Estimated budget displays
- [ ] Contract amount editable after winner selected

### Issues Found
```

```

---

### 4c. Payments Sub-Tab
**Location:** Project > Financial Tab > Payments

#### Display
- [ ] Payment schedules list shows
- [ ] Schedule items show with amounts and percentages
- [ ] Status tracking (pending/confirmed/approved/paid)
- [ ] Upcoming payments list shows at top (color-coded by urgency)

#### CRUD
- [ ] Create payment schedule for a cost item
- [ ] Add schedule items (milestones)
- [ ] Percentages sum to 100%
- [ ] Sequential dates enforced (payment #2 after #1)
- [ ] New row auto-fills date from previous + 1 day
- [ ] Confirm milestone
- [ ] Approve payment
- [ ] Mark as paid

### Issues Found
```

```

---

## 5. Tasks & Milestones Tab
**Location:** Project > Tasks & Milestones

### Units
- [ ] Project units display (apartments, common areas, building)
- [ ] Unit colors and icons correct

### Milestones
- [ ] Milestones show under their unit
- [ ] Milestone status badges correct
- [ ] Milestone dates display
- [ ] Phase labels show

### Gantt Chart
- [ ] Gantt view renders
- [ ] Tasks show as bars on timeline
- [ ] "Today" line visible
- [ ] Color coding by task type
- [ ] Progress bars show correctly

### Tasks
- [ ] Task list displays
- [ ] Status filter works
- [ ] Priority badges show
- [ ] Assignee name shows
- [ ] Due dates display

### MS Project Import
- [ ] XLSX import works
- [ ] Fields map correctly (name, dates, status, progress)
- [ ] Tasks appear after import

### CRUD
- [ ] Add task — does it work?
- [ ] Edit task — does it work?
- [ ] Delete task — does it work?
- [ ] Add milestone — does it work?

### Issues Found
```

```

---

## 6. Professionals
**Routes:** `/professionals`, `/professionals/new`, `/professionals/:id`

### List View
- [ ] All professionals appear
- [ ] Search works
- [ ] Filter by field/specialty works
- [ ] Cards show: name, company, field, phone, email, rating
- [ ] Active/inactive status shown

### Create Professional
- [ ] Form opens
- [ ] Required fields: name, field
- [ ] Field dropdown has all options (architect, engineer, contractor, electrician, plumber, interior designer, other)
- [ ] Rating input (1-5)
- [ ] Save creates professional
- [ ] Cancel returns to list

### Edit Professional
- [ ] Edit form pre-populates all fields
- [ ] Save persists changes
- [ ] Deactivate/reactivate works

### Project Assignment
- [ ] Professional appears in project's Professionals tab
- [ ] Manual assignment works (from global list)
- [ ] Tender-based assignment works (auto on winner selection)
- [ ] Source shows correctly (Manual/Tender)
- [ ] Remove from project works (soft delete)

### Issues Found
```

```

---

## 7. Cost Control Page (Global)
**Route:** `/cost-control`

### Overview
- [ ] Page loads without errors
- [ ] Summary cards show real data across projects
- [ ] Numbers calculated from actual cost items (not mock)

### Cross-Project View
- [ ] Projects listed with cost summaries
- [ ] Tenders view works across projects
- [ ] Status filters work
- [ ] Clicking item navigates to correct project

### Issues Found
```

```

---

## 8. Planning Changes Tab
**Location:** Project > Planning Changes

### Display
- [ ] Changes list shows for project
- [ ] Change number (sequential) correct
- [ ] Decision status badges (pending/approved/rejected)
- [ ] Budget impact shows

### CRUD
- [ ] Create planning change
- [ ] Description required
- [ ] Budget impact (ILS) input works
- [ ] Schedule impact text works
- [ ] Decision dropdown works
- [ ] Image upload works
- [ ] Edit change
- [ ] Delete change

### Issues Found
```

```

---

## 9. Special Issues Tab
**Location:** Project > Special Issues

### Display
- [ ] Issues list shows for project
- [ ] Status badges (open/in_progress/resolved)
- [ ] Priority badges (low/medium/high/critical)
- [ ] Category labels correct

### CRUD
- [ ] Create issue
- [ ] Date required
- [ ] Description required
- [ ] Status selectable
- [ ] Priority selectable
- [ ] Category selectable
- [ ] Responsible person field
- [ ] Resolution text (when resolved)
- [ ] Image upload works
- [ ] Edit issue
- [ ] Delete issue

### Issues Found
```

```

---

## 10. Permits Tab (new module)
**Location:** Project > Permits

### Display
- [ ] Permits list shows for project
- [ ] Permit type labels in Hebrew
- [ ] Status badges correct (not_submitted/submitted/in_review/approved/rejected/expired)
- [ ] Dates display correctly

### CRUD
- [ ] Create permit
- [ ] Permit type dropdown (building, fire, electricity, water, form4, municipality, environment, other)
- [ ] Permit name required
- [ ] Authority field works
- [ ] Application reference number
- [ ] All date fields work (application, approval, expiry)
- [ ] Permit number field
- [ ] Edit permit
- [ ] Delete permit

### Data Check
- [ ] Permit links to correct project
- [ ] Expiry date tracking works

### Issues Found
```

```

---

## 11. Files Tab
**Location:** Project > Files, and `/files` (global)

### Display
- [ ] Files list shows for project
- [ ] File metadata shows (name, size, type, upload date)
- [ ] Entity link shows (which project/task/tender)

### CRUD
- [ ] Upload file
- [ ] File size displays correctly
- [ ] File type detected
- [ ] Description field works
- [ ] Link to entity (project/task/tender/professional)
- [ ] Delete file
- [ ] Download file

### Global Files Page (`/files`)
- [ ] All files across projects show
- [ ] Filter by entity type works
- [ ] Search works

### Issues Found
```

```

---

## 12. Developer Approval Tab
**Location:** Project > Developer Approval

- [ ] Tab loads
- [ ] Approval workflow displays
- [ ] (Document what this tab actually does)

### Issues Found
```

```

---

## CROSS-MODULE FLOWS

These test that modules work TOGETHER, not just individually.

### Flow 1: Cost Item -> Tender -> Winner -> Payment
- [ ] Create cost item in Costs tab (draft)
- [ ] Create tender from cost item (tender_draft)
- [ ] Add participants to tender
- [ ] Send BOM (tender -> Open, cost item -> tender_open)
- [ ] Select winner (tender -> WinnerSelected, cost item -> tender_winner)
- [ ] Contract amount shows in cost item expanded row
- [ ] Winner added to project professionals
- [ ] Create payment schedule for winning cost item
- [ ] Payment schedule items created with milestones

### Flow 2: Tender Winner -> Project Professional
- [ ] Select tender winner
- [ ] Professional automatically appears in project's Professionals tab
- [ ] Source shows as "Tender"
- [ ] Related tender name shows

### Flow 3: Cost Item -> Payment Schedule -> Pay
- [ ] Cost item with winner exists
- [ ] Create payment schedule for cost item
- [ ] Add milestone-based payment items
- [ ] Sequential dates enforced
- [ ] Confirm milestone
- [ ] Approve payment
- [ ] Mark paid
- [ ] Upcoming payments list updates correctly

### Flow 4: MS Project Import -> Tasks -> Milestones
- [ ] Import XLSX file
- [ ] Tasks created with correct dates
- [ ] Milestones created
- [ ] Gantt chart shows imported data
- [ ] Progress tracking works

### Issues Found
```

```

---

## DATABASE vs CODE ALIGNMENT

Check that what the DB has matches what the UI shows.

### For each project, verify:
- [ ] Project fields in DB match what Overview tab shows
- [ ] Number of cost items in DB matches what Costs tab shows
- [ ] Number of tenders in DB matches what Tenders tab shows
- [ ] Number of professionals in DB matches what Professionals tab shows
- [ ] Number of tasks in DB matches what Tasks tab shows
- [ ] Number of files in DB matches what Files tab shows
- [ ] Number of permits in DB matches what Permits tab shows
- [ ] Number of planning changes in DB matches what Planning Changes tab shows
- [ ] Number of special issues in DB matches what Special Issues tab shows

### Issues Found
```

```

---

## SEED DATA COMPLETENESS

Does the seed data cover all modules for both projects?

### Villa Herzliya (proj-villa)
- [ ] Project record exists with all fields
- [ ] Cost items (various statuses: draft, tender_draft, tender_open, tender_winner)
- [ ] Tenders (various statuses: Draft, Open, WinnerSelected)
- [ ] Tender participants (at least 2-3 per tender)
- [ ] Payment schedules + schedule items
- [ ] Tasks (various statuses)
- [ ] Milestones
- [ ] Gantt tasks
- [ ] Units (apartments, common areas)
- [ ] Professionals assigned (manual + tender-based)
- [ ] Files attached
- [ ] Planning changes
- [ ] Special issues
- [ ] Permits (note: currently localStorage only, not in Neon DB)

### Netanya Complex (proj-bldg)
- [ ] (same checklist as above)

### Issues Found
```

```

---

## SUMMARY

| Module | Status | Critical Issues | Notes |
|--------|--------|-----------------|-------|
| Auth | | | |
| Dashboard | | | |
| Projects | | | |
| Costs | | | |
| Tenders | | | |
| Payments | | | |
| Tasks & Milestones | | | |
| Professionals | | | |
| Cost Control | | | |
| Planning Changes | | | |
| Special Issues | | | |
| Permits | | | |
| Files | | | |
| Dev Approval | | | |
| **Cross-Module Flows** | | | |
| **Seed Data** | | | |

### Top Issues (prioritized after testing)
1.
2.
3.
4.
5.

### Items Not Built Yet (known gaps)
1.
2.
3.
4.
5.
