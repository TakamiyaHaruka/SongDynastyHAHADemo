import type { APIRoute } from 'astro'
import { generateOgImage } from '../../../utils/og'

const pages: Record<string, { title: string; subtitle?: string; desc?: string }> = {
  index: { title: '宋徽宗 赵佶', subtitle: '大宋天子的艺术与治国之道', desc: '翰墨丹青 · 治国安邦' },
  posts: { title: '奏折批阅', subtitle: '宋徽宗御览' },
  about: { title: '关于朕', subtitle: '宋徽宗 赵佶' },
  friends: { title: '列祖列宗', subtitle: '大宋皇室宗亲' },
  '404': { title: '404', subtitle: '此路不通' },
}

export function getStaticPaths() {
  return Object.keys(pages).map((page) => ({
    params: { page },
    props: { page },
  }))
}

export const GET: APIRoute = async ({ props }) => {
  const config = pages[props.page] ?? { title: '宋徽宗' }
  const buffer = await generateOgImage(config.title, config.subtitle, config.desc)
  return new Response(new Uint8Array(buffer), {
    headers: { 'Content-Type': 'image/png' },
  })
}
