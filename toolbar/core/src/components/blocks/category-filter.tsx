import { cn } from '@/utils';

export const ALL_CATEGORIES = 'all';

interface CategoryFilterProps {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
}

// Horizontal, scrollable list of unique block categories. "All" is always first.
export function CategoryFilter({
  categories,
  active,
  onChange,
}: CategoryFilterProps) {
  const items = [ALL_CATEGORIES, ...categories];

  return (
    <div className="flex flex-wrap gap-1">
      {items.map((category) => {
        const isActive = category === active;
        return (
          <button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            className={cn(
              'rounded-full border px-2.5 py-0.5 font-medium text-[11px] capitalize transition-colors',
              isActive
                ? 'border-foreground bg-foreground text-background'
                : 'border-border bg-background text-muted-foreground hover:border-muted-foreground hover:text-foreground',
            )}
          >
            {category === ALL_CATEGORIES ? 'All' : category.replace(/-/g, ' ')}
          </button>
        );
      })}
    </div>
  );
}
