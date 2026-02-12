import { memo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Alert } from '../../types';

interface AlertsSectionProps {
  alerts: Alert[];
}

const alertTypeColors = {
  budget: 'border-r-4 border-r-red-500 hover:border-r-red-600',
  delay: 'border-r-4 border-r-orange-500 hover:border-r-orange-600',
  contract: 'border-r-4 border-r-gray-500 hover:border-r-gray-600',
  other: 'border-r-4 border-r-gray-500 hover:border-r-gray-600',
};

const alertTypeIcons = {
  budget: 'payments',
  delay: 'schedule',
  contract: 'description',
  other: 'info',
};

const AlertsSection = memo(function AlertsSection({ alerts }: AlertsSectionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6 transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-red-500 animate-pulse-soft">notifications</span>
          <h3 className="text-lg font-bold">התראות וחריגות</h3>
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse-soft">
            {alerts.length}
          </span>
        </div>
        <Link
          to="#"
          className="text-sm text-primary hover:text-primary-hover transition-all duration-200 hover:translate-x-1 inline-flex items-center gap-1"
        >
          לכל ההתראות
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
        </Link>
      </div>
      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <div
            key={alert.id}
            role="button"
            tabIndex={0}
            className={`bg-background-light dark:bg-background-dark rounded-lg p-4 ${alertTypeColors[alert.type]}
              transition-all duration-300 hover:shadow-md hover:-translate-x-1 cursor-pointer group
              ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
            style={{ transitionDelay: `${300 + index * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-text-secondary-light dark:text-text-secondary-dark group-hover:scale-110 transition-transform duration-200">
                  {alertTypeIcons[alert.type]}
                </span>
                <h4 className="font-bold text-sm">{alert.title}</h4>
              </div>
              <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark whitespace-nowrap me-2">
                {alert.timestamp}
              </span>
            </div>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-2 ps-6">
              {alert.description}
            </p>
            {alert.projectId && (
              <Link
                to={`/projects/${alert.projectId}`}
                className="text-xs text-primary hover:text-primary-hover transition-all duration-200 inline-flex items-center gap-1 ps-6 group/link"
              >
                <span>לצפייה בפרויקט</span>
                <span className="material-symbols-outlined text-[16px] transition-transform duration-200 group-hover/link:-translate-x-1">
                  arrow_back
                </span>
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

export default AlertsSection;
