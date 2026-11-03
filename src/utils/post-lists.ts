import type { CollectionEntry } from 'astro:content'

export const PAGE_SIZE = 10
export interface ListPage { currentPage: number; totalPages: number; totalPosts: number; basePath: string }

export function listPage(posts: CollectionEntry<'blog'>[], basePath: string, currentPage = 1) {
  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE))
  if (!Number.isInteger(currentPage) || currentPage < 1 || currentPage > totalPages) throw new Error('无效的文章页码')
  return { posts: posts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), pagination: { currentPage, totalPages, totalPosts: posts.length, basePath } }
}

export function getTagItems(posts: CollectionEntry<'blog'>[]) {
  const counts = new Map<string, number>()
  for (const post of posts) for (const tag of new Set(post.data.tags ?? [])) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  return Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'))
}

export function pagePath(basePath: string, page: number) {
  return page === 1 ? `${basePath}/` : `${basePath}/page/${page}/`
}
