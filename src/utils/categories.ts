import type { CollectionEntry } from 'astro:content'

export interface CategoryItem {
  name: string
  count: number
}

export function getCategoryItems(posts: CollectionEntry<'blog'>[]): CategoryItem[] {
  const map = new Map<string, number>()
  for (const post of posts) {
    const cat = post.data.category ?? 'Uncategorized'
    map.set(cat, (map.get(cat) ?? 0) + 1)
  }
  return Array.from(map, ([name, count]) => ({ name, count }))
}
