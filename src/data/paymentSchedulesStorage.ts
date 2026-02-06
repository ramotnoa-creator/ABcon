import type { PaymentSchedule, ScheduleItem } from '../types';

const SCHEDULES_KEY = 'anprojects:payment_schedules';
const SCHEDULE_ITEMS_KEY = 'anprojects:schedule_items';

// ============================================================
// PAYMENT SCHEDULES
// ============================================================

export function getAllSchedules(): PaymentSchedule[] {
  try {
    const raw = localStorage.getItem(SCHEDULES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PaymentSchedule[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.error('Error reading payment schedules from localStorage:', error);
  }
  return [];
}

export function getSchedulesByProject(projectId: string): PaymentSchedule[] {
  return getAllSchedules().filter((s) => s.project_id === projectId);
}

export function getScheduleByCostItem(costItemId: string): PaymentSchedule | null {
  return getAllSchedules().find((s) => s.cost_item_id === costItemId) || null;
}

export function getScheduleById(id: string): PaymentSchedule | null {
  return getAllSchedules().find((s) => s.id === id) || null;
}

export function saveSchedules(schedules: PaymentSchedule[]): void {
  try {
    localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
  } catch (error) {
    console.error('Error saving payment schedules to localStorage:', error);
  }
}

export function addSchedule(schedule: PaymentSchedule): void {
  const all = getAllSchedules();
  all.push(schedule);
  saveSchedules(all);
}

export function updateSchedule(id: string, updates: Partial<PaymentSchedule>): void {
  const all = getAllSchedules();
  const index = all.findIndex((s) => s.id === id);
  if (index !== -1) {
    all[index] = { ...all[index], ...updates, updated_at: new Date().toISOString() };
    saveSchedules(all);
  }
}

export function deleteSchedule(id: string): void {
  const all = getAllSchedules();
  saveSchedules(all.filter((s) => s.id !== id));
  // Cascade: delete schedule items
  deleteScheduleItemsBySchedule(id);
}

export function deleteScheduleByCostItem(costItemId: string): void {
  const all = getAllSchedules();
  const schedule = all.find((s) => s.cost_item_id === costItemId);
  if (schedule) {
    deleteScheduleItemsBySchedule(schedule.id);
  }
  saveSchedules(all.filter((s) => s.cost_item_id !== costItemId));
}

// ============================================================
// SCHEDULE ITEMS
// ============================================================

export function getAllScheduleItems(): ScheduleItem[] {
  try {
    const raw = localStorage.getItem(SCHEDULE_ITEMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ScheduleItem[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.error('Error reading schedule items from localStorage:', error);
  }
  return [];
}

export function getScheduleItems(scheduleId: string): ScheduleItem[] {
  return getAllScheduleItems()
    .filter((si) => si.schedule_id === scheduleId)
    .sort((a, b) => a.order - b.order);
}

export function getScheduleItemsByProject(projectId: string): ScheduleItem[] {
  return getAllScheduleItems()
    .filter((si) => si.project_id === projectId)
    .sort((a, b) => a.order - b.order);
}

export function getScheduleItemsByMilestone(milestoneId: string): ScheduleItem[] {
  return getAllScheduleItems().filter((si) => si.milestone_id === milestoneId);
}

export function getScheduleItemById(id: string): ScheduleItem | null {
  return getAllScheduleItems().find((si) => si.id === id) || null;
}

export function saveScheduleItems(items: ScheduleItem[]): void {
  try {
    localStorage.setItem(SCHEDULE_ITEMS_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving schedule items to localStorage:', error);
  }
}

export function addScheduleItem(item: ScheduleItem): void {
  const all = getAllScheduleItems();
  all.push(item);
  saveScheduleItems(all);
}

export function updateScheduleItem(id: string, updates: Partial<ScheduleItem>): void {
  const all = getAllScheduleItems();
  const index = all.findIndex((si) => si.id === id);
  if (index !== -1) {
    all[index] = { ...all[index], ...updates, updated_at: new Date().toISOString() };
    saveScheduleItems(all);
  }
}

export function deleteScheduleItem(id: string): void {
  const all = getAllScheduleItems();
  saveScheduleItems(all.filter((si) => si.id !== id));
}

export function deleteScheduleItemsBySchedule(scheduleId: string): void {
  const all = getAllScheduleItems();
  saveScheduleItems(all.filter((si) => si.schedule_id !== scheduleId));
}

export function nullifyMilestoneOnScheduleItems(milestoneId: string): void {
  const all = getAllScheduleItems();
  let changed = false;
  for (const item of all) {
    if (item.milestone_id === milestoneId) {
      item.milestone_id = undefined;
      item.milestone_name = undefined;
      item.updated_at = new Date().toISOString();
      changed = true;
    }
  }
  if (changed) saveScheduleItems(all);
}

// ============================================================
// COMPUTED HELPERS
// ============================================================

export interface ScheduleSummary {
  totalAmount: number;
  paidAmount: number;
  approvedAmount: number;
  pendingAmount: number;
  confirmedAmount: number;
  itemCount: number;
  paidCount: number;
  allLinkedToMilestones: boolean;
  hasManualDatesOnly: boolean;
}

export function getScheduleSummary(scheduleId: string): ScheduleSummary {
  const items = getScheduleItems(scheduleId);

  const paidItems = items.filter((i) => i.status === 'paid');
  const approvedItems = items.filter((i) => i.status === 'approved');
  const confirmedItems = items.filter((i) => i.status === 'milestone_confirmed');
  const pendingItems = items.filter(
    (i) => i.status === 'pending' || i.status === 'invoice_received'
  );

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
}
