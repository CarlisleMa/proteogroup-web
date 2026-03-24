'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { fetcher } from '@/lib/api';
import { BIOMARKER_COMPONENT_COLORS, TIER_COLORS } from '@/lib/constants';
import { formatNumber } from '@/lib/formatters';
import type { BiomarkerNomination } from '@/lib/types';

const COMPONENT_KEYS = Object.keys(BIOMARKER_COMPONENT_COLORS) as (keyof typeof BIOMARKER_COMPONENT_COLORS)[];

const SORT_OPTIONS = [
  { key: 'composite_score', label: 'Composite Score' },
  ...COMPONENT_KEYS.map((k) => ({
    key: k,
    label: BIOMARKER_COMPONENT_COLORS[k].label,
  })),
];

const TIER_FILTER_OPTIONS = [
  { key: '', label: 'All Tiers' },
  { key: 'Tier1_Novel', label: 'Tier 1 (Novel)' },
  { key: 'Tier2_Confirmatory', label: 'Tier 2 (Confirmatory)' },
  { key: 'Tier3_Exploratory', label: 'Tier 3 (Exploratory)' },
];

function ScoreBar({ nomination }: { nomination: BiomarkerNomination }) {
  const nomRecord = nomination as unknown as Record<string, number>;
  const data = COMPONENT_KEYS.map((key) => ({
    name: BIOMARKER_COMPONENT_COLORS[key].label,
    value: nomRecord[key] ?? 0,
    color: BIOMARKER_COMPONENT_COLORS[key].color,
  }));

  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <XAxis type="number" domain={[0, 1]} hide />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip
            formatter={(value: any, name: any) => [formatNumber(Number(value), 2), String(name)]}
            contentStyle={{ fontSize: '12px' }}
          />
          <Bar dataKey="value" radius={[2, 2, 2, 2]} barSize={24}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function BiomarkerExplorer() {
  const [tierFilter, setTierFilter] = useState('');
  const [sortBy, setSortBy] = useState('composite_score');

  const url = tierFilter
    ? `/api/biomarkers/nominations?tier=${tierFilter}&limit=50`
    : '/api/biomarkers/nominations?limit=50';

  const { data: nominations, isLoading, error } = useSWR<BiomarkerNomination[]>(
    url,
    fetcher,
    { revalidateOnFocus: false },
  );

  const sorted = useMemo(() => {
    if (!nominations) return [];
    return [...nominations].sort((a, b) => {
      const aVal = (a as unknown as Record<string, number>)[sortBy] ?? 0;
      const bVal = (b as unknown as Record<string, number>)[sortBy] ?? 0;
      return bVal - aVal;
    });
  }, [nominations, sortBy]);

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-slate-400">Loading biomarker nominations...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-sm text-red-500">Failed to load data.</div>;
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tier</span>
          <div className="flex gap-1">
            {TIER_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setTierFilter(opt.key)}
                className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                  tierFilter === opt.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {COMPONENT_KEYS.map((key) => (
          <div key={key} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: BIOMARKER_COMPONENT_COLORS[key].color }}
            />
            <span className="text-xs text-slate-500">{BIOMARKER_COMPONENT_COLORS[key].label}</span>
          </div>
        ))}
      </div>

      {/* Cards */}
      {sorted.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400">No nominations found.</div>
      ) : (
        <div className="space-y-3">
          {sorted.map((nom, idx) => (
            <Link
              key={`${nom.method_name}-${nom.pg_group}`}
              href={`/proteogroups/${encodeURIComponent(nom.method_name)}/${nom.pg_group}`}
              className="block bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-xs text-slate-400 font-mono mr-2">#{idx + 1}</span>
                  <span className="font-medium text-slate-900">{nom.method_name}</span>
                  <span className="text-slate-400 mx-1">/</span>
                  <span className="text-slate-700">Group {nom.pg_group}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-slate-900">
                    {formatNumber(nom.composite_score, 1)}
                  </span>
                  {nom.tier && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      TIER_COLORS[nom.tier] ?? 'bg-slate-100 text-slate-600'
                    }`}>
                      {nom.tier.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              </div>

              <ScoreBar nomination={nom} />

              {nom.top_proteins && nom.top_proteins.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {(Array.isArray(nom.top_proteins) ? nom.top_proteins : []).slice(0, 6).map((p) => {
                    const name = typeof p === 'string' ? p : (p as Record<string, unknown>).protein as string;
                    return (
                      <span
                        key={name}
                        className="px-2 py-0.5 bg-slate-50 text-slate-600 text-xs rounded-full"
                      >
                        {name}
                      </span>
                    );
                  })}
                  {nom.top_proteins.length > 6 && (
                    <span className="text-xs text-slate-400">+{nom.top_proteins.length - 6} more</span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
