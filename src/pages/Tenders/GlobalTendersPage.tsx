import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllTenders } from '../../data/tendersStorage';
import { getTenderParticipants } from '../../data/tenderParticipantsStorage';
import { getProjects } from '../../data/storage';
import { getProfessionals } from '../../data/professionalsStorage';
import { formatDateForDisplay } from '../../utils/dateUtils';
import type { Tender, TenderStatus, TenderType, TenderParticipant, Project, Professional } from '../../types';

const statusLabels: Record<TenderStatus, string> = {
  Draft: 'טיוטה',
  Open: 'פתוח',
  Closed: 'סגור',
  WinnerSelected: 'זוכה נבחר',
  Canceled: 'בוטל',
};

const statusColors: Record<TenderStatus, string> = {
  Draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200',
  Open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  Closed: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-200',
  WinnerSelected: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  Canceled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
};

const tenderTypeLabels: Record<TenderType, string> = {
  architect: 'אדריכל',
  engineer: 'מהנדס',
  contractor: 'קבלן',
  electrician: 'חשמלאי',
  plumber: 'אינסטלטור',
  interior_designer: 'מעצב פנים',
  other: 'אחר',
};

const formatCurrency = (amount?: number): string => {
  if (amount === undefined || amount === null) return '-';
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

interface TenderWithDetails extends Tender {
  project?: Project;
  participants: TenderParticipant[];
  winnerProfessional?: Professional;
  priceStats?: {
    min: number;
    max: number;
    avg: number;
    count: number;
  };
}

interface KPICardProps {
  icon: string;
  label: string;
  value: string;
  subValue?: string;
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

function KPICard({ icon, label, value, subValue, color }: KPICardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-4 flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <div className={`size-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
          {label}
        </span>
      </div>
      <div className="text-2xl font-black text-text-main-light dark:text-text-main-dark mb-1">
        {value}
      </div>
      {subValue && (
        <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
          {subValue}
        </div>
      )}
    </div>
  );
}

export default function GlobalTendersPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TenderStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<TenderType | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load all data
  const tendersWithDetails = useMemo((): TenderWithDetails[] => {
    const tenders = getAllTenders();
    const projects = getProjects();
    const professionals = getProfessionals();

    return tenders.map((tender) => {
      const project = projects.find((p) => p.id === tender.project_id);
      const participants = getTenderParticipants(tender.id);
      const winnerProfessional = tender.winner_professional_id
        ? professionals.find((p) => p.id === tender.winner_professional_id)
        : undefined;

      // Calculate price stats
      const prices = participants
        .filter((p) => p.total_amount && p.total_amount > 0)
        .map((p) => p.total_amount as number);

      const priceStats =
        prices.length > 0
          ? {
              min: Math.min(...prices),
              max: Math.max(...prices),
              avg: prices.reduce((sum, p) => sum + p, 0) / prices.length,
              count: prices.length,
            }
          : undefined;

      return {
        ...tender,
        project,
        participants,
        winnerProfessional,
        priceStats,
      };
    });
  }, []);

  // Calculate KPIs
  const kpiData = useMemo(() => {
    const total = tendersWithDetails.length;
    const open = tendersWithDetails.filter((t) => t.status === 'Open').length;
    const withWinner = tendersWithDetails.filter((t) => t.status === 'WinnerSelected').length;
    const totalParticipants = tendersWithDetails.reduce((sum, t) => sum + t.participants.length, 0);

    // Calculate total contracted value (from winners)
    const totalContractedValue = tendersWithDetails.reduce((sum, t) => {
      if (t.status === 'WinnerSelected') {
        const winner = t.participants.find((p) => p.is_winner);
        return sum + (winner?.total_amount || 0);
      }
      return sum;
    }, 0);

    return {
      total,
      open,
      withWinner,
      totalParticipants,
      avgParticipants: total > 0 ? (totalParticipants / total).toFixed(1) : '0',
      totalContractedValue,
    };
  }, [tendersWithDetails]);

  // Filter tenders
  const filteredTenders = useMemo(() => {
    let filtered = tendersWithDetails;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.tender_name.toLowerCase().includes(query) ||
          t.project?.project_name.toLowerCase().includes(query) ||
          t.winner_professional_name?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((t) => t.tender_type === typeFilter);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return filtered;
  }, [tendersWithDetails, searchQuery, statusFilter, typeFilter]);

  // Pagination
  const paginatedTenders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTenders.slice(start, start + itemsPerPage);
  }, [filteredTenders, currentPage]);

  const totalPages = Math.ceil(filteredTenders.length / itemsPerPage);

  // Navigate to project tender tab
  const handleTenderClick = useCallback(
    (tender: TenderWithDetails) => {
      navigate(`/projects/${tender.project_id}?tab=tenders`);
    },
    [navigate]
  );

  return (
    <div className="flex-1 px-4 lg:px-10 py-6 max-w-[1400px] mx-auto w-full pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
          מכרזים - סקירה גלובלית
        </h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KPICard
          icon="gavel"
          label="סה״כ מכרזים"
          value={kpiData.total.toString()}
          subValue="בכל הפרויקטים"
          color="blue"
        />
        <KPICard
          icon="schedule"
          label="מכרזים פתוחים"
          value={kpiData.open.toString()}
          subValue="ממתינים להצעות"
          color="orange"
        />
        <KPICard
          icon="emoji_events"
          label="עם זוכה"
          value={kpiData.withWinner.toString()}
          subValue="מכרזים שהסתיימו"
          color="green"
        />
        <KPICard
          icon="people"
          label="משתתפים"
          value={kpiData.totalParticipants.toString()}
          subValue={`ממוצע ${kpiData.avgParticipants} למכרז`}
          color="purple"
        />
        <KPICard
          icon="payments"
          label="סה״כ חוזים"
          value={formatCurrency(kpiData.totalContractedValue)}
          subValue="מזוכי מכרזים"
          color="green"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary-light text-[20px]">
            search
          </span>
          <input
            className="w-full h-10 pr-10 pl-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
            placeholder="חיפוש מכרז, פרויקט או זוכה..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="relative">
          <select
            className="w-full md:w-40 h-10 px-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary appearance-none"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as TenderStatus | 'all');
              setCurrentPage(1);
            }}
            aria-label="סינון לפי סטטוס"
          >
            <option value="all">כל הסטטוסים</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="relative">
          <select
            className="w-full md:w-40 h-10 px-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary appearance-none"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as TenderType | 'all');
              setCurrentPage(1);
            }}
            aria-label="סינון לפי סוג"
          >
            <option value="all">כל הסוגים</option>
            {Object.entries(tenderTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tenders List */}
      <div className="space-y-4">
        {paginatedTenders.length === 0 ? (
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-12 text-center">
            <span className="material-symbols-outlined text-[48px] mb-4 opacity-50">gavel</span>
            <p className="text-text-secondary-light dark:text-text-secondary-dark">אין מכרזים</p>
          </div>
        ) : (
          paginatedTenders.map((tender) => (
            <div
              key={tender.id}
              onClick={() => handleTenderClick(tender)}
              className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-5 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left side - Tender info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <h3 className="text-lg font-bold">{tender.tender_name}</h3>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${statusColors[tender.status]}`}
                    >
                      {statusLabels[tender.status]}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {tenderTypeLabels[tender.tender_type]}
                    </span>
                  </div>

                  {/* Project name */}
                  <div className="flex items-center gap-2 text-sm text-text-secondary-light dark:text-text-secondary-dark mb-2">
                    <span className="material-symbols-outlined text-[16px]">folder</span>
                    <span>{tender.project?.project_name || 'פרויקט לא ידוע'}</span>
                  </div>

                  {/* Dates */}
                  <div className="flex flex-wrap gap-4 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    {tender.publish_date && (
                      <span>
                        פרסום: {formatDateForDisplay(tender.publish_date)}
                      </span>
                    )}
                    {tender.due_date && (
                      <span className={new Date(tender.due_date) < new Date() && tender.status === 'Open' ? 'text-red-600' : ''}>
                        דדליין: {formatDateForDisplay(tender.due_date)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side - Stats and winner */}
                <div className="flex flex-col md:items-end gap-2">
                  {/* Winner */}
                  {tender.status === 'WinnerSelected' && tender.winner_professional_name && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-[18px]">
                        emoji_events
                      </span>
                      <span className="text-sm font-bold text-green-700 dark:text-green-300">
                        {tender.winner_professional_name}
                      </span>
                      {tender.participants.find((p) => p.is_winner)?.total_amount && (
                        <span className="text-sm text-green-600 dark:text-green-400">
                          ({formatCurrency(tender.participants.find((p) => p.is_winner)?.total_amount)})
                        </span>
                      )}
                    </div>
                  )}

                  {/* Participants count */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-text-secondary-light">people</span>
                      <span className="font-medium">{tender.participants.length} משתתפים</span>
                    </div>

                    {/* Price stats */}
                    {tender.priceStats && tender.priceStats.count >= 2 && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-600 dark:text-green-400 font-bold">
                          {formatCurrency(tender.priceStats.min)}
                        </span>
                        <span className="text-text-secondary-light">-</span>
                        <span className="text-red-500 dark:text-red-400 font-bold">
                          {formatCurrency(tender.priceStats.max)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredTenders.length > itemsPerPage && (
        <div className="flex items-center justify-between border-t border-border-light dark:border-border-dark pt-4 mt-6">
          <p className="text-sm text-text-secondary-light">
            מציג {Math.min((currentPage - 1) * itemsPerPage + 1, filteredTenders.length)}-
            {Math.min(currentPage * itemsPerPage, filteredTenders.length)} מתוך {filteredTenders.length} מכרזים
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-border-light dark:border-border-dark text-sm hover:bg-white dark:hover:bg-surface-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="עמוד קודם"
            >
              הקודם
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1 rounded border border-border-light dark:border-border-dark text-sm hover:bg-white dark:hover:bg-surface-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="עמוד הבא"
            >
              הבא
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
