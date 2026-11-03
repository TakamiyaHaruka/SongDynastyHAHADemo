import type { APIRoute } from 'astro'
import { getPublishedPosts } from '../lib/posts'
import { createSearchIndex } from '../lib/search-index'
import { withBase } from '../utils/paths'

export const GET: APIRoute = async () => new Response(JSON.stringify(createSearchIndex(await getPublishedPosts(), withBase('/'))), {
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
})
