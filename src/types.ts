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
  due_date?: string; // ISO date string
  start_date?: string; // ISO date string
  completed_at?: string; // ISO date string
  notes?: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

export type TenderStatus = 'Draft' | 'Open' | 'Closed' | 'WinnerSelected' | 'Canceled';

export interface Tender {
  id: string;
  project_id: string;
  tender_name: string;
  category?: string;
  description?: string;
  status: TenderStatus;
  publish_date?: string; // ISO date string
  due_date?: string; // ISO date string
  candidate_professional_ids: string[]; // Array of professional IDs
  winner_professional_id?: string; // Reference to Professional
  winner_professional_name?: string; // Display name (lookup)
  notes?: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
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
