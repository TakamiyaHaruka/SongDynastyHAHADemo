import type { APIContext } from 'astro'
import { withBase } from '../utils/paths'

export function GET({ site }: APIContext) {
  const sitemapUrl = new URL(withBase('/sitemap-index.xml'), site)

  return new Response(`User-agent: *\nAllow: /\nSitemap: ${sitemapUrl}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
