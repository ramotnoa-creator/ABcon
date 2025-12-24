import type { BudgetCategory } from '../types';

const BUDGET_CATEGORIES_STORAGE_KEY = 'anprojects:budget_categories';

export function getBudgetCategories(projectId: string): BudgetCategory[] {
  try {
    const raw = localStorage.getItem(BUDGET_CATEGORIES_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as BudgetCategory[];
      if (Array.isArray(all)) {
        return all
          .filter((category) => category.project_id === projectId)
          .sort((a, b) => a.order - b.order);
      }
    }
  } catch (error) {
    console.error('Error reading budget categories from localStorage:', error);
  }
  return [];
}

export function getAllBudgetCategories(): BudgetCategory[] {
  try {
    const raw = localStorage.getItem(BUDGET_CATEGORIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BudgetCategory[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading all budget categories from localStorage:', error);
  }
  return [];
}

export function saveBudgetCategories(categories: BudgetCategory[]): void {
  try {
    localStorage.setItem(BUDGET_CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch (error) {
    console.error('Error saving budget categories to localStorage:', error);
  }
}

export function addBudgetCategory(category: BudgetCategory): void {
  const all = getAllBudgetCategories();
  all.push(category);
  saveBudgetCategories(all);
}

export function updateBudgetCategory(id: string, updates: Partial<BudgetCategory>): void {
  const all = getAllBudgetCategories();
  const index = all.findIndex((category) => category.id === id);
  if (index !== -1) {
    all[index] = { ...all[index], ...updates, updated_at: new Date().toISOString() };
    saveBudgetCategories(all);
  }
}

export function deleteBudgetCategory(id: string): void {
  const all = getAllBudgetCategories();
  const filtered = all.filter((category) => category.id !== id);
  saveBudgetCategories(filtered);
}

export function getBudgetCategoryById(id: string): BudgetCategory | null {
  const all = getAllBudgetCategories();
  return all.find((category) => category.id === id) || null;
}

export function getNextBudgetCategoryOrder(projectId: string): number {
  const projectCategories = getBudgetCategories(projectId);
  if (projectCategories.length === 0) {
    return 1;
  }
  const maxOrder = Math.max(...projectCategories.map((c) => c.order));
  return maxOrder + 1;
}
