import type { BudgetChapter } from '../types';

const BUDGET_CHAPTERS_STORAGE_KEY = 'anprojects:budget_chapters';

export function getBudgetChapters(projectId: string): BudgetChapter[] {
  try {
    const raw = localStorage.getItem(BUDGET_CHAPTERS_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as BudgetChapter[];
      if (Array.isArray(all)) {
        return all
          .filter((chapter) => chapter.project_id === projectId)
          .sort((a, b) => a.order - b.order);
      }
    }
  } catch (error) {
    console.error('Error reading budget chapters from localStorage:', error);
  }
  return [];
}

export function getBudgetChaptersByCategory(projectId: string, categoryId: string): BudgetChapter[] {
  try {
    const raw = localStorage.getItem(BUDGET_CHAPTERS_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as BudgetChapter[];
      if (Array.isArray(all)) {
        return all
          .filter((chapter) => chapter.project_id === projectId && chapter.category_id === categoryId)
          .sort((a, b) => a.order - b.order);
      }
    }
  } catch (error) {
    console.error('Error reading budget chapters by category from localStorage:', error);
  }
  return [];
}

export function getAllBudgetChapters(): BudgetChapter[] {
  try {
    const raw = localStorage.getItem(BUDGET_CHAPTERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BudgetChapter[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading all budget chapters from localStorage:', error);
  }
  return [];
}

export function saveBudgetChapters(chapters: BudgetChapter[]): void {
  try {
    localStorage.setItem(BUDGET_CHAPTERS_STORAGE_KEY, JSON.stringify(chapters));
  } catch (error) {
    console.error('Error saving budget chapters to localStorage:', error);
  }
}

export function addBudgetChapter(chapter: BudgetChapter): void {
  const all = getAllBudgetChapters();
  all.push(chapter);
  saveBudgetChapters(all);
}

export function updateBudgetChapter(id: string, updates: Partial<BudgetChapter>): void {
  const all = getAllBudgetChapters();
  const index = all.findIndex((chapter) => chapter.id === id);
  if (index !== -1) {
    all[index] = { ...all[index], ...updates, updated_at: new Date().toISOString() };
    saveBudgetChapters(all);
  }
}

export function deleteBudgetChapter(id: string): void {
  const all = getAllBudgetChapters();
  const filtered = all.filter((chapter) => chapter.id !== id);
  saveBudgetChapters(filtered);
}

export function getBudgetChapterById(id: string): BudgetChapter | null {
  const all = getAllBudgetChapters();
  return all.find((chapter) => chapter.id === id) || null;
}

export function getNextBudgetChapterOrder(projectId: string, categoryId: string): number {
  const categoryChapters = getBudgetChaptersByCategory(projectId, categoryId);
  if (categoryChapters.length === 0) {
    return 1;
  }
  const maxOrder = Math.max(...categoryChapters.map((c) => c.order));
  return maxOrder + 1;
}

export function getCategoryBudgetSummary(projectId: string, categoryId: string): { budget: number; contract: number } {
  const chapters = getBudgetChaptersByCategory(projectId, categoryId);
  return {
    budget: chapters.reduce((sum, c) => sum + c.budget_amount, 0),
    contract: chapters.reduce((sum, c) => sum + (c.contract_amount || 0), 0),
  };
}
