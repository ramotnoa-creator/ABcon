/**
 * Add/Edit Project Item Form
 * Creates project item with initial estimate
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { createProjectItem, updateProjectItem, type ProjectItem } from '../../services/projectItemsService';
import { createEstimate } from '../../services/projectItemEstimatesService';

interface AddProjectItemFormProps {
  projectId: string;
  item?: ProjectItem;
  onSave: (item: ProjectItem) => void;
  onCancel: () => void;
}

export default function AddProjectItemForm({
  projectId,
  item,
  onSave,
  onCancel
}: AddProjectItemFormProps) {
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [type, setType] = useState<'planning' | 'execution'>(item?.type || 'execution');
  const [category, setCategory] = useState(item?.category || '');
  const [estimatedCost, setEstimatedCost] = useState(item?.current_estimated_cost || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (item) {
        // Edit existing item
        const updatedItem = await updateProjectItem(
          item.id,
          {
            name,
            description: description || undefined,
            category: category || undefined,
            current_estimated_cost: estimatedCost,
            updated_by: 'current-user' // TODO: Get from auth context
          },
          item.version // Optimistic locking
        );

        // Create new estimate version if cost changed
        if (estimatedCost !== item.current_estimated_cost) {
          await createEstimate({
            project_item_id: item.id,
            estimated_cost: estimatedCost,
            revision_reason: 'Cost updated via edit form',
            created_by: 'current-user' // TODO: Get from auth context
          });
        }

        onSave(updatedItem);
      } else {
        // Create new item
        const newItem = await createProjectItem({
          project_id: projectId,
          name,
          description: description || undefined,
          type,
          category: category || undefined,
          created_by: 'current-user' // TODO: Get from auth context
        });

        // Create initial estimate
        await createEstimate({
          project_item_id: newItem.id,
          estimated_cost: estimatedCost,
          notes: 'Initial estimate',
          created_by: 'current-user' // TODO: Get from auth context
        });

        onSave(newItem);
      }
    } catch (err) {
      console.error('Error saving project item:', err);
      setError(err instanceof Error ? err.message : 'Failed to save project item');
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-surface-dark rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-surface-dark border-b border-border-light dark:border-border-dark px-6 py-4">
          <h2 className="text-2xl font-bold">
            {item ? 'ערוך פריט' : 'הוסף פריט'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                שם הפריט <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                תיאור (אופציונלי)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                סוג <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="planning"
                    checked={type === 'planning'}
                    onChange={(e) => setType('planning')}
                  />
                  תכנון
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="execution"
                    checked={type === 'execution'}
                    onChange={(e) => setType('execution')}
                  />
                  ביצוע
                </label>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                קטגוריה (אופציונלי)
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            {/* Estimated Cost */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                סכום אומדן <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6 justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  שומר...
                </>
              ) : (
                'שמור'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
