import assert from 'node:assert/strict'
import test from 'node:test'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { dirname, join, resolve, sep } from 'node:path'
import { createDraft } from '../scripts/new-post.mjs'

const require = createRequire(import.meta.url)
const astroBin = resolve(dirname(require.resolve('astro/package.json')), require('astro/package.json').bin.astro)

test('production output excludes drafts from routes, categories, feed, share images and sitemap', { timeout: 60000 }, async t => {
  const project = fileURLToPath(new URL('../', import.meta.url))
  const cache = resolve(project, '.cache')
  await mkdir(cache, { recursive: true })
  const fixture = await mkdtemp(join(cache, 'publication-test-'))
  t.after(async () => {
    if (!resolve(fixture).startsWith(cache + sep)) throw new Error('Unsafe fixture cleanup path')
    await rm(fixture, { recursive: true, force: true })
  })
  for (const source of ['src', 'public', 'integrations', 'package.json', 'astro.config.mjs', 'tsconfig.json']) {
    await cp(join(project, source), join(fixture, source), { recursive: true })
  }
  // This isolated build exercises publication only, without external music lookups.
  await writeFile(join(fixture, 'src/data/home-music.ts'), 'export const homeMusicAppleLinks: string[] = []\n')
  for (const [slug, frontmatter] of [
    ['qa-undated-draft', 'title: 草稿不可公开\ndraft: true\ncategory: 草稿专属'],
    ['qa-dated-draft', 'title: 已填日期的草稿也不可公开\ndate: "2026-10-22"\ndraft: true\ncategory: 草稿专属'],
    ['qa-legacy', 'title: 旧版日期兼容验证\npubDate: "2026-10-20"\npublishedAt: "2026-10-23"\nupdatedAt: "2026-10-25"\ncategory: 御笔'],
  ]) {
    const directory = join(fixture, 'src/content/blog', slug)
    await mkdir(directory, { recursive: true })
    await writeFile(join(directory, 'index.md'), `---\n${frontmatter}\n---\n\n## 正文\n\n发布验证。\n`)
  }
  await createDraft('qa-command-draft', { contentRoot: join(fixture, 'src/content/blog'), title: '命令生成的草稿', now: new Date('2026-10-26T00:00:00Z') })
  try {
    await promisify(execFile)(process.execPath, [astroBin, 'build'], {
      cwd: fixture, timeout: 50000, maxBuffer: 2 * 1024 * 1024,
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
    })
  } catch (error) { throw new Error(`Publication fixture build failed:\n${error.stdout}\n${error.stderr}`, { cause: error }) }
  const dist = join(fixture, 'dist')
  for (const slug of ['qa-undated-draft', 'qa-dated-draft', 'qa-command-draft']) {
    assert.equal(existsSync(join(dist, 'posts', slug, 'index.html')), false)
    assert.equal(existsSync(join(dist, 'og', `${slug}.png`)), false)
  }
  assert.equal(existsSync(join(dist, 'posts/category/草稿专属/index.html')), false)
  assert.equal(existsSync(join(dist, 'og/category/草稿专属.png')), false)
  for (const file of ['index.html', 'posts/index.html', 'posts/category/御笔/index.html', 'rss.xml', 'sitemap-0.xml', 'posts/qa-legacy/index.html']) {
    const output = await readFile(join(dist, file), 'utf8')
    assert.doesNotMatch(output, /qa-undated-draft|qa-dated-draft|草稿不可公开|草稿专属/)
    if (!file.endsWith('qa-legacy/index.html')) assert.match(output, /qa-legacy/)
  }
  const article = await readFile(join(dist, 'posts/qa-legacy/index.html'), 'utf8')
  assert.match(article, /datetime="2026-10-20"/)
  assert.match(article, /rel="next"/)
  assert.doesNotMatch(article, /rel="prev"/)
  assert.match(article, /property="og:type" content="article"/)
  assert.match(article, /"datePublished":"2026-10-23"/)
  assert.match(article, /"dateModified":"2026-10-25"/)
  const feed = await readFile(join(dist, 'rss.xml'), 'utf8')
  assert.match(feed, /23 Oct 2026/)
  assert.doesNotMatch(feed, /1043|1058|1072|1117/)
})
