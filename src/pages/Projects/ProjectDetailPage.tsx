import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getProjectById } from '../../services/projectsService';
import { getOpenIssuesCount } from '../../services/specialIssuesService';
import { useAuth } from '../../contexts/AuthContext';
import { canEditProject, canAccessProject } from '../../utils/permissions';
import type { Project } from '../../types';
import OverviewTab from './tabs/OverviewTab';
import ProfessionalsTab from './tabs/ProfessionalsTab';
import FilesTab from './tabs/FilesTab';
import FinancialTab from './tabs/FinancialTab';
import TasksMilestonesTab from './tabs/TasksMilestonesTab';
import PlanningChangesTab from './tabs/PlanningChangesTab';
import SpecialIssuesTab from './tabs/SpecialIssuesTab';
import DeveloperApprovalTab from './tabs/DeveloperApprovalTab';

const tabs = [
  { id: 'overview', label: 'סקירה', icon: 'visibility', path: '' },
  { id: 'tasks-milestones', label: 'משימות וציוני דרך', icon: 'flag', path: '/tasks' },
  { id: 'financial', label: 'ניהול פיננסי', icon: 'account_balance', path: '/financial' },
  { id: 'planning-changes', label: 'שינויים בתכנון', icon: 'change_circle', path: '/planning-changes' },
  { id: 'special-issues', label: 'בעיות מיוחדות', icon: 'error', path: '/special-issues' },
  { id: 'professionals', label: 'בעלי מקצוע', icon: 'people', path: '/professionals' },
  { id: 'files', label: 'קבצים', icon: 'folder', path: '/files' },
  { id: 'developer-approval', label: 'אישור יזם', icon: 'verified_user', path: '/developer-approval' },
];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Permission checks
  const canEdit = canEditProject(user, id || '');
  const hasAccess = canAccessProject(user, id || '');

  // Get valid tab IDs
  const validTabIds = tabs.map(t => t.id);

  // Read tab from URL query parameter, default to 'overview'
  const tabFromUrl = searchParams.get('tab');
  const initialTab = tabFromUrl && validTabIds.includes(tabFromUrl) ? tabFromUrl : 'overview';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [tabTransition, setTabTransition] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);
  const [openIssuesCount, setOpenIssuesCount] = useState(0);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const projectData = await getProjectById(id);
        setProject(projectData);
      } catch (error) {
        console.error('Error loading project:', error);
        setProject(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadProject();
  }, [id]);

  // Load open issues count - recalculates when activeTab changes to special-issues
  useEffect(() => {
    const loadCount = async () => {
      if (!id) {
        setOpenIssuesCount(0);
        return;
      }
      try {
        const count = await getOpenIssuesCount(id);
        setOpenIssuesCount(count);
      } catch (error) {
        console.error('Error loading open issues count:', error);
      }
    };
    loadCount();
  }, [id, activeTab]);

  // Navigate away if project not found or user doesn't have access
  useEffect(() => {
    if (!isLoading && id && (!project || !hasAccess)) {
      navigate('/projects');
    }
    // Show header immediately when project loads
    if (project) {
      setIsHeaderVisible(true);
    }
  }, [id, navigate, project, hasAccess, isLoading]);

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
    // Brief fade for smooth transition
    setTabTransition(true);
    setActiveTab(tabId);
    // Update URL with new tab (remove param if overview)
    if (tabId === 'overview') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: tabId });
    }
    // Reset transition state after fade completes
    setTimeout(() => setTabTransition(false), 200);
  };

  // Sync tab from URL when it changes externally (e.g., browser back/forward)
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    const targetTab = tabFromUrl && validTabIds.includes(tabFromUrl) ? tabFromUrl : 'overview';
    if (targetTab !== activeTab) {
      setActiveTab(targetTab);
    }
  }, [searchParams, validTabIds, activeTab]);

  if (isLoading || !project) {
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
        case 'financial':
          return <FinancialTab project={project} />;
        case 'planning-changes':
          return <PlanningChangesTab project={project} />;
        case 'special-issues':
          return <SpecialIssuesTab project={project} />;
        case 'files':
          return <FilesTab project={project} />;
        case 'developer-approval':
          return <DeveloperApprovalTab project={project} />;
        // Legacy redirects for bookmarked URLs
        case 'budget':
        case 'tenders':
          return <FinancialTab project={project} />;
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
            {project.client_name}
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
              className={`flex items-center gap-1.5 pb-3 px-3 pt-3 min-h-11 transition-all duration-200 relative group rounded-t-lg overflow-hidden ${
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
      {canEdit && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark md:hidden z-50 flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] animate-fade-in-up">
          <button
            onClick={handleEdit}
            className="flex-1 flex items-center justify-center h-12 px-4 rounded-lg bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark font-bold text-sm btn-press transition-all duration-200 hover:shadow-md"
          >
            עריכת פרויקט
          </button>
        </div>
      )}
    </div>
  );
}
