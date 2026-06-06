import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type BlockusBlock,
  BLOCKUS_BASE_URL,
  fetchCatalog,
} from '@/api/blockus';

// Item shape consumed by the chat @-mention blocks list. `path` carries the
// blockus block id so it can later be resolved to source via /r/{id}.json.
export interface BlockItem {
  path: string;
  title: string;
  description: string;
  category: 'popular' | 'recent';
  name?: string;
  // blockus metadata (optional, used for preview / pro badges)
  isPro?: boolean;
  installable?: boolean;
  previewImage?: string;
  blockCategory?: string;
}

interface UseBlockSearchOptions {
  licenseKey?: string;
  debounceMs?: number;
  minScore?: number;
  maxResults?: number;
}

interface UseBlockSearchResult {
  searchResults: BlockItem[];
  isSearching: boolean;
  searchError: string | null;
  performLocalSearch: (blocks: BlockItem[], query: string) => BlockItem[];
  fuzzySearchBlocks: (
    blocks: BlockItem[],
    query: string,
    minScore?: number,
  ) => BlockItem[];
}

// Map a blockus catalog block to the chat BlockItem shape.
export const blockusToBlockItem = (b: BlockusBlock): BlockItem => ({
  path: b.id,
  title: b.name,
  description: (b.tags ?? [b.category]).slice(0, 6).join(', '),
  category: 'popular',
  name: b.name,
  isPro: b.isPro,
  installable: b.installable,
  previewImage: b.previewImage,
  blockCategory: b.category,
});

// --- catalog cache -----------------------------------------------------------
// The blockus catalog comes from a single /api/blocks call. Cache it per API key
// so repeated searches don't refetch the whole list on every keystroke.
let catalogCache: { key: string; blocks: BlockItem[] } | null = null;

const loadCatalogBlocks = async (licenseKey?: string): Promise<BlockItem[]> => {
  const cacheKey = licenseKey ?? 'anon';
  if (catalogCache && catalogCache.key === cacheKey) {
    return catalogCache.blocks;
  }
  const catalog = await fetchCatalog({
    apiKey: licenseKey,
    baseUrl: BLOCKUS_BASE_URL,
  });
  const blocks = catalog.blocks.map(blockusToBlockItem);
  catalogCache = { key: cacheKey, blocks };
  return blocks;
};

// --- fuzzy search (generic, source-agnostic) ---------------------------------
const calculateBlockFuzzyScore = (
  block: BlockItem,
  searchTerm: string,
): number => {
  const title = (block.title || '').toLowerCase();
  const name = (block.name || '').toLowerCase();
  const category = (block.blockCategory || '').toLowerCase();
  const description = (block.description || '').toLowerCase();

  if (title === searchTerm) return 1.0;
  if (name === searchTerm) return 0.98;
  if (title.startsWith(searchTerm)) return 0.95;
  if (name.startsWith(searchTerm)) return 0.92;
  if (category === searchTerm) return 0.9;
  if (title.includes(searchTerm)) return 0.85;
  if (name.includes(searchTerm)) return 0.8;
  if (category.includes(searchTerm)) return 0.75;
  if (description.includes(searchTerm)) return 0.7;

  const searchWords = searchTerm.split(/\s+/);
  for (const word of searchWords) {
    if (word.length > 2) {
      if (title.startsWith(word)) return 0.72;
      if (title.includes(word)) return 0.62;
      if (category.includes(word)) return 0.6;
      if (description.includes(word)) return 0.55;
    }
  }

  const titleScore = getBlockStringSimilarity(searchTerm, title);
  const nameScore = getBlockStringSimilarity(searchTerm, name) * 0.9;
  return Math.max(titleScore, nameScore);
};

const getBlockStringSimilarity = (search: string, target: string): number => {
  const searchWords = search.split(/\s+/);
  const targetWords = target.split(/\s+/);
  let bestWordScore = 0;

  searchWords.forEach((searchWord) => {
    targetWords.forEach((targetWord) => {
      if (targetWord.includes(searchWord) || searchWord.includes(targetWord)) {
        bestWordScore = Math.max(bestWordScore, 1.0);
        return;
      }
      const wordDistance = levenshteinDistance(searchWord, targetWord);
      const maxWordDistance = Math.max(1, Math.floor(searchWord.length * 0.3));
      if (wordDistance <= maxWordDistance) {
        const wordSimilarity =
          1 - wordDistance / Math.max(searchWord.length, targetWord.length);
        bestWordScore = Math.max(bestWordScore, wordSimilarity * 0.9);
      }
    });
  });

  if (bestWordScore > 0.5) {
    return bestWordScore;
  }

  const maxAllowedDistance = Math.max(2, Math.floor(search.length * 0.25));
  const distance = levenshteinDistance(search, target);
  if (distance > maxAllowedDistance) {
    return 0;
  }

  const maxLength = Math.max(search.length, target.length);
  const levenScore =
    distance === 0 ? 1.0 : Math.max(0, 1 - distance / maxLength);
  const overlapScore = getCharacterOverlap(search, target);
  return levenScore * 0.6 + overlapScore * 0.4;
};

const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + substitutionCost,
      );
    }
  }

  return matrix[str2.length][str1.length];
};

const getCharacterOverlap = (str1: string, str2: string): number => {
  const chars1 = new Set(str1.toLowerCase());
  const chars2 = new Set(str2.toLowerCase());
  const intersection = new Set([...chars1].filter((x) => chars2.has(x)));
  const union = new Set([...chars1, ...chars2]);
  return intersection.size / union.size;
};

// Natural sorting for numeric sequences (hero-1, hero-2, hero-11)
const naturalSort = (a: string, b: string): number => {
  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
  });
  return collator.compare(a, b);
};

const fuzzySearchBlocks = (
  blocks: BlockItem[],
  query: string,
  minScore = 0.35,
): BlockItem[] => {
  if (!query.trim() || blocks.length === 0) {
    return blocks;
  }

  const searchTerm = query.toLowerCase().trim();
  const results: { block: BlockItem; score: number }[] = [];

  blocks.forEach((block) => {
    const score = calculateBlockFuzzyScore(block, searchTerm);
    if (score >= minScore) {
      results.push({ block, score });
    }
  });

  const sortedResults = results.sort((a, b) => {
    if (Math.abs(a.score - b.score) > 0.01) {
      return b.score - a.score;
    }
    return naturalSort(a.block.title || '', b.block.title || '');
  });

  return sortedResults.map((result) => result.block);
};

const performLocalSearch = (
  blocks: BlockItem[],
  query: string,
): BlockItem[] => {
  return fuzzySearchBlocks(blocks, query, 0.3);
};

export const useBlockSearch = (
  searchQuery: string,
  localBlocks: BlockItem[],
  options: UseBlockSearchOptions = {},
): UseBlockSearchResult => {
  const {
    licenseKey,
    debounceMs = 300,
    minScore = 0.35,
    maxResults = 30,
  } = options;

  const [searchResults, setSearchResults] = useState<BlockItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const localBlocksRef = useRef(localBlocks);
  localBlocksRef.current = localBlocks;

  useEffect(() => {
    if (!searchQuery?.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    let cancelled = false;
    const searchTimeout = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);

      try {
        const query = searchQuery.trim().toLowerCase();

        // Show local results immediately for snappy feedback.
        const localResults = performLocalSearch(localBlocksRef.current, query);
        if (!cancelled) setSearchResults(localResults);

        // Then search the full blockus catalog.
        const catalog = await loadCatalogBlocks(licenseKey);
        if (cancelled) return;

        const catalogResults = fuzzySearchBlocks(catalog, query, minScore);
        const seen = new Set<string>();
        const combined = [...catalogResults, ...localResults].filter((b) => {
          if (seen.has(b.path)) return false;
          seen.add(b.path);
          return true;
        });

        setSearchResults(combined.slice(0, maxResults));
      } catch (error) {
        console.warn('blockus catalog search failed:', error);
        if (!cancelled) {
          setSearchError('Search failed');
        }
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(searchTimeout);
    };
  }, [searchQuery, licenseKey, debounceMs, minScore, maxResults]);

  const performLocalSearchCallback = useCallback(
    (blocks: BlockItem[], query: string) => performLocalSearch(blocks, query),
    [],
  );

  const fuzzySearchBlocksCallback = useCallback(
    (blocks: BlockItem[], query: string, customMinScore?: number) =>
      fuzzySearchBlocks(blocks, query, customMinScore ?? minScore),
    [minScore],
  );

  return {
    searchResults,
    isSearching,
    searchError,
    performLocalSearch: performLocalSearchCallback,
    fuzzySearchBlocks: fuzzySearchBlocksCallback,
  };
};
