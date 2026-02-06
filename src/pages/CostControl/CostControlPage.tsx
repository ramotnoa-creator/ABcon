import { useState, useEffect, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';

// Lazy load tab components
const TendersTabContent = lazy(() => import('./tabs/TendersTabContent'));
const BudgetTabContent = lazy(() => import('./tabs/BudgetTabContent'));

type TabValue = 'tenders' | 'budget';

const tabs: { label: string; value: TabValue; icon: string }[] = [
  { label: 'מכרזים', value: 'tenders', icon: 'gavel' },
  { label: 'תקציב', value: 'budget', icon: 'payments' },
];

function TabLoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-4">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">טוען...</p>
      </div>
    </div>
  );
}

export default function CostControlPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabValue | null;

  // Default to 'tenders' if no tab in URL or invalid tab
  const [activeTab, setActiveTab] = useState<TabValue>(() => {
    if (tabFromUrl && tabs.some(t => t.value === tabFromUrl)) {
      return tabFromUrl;
    }
    return 'tenders';
  });

  // Sync URL ↔ tab state (single effect to avoid loop)
  useEffect(() => {
    const urlTab = searchParams.get('tab') as TabValue | null;
    const validUrlTab = urlTab && tabs.some(t => t.value === urlTab) ? urlTab : null;

    if (validUrlTab && validUrlTab !== activeTab) {
      // URL changed externally (browser back/forward) → update state
      setActiveTab(validUrlTab);
    } else if (!validUrlTab || urlTab !== activeTab) {
      // State changed → update URL
      setSearchParams({ tab: activeTab }, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);

  const handleTabChange = (newTab: TabValue) => {
    setActiveTab(newTab);
  };

  return (
    <div className="flex-1 px-4 lg:px-10 py-6 max-w-[1400px] mx-auto w-full pb-20 lg:pb-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] mb-1">
            בקרת עלויות
          </h1>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Cost Control - ניהול מכרזים ותקציב
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-6">
        <div className="border-b border-border-light dark:border-border-dark">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => handleTabChange(tab.value)}
                  className={`flex items-center gap-2 px-6 py-3 min-w-fit text-sm font-bold transition-all duration-200 relative ${
                    isActive
                      ? 'text-primary'
                      : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-primary'
                  }`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`${tab.value}-panel`}
                >
                  <span className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${
                    isActive ? 'scale-110' : ''
                  }`}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  {/* Active indicator */}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        <Suspense fallback={<TabLoadingSpinner />}>
          {activeTab === 'tenders' && (
            <div role="tabpanel" id="tenders-panel" aria-labelledby="tenders-tab">
              <TendersTabContent />
            </div>
          )}
          {activeTab === 'budget' && (
            <div role="tabpanel" id="budget-panel" aria-labelledby="budget-tab">
              <BudgetTabContent />
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
}
