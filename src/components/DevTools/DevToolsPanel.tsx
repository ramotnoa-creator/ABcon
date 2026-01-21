/**
 * Developer Tools Panel
 * Quick access to seeding, clearing data, and testing utilities
 * Only visible in development mode
 */

import { useState } from 'react';
import { seedDatabase, clearDatabase, seedDataSummary } from '../../data/seedData';
import { isDemoMode } from '../../lib/neon';
import { mergeSeedDataToNeon } from '../../services/migrationService';

export default function DevToolsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [progressLog, setProgressLog] = useState<string[]>([]);

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  const handleSeedData = async () => {
    const target = isDemoMode ? 'localStorage' : 'neon';
    const targetName = isDemoMode ? 'localStorage' : 'Neon database';

    if (!confirm(`Load comprehensive test data? This will replace existing ${targetName} data.`)) {
      return;
    }

    setIsSeeding(true);
    setLastAction(null);

    try {
      const result = await seedDatabase(target);
      setLastAction(`✅ Seeded ${result.totalRecords} records to ${targetName}!`);
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
    const target = isDemoMode ? 'localStorage' : 'neon';
    const targetName = isDemoMode ? 'localStorage' : 'Neon database';

    if (!confirm(`⚠️ CLEAR ALL DATA from ${targetName}? This cannot be undone!`)) {
      return;
    }

    if (!confirm('Are you ABSOLUTELY SURE? All project data will be deleted!')) {
      return;
    }

    setIsSeeding(true);
    setLastAction(null);

    try {
      const result = await clearDatabase(target);
      setLastAction(`🗑️ Cleared ${result.clearedKeys} ${isDemoMode ? 'keys' : 'tables'} from ${targetName}!`);

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

  const handleMergeToNeon = async () => {
    if (isDemoMode) {
      setLastAction('❌ Cannot merge - not connected to Neon (demo mode)');
      return;
    }

    if (!confirm('Merge seed data to Neon production?\n\nThis will ADD records (not replace existing data).\n\nThis is a ONE-TIME operation - running again will create duplicates.')) {
      return;
    }

    setIsSeeding(true);
    setLastAction(null);
    setProgressLog([]);

    try {
      const result = await mergeSeedDataToNeon((message) => {
        setProgressLog((prev) => [...prev.slice(-8), message]);
      });

      const totalCreated = Object.values(result.created).reduce((a, b) => a + b, 0);

      if (result.success) {
        setLastAction(`✅ Merged ${totalCreated} records to Neon!`);
      } else {
        setLastAction(`⚠️ Merged ${totalCreated} records with ${result.errors.length} errors`);
      }

      console.log('Migration result:', result);

      // Reload page to see new data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setLastAction(`❌ Migration failed: ${error}`);
      console.error('Migration error:', error);
    } finally {
      setIsSeeding(false);
    }
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
            {/* Database Status */}
            <div className="text-xs bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-blue-600 dark:text-blue-400">
                  {isDemoMode ? 'storage' : 'cloud'}
                </span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {isDemoMode ? 'localStorage (Demo Mode)' : 'Neon Database (Connected)'}
                </span>
              </div>
            </div>

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

            {/* Merge to Neon Button - Only show when connected */}
            {!isDemoMode && (
              <button
                onClick={handleMergeToNeon}
                disabled={isSeeding}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isSeeding ? 'hourglass_empty' : 'merge'}
                </span>
                {isSeeding ? 'Merging...' : 'Merge Seed Data to Neon'}
              </button>
            )}

            {/* Progress Log */}
            {progressLog.length > 0 && (
              <div className="text-[10px] p-2 bg-gray-900 text-green-400 rounded border border-gray-700 font-mono max-h-32 overflow-y-auto">
                {progressLog.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            )}

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
                <li>Very large amounts (&gt;1M)</li>
                <li>Inactive professionals</li>
                <li>Old open issues (&gt;90 days)</li>
                <li>Orphaned files</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
