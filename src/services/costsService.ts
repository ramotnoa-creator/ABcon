/**
 * Costs Service - Unified Costs System
 * Replaces separate Planning/Execution Estimates + Budget
 */

import { executeQuery, executeQuerySingle, isDemoMode as isNeonDemoMode } from '../lib/neon';
import type { CostItem } from '../types';

const isDemoMode = isNeonDemoMode;

// ============================================================
// GET COST ITEMS BY PROJECT
// ============================================================

export async function getCostItems(projectId: string): Promise<CostItem[]> {
  if (isDemoMode) {
    // Demo mode: return from localStorage
    const stored = localStorage.getItem(`cost_items_${projectId}`);
    return stored ? JSON.parse(stored) : [];
  }

  try {
    const data = await executeQuery<Record<string, unknown>>(
      `SELECT * FROM cost_items
       WHERE project_id = $1
       ORDER BY created_at DESC`,
      [projectId]
    );

    return (data || []).map(transformCostItemFromDB);
  } catch (error) {
    console.error('Error fetching cost items:', error);
    const stored = localStorage.getItem(`cost_items_${projectId}`);
    return stored ? JSON.parse(stored) : [];
  }
}

// ============================================================
// GET ALL COST ITEMS
// ============================================================

export async function getAllCostItems(): Promise<CostItem[]> {
  if (isDemoMode) {
    // Demo mode: aggregate from all projects
    const allItems: CostItem[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('cost_items_')) {
        const items = JSON.parse(localStorage.getItem(key) || '[]');
        allItems.push(...items);
      }
    }
    return allItems;
  }

  try {
    const data = await executeQuery<Record<string, unknown>>(
      `SELECT * FROM cost_items ORDER BY created_at DESC`
    );

    return (data || []).map(transformCostItemFromDB);
  } catch (error) {
    console.error('Error fetching all cost items:', error);
    return [];
  }
}

// ============================================================
// CREATE COST ITEM
// ============================================================

export async function createCostItem(
  item: Omit<CostItem, 'id' | 'created_at' | 'updated_at'>
): Promise<CostItem> {
  // Generate UUID for demo mode (database will auto-generate in real mode)
  const tempId = crypto.randomUUID();

  const newItem: CostItem = {
    ...item,
    id: tempId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isDemoMode) {
    const items = await getCostItems(item.project_id);
    items.push(newItem);
    localStorage.setItem(`cost_items_${item.project_id}`, JSON.stringify(items));
    return newItem;
  }

  try {
    const data = await executeQuerySingle<Record<string, unknown>>(
      `INSERT INTO cost_items (
        id, project_id, name, description, type, category,
        estimated_amount, actual_amount, vat_included, vat_rate,
        status, tender_id, notes, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        newItem.id,
        newItem.project_id,
        newItem.name,
        newItem.description || null,
        'execution',
        newItem.category,
        newItem.estimated_amount,
        newItem.actual_amount ?? null,
        newItem.vat_included,
        newItem.vat_rate,
        newItem.status,
        newItem.tender_id || null,
        newItem.notes || null,
        newItem.created_by || null,
        newItem.created_at,
        newItem.updated_at,
      ]
    );

    return data ? transformCostItemFromDB(data) : newItem;
  } catch (error) {
    console.error('Error creating cost item:', error);
    // Fallback to localStorage
    const items = await getCostItems(item.project_id);
    items.push(newItem);
    localStorage.setItem(`cost_items_${item.project_id}`, JSON.stringify(items));
    return newItem;
  }
}

// ============================================================
// UPDATE COST ITEM
// ============================================================

export async function updateCostItem(
  id: string,
  updates: Partial<CostItem>
): Promise<void> {
  if (isDemoMode) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('cost_items_')) {
        const items: CostItem[] = JSON.parse(localStorage.getItem(key) || '[]');
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
          items[index] = {
            ...items[index],
            ...updates,
            updated_at: new Date().toISOString(),
          };
          localStorage.setItem(key, JSON.stringify(items));
          return;
        }
      }
    }
    return;
  }

  try {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) { setClauses.push(`name = $${paramIndex++}`); values.push(updates.name); }
    if (updates.description !== undefined) { setClauses.push(`description = $${paramIndex++}`); values.push(updates.description); }
    if (updates.category !== undefined) { setClauses.push(`category = $${paramIndex++}`); values.push(updates.category); }
    if (updates.estimated_amount !== undefined) { setClauses.push(`estimated_amount = $${paramIndex++}`); values.push(updates.estimated_amount); }
    if (updates.actual_amount !== undefined) { setClauses.push(`actual_amount = $${paramIndex++}`); values.push(updates.actual_amount); }
    if (updates.vat_included !== undefined) { setClauses.push(`vat_included = $${paramIndex++}`); values.push(updates.vat_included); }
    if (updates.vat_rate !== undefined) { setClauses.push(`vat_rate = $${paramIndex++}`); values.push(updates.vat_rate); }
    if (updates.status !== undefined) { setClauses.push(`status = $${paramIndex++}`); values.push(updates.status); }
    if (updates.tender_id !== undefined) { setClauses.push(`tender_id = $${paramIndex++}`); values.push(updates.tender_id); }
    if (updates.notes !== undefined) { setClauses.push(`notes = $${paramIndex++}`); values.push(updates.notes); }

    if (setClauses.length === 0) return;

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    await executeQuery(
      `UPDATE cost_items SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
  } catch (error) {
    console.error('Error updating cost item:', error);
    throw error;
  }
}

// ============================================================
// DELETE COST ITEM
// ============================================================

export async function deleteCostItem(id: string): Promise<void> {
  // Cascade: delete linked payment schedule
  try {
    const { deleteScheduleByCostItem } = await import('./paymentSchedulesService');
    await deleteScheduleByCostItem(id);
  } catch (e) {
    console.error('Error cascading schedule delete for cost item:', e);
  }

  if (isDemoMode) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('cost_items_')) {
        const items: CostItem[] = JSON.parse(localStorage.getItem(key) || '[]');
        const filtered = items.filter(item => item.id !== id);
        if (filtered.length !== items.length) {
          localStorage.setItem(key, JSON.stringify(filtered));
          return;
        }
      }
    }
    return;
  }

  try {
    await executeQuery(`DELETE FROM cost_items WHERE id = $1`, [id]);
  } catch (error) {
    console.error('Error deleting cost item:', error);
    throw error;
  }
}

// ============================================================
// BULK CREATE COST ITEMS
// ============================================================

export async function bulkCreateCostItems(
  items: Omit<CostItem, 'id' | 'created_at' | 'updated_at'>[]
): Promise<{ success: number; errors: { index: number; name: string; error: string }[] }> {
  const errors: { index: number; name: string; error: string }[] = [];
  let success = 0;

  for (let i = 0; i < items.length; i++) {
    try {
      await createCostItem(items[i]);
      success++;
    } catch (error) {
      errors.push({
        index: i,
        name: items[i].name,
        error: (error as Error).message || 'Unknown error',
      });
    }
  }

  return { success, errors };
}

// ============================================================
// EXPORT COST ITEM TO TENDER
// ============================================================

export async function exportCostItemToTender(
  costItemId: string,
  projectId: string,
  tenderData: Partial<import('../types').Tender>
): Promise<string> {
  const { createTender } = await import('./tendersService');

  const projectItems = await getCostItems(projectId);
  const costItem = projectItems.find(item => item.id === costItemId);

  if (!costItem) {
    throw new Error('Cost item not found');
  }

  if (costItem.tender_id) {
    throw new Error('פריט זה כבר יוצא למכרז');
  }

  if (costItem.status !== 'draft') {
    throw new Error('ניתן לייצא למכרז רק פריטים בסטטוס אומדן');
  }

  const newTender = await createTender({
    ...tenderData,
    project_id: costItem.project_id,
    tender_name: tenderData.tender_name || costItem.name,
    description: tenderData.description || costItem.description,
    estimated_budget: costItem.estimated_amount,
    cost_item_id: costItem.id,
    status: 'Draft',
    candidate_professional_ids: tenderData.candidate_professional_ids || [],
  } as any);

  try {
    await updateCostItem(costItemId, {
      tender_id: newTender.id,
      status: 'tender_draft',
    });
  } catch (updateError) {
    console.error('Failed to update cost item after tender creation:', updateError);
  }

  return newTender.id;
}

// ============================================================
// HELPER: TRANSFORM DB TO APP FORMAT
// ============================================================

function transformCostItemFromDB(dbItem: any): CostItem {
  return {
    id: dbItem.id,
    project_id: dbItem.project_id,
    name: dbItem.name,
    description: dbItem.description || undefined,
    category: dbItem.category,
    estimated_amount: parseFloat(dbItem.estimated_amount),
    actual_amount: dbItem.actual_amount != null ? parseFloat(dbItem.actual_amount) : undefined,
    vat_included: dbItem.vat_included,
    vat_rate: parseFloat(dbItem.vat_rate),
    status: dbItem.status,
    tender_id: dbItem.tender_id || undefined,
    notes: dbItem.notes || undefined,
    created_by: dbItem.created_by || undefined,
    created_at: dbItem.created_at,
    updated_at: dbItem.updated_at,
  };
}
