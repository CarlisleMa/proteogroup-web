import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import type {
  ProteinDetail,
  ProteinSearchResult,
  PaginatedResponse,
} from '@/lib/types';

export function useProteinSearch(query: string) {
  return useSWR<PaginatedResponse<ProteinSearchResult>>(
    query.length >= 2 ? `/api/proteins/search?q=${encodeURIComponent(query)}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );
}

export function useProtein(proteinName: string | undefined) {
  return useSWR<ProteinDetail>(
    proteinName ? `/api/proteins/${encodeURIComponent(proteinName)}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );
}
