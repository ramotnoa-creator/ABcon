export type ProjectStatus = 
  | 'תכנון'
  | 'היתרים'
  | 'מכרזים'
  | 'ביצוע'
  | 'מסירה'
  | 'ארכיון';

export interface Project {
  id: string;
  project_name: string;
  client_name: string;
  address?: string;
  status: ProjectStatus;
  permit_start_date?: string; // ISO date string
  permit_duration_months?: number;
  permit_target_date?: string; // ISO date string (calculated)
  permit_approval_date?: string; // ISO date string (optional)
  created_at: string; // ISO date string (auto)
  updated_at_text: string; // Display text like "24 באוקטובר 2023"
  notes?: string;
  // Costs tracking (new unified system)
  general_estimate?: number; // אומדן כללי - total project budget
  built_sqm?: number; // מטר בנוי - built square meters
  sales_sqm?: number; // מטר מכר - sales square meters
  current_vat_rate?: number; // Current VAT rate (default 17)
}

export type AlertType = 'budget' | 'delay' | 'contract' | 'other';

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  timestamp: string; // Display text like "היום, 09:00" or "אתמול" or "20/10/2023"
  projectId?: string;
  projectName?: string;
}

export interface KPI {
  id: string;
  label: string;
  value: number;
  icon: string;
  color: 'green' | 'red' | 'orange' | 'blue';
  subtitle?: string;
  badge?: string;
}

export interface ProjectRequiringAttention {
  id: string;
  project_name: string;
  project_manager: string;
  status: ProjectStatus;
  critical_issue: string;
  progress: number;
  statusColor: 'red' | 'yellow' | 'blue';
  issueColor: 'red' | 'default';
}

export interface StatusDistribution {
  label: string;
  percentage: number;
  color: 'blue' | 'orange' | 'red';
}

export interface Professional {
  id: string;
  professional_name: string;
  company_name?: string;
  field: string; // תחום
  phone?: string;
  email?: string;
  rating?: number; // דירוג (1-5)
  notes?: string;
  is_active: boolean;
}

export type ProjectProfessionalSource = 'Tender' | 'Manual';

export interface ProjectProfessional {
  id: string;
  project_id: string;
  professional_id: string;
  project_role?: string;
  source: ProjectProfessionalSource;
  related_tender_id?: string;
  related_tender_name?: string;
  start_date?: string; // ISO date string
  end_date?: string; // ISO date string (nullable)
  is_active: boolean;
  notes?: string;
}

export type TaskStatus = 'Backlog' | 'Ready' | 'In Progress' | 'Blocked' | 'Done' | 'Canceled';

export type TaskPriority = 'High' | 'Medium' | 'Low';

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_professional_id?: string; // Reference to Professional
  assignee_name?: string; // Display name (can be from professional or free text)
  due_date?: string; // ISO date string (used for planned_end_date)
  start_date?: string; // ISO date string (used for planned_start_date)
  completed_at?: string; // ISO date string
  duration_days?: number; // Duration in days
  percent_complete?: number; // 0-100
  external_reference_id?: string; // Task ID / WBS from external system
  notes?: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

export type TenderStatus = 'Draft' | 'Open' | 'WinnerSelected' | 'Canceled';

export type TenderType = 'architect' | 'engineer' | 'contractor' | 'electrician' | 'plumber' | 'interior_designer' | 'other';

export interface Tender {
  id: string;
  project_id: string;
  tender_name: string;
  tender_type: TenderType; // סוג המכרז
  category?: string;
  description?: string;
  status: TenderStatus;
  publish_date?: string; // ISO date string — set when BOM sent & tender opened
  due_date?: string; // ISO date string — target date for receiving quotes
  bom_sent_date?: string; // ISO date string — when BOM was sent to participants
  winner_selected_date?: string; // ISO date string — when winner was chosen
  candidate_professional_ids: string[]; // Array of professional IDs
  winner_professional_id?: string; // Reference to Professional
  winner_professional_name?: string; // Display name (lookup)
  milestone_id?: string; // Optional link to project milestone
  notes?: string;
  // Management fields
  estimated_budget?: number; // Expected cost before quotes (תקציב משוער)
  contract_amount?: number; // Final negotiated price (סכום חוזה)
  management_remarks?: string; // Admin-only notes (הערות ניהול)
  // Estimate integration fields (added in Phase 1)
  estimate_id?: string; // Link to estimates table (OLD SYSTEM)
  bom_file_id?: string; // Link to bom_files table
  // Enhanced tracking fields (Phase 1.1)
  estimate_snapshot?: EstimateSnapshot; // Snapshot of estimate at time of export
  estimate_version?: number; // Version number for change tracking
  is_estimate_outdated?: boolean; // Flag when source estimate has been modified
  // NEW UNIFIED SYSTEM
  cost_item_id?: string; // Link to cost_items table (NEW SYSTEM - replaces estimate_id)
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

// Snapshot of estimate data at time of tender creation
export interface EstimateSnapshot {
  estimate: Estimate;
  items: EstimateItem[];
  snapshot_date: string;
  total_with_vat: number;
}

export interface TenderParticipant {
  id: string;
  tender_id: string;
  professional_id: string;
  quote_file?: string; // URL/path to quote file
  total_amount?: number; // Quote amount in ILS
  notes?: string;
  is_winner: boolean;
  bom_sent_date?: string; // ISO date — when BOM was sent to this participant
  bom_sent_status?: 'not_sent' | 'sent' | 'failed'; // Send tracking
  created_at: string; // ISO date string
}

export type FileEntityType = 'Project' | 'Task' | 'Tender' | 'Professional';

export interface File {
  id: string;
  file_name: string;
  file_url: string;
  file_size?: number; // Size in bytes
  file_size_display?: string; // Display like "2.4 MB"
  file_type?: string; // MIME type or extension
  description_short?: string;
  related_entity_type?: FileEntityType;
  related_entity_id?: string; // Optional - null means global-only
  related_entity_name?: string; // Lookup display name
  uploaded_at: string; // ISO date string
  uploaded_by: string; // Free text (no auth system in MVP)
  notes?: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

export type BudgetStatus = 'On Track' | 'Deviation' | 'At Risk' | 'Completed';

export interface Budget {
  id: string;
  project_id: string;
  planned_budget: number; // In NIS (₪)
  actual_budget: number; // In NIS (₪)
  variance?: number; // Calculated: ((actual - planned) / planned) * 100
  status: BudgetStatus;
  notes?: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

// Planning Changes
export type PlanningChangeDecision = 'pending' | 'approved' | 'rejected';

export interface PlanningChange {
  id: string;
  project_id: string;
  change_number: number; // Sequential number per project, auto-increment
  description: string; // תיאור השינוי (required)
  schedule_impact?: string; // השפעה על לו"ז (optional)
  budget_impact?: number; // השפעה על תקציב in ILS (optional)
  decision: PlanningChangeDecision; // החלטה
  image_urls?: string[]; // Array of image URLs - תמונות
  created_by?: string; // Reference to User
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

// Special Issues
export type SpecialIssueStatus = 'open' | 'in_progress' | 'resolved';
export type SpecialIssuePriority = 'low' | 'medium' | 'high' | 'critical';
export type SpecialIssueCategory = 'safety' | 'quality' | 'schedule' | 'budget' | 'design' | 'permits' | 'other';

export interface SpecialIssue {
  id: string;
  project_id: string;
  date: string; // ISO date string - תאריך הבעיה (required)
  description: string; // תיאור הבעיה (required)
  status: SpecialIssueStatus; // סטטוס
  priority?: SpecialIssuePriority; // עדיפות
  category?: SpecialIssueCategory; // קטגוריה
  responsible?: string; // אחראי
  image_urls?: string[]; // תמונות
  resolution?: string; // פתרון (optional)
  created_by?: string; // Reference to User
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

// ============================================================
// UNITS, MILESTONES & GANTT TASKS
// ============================================================

export type UnitType = 'apartment' | 'common' | 'building';

export interface ProjectUnit {
  id: string;
  project_id: string;
  name: string; // "דירה 1+2", "שטחים משותפים"
  type: UnitType;
  color: string; // "blue", "green", "purple", "amber"
  icon: string; // Material icon name
  order: number;
  created_at: string;
  updated_at: string;
}

export type MilestoneStatus = 'pending' | 'in-progress' | 'completed';

export interface ProjectMilestone {
  id: string;
  project_id: string;
  unit_id: string;
  name: string; // "סיום ריצוף דירה 1+2"
  date: string; // ISO date string
  status: MilestoneStatus;
  phase?: string; // "גבס", "ריצוף", "מסירה"
  budget_item_id?: string; // Link to budget item
  tender_id?: string; // Link to tender
  budget_link_text?: string; // Display text for budget link
  order: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type GanttTaskStatus = 'pending' | 'in-progress' | 'completed';
export type GanttTaskPriority = 'low' | 'medium' | 'high';
export type GanttTaskType =
  | 'גבס'
  | 'חשמל'
  | 'ריצוף'
  | 'צבע'
  | 'מטבח'
  | 'גמר'
  | 'ביקורת'
  | 'מעלית'
  | 'חניון'
  | 'מדרגות'
  | 'בטיחות'
  | 'אינסטלציה'
  | 'other';

export interface GanttTask {
  id: string;
  project_id: string;
  milestone_id: string; // Every task belongs to a milestone
  name: string;
  description?: string;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  duration: string; // "5 ימים"
  status: GanttTaskStatus;
  priority: GanttTaskPriority;
  progress: number; // 0-100
  assigned_to_id?: string; // Professional ID
  resource_name?: string; // Display name
  predecessors?: string[]; // Task IDs
  type: GanttTaskType;
  wbs?: string; // From MS Project
  outline_level?: number;
  ms_project_id?: string;
  order: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// BUDGET MODULE
// ============================================================

export type BudgetCategoryType = 'consultants' | 'suppliers' | 'contractors';

export interface BudgetCategory {
  id: string;
  project_id: string;
  name: string; // "יועצים", "ספקים", "קבלנים"
  type: BudgetCategoryType;
  icon: string;
  color: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetChapter {
  id: string;
  project_id: string;
  category_id: string;
  code?: string; // "01", "02", "09"
  name: string; // "אדריכלות", "נגרות", "עבודות ריצוף"
  budget_amount: number; // Planned budget
  contract_amount?: number; // After tender
  order: number;
  created_at: string;
  updated_at: string;
}

export type BudgetItemStatus = 'pending' | 'tender' | 'contracted' | 'in-progress' | 'completed';

export interface BudgetItem {
  id: string;
  project_id: string;
  chapter_id: string;
  code?: string; // "2.1", "9.3"
  description: string; // "ריצוף סלון"
  unit?: string; // "מ"ר", "מ"א", "יחידות", "קומפלט"
  quantity?: number;
  unit_price?: number;
  total_price: number;
  vat_rate: number; // 0.17
  vat_amount: number;
  total_with_vat: number;
  status: BudgetItemStatus;
  supplier_id?: string;
  supplier_name?: string;
  tender_id?: string;
  paid_amount: number;
  expected_payment_date?: string; // ISO date string - תאריך משוער לתשלום
  order: number;
  notes?: string;
  // Variance tracking fields (added in Phase 1)
  estimate_item_id?: string; // Link to estimate_items
  estimate_amount?: number; // Amount from estimate
  variance_amount?: number; // budget - estimate
  variance_percent?: number; // (variance / estimate) * 100
  // Enhanced traceability (Phase 1.1)
  source_estimate_id?: string; // Link to source estimate for full traceability
  created_at: string;
  updated_at: string;
}

export type BudgetPaymentStatus = 'pending' | 'approved' | 'paid';

export interface BudgetPayment {
  id: string;
  budget_item_id: string;
  invoice_number: string; // "חשבון חלקי 4"
  invoice_date: string; // ISO date string
  amount: number;
  vat_amount: number;
  total_amount: number;
  status: BudgetPaymentStatus;
  payment_date?: string;
  milestone_id?: string; // Payment triggered by milestone
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// PERMITS MODULE (היתרים)
// ============================================================

export type PermitType = 'building' | 'fire' | 'electricity' | 'water' | 'form4' | 'municipality' | 'environment' | 'other';
export type PermitStatus = 'not_submitted' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'expired';

export interface Permit {
  id: string;
  project_id: string;
  permit_type: PermitType;
  permit_name: string;
  authority?: string;           // רשות מאשרת
  application_reference?: string; // מספר בקשה
  application_date?: string;    // תאריך הגשה
  approval_date?: string;       // תאריך אישור
  expiry_date?: string;         // תוקף עד
  permit_number?: string;       // מספר היתר
  status: PermitStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// COSTS MODULE (NEW UNIFIED SYSTEM)
// ============================================================

export type CostCategory = 'consultant' | 'supplier' | 'contractor' | 'agra'; // יועץ / ספק / קבלן / אגרה
export type CostStatus =
  | 'draft'           // אומדן - לא יצא למכרז
  | 'tender_draft'    // טיוטת מכרז - יצא למכרז שעדיין ב-Draft
  | 'tender_open'     // מכרז נשלח - המכרז פתוח למציעים
  | 'tender_winner';  // מכרז זוכה - נבחר זכיין

export interface CostItem {
  id: string;
  project_id: string;
  name: string; // Short name - REQUIRED
  description?: string; // Detailed description - OPTIONAL
  category: CostCategory; // consultant, supplier, contractor, agra
  estimated_amount: number; // The ONE sum (no breakdown)
  actual_amount?: number; // After tender/contract
  vat_included: boolean; // Is VAT included in the amount?
  vat_rate: number; // VAT rate at time of entry (for tracking changes)
  status: CostStatus;
  tender_id?: string; // Link to tender if exported
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// ESTIMATES MODULE (OLD SYSTEM - DEPRECATED)
// ============================================================

export type EstimateType = 'planning' | 'execution';
export type EstimateStatus = 'draft' | 'active' | 'exported_to_tender' | 'locked';

export interface Estimate {
  id: string;
  project_id: string;
  estimate_type: EstimateType;
  name: string;
  description?: string;
  total_amount: number;
  status: EstimateStatus;
  created_by?: string;
  notes?: string;
  // Enhanced tracking fields (Phase 1)
  tender_id?: string; // 1:1 link to the tender created from this estimate
  exported_at?: string; // ISO date string - when estimate was exported to tender
  locked_at?: string; // ISO date string - when estimate was locked (after winner selection)
  created_at: string;
  updated_at: string;
}

export interface EstimateItem {
  id: string;
  estimate_id: string;
  code?: string;
  name?: string; // Short title/name for the item (REQUIRED after migration)
  description?: string; // Detailed description (OPTIONAL)
  category?: string;
  subcategory?: string;
  unit?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  vat_rate: number;
  vat_amount: number;
  total_with_vat: number;
  notes?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface BOMFile {
  id: string;
  tender_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by?: string;
  uploaded_at: string;
}

export interface VarianceData {
  estimate_amount: number;
  budget_amount: number;
  variance_amount: number;
  variance_percent: number;
  color: 'green' | 'red' | 'gray';
}

// ============================================================
// PAYMENT SCHEDULES MODULE
// ============================================================

export type PaymentScheduleStatus = 'draft' | 'active';

export interface PaymentSchedule {
  id: string;
  cost_item_id: string;
  project_id: string;
  total_amount: number;
  status: PaymentScheduleStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export type ScheduleItemStatus =
  | 'pending'
  | 'milestone_confirmed'
  | 'invoice_received'
  | 'approved'
  | 'paid';

export interface ScheduleItem {
  id: string;
  schedule_id: string;
  cost_item_id: string;
  project_id: string;
  description: string;
  amount: number;
  percentage: number;
  milestone_id?: string;
  milestone_name?: string;
  target_date?: string; // ISO date string
  order: number;
  status: ScheduleItemStatus;
  confirmed_by?: string;
  confirmed_at?: string;
  confirmed_note?: string;
  attachment_url?: string;
  approved_by?: string;
  approved_at?: string;
  paid_date?: string;
  paid_amount?: number;
  created_at: string;
  updated_at: string;
}
