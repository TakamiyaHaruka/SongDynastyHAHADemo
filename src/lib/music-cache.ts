import { readFile, writeFile, mkdir, rename, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fallbackMusicCard, resolveAppleMusicCard } from './apple-music.ts';
import type { AppleMusicCard } from './apple-music.ts';

export const MUSIC_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CacheEntry { updatedAt: number; card: AppleMusicCard }
interface MusicCache { version: 2; entries: Record<string, CacheEntry> }
interface MusicOptions {
  cacheFile?: string;
  now?: number;
  resolveCard?: (link: string) => Promise<AppleMusicCard>;
  warn?: (message: string) => void;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isCard = (value: unknown, link: string): value is AppleMusicCard => {
  if (!isRecord(value) || value.link !== link) return false;
  const strings = ['title', 'artist', 'year', 'genre', 'accent'];
  const nullableStrings = ['previewUrl', 'artwork', 'artworkSrcSet', 'artworkSizes',
    'artworkThumb', 'artworkThumbSrcSet', 'artworkThumbSizes'];
  return strings.every((key) => typeof value[key] === 'string' && value[key].trim().length > 0)
    && nullableStrings.every((key) => value[key] === null || typeof value[key] === 'string')
    && ['trackNumber', 'trackCount'].every((key) => value[key] === null || (typeof value[key] === 'number' && Number.isFinite(value[key])))
    && (value.releaseType === 'single' || value.releaseType === 'album')
    // Older caches stored failed lookups as cards. Do not treat those as successes.
    && !(value.title === 'Music' && /链接格式|抓取失败|资料暂不可用/.test(String(value.artist)));
};

const parseCache = (raw: string): MusicCache => {
  const cache: MusicCache = { version: 2, entries: {} };
  const data: unknown = JSON.parse(raw);
  if (!isRecord(data)) return cache;
  if (data.version === 2 && isRecord(data.entries)) {
    for (const [link, entry] of Object.entries(data.entries)) {
      if (isRecord(entry) && typeof entry.updatedAt === 'number'
        && Number.isFinite(entry.updatedAt) && entry.updatedAt > 0 && isCard(entry.card, link)) {
        cache.entries[link] = { updatedAt: entry.updatedAt, card: entry.card };
      }
    }
  } else if (isRecord(data.cards) && typeof data.ts === 'number' && Number.isFinite(data.ts) && data.ts > 0) {
    // Read the original global-timestamp format without losing valid metadata.
    for (const [link, card] of Object.entries(data.cards)) {
      if (isCard(card, link)) cache.entries[link] = { updatedAt: data.ts, card };
    }
  }
  return cache;
};

const readCache = async (file: string): Promise<MusicCache> => {
  try { return parseCache(await readFile(file, 'utf8')); }
  catch { return { version: 2, entries: {} }; }
};

const saveCache = async (file: string, cache: MusicCache): Promise<void> => {
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await mkdir(dirname(file), { recursive: true });
    await writeFile(temporary, JSON.stringify(cache, null, 2), 'utf8');
    await rename(temporary, file);
  } finally {
    await rm(temporary, { force: true });
  }
};

export async function loadMusicCards(links: string[], options: MusicOptions = {}): Promise<AppleMusicCard[]> {
  const {
    cacheFile = resolve('.cache/music-metadata.json'),
    now = Date.now(),
    resolveCard = resolveAppleMusicCard,
    warn = console.warn,
  } = options;
  const cache = await readCache(cacheFile);
  let changed = false;
  // Resolve duplicates once, while returning cards in the configured order.
  const cards = new Map(await Promise.all([...new Set(links)].map(async (link) => {
    const hit = cache.entries[link];
    if (hit && now >= hit.updatedAt && now - hit.updatedAt < MUSIC_CACHE_TTL_MS) {
      return [link, hit.card] as const;
    }
    try {
      const card = await resolveCard(link);
      if (!isCard(card, link)) throw new Error('Invalid music metadata');
      cache.entries[link] = { updatedAt: now, card };
      changed = true;
      return [link, card] as const;
    } catch {
      warn(`[music] ${hit ? 'Using last successful metadata' : 'Metadata unavailable'}: ${link}`);
      // Keep the original timestamp, so a failed refresh is retried next build.
      return [link, hit?.card ?? fallbackMusicCard(link)] as const;
    }
  })));
  if (changed) {
    try { await saveCache(cacheFile, cache); }
    catch (error) { warn(`[music] Could not write the metadata cache; the site can still build. ${error instanceof Error ? error.message : String(error)}`); }
  }
  return links.map((link) => cards.get(link)!);
}
