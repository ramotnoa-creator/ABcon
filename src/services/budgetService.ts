/**
 * Budget Service - Neon Database API
 * Handles CRUD operations for project budgets
 */

import { executeQuery, executeQuerySingle, isDemoMode as isNeonDemoMode } from '../lib/neon';
import type { Budget } from '../types';
import {
  getBudget as getBudgetLocal,
  getAllBudgets as getAllBudgetsLocal,
  saveBudgets,
  addBudget as addBudgetLocal,
  updateBudget as updateBudgetLocal,
  calculateVariance as calculateVarianceUtil,
  getBudgetStatus as getBudgetStatusUtil,
} from '../data/budgetStorage';

// Check if we're in demo mode
const isDemoMode = isNeonDemoMode;

// ============================================================
// GET BUDGET BY PROJECT ID
// ============================================================

export async function getBudget(projectId: string): Promise<Budget | null> {
  if (isDemoMode) {
    return getBudgetLocal(projectId);
  }

  try {
    const data = await executeQuerySingle<any>(
      `SELECT * FROM budgets WHERE project_id = $1`,
      [projectId]
    );

    return data ? transformBudgetFromDB(data) : null;
  } catch (error) {
    console.error('Error fetching budget:', error);
    return getBudgetLocal(projectId);
  }
}

// ============================================================
// GET ALL BUDGETS
// ============================================================

export async function getAllBudgets(): Promise<Budget[]> {
  if (isDemoMode) {
    return getAllBudgetsLocal();
  }

  try {
    const data = await executeQuery<any>(`SELECT * FROM budgets`);

    return (data || []).map(transformBudgetFromDB);
  } catch (error) {
    console.error('Error fetching all budgets:', error);
    return getAllBudgetsLocal();
  }
}

// ============================================================
// CREATE BUDGET
// ============================================================

export async function createBudget(
  budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>
): Promise<Budget> {
  if (isDemoMode) {
    const newBudget: Budget = {
      ...budget,
      id: `budget-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addBudgetLocal(newBudget);
    return newBudget;
  }

  try {
    const data = await executeQuerySingle<any>(
      `INSERT INTO budgets (
        project_id, planned_budget, actual_budget, variance, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        budget.project_id,
        budget.planned_budget,
        budget.actual_budget,
        budget.variance || null,
        budget.status,
        budget.notes || null,
      ]
    );

    if (!data) {
      throw new Error('Failed to create budget');
    }

    return transformBudgetFromDB(data);
  } catch (error) {
    console.error('Error creating budget:', error);
    // Fallback to localStorage
    const newBudget: Budget = {
      ...budget,
      id: `budget-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addBudgetLocal(newBudget);
    return newBudget;
  }
}

// ============================================================
// UPDATE BUDGET
// ============================================================

export async function updateBudget(
  projectId: string,
  updates: Partial<Budget>
): Promise<void> {
  if (isDemoMode) {
    updateBudgetLocal(projectId, updates);
    return;
  }

  try {
    // Build SET clause dynamically
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.planned_budget !== undefined) {
      setClauses.push(`planned_budget = $${paramIndex++}`);
      values.push(updates.planned_budget);
    }
    if (updates.actual_budget !== undefined) {
      setClauses.push(`actual_budget = $${paramIndex++}`);
      values.push(updates.actual_budget);
    }
    if (updates.variance !== undefined) {
      setClauses.push(`variance = $${paramIndex++}`);
      values.push(updates.variance);
    }
    if (updates.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.notes !== undefined) {
      setClauses.push(`notes = $${paramIndex++}`);
      values.push(updates.notes);
    }

    if (setClauses.length === 0) {
      return; // Nothing to update
    }

    // Always update updated_at
    setClauses.push(`updated_at = NOW()`);

    // Add project_id as final parameter
    values.push(projectId);

    const query = `UPDATE budgets SET ${setClauses.join(', ')} WHERE project_id = $${paramIndex}`;

    await executeQuery(query, values);
  } catch (error) {
    console.error('Error updating budget:', error);
    // Fallback to localStorage
    updateBudgetLocal(projectId, updates);
  }
}

// ============================================================
// HELPER: TRANSFORM DB TO APP FORMAT
// ============================================================

function transformBudgetFromDB(dbBudget: any): Budget {
  return {
    id: dbBudget.id,
    project_id: dbBudget.project_id,
    planned_budget: dbBudget.planned_budget,
    actual_budget: dbBudget.actual_budget,
    variance: dbBudget.variance || undefined,
    status: dbBudget.status,
    notes: dbBudget.notes || undefined,
    created_at: dbBudget.created_at,
    updated_at: dbBudget.updated_at,
  };
}

// ============================================================
// SYNC: SAVE TO LOCALSTORAGE (FOR BACKWARD COMPATIBILITY)
// ============================================================

export async function syncBudgetsToLocalStorage(): Promise<void> {
  const budgets = await getAllBudgets();
  saveBudgets(budgets);
}

// ============================================================
// UTILITY FUNCTIONS (RE-EXPORTED FROM STORAGE)
// ============================================================

export const calculateVariance = calculateVarianceUtil;
export const getBudgetStatus = getBudgetStatusUtil;
