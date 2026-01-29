import { useState, useEffect } from 'react';
import { getAllBudgetPayments } from '../../../../services/budgetPaymentsService';
import { getBudgetItems } from '../../../../services/budgetItemsService';
import type { BudgetPayment, BudgetItem } from '../../../../types';

interface PaymentsSubTabProps {
  projectId: string;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('he-IL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const statusLabels: Record<string, string> = {
  pending: 'ממתין',
  approved: 'מאושר',
  paid: 'שולם',
};

const statusColors: Record<string, string> = {
  pending: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
};

export default function PaymentsSubTab({ projectId }: PaymentsSubTabProps) {
  const [payments, setPayments] = useState<BudgetPayment[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Load budget items for this project
        const items = await getBudgetItems(projectId);
        setBudgetItems(items);

        // Load all payments and filter by project items
        const allPayments = await getAllBudgetPayments();
        const itemIds = items.map(i => i.id);
        const projectPayments = allPayments.filter(p => itemIds.includes(p.budget_item_id));

        // Sort by date descending
        projectPayments.sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime());

        setPayments(projectPayments);
      } catch (error) {
        console.error('Error loading payments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [projectId]);

  const getBudgetItemDescription = (budgetItemId: string): string => {
    const item = budgetItems.find(i => i.id === budgetItemId);
    return item?.description || 'פריט לא נמצא';
  };

  const filteredPayments = filterStatus === 'all'
    ? payments
    : payments.filter(p => p.status === filterStatus);

  const summary = {
    total: payments.reduce((sum, p) => sum + p.total_amount, 0),
    paid: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.total_amount, 0),
    pending: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.total_amount, 0),
    approved: payments.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.total_amount, 0),
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 text-text-secondary-light dark:text-text-secondary-dark">
        <div className="size-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        <p>טוען תשלומים...</p>
      </div>
    );
  }

  return (
    <div className="payments-subtab">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-4">
          <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">סה"כ תשלומים</div>
          <div className="text-2xl font-bold">{formatCurrency(summary.total)}</div>
          <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
            {payments.length} תשלומים
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="text-sm text-green-700 dark:text-green-300 mb-1">שולם</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(summary.paid)}</div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
            {payments.filter(p => p.status === 'paid').length} תשלומים
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">מאושר</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(summary.approved)}</div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            {payments.filter(p => p.status === 'approved').length} תשלומים
          </div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="text-sm text-orange-700 dark:text-orange-300 mb-1">ממתין</div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(summary.pending)}</div>
          <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
            {payments.filter(p => p.status === 'pending').length} תשלומים
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
            filterStatus === 'all'
              ? 'bg-primary text-white'
              : 'bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark'
          }`}
        >
          הכל ({payments.length})
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
            filterStatus === 'pending'
              ? 'bg-orange-600 text-white'
              : 'bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark'
          }`}
        >
          ממתין ({payments.filter(p => p.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilterStatus('approved')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
            filterStatus === 'approved'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark'
          }`}
        >
          מאושר ({payments.filter(p => p.status === 'approved').length})
        </button>
        <button
          onClick={() => setFilterStatus('paid')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
            filterStatus === 'paid'
              ? 'bg-green-600 text-white'
              : 'bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark'
          }`}
        >
          שולם ({payments.filter(p => p.status === 'paid').length})
        </button>
      </div>

      {/* Payments List */}
      {filteredPayments.length === 0 ? (
        <div className="bg-white dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark p-12 text-center">
          <span className="material-symbols-outlined text-[48px] text-text-secondary-light dark:text-text-secondary-dark mb-2">
            payments
          </span>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            {filterStatus === 'all' ? 'אין תשלומים עדיין' : `אין תשלומים בסטטוס ${statusLabels[filterStatus]}`}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                    מספר חשבונית
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                    פריט תקציב
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                    תאריך חשבונית
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                    סכום
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                    סטטוס
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                    תאריך תשלום
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold">
                      {payment.invoice_number}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getBudgetItemDescription(payment.budget_item_id)}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {formatDate(payment.invoice_date)}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold">
                      {formatCurrency(payment.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[payment.status]}`}>
                        {statusLabels[payment.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {payment.payment_date ? formatDate(payment.payment_date) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Note about payment creation */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[20px]">
            info
          </span>
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              ניהול תשלומים
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              תשלומים מקושרים לפריטי תקציב. ליצירת תשלום חדש, עבור לתת-טאב "תקציב" ובחר פריט תקציב.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
