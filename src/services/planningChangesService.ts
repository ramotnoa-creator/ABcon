/**
 * Planning Changes Service - Neon Database API
 * Handles CRUD operations for planning changes
 */

import { executeQuery, executeQuerySingle, isDemoMode as isNeonDemoMode } from '../lib/neon';
import type { PlanningChange } from '../types';
import type { User } from '../types/auth';
import { canViewAllProjects } from '../utils/permissions';
import {
  getPlanningChanges as getPlanningChangesLocal,
  getAllPlanningChanges as getAllPlanningChangesLocal,
  savePlanningChanges,
  addPlanningChange as addPlanningChangeLocal,
  updatePlanningChange as updatePlanningChangeLocal,
  deletePlanningChange as deletePlanningChangeLocal,
  getPlanningChangeById as getPlanningChangeByIdLocal,
  getNextChangeNumber as getNextChangeNumberLocal,
} from '../data/planningChangesStorage';

// Check if we're in demo mode
const isDemoMode = isNeonDemoMode;

// ============================================================
// GET PLANNING CHANGES BY PROJECT ID
// ============================================================

export async function getPlanningChanges(projectId: string): Promise<PlanningChange[]> {
  if (isDemoMode) {
    return getPlanningChangesLocal(projectId);
  }

  try {
    const data = await executeQuery<any>(
      `SELECT * FROM planning_changes
       WHERE project_id = $1
       ORDER BY change_number ASC`,
      [projectId]
    );

    return (data || []).map(transformPlanningChangeFromDB);
  } catch (error) {
    console.error('Error fetching planning changes:', error);
    return getPlanningChangesLocal(projectId);
  }
}

// ============================================================
// GET ALL PLANNING CHANGES
// ============================================================

export async function getAllPlanningChanges(): Promise<PlanningChange[]> {
  if (isDemoMode) {
    return getAllPlanningChangesLocal();
  }

  try {
    const data = await executeQuery<any>(`SELECT * FROM planning_changes`);

    return (data || []).map(transformPlanningChangeFromDB);
  } catch (error) {
    console.error('Error fetching all planning changes:', error);
    return getAllPlanningChangesLocal();
  }
}

// ============================================================
// GET USER PLANNING CHANGES (FILTERED BY PERMISSIONS)
// ============================================================

export async function getUserPlanningChanges(user: User | null): Promise<PlanningChange[]> {
  if (!user) return [];

  // Admin and accountant can see all changes
  if (canViewAllProjects(user)) {
    return getAllPlanningChanges();
  }

  // For PM and entrepreneur, get changes from assigned projects only
  const assignedProjects = user.assignedProjects || [];
  if (assignedProjects.length === 0) return [];

  if (isDemoMode) {
    const allChanges = getAllPlanningChangesLocal();
    return allChanges.filter((change) => assignedProjects.includes(change.project_id));
  }

  try {
    const placeholders = assignedProjects.map((_, i) => `$${i + 1}`).join(', ');
    const data = await executeQuery<any>(
      `SELECT * FROM planning_changes WHERE project_id IN (${placeholders})`,
      assignedProjects
    );

    return (data || []).map(transformPlanningChangeFromDB);
  } catch (error) {
    console.error('Error fetching user planning changes:', error);
    const allChanges = getAllPlanningChangesLocal();
    return allChanges.filter((change) => assignedProjects.includes(change.project_id));
  }
}

// ============================================================
// GET PLANNING CHANGE BY ID
// ============================================================

export async function getPlanningChangeById(id: string): Promise<PlanningChange | null> {
  if (isDemoMode) {
    return getPlanningChangeByIdLocal(id);
  }

  try {
    const data = await executeQuerySingle<any>(
      `SELECT * FROM planning_changes WHERE id = $1`,
      [id]
    );

    return data ? transformPlanningChangeFromDB(data) : null;
  } catch (error) {
    console.error('Error fetching planning change:', error);
    return getPlanningChangeByIdLocal(id);
  }
}

// ============================================================
// GET NEXT CHANGE NUMBER
// ============================================================

export async function getNextChangeNumber(projectId: string): Promise<number> {
  if (isDemoMode) {
    return getNextChangeNumberLocal(projectId);
  }

  try {
    const data = await executeQuerySingle<any>(
      `SELECT MAX(change_number) as max_number FROM planning_changes WHERE project_id = $1`,
      [projectId]
    );

    const maxNumber = data?.max_number || 0;
    return maxNumber + 1;
  } catch (error) {
    console.error('Error getting next change number:', error);
    return getNextChangeNumberLocal(projectId);
  }
}

// ============================================================
// CREATE PLANNING CHANGE
// ============================================================

export async function createPlanningChange(
  change: Omit<PlanningChange, 'id' | 'change_number' | 'created_at' | 'updated_at'>
): Promise<PlanningChange> {
  if (isDemoMode) {
    const now = new Date().toISOString();
    const changeWithMetadata: Omit<PlanningChange, 'change_number'> = {
      ...change,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    };
    return addPlanningChangeLocal(changeWithMetadata);
  }

  try {
    const changeNumber = await getNextChangeNumber(change.project_id);

    const data = await executeQuerySingle<any>(
      `INSERT INTO planning_changes (
        project_id, change_number, description, schedule_impact, budget_impact,
        decision, image_urls, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        change.project_id,
        changeNumber,
        change.description,
        change.schedule_impact || null,
        change.budget_impact || null,
        change.decision,
        change.image_urls ? JSON.stringify(change.image_urls) : null,
        change.created_by || null,
      ]
    );

    if (!data) {
      throw new Error('Failed to create planning change');
    }

    return transformPlanningChangeFromDB(data);
  } catch (error) {
    console.error('Error creating planning change:', error);
    // Fallback to localStorage
    const now = new Date().toISOString();
    const changeWithMetadata: Omit<PlanningChange, 'change_number'> = {
      ...change,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    };
    return addPlanningChangeLocal(changeWithMetadata);
  }
}

// ============================================================
// UPDATE PLANNING CHANGE
// ============================================================

export async function updatePlanningChange(
  id: string,
  updates: Partial<PlanningChange>
): Promise<void> {
  if (isDemoMode) {
    updatePlanningChangeLocal(id, updates);
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
    if (updates.change_number !== undefined) {
      setClauses.push(`change_number = $${paramIndex++}`);
      values.push(updates.change_number);
    }
    if (updates.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.schedule_impact !== undefined) {
      setClauses.push(`schedule_impact = $${paramIndex++}`);
      values.push(updates.schedule_impact);
    }
    if (updates.budget_impact !== undefined) {
      setClauses.push(`budget_impact = $${paramIndex++}`);
      values.push(updates.budget_impact);
    }
    if (updates.decision !== undefined) {
      setClauses.push(`decision = $${paramIndex++}`);
      values.push(updates.decision);
    }
    if (updates.image_urls !== undefined) {
      setClauses.push(`image_urls = $${paramIndex++}`);
      values.push(updates.image_urls ? JSON.stringify(updates.image_urls) : null);
    }
    if (updates.created_by !== undefined) {
      setClauses.push(`created_by = $${paramIndex++}`);
      values.push(updates.created_by);
    }

    if (setClauses.length === 0) {
      return; // Nothing to update
    }

    // Always update updated_at
    setClauses.push(`updated_at = NOW()`);

    // Add change ID as final parameter
    values.push(id);

    const query = `UPDATE planning_changes SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`;

    await executeQuery(query, values);
  } catch (error) {
    console.error('Error updating planning change:', error);
    // Fallback to localStorage
    updatePlanningChangeLocal(id, updates);
  }
}

// ============================================================
// DELETE PLANNING CHANGE
// ============================================================

export async function deletePlanningChange(id: string): Promise<void> {
  if (isDemoMode) {
    deletePlanningChangeLocal(id);
    return;
  }

  try {
    await executeQuery(`DELETE FROM planning_changes WHERE id = $1`, [id]);
  } catch (error) {
    console.error('Error deleting planning change:', error);
    // Fallback to localStorage
    deletePlanningChangeLocal(id);
  }
}

// ============================================================
// HELPER: TRANSFORM DB TO APP FORMAT
// ============================================================

function transformPlanningChangeFromDB(dbChange: any): PlanningChange {
  return {
    id: dbChange.id,
    project_id: dbChange.project_id,
    change_number: dbChange.change_number,
    description: dbChange.description,
    schedule_impact: dbChange.schedule_impact || undefined,
    budget_impact: dbChange.budget_impact || undefined,
    decision: dbChange.decision,
    image_urls: dbChange.image_urls ? JSON.parse(dbChange.image_urls) : undefined,
    created_by: dbChange.created_by || undefined,
    created_at: dbChange.created_at,
    updated_at: dbChange.updated_at,
  };
}

// ============================================================
// SYNC: SAVE TO LOCALSTORAGE (FOR BACKWARD COMPATIBILITY)
// ============================================================

export async function syncPlanningChangesToLocalStorage(projectId?: string): Promise<void> {
  const changes = projectId ? await getPlanningChanges(projectId) : await getAllPlanningChanges();
  savePlanningChanges(changes);
}
