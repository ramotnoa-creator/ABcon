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

interface ExecutionEstimateSubTabProps {
  projectId: string;
  projectName: string;
}

export default function ExecutionEstimateSubTab({ projectId, projectName }: ExecutionEstimateSubTabProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [itemsWithEstimates, setItemsWithEstimates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ProjectItem | null>(null);

  // Load execution items
  useEffect(() => {
    loadItems();
  }, [projectId]);

  const loadItems = async () => {
    try {
      setIsLoading(true);

      // Load project items with current estimates
      const itemsData = await getProjectItemsWithEstimates(projectId, 'execution');
      setItemsWithEstimates(itemsData);

      // Also load plain items for other operations
      const plainItems = await getProjectItems(projectId, 'execution');
      setItems(plainItems);
    } catch (error) {
      console.error('Error loading execution items:', error);
      showToast('שגיאה בטעינת פריטי ביצוע', 'error');
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
    if (!confirm('האם אתה בטוח שברצונך למחוק פריט זה?')) return;

    try {
      await softDeleteProjectItem(itemId, 'current-user', 'Deleted by user');
      await loadItems();
      showToast('פריט נמחק בהצלחה', 'success');
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

      const tender = await createTender({
        project_id: projectId,
        tender_name: `מכרז ${item.name}`,
        tender_type: 'contractor' as any,
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

      // Update item status to tender_draft
      await updateProjectItem(itemId, {
        current_status: 'tender_draft',
        active_tender_id: tender.id,
        updated_by: 'current-user',
      });

      await loadItems();
      showToast(`מכרז "${tender.tender_name}" נוצר בהצלחה! עבור ללשונית מכרזים`, 'success');
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
          <h3 className="text-lg font-semibold">אומדן ביצוע - {projectName}</h3>
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                      <p className="text-lg">אין פריטים באומדן ביצוע</p>
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
                      <StatusBadge status={item.current_status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {item.current_status === 'estimation' && (
                          <button
                            onClick={() => handleExportToTender(item.id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            title="ייצוא למכרז"
                          >
                            ייצוא למכרז
                          </button>
                        )}
                        <button
                          onClick={() => setEditingItem(item)}
                          className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                          disabled={item.current_status === 'locked'}
                        >
                          ערוך
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          disabled={item.current_status === 'locked'}
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
          itemType="execution"
          item={editingItem || undefined}
          onSave={handleItemSaved}
          onCancel={() => {
            setShowAddForm(false);
            setEditingItem(null);
          }}
        />
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
