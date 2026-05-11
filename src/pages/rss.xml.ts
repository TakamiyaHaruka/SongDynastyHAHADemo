import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'
import { sortPostsByDate } from '../utils/date'
import sanitizeHtml from 'sanitize-html'
import MarkdownIt from 'markdown-it'

const parser = new MarkdownIt()

export async function GET(context: any) {
  const allPosts = await getCollection('blog')
  const posts = sortPostsByDate(allPosts)

  return rss({
    title: '宋徽宗',
    description: '大宋天子赵佶 - 御笔亲批奏折与诗词',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date ? new Date(post.data.date + 'T00:00:00Z') : undefined,
      description: post.data.description,
      link: `/posts/${post.id}/`,
      content: sanitizeHtml(parser.render(post.body ?? ''), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      }),
    })),
    customData: '<language>zh-cn</language>',
  })
}
