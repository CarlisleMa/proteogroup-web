'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import PageHeader from '@/components/layout/PageHeader';
import { formatNumber, formatPValue, formatCohensD } from '@/lib/formatters';
import { TIER_COLORS, DISEASE_DISPLAY_NAMES } from '@/lib/constants';
import DiseaseRadar from '@/components/visualize/DiseaseRadar';
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
      {data.biomarker && data.biomarker.tier && (
        <div className="mb-6 animate-fade-in">
          <span
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm ${
              TIER_COLORS[data.biomarker.tier] ?? 'bg-slate-100 text-slate-600'
            }`}
          >
            {data.biomarker.tier.replace(/_/g, ' ')} &middot; Score{' '}
            {formatNumber(data.biomarker.composite_score, 3)}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
        {/* Left column */}
        <div className="space-y-8">
          {/* Member proteins */}
          <section>
            <h3 className="text-base font-bold text-slate-900 mb-3">
              Member Proteins ({data.proteins.length})
            </h3>
            <div className="bg-white rounded-xl shadow-card p-5">
              <div className="flex flex-wrap gap-2">
                {data.proteins.map((p) => {
                  const name = typeof p === 'string' ? p : p.protein;
                  return (
                    <Link
                      key={name}
                      href={`/proteins/${encodeURIComponent(name)}`}
                      className="inline-block px-3 py-1.5 bg-slate-50 text-slate-700 text-sm rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 font-mono border border-transparent hover:border-blue-100"
                    >
                      {name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Enrichment terms */}
          {data.enrichment && data.enrichment.length > 0 && (
            <section>
              <h3 className="text-base font-bold text-slate-900 mb-3">
                Enriched Pathways
              </h3>
              <div className="bg-white rounded-xl shadow-card overflow-hidden">
                <table className="w-full text-sm table-modern">
                  <thead>
                    <tr>
                      <th className="text-left">Source</th>
                      <th className="text-left">Term</th>
                      <th className="text-right">p-value</th>
                      <th className="text-right">Overlap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.enrichment.slice(0, 20).map((e, idx) => (
                      <tr key={`${e.term_id}-${idx}`}>
                        <td className="px-4 py-2.5 text-slate-400 text-xs font-medium">
                          {e.source}
                        </td>
                        <td className="px-4 py-2.5 text-slate-900">
                          {e.term_name}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-700">
                          {formatPValue(e.p_value)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-700">
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
              <h3 className="text-base font-bold text-slate-900 mb-3">
                Expert Reviews ({data.reviews.length})
              </h3>
              <div className="space-y-3">
                {data.reviews.map((r) => (
                  <div
                    key={r.id}
                    className="bg-white rounded-xl shadow-card p-5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-900">
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
                      <div className="flex gap-1.5 mt-2.5">
                        {r.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-block px-2.5 py-0.5 bg-slate-50 text-slate-500 text-xs rounded-lg font-medium"
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
          {/* Disease fingerprint radar */}
          {data.disease_associations && data.disease_associations.length > 0 && (
            <DiseaseRadar diseases={data.disease_associations} />
          )}

          {/* Disease associations */}
          {data.disease_associations &&
            data.disease_associations.length > 0 && (
              <section>
                <h3 className="text-base font-bold text-slate-900 mb-3">
                  Disease Associations
                </h3>
                <div className="bg-white rounded-xl shadow-card overflow-hidden">
                  <table className="w-full text-sm table-modern">
                    <thead>
                      <tr>
                        <th className="text-left">Disease</th>
                        <th className="text-right">Cohen&apos;s d</th>
                        <th className="text-right">p-value</th>
                        <th className="text-right">N case</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.disease_associations.map((d, idx) => (
                        <tr key={`${d.outcome}-${idx}`}>
                          <td className="px-4 py-2.5 text-slate-900">
                            {DISEASE_DISPLAY_NAMES[d.outcome] ?? d.outcome}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-slate-700">
                            {formatCohensD(d.cohens_d)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-slate-700">
                            {formatPValue(d.p_value)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-slate-700">
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
              <h3 className="text-base font-bold text-slate-900 mb-3">
                Survival Analysis (Cox)
              </h3>
              <div className="bg-white rounded-xl shadow-card overflow-hidden">
                <table className="w-full text-sm table-modern">
                  <thead>
                    <tr>
                      <th className="text-left">Outcome</th>
                      <th className="text-right">C-index</th>
                      <th className="text-right">HR</th>
                      <th className="text-right">p-value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.cox_results.map((c, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2.5 text-slate-900">
                          {DISEASE_DISPLAY_NAMES[c.outcome as string] ??
                            String(c.outcome)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-700">
                          {formatNumber(c.c_index as number | null, 3)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-700">
                          {formatNumber(c.hazard_ratio as number | null, 2)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-700">
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
              <h3 className="text-base font-bold text-slate-900 mb-3">
                Biomarker Sub-scores
              </h3>
              <div className="bg-white rounded-xl shadow-card p-5">
                <div className="space-y-3.5">
                  <ScoreBar
                    label="Predictive Importance"
                    value={data.biomarker.predictive_importance}
                    color="from-blue-500 to-blue-600"
                  />
                  <ScoreBar
                    label="Disease Specificity"
                    value={data.biomarker.disease_specificity}
                    color="from-red-500 to-red-600"
                  />
                  <ScoreBar
                    label="Pathway Membership"
                    value={data.biomarker.pathway_membership}
                    color="from-emerald-500 to-emerald-600"
                  />
                  <ScoreBar
                    label="Network Centrality"
                    value={data.biomarker.network_centrality}
                    color="from-amber-500 to-amber-600"
                  />
                  <ScoreBar
                    label="Novelty"
                    value={data.biomarker.novelty_score}
                    color="from-violet-500 to-violet-600"
                  />
                  <ScoreBar
                    label="Cross-method Consistency"
                    value={data.biomarker.cross_method_consistency}
                    color="from-cyan-500 to-cyan-600"
                  />
                  <ScoreBar
                    label="Tissue Interpretability"
                    value={data.biomarker.tissue_interpretability}
                    color="from-pink-500 to-pink-600"
                  />
                </div>
              </div>
            </section>
          )}

          {/* Figures */}
          {data.figures && data.figures.length > 0 && (
            <section>
              <h3 className="text-base font-bold text-slate-900 mb-3">
                Figures
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {data.figures.map((fig) => {
                  const filename = typeof fig === 'string' ? fig : fig.filename;
                  const path = typeof fig === 'string' ? fig : fig.file_path;
                  return (
                    <div
                      key={filename}
                      className="bg-white rounded-xl shadow-card p-2.5 overflow-hidden group hover:shadow-card-hover transition-all duration-300"
                    >
                      <img
                        src={`/figures/${path}`}
                        alt={filename}
                        className="w-full h-auto rounded-lg"
                        loading="lazy"
                      />
                      <p className="text-xs text-slate-400 mt-1.5 px-1 truncate">
                        {filename}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, value, color = 'from-blue-500 to-indigo-500' }: { label: string; value: number | null; color?: string }) {
  const pct = Math.min(Math.max((value ?? 0) * 100, 0), 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="font-mono text-slate-700 font-semibold">{formatNumber(value, 2)}</span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
