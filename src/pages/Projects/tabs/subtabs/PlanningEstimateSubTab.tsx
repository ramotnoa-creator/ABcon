import { useState, useEffect } from 'react';
import { useToast } from '../../../../contexts/ToastContext';
import { getEstimates, createEstimate } from '../../../../services/estimatesService';
import { getEstimateItems, deleteEstimateItem } from '../../../../services/estimateItemsService';
import AddEstimateItemForm from '../../../../components/Estimates/AddEstimateItemForm';
import EstimateItemsTable from '../../../../components/Estimates/EstimateItemsTable';
import EstimateSummaryCard from '../../../../components/Estimates/EstimateSummaryCard';
import type { Estimate, EstimateItem } from '../../../../types';

interface PlanningEstimateSubTabProps {
  projectId: string;
  projectName: string;
}

export default function PlanningEstimateSubTab({ projectId, projectName }: PlanningEstimateSubTabProps) {
  const { showToast } = useToast();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [items, setItems] = useState<EstimateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<EstimateItem | null>(null);

  // Load or create planning estimate
  useEffect(() => {
    const loadEstimate = async () => {
      try {
        setIsLoading(true);
        const estimates = await getEstimates(projectId, 'planning');

        let planningEstimate: Estimate;
        if (estimates.length === 0) {
          // Auto-create planning estimate if none exists
          planningEstimate = await createEstimate({
            project_id: projectId,
            estimate_type: 'planning',
            name: `${projectName} - אומדן תכנון`,
            total_amount: 0,
            status: 'active',
          });
          showToast('אומדן תכנון נוצר בהצלחה', 'success');
        } else {
          planningEstimate = estimates[0];
        }

        setEstimate(planningEstimate);

        // Load items
        const estimateItems = await getEstimateItems(planningEstimate.id);
        setItems(estimateItems);
      } catch (error) {
        console.error('Error loading planning estimate:', error);
        showToast('שגיאה בטעינת אומדן תכנון', 'error');
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

  const handleExportToTender = () => {
    showToast('ייצוא למכרז - בפיתוח', 'info');
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
    <div className="planning-estimate-subtab">
      {/* Summary Cards */}
      <EstimateSummaryCard estimate={estimate} items={items} />

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
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
