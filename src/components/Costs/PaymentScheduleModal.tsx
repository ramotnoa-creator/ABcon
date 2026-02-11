import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { PaymentSchedule, ScheduleItem, CostItem, ProjectMilestone } from '../../types';
import {
  createSchedule,
  updateSchedule,
  createScheduleItemsBatch,
  deleteScheduleItemsBySchedule,
} from '../../services/paymentSchedulesService';

interface InstallmentRow {
  tempId: string;
  description: string;
  amount: string;
  percentage: string;
  milestoneId: string;
  milestoneName: string;
  targetDate: string;
  existingStatus?: string; // Preserve status from existing items on edit
}

interface PaymentScheduleModalProps {
  costItem: CostItem;
  projectId: string;
  milestones: ProjectMilestone[];
  existingSchedule?: PaymentSchedule | null;
  existingItems?: ScheduleItem[];
  onSave: () => void;
  onCancel: () => void;
}

function createEmptyRow(): InstallmentRow {
  return {
    tempId: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    description: '',
    amount: '',
    percentage: '',
    milestoneId: '',
    milestoneName: '',
    targetDate: '',
  };
}

export default function PaymentScheduleModal({
  costItem,
  projectId,
  milestones,
  existingSchedule,
  existingItems,
  onSave,
  onCancel,
}: PaymentScheduleModalProps) {
  const contractAmount = costItem.actual_amount || costItem.estimated_amount;

  const [rows, setRows] = useState<InstallmentRow[]>(() => {
    if (existingItems && existingItems.length > 0) {
      return existingItems.map((item) => ({
        tempId: item.id,
        description: item.description,
        amount: item.amount.toString(),
        percentage: item.percentage.toString(),
        milestoneId: item.milestone_id || '',
        milestoneName: item.milestone_name || '',
        targetDate: item.target_date || '',
        existingStatus: item.status,
      }));
    }
    return [createEmptyRow()];
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalRowAmount = rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const totalRowPercentage = rows.reduce((sum, r) => sum + (parseFloat(r.percentage) || 0), 0);
  const amountDiff = contractAmount - totalRowAmount;

  const addRow = () => {
    // Find the last row with a date and default new row to the day after
    const lastDate = [...rows].reverse().find(r => r.targetDate)?.targetDate;
    const newRow = createEmptyRow();
    if (lastDate) {
      const next = new Date(lastDate);
      next.setDate(next.getDate() + 1);
      newRow.targetDate = next.toISOString().split('T')[0];
    }
    setRows([...rows, newRow]);
  };

  const removeRow = (tempId: string) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((r) => r.tempId !== tempId));
  };

  const updateRow = (tempId: string, field: keyof InstallmentRow, value: string) => {
    setRows(rows.map((r) => {
      if (r.tempId !== tempId) return r;
      const updated = { ...r, [field]: value };

      // Sync amount <-> percentage
      if (field === 'amount' && contractAmount > 0) {
        const amt = parseFloat(value) || 0;
        updated.percentage = ((amt / contractAmount) * 100).toFixed(2);
      } else if (field === 'percentage' && contractAmount > 0) {
        const pct = parseFloat(value) || 0;
        updated.amount = Math.round((pct / 100) * contractAmount).toString();
      }

      // Sync milestone selection
      if (field === 'milestoneId') {
        const ms = milestones.find((m) => m.id === value);
        if (ms) {
          updated.milestoneName = ms.name;
          updated.targetDate = ms.date;
        } else {
          updated.milestoneName = '';
        }
      }

      return updated;
    }));

    // When a date changes, clear later rows' dates if they became earlier than the new date
    if (field === 'targetDate' || field === 'milestoneId') {
      setRows(prev => {
        const changedIdx = prev.findIndex(r => r.tempId === tempId);
        if (changedIdx < 0) return prev;
        const changedDate = prev[changedIdx].targetDate;
        if (!changedDate) return prev;
        let needsUpdate = false;
        const updated = prev.map((r, i) => {
          if (i > changedIdx && r.targetDate && r.targetDate < changedDate) {
            needsUpdate = true;
            return { ...r, targetDate: '' };
          }
          return r;
        });
        return needsUpdate ? updated : prev;
      });
    }
  };

  const distributeEvenly = () => {
    if (rows.length === 0 || contractAmount <= 0) return;
    const perRow = Math.floor(contractAmount / rows.length);
    const remainder = contractAmount - perRow * rows.length;

    setRows(rows.map((r, idx) => {
      const amt = idx === 0 ? perRow + remainder : perRow;
      return {
        ...r,
        amount: amt.toString(),
        percentage: ((amt / contractAmount) * 100).toFixed(2),
      };
    }));
  };

  const validate = (): string | null => {
    for (const row of rows) {
      if (!row.description.trim()) return 'כל שורה חייבת לכלול תיאור';
      if (!row.amount || parseFloat(row.amount) <= 0) return 'כל שורה חייבת לכלול סכום חיובי';
    }
    if (Math.abs(amountDiff) > 1) return `סה"כ התשלומים (${formatCurrency(totalRowAmount)}) חייב להיות שווה לסכום החוזה (${formatCurrency(contractAmount)})`;
    // Validate sequential dates
    let prevDate = '';
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].targetDate) {
        if (prevDate && rows[i].targetDate < prevDate) {
          return `תאריך תשלום #${i + 1} חייב להיות אחרי תשלום #${i}`;
        }
        prevDate = rows[i].targetDate;
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let scheduleId: string;

      if (existingSchedule) {
        scheduleId = existingSchedule.id;
        await updateSchedule(existingSchedule.id, { total_amount: contractAmount, status: 'active' });
        await deleteScheduleItemsBySchedule(existingSchedule.id);
      } else {
        const schedule = await createSchedule({
          cost_item_id: costItem.id,
          project_id: projectId,
          total_amount: contractAmount,
          status: 'active',
        });
        scheduleId = schedule.id;
      }

      const validStatuses = ['pending', 'milestone_confirmed', 'invoice_received', 'approved', 'paid'] as const;
      const itemsToCreate = rows.map((row, idx) => ({
        schedule_id: scheduleId,
        cost_item_id: costItem.id,
        project_id: projectId,
        description: row.description.trim(),
        amount: parseFloat(row.amount) || 0,
        percentage: parseFloat(row.percentage) || 0,
        milestone_id: row.milestoneId || undefined,
        milestone_name: row.milestoneName || undefined,
        target_date: row.targetDate || undefined,
        order: idx + 1,
        status: (row.existingStatus && validStatuses.includes(row.existingStatus as any)
          ? row.existingStatus
          : 'pending') as typeof validStatuses[number],
      }));

      await createScheduleItemsBatch(itemsToCreate);
      onSave();
    } catch (err) {
      console.error('Error saving payment schedule:', err);
      setError('שגיאה בשמירת לוח התשלומים');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-surface-dark border-b border-border-light dark:border-border-dark p-6 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-xl font-bold text-text-main-light dark:text-text-main-dark">
                {existingSchedule ? 'עריכת לוח תשלומים' : 'יצירת לוח תשלומים'}
              </h2>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
                {costItem.name} - סכום חוזה: {formatCurrency(contractAmount)}
              </p>
            </div>
            <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={addRow}
                  className="px-3 py-1.5 text-xs font-semibold bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  הוסף תשלום
                </button>
                <button
                  type="button"
                  onClick={distributeEvenly}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">equalizer</span>
                  חלק שווה
                </button>
              </div>
              <div className={`text-xs font-bold ${Math.abs(amountDiff) > 1 ? 'text-red-600' : 'text-emerald-600'}`}>
                {Math.abs(amountDiff) <= 1
                  ? 'סכום מאוזן'
                  : `פער: ${formatCurrency(amountDiff)}`}
              </div>
            </div>

            {/* Installment Rows */}
            <div className="space-y-3">
              {rows.map((row, idx) => (
                <div
                  key={row.tempId}
                  className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3 bg-white dark:bg-slate-900/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">תשלום #{idx + 1}</span>
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(row.tempId)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    {/* Description */}
                    <div className="md:col-span-4">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        תיאור <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={row.description}
                        onChange={(e) => updateRow(row.tempId, 'description', e.target.value)}
                        placeholder="לדוגמה: מקדמה, אבן דרך 1..."
                        className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-background-dark text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    {/* Amount */}
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        סכום (₪) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={row.amount}
                        onChange={(e) => updateRow(row.tempId, 'amount', e.target.value)}
                        placeholder="0"
                        min="0"
                        className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-background-dark text-sm font-bold focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    {/* Percentage */}
                    <div className="md:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">%</label>
                      <input
                        type="number"
                        value={row.percentage}
                        onChange={(e) => updateRow(row.tempId, 'percentage', e.target.value)}
                        placeholder="0"
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-background-dark text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    {/* Milestone */}
                    <div className="md:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">אבן דרך</label>
                      <select
                        value={row.milestoneId}
                        onChange={(e) => updateRow(row.tempId, 'milestoneId', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-background-dark text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="">ללא (ידני)</option>
                        {milestones.map((ms) => (
                          <option key={ms.id} value={ms.id}>
                            {ms.name} ({new Date(ms.date).toLocaleDateString('he-IL')})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Target Date */}
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">תאריך יעד</label>
                      <input
                        type="date"
                        value={row.targetDate}
                        onChange={(e) => updateRow(row.tempId, 'targetDate', e.target.value)}
                        min={idx > 0 ? rows.slice(0, idx).reverse().find(r => r.targetDate)?.targetDate || '' : ''}
                        className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-background-dark text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Bar */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">סכום חוזה</div>
                  <div className="text-sm font-black text-slate-900 dark:text-slate-100">{formatCurrency(contractAmount)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">סה"כ תשלומים</div>
                  <div className={`text-sm font-black ${Math.abs(amountDiff) > 1 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {formatCurrency(totalRowAmount)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">סה"כ %</div>
                  <div className={`text-sm font-black ${Math.abs(100 - totalRowPercentage) > 0.5 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {totalRowPercentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-background-dark border-t border-border-light dark:border-border-dark p-6 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 rounded-lg border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-surface-dark transition-colors text-sm font-medium"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  שמור לוח תשלומים
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
