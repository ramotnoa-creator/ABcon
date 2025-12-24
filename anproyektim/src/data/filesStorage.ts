import type { File } from '../types';

const FILES_STORAGE_KEY = 'anprojects:files';

export function getFiles(projectId?: string): File[] {
  try {
    const raw = localStorage.getItem(FILES_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as File[];
      if (Array.isArray(all)) {
        if (projectId) {
          // Return files linked to this project
          return all.filter(
            (f) => f.related_entity_type === 'Project' && f.related_entity_id === projectId
          );
        }
        return all;
      }
    }
  } catch (error) {
    console.error('Error reading files from localStorage:', error);
  }
  return [];
}

export function getAllFiles(): File[] {
  try {
    const raw = localStorage.getItem(FILES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as File[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading all files from localStorage:', error);
  }
  return [];
}

export function saveFiles(files: File[]): void {
  try {
    localStorage.setItem(FILES_STORAGE_KEY, JSON.stringify(files));
  } catch (error) {
    console.error('Error saving files to localStorage:', error);
  }
}

export function addFile(file: File): void {
  const all = getAllFiles();
  all.push(file);
  saveFiles(all);
}

export function updateFile(id: string, updates: Partial<File>): void {
  const all = getAllFiles();
  const index = all.findIndex((f) => f.id === id);
  if (index !== -1) {
    all[index] = { ...all[index], ...updates, updated_at: new Date().toISOString() };
    saveFiles(all);
  }
}

export function removeFile(id: string): void {
  const all = getAllFiles();
  const filtered = all.filter((f) => f.id !== id);
  saveFiles(filtered);
}

export function removeFileFromProject(fileId: string): void {
  // Remove project association (make it global-only)
  updateFile(fileId, {
    related_entity_type: undefined,
    related_entity_id: undefined,
    related_entity_name: undefined,
  });
}
