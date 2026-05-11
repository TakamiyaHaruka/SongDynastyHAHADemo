import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { getCategoryItems } from '../../../utils/categories'
import { generateOgImage } from '../../../utils/og'

export async function getStaticPaths() {
  const posts = await getCollection('blog')
  const categories = getCategoryItems(posts)
  return categories.map((cat) => ({
    params: { category: cat.name },
    props: { category: cat.name },
  }))
}

export const GET: APIRoute = async ({ props }) => {
  const buffer = await generateOgImage(props.category, '分类')
  return new Response(new Uint8Array(buffer), {
    headers: { 'Content-Type': 'image/png' },
  })
}
