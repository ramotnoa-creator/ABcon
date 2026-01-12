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

export type TenderStatus = 'Draft' | 'Open' | 'Closed' | 'WinnerSelected' | 'Canceled';

export type TenderType = 'architect' | 'engineer' | 'contractor' | 'electrician' | 'plumber' | 'interior_designer' | 'other';

export interface Tender {
  id: string;
  project_id: string;
  tender_name: string;
  tender_type: TenderType; // סוג המכרז
  category?: string;
  description?: string;
  status: TenderStatus;
  publish_date?: string; // ISO date string
  due_date?: string; // ISO date string (deadline)
  candidate_professional_ids: string[]; // Array of professional IDs
  winner_professional_id?: string; // Reference to Professional
  winner_professional_name?: string; // Display name (lookup)
  milestone_id?: string; // Optional link to project milestone
  notes?: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

export interface TenderParticipant {
  id: string;
  tender_id: string;
  professional_id: string;
  quote_file?: string; // URL/path to quote file
  total_amount?: number; // Quote amount in ILS
  notes?: string;
  is_winner: boolean;
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
