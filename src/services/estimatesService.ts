/**
 * Estimates Service - Neon Database API
 * Handles CRUD operations for estimates
 */

import { executeQuery, executeQuerySingle, isDemoMode as isNeonDemoMode } from '../lib/neon';
import type { Estimate, Tender } from '../types';

// Check if we're in demo mode
const isDemoMode = isNeonDemoMode;

// Demo mode storage
const STORAGE_KEY = 'abcon_estimates';

function getEstimatesFromStorage(): Estimate[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveEstimatesToStorage(estimates: Estimate[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(estimates));
}

// ============================================================
// GET ESTIMATES BY PROJECT ID
// ============================================================

export async function getEstimates(projectId: string, type?: 'planning' | 'execution'): Promise<Estimate[]> {
  if (isDemoMode) {
    const estimates = getEstimatesFromStorage();
    return estimates
      .filter((e) => e.project_id === projectId && (!type || e.estimate_type === type))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  try {
    const query = type
      ? `SELECT * FROM estimates WHERE project_id = $1 AND estimate_type = $2 ORDER BY created_at DESC`
      : `SELECT * FROM estimates WHERE project_id = $1 ORDER BY created_at DESC`;

    const params = type ? [projectId, type] : [projectId];
    const data = await executeQuery<Record<string, unknown>>(query, params);

    return (data || []).map(transformEstimateFromDB);
  } catch (error: unknown) {
    console.error('Error fetching estimates:', error);
    const estimates = getEstimatesFromStorage();
    return estimates.filter(
      (e) => e.project_id === projectId && (!type || e.estimate_type === type)
    );
  }
}

// ============================================================
// GET SINGLE ESTIMATE
// ============================================================

export async function getEstimate(estimateId: string): Promise<Estimate | null> {
  if (isDemoMode) {
    const estimates = getEstimatesFromStorage();
    return estimates.find((e) => e.id === estimateId) || null;
  }

  try {
    const data = await executeQuerySingle<Record<string, unknown>>(
      `SELECT * FROM estimates WHERE id = $1`,
      [estimateId]
    );

    return data ? transformEstimateFromDB(data) : null;
  } catch (error: unknown) {
    console.error('Error fetching estimate:', error);
    const estimates = getEstimatesFromStorage();
    return estimates.find((e) => e.id === estimateId) || null;
  }
}

// ============================================================
// GET ALL ESTIMATES
// ============================================================

export async function getAllEstimates(): Promise<Estimate[]> {
  if (isDemoMode) {
    return getEstimatesFromStorage()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  try {
    const data = await executeQuery<Record<string, unknown>>(
      `SELECT * FROM estimates ORDER BY created_at DESC`
    );

    return (data || []).map(transformEstimateFromDB);
  } catch (error: unknown) {
    console.error('Error fetching all estimates:', error);
    return getEstimatesFromStorage();
  }
}

// ============================================================
// CREATE ESTIMATE
// ============================================================

export async function createEstimate(
  estimate: Omit<Estimate, 'id' | 'created_at' | 'updated_at'>
): Promise<Estimate> {
  if (isDemoMode) {
    const newEstimate: Estimate = {
      ...estimate,
      id: `estimate-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const estimates = getEstimatesFromStorage();
    estimates.push(newEstimate);
    saveEstimatesToStorage(estimates);
    return newEstimate;
  }

  try {
    const data = await executeQuerySingle<Record<string, unknown>>(
      `INSERT INTO estimates (
        project_id, estimate_type, name, description, total_amount, status, created_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        estimate.project_id,
        estimate.estimate_type,
        estimate.name,
        estimate.description || null,
        estimate.total_amount,
        estimate.status,
        estimate.created_by || null,
        estimate.notes || null,
      ]
    );

    if (!data) {
      throw new Error('Failed to create estimate');
    }

    return transformEstimateFromDB(data);
  } catch (error: unknown) {
    console.error('Error creating estimate:', error);
    // Fallback to localStorage
    const newEstimate: Estimate = {
      ...estimate,
      id: `estimate-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const estimates = getEstimatesFromStorage();
    estimates.push(newEstimate);
    saveEstimatesToStorage(estimates);
    return newEstimate;
  }
}

// ============================================================
// UPDATE ESTIMATE
// ============================================================

export async function updateEstimate(
  estimateId: string,
  updates: Partial<Estimate>
): Promise<void> {
  // Check if estimate is locked before allowing edits
  const estimate = await getEstimate(estimateId);
  if (estimate && estimate.status === 'locked') {
    throw new Error('Cannot edit estimate. A tender winner has been selected and the estimate is locked.');
  }

  if (isDemoMode) {
    const estimates = getEstimatesFromStorage();
    const index = estimates.findIndex((e) => e.id === estimateId);
    if (index !== -1) {
      estimates[index] = {
        ...estimates[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      saveEstimatesToStorage(estimates);
    }
    return;
  }

  try {
    // Build SET clause dynamically
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updates.project_id !== undefined) {
      setClauses.push(`project_id = $${paramIndex++}`);
      values.push(updates.project_id);
    }
    if (updates.estimate_type !== undefined) {
      setClauses.push(`estimate_type = $${paramIndex++}`);
      values.push(updates.estimate_type);
    }
    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.total_amount !== undefined) {
      setClauses.push(`total_amount = $${paramIndex++}`);
      values.push(updates.total_amount);
    }
    if (updates.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.created_by !== undefined) {
      setClauses.push(`created_by = $${paramIndex++}`);
      values.push(updates.created_by);
    }
    if (updates.notes !== undefined) {
      setClauses.push(`notes = $${paramIndex++}`);
      values.push(updates.notes);
    }
    if (updates.tender_id !== undefined) {
      setClauses.push(`tender_id = $${paramIndex++}`);
      values.push(updates.tender_id);
    }
    if (updates.exported_at !== undefined) {
      setClauses.push(`exported_at = $${paramIndex++}`);
      values.push(updates.exported_at);
    }
    if (updates.locked_at !== undefined) {
      setClauses.push(`locked_at = $${paramIndex++}`);
      values.push(updates.locked_at);
    }

    if (setClauses.length === 0) {
      return; // Nothing to update
    }

    // Always update updated_at
    setClauses.push(`updated_at = NOW()`);

    // Add estimate ID as final parameter
    values.push(estimateId);

    const query = `UPDATE estimates SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`;

    await executeQuery(query, values);
  } catch (error: unknown) {
    console.error('Error updating estimate:', error);
    // Fallback to localStorage
    const estimates = getEstimatesFromStorage();
    const index = estimates.findIndex((e) => e.id === estimateId);
    if (index !== -1) {
      estimates[index] = {
        ...estimates[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      saveEstimatesToStorage(estimates);
    }
  }
}

// ============================================================
// DELETE ESTIMATE
// ============================================================

export async function deleteEstimate(estimateId: string): Promise<void> {
  if (isDemoMode) {
    const estimates = getEstimatesFromStorage();
    const filtered = estimates.filter((e) => e.id !== estimateId);
    saveEstimatesToStorage(filtered);
    return;
  }

  try {
    // Note: Cascade delete for estimate_items is handled by database foreign key constraints
    await executeQuery(`DELETE FROM estimates WHERE id = $1`, [estimateId]);
  } catch (error: unknown) {
    console.error('Error deleting estimate:', error);
    // Fallback to localStorage
    const estimates = getEstimatesFromStorage();
    const filtered = estimates.filter((e) => e.id !== estimateId);
    saveEstimatesToStorage(filtered);
  }
}

// ============================================================
// GET ESTIMATE SUMMARY
// ============================================================

export async function getEstimateSummary(
  estimateId: string
): Promise<{
  totalPrice: number;
  totalWithVat: number;
  itemCount: number;
}> {
  // Import estimateItemsService to avoid circular dependency
  const { getEstimateItems } = await import('./estimateItemsService');

  const items = await getEstimateItems(estimateId);
  const totalPrice = items.reduce((sum, i) => sum + i.total_price, 0);
  const totalWithVat = items.reduce((sum, i) => sum + i.total_with_vat, 0);

  return {
    totalPrice,
    totalWithVat,
    itemCount: items.length,
  };
}

// ============================================================
// HELPER: TRANSFORM DB TO APP FORMAT
// ============================================================

function transformEstimateFromDB(dbEstimate: any): Estimate {
  return {
    id: dbEstimate.id,
    project_id: dbEstimate.project_id,
    estimate_type: dbEstimate.estimate_type,
    name: dbEstimate.name,
    description: dbEstimate.description || undefined,
    total_amount: parseFloat(dbEstimate.total_amount) || 0,
    status: dbEstimate.status,
    created_by: dbEstimate.created_by || undefined,
    notes: dbEstimate.notes || undefined,
    tender_id: dbEstimate.tender_id || undefined,
    exported_at: dbEstimate.exported_at || undefined,
    locked_at: dbEstimate.locked_at || undefined,
    created_at: dbEstimate.created_at,
    updated_at: dbEstimate.updated_at,
  };
}

// ============================================================
// MARK ESTIMATE AS MODIFIED (PHASE 1.1)
// ============================================================

export async function markEstimateAsModified(estimateId: string): Promise<void> {
  // This function is called when estimate items are added/edited/deleted
  // It marks all tenders linked to this estimate as outdated

  if (isDemoMode) {
    // In demo mode, update localStorage for both estimates and tenders
    const estimates = getEstimatesFromStorage();
    const estimateIndex = estimates.findIndex((e) => e.id === estimateId);
    if (estimateIndex !== -1) {
      estimates[estimateIndex].updated_at = new Date().toISOString();
      saveEstimatesToStorage(estimates);
    }

    // Update related tenders
    const { getAllTenders, saveTenders } = await import('../data/tendersStorage');
    const tenders = getAllTenders();
    const updatedTenders = tenders.map((t: Tender) =>
      t.estimate_id === estimateId
        ? { ...t, is_estimate_outdated: true }
        : t
    );
    saveTenders(updatedTenders);
    return;
  }

  try {
    // 1. Update estimate's updated_at timestamp
    await executeQuery(
      `UPDATE estimates SET updated_at = NOW() WHERE id = $1`,
      [estimateId]
    );

    // 2. Mark all tenders with this estimate_id as outdated
    await executeQuery(
      `UPDATE tenders
       SET is_estimate_outdated = TRUE
       WHERE estimate_id = $1`,
      [estimateId]
    );
  } catch (error: unknown) {
    console.error('Error marking estimate as modified:', error);
    throw error;
  }
}

// ============================================================
// LOCK ESTIMATE (PHASE 1.1)
// ============================================================

export async function lockEstimate(estimateId: string): Promise<void> {
  // This function is called when a tender winner is selected
  // It locks the estimate to prevent further edits

  if (isDemoMode) {
    const estimates = getEstimatesFromStorage();
    const index = estimates.findIndex((e) => e.id === estimateId);
    if (index !== -1) {
      estimates[index] = {
        ...estimates[index],
        status: 'locked',
        locked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveEstimatesToStorage(estimates);
    }
    return;
  }

  try {
    await executeQuery(
      `UPDATE estimates
       SET status = 'locked', locked_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [estimateId]
    );
  } catch (error: unknown) {
    console.error('Error locking estimate:', error);
    throw error;
  }
}

// ============================================================
// EXPORT ESTIMATE TO TENDER (ENHANCED - PHASE 1.1)
// ============================================================

export async function exportEstimateToTender(
  estimateId: string,
  tenderData: Partial<import('../types').Tender>
): Promise<string> {
  // Import required services
  const { getEstimateItems } = await import('./estimateItemsService');
  const { createTender } = await import('./tendersService');

  // 1. Verify estimate not already exported (check tender_id is null)
  const estimate = await getEstimate(estimateId);

  if (!estimate) {
    throw new Error('Estimate not found');
  }

  if (estimate.tender_id) {
    throw new Error('This estimate has already been exported to a tender. Each estimate can only create one tender (1:1 relationship).');
  }

  if (estimate.status === 'locked') {
    throw new Error('Cannot export locked estimate');
  }

  // 2. Get estimate with all items
  const items = await getEstimateItems(estimateId);

  // 3. Calculate total with VAT
  const totalWithVat = items.reduce((sum, item) => sum + item.total_with_vat, 0);

  // 4. Create estimate snapshot
  const estimateSnapshot = {
    estimate,
    items,
    snapshot_date: new Date().toISOString(),
    total_with_vat: totalWithVat,
  };

  // 5. Create tender with estimate data
  const newTender = await createTender({
    ...tenderData,
    estimate_id: estimateId,
    estimated_budget: totalWithVat,
    estimate_snapshot: estimateSnapshot,
    estimate_version: 1,
    is_estimate_outdated: false,
    status: tenderData.status || 'Draft',
  } as any);

  // 6. Update estimate with tender link
  try {
    await updateEstimate(estimateId, {
      tender_id: newTender.id,
      exported_at: new Date().toISOString(),
      status: 'exported_to_tender',
    });
  } catch (updateError) {
    console.error('Failed to update estimate after tender creation:', updateError);
    // Don't throw - tender was created successfully, just log the error
  }

  return newTender.id;
}
