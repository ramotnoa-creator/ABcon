/**
 * Shared formatting utilities
 */

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('he-IL');
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}
