-- Migration 001: Create Estimates Schema
-- Creates estimates, estimate_items, and bom_files tables
-- Creates indexes for performance
-- Idempotent: Can be run multiple times safely

BEGIN;

-- ============================================================
-- CREATE ESTIMATES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  estimate_type VARCHAR(20) NOT NULL CHECK (estimate_type IN ('planning', 'execution')),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  total_amount DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'exported_to_tender')),
  created_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for estimates table
CREATE INDEX IF NOT EXISTS idx_estimates_project ON estimates(project_id);
CREATE INDEX IF NOT EXISTS idx_estimates_type ON estimates(estimate_type);
CREATE INDEX IF NOT EXISTS idx_estimates_status ON estimates(status);

-- ============================================================
-- CREATE ESTIMATE_ITEMS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS estimate_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  code VARCHAR(50),
  description TEXT NOT NULL,
  category VARCHAR(100),
  subcategory VARCHAR(100),
  unit VARCHAR(50),
  quantity DECIMAL(10,2),
  unit_price DECIMAL(15,2),
  total_price DECIMAL(15,2),
  vat_rate DECIMAL(5,2) DEFAULT 17.00,
  vat_amount DECIMAL(15,2),
  total_with_vat DECIMAL(15,2),
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for estimate_items table
CREATE INDEX IF NOT EXISTS idx_estimate_items_estimate ON estimate_items(estimate_id);
CREATE INDEX IF NOT EXISTS idx_estimate_items_category ON estimate_items(category);

-- ============================================================
-- CREATE BOM_FILES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS bom_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Index for bom_files table
CREATE INDEX IF NOT EXISTS idx_bom_tender ON bom_files(tender_id);

COMMIT;
