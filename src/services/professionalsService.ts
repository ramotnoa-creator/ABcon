/**
 * Professionals Service - Neon Database API
 * Handles CRUD operations for professionals
 */

import { executeQuery, executeQuerySingle, isDemoMode as isNeonDemoMode } from '../lib/neon';
import type { Professional } from '../types';
import {
  getProfessionals as getProfessionalsLocal,
  saveProfessionals,
  addProfessional as addProfessionalLocal,
  updateProfessional as updateProfessionalLocal,
  deleteProfessional as deleteProfessionalLocal,
} from '../data/professionalsStorage';

// Check if we're in demo mode
const isDemoMode = isNeonDemoMode;

// ============================================================
// GET ALL PROFESSIONALS
// ============================================================

export async function getProfessionals(): Promise<Professional[]> {
  // Fallback to localStorage in demo mode
  if (isDemoMode) {
    return getProfessionalsLocal();
  }

  try {
    const data = await executeQuery<any>(
      `SELECT * FROM professionals ORDER BY professional_name ASC`
    );

    return (data || []).map(transformProfessionalFromDB);
  } catch (error) {
    console.error('Error fetching professionals:', error);
    // Fallback to localStorage on error
    return getProfessionalsLocal();
  }
}

// ============================================================
// GET PROFESSIONAL BY ID
// ============================================================

export async function getProfessionalById(id: string): Promise<Professional | null> {
  if (isDemoMode) {
    const professionals = getProfessionalsLocal();
    return professionals.find((p) => p.id === id) || null;
  }

  try {
    const data = await executeQuerySingle<any>(
      `SELECT * FROM professionals WHERE id = $1`,
      [id]
    );

    return data ? transformProfessionalFromDB(data) : null;
  } catch (error) {
    console.error('Error fetching professional:', error);
    const professionals = getProfessionalsLocal();
    return professionals.find((p) => p.id === id) || null;
  }
}

// ============================================================
// GET PROFESSIONALS BY FIELD
// ============================================================

export async function getProfessionalsByField(field: string): Promise<Professional[]> {
  if (isDemoMode) {
    const professionals = getProfessionalsLocal();
    return professionals.filter((p) => p.field === field);
  }

  try {
    const data = await executeQuery<any>(
      `SELECT * FROM professionals
       WHERE field = $1
       ORDER BY professional_name ASC`,
      [field]
    );

    return (data || []).map(transformProfessionalFromDB);
  } catch (error) {
    console.error('Error fetching professionals by field:', error);
    const professionals = getProfessionalsLocal();
    return professionals.filter((p) => p.field === field);
  }
}

// ============================================================
// GET ACTIVE PROFESSIONALS
// ============================================================

export async function getActiveProfessionals(): Promise<Professional[]> {
  if (isDemoMode) {
    const professionals = getProfessionalsLocal();
    return professionals.filter((p) => p.is_active);
  }

  try {
    const data = await executeQuery<any>(
      `SELECT * FROM professionals
       WHERE is_active = true
       ORDER BY professional_name ASC`
    );

    return (data || []).map(transformProfessionalFromDB);
  } catch (error) {
    console.error('Error fetching active professionals:', error);
    const professionals = getProfessionalsLocal();
    return professionals.filter((p) => p.is_active);
  }
}

// ============================================================
// CREATE PROFESSIONAL
// ============================================================

export async function createProfessional(
  professional: Omit<Professional, 'id'>
): Promise<Professional> {
  if (isDemoMode) {
    const newProfessional: Professional = {
      ...professional,
      id: `professional-${Date.now()}`,
    };
    addProfessionalLocal(newProfessional);
    return newProfessional;
  }

  try {
    const data = await executeQuerySingle<any>(
      `INSERT INTO professionals (
        professional_name, company_name, field, phone, email, rating, notes, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        professional.professional_name,
        professional.company_name || null,
        professional.field,
        professional.phone || null,
        professional.email || null,
        professional.rating || null,
        professional.notes || null,
        professional.is_active,
      ]
    );

    if (!data) {
      throw new Error('Failed to create professional');
    }

    return transformProfessionalFromDB(data);
  } catch (error) {
    console.error('Error creating professional:', error);
    // Fallback to localStorage
    const newProfessional: Professional = {
      ...professional,
      id: `professional-${Date.now()}`,
    };
    addProfessionalLocal(newProfessional);
    return newProfessional;
  }
}

// ============================================================
// UPDATE PROFESSIONAL
// ============================================================

export async function updateProfessional(
  id: string,
  updates: Partial<Professional>
): Promise<void> {
  if (isDemoMode) {
    updateProfessionalLocal(id, updates);
    return;
  }

  try {
    // Build SET clause dynamically
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.professional_name !== undefined) {
      setClauses.push(`professional_name = $${paramIndex++}`);
      values.push(updates.professional_name);
    }
    if (updates.company_name !== undefined) {
      setClauses.push(`company_name = $${paramIndex++}`);
      values.push(updates.company_name);
    }
    if (updates.field !== undefined) {
      setClauses.push(`field = $${paramIndex++}`);
      values.push(updates.field);
    }
    if (updates.phone !== undefined) {
      setClauses.push(`phone = $${paramIndex++}`);
      values.push(updates.phone);
    }
    if (updates.email !== undefined) {
      setClauses.push(`email = $${paramIndex++}`);
      values.push(updates.email);
    }
    if (updates.rating !== undefined) {
      setClauses.push(`rating = $${paramIndex++}`);
      values.push(updates.rating);
    }
    if (updates.notes !== undefined) {
      setClauses.push(`notes = $${paramIndex++}`);
      values.push(updates.notes);
    }
    if (updates.is_active !== undefined) {
      setClauses.push(`is_active = $${paramIndex++}`);
      values.push(updates.is_active);
    }

    if (setClauses.length === 0) {
      return; // Nothing to update
    }

    // Always update updated_at
    setClauses.push(`updated_at = NOW()`);

    // Add professional ID as final parameter
    values.push(id);

    const query = `UPDATE professionals SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`;

    await executeQuery(query, values);
  } catch (error) {
    console.error('Error updating professional:', error);
    // Fallback to localStorage
    updateProfessionalLocal(id, updates);
  }
}

// ============================================================
// DELETE PROFESSIONAL
// ============================================================

export async function deleteProfessional(id: string): Promise<void> {
  if (isDemoMode) {
    deleteProfessionalLocal(id);
    return;
  }

  try {
    await executeQuery(`DELETE FROM professionals WHERE id = $1`, [id]);
  } catch (error) {
    console.error('Error deleting professional:', error);
    // Fallback to localStorage
    deleteProfessionalLocal(id);
  }
}

// ============================================================
// HELPER: TRANSFORM DB TO APP FORMAT
// ============================================================

function transformProfessionalFromDB(dbProfessional: any): Professional {
  return {
    id: dbProfessional.id,
    professional_name: dbProfessional.professional_name,
    company_name: dbProfessional.company_name || undefined,
    field: dbProfessional.field,
    phone: dbProfessional.phone || undefined,
    email: dbProfessional.email || undefined,
    rating: dbProfessional.rating || undefined,
    notes: dbProfessional.notes || undefined,
    is_active: dbProfessional.is_active,
  };
}

// ============================================================
// SYNC: SAVE TO LOCALSTORAGE (FOR BACKWARD COMPATIBILITY)
// ============================================================

export async function syncProfessionalsToLocalStorage(): Promise<void> {
  const professionals = await getProfessionals();
  saveProfessionals(professionals);
}
