/**
 * Budget Payments Service - Neon Database API
 * Handles CRUD operations for budget payments
 */

import { executeQuery, executeQuerySingle, isDemoMode as isNeonDemoMode } from '../lib/neon';
import type { BudgetPayment } from '../types';
import {
  getBudgetPayments as getBudgetPaymentsLocal,
  getBudgetPaymentsByItem as getBudgetPaymentsByItemLocal,
  getAllBudgetPayments as getAllBudgetPaymentsLocal,
  saveBudgetPayments,
  addBudgetPayment as addBudgetPaymentLocal,
  updateBudgetPayment as updateBudgetPaymentLocal,
  deleteBudgetPayment as deleteBudgetPaymentLocal,
  getBudgetPaymentById as getBudgetPaymentByIdLocal,
  getItemPaymentSummary as getItemPaymentSummaryLocal,
  getPaymentsByMonth as getPaymentsByMonthLocal,
  deletePaymentsByBudgetItem as deletePaymentsByBudgetItemLocal,
  calculatePaymentTotals,
} from '../data/budgetPaymentsStorage';

// Check if we're in demo mode
const isDemoMode = isNeonDemoMode;

// ============================================================
// GET ALL BUDGET PAYMENTS (SORTED)
// ============================================================

export async function getBudgetPayments(): Promise<BudgetPayment[]> {
  if (isDemoMode) {
    return getBudgetPaymentsLocal();
  }

  try {
    const data = await executeQuery<any>(
      `SELECT * FROM budget_payments ORDER BY invoice_date DESC`
    );

    return (data || []).map(transformBudgetPaymentFromDB);
  } catch (error) {
    console.error('Error fetching budget payments:', error);
    return getBudgetPaymentsLocal();
  }
}

// ============================================================
// GET BUDGET PAYMENTS BY BUDGET ITEM
// ============================================================

export async function getBudgetPaymentsByItem(budgetItemId: string): Promise<BudgetPayment[]> {
  if (isDemoMode) {
    return getBudgetPaymentsByItemLocal(budgetItemId);
  }

  try {
    const data = await executeQuery<any>(
      `SELECT * FROM budget_payments
       WHERE budget_item_id = $1
       ORDER BY invoice_date DESC`,
      [budgetItemId]
    );

    return (data || []).map(transformBudgetPaymentFromDB);
  } catch (error) {
    console.error('Error fetching budget payments by item:', error);
    return getBudgetPaymentsByItemLocal(budgetItemId);
  }
}

// ============================================================
// GET ALL BUDGET PAYMENTS (UNSORTED)
// ============================================================

export async function getAllBudgetPayments(): Promise<BudgetPayment[]> {
  if (isDemoMode) {
    return getAllBudgetPaymentsLocal();
  }

  try {
    const data = await executeQuery<any>(`SELECT * FROM budget_payments`);

    return (data || []).map(transformBudgetPaymentFromDB);
  } catch (error) {
    console.error('Error fetching all budget payments:', error);
    return getAllBudgetPaymentsLocal();
  }
}

// ============================================================
// GET BUDGET PAYMENT BY ID
// ============================================================

export async function getBudgetPaymentById(id: string): Promise<BudgetPayment | null> {
  if (isDemoMode) {
    return getBudgetPaymentByIdLocal(id);
  }

  try {
    const data = await executeQuerySingle<any>(
      `SELECT * FROM budget_payments WHERE id = $1`,
      [id]
    );

    return data ? transformBudgetPaymentFromDB(data) : null;
  } catch (error) {
    console.error('Error fetching budget payment:', error);
    return getBudgetPaymentByIdLocal(id);
  }
}

// ============================================================
// GET ITEM PAYMENT SUMMARY
// ============================================================

export async function getItemPaymentSummary(budgetItemId: string): Promise<{
  totalPaid: number;
  pendingAmount: number;
  paymentCount: number;
}> {
  if (isDemoMode) {
    return getItemPaymentSummaryLocal(budgetItemId);
  }

  try {
    const payments = await getBudgetPaymentsByItem(budgetItemId);
    const paidPayments = payments.filter((p) => p.status === 'paid');
    const pendingPayments = payments.filter((p) => p.status !== 'paid');

    return {
      totalPaid: paidPayments.reduce((sum, p) => sum + p.total_amount, 0),
      pendingAmount: pendingPayments.reduce((sum, p) => sum + p.total_amount, 0),
      paymentCount: payments.length,
    };
  } catch (error) {
    console.error('Error getting item payment summary:', error);
    return getItemPaymentSummaryLocal(budgetItemId);
  }
}

// ============================================================
// GET PAYMENTS BY MONTH
// ============================================================

export async function getPaymentsByMonth(year: number, month: number): Promise<BudgetPayment[]> {
  if (isDemoMode) {
    return getPaymentsByMonthLocal(year, month);
  }

  try {
    const all = await getAllBudgetPayments();
    return all.filter((payment) => {
      const date = new Date(payment.invoice_date);
      return date.getFullYear() === year && date.getMonth() === month;
    });
  } catch (error) {
    console.error('Error getting payments by month:', error);
    return getPaymentsByMonthLocal(year, month);
  }
}

// ============================================================
// CREATE BUDGET PAYMENT
// ============================================================

export async function createBudgetPayment(
  payment: Omit<BudgetPayment, 'id' | 'created_at' | 'updated_at'>
): Promise<BudgetPayment> {
  if (isDemoMode) {
    const newPayment: BudgetPayment = {
      ...payment,
      id: `payment-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addBudgetPaymentLocal(newPayment);
    return newPayment;
  }

  try {
    const data = await executeQuerySingle<any>(
      `INSERT INTO budget_payments (
        budget_item_id, invoice_number, invoice_date, amount, vat_amount,
        total_amount, status, payment_date, milestone_id, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        payment.budget_item_id,
        payment.invoice_number,
        payment.invoice_date,
        payment.amount,
        payment.vat_amount,
        payment.total_amount,
        payment.status,
        payment.payment_date || null,
        payment.milestone_id || null,
        payment.notes || null,
      ]
    );

    if (!data) {
      throw new Error('Failed to create budget payment');
    }

    return transformBudgetPaymentFromDB(data);
  } catch (error) {
    console.error('Error creating budget payment:', error);
    // Fallback to localStorage
    const newPayment: BudgetPayment = {
      ...payment,
      id: `payment-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addBudgetPaymentLocal(newPayment);
    return newPayment;
  }
}

// ============================================================
// UPDATE BUDGET PAYMENT
// ============================================================

export async function updateBudgetPayment(
  id: string,
  updates: Partial<BudgetPayment>
): Promise<void> {
  if (isDemoMode) {
    updateBudgetPaymentLocal(id, updates);
    return;
  }

  try {
    // Build SET clause dynamically
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.budget_item_id !== undefined) {
      setClauses.push(`budget_item_id = $${paramIndex++}`);
      values.push(updates.budget_item_id);
    }
    if (updates.invoice_number !== undefined) {
      setClauses.push(`invoice_number = $${paramIndex++}`);
      values.push(updates.invoice_number);
    }
    if (updates.invoice_date !== undefined) {
      setClauses.push(`invoice_date = $${paramIndex++}`);
      values.push(updates.invoice_date);
    }
    if (updates.amount !== undefined) {
      setClauses.push(`amount = $${paramIndex++}`);
      values.push(updates.amount);
    }
    if (updates.vat_amount !== undefined) {
      setClauses.push(`vat_amount = $${paramIndex++}`);
      values.push(updates.vat_amount);
    }
    if (updates.total_amount !== undefined) {
      setClauses.push(`total_amount = $${paramIndex++}`);
      values.push(updates.total_amount);
    }
    if (updates.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.payment_date !== undefined) {
      setClauses.push(`payment_date = $${paramIndex++}`);
      values.push(updates.payment_date);
    }
    if (updates.milestone_id !== undefined) {
      setClauses.push(`milestone_id = $${paramIndex++}`);
      values.push(updates.milestone_id);
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

    // Add payment ID as final parameter
    values.push(id);

    const query = `UPDATE budget_payments SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`;

    await executeQuery(query, values);
  } catch (error) {
    console.error('Error updating budget payment:', error);
    // Fallback to localStorage
    updateBudgetPaymentLocal(id, updates);
  }
}

// ============================================================
// DELETE BUDGET PAYMENT
// ============================================================

export async function deleteBudgetPayment(id: string): Promise<void> {
  if (isDemoMode) {
    deleteBudgetPaymentLocal(id);
    return;
  }

  try {
    await executeQuery(`DELETE FROM budget_payments WHERE id = $1`, [id]);
  } catch (error) {
    console.error('Error deleting budget payment:', error);
    // Fallback to localStorage
    deleteBudgetPaymentLocal(id);
  }
}

// ============================================================
// DELETE PAYMENTS BY BUDGET ITEM (CASCADE)
// ============================================================

export async function deletePaymentsByBudgetItem(budgetItemId: string): Promise<void> {
  if (isDemoMode) {
    deletePaymentsByBudgetItemLocal(budgetItemId);
    return;
  }

  try {
    await executeQuery(
      `DELETE FROM budget_payments WHERE budget_item_id = $1`,
      [budgetItemId]
    );
  } catch (error) {
    console.error('Error deleting payments by budget item:', error);
    // Fallback to localStorage
    deletePaymentsByBudgetItemLocal(budgetItemId);
  }
}

// ============================================================
// HELPER: TRANSFORM DB TO APP FORMAT
// ============================================================

function transformBudgetPaymentFromDB(dbPayment: any): BudgetPayment {
  return {
    id: dbPayment.id,
    budget_item_id: dbPayment.budget_item_id,
    invoice_number: dbPayment.invoice_number,
    invoice_date: dbPayment.invoice_date,
    amount: dbPayment.amount,
    vat_amount: dbPayment.vat_amount,
    total_amount: dbPayment.total_amount,
    status: dbPayment.status,
    payment_date: dbPayment.payment_date || undefined,
    milestone_id: dbPayment.milestone_id || undefined,
    notes: dbPayment.notes || undefined,
    created_at: dbPayment.created_at,
    updated_at: dbPayment.updated_at,
  };
}

// ============================================================
// SYNC: SAVE TO LOCALSTORAGE (FOR BACKWARD COMPATIBILITY)
// ============================================================

export async function syncBudgetPaymentsToLocalStorage(): Promise<void> {
  const payments = await getAllBudgetPayments();
  saveBudgetPayments(payments);
}

// Re-export helper function
export { calculatePaymentTotals };
