import rss from '@astrojs/rss'
import { getPublishedPosts } from '../lib/posts'
import sanitizeHtml from 'sanitize-html'
import MarkdownIt from 'markdown-it'
import type { APIContext } from 'astro'
import { withBase } from '../utils/paths'

const parser = new MarkdownIt()

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts()

  return rss({
    title: '宋徽宗',
    description: '赵佶的宋代手札 · 书画、茶事与园林',
    site: new URL(withBase('/'), context.site),
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: new Date(post.data.date + 'T00:00:00Z'),
      description: post.data.description,
      link: new URL(withBase(`/posts/${post.id}/`), context.site).toString(),
      content: sanitizeHtml(parser.render(post.body ?? ''), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      }),
    })),
    customData: '<language>zh-cn</language>',
  })
}
