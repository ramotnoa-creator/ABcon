-- Migration 003: Enhance Estimate-Tender Tracking
-- Adds fields for 1:1 relationship, status tracking, and change detection
-- Implements estimate locking and tender snapshot functionality
-- Idempotent: Can be run multiple times safely

BEGIN;

-- ============================================================
-- ALTER ESTIMATES TABLE
-- ============================================================

-- Add tender_id column for 1:1 relationship (estimate → tender)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'estimates' AND column_name = 'tender_id'
  ) THEN
    ALTER TABLE estimates ADD COLUMN tender_id UUID REFERENCES tenders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add exported_at timestamp to track when estimate was exported
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'estimates' AND column_name = 'exported_at'
  ) THEN
    ALTER TABLE estimates ADD COLUMN exported_at TIMESTAMP;
  END IF;
END $$;

-- Add locked_at timestamp to track when estimate was locked (after winner selection)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'estimates' AND column_name = 'locked_at'
  ) THEN
    ALTER TABLE estimates ADD COLUMN locked_at TIMESTAMP;
  END IF;
END $$;

-- Update status check constraint to include 'locked' status
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'estimates' AND constraint_name = 'estimates_status_check'
  ) THEN
    ALTER TABLE estimates DROP CONSTRAINT estimates_status_check;
  END IF;

  -- Add new constraint with 'locked' status
  ALTER TABLE estimates ADD CONSTRAINT estimates_status_check
    CHECK (status IN ('draft', 'active', 'exported_to_tender', 'locked'));
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_estimates_tender ON estimates(tender_id);
CREATE INDEX IF NOT EXISTS idx_estimates_status_exported ON estimates(status) WHERE status = 'exported_to_tender';
CREATE INDEX IF NOT EXISTS idx_estimates_locked ON estimates(locked_at) WHERE locked_at IS NOT NULL;

-- ============================================================
-- ALTER TENDERS TABLE
-- ============================================================

-- Add estimate_snapshot column to store estimate data at time of export
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenders' AND column_name = 'estimate_snapshot'
  ) THEN
    ALTER TABLE tenders ADD COLUMN estimate_snapshot JSONB;
  END IF;
END $$;

-- Add estimate_version to track changes to estimate
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenders' AND column_name = 'estimate_version'
  ) THEN
    ALTER TABLE tenders ADD COLUMN estimate_version INTEGER DEFAULT 1;
  END IF;
END $$;

-- Add is_estimate_outdated flag to detect when source estimate has changed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenders' AND column_name = 'is_estimate_outdated'
  ) THEN
    ALTER TABLE tenders ADD COLUMN is_estimate_outdated BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Create index for outdated tenders
CREATE INDEX IF NOT EXISTS idx_tenders_outdated ON tenders(is_estimate_outdated) WHERE is_estimate_outdated = TRUE;

-- ============================================================
-- ALTER BUDGET_ITEMS TABLE
-- ============================================================

-- Add source_estimate_id to complete the traceability chain
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budget_items' AND column_name = 'source_estimate_id'
  ) THEN
    ALTER TABLE budget_items ADD COLUMN source_estimate_id UUID REFERENCES estimates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_budget_items_source_estimate ON budget_items(source_estimate_id);

-- ============================================================
-- DATA MIGRATION: BACKFILL EXISTING DATA
-- ============================================================

-- Backfill tender_id for estimates (1:1 relationship)
-- If multiple tenders exist for one estimate, take the most recent one
DO $$
BEGIN
  UPDATE estimates e
  SET
    tender_id = (
      SELECT t.id
      FROM tenders t
      WHERE t.estimate_id = e.id
      ORDER BY t.created_at DESC
      LIMIT 1
    ),
    exported_at = (
      SELECT t.created_at
      FROM tenders t
      WHERE t.estimate_id = e.id
      ORDER BY t.created_at DESC
      LIMIT 1
    )
  WHERE EXISTS (
    SELECT 1 FROM tenders t WHERE t.estimate_id = e.id
  );
END $$;

-- Lock estimates where tender has winner selected
DO $$
BEGIN
  UPDATE estimates e
  SET
    status = 'locked',
    locked_at = NOW()
  FROM tenders t
  WHERE e.tender_id = t.id
    AND t.status = 'WinnerSelected'
    AND e.status != 'locked';
END $$;

-- Create estimate snapshots for existing tenders
DO $$
BEGIN
  UPDATE tenders t
  SET estimate_snapshot = (
    SELECT jsonb_build_object(
      'estimate', row_to_json(e.*),
      'items', COALESCE(
        (
          SELECT jsonb_agg(row_to_json(ei.*) ORDER BY ei.order_index)
          FROM estimate_items ei
          WHERE ei.estimate_id = e.id
        ),
        '[]'::jsonb
      ),
      'snapshot_date', NOW()
    )
    FROM estimates e
    WHERE e.id = t.estimate_id
  )
  WHERE t.estimate_id IS NOT NULL
    AND t.estimate_snapshot IS NULL;
END $$;

-- Backfill source_estimate_id for budget items
DO $$
BEGIN
  UPDATE budget_items bi
  SET source_estimate_id = t.estimate_id
  FROM tenders t
  WHERE bi.tender_id = t.id
    AND t.estimate_id IS NOT NULL
    AND bi.source_estimate_id IS NULL;
END $$;

COMMIT;

-- ============================================================
-- VERIFICATION QUERIES (run separately to check migration)
-- ============================================================

-- Uncomment to verify migration results:

-- SELECT COUNT(*) as estimates_with_tender
-- FROM estimates WHERE tender_id IS NOT NULL;

-- SELECT COUNT(*) as locked_estimates
-- FROM estimates WHERE status = 'locked';

-- SELECT COUNT(*) as tenders_with_snapshot
-- FROM tenders WHERE estimate_snapshot IS NOT NULL;

-- SELECT COUNT(*) as budget_items_with_source
-- FROM budget_items WHERE source_estimate_id IS NOT NULL;
