import { useState, useEffect } from 'react';
import type { Project } from '../../../types';
import { formatDateForDisplay, formatDateHebrew } from '../../../utils/dateUtils';
import { getProjectProfessionals } from '../../../data/professionalsStorage';
import { getTasks } from '../../../data/tasksStorage';
import { getFiles } from '../../../data/filesStorage';

interface OverviewTabProps {
  project: Project;
  statusColors: Record<string, string>;
  onTabChange?: (tabId: string) => void;
}

export default function OverviewTab({ project, statusColors, onTabChange }: OverviewTabProps) {
  const [professionalsCount, setProfessionalsCount] = useState(0);
  const [openTasksCount, setOpenTasksCount] = useState(0);
  const [filesCount, setFilesCount] = useState(0);

  useEffect(() => {
    const projectProfessionals = getProjectProfessionals(project.id);
    setProfessionalsCount(projectProfessionals.length);
    
    const projectTasks = getTasks(project.id);
    const openTasks = projectTasks.filter(
      (t) => t.status !== 'Done' && t.status !== 'Canceled'
    );
    setOpenTasksCount(openTasks.length);
    
    const projectFiles = getFiles(project.id);
    setFilesCount(projectFiles.length);
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

  const handleStatClick = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  return (
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            onClick={() => handleStatClick('tasks')}
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
        </div>
      </div>

      {/* Right Column - Sidebar */}
      <div className="flex flex-col gap-6">
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
  );
}
