import type { Alert, KPI, ProjectRequiringAttention, StatusDistribution } from '../types';

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
