import {
  type BlockusBlock,
  fetchCatalog,
  PACKAGE_MANAGERS,
} from '@/api/blockus';
import { Button } from '@/components/ui/button';
import {
  Panel,
  PanelContent,
  PanelFooter,
  PanelHeader,
} from '@/components/ui/panel';
import { useChatState } from '@/hooks/use-chat-state';
import { useLicenseKey } from '@/hooks/use-license-key';
import { usePackageManager } from '@/hooks/use-package-manager';
import { usePanels } from '@/hooks/use-panels';
import { Loader2Icon, RefreshCwIcon, XIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BlockusLogo } from '@/panels/shared-content/blockus-logo';
import { ApiKeyInput } from './api-key-input';
import { BlockCard } from './block-card';
import { BlockSearch } from './block-search';
import { ALL_CATEGORIES, CategoryFilter } from './category-filter';

// The dedicated blockus blocks browser: search + category filter + grid of
// cards, with an API key field to unlock Pro blocks. Selecting a block's
// preview adds it to the agent chat context; "Install" copies the CLI command.
export function BlocksPanel() {
  const { closeBlocks } = usePanels();
  const { licenseKey, isProUser } = useLicenseKey();
  const { packageManager, setPackageManager } = usePackageManager();
  const chatState = useChatState();

  const [blocks, setBlocks] = useState<BlockusBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>(ALL_CATEGORIES);

  const loadBlocks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const catalog = await fetchCatalog({ apiKey: licenseKey ?? undefined });
      setBlocks(catalog.blocks);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Failed to load blocks from blockus',
      );
    } finally {
      setIsLoading(false);
    }
  }, [licenseKey]);

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  const categories = useMemo(() => {
    return Array.from(new Set(blocks.map((b) => b.category))).sort();
  }, [blocks]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return blocks.filter((b) => {
      if (category !== ALL_CATEGORIES && b.category !== category) return false;
      if (!q) return true;
      const haystack = [b.name, b.category, ...(b.tags ?? [])]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [blocks, query, category]);

  const handleSelect = useCallback(
    (block: BlockusBlock) => {
      chatState.addChatBlocksContext({
        path: block.id,
        title: block.name,
        description: (block.tags ?? [block.category]).join(', '),
        category: 'popular',
      });
    },
    [chatState],
  );

  return (
    <Panel className="h-[60vh] max-h-[70vh]">
      <PanelHeader
        title={
          <span className="flex items-center gap-2 text-base">
            <BlockusLogo className="size-4" />
            blockus Blocks
          </span>
        }
        actionArea={
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadBlocks}
              className="size-8 rounded-full p-1"
              title="Refresh"
            >
              <RefreshCwIcon
                className={isLoading ? 'size-4 animate-spin' : 'size-4'}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeBlocks}
              className="size-8 rounded-full p-1"
            >
              <XIcon className="size-4" />
            </Button>
          </div>
        }
      />
      <PanelContent className="flex flex-col gap-3">
        <ApiKeyInput onChange={loadBlocks} />
        <div className="flex items-stretch gap-2">
          <div className="flex-1">
            <BlockSearch value={query} onChange={setQuery} />
          </div>
          <select
            value={packageManager}
            onChange={(e) =>
              setPackageManager(
                e.target.value as (typeof PACKAGE_MANAGERS)[number],
              )
            }
            title="Package manager used for the install command"
            className="rounded-md border border-border bg-background px-2 text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-muted-foreground"
          >
            {PACKAGE_MANAGERS.map((pm) => (
              <option key={pm} value={pm}>
                {pm}
              </option>
            ))}
          </select>
        </div>
        {categories.length > 0 && (
          <CategoryFilter
            categories={categories}
            active={category}
            onChange={setCategory}
          />
        )}

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground text-xs">
            <Loader2Icon className="size-4 animate-spin" />
            Loading blocks…
          </div>
        ) : error ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <p className="text-destructive text-xs">{error}</p>
            <Button variant="outline" size="sm" onClick={loadBlocks}>
              Retry
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-muted-foreground text-xs">
            No blocks found
            {query ? ` for "${query}"` : ''}.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1">
            {filtered.map((block) => (
              <BlockCard
                key={block.id}
                block={block}
                packageManager={packageManager}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </PanelContent>
      <PanelFooter>
        <div className="flex justify-between text-muted-foreground text-xs">
          <span>
            {filtered.length} block{filtered.length === 1 ? '' : 's'}
          </span>
          <span>{isProUser ? 'Pro unlocked' : 'Free tier'}</span>
        </div>
      </PanelFooter>
    </Panel>
  );
}
