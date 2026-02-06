import type { ScheduleItem, PaymentSchedule, ProjectMilestone } from '../../types';
import ScheduleItemStatusBadge from './ScheduleItemStatusBadge';

interface PaymentScheduleViewProps {
  schedule: PaymentSchedule;
  items: ScheduleItem[];
  milestones: ProjectMilestone[];
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  return new Intl.DateTimeFormat('he-IL', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(dateStr));
};

function getRowBorderColor(item: ScheduleItem, milestones: ProjectMilestone[]): string {
  if (item.status === 'paid') return 'border-r-gray-400 bg-gray-50/50 dark:bg-gray-900/30';
  if (item.status === 'milestone_confirmed' || item.status === 'approved') return 'border-r-blue-500';
  if (!item.milestone_id) return 'border-r-red-400';

  // Check date mismatch
  if (item.milestone_id && item.target_date) {
    const milestone = milestones.find((m) => m.id === item.milestone_id);
    if (milestone && milestone.date !== item.target_date) return 'border-r-amber-400';
  }

  return 'border-r-emerald-500';
}

export default function PaymentScheduleView({ schedule, items, milestones }: PaymentScheduleViewProps) {
  const paidItems = items.filter((i) => i.status === 'paid');
  const totalPaid = paidItems.reduce((s, i) => s + (i.paid_amount || i.amount), 0);
  const progressPct = schedule.total_amount > 0 ? (totalPaid / schedule.total_amount) * 100 : 0;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary">calendar_month</span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            לוח תשלומים
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            schedule.status === 'active'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            {schedule.status === 'active' ? 'פעיל' : 'טיוטה'}
          </span>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {paidItems.length}/{items.length} תשלומים שולמו
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>{formatCurrency(totalPaid)} שולם</span>
          <span>{formatCurrency(schedule.total_amount)} סה"כ</span>
        </div>
        <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-l from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, progressPct)}%` }}
          />
        </div>
      </div>

      {/* Items Table */}
      {items.length > 0 && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-slate-400">#</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-slate-400">תיאור</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-slate-400">סכום</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-slate-400">%</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-slate-400">אבן דרך</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-slate-400">תאריך יעד</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-slate-400">סטטוס</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item) => (
                <tr
                  key={item.id}
                  className={`border-r-4 ${getRowBorderColor(item, milestones)} transition-colors`}
                >
                  <td className="px-3 py-2 text-slate-500 font-mono">{item.order}</td>
                  <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">{item.description}</td>
                  <td className="px-3 py-2 font-bold tabular-nums text-slate-900 dark:text-slate-100">
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="px-3 py-2 text-slate-500 tabular-nums">{item.percentage.toFixed(1)}%</td>
                  <td className="px-3 py-2">
                    {item.milestone_name ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">flag</span>
                        {item.milestone_name}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">ידני</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{formatDate(item.target_date)}</td>
                  <td className="px-3 py-2">
                    <ScheduleItemStatusBadge status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-slate-500 dark:text-slate-500">
        <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-emerald-500" /> מקושר לאבן דרך</span>
        <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-red-400" /> ללא אבן דרך</span>
        <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-amber-400" /> פער בתאריך</span>
        <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-blue-500" /> אושר, ממתין לתשלום</span>
        <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-gray-400" /> שולם</span>
      </div>
    </div>
  );
}
