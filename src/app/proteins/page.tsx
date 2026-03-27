'use client';

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
      <div className="max-w-xl mb-8 animate-fade-in">
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search proteins (e.g. GDF15, WFDC2, KLF4...)"
            className="input-modern pl-11"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}
        </div>
        {query.length > 0 && query.length < 2 && (
          <p className="text-xs text-slate-400 mt-2">
            Type at least 2 characters to search.
          </p>
        )}
      </div>

      {/* Results */}
      {data && debouncedQuery.length >= 2 && (
        <div className="animate-fade-in">
          <p className="text-sm text-slate-400 mb-4">
            {(data as any).length ?? data.items?.length ?? 0} result
            {((data as any).length ?? data.items?.length ?? 0) !== 1 ? 's' : ''}{' '}
            for &ldquo;{debouncedQuery}&rdquo;
          </p>

          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <table className="w-full text-sm table-modern">
              <thead>
                <tr>
                  <th className="text-left">Protein</th>
                  <th className="text-left">Gene Name</th>
                  <th className="text-left">UniProt ID</th>
                </tr>
              </thead>
              <tbody>
                {(data.items ?? (data as any))?.map(
                  (
                    p: { protein: string; gene_name: string; uniprot_id: string },
                  ) => (
                    <tr key={p.protein}>
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
                            className="text-blue-600 hover:text-blue-700 text-xs font-mono"
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
        <div className="text-center py-20 animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Start typing to search across 1,958 proteins from the UK Biobank
            Olink Explore 3072 panel.
          </p>
        </div>
      )}
    </div>
  );
}
