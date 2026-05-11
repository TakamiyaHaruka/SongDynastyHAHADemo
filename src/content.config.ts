import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

function dateToString(val: unknown): string | undefined {
  if (val instanceof Date) {
    return val.toISOString().split('T')[0]
  }
  if (typeof val === 'string') return val
  return undefined
}

const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.preprocess(dateToString, z.string()).optional(),
    pubDate: z.preprocess(dateToString, z.string()).optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    slug: z.string().optional(),
  }),
})

export const collections = { blog }
