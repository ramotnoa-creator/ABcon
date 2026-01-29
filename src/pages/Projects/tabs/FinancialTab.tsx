import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PlanningEstimateSubTab from './subtabs/PlanningEstimateSubTab';
import ExecutionEstimateSubTab from './subtabs/ExecutionEstimateSubTab';
import TendersSubTab from './subtabs/TendersSubTab';
import BudgetSubTab from './subtabs/BudgetSubTab';
import PaymentsSubTab from './subtabs/PaymentsSubTab';
import type { Project } from '../../../types';

interface FinancialTabProps {
  project: Project;
}

type SubTabValue = 'planning-estimate' | 'execution-estimate' | 'tenders' | 'budget' | 'payments';

const subTabs = [
  { label: 'אומדן תכנון', value: 'planning-estimate' as SubTabValue },
  { label: 'אומדן ביצוע', value: 'execution-estimate' as SubTabValue },
  { label: 'מכרזים', value: 'tenders' as SubTabValue },
  { label: 'תקציב', value: 'budget' as SubTabValue },
  { label: 'תשלומים', value: 'payments' as SubTabValue },
];

export default function FinancialTab({ project }: FinancialTabProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const subtabFromUrl = searchParams.get('subtab') as SubTabValue | null;

  // Default to planning-estimate, or use URL param if valid
  const validSubtabs: SubTabValue[] = ['planning-estimate', 'execution-estimate', 'tenders', 'budget', 'payments'];
  const initialSubTab = subtabFromUrl && validSubtabs.includes(subtabFromUrl)
    ? subtabFromUrl
    : 'planning-estimate';

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
      : 'planning-estimate';
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
        {activeSubTab === 'planning-estimate' && (
          <PlanningEstimateSubTab projectId={project.id} projectName={project.project_name} />
        )}
        {activeSubTab === 'execution-estimate' && (
          <ExecutionEstimateSubTab projectId={project.id} projectName={project.project_name} />
        )}
        {activeSubTab === 'tenders' && (
          <TendersSubTab project={project} />
        )}
        {activeSubTab === 'budget' && (
          <BudgetSubTab project={project} />
        )}
        {activeSubTab === 'payments' && (
          <PaymentsSubTab projectId={project.id} />
        )}
      </div>
    </div>
  );
}
