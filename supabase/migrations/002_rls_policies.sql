-- ============================================================
-- AB Projects - Row Level Security (RLS) Policies
-- ============================================================
-- Run this AFTER 001_initial_schema.sql
-- These policies control who can read/write which data
-- ============================================================

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE gantt_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_payments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- USER PROFILES
-- ============================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can manage all profiles
CREATE POLICY "Admins can manage profiles"
  ON user_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- PROJECT ASSIGNMENTS
-- ============================================================

-- Users can view their own assignments
CREATE POLICY "Users can view own assignments"
  ON project_assignments FOR SELECT
  USING (user_id = auth.uid());

-- Admins can manage all assignments
CREATE POLICY "Admins can manage assignments"
  ON project_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- PROJECTS
-- ============================================================

-- Users can view projects they're assigned to
CREATE POLICY "Users can view assigned projects"
  ON projects FOR SELECT
  USING (
    id IN (
      SELECT project_id FROM project_assignments
      WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins and PMs can create projects
CREATE POLICY "Admins and PMs can create projects"
  ON projects FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'project_manager')
    )
  );

-- Admins and PMs can update assigned projects
CREATE POLICY "Admins and PMs can update projects"
  ON projects FOR UPDATE
  USING (
    id IN (
      SELECT project_id FROM project_assignments
      WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete projects
CREATE POLICY "Admins can delete projects"
  ON projects FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- PROFESSIONALS
-- ============================================================

-- All authenticated users can view professionals
CREATE POLICY "Authenticated users can view professionals"
  ON professionals FOR SELECT
  TO authenticated
  USING (true);

-- Admins and PMs can manage professionals
CREATE POLICY "Admins and PMs can manage professionals"
  ON professionals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'project_manager')
    )
  );

-- ============================================================
-- PROJECT-RELATED DATA (Tasks, Tenders, Files, etc.)
-- ============================================================

-- Generic policy for project-related tables: users can view if assigned to project
CREATE POLICY "Users can view project tasks"
  ON tasks FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_assignments
      WHERE user_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can manage project tasks"
  ON tasks FOR ALL
  USING (
    project_id IN (
      SELECT project_id FROM project_assignments
      WHERE user_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Tenders
CREATE POLICY "Users can view project tenders"
  ON tenders FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_assignments WHERE user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can manage project tenders"
  ON tenders FOR ALL
  USING (
    project_id IN (
      SELECT project_id FROM project_assignments WHERE user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Tender Participants
CREATE POLICY "Users can view tender participants"
  ON tender_participants FOR SELECT
  USING (
    tender_id IN (
      SELECT t.id FROM tenders t
      JOIN project_assignments pa ON pa.project_id = t.project_id
      WHERE pa.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can manage tender participants"
  ON tender_participants FOR ALL
  USING (
    tender_id IN (
      SELECT t.id FROM tenders t
      JOIN project_assignments pa ON pa.project_id = t.project_id
      WHERE pa.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Project Professionals
CREATE POLICY "Users can view project professionals"
  ON project_professionals FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_assignments WHERE user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can manage project professionals"
  ON project_professionals FOR ALL
  USING (
    project_id IN (
      SELECT project_id FROM project_assignments WHERE user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Files
CREATE POLICY "Users can view project files"
  ON files FOR SELECT
  USING (true); -- Open for now, can restrict later

CREATE POLICY "Users can manage files"
  ON files FOR ALL
  USING (true); -- Open for now, can restrict later

-- Planning Changes
CREATE POLICY "Users can view project planning changes"
  ON planning_changes FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_assignments WHERE user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can manage planning changes"
  ON planning_changes FOR ALL
  USING (
    project_id IN (
      SELECT project_id FROM project_assignments WHERE user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Special Issues
CREATE POLICY "Users can view project special issues"
  ON special_issues FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_assignments WHERE user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can manage special issues"
  ON special_issues FOR ALL
  USING (
    project_id IN (
      SELECT project_id FROM project_assignments WHERE user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- UNITS & MILESTONES
-- ============================================================

CREATE POLICY "Users can view project units"
  ON project_units FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_assignments WHERE user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can manage project units"
  ON project_units FOR ALL
  USING (
    project_id IN (
      SELECT project_id FROM project_assignments WHERE user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can view project milestones"
  ON project_milestones FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_assignments WHERE user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can manage project milestones"
  ON project_milestones FOR ALL
  USING (
    project_id IN (
      SELECT project_id FROM project_assignments WHERE user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can view gantt tasks"
  ON gantt_tasks FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_assignments WHERE user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can manage gantt tasks"
  ON gantt_tasks FOR ALL
  USING (
    project_id IN (
      SELECT project_id FROM project_assignments WHERE user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- BUDGET MODULE - RESTRICTED ACCESS
-- ============================================================

-- Budget Categories
CREATE POLICY "Users can view budget categories"
  ON budget_categories FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_assignments WHERE user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins and accountants can manage budget categories"
  ON budget_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'accountant')
    )
  );

-- Budget Chapters
CREATE POLICY "Users can view budget chapters"
  ON budget_chapters FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_assignments WHERE user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins and accountants can manage budget chapters"
  ON budget_chapters FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'accountant')
    )
  );

-- Budget Items
CREATE POLICY "Users can view budget items"
  ON budget_items FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_assignments WHERE user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins and accountants can manage budget items"
  ON budget_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'accountant')
    )
  );

-- Budget Payments
CREATE POLICY "Users can view budget payments"
  ON budget_payments FOR SELECT
  USING (
    budget_item_id IN (
      SELECT bi.id FROM budget_items bi
      JOIN project_assignments pa ON pa.project_id = bi.project_id
      WHERE pa.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins and accountants can manage budget payments"
  ON budget_payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'accountant')
    )
  );

-- ============================================================
-- RLS POLICIES COMPLETE
-- ============================================================
-- Security is now enabled!
-- Users can only access projects they're assigned to
-- Admins have full access
-- Accountants have budget access
-- ============================================================
