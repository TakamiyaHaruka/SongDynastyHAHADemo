import { z } from 'astro/zod'
import { isPublicationDate } from '../utils/post-publication.ts'

const publicationDate = z.preprocess(value => {
  // YAML also parses an unquoted calendar date as a UTC Date.
  if (value instanceof Date && Number.isFinite(value.getTime()) && value.toISOString().endsWith('T00:00:00.000Z')) {
    return value.toISOString().slice(0, 10)
  }
  return value
}, z.string().refine(isPublicationDate, '日期须为有效的 YYYY-MM-DD，例如 2026-10-22。'))

export const postSchema = z.object({
  title: z.string().trim().min(1, '请填写文章标题。'),
  description: z.string().optional(),
  date: publicationDate.optional(),
  pubDate: publicationDate.optional(),
  publishedAt: publicationDate.optional(),
  updatedAt: publicationDate.optional(),
  draft: z.boolean().default(false),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  slug: z.string().optional(),
}).superRefine((post, context) => {
  if (!post.draft && !post.publishedAt) {
    context.addIssue({ code: 'custom', path: ['publishedAt'], message: '已发布文章必须填写本站发布日期 publishedAt（YYYY-MM-DD）；未完成的文章请设为 draft: true。' })
  }
  if (post.date && post.pubDate && post.date !== post.pubDate) {
    context.addIssue({ code: 'custom', path: ['pubDate'], message: 'date 与旧版 pubDate 不一致，请统一为同一天。' })
  }
  if (post.publishedAt && post.updatedAt && post.updatedAt < post.publishedAt) {
    context.addIssue({ code: 'custom', path: ['updatedAt'], message: '更新日期不能早于本站发布日期。' })
  }
}).transform(post => ({ ...post, date: post.date ?? post.pubDate ?? post.publishedAt }))
