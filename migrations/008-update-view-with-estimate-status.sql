-- Migration 008: Update view to include estimate status and locking fields
-- This migration updates vw_project_items_with_current_estimate to include
-- the new status tracking fields added in migration 007

-- ============================================================
-- Update View: Add Status and Locking Fields
-- ============================================================

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
  e.created_by AS estimate_created_by,
  -- NEW: Status and locking fields
  e.status AS estimate_status,
  e.locked_at AS estimate_locked_at,
  e.locked_by AS estimate_locked_by,
  e.locked_reason AS estimate_locked_reason,
  e.exported_at AS estimate_exported_at,
  e.tender_id AS estimate_tender_id
FROM project_items pi
LEFT JOIN project_item_estimates e ON pi.id = e.project_item_id AND e.is_current = true
WHERE pi.deleted_at IS NULL;

COMMENT ON VIEW vw_project_items_with_current_estimate IS 'Project items with their current estimate (most recent version) including status and locking information';

-- ============================================================
-- Verification Query
-- ============================================================

-- Test that the view now includes status fields
SELECT
  name,
  estimate_status,
  estimate_locked_at,
  estimate_tender_id
FROM vw_project_items_with_current_estimate
LIMIT 5;
