/**
 * Developer Tools Panel
 * Quick access to seeding, clearing data, and testing utilities
 * Only visible in development mode
 */

import { useState } from 'react';
import { seedDatabase, clearDatabase, seedDataSummary } from '../../data/seedData';

export default function DevToolsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  const handleSeedData = async () => {
    if (!confirm('Load comprehensive test data? This will replace existing localStorage data.')) {
      return;
    }

    setIsSeeding(true);
    setLastAction(null);

    try {
      const result = await seedDatabase('localStorage');
      setLastAction(`✅ Seeded ${result.totalRecords} records successfully!`);
      console.log('Seed complete:', result);

      // Reload page to see new data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setLastAction(`❌ Error seeding data: ${error}`);
      console.error('Seed error:', error);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm('⚠️ CLEAR ALL DATA? This cannot be undone!')) {
      return;
    }

    if (!confirm('Are you ABSOLUTELY SURE? All project data will be deleted!')) {
      return;
    }

    setIsSeeding(true);
    setLastAction(null);

    try {
      const result = await clearDatabase('localStorage');
      setLastAction(`🗑️ Cleared ${result.clearedKeys} keys successfully!`);

      // Reload page
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setLastAction(`❌ Error clearing data: ${error}`);
      console.error('Clear error:', error);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleToggleDemoMode = () => {
    const current = localStorage.getItem('anprojects:demo_mode') === 'true';
    localStorage.setItem('anprojects:demo_mode', (!current).toString());
    setLastAction(`Demo mode ${!current ? 'ENABLED' : 'DISABLED'}`);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 size-12 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700 transition-all flex items-center justify-center"
          title="Open Dev Tools"
        >
          <span className="material-symbols-outlined text-[20px]">build</span>
        </button>
      )}

      {/* Dev Tools Panel */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-80 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-purple-50 dark:bg-purple-900/20 rounded-t-lg">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">
                build
              </span>
              <h3 className="font-bold text-sm">Dev Tools</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="size-6 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Seed Data Summary */}
            <div className="text-xs bg-gray-50 dark:bg-gray-900/50 p-3 rounded border border-gray-200 dark:border-gray-700">
              <div className="font-bold mb-2 text-purple-600 dark:text-purple-400">
                📦 Seed Data Available:
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <div>Projects: {seedDataSummary.projects}</div>
                <div>Professionals: {seedDataSummary.professionals}</div>
                <div>Budget Items: {seedDataSummary.budgetItems}</div>
                <div>Payments: {seedDataSummary.budgetPayments}</div>
                <div>Milestones: {seedDataSummary.projectMilestones}</div>
                <div>Files: {seedDataSummary.files}</div>
                <div>Issues: {seedDataSummary.specialIssues}</div>
                <div>Tenders: {seedDataSummary.tenders}</div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600 font-bold">
                Total: {Object.values(seedDataSummary).reduce((a, b) => a + b, 0)} records
              </div>
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleSeedData}
              disabled={isSeeding}
              className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isSeeding ? 'hourglass_empty' : 'download'}
              </span>
              {isSeeding ? 'Loading...' : 'Load Test Data'}
            </button>

            <button
              onClick={handleClearData}
              disabled={isSeeding}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">delete_forever</span>
              Clear All Data
            </button>

            <button
              onClick={handleToggleDemoMode}
              disabled={isSeeding}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
              Toggle Demo Mode
            </button>

            {/* Last Action Result */}
            {lastAction && (
              <div className="text-xs p-2 bg-gray-100 dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-600">
                {lastAction}
              </div>
            )}

            {/* Info */}
            <div className="text-[10px] text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="font-bold mb-1">Edge Cases Included:</div>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Overdue projects & milestones</li>
                <li>Budget overruns (15%+)</li>
                <li>Zero quantity items</li>
                <li>Past due payments</li>
                <li>Very large amounts (>1M)</li>
                <li>Inactive professionals</li>
                <li>Old open issues (>90 days)</li>
                <li>Orphaned files</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
