import { useMemo } from 'react';

interface VarianceCellProps {
  estimateAmount?: number | null;
  varianceAmount?: number | null;
  variancePercent?: number | null;
  showPercent?: boolean;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatVariance = (variance: number): string => {
  const sign = variance >= 0 ? '+' : '';
  return `${sign}${variance.toFixed(1)}%`;
};

export default function VarianceCell({
  estimateAmount,
  varianceAmount,
  variancePercent,
  showPercent = false,
}: VarianceCellProps) {
  // Calculate color based on variance and estimate presence
  const color = useMemo(() => {
    if (!estimateAmount || estimateAmount === 0) return 'gray';
    if ((varianceAmount || 0) < 0) return 'green'; // Saved money
    if ((varianceAmount || 0) > 0) return 'red'; // Over budget
    return 'gray'; // Exact match
  }, [estimateAmount, varianceAmount]);

  // Color classes for styling
  const colorClasses = useMemo(() => {
    const classes = {
      green: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded font-bold',
      red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded font-bold',
      gray: 'text-gray-400 dark:text-gray-500',
    };
    return classes[color];
  }, [color]);

  // Determine display value
  const displayValue = useMemo(() => {
    if (!estimateAmount || estimateAmount === 0) return '-';

    if (showPercent) {
      return formatVariance(variancePercent || 0);
    }

    return formatCurrency(varianceAmount || 0);
  }, [estimateAmount, varianceAmount, variancePercent, showPercent]);

  // Accessibility label
  const ariaLabel = useMemo(() => {
    if (!estimateAmount || estimateAmount === 0) {
      return 'אין אומדן';
    }

    const direction = (varianceAmount || 0) < 0
      ? 'חיסכון'
      : (varianceAmount || 0) > 0
        ? 'חריגה'
        : 'התאמה מלאה';

    return `${direction}: ${displayValue}`;
  }, [estimateAmount, varianceAmount, displayValue]);

  return (
    <span className={colorClasses} aria-label={ariaLabel}>
      {displayValue}
    </span>
  );
}
