import type { CollectionEntry } from 'astro:content'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  const w = WEEKDAYS[d.getUTCDay()]
  return `${y} 年 ${m} 月 ${day} 日 星期${w}`
}

export function toISODatetime(dateStr: string): string {
  return dateStr.replace(' ', 'T')
}

export function sortPostsByDate(posts: CollectionEntry<'blog'>[]): CollectionEntry<'blog'>[] {
  return posts
    .filter((p) => p.data.date)
    .sort((a, b) => b.data.date!.localeCompare(a.data.date!))
}
