import assert from 'node:assert/strict'
import test from 'node:test'
import { greetingForHour } from '../src/utils/greeting.js'
import { getAdjacentPosts } from '../src/utils/post-navigation.js'

test('greetings follow the visitor hour at each time boundary', () => {
  for (const [hour, expected] of [[0, '夜深了'], [5, '夜深了'], [6, '早上好'], [11, '早上好'], [12, '下午好'], [17, '下午好'], [18, '晚上好'], [23, '晚上好']]) {
    assert.equal(greetingForHour(hour), expected)
  }
})

const posts = [{ id: 'latest' }, { id: 'middle' }, { id: 'oldest' }]
test('article neighbors follow list order', () => {
  assert.deepEqual(getAdjacentPosts(posts, 'middle'), { previous: posts[0], next: posts[2] })
})
test('article navigation does not wrap at the first and last entries', () => {
  assert.deepEqual(getAdjacentPosts(posts, 'latest'), { previous: undefined, next: posts[1] })
  assert.deepEqual(getAdjacentPosts(posts, 'oldest'), { previous: posts[1], next: undefined })
})
test('single, empty and missing article lists have no invalid neighbors', () => {
  const empty = { previous: undefined, next: undefined }
  assert.deepEqual(getAdjacentPosts([posts[0]], 'latest'), empty)
  assert.deepEqual(getAdjacentPosts([], 'missing'), empty)
  assert.deepEqual(getAdjacentPosts(posts, 'missing'), empty)
})
