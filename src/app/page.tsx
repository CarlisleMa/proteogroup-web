'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { fetcher } from '@/lib/api';
import StatCard from '@/components/shared/StatCard';
import { TIER_COLORS, METHOD_FAMILY_COLORS } from '@/lib/constants';
import { formatNumber } from '@/lib/formatters';
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
    <div>
      {/* Hero section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white">
        {/* Decorative grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }} />
        {/* Decorative gradient orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-20">
          <div className="animate-fade-in-up">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Proteogroup Discovery
            </h1>
            <p className="mt-3 text-lg text-blue-200/80 max-w-2xl leading-relaxed">
              Exploring coordinated protein groups across 108 methods from
              UK Biobank proteomics data.
            </p>
          </div>

          {/* Quick stats overlaying hero */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
            {[
              { label: 'Methods', value: summary?.n_methods ?? '...', sub: 'across 11 families' },
              { label: 'Proteins', value: summary?.n_proteins ? summary.n_proteins.toLocaleString() : '...', sub: 'Olink Explore 3072' },
              { label: 'Families', value: summary?.n_families ?? '...', sub: 'PLS, NMF, Neural, ...' },
              { label: 'Disease Outcomes', value: summary?.n_diseases ?? '...', sub: 'tested associations' },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="bg-white/[0.07] backdrop-blur-md border border-white/10 rounded-xl p-5 hover:bg-white/[0.12] transition-colors duration-300"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <p className="text-sm text-blue-300/70 font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                <p className="text-xs text-blue-300/50 mt-1">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Method family cards */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900">
              Method Families
            </h2>
            <Link href="/methods" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all &rarr;
            </Link>
          </div>
          {families ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 stagger-children">
              {families.map((f) => (
                <Link
                  key={f.family}
                  href={`/methods?family=${encodeURIComponent(f.family)}`}
                  className="bg-white rounded-xl shadow-card p-5 hover:shadow-card-hover transition-all duration-300 group relative overflow-hidden"
                >
                  {/* Color accent dot */}
                  <div
                    className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: METHOD_FAMILY_COLORS[f.family] ?? '#94a3b8' }}
                  />
                  <p className="text-sm font-semibold text-slate-900">
                    {f.family}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-1.5">
                    {f.count}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
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
          <section className="mb-12 animate-fade-in">
            <h2 className="text-lg font-bold text-slate-900 mb-5">
              Biomarker Tiers
            </h2>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(summary.tier_counts).map(([tier, count]) => (
                <div
                  key={tier}
                  className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm ${
                    TIER_COLORS[tier] ?? 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>{tier.replace(/_/g, ' ')}</span>
                  <span className="bg-white/30 px-2 py-0.5 rounded-md text-xs font-bold">{count}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Top 20 methods table */}
        <section className="animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900">
              Top Methods by Age Prediction
            </h2>
            <Link
              href="/methods"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all methods &rarr;
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-modern">
                <thead>
                  <tr>
                    <th className="text-left">Method</th>
                    <th className="text-left">Family</th>
                    <th className="text-right">k</th>
                    <th className="text-right">MAE (yr)</th>
                    <th className="text-right">R&sup2;</th>
                    <th className="text-right">Stability (ARI)</th>
                  </tr>
                </thead>
                <tbody>
                  {methodsData?.items?.map((m) => (
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
    </div>
  );
}
