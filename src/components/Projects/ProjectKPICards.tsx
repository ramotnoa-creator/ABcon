import { useState, useMemo } from 'react';
import { getLastMonthCompletedMilestones, getNextMonthPendingMilestones } from '../../data/milestonesQueries';
import { getLastMonthPaidAmount, getNextMonthPlannedPayments } from '../../data/budgetPaymentsQueries';
import { formatDateForDisplay } from '../../utils/dateUtils';
import type { MilestoneWithProject } from '../../data/milestonesQueries';
import type { PaymentWithDetails } from '../../data/budgetPaymentsQueries';

interface ProjectKPICardsProps {
  projectId: string;
  onTabChange?: (tabId: string) => void;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

interface CardData {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: 'green' | 'orange' | 'blue' | 'purple';
  milestoneData?: MilestoneWithProject[];
  paymentData?: PaymentWithDetails[];
  targetTab: string;
}

const colorClasses = {
  green: 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  orange: 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
  blue: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  purple: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
};

export default function ProjectKPICards({ projectId, onTabChange }: ProjectKPICardsProps) {
  const [showModal, setShowModal] = useState<string | null>(null);

  // Get data for current project
  const lastMonthMilestones = useMemo(() => getLastMonthCompletedMilestones(projectId), [projectId]);
  const nextMonthMilestones = useMemo(() => getNextMonthPendingMilestones(projectId), [projectId]);
  const lastMonthPaid = useMemo(() => getLastMonthPaidAmount(projectId), [projectId]);
  const nextMonthPlanned = useMemo(() => getNextMonthPlannedPayments(projectId), [projectId]);

  const cards: CardData[] = [
    {
      id: 'milestones-past',
      title: 'אבני דרך - חודש אחרון',
      value: lastMonthMilestones.length.toString(),
      subtitle:
        lastMonthMilestones.length > 0
          ? lastMonthMilestones
              .slice(0, 2)
              .map((m) => m.milestone.name)
              .join(', ')
          : 'אין אבני דרך שהושלמו',
      icon: 'check_circle',
      color: 'green',
      milestoneData: lastMonthMilestones,
      targetTab: 'tasks-milestones',
    },
    {
      id: 'milestones-future',
      title: 'אבני דרך - חודש הבא',
      value: nextMonthMilestones.length.toString(),
      subtitle:
        nextMonthMilestones.length > 0
          ? nextMonthMilestones
              .slice(0, 2)
              .map((m) => m.milestone.name)
              .join(', ')
          : 'אין אבני דרך מתוכננות',
      icon: 'schedule',
      color: 'orange',
      milestoneData: nextMonthMilestones,
      targetTab: 'tasks-milestones',
    },
    {
      id: 'budget-past',
      title: 'שולם - חודש אחרון',
      value: formatCurrency(lastMonthPaid.totalAmount),
      subtitle: `${lastMonthPaid.paymentCount} תשלומים`,
      icon: 'payments',
      color: 'blue',
      paymentData: lastMonthPaid.payments,
      targetTab: 'budget',
    },
    {
      id: 'budget-future',
      title: 'מתוכנן - חודש הבא',
      value: formatCurrency(nextMonthPlanned.totalAmount),
      subtitle: `${nextMonthPlanned.paymentCount} תשלומים`,
      icon: 'event',
      color: 'purple',
      paymentData: nextMonthPlanned.payments,
      targetTab: 'budget',
    },
  ];

  const activeCard = cards.find((c) => c.id === showModal);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${colorClasses[card.color]}`}
            onClick={() => setShowModal(card.id)}
            title={card.subtitle}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[18px]">{card.icon}</span>
              <span className="text-xs font-medium">{card.title}</span>
            </div>
            <p className="text-2xl font-black">{card.value}</p>
            <p className="text-xs mt-1 truncate opacity-70">{card.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {showModal && activeCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(null);
          }}
        >
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
              <div className="flex items-center gap-2">
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    activeCard.color === 'green'
                      ? 'text-green-600'
                      : activeCard.color === 'orange'
                      ? 'text-orange-600'
                      : activeCard.color === 'blue'
                      ? 'text-blue-600'
                      : 'text-purple-600'
                  }`}
                >
                  {activeCard.icon}
                </span>
                <h3 className="font-bold">{activeCard.title}</h3>
              </div>
              <button
                onClick={() => setShowModal(null)}
                className="size-8 flex items-center justify-center hover:bg-background-light dark:hover:bg-background-dark rounded transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {/* Milestones content */}
              {activeCard.milestoneData !== undefined && (
                <>
                  {activeCard.milestoneData.length === 0 ? (
                    <p className="text-center text-text-secondary-light dark:text-text-secondary-dark py-4">
                      {activeCard.subtitle}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {activeCard.milestoneData.map((item) => (
                        <div
                          key={item.milestone.id}
                          className="flex justify-between p-3 bg-background-light dark:bg-background-dark rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-sm">{item.milestone.name}</p>
                            {item.milestone.phase && (
                              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                {item.milestone.phase}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                            {formatDateForDisplay(item.milestone.date)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Payments content */}
              {activeCard.paymentData !== undefined && (
                <>
                  {activeCard.paymentData.length === 0 ? (
                    <p className="text-center text-text-secondary-light dark:text-text-secondary-dark py-4">
                      {activeCard.subtitle}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {activeCard.paymentData.map((item) => (
                        <div
                          key={item.payment.id}
                          className="flex justify-between items-center p-3 bg-background-light dark:bg-background-dark rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-sm">{item.payment.invoice_number}</p>
                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                              {item.budgetItem?.description}
                            </p>
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-primary">
                              {formatCurrency(item.payment.total_amount)}
                            </p>
                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                              {formatDateForDisplay(item.payment.invoice_date)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="p-4 border-t border-border-light dark:border-border-dark">
              <button
                onClick={() => {
                  setShowModal(null);
                  onTabChange?.(activeCard.targetTab);
                }}
                className="w-full py-2 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary-hover transition-colors"
              >
                {activeCard.milestoneData !== undefined ? 'לכל אבני הדרך' : 'לניהול תקציב'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
