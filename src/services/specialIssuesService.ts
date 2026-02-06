/**
 * Special Issues Service - Neon Database API
 * Handles CRUD operations for special issues
 */

import { executeQuery, executeQuerySingle, isDemoMode as isNeonDemoMode } from '../lib/neon';
import type { SpecialIssue } from '../types';
import type { User } from '../types/auth';
import { canViewAllProjects } from '../utils/permissions';
import {
  getSpecialIssues as getSpecialIssuesLocal,
  getAllSpecialIssues as getAllSpecialIssuesLocal,
  saveSpecialIssues,
  addSpecialIssue as addSpecialIssueLocal,
  updateSpecialIssue as updateSpecialIssueLocal,
  deleteSpecialIssue as deleteSpecialIssueLocal,
  getSpecialIssueById as getSpecialIssueByIdLocal,
  getOpenIssuesCount as getOpenIssuesCountLocal,
} from '../data/specialIssuesStorage';

// Check if we're in demo mode
const isDemoMode = isNeonDemoMode;

// ============================================================
// GET SPECIAL ISSUES BY PROJECT ID
// ============================================================

export async function getSpecialIssues(projectId: string): Promise<SpecialIssue[]> {
  if (isDemoMode) {
    return getSpecialIssuesLocal(projectId);
  }

  try {
    const data = await executeQuery<Record<string, unknown>>(
      `SELECT * FROM special_issues
       WHERE project_id = $1
       ORDER BY date DESC`,
      [projectId]
    );

    return (data || []).map(transformSpecialIssueFromDB);
  } catch (error: unknown) {
    console.error('Error fetching special issues:', error);
    return getSpecialIssuesLocal(projectId);
  }
}

// ============================================================
// GET ALL SPECIAL ISSUES
// ============================================================

export async function getAllSpecialIssues(): Promise<SpecialIssue[]> {
  if (isDemoMode) {
    return getAllSpecialIssuesLocal();
  }

  try {
    const data = await executeQuery<Record<string, unknown>>(`SELECT * FROM special_issues`);

    return (data || []).map(transformSpecialIssueFromDB);
  } catch (error: unknown) {
    console.error('Error fetching all special issues:', error);
    return getAllSpecialIssuesLocal();
  }
}

// ============================================================
// GET USER SPECIAL ISSUES (FILTERED BY PERMISSIONS)
// ============================================================

export async function getUserSpecialIssues(user: User | null): Promise<SpecialIssue[]> {
  if (!user) return [];

  // Admin and accountant can see all issues
  if (canViewAllProjects(user)) {
    return getAllSpecialIssues();
  }

  // For PM and entrepreneur, get issues from assigned projects only
  const assignedProjects = user.assignedProjects || [];
  if (assignedProjects.length === 0) return [];

  if (isDemoMode) {
    const allIssues = getAllSpecialIssuesLocal();
    return allIssues.filter((issue) => assignedProjects.includes(issue.project_id));
  }

  try {
    const placeholders = assignedProjects.map((_, i) => `$${i + 1}`).join(', ');
    const data = await executeQuery<Record<string, unknown>>(
      `SELECT * FROM special_issues WHERE project_id IN (${placeholders})`,
      assignedProjects
    );

    return (data || []).map(transformSpecialIssueFromDB);
  } catch (error: unknown) {
    console.error('Error fetching user special issues:', error);
    const allIssues = getAllSpecialIssuesLocal();
    return allIssues.filter((issue) => assignedProjects.includes(issue.project_id));
  }
}

// ============================================================
// GET SPECIAL ISSUE BY ID
// ============================================================

export async function getSpecialIssueById(id: string): Promise<SpecialIssue | null> {
  if (isDemoMode) {
    return getSpecialIssueByIdLocal(id);
  }

  try {
    const data = await executeQuerySingle<Record<string, unknown>>(
      `SELECT * FROM special_issues WHERE id = $1`,
      [id]
    );

    return data ? transformSpecialIssueFromDB(data) : null;
  } catch (error: unknown) {
    console.error('Error fetching special issue:', error);
    return getSpecialIssueByIdLocal(id);
  }
}

// ============================================================
// GET OPEN ISSUES COUNT
// ============================================================

export async function getOpenIssuesCount(projectId: string): Promise<number> {
  if (isDemoMode) {
    return getOpenIssuesCountLocal(projectId);
  }

  try {
    const issues = await getSpecialIssues(projectId);
    return issues.filter((issue) => issue.status === 'open').length;
  } catch (error: unknown) {
    console.error('Error getting open issues count:', error);
    return getOpenIssuesCountLocal(projectId);
  }
}

// ============================================================
// CREATE SPECIAL ISSUE
// ============================================================

export async function createSpecialIssue(
  issue: Omit<SpecialIssue, 'id' | 'created_at' | 'updated_at'>
): Promise<SpecialIssue> {
  if (isDemoMode) {
    const newIssue: SpecialIssue = {
      ...issue,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addSpecialIssueLocal(newIssue);
    return newIssue;
  }

  try {
    const data = await executeQuerySingle<Record<string, unknown>>(
      `INSERT INTO special_issues (
        project_id, date, description, status, priority, category,
        responsible, image_urls, resolution, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        issue.project_id,
        issue.date,
        issue.description,
        issue.status,
        issue.priority || null,
        issue.category || null,
        issue.responsible || null,
        issue.image_urls ? JSON.stringify(issue.image_urls) : null,
        issue.resolution || null,
        issue.created_by || null,
      ]
    );

    if (!data) {
      throw new Error('Failed to create special issue');
    }

    return transformSpecialIssueFromDB(data);
  } catch (error: unknown) {
    console.error('Error creating special issue:', error);
    // Fallback to localStorage
    const newIssue: SpecialIssue = {
      ...issue,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addSpecialIssueLocal(newIssue);
    return newIssue;
  }
}

// ============================================================
// UPDATE SPECIAL ISSUE
// ============================================================

export async function updateSpecialIssue(
  id: string,
  updates: Partial<SpecialIssue>
): Promise<void> {
  if (isDemoMode) {
    updateSpecialIssueLocal(id, updates);
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
    if (updates.date !== undefined) {
      setClauses.push(`date = $${paramIndex++}`);
      values.push(updates.date);
    }
    if (updates.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.priority !== undefined) {
      setClauses.push(`priority = $${paramIndex++}`);
      values.push(updates.priority);
    }
    if (updates.category !== undefined) {
      setClauses.push(`category = $${paramIndex++}`);
      values.push(updates.category);
    }
    if (updates.responsible !== undefined) {
      setClauses.push(`responsible = $${paramIndex++}`);
      values.push(updates.responsible);
    }
    if (updates.image_urls !== undefined) {
      setClauses.push(`image_urls = $${paramIndex++}`);
      values.push(updates.image_urls ? JSON.stringify(updates.image_urls) : null);
    }
    if (updates.resolution !== undefined) {
      setClauses.push(`resolution = $${paramIndex++}`);
      values.push(updates.resolution);
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

    // Add issue ID as final parameter
    values.push(id);

    const query = `UPDATE special_issues SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`;

    await executeQuery(query, values);
  } catch (error: unknown) {
    console.error('Error updating special issue:', error);
    // Fallback to localStorage
    updateSpecialIssueLocal(id, updates);
  }
}

// ============================================================
// DELETE SPECIAL ISSUE
// ============================================================

export async function deleteSpecialIssue(id: string): Promise<void> {
  if (isDemoMode) {
    deleteSpecialIssueLocal(id);
    return;
  }

  try {
    await executeQuery(`DELETE FROM special_issues WHERE id = $1`, [id]);
  } catch (error: unknown) {
    console.error('Error deleting special issue:', error);
    // Fallback to localStorage
    deleteSpecialIssueLocal(id);
  }
}

// ============================================================
// HELPER: TRANSFORM DB TO APP FORMAT
// ============================================================

function transformSpecialIssueFromDB(dbIssue: any): SpecialIssue {
  return {
    id: dbIssue.id,
    project_id: dbIssue.project_id,
    date: dbIssue.date,
    description: dbIssue.description,
    status: dbIssue.status,
    priority: dbIssue.priority || undefined,
    category: dbIssue.category || undefined,
    responsible: dbIssue.responsible || undefined,
    image_urls: dbIssue.image_urls
      ? (typeof dbIssue.image_urls === 'object'
        ? dbIssue.image_urls
        : (() => { try { return JSON.parse(dbIssue.image_urls); } catch { return []; } })())
      : undefined,
    resolution: dbIssue.resolution || undefined,
    created_by: dbIssue.created_by || undefined,
    created_at: dbIssue.created_at,
    updated_at: dbIssue.updated_at,
  };
}

// ============================================================
// SYNC: SAVE TO LOCALSTORAGE (FOR BACKWARD COMPATIBILITY)
// ============================================================

export async function syncSpecialIssuesToLocalStorage(projectId?: string): Promise<void> {
  const issues = projectId ? await getSpecialIssues(projectId) : await getAllSpecialIssues();
  saveSpecialIssues(issues);
}
