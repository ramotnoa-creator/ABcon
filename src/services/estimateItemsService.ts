/**
 * Estimate Items Service - Neon Database API
 * Handles CRUD operations for estimate line items with VAT calculations
 */

import { executeQuery, executeQuerySingle, isDemoMode as isNeonDemoMode } from '../lib/neon';
import type { EstimateItem } from '../types';

// Check if we're in demo mode
const isDemoMode = isNeonDemoMode;

// Demo mode storage
const STORAGE_KEY = 'abcon_estimate_items';

function getItemsFromStorage(): EstimateItem[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveItemsToStorage(items: EstimateItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// ============================================================
// CALCULATE ITEM TOTALS (VAT CALCULATIONS)
// ============================================================

export function calculateItemTotals(item: {
  quantity: number;
  unit_price: number;
  vat_rate: number;
}): {
  total_price: number;
  vat_amount: number;
  total_with_vat: number;
} {
  const total_price = item.quantity * item.unit_price;
  const vat_amount = total_price * (item.vat_rate / 100);
  const total_with_vat = total_price + vat_amount;

  return {
    total_price: Math.round(total_price * 100) / 100,
    vat_amount: Math.round(vat_amount * 100) / 100,
    total_with_vat: Math.round(total_with_vat * 100) / 100,
  };
}

// ============================================================
// GET ESTIMATE ITEMS
// ============================================================

export async function getEstimateItems(estimateId: string): Promise<EstimateItem[]> {
  if (isDemoMode) {
    const items = getItemsFromStorage();
    return items
      .filter((i) => i.estimate_id === estimateId)
      .sort((a, b) => a.order_index - b.order_index);
  }

  try {
    const data = await executeQuery<Record<string, unknown>>(
      `SELECT * FROM estimate_items WHERE estimate_id = $1 ORDER BY order_index ASC`,
      [estimateId]
    );

    return (data || []).map(transformEstimateItemFromDB);
  } catch (error: unknown) {
    console.error('Error fetching estimate items:', error);
    const items = getItemsFromStorage();
    return items
      .filter((i) => i.estimate_id === estimateId)
      .sort((a, b) => a.order_index - b.order_index);
  }
}

// ============================================================
// CREATE ESTIMATE ITEM
// ============================================================

export async function createEstimateItem(
  item: Omit<EstimateItem, 'id' | 'created_at' | 'updated_at'>
): Promise<EstimateItem> {
  // Calculate totals
  const totals = calculateItemTotals({
    quantity: item.quantity,
    unit_price: item.unit_price,
    vat_rate: item.vat_rate,
  });

  const itemWithTotals = {
    ...item,
    total_price: totals.total_price,
    vat_amount: totals.vat_amount,
    total_with_vat: totals.total_with_vat,
  };

  if (isDemoMode) {
    const newItem: EstimateItem = {
      ...itemWithTotals,
      id: `item-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const items = getItemsFromStorage();
    items.push(newItem);
    saveItemsToStorage(items);

    // Update estimate total_amount
    await updateEstimateTotal(item.estimate_id);

    return newItem;
  }

  try {
    const data = await executeQuerySingle<Record<string, unknown>>(
      `INSERT INTO estimate_items (
        estimate_id, code, name, description, category, subcategory, unit, quantity, unit_price,
        total_price, vat_rate, vat_amount, total_with_vat, notes, order_index
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        itemWithTotals.estimate_id,
        itemWithTotals.code || null,
        itemWithTotals.name || itemWithTotals.description || 'ללא שם', // Fallback to description if name missing
        itemWithTotals.description || null, // OPTIONAL
        itemWithTotals.category || null,
        itemWithTotals.subcategory || null,
        itemWithTotals.unit || null,
        itemWithTotals.quantity,
        itemWithTotals.unit_price,
        itemWithTotals.total_price,
        itemWithTotals.vat_rate,
        itemWithTotals.vat_amount,
        itemWithTotals.total_with_vat,
        itemWithTotals.notes || null,
        itemWithTotals.order_index,
      ]
    );

    if (!data) {
      throw new Error('Failed to create estimate item');
    }

    // Update estimate total_amount
    await updateEstimateTotal(item.estimate_id);

    return transformEstimateItemFromDB(data);
  } catch (error: unknown) {
    console.error('Error creating estimate item:', error);
    // Fallback to localStorage
    const newItem: EstimateItem = {
      ...itemWithTotals,
      id: `item-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const items = getItemsFromStorage();
    items.push(newItem);
    saveItemsToStorage(items);

    // Update estimate total_amount
    await updateEstimateTotal(item.estimate_id);

    return newItem;
  }
}

// ============================================================
// UPDATE ESTIMATE ITEM
// ============================================================

export async function updateEstimateItem(
  itemId: string,
  updates: Partial<EstimateItem>
): Promise<void> {
  // Recalculate totals if quantity, unit_price, or vat_rate changed
  let updatesWithTotals = { ...updates };
  if (
    updates.quantity !== undefined ||
    updates.unit_price !== undefined ||
    updates.vat_rate !== undefined
  ) {
    // Get current item to have all values
    const currentItem = isDemoMode
      ? getItemsFromStorage().find((i) => i.id === itemId)
      : await getEstimateItemById(itemId);

    if (currentItem) {
      const totals = calculateItemTotals({
        quantity: updates.quantity ?? currentItem.quantity,
        unit_price: updates.unit_price ?? currentItem.unit_price,
        vat_rate: updates.vat_rate ?? currentItem.vat_rate,
      });

      updatesWithTotals = {
        ...updatesWithTotals,
        total_price: totals.total_price,
        vat_amount: totals.vat_amount,
        total_with_vat: totals.total_with_vat,
      };
    }
  }

  if (isDemoMode) {
    const items = getItemsFromStorage();
    const index = items.findIndex((i) => i.id === itemId);
    if (index !== -1) {
      items[index] = {
        ...items[index],
        ...updatesWithTotals,
        updated_at: new Date().toISOString(),
      };
      saveItemsToStorage(items);

      // Update estimate total_amount
      await updateEstimateTotal(items[index].estimate_id);
    }
    return;
  }

  try {
    // Build SET clause dynamically
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updatesWithTotals.estimate_id !== undefined) {
      setClauses.push(`estimate_id = $${paramIndex++}`);
      values.push(updatesWithTotals.estimate_id);
    }
    if (updatesWithTotals.code !== undefined) {
      setClauses.push(`code = $${paramIndex++}`);
      values.push(updatesWithTotals.code);
    }
    if (updatesWithTotals.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(updatesWithTotals.name);
    }
    if (updatesWithTotals.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(updatesWithTotals.description);
    }
    if (updatesWithTotals.category !== undefined) {
      setClauses.push(`category = $${paramIndex++}`);
      values.push(updatesWithTotals.category);
    }
    if (updatesWithTotals.subcategory !== undefined) {
      setClauses.push(`subcategory = $${paramIndex++}`);
      values.push(updatesWithTotals.subcategory);
    }
    if (updatesWithTotals.unit !== undefined) {
      setClauses.push(`unit = $${paramIndex++}`);
      values.push(updatesWithTotals.unit);
    }
    if (updatesWithTotals.quantity !== undefined) {
      setClauses.push(`quantity = $${paramIndex++}`);
      values.push(updatesWithTotals.quantity);
    }
    if (updatesWithTotals.unit_price !== undefined) {
      setClauses.push(`unit_price = $${paramIndex++}`);
      values.push(updatesWithTotals.unit_price);
    }
    if (updatesWithTotals.total_price !== undefined) {
      setClauses.push(`total_price = $${paramIndex++}`);
      values.push(updatesWithTotals.total_price);
    }
    if (updatesWithTotals.vat_rate !== undefined) {
      setClauses.push(`vat_rate = $${paramIndex++}`);
      values.push(updatesWithTotals.vat_rate);
    }
    if (updatesWithTotals.vat_amount !== undefined) {
      setClauses.push(`vat_amount = $${paramIndex++}`);
      values.push(updatesWithTotals.vat_amount);
    }
    if (updatesWithTotals.total_with_vat !== undefined) {
      setClauses.push(`total_with_vat = $${paramIndex++}`);
      values.push(updatesWithTotals.total_with_vat);
    }
    if (updatesWithTotals.notes !== undefined) {
      setClauses.push(`notes = $${paramIndex++}`);
      values.push(updatesWithTotals.notes);
    }
    if (updatesWithTotals.order_index !== undefined) {
      setClauses.push(`order_index = $${paramIndex++}`);
      values.push(updatesWithTotals.order_index);
    }

    if (setClauses.length === 0) {
      return; // Nothing to update
    }

    // Always update updated_at
    setClauses.push(`updated_at = NOW()`);

    // Add item ID as final parameter
    values.push(itemId);

    const query = `UPDATE estimate_items SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING estimate_id`;

    const result = await executeQuerySingle<{ estimate_id: string }>(query, values);

    // Update estimate total_amount
    if (result?.estimate_id) {
      await updateEstimateTotal(result.estimate_id);
    }
  } catch (error: unknown) {
    console.error('Error updating estimate item:', error);
    // Fallback to localStorage
    const items = getItemsFromStorage();
    const index = items.findIndex((i) => i.id === itemId);
    if (index !== -1) {
      items[index] = {
        ...items[index],
        ...updatesWithTotals,
        updated_at: new Date().toISOString(),
      };
      saveItemsToStorage(items);

      // Update estimate total_amount
      await updateEstimateTotal(items[index].estimate_id);
    }
  }
}

// ============================================================
// DELETE ESTIMATE ITEM
// ============================================================

export async function deleteEstimateItem(itemId: string): Promise<void> {
  if (isDemoMode) {
    const items = getItemsFromStorage();
    const item = items.find((i) => i.id === itemId);
    const estimateId = item?.estimate_id;

    const filtered = items.filter((i) => i.id !== itemId);
    saveItemsToStorage(filtered);

    // Update estimate total_amount
    if (estimateId) {
      await updateEstimateTotal(estimateId);
    }
    return;
  }

  try {
    // Get estimate_id before deletion
    const item = await getEstimateItemById(itemId);
    const estimateId = item?.estimate_id;

    await executeQuery(`DELETE FROM estimate_items WHERE id = $1`, [itemId]);

    // Update estimate total_amount
    if (estimateId) {
      await updateEstimateTotal(estimateId);
    }
  } catch (error: unknown) {
    console.error('Error deleting estimate item:', error);
    // Fallback to localStorage
    const items = getItemsFromStorage();
    const item = items.find((i) => i.id === itemId);
    const estimateId = item?.estimate_id;

    const filtered = items.filter((i) => i.id !== itemId);
    saveItemsToStorage(filtered);

    // Update estimate total_amount
    if (estimateId) {
      await updateEstimateTotal(estimateId);
    }
  }
}

// ============================================================
// BULK CREATE ESTIMATE ITEMS
// ============================================================

export async function bulkCreateEstimateItems(
  estimateId: string,
  items: Omit<EstimateItem, 'id' | 'estimate_id' | 'created_at' | 'updated_at'>[]
): Promise<EstimateItem[]> {
  const createdItems: EstimateItem[] = [];

  for (const item of items) {
    const createdItem = await createEstimateItem({
      ...item,
      estimate_id: estimateId,
    });
    createdItems.push(createdItem);
  }

  return createdItems;
}

// ============================================================
// REORDER ESTIMATE ITEMS
// ============================================================

export async function reorderEstimateItems(
  _estimateId: string,
  orderMap: Record<string, number>
): Promise<void> {
  for (const [itemId, newOrder] of Object.entries(orderMap)) {
    await updateEstimateItem(itemId, { order_index: newOrder });
  }
}

// ============================================================
// GET ESTIMATE ITEM BY ID
// ============================================================

export async function getEstimateItemById(itemId: string): Promise<EstimateItem | null> {
  if (isDemoMode) {
    const items = getItemsFromStorage();
    return items.find((i) => i.id === itemId) || null;
  }

  try {
    const data = await executeQuerySingle<Record<string, unknown>>(
      `SELECT * FROM estimate_items WHERE id = $1`,
      [itemId]
    );

    return data ? transformEstimateItemFromDB(data) : null;
  } catch (error: unknown) {
    console.error('Error fetching estimate item:', error);
    const items = getItemsFromStorage();
    return items.find((i) => i.id === itemId) || null;
  }
}

// ============================================================
// UPDATE ESTIMATE TOTAL AMOUNT
// ============================================================

async function updateEstimateTotal(estimateId: string): Promise<void> {
  const items = await getEstimateItems(estimateId);
  const totalAmount = items.reduce((sum, item) => sum + item.total_with_vat, 0);

  // Import estimatesService to avoid circular dependency issues at module level
  const { updateEstimate } = await import('./estimatesService');
  await updateEstimate(estimateId, { total_amount: totalAmount });
}

// ============================================================
// HELPER: TRANSFORM DB TO APP FORMAT
// ============================================================

function transformEstimateItemFromDB(dbItem: any): EstimateItem {
  return {
    id: dbItem.id,
    estimate_id: dbItem.estimate_id,
    code: dbItem.code || undefined,
    description: dbItem.description,
    category: dbItem.category || undefined,
    subcategory: dbItem.subcategory || undefined,
    unit: dbItem.unit || undefined,
    quantity: parseFloat(dbItem.quantity) || 0,
    unit_price: parseFloat(dbItem.unit_price) || 0,
    total_price: parseFloat(dbItem.total_price) || 0,
    vat_rate: parseFloat(dbItem.vat_rate) || 17,
    vat_amount: parseFloat(dbItem.vat_amount) || 0,
    total_with_vat: parseFloat(dbItem.total_with_vat) || 0,
    notes: dbItem.notes || undefined,
    order_index: parseInt(dbItem.order_index) || 0,
    created_at: dbItem.created_at,
    updated_at: dbItem.updated_at,
  };
}
