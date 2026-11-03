export interface SearchPost { id: string; title: string; description: string; category: string; tags: string[]; date: string; body: string; href: string }
export interface SearchState { q: string; category: string; tag: string; page: number }
export const normalizeSearch = (text: string) => text.normalize('NFKC').toLocaleLowerCase('zh-CN').replace(/\s+/gu, ' ').trim()
export const getSearchTerms = (query: string) => [...new Set(normalizeSearch(query.slice(0, 200)).split(' ').filter(Boolean))]

interface MatchRange { start: number; end: number }
const graphemes = new Intl.Segmenter('zh-CN', { granularity: 'grapheme' })

export function searchMatchRanges(text: string, query: string): MatchRange[] {
  const terms = getSearchTerms(query)
  if (!terms.length) return []
  let normalized = ''
  const offsets: MatchRange[] = []
  // Keep original grapheme boundaries when NFKC or lowercasing changes length,
  // so a match on ffi still highlights the original ﬃ rather than nearby text.
  for (const { segment, index } of graphemes.segment(text)) {
    const value = segment.normalize('NFKC').toLocaleLowerCase('zh-CN').replace(/\s/gu, ' ')
    normalized += value
    for (let unit = 0; unit < value.length; unit++) offsets.push({ start: index, end: index + segment.length })
  }
  const ranges: MatchRange[] = []
  for (const term of terms) {
    let start = normalized.indexOf(term)
    while (start !== -1) {
      ranges.push({ start: offsets[start].start, end: offsets[start + term.length - 1].end })
      start = normalized.indexOf(term, start + 1)
    }
  }
  const merged: MatchRange[] = []
  for (const range of ranges.sort((a, b) => a.start - b.start || b.end - a.end)) {
    const previous = merged.at(-1)
    if (previous && range.start <= previous.end) previous.end = Math.max(previous.end, range.end)
    else merged.push({ ...range })
  }
  return merged
}

export function highlightSearchText(text: string, query: string) {
  const parts: { text: string; matched: boolean }[] = []
  let cursor = 0
  for (const range of searchMatchRanges(text, query)) {
    if (range.start > cursor) parts.push({ text: text.slice(cursor, range.start), matched: false })
    parts.push({ text: text.slice(range.start, range.end), matched: true })
    cursor = range.end
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), matched: false })
  return parts
}

export function searchExcerpt(post: Pick<SearchPost, 'body' | 'description'>, query: string, length = 160) {
  const bodyMatches = searchMatchRanges(post.body, query)
  const source = bodyMatches.length ? post.body : post.description || post.body
  const firstMatch = bodyMatches.length ? bodyMatches[0] : searchMatchRanges(source, query)[0]
  const segments = Array.from(graphemes.segment(source))
  if (!segments.length) return ''
  const matchStart = firstMatch ? segments.findIndex(segment => segment.index === firstMatch.start) : 0
  const matchEnd = firstMatch ? segments.findIndex(segment => segment.index >= firstMatch.end) : 0
  const start = Math.max(0, matchStart - 32)
  const end = Math.min(segments.length, Math.max(start + length, matchEnd === -1 ? segments.length : matchEnd))
  return `${start ? '…' : ''}${source.slice(segments[start].index, segments[end]?.index ?? source.length)}${end < segments.length ? '…' : ''}`
}

export function searchPosts(posts: SearchPost[], state: SearchState, pageSize = 10) {
  const terms = getSearchTerms(state.q)
  const matched = posts.flatMap((post, order) => {
    if (state.category && post.category !== state.category || state.tag && !post.tags.includes(state.tag)) return []
    const fields = [post.title, post.tags.join(' '), post.category, post.description, post.body].map(normalizeSearch)
    if (!terms.every(term => fields.some(field => field.includes(term)))) return []
    const weights = [12, 8, 6, 4, 1]
    const score = terms.reduce((score, term) => score + fields.reduce((sum, field, index) => sum + (field.includes(term) ? weights[index] : 0), 0), 0)
    return [{ post, score, order }]
  }).sort((a, b) => b.score - a.score || a.order - b.order)
  const total = matched.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(totalPages, Math.max(1, Number.isSafeInteger(state.page) ? state.page : 1))
  return { posts: matched.slice((page - 1) * pageSize, page * pageSize).map(item => item.post), total, totalPages, page }
}
