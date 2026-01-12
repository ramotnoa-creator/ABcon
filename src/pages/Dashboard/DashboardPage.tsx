import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import KPICards from '../../components/Dashboard/KPICards';
import AlertsSection from '../../components/Dashboard/AlertsSection';
import StatusChart from '../../components/Dashboard/StatusChart';
import ProjectsTable from '../../components/Dashboard/ProjectsTable';
import MilestonesKPICard from '../../components/Dashboard/MilestonesKPICard';
import {
  dashboardKPIs,
  dashboardAlerts,
  statusDistribution,
  projectsRequiringAttention,
} from '../../data/dashboardData';
import {
  getLastMonthCompletedMilestones,
  getNextMonthPendingMilestones,
} from '../../data/milestonesQueries';

export default function DashboardPage() {
  const [isVisible, setIsVisible] = useState(false);

  // Milestone data for KPI cards
  const lastMonthMilestones = useMemo(() => getLastMonthCompletedMilestones(), []);
  const nextMonthMilestones = useMemo(() => getNextMonthPendingMilestones(), []);

  useEffect(() => {
    // Trigger entrance animation after mount
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex-1 px-4 lg:px-10 py-6 max-w-[1400px] mx-auto w-full pb-20 lg:pb-6">
      {/* Header with Actions */}
      <div 
        className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 transition-all duration-500 ease-smooth ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
          לוח בקרה ניהולי
        </h1>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/projects"
            className="group flex items-center justify-center h-10 px-4 rounded-lg bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 text-sm font-bold text-text-main-light dark:text-text-main-dark btn-press hover:shadow-md"
          >
            <span className="material-symbols-outlined me-2 text-[18px] transition-transform duration-200 group-hover:scale-110">list</span>
            מעבר לרשימת פרויקטים
          </Link>
          <Link
            to="/projects/new"
            className="group flex items-center justify-center h-10 px-4 rounded-lg bg-primary text-white hover:bg-primary-hover transition-all duration-200 text-sm font-bold btn-press hover:shadow-lg hover:shadow-primary/25"
          >
            <span className="material-symbols-outlined me-2 text-[18px] transition-transform duration-200 group-hover:rotate-90">add</span>
            יצירת פרויקט חדש
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards kpis={dashboardKPIs} />

      {/* Milestones KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <MilestonesKPICard
          title="אבני דרך שהושלמו (30 יום אחרונים)"
          icon="check_circle"
          color="green"
          milestones={lastMonthMilestones}
          emptyMessage="אין אבני דרך שהושלמו בחודש האחרון"
        />
        <MilestonesKPICard
          title="אבני דרך קרובות (30 יום הבאים)"
          icon="schedule"
          color="orange"
          milestones={nextMonthMilestones}
          emptyMessage="אין אבני דרך מתוכננות ל-30 הימים הקרובים"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Alerts Section - Left Column */}
        <div className="lg:col-span-1">
          <AlertsSection alerts={dashboardAlerts} />
        </div>

        {/* Status Chart - Middle Column */}
        <div className="lg:col-span-2">
          <StatusChart distribution={statusDistribution} />
        </div>
      </div>

      {/* Projects Requiring Attention Table */}
      <ProjectsTable projects={projectsRequiringAttention} />
    </div>
  );
}
