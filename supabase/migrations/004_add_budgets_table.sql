-- ============================================================
-- ADD BUDGETS TABLE
-- Migration: 004
-- Description: Add budgets table for project-level budget tracking
-- ============================================================

CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  planned_budget DECIMAL(15,2) NOT NULL,
  actual_budget DECIMAL(15,2) NOT NULL,
  variance DECIMAL(5,2),
  status TEXT NOT NULL CHECK (status IN ('On Track', 'Deviation', 'At Risk', 'Completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id)
);

-- Index for fast project lookup
CREATE INDEX idx_budgets_project_id ON budgets(project_id);

-- Comment explaining the table
COMMENT ON TABLE budgets IS 'Project-level budget tracking with planned vs actual comparison';
COMMENT ON COLUMN budgets.variance IS 'Percentage variance: ((actual - planned) / planned) * 100';
COMMENT ON COLUMN budgets.project_id IS 'One budget per project (enforced by UNIQUE constraint)';
