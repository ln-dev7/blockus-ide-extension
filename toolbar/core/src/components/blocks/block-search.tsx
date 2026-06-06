import { cn } from '@/utils';
import { SearchIcon, XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BlockSearchProps {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
  placeholder?: string;
}

// Debounced search input with a clear button. Filters blocks by name, tags
// and category (filtering happens in the parent against the cached catalog).
export function BlockSearch({
  value,
  onChange,
  debounceMs = 300,
  placeholder = 'Search blocks…',
}: BlockSearchProps) {
  const [local, setLocal] = useState(value);

  // Keep local input in sync when cleared from the outside.
  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (local !== value) onChange(local);
    }, debounceMs);
    return () => clearTimeout(t);
  }, [local, debounceMs, onChange, value]);

  return (
    <div className="relative">
      <SearchIcon className="-translate-y-1/2 absolute top-1/2 left-2.5 size-3.5 text-muted-foreground" />
      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-md border border-border bg-background py-1.5 pr-7 pl-8 text-foreground text-xs',
          'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-muted-foreground',
        )}
      />
      {local && (
        <button
          type="button"
          onClick={() => {
            setLocal('');
            onChange('');
          }}
          className="-translate-y-1/2 absolute top-1/2 right-2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </div>
  );
}
