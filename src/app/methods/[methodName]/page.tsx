'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import PageHeader from '@/components/layout/PageHeader';
import { formatNumber, formatPValue, formatCohensD } from '@/lib/formatters';
import { TIER_COLORS } from '@/lib/constants';
import type { MethodDetail } from '@/lib/types';

type Tab = 'overview' | 'groups' | 'enrichment' | 'disease';

export default function MethodDetailPage() {
  const params = useParams();
  const methodName = params.methodName as string;
  const decoded = decodeURIComponent(methodName);

  const { data, isLoading } = useSWR<MethodDetail>(
    `/api/methods/${methodName}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: groups } = useSWR<
    {
      pg_group: number;
      n_proteins: number;
      dominant_theme: string;
      composite_score: number;
      tier: string;
    }[]
  >(`/api/methods/${methodName}/groups`, fetcher, {
    revalidateOnFocus: false,
  });

  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'groups', label: `Groups${groups ? ` (${groups.length})` : ''}` },
    { key: 'enrichment', label: 'Enrichment' },
    { key: 'disease', label: 'Disease' },
  ];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-sm text-slate-400">Loading method details...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-sm text-slate-500">Method not found.</div>
      </div>
    );
  }

  const meta = data.metadata as Record<string, unknown>;
  const agePred = data.age_prediction as Record<string, unknown>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title={decoded}
        description={`${meta?.method_family ?? ''} family \u00b7 k = ${meta?.k ?? '?'}`}
        breadcrumbs={[{ label: 'Methods', href: '/methods' }]}
      />

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-8 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Performance metrics */}
          <section>
            <h3 className="text-base font-semibold text-slate-900 mb-4">
              Age Prediction Performance
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="MAE"
                value={formatNumber(agePred?.mae as number | null, 2)}
                unit="years"
              />
              <MetricCard
                label="R\u00b2"
                value={formatNumber(agePred?.r2 as number | null, 3)}
              />
              <MetricCard
                label="Pearson r"
                value={formatNumber(agePred?.pearson_r as number | null, 3)}
              />
              <MetricCard
                label="RMSE"
                value={formatNumber(agePred?.rmse as number | null, 2)}
                unit="years"
              />
            </div>
          </section>

          {/* Method metadata */}
          <section>
            <h3 className="text-base font-semibold text-slate-900 mb-4">
              Method Details
            </h3>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <dl className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8 text-sm">
                <div>
                  <dt className="text-slate-500">Family</dt>
                  <dd className="text-slate-900 font-medium mt-0.5">
                    {String(meta?.method_family ?? '\u2014')}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">k (groups)</dt>
                  <dd className="text-slate-900 font-medium mt-0.5 font-mono">
                    {String(meta?.k ?? '\u2014')}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Proteins Assigned</dt>
                  <dd className="text-slate-900 font-medium mt-0.5 font-mono">
                    {String(meta?.n_proteins_assigned ?? '\u2014')}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Mean Group Size</dt>
                  <dd className="text-slate-900 font-medium mt-0.5 font-mono">
                    {formatNumber(meta?.mean_group_size as number | null, 1)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Group Size CV</dt>
                  <dd className="text-slate-900 font-medium mt-0.5 font-mono">
                    {formatNumber(meta?.group_size_cv as number | null, 2)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Bootstrap Stability (ARI)</dt>
                  <dd className="text-slate-900 font-medium mt-0.5 font-mono">
                    {formatNumber(
                      (data.correlation as Record<string, unknown>)
                        ?.bootstrap_mean_ari as number | null,
                      3,
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Top nominations */}
          {data.top_nominations && data.top_nominations.length > 0 && (
            <section>
              <h3 className="text-base font-semibold text-slate-900 mb-4">
                Top Biomarker Nominations
              </h3>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-4 py-3 font-medium text-slate-500">
                        Group
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-slate-500">
                        Tier
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-slate-500">
                        Score
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-slate-500">
                        Top Proteins
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_nominations.map((nom) => (
                      <tr
                        key={nom.pg_group}
                        className="border-b border-slate-50 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/proteogroups/${methodName}/${nom.pg_group}`}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Group {nom.pg_group}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          {nom.tier && (
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                TIER_COLORS[nom.tier] ??
                                'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {nom.tier.replace(/_/g, ' ')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                          {formatNumber(nom.composite_score, 3)}
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">
                          {nom.top_proteins?.slice(0, 5).join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}

      {/* Groups tab */}
      {activeTab === 'groups' && (
        <div>
          {groups ? (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-4 py-3 font-medium text-slate-500">
                      Group
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-slate-500">
                      Proteins
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">
                      Theme
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">
                      Tier
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-slate-500">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g, idx) => (
                    <tr
                      key={g.pg_group}
                      className={`border-b border-slate-50 hover:bg-slate-50 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/proteogroups/${methodName}/${g.pg_group}`}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Group {g.pg_group}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        {g.n_proteins}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {g.dominant_theme || '\u2014'}
                      </td>
                      <td className="px-4 py-3">
                        {g.tier && (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              TIER_COLORS[g.tier] ??
                              'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {g.tier.replace(/_/g, ' ')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        {g.composite_score != null
                          ? formatNumber(g.composite_score, 3)
                          : '\u2014'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-slate-400">Loading groups...</div>
          )}
        </div>
      )}

      {/* Enrichment tab */}
      {activeTab === 'enrichment' && (
        <div>
          {data.enrichment_summary && data.enrichment_summary.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-4 py-3 font-medium text-slate-500">
                      Source
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">
                      Term
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-slate-500">
                      p-value
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-slate-500">
                      Size
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-slate-500">
                      Overlap
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.enrichment_summary.map((e, idx) => (
                    <tr
                      key={`${e.term_id}-${idx}`}
                      className={`border-b border-slate-50 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      }`}
                    >
                      <td className="px-4 py-3 text-slate-600">{e.source}</td>
                      <td className="px-4 py-3 text-slate-900">
                        {e.term_name}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        {formatPValue(e.p_value)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        {e.term_size}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        {e.intersection_size}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-slate-400">
              No enrichment data available for this method.
            </div>
          )}
        </div>
      )}

      {/* Disease tab */}
      {activeTab === 'disease' && (
        <DiseaseTab methodName={decoded} />
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 mt-1">
        {value}
        {unit && (
          <span className="text-sm font-normal text-slate-400 ml-1">
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}

function DiseaseTab({ methodName }: { methodName: string }) {
  const { data } = useSWR<
    {
      method_name: string;
      score_column: string;
      outcome: string;
      p_value: number;
      cohens_d: number;
      n_case: number;
      n_control: number;
    }[]
  >(
    // Fetch top associations for this method across diseases
    `/api/diseases/death/associations?method_name=${encodeURIComponent(methodName)}&limit=50`,
    fetcher,
    { revalidateOnFocus: false },
  );

  // Also fetch all diseases
  const { data: diseases } = useSWR<
    { outcome: string; display_name: string; n_significant_pgs: number; best_cohens_d: number }[]
  >('/api/diseases', fetcher, { revalidateOnFocus: false });

  return (
    <div className="space-y-6">
      {diseases && diseases.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {diseases.map((d) => (
            <Link
              key={d.outcome}
              href={`/methods/${encodeURIComponent(methodName)}?tab=disease&outcome=${d.outcome}`}
              className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <p className="text-sm font-medium text-slate-900">
                {d.display_name}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {d.n_significant_pgs} significant PGs
              </p>
              {d.best_cohens_d != null && (
                <p className="text-xs text-slate-400 mt-0.5">
                  best |d| = {formatCohensD(d.best_cohens_d)}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}

      {!diseases && (
        <div className="text-sm text-slate-400">Loading disease data...</div>
      )}
    </div>
  );
}
