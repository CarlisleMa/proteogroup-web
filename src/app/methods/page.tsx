'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMethods } from '@/hooks/useMethod';
import PageHeader from '@/components/layout/PageHeader';
import { METHOD_FAMILIES, METHOD_FAMILY_COLORS } from '@/lib/constants';
import { formatNumber } from '@/lib/formatters';

type SortKey =
  | 'method_name'
  | 'method_family'
  | 'k'
  | 'age_mae'
  | 'age_r2'
  | 'pearson_r'
  | 'bootstrap_mean_ari'
  | 'n_proteins_assigned'
  | 'mean_group_size';

const COLUMNS: { key: SortKey; label: string; align: 'left' | 'right' }[] = [
  { key: 'method_name', label: 'Method', align: 'left' },
  { key: 'method_family', label: 'Family', align: 'left' },
  { key: 'k', label: 'k', align: 'right' },
  { key: 'n_proteins_assigned', label: 'Proteins', align: 'right' },
  { key: 'mean_group_size', label: 'Avg Group', align: 'right' },
  { key: 'age_mae', label: 'MAE (yr)', align: 'right' },
  { key: 'age_r2', label: 'R\u00b2', align: 'right' },
  { key: 'pearson_r', label: 'Pearson r', align: 'right' },
  { key: 'bootstrap_mean_ari', label: 'Stability', align: 'right' },
];

export default function MethodsPage() {
  const [sortBy, setSortBy] = useState<SortKey>('age_mae');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [family, setFamily] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useMethods({
    sort_by: sortBy,
    order,
    family: family || undefined,
    page,
  });

  function handleSort(key: SortKey) {
    if (sortBy === key) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setOrder(key === 'method_name' || key === 'method_family' ? 'asc' : 'asc');
    }
    setPage(1);
  }

  function sortIndicator(key: SortKey) {
    if (sortBy !== key) return null;
    return (
      <span className="ml-1 text-blue-500">
        {order === 'asc' ? '\u2191' : '\u2193'}
      </span>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Methods"
        description="All 108 proteogroup discovery methods. Click a column header to sort, or filter by family."
      />

      {/* Filter row */}
      <div className="flex items-center gap-4 mb-6 animate-fade-in">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Family</span>
          <select
            value={family}
            onChange={(e) => {
              setFamily(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
          >
            <option value="">All</option>
            {METHOD_FAMILIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        {data && (
          <span className="text-sm text-slate-400">
            {data.total} method{data.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-modern">
            <thead>
              <tr>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={`cursor-pointer select-none hover:text-slate-700 ${
                      col.align === 'right' ? 'text-right' : 'text-left'
                    } ${sortBy === col.key ? 'text-blue-600' : ''}`}
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                    {sortIndicator(col.key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((m) => (
                <tr key={m.method_name}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/methods/${encodeURIComponent(m.method_name)}`}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {m.method_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <span
                        className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                        style={{ backgroundColor: METHOD_FAMILY_COLORS[m.method_family] ?? '#94a3b8' }}
                      />
                      {m.method_family}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {m.k}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {m.n_proteins_assigned}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {formatNumber(m.mean_group_size, 1)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {formatNumber(m.age_mae, 2)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {formatNumber(m.age_r2, 3)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {formatNumber(m.pearson_r, 3)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {formatNumber(m.bootstrap_mean_ari, 3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isLoading && (
          <div className="p-8 text-center text-sm text-slate-400">
            Loading methods...
          </div>
        )}

        {/* Pagination */}
        {data && data.total > 50 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="text-sm text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              &larr; Previous
            </button>
            <span className="text-sm text-slate-400">
              Page {page} of {Math.ceil(data.total / 50)}
            </span>
            <button
              onClick={() =>
                setPage(Math.min(Math.ceil(data.total / 50), page + 1))
              }
              disabled={page >= Math.ceil(data.total / 50)}
              className="text-sm text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              Next &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
