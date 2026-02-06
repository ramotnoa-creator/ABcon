/**
 * Budget Categories Service - Neon Database API
 * Handles CRUD operations for budget categories
 */

import { executeQuery, executeQuerySingle, isDemoMode as isNeonDemoMode } from '../lib/neon';
import type { BudgetCategory, BudgetCategoryType } from '../types';
import {
  getBudgetCategories as getBudgetCategoriesLocal,
  getAllBudgetCategories as getAllBudgetCategoriesLocal,
  saveBudgetCategories,
  addBudgetCategory as addBudgetCategoryLocal,
  updateBudgetCategory as updateBudgetCategoryLocal,
  deleteBudgetCategory as deleteBudgetCategoryLocal,
  getBudgetCategoryById as getBudgetCategoryByIdLocal,
  getNextBudgetCategoryOrder as getNextBudgetCategoryOrderLocal,
} from '../data/budgetCategoriesStorage';

// Check if we're in demo mode
const isDemoMode = isNeonDemoMode;

// ============================================================
// GET BUDGET CATEGORIES BY PROJECT ID
// ============================================================

export async function getBudgetCategories(projectId: string): Promise<BudgetCategory[]> {
  if (isDemoMode) {
    return getBudgetCategoriesLocal(projectId);
  }

  try {
    const data = await executeQuery<Record<string, unknown>>(
      `SELECT * FROM budget_categories
       WHERE project_id = $1
       ORDER BY "order" ASC`,
      [projectId]
    );

    return (data || []).map(transformBudgetCategoryFromDB);
  } catch (error: unknown) {
    console.error('Error fetching budget categories:', error);
    return getBudgetCategoriesLocal(projectId);
  }
}

// ============================================================
// GET ALL BUDGET CATEGORIES
// ============================================================

export async function getAllBudgetCategories(): Promise<BudgetCategory[]> {
  if (isDemoMode) {
    return getAllBudgetCategoriesLocal();
  }

  try {
    const data = await executeQuery<Record<string, unknown>>(
      `SELECT * FROM budget_categories ORDER BY "order" ASC`
    );

    return (data || []).map(transformBudgetCategoryFromDB);
  } catch (error: unknown) {
    console.error('Error fetching all budget categories:', error);
    return getAllBudgetCategoriesLocal();
  }
}

// ============================================================
// GET BUDGET CATEGORY BY ID
// ============================================================

export async function getBudgetCategoryById(id: string): Promise<BudgetCategory | null> {
  if (isDemoMode) {
    return getBudgetCategoryByIdLocal(id);
  }

  try {
    const data = await executeQuerySingle<Record<string, unknown>>(
      `SELECT * FROM budget_categories WHERE id = $1`,
      [id]
    );

    return data ? transformBudgetCategoryFromDB(data) : null;
  } catch (error: unknown) {
    console.error('Error fetching budget category:', error);
    return getBudgetCategoryByIdLocal(id);
  }
}

// ============================================================
// GET NEXT CATEGORY ORDER
// ============================================================

export async function getNextBudgetCategoryOrder(projectId: string): Promise<number> {
  if (isDemoMode) {
    return getNextBudgetCategoryOrderLocal(projectId);
  }

  try {
    const data = await executeQuerySingle<Record<string, unknown>>(
      `SELECT MAX("order") as max_order FROM budget_categories WHERE project_id = $1`,
      [projectId]
    );

    const maxOrder = (data?.max_order as number) || 0;
    return maxOrder + 1;
  } catch (error: unknown) {
    console.error('Error getting next budget category order:', error);
    return getNextBudgetCategoryOrderLocal(projectId);
  }
}

// ============================================================
// CREATE BUDGET CATEGORY
// ============================================================

export async function createBudgetCategory(
  category: Omit<BudgetCategory, 'id' | 'created_at' | 'updated_at'>
): Promise<BudgetCategory> {
  if (isDemoMode) {
    const newCategory: BudgetCategory = {
      ...category,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addBudgetCategoryLocal(newCategory);
    return newCategory;
  }

  try {
    const data = await executeQuerySingle<Record<string, unknown>>(
      `INSERT INTO budget_categories (
        project_id, name, type, icon, color, "order"
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        category.project_id,
        category.name,
        category.type,
        category.icon,
        category.color,
        category.order,
      ]
    );

    if (!data) {
      throw new Error('Failed to create budget category');
    }

    return transformBudgetCategoryFromDB(data);
  } catch (error: unknown) {
    console.error('Error creating budget category:', error);
    // Fallback to localStorage
    const newCategory: BudgetCategory = {
      ...category,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addBudgetCategoryLocal(newCategory);
    return newCategory;
  }
}

// ============================================================
// UPDATE BUDGET CATEGORY
// ============================================================

export async function updateBudgetCategory(
  id: string,
  updates: Partial<BudgetCategory>
): Promise<void> {
  if (isDemoMode) {
    updateBudgetCategoryLocal(id, updates);
    return;
  }

  try {
    // Build SET clause dynamically
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updates.project_id !== undefined) {
      setClauses.push(`project_id = $${paramIndex++}`);
      values.push(updates.project_id);
    }
    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.type !== undefined) {
      setClauses.push(`type = $${paramIndex++}`);
      values.push(updates.type);
    }
    if (updates.icon !== undefined) {
      setClauses.push(`icon = $${paramIndex++}`);
      values.push(updates.icon);
    }
    if (updates.color !== undefined) {
      setClauses.push(`color = $${paramIndex++}`);
      values.push(updates.color);
    }
    if (updates.order !== undefined) {
      setClauses.push(`"order" = $${paramIndex++}`);
      values.push(updates.order);
    }

    if (setClauses.length === 0) {
      return; // Nothing to update
    }

    // Always update updated_at
    setClauses.push(`updated_at = NOW()`);

    // Add category ID as final parameter
    values.push(id);

    const query = `UPDATE budget_categories SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`;

    await executeQuery(query, values);
  } catch (error: unknown) {
    console.error('Error updating budget category:', error);
    // Fallback to localStorage
    updateBudgetCategoryLocal(id, updates);
  }
}

// ============================================================
// DELETE BUDGET CATEGORY
// ============================================================

export async function deleteBudgetCategory(id: string): Promise<void> {
  if (isDemoMode) {
    deleteBudgetCategoryLocal(id);
    return;
  }

  try {
    // Note: Cascade delete for chapters/items is handled by database foreign key constraints
    await executeQuery(`DELETE FROM budget_categories WHERE id = $1`, [id]);
  } catch (error: unknown) {
    console.error('Error deleting budget category:', error);
    // Fallback to localStorage
    deleteBudgetCategoryLocal(id);
  }
}

// ============================================================
// HELPER: TRANSFORM DB TO APP FORMAT
// ============================================================

function transformBudgetCategoryFromDB(dbCategory: Record<string, unknown>): BudgetCategory {
  return {
    id: dbCategory.id as string,
    project_id: dbCategory.project_id as string,
    name: dbCategory.name as string,
    type: dbCategory.type as BudgetCategoryType,
    icon: dbCategory.icon as string,
    color: dbCategory.color as string,
    order: dbCategory.order as number,
    created_at: dbCategory.created_at as string,
    updated_at: dbCategory.updated_at as string,
  };
}

// ============================================================
// SYNC: SAVE TO LOCALSTORAGE (FOR BACKWARD COMPATIBILITY)
// ============================================================

export async function syncBudgetCategoriesToLocalStorage(projectId?: string): Promise<void> {
  const categories = projectId ? await getBudgetCategories(projectId) : await getAllBudgetCategories();
  saveBudgetCategories(categories);
}
