import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import CostsTab from './CostsTab';
import TendersSubTab from './subtabs/TendersSubTab';
import PaymentsSubTab from './subtabs/PaymentsSubTab';
import CashFlowSubTab from './subtabs/CashFlowSubTab';
import type { Project } from '../../../types';

interface FinancialTabProps {
  project: Project;
}

type SubTabValue = 'costs' | 'tenders' | 'payments' | 'cashflow';

const subTabs = [
  { label: 'עלויות', value: 'costs' as SubTabValue },
  { label: 'מכרזים', value: 'tenders' as SubTabValue },
  { label: 'תשלומים', value: 'payments' as SubTabValue },
  { label: 'תזרים מזומנים', value: 'cashflow' as SubTabValue },
];

export default function FinancialTab({ project }: FinancialTabProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const subtabFromUrl = searchParams.get('subtab') as SubTabValue | null;

  // Default to costs, or use URL param if valid
  const validSubtabs: SubTabValue[] = ['costs', 'tenders', 'payments', 'cashflow'];
  const initialSubTab = subtabFromUrl && validSubtabs.includes(subtabFromUrl)
    ? subtabFromUrl
    : 'costs';

  const [activeSubTab, setActiveSubTab] = useState<SubTabValue>(initialSubTab);

  // Update URL when subtab changes
  const handleSubTabChange = (newSubTab: SubTabValue) => {
    setActiveSubTab(newSubTab);
    const currentParams = Object.fromEntries(searchParams);
    setSearchParams({ ...currentParams, subtab: newSubTab });
  };

  // Sync subtab from URL when it changes externally (browser back/forward)
  useEffect(() => {
    const subtabFromUrl = searchParams.get('subtab') as SubTabValue | null;
    const targetSubTab = subtabFromUrl && validSubtabs.includes(subtabFromUrl)
      ? subtabFromUrl
      : 'costs';
    if (targetSubTab !== activeSubTab) {
      setActiveSubTab(targetSubTab);
    }
  }, [searchParams, activeSubTab]);

  return (
    <div className="financial-tab">
      {/* Sub-tabs navigation */}
      <div className="flex gap-2 border-b border-border-light dark:border-border-dark mb-6 overflow-x-auto">
        {subTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleSubTabChange(tab.value)}
            className={`px-4 py-2 text-sm font-semibold transition-all duration-200 border-b-2 whitespace-nowrap ${
              activeSubTab === tab.value
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary-light dark:text-text-secondary-dark hover:text-text-main-light dark:hover:text-text-main-dark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      <div className="subtab-content">
        {activeSubTab === 'costs' && (
          <CostsTab project={project} />
        )}
        {activeSubTab === 'tenders' && (
          <TendersSubTab project={project} />
        )}
        {activeSubTab === 'payments' && (
          <PaymentsSubTab projectId={project.id} />
        )}
        {activeSubTab === 'cashflow' && (
          <CashFlowSubTab project={project} />
        )}
      </div>
    </div>
  );
}
