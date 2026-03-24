'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { fetcher } from '@/lib/api';
import { formatNumber } from '@/lib/formatters';
import type { MethodSummary, PaginatedResponse } from '@/lib/types';

interface OverlapResponse {
  method1: string;
  method2: string;
  method1_groups: { group_id: number; n_proteins: number }[];
  method2_groups: { group_id: number; n_proteins: number }[];
  overlaps: { group1: number; group2: number; n_shared: number }[];
  total_shared: number;
  jaccard: number;
}

export default function ProteinOverlap() {
  const [method1, setMethod1] = useState('');
  const [method2, setMethod2] = useState('');
  const [search1, setSearch1] = useState('');
  const [search2, setSearch2] = useState('');

  const { data: allMethods } = useSWR<PaginatedResponse<MethodSummary>>(
    '/api/methods?per_page=500&sort_by=age_mae',
    fetcher,
    { revalidateOnFocus: false },
  );

  const overlapUrl = method1 && method2
    ? `/api/visualize/protein-overlap?method1=${encodeURIComponent(method1)}&method2=${encodeURIComponent(method2)}`
    : null;
  const { data: overlapData, isLoading, error } = useSWR<OverlapResponse>(
    overlapUrl,
    fetcher,
    { revalidateOnFocus: false },
  );

  // Build bar chart data from top overlapping group pairs
  const barData = useMemo(() => {
    if (!overlapData?.overlaps) return [];
    return overlapData.overlaps
      .sort((a, b) => b.n_shared - a.n_shared)
      .slice(0, 20)
      .map((o) => ({
        pair: `G${o.group1}\u2194G${o.group2}`,
        shared: o.n_shared,
        group1: o.group1,
        group2: o.group2,
      }));
  }, [overlapData]);

  function MethodPicker({
    label,
    value,
    search: searchVal,
    setSearch: setSearchVal,
    onSelect,
    exclude,
  }: {
    label: string;
    value: string;
    search: string;
    setSearch: (s: string) => void;
    onSelect: (name: string) => void;
    exclude: string;
  }) {
    const filtered = useMemo(() => {
      if (!allMethods?.items || !searchVal) return [];
      const q = searchVal.toLowerCase();
      return allMethods.items
        .filter((m) => m.method_name.toLowerCase().includes(q) && m.method_name !== exclude)
        .slice(0, 8);
    }, [searchVal, exclude]);

    return (
      <div className="flex-1 min-w-[200px]">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">{label}</span>
        {value ? (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">{value}</span>
            <button
              onClick={() => { onSelect(''); setSearchVal(''); }}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              change
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search methods..."
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {filtered.length > 0 && searchVal && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                {filtered.map((m) => (
                  <button
                    key={m.method_name}
                    onClick={() => { onSelect(m.method_name); setSearchVal(''); }}
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
    );
  }

  return (
    <div>
      {/* Method pickers */}
      <div className="flex flex-wrap gap-4 mb-6">
        <MethodPicker
          label="Method 1"
          value={method1}
          search={search1}
          setSearch={setSearch1}
          onSelect={setMethod1}
          exclude={method2}
        />
        <MethodPicker
          label="Method 2"
          value={method2}
          search={search2}
          setSearch={setSearch2}
          onSelect={setMethod2}
          exclude={method1}
        />
      </div>

      {!method1 || !method2 ? (
        <div className="p-12 text-center text-sm text-slate-400 bg-white rounded-lg shadow-sm">
          Select two methods to see protein overlap between their groups.
        </div>
      ) : isLoading ? (
        <div className="p-8 text-center text-sm text-slate-400">Computing protein overlap...</div>
      ) : error ? (
        <div className="p-8 text-center text-sm text-red-500">
          Failed to load overlap data. The backend endpoint may not be available yet.
        </div>
      ) : overlapData ? (
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-xs text-slate-500">Total Shared Proteins</p>
              <p className="text-2xl font-semibold text-slate-900">{overlapData.total_shared}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-xs text-slate-500">Jaccard Index</p>
              <p className="text-2xl font-semibold text-slate-900">{formatNumber(overlapData.jaccard, 3)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-xs text-slate-500">Group-Pair Overlaps</p>
              <p className="text-2xl font-semibold text-slate-900">{overlapData.overlaps.length}</p>
            </div>
          </div>

          {/* Bar chart */}
          {barData.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-medium text-slate-700 mb-3">
                Top Group-Pair Overlaps (# shared proteins)
              </h3>
              <ResponsiveContainer width="100%" height={Math.max(300, barData.length * 28)}>
                <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="pair"
                    tick={{ fontSize: 11 }}
                    width={80}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${value} proteins`, 'Shared']}
                    labelFormatter={(label) => `${method1} ${label.split('\u2194')[0]} \u2194 ${method2} ${label.split('\u2194')[1]}`}
                    contentStyle={{ fontSize: '12px' }}
                  />
                  <Bar dataKey="shared" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
