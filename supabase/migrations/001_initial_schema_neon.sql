-- ============================================================
-- AB Projects - Complete Database Schema for Neon
-- ============================================================
-- Neon-compatible version (no Supabase auth dependencies)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USER MANAGEMENT (Standalone - no Supabase auth)
-- ============================================================

-- User Profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL, -- For authentication
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'project_manager', 'entrepreneur', 'accountant')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Assignments (user-project relationships)
CREATE TABLE project_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- ============================================================
-- PROJECTS
-- ============================================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  address TEXT,
  status TEXT NOT NULL CHECK (status IN ('תכנון', 'היתרים', 'מכרזים', 'ביצוע', 'מסירה', 'ארכיון')),
  permit_start_date DATE,
  permit_duration_months INTEGER,
  permit_target_date DATE,
  permit_approval_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROFESSIONALS
-- ============================================================

CREATE TABLE professionals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_name TEXT NOT NULL,
  company_name TEXT,
  field TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project-Professional relationships
CREATE TABLE project_professionals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  project_role TEXT,
  source TEXT NOT NULL CHECK (source IN ('Tender', 'Manual')),
  related_tender_id UUID,
  related_tender_name TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, professional_id)
);

-- ============================================================
-- TASKS
-- ============================================================

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('Backlog', 'Ready', 'In Progress', 'Blocked', 'Done', 'Canceled')),
  priority TEXT NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
  assignee_professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  assignee_name TEXT,
  due_date DATE,
  start_date DATE,
  completed_at TIMESTAMPTZ,
  duration_days INTEGER,
  percent_complete INTEGER CHECK (percent_complete >= 0 AND percent_complete <= 100),
  external_reference_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TENDERS
-- ============================================================

CREATE TABLE tenders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tender_name TEXT NOT NULL,
  tender_type TEXT NOT NULL CHECK (tender_type IN ('architect', 'engineer', 'contractor', 'electrician', 'plumber', 'interior_designer', 'other')),
  category TEXT,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('Draft', 'Open', 'Closed', 'WinnerSelected', 'Canceled')),
  publish_date DATE,
  due_date DATE,
  candidate_professional_ids UUID[] DEFAULT '{}',
  winner_professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  winner_professional_name TEXT,
  milestone_id UUID,
  estimated_budget DECIMAL(15,2),
  contract_amount DECIMAL(15,2),
  management_remarks TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tender Participants
CREATE TABLE tender_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  quote_file TEXT,
  total_amount DECIMAL(15,2),
  notes TEXT,
  is_winner BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tender_id, professional_id)
);

-- ============================================================
-- FILES
-- ============================================================

CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_size_display TEXT,
  file_type TEXT,
  description_short TEXT,
  related_entity_type TEXT CHECK (related_entity_type IN ('Project', 'Task', 'Tender', 'Professional')),
  related_entity_id UUID,
  related_entity_name TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PLANNING CHANGES
-- ============================================================

CREATE TABLE planning_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  change_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  schedule_impact TEXT,
  budget_impact DECIMAL(15,2),
  decision TEXT NOT NULL CHECK (decision IN ('pending', 'approved', 'rejected')),
  image_urls TEXT[],
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, change_number)
);

-- ============================================================
-- SPECIAL ISSUES
-- ============================================================

CREATE TABLE special_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved')),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category TEXT CHECK (category IN ('safety', 'quality', 'schedule', 'budget', 'design', 'permits', 'other')),
  responsible TEXT,
  image_urls TEXT[],
  resolution TEXT,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- UNITS
-- ============================================================

CREATE TABLE project_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('apartment', 'common', 'building')),
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MILESTONES
-- ============================================================

CREATE TABLE project_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES project_units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in-progress', 'completed')),
  phase TEXT,
  budget_item_id UUID,
  tender_id UUID REFERENCES tenders(id) ON DELETE SET NULL,
  budget_link_text TEXT,
  "order" INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GANTT TASKS
-- ============================================================

CREATE TABLE gantt_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL REFERENCES project_milestones(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in-progress', 'completed')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  progress INTEGER CHECK (progress >= 0 AND progress <= 100),
  assigned_to_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  resource_name TEXT,
  predecessors UUID[],
  type TEXT NOT NULL CHECK (type IN ('גבס', 'חשמל', 'ריצוף', 'צבע', 'מטבח', 'גמר', 'ביקורת', 'מעלית', 'חניון', 'מדרגות', 'בטיחות', 'אינסטלציה', 'other')),
  wbs TEXT,
  outline_level INTEGER,
  ms_project_id TEXT,
  "order" INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BUDGET MODULE
-- ============================================================

-- Budget Categories
CREATE TABLE budget_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('consultants', 'suppliers', 'contractors')),
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget Chapters
CREATE TABLE budget_chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES budget_categories(id) ON DELETE CASCADE,
  code TEXT,
  name TEXT NOT NULL,
  budget_amount DECIMAL(15,2) NOT NULL,
  contract_amount DECIMAL(15,2),
  "order" INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget Items
CREATE TABLE budget_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES budget_chapters(id) ON DELETE CASCADE,
  code TEXT,
  description TEXT NOT NULL,
  unit TEXT,
  quantity DECIMAL(15,2),
  unit_price DECIMAL(15,2),
  total_price DECIMAL(15,2) NOT NULL,
  vat_rate DECIMAL(5,4) NOT NULL DEFAULT 0.17,
  vat_amount DECIMAL(15,2) NOT NULL,
  total_with_vat DECIMAL(15,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'tender', 'contracted', 'in-progress', 'completed')),
  supplier_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  supplier_name TEXT,
  tender_id UUID REFERENCES tenders(id) ON DELETE SET NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  expected_payment_date DATE,
  "order" INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget Payments
CREATE TABLE budget_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_item_id UUID NOT NULL REFERENCES budget_items(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  vat_amount DECIMAL(15,2) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'paid')),
  payment_date DATE,
  milestone_id UUID REFERENCES project_milestones(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_project_assignments_user_id ON project_assignments(user_id);
CREATE INDEX idx_project_assignments_project_id ON project_assignments(project_id);
CREATE INDEX idx_professionals_field ON professionals(field);
CREATE INDEX idx_professionals_is_active ON professionals(is_active);
CREATE INDEX idx_project_professionals_project_id ON project_professionals(project_id);
CREATE INDEX idx_project_professionals_professional_id ON project_professionals(professional_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_professional_id);
CREATE INDEX idx_tenders_project_id ON tenders(project_id);
CREATE INDEX idx_tenders_status ON tenders(status);
CREATE INDEX idx_tenders_due_date ON tenders(due_date);
CREATE INDEX idx_tender_participants_tender_id ON tender_participants(tender_id);
CREATE INDEX idx_tender_participants_professional_id ON tender_participants(professional_id);
CREATE INDEX idx_tender_participants_is_winner ON tender_participants(is_winner);
CREATE INDEX idx_files_related_entity ON files(related_entity_type, related_entity_id);
CREATE INDEX idx_files_uploaded_at ON files(uploaded_at DESC);
CREATE INDEX idx_planning_changes_project_id ON planning_changes(project_id);
CREATE INDEX idx_planning_changes_decision ON planning_changes(decision);
CREATE INDEX idx_special_issues_project_id ON special_issues(project_id);
CREATE INDEX idx_special_issues_status ON special_issues(status);
CREATE INDEX idx_special_issues_priority ON special_issues(priority);
CREATE INDEX idx_project_units_project_id ON project_units(project_id);
CREATE INDEX idx_milestones_project_id ON project_milestones(project_id);
CREATE INDEX idx_milestones_unit_id ON project_milestones(unit_id);
CREATE INDEX idx_milestones_date ON project_milestones(date);
CREATE INDEX idx_milestones_status ON project_milestones(status);
CREATE INDEX idx_gantt_tasks_project_id ON gantt_tasks(project_id);
CREATE INDEX idx_gantt_tasks_milestone_id ON gantt_tasks(milestone_id);
CREATE INDEX idx_gantt_tasks_dates ON gantt_tasks(start_date, end_date);
CREATE INDEX idx_budget_categories_project_id ON budget_categories(project_id);
CREATE INDEX idx_budget_chapters_project_id ON budget_chapters(project_id);
CREATE INDEX idx_budget_chapters_category_id ON budget_chapters(category_id);
CREATE INDEX idx_budget_items_project_id ON budget_items(project_id);
CREATE INDEX idx_budget_items_chapter_id ON budget_items(chapter_id);
CREATE INDEX idx_budget_items_status ON budget_items(status);
CREATE INDEX idx_budget_items_payment_date ON budget_items(expected_payment_date);
CREATE INDEX idx_budget_payments_item_id ON budget_payments(budget_item_id);
CREATE INDEX idx_budget_payments_status ON budget_payments(status);
CREATE INDEX idx_budget_payments_date ON budget_payments(payment_date);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_professionals_updated_at BEFORE UPDATE ON professionals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_professionals_updated_at BEFORE UPDATE ON project_professionals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenders_updated_at BEFORE UPDATE ON tenders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_planning_changes_updated_at BEFORE UPDATE ON planning_changes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_special_issues_updated_at BEFORE UPDATE ON special_issues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_units_updated_at BEFORE UPDATE ON project_units FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_milestones_updated_at BEFORE UPDATE ON project_milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gantt_tasks_updated_at BEFORE UPDATE ON gantt_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_categories_updated_at BEFORE UPDATE ON budget_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_chapters_updated_at BEFORE UPDATE ON budget_chapters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_items_updated_at BEFORE UPDATE ON budget_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_payments_updated_at BEFORE UPDATE ON budget_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
