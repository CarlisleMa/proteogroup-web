'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import PageHeader from '@/components/layout/PageHeader';
import { formatNumber, formatPValue, formatCohensD } from '@/lib/formatters';
import { TIER_COLORS, DISEASE_DISPLAY_NAMES } from '@/lib/constants';
import type { ProteogroupDetail } from '@/lib/types';

export default function ProteogroupDetailPage() {
  const params = useParams();
  const methodName = params.methodName as string;
  const groupId = params.groupId as string;
  const decodedMethod = decodeURIComponent(methodName);

  const { data, isLoading } = useSWR<ProteogroupDetail>(
    `/api/proteogroups/${methodName}/${groupId}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-sm text-slate-400">Loading proteogroup...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-sm text-slate-500">Proteogroup not found.</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title={`Group ${groupId}`}
        description={`${decodedMethod} \u00b7 ${data.n_proteins} proteins`}
        breadcrumbs={[
          { label: 'Methods', href: '/methods' },
          {
            label: decodedMethod,
            href: `/methods/${methodName}`,
          },
        ]}
      />

      {/* Biomarker badge */}
      {data.biomarker && (
        <div className="mb-6">
          <span
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              TIER_COLORS[data.biomarker.tier] ?? 'bg-slate-100 text-slate-600'
            }`}
          >
            {data.biomarker.tier.replace(/_/g, ' ')} &middot; Score{' '}
            {formatNumber(data.biomarker.composite_score, 3)}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column */}
        <div className="space-y-8">
          {/* Member proteins */}
          <section>
            <h3 className="text-base font-semibold text-slate-900 mb-3">
              Member Proteins ({data.proteins.length})
            </h3>
            <div className="bg-white rounded-lg shadow-sm p-5">
              <div className="flex flex-wrap gap-2">
                {data.proteins.map((p) => (
                  <Link
                    key={p}
                    href={`/proteins/${encodeURIComponent(p)}`}
                    className="inline-block px-2.5 py-1 bg-slate-50 text-slate-700 text-sm rounded-md hover:bg-blue-50 hover:text-blue-700 transition-colors font-mono"
                  >
                    {p}
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* Enrichment terms */}
          {data.enrichment && data.enrichment.length > 0 && (
            <section>
              <h3 className="text-base font-semibold text-slate-900 mb-3">
                Enriched Pathways
              </h3>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-4 py-2.5 font-medium text-slate-500">
                        Source
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium text-slate-500">
                        Term
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium text-slate-500">
                        p-value
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium text-slate-500">
                        Overlap
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.enrichment.slice(0, 20).map((e, idx) => (
                      <tr
                        key={`${e.term_id}-${idx}`}
                        className={`border-b border-slate-50 ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                        }`}
                      >
                        <td className="px-4 py-2 text-slate-500 text-xs">
                          {e.source}
                        </td>
                        <td className="px-4 py-2 text-slate-900">
                          {e.term_name}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-slate-700">
                          {formatPValue(e.p_value)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-slate-700">
                          {e.intersection_size}/{e.term_size}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Expert reviews */}
          {data.reviews && data.reviews.length > 0 && (
            <section>
              <h3 className="text-base font-semibold text-slate-900 mb-3">
                Expert Reviews ({data.reviews.length})
              </h3>
              <div className="space-y-3">
                {data.reviews.map((r) => (
                  <div
                    key={r.id}
                    className="bg-white rounded-lg shadow-sm p-5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-900">
                        {r.reviewer}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-500 mb-2">
                      <span>
                        Plausibility: {r.biological_plausibility}/5
                      </span>
                      <span>
                        Clinical: {r.clinical_relevance}/5
                      </span>
                    </div>
                    {r.notes && (
                      <p className="text-sm text-slate-600">{r.notes}</p>
                    )}
                    {r.tags && r.tags.length > 0 && (
                      <div className="flex gap-1.5 mt-2">
                        {r.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-8">
          {/* Disease associations */}
          {data.disease_associations &&
            data.disease_associations.length > 0 && (
              <section>
                <h3 className="text-base font-semibold text-slate-900 mb-3">
                  Disease Associations
                </h3>
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left px-4 py-2.5 font-medium text-slate-500">
                          Disease
                        </th>
                        <th className="text-right px-4 py-2.5 font-medium text-slate-500">
                          Cohen&apos;s d
                        </th>
                        <th className="text-right px-4 py-2.5 font-medium text-slate-500">
                          p-value
                        </th>
                        <th className="text-right px-4 py-2.5 font-medium text-slate-500">
                          N case
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.disease_associations.map((d, idx) => (
                        <tr
                          key={`${d.outcome}-${d.score_column}-${idx}`}
                          className={`border-b border-slate-50 ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                          }`}
                        >
                          <td className="px-4 py-2 text-slate-900">
                            {DISEASE_DISPLAY_NAMES[d.outcome] ?? d.outcome}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-slate-700">
                            {formatCohensD(d.cohens_d)}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-slate-700">
                            {formatPValue(d.p_value)}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-slate-700">
                            {d.n_case?.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

          {/* Cox survival results */}
          {data.cox_results && data.cox_results.length > 0 && (
            <section>
              <h3 className="text-base font-semibold text-slate-900 mb-3">
                Survival Analysis (Cox)
              </h3>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-4 py-2.5 font-medium text-slate-500">
                        Outcome
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium text-slate-500">
                        C-index
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium text-slate-500">
                        HR
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium text-slate-500">
                        p-value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.cox_results.map((c, idx) => (
                      <tr
                        key={idx}
                        className={`border-b border-slate-50 ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                        }`}
                      >
                        <td className="px-4 py-2 text-slate-900">
                          {DISEASE_DISPLAY_NAMES[c.outcome as string] ??
                            String(c.outcome)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-slate-700">
                          {formatNumber(c.c_index as number | null, 3)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-slate-700">
                          {formatNumber(c.hazard_ratio as number | null, 2)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-slate-700">
                          {formatPValue(c.p_value as number | null)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Biomarker sub-scores */}
          {data.biomarker && (
            <section>
              <h3 className="text-base font-semibold text-slate-900 mb-3">
                Biomarker Sub-scores
              </h3>
              <div className="bg-white rounded-lg shadow-sm p-5">
                <div className="space-y-3">
                  <ScoreBar
                    label="Predictive Importance"
                    value={data.biomarker.predictive_importance}
                  />
                  <ScoreBar
                    label="Disease Specificity"
                    value={data.biomarker.disease_specificity}
                  />
                  <ScoreBar
                    label="Pathway Membership"
                    value={data.biomarker.pathway_membership}
                  />
                  <ScoreBar
                    label="Network Centrality"
                    value={data.biomarker.network_centrality}
                  />
                  <ScoreBar
                    label="Novelty"
                    value={data.biomarker.novelty_score}
                  />
                  <ScoreBar
                    label="Cross-method Consistency"
                    value={data.biomarker.cross_method_consistency}
                  />
                  <ScoreBar
                    label="Tissue Interpretability"
                    value={data.biomarker.tissue_interpretability}
                  />
                </div>
              </div>
            </section>
          )}

          {/* Figures */}
          {data.figures && data.figures.length > 0 && (
            <section>
              <h3 className="text-base font-semibold text-slate-900 mb-3">
                Figures
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {data.figures.map((figPath) => (
                  <div
                    key={figPath}
                    className="bg-white rounded-lg shadow-sm p-2 overflow-hidden"
                  >
                    <img
                      src={`/figures/${figPath}`}
                      alt={figPath}
                      className="w-full h-auto rounded"
                      loading="lazy"
                    />
                    <p className="text-xs text-slate-400 mt-1 px-1 truncate">
                      {figPath}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Learn more CTA */}
      <div className="mt-10 p-6 bg-white rounded-lg shadow-sm text-center">
        <p className="text-sm text-slate-600 mb-3">
          Want to learn more about this proteogroup?
        </p>
        <Link
          href={`/learn?context=${encodeURIComponent(`${decodedMethod} group ${groupId}`)}`}
          className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Ask the Learn Agent
        </Link>
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(Math.max(value * 100, 0), 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-600">{label}</span>
        <span className="font-mono text-slate-700">{formatNumber(value, 2)}</span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full">
        <div
          className="h-full bg-blue-500 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
