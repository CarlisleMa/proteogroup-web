'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDebouncedSearch } from '@/hooks/useSearch';
import { useProteinSearch } from '@/hooks/useProtein';
import PageHeader from '@/components/layout/PageHeader';

export default function ProteinsPage() {
  const { query, debouncedQuery, setQuery } = useDebouncedSearch('', 300);
  const { data, isLoading } = useProteinSearch(debouncedQuery);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Protein Explorer"
        description="Search proteins by name or gene symbol to see cross-method assignments and annotations."
      />

      {/* Search bar */}
      <div className="max-w-xl mb-8">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search proteins (e.g. GDF15, WFDC2, KLF4...)"
            className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}
        </div>
        {query.length > 0 && query.length < 2 && (
          <p className="text-xs text-slate-400 mt-1.5">
            Type at least 2 characters to search.
          </p>
        )}
      </div>

      {/* Results */}
      {data && debouncedQuery.length >= 2 && (
        <div>
          <p className="text-sm text-slate-500 mb-4">
            {(data as any).length ?? data.items?.length ?? 0} result
            {((data as any).length ?? data.items?.length ?? 0) !== 1 ? 's' : ''}{' '}
            for &ldquo;{debouncedQuery}&rdquo;
          </p>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-3 font-medium text-slate-500">
                    Protein
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">
                    Gene Name
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">
                    UniProt ID
                  </th>
                </tr>
              </thead>
              <tbody>
                {(data.items ?? (data as any))?.map(
                  (
                    p: { protein: string; gene_name: string; uniprot_id: string },
                    idx: number,
                  ) => (
                    <tr
                      key={p.protein}
                      className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/proteins/${encodeURIComponent(p.protein)}`}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {p.protein}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono">
                        {p.gene_name || '\u2014'}
                      </td>
                      <td className="px-4 py-3">
                        {p.uniprot_id ? (
                          <a
                            href={`https://www.uniprot.org/uniprot/${p.uniprot_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 text-xs"
                          >
                            {p.uniprot_id}
                          </a>
                        ) : (
                          '\u2014'
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!query && (
        <div className="text-center py-16">
          <p className="text-slate-400 text-sm">
            Start typing to search across 1,958 proteins from the UK Biobank
            Olink Explore 3072 panel.
          </p>
        </div>
      )}
    </div>
  );
}
