/**
 * Units Service - Neon Database API
 * Handles CRUD operations for project units
 */

import { executeQuery, executeQuerySingle, isDemoMode as isNeonDemoMode } from '../lib/neon';
import type { ProjectUnit } from '../types';
import {
  getUnits as getUnitsLocal,
  getAllUnits as getAllUnitsLocal,
  saveUnits,
  addUnit as addUnitLocal,
  updateUnit as updateUnitLocal,
  deleteUnit as deleteUnitLocal,
  getUnitById as getUnitByIdLocal,
  getNextUnitOrder as getNextUnitOrderLocal,
} from '../data/unitsStorage';

// Check if we're in demo mode
const isDemoMode = isNeonDemoMode;

// ============================================================
// GET UNITS BY PROJECT ID
// ============================================================

export async function getUnits(projectId: string): Promise<ProjectUnit[]> {
  if (isDemoMode) {
    return getUnitsLocal(projectId);
  }

  try {
    const data = await executeQuery<Record<string, unknown>>(
      `SELECT * FROM project_units
       WHERE project_id = $1
       ORDER BY "order" ASC`,
      [projectId]
    );

    return (data || []).map(transformUnitFromDB);
  } catch (error: unknown) {
    console.error('Error fetching units:', error);
    return getUnitsLocal(projectId);
  }
}

// ============================================================
// GET ALL UNITS
// ============================================================

export async function getAllUnits(): Promise<ProjectUnit[]> {
  if (isDemoMode) {
    return getAllUnitsLocal();
  }

  try {
    const data = await executeQuery<Record<string, unknown>>(`SELECT * FROM project_units`);

    return (data || []).map(transformUnitFromDB);
  } catch (error: unknown) {
    console.error('Error fetching all units:', error);
    return getAllUnitsLocal();
  }
}

// ============================================================
// GET UNIT BY ID
// ============================================================

export async function getUnitById(id: string): Promise<ProjectUnit | null> {
  if (isDemoMode) {
    return getUnitByIdLocal(id);
  }

  try {
    const data = await executeQuerySingle<Record<string, unknown>>(
      `SELECT * FROM project_units WHERE id = $1`,
      [id]
    );

    return data ? transformUnitFromDB(data) : null;
  } catch (error: unknown) {
    console.error('Error fetching unit:', error);
    return getUnitByIdLocal(id);
  }
}

// ============================================================
// GET NEXT UNIT ORDER
// ============================================================

export async function getNextUnitOrder(projectId: string): Promise<number> {
  if (isDemoMode) {
    return getNextUnitOrderLocal(projectId);
  }

  try {
    const data = await executeQuerySingle<Record<string, unknown>>(
      `SELECT MAX("order") as max_order FROM project_units WHERE project_id = $1`,
      [projectId]
    );

    const maxOrder = (data?.max_order as number) || 0;
    return maxOrder + 1;
  } catch (error: unknown) {
    console.error('Error getting next unit order:', error);
    return getNextUnitOrderLocal(projectId);
  }
}

// ============================================================
// CREATE UNIT
// ============================================================

export async function createUnit(
  unit: Omit<ProjectUnit, 'id' | 'created_at' | 'updated_at'>
): Promise<ProjectUnit> {
  if (isDemoMode) {
    const newUnit: ProjectUnit = {
      ...unit,
      id: `unit-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addUnitLocal(newUnit);
    return newUnit;
  }

  try {
    const data = await executeQuerySingle<Record<string, unknown>>(
      `INSERT INTO project_units (
        project_id, name, type, color, icon, "order"
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        unit.project_id,
        unit.name,
        unit.type,
        unit.color,
        unit.icon,
        unit.order,
      ]
    );

    if (!data) {
      throw new Error('Failed to create unit');
    }

    return transformUnitFromDB(data);
  } catch (error: unknown) {
    console.error('Error creating unit:', error);
    // Fallback to localStorage
    const newUnit: ProjectUnit = {
      ...unit,
      id: `unit-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addUnitLocal(newUnit);
    return newUnit;
  }
}

// ============================================================
// UPDATE UNIT
// ============================================================

export async function updateUnit(
  id: string,
  updates: Partial<ProjectUnit>
): Promise<void> {
  if (isDemoMode) {
    updateUnitLocal(id, updates);
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
    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.type !== undefined) {
      setClauses.push(`type = $${paramIndex++}`);
      values.push(updates.type);
    }
    if (updates.color !== undefined) {
      setClauses.push(`color = $${paramIndex++}`);
      values.push(updates.color);
    }
    if (updates.icon !== undefined) {
      setClauses.push(`icon = $${paramIndex++}`);
      values.push(updates.icon);
    }
    if (updates.order !== undefined) {
      setClauses.push(`"order" = $${paramIndex++}`);
      values.push(updates.order);
    }

    if (setClauses.length === 0) {
      return; // Nothing to update
    }

    // Always update updated_at
    setClauses.push(`updated_at = NOW()`);

    // Add unit ID as final parameter
    values.push(id);

    const query = `UPDATE project_units SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`;

    await executeQuery(query, values);
  } catch (error: unknown) {
    console.error('Error updating unit:', error);
    // Fallback to localStorage
    updateUnitLocal(id, updates);
  }
}

// ============================================================
// DELETE UNIT
// ============================================================

export async function deleteUnit(id: string): Promise<void> {
  if (isDemoMode) {
    deleteUnitLocal(id);
    return;
  }

  try {
    // Note: Cascade delete for milestones is handled by database foreign key constraints
    await executeQuery(`DELETE FROM project_units WHERE id = $1`, [id]);
  } catch (error: unknown) {
    console.error('Error deleting unit:', error);
    // Fallback to localStorage
    deleteUnitLocal(id);
  }
}

// ============================================================
// HELPER: TRANSFORM DB TO APP FORMAT
// ============================================================

function transformUnitFromDB(dbUnit: any): ProjectUnit {
  return {
    id: dbUnit.id,
    project_id: dbUnit.project_id,
    name: dbUnit.name,
    type: dbUnit.type,
    color: dbUnit.color,
    icon: dbUnit.icon,
    order: dbUnit.order,
    created_at: dbUnit.created_at,
    updated_at: dbUnit.updated_at,
  };
}

// ============================================================
// SYNC: SAVE TO LOCALSTORAGE (FOR BACKWARD COMPATIBILITY)
// ============================================================

export async function syncUnitsToLocalStorage(projectId?: string): Promise<void> {
  const units = projectId ? await getUnits(projectId) : await getAllUnits();
  saveUnits(units);
}
