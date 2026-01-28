/**
 * Estimates Service - Neon Database API
 * Handles CRUD operations for estimates
 */

import { executeQuery, executeQuerySingle, isDemoMode as isNeonDemoMode } from '../lib/neon';
import type { Estimate } from '../types';

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
    return estimates.filter(
      (e) => e.project_id === projectId && (!type || e.estimate_type === type)
    );
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
    return getEstimatesFromStorage();
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
    created_at: dbEstimate.created_at,
    updated_at: dbEstimate.updated_at,
  };
}
