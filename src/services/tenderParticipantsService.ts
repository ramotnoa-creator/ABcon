/**
 * Tender Participants Service - Neon Database API
 * Handles the relationship between tenders and participating professionals
 */

import { executeQuery, executeQuerySingle, isDemoMode as isNeonDemoMode } from '../lib/neon';
import type { TenderParticipant } from '../types';
import {
  getTenderParticipants as getTenderParticipantsLocal,
  getAllTenderParticipants as getAllTenderParticipantsLocal,
  saveTenderParticipants,
  addTenderParticipant as addTenderParticipantLocal,
  addTenderParticipants as addTenderParticipantsLocal,
  updateTenderParticipant as updateTenderParticipantLocal,
  deleteTenderParticipant as deleteTenderParticipantLocal,
  removeTenderParticipant as removeTenderParticipantLocal,
  setTenderWinner as setTenderWinnerLocal,
  clearTenderWinner as clearTenderWinnerLocal,
  getTenderParticipantById as getTenderParticipantByIdLocal,
  getParticipantByProfessional as getParticipantByProfessionalLocal,
} from '../data/tenderParticipantsStorage';

// Check if we're in demo mode
const isDemoMode = isNeonDemoMode;

// ============================================================
// GET TENDER PARTICIPANTS BY TENDER ID
// ============================================================

export async function getTenderParticipants(tenderId: string): Promise<TenderParticipant[]> {
  if (isDemoMode) {
    return getTenderParticipantsLocal(tenderId);
  }

  try {
    const data = await executeQuery<Record<string, unknown>>(
      `SELECT * FROM tender_participants
       WHERE tender_id = $1
       ORDER BY created_at ASC`,
      [tenderId]
    );

    return (data || []).map(transformTenderParticipantFromDB);
  } catch (error: unknown) {
    console.error('Error fetching tender participants:', error);
    return getTenderParticipantsLocal(tenderId);
  }
}

// ============================================================
// GET ALL TENDER PARTICIPANTS
// ============================================================

export async function getAllTenderParticipants(): Promise<TenderParticipant[]> {
  if (isDemoMode) {
    return getAllTenderParticipantsLocal();
  }

  try {
    const data = await executeQuery<Record<string, unknown>>(
      `SELECT * FROM tender_participants ORDER BY created_at ASC`
    );

    return (data || []).map(transformTenderParticipantFromDB);
  } catch (error: unknown) {
    console.error('Error fetching all tender participants:', error);
    return getAllTenderParticipantsLocal();
  }
}

// ============================================================
// GET TENDER PARTICIPANT BY ID
// ============================================================

export async function getTenderParticipantById(id: string): Promise<TenderParticipant | null> {
  if (isDemoMode) {
    return getTenderParticipantByIdLocal(id);
  }

  try {
    const data = await executeQuerySingle<Record<string, unknown>>(
      `SELECT * FROM tender_participants WHERE id = $1`,
      [id]
    );

    return data ? transformTenderParticipantFromDB(data) : null;
  } catch (error: unknown) {
    console.error('Error fetching tender participant:', error);
    return getTenderParticipantByIdLocal(id);
  }
}

// ============================================================
// GET PARTICIPANT BY PROFESSIONAL
// ============================================================

export async function getParticipantByProfessional(
  tenderId: string,
  professionalId: string
): Promise<TenderParticipant | null> {
  if (isDemoMode) {
    return getParticipantByProfessionalLocal(tenderId, professionalId);
  }

  try {
    const data = await executeQuerySingle<Record<string, unknown>>(
      `SELECT * FROM tender_participants
       WHERE tender_id = $1 AND professional_id = $2`,
      [tenderId, professionalId]
    );

    return data ? transformTenderParticipantFromDB(data) : null;
  } catch (error: unknown) {
    console.error('Error fetching participant by professional:', error);
    return getParticipantByProfessionalLocal(tenderId, professionalId);
  }
}

// ============================================================
// CREATE TENDER PARTICIPANT
// ============================================================

export async function createTenderParticipant(
  participant: Omit<TenderParticipant, 'id' | 'created_at'>
): Promise<TenderParticipant> {
  if (isDemoMode) {
    const newParticipant: TenderParticipant = {
      ...participant,
      id: `tp-${Date.now()}-${participant.professional_id}`,
      created_at: new Date().toISOString(),
    };
    addTenderParticipantLocal(newParticipant);
    return newParticipant;
  }

  try {
    // Check if already exists
    const existing = await getParticipantByProfessional(
      participant.tender_id,
      participant.professional_id
    );

    if (existing) {
      return existing; // Already exists, return it
    }

    const data = await executeQuerySingle<Record<string, unknown>>(
      `INSERT INTO tender_participants (
        tender_id, professional_id, quote_file, total_amount, notes, is_winner
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        participant.tender_id,
        participant.professional_id,
        participant.quote_file || null,
        participant.total_amount || null,
        participant.notes || null,
        participant.is_winner,
      ]
    );

    if (!data) {
      throw new Error('Failed to create tender participant');
    }

    return transformTenderParticipantFromDB(data);
  } catch (error: unknown) {
    console.error('Error creating tender participant:', error);
    // Fallback to localStorage
    const newParticipant: TenderParticipant = {
      ...participant,
      id: `tp-${Date.now()}-${participant.professional_id}`,
      created_at: new Date().toISOString(),
    };
    addTenderParticipantLocal(newParticipant);
    return newParticipant;
  }
}

// ============================================================
// ADD MULTIPLE TENDER PARTICIPANTS
// ============================================================

export async function addTenderParticipants(
  tenderId: string,
  professionalIds: string[]
): Promise<void> {
  if (isDemoMode) {
    addTenderParticipantsLocal(tenderId, professionalIds);
    return;
  }

  try {
    const now = new Date().toISOString();

    for (const professionalId of professionalIds) {
      // Check if already exists
      const existing = await getParticipantByProfessional(tenderId, professionalId);

      if (!existing) {
        await executeQuery(
          `INSERT INTO tender_participants (tender_id, professional_id, is_winner, created_at)
           VALUES ($1, $2, $3, $4)`,
          [tenderId, professionalId, false, now]
        );
      }
    }
  } catch (error: unknown) {
    console.error('Error adding tender participants:', error);
    // Fallback to localStorage
    addTenderParticipantsLocal(tenderId, professionalIds);
  }
}

// ============================================================
// UPDATE TENDER PARTICIPANT
// ============================================================

export async function updateTenderParticipant(
  id: string,
  updates: Partial<TenderParticipant>
): Promise<void> {
  if (isDemoMode) {
    updateTenderParticipantLocal(id, updates);
    return;
  }

  try {
    // Build SET clause dynamically
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updates.quote_file !== undefined) {
      setClauses.push(`quote_file = $${paramIndex++}`);
      values.push(updates.quote_file);
    }
    if (updates.total_amount !== undefined) {
      setClauses.push(`total_amount = $${paramIndex++}`);
      values.push(updates.total_amount);
    }
    if (updates.notes !== undefined) {
      setClauses.push(`notes = $${paramIndex++}`);
      values.push(updates.notes);
    }
    if (updates.is_winner !== undefined) {
      setClauses.push(`is_winner = $${paramIndex++}`);
      values.push(updates.is_winner);
    }

    if (setClauses.length === 0) {
      return; // Nothing to update
    }

    // Add participant ID as final parameter
    values.push(id);

    const query = `UPDATE tender_participants SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`;

    await executeQuery(query, values);
  } catch (error: unknown) {
    console.error('Error updating tender participant:', error);
    // Fallback to localStorage
    updateTenderParticipantLocal(id, updates);
  }
}

// ============================================================
// DELETE TENDER PARTICIPANT
// ============================================================

export async function deleteTenderParticipant(id: string): Promise<void> {
  if (isDemoMode) {
    deleteTenderParticipantLocal(id);
    return;
  }

  try {
    await executeQuery(`DELETE FROM tender_participants WHERE id = $1`, [id]);
  } catch (error: unknown) {
    console.error('Error deleting tender participant:', error);
    // Fallback to localStorage
    deleteTenderParticipantLocal(id);
  }
}

// ============================================================
// REMOVE TENDER PARTICIPANT (BY TENDER & PROFESSIONAL)
// ============================================================

export async function removeTenderParticipant(
  tenderId: string,
  professionalId: string
): Promise<void> {
  if (isDemoMode) {
    removeTenderParticipantLocal(tenderId, professionalId);
    return;
  }

  try {
    await executeQuery(
      `DELETE FROM tender_participants
       WHERE tender_id = $1 AND professional_id = $2`,
      [tenderId, professionalId]
    );
  } catch (error: unknown) {
    console.error('Error removing tender participant:', error);
    // Fallback to localStorage
    removeTenderParticipantLocal(tenderId, professionalId);
  }
}

// ============================================================
// SET TENDER WINNER
// ============================================================

export async function setTenderWinner(tenderId: string, participantId: string): Promise<void> {
  if (isDemoMode) {
    setTenderWinnerLocal(tenderId, participantId);
    return;
  }

  try {
    // First, reset all winners for this tender
    await executeQuery(
      `UPDATE tender_participants
       SET is_winner = false
       WHERE tender_id = $1`,
      [tenderId]
    );

    // Then set the new winner
    await executeQuery(
      `UPDATE tender_participants
       SET is_winner = true
       WHERE id = $1`,
      [participantId]
    );
  } catch (error: unknown) {
    console.error('Error setting tender winner:', error);
    // Fallback to localStorage
    setTenderWinnerLocal(tenderId, participantId);
  }
}

// ============================================================
// CLEAR TENDER WINNER
// ============================================================

export async function clearTenderWinner(tenderId: string): Promise<void> {
  if (isDemoMode) {
    clearTenderWinnerLocal(tenderId);
    return;
  }

  try {
    await executeQuery(
      `UPDATE tender_participants
       SET is_winner = false
       WHERE tender_id = $1`,
      [tenderId]
    );
  } catch (error: unknown) {
    console.error('Error clearing tender winner:', error);
    // Fallback to localStorage
    clearTenderWinnerLocal(tenderId);
  }
}

// ============================================================
// HELPER: TRANSFORM DB TO APP FORMAT
// ============================================================

function transformTenderParticipantFromDB(dbParticipant: any): TenderParticipant {
  return {
    id: dbParticipant.id,
    tender_id: dbParticipant.tender_id,
    professional_id: dbParticipant.professional_id,
    quote_file: dbParticipant.quote_file || undefined,
    total_amount: dbParticipant.total_amount || undefined,
    notes: dbParticipant.notes || undefined,
    is_winner: dbParticipant.is_winner,
    created_at: dbParticipant.created_at,
  };
}

// ============================================================
// SYNC: SAVE TO LOCALSTORAGE (FOR BACKWARD COMPATIBILITY)
// ============================================================

export async function syncTenderParticipantsToLocalStorage(): Promise<void> {
  const participants = await getAllTenderParticipants();
  saveTenderParticipants(participants);
}
