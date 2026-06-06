import type { BlockusBlock } from '@/api/blockus';
import { cn } from '@/utils';
import { CheckIcon, CopyIcon, LockIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface BlockCardProps {
  block: BlockusBlock;
  /** Called when the user wants to add this block to the agent context. */
  onSelect?: (block: BlockusBlock) => void;
}

// A single block tile: preview, name, Pro badge, and an install action.
// In the browser toolbar "install" copies the shadcn command to the clipboard
// (the toolbar cannot open the IDE terminal directly).
export function BlockCard({ block, onSelect }: BlockCardProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const locked = block.isPro && !block.installable;

  const handleInstall = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (locked) return;
      try {
        await navigator.clipboard.writeText(block.installCommand);
        setCopied(true);
      } catch {
        // Clipboard may be unavailable in some embedding contexts.
        console.warn('Failed to copy install command');
      }
    },
    [block.installCommand, locked],
  );

  return (
    <div
      className={cn(
        'group flex flex-col gap-2 rounded-lg border border-border bg-background p-2 text-left transition-colors hover:border-muted-foreground',
      )}
    >
      <button
        type="button"
        onClick={() => onSelect?.(block)}
        className="relative aspect-video w-full overflow-hidden rounded-md border border-border bg-muted"
      >
        {block.previewImage ? (
          <img
            src={block.previewImage}
            alt={block.name}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-muted to-background">
            <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              {block.category}
            </span>
          </div>
        )}
        {block.isPro && (
          <span
            className={cn(
              'absolute top-1.5 right-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold text-[10px] uppercase tracking-wide',
              'bg-foreground text-background',
            )}
          >
            {locked && <LockIcon className="size-2.5" />}
            Pro
          </span>
        )}
      </button>

      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground text-xs">
            {block.name}
          </div>
          <div className="truncate text-muted-foreground text-[10px] uppercase tracking-wide">
            {block.category}
          </div>
        </div>

        {locked ? (
          <button
            type="button"
            disabled
            title="Unlock Pro — add your blockus API key"
            className="inline-flex cursor-not-allowed items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 font-medium text-[11px] text-muted-foreground opacity-70"
          >
            <LockIcon className="size-3" />
            Unlock Pro
          </button>
        ) : (
          <button
            type="button"
            onClick={handleInstall}
            title={block.installCommand}
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-background px-2 py-1 font-medium text-[11px] text-foreground transition-colors hover:bg-muted"
          >
            {copied ? (
              <>
                <CheckIcon className="size-3 text-green-600" />
                Copied
              </>
            ) : (
              <>
                <CopyIcon className="size-3" />
                Install
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
