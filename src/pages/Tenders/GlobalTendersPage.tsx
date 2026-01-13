import { useState, useMemo } from 'react';
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

// Export to CSV function
const exportToCSV = (tenders: TenderWithDetails[], filename: string) => {
  // CSV Headers
  const headers = [
    'שם המכרז',
    'פרויקט',
    'סוג',
    'סטטוס',
    'תאריך דדליין',
    'זוכה',
    'תקציב משוער',
    'סכום חוזה',
    'חיסכון',
    'מספר משתתפים',
    'הצעה נמוכה',
    'הצעה גבוהה',
    'הערות ניהול',
  ];

  // Convert tenders to CSV rows
  const rows = tenders.map((tender) => {
    const winnerQuote = tender.participants.find((p) => p.is_winner)?.total_amount;
    return [
      tender.tender_name,
      tender.project?.project_name || '',
      tenderTypeLabels[tender.tender_type],
      statusLabels[tender.status],
      tender.due_date || '',
      tender.winner_professional_name || '',
      tender.estimated_budget?.toString() || '',
      tender.contract_amount?.toString() || winnerQuote?.toString() || '',
      tender.savings?.toString() || '',
      tender.participants.length.toString(),
      tender.priceStats?.min?.toString() || '',
      tender.priceStats?.max?.toString() || '',
      tender.management_remarks || '',
    ];
  });

  // Build CSV content with BOM for Excel Hebrew support
  const BOM = '\uFEFF';
  const csvContent = BOM + [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => {
        // Escape quotes and wrap in quotes if contains comma or newline
        const escaped = cell.replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    ),
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

interface ParticipantWithProfessional extends TenderParticipant {
  professional?: Professional;
}

// Extended tender type with project and participant details
type TenderWithDetails = Tender & {
  project?: Project;
  participants: ParticipantWithProfessional[];
  winnerProfessional?: Professional;
  priceStats?: {
    min: number;
    max: number;
    avg: number;
    count: number;
    lowestParticipantId?: string;
  };
  // Computed savings
  savings?: number; // estimated_budget - contract_amount
};

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
  const [expandedTenderId, setExpandedTenderId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load all data
  const tendersWithDetails = useMemo((): TenderWithDetails[] => {
    const tenders = getAllTenders();
    const projects = getProjects();
    const professionals = getProfessionals();

    const tendersData = tenders.map((tender) => {
      const project = projects.find((p) => p.id === tender.project_id);
      const rawParticipants = getTenderParticipants(tender.id);

      // Attach professional data to participants
      const participants: ParticipantWithProfessional[] = rawParticipants.map((p) => ({
        ...p,
        professional: professionals.find((prof) => prof.id === p.professional_id),
      }));

      // Sort participants by price (lowest first)
      participants.sort((a, b) => {
        if (a.total_amount && b.total_amount) return a.total_amount - b.total_amount;
        if (a.total_amount && !b.total_amount) return -1;
        if (!a.total_amount && b.total_amount) return 1;
        return 0;
      });

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
              lowestParticipantId: participants.find((p) => p.total_amount === Math.min(...prices))?.id,
            }
          : undefined;

      // Calculate savings
      const savings = tender.estimated_budget && tender.contract_amount
        ? tender.estimated_budget - tender.contract_amount
        : undefined;

      return {
        ...tender,
        project,
        participants,
        winnerProfessional,
        priceStats,
        savings,
      };
    });

    return tendersData;
  }, []);

  // Calculate KPIs
  const kpiData = useMemo(() => {
    const total = tendersWithDetails.length;
    const open = tendersWithDetails.filter((t) => t.status === 'Open').length;
    const withWinner = tendersWithDetails.filter((t) => t.status === 'WinnerSelected').length;
    const totalParticipants = tendersWithDetails.reduce((sum, t) => sum + t.participants.length, 0);

    // Calculate overdue tenders (open and past due date)
    const today = new Date();
    const overdue = tendersWithDetails.filter((t) =>
      t.status === 'Open' && t.due_date && new Date(t.due_date) < today
    ).length;

    // Calculate total contracted value (from contract_amount or winner's quote)
    const totalContractedValue = tendersWithDetails.reduce((sum, t) => {
      if (t.status === 'WinnerSelected') {
        if (t.contract_amount) {
          return sum + t.contract_amount;
        }
        const winner = t.participants.find((p) => p.is_winner);
        return sum + (winner?.total_amount || 0);
      }
      return sum;
    }, 0);

    // Calculate total savings
    const totalSavings = tendersWithDetails.reduce((sum, t) => {
      if (t.savings !== undefined) {
        return sum + t.savings;
      }
      return sum;
    }, 0);

    // Count tenders with savings data
    const tendersWithSavings = tendersWithDetails.filter((t) => t.savings !== undefined).length;

    return {
      total,
      open,
      withWinner,
      totalParticipants,
      avgParticipants: total > 0 ? (totalParticipants / total).toFixed(1) : '0',
      totalContractedValue,
      overdue,
      totalSavings,
      tendersWithSavings,
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

  // Toggle expand
  const toggleExpand = (tenderId: string) => {
    setExpandedTenderId(expandedTenderId === tenderId ? null : tenderId);
  };

  return (
    <div className="flex-1 px-4 lg:px-10 py-6 max-w-[1400px] mx-auto w-full pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
          מכרזים - סקירה גלובלית
        </h1>
        <button
          onClick={() => exportToCSV(filteredTenders, `מכרזים_${new Date().toISOString().split('T')[0]}`)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-sm font-bold"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          יצוא לאקסל
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
          subValue={kpiData.overdue > 0 ? `${kpiData.overdue} באיחור!` : "ממתינים להצעות"}
          color={kpiData.overdue > 0 ? "red" : "orange"}
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
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
        <KPICard
          icon="payments"
          label="סה״כ חוזים"
          value={formatCurrency(kpiData.totalContractedValue)}
          subValue="סכום כל החוזים"
          color="blue"
        />
        <KPICard
          icon="savings"
          label="סה״כ חיסכון"
          value={formatCurrency(kpiData.totalSavings)}
          subValue={kpiData.tendersWithSavings > 0 ? `מ-${kpiData.tendersWithSavings} מכרזים עם תקציב` : "אין נתוני תקציב"}
          color={kpiData.totalSavings >= 0 ? "green" : "red"}
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
          paginatedTenders.map((tender) => {
            const isExpanded = expandedTenderId === tender.id;

            return (
              <div
                key={tender.id}
                className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden transition-all"
              >
                {/* Header - Clickable */}
                <div
                  onClick={() => toggleExpand(tender.id)}
                  className="p-5 cursor-pointer hover:bg-background-light/50 dark:hover:bg-background-dark/50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left side - Tender info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <span className={`material-symbols-outlined text-[20px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                          expand_more
                        </span>
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
                      <div className="flex items-center gap-2 text-sm text-text-secondary-light dark:text-text-secondary-dark mb-2 mr-8">
                        <span className="material-symbols-outlined text-[16px]">folder</span>
                        <span>{tender.project?.project_name || 'פרויקט לא ידוע'}</span>
                      </div>

                      {/* Dates */}
                      <div className="flex flex-wrap gap-4 text-xs text-text-secondary-light dark:text-text-secondary-dark mr-8">
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

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-border-light dark:border-border-dark">
                    {/* Management Details */}
                    {(tender.estimated_budget || tender.contract_amount || tender.management_remarks) && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border-b border-border-light dark:border-border-dark">
                        <p className="text-xs font-bold text-amber-800 dark:text-amber-200 mb-3">
                          <span className="material-symbols-outlined text-[14px] me-1 align-middle">admin_panel_settings</span>
                          נתוני ניהול
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {tender.estimated_budget && (
                            <div>
                              <p className="text-xs text-amber-600 dark:text-amber-300 mb-1">תקציב משוער</p>
                              <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
                                {formatCurrency(tender.estimated_budget)}
                              </p>
                            </div>
                          )}
                          {tender.contract_amount && (
                            <div>
                              <p className="text-xs text-amber-600 dark:text-amber-300 mb-1">סכום חוזה</p>
                              <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
                                {formatCurrency(tender.contract_amount)}
                              </p>
                            </div>
                          )}
                          {tender.savings !== undefined && (
                            <div>
                              <p className="text-xs text-amber-600 dark:text-amber-300 mb-1">חיסכון</p>
                              <p className={`text-sm font-bold ${tender.savings >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {formatCurrency(tender.savings)}
                                {tender.estimated_budget && (
                                  <span className="text-xs font-normal ms-1">
                                    ({((tender.savings / tender.estimated_budget) * 100).toFixed(1)}%)
                                  </span>
                                )}
                              </p>
                            </div>
                          )}
                          {tender.management_remarks && (
                            <div className="col-span-2 md:col-span-1">
                              <p className="text-xs text-amber-600 dark:text-amber-300 mb-1">הערות ניהול</p>
                              <p className="text-sm text-amber-800 dark:text-amber-200">
                                {tender.management_remarks}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Price Statistics */}
                    {tender.priceStats && tender.priceStats.count >= 2 && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border-b border-border-light dark:border-border-dark">
                        <p className="text-xs font-bold text-blue-800 dark:text-blue-200 mb-3">
                          <span className="material-symbols-outlined text-[14px] me-1 align-middle">analytics</span>
                          סיכום הצעות מחיר ({tender.priceStats.count} הצעות)
                        </p>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-xs text-blue-600 dark:text-blue-300 mb-1">הנמוך ביותר</p>
                            <p className="text-base font-bold text-green-600 dark:text-green-400">
                              {formatCurrency(tender.priceStats.min)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-blue-600 dark:text-blue-300 mb-1">ממוצע</p>
                            <p className="text-base font-bold text-blue-700 dark:text-blue-300">
                              {formatCurrency(Math.round(tender.priceStats.avg))}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-blue-600 dark:text-blue-300 mb-1">הגבוה ביותר</p>
                            <p className="text-base font-bold text-red-500 dark:text-red-400">
                              {formatCurrency(tender.priceStats.max)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Participants List */}
                    <div className="p-4">
                      <h4 className="text-sm font-bold text-text-secondary-light dark:text-text-secondary-dark mb-3">
                        משתתפים במכרז - ממוין לפי מחיר
                      </h4>

                      {tender.participants.length === 0 ? (
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark text-center py-4">
                          אין משתתפים במכרז
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {tender.participants.map((participant) => {
                            const isBestPrice = tender.priceStats?.lowestParticipantId === participant.id && !participant.is_winner;

                            return (
                              <div
                                key={participant.id}
                                className={`flex items-center justify-between p-3 rounded-lg border ${
                                  participant.is_winner
                                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30'
                                    : isBestPrice
                                    ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-300 dark:border-emerald-900/30'
                                    : 'bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark'
                                }`}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  {participant.is_winner && (
                                    <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-[20px]">
                                      emoji_events
                                    </span>
                                  )}
                                  {isBestPrice && (
                                    <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[20px]">
                                      trending_down
                                    </span>
                                  )}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-bold text-sm">
                                        {participant.professional?.professional_name || 'לא ידוע'}
                                      </p>
                                      {participant.is_winner && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                          זוכה
                                        </span>
                                      )}
                                      {isBestPrice && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                          הצעה הזולה ביותר
                                        </span>
                                      )}
                                    </div>
                                    {participant.professional?.company_name && (
                                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                        {participant.professional.company_name}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                      <span>{participant.professional?.field}</span>
                                      {participant.quote_file && (
                                        <a
                                          href={participant.quote_file}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                          <span className="material-symbols-outlined text-[14px] align-middle">attach_file</span>
                                          קובץ הצעה
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {participant.total_amount && (
                                    <span className={`font-bold text-sm ${
                                      participant.is_winner
                                        ? 'text-green-600 dark:text-green-400'
                                        : isBestPrice
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-primary'
                                    }`}>
                                      {formatCurrency(participant.total_amount)}
                                    </span>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/professionals/${participant.professional_id}`);
                                    }}
                                    className="p-1.5 rounded hover:bg-white dark:hover:bg-surface-dark transition-colors text-text-secondary-light hover:text-primary"
                                    title="צפייה בפרופיל"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* View in Project Button */}
                      <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/projects/${tender.project_id}?tab=tenders`);
                          }}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-bold"
                        >
                          <span className="material-symbols-outlined text-[18px]">folder_open</span>
                          צפה בפרויקט
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
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
