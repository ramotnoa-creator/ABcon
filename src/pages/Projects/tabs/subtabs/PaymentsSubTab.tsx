import { useState, useEffect, useMemo } from 'react';
import { getAllBudgetPayments } from '../../../../services/budgetPaymentsService';
import { getBudgetItems } from '../../../../services/budgetItemsService';
import { getScheduleItemsByProject, updateScheduleItem } from '../../../../services/paymentSchedulesService';
import { getCostItems } from '../../../../services/costsService';
import ScheduleItemStatusBadge from '../../../../components/Costs/ScheduleItemStatusBadge';
import type { BudgetPayment, BudgetItem, ScheduleItem, CostItem, ScheduleItemStatus } from '../../../../types';

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

type ScheduleFilterStatus = 'all' | ScheduleItemStatus;

const scheduleFilterOptions: { value: ScheduleFilterStatus; label: string; activeClass: string }[] = [
  { value: 'all', label: 'הכל', activeClass: 'bg-primary text-white' },
  { value: 'pending', label: 'ממתין', activeClass: 'bg-orange-600 text-white' },
  { value: 'milestone_confirmed', label: 'אבן דרך אושרה', activeClass: 'bg-teal-600 text-white' },
  { value: 'approved', label: 'מאושר', activeClass: 'bg-purple-600 text-white' },
  { value: 'paid', label: 'שולם', activeClass: 'bg-green-600 text-white' },
];

function getDateUrgency(targetDate?: string): { className: string; icon: string; label: string } {
  if (!targetDate) return { className: '', icon: '', label: '' };
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const diffDays = (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return { className: 'text-red-600 dark:text-red-400 font-bold', icon: 'warning', label: 'באיחור' };
  if (diffDays <= 7) return { className: 'text-amber-600 dark:text-amber-400 font-semibold', icon: 'schedule', label: 'קרוב' };
  return { className: '', icon: '', label: '' };
}

export default function PaymentsSubTab({ projectId }: PaymentsSubTabProps) {
  const [payments, setPayments] = useState<BudgetPayment[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Schedule payments state
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [costItems, setCostItems] = useState<CostItem[]>([]);
  const [scheduleFilterStatus, setScheduleFilterStatus] = useState<ScheduleFilterStatus>('all');
  const [processingItemId, setProcessingItemId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        const [items, allPayments, sItems, cItems] = await Promise.all([
          getBudgetItems(projectId),
          getAllBudgetPayments(),
          getScheduleItemsByProject(projectId),
          getCostItems(projectId),
        ]);

        setBudgetItems(items);
        setScheduleItems(sItems);
        setCostItems(cItems);

        const itemIds = items.map(i => i.id);
        const projectPayments = allPayments.filter(p => itemIds.includes(p.budget_item_id));
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

  const handleApprove = async (itemId: string) => {
    if (processingItemId) return;
    if (!confirm('לאשר תשלום זה?')) return;
    setProcessingItemId(itemId);
    try {
      await updateScheduleItem(itemId, {
        status: 'approved',
        approved_by: 'מנהל פרויקט',
        approved_at: new Date().toISOString(),
      });
      setScheduleItems(prev => prev.map(si =>
        si.id === itemId
          ? { ...si, status: 'approved', approved_by: 'מנהל פרויקט', approved_at: new Date().toISOString() }
          : si
      ));
    } catch (error) {
      console.error('Error approving payment:', error);
    } finally {
      setProcessingItemId(null);
    }
  };

  const handleMarkPaid = async (itemId: string) => {
    if (processingItemId) return;
    const item = scheduleItems.find(si => si.id === itemId);
    if (!item) return;
    if (!confirm(`לסמן כשולם? (${formatCurrency(item.amount)})`)) return;
    setProcessingItemId(itemId);
    try {
      await updateScheduleItem(itemId, {
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0],
        paid_amount: item.amount,
      });
      setScheduleItems(prev => prev.map(si =>
        si.id === itemId
          ? { ...si, status: 'paid', paid_date: new Date().toISOString().split('T')[0], paid_amount: si.amount }
          : si
      ));
    } catch (error) {
      console.error('Error marking as paid:', error);
    } finally {
      setProcessingItemId(null);
    }
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

  // Schedule summary
  const scheduleSummary = useMemo(() => {
    const total = scheduleItems.reduce((s, i) => s + i.amount, 0);
    const paid = scheduleItems.filter(i => i.status === 'paid').reduce((s, i) => s + (i.paid_amount || i.amount), 0);
    const approvedConfirmed = scheduleItems
      .filter(i => i.status === 'approved' || i.status === 'milestone_confirmed')
      .reduce((s, i) => s + i.amount, 0);
    const pending = scheduleItems.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0);
    return { total, paid, approvedConfirmed, pending };
  }, [scheduleItems]);

  // Filtered schedule items
  const filteredScheduleItems = useMemo(() => {
    if (scheduleFilterStatus === 'all') return scheduleItems;
    return scheduleItems.filter(si => si.status === scheduleFilterStatus);
  }, [scheduleItems, scheduleFilterStatus]);

  // Group schedule items by cost item
  const groupedByCostItem = useMemo(() => {
    const groups = new Map<string, { costItem: CostItem | undefined; items: ScheduleItem[] }>();
    for (const si of filteredScheduleItems) {
      if (!groups.has(si.cost_item_id)) {
        groups.set(si.cost_item_id, {
          costItem: costItems.find(c => c.id === si.cost_item_id),
          items: [],
        });
      }
      groups.get(si.cost_item_id)!.items.push(si);
    }
    // Sort items within each group by order
    for (const group of groups.values()) {
      group.items.sort((a, b) => a.order - b.order);
    }
    return Array.from(groups.values());
  }, [filteredScheduleItems, costItems]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 text-text-secondary-light dark:text-text-secondary-dark">
        <div className="size-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        <p>טוען תשלומים...</p>
      </div>
    );
  }

  return (
    <div className="payments-subtab space-y-8">
      {/* Schedule Payments Section */}
      {scheduleItems.length === 0 && payments.length === 0 && (
        <div className="bg-white dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark p-12 text-center mb-8">
          <span className="material-symbols-outlined text-[48px] text-text-secondary-light dark:text-text-secondary-dark mb-3 block">
            payments
          </span>
          <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark mb-2">
            אין תשלומים עדיין
          </h3>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark max-w-md mx-auto">
            צור לוח תשלומים דרך טאב "עלויות" עבור פריטי עלות עם מכרז זוכה, או הוסף תשלומי תקציב דרך טאב "תקציב".
          </p>
        </div>
      )}

      {scheduleItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[20px] text-primary">calendar_month</span>
            <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark">
              תשלומי לוח תשלומים
            </h3>
            <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
              {scheduleItems.length}
            </span>
          </div>

          {/* Schedule Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-4">
              <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">סה"כ מתוכנן</div>
              <div className="text-2xl font-bold">{formatCurrency(scheduleSummary.total)}</div>
              <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                {scheduleItems.length} תשלומים
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="text-sm text-green-700 dark:text-green-300 mb-1">שולם</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(scheduleSummary.paid)}</div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                {scheduleItems.filter(i => i.status === 'paid').length} תשלומים
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="text-sm text-purple-700 dark:text-purple-300 mb-1">מאושר / אושר</div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(scheduleSummary.approvedConfirmed)}</div>
              <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                {scheduleItems.filter(i => i.status === 'approved' || i.status === 'milestone_confirmed').length} תשלומים
              </div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="text-sm text-orange-700 dark:text-orange-300 mb-1">ממתין</div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(scheduleSummary.pending)}</div>
              <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                {scheduleItems.filter(i => i.status === 'pending').length} תשלומים
              </div>
            </div>
          </div>

          {/* Schedule Filter Buttons */}
          <div className="flex gap-2 mb-6 flex-wrap" role="group" aria-label="סינון תשלומים לפי סטטוס">
            {scheduleFilterOptions.map(opt => {
              const count = opt.value === 'all'
                ? scheduleItems.length
                : scheduleItems.filter(si => si.status === opt.value).length;
              return (
                <button
                  key={opt.value}
                  onClick={() => setScheduleFilterStatus(opt.value)}
                  aria-pressed={scheduleFilterStatus === opt.value}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    scheduleFilterStatus === opt.value
                      ? opt.activeClass
                      : 'bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark'
                  }`}
                >
                  {opt.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Grouped by Cost Item */}
          {groupedByCostItem.length === 0 ? (
            <div className="bg-white dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark p-12 text-center">
              <span className="material-symbols-outlined text-[48px] text-text-secondary-light dark:text-text-secondary-dark mb-2">
                filter_list_off
              </span>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                אין תשלומים בסטטוס זה
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedByCostItem.map(({ costItem, items: groupItems }) => {
                const paidCount = groupItems.filter(i => i.status === 'paid').length;
                return (
                  <div key={costItem?.id || 'unknown'} className="bg-white dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
                    {/* Cost Item Header */}
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-border-light dark:border-border-dark flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-primary">receipt_long</span>
                        <span className="font-bold text-sm text-text-main-light dark:text-text-main-dark">
                          {costItem?.name || 'פריט לא נמצא'}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark bg-white dark:bg-surface-dark px-2 py-1 rounded-full border border-border-light dark:border-border-dark">
                        {paidCount}/{groupItems.length} שולם
                      </span>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                          <tr>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                              תיאור
                            </th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                              סכום
                            </th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                              תאריך יעד
                            </th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                              אבן דרך
                            </th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                              סטטוס
                            </th>
                            <th className="px-4 py-2.5 text-center text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                              פעולות
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light dark:divide-border-dark">
                          {groupItems.map((si) => (
                            <tr key={si.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                              <td className="px-4 py-3 text-sm font-semibold">{si.description}</td>
                              <td className="px-4 py-3 text-sm font-bold">{formatCurrency(si.amount)}</td>
                              {(() => {
                                const urgency = getDateUrgency(si.target_date);
                                return (
                                  <td className={`px-4 py-3 text-sm ${urgency.className}`}>
                                    {si.target_date ? (
                                      <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">{urgency.icon || 'event'}</span>
                                        {formatDate(si.target_date)}
                                        {urgency.label && (
                                          <span className="text-[10px]">({urgency.label})</span>
                                        )}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">-</span>
                                    )}
                                  </td>
                                );
                              })()}
                              <td className="px-4 py-3 text-sm">
                                {si.milestone_name ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">flag</span>
                                    {si.milestone_name}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <ScheduleItemStatusBadge status={si.status} />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  {/* Approve button - for milestone_confirmed, invoice_received, or pending manual-date items */}
                                  {(si.status === 'milestone_confirmed' || si.status === 'invoice_received' || (si.status === 'pending' && !si.milestone_id)) && (
                                    <button
                                      onClick={() => handleApprove(si.id)}
                                      disabled={processingItemId === si.id}
                                      className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                                    >
                                      <span className="material-symbols-outlined text-[14px]">{processingItemId === si.id ? 'hourglass_empty' : 'thumb_up'}</span>
                                      אשר תשלום
                                    </button>
                                  )}
                                  {/* Mark Paid button - for approved items */}
                                  {si.status === 'approved' && (
                                    <button
                                      onClick={() => handleMarkPaid(si.id)}
                                      disabled={processingItemId === si.id}
                                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                                    >
                                      <span className="material-symbols-outlined text-[14px]">{processingItemId === si.id ? 'hourglass_empty' : 'paid'}</span>
                                      סמן כשולם
                                    </button>
                                  )}
                                  {si.status === 'paid' && si.paid_date && (
                                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                                      שולם {formatDate(si.paid_date)}
                                    </span>
                                  )}
                                  {/* Pending milestone-linked items - no action, show info */}
                                  {si.status === 'pending' && si.milestone_id && (
                                    <span className="text-xs text-slate-400 italic">ממתין לאבן דרך</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Budget Payments Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[20px] text-text-secondary-light dark:text-text-secondary-dark">receipt_long</span>
          <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark">
            תשלומי תקציב
          </h3>
        </div>

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
        <div className="flex gap-2 mb-6 flex-wrap">
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

        {/* Budget Payments List */}
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
      </div>

      {/* Note about payment creation */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[20px]">
            info
          </span>
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              ניהול תשלומים
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              תשלומי לוח תשלומים מנוהלים דרך טאב "עלויות" - צור לוח תשלומים לפריט עלות עם מכרז זוכה.
              תשלומי תקציב מקושרים לפריטי תקציב ונוצרים מתת-טאב "תקציב".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
