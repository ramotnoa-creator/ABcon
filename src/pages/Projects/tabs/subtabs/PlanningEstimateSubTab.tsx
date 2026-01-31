import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../../contexts/ToastContext';
import {
  getProjectItems,
  getProjectItemsWithEstimates,
  softDeleteProjectItem,
  type ProjectItem
} from '../../../../services/projectItemsService';
import AddProjectItemForm from '../../../../components/ProjectItems/AddProjectItemForm';

interface PlanningEstimateSubTabProps {
  projectId: string;
  projectName: string;
}

export default function PlanningEstimateSubTab({ projectId, projectName }: PlanningEstimateSubTabProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [itemsWithEstimates, setItemsWithEstimates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ProjectItem | null>(null);
  const [viewingItem, setViewingItem] = useState<any | null>(null);

  // Load planning items
  useEffect(() => {
    loadItems();
  }, [projectId]);

  const loadItems = async () => {
    try {
      setIsLoading(true);

      // Load project items with current estimates
      const itemsData = await getProjectItemsWithEstimates(projectId, 'planning');
      setItemsWithEstimates(itemsData);

      // Also load plain items for other operations
      const plainItems = await getProjectItems(projectId, 'planning');
      setItems(plainItems);

      // Check for locked estimates (Phase 2: UI indicators)
      for (const item of itemsData) {
        if (item.estimate_status === 'locked') {
          console.log(`Item ${item.name} has locked estimate`);
        }
      }
    } catch (error) {
      console.error('Error loading planning items:', error);
      showToast('שגיאה בטעינת פריטי תכנון', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemSaved = async (item: ProjectItem) => {
    await loadItems();
    setShowAddForm(false);
    setEditingItem(null);
    showToast(editingItem ? 'פריט עודכן בהצלחה' : 'פריט נוסף בהצלחה', 'success');
  };

  const handleDeleteItem = async (itemId: string) => {
    // Find the item to check if it has a tender
    const item = itemsWithEstimates.find(i => i.id === itemId);
    const hasTender = item?.active_tender_id;

    const confirmMessage = hasTender
      ? 'פריט זה מקושר למכרז. מחיקת הפריט תמחק גם את המכרז. האם להמשיך?'
      : 'האם אתה בטוח שברצונך למחוק פריט זה?';

    if (!confirm(confirmMessage)) return;

    try {
      // Delete the tender first if it exists
      if (hasTender) {
        const { deleteTender } = await import('../../../../services/tendersService');
        await deleteTender(item.active_tender_id);
      }

      // Then delete the project item
      await softDeleteProjectItem(itemId, 'current-user', 'Deleted by user');
      await loadItems();
      showToast(hasTender ? 'פריט ומכרז נמחקו בהצלחה' : 'פריט נמחק בהצלחה', 'success');
    } catch (error) {
      console.error('Error deleting item:', error);
      showToast('שגיאה במחיקת פריט', 'error');
    }
  };

  const handleExportToTender = async (itemId: string) => {
    try {
      // Find the item
      const item = itemsWithEstimates.find(i => i.id === itemId);
      if (!item) {
        showToast('שגיאה: פריט לא נמצא', 'error');
        return;
      }

      // Create tender draft from item
      const { createTender } = await import('../../../../services/tendersService');
      const { updateProjectItem } = await import('../../../../services/projectItemsService');
      const { markEstimateAsExported } = await import('../../../../services/projectItemEstimatesService');

      const tender = await createTender({
        project_id: projectId,
        tender_name: `מכרז ${item.name}`,
        tender_type: 'other' as any,
        category: item.category || '',
        description: item.description || '',
        status: 'Draft' as any,
        publish_date: null,
        due_date: null,
        candidate_professional_ids: [],
        winner_professional_id: null,
        winner_professional_name: null,
        milestone_id: null,
        notes: `נוצר אוטומטית מפריט: ${item.name}`,
        estimated_budget: parseFloat(item.total_with_vat) || 0,
        contract_amount: null,
        management_remarks: null,
        estimate_id: null,
        project_item_id: itemId, // Link to project item
        attempt_number: 1,
        previous_tender_id: null,
        retry_reason: null,
      });

      // Mark estimate as exported (Phase 1: Change tracking)
      await markEstimateAsExported(itemId, tender.id);

      // Update item status to tender_draft
      await updateProjectItem(itemId, {
        current_status: 'tender_draft',
        active_tender_id: tender.id,
        updated_by: 'current-user',
      });

      await loadItems();
      showToast(`מכרז "${tender.tender_name}" נוצר בהצלחה!`, 'success');

      // Navigate to tenders subtab in financial tab
      navigate(`/projects/${projectId}?tab=financial&subtab=tenders`);
    } catch (error) {
      console.error('Error creating tender:', error);
      showToast('שגיאה ביצירת מכרז', 'error');
    }
  };

  const calculateTotals = () => {
    const totalEstimated = itemsWithEstimates.reduce(
      (sum, item) => sum + (parseFloat(item.total_with_vat) || 0),
      0
    );
    const totalItems = itemsWithEstimates.length;

    return { totalEstimated, totalItems };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { totalEstimated, totalItems } = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-white dark:bg-surface-dark rounded-lg shadow-sm p-6 border border-border-light dark:border-border-dark">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">אומדן תכנון - {projectName}</h3>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            + הוסף פריט
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">סה"כ פריטים</div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalItems}</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="text-sm text-green-600 dark:text-green-400 font-medium">אומדן כולל (כולל מע"מ)</div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              ₪{totalEstimated.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">ממוצע לפריט</div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              ₪{totalItems > 0 ? (totalEstimated / totalItems).toLocaleString('he-IL', { minimumFractionDigits: 2 }) : '0.00'}
            </div>
          </div>
        </div>
      </div>

      {/* Locked Items Warning Banner */}
      {itemsWithEstimates.some(item => item.estimate_status === 'locked') && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-r-4 border-yellow-400 p-4 rounded">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-2xl">🔒</span>
            </div>
            <div className="mr-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                אומדנים נעולים
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>
                  חלק מהאומדנים נעולים מכיוון שזוכה נבחר במכרז המקושר.
                  לא ניתן לערוך או למחוק פריטים אלו.
                  {itemsWithEstimates.filter(item => item.estimate_status === 'locked').length > 0 && (
                    <span className="font-semibold">
                      {' '}({itemsWithEstimates.filter(item => item.estimate_status === 'locked').length} פריטים נעולים)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exported Items Info Banner */}
      {itemsWithEstimates.some(item => item.estimate_status === 'exported' && !item.estimate_locked_at) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-r-4 border-blue-400 p-4 rounded">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-2xl">📤</span>
            </div>
            <div className="mr-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                אומדנים שיוצאו למכרז
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>
                  חלק מהאומדנים כבר יוצאו למכרז. שינויים באומדנים אלו לא יתעדכנו אוטומטית במכרז.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white dark:bg-surface-dark rounded-lg shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-border-light dark:border-border-dark">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  שם הפריט
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  קטגוריה
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  אומדן (ללא מע"מ)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  כולל מע"מ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  סטטוס
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-surface-dark divide-y divide-border-light dark:divide-border-dark">
              {itemsWithEstimates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-16 h-16 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg">אין פריטים באומדן תכנון</p>
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="mt-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                      >
                        הוסף פריט ראשון
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                itemsWithEstimates.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {item.name}
                        </div>
                        {item.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {item.category || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      ₪{parseFloat(item.estimated_cost || 0).toLocaleString('he-IL', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 dark:text-green-400">
                      ₪{parseFloat(item.total_with_vat || 0).toLocaleString('he-IL', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={item.current_status} />
                        {item.estimate_status === 'locked' && (
                          <span
                            className="text-yellow-600 dark:text-yellow-400"
                            title={`נעול: ${item.estimate_locked_reason || 'זוכה נבחר במכרז'}`}
                          >
                            🔒
                          </span>
                        )}
                        {item.estimate_status === 'exported' && !item.estimate_locked_at && (
                          <span
                            className="text-blue-600 dark:text-blue-400 text-xs"
                            title="יוצא למכרז"
                          >
                            📤
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {item.current_status === 'estimation' && !item.estimate_status && (
                          <button
                            onClick={() => handleExportToTender(item.id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            title="ייצוא למכרז"
                          >
                            ייצוא למכרז
                          </button>
                        )}
                        {item.estimate_tender_id && (
                          <button
                            onClick={() => navigate(`/projects/${projectId}?tab=financial&subtab=tenders`)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs"
                            title="עבור למכרז המקושר"
                          >
                            מכרז ▼
                          </button>
                        )}
                        <button
                          onClick={() => setViewingItem(item)}
                          className="px-3 py-1 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                          title="צפה בפרטים"
                        >
                          צפה
                        </button>
                        <button
                          onClick={() => setEditingItem(item)}
                          className={`px-3 py-1 rounded transition-colors ${
                            item.estimate_status === 'locked'
                              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                              : 'bg-gray-600 text-white hover:bg-gray-700'
                          }`}
                          disabled={item.estimate_status === 'locked'}
                          title={item.estimate_status === 'locked' ? 'לא ניתן לערוך - אומדן נעול' : 'ערוך פריט'}
                        >
                          ערוך
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className={`px-3 py-1 rounded transition-colors ${
                            item.estimate_status === 'locked'
                              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                          disabled={item.estimate_status === 'locked'}
                          title={item.estimate_status === 'locked' ? 'לא ניתן למחוק - אומדן נעול' : 'מחק פריט'}
                        >
                          מחק
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {(showAddForm || editingItem) && (
        <AddProjectItemForm
          projectId={projectId}
          itemType="planning"
          item={editingItem || undefined}
          onSave={handleItemSaved}
          onCancel={() => {
            setShowAddForm(false);
            setEditingItem(null);
          }}
        />
      )}

      {/* View Details Modal */}
      {viewingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-surface-dark rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-surface-dark border-b border-border-light dark:border-border-dark px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{viewingItem.name}</h2>
                <button
                  onClick={() => setViewingItem(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">info</span>
                  מידע כללי
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">שם הפריט</div>
                    <div className="text-base font-medium">{viewingItem.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">קטגוריה</div>
                    <div className="text-base font-medium">{viewingItem.category || '—'}</div>
                  </div>
                  {viewingItem.description && (
                    <div className="md:col-span-2">
                      <div className="text-sm text-gray-600 dark:text-gray-400">תיאור</div>
                      <div className="text-base">{viewingItem.description}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">סטטוס</div>
                    <div className="mt-1">
                      <StatusBadge status={viewingItem.current_status} />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">סוג</div>
                    <div className="text-base font-medium">{viewingItem.type === 'planning' ? 'תכנון' : 'ביצוע'}</div>
                  </div>
                </div>
              </div>

              {/* Current Estimate */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">calculate</span>
                  אומדן נוכחי
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">לפני מע"מ</div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      ₪{parseFloat(viewingItem.estimated_cost || 0).toLocaleString('he-IL', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">מע"מ ({viewingItem.vat_rate || 17}%)</div>
                    <div className="text-2xl font-bold">
                      ₪{parseFloat(viewingItem.vat_amount || 0).toLocaleString('he-IL', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="text-sm text-green-600 dark:text-green-400 mb-1">סה"כ כולל מע"מ</div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                      ₪{parseFloat(viewingItem.total_with_vat || 0).toLocaleString('he-IL', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
                {viewingItem.estimate_notes && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">הערות</div>
                    <div className="text-sm">{viewingItem.estimate_notes}</div>
                  </div>
                )}
              </div>

              {/* Linked Tender */}
              {viewingItem.active_tender_id && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">gavel</span>
                    מכרז מקושר
                  </h3>
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-amber-600 dark:text-amber-400">פריט זה מקושר למכרז</div>
                        <div className="text-base font-medium mt-1">מזהה מכרז: {viewingItem.active_tender_id}</div>
                      </div>
                      <button
                        onClick={() => {
                          setViewingItem(null);
                          navigate(`/projects/${projectId}?tab=financial&subtab=tenders`);
                        }}
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                      >
                        עבור למכרז
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">schedule</span>
                  היסטוריה
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">נוצר בתאריך</div>
                    <div className="text-base">{new Date(viewingItem.created_at).toLocaleString('he-IL')}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">עודכן לאחרונה</div>
                    <div className="text-base">{new Date(viewingItem.updated_at).toLocaleString('he-IL')}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">גרסת אומדן</div>
                    <div className="text-base font-medium">גרסה {viewingItem.estimate_version || 1}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">גרסת פריט</div>
                    <div className="text-base font-medium">גרסה {viewingItem.version || 1}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-surface-dark border-t border-border-light dark:border-border-dark px-6 py-4">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setViewingItem(null)}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  סגור
                </button>
                {viewingItem.current_status !== 'locked' && (
                  <button
                    onClick={() => {
                      setEditingItem(viewingItem);
                      setViewingItem(null);
                    }}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    עבור לעריכה
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    estimation: { label: 'אומדן', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    tender_draft: { label: 'טיוטת מכרז', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    tender_open: { label: 'מכרז פתוח', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
    tender_closed: { label: 'מכרז סגור', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
    contracted: { label: 'חוזה', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    in_progress: { label: 'בביצוע', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
    completed: { label: 'הושלם', className: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400' },
    locked: { label: 'נעול', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  };

  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}
