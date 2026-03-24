'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { fetcher } from '@/lib/api';
import { METHOD_FAMILY_COLORS } from '@/lib/constants';
import { formatNumber } from '@/lib/formatters';
import AxisSelector from './AxisSelector';
import type { MethodSummary, PaginatedResponse } from '@/lib/types';

const AXIS_OPTIONS = [
  { key: 'age_mae', label: 'Age MAE (yr)' },
  { key: 'age_r2', label: 'Age R\u00b2' },
  { key: 'pearson_r', label: 'Pearson r' },
  { key: 'bootstrap_mean_ari', label: 'Stability (ARI)' },
  { key: 'k', label: 'k (# groups)' },
  { key: 'n_proteins_assigned', label: '# Proteins' },
  { key: 'mean_group_size', label: 'Mean Group Size' },
  { key: 'group_size_cv', label: 'Group Size CV' },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: { payload: MethodSummary }[];
}

function MethodTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.[0]) return null;
  const m = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs max-w-xs">
      <p className="font-semibold text-slate-900 mb-1">{m.method_name}</p>
      <p className="text-slate-500 mb-2">{m.method_family}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-slate-400">MAE:</span>
        <span className="font-mono text-right">{formatNumber(m.age_mae, 2)} yr</span>
        <span className="text-slate-400">R\u00b2:</span>
        <span className="font-mono text-right">{formatNumber(m.age_r2, 3)}</span>
        <span className="text-slate-400">k:</span>
        <span className="font-mono text-right">{m.k}</span>
        <span className="text-slate-400">ARI:</span>
        <span className="font-mono text-right">{formatNumber(m.bootstrap_mean_ari, 3)}</span>
        <span className="text-slate-400">Proteins:</span>
        <span className="font-mono text-right">{m.n_proteins_assigned}</span>
      </div>
    </div>
  );
}

export default function MethodLandscape() {
  const router = useRouter();
  const [xAxis, setXAxis] = useState('age_mae');
  const [yAxis, setYAxis] = useState('age_r2');
  const [sizeAxis, setSizeAxis] = useState('k');

  const { data, isLoading, error } = useSWR<PaginatedResponse<MethodSummary>>(
    '/api/methods?per_page=500&sort_by=age_mae',
    fetcher,
    { revalidateOnFocus: false },
  );

  const familyGroups = useMemo(() => {
    if (!data?.items) return {};
    const groups: Record<string, MethodSummary[]> = {};
    for (const m of data.items) {
      const fam = m.method_family || 'Unknown';
      if (!groups[fam]) groups[fam] = [];
      groups[fam].push(m);
    }
    return groups;
  }, [data]);

  const xLabel = AXIS_OPTIONS.find((o) => o.key === xAxis)?.label ?? xAxis;
  const yLabel = AXIS_OPTIONS.find((o) => o.key === yAxis)?.label ?? yAxis;

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-slate-400">Loading methods...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-sm text-red-500">Failed to load data.</div>;
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <AxisSelector label="X Axis" value={xAxis} options={AXIS_OPTIONS} onChange={setXAxis} />
        <AxisSelector label="Y Axis" value={yAxis} options={AXIS_OPTIONS} onChange={setYAxis} />
        <AxisSelector label="Size" value={sizeAxis} options={AXIS_OPTIONS} onChange={setSizeAxis} />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <ResponsiveContainer width="100%" height={500}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              type="number"
              dataKey={xAxis}
              name={xLabel}
              tick={{ fontSize: 12 }}
              label={{ value: xLabel, position: 'bottom', offset: 20, style: { fontSize: 12, fill: '#64748b' } }}
            />
            <YAxis
              type="number"
              dataKey={yAxis}
              name={yLabel}
              tick={{ fontSize: 12 }}
              label={{ value: yLabel, angle: -90, position: 'left', offset: 20, style: { fontSize: 12, fill: '#64748b' } }}
            />
            <ZAxis type="number" dataKey={sizeAxis} range={[40, 400]} />
            <Tooltip content={<MethodTooltip />} />
            {Object.entries(familyGroups).map(([family, methods]) => (
              <Scatter
                key={family}
                name={family}
                data={methods}
                fill={METHOD_FAMILY_COLORS[family] ?? '#94a3b8'}
                fillOpacity={0.7}
                onClick={(_data: any, _index: any, e: any) => {
                  const name = e?.payload?.method_name ?? _data?.method_name ?? _data?.payload?.method_name;
                  if (name) {
                    router.push(`/methods/${encodeURIComponent(name)}`);
                  }
                }}
                cursor="pointer"
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4">
        {Object.entries(familyGroups).map(([family, methods]) => (
          <div key={family} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: METHOD_FAMILY_COLORS[family] ?? '#94a3b8' }}
            />
            <span className="text-xs text-slate-600">
              {family} ({methods.length})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
