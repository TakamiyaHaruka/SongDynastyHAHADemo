import MarkdownIt from 'markdown-it'
import sanitizeHtml from 'sanitize-html'
import type { CollectionEntry } from 'astro:content'
import type { SearchPost } from '../utils/search'

const markdown = new MarkdownIt({ html: true })
export function createSearchIndex(posts: CollectionEntry<'blog'>[], base: string): SearchPost[] {
  return posts.map(post => ({
    id: post.id, title: post.data.title, description: post.data.description ?? '', category: post.data.category ?? 'Uncategorized',
    tags: [...new Set(post.data.tags ?? [])], date: post.data.date ?? '',
    body: markdown.utils.unescapeAll(sanitizeHtml(markdown.render(post.body ?? ''), { allowedTags: [], allowedAttributes: {} })).replace(/\s+/gu, ' ').trim(),
    href: `${base}posts/${post.id}/`,
  }))
}
