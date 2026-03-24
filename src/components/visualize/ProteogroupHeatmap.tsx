'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { TIER_COLORS } from '@/lib/constants';
import { formatNumber } from '@/lib/formatters';

interface GroupInfo {
  group_id: number;
  n_proteins: number;
  n_enriched_terms: number;
  composite_score: number | null;
  permutation_importance_mean: number | null;
  theme_confidence: number | null;
  tier: string | null;
  dominant_theme: string | null;
  top_pathway: string | null;
}

interface ProteogroupHeatmapProps {
  groups: GroupInfo[];
  methodName: string;
}

const COLUMNS = [
  { key: 'n_proteins', label: '# Proteins' },
  { key: 'n_enriched_terms', label: 'Enriched Terms' },
  { key: 'composite_score', label: 'Composite Score' },
  { key: 'permutation_importance_mean', label: 'Importance' },
  { key: 'theme_confidence', label: 'Theme Conf.' },
] as const;

type ColKey = (typeof COLUMNS)[number]['key'];

function getHeatColor(value: number | null, min: number, max: number): string {
  if (value == null || max === min) return 'bg-slate-50';
  const norm = (value - min) / (max - min);
  if (norm < 0.1) return 'bg-blue-50';
  if (norm < 0.25) return 'bg-blue-100';
  if (norm < 0.4) return 'bg-blue-200';
  if (norm < 0.55) return 'bg-blue-300 text-white';
  if (norm < 0.7) return 'bg-blue-400 text-white';
  if (norm < 0.85) return 'bg-blue-500 text-white';
  return 'bg-blue-600 text-white';
}

export default function ProteogroupHeatmap({ groups, methodName }: ProteogroupHeatmapProps) {
  // Compute min/max for each column
  const ranges = useMemo(() => {
    const result: Record<ColKey, { min: number; max: number }> = {} as Record<ColKey, { min: number; max: number }>;
    for (const col of COLUMNS) {
      const vals = groups
        .map((g) => (g as unknown as Record<string, number>)[col.key])
        .filter((v) => v != null);
      result[col.key] = {
        min: vals.length > 0 ? Math.min(...vals) : 0,
        max: vals.length > 0 ? Math.max(...vals) : 1,
      };
    }
    return result;
  }, [groups]);

  // Sort by composite_score descending
  const sorted = useMemo(
    () => [...groups].sort((a, b) => (b.composite_score ?? 0) - (a.composite_score ?? 0)),
    [groups],
  );

  if (groups.length === 0) {
    return <div className="p-8 text-center text-sm text-slate-400">No group data available.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left px-2 py-2 font-medium text-slate-500 sticky left-0 bg-white z-10 min-w-[180px]">
              Group
            </th>
            {COLUMNS.map((col) => (
              <th key={col.key} className="text-center px-2 py-2 font-medium text-slate-500 min-w-[90px]">
                {col.label}
              </th>
            ))}
            <th className="text-left px-2 py-2 font-medium text-slate-500">Theme</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((g) => (
            <tr key={g.group_id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
              <td className="px-2 py-1.5 sticky left-0 bg-white z-10">
                <Link
                  href={`/proteogroups/${encodeURIComponent(methodName)}/${g.group_id}`}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Group {g.group_id}
                </Link>
                {g.tier && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                    TIER_COLORS[g.tier] ?? 'bg-slate-100 text-slate-500'
                  }`}>
                    {g.tier.split('_')[0]}
                  </span>
                )}
              </td>
              {COLUMNS.map((col) => {
                const val = (g as unknown as Record<string, number | null>)[col.key] ?? null;
                const { min, max } = ranges[col.key];
                return (
                  <td
                    key={col.key}
                    className={`px-2 py-1.5 text-center font-mono ${getHeatColor(val, min, max)}`}
                  >
                    {val != null ? formatNumber(val, col.key === 'composite_score' ? 1 : 2) : '\u2014'}
                  </td>
                );
              })}
              <td className="px-2 py-1.5 text-slate-500 truncate max-w-[150px]" title={g.dominant_theme ?? ''}>
                {g.dominant_theme ?? '\u2014'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Color legend */}
      <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
        <span>Low</span>
        <div className="flex gap-0.5">
          {['bg-blue-50', 'bg-blue-100', 'bg-blue-200', 'bg-blue-300', 'bg-blue-400', 'bg-blue-500', 'bg-blue-600'].map((c) => (
            <div key={c} className={`w-5 h-3 rounded-sm ${c}`} />
          ))}
        </div>
        <span>High</span>
      </div>
    </div>
  );
}
