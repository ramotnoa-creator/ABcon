-- Migration 006: Complete Project Items Structure
-- Production-ready schema with full edge case handling
-- Created: 2026-01-31

BEGIN;

-- ============================================================
-- PART 1: CORE TABLES
-- ============================================================

-- 1. Project Items (Core Identity)
CREATE TABLE IF NOT EXISTS project_items (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,

  -- Hierarchy (for bulk purchases, item splitting)
  parent_item_id UUID REFERENCES project_items(id) ON DELETE SET NULL,
  is_bulk_purchase BOOLEAN DEFAULT false,

  -- Basic Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('planning', 'execution')),
  category VARCHAR(100),

  -- Current State (denormalized for performance)
  current_status VARCHAR(50) DEFAULT 'estimation' NOT NULL,
  current_estimate_version INTEGER DEFAULT 1,
  current_estimated_cost DECIMAL(15,2),
  current_contract_amount DECIMAL(15,2),

  -- Phase Links
  active_tender_id UUID REFERENCES tenders(id) ON DELETE SET NULL,
  awarded_tender_id UUID REFERENCES tenders(id) ON DELETE SET NULL,
  winner_professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,

  -- Optimistic Locking
  version INTEGER DEFAULT 1 NOT NULL,

  -- Metadata (flexible storage for custom fields)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit Trail
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_by VARCHAR(255),
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_by VARCHAR(255),

  -- Soft Delete
  deleted_at TIMESTAMP,
  deleted_by VARCHAR(255),
  deletion_reason TEXT,

  -- Constraints
  CONSTRAINT valid_status CHECK (current_status IN (
    'estimation', 'tender_draft', 'tender_open', 'tender_closed',
    'tender_cancelled', 'contracted', 'in_progress', 'completed', 'cancelled'
  )),
  CONSTRAINT positive_costs CHECK (
    (current_estimated_cost IS NULL OR current_estimated_cost >= 0) AND
    (current_contract_amount IS NULL OR current_contract_amount >= 0)
  ),
  CONSTRAINT no_circular_parent CHECK (parent_item_id != id)
);

-- Indexes for project_items
CREATE INDEX IF NOT EXISTS idx_project_items_project_id ON project_items(project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_project_items_milestone_id ON project_items(milestone_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_project_items_status ON project_items(current_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_project_items_type ON project_items(type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_project_items_parent ON project_items(parent_item_id) WHERE parent_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_project_items_tender ON project_items(active_tender_id) WHERE active_tender_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_project_items_deleted ON project_items(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_project_items_metadata ON project_items USING gin(metadata);

-- Comments for project_items
COMMENT ON TABLE project_items IS 'Core project items (work packages) - immutable identity with full audit trail';
COMMENT ON COLUMN project_items.parent_item_id IS 'For bulk purchases or split items - enables hierarchical relationships';
COMMENT ON COLUMN project_items.version IS 'Optimistic locking - increment on each update to prevent concurrent edit conflicts';
COMMENT ON COLUMN project_items.current_estimate_version IS 'Points to latest estimate version for quick lookups';
COMMENT ON COLUMN project_items.metadata IS 'Flexible JSONB storage for custom fields without schema changes';

-- ============================================================

-- 2. Project Item Estimates (Versioned Estimates)
CREATE TABLE IF NOT EXISTS project_item_estimates (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_item_id UUID NOT NULL REFERENCES project_items(id) ON DELETE CASCADE,

  -- Version Control
  version INTEGER NOT NULL,
  is_current BOOLEAN DEFAULT false,

  -- Estimation Data
  estimated_cost DECIMAL(15,2) NOT NULL CHECK (estimated_cost >= 0),
  vat_rate DECIMAL(5,2) DEFAULT 17.00 NOT NULL CHECK (vat_rate >= 0 AND vat_rate <= 100),
  total_with_vat DECIMAL(15,2) GENERATED ALWAYS AS (
    ROUND(estimated_cost * (1 + vat_rate / 100), 2)
  ) STORED,

  -- Supporting Info
  estimated_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  revision_reason TEXT,

  -- Metadata
  estimate_breakdown JSONB DEFAULT '{}'::jsonb,

  -- External References
  external_estimate_id VARCHAR(255),

  -- Audit
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  superseded_at TIMESTAMP,
  superseded_by VARCHAR(255),

  -- Constraints
  CONSTRAINT unique_version_per_item UNIQUE (project_item_id, version),
  CONSTRAINT one_current_per_item UNIQUE (project_item_id, is_current) WHERE is_current = true
);

-- Indexes for estimates
CREATE INDEX IF NOT EXISTS idx_estimates_item_id ON project_item_estimates(project_item_id);
CREATE INDEX IF NOT EXISTS idx_estimates_current ON project_item_estimates(project_item_id, is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_estimates_version ON project_item_estimates(project_item_id, version);

-- Comments for estimates
COMMENT ON TABLE project_item_estimates IS 'Versioned estimate history - tracks all cost revisions with full audit trail';
COMMENT ON COLUMN project_item_estimates.is_current IS 'Only one estimate per item can be current - enforced by unique constraint';
COMMENT ON COLUMN project_item_estimates.revision_reason IS 'Why was estimate revised? (market changes, scope change, error correction, etc.)';
COMMENT ON COLUMN project_item_estimates.estimate_breakdown IS 'Optional detailed breakdown stored as JSONB (materials, labor, equipment, etc.)';

-- ============================================================

-- 3. Project Item Status History (Audit Trail)
CREATE TABLE IF NOT EXISTS project_item_status_history (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_item_id UUID NOT NULL REFERENCES project_items(id) ON DELETE CASCADE,

  -- Status Transition
  from_status VARCHAR(50),
  to_status VARCHAR(50) NOT NULL,

  -- Context
  transition_reason TEXT,
  notes TEXT,

  -- Related Entities (what triggered this change)
  related_tender_id UUID REFERENCES tenders(id),
  related_change_order_id UUID,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit
  changed_at TIMESTAMP DEFAULT NOW() NOT NULL,
  changed_by VARCHAR(255) NOT NULL,

  -- Constraints
  CONSTRAINT valid_transition CHECK (to_status IN (
    'estimation', 'tender_draft', 'tender_open', 'tender_closed',
    'tender_cancelled', 'contracted', 'in_progress', 'completed', 'cancelled'
  ))
);

-- Indexes for status history
CREATE INDEX IF NOT EXISTS idx_status_history_item_id ON project_item_status_history(project_item_id);
CREATE INDEX IF NOT EXISTS idx_status_history_changed_at ON project_item_status_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_status_history_to_status ON project_item_status_history(to_status);

-- Comments for status history
COMMENT ON TABLE project_item_status_history IS 'Complete audit trail of all status changes with context and relationships';
COMMENT ON COLUMN project_item_status_history.from_status IS 'NULL for initial status (item creation)';
COMMENT ON COLUMN project_item_status_history.related_tender_id IS 'Tender that triggered this status change (if applicable)';

-- ============================================================

-- 4. Project Item Change Orders (Contract Amendments)
CREATE TABLE IF NOT EXISTS project_item_change_orders (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_item_id UUID NOT NULL REFERENCES project_items(id) ON DELETE RESTRICT,

  -- Change Order Info
  change_order_number VARCHAR(50) NOT NULL,
  change_type VARCHAR(50) NOT NULL CHECK (change_type IN (
    'scope_increase', 'scope_decrease', 'specification_change',
    'timeline_change', 'cost_adjustment', 'other'
  )),

  -- Description
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  justification TEXT,

  -- Financial Impact
  original_amount DECIMAL(15,2) NOT NULL,
  change_amount DECIMAL(15,2) NOT NULL,
  new_total DECIMAL(15,2) NOT NULL,

  -- Status
  status VARCHAR(50) DEFAULT 'draft' NOT NULL CHECK (status IN (
    'draft', 'pending_approval', 'approved', 'rejected', 'implemented'
  )),

  -- Approval Workflow
  requested_by VARCHAR(255) NOT NULL,
  requested_at TIMESTAMP DEFAULT NOW() NOT NULL,
  approved_by VARCHAR(255),
  approved_at TIMESTAMP,
  rejection_reason TEXT,

  -- Implementation
  implemented_at TIMESTAMP,
  implemented_by VARCHAR(255),

  -- Attachments
  supporting_documents JSONB DEFAULT '[]'::jsonb,

  -- Audit
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT unique_change_order_number UNIQUE (project_item_id, change_order_number),
  CONSTRAINT valid_amount_change CHECK (new_total = original_amount + change_amount)
);

-- Indexes for change orders
CREATE INDEX IF NOT EXISTS idx_change_orders_item_id ON project_item_change_orders(project_item_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_status ON project_item_change_orders(status);
CREATE INDEX IF NOT EXISTS idx_change_orders_requested_at ON project_item_change_orders(requested_at DESC);

-- Comments for change orders
COMMENT ON TABLE project_item_change_orders IS 'Contract amendments and scope changes after award with full approval workflow';
COMMENT ON COLUMN project_item_change_orders.change_amount IS 'Positive for increase, negative for decrease';
COMMENT ON COLUMN project_item_change_orders.supporting_documents IS 'Array of document metadata (filename, url, uploaded_at)';

-- ============================================================
-- PART 2: UPDATE EXISTING TABLES
-- ============================================================

-- Update tenders table
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS project_item_id UUID REFERENCES project_items(id) ON DELETE RESTRICT;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS previous_tender_id UUID REFERENCES tenders(id);
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS retry_reason TEXT;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);

-- Indexes for tenders
CREATE INDEX IF NOT EXISTS idx_tenders_project_item ON tenders(project_item_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenders_attempt ON tenders(project_item_id, attempt_number);
CREATE INDEX IF NOT EXISTS idx_tenders_previous ON tenders(previous_tender_id) WHERE previous_tender_id IS NOT NULL;

-- Comments for tenders
COMMENT ON COLUMN tenders.project_item_id IS 'Link to source project item';
COMMENT ON COLUMN tenders.attempt_number IS 'Tender retry tracking (1st attempt, 2nd attempt, etc.)';
COMMENT ON COLUMN tenders.previous_tender_id IS 'Links to previous failed tender if this is a retry';

-- ============================================================

-- Update tender_participants for enhanced quote tracking
ALTER TABLE tender_participants ADD COLUMN IF NOT EXISTS quote_amount DECIMAL(15,2);
ALTER TABLE tender_participants ADD COLUMN IF NOT EXISTS quote_submitted_at TIMESTAMP;
ALTER TABLE tender_participants ADD COLUMN IF NOT EXISTS quote_file_url TEXT;
ALTER TABLE tender_participants ADD COLUMN IF NOT EXISTS is_late_quote BOOLEAN DEFAULT false;
ALTER TABLE tender_participants ADD COLUMN IF NOT EXISTS accepted_despite_late BOOLEAN DEFAULT false;
ALTER TABLE tender_participants ADD COLUMN IF NOT EXISTS late_acceptance_reason TEXT;
ALTER TABLE tender_participants ADD COLUMN IF NOT EXISTS quote_withdrawn BOOLEAN DEFAULT false;
ALTER TABLE tender_participants ADD COLUMN IF NOT EXISTS withdrawal_reason TEXT;
ALTER TABLE tender_participants ADD COLUMN IF NOT EXISTS withdrawal_date TIMESTAMP;

-- Comments for tender_participants
COMMENT ON COLUMN tender_participants.is_late_quote IS 'Quote received after deadline';
COMMENT ON COLUMN tender_participants.accepted_despite_late IS 'Manager decided to accept late quote';
COMMENT ON COLUMN tender_participants.quote_withdrawn IS 'Contractor withdrew their quote after submission';

-- ============================================================

-- Update budget_items table
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS project_item_id UUID REFERENCES project_items(id) ON DELETE RESTRICT;
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS original_contract_amount DECIMAL(15,2);
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS total_change_orders DECIMAL(15,2) DEFAULT 0;
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS current_contract_amount DECIMAL(15,2);

-- Add constraint for budget_items
ALTER TABLE budget_items DROP CONSTRAINT IF EXISTS valid_contract_amounts;
ALTER TABLE budget_items ADD CONSTRAINT valid_contract_amounts CHECK (
  current_contract_amount = original_contract_amount + COALESCE(total_change_orders, 0)
);

-- Index for budget_items
CREATE INDEX IF NOT EXISTS idx_budget_items_project_item ON budget_items(project_item_id);

-- Comments for budget_items
COMMENT ON COLUMN budget_items.project_item_id IS 'Link to source project item';
COMMENT ON COLUMN budget_items.original_contract_amount IS 'Initial contracted amount (before any change orders)';
COMMENT ON COLUMN budget_items.total_change_orders IS 'Sum of all approved change order amounts';
COMMENT ON COLUMN budget_items.current_contract_amount IS 'Original + change orders (computed)';

-- ============================================================
-- PART 3: TRIGGERS & FUNCTIONS
-- ============================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for project_items
DROP TRIGGER IF EXISTS update_project_items_updated_at ON project_items;
CREATE TRIGGER update_project_items_updated_at
  BEFORE UPDATE ON project_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for change_orders
DROP TRIGGER IF EXISTS update_change_orders_updated_at ON project_item_change_orders;
CREATE TRIGGER update_change_orders_updated_at
  BEFORE UPDATE ON project_item_change_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================

-- Function: Log status changes automatically
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.current_status != NEW.current_status) THEN
    INSERT INTO project_item_status_history (
      project_item_id,
      from_status,
      to_status,
      changed_by,
      changed_at
    ) VALUES (
      NEW.id,
      OLD.current_status,
      NEW.current_status,
      NEW.updated_by,
      NOW()
    );
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO project_item_status_history (
      project_item_id,
      from_status,
      to_status,
      changed_by,
      changed_at
    ) VALUES (
      NEW.id,
      NULL,
      NEW.current_status,
      NEW.created_by,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for status logging
DROP TRIGGER IF EXISTS log_project_item_status_changes ON project_items;
CREATE TRIGGER log_project_item_status_changes
  AFTER INSERT OR UPDATE ON project_items
  FOR EACH ROW
  EXECUTE FUNCTION log_status_change();

-- ============================================================

-- Function: Increment version on update (optimistic locking)
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    NEW.version = OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for version increment
DROP TRIGGER IF EXISTS increment_project_item_version ON project_items;
CREATE TRIGGER increment_project_item_version
  BEFORE UPDATE ON project_items
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

-- ============================================================

-- Function: Prevent hard delete if referenced
CREATE OR REPLACE FUNCTION prevent_delete_if_referenced()
RETURNS TRIGGER AS $$
DECLARE
  tender_count INTEGER;
  budget_count INTEGER;
BEGIN
  -- Check for tenders
  SELECT COUNT(*) INTO tender_count
  FROM tenders
  WHERE project_item_id = OLD.id AND deleted_at IS NULL;

  -- Check for budget items
  SELECT COUNT(*) INTO budget_count
  FROM budget_items
  WHERE project_item_id = OLD.id;

  IF tender_count > 0 OR budget_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete project item: % active tenders, % budget items exist. Use soft delete instead.',
      tender_count, budget_count;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent hard delete
DROP TRIGGER IF EXISTS prevent_project_item_hard_delete ON project_items;
CREATE TRIGGER prevent_project_item_hard_delete
  BEFORE DELETE ON project_items
  FOR EACH ROW
  EXECUTE FUNCTION prevent_delete_if_referenced();

-- ============================================================
-- PART 4: USEFUL VIEWS
-- ============================================================

-- View: Current Estimates
CREATE OR REPLACE VIEW vw_project_items_with_current_estimate AS
SELECT
  pi.*,
  e.estimated_cost,
  e.vat_rate,
  e.total_with_vat,
  e.estimated_date,
  e.notes AS estimate_notes,
  e.version AS estimate_version,
  e.created_at AS estimate_created_at,
  e.created_by AS estimate_created_by
FROM project_items pi
LEFT JOIN project_item_estimates e ON pi.id = e.project_item_id AND e.is_current = true
WHERE pi.deleted_at IS NULL;

COMMENT ON VIEW vw_project_items_with_current_estimate IS 'Project items with their current estimate (most recent version)';

-- ============================================================

-- View: Item Lifecycle Summary
CREATE OR REPLACE VIEW vw_project_item_lifecycle AS
SELECT
  pi.id,
  pi.project_id,
  pi.name,
  pi.type,
  pi.current_status,

  -- Estimation
  e.estimated_cost,
  e.total_with_vat AS estimated_total_with_vat,
  e.version AS estimate_version,

  -- Tender
  t.id AS tender_id,
  t.tender_name,
  t.status AS tender_status,
  t.due_date AS tender_due_date,
  (SELECT COUNT(*) FROM tender_participants tp WHERE tp.tender_id = t.id) AS quote_count,

  -- Contract
  pi.current_contract_amount,
  pi.winner_professional_id,
  p.name AS winner_name,

  -- Variance
  CASE
    WHEN pi.current_contract_amount IS NOT NULL AND e.total_with_vat IS NOT NULL
    THEN pi.current_contract_amount - e.total_with_vat
    ELSE NULL
  END AS variance_amount,

  CASE
    WHEN pi.current_contract_amount IS NOT NULL AND e.total_with_vat IS NOT NULL AND e.total_with_vat > 0
    THEN ROUND(((pi.current_contract_amount - e.total_with_vat) / e.total_with_vat) * 100, 2)
    ELSE NULL
  END AS variance_percent,

  -- Dates
  pi.created_at,
  pi.updated_at

FROM project_items pi
LEFT JOIN project_item_estimates e ON pi.id = e.project_item_id AND e.is_current = true
LEFT JOIN tenders t ON pi.active_tender_id = t.id
LEFT JOIN professionals p ON pi.winner_professional_id = p.id
WHERE pi.deleted_at IS NULL;

COMMENT ON VIEW vw_project_item_lifecycle IS 'Complete item lifecycle from estimate to contract with variance tracking';

-- ============================================================

-- View: Change Order Summary
CREATE OR REPLACE VIEW vw_item_change_order_summary AS
SELECT
  project_item_id,
  COUNT(*) AS total_change_orders,
  COUNT(*) FILTER (WHERE status = 'approved') AS approved_count,
  SUM(change_amount) FILTER (WHERE status = 'approved') AS total_approved_changes,
  MAX(change_order_number) AS latest_change_order
FROM project_item_change_orders
GROUP BY project_item_id;

COMMENT ON VIEW vw_item_change_order_summary IS 'Summary of change orders per item';

-- ============================================================
-- PART 5: HELPER FUNCTIONS
-- ============================================================

-- Function: Get Item Full History
CREATE OR REPLACE FUNCTION get_item_full_history(item_id UUID)
RETURNS TABLE (
  event_type VARCHAR,
  event_date TIMESTAMP,
  event_by VARCHAR,
  event_details TEXT
) AS $$
BEGIN
  RETURN QUERY

  -- Creation
  SELECT
    'CREATED'::VARCHAR,
    created_at,
    created_by,
    'Item created: ' || name
  FROM project_items
  WHERE id = item_id

  UNION ALL

  -- Estimate changes
  SELECT
    'ESTIMATE_REVISED'::VARCHAR,
    created_at,
    created_by,
    'Estimate v' || version || ': ₪' || estimated_cost || ' - ' || COALESCE(revision_reason, 'Initial estimate')
  FROM project_item_estimates
  WHERE project_item_id = item_id

  UNION ALL

  -- Status changes
  SELECT
    'STATUS_CHANGE'::VARCHAR,
    changed_at,
    changed_by,
    COALESCE(from_status, 'initial') || ' → ' || to_status || COALESCE(' (' || transition_reason || ')', '')
  FROM project_item_status_history
  WHERE project_item_id = item_id

  UNION ALL

  -- Change orders
  SELECT
    'CHANGE_ORDER'::VARCHAR,
    requested_at,
    requested_by,
    'CO #' || change_order_number || ': ' || title || ' (₪' || change_amount || ')'
  FROM project_item_change_orders
  WHERE project_item_id = item_id

  ORDER BY event_date DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_item_full_history IS 'Returns complete chronological history of an item with all events';

COMMIT;
