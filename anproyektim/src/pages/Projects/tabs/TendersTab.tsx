import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTenders, updateTender, getAllTenders, saveTenders } from '../../../data/tendersStorage';
import { getProfessionals } from '../../../data/professionalsStorage';
import { addProjectProfessional } from '../../../data/professionalsStorage';
import { seedTenders } from '../../../data/tendersData';
import type { Project } from '../../../types';
import type { Tender, TenderStatus } from '../../../types';
import type { Professional } from '../../../types';
import { formatDateForDisplay } from '../../../utils/dateUtils';

interface TendersTabProps {
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

export default function TendersTab({ project }: TendersTabProps) {
  const navigate = useNavigate();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [allProfessionals, setAllProfessionals] = useState<Professional[]>([]);
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [isSelectWinnerModalOpen, setIsSelectWinnerModalOpen] = useState(false);

  useEffect(() => {
    loadTenders();
    loadProfessionals();
  }, [project.id]);

  const loadTenders = () => {
    let loaded = getTenders(project.id);
    
    // Seed if empty
    if (loaded.length === 0) {
      const projectTenders = seedTenders.filter((t) => t.project_id === project.id);
      if (projectTenders.length > 0) {
        const all = getAllTenders();
        projectTenders.forEach((tender) => all.push(tender));
        saveTenders(all);
        loaded = projectTenders;
      }
    }
    
    setTenders(loaded);
  };

  const loadProfessionals = () => {
    const professionals = getProfessionals();
    setAllProfessionals(professionals.filter((p) => p.is_active));
  };

  const handleSelectWinner = (tenderId: string, professionalId: string) => {
    const professional = allProfessionals.find((p) => p.id === professionalId);
    if (!professional) return;

    // Update tender with winner
    updateTender(tenderId, {
      winner_professional_id: professionalId,
      winner_professional_name: professional.professional_name,
      status: 'WinnerSelected',
    });

    // Create ProjectProfessional automatically
    const newProjectProfessional = {
      id: `pp-${Date.now()}`,
      project_id: project.id,
      professional_id: professionalId,
      project_role: undefined, // Can be set later
      source: 'Tender' as const,
      related_tender_id: tenderId,
      related_tender_name: tenders.find((t) => t.id === tenderId)?.tender_name,
      is_active: true,
      notes: undefined,
    };

    addProjectProfessional(newProjectProfessional);

    // Reload tenders
    loadTenders();
    setIsSelectWinnerModalOpen(false);
    setSelectedTender(null);
  };

  const getCandidateProfessionals = (tender: Tender): Professional[] => {
    return allProfessionals.filter((p) => tender.candidate_professional_ids.includes(p.id));
  };

  const getAvailableProfessionals = (tender: Tender): Professional[] => {
    // All active professionals that are not already candidates
    return allProfessionals.filter(
      (p) => !tender.candidate_professional_ids.includes(p.id)
    );
  };

  const handleAddCandidate = (tenderId: string, professionalId: string) => {
    const tender = tenders.find((t) => t.id === tenderId);
    if (!tender) return;

    const updatedCandidates = [...tender.candidate_professional_ids, professionalId];
    updateTender(tenderId, {
      candidate_professional_ids: updatedCandidates,
    });

    loadTenders();
  };

  const handleRemoveCandidate = (tenderId: string, professionalId: string) => {
    const tender = tenders.find((t) => t.id === tenderId);
    if (!tender) return;

    const updatedCandidates = tender.candidate_professional_ids.filter((id) => id !== professionalId);
    updateTender(tenderId, {
      candidate_professional_ids: updatedCandidates,
      // If removing the winner, clear winner
      ...(tender.winner_professional_id === professionalId && {
        winner_professional_id: undefined,
        winner_professional_name: undefined,
        status: tender.status === 'WinnerSelected' ? 'Open' : tender.status,
      }),
    });

    loadTenders();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="text-xl font-bold">מכרזים</h3>
      </div>

      {/* Tenders List */}
      {tenders.length === 0 ? (
        <div className="text-center py-12 text-text-secondary-light dark:text-text-secondary-dark">
          אין מכרזים
        </div>
      ) : (
        <div className="space-y-4">
          {tenders.map((tender) => {
            const candidates = getCandidateProfessionals(tender);
            const winner = tender.winner_professional_id
              ? allProfessionals.find((p) => p.id === tender.winner_professional_id)
              : null;

            return (
              <div
                key={tender.id}
                className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6"
              >
                {/* Tender Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-bold">{tender.tender_name}</h4>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${statusColors[tender.status]}`}
                      >
                        {statusLabels[tender.status]}
                      </span>
                    </div>
                    {tender.category && (
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">
                        קטגוריה: {tender.category}
                      </p>
                    )}
                    {tender.description && (
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        {tender.description}
                      </p>
                    )}
                  </div>
                </div>

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
                      <div>
                        <span className="text-text-secondary-light dark:text-text-secondary-dark">
                          תאריך יעד:
                        </span>{' '}
                        <span className="font-medium">{formatDateForDisplay(tender.due_date)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Winner Section */}
                {winner && (
                  <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-900/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-green-800 dark:text-green-200 mb-1">
                          זוכה במכרז
                        </p>
                        <p className="text-base font-bold text-green-900 dark:text-green-100">
                          {winner.professional_name}
                          {winner.company_name && ` - ${winner.company_name}`}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/professionals/${winner.id}`)}
                        className="px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors text-sm font-bold"
                      >
                        צפייה בפרופיל
                      </button>
                    </div>
                  </div>
                )}

                {/* Candidates List */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-bold text-text-secondary-light dark:text-text-secondary-dark">
                      רשימת מועמדים ({candidates.length})
                    </h5>
                    {!winner && tender.status !== 'Canceled' && (
                      <button
                        onClick={() => {
                          setSelectedTender(tender);
                          setIsSelectWinnerModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-bold"
                      >
                        <span className="material-symbols-outlined text-[16px] me-1 align-middle">
                          check_circle
                        </span>
                        סמן זוכה
                      </button>
                    )}
                  </div>

                  {candidates.length === 0 ? (
                    <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark py-4 text-center">
                      אין מועמדים במכרז
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {candidates.map((candidate) => (
                        <div
                          key={candidate.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            tender.winner_professional_id === candidate.id
                              ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30'
                              : 'bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {tender.winner_professional_id === candidate.id && (
                              <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-[20px]">
                                check_circle
                              </span>
                            )}
                            <div className="flex-1">
                              <p className="font-bold text-sm">{candidate.professional_name}</p>
                              {candidate.company_name && (
                                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                  {candidate.company_name}
                                </p>
                              )}
                              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                {candidate.field}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/professionals/${candidate.id}`)}
                              className="px-2 py-1 rounded hover:bg-background-light dark:hover:bg-background-dark transition-colors text-text-secondary-light hover:text-primary"
                              title="צפייה בפרופיל"
                            >
                              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                            </button>
                            {!winner && (
                              <button
                                onClick={() => handleRemoveCandidate(tender.id, candidate.id)}
                                className="px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-text-secondary-light hover:text-red-600 transition-colors"
                                title="הסר מועמד"
                              >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Candidate Section */}
                {!winner && tender.status !== 'Canceled' && (
                  <div className="pt-4 border-t border-border-light dark:border-border-dark">
                    <label className="block text-sm font-bold mb-2">
                      הוסף מועמד למכרז
                    </label>
                    <select
                      className="w-full md:w-auto min-w-[200px] h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddCandidate(tender.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                    >
                      <option value="">בחר איש מקצוע...</option>
                      {getAvailableProfessionals(tender).map((prof) => (
                        <option key={prof.id} value={prof.id}>
                          {prof.professional_name}
                          {prof.company_name && ` - ${prof.company_name}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

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

      {/* Select Winner Modal */}
      {isSelectWinnerModalOpen && selectedTender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border-light dark:border-border-dark sticky top-0 bg-surface-light dark:bg-surface-dark">
              <h3 className="text-lg font-bold">בחירת זוכה במכרז</h3>
              <button
                onClick={() => {
                  setIsSelectWinnerModalOpen(false);
                  setSelectedTender(null);
                }}
                className="size-8 flex items-center justify-center hover:bg-background-light dark:hover:bg-background-dark rounded transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
                בחר את הזוכה במכרז: <strong>{selectedTender.tender_name}</strong>
              </p>
              <div className="space-y-2">
                {getCandidateProfessionals(selectedTender).map((candidate) => (
                  <button
                    key={candidate.id}
                    onClick={() => handleSelectWinner(selectedTender.id, candidate.id)}
                    className="w-full p-4 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark hover:bg-primary/10 hover:border-primary transition-colors text-right"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-bold text-sm">{candidate.professional_name}</p>
                        {candidate.company_name && (
                          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                            {candidate.company_name}
                          </p>
                        )}
                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                          {candidate.field}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-primary text-[24px]">
                        check_circle
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              {getCandidateProfessionals(selectedTender).length === 0 && (
                <div className="text-center py-8 text-text-secondary-light dark:text-text-secondary-dark">
                  אין מועמדים במכרז
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
