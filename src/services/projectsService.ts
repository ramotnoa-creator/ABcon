/**
 * Projects Service - Neon Database API
 * Replaces localStorage with Neon PostgreSQL database queries
 */

import { executeQuery, executeQuerySingle, isDemoMode as isNeonDemoMode } from '../lib/neon';
import type { Project } from '../types';
import { getProjects as getProjectsLocal, saveProjects, addProject as addProjectLocal, updateProject as updateProjectLocal, deleteProject as deleteProjectLocal } from '../data/storage';

// Check if we're in demo mode
const isDemoMode = isNeonDemoMode;

// ============================================================
// GET ALL PROJECTS
// ============================================================

export async function getProjects(): Promise<Project[]> {
  // Fallback to localStorage in demo mode
  if (isDemoMode) {
    return getProjectsLocal();
  }

  try {
    const data = await executeQuery<Record<string, unknown>>(
      `SELECT * FROM projects ORDER BY created_at DESC`
    );

    // Transform database format to Project type
    return (data || []).map(transformProjectFromDB);
  } catch (error: unknown) {
    console.error('Error fetching projects:', error);
    // Fallback to localStorage on error
    return getProjectsLocal();
  }
}

// ============================================================
// GET PROJECT BY ID
// ============================================================

export async function getProjectById(id: string): Promise<Project | null> {
  if (isDemoMode) {
    const projects = getProjectsLocal();
    return projects.find(p => p.id === id) || null;
  }

  try {
    const data = await executeQuerySingle<Record<string, unknown>>(
      `SELECT * FROM projects WHERE id = $1`,
      [id]
    );

    return data ? transformProjectFromDB(data) : null;
  } catch (error: unknown) {
    console.error('Error fetching project:', error);
    const projects = getProjectsLocal();
    return projects.find(p => p.id === id) || null;
  }
}

// ============================================================
// CREATE PROJECT
// ============================================================

export async function createProject(
  project: Omit<Project, 'id' | 'created_at'>,
  userId?: string
): Promise<Project> {
  if (isDemoMode) {
    const newProject: Project = {
      ...project,
      id: `project-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    addProjectLocal(newProject);
    return newProject;
  }

  try {
    // Calculate permit_target_date if applicable
    let permitTargetDate: string | undefined;
    if (project.permit_start_date && project.permit_duration_months) {
      const startDate = new Date(project.permit_start_date);
      startDate.setMonth(startDate.getMonth() + project.permit_duration_months);
      permitTargetDate = startDate.toISOString().split('T')[0];
    }

    const data = await executeQuerySingle<Record<string, unknown>>(
      `INSERT INTO projects (
        project_name, client_name, address, status,
        permit_start_date, permit_duration_months, permit_target_date,
        permit_approval_date, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        project.project_name,
        project.client_name,
        project.address || null,
        project.status,
        project.permit_start_date || null,
        project.permit_duration_months || null,
        permitTargetDate || project.permit_target_date || null,
        project.permit_approval_date || null,
        project.notes || null,
      ]
    );

    if (!data) {
      throw new Error('Failed to create project');
    }

    const createdProject = transformProjectFromDB(data);

    // Assign project to current user if userId provided
    if (userId) {
      await assignUserToProject(userId, createdProject.id);
    }

    return createdProject;
  } catch (error: unknown) {
    console.error('Error creating project:', error);
    // Fallback to localStorage
    const newProject: Project = {
      ...project,
      id: `project-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    addProjectLocal(newProject);
    return newProject;
  }
}

// ============================================================
// UPDATE PROJECT
// ============================================================

export async function updateProject(id: string, updates: Partial<Project>): Promise<void> {
  if (isDemoMode) {
    updateProjectLocal(id, updates);
    return;
  }

  try {
    // Calculate permit_target_date if applicable
    let permitTargetDate: string | undefined;
    if (updates.permit_start_date && updates.permit_duration_months) {
      const startDate = new Date(updates.permit_start_date);
      startDate.setMonth(startDate.getMonth() + updates.permit_duration_months);
      permitTargetDate = startDate.toISOString().split('T')[0];
    }

    // Build SET clause dynamically based on what's being updated
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updates.project_name !== undefined) {
      setClauses.push(`project_name = $${paramIndex++}`);
      values.push(updates.project_name);
    }
    if (updates.client_name !== undefined) {
      setClauses.push(`client_name = $${paramIndex++}`);
      values.push(updates.client_name);
    }
    if (updates.address !== undefined) {
      setClauses.push(`address = $${paramIndex++}`);
      values.push(updates.address);
    }
    if (updates.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.permit_start_date !== undefined) {
      setClauses.push(`permit_start_date = $${paramIndex++}`);
      values.push(updates.permit_start_date);
    }
    if (updates.permit_duration_months !== undefined) {
      setClauses.push(`permit_duration_months = $${paramIndex++}`);
      values.push(updates.permit_duration_months);
    }
    if (permitTargetDate || updates.permit_target_date !== undefined) {
      setClauses.push(`permit_target_date = $${paramIndex++}`);
      values.push(permitTargetDate || updates.permit_target_date);
    }
    if (updates.permit_approval_date !== undefined) {
      setClauses.push(`permit_approval_date = $${paramIndex++}`);
      values.push(updates.permit_approval_date);
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

    // Add project ID as final parameter
    values.push(id);

    const query = `UPDATE projects SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`;

    await executeQuery(query, values);
  } catch (error: unknown) {
    console.error('Error updating project:', error);
    // Fallback to localStorage
    updateProjectLocal(id, updates);
  }
}

// ============================================================
// DELETE PROJECT
// ============================================================

export async function deleteProject(id: string): Promise<void> {
  if (isDemoMode) {
    deleteProjectLocal(id);
    return;
  }

  try {
    await executeQuery(
      `DELETE FROM projects WHERE id = $1`,
      [id]
    );
  } catch (error: unknown) {
    console.error('Error deleting project:', error);
    // Fallback to localStorage
    deleteProjectLocal(id);
  }
}

// ============================================================
// ASSIGN USER TO PROJECT
// ============================================================

export async function assignUserToProject(userId: string, projectId: string): Promise<void> {
  if (isDemoMode) {
    return; // Not applicable in demo mode
  }

  try {
    await executeQuery(
      `INSERT INTO project_assignments (user_id, project_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, project_id) DO NOTHING`,
      [userId, projectId]
    );
  } catch (error: unknown) {
    console.error('Error assigning user to project:', error);
  }
}

// ============================================================
// GET USER'S ASSIGNED PROJECTS
// ============================================================

export async function getUserProjects(userId: string): Promise<Project[]> {
  if (isDemoMode) {
    return getProjectsLocal(); // In demo mode, show all projects
  }

  try {
    const data = await executeQuery<Record<string, unknown>>(
      `SELECT p.* FROM projects p
       INNER JOIN project_assignments pa ON p.id = pa.project_id
       WHERE pa.user_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );

    return (data || []).map(transformProjectFromDB);
  } catch (error: unknown) {
    console.error('Error fetching user projects:', error);
    return getProjectsLocal();
  }
}

// ============================================================
// HELPER: TRANSFORM DB TO APP FORMAT
// ============================================================

function transformProjectFromDB(dbProject: any): Project {
  return {
    id: dbProject.id,
    project_name: dbProject.project_name,
    client_name: dbProject.client_name,
    address: dbProject.address,
    status: dbProject.status,
    permit_start_date: dbProject.permit_start_date,
    permit_duration_months: dbProject.permit_duration_months,
    permit_target_date: dbProject.permit_target_date,
    permit_approval_date: dbProject.permit_approval_date,
    notes: dbProject.notes,
    created_at: dbProject.created_at,
    updated_at_text: formatUpdatedAt(dbProject.updated_at || dbProject.created_at),
  };
}

function formatUpdatedAt(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'היום';
  if (diffInDays === 1) return 'אתמול';
  if (diffInDays < 7) return `לפני ${diffInDays} ימים`;

  const hebrewMonths = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  return `${date.getDate()} ב${hebrewMonths[date.getMonth()]} ${date.getFullYear()}`;
}

// ============================================================
// SYNC: SAVE TO LOCALSTORAGE (FOR BACKWARD COMPATIBILITY)
// ============================================================

export async function syncProjectsToLocalStorage(): Promise<void> {
  const projects = await getProjects();
  saveProjects(projects);
}
