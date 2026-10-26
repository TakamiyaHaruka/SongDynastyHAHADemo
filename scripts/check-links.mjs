import { readdir, readFile, stat } from 'node:fs/promises'
import { resolve, join, relative, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import MarkdownIt from 'markdown-it'

const decode = new MarkdownIt().utils.unescapeAll
const attribute = (tag, name) => {
  const match = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(tag)
  return match ? decode(match[1] ?? match[2] ?? match[3]) : undefined
}
export async function filesIn(root) {
  const entries = await readdir(root, { withFileTypes: true })
  const lists = await Promise.all(entries.map(entry => entry.isDirectory() ? filesIn(join(root, entry.name)) : [join(root, entry.name)]))
  return lists.flat()
}

export async function checkLinks(root) {
  root = resolve(root)
  const pages = (await filesIn(root)).filter(path => path.endsWith('.html'))
  const cache = new Map()
  const document = async path => {
    if (!cache.has(path)) {
      const html = await readFile(path, 'utf8')
      const tags = [...html.matchAll(/<[a-z][^>]*>/gi)].map(match => match[0])
      cache.set(path, {
        tags,
        ids: new Set(tags.map(tag => attribute(tag, 'id')).filter(Boolean)),
        canonical: tags.find(tag => /^<link\b/i.test(tag) && attribute(tag, 'rel') === 'canonical'),
      })
    }
    return cache.get(path)
  }
  const home = await document(join(root, 'index.html'))
  const site = new URL(attribute(home.canonical ?? '', 'href') ?? 'https://example.test/')
  const errors = []
  let checked = 0
  for (const path of pages) {
    const doc = await document(path)
    const source = new URL(attribute(doc.canonical ?? '', 'href') ?? relative(root, path).split(sep).join('/'), site)
    for (const tag of doc.tags) {
      const ref = attribute(tag, 'href') ?? attribute(tag, 'src')
      if (!ref || /^(?:data|mailto|tel|javascript):/i.test(ref)) continue
      let url
      try { url = new URL(ref, source) } catch { errors.push(`${relative(root, path)}：无效地址 ${ref}`); continue }
      if (url.origin !== site.origin) continue
      checked++
      if (!url.pathname.startsWith(site.pathname)) { errors.push(`${relative(root, path)}：地址超出部署路径 ${ref}`); continue }
      let target
      try { target = resolve(root, decodeURIComponent(url.pathname.slice(site.pathname.length))) }
      catch { errors.push(`${relative(root, path)}：无效 URL 编码 ${ref}`); continue }
      if (target !== root && !target.startsWith(root + sep)) { errors.push(`${relative(root, path)}：地址越界 ${ref}`); continue }
      try {
        if ((await stat(target)).isDirectory()) target = join(target, 'index.html')
        if (!(await stat(target)).isFile()) throw new Error('not a file')
        if (url.hash && target.endsWith('.html') && !(await document(target)).ids.has(decodeURIComponent(url.hash.slice(1)))) {
          errors.push(`${relative(root, path)}：找不到锚点 ${ref}`)
        }
      } catch { errors.push(`${relative(root, path)}：找不到目标 ${ref}`) }
    }
  }
  return { pages: pages.length, checked, errors: [...new Set(errors)] }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  checkLinks(fileURLToPath(new URL('../dist/', import.meta.url))).then(result => {
    console.log(`站内链接检查：${result.pages} 页，${result.checked} 个引用，${result.errors.length} 个问题。`)
    for (const error of result.errors) console.error(error)
    if (result.errors.length) process.exitCode = 1
  }).catch(error => { console.error(error.message); process.exitCode = 1 })
}
