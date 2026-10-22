import { getCollection } from 'astro:content'
import { publishedPosts } from '../utils/post-publication'

// All public lists, routes, feeds, and share images use the same publication rule.
export async function getPublishedPosts() {
  return publishedPosts(await getCollection('blog'))
}
