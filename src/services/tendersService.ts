/**
 * Tenders Service - Neon Database API
 * Handles CRUD operations for tenders
 */

import { executeQuery, executeQuerySingle, isDemoMode as isNeonDemoMode } from '../lib/neon';
import type { Tender } from '../types';
import {
  getTenders as getTendersLocal,
  getAllTenders as getAllTendersLocal,
  saveTenders,
  addTender as addTenderLocal,
  updateTender as updateTenderLocal,
  deleteTender as deleteTenderLocal,
  getTenderById as getTenderByIdLocal,
} from '../data/tendersStorage';

// Check if we're in demo mode
const isDemoMode = isNeonDemoMode;

// ============================================================
// GET TENDERS BY PROJECT ID
// ============================================================

export async function getTenders(projectId: string): Promise<Tender[]> {
  if (isDemoMode) {
    return getTendersLocal(projectId);
  }

  try {
    const data = await executeQuery<any>(
      `SELECT * FROM tenders
       WHERE project_id = $1
       ORDER BY created_at DESC`,
      [projectId]
    );

    return (data || []).map(transformTenderFromDB);
  } catch (error) {
    console.error('Error fetching tenders:', error);
    return getTendersLocal(projectId);
  }
}

// ============================================================
// GET ALL TENDERS
// ============================================================

export async function getAllTenders(): Promise<Tender[]> {
  if (isDemoMode) {
    return getAllTendersLocal();
  }

  try {
    const data = await executeQuery<any>(
      `SELECT * FROM tenders ORDER BY created_at DESC`
    );

    return (data || []).map(transformTenderFromDB);
  } catch (error) {
    console.error('Error fetching all tenders:', error);
    return getAllTendersLocal();
  }
}

// ============================================================
// GET TENDER BY ID
// ============================================================

export async function getTenderById(id: string): Promise<Tender | null> {
  if (isDemoMode) {
    return getTenderByIdLocal(id);
  }

  try {
    const data = await executeQuerySingle<any>(
      `SELECT * FROM tenders WHERE id = $1`,
      [id]
    );

    return data ? transformTenderFromDB(data) : null;
  } catch (error) {
    console.error('Error fetching tender:', error);
    return getTenderByIdLocal(id);
  }
}

// ============================================================
// CREATE TENDER
// ============================================================

export async function createTender(
  tender: Omit<Tender, 'id' | 'created_at' | 'updated_at'>
): Promise<Tender> {
  if (isDemoMode) {
    const newTender: Tender = {
      ...tender,
      id: `tender-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addTenderLocal(newTender);
    return newTender;
  }

  try {
    const data = await executeQuerySingle<any>(
      `INSERT INTO tenders (
        project_id, tender_name, tender_type, category, description,
        status, publish_date, due_date, candidate_professional_ids,
        winner_professional_id, winner_professional_name, milestone_id,
        notes, estimated_budget, contract_amount, management_remarks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        tender.project_id,
        tender.tender_name,
        tender.tender_type,
        tender.category || null,
        tender.description || null,
        tender.status,
        tender.publish_date || null,
        tender.due_date || null,
        JSON.stringify(tender.candidate_professional_ids || []),
        tender.winner_professional_id || null,
        tender.winner_professional_name || null,
        tender.milestone_id || null,
        tender.notes || null,
        tender.estimated_budget || null,
        tender.contract_amount || null,
        tender.management_remarks || null,
      ]
    );

    if (!data) {
      throw new Error('Failed to create tender');
    }

    return transformTenderFromDB(data);
  } catch (error) {
    console.error('Error creating tender:', error);
    // Fallback to localStorage
    const newTender: Tender = {
      ...tender,
      id: `tender-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addTenderLocal(newTender);
    return newTender;
  }
}

// ============================================================
// UPDATE TENDER
// ============================================================

export async function updateTender(
  id: string,
  updates: Partial<Tender>
): Promise<void> {
  if (isDemoMode) {
    updateTenderLocal(id, updates);
    return;
  }

  try {
    // Build SET clause dynamically
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.project_id !== undefined) {
      setClauses.push(`project_id = $${paramIndex++}`);
      values.push(updates.project_id);
    }
    if (updates.tender_name !== undefined) {
      setClauses.push(`tender_name = $${paramIndex++}`);
      values.push(updates.tender_name);
    }
    if (updates.tender_type !== undefined) {
      setClauses.push(`tender_type = $${paramIndex++}`);
      values.push(updates.tender_type);
    }
    if (updates.category !== undefined) {
      setClauses.push(`category = $${paramIndex++}`);
      values.push(updates.category);
    }
    if (updates.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.publish_date !== undefined) {
      setClauses.push(`publish_date = $${paramIndex++}`);
      values.push(updates.publish_date);
    }
    if (updates.due_date !== undefined) {
      setClauses.push(`due_date = $${paramIndex++}`);
      values.push(updates.due_date);
    }
    if (updates.candidate_professional_ids !== undefined) {
      setClauses.push(`candidate_professional_ids = $${paramIndex++}`);
      values.push(JSON.stringify(updates.candidate_professional_ids));
    }
    if (updates.winner_professional_id !== undefined) {
      setClauses.push(`winner_professional_id = $${paramIndex++}`);
      values.push(updates.winner_professional_id);
    }
    if (updates.winner_professional_name !== undefined) {
      setClauses.push(`winner_professional_name = $${paramIndex++}`);
      values.push(updates.winner_professional_name);
    }
    if (updates.milestone_id !== undefined) {
      setClauses.push(`milestone_id = $${paramIndex++}`);
      values.push(updates.milestone_id);
    }
    if (updates.notes !== undefined) {
      setClauses.push(`notes = $${paramIndex++}`);
      values.push(updates.notes);
    }
    if (updates.estimated_budget !== undefined) {
      setClauses.push(`estimated_budget = $${paramIndex++}`);
      values.push(updates.estimated_budget);
    }
    if (updates.contract_amount !== undefined) {
      setClauses.push(`contract_amount = $${paramIndex++}`);
      values.push(updates.contract_amount);
    }
    if (updates.management_remarks !== undefined) {
      setClauses.push(`management_remarks = $${paramIndex++}`);
      values.push(updates.management_remarks);
    }

    if (setClauses.length === 0) {
      return; // Nothing to update
    }

    // Always update updated_at
    setClauses.push(`updated_at = NOW()`);

    // Add tender ID as final parameter
    values.push(id);

    const query = `UPDATE tenders SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`;

    await executeQuery(query, values);
  } catch (error) {
    console.error('Error updating tender:', error);
    // Fallback to localStorage
    updateTenderLocal(id, updates);
  }
}

// ============================================================
// DELETE TENDER
// ============================================================

export async function deleteTender(id: string): Promise<void> {
  if (isDemoMode) {
    deleteTenderLocal(id);
    return;
  }

  try {
    await executeQuery(`DELETE FROM tenders WHERE id = $1`, [id]);
  } catch (error) {
    console.error('Error deleting tender:', error);
    // Fallback to localStorage
    deleteTenderLocal(id);
  }
}

// ============================================================
// HELPER: TRANSFORM DB TO APP FORMAT
// ============================================================

function transformTenderFromDB(dbTender: any): Tender {
  return {
    id: dbTender.id,
    project_id: dbTender.project_id,
    tender_name: dbTender.tender_name,
    tender_type: dbTender.tender_type,
    category: dbTender.category || undefined,
    description: dbTender.description || undefined,
    status: dbTender.status,
    publish_date: dbTender.publish_date || undefined,
    due_date: dbTender.due_date || undefined,
    candidate_professional_ids: typeof dbTender.candidate_professional_ids === 'string'
      ? JSON.parse(dbTender.candidate_professional_ids)
      : (dbTender.candidate_professional_ids || []),
    winner_professional_id: dbTender.winner_professional_id || undefined,
    winner_professional_name: dbTender.winner_professional_name || undefined,
    milestone_id: dbTender.milestone_id || undefined,
    notes: dbTender.notes || undefined,
    estimated_budget: dbTender.estimated_budget || undefined,
    contract_amount: dbTender.contract_amount || undefined,
    management_remarks: dbTender.management_remarks || undefined,
    created_at: dbTender.created_at,
    updated_at: dbTender.updated_at,
  };
}

// ============================================================
// SYNC: SAVE TO LOCALSTORAGE (FOR BACKWARD COMPATIBILITY)
// ============================================================

export async function syncTendersToLocalStorage(projectId?: string): Promise<void> {
  const tenders = projectId ? await getTenders(projectId) : await getAllTenders();
  saveTenders(tenders);
}
