// blockus registry API client.
//
// Mirrors the contract exposed by the blockus app at `GET /api/blocks`
// (see blockus repo: app/api/blocks/route.ts). A single request returns the
// whole catalog; Pro blocks are always visible but only `installable` when the
// caller presents a valid Pro API key.

export const BLOCKUS_BASE_URL = 'https://blockus.lndevui.com';
export const BLOCKUS_NAMESPACE = 'blockus';

/** localStorage key under which the user's blockus API key is persisted. */
export const BLOCKUS_API_KEY_STORAGE_KEY = 'blockus_api_key';

/** All blockus Pro API keys start with this prefix (see lib/registry-tokens.ts). */
export const BLOCKUS_API_KEY_PREFIX = 'bk_live_';

/** A single block as returned by `GET /api/blocks`. */
export interface BlockusBlock {
  id: string;
  name: string;
  category: string;
  isPro: boolean;
  previewImage?: string;
  tags?: string[];
  /** Whether the current caller can install this block (free, or Pro + unlocked). */
  installable: boolean;
  /** Ready-to-run shadcn install command for this block. */
  installCommand: string;
}

/** Envelope returned by `GET /api/blocks`. */
export interface BlockusCatalog {
  /** Whether the presented API key unlocks Pro blocks. */
  unlocked: boolean;
  total: number;
  blocks: BlockusBlock[];
}

export interface BlockusConfig {
  /** BLOCKUS_API_KEY (bk_live_…) if the user is authenticated. */
  apiKey?: string;
  /** Defaults to https://blockus.lndevui.com */
  baseUrl?: string;
}

function buildHeaders(apiKey?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  return headers;
}

/** Fetch the full block catalog. Pro blocks unlock when a valid key is passed. */
export async function fetchCatalog(
  config: BlockusConfig = {},
): Promise<BlockusCatalog> {
  const baseUrl = config.baseUrl ?? BLOCKUS_BASE_URL;
  const res = await fetch(`${baseUrl}/api/blocks`, {
    headers: buildHeaders(config.apiKey),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch blocks: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as BlockusCatalog;
}

/** Convenience wrapper returning just the blocks array. */
export async function fetchBlocks(
  config: BlockusConfig = {},
): Promise<BlockusBlock[]> {
  const catalog = await fetchCatalog(config);
  return catalog.blocks;
}

export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';
export const PACKAGE_MANAGERS: PackageManager[] = ['pnpm', 'npm', 'yarn', 'bun'];

/** localStorage key under which the chosen package manager is persisted. */
export const BLOCKUS_PACKAGE_MANAGER_STORAGE_KEY = 'blockus_package_manager';

/** Generate the shadcn CLI command that installs a block by id, per package manager. */
export function getInstallCommand(
  blockId: string,
  pm: PackageManager = 'pnpm',
): string {
  const slug = `@${BLOCKUS_NAMESPACE}/${blockId}`;
  switch (pm) {
    case 'npm':
      return `npx shadcn@latest add ${slug}`;
    case 'yarn':
      return `yarn dlx shadcn@latest add ${slug}`;
    case 'bun':
      return `bunx --bun shadcn@latest add ${slug}`;
    default:
      return `pnpm dlx shadcn@latest add ${slug}`;
  }
}

/** URL of a single block's registry item JSON (used to pull source for the agent). */
export function getRegistryItemUrl(blockId: string, baseUrl = BLOCKUS_BASE_URL): string {
  return `${baseUrl}/r/${blockId}.json`;
}

/** Whether a string looks like a blockus Pro API key. */
export function isValidApiKeyFormat(key: string): boolean {
  return key.trim().startsWith(BLOCKUS_API_KEY_PREFIX);
}

/**
 * Validate an API key by asking the catalog endpoint whether it unlocks Pro.
 * Returns true only when the key belongs to a Pro account.
 */
export async function validateApiKey(
  apiKey: string,
  baseUrl = BLOCKUS_BASE_URL,
): Promise<boolean> {
  if (!isValidApiKeyFormat(apiKey)) return false;
  try {
    const catalog = await fetchCatalog({ apiKey, baseUrl });
    return catalog.unlocked === true;
  } catch {
    return false;
  }
}

/** Read the persisted API key from localStorage (browser/toolbar context). */
export function getStoredApiKey(): string | null {
  try {
    return localStorage.getItem(BLOCKUS_API_KEY_STORAGE_KEY);
  } catch {
    return null;
  }
}
