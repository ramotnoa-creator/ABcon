/**
 * Project Item Estimates Service
 * Handles versioned cost estimates for project items
 */

import { executeQuery, executeQuerySingle } from '../lib/neon';

export interface ProjectItemEstimate {
  id: string;
  project_item_id: string;
  version: number;
  is_current: boolean;
  estimated_cost: number;
  vat_rate: number;
  total_with_vat: number;
  estimated_date: string;
  notes?: string;
  revision_reason?: string;
  estimate_breakdown?: Record<string, any>;
  external_estimate_id?: string;
  created_at: string;
  created_by: string;
  superseded_at?: string;
  superseded_by?: string;
  // New fields for Phase 1
  status?: 'active' | 'exported' | 'locked';
  locked_at?: string;
  locked_by?: string;
  locked_reason?: string;
  exported_at?: string;
  tender_id?: string;
}

export interface CreateEstimateInput {
  project_item_id: string;
  estimated_cost: number;
  vat_rate?: number;
  estimated_date?: string;
  notes?: string;
  revision_reason?: string;
  estimate_breakdown?: Record<string, any>;
  created_by: string;
}

export async function createEstimate(input: CreateEstimateInput): Promise<ProjectItemEstimate> {
  try {
    // Get next version number
    const versionData = await executeQuerySingle<{ max_version: number }>(
      `SELECT COALESCE(MAX(version), 0) as max_version
       FROM project_item_estimates
       WHERE project_item_id = $1`,
      [input.project_item_id]
    );

    const nextVersion = (versionData?.max_version || 0) + 1;

    // Mark all previous estimates as not current
    await executeQuery(
      `UPDATE project_item_estimates
       SET is_current = false, superseded_at = NOW(), superseded_by = $2
       WHERE project_item_id = $1 AND is_current = true`,
      [input.project_item_id, input.created_by]
    );

    // Create new estimate
    const data = await executeQuerySingle<Record<string, unknown>>(
      `INSERT INTO project_item_estimates (
        project_item_id, version, is_current, estimated_cost, vat_rate,
        estimated_date, notes, revision_reason, estimate_breakdown, created_by
      ) VALUES ($1, $2, true, $3, $4, $5, $6, $7, $8::jsonb, $9)
      RETURNING *`,
      [
        input.project_item_id,
        nextVersion,
        input.estimated_cost,
        input.vat_rate || 17.00,
        input.estimated_date || null,
        input.notes || null,
        input.revision_reason || null,
        input.estimate_breakdown ? JSON.stringify(input.estimate_breakdown) : null,
        input.created_by,
      ]
    );

    if (!data) throw new Error('Failed to create estimate');

    // Update project_item current fields
    await executeQuery(
      `UPDATE project_items
       SET current_estimate_version = $2,
           current_estimated_cost = $3
       WHERE id = $1`,
      [input.project_item_id, nextVersion, input.estimated_cost]
    );

    return transformFromDB(data);
  } catch (error) {
    console.error('Error creating estimate:', error);
    throw error;
  }
}

export async function getCurrentEstimate(projectItemId: string): Promise<ProjectItemEstimate | null> {
  try {
    const data = await executeQuerySingle<Record<string, unknown>>(
      `SELECT * FROM project_item_estimates
       WHERE project_item_id = $1 AND is_current = true`,
      [projectItemId]
    );

    return data ? transformFromDB(data) : null;
  } catch (error) {
    console.error('Error fetching current estimate:', error);
    throw error;
  }
}

export async function getEstimateHistory(projectItemId: string): Promise<ProjectItemEstimate[]> {
  try {
    const data = await executeQuery<Record<string, unknown>>(
      `SELECT * FROM project_item_estimates
       WHERE project_item_id = $1
       ORDER BY version DESC`,
      [projectItemId]
    );

    return (data || []).map(transformFromDB);
  } catch (error) {
    console.error('Error fetching estimate history:', error);
    throw error;
  }
}

function transformFromDB(dbEstimate: any): ProjectItemEstimate {
  return {
    id: dbEstimate.id,
    project_item_id: dbEstimate.project_item_id,
    version: dbEstimate.version,
    is_current: dbEstimate.is_current,
    estimated_cost: parseFloat(dbEstimate.estimated_cost),
    vat_rate: parseFloat(dbEstimate.vat_rate),
    total_with_vat: parseFloat(dbEstimate.total_with_vat),
    estimated_date: dbEstimate.estimated_date,
    notes: dbEstimate.notes || undefined,
    revision_reason: dbEstimate.revision_reason || undefined,
    estimate_breakdown: dbEstimate.estimate_breakdown || undefined,
    external_estimate_id: dbEstimate.external_estimate_id || undefined,
    created_at: dbEstimate.created_at,
    created_by: dbEstimate.created_by,
    superseded_at: dbEstimate.superseded_at || undefined,
    superseded_by: dbEstimate.superseded_by || undefined,
    // New fields
    status: dbEstimate.status || undefined,
    locked_at: dbEstimate.locked_at || undefined,
    locked_by: dbEstimate.locked_by || undefined,
    locked_reason: dbEstimate.locked_reason || undefined,
    exported_at: dbEstimate.exported_at || undefined,
    tender_id: dbEstimate.tender_id || undefined,
  };
}

// ============================================================
// PHASE 1: ESTIMATE LOCKING & CHANGE DETECTION
// ============================================================

/**
 * Lock an estimate (called when tender winner is selected)
 */
export async function lockEstimate(
  projectItemId: string,
  lockedBy: string,
  reason: string
): Promise<void> {
  try {
    await executeQuery(
      `UPDATE project_item_estimates
       SET
         status = 'locked',
         locked_at = NOW(),
         locked_by = $2,
         locked_reason = $3
       WHERE project_item_id = $1
         AND is_current = true`,
      [projectItemId, lockedBy, reason]
    );
  } catch (error) {
    console.error('Error locking estimate:', error);
    throw error;
  }
}

/**
 * Check if estimate is locked
 */
export async function isEstimateLocked(projectItemId: string): Promise<boolean> {
  try {
    const data = await executeQuerySingle<{ status: string }>(
      `SELECT status FROM project_item_estimates
       WHERE project_item_id = $1
         AND is_current = true`,
      [projectItemId]
    );

    return data?.status === 'locked';
  } catch (error) {
    console.error('Error checking estimate lock:', error);
    return false;
  }
}

/**
 * Mark estimate as exported to tender
 */
export async function markEstimateAsExported(
  projectItemId: string,
  tenderId: string
): Promise<void> {
  try {
    await executeQuery(
      `UPDATE project_item_estimates
       SET
         status = 'exported',
         exported_at = NOW(),
         tender_id = $2
       WHERE project_item_id = $1
         AND is_current = true`,
      [projectItemId, tenderId]
    );
  } catch (error) {
    console.error('Error marking estimate as exported:', error);
    throw error;
  }
}

/**
 * Mark tender as outdated when estimate changes
 */
export async function markTenderAsOutdated(tenderId: string): Promise<void> {
  try {
    await executeQuery(
      `UPDATE tenders
       SET is_estimate_outdated = true
       WHERE id = $1`,
      [tenderId]
    );
  } catch (error) {
    console.error('Error marking tender as outdated:', error);
    throw error;
  }
}
