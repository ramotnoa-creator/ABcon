-- Migration 010: Add 'agra' (אגרה) category to cost_items
-- Agra = municipal fees/levies - fixed costs that skip the tender workflow

-- Drop and recreate the CHECK constraint to include 'agra'
ALTER TABLE cost_items DROP CONSTRAINT IF EXISTS cost_items_category_check;
ALTER TABLE cost_items ADD CONSTRAINT cost_items_category_check
  CHECK (category IN ('consultant', 'supplier', 'contractor', 'agra'));
