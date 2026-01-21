import type { Alert, KPI, ProjectRequiringAttention, StatusDistribution, Project } from '../types';
import { getProjects } from '../services/projectsService';

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
export async function getProjectsRequiringAttention(): Promise<ProjectRequiringAttention[]> {
  try {
    const projects = await getProjects();

    // Filter active projects (not archived) and map to dashboard format
    const activeProjects = projects.filter(p => p.status !== 'ארכיון');

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
