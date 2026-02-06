-- ============================================================
-- Migration 009: Payment Schedules
-- Creates payment_schedules and schedule_items tables
-- for managing installment payments linked to cost items
-- ============================================================

BEGIN;

-- ============================================================
-- Payment Schedules Table (one per cost item)
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cost_item_id UUID NOT NULL REFERENCES cost_items(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active')),
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE payment_schedules IS 'Payment schedule for a cost item after tender winner selection';

CREATE INDEX IF NOT EXISTS idx_payment_schedules_cost_item ON payment_schedules(cost_item_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_project ON payment_schedules(project_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_status ON payment_schedules(status);

-- ============================================================
-- Schedule Items Table (installments within a schedule)
-- ============================================================

CREATE TABLE IF NOT EXISTS schedule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES payment_schedules(id) ON DELETE CASCADE,
  cost_item_id UUID NOT NULL REFERENCES cost_items(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  description VARCHAR(500) NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  milestone_id UUID,
  milestone_name VARCHAR(255),
  target_date DATE,
  "order" INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'milestone_confirmed', 'invoice_received', 'approved', 'paid')),
  confirmed_by VARCHAR(255),
  confirmed_at TIMESTAMPTZ,
  confirmed_note TEXT,
  attachment_url VARCHAR(1000),
  approved_by VARCHAR(255),
  approved_at TIMESTAMPTZ,
  paid_date DATE,
  paid_amount NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE schedule_items IS 'Individual installment within a payment schedule, optionally linked to a milestone';

CREATE INDEX IF NOT EXISTS idx_schedule_items_schedule ON schedule_items(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_items_cost_item ON schedule_items(cost_item_id);
CREATE INDEX IF NOT EXISTS idx_schedule_items_project ON schedule_items(project_id);
CREATE INDEX IF NOT EXISTS idx_schedule_items_milestone ON schedule_items(milestone_id);
CREATE INDEX IF NOT EXISTS idx_schedule_items_status ON schedule_items(status);

-- ============================================================
-- Auto-update updated_at triggers
-- ============================================================

CREATE OR REPLACE FUNCTION update_payment_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_schedules_updated_at ON payment_schedules;
CREATE TRIGGER trg_payment_schedules_updated_at
  BEFORE UPDATE ON payment_schedules
  FOR EACH ROW EXECUTE FUNCTION update_payment_schedules_updated_at();

CREATE OR REPLACE FUNCTION update_schedule_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_schedule_items_updated_at ON schedule_items;
CREATE TRIGGER trg_schedule_items_updated_at
  BEFORE UPDATE ON schedule_items
  FOR EACH ROW EXECUTE FUNCTION update_schedule_items_updated_at();

COMMIT;
