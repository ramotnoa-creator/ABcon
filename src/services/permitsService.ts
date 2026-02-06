/**
 * Permits Service - Neon Database API
 * Handles CRUD operations for permits (היתרים)
 */

import { executeQuery, executeQuerySingle, isDemoMode as isNeonDemoMode } from '../lib/neon';
import type { Permit } from '../types';
import {
  getPermits as getPermitsLocal,
  getAllPermits as getAllPermitsLocal,
  savePermits,
  addPermit as addPermitLocal,
  updatePermit as updatePermitLocal,
  deletePermit as deletePermitLocal,
  getPermitById as getPermitByIdLocal,
} from '../data/permitsStorage';
import { seedPermits } from '../data/permitsData';

// Check if we're in demo mode
const isDemoMode = isNeonDemoMode;

// ============================================================
// LOAD INITIAL PERMITS (SEED IF EMPTY)
// ============================================================

export async function loadInitialPermits(projectId: string): Promise<Permit[]> {
  let loaded = await getPermits(projectId);

  if (loaded.length === 0) {
    const projectPermits = seedPermits.filter((p) => p.project_id === projectId);
    if (projectPermits.length > 0) {
      const existing = getAllPermitsLocal();
      savePermits([...existing, ...projectPermits]);
      loaded = projectPermits;
    }
  }

  return loaded;
}

// ============================================================
// GET PERMITS BY PROJECT ID
// ============================================================

export async function getPermits(projectId: string): Promise<Permit[]> {
  if (isDemoMode) {
    return getPermitsLocal(projectId);
  }

  try {
    const data = await executeQuery<Record<string, unknown>>(
      `SELECT * FROM permits
       WHERE project_id = $1
       ORDER BY created_at DESC`,
      [projectId]
    );

    return (data || []).map(transformPermitFromDB);
  } catch (error: unknown) {
    console.error('Error fetching permits:', error);
    return getPermitsLocal(projectId);
  }
}

// ============================================================
// GET PERMIT BY ID
// ============================================================

export async function getPermitById(id: string): Promise<Permit | null> {
  if (isDemoMode) {
    return getPermitByIdLocal(id);
  }

  try {
    const data = await executeQuerySingle<Record<string, unknown>>(
      `SELECT * FROM permits WHERE id = $1`,
      [id]
    );

    return data ? transformPermitFromDB(data) : null;
  } catch (error: unknown) {
    console.error('Error fetching permit:', error);
    return getPermitByIdLocal(id);
  }
}

// ============================================================
// CREATE PERMIT
// ============================================================

export async function createPermit(
  permit: Omit<Permit, 'id' | 'created_at' | 'updated_at'>
): Promise<Permit> {
  if (isDemoMode) {
    const newPermit: Permit = {
      ...permit,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addPermitLocal(newPermit);
    return newPermit;
  }

  try {
    const data = await executeQuerySingle<Record<string, unknown>>(
      `INSERT INTO permits (
        project_id, permit_type, permit_name, authority, application_reference,
        application_date, approval_date, expiry_date, permit_number, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        permit.project_id,
        permit.permit_type,
        permit.permit_name,
        permit.authority || null,
        permit.application_reference || null,
        permit.application_date || null,
        permit.approval_date || null,
        permit.expiry_date || null,
        permit.permit_number || null,
        permit.status,
        permit.notes || null,
      ]
    );

    if (!data) {
      throw new Error('Failed to create permit');
    }

    return transformPermitFromDB(data);
  } catch (error: unknown) {
    console.error('Error creating permit:', error);
    const newPermit: Permit = {
      ...permit,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addPermitLocal(newPermit);
    return newPermit;
  }
}

// ============================================================
// UPDATE PERMIT
// ============================================================

export async function updatePermit(
  id: string,
  updates: Partial<Permit>
): Promise<void> {
  if (isDemoMode) {
    updatePermitLocal(id, updates);
    return;
  }

  try {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const fields: (keyof Permit)[] = [
      'project_id', 'permit_type', 'permit_name', 'authority',
      'application_reference', 'application_date', 'approval_date',
      'expiry_date', 'permit_number', 'status', 'notes',
    ];

    for (const field of fields) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = $${paramIndex++}`);
        values.push(updates[field] || null);
      }
    }

    if (setClauses.length === 0) {
      return;
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const query = `UPDATE permits SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`;
    await executeQuery(query, values);
  } catch (error: unknown) {
    console.error('Error updating permit:', error);
    updatePermitLocal(id, updates);
  }
}

// ============================================================
// DELETE PERMIT
// ============================================================

export async function deletePermit(id: string): Promise<void> {
  if (isDemoMode) {
    deletePermitLocal(id);
    return;
  }

  try {
    await executeQuery(`DELETE FROM permits WHERE id = $1`, [id]);
  } catch (error: unknown) {
    console.error('Error deleting permit:', error);
    deletePermitLocal(id);
  }
}

// ============================================================
// HELPER: TRANSFORM DB TO APP FORMAT
// ============================================================

function transformPermitFromDB(dbRow: any): Permit {
  return {
    id: dbRow.id,
    project_id: dbRow.project_id,
    permit_type: dbRow.permit_type,
    permit_name: dbRow.permit_name,
    authority: dbRow.authority || undefined,
    application_reference: dbRow.application_reference || undefined,
    application_date: dbRow.application_date || undefined,
    approval_date: dbRow.approval_date || undefined,
    expiry_date: dbRow.expiry_date || undefined,
    permit_number: dbRow.permit_number || undefined,
    status: dbRow.status,
    notes: dbRow.notes || undefined,
    created_at: dbRow.created_at,
    updated_at: dbRow.updated_at,
  };
}
