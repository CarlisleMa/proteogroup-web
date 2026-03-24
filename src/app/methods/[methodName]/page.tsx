'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import PageHeader from '@/components/layout/PageHeader';
import { formatNumber, formatPValue } from '@/lib/formatters';
import { TIER_COLORS } from '@/lib/constants';
import ProteogroupHeatmap from '@/components/visualize/ProteogroupHeatmap';

type Tab = 'overview' | 'groups' | 'heatmap' | 'disease';

interface MethodDetailResponse {
  metadata: {
    method_name: string;
    method_family: string;
    k: number;
    n_proteins_assigned: number;
    mean_group_size: number;
    min_group_size: number;
    max_group_size: number;
    group_size_cv: number;
  };
  age_prediction: {
    mae: number | null;
    rmse: number | null;
    r2: number | null;
    pearson_r: number | null;
    n_features: number | null;
    mae_baseline: number | null;
    mae_increment: number | null;
  };
  survival: {
    c_index: number | null;
    c_index_baseline: number | null;
  };
  variance_explained: number | null;
  correlation: {
    mean_within: number | null;
    mean_between: number | null;
    ratio: number | null;
  };
  string_ppi: {
    n_tested: number;
    n_significant: number;
  };
  enrichment_summary: {
    pg_group: number;
    n_enriched_terms: number;
    top_pathway: string;
    top_pathway_p: number;
    dominant_theme: string;
    theme_confidence: number;
  }[];
  top_nominations: {
    pg_group: number;
    composite_score: number;
    tier: string;
    top_proteins: string[];
  }[];
}

interface GroupInfo {
  group_id: number;
  n_proteins: number;
  n_enriched_terms: number;
  top_pathway: string;
  dominant_theme: string;
  theme_confidence: number;
  composite_score: number | null;
  tier: string | null;
  permutation_importance_mean: number | null;
}

export default function MethodDetailPage() {
  const params = useParams();
  const methodName = params.methodName as string;
  const decoded = decodeURIComponent(methodName);

  const { data, isLoading } = useSWR<MethodDetailResponse>(
    `/api/methods/${methodName}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: groups } = useSWR<GroupInfo[]>(
    `/api/methods/${methodName}/groups`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'groups', label: `Proteogroups${groups ? ` (${groups.length})` : ''}` },
    { key: 'heatmap', label: 'Heatmap' },
    { key: 'disease', label: 'Disease Associations' },
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

  const { metadata: meta, age_prediction: agePred } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title={decoded}
        description={`${meta.method_family} family \u00b7 k\u00a0=\u00a0${meta.k} \u00b7 ${meta.n_proteins_assigned} proteins`}
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
          {/* Age prediction performance */}
          <section>
            <h3 className="text-base font-semibold text-slate-900 mb-4">
              Age Prediction Performance
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="MAE" value={formatNumber(agePred.mae, 2)} unit="years" />
              <MetricCard label="R²" value={formatNumber(agePred.r2, 3)} />
              <MetricCard label="Pearson r" value={formatNumber(agePred.pearson_r, 3)} />
              <MetricCard label="RMSE" value={formatNumber(agePred.rmse, 2)} unit="years" />
            </div>
          </section>

          {/* Key metrics grid */}
          <section>
            <h3 className="text-base font-semibold text-slate-900 mb-4">
              Key Metrics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <MetricCard
                label="Survival C-index"
                value={formatNumber(data.survival.c_index, 3)}
                subtitle={data.survival.c_index_baseline ? `baseline: ${formatNumber(data.survival.c_index_baseline, 3)}` : undefined}
              />
              <MetricCard
                label="Variance Explained"
                value={formatNumber(data.variance_explained, 1)}
                unit="%"
              />
              <MetricCard
                label="Correlation Ratio"
                value={formatNumber(data.correlation.ratio, 2)}
                subtitle={`within: ${formatNumber(data.correlation.mean_within, 3)} / between: ${formatNumber(data.correlation.mean_between, 3)}`}
              />
              <MetricCard
                label="PPI Enrichment"
                value={`${data.string_ppi.n_significant} / ${data.string_ppi.n_tested}`}
                subtitle="groups with significant protein interactions"
              />
              <MetricCard
                label="Group Size"
                value={`${meta.min_group_size}\u2013${meta.max_group_size}`}
                subtitle={`mean: ${formatNumber(meta.mean_group_size, 1)}, CV: ${formatNumber(meta.group_size_cv, 2)}`}
              />
              <MetricCard
                label="MAE vs Baseline"
                value={formatNumber(agePred.mae_increment, 2)}
                unit="years better"
                subtitle={`baseline MAE: ${formatNumber(agePred.mae_baseline, 2)}`}
              />
            </div>
          </section>

          {/* Top biomarker nominations */}
          {data.top_nominations && data.top_nominations.length > 0 && (
            <section>
              <h3 className="text-base font-semibold text-slate-900 mb-4">
                Top Biomarker Nominations
              </h3>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-4 py-3 font-medium text-slate-500">Group</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-500">Tier</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-500">Score</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-500">Top Proteins</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_nominations.map((nom) => (
                      <tr key={nom.pg_group} className="border-b border-slate-50 hover:bg-slate-50">
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
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TIER_COLORS[nom.tier] ?? 'bg-slate-100 text-slate-600'}`}>
                              {nom.tier.replace(/_/g, ' ')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                          {formatNumber(nom.composite_score, 3)}
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">
                          {nom.top_proteins?.slice(0, 5).map((p: any) => typeof p === 'string' ? p : p.protein).join(', ') || '\u2014'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Enrichment summary per group */}
          {data.enrichment_summary && data.enrichment_summary.length > 0 && (
            <section>
              <h3 className="text-base font-semibold text-slate-900 mb-4">
                Pathway Enrichment by Group
              </h3>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-4 py-3 font-medium text-slate-500">Group</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-500">Enriched Terms</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-500">Top Pathway</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-500">p-value</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-500">Theme</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.enrichment_summary.map((e, idx) => (
                      <tr
                        key={e.pg_group}
                        className={`border-b border-slate-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/proteogroups/${methodName}/${e.pg_group}`}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Group {e.pg_group}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                          {e.n_enriched_terms}
                        </td>
                        <td className="px-4 py-3 text-slate-900 max-w-xs truncate">
                          {e.top_pathway}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                          {formatPValue(e.top_pathway_p)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">
                            {e.dominant_theme?.replace(/_/g, ' ') || '\u2014'}
                          </span>
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
          {groups && groups.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Group</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-500">Proteins</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Top Pathway</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Theme</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Tier</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-500">Score</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-500">Importance</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g, idx) => (
                    <tr
                      key={g.group_id}
                      className={`border-b border-slate-50 hover:bg-slate-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/proteogroups/${methodName}/${g.group_id}`}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Group {g.group_id}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        {g.n_proteins}
                      </td>
                      <td className="px-4 py-3 text-slate-700 max-w-xs truncate text-xs">
                        {g.top_pathway || '\u2014'}
                      </td>
                      <td className="px-4 py-3">
                        {g.dominant_theme ? (
                          <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">
                            {g.dominant_theme.replace(/_/g, ' ')}
                          </span>
                        ) : '\u2014'}
                      </td>
                      <td className="px-4 py-3">
                        {g.tier ? (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TIER_COLORS[g.tier] ?? 'bg-slate-100 text-slate-600'}`}>
                            {g.tier.replace(/_/g, ' ')}
                          </span>
                        ) : '\u2014'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        {g.composite_score != null ? formatNumber(g.composite_score, 3) : '\u2014'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        {g.permutation_importance_mean != null
                          ? formatNumber(g.permutation_importance_mean, 4)
                          : '\u2014'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : groups ? (
            <div className="text-sm text-slate-400">No groups found for this method.</div>
          ) : (
            <div className="text-sm text-slate-400">Loading groups...</div>
          )}
        </div>
      )}

      {/* Heatmap tab */}
      {activeTab === 'heatmap' && (
        <div>
          {groups && groups.length > 0 ? (
            <ProteogroupHeatmap groups={groups} methodName={decoded} />
          ) : groups ? (
            <div className="text-sm text-slate-400">No group data available.</div>
          ) : (
            <div className="text-sm text-slate-400">Loading groups...</div>
          )}
        </div>
      )}

      {/* Disease tab */}
      {activeTab === 'disease' && <DiseaseTab methodName={decoded} />}
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  subtitle,
}: {
  label: string;
  value: string;
  unit?: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 mt-1">
        {value}
        {unit && <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>}
      </p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}

function DiseaseTab({ methodName }: { methodName: string }) {
  const { data: diseases } = useSWR<
    { outcome: string; display_name: string; n_significant_pgs: number; best_cohens_d: number }[]
  >('/api/diseases', fetcher, { revalidateOnFocus: false });

  return (
    <div>
      {diseases && diseases.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {diseases.map((d) => (
            <Link
              key={d.outcome}
              href={`/methods/${encodeURIComponent(methodName)}?tab=disease&outcome=${d.outcome}`}
              className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <p className="text-sm font-medium text-slate-900">{d.display_name}</p>
              <p className="text-2xl font-semibold text-slate-700 mt-2">
                {d.n_significant_pgs}
              </p>
              <p className="text-xs text-slate-500 mt-1">significant proteogroups</p>
              {d.best_cohens_d != null && (
                <p className="text-xs text-slate-400 mt-1">
                  best |d| = {formatNumber(Math.abs(d.best_cohens_d), 3)}
                </p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-sm text-slate-400">Loading disease data...</div>
      )}
    </div>
  );
}
