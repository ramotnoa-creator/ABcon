import type { Professional, ProjectProfessional } from '../types';
import { seedProfessionals } from './professionalsData';

const PROFESSIONALS_STORAGE_KEY = 'anprojects:professionals';
const PROJECT_PROFESSIONALS_STORAGE_KEY = 'anprojects:project_professionals';

// Professionals storage
export function getProfessionals(): Professional[] {
  try {
    const raw = localStorage.getItem(PROFESSIONALS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Professional[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // Seed if empty
    saveProfessionals(seedProfessionals);
    return seedProfessionals;
  } catch (error) {
    console.error('Error reading professionals from localStorage:', error);
    return seedProfessionals;
  }
}

export function saveProfessionals(professionals: Professional[]): void {
  try {
    localStorage.setItem(PROFESSIONALS_STORAGE_KEY, JSON.stringify(professionals));
  } catch (error) {
    console.error('Error saving professionals to localStorage:', error);
  }
}

export function getProfessionalById(id: string): Professional | null {
  const professionals = getProfessionals();
  return professionals.find(p => p.id === id) || null;
}

export function addProfessional(professional: Professional): void {
  const professionals = getProfessionals();
  professionals.push(professional);
  saveProfessionals(professionals);
}

export function updateProfessional(id: string, updates: Partial<Professional>): void {
  const professionals = getProfessionals();
  const index = professionals.findIndex(p => p.id === id);
  if (index !== -1) {
    professionals[index] = { ...professionals[index], ...updates };
    saveProfessionals(professionals);
  }
}

export function deleteProfessional(id: string): void {
  const professionals = getProfessionals();
  const updated = professionals.map(p =>
    p.id === id ? { ...p, is_active: false } : p
  );
  saveProfessionals(updated);
}

// Project Professionals storage
export function getProjectProfessionals(projectId: string): ProjectProfessional[] {
  try {
    const raw = localStorage.getItem(PROJECT_PROFESSIONALS_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as ProjectProfessional[];
      if (Array.isArray(all)) {
        return all.filter(pp => pp.project_id === projectId && pp.is_active);
      }
    }
  } catch (error) {
    console.error('Error reading project professionals from localStorage:', error);
  }
  return [];
}

export function getAllProjectProfessionals(): ProjectProfessional[] {
  try {
    const raw = localStorage.getItem(PROJECT_PROFESSIONALS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ProjectProfessional[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading all project professionals from localStorage:', error);
  }
  return [];
}

export function saveProjectProfessionals(projectProfessionals: ProjectProfessional[]): void {
  try {
    localStorage.setItem(PROJECT_PROFESSIONALS_STORAGE_KEY, JSON.stringify(projectProfessionals));
  } catch (error) {
    console.error('Error saving project professionals to localStorage:', error);
  }
}

export function addProjectProfessional(projectProfessional: ProjectProfessional): void {
  const all = getAllProjectProfessionals();
  all.push(projectProfessional);
  saveProjectProfessionals(all);
}

export function removeProjectProfessional(projectId: string, professionalId: string): void {
  const all = getAllProjectProfessionals();
  const updated = all.map(pp => {
    if (pp.project_id === projectId && pp.professional_id === professionalId) {
      return { ...pp, is_active: false };
    }
    return pp;
  });
  saveProjectProfessionals(updated);
}

export function getProjectProfessionalsWithDetails(projectId: string): Array<ProjectProfessional & { professional: Professional }> {
  const projectProfessionals = getProjectProfessionals(projectId);
  const professionals = getProfessionals();
  
  return projectProfessionals
    .map(pp => {
      const professional = professionals.find(p => p.id === pp.professional_id);
      if (professional) {
        return { ...pp, professional };
      }
      return null;
    })
    .filter((item): item is ProjectProfessional & { professional: Professional } => item !== null);
}
