import type { Permit } from '../types';

const PERMITS_STORAGE_KEY = 'anprojects:permits';

export function getPermits(projectId: string): Permit[] {
  try {
    const raw = localStorage.getItem(PERMITS_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as Permit[];
      if (Array.isArray(all)) {
        return all
          .filter((permit) => permit.project_id === projectId)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
    }
  } catch (error) {
    console.error('Error reading permits from localStorage:', error);
  }
  return [];
}

export function getAllPermits(): Permit[] {
  try {
    const raw = localStorage.getItem(PERMITS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Permit[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading all permits from localStorage:', error);
  }
  return [];
}

export function savePermits(permits: Permit[]): void {
  try {
    localStorage.setItem(PERMITS_STORAGE_KEY, JSON.stringify(permits));
  } catch (error) {
    console.error('Error saving permits to localStorage:', error);
  }
}

export function addPermit(permit: Permit): void {
  const all = getAllPermits();
  all.push(permit);
  savePermits(all);
}

export function updatePermit(id: string, updates: Partial<Permit>): void {
  const all = getAllPermits();
  const index = all.findIndex((permit) => permit.id === id);
  if (index !== -1) {
    all[index] = { ...all[index], ...updates, updated_at: new Date().toISOString() };
    savePermits(all);
  }
}

export function deletePermit(id: string): void {
  const all = getAllPermits();
  const filtered = all.filter((permit) => permit.id !== id);
  savePermits(filtered);
}

export function getPermitById(id: string): Permit | null {
  const all = getAllPermits();
  return all.find((permit) => permit.id === id) || null;
}
