import type { SpecialIssue } from '../types';

const SPECIAL_ISSUES_STORAGE_KEY = 'anprojects:special_issues';

export function getSpecialIssues(projectId: string): SpecialIssue[] {
  try {
    const raw = localStorage.getItem(SPECIAL_ISSUES_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as SpecialIssue[];
      if (Array.isArray(all)) {
        return all
          .filter((issue) => issue.project_id === projectId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    }
  } catch (error) {
    console.error('Error reading special issues from localStorage:', error);
  }
  return [];
}

export function getAllSpecialIssues(): SpecialIssue[] {
  try {
    const raw = localStorage.getItem(SPECIAL_ISSUES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SpecialIssue[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading all special issues from localStorage:', error);
  }
  return [];
}

export function saveSpecialIssues(issues: SpecialIssue[]): void {
  try {
    localStorage.setItem(SPECIAL_ISSUES_STORAGE_KEY, JSON.stringify(issues));
  } catch (error) {
    console.error('Error saving special issues to localStorage:', error);
  }
}

export function addSpecialIssue(issue: SpecialIssue): void {
  const all = getAllSpecialIssues();
  all.push(issue);
  saveSpecialIssues(all);
}

export function updateSpecialIssue(id: string, updates: Partial<SpecialIssue>): void {
  const all = getAllSpecialIssues();
  const index = all.findIndex((issue) => issue.id === id);
  if (index !== -1) {
    all[index] = { ...all[index], ...updates, updated_at: new Date().toISOString() };
    saveSpecialIssues(all);
  }
}

export function deleteSpecialIssue(id: string): void {
  const all = getAllSpecialIssues();
  const filtered = all.filter((issue) => issue.id !== id);
  saveSpecialIssues(filtered);
}

export function getSpecialIssueById(id: string): SpecialIssue | null {
  const all = getAllSpecialIssues();
  return all.find((issue) => issue.id === id) || null;
}

export function getOpenIssuesCount(projectId: string): number {
  const issues = getSpecialIssues(projectId);
  return issues.filter((issue) => issue.status === 'open').length;
}
