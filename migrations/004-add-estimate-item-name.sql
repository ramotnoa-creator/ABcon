-- Migration: Add name field to estimate_items
-- Date: 2026-01-30
-- Description: Add REQUIRED name field and make description optional

-- Step 1: Add name column (nullable first for existing data)
ALTER TABLE estimate_items ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Step 2: Update existing rows - copy description to name if name is empty
UPDATE estimate_items SET name = description WHERE name IS NULL OR name = '';

-- Step 3: Make name NOT NULL (now safe since all rows have values)
ALTER TABLE estimate_items ALTER COLUMN name SET NOT NULL;

-- Step 4: Make description nullable (was previously required)
ALTER TABLE estimate_items ALTER COLUMN description DROP NOT NULL;

-- Step 5: Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_estimate_items_name ON estimate_items(name);

-- Migration complete
-- IMPORTANT: After this migration:
-- - name is REQUIRED (NOT NULL)
-- - description is OPTIONAL (can be NULL)
