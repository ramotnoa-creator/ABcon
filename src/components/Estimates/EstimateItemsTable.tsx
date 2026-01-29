import { useState, useMemo } from 'react';
import type { EstimateItem } from '../../types';

interface EstimateItemsTableProps {
  items: EstimateItem[];
  onEdit: (item: EstimateItem) => void;
  onDelete: (itemId: string) => void;
}

type SortField = 'code' | 'description' | 'quantity' | 'unit_price' | 'total_price' | 'total_with_vat';
type SortDirection = 'asc' | 'desc';

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const categoryLabels: Record<string, string> = {
  consultants: 'יועצים',
  suppliers: 'ספקים',
  contractors: 'קבלנים',
};

export default function EstimateItemsTable({ items, onEdit, onDelete }: EstimateItemsTableProps) {
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Sorting logic
  const sortedItems = useMemo(() => {
    const sorted = [...items];
    sorted.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      // Handle null/undefined
      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      // String comparison
      if (typeof aVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      // Number comparison
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return sorted;
  }, [items, sortField, sortDirection]);

  // Calculate summary totals
  const summary = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const totalVAT = items.reduce((sum, item) => sum + item.vat_amount, 0);
    const totalWithVAT = items.reduce((sum, item) => sum + item.total_with_vat, 0);

    return { subtotal, totalVAT, totalWithVAT };
  }, [items]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <span className="material-symbols-outlined text-[16px] opacity-30">unfold_more</span>;
    }
    return (
      <span className="material-symbols-outlined text-[16px]">
        {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
      </span>
    );
  };

  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark p-12 text-center">
        <span className="material-symbols-outlined text-[48px] text-text-secondary-light dark:text-text-secondary-dark mb-2">
          receipt_long
        </span>
        <p className="text-text-secondary-light dark:text-text-secondary-dark">
          אין פריטים באומדן זה. לחץ על "הוסף פריט" כדי להתחיל.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th
                onClick={() => handleSort('description')}
                className="px-4 py-3 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex items-center gap-1">
                  תיאור {getSortIcon('description')}
                </div>
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                קטגוריה
              </th>
              <th
                onClick={() => handleSort('quantity')}
                className="px-4 py-3 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex items-center gap-1">
                  כמות {getSortIcon('quantity')}
                </div>
              </th>
              <th
                onClick={() => handleSort('unit_price')}
                className="px-4 py-3 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex items-center gap-1">
                  מחיר יחידה {getSortIcon('unit_price')}
                </div>
              </th>
              <th
                onClick={() => handleSort('total_price')}
                className="px-4 py-3 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex items-center gap-1">
                  סה"כ {getSortIcon('total_price')}
                </div>
              </th>
              <th
                onClick={() => handleSort('total_with_vat')}
                className="px-4 py-3 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex items-center gap-1">
                  סה"כ כולל מע"מ {getSortIcon('total_with_vat')}
                </div>
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                פעולות
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light dark:divide-border-dark">
            {sortedItems.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                onClick={() => onEdit(item)}
              >
                <td className="px-4 py-3 text-sm font-mono text-text-secondary-light dark:text-text-secondary-dark">
                  {item.code}
                </td>
                <td className="px-4 py-3 text-sm font-semibold max-w-xs break-words">
                  {item.description}
                </td>
                <td className="px-4 py-3 text-sm">
                  {item.category && (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700">
                      {categoryLabels[item.category] || item.category}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  {item.quantity} {item.unit}
                </td>
                <td className="px-4 py-3 text-sm font-semibold">
                  {formatCurrency(item.unit_price)}
                </td>
                <td className="px-4 py-3 text-sm font-semibold">
                  {formatCurrency(item.total_price)}
                </td>
                <td className="px-4 py-3 text-sm font-bold text-primary">
                  {formatCurrency(item.total_with_vat)}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onEdit(item)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      title="עריכה"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded transition-colors"
                      title="מחיקה"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {/* Summary Row */}
            <tr className="bg-gray-100 dark:bg-gray-800 font-bold">
              <td colSpan={5} className="px-4 py-3 text-sm text-left">
                סה"כ ({items.length} פריטים)
              </td>
              <td className="px-4 py-3 text-sm">
                {formatCurrency(summary.subtotal)}
              </td>
              <td className="px-4 py-3 text-sm text-primary">
                {formatCurrency(summary.totalWithVAT)}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
