import assert from 'node:assert/strict'
import test from 'node:test'
import { postSchema } from '../src/lib/post-schema.ts'
import { isPublicationDate, publishedPosts } from '../src/utils/post-publication.ts'
import { getAdjacentPosts } from '../src/utils/post-navigation.js'

test('publication dates validate calendar days including leap years and historical years', () => {
  for (const date of ['1043-06-01', '2024-02-29', '2000-02-29', '0001-01-01']) assert.equal(isPublicationDate(date), true)
  for (const date of ['2026-02-29', '1900-02-29', '2026-04-31', '2026-13-01', '2026-1-01', '0000-01-01', '2026-10-22T00:00:00Z', 'invalid']) assert.equal(isPublicationDate(date), false)
})

test('published posts require a site publication date and a nonempty title', () => {
  for (const fields of [{ date: '2026-02-30' }, { date: new Date('invalid') }, { date: new Date('2026-10-22T12:00:00Z') }, { title: ' ' }, { updatedAt: '2026-05-11' }]) {
    assert.equal(postSchema.safeParse({ title: '手札', publishedAt: '2026-05-12', ...fields }).success, false)
  }
  assert.match(postSchema.safeParse({ title: '手札' }).error.message, /draft: true/)
  assert.equal(postSchema.safeParse({ title: '手札', date: '1043-06-01' }).success, false)
  const modern = postSchema.parse({ title: '手札', publishedAt: '2026-05-12' })
  assert.equal(modern.date, '2026-05-12')
})

test('YAML Date and legacy pubDate normalize consistently; conflicting dates fail', () => {
  assert.equal(postSchema.parse({ title: '手札', publishedAt: '2026-05-12', date: new Date('1043-06-01T00:00:00Z') }).date, '1043-06-01')
  assert.equal(postSchema.parse({ title: '手札', publishedAt: '2026-05-12', pubDate: '2026-10-22' }).date, '2026-10-22')
  assert.equal(postSchema.safeParse({ title: '手札', date: '2026-10-21', pubDate: '2026-10-22' }).success, false)
  assert.equal(postSchema.parse({ title: '手札', publishedAt: '2026-05-12', date: '2026-10-22' }).draft, false)
})

test('undated drafts are valid and never enter the public sequence', () => {
  const draft = { id: 'draft', data: postSchema.parse({ title: '未完稿', draft: true }) }
  const oldest = { id: 'oldest', data: postSchema.parse({ title: '旧', date: '1043-06-01', publishedAt: '2026-05-12' }) }
  const latest = { id: 'latest', data: postSchema.parse({ title: '新', date: '1117-03-01', publishedAt: '2026-05-12' }) }
  const input = [oldest, draft, latest]
  const published = publishedPosts(input)
  assert.deepEqual(published.map(post => post.id), ['latest', 'oldest'])
  assert.deepEqual(input.map(post => post.id), ['oldest', 'draft', 'latest'])
  assert.deepEqual(getAdjacentPosts(published, 'latest'), { previous: undefined, next: oldest })
  assert.equal(postSchema.safeParse({ title: '草稿', draft: true, date: 'not-a-date' }).success, false)
})

test('missing public dates fail loudly; equal-date order is deterministic', () => {
  assert.throws(() => publishedPosts([{ id: 'missing', data: {} }]), /missing.*YYYY-MM-DD/)
  assert.throws(() => publishedPosts([{ id: 'historic', data: { date: '1043-06-01' } }]), /publishedAt/)
  const posts = ['b', 'a'].map(id => ({ id, data: { date: '2026-10-22', publishedAt: '2026-05-12' } }))
  assert.deepEqual(publishedPosts(posts).map(post => post.id), ['a', 'b'])
})
