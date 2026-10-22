/**
 * @template {{ id: string }} T
 * @param {T[]} posts Posts in the same order as the article list.
 * @param {string} id
 */
export function getAdjacentPosts(posts, id) {
  const index = posts.findIndex((post) => post.id === id)
  return {
    previous: index > 0 ? posts[index - 1] : undefined,
    next: index >= 0 ? posts[index + 1] : undefined,
  }
}
