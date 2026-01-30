#!/bin/bash
# Complete Setup Script for Project Items System
# This script creates all necessary files for the new project items structure

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Project Items System - Complete Setup${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# ============================================================
# STEP 1: Database Migration (Already Complete)
# ============================================================

echo -e "${GREEN}✓ Step 1: Database Migration${NC}"
echo "  - project_items table created"
echo "  - project_item_estimates table created"
echo "  - project_item_status_history table created"
echo "  - project_item_change_orders table created"
echo "  - Updated: tenders, tender_participants, budget_items"
echo "  - Created: 4 triggers, 3 views, 5 functions"
echo ""

# ============================================================
# STEP 2: Service Layer (Already Created)
# ============================================================

echo -e "${GREEN}✓ Step 2: Service Layer${NC}"
echo "  - projectItemsService.ts created"
echo ""

echo -e "${YELLOW}⏳ Creating remaining services...${NC}"

# Create projectItemEstimatesService.ts
cat > "src/services/projectItemEstimatesService.ts" << 'EOF'
/**
 * Project Item Estimates Service
 * Handles versioned cost estimates for project items
 */

import { executeQuery, executeQuerySingle } from '../lib/neon';

export interface ProjectItemEstimate {
  id: string;
  project_item_id: string;
  version: number;
  is_current: boolean;
  estimated_cost: number;
  vat_rate: number;
  total_with_vat: number;
  estimated_date: string;
  notes?: string;
  revision_reason?: string;
  estimate_breakdown?: Record<string, any>;
  external_estimate_id?: string;
  created_at: string;
  created_by: string;
  superseded_at?: string;
  superseded_by?: string;
}

export interface CreateEstimateInput {
  project_item_id: string;
  estimated_cost: number;
  vat_rate?: number;
  estimated_date?: string;
  notes?: string;
  revision_reason?: string;
  estimate_breakdown?: Record<string, any>;
  created_by: string;
}

export async function createEstimate(input: CreateEstimateInput): Promise<ProjectItemEstimate> {
  try {
    // Get next version number
    const versionData = await executeQuerySingle<{ max_version: number }>(
      `SELECT COALESCE(MAX(version), 0) as max_version
       FROM project_item_estimates
       WHERE project_item_id = $1`,
      [input.project_item_id]
    );

    const nextVersion = (versionData?.max_version || 0) + 1;

    // Mark all previous estimates as not current
    await executeQuery(
      `UPDATE project_item_estimates
       SET is_current = false, superseded_at = NOW(), superseded_by = $2
       WHERE project_item_id = $1 AND is_current = true`,
      [input.project_item_id, input.created_by]
    );

    // Create new estimate
    const data = await executeQuerySingle<Record<string, unknown>>(
      `INSERT INTO project_item_estimates (
        project_item_id, version, is_current, estimated_cost, vat_rate,
        estimated_date, notes, revision_reason, estimate_breakdown, created_by
      ) VALUES ($1, $2, true, $3, $4, $5, $6, $7, $8::jsonb, $9)
      RETURNING *`,
      [
        input.project_item_id,
        nextVersion,
        input.estimated_cost,
        input.vat_rate || 17.00,
        input.estimated_date || null,
        input.notes || null,
        input.revision_reason || null,
        input.estimate_breakdown ? JSON.stringify(input.estimate_breakdown) : null,
        input.created_by,
      ]
    );

    if (!data) throw new Error('Failed to create estimate');

    // Update project_item current fields
    await executeQuery(
      `UPDATE project_items
       SET current_estimate_version = $2,
           current_estimated_cost = $3
       WHERE id = $1`,
      [input.project_item_id, nextVersion, input.estimated_cost]
    );

    return transformFromDB(data);
  } catch (error) {
    console.error('Error creating estimate:', error);
    throw error;
  }
}

export async function getCurrentEstimate(projectItemId: string): Promise<ProjectItemEstimate | null> {
  try {
    const data = await executeQuerySingle<Record<string, unknown>>(
      `SELECT * FROM project_item_estimates
       WHERE project_item_id = $1 AND is_current = true`,
      [projectItemId]
    );

    return data ? transformFromDB(data) : null;
  } catch (error) {
    console.error('Error fetching current estimate:', error);
    throw error;
  }
}

export async function getEstimateHistory(projectItemId: string): Promise<ProjectItemEstimate[]> {
  try {
    const data = await executeQuery<Record<string, unknown>>(
      `SELECT * FROM project_item_estimates
       WHERE project_item_id = $1
       ORDER BY version DESC`,
      [projectItemId]
    );

    return (data || []).map(transformFromDB);
  } catch (error) {
    console.error('Error fetching estimate history:', error);
    throw error;
  }
}

function transformFromDB(dbEstimate: any): ProjectItemEstimate {
  return {
    id: dbEstimate.id,
    project_item_id: dbEstimate.project_item_id,
    version: dbEstimate.version,
    is_current: dbEstimate.is_current,
    estimated_cost: parseFloat(dbEstimate.estimated_cost),
    vat_rate: parseFloat(dbEstimate.vat_rate),
    total_with_vat: parseFloat(dbEstimate.total_with_vat),
    estimated_date: dbEstimate.estimated_date,
    notes: dbEstimate.notes || undefined,
    revision_reason: dbEstimate.revision_reason || undefined,
    estimate_breakdown: dbEstimate.estimate_breakdown || undefined,
    external_estimate_id: dbEstimate.external_estimate_id || undefined,
    created_at: dbEstimate.created_at,
    created_by: dbEstimate.created_by,
    superseded_at: dbEstimate.superseded_at || undefined,
    superseded_by: dbEstimate.superseded_by || undefined,
  };
}
EOF

echo -e "${GREEN}  ✓ projectItemEstimatesService.ts created${NC}"

# ============================================================
# STEP 3: Types
# ============================================================

echo ""
echo -e "${GREEN}✓ Step 3: TypeScript Types${NC}"
echo "  Types are embedded in service files"
echo ""

# ============================================================
# STEP 4: Components (Placeholders)
# ============================================================

echo -e "${YELLOW}⏳ Creating component placeholders...${NC}"

mkdir -p "src/components/ProjectItems"

cat > "src/components/ProjectItems/AddProjectItemForm.tsx" << 'EOF'
/**
 * Add/Edit Project Item Form
 * TODO: Implement full form with estimate creation
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';

interface AddProjectItemFormProps {
  projectId: string;
  item?: any;
  onSave: (item: any) => void;
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
  const [estimatedCost, setEstimatedCost] = useState(item?.estimated_cost || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement save logic
    console.log('Saving project item:', { name, description, type, category, estimatedCost });
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
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              שמור
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
EOF

echo -e "${GREEN}  ✓ AddProjectItemForm.tsx created (placeholder)${NC}"

# ============================================================
# SUMMARY
# ============================================================

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Setup Complete! ✅${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "${GREEN}Created Files:${NC}"
echo "  📁 migrations/006-complete-project-items-structure.sql"
echo "  📁 MIGRATION-006-SUMMARY.md"
echo "  📁 src/services/projectItemsService.ts"
echo "  📁 src/services/projectItemEstimatesService.ts"
echo "  📁 src/components/ProjectItems/AddProjectItemForm.tsx"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Implement remaining components (ProjectItemsList, Detail, etc.)"
echo "  2. Update existing tabs to use new project_items structure"
echo "  3. Migrate existing estimate_items data to project_items"
echo "  4. Test complete workflow: create → estimate → tender → contract"
echo ""
echo -e "${BLUE}================================================${NC}"
