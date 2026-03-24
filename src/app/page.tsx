'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { fetcher } from '@/lib/api';
import StatCard from '@/components/shared/StatCard';
import PageHeader from '@/components/layout/PageHeader';
import { TIER_COLORS, METHOD_FAMILIES } from '@/lib/constants';
import { formatNumber, formatPValue } from '@/lib/formatters';
import type { DashboardSummary, MethodSummary, PaginatedResponse } from '@/lib/types';

export default function DashboardPage() {
  const { data: summary } = useSWR<DashboardSummary>(
    '/api/dashboard',
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: families } = useSWR<
    { family: string; count: number; avg_mae: number; avg_k: number }[]
  >('/api/dashboard/family-summaries', fetcher, { revalidateOnFocus: false });

  const { data: methodsData } = useSWR<PaginatedResponse<MethodSummary>>(
    '/api/methods?sort_by=age_mae&order=asc&per_page=20',
    fetcher,
    { revalidateOnFocus: false },
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Proteogroup Discovery"
        description="Exploring coordinated protein groups across 108 methods from UK Biobank proteomics data."
      />

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="Methods"
          value={summary?.n_methods ?? '...'}
          subtitle="across 11 families"
        />
        <StatCard
          label="Proteins"
          value={summary?.n_proteins ? summary.n_proteins.toLocaleString() : '...'}
          subtitle="Olink Explore 3072"
        />
        <StatCard
          label="Method Families"
          value={summary?.n_families ?? '...'}
          subtitle="PLS, NMF, Neural, ..."
        />
        <StatCard
          label="Disease Outcomes"
          value={summary?.n_diseases ?? '...'}
          subtitle="tested associations"
        />
      </div>

      {/* Method family cards */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Method Families
        </h2>
        {families ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {families.map((f) => (
              <Link
                key={f.family}
                href={`/methods?family=${encodeURIComponent(f.family)}`}
                className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <p className="text-sm font-medium text-slate-900">
                  {f.family}
                </p>
                <p className="text-2xl font-semibold text-slate-900 mt-1">
                  {f.count}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  methods &middot; avg k={Math.round(f.avg_k)}
                </p>
                {f.avg_mae != null && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    avg MAE {formatNumber(f.avg_mae, 2)} yr
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-400">Loading families...</div>
        )}
      </section>

      {/* Biomarker tier summary */}
      {summary?.tier_counts && Object.keys(summary.tier_counts).length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Biomarker Tiers
          </h2>
          <div className="flex gap-3 flex-wrap">
            {Object.entries(summary.tier_counts).map(([tier, count]) => (
              <div
                key={tier}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                  TIER_COLORS[tier] ?? 'bg-slate-100 text-slate-700'
                }`}
              >
                <span>{tier.replace(/_/g, ' ')}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top 20 methods table */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Top Methods by Age Prediction
          </h2>
          <Link
            href="/methods"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View all methods &rarr;
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-3 font-medium text-slate-500">
                    Method
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">
                    Family
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-slate-500">
                    k
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-slate-500">
                    MAE (yr)
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-slate-500">
                    R&sup2;
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-slate-500">
                    Stability (ARI)
                  </th>
                </tr>
              </thead>
              <tbody>
                {methodsData?.items?.map((m, idx) => (
                  <tr
                    key={m.method_name}
                    className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/methods/${encodeURIComponent(m.method_name)}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {m.method_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {m.method_family}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">
                      {m.k}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">
                      {formatNumber(m.age_mae, 2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">
                      {formatNumber(m.age_r2, 3)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">
                      {formatNumber(m.bootstrap_mean_ari, 3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!methodsData && (
            <div className="p-8 text-center text-sm text-slate-400">
              Loading methods...
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
