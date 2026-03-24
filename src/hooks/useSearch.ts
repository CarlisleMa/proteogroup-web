import { useState, useEffect } from 'react';

/**
 * Debounced search hook.
 * Returns the debounced value after a 300ms delay.
 */
export function useDebouncedSearch(initialValue = '', delay = 300) {
  const [query, setQuery] = useState(initialValue);
  const [debouncedQuery, setDebouncedQuery] = useState(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay]);

  return { query, debouncedQuery, setQuery };
}
