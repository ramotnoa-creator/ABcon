import type { Tender } from '../types';

const TENDERS_STORAGE_KEY = 'anproyektim:tenders';

export function getTenders(projectId: string): Tender[] {
  try {
    const raw = localStorage.getItem(TENDERS_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as Tender[];
      if (Array.isArray(all)) {
        return all.filter((t) => t.project_id === projectId);
      }
    }
  } catch (error) {
    console.error('Error reading tenders from localStorage:', error);
  }
  return [];
}

export function getAllTenders(): Tender[] {
  try {
    const raw = localStorage.getItem(TENDERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Tender[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading all tenders from localStorage:', error);
  }
  return [];
}

export function saveTenders(tenders: Tender[]): void {
  try {
    localStorage.setItem(TENDERS_STORAGE_KEY, JSON.stringify(tenders));
  } catch (error) {
    console.error('Error saving tenders to localStorage:', error);
  }
}

export function addTender(tender: Tender): void {
  const all = getAllTenders();
  all.push(tender);
  saveTenders(all);
}

export function updateTender(id: string, updates: Partial<Tender>): void {
  const all = getAllTenders();
  const index = all.findIndex((t) => t.id === id);
  if (index !== -1) {
    all[index] = { ...all[index], ...updates, updated_at: new Date().toISOString() };
    saveTenders(all);
  }
}

export function deleteTender(id: string): void {
  const all = getAllTenders();
  const filtered = all.filter((t) => t.id !== id);
  saveTenders(filtered);
}

export function getTenderById(id: string): Tender | null {
  const all = getAllTenders();
  return all.find((t) => t.id === id) || null;
}
