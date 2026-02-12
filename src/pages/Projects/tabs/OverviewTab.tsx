import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Project, ProjectMilestone, CostItem, ScheduleItem } from '../../../types';
import { formatDateForDisplay, formatDateHebrew } from '../../../utils/dateUtils';
import { getProjectProfessionalsByProjectId } from '../../../services/projectProfessionalsService';
import { getTasks } from '../../../services/tasksService';
import { getFiles } from '../../../services/filesService';
import { getMilestones } from '../../../services/milestonesService';
import { getCostItems } from '../../../services/costsService';
import { getScheduleItemsByProject } from '../../../services/paymentSchedulesService';
import ProjectKPICards from '../../../components/Projects/ProjectKPICards';

interface OverviewTabProps {
  project: Project;
  statusColors: Record<string, string>;
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

export default function OverviewTab({ project, statusColors, onTabChange }: OverviewTabProps) {
  // State for counts
  const [professionalsCount, setProfessionalsCount] = useState(0);
  const [openTasksCount, setOpenTasksCount] = useState(0);
  const [filesCount, setFilesCount] = useState(0);

  // Milestones state (real data)
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);

  // Financial state
  const [costItems, setCostItems] = useState<CostItem[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);

  // Load counts on mount
  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [projectProfessionals, projectTasks, projectFiles, projectMilestones, projectCostItems, projectScheduleItems] = await Promise.all([
          getProjectProfessionalsByProjectId(project.id),
          getTasks(project.id),
          getFiles(project.id),
          getMilestones(project.id),
          getCostItems(project.id),
          getScheduleItemsByProject(project.id),
        ]);

        const openTasks = projectTasks.filter(
          (t) => t.status !== 'Done' && t.status !== 'Canceled'
        );

        setProfessionalsCount(projectProfessionals.length);
        setOpenTasksCount(openTasks.length);
        setFilesCount(projectFiles.length);
        setMilestones(projectMilestones);
        setCostItems(projectCostItems);
        setScheduleItems(projectScheduleItems);
      } catch (error) {
        console.error('Error loading overview counts:', error);
      }
    };

    loadCounts();
  }, [project.id]);

  const statusLabels: Record<string, string> = {
    'תכנון': 'שלב תכנון',
    'היתרים': 'שלב היתרים',
    'מכרזים': 'שלב מכרזים',
    'ביצוע': 'שלב ביצוע',
    'מסירה': 'שלב מסירה',
    'ארכיון': 'ארכיון',
  };

  // Summary stats
  const summaryStats = {
    professionals: professionalsCount,
    openTasks: openTasksCount,
    files: filesCount,
  };

  // Financial calculations
  const { totalEstimated, totalContracted, totalPaid, paidCount, paymentProgressPct, nextPayment } = useMemo(() => {
    const estimated = costItems.reduce((sum, item) => sum + (item.estimated_amount || 0), 0);
    const contracted = costItems
      .filter(item => item.status === 'tender_winner')
      .reduce((sum, item) => sum + (item.actual_amount || 0), 0);
    const paid = scheduleItems
      .filter(si => si.status === 'paid')
      .reduce((sum, si) => sum + (si.paid_amount || si.amount), 0);
    const pCount = scheduleItems.filter(si => si.status === 'paid').length;
    const progressPct = contracted > 0 ? Math.min(100, (paid / contracted) * 100) : 0;

    // Next upcoming payment
    const next = scheduleItems
      .filter(si => si.status !== 'paid' && si.target_date)
      .sort((a, b) => new Date(a.target_date!).getTime() - new Date(b.target_date!).getTime())[0];

    return {
      totalEstimated: estimated,
      totalContracted: contracted,
      totalPaid: paid,
      paidCount: pCount,
      paymentProgressPct: progressPct,
      nextPayment: next,
    };
  }, [costItems, scheduleItems]);

  const handleStatClick = useCallback((tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    }
  }, [onTabChange]);

  return (
    <div className="space-y-6">
      {/* Project KPI Cards - Milestones & Budget */}
      <ProjectKPICards projectId={project.id} onTabChange={onTabChange} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Main Content */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        {/* Project Details Card */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xl font-bold">פרטי פרויקט</h3>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${statusColors[project.status]}`}
            >
              <span className="size-2 rounded-full bg-current me-2 opacity-75"></span>
              {statusLabels[project.status] || project.status}
            </span>
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <p className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider mb-1">
                  שם הלקוח
                </p>
                <p className="text-base font-medium">{project.client_name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider mb-1">
                  נוצר ב-
                </p>
                <p className="text-base font-medium">
                  {project.created_at ? formatDateHebrew(project.created_at) : project.updated_at_text}
                </p>
              </div>
              {project.address && (
                <div className="md:col-span-2">
                  <p className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider mb-1">
                    כתובת
                  </p>
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary mt-0.5 text-[20px]">
                      location_on
                    </span>
                    <p className="text-base font-medium">{project.address}</p>
                  </div>
                </div>
              )}
              {project.notes && (
                <div className="md:col-span-2">
                  <p className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider mb-1">
                    הערות
                  </p>
                  <p className="text-sm leading-relaxed text-text-secondary-light dark:text-text-secondary-dark">
                    {project.notes}
                  </p>
                </div>
              )}
            </div>
            {/* Map Placeholder */}
            {project.address && (
              <div className="w-full md:w-1/3 shrink-0">
                <div className="rounded-lg overflow-hidden h-40 md:h-full bg-gray-200 relative group cursor-pointer border border-border-light">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{
                      backgroundImage:
                        'url(https://lh3.googleusercontent.com/aida-public/AB6AXuA7qVnrW4JPLGT3w1gZYxvhCXPxIO4u8gZyuFWCGlPNBge5dNPBMfDiOFA_26VqUZbAeXcKkT8CIVRDDDmr1Xgs0dkMMbHxNDkmsizLaSsrAYXHxJa8Lt36WDD77XfvEtnP3pTteO3uAfDBdyhsDQtpQA95ouIIEvMo8ijDlDMXzaYyVUbeL6DcHose8GAFPOxdFt26HaaxUzTBQOUqvmN531H1hvG7GMpl2QmtzfNzetfXEAp3mwfCpbhhxojQHpWgYAFsU99MW2v0)',
                    }}
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                  <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-black/80 backdrop-blur px-2 py-1 rounded text-xs font-bold shadow-sm">
                    פתח מפה
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards - Clickable to navigate to relevant tabs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => handleStatClick('professionals')}
            className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-border-light dark:border-border-dark flex items-center gap-4 hover:shadow-md transition-all text-start group"
          >
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined">engineering</span>
            </div>
            <div className="flex-1">
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-medium">
                בעלי מקצוע
              </p>
              <p className="text-lg font-bold">{summaryStats.professionals} פעילים</p>
            </div>
            <span className="material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark text-[18px] opacity-0 group-hover:opacity-100 transition-opacity">
              arrow_back
            </span>
          </button>
          <button
            onClick={() => handleStatClick('tasks-milestones')}
            className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-border-light dark:border-border-dark flex items-center gap-4 hover:shadow-md transition-all text-start group"
          >
            <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
              <span className="material-symbols-outlined">assignment</span>
            </div>
            <div className="flex-1">
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-medium">
                משימות פתוחות
              </p>
              <p className="text-lg font-bold">{summaryStats.openTasks} ממתינות</p>
            </div>
            <span className="material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark text-[18px] opacity-0 group-hover:opacity-100 transition-opacity">
              arrow_back
            </span>
          </button>
          <button
            onClick={() => handleStatClick('files')}
            className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-border-light dark:border-border-dark flex items-center gap-4 hover:shadow-md transition-all text-start group"
          >
            <div className="size-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
              <span className="material-symbols-outlined">folder_open</span>
            </div>
            <div className="flex-1">
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-medium">
                קבצים
              </p>
              <p className="text-lg font-bold">{summaryStats.files} פריטים</p>
            </div>
            <span className="material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark text-[18px] opacity-0 group-hover:opacity-100 transition-opacity">
              arrow_back
            </span>
          </button>
          <button
            onClick={() => handleStatClick('financial')}
            className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-border-light dark:border-border-dark flex items-center gap-4 hover:shadow-md transition-all text-start group"
          >
            <div className="size-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <div className="flex-1">
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-medium">
                תשלומים
              </p>
              <p className="text-lg font-bold">{paidCount}/{scheduleItems.length} שולמו</p>
            </div>
            <span className="material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark text-[18px] opacity-0 group-hover:opacity-100 transition-opacity">
              arrow_back
            </span>
          </button>
        </div>

        {/* Milestones Snapshot Card */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold">ציוני דרך</h3>
          </div>
          {(() => {
            // Sort by date ascending
            const sortedMilestones = [...milestones].sort((a, b) =>
              new Date(a.date).getTime() - new Date(b.date).getTime()
            );

            // Get up to 5 upcoming milestones (not completed)
            const upcomingMilestones = sortedMilestones
              .filter(m => m.status !== 'completed')
              .slice(0, 5);

            if (milestones.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
                    עדיין לא הוגדרו ציוני דרך לפרויקט זה
                  </p>
                  <button
                    onClick={() => handleStatClick('tasks-milestones')}
                    className="flex items-center gap-2 text-primary hover:text-primary-hover font-medium transition-colors group"
                  >
                    <span>לכל ציוני הדרך</span>
                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-[-4px] transition-transform">
                      arrow_back
                    </span>
                  </button>
                </div>
              );
            }

            const milestoneStatusLabels: Record<string, string> = {
              'pending': 'ממתין',
              'in-progress': 'בתהליך',
              'completed': 'הושלם',
            };

            const statusBadgeColors: Record<string, string> = {
              'pending': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
              'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
              'completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
            };

            const completedCount = milestones.filter(m => m.status === 'completed').length;

            return (
              <>
                {/* Progress indicator */}
                <div className="flex items-center gap-3 mb-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  <span className="material-symbols-outlined text-[16px]">flag</span>
                  <span>{completedCount}/{milestones.length} הושלמו</span>
                  <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {(upcomingMilestones.length > 0 ? upcomingMilestones : sortedMilestones.slice(0, 5)).map((milestone) => (
                    <div
                      key={milestone.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark hover:shadow-sm transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm mb-1 truncate">{milestone.name}</p>
                        <div className="flex items-center gap-3 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                            {formatDateForDisplay(milestone.date)}
                          </span>
                          {milestone.phase && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px]">category</span>
                              {milestone.phase}
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${statusBadgeColors[milestone.status] || statusBadgeColors['pending']}`}
                      >
                        {milestoneStatusLabels[milestone.status] || milestone.status}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handleStatClick('tasks-milestones')}
                  className="flex items-center gap-2 text-primary hover:text-primary-hover font-medium transition-colors group w-full justify-center pt-2 border-t border-border-light dark:border-border-dark"
                >
                  <span>לכל ציוני הדרך</span>
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-[-4px] transition-transform">
                    arrow_back
                  </span>
                </button>
              </>
            );
          })()}
        </div>
      </div>

      {/* Right Column - Sidebar */}
      <div className="flex flex-col gap-6">
        {/* Financial Summary Card */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
          <div className="bg-gradient-to-l from-emerald-50 to-white dark:from-emerald-950/20 dark:to-surface-dark px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">account_balance</span>
            <h3 className="text-base font-bold">סיכום פיננסי</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-medium">סה"כ אומדן</span>
                <span className="text-sm font-bold">{formatCurrency(totalEstimated)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-medium">סה"כ חוזי</span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalContracted)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-medium">סה"כ שולם</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalPaid)}</span>
              </div>
            </div>

            {/* Payment Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wide">
                <span>התקדמות תשלום</span>
                <span>{paymentProgressPct.toFixed(0)}%</span>
              </div>
              <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${paymentProgressPct}%` }}
                />
              </div>
            </div>

            {/* Next Upcoming Payment */}
            {nextPayment && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="material-symbols-outlined text-[14px] text-amber-600 dark:text-amber-400">event</span>
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide">תשלום קרוב</span>
                </div>
                <p className="text-sm font-bold text-amber-900 dark:text-amber-100">{formatCurrency(nextPayment.amount)}</p>
                <p className="text-xs text-amber-700 dark:text-amber-300">{nextPayment.description}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{formatDateForDisplay(nextPayment.target_date!)}</p>
              </div>
            )}

            <button
              onClick={() => handleStatClick('financial')}
              className="w-full py-2 text-sm font-bold text-primary hover:text-primary-hover transition-colors flex items-center justify-center gap-1.5 border-t border-border-light dark:border-border-dark pt-3"
            >
              <span>לטאב פיננסי</span>
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            </button>
          </div>
        </div>

        {/* Permit Details Card */}
        {(project.status === 'תכנון' || project.status === 'היתרים') && project.permit_start_date && (
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden flex flex-col h-fit">
            <div className="bg-gradient-to-l from-background-light to-white dark:from-background-dark dark:to-surface-dark px-6 py-4 border-b border-border-light dark:border-border-dark flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark">
                  gavel
                </span>
                <h3 className="text-base font-bold">פרטי היתר</h3>
              </div>
              <span className="size-2 bg-amber-500 rounded-full animate-pulse"></span>
            </div>
            <div className="p-6 flex flex-col gap-6">
              {/* Progress Bar */}
              <div className="relative pt-2">
                <div className="flex justify-between text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
                  <span>הוגש</span>
                  <span>בבדיקה</span>
                  <span>אושר</span>
                </div>
                <div className="h-2 bg-border-light dark:bg-border-dark rounded-full overflow-hidden dir-ltr">
                  <div className="h-full bg-amber-500 w-2/3 rounded-full relative">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-white/30 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Permit Dates */}
              <div className="grid grid-cols-2 gap-4">
                {project.permit_start_date && (
                  <div className="bg-background-light dark:bg-background-dark p-3 rounded-lg border border-border-light dark:border-border-dark">
                    <p className="text-[10px] uppercase font-bold text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      תאריך התחלה
                    </p>
                    <p className="text-sm font-bold">{formatDateForDisplay(project.permit_start_date)}</p>
                  </div>
                )}
                {project.permit_duration_months && (
                  <div className="bg-background-light dark:bg-background-dark p-3 rounded-lg border border-border-light dark:border-border-dark">
                    <p className="text-[10px] uppercase font-bold text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      משך משוער
                    </p>
                    <p className="text-sm font-bold">{project.permit_duration_months} חודשים</p>
                  </div>
                )}
              </div>

              {/* Target Date */}
              {project.permit_target_date && (
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-baseline">
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">תאריך יעד</p>
                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      {formatDateForDisplay(project.permit_target_date)}
                    </p>
                  </div>
                  {project.permit_approval_date ? (
                    <div className="mt-2">
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-1">
                        תאריך אישור:
                      </p>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">
                        {formatDateForDisplay(project.permit_approval_date)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark italic">
                      ממתין לאישור
                    </p>
                  )}
                </div>
              )}

              {/* Mark as Approved Button */}
              <button className="hidden md:flex w-full mt-2 py-2.5 px-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg transition-colors items-center justify-center gap-2 group">
                <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                  check_circle
                </span>
                סימון היתר כמאושר
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions Card */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6">
          <h4 className="font-bold text-sm mb-4 flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined">bolt</span>
            פעולות מהירות
          </h4>
          <div className="flex flex-col gap-3">
            <button className="flex items-center justify-between w-full p-3 bg-background-light dark:bg-surface-dark hover:bg-white dark:hover:bg-opacity-80 rounded-lg text-sm font-medium transition-all hover:shadow-md border border-transparent hover:border-border-light text-start group">
              <span>העלאת מסמכי היתר</span>
              <span className="material-symbols-outlined text-text-secondary-light group-hover:text-primary text-[18px]">
                upload
              </span>
            </button>
            <button className="flex items-center justify-between w-full p-3 bg-background-light dark:bg-surface-dark hover:bg-white dark:hover:bg-opacity-80 rounded-lg text-sm font-medium transition-all hover:shadow-md border border-transparent hover:border-border-light text-start group">
              <span>הוספת הערה חדשה</span>
              <span className="material-symbols-outlined text-text-secondary-light group-hover:text-primary text-[18px]">
                note_add
              </span>
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
