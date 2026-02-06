-- Migration 005: Enhance Estimate-Tender Workflow
-- Adds: tender links, email tracking, locking mechanism

-- ============================================================
-- ESTIMATES TABLE - Add tender tracking
-- ============================================================

-- Add tender_id (1:1 relationship - each estimate links to one tender)
ALTER TABLE estimates ADD COLUMN IF NOT EXISTS tender_id UUID REFERENCES tenders(id);

-- Add export tracking
ALTER TABLE estimates ADD COLUMN IF NOT EXISTS exported_at TIMESTAMP;

-- Add locking mechanism (locked when tender sent to professionals)
ALTER TABLE estimates ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP;

-- Update status constraint to include 'locked' status
ALTER TABLE estimates DROP CONSTRAINT IF EXISTS estimates_status_check;
ALTER TABLE estimates ADD CONSTRAINT estimates_status_check
  CHECK (status::text = ANY (ARRAY['draft'::character varying, 'active'::character varying, 'exported_to_tender'::character varying, 'locked'::character varying]::text[]));

-- ============================================================
-- TENDERS TABLE - Add estimate snapshot and tracking
-- ============================================================

-- Add estimate snapshot (stores estimate data at time of export)
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS estimate_snapshot JSONB;

-- Add version tracking for estimate changes
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS estimate_version INTEGER DEFAULT 1;

-- Add flag to track if estimate changed after export
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS is_estimate_outdated BOOLEAN DEFAULT false;

-- ============================================================
-- TENDER_PARTICIPANTS TABLE - Add email tracking
-- ============================================================

-- Add email status tracking
ALTER TABLE tender_participants ADD COLUMN IF NOT EXISTS email_status VARCHAR(20) DEFAULT 'pending';
-- Values: 'pending', 'sent', 'failed', 'bounced', 'error'

-- Add timestamp for when email was sent
ALTER TABLE tender_participants ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP;

-- Add timestamp for when email was successfully delivered
ALTER TABLE tender_participants ADD COLUMN IF NOT EXISTS email_delivered_at TIMESTAMP;

-- Add error message for failed emails
ALTER TABLE tender_participants ADD COLUMN IF NOT EXISTS email_error_message TEXT;

-- Add counter for send attempts
ALTER TABLE tender_participants ADD COLUMN IF NOT EXISTS email_attempts INTEGER DEFAULT 0;

-- ============================================================
-- INDEXES for performance
-- ============================================================

-- Index on estimates.tender_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_estimates_tender_id ON estimates(tender_id);

-- Index on tenders.estimate_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenders_estimate_id ON tenders(estimate_id);

-- Index on tender_participants email status for filtering
CREATE INDEX IF NOT EXISTS idx_tender_participants_email_status ON tender_participants(email_status);

-- ============================================================
-- COMMENTS for documentation
-- ============================================================

COMMENT ON COLUMN estimates.tender_id IS '1:1 link to the tender created from this estimate';
COMMENT ON COLUMN estimates.exported_at IS 'When this estimate was exported to tender';
COMMENT ON COLUMN estimates.locked_at IS 'When this estimate was locked (tender sent to professionals)';
COMMENT ON COLUMN tenders.estimate_snapshot IS 'Snapshot of estimate data at time of export (JSON)';
COMMENT ON COLUMN tenders.estimate_version IS 'Version number tracking estimate changes';
COMMENT ON COLUMN tenders.is_estimate_outdated IS 'True if source estimate changed after tender created';
COMMENT ON COLUMN tender_participants.email_status IS 'Email delivery status: pending, sent, failed, bounced, error';
COMMENT ON COLUMN tender_participants.email_sent_at IS 'When we last attempted to send email';
COMMENT ON COLUMN tender_participants.email_delivered_at IS 'When email was successfully delivered';
COMMENT ON COLUMN tender_participants.email_error_message IS 'Error message if email send failed';
COMMENT ON COLUMN tender_participants.email_attempts IS 'Number of times we tried to send email';
