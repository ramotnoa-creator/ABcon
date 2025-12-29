import type { ProjectUnit } from '../types';

const UNITS_STORAGE_KEY = 'anprojects:units';

export function getUnits(projectId: string): ProjectUnit[] {
  try {
    const raw = localStorage.getItem(UNITS_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as ProjectUnit[];
      if (Array.isArray(all)) {
        return all
          .filter((unit) => unit.project_id === projectId)
          .sort((a, b) => a.order - b.order);
      }
    }
  } catch (error) {
    console.error('Error reading units from localStorage:', error);
  }
  return [];
}

export function getAllUnits(): ProjectUnit[] {
  try {
    const raw = localStorage.getItem(UNITS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ProjectUnit[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading all units from localStorage:', error);
  }
  return [];
}

export function saveUnits(units: ProjectUnit[]): void {
  try {
    localStorage.setItem(UNITS_STORAGE_KEY, JSON.stringify(units));
  } catch (error) {
    console.error('Error saving units to localStorage:', error);
  }
}

export function addUnit(unit: ProjectUnit): void {
  const all = getAllUnits();
  all.push(unit);
  saveUnits(all);
}

export function updateUnit(id: string, updates: Partial<ProjectUnit>): void {
  const all = getAllUnits();
  const index = all.findIndex((unit) => unit.id === id);
  if (index !== -1) {
    all[index] = { ...all[index], ...updates, updated_at: new Date().toISOString() };
    saveUnits(all);
  }
}

export function deleteUnit(id: string): void {
  const all = getAllUnits();
  const filtered = all.filter((unit) => unit.id !== id);
  saveUnits(filtered);
}

export function getUnitById(id: string): ProjectUnit | null {
  const all = getAllUnits();
  return all.find((unit) => unit.id === id) || null;
}

export function getNextUnitOrder(projectId: string): number {
  const projectUnits = getUnits(projectId);
  if (projectUnits.length === 0) {
    return 1;
  }
  const maxOrder = Math.max(...projectUnits.map((u) => u.order));
  return maxOrder + 1;
}
