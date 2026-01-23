import type { Alert, KPI, ProjectRequiringAttention, StatusDistribution, Project } from '../types';
import type { User } from '../types/auth';
import { getProjects } from '../services/projectsService';
import { getAllTenders } from '../services/tendersService';
import { canAccessProject, canViewAllProjects } from '../utils/permissions';

// Type for tender summary in dashboard
export interface TenderEndingSoon {
  id: string;
  tender_name: string;
  project_id: string;
  project_name: string;
  due_date: string;
  days_remaining: number;
  status: string;
}

// Helper to calculate progress based on status
function calculateProgress(status: string): number {
  const statusProgress: Record<string, number> = {
    'תכנון': 15,
    'היתרים': 35,
    'מכרזים': 50,
    'ביצוע': 70,
    'מסירה': 95,
    'ארכיון': 100,
  };
  return statusProgress[status] || 0;
}

// Helper to get status color
function getStatusColor(status: string): 'red' | 'yellow' | 'blue' {
  if (status === 'ביצוע') return 'blue';
  if (status === 'היתרים' || status === 'מכרזים') return 'yellow';
  return 'blue';
}

// Helper to get critical issue for a project
function getCriticalIssue(project: Project): { issue: string; color: 'red' | 'default' } {
  // Check for permit delay
  if (project.permit_target_date) {
    const targetDate = new Date(project.permit_target_date);
    const today = new Date();
    if (targetDate < today && project.status !== 'ארכיון') {
      return { issue: 'איחור בלו"ז היתר', color: 'red' };
    }
  }

  // Default issues based on status
  if (project.status === 'היתרים') return { issue: 'בהמתנה לאישור', color: 'default' };
  if (project.status === 'מכרזים') return { issue: 'בתהליך מכרזים', color: 'default' };
  if (project.status === 'ביצוע') return { issue: 'בביצוע שוטף', color: 'default' };
  return { issue: 'בתכנון', color: 'default' };
}

// Fetch real projects for dashboard
export async function getProjectsRequiringAttention(user: User | null): Promise<ProjectRequiringAttention[]> {
  try {
    const projects = await getProjects();

    // Filter active projects (not archived) and by user permissions
    const activeProjects = projects.filter(p => {
      if (p.status === 'ארכיון') return false;
      if (!user) return false;
      // Only show projects the user has access to
      if (canViewAllProjects(user)) return true;
      return canAccessProject(user, p.id);
    });

    // Sort by urgency (permit target date closest to today)
    const sorted = activeProjects.sort((a, b) => {
      const aDate = a.permit_target_date ? new Date(a.permit_target_date).getTime() : Infinity;
      const bDate = b.permit_target_date ? new Date(b.permit_target_date).getTime() : Infinity;
      return aDate - bDate;
    });

    // Take top 5
    return sorted.slice(0, 5).map(project => {
      const { issue, color: issueColor } = getCriticalIssue(project);
      return {
        id: project.id,
        project_name: project.project_name,
        project_manager: project.client_name, // Using client_name as manager for now
        status: project.status,
        critical_issue: issue,
        progress: calculateProgress(project.status),
        statusColor: getStatusColor(project.status),
        issueColor,
      };
    });
  } catch (error) {
    console.error('Error fetching projects for dashboard:', error);
    return projectsRequiringAttention; // Fallback to static data
  }
}

// Fetch tenders ending in the next 30 days
export async function getTendersEndingSoon(user: User | null): Promise<TenderEndingSoon[]> {
  try {
    const tenders = await getAllTenders();
    const projects = await getProjects();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Filter open tenders with due dates in the next 30 days
    const tendersEndingSoon = tenders
      .filter(t => t.status === 'Open' && t.due_date)
      .filter(t => {
        const dueDate = new Date(t.due_date!);
        return dueDate >= today && dueDate <= thirtyDaysFromNow;
      })
      .filter(t => {
        // Only show tenders from projects the user has access to
        if (!user) return false;
        if (canViewAllProjects(user)) return true;
        return canAccessProject(user, t.project_id);
      })
      .map(t => {
        const project = projects.find(p => p.id === t.project_id);
        const dueDate = new Date(t.due_date!);
        const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: t.id,
          tender_name: t.tender_name,
          project_id: t.project_id,
          project_name: project?.project_name || 'לא ידוע',
          due_date: t.due_date!,
          days_remaining: daysRemaining,
          status: t.status,
        };
      })
      .sort((a, b) => a.days_remaining - b.days_remaining)
      .slice(0, 5);

    return tendersEndingSoon;
  } catch (error) {
    console.error('Error fetching tenders ending soon:', error);
    return [];
  }
}

export const dashboardKPIs: KPI[] = [
  {
    id: 'completed',
    label: 'הושלמו השנה',
    value: 5,
    icon: 'check_circle',
    color: 'green',
  },
  {
    id: 'action_required',
    label: 'פעולה נדרשת',
    value: 2,
    icon: 'warning',
    color: 'red',
    subtitle: 'פרויקטים בעיכוב',
  },
  {
    id: 'in_progress',
    label: 'פרויקטים בביצוע',
    value: 8,
    icon: 'engineering',
    color: 'orange',
  },
  {
    id: 'total_active',
    label: 'סה"כ פרויקטים פעילים',
    value: 14,
    icon: 'folder',
    color: 'blue',
    badge: '2+ החודש',
  },
];

export const dashboardAlerts: Alert[] = [
  {
    id: '1',
    type: 'budget',
    title: 'חריגת תקציב - מגדלי הים',
    description: 'חריגה של 12% מהתקציב המאושר לשלב ב\'. נדרש אישור חריג.',
    timestamp: 'היום, 09:00',
    projectId: '1',
    projectName: 'מגדלי הים התיכון',
  },
  {
    id: '2',
    type: 'delay',
    title: 'עיכוב בלו"ז - פרויקט השרון',
    description: 'היתר בניה טרם התקבל מהעירייה. צפי דחייה של שבועיים.',
    timestamp: 'אתמול',
    projectId: '2',
    projectName: 'מתחם המגורים פארק',
  },
  {
    id: '3',
    type: 'contract',
    title: 'עדכון חוזה - קבלן אינסטלציה',
    description: 'יש לחדש ביטוח קבלני עד סוף השבוע.',
    timestamp: '20/10/2023',
  },
];

export const statusDistribution: StatusDistribution[] = [
  {
    label: 'בתכנון / מקדים',
    percentage: 55,
    color: 'blue',
  },
  {
    label: 'בביצוע פעיל',
    percentage: 30,
    color: 'orange',
  },
  {
    label: 'בעיכוב / חריגה',
    percentage: 15,
    color: 'red',
  },
];

export const projectsRequiringAttention: ProjectRequiringAttention[] = [
  {
    id: '1',
    project_name: 'מגדלי הים התיכון',
    project_manager: 'דני כהן',
    status: 'ביצוע',
    critical_issue: 'חריגת תקציב משמעותית',
    progress: 45,
    statusColor: 'red',
    issueColor: 'red',
  },
  {
    id: '2',
    project_name: 'מתחם המגורים פארק',
    project_manager: 'רונית לוי',
    status: 'היתרים',
    critical_issue: 'עיכוב בקבלת טופס 4',
    progress: 92,
    statusColor: 'yellow',
    issueColor: 'default',
  },
  {
    id: '3',
    project_name: 'משרדי הייטק צפון',
    project_manager: 'יוסי אברהם',
    status: 'ביצוע',
    critical_issue: 'מחסור בכוח אדם',
    progress: 25,
    statusColor: 'blue',
    issueColor: 'default',
  },
  {
    id: '4',
    project_name: 'שיקום שכונת הגפן',
    project_manager: 'מיכל שרון',
    status: 'ביצוע',
    critical_issue: 'התנגדות דיירים',
    progress: 10,
    statusColor: 'red',
    issueColor: 'red',
  },
];
