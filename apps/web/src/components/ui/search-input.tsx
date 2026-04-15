'use client';

import { Loader2, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SearchInputProps {
  /// Initial value (optional). Use `defaultValue` if you want uncontrolled.
  defaultValue?: string;
  /// Fires after the user has stopped typing for `delay` ms (default 300).
  onSearch: (query: string) => void;
  /// Show a spinner — caller flips this to `true` while the request is inflight.
  loading?: boolean;
  placeholder?: string;
  delay?: number;
}

/**
 * Debounced search box. Calls `onSearch` after the user stops typing for
 * `delay` ms. The first call after mount fires only when the value changes
 * from the initial defaultValue, so list pages don't double-fetch on load.
 */
export function SearchInput({
  defaultValue = '',
  onSearch,
  loading = false,
  placeholder = 'Rechercher…',
  delay = 300,
}: SearchInputProps) {
  const [value, setValue] = useState(defaultValue);
  const [debounced, setDebounced] = useState(defaultValue);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  useEffect(() => {
    onSearch(debounced.trim());
    // Intentionally exclude onSearch — callers may pass a fresh closure each
    // render; depending on it would loop. The debounced value is the only
    // signal we want to act on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className="relative w-full sm:w-72">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 py-2 text-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
      />
      {loading ? (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
      ) : value ? (
        <button
          type="button"
          onClick={() => setValue('')}
          aria-label="Effacer"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-700"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
