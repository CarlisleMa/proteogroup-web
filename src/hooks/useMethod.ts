import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import type {
  MethodSummary,
  MethodDetail,
  PaginatedResponse,
} from '@/lib/types';

export function useMethods(params?: {
  sort_by?: string;
  order?: string;
  family?: string;
  page?: number;
}) {
  const searchParams = new URLSearchParams(
    params as Record<string, string>,
  ).toString();
  return useSWR<PaginatedResponse<MethodSummary>>(
    `/api/methods?${searchParams}`,
    fetcher,
    { revalidateOnFocus: false },
  );
}

export function useMethod(methodName: string | undefined) {
  return useSWR<MethodDetail>(
    methodName ? `/api/methods/${methodName}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );
}
