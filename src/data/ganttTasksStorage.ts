import type { GanttTask } from '../types';

const GANTT_TASKS_STORAGE_KEY = 'anprojects:gantt_tasks';

export function getGanttTasks(projectId: string): GanttTask[] {
  try {
    const raw = localStorage.getItem(GANTT_TASKS_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as GanttTask[];
      if (Array.isArray(all)) {
        return all
          .filter((task) => task.project_id === projectId)
          .sort((a, b) => a.order - b.order);
      }
    }
  } catch (error) {
    console.error('Error reading gantt tasks from localStorage:', error);
  }
  return [];
}

export function getGanttTasksByMilestone(projectId: string, milestoneId: string): GanttTask[] {
  try {
    const raw = localStorage.getItem(GANTT_TASKS_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as GanttTask[];
      if (Array.isArray(all)) {
        return all
          .filter((task) => task.project_id === projectId && task.milestone_id === milestoneId)
          .sort((a, b) => a.order - b.order);
      }
    }
  } catch (error) {
    console.error('Error reading gantt tasks by milestone from localStorage:', error);
  }
  return [];
}

export function getAllGanttTasks(): GanttTask[] {
  try {
    const raw = localStorage.getItem(GANTT_TASKS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GanttTask[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading all gantt tasks from localStorage:', error);
  }
  return [];
}

export function saveGanttTasks(tasks: GanttTask[]): void {
  try {
    localStorage.setItem(GANTT_TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving gantt tasks to localStorage:', error);
  }
}

export function addGanttTask(task: GanttTask): void {
  const all = getAllGanttTasks();
  all.push(task);
  saveGanttTasks(all);
}

export function updateGanttTask(id: string, updates: Partial<GanttTask>): void {
  const all = getAllGanttTasks();
  const index = all.findIndex((task) => task.id === id);
  if (index !== -1) {
    all[index] = { ...all[index], ...updates, updated_at: new Date().toISOString() };
    saveGanttTasks(all);
  }
}

export function deleteGanttTask(id: string): void {
  const all = getAllGanttTasks();
  const filtered = all.filter((task) => task.id !== id);
  saveGanttTasks(filtered);
}

export function getGanttTaskById(id: string): GanttTask | null {
  const all = getAllGanttTasks();
  return all.find((task) => task.id === id) || null;
}

export function getNextGanttTaskOrder(projectId: string): number {
  const projectTasks = getGanttTasks(projectId);
  if (projectTasks.length === 0) {
    return 1;
  }
  const maxOrder = Math.max(...projectTasks.map((t) => t.order));
  return maxOrder + 1;
}

export function getGanttTaskStats(projectId: string): {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  averageProgress: number;
} {
  const tasks = getGanttTasks(projectId);
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const pending = tasks.filter((t) => t.status === 'pending').length;
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
  const averageProgress = total > 0
    ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / total)
    : 0;

  return { total, completed, pending, inProgress, averageProgress };
}

export function deleteGanttTasksByMilestone(milestoneId: string): void {
  const all = getAllGanttTasks();
  const filtered = all.filter((task) => task.milestone_id !== milestoneId);
  saveGanttTasks(filtered);
}
