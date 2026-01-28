-- Rollback Migration 002: Remove estimate integration columns
-- Removes columns added to tenders and budget_items tables

BEGIN;

-- ============================================================
-- ROLLBACK BUDGET_ITEMS ALTERATIONS
-- ============================================================

-- Drop index
DROP INDEX IF EXISTS idx_budget_items_estimate;

-- Drop columns
ALTER TABLE budget_items DROP COLUMN IF EXISTS estimate_item_id;
ALTER TABLE budget_items DROP COLUMN IF EXISTS estimate_amount;
ALTER TABLE budget_items DROP COLUMN IF EXISTS variance_amount;
ALTER TABLE budget_items DROP COLUMN IF EXISTS variance_percent;

-- ============================================================
-- ROLLBACK TENDERS ALTERATIONS
-- ============================================================

-- Drop indexes
DROP INDEX IF EXISTS idx_tenders_estimate;
DROP INDEX IF EXISTS idx_tenders_bom;

-- Drop columns
ALTER TABLE tenders DROP COLUMN IF EXISTS estimate_id;
ALTER TABLE tenders DROP COLUMN IF EXISTS bom_file_id;

COMMIT;
