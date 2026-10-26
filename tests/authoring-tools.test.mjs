import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, mkdir, readFile, writeFile, readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createDraft } from '../scripts/new-post.mjs'
import { checkLinks } from '../scripts/check-links.mjs'
import { checkBudgets } from '../scripts/check-performance.mjs'
import { serializeJsonLd } from '../src/utils/structured-data.ts'

test('new-post creates a quoted, unpublished draft using the Hong Kong calendar date', async t => {
  const root = await mkdtemp(join(tmpdir(), 'haruka-authoring-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const title = '春日："一页手札"'
  const path = await createDraft('spring-note', { contentRoot: root, title, date: '1043-06-01', now: new Date('2026-10-25T18:00:00Z') })
  const text = await readFile(path, 'utf8')
  assert.equal(JSON.parse(text.match(/^title: (.*)$/m)[1]), title)
  assert.match(text, /publishedAt: "2026-10-26"/)
  assert.match(text, /date: "1043-06-01"/)
  assert.match(text, /draft: true/)
  await assert.rejects(createDraft('spring-note', { contentRoot: root }), /已存在/)
  assert.equal(await readFile(path, 'utf8'), text)
  await writeFile(join(root, 'flat.md'), 'existing article')
  await assert.rejects(createDraft('flat', { contentRoot: root }), /已存在/)
})

test('new-post rejects traversal, reserved names and invalid dates before writing', async t => {
  const root = await mkdtemp(join(tmpdir(), 'haruka-slugs-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  for (const slug of ['../outside', 'nested/path', 'nested\\path', 'CON', 'nul', 'com1', '.', 'New Article']) {
    await assert.rejects(createDraft(slug, { contentRoot: root }), /文章标识/)
  }
  await assert.rejects(createDraft('bad-date', { contentRoot: root, date: '2026-02-30' }), /日期/)
  assert.deepEqual(await readdir(root), [])
})

test('built link checks resolve deployment paths, Unicode anchors and the 404 document', async t => {
  const root = await mkdtemp(join(tmpdir(), 'haruka-links-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(join(root, 'posts'))
  await writeFile(join(root, 'index.html'), '<link rel="canonical" href="https://example.test/demo/"><a href="/demo/posts/#%E7%AB%A0%E8%8A%82">正文</a><a href="https://elsewhere.test/">外站</a>')
  await writeFile(join(root, 'posts/index.html'), '<link rel="canonical" href="https://example.test/demo/posts/"><h1 id="章节">正文</h1><a href="/demo/">返回</a>')
  await writeFile(join(root, '404.html'), '<link rel="canonical" href="https://example.test/demo/404.html"><main id="main-content"></main><a href="#main-content">跳转</a>')
  assert.deepEqual((await checkLinks(root)).errors, [])
  await writeFile(join(root, 'posts/index.html'), '<link rel="canonical" href="https://example.test/demo/posts/"><h1 id="章节">正文</h1><a href="/demo/missing/">失效</a><a href="#absent">缺失锚点</a><a href="/outside/">错误根路径</a>')
  const result = await checkLinks(root)
  assert.equal(result.errors.length, 3)
  assert.ok(result.errors.some(error => error.includes('锚点')))
  assert.ok(result.errors.some(error => error.includes('部署路径')))
})

test('budgets fail closed for missing metrics and reject resource regressions', () => {
  assert.deepEqual(checkBudgets({ fontBytes: 500 }, { fontBytes: 500 }), [])
  assert.equal(checkBudgets({ fontBytes: 501 }, { fontBytes: 500 }).length, 1)
  assert.equal(checkBudgets({}, { fontBytes: 500 }).length, 1)
})

test('structured data keeps text intact without allowing a closing script tag', () => {
  const value = { headline: '</script><script>alert(1)</script>' }
  const encoded = serializeJsonLd(value)
  assert.equal(encoded.includes('<'), false)
  assert.deepEqual(JSON.parse(encoded), value)
})
