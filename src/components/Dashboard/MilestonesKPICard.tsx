import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MilestoneWithProject } from '../../data/milestonesQueries';
import { formatDateForDisplay } from '../../utils/dateUtils';

interface MilestonesKPICardProps {
  title: string;
  icon: string;
  color: 'green' | 'blue' | 'orange' | 'purple';
  milestones: MilestoneWithProject[];
  emptyMessage: string;
}

const colorClasses = {
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
    badge: 'bg-green-500',
    hoverBg: 'hover:bg-green-100 dark:hover:bg-green-900/30',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-500',
    hoverBg: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    icon: 'text-orange-600 dark:text-orange-400',
    badge: 'bg-orange-500',
    hoverBg: 'hover:bg-orange-100 dark:hover:bg-orange-900/30',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    icon: 'text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-500',
    hoverBg: 'hover:bg-purple-100 dark:hover:bg-purple-900/30',
  },
};

export default function MilestonesKPICard({
  title,
  icon,
  color,
  milestones,
  emptyMessage,
}: MilestonesKPICardProps) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const colors = colorClasses[color];

  // Group milestones by project
  const groupedByProject = useMemo(() => {
    const map = new Map<string, MilestoneWithProject[]>();
    milestones.forEach((item) => {
      const list = map.get(item.project.id) || [];
      list.push(item);
      map.set(item.project.id, list);
    });
    return Array.from(map.entries());
  }, [milestones]);

  // Get preview text for tooltip
  const previewText = useMemo(() => {
    if (milestones.length === 0) return emptyMessage;
    const preview = milestones.slice(0, 2).map((m) => m.milestone.name);
    if (milestones.length > 2) {
      preview.push(`+${milestones.length - 2} נוספים`);
    }
    return preview.join(', ');
  }, [milestones, emptyMessage]);

  return (
    <>
      <div
        className={`rounded-xl border-2 p-4 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${colors.bg} ${colors.border} ${colors.hoverBg}`}
        onClick={() => setShowModal(true)}
        title={previewText}
      >
        <div className="flex items-start justify-between mb-2">
          <div className={`size-10 rounded-full flex items-center justify-center ${colors.bg}`}>
            <span className={`material-symbols-outlined ${colors.icon}`}>{icon}</span>
          </div>
          <span className={`text-xs font-bold text-white px-2 py-0.5 rounded-full ${colors.badge}`}>
            {milestones.length}
          </span>
        </div>
        <p className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
          {title}
        </p>
        <p className="text-2xl font-black tabular-nums">{milestones.length}</p>

        {/* Hover preview */}
        {milestones.length > 0 && (
          <p className="mt-2 text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">
            {milestones.slice(0, 2).map((m) => m.milestone.name).join(', ')}
            {milestones.length > 2 && ` +${milestones.length - 2}`}
          </p>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
              <div className="flex items-center gap-3">
                <div className={`size-8 rounded-full flex items-center justify-center ${colors.bg}`}>
                  <span className={`material-symbols-outlined text-[18px] ${colors.icon}`}>{icon}</span>
                </div>
                <h3 className="text-lg font-bold">{title}</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="size-8 flex items-center justify-center hover:bg-background-light dark:hover:bg-background-dark rounded transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {milestones.length === 0 ? (
                <p className="text-center text-text-secondary-light dark:text-text-secondary-dark py-8">
                  {emptyMessage}
                </p>
              ) : (
                <div className="space-y-4">
                  {groupedByProject.map(([projectId, items]) => (
                    <div key={projectId}>
                      <button
                        onClick={() => {
                          setShowModal(false);
                          navigate(`/projects/${projectId}?tab=tasks-milestones`);
                        }}
                        className="text-sm font-bold text-primary hover:underline mb-2 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">folder</span>
                        {items[0].project.project_name}
                      </button>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div
                            key={item.milestone.id}
                            className="flex items-center justify-between p-3 bg-background-light dark:bg-background-dark rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.milestone.name}</p>
                              {item.milestone.phase && (
                                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                  {item.milestone.phase}
                                </p>
                              )}
                            </div>
                            <div className="text-left">
                              <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                {formatDateForDisplay(item.milestone.date)}
                              </span>
                              <span
                                className={`block text-xs font-bold mt-0.5 ${
                                  item.milestone.status === 'completed'
                                    ? 'text-green-600'
                                    : item.milestone.status === 'in-progress'
                                    ? 'text-blue-600'
                                    : 'text-orange-600'
                                }`}
                              >
                                {item.milestone.status === 'completed'
                                  ? 'הושלם'
                                  : item.milestone.status === 'in-progress'
                                  ? 'בביצוע'
                                  : 'ממתין'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
