'use client';

import { useState } from 'react';

interface Tab {
  key: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (key: string) => void;
}

export default function Tabs({ tabs, defaultTab, onChange }: TabsProps) {
  const [activeKey, setActiveKey] = useState(defaultTab || tabs[0]?.key || '');

  function handleSelect(key: string) {
    setActiveKey(key);
    onChange?.(key);
  }

  const activeTab = tabs.find((t) => t.key === activeKey);

  return (
    <div>
      {/* Tab list */}
      <div className="border-b border-slate-200" role="tablist">
        <div className="flex gap-0 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={tab.key === activeKey}
              onClick={() => handleSelect(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab.key === activeKey
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab panel */}
      <div className="pt-4" role="tabpanel">
        {activeTab?.content}
      </div>
    </div>
  );
}
