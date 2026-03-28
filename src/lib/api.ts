const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://proteogroup-api-production.up.railway.app';

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// SWR fetcher
export const fetcher = <T>(url: string): Promise<T> => apiFetch<T>(url);
