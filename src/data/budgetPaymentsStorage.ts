import type { BudgetPayment } from '../types';

const BUDGET_PAYMENTS_STORAGE_KEY = 'anprojects:budget_payments';

export function getBudgetPayments(): BudgetPayment[] {
  try {
    const raw = localStorage.getItem(BUDGET_PAYMENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BudgetPayment[];
      if (Array.isArray(parsed)) {
        return parsed.sort((a, b) =>
          new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime()
        );
      }
    }
  } catch (error) {
    console.error('Error reading budget payments from localStorage:', error);
  }
  return [];
}

export function getBudgetPaymentsByItem(budgetItemId: string): BudgetPayment[] {
  try {
    const raw = localStorage.getItem(BUDGET_PAYMENTS_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as BudgetPayment[];
      if (Array.isArray(all)) {
        return all
          .filter((payment) => payment.budget_item_id === budgetItemId)
          .sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime());
      }
    }
  } catch (error) {
    console.error('Error reading budget payments by item from localStorage:', error);
  }
  return [];
}

export function getAllBudgetPayments(): BudgetPayment[] {
  try {
    const raw = localStorage.getItem(BUDGET_PAYMENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BudgetPayment[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading all budget payments from localStorage:', error);
  }
  return [];
}

export function saveBudgetPayments(payments: BudgetPayment[]): void {
  try {
    localStorage.setItem(BUDGET_PAYMENTS_STORAGE_KEY, JSON.stringify(payments));
  } catch (error) {
    console.error('Error saving budget payments to localStorage:', error);
  }
}

export function addBudgetPayment(payment: BudgetPayment): void {
  const all = getAllBudgetPayments();
  all.push(payment);
  saveBudgetPayments(all);
}

export function updateBudgetPayment(id: string, updates: Partial<BudgetPayment>): void {
  const all = getAllBudgetPayments();
  const index = all.findIndex((payment) => payment.id === id);
  if (index !== -1) {
    all[index] = { ...all[index], ...updates, updated_at: new Date().toISOString() };
    saveBudgetPayments(all);
  }
}

export function deleteBudgetPayment(id: string): void {
  const all = getAllBudgetPayments();
  const filtered = all.filter((payment) => payment.id !== id);
  saveBudgetPayments(filtered);
}

export function getBudgetPaymentById(id: string): BudgetPayment | null {
  const all = getAllBudgetPayments();
  return all.find((payment) => payment.id === id) || null;
}

export function getItemPaymentSummary(budgetItemId: string): {
  totalPaid: number;
  pendingAmount: number;
  paymentCount: number;
} {
  const payments = getBudgetPaymentsByItem(budgetItemId);
  const paidPayments = payments.filter((p) => p.status === 'paid');
  const pendingPayments = payments.filter((p) => p.status !== 'paid');

  return {
    totalPaid: paidPayments.reduce((sum, p) => sum + p.total_amount, 0),
    pendingAmount: pendingPayments.reduce((sum, p) => sum + p.total_amount, 0),
    paymentCount: payments.length,
  };
}

export function getPaymentsByMonth(year: number, month: number): BudgetPayment[] {
  const all = getAllBudgetPayments();
  return all.filter((payment) => {
    const date = new Date(payment.invoice_date);
    return date.getFullYear() === year && date.getMonth() === month;
  });
}

export function deletePaymentsByBudgetItem(budgetItemId: string): void {
  const all = getAllBudgetPayments();
  const filtered = all.filter((payment) => payment.budget_item_id !== budgetItemId);
  saveBudgetPayments(filtered);
}

export function calculatePaymentTotals(payment: Partial<BudgetPayment>): {
  vat_amount: number;
  total_amount: number;
} {
  const amount = payment.amount || 0;
  const vat_amount = payment.vat_amount || amount * 0.17;
  const total_amount = amount + vat_amount;

  return { vat_amount, total_amount };
}
