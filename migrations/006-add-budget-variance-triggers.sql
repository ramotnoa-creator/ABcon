-- Migration 006: Add Budget Variance Auto-Calculation Triggers
-- Purpose: Automatically calculate variance fields when budget items are created/updated
--          and recalculate when linked estimate items change
-- Phase: 05-budget-auto-update
-- Date: 2026-02-01

-- ============================================================
-- TRIGGER 1: Auto-calculate variance on budget item INSERT/UPDATE
-- ============================================================

-- Function to calculate variance fields
CREATE OR REPLACE FUNCTION calculate_budget_variance()
RETURNS TRIGGER AS $$
DECLARE
  estimate_total DECIMAL(15,2);
BEGIN
  -- If estimate_item_id is provided, fetch the estimate amount
  IF NEW.estimate_item_id IS NOT NULL THEN
    SELECT total_with_vat INTO estimate_total
    FROM estimate_items
    WHERE id = NEW.estimate_item_id;

    -- If estimate item found, calculate variance
    IF estimate_total IS NOT NULL THEN
      NEW.estimate_amount := estimate_total;
      NEW.variance_amount := NEW.total_with_vat - estimate_total;

      -- Calculate percentage, avoid division by zero
      IF estimate_total > 0 THEN
        NEW.variance_percent := ((NEW.total_with_vat - estimate_total) / estimate_total) * 100;
      ELSE
        NEW.variance_percent := 0;
      END IF;
    ELSE
      -- Estimate item not found, clear variance fields
      NEW.estimate_amount := NULL;
      NEW.variance_amount := NULL;
      NEW.variance_percent := NULL;
    END IF;
  ELSE
    -- No estimate linked, clear variance fields
    NEW.estimate_amount := NULL;
    NEW.variance_amount := NULL;
    NEW.variance_percent := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS budget_variance_trigger ON budget_items;
CREATE TRIGGER budget_variance_trigger
BEFORE INSERT OR UPDATE OF total_with_vat, estimate_item_id ON budget_items
FOR EACH ROW
EXECUTE FUNCTION calculate_budget_variance();

-- ============================================================
-- TRIGGER 2: Recalculate budget variances when estimate changes
-- ============================================================

-- Function to recalculate budget item variances when estimate changes
CREATE OR REPLACE FUNCTION recalculate_budget_variances_on_estimate_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all budget items linked to this estimate item
  UPDATE budget_items
  SET
    estimate_amount = NEW.total_with_vat,
    variance_amount = total_with_vat - NEW.total_with_vat,
    variance_percent = CASE
      WHEN NEW.total_with_vat > 0 THEN ((total_with_vat - NEW.total_with_vat) / NEW.total_with_vat) * 100
      ELSE 0
    END,
    updated_at = NOW()
  WHERE estimate_item_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS estimate_update_recalc_trigger ON estimate_items;
CREATE TRIGGER estimate_update_recalc_trigger
AFTER UPDATE OF total_with_vat ON estimate_items
FOR EACH ROW
WHEN (OLD.total_with_vat IS DISTINCT FROM NEW.total_with_vat)
EXECUTE FUNCTION recalculate_budget_variances_on_estimate_change();

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================

-- Verify triggers exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'budget_variance_trigger'
  ) AND EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'estimate_update_recalc_trigger'
  ) THEN
    RAISE NOTICE '✓ Migration 006 complete: Variance triggers created successfully';
  ELSE
    RAISE EXCEPTION 'Migration 006 failed: Triggers not created';
  END IF;
END $$;
