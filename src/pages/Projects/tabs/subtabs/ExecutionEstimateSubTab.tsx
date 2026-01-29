import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../../contexts/ToastContext';
import { getEstimates, createEstimate, updateEstimate } from '../../../../services/estimatesService';
import { getEstimateItems, deleteEstimateItem } from '../../../../services/estimateItemsService';
import { createTender } from '../../../../services/tendersService';
import AddEstimateItemForm from '../../../../components/Estimates/AddEstimateItemForm';
import EstimateItemsTable from '../../../../components/Estimates/EstimateItemsTable';
import EstimateSummaryCard from '../../../../components/Estimates/EstimateSummaryCard';
import type { Estimate, EstimateItem } from '../../../../types';

interface ExecutionEstimateSubTabProps {
  projectId: string;
  projectName: string;
}

export default function ExecutionEstimateSubTab({ projectId, projectName }: ExecutionEstimateSubTabProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [items, setItems] = useState<EstimateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<EstimateItem | null>(null);

  // Load or create execution estimate
  useEffect(() => {
    const loadEstimate = async () => {
      try {
        setIsLoading(true);
        const estimates = await getEstimates(projectId, 'execution');

        let executionEstimate: Estimate;
        if (estimates.length === 0) {
          // Auto-create execution estimate if none exists
          executionEstimate = await createEstimate({
            project_id: projectId,
            estimate_type: 'execution',
            name: `${projectName} - אומדן ביצוע`,
            total_amount: 0,
            status: 'active',
          });
          showToast('אומדן ביצוע נוצר בהצלחה', 'success');
        } else {
          executionEstimate = estimates[0];
        }

        setEstimate(executionEstimate);

        // Load items
        const estimateItems = await getEstimateItems(executionEstimate.id);
        setItems(estimateItems);
      } catch (error) {
        console.error('Error loading execution estimate:', error);
        showToast('שגיאה בטעינת אומדן ביצוע', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadEstimate();
  }, [projectId, projectName, showToast]);

  const handleItemAdded = (newItem: EstimateItem) => {
    setItems((prev) => [...prev, newItem]);
    setShowAddForm(false);
    showToast('פריט נוסף בהצלחה', 'success');
  };

  const handleItemUpdated = (updatedItem: EstimateItem) => {
    setItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
    setEditingItem(null);
    showToast('פריט עודכן בהצלחה', 'success');
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק פריט זה?')) {
      return;
    }

    try {
      await deleteEstimateItem(itemId);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      showToast('פריט נמחק בהצלחה', 'success');
    } catch (error) {
      console.error('Error deleting item:', error);
      showToast('שגיאה במחיקת פריט', 'error');
    }
  };

  const handleExportToTender = async () => {
    if (!estimate) return;

    try {
      // Calculate total from items
      const estimatedBudget = items.reduce(
        (sum, item) => sum + item.total_with_vat,
        0
      );

      // Create tender pre-filled with estimate data
      // Note: Execution estimates typically need contractors or project managers
      const tender = await createTender({
        project_id: projectId,
        tender_name: `${estimate.name} - מכרז`,
        description: estimate.description,
        estimated_budget: estimatedBudget,
        estimate_id: estimate.id,
        status: 'Draft',
        publish_date: new Date().toISOString(),
        candidate_professional_ids: [],
        tender_type: 'contractor', // Execution work is typically for contractors
      });

      // Update estimate status
      await updateEstimate(estimate.id, {
        status: 'exported_to_tender'
      });

      // Update local state
      setEstimate({ ...estimate, status: 'exported_to_tender' });

      // Navigate to tender
      navigate(`/projects/${projectId}?tab=financial&subtab=tenders&tender=${tender.id}`);

      showToast('מכרז נוצר מאומדן בהצלחה', 'success');
    } catch (error) {
      console.error('Error exporting to tender:', error);
      showToast('שגיאה ביצירת מכרז', 'error');
    }
  };

  const handleExportToExcel = () => {
    showToast('ייצוא לאקסל - בפיתוח', 'info');
  };

  if (isLoading || !estimate) {
    return (
      <div className="flex items-center gap-3 text-text-secondary-light dark:text-text-secondary-dark">
        <div className="size-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        <p>טוען אומדן...</p>
      </div>
    );
  }

  return (
    <div className="execution-estimate-subtab">
      {/* Summary Cards */}
      <EstimateSummaryCard estimate={estimate} items={items} />

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover active:bg-primary/80 focus:outline-none transition-colors font-semibold"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          הוסף פריט
        </button>
        <button
          onClick={handleExportToTender}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-semibold"
        >
          <span className="material-symbols-outlined text-[20px]">gavel</span>
          ייצוא למכרז
        </button>
        <button
          onClick={handleExportToExcel}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-semibold"
        >
          <span className="material-symbols-outlined text-[20px]">download</span>
          ייצוא לאקסל
        </button>
      </div>

      {/* Items Table */}
      <EstimateItemsTable
        items={items}
        onEdit={setEditingItem}
        onDelete={handleDeleteItem}
      />

      {/* Add/Edit Form Modal */}
      {(showAddForm || editingItem) && (
        <AddEstimateItemForm
          estimateId={estimate.id}
          item={editingItem}
          onSave={editingItem ? handleItemUpdated : handleItemAdded}
          onCancel={() => {
            setShowAddForm(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}
