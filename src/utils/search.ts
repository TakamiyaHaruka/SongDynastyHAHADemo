export interface SearchPost { id: string; title: string; description: string; category: string; tags: string[]; date: string; body: string; href: string }
export interface SearchState { q: string; category: string; tag: string; page: number }
export const normalizeSearch = (text: string) => text.normalize('NFKC').toLocaleLowerCase('zh-CN').replace(/\s+/gu, ' ').trim()

export function searchPosts(posts: SearchPost[], state: SearchState, pageSize = 10) {
  const terms = normalizeSearch(state.q.slice(0, 200)).split(' ').filter(Boolean)
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
