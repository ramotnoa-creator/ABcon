/**
 * Project Professionals Service - Neon Database API
 * Handles the many-to-many relationship between projects and professionals
 */

import { executeQuery, executeQuerySingle, isDemoMode as isNeonDemoMode } from '../lib/neon';
import type { ProjectProfessional } from '../types';
import {
  getAllProjectProfessionals as getProjectProfessionalsLocal,
  addProjectProfessional as addProjectProfessionalLocal,
  removeProjectProfessional as removeProjectProfessionalLocal,
} from '../data/professionalsStorage';

// Check if we're in demo mode
const isDemoMode = isNeonDemoMode;

// ============================================================
// GET PROJECT PROFESSIONALS BY PROJECT ID
// ============================================================

export async function getProjectProfessionalsByProjectId(
  projectId: string
): Promise<ProjectProfessional[]> {
  if (isDemoMode) {
    const all = getProjectProfessionalsLocal();
    return all.filter((pp) => pp.project_id === projectId && pp.is_active);
  }

  try {
    const data = await executeQuery<any>(
      `SELECT * FROM project_professionals
       WHERE project_id = $1 AND is_active = true
       ORDER BY start_date DESC`,
      [projectId]
    );

    return (data || []).map(transformProjectProfessionalFromDB);
  } catch (error) {
    console.error('Error fetching project professionals:', error);
    const all = getProjectProfessionalsLocal();
    return all.filter((pp) => pp.project_id === projectId && pp.is_active);
  }
}

// ============================================================
// GET PROJECT PROFESSIONALS BY PROFESSIONAL ID
// ============================================================

export async function getProjectProfessionalsByProfessionalId(
  professionalId: string
): Promise<ProjectProfessional[]> {
  if (isDemoMode) {
    const all = getProjectProfessionalsLocal();
    return all.filter((pp) => pp.professional_id === professionalId && pp.is_active);
  }

  try {
    const data = await executeQuery<any>(
      `SELECT * FROM project_professionals
       WHERE professional_id = $1 AND is_active = true
       ORDER BY start_date DESC`,
      [professionalId]
    );

    return (data || []).map(transformProjectProfessionalFromDB);
  } catch (error) {
    console.error('Error fetching project professionals:', error);
    const all = getProjectProfessionalsLocal();
    return all.filter((pp) => pp.professional_id === professionalId && pp.is_active);
  }
}

// ============================================================
// CREATE PROJECT PROFESSIONAL
// ============================================================

export async function createProjectProfessional(
  projectProfessional: Omit<ProjectProfessional, 'id'>
): Promise<ProjectProfessional> {
  if (isDemoMode) {
    const newPP: ProjectProfessional = {
      ...projectProfessional,
      id: `pp-${Date.now()}`,
    };
    addProjectProfessionalLocal(newPP);
    return newPP;
  }

  try {
    const data = await executeQuerySingle<any>(
      `INSERT INTO project_professionals (
        project_id, professional_id, project_role, source, start_date, is_active, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        projectProfessional.project_id,
        projectProfessional.professional_id,
        projectProfessional.project_role || null,
        projectProfessional.source || 'Manual',
        projectProfessional.start_date || null,
        projectProfessional.is_active,
        projectProfessional.notes || null,
      ]
    );

    if (!data) {
      throw new Error('Failed to create project professional');
    }

    return transformProjectProfessionalFromDB(data);
  } catch (error) {
    console.error('Error creating project professional:', error);
    // Fallback to localStorage
    const newPP: ProjectProfessional = {
      ...projectProfessional,
      id: `pp-${Date.now()}`,
    };
    addProjectProfessionalLocal(newPP);
    return newPP;
  }
}

// ============================================================
// REMOVE PROJECT PROFESSIONAL (SOFT DELETE)
// ============================================================

export async function removeProjectProfessional(
  projectId: string,
  professionalId: string
): Promise<void> {
  if (isDemoMode) {
    removeProjectProfessionalLocal(projectId, professionalId);
    return;
  }

  try {
    await executeQuery(
      `UPDATE project_professionals
       SET is_active = false
       WHERE project_id = $1 AND professional_id = $2`,
      [projectId, professionalId]
    );
  } catch (error) {
    console.error('Error removing project professional:', error);
    // Fallback to localStorage
    removeProjectProfessionalLocal(projectId, professionalId);
  }
}

// ============================================================
// HELPER: TRANSFORM DB TO APP FORMAT
// ============================================================

function transformProjectProfessionalFromDB(dbPP: any): ProjectProfessional {
  return {
    id: dbPP.id,
    project_id: dbPP.project_id,
    professional_id: dbPP.professional_id,
    project_role: dbPP.project_role || undefined,
    source: dbPP.source || 'Manual',
    start_date: dbPP.start_date || undefined,
    is_active: dbPP.is_active,
    notes: dbPP.notes || undefined,
    related_tender_id: dbPP.related_tender_id || undefined,
    related_tender_name: dbPP.related_tender_name || undefined,
  };
}
