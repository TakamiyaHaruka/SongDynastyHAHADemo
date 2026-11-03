import { highlightSearchText, searchExcerpt, searchPosts, type SearchPost, type SearchState } from '../utils/search'

function appendHighlighted(element: HTMLElement, text: string, query: string) {
  for (const part of highlightSearchText(text, query)) {
    if (part.matched) {
      const mark = document.createElement('mark')
      mark.textContent = part.text
      element.append(mark)
    } else element.append(document.createTextNode(part.text))
  }
}

let cleanup: (() => void) | undefined
function initSearch() {
  cleanup?.()
  cleanup = undefined
  const root = document.querySelector<HTMLElement>('[data-post-search]')
  if (!root) return
  const controller = new AbortController()
  const { signal } = controller
  const pathname = location.pathname
  const form = root.querySelector<HTMLFormElement>('form')!
  const query = form.querySelector<HTMLInputElement>('[name="q"]')!
  const category = form.querySelector<HTMLSelectElement>('[name="category"]')!
  const tag = form.querySelector<HTMLSelectElement>('[name="tag"]')!
  const status = root.querySelector<HTMLElement>('[data-search-status]')!
  const error = root.querySelector<HTMLElement>('[data-search-error]')!
  const results = root.querySelector<HTMLElement>('[data-search-results]')!
  const pagination = root.querySelector<HTMLElement>('[data-search-pagination]')!
  const previous = root.querySelector<HTMLButtonElement>('[data-search-previous]')!
  const next = root.querySelector<HTMLButtonElement>('[data-search-next]')!
  let posts: SearchPost[] | undefined
  let loading = false
  let state: SearchState = { q: '', category: '', tag: '', page: 1 }

  const fromUrl = () => {
    const params = new URLSearchParams(location.search)
    query.value = (params.get('q') ?? '').slice(0, 200)
    category.value = params.get('category') ?? ''
    tag.value = params.get('tag') ?? ''
    state = { q: query.value.trim(), category: category.value, tag: tag.value, page: Number(params.get('page') ?? 1) }
  }
  const saveUrl = (replace = false) => {
    const url = new URL(location.href)
    url.search = ''
    if (state.q) url.searchParams.set('q', state.q)
    if (state.category) url.searchParams.set('category', state.category)
    if (state.tag) url.searchParams.set('tag', state.tag)
    if (state.page > 1) url.searchParams.set('page', String(state.page))
    if (url.href !== location.href) history[replace ? 'replaceState' : 'pushState'](history.state, '', url)
  }
  const render = (focus = false) => {
    if (!posts) return
    const matched = searchPosts(posts, state)
    state.page = matched.page
    const fragment = document.createDocumentFragment()
    for (const post of matched.posts) {
      const link = document.createElement('a')
      link.href = post.href
      link.className = 'search-result'
      const meta = document.createElement('div')
      meta.className = 'search-meta'
      const label = document.createElement('span')
      label.className = 'tag'
      appendHighlighted(label, post.category, state.q)
      const date = document.createElement('time')
      date.dateTime = post.date
      date.textContent = post.date
      meta.append(label, date)
      const title = document.createElement('h2')
      appendHighlighted(title, post.title, state.q)
      const description = document.createElement('p')
      description.className = 'search-excerpt'
      appendHighlighted(description, searchExcerpt(post, state.q), state.q)
      link.append(meta, title, description)
      if (post.tags.length) {
        const tags = document.createElement('p')
        tags.className = 'search-tags'
        for (const tag of post.tags) {
          const name = document.createElement('span')
          name.append(document.createTextNode('#'))
          appendHighlighted(name, tag, state.q)
          tags.append(name)
        }
        link.append(tags)
      }
      fragment.append(link)
    }
    results.replaceChildren(fragment)
    results.setAttribute('aria-busy', 'false')
    status.textContent = matched.total ? `找到 ${matched.total} 篇手札，当前第 ${matched.page} / ${matched.totalPages} 页。` : '未找到匹配的手札，请调整关键词或筛选条件。'
    pagination.hidden = matched.totalPages <= 1
    previous.disabled = matched.page === 1
    next.disabled = matched.page === matched.totalPages
    root.querySelector<HTMLElement>('[data-search-page]')!.textContent = `第 ${matched.page} / ${matched.totalPages} 页`
    if (focus) { status.tabIndex = -1; status.focus({ preventScroll: true }); status.scrollIntoView({ block: 'start' }) }
  }
  const load = async () => {
    if (loading) return
    loading = true
    error.hidden = true
    status.textContent = '正在载入手札…'
    results.setAttribute('aria-busy', 'true')
    try {
      const response = await fetch(root.dataset.indexUrl!, { signal })
      if (!response.ok) throw new Error('Index unavailable')
      const data = await response.json()
      if (signal.aborted) return
      if (!Array.isArray(data)) throw new Error('Invalid index')
      posts = data
      render()
      saveUrl(true)
    } catch {
      if (signal.aborted) return
      status.textContent = ''
      error.hidden = false
      results.setAttribute('aria-busy', 'false')
    } finally {
      loading = false
    }
  }
  form.addEventListener('submit', event => {
    event.preventDefault()
    state = { q: query.value.trim(), category: category.value, tag: tag.value, page: 1 }
    render()
    saveUrl()
    if (!posts) void load()
  }, { signal })
  form.addEventListener('reset', event => {
    event.preventDefault()
    query.value = ''; category.value = ''; tag.value = ''
    state = { q: '', category: '', tag: '', page: 1 }
    render(); saveUrl(); query.focus()
  }, { signal })
  previous.addEventListener('click', () => { state.page--; render(true); saveUrl() }, { signal })
  next.addEventListener('click', () => { state.page++; render(true); saveUrl() }, { signal })
  root.querySelector('[data-search-retry]')!.addEventListener('click', () => { void load() }, { signal })
  // The early history bridge offers this form query-only navigation before
  // ClientRouter runs. Cross-page history remains owned by the router.
  document.addEventListener('haruka:search-history', event => {
    if (location.pathname !== pathname) return
    event.preventDefault()
    fromUrl()
    render()
  }, { signal })
  fromUrl()
  void load()
  cleanup = () => controller.abort()
}
initSearch()
document.addEventListener('astro:page-load', initSearch)
document.addEventListener('astro:before-swap', () => { cleanup?.(); cleanup = undefined })
