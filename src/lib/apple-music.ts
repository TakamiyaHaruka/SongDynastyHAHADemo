export interface AppleMusicCard {
  link: string;
  previewUrl: string | null;
  title: string;
  artist: string;
  artwork: string | null;
  artworkSrcSet: string | null;
  artworkSizes: string | null;
  artworkThumb: string | null;
  artworkThumbSrcSet: string | null;
  artworkThumbSizes: string | null;
  year: string;
  genre: string;
  trackNumber: number | null;
  trackCount: number | null;
  releaseType: 'single' | 'album';
  accent: string;
}

interface AppleLookupResult {
  wrapperType?: string;
  artistName?: string;
  artworkUrl100?: string;
  artworkUrl60?: string;
  collectionId?: number;
  collectionType?: string;
  collectionName?: string;
  copyright?: string;
  kind?: string;
  previewUrl?: string;
  primaryGenreName?: string;
  releaseDate?: string;
  trackNumber?: number;
  trackCount?: number;
  trackName?: string;
  isStreamable?: boolean;
}

interface ParsedAppleIds {
  trackId: string | null;
  collectionId: string | null;
}

const musicAccentPalette = [
  '36 65% 46%',
  '28 55% 42%',
  '14 60% 48%',
  '45 50% 44%',
  '20 45% 40%',
  '340 35% 45%',
] as const;

const hashToAccent = (seed: string): string => {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 33 + seed.charCodeAt(index)) >>> 0;
  }

  return musicAccentPalette[hash % musicAccentPalette.length];
};

const toReleaseYear = (source?: string, copyright?: string): string => {
  if (!source) {
    const fromCopyright = copyright?.match(/(19|20)\d{2}/)?.[0];
    return fromCopyright ?? '年份未知';
  }

  const parsed = new Date(source);

  if (Number.isNaN(parsed.getTime())) {
    return '年份未知';
  }

  return String(parsed.getUTCFullYear());
};

const toReleaseType = (collectionType?: string, trackCount?: number): 'single' | 'album' => {
  if (typeof trackCount === 'number') {
    if (trackCount <= 1) {
      return 'single';
    }

    return 'album';
  }

  if (collectionType?.toLowerCase() === 'album') {
    return 'album';
  }

  return 'single';
};

const parseAppleIds = (link: string): ParsedAppleIds => {
  try {
    const parsed = new URL(link);
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'music.apple.com') return { trackId: null, collectionId: null };
    const idInQuery = parsed.searchParams.get('i');
    const pathSegments = parsed.pathname.split('/').filter(Boolean);
    const numericSegments = pathSegments.filter((segment) => /^\d+$/.test(segment));
    const idInPath = parsed.pathname.match(/id(\d+)/)?.[1] ?? null;
    const plainNumericPathId = numericSegments.length > 0 ? numericSegments[numericSegments.length - 1] : null;

    const collectionId =
      (plainNumericPathId && /^\d+$/.test(plainNumericPathId) ? plainNumericPathId : null) ??
      (idInPath && /^\d+$/.test(idInPath) ? idInPath : null);
    const trackId = idInQuery && /^\d+$/.test(idInQuery)
      ? idInQuery
      : collectionId;

    return { trackId, collectionId };
  } catch {
    return { trackId: null, collectionId: null };
  }
};

const toSizedArtwork = (url: string, size: number): string => {
  return url.replace(/\d+x\d+bb/g, `${size}x${size}bb`);
};

export const createFallbackCard = (link: string, accent: string, artist = '资料暂不可用'): AppleMusicCard => ({
  link,
  title: 'Music',
  artist,
  previewUrl: null,
  artwork: null,
  artworkSrcSet: null,
  artworkSizes: null,
  artworkThumb: null,
  artworkThumbSrcSet: null,
  artworkThumbSizes: null,
  year: '年份未知',
  genre: '流派未标注',
  trackNumber: null,
  trackCount: null,
  releaseType: 'single',
  accent,
});

export const resolveAppleMusicCard = async (link: string, fetcher: typeof fetch = fetch, timeoutMs = 5000): Promise<AppleMusicCard> => {
  const { trackId, collectionId } = parseAppleIds(link);

  if (!trackId) {
    throw new Error('Unsupported Apple Music link');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const trackRequest = fetcher(`https://itunes.apple.com/lookup?id=${trackId}&country=cn&entity=song`, {
      signal: controller.signal,
    });
    const collectionRequest = collectionId && collectionId !== trackId
      ? fetcher(`https://itunes.apple.com/lookup?id=${collectionId}&country=cn&entity=album`, {
          signal: controller.signal,
        }).then(async (response) => response.ok ? response.json() : null).catch(() => null)
      : null;
    const [trackResponse, collectionPayload] = await Promise.all([
      trackRequest,
      collectionRequest,
    ]);

    if (!trackResponse.ok) {
      throw new Error('Lookup failed');
    }

    const trackPayload = await trackResponse.json();
    const trackResults = Array.isArray(trackPayload?.results) ? (trackPayload.results as AppleLookupResult[]) : [];
    const collectionResults = Array.isArray(collectionPayload?.results) ? (collectionPayload.results as AppleLookupResult[]) : [];
    const matched =
      trackResults.find((item) => item.kind === 'song') ??
      trackResults.find((item) => item.wrapperType === 'track');
    const collection =
      collectionResults.find((item) => item.wrapperType === 'collection') ??
      trackResults.find((item) => item.wrapperType === 'collection') ??
      trackResults.find((item) => typeof item.trackCount === 'number');

    if (!matched || !(matched.trackName || matched.collectionName)) {
      throw new Error('No lookup result');
    }

    const artworkSource = matched.artworkUrl100 ?? matched.artworkUrl60;
    const artworkCover = artworkSource ? toSizedArtwork(artworkSource, 420) : null;
    const artworkCoverHi = artworkSource ? toSizedArtwork(artworkSource, 600) : null;
    const artworkThumb = artworkSource ? toSizedArtwork(artworkSource, 64) : null;
    const artworkThumbHi = artworkSource ? toSizedArtwork(artworkSource, 120) : null;
    const trackCount =
      typeof collection?.trackCount === 'number'
        ? collection.trackCount
        : typeof matched.trackCount === 'number'
          ? matched.trackCount
          : null;
    const trackNumber = typeof matched.trackNumber === 'number' ? matched.trackNumber : null;
    const releaseType = toReleaseType(matched.collectionType ?? collection?.collectionType, trackCount ?? undefined);
    const year = toReleaseYear(collection?.releaseDate ?? matched.releaseDate, collection?.copyright ?? matched.copyright);
    const genre = collection?.primaryGenreName ?? matched.primaryGenreName ?? '流派未标注';
    const title = matched.trackName ?? matched.collectionName ?? 'Music';
    const artist = matched.artistName ?? '未知艺术家';

    const streamable = matched.isStreamable !== false;
    const previewUrl = streamable && matched.previewUrl ? matched.previewUrl : null;

    return {
      link,
      title,
      artist,
      previewUrl,
      artwork: artworkCover,
      artworkSrcSet: artworkCover && artworkCoverHi ? `${artworkCover} 420w, ${artworkCoverHi} 600w` : null,
      artworkSizes: '(max-width: 767px) 82vw, 421px',
      artworkThumb,
      artworkThumbSrcSet: artworkThumb && artworkThumbHi ? `${artworkThumb} 64w, ${artworkThumbHi} 120w` : null,
      artworkThumbSizes: '65px',
      year,
      genre,
      trackNumber,
      trackCount,
      releaseType,
      accent: hashToAccent(`${title}-${artist}`),
    };
  } finally {
    controller.abort();
    clearTimeout(timeout);
  }
};


export const fallbackMusicCard = (link: string): AppleMusicCard => createFallbackCard(link, hashToAccent(link));
