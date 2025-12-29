# AN Projects - Application Specification

## Overview
AN Projects is a construction and real estate project management system with Hebrew RTL interface. The application manages projects, professionals, tasks, milestones, tenders, budgets, and files.

---

## Pages and Routes

### 1. Login Page
**Route:** `/login`
**Hebrew Name:** התחברות
**English Name:** Login Page

**Fields:**
- Email (דוא״ל) - text input, email validation
- Password (סיסמה) - password input

**Actions:**
- Login button (התחבר) - authenticates user and redirects to dashboard
- Forgot password link (שכחתי סיסמה) - currently placeholder

**Features:**
- Logo display (construction icon)
- Error message display for invalid credentials
- Loading state during authentication

---

### 2. Dashboard Page
**Route:** `/dashboard`
**Hebrew Name:** לוח בקרה ניהולי
**English Name:** Management Dashboard
**Breadcrumbs:** ראשי > לוח בקרה ניהולי

**Features:**
- Welcome message with current date
- Quick statistics cards (total projects, active projects, total professionals)
- Quick action buttons:
  - Create new project (פרויקט חדש) → navigates to `/projects/new`
  - Add professional (הוסף איש מקצוע) → navigates to `/professionals/new`
  - View all projects (צפה בכל הפרויקטים) → navigates to `/projects`

**Recent Activity:**
- Shows recent projects with:
  - Project name
  - Client name
  - Status badge
  - Last updated timestamp
  - Click to view project details

---

### 3. Projects List Page
**Route:** `/projects`
**Hebrew Name:** פרויקטים
**English Name:** Projects
**Breadcrumbs:** פרויקטים

**Filters:**
- Status dropdown (all, in_progress, completed, on_hold, cancelled, planning)
- Search box (filter by project name or client)

**Actions:**
- Create new project button (פרויקט חדש) → navigates to `/projects/new`

**Project Cards Display:**
Each card shows:
- Project name (project_name)
- Client name (client_name)
- Address (address)
- Status badge with Hebrew labels:
  - `in_progress`: בביצוע (blue)
  - `completed`: הושלם (green)
  - `on_hold`: בהמתנה (yellow)
  - `cancelled`: בוטל (red)
  - `planning`: בתכנון (gray)
- Permit start date (תאריך התחלת היתר)
- Permit duration (משך היתר) in months
- Click on card navigates to project details

---

### 4. Create Project Page
**Route:** `/projects/new`
**Hebrew Name:** יצירת פרויקט חדש
**English Name:** Create New Project
**Breadcrumbs:** בית > פרויקטים > יצירת פרויקט חדש

**Form Fields:**
- Project name (שם הפרויקט) - required, text input
- Client name (שם הלקוח) - required, text input
- Address (כתובת) - required, text input
- Status (סטטוס) - required, dropdown with 5 options
- Permit start date (תאריך התחלת היתר) - date picker
- Permit duration (משך היתר בחודשים) - number input
- Notes (הערות) - textarea

**Actions:**
- Create project button (צור פרויקט) - saves and redirects to project detail
- Cancel button (ביטול) - returns to projects list

**Validation:**
- All required fields must be filled
- Shows error messages for missing fields

---

### 5. Project Detail Page
**Route:** `/projects/:id`
**Hebrew Name:** פרטי פרויקט
**English Name:** Project Details
**Breadcrumbs:** פרויקטים > פרטי פרויקט

**Header Actions:**
- Edit project button (עריכת פרויקט) - toggles edit mode
- Save button (שמור) - saves changes (shown in edit mode)
- Cancel button (ביטול) - exits edit mode (shown in edit mode)

**Tabs:** 6 tabs total

#### Tab 1: Overview (סקירה כללית)
**Project Information:**
- Project name (שם הפרויקט) - editable
- Client name (שם הלקוח) - editable
- Address (כתובת) - editable
- Status (סטטוס) - editable dropdown
- Permit start date (תאריך התחלת היתר) - editable date picker
- Permit duration (משך היתר בחודשים) - editable number
- Notes (הערות) - editable textarea
- Created date (נוצר ב) - read-only
- Last updated (עודכן לאחרונה) - read-only

#### Tab 2: Tasks (משימות)
**Features:**
- Create new task button (משימה חדשה)
- Filter tasks by status (all, pending, in_progress, completed, blocked)

**Task Card Display:**
Each task shows:
- Title (כותרת)
- Description (תיאור)
- Status badge (סטטוס) with labels:
  - `pending`: ממתינה (gray)
  - `in_progress`: בביצוע (blue)
  - `completed`: הושלמה (green)
  - `blocked`: חסומה (red)
- Priority (עדיפות) with labels:
  - `low`: נמוכה (gray)
  - `medium`: בינונית (yellow)
  - `high`: גבוהה (orange)
  - `urgent`: דחופה (red)
- Assigned professional (איש מקצוע מוקצה)
- Due date (תאריך יעד)
- Start date (תאריך התחלה)
- Completion percentage (אחוז השלמה) - with progress bar

**Task Actions:**
- Edit task button (עריכה)
- Delete task button (מחיקה)

**Create/Edit Task Form:**
- Title - required
- Description - optional
- Status - dropdown
- Priority - dropdown
- Assigned professional - dropdown (from project professionals)
- Due date - date picker
- Start date - date picker
- Completion percentage - number slider (0-100)
- Notes - textarea

#### Tab 3: Milestones (אבני דרך)
**Features:**
- Create milestone button (הוסף אבן דרך)

**Milestone Display:**
Each milestone shows:
- Title (כותרת משנה)
- Target date (תאריך יעד)
- Status badge with labels:
  - `pending`: ממתין (gray)
  - `in_progress`: בביצוע (blue)
  - `completed`: הושלם (green)
  - `delayed`: באיחור (orange)
  - `cancelled`: בוטל (red)
- Description (תיאור)
- Completion percentage with progress bar
- Visual timeline indicator

**Milestone Actions:**
- Edit milestone button
- Delete milestone button

**Create/Edit Milestone Form:**
- Title - required
- Target date - required
- Status - dropdown
- Description - textarea
- Completion percentage - number

#### Tab 4: Tenders (מכרזים)
**Features:**
- Create tender button (הוסף מכרז)

**Tender Display:**
Each tender shows:
- Tender title (כותרת מכרז)
- Field (תחום עיסוק)
- Status badge with labels:
  - `planned`: מתוכנן (gray)
  - `published`: פורסם (blue)
  - `in_review`: בבדיקה (yellow)
  - `awarded`: הוענק (green)
  - `cancelled`: בוטל (red)
- Publication date (תאריך פרסום)
- Submission deadline (מועד אחרון להגשה)
- Budget (תקציב) - formatted as currency
- Selected professional (איש מקצוע נבחר)
- Description (תיאור)

**Tender Actions:**
- Edit tender
- Delete tender

**Create/Edit Tender Form:**
- Title - required
- Field - required
- Status - dropdown
- Publication date - date picker
- Submission deadline - date picker
- Budget - number
- Selected professional - dropdown
- Description - textarea

#### Tab 5: Professionals (אנשי מקצוע)
**Features:**
- Assign professional button (שיוך איש מקצוע) - opens professional selector modal

**Professional Display:**
Each professional shows:
- Name (שם איש המקצוע)
- Company (חברה)
- Field (תחום עיסוק)
- Phone (טלפון)
- Email (אימייל)
- Rating (דירוג) - stars display
- Active badge (פעיל/לא פעיל)

**Actions:**
- View professional details - navigates to `/professionals/:id`
- Remove from project button

#### Tab 6: Files (קבצים)
**Features:**
- Upload file button (העלה קובץ)
- Filter files by type (all, image, pdf, document, spreadsheet, other)

**File Display:**
Each file shows:
- File name (שם הקובץ)
- File type icon and badge
- File size (גודל) - formatted (KB/MB)
- Upload date (תאריך העלאה)
- Uploaded by (הועלה על ידי)
- Description/notes (תיאור)

**File Actions:**
- Download file button
- Delete file button
- Preview (for images and PDFs)

**Upload File Form:**
- File picker - required
- Description - optional textarea

---

### 6. Professionals List Page
**Route:** `/professionals`
**Hebrew Name:** אנשי מקצוע
**English Name:** Professionals
**Breadcrumbs:** אנשי מקצוע

**Filters:**
- Field dropdown (all fields or specific)
- Active/Inactive toggle
- Search box (filter by name, company, or email)

**Actions:**
- Create new professional button (איש מקצוע חדש) → navigates to `/professionals/new`

**Professional Cards Display:**
Each card shows:
- Professional name (שם איש המקצוע)
- Company name (שם החברה)
- Field (תחום עיסוק)
- Phone (טלפון)
- Email (אימייל)
- Rating (דירוג) - stars display
- Active badge (פעיל) - green if active
- Click navigates to professional detail

---

### 7. Professional Detail Page
**Route:** `/professionals/:id`
**Hebrew Name:** כרטיס איש מקצוע
**English Name:** Professional Card
**Breadcrumbs:** אנשי מקצוע > כרטיס איש מקצוע

**Header Actions:**
- Edit professional button (עריכת פרטים) - toggles edit mode
- Save button (שמור) - saves changes (shown in edit mode)
- Cancel button (ביטול) - exits edit mode (shown in edit mode)

**Professional Information:**
- Professional name (שם איש המקצוע) - editable
- Company name (שם החברה) - editable
- Field (תחום עיסוק) - editable dropdown with options:
  - architect: אדריכל
  - engineer: מהנדס
  - contractor: קבלן
  - electrician: חשמלאי
  - plumber: אינסטלטור
  - designer: מעצב פנים
  - other: אחר
- Phone (טלפון) - editable
- Email (אימייל) - editable
- Rating (דירוג) - editable (1-5 stars)
- Active status (סטטוס) - editable toggle
- Notes (הערות) - editable textarea
- Created date (נוצר ב) - read-only

**Associated Projects Section:**
- List of all projects where this professional is assigned
- Shows project name and status
- Click to navigate to project detail

---

### 8. Create Professional Page
**Route:** `/professionals/new`
**Hebrew Name:** יצירת איש מקצוע חדש
**English Name:** Create New Professional
**Breadcrumbs:** אנשי מקצוע > יצירת איש מקצוע חדש

**Form Fields:**
- Professional name (שם איש המקצוע) - required
- Company name (שם החברה) - optional
- Field (תחום עיסוק) - required dropdown
- Phone (טלפון) - optional
- Email (אימייל) - optional, email validation
- Rating (דירוג) - optional, 1-5 stars
- Active (פעיל) - checkbox, default true
- Notes (הערות) - optional textarea

**Actions:**
- Create professional button (צור איש מקצוע) - saves and redirects to professional detail
- Cancel button (ביטול) - returns to professionals list

**Validation:**
- Required fields must be filled
- Email must be valid format if provided

---

### 9. Global Files Page
**Route:** `/files`
**Hebrew Name:** קבצים
**English Name:** Files
**Breadcrumbs:** קבצים

**Features:**
- Upload file button (העלה קובץ)
- Filter by:
  - File type (all, image, pdf, document, spreadsheet, other)
  - Related entity type (Project, Professional)
  - Search by filename or description

**File Display:**
Same as Project Files tab, with additional column:
- Related entity (גורם משויך) - shows "Project: [name]" or "Professional: [name]"

**File Actions:**
- Download file
- Delete file
- View related entity (navigate to project or professional detail)

---

## Common Components

### Status Badges
Color-coded badges appearing throughout the system:

**Project Statuses:**
- בביצוע (In Progress) - Blue
- הושלם (Completed) - Green
- בהמתנה (On Hold) - Yellow
- בוטל (Cancelled) - Red
- בתכנון (Planning) - Gray

**Task Statuses:**
- ממתינה (Pending) - Gray
- בביצוע (In Progress) - Blue
- הושלמה (Completed) - Green
- חסומה (Blocked) - Red

**Milestone Statuses:**
- ממתין (Pending) - Gray
- בביצוע (In Progress) - Blue
- הושלם (Completed) - Green
- באיחור (Delayed) - Orange
- בוטל (Cancelled) - Red

**Tender Statuses:**
- מתוכנן (Planned) - Gray
- פורסם (Published) - Blue
- בבדיקה (In Review) - Yellow
- הוענק (Awarded) - Green
- בוטל (Cancelled) - Red

### Priority Levels
- נמוכה (Low) - Gray
- בינונית (Medium) - Yellow
- גבוהה (High) - Orange
- דחופה (Urgent) - Red

### Professional Fields
- אדריכל (Architect)
- מהנדס (Engineer)
- קבלן (Contractor)
- חשמלאי (Electrician)
- אינסטלטור (Plumber)
- מעצב פנים (Designer)
- אחר (Other)

### File Types
- תמונה (Image) - PNG, JPG, JPEG, GIF
- PDF - PDF documents
- מסמך (Document) - DOC, DOCX, TXT
- גליון אלקטרוני (Spreadsheet) - XLS, XLSX, CSV
- אחר (Other) - all other file types

---

## Navigation Structure

**Header Navigation:**
- Dashboard (לוח בקרה)
- Projects (פרויקטים)
- Professionals (אנשי מקצוע)
- Files (קבצים)
- User menu with logout option

**Breadcrumbs:**
Every page except login has breadcrumbs showing navigation path, with clickable links to parent pages.

---

## Data Models Summary

### Project
- id, project_name, client_name, address, status
- permit_start_date, permit_duration_months
- notes, created_at, updated_at

### Professional
- id, professional_name, company_name, field
- phone, email, rating (1-5), is_active
- notes, created_at

### Task
- id, project_id, title, description
- status, priority, assignee_professional_id
- due_date, start_date, percent_complete
- notes, created_at, updated_at

### Milestone
- id, project_id, title, target_date
- status, description, completion_percentage
- created_at, updated_at

### Tender
- id, project_id, title, field
- status, publication_date, submission_deadline
- budget, selected_professional_id
- description, created_at, updated_at

### File
- id, file_name, file_path, file_size, file_type
- related_entity_type (Project/Professional)
- related_entity_id, description
- uploaded_by, uploaded_at

### ProjectProfessional (Join Table)
- id, project_id, professional_id
- assigned_at

---

## Notes

- All dates use ISO format (YYYY-MM-DD)
- All text is RTL Hebrew interface
- System uses localStorage for data persistence
- File uploads handled via local file system
- No backend API - pure frontend application
- Responsive design for desktop and tablet
