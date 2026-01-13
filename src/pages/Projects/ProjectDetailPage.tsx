import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjectById } from '../../data/storage';
import { getOpenIssuesCount } from '../../data/specialIssuesStorage';
import { useAuth } from '../../contexts/AuthContext';
import { canEditProject, canCreateTask, canAccessProject } from '../../utils/permissions';
import OverviewTab from './tabs/OverviewTab';
import ProfessionalsTab from './tabs/ProfessionalsTab';
import TendersTab from './tabs/TendersTab';
import FilesTab from './tabs/FilesTab';
import BudgetTab from './tabs/BudgetTab';
import TasksMilestonesTab from './tabs/TasksMilestonesTab';
import PlanningChangesTab from './tabs/PlanningChangesTab';
import SpecialIssuesTab from './tabs/SpecialIssuesTab';
import DeveloperApprovalTab from './tabs/DeveloperApprovalTab';

const tabs = [
  { id: 'overview', label: 'סקירה', icon: 'visibility', path: '' },
  { id: 'tasks-milestones', label: 'משימות וציוני דרך', icon: 'flag', path: '/tasks' },
  { id: 'budget', label: 'תקציב', icon: 'payments', path: '/budget' },
  { id: 'planning-changes', label: 'שינויים בתכנון', icon: 'change_circle', path: '/planning-changes' },
  { id: 'special-issues', label: 'בעיות מיוחדות', icon: 'error', path: '/special-issues' },
  { id: 'tenders', label: 'מכרזים', icon: 'gavel', path: '/tenders' },
  { id: 'professionals', label: 'בעלי מקצוע', icon: 'people', path: '/professionals' },
  { id: 'files', label: 'קבצים', icon: 'folder', path: '/files' },
  { id: 'developer-approval', label: 'אישור יזם', icon: 'verified_user', path: '/developer-approval' },
];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Use useMemo for project lookup - it's derived from id
  const project = useMemo(() => getProjectById(id || ''), [id]);

  // Permission checks
  const canEdit = canEditProject(user, id || '');
  const canAddTask = canCreateTask(user, id || '');
  const hasAccess = canAccessProject(user, id || '');

  const [activeTab, setActiveTab] = useState('overview');
  const [tabTransition, setTabTransition] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Compute open issues count - recalculates when activeTab changes to special-issues
  const openIssuesCount = useMemo(() => {
    if (!id) return 0;
    // Include activeTab in deps so it recalculates when switching to special-issues tab
    // This is intentional - we want fresh data when viewing the tab
    return getOpenIssuesCount(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, activeTab]);

  // Navigate away if project not found or user doesn't have access
  useEffect(() => {
    if (id && (!project || !hasAccess)) {
      navigate('/projects');
    }
    // Animate header on mount
    setTimeout(() => setIsHeaderVisible(true), 50);
  }, [id, navigate, project, hasAccess]);

  // Update tab indicator position
  useEffect(() => {
    const activeIndex = tabs.findIndex(t => t.id === activeTab);
    const activeTabEl = tabsRef.current[activeIndex];
    if (activeTabEl && indicatorRef.current) {
      indicatorRef.current.style.width = `${activeTabEl.offsetWidth}px`;
      indicatorRef.current.style.transform = `translateX(${activeTabEl.offsetLeft}px)`;
    }
  }, [activeTab]);

  const handleTabChange = (tabId: string) => {
    if (tabId === activeTab) return;
    setTabTransition(true);
    setTimeout(() => {
      setActiveTab(tabId);
      setTabTransition(false);
    }, 150);
  };

  if (!project) {
    return (
      <div className="flex-1 px-4 lg:px-10 py-6 max-w-[1400px] mx-auto w-full">
        <div className="flex items-center gap-3 text-text-secondary-light dark:text-text-secondary-dark">
          <div className="size-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <p>טוען...</p>
        </div>
      </div>
    );
  }

  const handleEdit = () => {
    navigate(`/projects/${id}/edit`);
  };

  const handleNewTask = () => {
    handleTabChange('tasks-milestones');
  };

  const statusColors: Record<string, string> = {
    'תכנון': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
    'היתרים': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
    'מכרזים': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
    'ביצוע': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
    'מסירה': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
    'ארכיון': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200',
  };

  const renderTabContent = () => {
    const content = (() => {
      switch (activeTab) {
        case 'overview':
          return <OverviewTab project={project} statusColors={statusColors} onTabChange={handleTabChange} />;
        case 'professionals':
          return <ProfessionalsTab project={project} />;
        case 'tasks-milestones':
          return <TasksMilestonesTab project={project} />;
        case 'planning-changes':
          return <PlanningChangesTab project={project} />;
        case 'special-issues':
          return <SpecialIssuesTab project={project} />;
        case 'tenders':
          return <TendersTab project={project} />;
        case 'files':
          return <FilesTab project={project} />;
        case 'budget':
          return <BudgetTab project={project} />;
        case 'developer-approval':
          return <DeveloperApprovalTab project={project} />;
        default:
          return null;
      }
    })();

    return (
      <div 
        className={`transition-all duration-200 ease-smooth ${
          tabTransition ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
        }`}
      >
        {content}
      </div>
    );
  };

  return (
    <div className="flex-1 px-4 lg:px-10 py-6 max-w-[1400px] mx-auto w-full pb-20 lg:pb-6">
      {/* Project Header with entrance animation */}
      <div 
        className={`flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 transition-all duration-500 ease-smooth ${
          isHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
            {project.project_name}
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark text-base">
            מזהה פרויקט: #{project.id}
          </p>
        </div>
        <div className="hidden md:flex gap-3">
          {canEdit && (
            <button
              onClick={handleEdit}
              className="flex items-center justify-center h-10 px-4 rounded-lg bg-white border border-border-light dark:bg-surface-dark dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 text-sm font-bold tracking-[0.015em] text-text-main-light dark:text-text-main-dark btn-press hover:shadow-md"
            >
              <span className="material-symbols-outlined me-2 text-[18px] transition-transform duration-200 group-hover:rotate-12">edit</span>
              עריכת פרויקט
            </button>
          )}
          {canAddTask && (
            <button
              onClick={handleNewTask}
              className="flex items-center justify-center h-10 px-4 rounded-lg bg-primary text-white hover:bg-primary-hover transition-all duration-200 text-sm font-bold tracking-[0.015em] btn-press hover:shadow-lg hover:shadow-primary/25"
            >
              <span className="material-symbols-outlined me-2 text-[18px]">add</span>
              משימה חדשה
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation with sliding indicator */}
      <div 
        className={`relative border-b border-border-light dark:border-border-dark mb-8 overflow-x-auto transition-all duration-500 delay-100 ${
          isHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="flex gap-2 min-w-max relative">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={(el) => { tabsRef.current[index] = el; }}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-1.5 pb-3 px-2.5 pt-2 transition-all duration-200 relative group rounded-t-lg overflow-hidden ${
                activeTab === tab.id
                  ? 'text-primary'
                  : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-main-light dark:hover:text-text-main-dark'
              }`}
            >
              {/* Hover overlay - 20% opacity */}
              <span className={`absolute inset-0 rounded-t-lg transition-opacity duration-200 ${
                activeTab === tab.id 
                  ? 'bg-primary/20 opacity-100' 
                  : 'bg-primary/20 opacity-0 group-hover:opacity-100'
              }`} />
              <span className={`material-symbols-outlined text-[18px] transition-transform duration-200 relative z-10 ${
                activeTab === tab.id ? 'scale-110' : 'group-hover:scale-105'
              }`}>
                {tab.icon}
              </span>
              <p className="text-sm font-bold tracking-[0.015em] relative z-10">
                {tab.label}
              </p>
              {tab.id === 'special-issues' && openIssuesCount > 0 && (
                <span className="relative z-10 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-red-500 text-white">
                  {openIssuesCount}
                </span>
              )}
            </button>
          ))}
          {/* Animated indicator */}
          <div 
            ref={indicatorRef}
            className="absolute bottom-0 h-[3px] bg-primary rounded-full transition-all duration-300 ease-smooth"
          />
        </div>
      </div>

      {/* Tab Content with transition */}
      <div 
        className={`transition-all duration-500 delay-200 ${
          isHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {renderTabContent()}
      </div>

      {/* Mobile Footer with slide up animation */}
      {(canEdit || canAddTask) && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark md:hidden z-50 flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] animate-fade-in-up">
          {canEdit && (
            <button
              onClick={handleEdit}
              className="flex-1 flex items-center justify-center h-12 px-4 rounded-lg bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark font-bold text-sm btn-press transition-all duration-200 hover:shadow-md"
            >
              עריכת פרויקט
            </button>
          )}
          {canAddTask && (
            <button
              onClick={handleNewTask}
              className="flex-[2] flex items-center justify-center h-12 px-4 rounded-lg bg-primary text-white font-bold text-sm shadow-md btn-press transition-all duration-200 hover:bg-primary-hover hover:shadow-lg"
            >
              משימה חדשה
            </button>
          )}
        </div>
      )}
    </div>
  );
}
