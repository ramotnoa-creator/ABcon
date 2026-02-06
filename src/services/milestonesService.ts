/**
 * Milestones Service - Neon Database API
 * Handles CRUD operations for project milestones
 */

import { executeQuery, executeQuerySingle, isDemoMode as isNeonDemoMode } from '../lib/neon';
import type { ProjectMilestone } from '../types';
import {
  getMilestones as getMilestonesLocal,
  getAllMilestones as getAllMilestonesLocal,
  getMilestonesByUnit as getMilestonesByUnitLocal,
  saveMilestones,
  addMilestone as addMilestoneLocal,
  updateMilestone as updateMilestoneLocal,
  deleteMilestone as deleteMilestoneLocal,
  getMilestoneById as getMilestoneByIdLocal,
  getNextMilestoneOrder as getNextMilestoneOrderLocal,
  getMilestoneStats as getMilestoneStatsLocal,
} from '../data/milestonesStorage';

// Check if we're in demo mode
const isDemoMode = isNeonDemoMode;

// ============================================================
// GET MILESTONES BY PROJECT ID
// ============================================================

export async function getMilestones(projectId: string): Promise<ProjectMilestone[]> {
  if (isDemoMode) {
    return getMilestonesLocal(projectId);
  }

  try {
    const data = await executeQuery<any>(
      `SELECT * FROM project_milestones
       WHERE project_id = $1
       ORDER BY "order" ASC`,
      [projectId]
    );

    return (data || []).map(transformMilestoneFromDB);
  } catch (error) {
    console.error('Error fetching milestones:', error);
    return getMilestonesLocal(projectId);
  }
}

// ============================================================
// GET MILESTONES BY UNIT
// ============================================================

export async function getMilestonesByUnit(projectId: string, unitId: string): Promise<ProjectMilestone[]> {
  if (isDemoMode) {
    return getMilestonesByUnitLocal(projectId, unitId);
  }

  try {
    const data = await executeQuery<any>(
      `SELECT * FROM project_milestones
       WHERE project_id = $1 AND unit_id = $2
       ORDER BY "order" ASC`,
      [projectId, unitId]
    );

    return (data || []).map(transformMilestoneFromDB);
  } catch (error) {
    console.error('Error fetching milestones by unit:', error);
    return getMilestonesByUnitLocal(projectId, unitId);
  }
}

// ============================================================
// GET ALL MILESTONES
// ============================================================

export async function getAllMilestones(): Promise<ProjectMilestone[]> {
  if (isDemoMode) {
    return getAllMilestonesLocal();
  }

  try {
    const data = await executeQuery<any>(
      `SELECT * FROM project_milestones ORDER BY "order" ASC`
    );

    return (data || []).map(transformMilestoneFromDB);
  } catch (error) {
    console.error('Error fetching all milestones:', error);
    return getAllMilestonesLocal();
  }
}

// ============================================================
// GET MILESTONE BY ID
// ============================================================

export async function getMilestoneById(id: string): Promise<ProjectMilestone | null> {
  if (isDemoMode) {
    return getMilestoneByIdLocal(id);
  }

  try {
    const data = await executeQuerySingle<any>(
      `SELECT * FROM project_milestones WHERE id = $1`,
      [id]
    );

    return data ? transformMilestoneFromDB(data) : null;
  } catch (error) {
    console.error('Error fetching milestone:', error);
    return getMilestoneByIdLocal(id);
  }
}

// ============================================================
// GET NEXT MILESTONE ORDER
// ============================================================

export async function getNextMilestoneOrder(projectId: string): Promise<number> {
  if (isDemoMode) {
    return getNextMilestoneOrderLocal(projectId);
  }

  try {
    const data = await executeQuerySingle<any>(
      `SELECT MAX("order") as max_order FROM project_milestones WHERE project_id = $1`,
      [projectId]
    );

    const maxOrder = data?.max_order || 0;
    return maxOrder + 1;
  } catch (error) {
    console.error('Error getting next milestone order:', error);
    return getNextMilestoneOrderLocal(projectId);
  }
}

// ============================================================
// GET MILESTONE STATS
// ============================================================

export async function getMilestoneStats(
  projectId: string
): Promise<{ total: number; completed: number; pending: number; inProgress: number }> {
  if (isDemoMode) {
    return getMilestoneStatsLocal(projectId);
  }

  try {
    const milestones = await getMilestones(projectId);

    return {
      total: milestones.length,
      completed: milestones.filter((m) => m.status === 'completed').length,
      pending: milestones.filter((m) => m.status === 'pending').length,
      inProgress: milestones.filter((m) => m.status === 'in-progress').length,
    };
  } catch (error) {
    console.error('Error getting milestone stats:', error);
    return getMilestoneStatsLocal(projectId);
  }
}

// ============================================================
// CREATE MILESTONE
// ============================================================

export async function createMilestone(
  milestone: Omit<ProjectMilestone, 'id' | 'created_at' | 'updated_at'>
): Promise<ProjectMilestone> {
  if (isDemoMode) {
    const newMilestone: ProjectMilestone = {
      ...milestone,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addMilestoneLocal(newMilestone);
    return newMilestone;
  }

  try {
    const data = await executeQuerySingle<any>(
      `INSERT INTO project_milestones (
        project_id, unit_id, name, date, status, phase,
        budget_item_id, tender_id, budget_link_text, "order", notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        milestone.project_id,
        milestone.unit_id,
        milestone.name,
        milestone.date,
        milestone.status,
        milestone.phase || null,
        milestone.budget_item_id || null,
        milestone.tender_id || null,
        milestone.budget_link_text || null,
        milestone.order,
        milestone.notes || null,
      ]
    );

    if (!data) {
      throw new Error('Failed to create milestone');
    }

    return transformMilestoneFromDB(data);
  } catch (error) {
    console.error('Error creating milestone:', error);
    // Fallback to localStorage
    const newMilestone: ProjectMilestone = {
      ...milestone,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addMilestoneLocal(newMilestone);
    return newMilestone;
  }
}

// ============================================================
// UPDATE MILESTONE
// ============================================================

export async function updateMilestone(
  id: string,
  updates: Partial<ProjectMilestone>
): Promise<void> {
  if (isDemoMode) {
    updateMilestoneLocal(id, updates);
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
    if (updates.unit_id !== undefined) {
      setClauses.push(`unit_id = $${paramIndex++}`);
      values.push(updates.unit_id);
    }
    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.date !== undefined) {
      setClauses.push(`date = $${paramIndex++}`);
      values.push(updates.date);
    }
    if (updates.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.phase !== undefined) {
      setClauses.push(`phase = $${paramIndex++}`);
      values.push(updates.phase);
    }
    if (updates.budget_item_id !== undefined) {
      setClauses.push(`budget_item_id = $${paramIndex++}`);
      values.push(updates.budget_item_id);
    }
    if (updates.tender_id !== undefined) {
      setClauses.push(`tender_id = $${paramIndex++}`);
      values.push(updates.tender_id);
    }
    if (updates.budget_link_text !== undefined) {
      setClauses.push(`budget_link_text = $${paramIndex++}`);
      values.push(updates.budget_link_text);
    }
    if (updates.order !== undefined) {
      setClauses.push(`"order" = $${paramIndex++}`);
      values.push(updates.order);
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

    // Add milestone ID as final parameter
    values.push(id);

    const query = `UPDATE project_milestones SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`;

    await executeQuery(query, values);
  } catch (error) {
    console.error('Error updating milestone:', error);
    // Fallback to localStorage
    updateMilestoneLocal(id, updates);
  }
}

// ============================================================
// DELETE MILESTONE
// ============================================================

export async function deleteMilestone(id: string): Promise<void> {
  if (isDemoMode) {
    deleteMilestoneLocal(id);
    return;
  }

  try {
    // Note: Cascade delete for gantt tasks is handled by database foreign key constraints
    await executeQuery(`DELETE FROM project_milestones WHERE id = $1`, [id]);
  } catch (error) {
    console.error('Error deleting milestone:', error);
    // Fallback to localStorage
    deleteMilestoneLocal(id);
  }
}

// ============================================================
// HELPER: TRANSFORM DB TO APP FORMAT
// ============================================================

function transformMilestoneFromDB(dbMilestone: any): ProjectMilestone {
  return {
    id: dbMilestone.id,
    project_id: dbMilestone.project_id,
    unit_id: dbMilestone.unit_id,
    name: dbMilestone.name,
    date: dbMilestone.date,
    status: dbMilestone.status,
    phase: dbMilestone.phase || undefined,
    budget_item_id: dbMilestone.budget_item_id || undefined,
    tender_id: dbMilestone.tender_id || undefined,
    budget_link_text: dbMilestone.budget_link_text || undefined,
    order: dbMilestone.order,
    notes: dbMilestone.notes || undefined,
    created_at: dbMilestone.created_at,
    updated_at: dbMilestone.updated_at,
  };
}

// ============================================================
// SYNC: SAVE TO LOCALSTORAGE (FOR BACKWARD COMPATIBILITY)
// ============================================================

export async function syncMilestonesToLocalStorage(projectId?: string): Promise<void> {
  const milestones = projectId ? await getMilestones(projectId) : await getAllMilestones();
  saveMilestones(milestones);
}
