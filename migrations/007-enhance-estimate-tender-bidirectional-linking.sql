-- Migration 007: Enhance Estimate-Tender Bidirectional Linking
-- Adds columns for estimate locking, bidirectional links, and change detection

-- ============================================================
-- PROJECT_ITEM_ESTIMATES: Add locking and change tracking
-- ============================================================

-- Add status column for estimate lifecycle
ALTER TABLE project_item_estimates
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- Add locked timestamp
ALTER TABLE project_item_estimates
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP;

-- Add locked_by user tracking
ALTER TABLE project_item_estimates
ADD COLUMN IF NOT EXISTS locked_by VARCHAR(255);

-- Add locked_reason for audit trail
ALTER TABLE project_item_estimates
ADD COLUMN IF NOT EXISTS locked_reason TEXT;

-- Add exported timestamp
ALTER TABLE project_item_estimates
ADD COLUMN IF NOT EXISTS exported_at TIMESTAMP;

-- Add tender_id for bidirectional link (estimate → tender)
ALTER TABLE project_item_estimates
ADD COLUMN IF NOT EXISTS tender_id UUID REFERENCES tenders(id) ON DELETE SET NULL;

-- ============================================================
-- TENDERS: Add estimate snapshot and change detection
-- ============================================================

-- Add estimate snapshot (JSONB for flexibility)
ALTER TABLE tenders
ADD COLUMN IF NOT EXISTS estimate_snapshot JSONB;

-- Add estimate version tracking
ALTER TABLE tenders
ADD COLUMN IF NOT EXISTS estimate_version INTEGER DEFAULT 1;

-- Add outdated flag
ALTER TABLE tenders
ADD COLUMN IF NOT EXISTS is_estimate_outdated BOOLEAN DEFAULT false;

-- Add last_synced_at timestamp
ALTER TABLE tenders
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;

-- ============================================================
-- PROJECT_ITEMS: Add status for better tracking
-- ============================================================

-- Ensure current_status has proper values
-- Possible values: estimation, exported_to_tender, tender_draft, tender_open,
--                  tender_closed, contracted, in_progress, completed, locked

-- ============================================================
-- INDEXES for performance
-- ============================================================

-- Index for finding estimates by tender
CREATE INDEX IF NOT EXISTS idx_project_item_estimates_tender_id
ON project_item_estimates(tender_id);

-- Index for finding locked estimates
CREATE INDEX IF NOT EXISTS idx_project_item_estimates_locked
ON project_item_estimates(locked_at)
WHERE locked_at IS NOT NULL;

-- Index for finding outdated tenders
CREATE INDEX IF NOT EXISTS idx_tenders_outdated
ON tenders(is_estimate_outdated)
WHERE is_estimate_outdated = true;

-- Index for tender-estimate relationship
CREATE INDEX IF NOT EXISTS idx_tenders_estimate_id
ON tenders(estimate_id);

-- ============================================================
-- COMMENTS for documentation
-- ============================================================

COMMENT ON COLUMN project_item_estimates.status IS 'Lifecycle status: active, exported, locked';
COMMENT ON COLUMN project_item_estimates.locked_at IS 'When estimate was locked (after tender winner selected)';
COMMENT ON COLUMN project_item_estimates.locked_by IS 'User who locked the estimate';
COMMENT ON COLUMN project_item_estimates.locked_reason IS 'Why estimate was locked';
COMMENT ON COLUMN project_item_estimates.exported_at IS 'When estimate was first exported to tender';
COMMENT ON COLUMN project_item_estimates.tender_id IS 'Bidirectional link: estimate → tender (1:1)';

COMMENT ON COLUMN tenders.estimate_snapshot IS 'Snapshot of estimate at time of export (for comparison)';
COMMENT ON COLUMN tenders.estimate_version IS 'Version number of estimate when last synced';
COMMENT ON COLUMN tenders.is_estimate_outdated IS 'True if source estimate changed after export';
COMMENT ON COLUMN tenders.last_synced_at IS 'Last time tender was synced from estimate';

-- ============================================================
-- DATA MIGRATION: Backfill existing data
-- ============================================================

-- Update existing estimates to 'active' status
UPDATE project_item_estimates
SET status = 'active'
WHERE status IS NULL;

-- Mark estimates as exported if their project_item has active_tender_id
UPDATE project_item_estimates pie
SET
  status = 'exported',
  exported_at = (
    SELECT t.created_at
    FROM tenders t
    WHERE t.project_item_id = pie.project_item_id
    LIMIT 1
  )
FROM project_items pi
WHERE pie.project_item_id = pi.id
  AND pi.active_tender_id IS NOT NULL
  AND pie.version = (
    SELECT MAX(version)
    FROM project_item_estimates
    WHERE project_item_id = pi.id
  );

-- Create estimate snapshots for existing tenders
UPDATE tenders t
SET
  estimate_snapshot = (
    SELECT jsonb_build_object(
      'estimated_cost', pie.estimated_cost,
      'vat_rate', pie.vat_rate,
      'vat_amount', (pie.estimated_cost * pie.vat_rate / 100),
      'total_with_vat', (pie.estimated_cost * (1 + pie.vat_rate / 100)),
      'notes', pie.notes,
      'version', pie.version,
      'created_at', pie.created_at,
      'snapshot_date', NOW()
    )
    FROM project_item_estimates pie
    JOIN project_items pi ON pie.project_item_id = pi.id
    WHERE pi.active_tender_id = t.id
      AND pie.version = (
        SELECT MAX(version)
        FROM project_item_estimates
        WHERE project_item_id = pi.id
      )
    LIMIT 1
  ),
  estimate_version = 1,
  last_synced_at = t.created_at
WHERE t.project_item_id IS NOT NULL
  AND t.estimate_snapshot IS NULL;

-- Link estimates to their tenders (bidirectional)
UPDATE project_item_estimates pie
SET tender_id = pi.active_tender_id
FROM project_items pi
WHERE pie.project_item_id = pi.id
  AND pi.active_tender_id IS NOT NULL
  AND pie.version = (
    SELECT MAX(version)
    FROM project_item_estimates
    WHERE project_item_id = pi.id
  );

-- Lock estimates where tender has winner selected
UPDATE project_item_estimates pie
SET
  status = 'locked',
  locked_at = NOW(),
  locked_by = 'system',
  locked_reason = 'Tender winner selected - estimate locked automatically'
FROM project_items pi
JOIN tenders t ON pi.active_tender_id = t.id
WHERE pie.project_item_id = pi.id
  AND t.status = 'WinnerSelected'
  AND pie.version = (
    SELECT MAX(version)
    FROM project_item_estimates
    WHERE project_item_id = pi.id
  );
