import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project, ProjectStatus } from '../../types';
import { getProjects, saveProjects } from '../../data/storage';
import { seedProjects } from '../../data/mockData';

const loadInitialProjects = (): Project[] => {
  let loaded = getProjects();

  // Seed if empty
  if (loaded.length === 0) {
    saveProjects(seedProjects);
    loaded = seedProjects;
  }

  return loaded;
};

const statusOptions: { value: 'all' | ProjectStatus; label: string }[] = [
  { value: 'all', label: 'כל הסטטוסים' },
  { value: 'תכנון', label: 'תכנון' },
  { value: 'היתרים', label: 'היתרים' },
  { value: 'מכרזים', label: 'מכרזים' },
  { value: 'ביצוע', label: 'ביצוע' },
  { value: 'מסירה', label: 'מסירה' },
  { value: 'ארכיון', label: 'ארכיון' },
];

const statusColors: Record<ProjectStatus, string> = {
  'תכנון': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
  'היתרים': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
  'מכרזים': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
  'ביצוע': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  'מסירה': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
  'ארכיון': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200',
};

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects] = useState<Project[]>(() => loadInitialProjects());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);


  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Filter by search query (project_name or client_name)
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.project_name.toLowerCase().includes(query) ||
          p.client_name.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    return filtered;
  }, [projects, searchQuery, statusFilter]);

  const handleProjectClick = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  return (
    <div className="flex-1 px-4 lg:px-10 py-6 max-w-[1400px] mx-auto w-full pb-20 lg:pb-6">
      <h1 
        className={`text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] mb-8 transition-all duration-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        פרויקטים
      </h1>

      {/* Filters */}
      <div 
        className={`flex flex-col md:flex-row gap-4 mb-6 transition-all duration-500 delay-100 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="flex-1">
          <div className="flex items-center rounded-lg bg-background-light dark:bg-background-dark h-10 px-3 border border-border-light dark:border-border-dark focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200 group">
            <span className="material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark text-[20px] me-2 transition-transform duration-200 group-focus-within:scale-110">
              search
            </span>
            <input
              type="text"
              className="w-full bg-transparent border-none focus:ring-0 text-sm placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark outline-none"
              placeholder="חיפוש לפי שם פרויקט או שם לקוח..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-text-secondary-light dark:text-text-secondary-dark hover:text-text-main-light dark:hover:text-text-main-dark transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
        </div>
        <div className="w-full md:w-48">
          <select
            className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | ProjectStatus)}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Projects List - Desktop Table View */}
      <div 
        className={`hidden md:block bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden transition-all duration-500 delay-200 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                  שם פרויקט
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                  שם לקוח
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                  כתובת
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                  סטטוס
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                  תאריך יעד היתר
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                  עודכן לאחרונה
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-secondary-light dark:text-text-secondary-dark">
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-[48px] opacity-50">search_off</span>
                      <p>לא נמצאו פרויקטים</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project, index) => (
                  <tr
                    key={project.id}
                    className={`hover:bg-background-light dark:hover:bg-background-dark cursor-pointer transition-all duration-200 group ${
                      isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                    }`}
                    style={{ transitionDelay: `${300 + index * 50}ms` }}
                    onClick={() => handleProjectClick(project.id)}
                  >
                    <td className="px-6 py-4 text-sm font-medium group-hover:text-primary transition-colors">{project.project_name}</td>
                    <td className="px-6 py-4 text-sm">{project.client_name}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {project.address || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold transition-transform duration-200 group-hover:scale-105 ${statusColors[project.status]}`}
                      >
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {project.permit_target_date
                        ? new Date(project.permit_target_date).toLocaleDateString('he-IL')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {project.updated_at_text}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Projects List - Mobile Card View */}
      <div className="md:hidden flex flex-col gap-4">
        {filteredProjects.length === 0 ? (
          <div 
            className={`text-center py-12 text-text-secondary-light dark:text-text-secondary-dark transition-all duration-500 delay-200 ${
              isVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-[48px] opacity-50">search_off</span>
              <p>לא נמצאו פרויקטים</p>
            </div>
          </div>
        ) : (
          filteredProjects.map((project, index) => (
            <div
              key={project.id}
              className={`bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-4 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${200 + index * 75}ms` }}
              onClick={() => handleProjectClick(project.id)}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold flex-1">{project.project_name}</h3>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ms-2 ${statusColors[project.status]}`}
                >
                  {project.status}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-text-secondary-light dark:text-text-secondary-dark">לקוח: </span>
                  <span className="font-medium">{project.client_name}</span>
                </div>
                {project.address && (
                  <div>
                    <span className="text-text-secondary-light dark:text-text-secondary-dark">כתובת: </span>
                    <span>{project.address}</span>
                  </div>
                )}
                {project.permit_target_date && (
                  <div>
                    <span className="text-text-secondary-light dark:text-text-secondary-dark">תאריך יעד היתר: </span>
                    <span>{new Date(project.permit_target_date).toLocaleDateString('he-IL')}</span>
                  </div>
                )}
                <div>
                  <span className="text-text-secondary-light dark:text-text-secondary-dark">עודכן: </span>
                  <span>{project.updated_at_text}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
