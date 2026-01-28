/**
 * Variance Service
 * Calculates variance between estimates and budgets
 */

import { executeQuery } from '../lib/neon';
import type { VarianceData } from '../types';
import { getBudgetItemById } from './budgetItemsService';
import { getEstimateItemById } from './estimateItemsService';

// ============================================================
// CALCULATE VARIANCE FOR SINGLE BUDGET ITEM
// ============================================================

export async function calculateVariance(budgetItemId: string): Promise<VarianceData | null> {
  // Get budget item
  const budgetItem = await getBudgetItemById(budgetItemId);

  if (!budgetItem) {
    return null;
  }

  // Get linked estimate item if exists
  if (!budgetItem.estimate_item_id) {
    // No estimate linked - return gray (no variance)
    return {
      estimate_amount: 0,
      budget_amount: budgetItem.total_with_vat,
      variance_amount: 0,
      variance_percent: 0,
      color: 'gray',
    };
  }

  const estimateItem = await getEstimateItemById(budgetItem.estimate_item_id);

  if (!estimateItem) {
    // Estimate item not found - return gray
    return {
      estimate_amount: 0,
      budget_amount: budgetItem.total_with_vat,
      variance_amount: 0,
      variance_percent: 0,
      color: 'gray',
    };
  }

  // Calculate variance
  const estimate_amount = estimateItem.total_with_vat;
  const budget_amount = budgetItem.total_with_vat;

  // Variance formula: budget - estimate
  // Positive variance = over budget (RED)
  // Negative variance = under budget / saved money (GREEN)
  const variance_amount = budget_amount - estimate_amount;

  // Calculate percentage
  let variance_percent = 0;
  if (estimate_amount !== 0) {
    variance_percent = (variance_amount / estimate_amount) * 100;
  }

  // Determine color
  let color: 'green' | 'red' | 'gray' = 'gray';
  if (variance_amount < 0) {
    color = 'green'; // Saved money
  } else if (variance_amount > 0) {
    color = 'red'; // Over budget
  }

  return {
    estimate_amount,
    budget_amount,
    variance_amount: Math.round(variance_amount * 100) / 100,
    variance_percent: Math.round(variance_percent * 100) / 100,
    color,
  };
}

// ============================================================
// CALCULATE VARIANCE FOR ENTIRE PROJECT
// ============================================================

export async function calculateProjectVariance(
  projectId: string
): Promise<{
  totalEstimate: number;
  totalBudget: number;
  totalVariance: number;
  variancePercent: number;
  itemsWithVariance: number;
  color: 'green' | 'red' | 'gray';
}> {
  // Get all budget items for project
  const { getBudgetItems } = await import('./budgetItemsService');
  const budgetItems = await getBudgetItems(projectId);

  let totalEstimate = 0;
  let totalBudget = 0;
  let itemsWithVariance = 0;

  for (const budgetItem of budgetItems) {
    if (budgetItem.estimate_item_id) {
      const variance = await calculateVariance(budgetItem.id);
      if (variance) {
        totalEstimate += variance.estimate_amount;
        totalBudget += variance.budget_amount;
        itemsWithVariance++;
      }
    } else {
      // Budget item without estimate link - count budget only
      totalBudget += budgetItem.total_with_vat;
    }
  }

  const totalVariance = totalBudget - totalEstimate;

  let variancePercent = 0;
  if (totalEstimate !== 0) {
    variancePercent = (totalVariance / totalEstimate) * 100;
  }

  let color: 'green' | 'red' | 'gray' = 'gray';
  if (totalVariance < 0) {
    color = 'green'; // Saved money
  } else if (totalVariance > 0) {
    color = 'red'; // Over budget
  }

  return {
    totalEstimate: Math.round(totalEstimate * 100) / 100,
    totalBudget: Math.round(totalBudget * 100) / 100,
    totalVariance: Math.round(totalVariance * 100) / 100,
    variancePercent: Math.round(variancePercent * 100) / 100,
    itemsWithVariance,
    color,
  };
}

// ============================================================
// UPDATE BUDGET ITEM VARIANCE
// ============================================================

export async function updateBudgetItemVariance(budgetItemId: string): Promise<void> {
  const variance = await calculateVariance(budgetItemId);

  if (!variance) {
    return;
  }

  // Update budget_items table with variance data
  const { updateBudgetItem } = await import('./budgetItemsService');

  await updateBudgetItem(budgetItemId, {
    estimate_amount: variance.estimate_amount,
    variance_amount: variance.variance_amount,
    variance_percent: variance.variance_percent,
  });
}

// ============================================================
// UPDATE ALL BUDGET ITEM VARIANCES FOR PROJECT
// ============================================================

export async function updateProjectVariances(projectId: string): Promise<void> {
  const { getBudgetItems } = await import('./budgetItemsService');
  const budgetItems = await getBudgetItems(projectId);

  for (const budgetItem of budgetItems) {
    if (budgetItem.estimate_item_id) {
      await updateBudgetItemVariance(budgetItem.id);
    }
  }
}
