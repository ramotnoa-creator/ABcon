import type { TenderParticipant } from '../types';

const TENDER_PARTICIPANTS_STORAGE_KEY = 'anprojects:tender_participants';

export function getTenderParticipants(tenderId: string): TenderParticipant[] {
  try {
    const raw = localStorage.getItem(TENDER_PARTICIPANTS_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as TenderParticipant[];
      if (Array.isArray(all)) {
        return all.filter((tp) => tp.tender_id === tenderId);
      }
    }
  } catch (error) {
    console.error('Error reading tender participants from localStorage:', error);
  }
  return [];
}

export function getAllTenderParticipants(): TenderParticipant[] {
  try {
    const raw = localStorage.getItem(TENDER_PARTICIPANTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TenderParticipant[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading all tender participants from localStorage:', error);
  }
  return [];
}

export function saveTenderParticipants(participants: TenderParticipant[]): void {
  try {
    localStorage.setItem(TENDER_PARTICIPANTS_STORAGE_KEY, JSON.stringify(participants));
  } catch (error) {
    console.error('Error saving tender participants to localStorage:', error);
  }
}

export function addTenderParticipant(participant: TenderParticipant): void {
  const all = getAllTenderParticipants();
  // Check if already exists
  const exists = all.some(
    (p) => p.tender_id === participant.tender_id && p.professional_id === participant.professional_id
  );
  if (!exists) {
    all.push(participant);
    saveTenderParticipants(all);
  }
}

export function addTenderParticipants(tenderId: string, professionalIds: string[]): void {
  const all = getAllTenderParticipants();
  const now = new Date().toISOString();

  professionalIds.forEach((professionalId) => {
    const exists = all.some(
      (p) => p.tender_id === tenderId && p.professional_id === professionalId
    );
    if (!exists) {
      all.push({
        id: `tp-${Date.now()}-${professionalId}`,
        tender_id: tenderId,
        professional_id: professionalId,
        is_winner: false,
        created_at: now,
      });
    }
  });

  saveTenderParticipants(all);
}

export function updateTenderParticipant(id: string, updates: Partial<TenderParticipant>): void {
  const all = getAllTenderParticipants();
  const index = all.findIndex((tp) => tp.id === id);
  if (index !== -1) {
    all[index] = { ...all[index], ...updates };
    saveTenderParticipants(all);
  }
}

export function deleteTenderParticipant(id: string): void {
  const all = getAllTenderParticipants();
  const filtered = all.filter((tp) => tp.id !== id);
  saveTenderParticipants(filtered);
}

export function removeTenderParticipant(tenderId: string, professionalId: string): void {
  const all = getAllTenderParticipants();
  const filtered = all.filter(
    (tp) => !(tp.tender_id === tenderId && tp.professional_id === professionalId)
  );
  saveTenderParticipants(filtered);
}

export function setTenderWinner(tenderId: string, participantId: string): void {
  const all = getAllTenderParticipants();

  // Reset all winners for this tender, set new winner
  all.forEach((tp) => {
    if (tp.tender_id === tenderId) {
      tp.is_winner = tp.id === participantId;
    }
  });

  saveTenderParticipants(all);
}

export function clearTenderWinner(tenderId: string): void {
  const all = getAllTenderParticipants();

  all.forEach((tp) => {
    if (tp.tender_id === tenderId) {
      tp.is_winner = false;
    }
  });

  saveTenderParticipants(all);
}

export function getTenderParticipantById(id: string): TenderParticipant | null {
  const all = getAllTenderParticipants();
  return all.find((tp) => tp.id === id) || null;
}

export function getParticipantByProfessional(tenderId: string, professionalId: string): TenderParticipant | null {
  const all = getAllTenderParticipants();
  return all.find((tp) => tp.tender_id === tenderId && tp.professional_id === professionalId) || null;
}
