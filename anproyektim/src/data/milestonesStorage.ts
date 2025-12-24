import type { ProjectMilestone } from '../types';

const MILESTONES_STORAGE_KEY = 'anprojects:milestones';

export function getMilestones(projectId: string): ProjectMilestone[] {
  try {
    const raw = localStorage.getItem(MILESTONES_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as ProjectMilestone[];
      if (Array.isArray(all)) {
        return all
          .filter((milestone) => milestone.project_id === projectId)
          .sort((a, b) => a.order - b.order);
      }
    }
  } catch (error) {
    console.error('Error reading milestones from localStorage:', error);
  }
  return [];
}

export function getMilestonesByUnit(projectId: string, unitId: string): ProjectMilestone[] {
  try {
    const raw = localStorage.getItem(MILESTONES_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as ProjectMilestone[];
      if (Array.isArray(all)) {
        return all
          .filter((milestone) => milestone.project_id === projectId && milestone.unit_id === unitId)
          .sort((a, b) => a.order - b.order);
      }
    }
  } catch (error) {
    console.error('Error reading milestones by unit from localStorage:', error);
  }
  return [];
}

export function getAllMilestones(): ProjectMilestone[] {
  try {
    const raw = localStorage.getItem(MILESTONES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ProjectMilestone[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading all milestones from localStorage:', error);
  }
  return [];
}

export function saveMilestones(milestones: ProjectMilestone[]): void {
  try {
    localStorage.setItem(MILESTONES_STORAGE_KEY, JSON.stringify(milestones));
  } catch (error) {
    console.error('Error saving milestones to localStorage:', error);
  }
}

export function addMilestone(milestone: ProjectMilestone): void {
  const all = getAllMilestones();
  all.push(milestone);
  saveMilestones(all);
}

export function updateMilestone(id: string, updates: Partial<ProjectMilestone>): void {
  const all = getAllMilestones();
  const index = all.findIndex((milestone) => milestone.id === id);
  if (index !== -1) {
    all[index] = { ...all[index], ...updates, updated_at: new Date().toISOString() };
    saveMilestones(all);
  }
}

export function deleteMilestone(id: string): void {
  const all = getAllMilestones();
  const filtered = all.filter((milestone) => milestone.id !== id);
  saveMilestones(filtered);
}

export function getMilestoneById(id: string): ProjectMilestone | null {
  const all = getAllMilestones();
  return all.find((milestone) => milestone.id === id) || null;
}

export function getNextMilestoneOrder(projectId: string): number {
  const projectMilestones = getMilestones(projectId);
  if (projectMilestones.length === 0) {
    return 1;
  }
  const maxOrder = Math.max(...projectMilestones.map((m) => m.order));
  return maxOrder + 1;
}

export function getMilestoneStats(projectId: string): { total: number; completed: number; pending: number; inProgress: number } {
  const milestones = getMilestones(projectId);
  return {
    total: milestones.length,
    completed: milestones.filter((m) => m.status === 'completed').length,
    pending: milestones.filter((m) => m.status === 'pending').length,
    inProgress: milestones.filter((m) => m.status === 'in-progress').length,
  };
}
