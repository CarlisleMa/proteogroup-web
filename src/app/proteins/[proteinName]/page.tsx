'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useProtein } from '@/hooks/useProtein';
import PageHeader from '@/components/layout/PageHeader';
import { formatNumber } from '@/lib/formatters';

export default function ProteinDetailPage() {
  const params = useParams();
  const proteinName = params.proteinName as string;
  const decoded = decodeURIComponent(proteinName);

  const { data, isLoading } = useProtein(decoded);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-sm text-slate-400">Loading protein...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-sm text-slate-500">Protein not found.</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title={decoded}
        description={`${data.gene_name || ''} \u00b7 ${data.uniprot_id || ''}`}
        breadcrumbs={[{ label: 'Proteins', href: '/proteins' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* UniProt card - left 2/3 */}
        <div className="lg:col-span-2 space-y-8">
          {/* Function */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-3">
              Function
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {data.function_text || 'No function annotation available.'}
            </p>
            {data.subcellular_location && (
              <p className="text-sm text-slate-500 mt-3">
                <span className="font-medium">Location:</span>{' '}
                {data.subcellular_location}
              </p>
            )}
            {data.uniprot_id && (
              <a
                href={`https://www.uniprot.org/uniprot/${data.uniprot_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-700"
              >
                View on UniProt &rarr;
              </a>
            )}
          </section>

          {/* Cross-method assignments */}
          {data.assignments && data.assignments.length > 0 && (
            <section>
              <h3 className="text-base font-semibold text-slate-900 mb-3">
                Cross-Method Assignments ({data.assignments.length})
              </h3>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left px-4 py-2.5 font-medium text-slate-500">
                          Method
                        </th>
                        <th className="text-right px-4 py-2.5 font-medium text-slate-500">
                          Group
                        </th>
                        <th className="text-right px-4 py-2.5 font-medium text-slate-500">
                          Coefficient
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.assignments.map((a: Record<string, unknown>, idx: number) => (
                        <tr
                          key={`${a.method_name}-${a.group_id}`}
                          className={`border-b border-slate-50 hover:bg-slate-50 ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                          }`}
                        >
                          <td className="px-4 py-2">
                            <Link
                              href={`/methods/${encodeURIComponent(String(a.method_name))}`}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              {String(a.method_name)}
                            </Link>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <Link
                              href={`/proteogroups/${encodeURIComponent(String(a.method_name))}/${a.group_id}`}
                              className="text-blue-600 hover:text-blue-700 font-mono"
                            >
                              {String(a.group_id)}
                            </Link>
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-slate-700">
                            {a.ridge_coef != null
                              ? formatNumber(a.ridge_coef as number, 4)
                              : '\u2014'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* Coefficients */}
          {data.coefficients && data.coefficients.length > 0 && (
            <section>
              <h3 className="text-base font-semibold text-slate-900 mb-3">
                Model Coefficients
              </h3>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left px-4 py-2.5 font-medium text-slate-500">
                          Method
                        </th>
                        <th className="text-right px-4 py-2.5 font-medium text-slate-500">
                          Group
                        </th>
                        <th className="text-right px-4 py-2.5 font-medium text-slate-500">
                          Weight
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.coefficients
                        .slice(0, 50)
                        .map((c: Record<string, unknown>, idx: number) => (
                          <tr
                            key={idx}
                            className={`border-b border-slate-50 ${
                              idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                            }`}
                          >
                            <td className="px-4 py-2 text-slate-700">
                              {String(c.method_name)}
                            </td>
                            <td className="px-4 py-2 text-right font-mono text-slate-700">
                              {String(c.group_id ?? c.pg_group ?? '\u2014')}
                            </td>
                            <td className="px-4 py-2 text-right font-mono text-slate-700">
                              {c.weight != null
                                ? formatNumber(c.weight as number, 4)
                                : '\u2014'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Quick info */}
          <div className="bg-white rounded-lg shadow-sm p-5">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-slate-500">Gene</dt>
                <dd className="text-slate-900 font-medium font-mono mt-0.5">
                  {data.gene_name || '\u2014'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">UniProt ID</dt>
                <dd className="text-slate-900 font-medium font-mono mt-0.5">
                  {data.uniprot_id || '\u2014'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Method Assignments</dt>
                <dd className="text-slate-900 font-medium font-mono mt-0.5">
                  {data.assignments?.length ?? 0}
                </dd>
              </div>
            </dl>
          </div>

          {/* HPA expression */}
          {data.hpa && Object.keys(data.hpa).length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Tissue Expression (HPA)
              </h3>
              <div className="space-y-1.5">
                {Object.entries(data.hpa)
                  .sort(
                    ([, a], [, b]) =>
                      expressionLevel(b as string) -
                      expressionLevel(a as string),
                  )
                  .slice(0, 15)
                  .map(([tissue, level]) => (
                    <div
                      key={tissue}
                      className="flex justify-between text-xs"
                    >
                      <span className="text-slate-600 truncate mr-2">
                        {tissue}
                      </span>
                      <ExpressionBadge level={level as string} />
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Literature */}
          {data.pubmed && (data.pubmed as unknown[]).length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Literature
              </h3>
              <div className="space-y-2">
                {(data.pubmed as Record<string, unknown>[]).slice(0, 5).map((pub, idx) => (
                  <div key={idx} className="text-xs text-slate-600">
                    <p className="font-medium">{String(pub.keyword ?? pub.gene_name ?? '')}</p>
                    <p className="text-slate-400">
                      {pub.count ? `${pub.count} publications` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Learn more CTA */}
          <div className="bg-white rounded-lg shadow-sm p-5 text-center">
            <p className="text-sm text-slate-600 mb-3">
              Learn more about this protein
            </p>
            <Link
              href={`/learn?context=${encodeURIComponent(decoded)}`}
              className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Ask the Learn Agent
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function expressionLevel(level: string): number {
  const map: Record<string, number> = {
    High: 3,
    Medium: 2,
    Low: 1,
    'Not detected': 0,
  };
  return map[level] ?? 0;
}

function ExpressionBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    High: 'bg-emerald-100 text-emerald-700',
    Medium: 'bg-amber-100 text-amber-700',
    Low: 'bg-slate-100 text-slate-600',
    'Not detected': 'bg-slate-50 text-slate-400',
  };
  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
        colors[level] ?? 'bg-slate-100 text-slate-500'
      }`}
    >
      {level}
    </span>
  );
}
