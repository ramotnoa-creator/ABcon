import type { Budget, BudgetStatus } from '../types';

const BUDGET_STORAGE_KEY = 'anprojects:budgets';

export function getBudget(projectId: string): Budget | null {
  try {
    const raw = localStorage.getItem(BUDGET_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as Budget[];
      if (Array.isArray(all)) {
        return all.find((b) => b.project_id === projectId) || null;
      }
    }
  } catch (error) {
    console.error('Error reading budget from localStorage:', error);
  }
  return null;
}

export function getAllBudgets(): Budget[] {
  try {
    const raw = localStorage.getItem(BUDGET_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Budget[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading all budgets from localStorage:', error);
  }
  return [];
}

export function saveBudgets(budgets: Budget[]): void {
  try {
    localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(budgets));
  } catch (error) {
    console.error('Error saving budgets to localStorage:', error);
  }
}

export function addBudget(budget: Budget): void {
  const all = getAllBudgets();
  all.push(budget);
  saveBudgets(all);
}

export function updateBudget(projectId: string, updates: Partial<Budget>): void {
  const all = getAllBudgets();
  const index = all.findIndex((b) => b.project_id === projectId);
  if (index !== -1) {
    all[index] = { ...all[index], ...updates, updated_at: new Date().toISOString() };
    // Recalculate variance if planned or actual changed
    if (updates.planned_budget !== undefined || updates.actual_budget !== undefined) {
      const planned = updates.planned_budget !== undefined ? updates.planned_budget : all[index].planned_budget;
      const actual = updates.actual_budget !== undefined ? updates.actual_budget : all[index].actual_budget;
      all[index].variance = planned > 0 ? ((actual - planned) / planned) * 100 : 0;
    }
    saveBudgets(all);
  } else {
    // Create new budget if doesn't exist
    const newBudget: Budget = {
      id: `budget-${Date.now()}`,
      project_id: projectId,
      planned_budget: updates.planned_budget || 0,
      actual_budget: updates.actual_budget || 0,
      variance: updates.planned_budget && updates.planned_budget > 0
        ? ((updates.actual_budget || 0) - updates.planned_budget) / updates.planned_budget * 100
        : 0,
      status: updates.status || 'On Track',
      notes: updates.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    all.push(newBudget);
    saveBudgets(all);
  }
}

export function calculateVariance(planned: number, actual: number): number {
  if (planned === 0) return 0;
  return ((actual - planned) / planned) * 100;
}

export function getBudgetStatus(variance: number): BudgetStatus {
  if (variance > 10) return 'Deviation';
  if (variance > 5) return 'At Risk';
  if (variance < -5) return 'Completed'; // Under budget, likely completed
  return 'On Track';
}
