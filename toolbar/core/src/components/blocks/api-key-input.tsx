import { BLOCKUS_API_KEY_PREFIX, BLOCKUS_BASE_URL } from '@/api/blockus';
import { useLicenseKey } from '@/hooks/use-license-key';
import { cn } from '@/utils';
import {
  CheckCircleIcon,
  KeyIcon,
  Loader2Icon,
  TrashIcon,
} from 'lucide-react';
import { useCallback, useState } from 'react';

interface ApiKeyInputProps {
  /** Called after a successful save/remove so parents can refetch the catalog. */
  onChange?: () => void;
}

// Lets the user paste their BLOCKUS_API_KEY (bk_live_…) to unlock Pro blocks.
// The key is persisted by the useLicenseKey hook under "blockus_api_key".
export function ApiKeyInput({ onChange }: ApiKeyInputProps) {
  const { licenseKey, isProUser, saveLicenseKey, removeLicenseKey } =
    useLicenseKey();
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setError(null);
    const trimmed = input.trim();
    if (!trimmed.startsWith(BLOCKUS_API_KEY_PREFIX)) {
      setError(`Key must start with "${BLOCKUS_API_KEY_PREFIX}"`);
      return;
    }
    setIsSaving(true);
    try {
      await saveLicenseKey(trimmed);
      setInput('');
      onChange?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to validate key');
    } finally {
      setIsSaving(false);
    }
  }, [input, saveLicenseKey, onChange]);

  const handleRemove = useCallback(() => {
    removeLicenseKey();
    onChange?.();
  }, [removeLicenseKey, onChange]);

  // Connected state: show a green "Pro unlocked" badge.
  if (isProUser && licenseKey) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2 dark:border-green-800 dark:bg-green-950/40">
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="size-4 text-green-600 dark:text-green-400" />
          <span className="font-medium text-green-700 text-xs dark:text-green-300">
            Pro unlocked
          </span>
          <code className="rounded bg-green-100 px-1.5 py-0.5 font-mono text-[10px] text-green-700 dark:bg-green-900/50 dark:text-green-300">
            {licenseKey.slice(0, 12)}…
          </code>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-red-600 hover:text-red-700 dark:text-red-400"
        >
          <TrashIcon className="size-3" />
          Remove
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <KeyIcon className="-translate-y-1/2 absolute top-1/2 left-2.5 size-3.5 text-muted-foreground" />
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
            }}
            placeholder="bk_live_…"
            className={cn(
              'w-full rounded-md border border-border bg-background py-1.5 pr-2 pl-8 font-mono text-foreground text-xs',
              'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-muted-foreground',
            )}
          />
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !input.trim()}
          className="inline-flex items-center gap-1 rounded-md bg-foreground px-3 py-1.5 font-medium text-background text-xs disabled:opacity-50"
        >
          {isSaving && <Loader2Icon className="size-3 animate-spin" />}
          Unlock Pro
        </button>
      </div>
      {error ? (
        <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Get your key at{' '}
          <a
            href={`${BLOCKUS_BASE_URL}/account/registry-token`}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            blockus.lndevui.com
          </a>
        </p>
      )}
    </div>
  );
}
