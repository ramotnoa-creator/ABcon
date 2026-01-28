-- Rollback Migration 001: Drop estimates schema
-- Removes all estimate-related tables
-- WARNING: This will delete all estimate data

BEGIN;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS bom_files CASCADE;
DROP TABLE IF EXISTS estimate_items CASCADE;
DROP TABLE IF EXISTS estimates CASCADE;

COMMIT;
