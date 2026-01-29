import { useMemo } from 'react';
import type { Estimate, EstimateItem } from '../../types';

interface EstimateSummaryCardProps {
  estimate: Estimate;
  items: EstimateItem[];
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('he-IL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const statusLabels: Record<string, string> = {
  active: 'פעיל',
  draft: 'טיוטה',
  approved: 'מאושר',
  archived: 'ארכיון',
};

export default function EstimateSummaryCard({ estimate, items }: EstimateSummaryCardProps) {
  const summary = useMemo(() => {
    const totalWithoutVAT = items.reduce((sum, item) => sum + item.total_price, 0);
    const totalVAT = items.reduce((sum, item) => sum + item.vat_amount, 0);
    const totalWithVAT = items.reduce((sum, item) => sum + item.total_with_vat, 0);

    return {
      totalWithoutVAT,
      totalVAT,
      totalWithVAT,
      itemCount: items.length,
    };
  }, [items]);

  const cards = [
    {
      label: 'סה"כ כולל מע"מ',
      value: formatCurrency(summary.totalWithVAT),
      icon: 'payments',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'מספר פריטים',
      value: summary.itemCount.toString(),
      icon: 'receipt_long',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'סטטוס',
      value: statusLabels[estimate.status] || estimate.status,
      icon: 'check_circle',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'עדכון אחרון',
      value: formatDate(estimate.updated_at),
      icon: 'schedule',
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-800',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-2">
            <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              {card.label}
            </span>
            <div className={`${card.bgColor} p-2 rounded-lg`}>
              <span className={`material-symbols-outlined text-[20px] ${card.color}`}>
                {card.icon}
              </span>
            </div>
          </div>
          <div className={`text-2xl font-bold ${index === 0 ? card.color : ''}`}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}
