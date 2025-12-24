import type { Task } from '../types';

const TASKS_STORAGE_KEY = 'anprojects:tasks';

export function getTasks(projectId: string): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as Task[];
      if (Array.isArray(all)) {
        return all.filter((t) => t.project_id === projectId);
      }
    }
  } catch (error) {
    console.error('Error reading tasks from localStorage:', error);
  }
  return [];
}

export function getAllTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Task[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading all tasks from localStorage:', error);
  }
  return [];
}

export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving tasks to localStorage:', error);
  }
}

export function addTask(task: Task): void {
  const all = getAllTasks();
  all.push(task);
  saveTasks(all);
}

export function updateTask(id: string, updates: Partial<Task>): void {
  const all = getAllTasks();
  const index = all.findIndex((t) => t.id === id);
  if (index !== -1) {
    all[index] = { ...all[index], ...updates, updated_at: new Date().toISOString() };
    saveTasks(all);
  }
}

export function deleteTask(id: string): void {
  const all = getAllTasks();
  const filtered = all.filter((t) => t.id !== id);
  saveTasks(filtered);
}
