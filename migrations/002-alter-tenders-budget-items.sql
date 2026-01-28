-- Migration 002: Alter Existing Tables
-- Adds estimate integration columns to tenders and budget_items
-- Idempotent: Can be run multiple times safely

BEGIN;

-- ============================================================
-- ALTER TENDERS TABLE
-- ============================================================

-- Add estimate_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenders' AND column_name = 'estimate_id'
  ) THEN
    ALTER TABLE tenders ADD COLUMN estimate_id UUID REFERENCES estimates(id);
  END IF;
END $$;

-- Add bom_file_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenders' AND column_name = 'bom_file_id'
  ) THEN
    ALTER TABLE tenders ADD COLUMN bom_file_id UUID REFERENCES bom_files(id);
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_tenders_estimate ON tenders(estimate_id);
CREATE INDEX IF NOT EXISTS idx_tenders_bom ON tenders(bom_file_id);

-- ============================================================
-- ALTER BUDGET_ITEMS TABLE
-- ============================================================

-- Add estimate_item_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budget_items' AND column_name = 'estimate_item_id'
  ) THEN
    ALTER TABLE budget_items ADD COLUMN estimate_item_id UUID REFERENCES estimate_items(id);
  END IF;
END $$;

-- Add estimate_amount column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budget_items' AND column_name = 'estimate_amount'
  ) THEN
    ALTER TABLE budget_items ADD COLUMN estimate_amount DECIMAL(15,2);
  END IF;
END $$;

-- Add variance_amount column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budget_items' AND column_name = 'variance_amount'
  ) THEN
    ALTER TABLE budget_items ADD COLUMN variance_amount DECIMAL(15,2);
  END IF;
END $$;

-- Add variance_percent column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budget_items' AND column_name = 'variance_percent'
  ) THEN
    ALTER TABLE budget_items ADD COLUMN variance_percent DECIMAL(5,2);
  END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_budget_items_estimate ON budget_items(estimate_item_id);

COMMIT;
