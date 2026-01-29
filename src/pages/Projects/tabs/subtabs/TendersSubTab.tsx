import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../../contexts/ToastContext';
import {
  getTenders,
  updateTender,
  createTender,
  deleteTender,
} from '../../../../services/tendersService';
import { getEstimate } from '../../../../services/estimatesService';
import {
  getTenderParticipants,
  addTenderParticipants,
  updateTenderParticipant,
  removeTenderParticipant,
  setTenderWinner,
  clearTenderWinner,
} from '../../../../services/tenderParticipantsService';
import { getProfessionals } from '../../../../services/professionalsService';
import { createProjectProfessional } from '../../../../services/projectProfessionalsService';
import { getMilestones } from '../../../../services/milestonesService';
import { getBudgetCategories } from '../../../../services/budgetCategoriesService';
import { getBudgetChapters } from '../../../../services/budgetChaptersService';
import { createBudgetItem, getNextBudgetItemOrder, calculateBudgetItemTotals } from '../../../../services/budgetItemsService';
import { getBOMFile } from '../../../../services/bomFilesService';
import BOMUploader from '../../../../components/Tenders/BOMUploader';
import SendBOMEmailModal from '../../../../components/Tenders/SendBOMEmailModal';
import WinnerSelectionModal from '../../../../components/Tenders/WinnerSelectionModal';
// File upload functions - TODO: Implement file storage service
const uploadTenderQuote = async (_tenderId: string, _participantId: string, _file: File): Promise<string> => {
  throw new Error('File upload service not configured');
};

const getFileNameFromUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  return url.split('/').pop() || '';
};
import { findChapterForTender } from '../../../../utils/tenderChapterMapping';
import type { Project, Tender, TenderStatus, TenderType, TenderParticipant, Professional, BOMFile } from '../../../../types';
import { formatDateForDisplay } from '../../../../utils/dateUtils';

interface TendersSubTabProps {
  project: Project;
}

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

const professionalFieldToTenderType: Record<string, TenderType> = {
  'אדריכלות': 'architect',
  'הנדסה': 'engineer',
  'קבלנות': 'contractor',
  'חשמל': 'electrician',
  'אינסטלציה': 'plumber',
  'עיצוב פנים': 'interior_designer',
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

const getTodayISO = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Async data loading functions
async function loadInitialTenders(projectId: string): Promise<Tender[]> {
  const loaded = await getTenders(projectId);
  return loaded;
}

async function loadInitialProfessionals(): Promise<Professional[]> {
  const professionals = await getProfessionals();
  // Return all professionals (including inactive) to show winners who may have been deactivated
  return professionals;
}

async function loadParticipantsMap(tenders: Tender[]): Promise<Record<string, TenderParticipant[]>> {
  const map: Record<string, TenderParticipant[]> = {};
  await Promise.all(
    tenders.map(async (tender) => {
      map[tender.id] = await getTenderParticipants(tender.id);
    })
  );
  return map;
}

export default function TendersSubTab({ project }: TendersSubTabProps) {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [allProfessionals, setAllProfessionals] = useState<Professional[]>([]);
  const [participantsMap, setParticipantsMap] = useState<Record<string, TenderParticipant[]>>({});
  const [milestones, setMilestones] = useState<any[]>([]);
  const [estimatesMap, setEstimatesMap] = useState<Record<string, any>>({});
  const [bomFilesMap, setBomFilesMap] = useState<Record<string, BOMFile | null>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isAddTenderModalOpen, setIsAddTenderModalOpen] = useState(false);
  const [isProfessionalPickerOpen, setIsProfessionalPickerOpen] = useState(false);
  const [isSelectWinnerModalOpen, setIsSelectWinnerModalOpen] = useState(false);
  const [isParticipantDetailsOpen, setIsParticipantDetailsOpen] = useState(false);
  const [isSendBOMModalOpen, setIsSendBOMModalOpen] = useState(false);
  const [isVariancePreviewModalOpen, setIsVariancePreviewModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Open modal near the clicked button
  const openModalNearButton = (e: React.MouseEvent, openFn: (v: boolean) => void) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const modalEstimatedHeight = window.innerHeight * 0.7; // Assume modal is max 70vh
    const viewportHeight = window.innerHeight;
    const padding = 16; // Minimum padding from screen edges

    // Try to position below the button first
    let top = rect.bottom + 8;

    // Check if modal would overflow below viewport
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow < modalEstimatedHeight + padding) {
      // Not enough space below, try to position above the button
      if (spaceAbove > spaceBelow && spaceAbove > 300) {
        // Position above the button
        top = Math.max(padding, rect.top - modalEstimatedHeight - 8);
      } else {
        // Not enough space above either, center it in viewport with padding
        top = Math.max(padding, Math.min(
          rect.bottom + 8,
          viewportHeight - modalEstimatedHeight - padding
        ));
      }
    }

    // Ensure modal doesn't go above viewport
    top = Math.max(padding, top);

    // Calculate horizontal position
    const left = Math.max(padding, Math.min(rect.left, window.innerWidth - 460 - padding));

    setModalPosition({ top, left });
    openFn(true);
  };

  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<TenderParticipant | null>(null);

  // File upload state
  const [uploadingFile, setUploadingFile] = useState(false);

  // Form states
  const [tenderForm, setTenderForm] = useState({
    tender_name: '',
    tender_type: 'contractor' as TenderType,
    description: '',
    due_date: '',
    milestone_id: '',
    estimated_budget: '',
  });

  const [professionalPickerFilter, setProfessionalPickerFilter] = useState<TenderType | 'all'>('all');
  const [selectedProfessionalIds, setSelectedProfessionalIds] = useState<string[]>([]);

  const [participantForm, setParticipantForm] = useState({
    quote_file: '',
    total_amount: '',
    notes: '',
  });

  // Winner selection form - for contract_amount and management_remarks
  const [winnerForm, setWinnerForm] = useState({
    contract_amount: '',
    management_remarks: '',
  });
  const [selectedWinnerParticipant, setSelectedWinnerParticipant] = useState<TenderParticipant | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [loadedTenders, loadedProfessionals, loadedMilestones] = await Promise.all([
          loadInitialTenders(project.id),
          loadInitialProfessionals(),
          getMilestones(project.id),
        ]);
        setTenders(loadedTenders);
        setAllProfessionals(loadedProfessionals);
        setMilestones(loadedMilestones);
        const participants = await loadParticipantsMap(loadedTenders);
        setParticipantsMap(participants);

        // Load estimates for tenders that have estimate_id
        const estimatesData: Record<string, any> = {};
        const bomFilesData: Record<string, BOMFile | null> = {};
        await Promise.all(
          loadedTenders.map(async (tender) => {
            if (tender.estimate_id) {
              const estimate = await getEstimate(tender.estimate_id);
              if (estimate) {
                estimatesData[tender.id] = estimate;
              }
            }
            if (tender.bom_file_id) {
              const bomFile = await getBOMFile(tender.bom_file_id);
              bomFilesData[tender.id] = bomFile;
            }
          })
        );
        setEstimatesMap(estimatesData);
        setBomFilesMap(bomFilesData);
      } catch (error: unknown) {
        console.error('Error loading tenders data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [project.id]);

  const loadTenders = useCallback(async () => {
    const loaded = await loadInitialTenders(project.id);
    setTenders(loaded);
    const participants = await loadParticipantsMap(loaded);
    setParticipantsMap(participants);
  }, [project.id]);

  const loadProfessionals = useCallback(async () => {
    const loaded = await loadInitialProfessionals();
    setAllProfessionals(loaded);
  }, []);

  const refreshData = useCallback(async () => {
    await loadTenders();
    loadProfessionals();
  }, [loadTenders, loadProfessionals]);
  void refreshData; // Available for refresh button

  // Filter professionals by tender type
  const getFilteredProfessionals = (typeFilter: TenderType | 'all'): Professional[] => {
    if (typeFilter === 'all') return allProfessionals;

    return allProfessionals.filter((prof) => {
      const mappedType = professionalFieldToTenderType[prof.field];
      return mappedType === typeFilter || (!mappedType && typeFilter === 'other');
    });
  };

  // Get available professionals (not already participants)
  const getAvailableProfessionals = (tender: Tender, typeFilter: TenderType | 'all'): Professional[] => {
    const participants = participantsMap[tender.id] || [];
    const participantProfIds = participants.map((p) => p.professional_id);
    const filtered = getFilteredProfessionals(typeFilter);
    return filtered.filter((p) => !participantProfIds.includes(p.id));
  };

  // Check if deadline passed
  const isDeadlinePassed = (tender: Tender): boolean => {
    if (!tender.due_date) return false;
    return new Date(tender.due_date) < new Date();
  };

  // Handle add tender
  const handleAddTender = async () => {
    if (!tenderForm.tender_name.trim()) return;

    const tenderData: Omit<Tender, 'id' | 'created_at' | 'updated_at'> = {
      project_id: project.id,
      tender_name: tenderForm.tender_name.trim(),
      tender_type: tenderForm.tender_type,
      description: tenderForm.description.trim() || undefined,
      status: 'Open',
      publish_date: new Date().toISOString(),
      due_date: tenderForm.due_date || undefined,
      candidate_professional_ids: [],
      milestone_id: tenderForm.milestone_id || undefined,
      estimated_budget: tenderForm.estimated_budget ? parseFloat(tenderForm.estimated_budget) : undefined,
    };

    try {
      const newTender = await createTender(tenderData);
      await loadTenders();

      // Reset form and open professional picker
      setTenderForm({
        tender_name: '',
        tender_type: 'contractor',
        description: '',
        due_date: '',
        milestone_id: '',
        estimated_budget: '',
      });
      setIsAddTenderModalOpen(false);

      // Open professional picker for the new tender
      setSelectedTender(newTender);
      setProfessionalPickerFilter(newTender.tender_type);
      setSelectedProfessionalIds([]);
      setIsProfessionalPickerOpen(true);
      showSuccess('המכרז נוצר בהצלחה!');
    } catch (error: unknown) {
      console.error('Error creating tender:', error);
      showError('שגיאה ביצירת המכרז. אנא נסה שוב.');
    }
  };

  // Handle file upload for participant quote
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTender || !selectedParticipant) return;

    setUploadingFile(true);
    try {
      const url = await uploadTenderQuote(selectedTender.id, selectedParticipant.id, file);
      if (url) {
        setParticipantForm((prev) => ({ ...prev, quote_file: url }));
      }
    } catch (error: unknown) {
      console.error('Upload error:', error);
      showError('שגיאה בהעלאת הקובץ');
    } finally {
      setUploadingFile(false);
    }
  };

  // Handle add participants
  const handleAddParticipants = async () => {
    if (!selectedTender || selectedProfessionalIds.length === 0) return;

    try {
      await addTenderParticipants(selectedTender.id, selectedProfessionalIds);

      // Update tender's candidate_professional_ids for backwards compatibility
      const updatedCandidates = [
        ...selectedTender.candidate_professional_ids,
        ...selectedProfessionalIds,
      ];
      await updateTender(selectedTender.id, { candidate_professional_ids: updatedCandidates });

      await loadTenders();
      setIsProfessionalPickerOpen(false);
      setSelectedProfessionalIds([]);
      showSuccess('המועמדים נוספו למכרז בהצלחה!');
    } catch (error: unknown) {
      console.error('Error adding participants:', error);
      showError('שגיאה בהוספת מועמדים. אנא נסה שוב.');
    }
  };

  // Handle remove participant
  const handleRemoveParticipant = async (tender: Tender, professionalId: string) => {
    try {
      await removeTenderParticipant(tender.id, professionalId);

      const updatedCandidates = tender.candidate_professional_ids.filter((id) => id !== professionalId);
      await updateTender(tender.id, {
        candidate_professional_ids: updatedCandidates,
        ...(tender.winner_professional_id === professionalId && {
          winner_professional_id: undefined,
          winner_professional_name: undefined,
          status: tender.status === 'WinnerSelected' ? 'Open' : tender.status,
        }),
      });

      if (tender.winner_professional_id === professionalId) {
        await clearTenderWinner(tender.id);
      }

      await loadTenders();
      showSuccess('המועמד הוסר מהמכרז בהצלחה');
    } catch (error: unknown) {
      console.error('Error removing participant:', error);
      showError('שגיאה בהסרת מועמד. אנא נסה שוב.');
    }
  };

  // Handle select winner - Step 1: Select participant
  const handleSelectWinnerStep1 = (participant: TenderParticipant) => {
    setSelectedWinnerParticipant(participant);
    // Pre-fill contract amount with quote amount
    setWinnerForm({
      contract_amount: participant.total_amount?.toString() || '',
      management_remarks: '',
    });
  };

  // Handle select winner - Step 2: Confirm and save
  const handleSelectWinnerConfirm = async () => {
    if (!selectedTender || !selectedWinnerParticipant) return;

    const participant = selectedWinnerParticipant;
    const professional = allProfessionals.find((p) => p.id === participant.professional_id);
    if (!professional) return;

    const contractAmount = winnerForm.contract_amount ? parseFloat(winnerForm.contract_amount) : participant.total_amount;

    try {
      // Update participant as winner
      await setTenderWinner(selectedTender.id, participant.id);

      // Update tender with contract_amount and management_remarks
      await updateTender(selectedTender.id, {
        winner_professional_id: participant.professional_id,
        winner_professional_name: professional.professional_name,
        status: 'WinnerSelected',
        contract_amount: contractAmount,
        management_remarks: winnerForm.management_remarks.trim() || undefined,
      });

      const tender = selectedTender;

      // Create ProjectProfessional automatically
      const newProjectProfessional = {
        project_id: project.id,
        professional_id: participant.professional_id,
        project_role: undefined,
        source: 'Tender' as const,
        related_tender_id: tender.id,
        related_tender_name: tender.tender_name,
        is_active: true,
      };

      await createProjectProfessional(newProjectProfessional);

    // Auto-create budget item if we have a contract amount
    const budgetAmount = contractAmount || participant.total_amount;
    if (budgetAmount && budgetAmount > 0) {
      const [chapters, categories] = await Promise.all([
        getBudgetChapters(project.id),
        getBudgetCategories(project.id),
      ]);

      if (chapters.length > 0) {
        const chapterId = findChapterForTender(tender.tender_type, chapters, categories);

        if (chapterId) {
          const vatRate = 0.17;
          const totals = calculateBudgetItemTotals({
            quantity: 1,
            unit_price: budgetAmount,
            vat_rate: vatRate,
          });

          const order = await getNextBudgetItemOrder(project.id, chapterId);

          await createBudgetItem({
            project_id: project.id,
            chapter_id: chapterId,
            code: undefined,
            description: `${tender.tender_name} - ${professional.professional_name}`,
            unit: 'קומפלט',
            quantity: 1,
            unit_price: budgetAmount,
            total_price: totals.total_price,
            vat_rate: vatRate,
            vat_amount: totals.vat_amount,
            total_with_vat: totals.total_with_vat,
            status: 'contracted',
            supplier_id: professional.id,
            supplier_name: professional.professional_name,
            tender_id: tender.id,
            paid_amount: 0,
            order,
          });
        }
      }
    }

      await loadTenders();
      setIsSelectWinnerModalOpen(false);
      setSelectedTender(null);
      setSelectedWinnerParticipant(null);
      setWinnerForm({ contract_amount: '', management_remarks: '' });
      showSuccess('הזוכה נבחר בהצלחה!');
    } catch (error: unknown) {
      console.error('Error selecting winner:', error);
      showError('שגיאה בבחירת זוכה. אנא נסה שוב.');
    }
  };

  // Handle update participant details
  const handleUpdateParticipant = async () => {
    if (!selectedParticipant) return;

    try {
      await updateTenderParticipant(selectedParticipant.id, {
        quote_file: participantForm.quote_file.trim() || undefined,
        total_amount: participantForm.total_amount ? parseFloat(participantForm.total_amount) : undefined,
        notes: participantForm.notes.trim() || undefined,
      });

      await loadTenders();
      setIsParticipantDetailsOpen(false);
      setSelectedParticipant(null);
      setParticipantForm({ quote_file: '', total_amount: '', notes: '' });
      showSuccess('פרטי המועמד עודכנו בהצלחה!');
    } catch (error: unknown) {
      console.error('Error updating participant:', error);
      showError('שגיאה בעדכון פרטי מועמד. אנא נסה שוב.');
    }
  };

  // Open participant details modal
  const openParticipantDetails = (e: React.MouseEvent, tender: Tender, participant: TenderParticipant) => {
    setSelectedTender(tender);
    setSelectedParticipant(participant);
    setParticipantForm({
      quote_file: participant.quote_file || '',
      total_amount: participant.total_amount?.toString() || '',
      notes: participant.notes || '',
    });
    openModalNearButton(e, setIsParticipantDetailsOpen);
  };

  // Handle delete tender
  const handleDeleteTender = async (tender: Tender) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את המכרז "${tender.tender_name}"?`)) {
      return;
    }
    try {
      await deleteTender(tender.id);
      await loadTenders();
      showSuccess('המכרז נמחק בהצלחה');
    } catch (error: unknown) {
      console.error('Error deleting tender:', error);
      showError('שגיאה במחיקת המכרז. אנא נסה שוב.');
    }
  };

  // Get participant with professional data - sorted by price (lowest first)
  const getParticipantsWithProfessionals = (tender: Tender) => {
    const participants = participantsMap[tender.id] || [];
    const withProf = participants.map((p) => ({
      ...p,
      professional: allProfessionals.find((prof) => prof.id === p.professional_id),
    }));

    // Sort: participants with prices first (lowest to highest), then those without prices
    return withProf.sort((a, b) => {
      if (a.total_amount && b.total_amount) {
        return a.total_amount - b.total_amount;
      }
      if (a.total_amount && !b.total_amount) return -1;
      if (!a.total_amount && b.total_amount) return 1;
      return 0;
    });
  };

  // Calculate price statistics for a tender
  const getPriceStats = (tender: Tender) => {
    const participants = participantsMap[tender.id] || [];
    const prices = participants
      .filter((p) => p.total_amount && p.total_amount > 0)
      .map((p) => p.total_amount as number);

    if (prices.length === 0) return null;

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const lowestParticipantId = participants.find((p) => p.total_amount === min)?.id;

    return { min, max, avg, count: prices.length, lowestParticipantId };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-end">
        <button
          onClick={(e) => openModalNearButton(e, setIsAddTenderModalOpen)}
          className="flex items-center justify-center h-10 px-5 rounded-lg bg-primary text-white hover:bg-primary-hover transition text-sm font-bold tracking-[0.015em] shadow-sm"
          aria-label="הוסף מכרז חדש"
        >
          <span className="material-symbols-outlined me-2 text-[20px]" aria-hidden="true">add</span>
          הוסף מכרז
        </button>
      </div>

      {/* Tenders List */}
      {tenders.length === 0 ? (
        <div className="text-center py-12 text-text-secondary-light dark:text-text-secondary-dark">
          <span className="material-symbols-outlined text-[48px] mb-4 opacity-50">gavel</span>
          <p>אין מכרזים</p>
          <p className="text-sm mt-2">לחץ על "הוסף מכרז" כדי להתחיל</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tenders.map((tender) => {
            const participantsWithProf = getParticipantsWithProfessionals(tender);
            const winner = participantsWithProf.find((p) => p.is_winner);
            const deadlinePassed = isDeadlinePassed(tender);

            return (
              <div
                key={tender.id}
                className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6"
              >
                {/* Tender Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h4 className="text-lg font-bold">{tender.tender_name}</h4>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${statusColors[tender.status]}`}
                      >
                        {statusLabels[tender.status]}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {tenderTypeLabels[tender.tender_type]}
                      </span>
                      {deadlinePassed && tender.status === 'Open' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                          <span className="material-symbols-outlined text-[14px] me-1">warning</span>
                          עבר הדדליין
                        </span>
                      )}
                    </div>
                    {tender.description && (
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        {tender.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {tender.status !== 'WinnerSelected' && tender.status !== 'Canceled' && (
                      <button
                        onClick={(e) => {
                          setSelectedTender(tender);
                          setProfessionalPickerFilter(tender.tender_type);
                          setSelectedProfessionalIds([]);
                          openModalNearButton(e, setIsProfessionalPickerOpen);
                        }}
                        className="p-2 rounded-lg hover:bg-background-light dark:hover:bg-background-dark text-text-secondary-light hover:text-primary transition-colors"
                        title="הוסף משתתפים"
                        aria-label={`הוסף משתתפים למכרז ${tender.tender_name}`}
                      >
                        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">person_add</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTender(tender)}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-text-secondary-light hover:text-red-600 transition-colors"
                      title="מחק מכרז"
                      aria-label={`מחק מכרז ${tender.tender_name}`}
                    >
                      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">delete</span>
                    </button>
                  </div>
                </div>

                {/* Source Estimate (if tender was created from estimate) */}
                {tender.estimate_id && estimatesMap[tender.id] && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-900/30">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[16px]">
                        link
                      </span>
                      <span className="text-blue-700 dark:text-blue-300">נוצר מאומדן:</span>
                      <button
                        onClick={() => {
                          const estimateType = estimatesMap[tender.id].estimate_type;
                          navigate(`/projects/${project.id}?tab=financial&subtab=${estimateType}-estimate`);
                        }}
                        className="font-bold text-primary hover:underline"
                      >
                        {estimatesMap[tender.id].name}
                      </button>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {formatCurrency(tender.estimated_budget)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Tender Dates */}
                {(tender.publish_date || tender.due_date) && (
                  <div className="flex flex-wrap gap-4 mb-4 text-sm">
                    {tender.publish_date && (
                      <div>
                        <span className="text-text-secondary-light dark:text-text-secondary-dark">
                          תאריך פרסום:
                        </span>{' '}
                        <span className="font-medium">{formatDateForDisplay(tender.publish_date)}</span>
                      </div>
                    )}
                    {tender.due_date && (
                      <div className={deadlinePassed && tender.status === 'Open' ? 'text-red-600' : ''}>
                        <span className="text-text-secondary-light dark:text-text-secondary-dark">
                          דדליין:
                        </span>{' '}
                        <span className="font-medium">{formatDateForDisplay(tender.due_date)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Winner Section */}
                {winner && winner.professional && (
                  <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-900/30">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <p className="text-xs font-bold text-green-800 dark:text-green-200 mb-1">
                          <span className="material-symbols-outlined text-[14px] me-1 align-middle">emoji_events</span>
                          זוכה במכרז
                        </p>
                        <button
                          onClick={() => navigate(`/professionals/${winner.professional!.id}`)}
                          className="text-base font-bold text-green-900 dark:text-green-100 hover:underline hover:text-green-700 dark:hover:text-green-300 transition-colors text-right"
                        >
                          {winner.professional.professional_name}
                          {winner.professional.company_name && ` - ${winner.professional.company_name}`}
                        </button>
                        {winner.total_amount && (
                          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            הצעת מחיר: {formatCurrency(winner.total_amount)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => navigate(`/professionals/${winner.professional!.id}`)}
                        className="px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors text-sm font-bold"
                      >
                        צפייה בפרופיל
                      </button>
                    </div>
                  </div>
                )}

                {/* Price Statistics */}
                {(() => {
                  const stats = getPriceStats(tender);
                  if (!stats || stats.count < 2) return null;
                  return (
                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-900/30">
                      <p className="text-xs font-bold text-blue-800 dark:text-blue-200 mb-3">
                        <span className="material-symbols-outlined text-[14px] me-1 align-middle">analytics</span>
                        סיכום הצעות מחיר ({stats.count} הצעות)
                      </p>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xs text-blue-600 dark:text-blue-300 mb-1">הנמוך ביותר</p>
                          <p className="text-base font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(stats.min)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 dark:text-blue-300 mb-1">ממוצע</p>
                          <p className="text-base font-bold text-blue-700 dark:text-blue-300">
                            {formatCurrency(Math.round(stats.avg))}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 dark:text-blue-300 mb-1">הגבוה ביותר</p>
                          <p className="text-base font-bold text-red-500 dark:text-red-400">
                            {formatCurrency(stats.max)}
                          </p>
                        </div>
                      </div>
                      {stats.max - stats.min > 0 && (
                        <p className="text-xs text-blue-600 dark:text-blue-300 text-center mt-3">
                          פער: {formatCurrency(stats.max - stats.min)} ({Math.round(((stats.max - stats.min) / stats.min) * 100)}%)
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Participants List */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-bold text-text-secondary-light dark:text-text-secondary-dark">
                      משתתפים במכרז ({participantsWithProf.length}) - ממוין לפי מחיר
                    </h5>
                    {!winner && tender.status !== 'Canceled' && participantsWithProf.length > 0 && (
                      <button
                        onClick={(e) => {
                          setSelectedTender(tender);
                          openModalNearButton(e, setIsSelectWinnerModalOpen);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-bold"
                      >
                        <span className="material-symbols-outlined text-[16px] me-1 align-middle">
                          check_circle
                        </span>
                        בחר זוכה
                      </button>
                    )}
                  </div>

                  {participantsWithProf.length === 0 ? (
                    <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark py-4 text-center border-2 border-dashed border-border-light dark:border-border-dark rounded-lg">
                      אין משתתפים במכרז
                      {tender.status !== 'WinnerSelected' && tender.status !== 'Canceled' && (
                        <button
                          onClick={(e) => {
                            setSelectedTender(tender);
                            setProfessionalPickerFilter(tender.tender_type);
                            setSelectedProfessionalIds([]);
                            openModalNearButton(e, setIsProfessionalPickerOpen);
                          }}
                          className="block mx-auto mt-2 text-primary hover:underline font-bold"
                        >
                          הוסף משתתפים
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(() => {
                        const stats = getPriceStats(tender);
                        return participantsWithProf.map((participant, index) => {
                          if (!participant.professional) return null;
                          const isBestPrice = stats && participant.id === stats.lowestParticipantId && !participant.is_winner;

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
                                    <button
                                      onClick={() => navigate(`/professionals/${participant.professional!.id}`)}
                                      className="font-bold text-sm text-primary hover:underline hover:text-primary-hover transition-colors text-right"
                                    >
                                      {participant.professional.professional_name}
                                    </button>
                                    {isBestPrice && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                        הצעה הזולה ביותר
                                      </span>
                                    )}
                                    {participant.total_amount && index === 0 && stats && stats.count > 1 && (
                                      <span className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark">
                                        #{index + 1}
                                      </span>
                                    )}
                                  </div>
                                  {participant.professional.company_name && (
                                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                      {participant.professional.company_name}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                    <span>{participant.professional.field}</span>
                                    {participant.total_amount && (
                                      <span className={`font-bold ${isBestPrice ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'}`}>
                                        {formatCurrency(participant.total_amount)}
                                      </span>
                                    )}
                                    {participant.quote_file && (
                                      <span className="text-blue-600 dark:text-blue-400">
                                        <span className="material-symbols-outlined text-[14px] align-middle">attach_file</span>
                                        קובץ מצורף
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => openParticipantDetails(e, tender, participant)}
                                className="p-1.5 rounded hover:bg-background-light dark:hover:bg-surface-dark transition-colors text-text-secondary-light hover:text-primary"
                                title="פרטי הצעה"
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button
                                onClick={() => navigate(`/professionals/${participant.professional!.id}`)}
                                className="p-1.5 rounded hover:bg-background-light dark:hover:bg-surface-dark transition-colors text-text-secondary-light hover:text-primary"
                                title="צפייה בפרופיל"
                              >
                                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                              </button>
                              {!winner && (
                                <button
                                  onClick={() => handleRemoveParticipant(tender, participant.professional_id)}
                                  className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-text-secondary-light hover:text-red-600 transition-colors"
                                  title="הסר משתתף"
                                >
                                  <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                    </div>
                  )}
                </div>

                {/* BOM Section */}
                <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-bold">בל"מ (Bill of Materials)</h5>
                    {bomFilesMap[tender.id] && participantsWithProf.length > 0 && (
                      <button
                        onClick={() => {
                          setSelectedTender(tender);
                          setIsSendBOMModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-bold"
                      >
                        <span className="material-symbols-outlined text-[16px]">mail</span>
                        שלח בל"מ למשתתפים
                      </button>
                    )}
                  </div>
                  <BOMUploader
                    tenderId={tender.id}
                    currentBOM={bomFilesMap[tender.id]}
                    onUploadSuccess={async (bomFile) => {
                      if (bomFile) {
                        setBomFilesMap((prev) => ({ ...prev, [tender.id]: bomFile }));
                      } else {
                        setBomFilesMap((prev) => ({ ...prev, [tender.id]: null }));
                      }
                      await loadTenders();
                    }}
                  />
                </div>

                {/* Notes */}
                {tender.notes && (
                  <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark">
                    <p className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      הערות:
                    </p>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {tender.notes}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Tender Modal */}
      {isAddTenderModalOpen && createPortal(
        <>
          <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setIsAddTenderModalOpen(false)} />
          <div
            className="fixed z-50 bg-surface-light dark:bg-surface-dark rounded-xl shadow-xl border border-border-light dark:border-border-dark w-[90vw] max-w-md max-h-[70vh] overflow-y-auto"
            style={{ top: modalPosition.top, left: modalPosition.left }}
          >
            <div className="flex items-center justify-between p-6 border-b border-border-light dark:border-border-dark sticky top-0 bg-surface-light dark:bg-surface-dark">
              <h3 className="text-lg font-bold">הוספת מכרז חדש</h3>
              <button
                onClick={() => setIsAddTenderModalOpen(false)}
                className="size-8 flex items-center justify-center hover:bg-background-light dark:hover:bg-background-dark rounded transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">
                  שם המכרז <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="לדוגמה: מכרז קבלן שלד"
                  value={tenderForm.tender_name}
                  onChange={(e) => setTenderForm({ ...tenderForm, tender_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">
                  סוג מכרז <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  value={tenderForm.tender_type}
                  onChange={(e) => setTenderForm({ ...tenderForm, tender_type: e.target.value as TenderType })}
                >
                  {Object.entries(tenderTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">
                  דדליין <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  min={getTodayISO()}
                  value={tenderForm.due_date}
                  onChange={(e) => setTenderForm({ ...tenderForm, due_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">תקציב משוער (₪)</label>
                <input
                  type="number"
                  className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="לדוגמה: 500000"
                  value={tenderForm.estimated_budget}
                  onChange={(e) => setTenderForm({ ...tenderForm, estimated_budget: e.target.value })}
                />
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                  הערכת עלות לפני קבלת הצעות
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">תיאור</label>
                <textarea
                  className="w-full p-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary resize-none h-20"
                  placeholder="תיאור המכרז..."
                  value={tenderForm.description}
                  onChange={(e) => setTenderForm({ ...tenderForm, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">קישור לאבן דרך (אופציונלי)</label>
                <select
                  className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  value={tenderForm.milestone_id}
                  onChange={(e) => setTenderForm({ ...tenderForm, milestone_id: e.target.value })}
                >
                  <option value="">ללא קישור</option>
                  {milestones.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({formatDateForDisplay(m.date)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setIsAddTenderModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold text-sm transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={handleAddTender}
                  disabled={!tenderForm.tender_name.trim() || !tenderForm.due_date}
                  className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  צור מכרז והוסף משתתפים
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Professional Picker Modal */}
      {isProfessionalPickerOpen && selectedTender && createPortal(
        <>
          <div className="fixed inset-0 z-50 bg-black/20" onClick={() => { setIsProfessionalPickerOpen(false); setSelectedProfessionalIds([]); }} />
          <div
            className="fixed z-50 bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark w-[90vw] max-w-2xl max-h-[70vh] overflow-hidden flex flex-col"
            style={{ top: modalPosition.top, left: modalPosition.left }}
          >
            <div className="flex items-center justify-between p-6 border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
              <div>
                <h3 className="text-lg font-bold">בחירת אנשי מקצוע</h3>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  {selectedTender.tender_name}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsProfessionalPickerOpen(false);
                  setSelectedProfessionalIds([]);
                }}
                className="size-8 flex items-center justify-center hover:bg-background-light dark:hover:bg-background-dark rounded transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* Filter */}
            <div className="p-4 border-b border-border-light dark:border-border-dark">
              <label className="block text-sm font-bold mb-2">סנן לפי סוג</label>
              <select
                className="w-full md:w-auto min-w-[200px] h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                value={professionalPickerFilter}
                onChange={(e) => setProfessionalPickerFilter(e.target.value as TenderType | 'all')}
              >
                <option value="all">הצג הכל</option>
                {Object.entries(tenderTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Professionals List */}
            <div className="flex-1 overflow-y-auto p-4">
              {(() => {
                const available = getAvailableProfessionals(selectedTender, professionalPickerFilter);
                if (available.length === 0) {
                  return (
                    <div className="text-center py-8 text-text-secondary-light dark:text-text-secondary-dark">
                      אין אנשי מקצוע זמינים
                    </div>
                  );
                }
                return (
                  <div className="space-y-2">
                    {available.map((prof) => (
                      <label
                        key={prof.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedProfessionalIds.includes(prof.id)
                            ? 'bg-primary/10 border-primary'
                            : 'bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark hover:border-primary/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedProfessionalIds.includes(prof.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProfessionalIds([...selectedProfessionalIds, prof.id]);
                            } else {
                              setSelectedProfessionalIds(selectedProfessionalIds.filter((id) => id !== prof.id));
                            }
                          }}
                          className="size-4 rounded border-border-light dark:border-border-dark text-primary focus:ring-primary"
                        />
                        <div className="flex-1">
                          <p className="font-bold text-sm">{prof.professional_name}</p>
                          {prof.company_name && (
                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                              {prof.company_name}
                            </p>
                          )}
                          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                            {prof.field}
                          </p>
                        </div>
                        {prof.rating && (
                          <div className="flex items-center gap-1 text-yellow-500">
                            <span className="material-symbols-outlined text-[16px]">star</span>
                            <span className="text-sm font-bold">{prof.rating}</span>
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  נבחרו {selectedProfessionalIds.length} אנשי מקצוע
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsProfessionalPickerOpen(false);
                      setSelectedProfessionalIds([]);
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold text-sm transition-colors"
                  >
                    ביטול
                  </button>
                  <button
                    onClick={handleAddParticipants}
                    disabled={selectedProfessionalIds.length === 0}
                    className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    הוסף נבחרים למכרז
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Select Winner Modal - Two Step */}
      {isSelectWinnerModalOpen && selectedTender && createPortal(
        <>
          <div className="fixed inset-0 z-50 bg-black/20" onClick={() => { setIsSelectWinnerModalOpen(false); setSelectedWinnerParticipant(null); }} />
          <div
            className="fixed z-50 bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark w-[90vw] max-w-md max-h-[70vh] overflow-y-auto"
            style={{ top: modalPosition.top, left: modalPosition.left }}
          >
            <div className="flex items-center justify-between p-6 border-b border-border-dark sticky top-0 bg-surface-light dark:bg-surface-dark">
              <h3 className="text-lg font-bold">
                {selectedWinnerParticipant ? 'אישור בחירת זוכה' : 'בחירת זוכה במכרז'}
              </h3>
              <button
                onClick={() => {
                  setIsSelectWinnerModalOpen(false);
                  setSelectedTender(null);
                  setSelectedWinnerParticipant(null);
                  setWinnerForm({ contract_amount: '', management_remarks: '' });
                }}
                className="size-8 flex items-center justify-center hover:bg-background-light dark:hover:bg-background-dark rounded transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Step 1: Select participant */}
              {!selectedWinnerParticipant && (
                <>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
                    בחר את הזוכה במכרז: <strong>{selectedTender.tender_name}</strong>
                  </p>
                  {selectedTender.estimated_budget && (
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-sm">
                      <span className="text-blue-700 dark:text-blue-300">תקציב משוער: </span>
                      <span className="font-bold text-blue-800 dark:text-blue-200">{formatCurrency(selectedTender.estimated_budget)}</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    {getParticipantsWithProfessionals(selectedTender).map((participant) => {
                      if (!participant.professional) return null;

                      return (
                        <button
                          key={participant.id}
                          onClick={() => handleSelectWinnerStep1(participant)}
                          className="w-full p-4 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark hover:bg-primary/10 hover:border-primary transition-colors text-right"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-bold text-sm">{participant.professional.professional_name}</p>
                              {participant.professional.company_name && (
                                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                  {participant.professional.company_name}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                  {participant.professional.field}
                                </span>
                                {participant.total_amount && (
                                  <span className="text-xs font-bold text-primary">
                                    {formatCurrency(participant.total_amount)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="material-symbols-outlined text-primary text-[24px]">
                              chevron_left
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {getParticipantsWithProfessionals(selectedTender).length === 0 && (
                    <div className="text-center py-8 text-text-secondary-light dark:text-text-secondary-dark">
                      אין משתתפים במכרז
                    </div>
                  )}
                </>
              )}

              {/* Step 2: Confirm with contract amount */}
              {selectedWinnerParticipant && (() => {
                const prof = allProfessionals.find(p => p.id === selectedWinnerParticipant.professional_id);
                return (
                  <>
                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-green-600 text-[28px]">emoji_events</span>
                        <div>
                          <p className="font-bold text-green-800 dark:text-green-200">{prof?.professional_name}</p>
                          <p className="text-sm text-green-700 dark:text-green-300">{prof?.company_name}</p>
                        </div>
                      </div>
                      {selectedWinnerParticipant.total_amount && (
                        <p className="mt-2 text-sm text-green-700 dark:text-green-300">
                          הצעת מחיר: <strong>{formatCurrency(selectedWinnerParticipant.total_amount)}</strong>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-2">סכום חוזה סופי (₪)</label>
                      <input
                        type="number"
                        className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                        placeholder="סכום לאחר משא ומתן"
                        value={winnerForm.contract_amount}
                        onChange={(e) => setWinnerForm({ ...winnerForm, contract_amount: e.target.value })}
                      />
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                        ברירת מחדל: הצעת המחיר המקורית
                      </p>
                    </div>

                    {selectedTender.estimated_budget && winnerForm.contract_amount && (
                      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-amber-700 dark:text-amber-300">חיסכון מול תקציב משוער:</span>
                          <span className={`font-bold ${
                            selectedTender.estimated_budget - parseFloat(winnerForm.contract_amount) >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {formatCurrency(selectedTender.estimated_budget - parseFloat(winnerForm.contract_amount))}
                          </span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-bold mb-2">הערות ניהול (פנימי)</label>
                      <textarea
                        className="w-full p-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary resize-none h-20"
                        placeholder="הערות לשימוש פנימי..."
                        value={winnerForm.management_remarks}
                        onChange={(e) => setWinnerForm({ ...winnerForm, management_remarks: e.target.value })}
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => {
                          setSelectedWinnerParticipant(null);
                          setWinnerForm({ contract_amount: '', management_remarks: '' });
                        }}
                        className="flex-1 px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold text-sm transition-colors"
                      >
                        חזרה
                      </button>
                      <button
                        onClick={() => {
                          // Close the current modal and show variance preview
                          setIsSelectWinnerModalOpen(false);
                          setIsVariancePreviewModalOpen(true);
                        }}
                        className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-bold text-sm transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] align-middle me-1">arrow_forward</span>
                        המשך
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Send BOM Email Modal */}
      {isSendBOMModalOpen && selectedTender && bomFilesMap[selectedTender.id] && (
        <SendBOMEmailModal
          tender={selectedTender}
          participants={getParticipantsWithProfessionals(selectedTender)}
          bomFile={bomFilesMap[selectedTender.id]!}
          onClose={() => {
            setIsSendBOMModalOpen(false);
            setSelectedTender(null);
          }}
        />
      )}

      {/* Variance Preview Modal */}
      {isVariancePreviewModalOpen && selectedTender && selectedWinnerParticipant && (() => {
        const prof = allProfessionals.find(p => p.id === selectedWinnerParticipant.professional_id);
        if (!prof) return null;

        // Prepare tender with updated contract amount for variance calculation
        const tenderWithContractAmount = {
          ...selectedTender,
          contract_amount: winnerForm.contract_amount ? parseFloat(winnerForm.contract_amount) : selectedWinnerParticipant.total_amount,
        };

        // Prepare participant with contract amount
        const participantWithContractAmount = {
          ...selectedWinnerParticipant,
          total_amount: winnerForm.contract_amount ? parseFloat(winnerForm.contract_amount) : selectedWinnerParticipant.total_amount,
        };

        return (
          <WinnerSelectionModal
            tender={tenderWithContractAmount}
            winnerParticipant={participantWithContractAmount}
            winnerProfessional={prof}
            onConfirm={async () => {
              setIsVariancePreviewModalOpen(false);
              await handleSelectWinnerConfirm();
            }}
            onCancel={() => {
              // Go back to the contract amount modal
              setIsVariancePreviewModalOpen(false);
              setIsSelectWinnerModalOpen(true);
            }}
          />
        );
      })()}

      {/* Participant Details Modal */}
      {isParticipantDetailsOpen && selectedParticipant && selectedTender && createPortal(
        <>
          <div className="fixed inset-0 z-50 bg-black/20" onClick={() => { setIsParticipantDetailsOpen(false); setSelectedParticipant(null); }} />
          <div
            className="fixed z-50 bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark w-[90vw] max-w-md max-h-[70vh] overflow-y-auto"
            style={{ top: modalPosition.top, left: modalPosition.left }}
          >
            <div className="flex items-center justify-between p-6 border-b border-border-light dark:border-border-dark sticky top-0 bg-surface-light dark:bg-surface-dark">
              <h3 className="text-lg font-bold">פרטי הצעה</h3>
              <button
                onClick={() => {
                  setIsParticipantDetailsOpen(false);
                  setSelectedParticipant(null);
                }}
                className="size-8 flex items-center justify-center hover:bg-background-light dark:hover:bg-background-dark rounded transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {(() => {
                const prof = allProfessionals.find((p) => p.id === selectedParticipant.professional_id);
                return (
                  <div className="p-3 rounded-lg bg-background-light dark:bg-background-dark">
                    <p className="font-bold">{prof?.professional_name}</p>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {prof?.company_name && `${prof.company_name} • `}
                      {prof?.field}
                    </p>
                  </div>
                );
              })()}

              <div>
                <label className="block text-sm font-bold mb-2">סכום הצעה (₪)</label>
                <input
                  type="number"
                  className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="הזן סכום"
                  value={participantForm.total_amount}
                  onChange={(e) => setParticipantForm({ ...participantForm, total_amount: e.target.value })}
                  disabled={selectedTender.status === 'WinnerSelected'}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">קובץ הצעה (PDF)</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="quote-file-input"
                      disabled={selectedTender.status === 'WinnerSelected' || uploadingFile}
                    />
                    <label
                      htmlFor="quote-file-input"
                      className={`flex-1 h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm flex items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                        selectedTender.status === 'WinnerSelected' ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px] me-2">upload_file</span>
                      {uploadingFile ? 'מעלה...' : participantForm.quote_file ? 'החלף קובץ' : 'בחר קובץ'}
                    </label>
                  </div>
                  {participantForm.quote_file && (
                    <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[18px]">
                        attach_file
                      </span>
                      <span className="text-sm text-blue-700 dark:text-blue-300 flex-1 truncate">
                        {getFileNameFromUrl(participantForm.quote_file)}
                      </span>
                      <a
                        href={participantForm.quote_file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline font-bold"
                      >
                        צפייה
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">הערות</label>
                <textarea
                  className="w-full p-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary resize-none h-20"
                  placeholder="הערות נוספות..."
                  value={participantForm.notes}
                  onChange={(e) => setParticipantForm({ ...participantForm, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setIsParticipantDetailsOpen(false);
                    setSelectedParticipant(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold text-sm transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={handleUpdateParticipant}
                  className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover font-bold text-sm transition-colors"
                >
                  שמור
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
