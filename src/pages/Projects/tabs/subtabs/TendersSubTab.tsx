import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../../contexts/ToastContext';
import {
  getTenders,
  updateTender,
  createTender,
  deleteTender,
  updateTenderFromEstimate,
} from '../../../../services/tendersService';
import { getEstimate, lockEstimate } from '../../../../services/estimatesService';
import { getEstimateItems } from '../../../../services/estimateItemsService';
import { getCostItems, updateCostItem } from '../../../../services/costsService';
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
import type { Project, Tender, TenderStatus, TenderType, TenderParticipant, Professional, BOMFile, CostItem, CostCategory } from '../../../../types';
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

const costCategoryLabels: Record<CostCategory, string> = {
  consultant: 'יועץ',
  supplier: 'ספק',
  contractor: 'קבלן',
};

const costCategoryColors: Record<CostCategory, string> = {
  consultant: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
  supplier: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  contractor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
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
  const [costItemsMap, setCostItemsMap] = useState<Record<string, CostItem>>({});
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
        const [loadedTenders, loadedProfessionals, loadedMilestones, loadedCostItems] = await Promise.all([
          loadInitialTenders(project.id),
          loadInitialProfessionals(),
          getMilestones(project.id),
          getCostItems(project.id),
        ]);
        setTenders(loadedTenders);
        setAllProfessionals(loadedProfessionals);
        setMilestones(loadedMilestones);

        // Create cost items map (indexed by cost item id)
        const costItemsData: Record<string, CostItem> = {};
        loadedCostItems.forEach(item => {
          costItemsData[item.id] = item;
        });
        setCostItemsMap(costItemsData);

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
                estimatesData[tender.estimate_id] = estimate; // FIX: Use estimate_id as key, not tender.id
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

  // File upload removed - using direct URL input instead (see participant details modal)

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

    // Validation: Must have a valid amount greater than zero
    if (!contractAmount || contractAmount <= 0) {
      showError('חובה להזין סכום חוזה תקין גדול מ-0');
      return;
    }

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
      // Create ProjectProfessional automatically (if doesn't already exist)
      const newProjectProfessional = {
        project_id: project.id,
        professional_id: participant.professional_id,
        project_role: undefined,
        source: 'Tender' as const,
        related_tender_id: tender.id,
        related_tender_name: tender.tender_name,
        is_active: true,
      };

      try {
        await createProjectProfessional(newProjectProfessional);
      } catch (error: any) {
        if (!error?.message?.includes('duplicate key')) {
          console.error('Error creating ProjectProfessional:', error);
        }
      }

    // Update cost item status to 'tender_winner' if this tender is linked to a cost item
    if (tender.cost_item_id) {
      try {
        await updateCostItem(tender.cost_item_id, {
          status: 'tender_winner',
          actual_amount: contractAmount,
        });
      } catch (error) {
        console.error('Error updating cost item status:', error);
        showError('שגיאה בעדכון פריט עלות');
      }
    }

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

          // Get estimate item if tender has estimate link (for auto-variance calculation)
          let estimateItemId: string | undefined;
          if (tender.estimate_id) {
            try {
              const estimateItems = await getEstimateItems(tender.estimate_id);
              // Link to first item (MVP - future: match by description or allow selection)
              estimateItemId = estimateItems[0]?.id;
            } catch (error) {
              console.error('Error fetching estimate items:', error);
              // Continue without estimate link
            }
          }

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
            // Add source estimate for traceability
            source_estimate_id: tender.estimate_id || undefined,
            // Link to estimate item for automatic variance calculation (database trigger)
            estimate_item_id: estimateItemId,
          });
        }
      }
    }

      // Lock the source estimate (prevent further edits after winner selection)
      // Note: Estimate locking handled via estimate service, not project items
      // Also lock old estimate system (for backwards compatibility)
      if (selectedTender.estimate_id) {
        try {
          await lockEstimate(selectedTender.estimate_id);
        } catch (error) {
          console.error('Error locking old estimate:', error);
        }
      }

      await loadTenders();
      setIsSelectWinnerModalOpen(false);
      setSelectedTender(null);
      setSelectedWinnerParticipant(null);
      setWinnerForm({ contract_amount: '', management_remarks: '' });
      showSuccess('הזוכה נבחר בהצלחה!');

      // Navigate to costs tab if this tender is linked to a cost item
      if (tender.cost_item_id) {
        setTimeout(() => {
          navigate(`/projects/${project.id}?tab=financial&subtab=costs&highlight=${tender.cost_item_id}`);
        }, 1000); // Small delay to show success message
      }
    } catch (error: unknown) {
      console.error('Error selecting winner:', error);
      showError('שגיאה בבחירת זוכה. אנא נסה שוב.');
    }
  };

  // Handle update tender from estimate
  const handleUpdateTenderFromEstimate = async (tenderId: string, estimateId: string) => {
    try {
      const { oldBudget, newBudget } = await updateTenderFromEstimate(tenderId, estimateId);

      // Reload tenders to show updated data
      await loadTenders();

      showSuccess(
        `מכרז עודכן מהאומדן (תקציב: ${oldBudget.toLocaleString()} ← ${newBudget.toLocaleString()})`
      );
    } catch (error: any) {
      console.error('Error updating tender from estimate:', error);
      showError(error.message || 'שגיאה בעדכון מכרז מאומדן');
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
      .filter((p) => p.total_amount && p.total_amount > 0 && !isNaN(p.total_amount))
      .map((p) => p.total_amount as number);

    if (prices.length === 0) return null;

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const sum = prices.reduce((acc, p) => acc + p, 0);
    const avg = sum / prices.length;

    // Validate that avg is a valid number
    if (isNaN(avg) || !isFinite(avg)) return null;

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

            // Get cost item for this tender
            const costItem = tender.cost_item_id ? costItemsMap[tender.cost_item_id] : null;

            return (
              <div
                key={tender.id}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden"
              >
                {/* SECTION 1: HEADER - Stitch-Inspired Design */}
                <div className="relative bg-white dark:bg-gray-900 p-6 border-b border-gray-200 dark:border-gray-800">
                  {/* Top accent bar - status color */}
                  <div className={`absolute top-0 right-0 h-1 w-full ${
                    tender.status === 'WinnerSelected' ? 'bg-emerald-500' :
                    tender.status === 'Open' ? 'bg-blue-500' :
                    tender.status === 'Draft' ? 'bg-gray-400' :
                    tender.status === 'Closed' ? 'bg-slate-500' :
                    'bg-red-500'
                  }`} />

                  <div className="flex flex-wrap justify-between items-start gap-4">
                    {/* Left: Main Info */}
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                      {/* Title Row */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusColors[tender.status]}`}>
                          {statusLabels[tender.status]}
                        </span>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
                          {tender.tender_name}
                        </h1>
                        {deadlinePassed && tender.status === 'Open' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded text-xs font-bold text-red-700 dark:text-red-300">
                            <span className="material-symbols-outlined text-[14px]">warning</span>
                            עבר הדדליין
                          </span>
                        )}
                      </div>

                      {/* Metadata Row */}
                      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
                        {/* Link back to Cost Item */}
                        {costItem && (
                          <button
                            onClick={() => navigate(`/projects/${project.id}?tab=financial&subtab=costs&highlight=${costItem.id}`)}
                            className="text-primary hover:text-primary-hover flex items-center gap-1 font-semibold transition-colors"
                            title="חזור לפריט עלות"
                          >
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                            <span>פריט עלות: {costItem.name}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${costCategoryColors[costItem.category]}`}>
                              {costCategoryLabels[costItem.category]}
                            </span>
                          </button>
                        )}
                        {tender.estimated_budget && (
                          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-lg">payments</span>
                            אומדן תקציבי: {formatCurrency(tender.estimated_budget)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: BOM Button */}
                    <div className="flex gap-3">
                      {bomFilesMap[tender.id] ? (
                        <a
                          href={bomFilesMap[tender.id]!.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-lg transition-all text-sm"
                        >
                          <span className="material-symbols-outlined text-lg">description</span>
                          צפה בבל"מ
                        </a>
                      ) : (
                        <BOMUploader
                          tenderId={tender.id}
                          currentBOM={null}
                          onUploadSuccess={async (bomFile) => {
                            if (bomFile) {
                              setBomFilesMap((prev) => ({ ...prev, [tender.id]: bomFile }));
                            } else {
                              setBomFilesMap((prev) => ({ ...prev, [tender.id]: null }));
                            }
                            await loadTenders();
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {tender.description && (
                    <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400 mt-2">
                      {tender.description}
                    </p>
                  )}
                </div>

                {/* SECTION 2: WINNER BANNER (if exists) */}
                {winner && winner.professional && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-5 mx-6 mt-6 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-emerald-500 text-white p-3 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <span className="material-symbols-outlined text-2xl">workspace_premium</span>
                      </div>
                      <div>
                        <h3 className="text-emerald-900 dark:text-emerald-400 font-bold text-lg">הוכרז זוכה למכרז!</h3>
                        <p className="text-emerald-700 dark:text-emerald-500 text-sm">
                          {winner.professional.professional_name}
                          {winner.professional.company_name && ` - ${winner.professional.company_name}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      {winner.total_amount && (
                        <>
                          <span className="block text-xs text-emerald-600 dark:text-emerald-500 font-medium">הצעה נבחרת</span>
                          <span className="text-xl font-black text-emerald-900 dark:text-emerald-300">
                            {formatCurrency(winner.total_amount)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* SECTION 3: PRICE STATS (if applicable) */}
                {(() => {
                  const stats = getPriceStats(tender);
                  if (!stats || stats.count < 2) return null;
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mx-6 mt-6">
                      <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col items-center">
                        <span className="text-gray-500 text-sm mb-1">הצעה מינימלית</span>
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(stats.min)}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col items-center ring-2 ring-primary/20">
                        <span className="text-gray-500 text-sm mb-1">ממוצע הצעות</span>
                        <span className="text-2xl font-black text-primary">
                          {formatCurrency(Math.round(stats.avg))}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col items-center">
                        <span className="text-gray-500 text-sm mb-1">הצעה מקסימלית</span>
                        <span className="text-2xl font-black text-red-600 dark:text-red-400">
                          {formatCurrency(stats.max)}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* SECTION 4: DATES & ACTIONS - Same Line */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl mx-6 mt-6 p-6">
                  <div className="flex flex-wrap gap-4 items-center justify-start">
                    {/* Dates - Left Side */}
                    {tender.created_at && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-0.5">תאריך יצירה</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {formatDateForDisplay(tender.created_at)}
                        </span>
                      </div>
                    )}
                    {tender.publish_date && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2 border border-blue-200 dark:border-blue-800">
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium block mb-0.5">תאריך פרסום</span>
                        <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                          {formatDateForDisplay(tender.publish_date)}
                        </span>
                      </div>
                    )}
                    {tender.due_date && (
                      <div className={`rounded-lg px-3 py-2 border ${
                        deadlinePassed && tender.status === 'Open'
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                      }`}>
                        <span className={`text-xs font-medium block mb-0.5 ${
                          deadlinePassed && tender.status === 'Open'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          דדליין
                          {deadlinePassed && tender.status === 'Open' && ' (עבר!)'}
                        </span>
                        <span className={`text-xs font-bold ${
                          deadlinePassed && tender.status === 'Open'
                            ? 'text-red-900 dark:text-red-200'
                            : 'text-amber-900 dark:text-amber-200'
                        }`}>
                          {formatDateForDisplay(tender.due_date)}
                        </span>
                      </div>
                    )}
                    {tender.status === 'WinnerSelected' && winner && (
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2 border border-emerald-200 dark:border-emerald-800">
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium block mb-0.5">זוכה נבחר</span>
                        <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                          {formatDateForDisplay(tender.updated_at)}
                        </span>
                      </div>
                    )}

                    {/* Divider */}
                    <div className="h-12 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>

                    {/* Action Icons - Right Side */}
                  {/* Add Participant */}
                  {tender.status !== 'WinnerSelected' && tender.status !== 'Canceled' && (
                    <button
                      onClick={(e) => {
                        setSelectedTender(tender);
                        setProfessionalPickerFilter(tender.tender_type);
                        setSelectedProfessionalIds([]);
                        openModalNearButton(e, setIsProfessionalPickerOpen);
                      }}
                      className="flex flex-col items-center gap-1 group w-24"
                    >
                      <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-all">
                        <span className="material-symbols-outlined">person_add</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">הוספת משתתף</span>
                    </button>
                  )}

                  {/* Send BOM Email */}
                  {bomFilesMap[tender.id] && (
                    <button
                      onClick={() => {
                        if (participantsWithProf.length === 0) {
                          showError('אין משתתפים במכרז. הוסף משתתפים לפני שליחת בל"מ.');
                          return;
                        }
                        setSelectedTender(tender);
                        setIsSendBOMModalOpen(true);
                      }}
                      disabled={participantsWithProf.length === 0}
                      className={`flex flex-col items-center gap-1 group w-24 ${
                        participantsWithProf.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      title={participantsWithProf.length === 0 ? 'אין משתתפים במכרז' : 'שלח בל"מ למשתתפים'}
                    >
                      <div className={`p-3 rounded-full transition-all ${
                        participantsWithProf.length === 0
                          ? 'bg-gray-300 dark:bg-gray-700 text-gray-500'
                          : 'bg-primary text-white hover:scale-105 shadow-md shadow-primary/20'
                      }`}>
                        <span className="material-symbols-outlined">send</span>
                      </div>
                      <span className={`text-xs font-bold ${
                        participantsWithProf.length === 0 ? 'text-gray-400' : 'text-primary'
                      }`}>
                        שליחת בל"מ
                      </span>
                    </button>
                  )}

                  {/* Publish Tender (Draft -> Open) */}
                  {tender.status === 'Draft' && (
                    <button
                      onClick={async () => {
                        try {
                          await updateTender(tender.id, {
                            status: 'Open',
                            publish_date: new Date().toISOString()
                          });
                          await loadTenders();
                          showSuccess('המכרז פורסם בהצלחה!');
                        } catch (error) {
                          console.error('Error publishing tender:', error);
                          showError('שגיאה בפרסום המכרז');
                        }
                      }}
                      className="flex flex-col items-center gap-1 group w-24"
                    >
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-all">
                        <span className="material-symbols-outlined">campaign</span>
                      </div>
                      <span className="text-xs font-semibold text-green-600 dark:text-green-400">פרסום מכרז</span>
                    </button>
                  )}

                  {/* Close Tender */}
                  {(tender.status === 'Open' || tender.status === 'Draft') && (
                    <button
                      onClick={async () => {
                        if (!confirm('האם לסגור את המכרז? לא ניתן יהיה להוסיף משתתפים חדשים')) return;
                        try {
                          await updateTender(tender.id, { status: 'Closed' });
                          await loadTenders();
                          showSuccess('המכרז נסגר בהצלחה');
                        } catch (error) {
                          console.error('Error closing tender:', error);
                          showError('שגיאה בסגירת המכרז');
                        }
                      }}
                      className="flex flex-col items-center gap-1 group w-24"
                    >
                      <div className="p-3 bg-slate-100 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400 rounded-full group-hover:bg-slate-200 dark:group-hover:bg-slate-900/50 transition-all">
                        <span className="material-symbols-outlined">lock</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">סגירת מכרז</span>
                    </button>
                  )}

                  {/* Reopen Tender */}
                  {tender.status === 'Closed' && (
                    <button
                      onClick={async () => {
                        try {
                          await updateTender(tender.id, { status: 'Open' });
                          await loadTenders();
                          showSuccess('המכרז נפתח מחדש');
                        } catch (error) {
                          console.error('Error reopening tender:', error);
                          showError('שגיאה בפתיחת המכרז מחדש');
                        }
                      }}
                      className="flex flex-col items-center gap-1 group w-24"
                    >
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-all">
                        <span className="material-symbols-outlined">lock_open</span>
                      </div>
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">פתיחה מחדש</span>
                    </button>
                  )}

                  {/* Export to Excel/PDF */}
                  {participantsWithProf.length > 0 && (
                    <button
                      onClick={() => {
                        showError('ייצוא Excel/PDF - בקרוב');
                      }}
                      className="flex flex-col items-center gap-1 group w-24"
                    >
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-all">
                        <span className="material-symbols-outlined">download</span>
                      </div>
                      <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">ייצוא</span>
                    </button>
                  )}
                  </div>
                </div>

                {/* SECTION 5: PARTICIPANTS TABLE */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm mx-6 mt-6">
                  <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        משתתפים במכרז
                      </h3>
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-bold text-gray-600 dark:text-gray-300">
                        {participantsWithProf.length}
                      </span>
                    </div>
                    {!winner && tender.status !== 'Canceled' && participantsWithProf.length > 0 && (
                      <button
                        onClick={(e) => {
                          setSelectedTender(tender);
                          openModalNearButton(e, setIsSelectWinnerModalOpen);
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-sm font-bold shadow-md"
                      >
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        בחר זוכה
                      </button>
                    )}
                  </div>

                  {/* Participants Content */}
                  {participantsWithProf.length === 0 ? (
                    <div className="p-8 text-center">
                      <span className="material-symbols-outlined text-[48px] mb-2 opacity-50 text-gray-400">group</span>
                      <p className="font-bold text-gray-600 dark:text-gray-400">אין משתתפים במכרז</p>
                      {tender.status !== 'WinnerSelected' && tender.status !== 'Canceled' && (
                        <button
                          onClick={(e) => {
                            setSelectedTender(tender);
                            setProfessionalPickerFilter(tender.tender_type);
                            setSelectedProfessionalIds([]);
                            openModalNearButton(e, setIsProfessionalPickerOpen);
                          }}
                          className="mt-3 text-primary hover:underline font-bold"
                        >
                          הוסף משתתפים למכרז
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                          <tr>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                              מצב
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                              משתתף
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                              חברה
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                              הצעת מחיר
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                              סטטוס הצעה
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                              פעולות
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {(() => {
                            const stats = getPriceStats(tender);
                            return participantsWithProf.map((participant, index) => {
                              if (!participant.professional) return null;
                              const isBestPrice = stats && participant.id === stats.lowestParticipantId && !participant.is_winner;

                              return (
                                <tr
                                  key={participant.id}
                                  className={`transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                                    participant.is_winner
                                      ? 'bg-green-50 dark:bg-green-900/10'
                                      : isBestPrice
                                      ? 'bg-emerald-50 dark:bg-emerald-900/10'
                                      : ''
                                  }`}
                                >
                                  {/* Status Column */}
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      {participant.is_winner ? (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                          <span className="material-symbols-outlined text-[14px]">emoji_events</span>
                                          זוכה
                                        </span>
                                      ) : isBestPrice ? (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                          <span className="material-symbols-outlined text-[14px]">trending_down</span>
                                          הזול ביותר
                                        </span>
                                      ) : participant.total_amount ? (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                          הגיש הצעה
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                          ממתין
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Participant Name Column */}
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      {/* Avatar/Icon */}
                                      <div className="size-10 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                        {participant.professional.professional_name.charAt(0)}
                                      </div>
                                      <div>
                                        <button
                                          onClick={() => navigate(`/professionals/${participant.professional!.id}`)}
                                          className="font-bold text-sm text-gray-900 dark:text-white hover:text-primary transition-colors text-right"
                                        >
                                          {participant.professional.professional_name}
                                        </button>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          {participant.professional.field}
                                        </p>
                                        {participant.notes && (
                                          <div className="flex items-start gap-1 mt-1">
                                            <span className="material-symbols-outlined text-[14px] text-amber-600 dark:text-amber-400">sticky_note_2</span>
                                            <p className="text-xs text-amber-700 dark:text-amber-300 italic leading-tight">
                                              {participant.notes}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>

                                  {/* Company Column */}
                                  <td className="px-4 py-3">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      {participant.professional.company_name || '-'}
                                    </div>
                                  </td>

                                  {/* Price Column */}
                                  <td className="px-4 py-3">
                                    {participant.total_amount ? (
                                      <div className={`text-sm font-bold ${
                                        participant.is_winner
                                          ? 'text-green-600 dark:text-green-400'
                                          : isBestPrice
                                          ? 'text-emerald-600 dark:text-emerald-400'
                                          : 'text-gray-900 dark:text-white'
                                      }`}>
                                        {formatCurrency(participant.total_amount)}
                                      </div>
                                    ) : (
                                      <span className="text-sm text-gray-400">-</span>
                                    )}
                                  </td>

                                  {/* Quote Status Column */}
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      {participant.quote_file ? (
                                        <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                                          <span className="material-symbols-outlined text-[14px]">attach_file</span>
                                          קובץ מצורף
                                        </span>
                                      ) : (
                                        <span className="text-xs text-gray-400">אין קובץ</span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Actions Column */}
                                  <td className="px-4 py-3">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={(e) => openParticipantDetails(e, tender, participant)}
                                        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400 hover:text-primary"
                                        title="עריכת הצעה"
                                      >
                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                      </button>
                                      <button
                                        onClick={() => navigate(`/professionals/${participant.professional!.id}`)}
                                        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400 hover:text-primary"
                                        title="פרופיל מלא"
                                      >
                                        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                                      </button>
                                      {!winner && (
                                        <button
                                          onClick={() => handleRemoveParticipant(tender, participant.professional_id)}
                                          className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-gray-600 dark:text-gray-400 hover:text-red-600 transition-colors"
                                          title="הסרת משתתף"
                                        >
                                          <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Delete Button - Bottom of Card */}
                <div className="mx-6 mt-4 flex justify-between items-center">
                  <button
                    onClick={() => handleDeleteTender(tender)}
                    className="flex items-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-4 py-2 rounded-lg transition-all font-semibold"
                  >
                    <span className="material-symbols-outlined">delete_forever</span>
                    מחיקת מכרז
                  </button>
                </div>
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
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => { setIsProfessionalPickerOpen(false); setSelectedProfessionalIds([]); }} />
          <div
            className="fixed z-50 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 w-[90vw] max-w-2xl max-h-[80vh] overflow-hidden flex flex-col top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
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
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => { setIsSelectWinnerModalOpen(false); setSelectedWinnerParticipant(null); }} />
          <div
            className="fixed z-50 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 w-[90vw] max-w-md max-h-[80vh] overflow-y-auto top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
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
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => { setIsParticipantDetailsOpen(false); setSelectedParticipant(null); }} />
          <div
            className="fixed z-50 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 w-[90vw] max-w-md max-h-[80vh] overflow-y-auto top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
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
                <label className="block text-sm font-bold mb-2">קובץ הצעה / קישור</label>
                <div className="space-y-2">
                  {/* Direct URL input - temporary solution until file upload is implemented */}
                  <input
                    type="text"
                    className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="הדבק קישור לקובץ ההצעה או Google Drive / Dropbox"
                    value={participantForm.quote_file}
                    onChange={(e) => setParticipantForm({ ...participantForm, quote_file: e.target.value })}
                    disabled={selectedTender.status === 'WinnerSelected'}
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    💡 טיפ: העלה את הקובץ ל-Google Drive / Dropbox והדבק את הקישור כאן
                  </div>
                  {participantForm.quote_file && (
                    <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[18px]">
                        link
                      </span>
                      <span className="text-sm text-blue-700 dark:text-blue-300 flex-1 truncate">
                        {participantForm.quote_file}
                      </span>
                      <a
                        href={participantForm.quote_file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline font-bold"
                      >
                        פתח
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
