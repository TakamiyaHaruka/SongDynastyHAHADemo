import assert from 'node:assert/strict'
import test from 'node:test'
import { highlightSearchText, searchExcerpt, searchMatchRanges, searchPosts } from '../src/utils/search.ts'
import { getTagItems, listPage, pagePath } from '../src/utils/post-lists.ts'
import { createSearchIndex } from '../src/lib/search-index.ts'

const state = { q: '', category: '', tag: '', page: 1 }
const post = (id, values = {}) => ({ id, title: '园林', description: '', category: '御笔', tags: ['山水'], date: '1117-03-01', body: '泉石流水', href: `/posts/${id}/`, ...values })

test('Chinese full-text search normalizes width/case and requires all words across fields', () => {
  const posts = [post('body'), post('title', { title: '泉石', body: '园林流水' }), post('latin', { title: 'ABC 123', body: '' })]
  assert.deepEqual(searchPosts(posts, { ...state, q: '泉石 流水' }).posts.map(post => post.id), ['title', 'body'])
  assert.deepEqual(searchPosts(posts, { ...state, q: 'ａｂｃ　１２３' }).posts.map(post => post.id), ['latin'])
  assert.equal(searchPosts(posts, { ...state, q: '不存在' }).total, 0)
  assert.equal(searchPosts(posts, { ...state, q: '<script>' }).total, 0)
  assert.equal(searchPosts(posts, { ...state, category: '奏折', tag: '山水' }).total, 0)
  assert.equal(searchPosts(posts, { ...state, tag: '山水' }).total, 3)
})

test('search pagination preserves order and clamps malformed and out-of-range pages', () => {
  const posts = Array.from({ length: 23 }, (_, index) => post(String(index)))
  assert.equal(searchPosts(posts, state).posts.length, 10)
  assert.deepEqual(searchPosts(posts, { ...state, page: 3 }).posts.map(post => post.id), ['20', '21', '22'])
  assert.equal(searchPosts(posts, { ...state, page: 999 }).page, 3)
  for (const page of [-1, NaN, Infinity, 1.5]) assert.equal(searchPosts(posts, { ...state, page }).page, 1)
})

test('static lists paginate without omissions and count each article tag once', () => {
  const posts = Array.from({ length: 23 }, (_, index) => ({ id: String(index), data: { tags: ['山水', '山水', ...(index === 0 ? ['茶事'] : [])] } }))
  assert.deepEqual([1, 2, 3].flatMap(page => listPage(posts, '/posts', page).posts), posts)
  assert.equal(listPage([], '/posts').pagination.totalPages, 1)
  assert.throws(() => listPage(posts, '/posts', 4))
  assert.equal(pagePath('/posts', 1), '/posts/')
  assert.equal(pagePath('/posts/tag/山水', 2), '/posts/tag/山水/page/2/')
  assert.deepEqual(getTagItems(posts), [{ name: '山水', count: 23 }, { name: '茶事', count: 1 }])
})

test('the index contains readable text instead of Markdown or executable HTML', () => {
  const [entry] = createSearchIndex([{ id: 'one', data: { title: '标题', tags: ['茶事', '茶事'], date: '2026-11-03' }, body: '## 章节\n\n**茶 &amp; 事** <script>danger()</script>\n\n[正文](https://example.test)' }], '/SongDynastyHAHADemo/')
  assert.equal(entry.href, '/SongDynastyHAHADemo/posts/one/')
  assert.deepEqual(entry.tags, ['茶事'])
  assert.match(entry.body, /茶 & 事/)
  assert.doesNotMatch(entry.body, /<|\*\*|https:|danger/)
})

test('highlighting preserves original Unicode text and merges overlapping literal matches', () => {
  for (const [text, query, expected] of [
    ['甲ＡＢＣ乙', 'abc', ['ＡＢＣ']], ['aﬃb', 'ffi', ['ﬃ']],
    ['Cafe\u0301 𠀀山水', 'café 𠀀', ['Cafe\u0301', '𠀀']],
    ['山水山水', '山水 水山', ['山水山水']], ['甲[a+b]乙', '[a+b]', ['[a+b]']],
    ['<img src=x onerror=alert(1)>', '<img', ['<img']],
  ]) {
    const parts = highlightSearchText(text, query)
    assert.equal(parts.map(part => part.text).join(''), text)
    assert.deepEqual(parts.filter(part => part.matched).map(part => part.text), expected)
  }
  assert.deepEqual(searchMatchRanges('山水', '  '), [])
  assert.deepEqual(highlightSearchText('', '山'), [])
})

test('excerpts show a body hit beyond the introduction and preserve grapheme boundaries', () => {
  const body = '远山烟水。'.repeat(100) + '太湖石边，山水清音。' + '🌸春山如笑。'.repeat(100)
  const excerpt = searchExcerpt({ body, description: '固定简介里没有关键词。' }, '太湖')
  assert.ok(excerpt.startsWith('…'))
  assert.ok(excerpt.endsWith('…'))
  assert.ok(excerpt.includes('太湖石边'))
  assert.ok(Array.from(excerpt).length <= 162)
  assert.equal(searchExcerpt({ body, description: '园林简介。' }, '园林'), '园林简介。')
  assert.equal(searchExcerpt({ body: '', description: '' }, '太湖'), '')
  assert.equal(searchExcerpt({ body: '正文', description: '默认简介' }, ''), '默认简介')
  assert.ok(searchExcerpt({ body: '序' + '山'.repeat(200) + '尾', description: '' }, '山'.repeat(200)).includes('山'.repeat(200)))
})
