import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { fallbackMusicCard, resolveAppleMusicCard } from '../src/lib/apple-music.ts'
import { loadMusicCards, MUSIC_CACHE_TTL_MS } from '../src/lib/music-cache.ts'

const link = 'https://music.apple.com/cn/song/example/123'
const anotherLink = 'https://music.apple.com/cn/song/another/456'
const now = 1_790_000_000_000
const successfulCard = (url = link, title = 'Song') => ({ ...fallbackMusicCard(url), title, artist: 'Artist' })
const entry = (card = successfulCard(), updatedAt = now) => ({ card, updatedAt })
const failedLookup = async () => { throw new Error('offline') }

async function fixture(t, cache) {
  const directory = await mkdtemp(join(tmpdir(), 'haruka-music-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const cacheFile = join(directory, 'music.json')
  if (cache !== undefined) await writeFile(cacheFile, typeof cache === 'string' ? cache : JSON.stringify(cache))
  const warnings = []
  return { cacheFile, now, warn: (message) => warnings.push(message), warnings }
}

test('fresh legacy metadata is reused without a network request', async (t) => {
  const card = successfulCard()
  const options = await fixture(t, { ts: now, cards: { [link]: card } })
  let calls = 0
  const cards = await loadMusicCards([link], { ...options, resolveCard: async () => { calls++; return card } })
  assert.deepEqual(cards, [card])
  assert.equal(calls, 0)
})

test('failed stale refresh preserves the last success and retries next build', async (t) => {
  const cachedEntry = entry(successfulCard(), now - MUSIC_CACHE_TTL_MS)
  const original = { version: 2, entries: { [link]: cachedEntry } }
  const options = await fixture(t, original)
  let calls = 0
  const resolveCard = async () => { calls++; return failedLookup() }
  for (let build = 0; build < 2; build++) {
    assert.deepEqual(await loadMusicCards([link], { ...options, resolveCard }), [cachedEntry.card])
  }
  assert.equal(calls, 2)
  assert.deepEqual(JSON.parse(await readFile(options.cacheFile, 'utf8')), original)
})

test('partial refresh updates only successful entries and preserves playlist order', async (t) => {
  const stale = entry(successfulCard(), now - MUSIC_CACHE_TTL_MS)
  const other = entry(successfulCard(anotherLink), now - MUSIC_CACHE_TTL_MS)
  const options = await fixture(t, { version: 2, entries: { [link]: stale, [anotherLink]: other } })
  const fresh = successfulCard(anotherLink, 'Updated')
  const cards = await loadMusicCards([anotherLink, link], {
    ...options, resolveCard: async (url) => url === link ? failedLookup() : fresh,
  })
  assert.deepEqual(cards, [fresh, stale.card])
  const saved = JSON.parse(await readFile(options.cacheFile, 'utf8'))
  assert.deepEqual(saved.entries[link], stale)
  assert.deepEqual(saved.entries[anotherLink], entry(fresh))
})

test('a cold offline build shows a fallback without caching it as a success', async (t) => {
  const options = await fixture(t)
  const [card] = await loadMusicCards([link], { ...options, resolveCard: failedLookup })
  assert.equal(card.previewUrl, null)
  assert.equal(card.link, link)
  await assert.rejects(readFile(options.cacheFile), { code: 'ENOENT' })
})

test('corrupt and malformed caches are replaced by successful lookups', async (t) => {
  for (const raw of ['{broken', 'null', '{"version":2,"entries":null}', JSON.stringify({ version: 2, entries: { [link]: entry({ link }) } })]) {
    const options = await fixture(t, raw)
    const card = successfulCard()
    assert.deepEqual(await loadMusicCards([link], { ...options, resolveCard: async () => card }), [card])
    assert.deepEqual(JSON.parse(await readFile(options.cacheFile, 'utf8')).entries[link], entry(card))
  }
})

test('old cached failures do not suppress retries, and duplicate links resolve once', async (t) => {
  const options = await fixture(t, { ts: now, cards: { [link]: fallbackMusicCard(link) } })
  let calls = 0
  const card = successfulCard()
  assert.deepEqual(await loadMusicCards([link, link], {
    ...options, resolveCard: async () => { calls++; return card },
  }), [card, card])
  assert.equal(calls, 1)
})

test('cache write errors do not discard successfully fetched metadata', async (t) => {
  const options = await fixture(t, 'file blocks a child directory')
  const card = successfulCard()
  assert.deepEqual(await loadMusicCards([link], {
    ...options, cacheFile: join(options.cacheFile, 'child.json'), resolveCard: async () => card,
  }), [card])
  assert.match(options.warnings[0], /Could not write/)
})

const track = { kind: 'song', trackName: 'Song', artistName: 'Artist', previewUrl: 'https://example.test/song.m4a',
  artworkUrl100: 'https://example.test/100x100bb.jpg', releaseDate: '2020-01-01T00:00:00Z', trackCount: 10 }
const response = (results) => Response.json({ results })

test('album lookup failure still returns a playable track', async () => {
  const albumLink = 'https://music.apple.com/cn/album/example/456?i=123'
  for (const albumResult of [async () => new Response('', { status: 503 }), failedLookup, async () => new Response('{bad json')]) {
    const card = await resolveAppleMusicCard(albumLink, async (url) => url.includes('entity=album') ? albumResult() : response([track]))
    assert.equal(card.title, 'Song')
    assert.equal(card.previewUrl, track.previewUrl)
    assert.equal(card.artwork, 'https://example.test/420x420bb.jpg')
  }
})

test('required lookup failures reject instead of returning cacheable empty metadata', async () => {
  for (const fetcher of [failedLookup, async () => new Response('', { status: 503 }), async () => response([]), async () => response([{ wrapperType: 'collection' }])]) {
    await assert.rejects(resolveAppleMusicCard(link, fetcher))
  }
})

test('unstreamable tracks do not offer a preview', async () => {
  const card = await resolveAppleMusicCard(link, async () => response([{ ...track, isStreamable: false }]))
  assert.equal(card.previewUrl, null)
})

test('lookup requests time out and abort', async () => {
  let aborted = false
  await assert.rejects(resolveAppleMusicCard(link, async (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => { aborted = true; reject(new Error('aborted')) }, { once: true })
  }), 10))
  assert.equal(aborted, true)
})

test('invalid or non-Apple links never trigger a lookup', async () => {
  let calls = 0
  for (const url of ['invalid', 'https://example.test/123', 'http://music.apple.com/song/123', 'https://music.apple.com/cn/song/no-id']) {
    await assert.rejects(resolveAppleMusicCard(url, async () => { calls++; return response([track]) }))
  }
  assert.equal(calls, 0)
})
