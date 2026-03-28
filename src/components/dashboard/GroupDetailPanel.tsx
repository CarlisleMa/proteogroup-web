'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Dialog, Transition } from '@headlessui/react';
import { fetcher } from '@/lib/api';
import { formatNumber, formatPValue, formatCohensD } from '@/lib/formatters';
import { TIER_COLORS, DISEASE_DISPLAY_NAMES } from '@/lib/constants';
import DiseaseRadar from '@/components/visualize/DiseaseRadar';
import type { NetworkNode, ProteogroupDetail } from '@/lib/types';

interface GroupDetailPanelProps {
  node: NetworkNode | null;
  methodName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function GroupDetailPanel({
  node,
  methodName,
  isOpen,
  onClose,
}: GroupDetailPanelProps) {
  const { data, isLoading } = useSWR<ProteogroupDetail>(
    node && isOpen
      ? `/api/proteogroups/${encodeURIComponent(methodName)}/${node.group_id}`
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" />
        </Transition.Child>

        {/* Panel */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-lg">
                  <div className="flex h-full flex-col overflow-y-auto bg-white shadow-2xl">
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Dialog.Title className="text-lg font-bold text-slate-900">
                            Group {node?.group_id}
                          </Dialog.Title>
                          {node?.tier && (
                            <span
                              className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                TIER_COLORS[node.tier] ?? 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {node.tier.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={onClose}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      {node?.composite_score != null && (
                        <p className="text-sm text-slate-500 mt-1">
                          Composite score: <strong className="text-slate-700">{formatNumber(node.composite_score, 3)}</strong>
                          {' \u00b7 '}{node.n_proteins} proteins
                        </p>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 px-6 py-5 space-y-6">
                      {isLoading && (
                        <div className="text-sm text-slate-400 py-8 text-center">
                          Loading group details...
                        </div>
                      )}

                      {data && (
                        <>
                          {/* Member Proteins */}
                          {data.proteins && data.proteins.length > 0 && (
                            <section>
                              <h3 className="text-sm font-bold text-slate-900 mb-2">
                                Member Proteins ({data.proteins.length})
                              </h3>
                              <div className="flex flex-wrap gap-1.5">
                                {data.proteins.map((p) => {
                                  const name = typeof p === 'string' ? p : p.protein;
                                  return (
                                    <Link
                                      key={name}
                                      href={`/proteins/${encodeURIComponent(name)}`}
                                      className="inline-block px-2.5 py-1 bg-slate-50 text-slate-700 text-xs rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-all font-mono border border-transparent hover:border-blue-100"
                                    >
                                      {name}
                                    </Link>
                                  );
                                })}
                              </div>
                            </section>
                          )}

                          {/* Disease Radar */}
                          {data.disease_associations && data.disease_associations.length > 0 && (
                            <section>
                              <h3 className="text-sm font-bold text-slate-900 mb-2">
                                Disease Fingerprint
                              </h3>
                              <DiseaseRadar diseases={data.disease_associations} />
                            </section>
                          )}

                          {/* Disease Associations Table */}
                          {data.disease_associations && data.disease_associations.length > 0 && (
                            <section>
                              <h3 className="text-sm font-bold text-slate-900 mb-2">
                                Disease Associations
                              </h3>
                              <div className="bg-slate-50 rounded-xl overflow-hidden">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b border-slate-200">
                                      <th className="text-left px-3 py-2 text-slate-500 font-medium">Disease</th>
                                      <th className="text-right px-3 py-2 text-slate-500 font-medium">Cohen&apos;s d</th>
                                      <th className="text-right px-3 py-2 text-slate-500 font-medium">p-value</th>
                                      <th className="text-right px-3 py-2 text-slate-500 font-medium">N case</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {data.disease_associations.map((d, i) => (
                                      <tr key={`${d.outcome}-${i}`} className="border-b border-slate-100 last:border-0">
                                        <td className="px-3 py-2 text-slate-900">
                                          {DISEASE_DISPLAY_NAMES[d.outcome] ?? d.outcome}
                                        </td>
                                        <td className="px-3 py-2 text-right font-mono text-slate-700">
                                          {formatCohensD(d.cohens_d)}
                                        </td>
                                        <td className="px-3 py-2 text-right font-mono text-slate-700">
                                          {formatPValue(d.p_value)}
                                        </td>
                                        <td className="px-3 py-2 text-right font-mono text-slate-700">
                                          {d.n_case?.toLocaleString()}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </section>
                          )}

                          {/* Enrichment */}
                          {data.enrichment && data.enrichment.length > 0 && (
                            <section>
                              <h3 className="text-sm font-bold text-slate-900 mb-2">
                                Enriched Pathways (top 10)
                              </h3>
                              <div className="bg-slate-50 rounded-xl overflow-hidden">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b border-slate-200">
                                      <th className="text-left px-3 py-2 text-slate-500 font-medium">Source</th>
                                      <th className="text-left px-3 py-2 text-slate-500 font-medium">Term</th>
                                      <th className="text-right px-3 py-2 text-slate-500 font-medium">p-value</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {data.enrichment.slice(0, 10).map((e, i) => (
                                      <tr key={`${e.term_id}-${i}`} className="border-b border-slate-100 last:border-0">
                                        <td className="px-3 py-2 text-slate-400 font-medium">{e.source}</td>
                                        <td className="px-3 py-2 text-slate-900 max-w-[200px] truncate">{e.term_name}</td>
                                        <td className="px-3 py-2 text-right font-mono text-slate-700">{formatPValue(e.p_value)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </section>
                          )}

                          {/* Biomarker Sub-scores */}
                          {data.biomarker && (
                            <section>
                              <h3 className="text-sm font-bold text-slate-900 mb-2">
                                Biomarker Sub-scores
                              </h3>
                              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                                <ScoreBar label="Predictive Importance" value={data.biomarker.predictive_importance} color="from-blue-500 to-blue-600" />
                                <ScoreBar label="Disease Specificity" value={data.biomarker.disease_specificity} color="from-red-500 to-red-600" />
                                <ScoreBar label="Pathway Membership" value={data.biomarker.pathway_membership} color="from-emerald-500 to-emerald-600" />
                                <ScoreBar label="Network Centrality" value={data.biomarker.network_centrality} color="from-amber-500 to-amber-600" />
                                <ScoreBar label="Novelty" value={data.biomarker.novelty_score} color="from-violet-500 to-violet-600" />
                                <ScoreBar label="Cross-method" value={data.biomarker.cross_method_consistency} color="from-cyan-500 to-cyan-600" />
                                <ScoreBar label="Tissue" value={data.biomarker.tissue_interpretability} color="from-pink-500 to-pink-600" />
                              </div>
                            </section>
                          )}
                        </>
                      )}
                    </div>

                    {/* Footer */}
                    {node && (
                      <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-3">
                        <Link
                          href={`/proteogroups/${encodeURIComponent(methodName)}/${node.group_id}`}
                          className="block w-full text-center px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
                        >
                          View Full Detail
                        </Link>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function ScoreBar({
  label,
  value,
  color = 'from-blue-500 to-indigo-500',
}: {
  label: string;
  value: number | null;
  color?: string;
}) {
  const pct = Math.min(Math.max((value ?? 0) * 100, 0), 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="font-mono text-slate-700 font-semibold">{formatNumber(value, 2)}</span>
      </div>
      <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
