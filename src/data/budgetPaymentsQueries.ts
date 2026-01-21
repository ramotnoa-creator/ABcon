import type { BudgetPayment, BudgetItem, Project } from '../types';
import { getAllBudgetPayments } from '../services/budgetPaymentsService';
import { getAllBudgetItems, getBudgetItems } from '../services/budgetItemsService';
import { getProjects } from '../services/projectsService';

export interface PaymentWithDetails {
  payment: BudgetPayment;
  budgetItem: BudgetItem;
  project: Project;
}

export interface PaymentSummary {
  totalAmount: number;
  paymentCount: number;
  payments: PaymentWithDetails[];
}

/**
 * Get payments within a date range, optionally filtered by project
 * Uses payment_date for paid payments, invoice_date for pending/approved
 */
export async function getPaymentsInDateRange(
  startDate: Date,
  endDate: Date,
  projectId?: string,
  statusFilter?: ('pending' | 'approved' | 'paid')[]
): Promise<PaymentWithDetails[]> {
  const [allPayments, allItems, projects] = await Promise.all([
    getAllBudgetPayments(),
    getAllBudgetItems(),
    getProjects(),
  ]);

  // Create lookup maps
  const itemMap = new Map(allItems.map((i) => [i.id, i]));
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  // If filtering by project, get relevant item IDs
  let relevantItemIds: Set<string> | null = null;
  if (projectId) {
    const projectItems = await getBudgetItems(projectId);
    relevantItemIds = new Set(projectItems.map((i) => i.id));
  }

  return allPayments
    .filter((payment) => {
      // Filter by project if specified
      if (relevantItemIds && !relevantItemIds.has(payment.budget_item_id)) {
        return false;
      }

      // Filter by status if specified
      if (statusFilter && !statusFilter.includes(payment.status)) {
        return false;
      }

      // Use payment_date for paid, invoice_date for pending/approved
      const dateToCheck =
        payment.status === 'paid' && payment.payment_date
          ? new Date(payment.payment_date)
          : new Date(payment.invoice_date);

      return dateToCheck >= startDate && dateToCheck <= endDate;
    })
    .map((payment) => {
      const budgetItem = itemMap.get(payment.budget_item_id);
      const project = budgetItem ? projectMap.get(budgetItem.project_id) : undefined;

      return {
        payment,
        budgetItem: budgetItem!,
        project: project!,
      };
    })
    .filter((item) => item.budgetItem && item.project)
    .sort((a, b) => {
      const dateA =
        a.payment.status === 'paid' && a.payment.payment_date
          ? new Date(a.payment.payment_date)
          : new Date(a.payment.invoice_date);
      const dateB =
        b.payment.status === 'paid' && b.payment.payment_date
          ? new Date(b.payment.payment_date)
          : new Date(b.payment.invoice_date);
      return dateB.getTime() - dateA.getTime();
    });
}

/**
 * Get payments that were paid in the last 30 days
 * Optionally filter by project
 */
export async function getLastMonthPaidAmount(projectId?: string): Promise<PaymentSummary> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const payments = await getPaymentsInDateRange(thirtyDaysAgo, now, projectId, ['paid']);

  return {
    totalAmount: payments.reduce((sum, p) => sum + p.payment.total_amount, 0),
    paymentCount: payments.length,
    payments,
  };
}

/**
 * Get payments scheduled for the next 30 days (pending or approved)
 * Optionally filter by project
 */
export async function getNextMonthPlannedPayments(projectId?: string): Promise<PaymentSummary> {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const payments = await getPaymentsInDateRange(now, thirtyDaysFromNow, projectId, [
    'pending',
    'approved',
  ]);

  return {
    totalAmount: payments.reduce((sum, p) => sum + p.payment.total_amount, 0),
    paymentCount: payments.length,
    payments,
  };
}

/**
 * Group payments by project for display
 */
export function groupPaymentsByProject(
  payments: PaymentWithDetails[]
): Map<string, PaymentWithDetails[]> {
  const map = new Map<string, PaymentWithDetails[]>();

  payments.forEach((item) => {
    const projectId = item.project.id;
    const existing = map.get(projectId) || [];
    existing.push(item);
    map.set(projectId, existing);
  });

  return map;
}

/**
 * Get payment summary for dashboard display
 */
export async function getPaymentDashboardSummary(): Promise<{
  lastMonthPaid: number;
  lastMonthCount: number;
  nextMonthPlanned: number;
  nextMonthCount: number;
}> {
  const [lastMonth, nextMonth] = await Promise.all([
    getLastMonthPaidAmount(),
    getNextMonthPlannedPayments(),
  ]);

  return {
    lastMonthPaid: lastMonth.totalAmount,
    lastMonthCount: lastMonth.paymentCount,
    nextMonthPlanned: nextMonth.totalAmount,
    nextMonthCount: nextMonth.paymentCount,
  };
}
