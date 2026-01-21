/**
 * Budget Items Service - Neon Database API
 * Handles CRUD operations for budget items
 */

import { executeQuery, executeQuerySingle, isDemoMode as isNeonDemoMode } from '../lib/neon';
import type { BudgetItem } from '../types';
import {
  getBudgetItems as getBudgetItemsLocal,
  getBudgetItemsByChapter as getBudgetItemsByChapterLocal,
  getAllBudgetItems as getAllBudgetItemsLocal,
  saveBudgetItems,
  addBudgetItem as addBudgetItemLocal,
  updateBudgetItem as updateBudgetItemLocal,
  deleteBudgetItem as deleteBudgetItemLocal,
  getBudgetItemById as getBudgetItemByIdLocal,
  getNextBudgetItemOrder as getNextBudgetItemOrderLocal,
  getChapterBudgetSummary as getChapterBudgetSummaryLocal,
  getProjectBudgetSummary as getProjectBudgetSummaryLocal,
  calculateBudgetItemTotals,
  getGlobalBudgetSummary as getGlobalBudgetSummaryLocal,
} from '../data/budgetItemsStorage';

// Check if we're in demo mode
const isDemoMode = isNeonDemoMode;

// ============================================================
// GET BUDGET ITEMS BY PROJECT ID
// ============================================================

export async function getBudgetItems(projectId: string): Promise<BudgetItem[]> {
  if (isDemoMode) {
    return getBudgetItemsLocal(projectId);
  }

  try {
    const data = await executeQuery<any>(
      `SELECT * FROM budget_items
       WHERE project_id = $1
       ORDER BY "order" ASC`,
      [projectId]
    );

    return (data || []).map(transformBudgetItemFromDB);
  } catch (error) {
    console.error('Error fetching budget items:', error);
    return getBudgetItemsLocal(projectId);
  }
}

// ============================================================
// GET BUDGET ITEMS BY CHAPTER
// ============================================================

export async function getBudgetItemsByChapter(projectId: string, chapterId: string): Promise<BudgetItem[]> {
  if (isDemoMode) {
    return getBudgetItemsByChapterLocal(projectId, chapterId);
  }

  try {
    const data = await executeQuery<any>(
      `SELECT * FROM budget_items
       WHERE project_id = $1 AND chapter_id = $2
       ORDER BY "order" ASC`,
      [projectId, chapterId]
    );

    return (data || []).map(transformBudgetItemFromDB);
  } catch (error) {
    console.error('Error fetching budget items by chapter:', error);
    return getBudgetItemsByChapterLocal(projectId, chapterId);
  }
}

// ============================================================
// GET ALL BUDGET ITEMS
// ============================================================

export async function getAllBudgetItems(): Promise<BudgetItem[]> {
  if (isDemoMode) {
    return getAllBudgetItemsLocal();
  }

  try {
    const data = await executeQuery<any>(
      `SELECT * FROM budget_items ORDER BY "order" ASC`
    );

    return (data || []).map(transformBudgetItemFromDB);
  } catch (error) {
    console.error('Error fetching all budget items:', error);
    return getAllBudgetItemsLocal();
  }
}

// ============================================================
// GET BUDGET ITEM BY ID
// ============================================================

export async function getBudgetItemById(id: string): Promise<BudgetItem | null> {
  if (isDemoMode) {
    return getBudgetItemByIdLocal(id);
  }

  try {
    const data = await executeQuerySingle<any>(
      `SELECT * FROM budget_items WHERE id = $1`,
      [id]
    );

    return data ? transformBudgetItemFromDB(data) : null;
  } catch (error) {
    console.error('Error fetching budget item:', error);
    return getBudgetItemByIdLocal(id);
  }
}

// ============================================================
// GET NEXT ITEM ORDER
// ============================================================

export async function getNextBudgetItemOrder(projectId: string, chapterId: string): Promise<number> {
  if (isDemoMode) {
    return getNextBudgetItemOrderLocal(projectId, chapterId);
  }

  try {
    const data = await executeQuerySingle<any>(
      `SELECT MAX("order") as max_order FROM budget_items
       WHERE project_id = $1 AND chapter_id = $2`,
      [projectId, chapterId]
    );

    const maxOrder = data?.max_order || 0;
    return maxOrder + 1;
  } catch (error) {
    console.error('Error getting next budget item order:', error);
    return getNextBudgetItemOrderLocal(projectId, chapterId);
  }
}

// ============================================================
// GET CHAPTER BUDGET SUMMARY
// ============================================================

export async function getChapterBudgetSummary(
  projectId: string,
  chapterId: string
): Promise<{
  totalPrice: number;
  totalWithVat: number;
  paidAmount: number;
  remainingAmount: number;
}> {
  if (isDemoMode) {
    return getChapterBudgetSummaryLocal(projectId, chapterId);
  }

  try {
    const items = await getBudgetItemsByChapter(projectId, chapterId);
    const totalPrice = items.reduce((sum, i) => sum + i.total_price, 0);
    const totalWithVat = items.reduce((sum, i) => sum + i.total_with_vat, 0);
    const paidAmount = items.reduce((sum, i) => sum + i.paid_amount, 0);

    return {
      totalPrice,
      totalWithVat,
      paidAmount,
      remainingAmount: totalWithVat - paidAmount,
    };
  } catch (error) {
    console.error('Error getting chapter budget summary:', error);
    return getChapterBudgetSummaryLocal(projectId, chapterId);
  }
}

// ============================================================
// GET PROJECT BUDGET SUMMARY
// ============================================================

export async function getProjectBudgetSummary(
  projectId: string
): Promise<{
  totalBudget: number;
  totalWithVat: number;
  paidAmount: number;
  remainingAmount: number;
  itemCount: number;
}> {
  if (isDemoMode) {
    return getProjectBudgetSummaryLocal(projectId);
  }

  try {
    const items = await getBudgetItems(projectId);
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
  } catch (error) {
    console.error('Error getting project budget summary:', error);
    return getProjectBudgetSummaryLocal(projectId);
  }
}

// ============================================================
// GET GLOBAL BUDGET SUMMARY
// ============================================================

export async function getGlobalBudgetSummary(): Promise<{
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  projectCount: number;
  projectIds: string[];
}> {
  if (isDemoMode) {
    return getGlobalBudgetSummaryLocal();
  }

  try {
    const allItems = await getAllBudgetItems();

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
  } catch (error) {
    console.error('Error getting global budget summary:', error);
    return getGlobalBudgetSummaryLocal();
  }
}

// ============================================================
// CREATE BUDGET ITEM
// ============================================================

export async function createBudgetItem(
  item: Omit<BudgetItem, 'id' | 'created_at' | 'updated_at'>
): Promise<BudgetItem> {
  if (isDemoMode) {
    const newItem: BudgetItem = {
      ...item,
      id: `item-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addBudgetItemLocal(newItem);
    return newItem;
  }

  try {
    const data = await executeQuerySingle<any>(
      `INSERT INTO budget_items (
        project_id, chapter_id, code, description, unit, quantity, unit_price,
        total_price, vat_rate, vat_amount, total_with_vat, status,
        supplier_id, supplier_name, tender_id, paid_amount, expected_payment_date, "order", notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        item.project_id,
        item.chapter_id,
        item.code || null,
        item.description,
        item.unit || null,
        item.quantity || null,
        item.unit_price || null,
        item.total_price,
        item.vat_rate,
        item.vat_amount,
        item.total_with_vat,
        item.status,
        item.supplier_id || null,
        item.supplier_name || null,
        item.tender_id || null,
        item.paid_amount,
        item.expected_payment_date || null,
        item.order,
        item.notes || null,
      ]
    );

    if (!data) {
      throw new Error('Failed to create budget item');
    }

    return transformBudgetItemFromDB(data);
  } catch (error) {
    console.error('Error creating budget item:', error);
    // Fallback to localStorage
    const newItem: BudgetItem = {
      ...item,
      id: `item-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addBudgetItemLocal(newItem);
    return newItem;
  }
}

// ============================================================
// UPDATE BUDGET ITEM
// ============================================================

export async function updateBudgetItem(
  id: string,
  updates: Partial<BudgetItem>
): Promise<void> {
  if (isDemoMode) {
    updateBudgetItemLocal(id, updates);
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
    if (updates.chapter_id !== undefined) {
      setClauses.push(`chapter_id = $${paramIndex++}`);
      values.push(updates.chapter_id);
    }
    if (updates.code !== undefined) {
      setClauses.push(`code = $${paramIndex++}`);
      values.push(updates.code);
    }
    if (updates.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.unit !== undefined) {
      setClauses.push(`unit = $${paramIndex++}`);
      values.push(updates.unit);
    }
    if (updates.quantity !== undefined) {
      setClauses.push(`quantity = $${paramIndex++}`);
      values.push(updates.quantity);
    }
    if (updates.unit_price !== undefined) {
      setClauses.push(`unit_price = $${paramIndex++}`);
      values.push(updates.unit_price);
    }
    if (updates.total_price !== undefined) {
      setClauses.push(`total_price = $${paramIndex++}`);
      values.push(updates.total_price);
    }
    if (updates.vat_rate !== undefined) {
      setClauses.push(`vat_rate = $${paramIndex++}`);
      values.push(updates.vat_rate);
    }
    if (updates.vat_amount !== undefined) {
      setClauses.push(`vat_amount = $${paramIndex++}`);
      values.push(updates.vat_amount);
    }
    if (updates.total_with_vat !== undefined) {
      setClauses.push(`total_with_vat = $${paramIndex++}`);
      values.push(updates.total_with_vat);
    }
    if (updates.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.supplier_id !== undefined) {
      setClauses.push(`supplier_id = $${paramIndex++}`);
      values.push(updates.supplier_id);
    }
    if (updates.supplier_name !== undefined) {
      setClauses.push(`supplier_name = $${paramIndex++}`);
      values.push(updates.supplier_name);
    }
    if (updates.tender_id !== undefined) {
      setClauses.push(`tender_id = $${paramIndex++}`);
      values.push(updates.tender_id);
    }
    if (updates.paid_amount !== undefined) {
      setClauses.push(`paid_amount = $${paramIndex++}`);
      values.push(updates.paid_amount);
    }
    if (updates.expected_payment_date !== undefined) {
      setClauses.push(`expected_payment_date = $${paramIndex++}`);
      values.push(updates.expected_payment_date);
    }
    if (updates.order !== undefined) {
      setClauses.push(`"order" = $${paramIndex++}`);
      values.push(updates.order);
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

    // Add item ID as final parameter
    values.push(id);

    const query = `UPDATE budget_items SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`;

    await executeQuery(query, values);
  } catch (error) {
    console.error('Error updating budget item:', error);
    // Fallback to localStorage
    updateBudgetItemLocal(id, updates);
  }
}

// ============================================================
// DELETE BUDGET ITEM
// ============================================================

export async function deleteBudgetItem(id: string): Promise<void> {
  if (isDemoMode) {
    deleteBudgetItemLocal(id);
    return;
  }

  try {
    // Note: Cascade delete for payments is handled by database foreign key constraints
    await executeQuery(`DELETE FROM budget_items WHERE id = $1`, [id]);
  } catch (error) {
    console.error('Error deleting budget item:', error);
    // Fallback to localStorage
    deleteBudgetItemLocal(id);
  }
}

// ============================================================
// HELPER: TRANSFORM DB TO APP FORMAT
// ============================================================

function transformBudgetItemFromDB(dbItem: any): BudgetItem {
  return {
    id: dbItem.id,
    project_id: dbItem.project_id,
    chapter_id: dbItem.chapter_id,
    code: dbItem.code || undefined,
    description: dbItem.description,
    unit: dbItem.unit || undefined,
    quantity: dbItem.quantity || undefined,
    unit_price: dbItem.unit_price || undefined,
    total_price: dbItem.total_price,
    vat_rate: dbItem.vat_rate,
    vat_amount: dbItem.vat_amount,
    total_with_vat: dbItem.total_with_vat,
    status: dbItem.status,
    supplier_id: dbItem.supplier_id || undefined,
    supplier_name: dbItem.supplier_name || undefined,
    tender_id: dbItem.tender_id || undefined,
    paid_amount: dbItem.paid_amount,
    expected_payment_date: dbItem.expected_payment_date || undefined,
    order: dbItem.order,
    notes: dbItem.notes || undefined,
    created_at: dbItem.created_at,
    updated_at: dbItem.updated_at,
  };
}

// ============================================================
// SYNC: SAVE TO LOCALSTORAGE (FOR BACKWARD COMPATIBILITY)
// ============================================================

export async function syncBudgetItemsToLocalStorage(projectId?: string): Promise<void> {
  const items = projectId ? await getBudgetItems(projectId) : await getAllBudgetItems();
  saveBudgetItems(items);
}

// Re-export helper functions
export { calculateBudgetItemTotals };
