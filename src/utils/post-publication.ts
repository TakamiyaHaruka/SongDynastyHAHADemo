export function isPublicationDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

interface Post { id: string; data: { date?: string; draft?: boolean } }
type Published<T extends Post> = T & { data: T['data'] & { date: string } }

export function publishedPosts<T extends Post>(posts: T[]): Published<T>[] {
  return posts.filter(post => !post.data.draft).map(post => {
    if (!post.data.date || !isPublicationDate(post.data.date)) {
      throw new Error(`文章 ${post.id} 缺少有效的发布日期，请填写 YYYY-MM-DD 或标记 draft: true。`)
    }
    return post as Published<T>
  }).sort((a, b) => b.data.date.localeCompare(a.data.date) || a.id.localeCompare(b.id))
}
