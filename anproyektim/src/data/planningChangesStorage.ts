import type { PlanningChange } from '../types';

const PLANNING_CHANGES_STORAGE_KEY = 'anprojects:planning_changes';

export function getPlanningChanges(projectId: string): PlanningChange[] {
  try {
    const raw = localStorage.getItem(PLANNING_CHANGES_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as PlanningChange[];
      if (Array.isArray(all)) {
        return all
          .filter((pc) => pc.project_id === projectId)
          .sort((a, b) => a.change_number - b.change_number);
      }
    }
  } catch (error) {
    console.error('Error reading planning changes from localStorage:', error);
  }
  return [];
}

export function getAllPlanningChanges(): PlanningChange[] {
  try {
    const raw = localStorage.getItem(PLANNING_CHANGES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PlanningChange[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading all planning changes from localStorage:', error);
  }
  return [];
}

export function savePlanningChanges(changes: PlanningChange[]): void {
  try {
    localStorage.setItem(PLANNING_CHANGES_STORAGE_KEY, JSON.stringify(changes));
  } catch (error) {
    console.error('Error saving planning changes to localStorage:', error);
  }
}

export function getNextChangeNumber(projectId: string): number {
  const projectChanges = getPlanningChanges(projectId);
  if (projectChanges.length === 0) {
    return 1;
  }
  const maxNumber = Math.max(...projectChanges.map((pc) => pc.change_number));
  return maxNumber + 1;
}

export function addPlanningChange(change: Omit<PlanningChange, 'change_number'>): PlanningChange {
  const all = getAllPlanningChanges();
  const changeNumber = getNextChangeNumber(change.project_id);
  const newChange: PlanningChange = {
    ...change,
    change_number: changeNumber,
  };
  all.push(newChange);
  savePlanningChanges(all);
  return newChange;
}

export function updatePlanningChange(id: string, updates: Partial<PlanningChange>): void {
  const all = getAllPlanningChanges();
  const index = all.findIndex((pc) => pc.id === id);
  if (index !== -1) {
    all[index] = { ...all[index], ...updates, updated_at: new Date().toISOString() };
    savePlanningChanges(all);
  }
}

export function deletePlanningChange(id: string): void {
  const all = getAllPlanningChanges();
  const filtered = all.filter((pc) => pc.id !== id);
  savePlanningChanges(filtered);
}

export function getPlanningChangeById(id: string): PlanningChange | null {
  const all = getAllPlanningChanges();
  return all.find((pc) => pc.id === id) || null;
}
