# איפיון מערכת

## Construction Project Management System

---

## 1. מטרת המערכת

מערכת ענן לניהול פרויקטי בנייה, עם דגש על:

* ניהול פרויקט מקצה לקצה
* עבודה פנימית של צוות הניהול בלבד
* ניהול אנשי מקצוע, מכרזים, משימות, קבצים ומסמכים
* תיעוד והיסטוריה

**אין כניסה לבעלי מקצוע למערכת.**
אנשי מקצוע מנוהלים כמאגר מידע בלבד.

---

## 2. עקרונות יסוד

* Team בפרויקט = **אנשי מקצוע בלבד**
* אנשי מקצוע מגיעים אך ורק ממאגר Professionals גלובלי
* הוספת איש מקצוע חדש מתבצעת רק במאגר אנשי מקצוע, לא מתוך פרויקט
* בחירת זוכה במכרז מוסיפה איש מקצוע לפרויקט אוטומטית
* Contracts ו-Documents מנוהלים כקבצים באותו טאב
* Budget יאופיין בשלב מאוחר יותר

---

## 3. ישויות (Entities)

### 3.1 Project (פרויקט)

**שדות:**

* project_id
* project_name
* client_name
* address
* status
  (Planning / Permits / Tendering / Construction / Handover / Archived)
* created_at
* permit_start_date
* permit_duration_months (Planned)
* permit_target_date (מחושב)
* permit_approved_date (nullable)
* notes

---

### 3.2 Professional (איש מקצוע) – מאגר גלובלי

**שדות:**

* professional_id
* professional_name
* company_name
* תחום
* phone
* email
* notes
* is_active

---

### 3.3 ProjectProfessional (שיוך איש מקצוע לפרויקט)

**שדות:**

* project_professional_id
* project_id
* professional_id
* project_role
* source (Tender / Manual)
* related_tender_id (nullable)
* related_tender_name (lookup)
* start_date
* end_date (nullable)
* is_active
* notes

**חוקים:**

* לא ניתן לשייך איש מקצוע שלא קיים במאגר Professionals
* אין יצירה ידנית של אנשי מקצוע מתוך פרויקט
* שיוך דרך מכרז נוצר אוטומטית

---

### 3.4 Task (משימה)

**שדות:**

* task_id
* project_id
* title
* description
* status
  (Backlog / Ready / In Progress / Blocked / Done / Canceled)
* priority
* assignee_name
* due_date
* start_date
* completed_at
* notes
* created_at
* updated_at

---

### 3.5 Tender (מכרז)

**שדות:**

* tender_id
* project_id
* tender_name
* category
* description
* status
  (Draft / Open / Closed / WinnerSelected / Canceled)
* publish_date
* due_date
* winner_professional_id (nullable)
* winner_professional_name (lookup)
* notes

**אין ישות Tender Offer נפרדת במערכת.**

---

### 3.6 File (קבצים ומסמכים)

ישות אחת לקבצים מכל הסוגים.

**שדות:**

* file_id
* file_name
* file_url
* description_short
* related_entity_type
  (Project / Task / Tender / Professional)
* related_entity_id
* related_entity_name (lookup)
* uploaded_at
* uploaded_by
* notes

---

## 4. מסכים (Screens)

---

### 4.1 Dashboard

**Project List**

* project_name
* client_name
* address
* status
* permit_target_date
* updated_at
* notes

---

### 4.2 Project Page

#### Overview

* project_name
* client_name
* address
* status
* created_at
* permit_start_date
* permit_duration_months
* permit_target_date
* permit_approved_date
* notes

הצגת נתוני היתר רק בסטטוסים:
Planning, Permits

---

#### Team (אנשי מקצוע בלבד)

רשימה של אנשי מקצוע המשויכים לפרויקט.

**שדות מוצגים:**

* professional_name
* company_name
* תחום
* phone
* email
* project_role
* source
* related_tender_name
* notes

**פעולות:**

* לחיצה על איש מקצוע → מעבר לדף Professional

אין אפשרות להוסיף איש מקצוע מתוך הפרויקט.

---

#### Tasks

תצוגת Kanban.

**כרטיס משימה:**

* title
* status
* priority
* assignee_name
* due_date
* notes

---

#### Tenders

**רשימת מכרזים:**

* tender_name
* category
* status
* publish_date
* due_date
* winner_professional_name
* notes

---

#### Files (Contracts + Documents)

רשימה אחת של קבצים.

**שדות:**

* file_name (עם לינק)
* description_short
* related_entity_name
* uploaded_at
* uploaded_by
* notes

**פעולות:**

* Upload File
* Edit File Metadata

---

### 4.3 Professionals – מאגר אנשי מקצוע (גלובלי)

#### List

* professional_name
* company_name
* תחום
* phone
* email
* notes
* is_active

**פעולות:**

* Create New Professional
* Open Professional
* Edit Professional
* Deactivate Professional

---

#### Professional Detail

**פרטי איש מקצוע:**

* professional_name
* company_name
* תחום
* phone
* email
* notes
* is_active

**Related Projects:**

* project_name
* project_role
* source
* related_tender_name
* notes

---

## 5. Workflows מרכזיים

### 5.1 מעבר סטטוס פרויקט

Planning → Permits → Tendering → Construction → Handover → Archived

* מעבר ל-Construction מסתיר נתוני Permit מהתצוגה הראשית
* נתוני היתר נשמרים להיסטוריה

---

### 5.2 בחירת זוכה במכרז

בעת מעבר Tender ל-WinnerSelected:

1. נבחר professional
2. נוצר ProjectProfessional אוטומטי
3. source = Tender
4. related_tender_id מתעדכן

---

## 6. מחוץ להיקף בשלב זה

* Budget
* הרשאות מורכבות
* כניסה לבעלי מקצוע
* ניהול תשלומים

---



