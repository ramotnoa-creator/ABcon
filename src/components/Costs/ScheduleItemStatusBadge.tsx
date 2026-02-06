import type { ScheduleItemStatus } from '../../types';

const statusConfig: Record<ScheduleItemStatus, { label: string; classes: string }> = {
  pending: {
    label: 'ממתין',
    classes: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
  milestone_confirmed: {
    label: 'אבן דרך אושרה',
    classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  },
  invoice_received: {
    label: 'חשבונית התקבלה',
    classes: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  },
  approved: {
    label: 'מאושר לתשלום',
    classes: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  },
  paid: {
    label: 'שולם',
    classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  },
};

interface ScheduleItemStatusBadgeProps {
  status: ScheduleItemStatus;
}

export default function ScheduleItemStatusBadge({ status }: ScheduleItemStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={`px-2 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${config.classes}`}>
      {config.label}
    </span>
  );
}
