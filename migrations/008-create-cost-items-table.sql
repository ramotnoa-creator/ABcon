-- Migration 008: Create cost_items table for unified costs system
-- Replaces separate planning_estimates + execution_estimates + budget

CREATE TABLE IF NOT EXISTS cost_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,

  -- Classification
  type TEXT NOT NULL CHECK (type IN ('planning', 'execution')),
  category TEXT NOT NULL CHECK (category IN ('consultant', 'supplier', 'contractor')),

  -- Amounts
  estimated_amount NUMERIC(12, 2) NOT NULL,
  actual_amount NUMERIC(12, 2),

  -- VAT tracking
  vat_included BOOLEAN NOT NULL DEFAULT true,
  vat_rate NUMERIC(5, 2) NOT NULL DEFAULT 17,

  -- Status workflow
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'tender_draft',
    'tender_open',
    'tender_winner',
    'contracted',
    'in_progress',
    'completed'
  )),

  -- Links
  tender_id UUID REFERENCES tenders(id) ON DELETE SET NULL,

  -- Additional info
  notes TEXT,
  created_by TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by project
CREATE INDEX IF NOT EXISTS idx_cost_items_project_id ON cost_items(project_id);

-- Index for filtering by type
CREATE INDEX IF NOT EXISTS idx_cost_items_type ON cost_items(type);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_cost_items_status ON cost_items(status);

-- Index for tender linkage
CREATE INDEX IF NOT EXISTS idx_cost_items_tender_id ON cost_items(tender_id);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_cost_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cost_items_updated_at
  BEFORE UPDATE ON cost_items
  FOR EACH ROW
  EXECUTE FUNCTION update_cost_items_updated_at();

-- Add cost_item_id to tenders table
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS cost_item_id UUID REFERENCES cost_items(id) ON DELETE SET NULL;

-- Index for tender -> cost_item lookup
CREATE INDEX IF NOT EXISTS idx_tenders_cost_item_id ON tenders(cost_item_id);
