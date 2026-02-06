/**
 * Payment Schedules Service - Dual-mode (DB + localStorage)
 * Manages payment schedules and schedule items for cost items
 */

import { executeQuery, executeQuerySingle, isDemoMode as isNeonDemoMode } from '../lib/neon';
import type { PaymentSchedule, ScheduleItem } from '../types';
import {
  getAllSchedules as getAllSchedulesLocal,
  getSchedulesByProject as getSchedulesByProjectLocal,
  getScheduleByCostItem as getScheduleByCostItemLocal,
  getScheduleById as getScheduleByIdLocal,
  addSchedule as addScheduleLocal,
  updateSchedule as updateScheduleLocal,
  deleteSchedule as deleteScheduleLocal,
  deleteScheduleByCostItem as deleteScheduleByCostItemLocal,
  getAllScheduleItems as getAllScheduleItemsLocal,
  getScheduleItems as getScheduleItemsLocal,
  getScheduleItemsByProject as getScheduleItemsByProjectLocal,
  getScheduleItemsByMilestone as getScheduleItemsByMilestoneLocal,
  getScheduleItemById as getScheduleItemByIdLocal,
  addScheduleItem as addScheduleItemLocal,
  updateScheduleItem as updateScheduleItemLocal,
  deleteScheduleItem as deleteScheduleItemLocal,
  deleteScheduleItemsBySchedule as deleteScheduleItemsByScheduleLocal,
  nullifyMilestoneOnScheduleItems as nullifyMilestoneLocal,
  getScheduleSummary as getScheduleSummaryLocal,
  saveScheduleItems as saveScheduleItemsLocal,
  type ScheduleSummary,
} from '../data/paymentSchedulesStorage';

const isDemoMode = isNeonDemoMode;

// ============================================================
// PAYMENT SCHEDULES
// ============================================================

export async function getSchedulesByProject(projectId: string): Promise<PaymentSchedule[]> {
  if (isDemoMode) return getSchedulesByProjectLocal(projectId);

  try {
    const data = await executeQuery<Record<string, unknown>>(
      `SELECT * FROM payment_schedules WHERE project_id = $1 ORDER BY created_at DESC`,
      [projectId]
    );
    return (data || []).map(transformScheduleFromDB);
  } catch (error) {
    console.error('Error fetching payment schedules:', error);
    return getSchedulesByProjectLocal(projectId);
  }
}

export async function getScheduleByCostItem(costItemId: string): Promise<PaymentSchedule | null> {
  if (isDemoMode) return getScheduleByCostItemLocal(costItemId);

  try {
    const data = await executeQuerySingle<Record<string, unknown>>(
      `SELECT * FROM payment_schedules WHERE cost_item_id = $1`,
      [costItemId]
    );
    return data ? transformScheduleFromDB(data) : null;
  } catch (error) {
    console.error('Error fetching schedule by cost item:', error);
    return getScheduleByCostItemLocal(costItemId);
  }
}

export async function getScheduleById(id: string): Promise<PaymentSchedule | null> {
  if (isDemoMode) return getScheduleByIdLocal(id);

  try {
    const data = await executeQuerySingle<Record<string, unknown>>(
      `SELECT * FROM payment_schedules WHERE id = $1`,
      [id]
    );
    return data ? transformScheduleFromDB(data) : null;
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return getScheduleByIdLocal(id);
  }
}

export async function createSchedule(
  schedule: Omit<PaymentSchedule, 'id' | 'created_at' | 'updated_at'>
): Promise<PaymentSchedule> {
  const now = new Date().toISOString();
  const newSchedule: PaymentSchedule = {
    ...schedule,
    id: `schedule-${Date.now()}`,
    created_at: now,
    updated_at: now,
  };

  if (isDemoMode) {
    addScheduleLocal(newSchedule);
    return newSchedule;
  }

  try {
    const data = await executeQuerySingle<Record<string, unknown>>(
      `INSERT INTO payment_schedules (cost_item_id, project_id, total_amount, status, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [schedule.cost_item_id, schedule.project_id, schedule.total_amount, schedule.status, schedule.created_by || null]
    );
    return data ? transformScheduleFromDB(data) : newSchedule;
  } catch (error) {
    console.error('Error creating payment schedule:', error);
    addScheduleLocal(newSchedule);
    return newSchedule;
  }
}

export async function updateSchedule(id: string, updates: Partial<PaymentSchedule>): Promise<void> {
  if (isDemoMode) {
    updateScheduleLocal(id, updates);
    return;
  }

  try {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'created_at') {
        setClauses.push(`${key} = $${idx++}`);
        values.push(value);
      }
    }
    if (setClauses.length === 0) return;
    setClauses.push('updated_at = NOW()');
    values.push(id);

    await executeQuery(
      `UPDATE payment_schedules SET ${setClauses.join(', ')} WHERE id = $${idx}`,
      values
    );
  } catch (error) {
    console.error('Error updating payment schedule:', error);
    updateScheduleLocal(id, updates);
  }
}

export async function deleteSchedule(id: string): Promise<void> {
  if (isDemoMode) {
    deleteScheduleLocal(id);
    return;
  }

  try {
    await executeQuery(`DELETE FROM payment_schedules WHERE id = $1`, [id]);
  } catch (error) {
    console.error('Error deleting payment schedule:', error);
    deleteScheduleLocal(id);
  }
}

export async function deleteScheduleByCostItem(costItemId: string): Promise<void> {
  if (isDemoMode) {
    deleteScheduleByCostItemLocal(costItemId);
    return;
  }

  try {
    await executeQuery(`DELETE FROM payment_schedules WHERE cost_item_id = $1`, [costItemId]);
  } catch (error) {
    console.error('Error deleting schedule by cost item:', error);
    deleteScheduleByCostItemLocal(costItemId);
  }
}

// ============================================================
// SCHEDULE ITEMS
// ============================================================

export async function getScheduleItems(scheduleId: string): Promise<ScheduleItem[]> {
  if (isDemoMode) return getScheduleItemsLocal(scheduleId);

  try {
    const data = await executeQuery<Record<string, unknown>>(
      `SELECT * FROM schedule_items WHERE schedule_id = $1 ORDER BY "order" ASC`,
      [scheduleId]
    );
    return (data || []).map(transformScheduleItemFromDB);
  } catch (error) {
    console.error('Error fetching schedule items:', error);
    return getScheduleItemsLocal(scheduleId);
  }
}

export async function getScheduleItemsByProject(projectId: string): Promise<ScheduleItem[]> {
  if (isDemoMode) return getScheduleItemsByProjectLocal(projectId);

  try {
    const data = await executeQuery<Record<string, unknown>>(
      `SELECT * FROM schedule_items WHERE project_id = $1 ORDER BY "order" ASC`,
      [projectId]
    );
    return (data || []).map(transformScheduleItemFromDB);
  } catch (error) {
    console.error('Error fetching schedule items by project:', error);
    return getScheduleItemsByProjectLocal(projectId);
  }
}

export async function getScheduleItemsByMilestone(milestoneId: string): Promise<ScheduleItem[]> {
  if (isDemoMode) return getScheduleItemsByMilestoneLocal(milestoneId);

  try {
    const data = await executeQuery<Record<string, unknown>>(
      `SELECT * FROM schedule_items WHERE milestone_id = $1`,
      [milestoneId]
    );
    return (data || []).map(transformScheduleItemFromDB);
  } catch (error) {
    console.error('Error fetching schedule items by milestone:', error);
    return getScheduleItemsByMilestoneLocal(milestoneId);
  }
}

export async function createScheduleItem(
  item: Omit<ScheduleItem, 'id' | 'created_at' | 'updated_at'>
): Promise<ScheduleItem> {
  const now = new Date().toISOString();
  const newItem: ScheduleItem = {
    ...item,
    id: `si-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    created_at: now,
    updated_at: now,
  };

  if (isDemoMode) {
    addScheduleItemLocal(newItem);
    return newItem;
  }

  try {
    const data = await executeQuerySingle<Record<string, unknown>>(
      `INSERT INTO schedule_items (
        schedule_id, cost_item_id, project_id, description, amount, percentage,
        milestone_id, milestone_name, target_date, "order", status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        item.schedule_id, item.cost_item_id, item.project_id,
        item.description, item.amount, item.percentage,
        item.milestone_id || null, item.milestone_name || null,
        item.target_date || null, item.order, item.status,
      ]
    );
    return data ? transformScheduleItemFromDB(data) : newItem;
  } catch (error) {
    console.error('Error creating schedule item:', error);
    addScheduleItemLocal(newItem);
    return newItem;
  }
}

export async function createScheduleItemsBatch(
  items: Omit<ScheduleItem, 'id' | 'created_at' | 'updated_at'>[]
): Promise<ScheduleItem[]> {
  const now = new Date().toISOString();
  const newItems: ScheduleItem[] = items.map((item, idx) => ({
    ...item,
    id: `si-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
    created_at: now,
    updated_at: now,
  }));

  if (isDemoMode) {
    const existing = getAllScheduleItemsLocal();
    saveScheduleItemsLocal([...existing, ...newItems]);
    return newItems;
  }

  // For DB mode, insert one by one (could be optimized to batch later)
  const results: ScheduleItem[] = [];
  for (const item of newItems) {
    try {
      const data = await executeQuerySingle<Record<string, unknown>>(
        `INSERT INTO schedule_items (
          schedule_id, cost_item_id, project_id, description, amount, percentage,
          milestone_id, milestone_name, target_date, "order", status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          item.schedule_id, item.cost_item_id, item.project_id,
          item.description, item.amount, item.percentage,
          item.milestone_id || null, item.milestone_name || null,
          item.target_date || null, item.order, item.status,
        ]
      );
      results.push(data ? transformScheduleItemFromDB(data) : item);
    } catch (error) {
      console.error('Error creating schedule item in batch:', error);
      results.push(item);
    }
  }
  return results;
}

export async function updateScheduleItem(id: string, updates: Partial<ScheduleItem>): Promise<void> {
  if (isDemoMode) {
    updateScheduleItemLocal(id, updates);
    return;
  }

  try {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'created_at') {
        const col = key === 'order' ? '"order"' : key;
        setClauses.push(`${col} = $${idx++}`);
        values.push(value ?? null);
      }
    }
    if (setClauses.length === 0) return;
    setClauses.push('updated_at = NOW()');
    values.push(id);

    await executeQuery(
      `UPDATE schedule_items SET ${setClauses.join(', ')} WHERE id = $${idx}`,
      values
    );
  } catch (error) {
    console.error('Error updating schedule item:', error);
    updateScheduleItemLocal(id, updates);
  }
}

export async function deleteScheduleItem(id: string): Promise<void> {
  if (isDemoMode) {
    deleteScheduleItemLocal(id);
    return;
  }

  try {
    await executeQuery(`DELETE FROM schedule_items WHERE id = $1`, [id]);
  } catch (error) {
    console.error('Error deleting schedule item:', error);
    deleteScheduleItemLocal(id);
  }
}

export async function deleteScheduleItemsBySchedule(scheduleId: string): Promise<void> {
  if (isDemoMode) {
    deleteScheduleItemsByScheduleLocal(scheduleId);
    return;
  }

  try {
    await executeQuery(`DELETE FROM schedule_items WHERE schedule_id = $1`, [scheduleId]);
  } catch (error) {
    console.error('Error deleting schedule items:', error);
    deleteScheduleItemsByScheduleLocal(scheduleId);
  }
}

// ============================================================
// MILESTONE CONFIRMATION
// ============================================================

export async function confirmMilestoneForSchedule(
  scheduleItemId: string,
  confirmedBy: string,
  note?: string
): Promise<void> {
  const updates: Partial<ScheduleItem> = {
    status: 'milestone_confirmed',
    confirmed_by: confirmedBy,
    confirmed_at: new Date().toISOString(),
    confirmed_note: note,
  };
  await updateScheduleItem(scheduleItemId, updates);
}

// ============================================================
// NULLIFY MILESTONE ON SCHEDULE ITEMS
// ============================================================

export async function nullifyMilestoneOnScheduleItems(milestoneId: string): Promise<void> {
  if (isDemoMode) {
    nullifyMilestoneLocal(milestoneId);
    return;
  }

  try {
    await executeQuery(
      `UPDATE schedule_items SET milestone_id = NULL, milestone_name = NULL, updated_at = NOW()
       WHERE milestone_id = $1`,
      [milestoneId]
    );
  } catch (error) {
    console.error('Error nullifying milestone on schedule items:', error);
    nullifyMilestoneLocal(milestoneId);
  }
}

// ============================================================
// SUMMARY
// ============================================================

export async function getScheduleSummary(scheduleId: string): Promise<ScheduleSummary> {
  if (isDemoMode) return getScheduleSummaryLocal(scheduleId);

  try {
    const items = await getScheduleItems(scheduleId);
    const paidItems = items.filter((i) => i.status === 'paid');
    const approvedItems = items.filter((i) => i.status === 'approved');
    const confirmedItems = items.filter((i) => i.status === 'milestone_confirmed');
    const pendingItems = items.filter((i) => i.status === 'pending' || i.status === 'invoice_received');
    const allLinked = items.length > 0 && items.every((i) => !!i.milestone_id);
    const hasManualOnly = items.length > 0 && items.every((i) => !i.milestone_id);

    return {
      totalAmount: items.reduce((s, i) => s + i.amount, 0),
      paidAmount: paidItems.reduce((s, i) => s + (i.paid_amount || i.amount), 0),
      approvedAmount: approvedItems.reduce((s, i) => s + i.amount, 0),
      confirmedAmount: confirmedItems.reduce((s, i) => s + i.amount, 0),
      pendingAmount: pendingItems.reduce((s, i) => s + i.amount, 0),
      itemCount: items.length,
      paidCount: paidItems.length,
      allLinkedToMilestones: allLinked,
      hasManualDatesOnly: hasManualOnly,
    };
  } catch (error) {
    console.error('Error getting schedule summary:', error);
    return getScheduleSummaryLocal(scheduleId);
  }
}

// ============================================================
// TRANSFORM HELPERS
// ============================================================

function transformScheduleFromDB(row: any): PaymentSchedule {
  return {
    id: row.id,
    cost_item_id: row.cost_item_id,
    project_id: row.project_id,
    total_amount: parseFloat(row.total_amount),
    status: row.status,
    created_by: row.created_by || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function transformScheduleItemFromDB(row: any): ScheduleItem {
  return {
    id: row.id,
    schedule_id: row.schedule_id,
    cost_item_id: row.cost_item_id,
    project_id: row.project_id,
    description: row.description,
    amount: parseFloat(row.amount),
    percentage: parseFloat(row.percentage),
    milestone_id: row.milestone_id || undefined,
    milestone_name: row.milestone_name || undefined,
    target_date: row.target_date || undefined,
    order: row.order,
    status: row.status,
    confirmed_by: row.confirmed_by || undefined,
    confirmed_at: row.confirmed_at || undefined,
    confirmed_note: row.confirmed_note || undefined,
    attachment_url: row.attachment_url || undefined,
    approved_by: row.approved_by || undefined,
    approved_at: row.approved_at || undefined,
    paid_date: row.paid_date || undefined,
    paid_amount: row.paid_amount ? parseFloat(row.paid_amount) : undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export type { ScheduleSummary };
