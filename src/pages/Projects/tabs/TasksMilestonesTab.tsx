import { useState, useEffect, useMemo } from 'react';
import type { Project, ScheduleItem, CostItem } from '../../../types';
import { getScheduleItemsByProject, confirmMilestoneForSchedule } from '../../../services/paymentSchedulesService';
import { getCostItems } from '../../../services/costsService';
import ScheduleItemStatusBadge from '../../../components/Costs/ScheduleItemStatusBadge';

interface TasksMilestonesTabProps {
  project: Project;
}

// ============================================================
// DATA - Based on real client Gantt + Added Milestones
// ============================================================
const projectData = {
  projectName: 'פרויקט רחוב הנביאים - 6 דירות',
  startDate: '2025-08-01',
  endDate: '2026-02-28',
  todayDate: '2025-09-01',

  apartments: [
    {
      id: 'apt_12',
      name: 'דירה 1+2',
      color: 'bg-blue-500',
      colorLight: 'bg-blue-50',
      colorText: 'text-blue-600',
      icon: 'home',
      milestones: [
        {
          id: 'm1',
          name: 'סיום גבס',
          date: '2025-09-22',
          status: 'pending' as const,
          afterTask: 8,
          budgetLink: 'קבלן גבס - תשלום 2',
        },
        {
          id: 'm2',
          name: 'סיום ריצוף וחיפוי',
          date: '2025-10-22',
          status: 'pending' as const,
          afterTask: 17,
          budgetLink: 'קבלן ריצוף - תשלום סופי',
        },
        { id: 'm3', name: 'סיום צבע', date: '2025-11-13', status: 'pending' as const, afterTask: 5 },
        {
          id: 'm4',
          name: 'סיום מטבח',
          date: '2026-01-15',
          status: 'pending' as const,
          afterTask: 30,
          budgetLink: 'ספק מטבח - תשלום סופי',
        },
        {
          id: 'm5',
          name: 'מסירת דירה',
          date: '2026-01-15',
          status: 'pending' as const,
          afterTask: 33,
          budgetLink: 'שחרור ערבות',
        },
      ],
      tasks: [
        {
          id: 1,
          name: 'גמר גבס',
          start: '2025-09-02',
          end: '2025-09-15',
          duration: '10 ימים',
          status: 'pending' as const,
          resource: 'קבלן גבס',
          progress: 0,
          type: 'גבס',
        },
        {
          id: 7,
          name: 'השחלות חשמל',
          start: '2025-09-16',
          end: '2025-09-22',
          duration: '5 ימים',
          status: 'pending' as const,
          resource: 'חשמלאי',
          progress: 0,
          type: 'חשמל',
          predecessor: 1,
        },
        {
          id: 8,
          name: 'פתיחת גופי תאורה בגבס',
          start: '2025-09-16',
          end: '2025-09-22',
          duration: '5 ימים',
          status: 'pending' as const,
          resource: 'קבלן גבס',
          progress: 0,
          type: 'גבס',
          predecessor: 1,
        },
        {
          id: 14,
          name: "ריצוף סוג ב' אמבטיות",
          start: '2025-09-04',
          end: '2025-09-09',
          duration: '4 ימים',
          status: 'pending' as const,
          resource: 'קבלן ריצוף',
          progress: 0,
          type: 'ריצוף',
        },
        {
          id: 16,
          name: 'ריצוף אבן',
          start: '2025-09-21',
          end: '2025-09-28',
          duration: '4 ימים',
          status: 'pending' as const,
          resource: 'קבלן ריצוף',
          progress: 0,
          type: 'ריצוף',
        },
        {
          id: 17,
          name: 'חיפוי',
          start: '2025-09-29',
          end: '2025-10-22',
          duration: '11 ימים',
          status: 'pending' as const,
          resource: 'קבלן ריצוף',
          progress: 0,
          type: 'ריצוף',
          predecessor: 16,
        },
        {
          id: 4,
          name: 'שפכטל+צבע יד ראשונה',
          start: '2025-09-10',
          end: '2025-09-30',
          duration: '13 ימים',
          status: 'pending' as const,
          resource: 'קבלן צבע',
          progress: 0,
          type: 'צבע',
        },
        {
          id: 5,
          name: 'צבע סופי',
          start: '2025-11-09',
          end: '2025-11-13',
          duration: '5 ימים',
          status: 'pending' as const,
          resource: 'קבלן צבע',
          progress: 0,
          type: 'צבע',
        },
        {
          id: 28,
          name: 'התקנת ארונות מטבח',
          start: '2025-12-07',
          end: '2025-12-10',
          duration: '4 ימים',
          status: 'pending' as const,
          resource: 'ספק מטבח',
          progress: 0,
          type: 'מטבח',
        },
        {
          id: 30,
          name: 'התקנת שיש מטבח',
          start: '2026-01-14',
          end: '2026-01-15',
          duration: '1 יום',
          status: 'pending' as const,
          resource: 'ספק שיש',
          progress: 0,
          type: 'מטבח',
          predecessor: 28,
        },
        {
          id: 31,
          name: 'התקנת פרקט',
          start: '2025-11-27',
          end: '2025-12-02',
          duration: '4 ימים',
          status: 'pending' as const,
          resource: 'קבלן פרקט',
          progress: 0,
          type: 'גמר',
        },
        {
          id: 32,
          name: 'התקנת דלתות פנים',
          start: '2025-12-04',
          end: '2025-12-07',
          duration: '2 ימים',
          status: 'pending' as const,
          resource: 'נגר',
          progress: 0,
          type: 'גמר',
          predecessor: 31,
        },
        {
          id: 33,
          name: 'ביקורת חח"י',
          start: '2025-12-08',
          end: '2025-12-08',
          duration: '1 יום',
          status: 'pending' as const,
          resource: 'מנהל פרויקט',
          progress: 0,
          type: 'ביקורת',
          predecessor: 32,
        },
      ],
    },
    {
      id: 'apt_6',
      name: 'דירה 6',
      color: 'bg-green-500',
      colorLight: 'bg-green-50',
      colorText: 'text-green-600',
      icon: 'home',
      milestones: [
        { id: 'm6', name: 'סיום גבס', date: '2025-09-18', status: 'pending' as const, afterTask: 38 },
        { id: 'm7', name: 'סיום ריצוף וחיפוי', date: '2025-09-16', status: 'pending' as const, afterTask: 47 },
        { id: 'm8', name: 'סיום מטבח', date: '2025-12-22', status: 'pending' as const, afterTask: 59 },
        { id: 'm9', name: 'מסירת דירה', date: '2025-12-22', status: 'pending' as const, afterTask: 62 },
      ],
      tasks: [
        {
          id: 34,
          name: 'גמר עבודות גבס',
          start: '2025-08-17',
          end: '2025-09-11',
          duration: '18 ימים',
          status: 'in-progress' as const,
          resource: 'קבלן גבס',
          progress: 60,
          type: 'גבס',
        },
        {
          id: 36,
          name: 'שפכטל+צבע יד ראשונה',
          start: '2025-09-12',
          end: '2025-10-02',
          duration: '15 ימים',
          status: 'pending' as const,
          resource: 'קבלן צבע',
          progress: 0,
          type: 'צבע',
          predecessor: 34,
        },
        {
          id: 38,
          name: 'פתיחת ג"ת בגבס',
          start: '2025-09-12',
          end: '2025-09-18',
          duration: '3 ימים',
          status: 'pending' as const,
          resource: 'קבלן גבס',
          progress: 0,
          type: 'גבס',
          predecessor: 34,
        },
        {
          id: 44,
          name: "ריצוף סוג ב' אמבטיות",
          start: '2025-08-28',
          end: '2025-09-02',
          duration: '4 ימים',
          status: 'in-progress' as const,
          resource: 'קבלן ריצוף',
          progress: 40,
          type: 'ריצוף',
        },
        {
          id: 47,
          name: 'חיפוי קירות חדר רחצה',
          start: '2025-09-09',
          end: '2025-09-16',
          duration: '4 ימים',
          status: 'pending' as const,
          resource: 'קבלן ריצוף',
          progress: 0,
          type: 'ריצוף',
        },
        {
          id: 49,
          name: 'צבע סופי',
          start: '2025-11-20',
          end: '2025-11-25',
          duration: '4 ימים',
          status: 'pending' as const,
          resource: 'קבלן צבע',
          progress: 0,
          type: 'צבע',
        },
        {
          id: 58,
          name: 'התקנת מטבח',
          start: '2025-11-26',
          end: '2025-11-27',
          duration: '2 ימים',
          status: 'pending' as const,
          resource: 'ספק מטבח',
          progress: 0,
          type: 'מטבח',
        },
        {
          id: 59,
          name: 'התקנת שיש מטבח',
          start: '2025-12-21',
          end: '2025-12-22',
          duration: '1 יום',
          status: 'pending' as const,
          resource: 'ספק שיש',
          progress: 0,
          type: 'מטבח',
        },
        {
          id: 61,
          name: 'התקנת פרקט',
          start: '2025-11-30',
          end: '2025-12-03',
          duration: '4 ימים',
          status: 'pending' as const,
          resource: 'קבלן פרקט',
          progress: 0,
          type: 'גמר',
        },
        {
          id: 62,
          name: 'התקנת דלתות פנים',
          start: '2025-12-07',
          end: '2025-12-10',
          duration: '2 ימים',
          status: 'pending' as const,
          resource: 'נגר',
          progress: 0,
          type: 'גמר',
        },
      ],
    },
    {
      id: 'apt_35',
      name: 'דירה 3-5',
      color: 'bg-purple-500',
      colorLight: 'bg-purple-50',
      colorText: 'text-purple-600',
      icon: 'apartment',
      milestones: [
        { id: 'm10', name: 'סיום ריצוף וחיפוי', date: '2025-09-22', status: 'pending' as const, afterTask: 74 },
        { id: 'm11', name: 'סיום צבע', date: '2026-01-28', status: 'pending' as const, afterTask: 89 },
        { id: 'm12', name: 'סיום מטבח', date: '2025-12-22', status: 'pending' as const, afterTask: 85 },
        { id: 'm13', name: 'מסירת דירה', date: '2026-01-28', status: 'pending' as const, afterTask: 89 },
      ],
      tasks: [
        {
          id: 65,
          name: 'צבע יד ראשונה',
          start: '2025-10-05',
          end: '2025-10-20',
          duration: '10 ימים',
          status: 'pending' as const,
          resource: 'קבלן צבע',
          progress: 0,
          type: 'צבע',
        },
        {
          id: 69,
          name: "ריצוף סוג ב'",
          start: '2025-08-24',
          end: '2025-08-31',
          duration: '5 ימים',
          status: 'in-progress' as const,
          resource: 'קבלן ריצוף',
          progress: 80,
          type: 'ריצוף',
        },
        {
          id: 73,
          name: 'ריצוף אבן',
          start: '2025-09-07',
          end: '2025-09-14',
          duration: '5 ימים',
          status: 'pending' as const,
          resource: 'קבלן ריצוף',
          progress: 0,
          type: 'ריצוף',
        },
        {
          id: 74,
          name: 'חיפוי אבן',
          start: '2025-09-15',
          end: '2025-09-22',
          duration: '5 ימים',
          status: 'pending' as const,
          resource: 'קבלן ריצוף',
          progress: 0,
          type: 'ריצוף',
        },
        {
          id: 83,
          name: 'ארונות מטבח',
          start: '2025-11-16',
          end: '2025-11-23',
          duration: '5 ימים',
          status: 'pending' as const,
          resource: 'ספק מטבח',
          progress: 0,
          type: 'מטבח',
        },
        {
          id: 85,
          name: 'התקנת שיש מטבח',
          start: '2025-12-21',
          end: '2025-12-22',
          duration: '1 יום',
          status: 'pending' as const,
          resource: 'ספק שיש',
          progress: 0,
          type: 'מטבח',
        },
        {
          id: 86,
          name: 'התקנת פרקט',
          start: '2025-12-28',
          end: '2026-01-05',
          duration: '6 ימים',
          status: 'pending' as const,
          resource: 'קבלן פרקט',
          progress: 0,
          type: 'גמר',
        },
        {
          id: 87,
          name: 'התקנת דלתות פנים',
          start: '2026-01-07',
          end: '2026-01-14',
          duration: '5 ימים',
          status: 'pending' as const,
          resource: 'נגר',
          progress: 0,
          type: 'גמר',
        },
        {
          id: 89,
          name: 'צבע סופי',
          start: '2026-01-19',
          end: '2026-01-28',
          duration: '7 ימים',
          status: 'pending' as const,
          resource: 'קבלן צבע',
          progress: 0,
          type: 'צבע',
        },
      ],
    },
    {
      id: 'common',
      name: 'שטחים משותפים',
      color: 'bg-amber-500',
      colorLight: 'bg-amber-50',
      colorText: 'text-amber-600',
      icon: 'stairs',
      milestones: [
        {
          id: 'm14',
          name: 'ביקורת חח"י ציבורי',
          date: '2025-11-12',
          status: 'pending' as const,
          afterTask: 111,
        },
        { id: 'm15', name: 'סיום מעלית', date: '2025-12-11', status: 'pending' as const, afterTask: 127 },
        { id: 'm16', name: 'סיום חניון רובוטי', date: '2025-12-28', status: 'pending' as const, afterTask: 95 },
        {
          id: 'm17',
          name: 'טופס 4',
          date: '2026-02-02',
          status: 'pending' as const,
          afterTask: 99,
          budgetLink: 'אישור אכלוס',
        },
      ],
      tasks: [
        {
          id: 90,
          name: 'התקנת מעלית',
          start: '2025-10-12',
          end: '2025-11-11',
          duration: '21 ימים',
          status: 'pending' as const,
          resource: 'קבלן מעלית',
          progress: 0,
          type: 'מעלית',
        },
        {
          id: 127,
          name: 'הרצת תא מעלית',
          start: '2025-11-13',
          end: '2025-12-11',
          duration: '21 ימים',
          status: 'pending' as const,
          resource: 'קבלן מעלית',
          progress: 0,
          type: 'מעלית',
        },
        {
          id: 94,
          name: 'גמר חניון רובוטי שלב א',
          start: '2025-11-06',
          end: '2025-12-16',
          duration: '28 ימים',
          status: 'pending' as const,
          resource: 'קבלן חניון',
          progress: 0,
          type: 'חניון',
        },
        {
          id: 95,
          name: 'גמר חניון רובוטי הפעלה',
          start: '2025-12-21',
          end: '2025-12-28',
          duration: '5 ימים',
          status: 'pending' as const,
          resource: 'קבלן חניון',
          progress: 0,
          type: 'חניון',
        },
        {
          id: 96,
          name: 'טרצו חדר מדרגות',
          start: '2025-09-28',
          end: '2025-10-17',
          duration: '14 ימים',
          status: 'pending' as const,
          resource: 'קבלן ריצוף',
          progress: 0,
          type: 'מדרגות',
        },
        {
          id: 98,
          name: 'שליכט חדר מדרגות',
          start: '2025-10-21',
          end: '2025-10-30',
          duration: '6 ימים',
          status: 'pending' as const,
          resource: 'קבלן טיח',
          progress: 0,
          type: 'מדרגות',
        },
        {
          id: 107,
          name: 'תאורה ציבורי',
          start: '2025-10-31',
          end: '2025-11-04',
          duration: '3 ימים',
          status: 'pending' as const,
          resource: 'חשמלאי',
          progress: 0,
          type: 'חשמל',
        },
        {
          id: 108,
          name: 'גילוי אש',
          start: '2025-11-05',
          end: '2025-11-06',
          duration: '2 ימים',
          status: 'pending' as const,
          resource: 'קבלן בטיחות',
          progress: 0,
          type: 'בטיחות',
        },
        {
          id: 111,
          name: 'ביקורת ציבורי חח"י',
          start: '2025-11-12',
          end: '2025-11-12',
          duration: '1 יום',
          status: 'pending' as const,
          resource: 'מנהל פרויקט',
          progress: 0,
          type: 'ביקורת',
        },
        {
          id: 99,
          name: 'שליכט שימור גרם מדרגות',
          start: '2026-01-29',
          end: '2026-02-02',
          duration: '3 ימים',
          status: 'pending' as const,
          resource: 'קבלן טיח',
          progress: 0,
          type: 'גמר',
        },
      ],
    },
  ],
};

type TaskStatus = 'pending' | 'in-progress' | 'completed';

interface Milestone {
  id: string;
  name: string;
  date: string;
  status: TaskStatus;
  afterTask: number;
  budgetLink?: string;
}

interface Task {
  id: number;
  name: string;
  start: string;
  end: string;
  duration: string;
  status: TaskStatus;
  resource: string;
  progress: number;
  type: string;
  predecessor?: number;
}

interface Apartment {
  id: string;
  name: string;
  color: string;
  colorLight: string;
  colorText: string;
  icon: string;
  milestones: Milestone[];
  tasks: Task[];
}

// ============================================================
// HELPERS
// ============================================================
const parseDate = (dateStr: string) => new Date(dateStr);
const daysBetween = (start: string, end: string) =>
  Math.ceil((parseDate(end).getTime() - parseDate(start).getTime()) / (1000 * 60 * 60 * 24));
const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
};
const formatFullDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear().toString().slice(2)}`;
};

const getMonths = (startDate: string, endDate: string) => {
  const months: { name: string; year: number }[] = [];
  const monthNames = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    months.push({ name: monthNames[current.getMonth()], year: current.getFullYear() });
    current.setMonth(current.getMonth() + 1);
  }
  return months;
};

const typeColors: Record<string, string> = {
  גבס: 'bg-slate-400',
  חשמל: 'bg-yellow-400',
  ריצוף: 'bg-emerald-400',
  צבע: 'bg-pink-400',
  מטבח: 'bg-orange-400',
  גמר: 'bg-indigo-400',
  ביקורת: 'bg-red-400',
  מעלית: 'bg-cyan-400',
  חניון: 'bg-violet-400',
  מדרגות: 'bg-amber-400',
  בטיחות: 'bg-rose-400',
};

// ============================================================
// COMPONENTS
// ============================================================

const StatusIcon = ({ status }: { status: TaskStatus }) => {
  if (status === 'completed')
    return <span className="material-symbols-outlined text-[16px] text-green-500">check_circle</span>;
  if (status === 'in-progress')
    return <span className="material-symbols-outlined text-[16px] text-blue-500">schedule</span>;
  return <span className="material-symbols-outlined text-[16px] text-gray-300">circle</span>;
};

const StatusBadge = ({ status }: { status: TaskStatus }) => {
  const config = {
    completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'הושלם' },
    'in-progress': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'בביצוע' },
    pending: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'ממתין' },
  };
  const c = config[status] || config.pending;
  return <span className={`px-2 py-0.5 text-xs rounded-full ${c.bg} ${c.text}`}>{c.label}</span>;
};

const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="w-full bg-gray-200 rounded-full h-1.5">
    <div
      className={`rounded-full h-1.5 transition-all ${progress === 100 ? 'bg-green-500' : progress > 0 ? 'bg-blue-500' : 'bg-gray-300'}`}
      style={{ width: `${progress}%` }}
    />
  </div>
);

// ============================================================
// VIEW: MILESTONES LIST
// ============================================================
const MilestonesListView = ({ apartments }: { apartments: Apartment[] }) => {
  const [expandedApts, setExpandedApts] = useState<Set<string>>(new Set(['apt_12']));

  const toggleApt = (id: string) => {
    const newSet = new Set(expandedApts);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedApts(newSet);
  };

  return (
    <div className="space-y-3">
      {apartments.map((apt) => {
        const overallProgress = Math.round(
          apt.tasks.reduce((sum, t) => sum + t.progress, 0) / apt.tasks.length
        );
        const isExpanded = expandedApts.has(apt.id);

        return (
          <div
            key={apt.id}
            className={`bg-white dark:bg-surface-dark rounded-xl border overflow-hidden ${apt.id === 'apt_12' ? 'ring-2 ring-blue-200' : 'border-gray-200 dark:border-border-dark'}`}
          >
            {/* Apartment Header */}
            <div
              className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-background-dark ${apt.colorLight}`}
              onClick={() => toggleApt(apt.id)}
            >
              <div
                className={`w-10 h-10 rounded-xl ${apt.color} flex items-center justify-center shadow-sm`}
              >
                <span className="material-symbols-outlined text-white text-[20px]">{apt.icon}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 dark:text-white">{apt.name}</h3>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {apt.tasks.length} משימות • {apt.milestones.length} אבני דרך
                </div>
              </div>
              <div className="text-left ml-4">
                <div className="text-xl font-bold text-gray-800 dark:text-white">{overallProgress}%</div>
                <div className="w-20">
                  <ProgressBar progress={overallProgress} />
                </div>
              </div>
              <span
                className={`material-symbols-outlined text-gray-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
              >
                expand_more
              </span>
            </div>

            {/* Expanded: Milestones + Tasks */}
            {isExpanded && (
              <div className="border-t border-gray-200 dark:border-border-dark">
                {apt.milestones.map((milestone, mIdx) => {
                  const lastTasks = apt.tasks.filter((t) => {
                    const prevMilestone = apt.milestones[mIdx - 1];
                    return t.id <= milestone.afterTask && (!prevMilestone || t.id > prevMilestone.afterTask);
                  });

                  return (
                    <div key={milestone.id}>
                      {/* Milestone Row */}
                      <div
                        className={`flex items-center gap-3 p-3 ${apt.colorLight} border-b border-gray-200 dark:border-border-dark`}
                      >
                        <div className={`w-6 h-6 rotate-45 ${apt.color} rounded-sm shadow-sm`} />
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 dark:text-white">{milestone.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                            {formatFullDate(milestone.date)}
                            {milestone.budgetLink && (
                              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px]">
                                💰 {milestone.budgetLink}
                              </span>
                            )}
                          </div>
                        </div>
                        <StatusBadge status={milestone.status} />
                      </div>

                      {/* Tasks under this milestone */}
                      {lastTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 py-2 px-4 border-b border-gray-100 dark:border-border-dark hover:bg-gray-50 dark:hover:bg-background-dark mr-6"
                        >
                          <StatusIcon status={task.status} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 font-mono">#{task.id}</span>
                              <span className="text-sm text-gray-700 dark:text-gray-200">{task.name}</span>
                            </div>
                            <div className="mt-1 w-24">
                              <ProgressBar progress={task.progress} />
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <span>{task.duration}</span>
                            {task.resource && (
                              <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                <span className="material-symbols-outlined text-[12px]">people</span>
                                {task.resource}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ============================================================
// VIEW: GANTT CHART
// ============================================================
const GanttBar = ({
  task,
  projectStart,
  totalDays,
}: {
  task: Task;
  projectStart: string;
  totalDays: number;
}) => {
  const startOffset = daysBetween(projectStart, task.start);
  const duration = daysBetween(task.start, task.end);
  const left = (startOffset / totalDays) * 100;
  const width = (duration / totalDays) * 100;
  const color = typeColors[task.type] || 'bg-gray-400';

  return (
    <div
      className={`absolute h-6 rounded shadow-sm ${color} ${task.status === 'in-progress' ? 'ring-2 ring-blue-400' : 'opacity-80'} hover:opacity-100 cursor-pointer group`}
      style={{ left: `${left}%`, width: `${Math.max(width, 1.5)}%`, top: '4px' }}
      title={`${task.name}\n${formatDate(task.start)} - ${formatDate(task.end)}`}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white text-[9px] font-medium truncate px-1">
          {task.name.substring(0, 12)}
        </span>
      </div>
      {task.progress > 0 && (
        <div
          className="absolute bottom-0 left-0 h-1 bg-white/50 rounded-b"
          style={{ width: `${task.progress}%` }}
        />
      )}
    </div>
  );
};

const MilestoneDiamond = ({
  milestone,
  projectStart,
  totalDays,
  color,
}: {
  milestone: Milestone;
  projectStart: string;
  totalDays: number;
  color: string;
}) => {
  const offset = daysBetween(projectStart, milestone.date);
  const left = (offset / totalDays) * 100;

  return (
    <div
      className="absolute flex flex-col items-center cursor-pointer group z-10"
      style={{ left: `${left}%`, transform: 'translateX(-50%)', top: '-2px' }}
    >
      <div
        className={`w-4 h-4 rotate-45 ${color} border-2 border-white shadow-md group-hover:scale-125 transition-transform`}
      />
      <div className="absolute top-6 whitespace-nowrap bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
        {milestone.name}
        <br />
        {formatDate(milestone.date)}
      </div>
    </div>
  );
};

const GanttView = ({
  apartments,
  projectStart,
  totalDays,
  todayDate,
  months,
}: {
  apartments: Apartment[];
  projectStart: string;
  totalDays: number;
  todayDate: string;
  months: { name: string; year: number }[];
}) => {
  const [expandedApts, setExpandedApts] = useState<Set<string>>(new Set(['apt_12']));
  const todayOffset = (daysBetween(projectStart, todayDate) / totalDays) * 100;

  const toggleApt = (id: string) => {
    const newSet = new Set(expandedApts);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedApts(newSet);
  };

  return (
    <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-border-dark overflow-hidden">
      {/* Header */}
      <div className="flex border-b border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-background-dark">
        <div className="w-48 flex-shrink-0 p-2 border-l border-gray-200 dark:border-border-dark text-xs font-medium text-gray-600 dark:text-gray-300">
          יחידה / משימה
        </div>
        <div className="flex-1 flex">
          {months.map((month, i) => (
            <div key={i} className="flex-1 text-center py-2 border-l border-gray-100 dark:border-border-dark">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-200">{month.name}</div>
              <div className="text-[10px] text-gray-400">{month.year}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        {/* Today line */}
        <div
          className="absolute top-0 bottom-0 z-20 pointer-events-none"
          style={{ left: `calc(192px + ${todayOffset}% * (100% - 192px) / 100)` }}
        >
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
            היום
          </div>
          <div className="w-0.5 h-full bg-red-500" />
        </div>

        {apartments.map((apt) => {
          const isExpanded = expandedApts.has(apt.id);

          return (
            <div key={apt.id} className="border-b border-gray-200 dark:border-border-dark">
              {/* Apt Header */}
              <div
                className={`flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-background-dark ${apt.colorLight}`}
                onClick={() => toggleApt(apt.id)}
              >
                <div className="w-48 flex-shrink-0 p-2 border-l border-gray-200 dark:border-border-dark flex items-center gap-2">
                  <span
                    className={`material-symbols-outlined text-gray-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                  >
                    expand_more
                  </span>
                  <div className={`w-6 h-6 rounded ${apt.color} flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-white text-[14px]">{apt.icon}</span>
                  </div>
                  <span className="font-medium text-sm text-gray-800 dark:text-white">{apt.name}</span>
                </div>
                <div className="flex-1 relative h-10">
                  {apt.milestones.map((m) => (
                    <MilestoneDiamond
                      key={m.id}
                      milestone={m}
                      projectStart={projectStart}
                      totalDays={totalDays}
                      color={apt.color}
                    />
                  ))}
                </div>
              </div>

              {/* Tasks */}
              {isExpanded &&
                apt.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex border-t border-gray-100 dark:border-border-dark hover:bg-gray-50 dark:hover:bg-background-dark"
                  >
                    <div className="w-48 flex-shrink-0 p-2 border-l border-gray-200 dark:border-border-dark text-xs text-gray-600 dark:text-gray-300 truncate pr-6">
                      <span className="text-gray-400 font-mono">#{task.id}</span> {task.name}
                    </div>
                    <div className="flex-1 relative h-8">
                      <GanttBar task={task} projectStart={projectStart} totalDays={totalDays} />
                    </div>
                  </div>
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================
// VIEW: TIMELINE
// ============================================================
const TimelineView = ({ apartments }: { apartments: Apartment[] }) => {
  const allMilestones = apartments
    .flatMap((a) =>
      a.milestones.map((m) => ({ ...m, apartment: a.name, color: a.color, colorText: a.colorText }))
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="relative pr-8">
      <div className="absolute top-0 bottom-0 right-4 w-1 bg-gradient-to-b from-blue-400 via-purple-400 to-amber-400 rounded-full" />
      <div className="space-y-4">
        {allMilestones.map((milestone) => (
          <div key={milestone.id} className="relative flex items-start gap-4">
            <div className={`absolute right-1.5 w-5 h-5 rotate-45 ${milestone.color} border-2 border-white shadow-md`} />
            <div
              className={`flex-1 bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-border-dark p-4 mr-6 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-[16px] ${milestone.colorText}`}>flag</span>
                  <span className="font-bold text-gray-800 dark:text-white">{milestone.name}</span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{formatFullDate(milestone.date)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded-full ${milestone.color} text-white`}>
                  {milestone.apartment}
                </span>
                <StatusBadge status={milestone.status} />
                {milestone.budgetLink && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                    💰 {milestone.budgetLink}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// SUMMARY CARDS
// ============================================================
const SummaryCards = ({ apartments }: { apartments: Apartment[] }) => {
  const totalMilestones = apartments.reduce((sum, a) => sum + a.milestones.length, 0);
  const totalTasks = apartments.reduce((sum, a) => sum + a.tasks.length, 0);
  const completedTasks = apartments.reduce(
    (sum, a) => sum + a.tasks.filter((t) => t.status === 'completed').length,
    0
  );
  const inProgressTasks = apartments.reduce(
    (sum, a) => sum + a.tasks.filter((t) => t.status === 'in-progress').length,
    0
  );
  const overallProgress = Math.round(
    apartments.reduce((sum, a) => sum + a.tasks.reduce((s, t) => s + t.progress, 0), 0) / totalTasks
  );

  const stats = [
    { value: totalMilestones, label: 'אבני דרך', icon: 'flag', color: 'text-orange-600', bg: 'bg-orange-50' },
    { value: totalTasks, label: 'משימות', icon: 'list', color: 'text-blue-600', bg: 'bg-blue-50' },
    { value: inProgressTasks, label: 'בביצוע', icon: 'schedule', color: 'text-purple-600', bg: 'bg-purple-50' },
    {
      value: completedTasks,
      label: 'הושלמו',
      icon: 'check_circle',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      value: `${overallProgress}%`,
      label: 'התקדמות',
      icon: 'bar_chart',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-3 mb-4">
      {stats.map((stat, i) => (
        <div key={i} className={`${stat.bg} rounded-xl p-3 border border-gray-200 dark:border-border-dark`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`material-symbols-outlined text-[16px] ${stat.color}`}>{stat.icon}</span>
          </div>
          <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">{stat.label}</div>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function TasksMilestonesTab({ project: _project }: TasksMilestonesTabProps) {
  const [view, setView] = useState<'milestones' | 'gantt' | 'timeline'>('milestones');
  const [filterApt, setFilterApt] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Payment milestone confirmation state
  const [pendingScheduleItems, setPendingScheduleItems] = useState<ScheduleItem[]>([]);
  const [costItemsMap, setCostItemsMap] = useState<Record<string, CostItem>>({});
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmNote, setConfirmNote] = useState('');
  const [showConfirmToast, setShowConfirmToast] = useState(false);

  useEffect(() => {
    const loadScheduleData = async () => {
      try {
        const [sItems, cItems] = await Promise.all([
          getScheduleItemsByProject(_project.id),
          getCostItems(_project.id),
        ]);
        // Only show items that have a milestone linked and are pending
        setPendingScheduleItems(
          sItems.filter((si) => si.milestone_id && si.status === 'pending')
        );
        const map: Record<string, CostItem> = {};
        for (const ci of cItems) map[ci.id] = ci;
        setCostItemsMap(map);
      } catch (error) {
        console.error('Error loading schedule items for milestone confirmations:', error);
      }
    };
    loadScheduleData();
  }, [_project.id]);

  const handleConfirmMilestone = async (scheduleItemId: string) => {
    try {
      await confirmMilestoneForSchedule(scheduleItemId, 'מנהל פרויקט', confirmNote || undefined);
      setPendingScheduleItems((prev) => prev.filter((si) => si.id !== scheduleItemId));
      setConfirmingId(null);
      setConfirmNote('');
      setShowConfirmToast(true);
      setTimeout(() => setShowConfirmToast(false), 3000);
    } catch (error) {
      console.error('Error confirming milestone:', error);
    }
  };

  const { startDate, endDate, todayDate, apartments } = projectData;
  const totalDays = daysBetween(startDate, endDate);
  const months = useMemo(() => getMonths(startDate, endDate), [startDate, endDate]);

  const filteredApartments = filterApt === 'all' ? apartments : apartments.filter((a) => a.id === filterApt);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-border-dark p-4">
        <div className="flex items-center justify-end mb-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover text-sm shadow-sm">
            <span className="material-symbols-outlined text-[18px]">upload</span>
            יבוא מ-MS Project
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex bg-gray-100 dark:bg-background-dark rounded-lg p-1">
              {[
                { id: 'milestones' as const, icon: 'flag', label: 'אבני דרך' },
                { id: 'gantt' as const, icon: 'bar_chart', label: 'גאנט' },
                { id: 'timeline' as const, icon: 'account_tree', label: 'ציר זמן' },
              ].map((v) => (
                <button
                  key={v.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${view === v.id ? 'bg-white dark:bg-surface-dark shadow text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                  onClick={() => setView(v.id)}
                >
                  <span className="material-symbols-outlined text-[16px]">{v.icon}</span>
                  {v.label}
                </button>
              ))}
            </div>

            {/* Filter */}
            <select
              value={filterApt}
              onChange={(e) => setFilterApt(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-border-dark rounded-lg text-sm bg-white dark:bg-surface-dark"
            >
              <option value="all">כל היחידות</option>
              {apartments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[16px] text-gray-400">
              search
            </span>
            <input
              type="text"
              placeholder="חיפוש..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 pl-4 py-2 border border-gray-200 dark:border-border-dark rounded-lg text-sm w-48 bg-white dark:bg-surface-dark"
            />
          </div>
        </div>
      </div>

      <SummaryCards apartments={apartments} />

      {/* Views */}
      {view === 'milestones' && <MilestonesListView apartments={filteredApartments} />}
      {view === 'gantt' && (
        <GanttView
          apartments={filteredApartments}
          projectStart={startDate}
          totalDays={totalDays}
          todayDate={todayDate}
          months={months}
        />
      )}
      {view === 'timeline' && <TimelineView apartments={filteredApartments} />}

      {/* Payment Milestone Confirmations */}
      {pendingScheduleItems.length > 0 && (
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-blue-200 dark:border-blue-800 overflow-hidden">
          <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-3 border-b border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-blue-600 dark:text-blue-400">payments</span>
              <h3 className="text-sm font-bold text-blue-900 dark:text-blue-100">
                אישורי אבני דרך לתשלום
              </h3>
              <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {pendingScheduleItems.length}
              </span>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              אבני דרך שמקושרות ללוח תשלומים וממתינות לאישור השלמה
            </p>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {pendingScheduleItems.map((si) => {
              const costItem = costItemsMap[si.cost_item_id];
              return (
                <div key={si.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-[14px] text-emerald-500">flag</span>
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {si.milestone_name || si.description}
                        </span>
                        <ScheduleItemStatusBadge status={si.status} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        {costItem && <span>פריט: {costItem.name}</span>}
                        <span>סכום: {new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 0 }).format(si.amount)}</span>
                        {si.target_date && (
                          <span>תאריך יעד: {new Date(si.target_date).toLocaleDateString('he-IL')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {confirmingId === si.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={confirmNote}
                            onChange={(e) => setConfirmNote(e.target.value)}
                            placeholder="הערה (אופציונלי)"
                            className="px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark text-xs w-40"
                          />
                          <button
                            onClick={() => handleConfirmMilestone(si.id)}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors"
                          >
                            אשר
                          </button>
                          <button
                            onClick={() => { setConfirmingId(null); setConfirmNote(''); }}
                            className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            ביטול
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmingId(si.id)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          אשר אבן דרך
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showConfirmToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 text-sm font-semibold animate-bounce">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          אבן דרך אושרה בהצלחה
        </div>
      )}

      {/* Legend */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-border-dark p-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="font-medium text-gray-600 dark:text-gray-300">מקרא:</span>
          {Object.entries(typeColors)
            .slice(0, 6)
            .map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <div className={`w-3 h-2 rounded ${color}`} />
                <span className="text-gray-600 dark:text-gray-400">{type}</span>
              </div>
            ))}
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rotate-45 bg-orange-500" />
            <span className="text-gray-600 dark:text-gray-400">אבן דרך</span>
          </div>
        </div>
      </div>
    </div>
  );
}
