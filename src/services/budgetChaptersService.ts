/**
 * Budget Chapters Service - Neon Database API
 * Handles CRUD operations for budget chapters
 */

import { executeQuery, executeQuerySingle, isDemoMode as isNeonDemoMode } from '../lib/neon';
import type { BudgetChapter } from '../types';
import {
  getBudgetChapters as getBudgetChaptersLocal,
  getBudgetChaptersByCategory as getBudgetChaptersByCategoryLocal,
  getAllBudgetChapters as getAllBudgetChaptersLocal,
  saveBudgetChapters,
  addBudgetChapter as addBudgetChapterLocal,
  updateBudgetChapter as updateBudgetChapterLocal,
  deleteBudgetChapter as deleteBudgetChapterLocal,
  getBudgetChapterById as getBudgetChapterByIdLocal,
  getNextBudgetChapterOrder as getNextBudgetChapterOrderLocal,
  getCategoryBudgetSummary as getCategoryBudgetSummaryLocal,
} from '../data/budgetChaptersStorage';

// Check if we're in demo mode
const isDemoMode = isNeonDemoMode;

// ============================================================
// GET BUDGET CHAPTERS BY PROJECT ID
// ============================================================

export async function getBudgetChapters(projectId: string): Promise<BudgetChapter[]> {
  if (isDemoMode) {
    return getBudgetChaptersLocal(projectId);
  }

  try {
    const data = await executeQuery<any>(
      `SELECT * FROM budget_chapters
       WHERE project_id = $1
       ORDER BY "order" ASC`,
      [projectId]
    );

    return (data || []).map(transformBudgetChapterFromDB);
  } catch (error) {
    console.error('Error fetching budget chapters:', error);
    return getBudgetChaptersLocal(projectId);
  }
}

// ============================================================
// GET BUDGET CHAPTERS BY CATEGORY
// ============================================================

export async function getBudgetChaptersByCategory(projectId: string, categoryId: string): Promise<BudgetChapter[]> {
  if (isDemoMode) {
    return getBudgetChaptersByCategoryLocal(projectId, categoryId);
  }

  try {
    const data = await executeQuery<any>(
      `SELECT * FROM budget_chapters
       WHERE project_id = $1 AND category_id = $2
       ORDER BY "order" ASC`,
      [projectId, categoryId]
    );

    return (data || []).map(transformBudgetChapterFromDB);
  } catch (error) {
    console.error('Error fetching budget chapters by category:', error);
    return getBudgetChaptersByCategoryLocal(projectId, categoryId);
  }
}

// ============================================================
// GET ALL BUDGET CHAPTERS
// ============================================================

export async function getAllBudgetChapters(): Promise<BudgetChapter[]> {
  if (isDemoMode) {
    return getAllBudgetChaptersLocal();
  }

  try {
    const data = await executeQuery<any>(
      `SELECT * FROM budget_chapters ORDER BY "order" ASC`
    );

    return (data || []).map(transformBudgetChapterFromDB);
  } catch (error) {
    console.error('Error fetching all budget chapters:', error);
    return getAllBudgetChaptersLocal();
  }
}

// ============================================================
// GET BUDGET CHAPTER BY ID
// ============================================================

export async function getBudgetChapterById(id: string): Promise<BudgetChapter | null> {
  if (isDemoMode) {
    return getBudgetChapterByIdLocal(id);
  }

  try {
    const data = await executeQuerySingle<any>(
      `SELECT * FROM budget_chapters WHERE id = $1`,
      [id]
    );

    return data ? transformBudgetChapterFromDB(data) : null;
  } catch (error) {
    console.error('Error fetching budget chapter:', error);
    return getBudgetChapterByIdLocal(id);
  }
}

// ============================================================
// GET NEXT CHAPTER ORDER
// ============================================================

export async function getNextBudgetChapterOrder(projectId: string, categoryId: string): Promise<number> {
  if (isDemoMode) {
    return getNextBudgetChapterOrderLocal(projectId, categoryId);
  }

  try {
    const data = await executeQuerySingle<any>(
      `SELECT MAX("order") as max_order FROM budget_chapters
       WHERE project_id = $1 AND category_id = $2`,
      [projectId, categoryId]
    );

    const maxOrder = data?.max_order || 0;
    return maxOrder + 1;
  } catch (error) {
    console.error('Error getting next budget chapter order:', error);
    return getNextBudgetChapterOrderLocal(projectId, categoryId);
  }
}

// ============================================================
// GET CATEGORY BUDGET SUMMARY
// ============================================================

export async function getCategoryBudgetSummary(
  projectId: string,
  categoryId: string
): Promise<{ budget: number; contract: number }> {
  if (isDemoMode) {
    return getCategoryBudgetSummaryLocal(projectId, categoryId);
  }

  try {
    const chapters = await getBudgetChaptersByCategory(projectId, categoryId);
    return {
      budget: chapters.reduce((sum, c) => sum + c.budget_amount, 0),
      contract: chapters.reduce((sum, c) => sum + (c.contract_amount || 0), 0),
    };
  } catch (error) {
    console.error('Error getting category budget summary:', error);
    return getCategoryBudgetSummaryLocal(projectId, categoryId);
  }
}

// ============================================================
// CREATE BUDGET CHAPTER
// ============================================================

export async function createBudgetChapter(
  chapter: Omit<BudgetChapter, 'id' | 'created_at' | 'updated_at'>
): Promise<BudgetChapter> {
  if (isDemoMode) {
    const newChapter: BudgetChapter = {
      ...chapter,
      id: `chapter-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addBudgetChapterLocal(newChapter);
    return newChapter;
  }

  try {
    const data = await executeQuerySingle<any>(
      `INSERT INTO budget_chapters (
        project_id, category_id, code, name, budget_amount, contract_amount, "order"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        chapter.project_id,
        chapter.category_id,
        chapter.code || null,
        chapter.name,
        chapter.budget_amount,
        chapter.contract_amount || null,
        chapter.order,
      ]
    );

    if (!data) {
      throw new Error('Failed to create budget chapter');
    }

    return transformBudgetChapterFromDB(data);
  } catch (error) {
    console.error('Error creating budget chapter:', error);
    // Fallback to localStorage
    const newChapter: BudgetChapter = {
      ...chapter,
      id: `chapter-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addBudgetChapterLocal(newChapter);
    return newChapter;
  }
}

// ============================================================
// UPDATE BUDGET CHAPTER
// ============================================================

export async function updateBudgetChapter(
  id: string,
  updates: Partial<BudgetChapter>
): Promise<void> {
  if (isDemoMode) {
    updateBudgetChapterLocal(id, updates);
    return;
  }

  try {
    // Build SET clause dynamically
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.project_id !== undefined) {
      setClauses.push(`project_id = $${paramIndex++}`);
      values.push(updates.project_id);
    }
    if (updates.category_id !== undefined) {
      setClauses.push(`category_id = $${paramIndex++}`);
      values.push(updates.category_id);
    }
    if (updates.code !== undefined) {
      setClauses.push(`code = $${paramIndex++}`);
      values.push(updates.code);
    }
    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.budget_amount !== undefined) {
      setClauses.push(`budget_amount = $${paramIndex++}`);
      values.push(updates.budget_amount);
    }
    if (updates.contract_amount !== undefined) {
      setClauses.push(`contract_amount = $${paramIndex++}`);
      values.push(updates.contract_amount);
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

    // Add chapter ID as final parameter
    values.push(id);

    const query = `UPDATE budget_chapters SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`;

    await executeQuery(query, values);
  } catch (error) {
    console.error('Error updating budget chapter:', error);
    // Fallback to localStorage
    updateBudgetChapterLocal(id, updates);
  }
}

// ============================================================
// DELETE BUDGET CHAPTER
// ============================================================

export async function deleteBudgetChapter(id: string): Promise<void> {
  if (isDemoMode) {
    deleteBudgetChapterLocal(id);
    return;
  }

  try {
    // Note: Cascade delete for budget items is handled by database foreign key constraints
    await executeQuery(`DELETE FROM budget_chapters WHERE id = $1`, [id]);
  } catch (error) {
    console.error('Error deleting budget chapter:', error);
    // Fallback to localStorage
    deleteBudgetChapterLocal(id);
  }
}

// ============================================================
// HELPER: TRANSFORM DB TO APP FORMAT
// ============================================================

function transformBudgetChapterFromDB(dbChapter: any): BudgetChapter {
  return {
    id: dbChapter.id,
    project_id: dbChapter.project_id,
    category_id: dbChapter.category_id,
    code: dbChapter.code || undefined,
    name: dbChapter.name,
    budget_amount: dbChapter.budget_amount,
    contract_amount: dbChapter.contract_amount || undefined,
    order: dbChapter.order,
    created_at: dbChapter.created_at,
    updated_at: dbChapter.updated_at,
  };
}

// ============================================================
// SYNC: SAVE TO LOCALSTORAGE (FOR BACKWARD COMPATIBILITY)
// ============================================================

export async function syncBudgetChaptersToLocalStorage(projectId?: string): Promise<void> {
  const chapters = projectId ? await getBudgetChapters(projectId) : await getAllBudgetChapters();
  saveBudgetChapters(chapters);
}
