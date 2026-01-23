import { memo, useEffect, useState } from 'react';
import type { KPI } from '../../types';

interface KPICardsProps {
  kpis: KPI[];
}

const colorClasses = {
  green: 'border-green-500 bg-green-50 dark:bg-green-900/20',
  red: 'border-red-500 bg-red-50 dark:bg-red-900/20',
  orange: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20',
  blue: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
};

const iconColors = {
  green: 'text-green-600 dark:text-green-400',
  red: 'text-red-600 dark:text-red-400',
  orange: 'text-orange-600 dark:text-orange-400',
  blue: 'text-blue-600 dark:text-blue-400',
};

const hoverColors = {
  green: 'hover:border-green-600 hover:shadow-green-200/50 dark:hover:shadow-green-900/30',
  red: 'hover:border-red-600 hover:shadow-red-200/50 dark:hover:shadow-red-900/30',
  orange: 'hover:border-orange-600 hover:shadow-orange-200/50 dark:hover:shadow-orange-900/30',
  blue: 'hover:border-blue-600 hover:shadow-blue-200/50 dark:hover:shadow-blue-900/30',
};

const KPICards = memo(function KPICards({ kpis }: KPICardsProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi, index) => (
        <div
          key={kpi.id}
          className={`rounded-xl border-2 p-4 ${colorClasses[kpi.color]} ${hoverColors[kpi.color]} 
            transition-all duration-300 ease-smooth hover:shadow-lg hover:-translate-y-1 cursor-pointer
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ 
            transitionDelay: `${index * 75}ms`,
          }}
        >
          <div className="flex items-start justify-between mb-2">
            <div className={`size-10 rounded-full flex items-center justify-center ${colorClasses[kpi.color]} transition-transform duration-300 group-hover:scale-110`}>
              <span className={`material-symbols-outlined ${iconColors[kpi.color]} transition-transform duration-300 hover:scale-110`}>
                {kpi.icon}
              </span>
            </div>
            {kpi.badge && (
              <span className="text-xs font-bold bg-green-500 text-white px-2 py-0.5 rounded-full animate-pulse-soft shadow-sm">
                {kpi.badge}
              </span>
            )}
          </div>
          <div className="mb-1">
            <p className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
              {kpi.label}
            </p>
            <p className="text-2xl font-black tabular-nums">{kpi.value}</p>
          </div>
          {kpi.subtitle && (
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
              {kpi.subtitle}
            </p>
          )}
        </div>
      ))}
    </div>
  );
});

export default KPICards;
