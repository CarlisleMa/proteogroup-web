'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { fetcher } from '@/lib/api';
import { METHOD_FAMILY_COLORS } from '@/lib/constants';
import { formatNumber } from '@/lib/formatters';
import type { MethodSummary, PaginatedResponse } from '@/lib/types';

const COMPARE_COLORS = ['#3b82f6', '#ef4444', '#22c55e'];

const RADAR_METRICS = [
  { key: 'age_mae_inv', label: 'Age Prediction', invert: 'age_mae' },
  { key: 'age_r2', label: 'R\u00b2' },
  { key: 'pearson_r', label: 'Pearson r' },
  { key: 'bootstrap_mean_ari', label: 'Stability' },
  { key: 'mean_group_size', label: 'Group Size' },
  { key: 'n_proteins_norm', label: '# Proteins', normalize: 'n_proteins_assigned' },
];

interface CompareData {
  methods: Record<string, { metadata: Record<string, unknown>; age_prediction: Record<string, unknown>; survival: Record<string, unknown>; variance_explained: number | null; correlation: Record<string, unknown>; string_ppi: Record<string, unknown> }>;
  overlap?: Record<string, { n_shared_proteins: number }>;
}

export default function MethodCompare() {
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const { data: allMethods } = useSWR<PaginatedResponse<MethodSummary>>(
    '/api/methods?per_page=500&sort_by=age_mae',
    fetcher,
    { revalidateOnFocus: false },
  );

  const compareUrl = selected.length >= 2
    ? `/api/methods/compare?methods=${selected.join(',')}`
    : null;
  const { data: compareData, isLoading } = useSWR<CompareData>(
    compareUrl,
    fetcher,
    { revalidateOnFocus: false },
  );

  const filteredMethods = useMemo(() => {
    if (!allMethods?.items || !search) return [];
    const q = search.toLowerCase();
    return allMethods.items
      .filter((m) => m.method_name.toLowerCase().includes(q))
      .filter((m) => !selected.includes(m.method_name))
      .slice(0, 8);
  }, [allMethods, search, selected]);

  // Build radar data by normalizing metrics to 0-1 across selected methods
  const radarData = useMemo(() => {
    if (!allMethods?.items || selected.length < 2) return [];

    const selectedData = allMethods.items.filter((m) => selected.includes(m.method_name));
    if (selectedData.length < 2) return [];

    // Get min/max across ALL methods for normalization
    const all = allMethods.items;
    const getRange = (key: string) => {
      const vals = all.map((m) => (m as unknown as Record<string, number>)[key]).filter((v) => v != null);
      return { min: Math.min(...vals), max: Math.max(...vals) };
    };

    const normalize = (val: number | null, key: string, invert = false) => {
      if (val == null) return 0;
      const { min, max } = getRange(key);
      if (max === min) return 0.5;
      const norm = (val - min) / (max - min);
      return invert ? 1 - norm : norm;
    };

    return [
      { metric: 'Age Prediction', ...Object.fromEntries(selectedData.map((m) => [m.method_name, normalize(m.age_mae, 'age_mae', true)])) },
      { metric: 'R\u00b2', ...Object.fromEntries(selectedData.map((m) => [m.method_name, normalize(m.age_r2, 'age_r2')])) },
      { metric: 'Pearson r', ...Object.fromEntries(selectedData.map((m) => [m.method_name, normalize(m.pearson_r, 'pearson_r')])) },
      { metric: 'Stability', ...Object.fromEntries(selectedData.map((m) => [m.method_name, normalize(m.bootstrap_mean_ari, 'bootstrap_mean_ari')])) },
      { metric: 'Group Size', ...Object.fromEntries(selectedData.map((m) => [m.method_name, normalize(m.mean_group_size, 'mean_group_size')])) },
      { metric: '# Proteins', ...Object.fromEntries(selectedData.map((m) => [m.method_name, normalize(m.n_proteins_assigned, 'n_proteins_assigned')])) },
    ];
  }, [allMethods, selected]);

  function addMethod(name: string) {
    if (selected.length < 3 && !selected.includes(name)) {
      setSelected([...selected, name]);
      setSearch('');
    }
  }

  function removeMethod(name: string) {
    setSelected(selected.filter((m) => m !== name));
  }

  return (
    <div>
      {/* Method picker */}
      <div className="mb-6">
        <p className="text-sm text-slate-500 mb-2">Select 2-3 methods to compare:</p>

        {/* Selected pills */}
        <div className="flex flex-wrap gap-2 mb-3">
          {selected.map((name, idx) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: COMPARE_COLORS[idx] }}
            >
              {name}
              <button
                onClick={() => removeMethod(name)}
                className="ml-1 hover:bg-white/20 rounded-full w-4 h-4 flex items-center justify-center text-xs"
              >
                &times;
              </button>
            </span>
          ))}
        </div>

        {/* Search input */}
        {selected.length < 3 && (
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to search methods..."
              className="w-full max-w-md px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {filteredMethods.length > 0 && search && (
              <div className="absolute top-full left-0 w-full max-w-md mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                {filteredMethods.map((m) => (
                  <button
                    key={m.method_name}
                    onClick={() => addMethod(m.method_name)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex justify-between"
                  >
                    <span className="font-medium">{m.method_name}</span>
                    <span className="text-slate-400">{m.method_family}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {selected.length < 2 ? (
        <div className="p-12 text-center text-sm text-slate-400 bg-white rounded-lg shadow-sm">
          Select at least 2 methods to see the comparison radar chart.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar chart */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Normalized Performance Radar</h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#64748b' }} />
                <PolarRadiusAxis tick={false} domain={[0, 1]} />
                {selected.map((name, idx) => (
                  <Radar
                    key={name}
                    name={name}
                    dataKey={name}
                    stroke={COMPARE_COLORS[idx]}
                    fill={COMPARE_COLORS[idx]}
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                ))}
                <Legend />
                <Tooltip
                  formatter={(value: any) => formatNumber(Number(value), 3)}
                  contentStyle={{ fontSize: '12px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Metrics table */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Raw Metrics</h3>
            {allMethods?.items && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 text-slate-500 font-medium">Metric</th>
                    {selected.map((name, idx) => (
                      <th key={name} className="text-right py-2 font-medium" style={{ color: COMPARE_COLORS[idx] }}>
                        {name.replace(/^PG_/, '')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Age MAE (yr)', key: 'age_mae', fmt: 2 },
                    { label: 'Age R\u00b2', key: 'age_r2', fmt: 3 },
                    { label: 'Pearson r', key: 'pearson_r', fmt: 3 },
                    { label: 'Stability (ARI)', key: 'bootstrap_mean_ari', fmt: 3 },
                    { label: 'k', key: 'k', fmt: 0 },
                    { label: '# Proteins', key: 'n_proteins_assigned', fmt: 0 },
                    { label: 'Mean Group Size', key: 'mean_group_size', fmt: 1 },
                  ].map((row) => {
                    const selectedItems = allMethods.items.filter((m) => selected.includes(m.method_name));
                    return (
                      <tr key={row.key} className="border-b border-slate-50">
                        <td className="py-2 text-slate-600">{row.label}</td>
                        {selected.map((name) => {
                          const m = selectedItems.find((x) => x.method_name === name);
                          const val = m ? (m as unknown as Record<string, number>)[row.key] : null;
                          return (
                            <td key={name} className="py-2 text-right font-mono text-slate-700">
                              {formatNumber(val, row.fmt)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Overlap stats */}
            {compareData?.overlap && Object.keys(compareData.overlap).length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                  Protein Overlap
                </h4>
                {Object.entries(compareData.overlap).map(([pair, stats]) => (
                  <p key={pair} className="text-sm text-slate-600">
                    {pair.replace(/_vs_/, ' vs ')}: <span className="font-semibold">{stats.n_shared_proteins}</span> shared proteins
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
