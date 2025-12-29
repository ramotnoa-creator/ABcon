import type { BudgetItem } from '../types';
import { deletePaymentsByBudgetItem } from './budgetPaymentsStorage';

const BUDGET_ITEMS_STORAGE_KEY = 'anprojects:budget_items';

export function getBudgetItems(projectId: string): BudgetItem[] {
  try {
    const raw = localStorage.getItem(BUDGET_ITEMS_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as BudgetItem[];
      if (Array.isArray(all)) {
        return all
          .filter((item) => item.project_id === projectId)
          .sort((a, b) => a.order - b.order);
      }
    }
  } catch (error) {
    console.error('Error reading budget items from localStorage:', error);
  }
  return [];
}

export function getBudgetItemsByChapter(projectId: string, chapterId: string): BudgetItem[] {
  try {
    const raw = localStorage.getItem(BUDGET_ITEMS_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as BudgetItem[];
      if (Array.isArray(all)) {
        return all
          .filter((item) => item.project_id === projectId && item.chapter_id === chapterId)
          .sort((a, b) => a.order - b.order);
      }
    }
  } catch (error) {
    console.error('Error reading budget items by chapter from localStorage:', error);
  }
  return [];
}

export function getAllBudgetItems(): BudgetItem[] {
  try {
    const raw = localStorage.getItem(BUDGET_ITEMS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BudgetItem[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading all budget items from localStorage:', error);
  }
  return [];
}

export function saveBudgetItems(items: BudgetItem[]): void {
  try {
    localStorage.setItem(BUDGET_ITEMS_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving budget items to localStorage:', error);
  }
}

export function addBudgetItem(item: BudgetItem): void {
  const all = getAllBudgetItems();
  all.push(item);
  saveBudgetItems(all);
}

export function updateBudgetItem(id: string, updates: Partial<BudgetItem>): void {
  const all = getAllBudgetItems();
  const index = all.findIndex((item) => item.id === id);
  if (index !== -1) {
    all[index] = { ...all[index], ...updates, updated_at: new Date().toISOString() };
    saveBudgetItems(all);
  }
}

export function deleteBudgetItem(id: string): void {
  // Cascade delete: remove associated payments first
  deletePaymentsByBudgetItem(id);

  const all = getAllBudgetItems();
  const filtered = all.filter((item) => item.id !== id);
  saveBudgetItems(filtered);
}

export function getBudgetItemById(id: string): BudgetItem | null {
  const all = getAllBudgetItems();
  return all.find((item) => item.id === id) || null;
}

export function getNextBudgetItemOrder(projectId: string, chapterId: string): number {
  const chapterItems = getBudgetItemsByChapter(projectId, chapterId);
  if (chapterItems.length === 0) {
    return 1;
  }
  const maxOrder = Math.max(...chapterItems.map((i) => i.order));
  return maxOrder + 1;
}

export function getChapterBudgetSummary(projectId: string, chapterId: string): {
  totalPrice: number;
  totalWithVat: number;
  paidAmount: number;
  remainingAmount: number;
} {
  const items = getBudgetItemsByChapter(projectId, chapterId);
  const totalPrice = items.reduce((sum, i) => sum + i.total_price, 0);
  const totalWithVat = items.reduce((sum, i) => sum + i.total_with_vat, 0);
  const paidAmount = items.reduce((sum, i) => sum + i.paid_amount, 0);

  return {
    totalPrice,
    totalWithVat,
    paidAmount,
    remainingAmount: totalWithVat - paidAmount,
  };
}

export function getProjectBudgetSummary(projectId: string): {
  totalBudget: number;
  totalWithVat: number;
  paidAmount: number;
  remainingAmount: number;
  itemCount: number;
} {
  const items = getBudgetItems(projectId);
  const totalBudget = items.reduce((sum, i) => sum + i.total_price, 0);
  const totalWithVat = items.reduce((sum, i) => sum + i.total_with_vat, 0);
  const paidAmount = items.reduce((sum, i) => sum + i.paid_amount, 0);

  return {
    totalBudget,
    totalWithVat,
    paidAmount,
    remainingAmount: totalWithVat - paidAmount,
    itemCount: items.length,
  };
}

export function calculateBudgetItemTotals(item: Partial<BudgetItem>): {
  total_price: number;
  vat_amount: number;
  total_with_vat: number;
} {
  const quantity = item.quantity || 0;
  const unitPrice = item.unit_price || 0;
  const vatRate = item.vat_rate ?? 0.17;

  const total_price = quantity * unitPrice;
  const vat_amount = total_price * vatRate;
  const total_with_vat = total_price + vat_amount;

  return { total_price, vat_amount, total_with_vat };
}

// Get cross-project budget totals for global budget page
export function getGlobalBudgetSummary(): {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  projectCount: number;
  projectIds: string[];
} {
  const allItems = getAllBudgetItems();

  // Get unique project IDs
  const projectIds = [...new Set(allItems.map((item) => item.project_id))];

  // Calculate totals
  const totalBudget = allItems.reduce((sum, item) => sum + item.total_with_vat, 0);
  const totalSpent = allItems.reduce((sum, item) => sum + item.paid_amount, 0);
  const totalRemaining = totalBudget - totalSpent;

  return {
    totalBudget,
    totalSpent,
    totalRemaining,
    projectCount: projectIds.length,
    projectIds,
  };
}

// Get budget summary grouped by category type across all projects
export function getCategoryBudgetSummary(): {
  categoryType: string;
  totalBudget: number;
  totalSpent: number;
}[] {
  // We need to import chapters to get category info
  // For now, return placeholder - will integrate with chapters storage
  const allItems = getAllBudgetItems();

  // Group by chapter and calculate totals
  const chapterTotals = new Map<string, { budget: number; spent: number }>();

  allItems.forEach((item) => {
    const existing = chapterTotals.get(item.chapter_id) || { budget: 0, spent: 0 };
    chapterTotals.set(item.chapter_id, {
      budget: existing.budget + item.total_with_vat,
      spent: existing.spent + item.paid_amount,
    });
  });

  // For now return a simplified summary - can enhance later with category integration
  return Array.from(chapterTotals.entries()).map(([chapterId, totals]) => ({
    categoryType: chapterId,
    totalBudget: totals.budget,
    totalSpent: totals.spent,
  }));
}
