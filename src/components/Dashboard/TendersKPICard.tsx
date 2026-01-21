import { Link } from 'react-router-dom';
import type { TenderEndingSoon } from '../../data/dashboardData';

interface TendersKPICardProps {
  tenders: TenderEndingSoon[];
  emptyMessage?: string;
}

export default function TendersKPICard({ tenders, emptyMessage = 'אין מכרזים שמסתיימים בקרוב' }: TendersKPICardProps) {
  // Get urgency color based on days remaining
  const getUrgencyColor = (daysRemaining: number) => {
    if (daysRemaining <= 3) return 'text-red-600 dark:text-red-400';
    if (daysRemaining <= 7) return 'text-orange-600 dark:text-orange-400';
    return 'text-amber-600 dark:text-amber-400';
  };

  const getUrgencyBg = (daysRemaining: number) => {
    if (daysRemaining <= 3) return 'bg-red-100 dark:bg-red-900/30';
    if (daysRemaining <= 7) return 'bg-orange-100 dark:bg-orange-900/30';
    return 'bg-amber-100 dark:bg-amber-900/30';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark flex items-center gap-2">
        <span className="material-symbols-outlined text-orange-500 text-[20px]">gavel</span>
        <h3 className="text-sm font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
          מכרזים בסגירה קרובה (30 יום)
        </h3>
        <span className="ms-auto text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark">
          {tenders.length} מכרזים
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        {tenders.length === 0 ? (
          <div className="text-center py-6 text-text-secondary-light dark:text-text-secondary-dark text-sm">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-3">
            {tenders.map((tender) => (
              <Link
                key={tender.id}
                to={`/projects/${tender.project_id}?tab=tenders`}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-background-light dark:hover:bg-background-dark transition-colors group"
              >
                {/* Countdown badge */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex flex-col items-center justify-center ${getUrgencyBg(tender.days_remaining)}`}>
                  <span className={`text-lg font-black leading-none ${getUrgencyColor(tender.days_remaining)}`}>
                    {tender.days_remaining}
                  </span>
                  <span className={`text-[10px] font-medium ${getUrgencyColor(tender.days_remaining)}`}>
                    ימים
                  </span>
                </div>

                {/* Tender info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                    {tender.tender_name}
                  </h4>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">
                    {tender.project_name}
                  </p>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                    תאריך סיום: {formatDate(tender.due_date)}
                  </p>
                </div>

                {/* Arrow indicator */}
                <span className="material-symbols-outlined text-[16px] text-text-secondary-light dark:text-text-secondary-dark group-hover:text-primary transition-colors self-center">
                  arrow_back
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer link */}
      {tenders.length > 0 && (
        <div className="px-4 py-3 border-t border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark">
          <Link
            to="/tenders"
            className="text-sm font-bold text-primary hover:text-primary-hover transition-colors flex items-center gap-1"
          >
            צפה בכל המכרזים
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          </Link>
        </div>
      )}
    </div>
  );
}
