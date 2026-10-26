import { mkdir, readFile, access, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { isPublicationDate } from '../src/utils/post-publication.ts'

const project = fileURLToPath(new URL('../', import.meta.url))
const exists = async path => { try { await access(path); return true } catch (error) { if (error.code === 'ENOENT') return false; throw error } }
const today = now => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Hong_Kong', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)

export async function createDraft(slug, options = {}) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i.test(slug)) {
    throw new Error('文章标识请使用小写字母、数字与连字符，不能使用路径或系统保留名称。')
  }
  const title = options.title?.trim() || slug
  const publishedAt = options.publishedAt || today(options.now ?? new Date())
  const date = options.date || publishedAt
  if (!isPublicationDate(date) || !isPublicationDate(publishedAt)) throw new Error('日期须为有效的 YYYY-MM-DD。')
  const contentRoot = options.contentRoot ?? join(project, 'src/content/blog')
  const directory = join(contentRoot, slug)
  for (const path of [directory, join(contentRoot, `${slug}.md`), join(contentRoot, `${slug}.mdx`)]) {
    if (await exists(path)) throw new Error(`文章 ${slug} 已存在，请换一个标识。`)
  }
  let template = await readFile(options.template ?? join(project, 'templates/post.md'), 'utf8')
  const fields = { title, date, publishedAt, category: options.category ?? '御笔' }
  for (const [name, value] of Object.entries(fields)) template = template.replace(new RegExp(`^${name}:.*$`, 'm'), `${name}: ${JSON.stringify(value)}`)
  template = template.replace(/^draft:.*$/m, 'draft: true')
  await mkdir(directory)
  const target = join(directory, 'index.md')
  await writeFile(target, template, { encoding: 'utf8', flag: 'wx' })
  return target
}

async function main() {
  const args = process.argv.slice(2).filter(arg => arg !== '--')
  if (!args.length || args.includes('--help')) {
    console.log('用法：pnpm post:new <文章标识> [--title 标题] [--date 题材日期] [--published-at 本站日期] [--category 分类]\n新建文章默认 draft: true，日期默认使用香港时区的当天。')
    if (!args.length) process.exitCode = 1
    return
  }
  const slug = args.shift()
  const options = {}
  const names = { '--title': 'title', '--date': 'date', '--published-at': 'publishedAt', '--category': 'category' }
  while (args.length) {
    const flag = args.shift()
    const name = names[flag]
    if (!name || !args.length || args[0].startsWith('--')) throw new Error(`无效参数或缺少参数值：${flag}`)
    options[name] = args.shift()
  }
  console.log(`已创建草稿：${await createDraft(slug, options)}`)
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => { console.error(error.message); process.exitCode = 1 })
}
