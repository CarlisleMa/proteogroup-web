'use client';

import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import MethodLandscape from '@/components/visualize/MethodLandscape';
import BiomarkerExplorer from '@/components/visualize/BiomarkerExplorer';
import MethodCompare from '@/components/visualize/MethodCompare';
import ProteinOverlap from '@/components/visualize/ProteinOverlap';

const TABS = [
  { key: 'landscape', label: 'Method Landscape' },
  { key: 'biomarkers', label: 'Top Proteogroups' },
  { key: 'compare', label: 'Compare Methods' },
  { key: 'overlap', label: 'Protein Overlap' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function VisualizePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('landscape');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Visualize"
        description="Interactive visualizations of proteogroup discovery results across 108 methods."
      />

      {/* Tab bar */}
      <div className="border-b border-slate-200 mb-6">
        <div className="flex gap-0 -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'landscape' && <MethodLandscape />}
      {activeTab === 'biomarkers' && <BiomarkerExplorer />}
      {activeTab === 'compare' && <MethodCompare />}
      {activeTab === 'overlap' && <ProteinOverlap />}
    </div>
  );
}
