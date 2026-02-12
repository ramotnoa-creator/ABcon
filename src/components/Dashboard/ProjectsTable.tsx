import { memo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ProjectRequiringAttention } from '../../types';

interface ProjectsTableProps {
  projects: ProjectRequiringAttention[];
}

const statusColorClasses = {
  red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
};

const ProjectsTable = memo(function ProjectsTable({ projects }: ProjectsTableProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [animateProgress, setAnimateProgress] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setIsVisible(true), 300);
    const timer2 = setTimeout(() => setAnimateProgress(true), 800);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div 
      className={`bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6 transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold mb-1">פרויקטים הדורשים תשומת לב</h3>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            רשימת 5 הפרויקטים בעלי הדחיפות הגבוהה ביותר לטיפול
          </p>
        </div>
        <Link
          to="/projects"
          className="text-sm text-primary hover:text-primary-hover transition-all duration-200 hover:translate-x-1 inline-flex items-center gap-1"
        >
          ניהול רשימה מלאה
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
        </Link>
      </div>
      
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark">
            <tr>
              <th scope="col" className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                שם הפרויקט
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                מנהל פרויקט
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                סטטוס
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                סוגיה קריטית
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                התקדמות
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                פעולות
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light dark:divide-border-dark">
            {projects.map((project, index) => (
              <tr
                key={project.id}
                className={`hover:bg-background-light dark:hover:bg-background-dark transition-all duration-200 group cursor-pointer ${
                  isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                }`}
                style={{ transitionDelay: `${400 + index * 75}ms` }}
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark text-[18px] transition-transform duration-200 group-hover:scale-110">
                      business
                    </span>
                    <Link
                      to={`/projects/${project.id}`}
                      className="text-sm font-medium hover:text-primary transition-colors"
                    >
                      {project.project_name}
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm">{project.project_manager}</td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold transition-transform duration-200 group-hover:scale-105 ${statusColorClasses[project.statusColor]}`}
                  >
                    {project.status}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`text-sm ${
                      project.issueColor === 'red'
                        ? 'text-red-600 dark:text-red-400 font-medium'
                        : 'text-text-main-light dark:text-text-main-dark'
                    }`}
                  >
                    {project.critical_issue}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-border-light dark:bg-border-dark rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-smooth ${
                          project.progress >= 90
                            ? 'bg-green-500'
                            : project.progress >= 50
                            ? 'bg-blue-500'
                            : 'bg-blue-400'
                        }`}
                        style={{ 
                          width: animateProgress ? `${project.progress}%` : '0%',
                          transitionDelay: `${index * 100}ms`
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium w-10 text-left tabular-nums">{project.progress}%</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <Link
                    to={`/projects/${project.id}`}
                    className="text-sm text-primary hover:text-primary-hover transition-all duration-200 inline-flex items-center gap-1 group/link"
                  >
                    ניהול
                    <span className="material-symbols-outlined text-[16px] opacity-0 -translate-x-2 transition-all duration-200 group-hover/link:opacity-100 group-hover/link:translate-x-0">
                      arrow_back
                    </span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {projects.map((project, index) => (
          <div
            key={project.id}
            className={`bg-background-light dark:bg-background-dark rounded-lg p-4 border border-border-light dark:border-border-dark transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: `${400 + index * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <Link
                to={`/projects/${project.id}`}
                className="flex items-center gap-2 flex-1 group"
              >
                <span className="material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark text-[18px] transition-transform duration-200 group-hover:scale-110">
                  business
                </span>
                <span className="font-medium group-hover:text-primary transition-colors">{project.project_name}</span>
              </Link>
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${statusColorClasses[project.statusColor]}`}
              >
                {project.status}
              </span>
            </div>
            <div className="space-y-2 text-sm mb-3">
              <div>
                <span className="text-text-secondary-light dark:text-text-secondary-dark">מנהל פרויקט: </span>
                <span>{project.project_manager}</span>
              </div>
              <div>
                <span className="text-text-secondary-light dark:text-text-secondary-dark">סוגיה קריטית: </span>
                <span
                  className={
                    project.issueColor === 'red'
                      ? 'text-red-600 dark:text-red-400 font-medium'
                      : ''
                  }
                >
                  {project.critical_issue}
                </span>
              </div>
              <div>
                <span className="text-text-secondary-light dark:text-text-secondary-dark">התקדמות: </span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 bg-border-light dark:bg-border-dark rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-smooth ${
                        project.progress >= 90
                          ? 'bg-green-500'
                          : project.progress >= 50
                          ? 'bg-blue-500'
                          : 'bg-blue-400'
                      }`}
                      style={{ 
                        width: animateProgress ? `${project.progress}%` : '0%',
                        transitionDelay: `${index * 100}ms`
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium tabular-nums">{project.progress}%</span>
                </div>
              </div>
            </div>
            <Link
              to={`/projects/${project.id}`}
              className="text-sm text-primary hover:text-primary-hover transition-all duration-200 inline-flex items-center gap-1 group"
            >
              ניהול
              <span className="material-symbols-outlined text-[16px] transition-transform duration-200 group-hover:-translate-x-1">arrow_back</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
});

export default ProjectsTable;
