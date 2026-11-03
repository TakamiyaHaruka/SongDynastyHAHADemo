import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

// A small generated tone exercises real media playback without an external API.
const sampleRate = 16000
const samples = sampleRate * 8
const wav = Buffer.alloc(44 + samples * 2)
wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8)
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22)
wav.writeUInt32LE(sampleRate, 24); wav.writeUInt32LE(sampleRate * 2, 28)
wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36)
wav.writeUInt32LE(samples * 2, 40)
for (let i = 0; i < samples; i++) wav.writeInt16LE(Math.round(Math.sin(i * 2 * Math.PI * 220 / sampleRate) * 100), 44 + i * 2)
const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jD1kAAAAASUVORK5CYII=', 'base64')
const pageErrors = new WeakMap<Page, string[]>()

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  pageErrors.set(page, errors)
  page.on('pageerror', error => errors.push(error.message))
  await page.route('**/*', route => {
    const request = route.request()
    if (new URL(request.url()).hostname === '127.0.0.1') return route.continue()
    if (request.resourceType() === 'media') return route.fulfill({ contentType: 'audio/wav', body: wav })
    if (request.resourceType() === 'image') return route.fulfill({ contentType: 'image/png', body: pixel })
    return route.abort()
  })
})
test.afterEach(async ({ page }) => { expect(pageErrors.get(page)).toEqual([]) })

async function navigate(page: Page, name: string) {
  const desktop = page.locator('.nav-links').getByRole('link', { name, exact: true })
  if (await desktop.isVisible()) await desktop.click()
  else {
    await page.getByRole('button', { name: '打开菜单', exact: true }).click()
    await page.locator('#drawer-panel').getByRole('link', { name, exact: true }).click()
  }
  await expect(page.locator('.nav-links [aria-current="page"]')).toHaveText(name)
}

async function prepareMusic(page: Page) {
  await page.goto('./')
  const root = page.locator('[data-home-music]')
  await expect(root).toHaveAttribute('data-music-bound', 'true')
  // Test availability is independent of whether the build had a warm music cache.
  await page.locator('[data-music-item]').evaluateAll(items => items.forEach((item, index) => {
    const row = item as HTMLElement
    row.dataset.previewUrl = `https://audio.example.test/track-${index}.wav`
  }))
  const select = page.locator('[data-music-select]')
  await select.nth(1).click()
  await select.first().click()
  await expect(select.first()).toHaveAttribute('aria-pressed', 'true')
  return root
}

test('navigation preserves the document, current page, and stable transitions', async ({ page }) => {
  await page.goto('./')
  const marker = await page.evaluate(() => {
    const marker = Math.random()
    Object.assign(window, { navigationMarker: marker })
    return marker
  })
  for (const [name, heading] of [['文章', '文章总目'], ['友人', '友人帐'], ['关于', '宋徽宗 赵佶'], ['首页', '朕的御花园']]) {
    await navigate(page, name)
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
    expect(await page.evaluate(() => (window as unknown as { navigationMarker: number }).navigationMarker)).toBe(marker)
    await expect(page.locator('.nav-links [aria-current="page"]')).toHaveText(name)
    expect(await page.evaluate(() => getComputedStyle(document.documentElement, '::view-transition-new(root)').animationName)).toBe('none')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

test('category, table of contents, neighbors and RSS agree with the article list', async ({ page, request }) => {
  await page.goto('posts/')
  const links = await page.locator('.post-card').evaluateAll(cards => cards.map(card => card.getAttribute('href')))
  expect(links.length).toBeGreaterThan(0)
  const feed = await (await request.get('rss.xml')).text()
  for (const link of links) expect(feed).toContain(link)
  await page.getByRole('navigation', { name: '文章分类' }).getByRole('link', { name: /御笔/ }).click()
  await expect(page.locator('.post-card')).toHaveCount(1)
  await page.locator('.post-card').click()
  const toc = page.getByRole('navigation', { name: '本篇目录' })
  if (page.viewportSize()!.width <= 1023) await toc.locator('summary').click()
  const chapter = toc.locator('a[href^="#"]').last()
  await chapter.click()
  await expect(chapter).toHaveAttribute('aria-current', 'location')
  const chapterHash = await chapter.getAttribute('href')
  await expect(page).toHaveURL(url => decodeURIComponent(url.hash) === chapterHash)
  await expect(page.locator('.post-navigation a[rel="prev"]')).toHaveCount(0)
  await expect(page.locator('.post-navigation a[rel="next"]')).toHaveAttribute('href', links[1]!)
  await page.goto(links.at(-1)!)
  await expect(page.locator('.post-navigation a[rel="next"]')).toHaveCount(0)
  await expect(page.locator('.post-navigation a[rel="prev"]')).toHaveAttribute('href', links.at(-2)!)
})

test('desktop article contents preserve chapter anchors, refresh and history', async ({ page }) => {
  await page.goto('posts/huizong-yuji/')
  const toc = page.getByRole('navigation', { name: '本篇目录' })
  await expect(toc.locator('details')).toHaveJSProperty('open', true)
  const chapter = toc.locator('a[href^="#"]').nth(1)
  const hash = (await chapter.getAttribute('href'))!
  await chapter.click()
  await expect(chapter).toHaveAttribute('aria-current', 'location')
  await expect(page).toHaveURL(url => decodeURIComponent(url.hash) === hash)
  await page.reload()
  await expect(toc.locator('details')).toHaveJSProperty('open', true)
  await expect(chapter).toHaveAttribute('aria-current', 'location')
  await toc.locator('a[href^="#"]').first().click()
  await page.goBack()
  await expect(page).toHaveURL(url => decodeURIComponent(url.hash) === hash)
  await expect(chapter).toHaveAttribute('aria-current', 'location')
})

test('gallery supports keyboard, focus restoration, wrapping and route cleanup', async ({ page }) => {
  await page.goto('./')
  const opener = page.locator('[data-gallery-open]').first()
  expect(await page.evaluate(() => performance.getEntriesByType('resource').some(entry => /-1536\./.test(entry.name)))).toBe(false)
  await opener.scrollIntoViewIfNeeded()
  const scroll = await page.evaluate(() => scrollY)
  await opener.click()
  const dialog = page.getByRole('dialog', { name: '画间四时 · 展卷' })
  await expect(dialog).toBeVisible()
  const fullImage = page.locator('[data-gallery-image]')
  await expect(fullImage).toHaveAttribute('src', (await opener.locator('img').getAttribute('data-full-src'))!)
  await expect.poll(() => fullImage.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(1536)
  await expect(page.locator('[data-gallery-stage]')).toHaveAttribute('aria-busy', 'false')
  await expect(fullImage).toBeVisible()
  await page.locator('[data-gallery-next]').click()
  await expect(fullImage).toHaveAttribute('src', (await page.locator('.featured-gallery img').nth(1).getAttribute('data-full-src'))!)
  await expect(page.locator('[data-gallery-stage]')).toHaveAttribute('aria-busy', 'false')
  await expect(fullImage).toBeVisible()
  const winterSource = (await page.locator('.featured-gallery img').nth(2).getAttribute('data-full-src'))!
  const winterRequest = new URL(winterSource, page.url()).href
  await page.route(winterRequest, route => route.abort())
  await page.locator('[data-gallery-next]').click()
  await expect(page.locator('[data-gallery-error]')).toBeVisible()
  await page.locator('[data-gallery-previous]').click()
  await expect(fullImage).toBeVisible()
  await page.unroute(winterRequest)
  await page.locator('[data-gallery-next]').click()
  await expect(fullImage).toHaveAttribute('src', winterSource)
  await expect(fullImage).toBeVisible()
  // Rapid selection must not let an obsolete decoder change the active image.
  await page.locator('[data-gallery-previous]').click()
  await page.locator('[data-gallery-previous]').click()
  await expect(page.locator('[data-gallery-count]')).toHaveText('1 / 13')
  await expect(fullImage).toBeVisible()
  await page.keyboard.press('ArrowLeft')
  await expect(page.locator('[data-gallery-count]')).toHaveText('13 / 13')
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('[data-gallery-count]')).toHaveText('1 / 13')
  await page.locator('[data-gallery-next]').focus()
  await page.keyboard.press('Tab')
  await expect(page.locator('[data-gallery-close]')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(opener).toBeFocused()
  expect(await page.evaluate(() => scrollY)).toBe(scroll)
  await navigate(page, '文章')
  await navigate(page, '首页')
  await opener.click()
  await expect(dialog).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('heading', { name: '文章总目', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('')
})

test('search finds body text and tags, combines filters and restores shared URLs and history', async ({ page }, info) => {
  await page.goto('search/?q=太湖')
  const input = page.getByRole('searchbox', { name: '关键词' })
  const submit = page.getByRole('button', { name: '检索', exact: true })
  await expect(page.getByRole('status')).toContainText('找到 1 篇')
  await expect(page.locator('.search-result h2')).toHaveText('御制艮岳记')
  await expect(input).toHaveValue('太湖')
  await input.fill('园林')
  await page.getByLabel('分类', { exact: true }).selectOption('御笔')
  await page.getByLabel('标签', { exact: true }).selectOption('宋徽宗')
  await submit.click()
  await expect(page.locator('.search-result')).toHaveCount(1)
  await expect(page).toHaveURL(/category=%E5%BE%A1%E7%AC%94&tag=/)
  await page.reload()
  await expect(page.getByRole('status')).toContainText('找到 1 篇')
  await expect(page.getByLabel('标签', { exact: true })).toHaveValue('宋徽宗')
  await page.screenshot({ path: `.cache/search-review/search-${info.project.name}.png`, fullPage: true })
  await input.fill('<script>alert(1)</script>')
  await submit.click()
  await expect(page.getByRole('status')).toContainText('未找到')
  await expect(page.locator('.search-result')).toHaveCount(0)
  await page.goBack()
  await expect(input).toHaveValue('园林')
  await expect(page.locator('.search-result')).toHaveCount(1)
  await page.getByRole('button', { name: '清空', exact: true }).click()
  await expect(page.locator('.search-result')).toHaveCount(5)
  await expect(input).toBeFocused()
  await expect(page).toHaveURL(/\/search\/$/)
  await navigate(page, '文章')
  await page.getByRole('navigation', { name: '文章标签' }).getByRole('link', { name: '宋徽宗 1', exact: true }).click()
  await expect(page.getByRole('heading', { name: '宋徽宗', exact: true })).toBeVisible()
  await expect(page.locator('.post-card')).toHaveCount(1)
  await page.locator('.post-card').click()
  await expect(page.getByRole('list', { name: '文章标签' }).getByRole('link', { name: '宋徽宗' })).toHaveAttribute('href', /\/posts\/tag\//)
})

test('search index failure retries, paginates safely and rebinds after navigation', async ({ page }) => {
  let fail = true
  await page.route('**/search-index.json', route => fail ? route.abort() : route.fulfill({ json: Array.from({ length: 23 }, (_, index) => ({
    id: `entry-${index}`, title: `山水手札 ${index}`, category: '御笔', tags: ['宋徽宗'], description: '分页检索样例', body: '正文', date: '2026-11-03', href: './',
  })) }))
  await page.goto('search/?page=999')
  await expect(page.getByRole('alert')).toBeVisible()
  fail = false
  await page.getByRole('button', { name: '重新载入' }).click()
  await expect(page.getByRole('status')).toContainText('当前第 3 / 3 页')
  await expect(page.locator('.search-result')).toHaveCount(3)
  await expect(page.getByRole('button', { name: '下一页 →' })).toBeDisabled()
  await page.getByRole('button', { name: '← 上一页' }).click()
  await expect(page.locator('.search-result')).toHaveCount(10)
  await expect(page.getByRole('status')).toBeFocused()
  await expect(page).toHaveURL(/page=2/)
  await page.goBack()
  await expect(page.getByRole('status')).toContainText('当前第 3 / 3 页')
  await navigate(page, '首页')
  await navigate(page, '检索')
  await expect(page.locator('.search-result')).toHaveCount(10)
  await expect(page.getByRole('status')).toContainText('当前第 1 / 3 页')
})

test('music uses independent native controls and keyboard selection', async ({ page }) => {
  const root = await prepareMusic(page)
  await expect(page.locator('button button, [role="button"] button')).toHaveCount(0)
  const selects = page.locator('[data-music-select]')
  await selects.first().focus()
  await page.keyboard.press('ArrowDown')
  await expect(selects.nth(1)).toBeFocused()
  await expect(selects.nth(1)).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.press('End')
  await expect(selects.last()).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.press('Home')
  await expect(selects.first()).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.press('Tab')
  await expect(page.locator('[data-music-play-toggle]').first()).toBeFocused()
  await expect(root).toHaveAttribute('data-music-state', 'idle')
  await page.keyboard.press('Space')
  await expect(root).toHaveAttribute('data-music-state', 'playing')
})

test('music pauses, resumes, switches tracks and releases audio when leaving', async ({ page }) => {
  const root = await prepareMusic(page)
  const buttons = page.locator('[data-music-play-toggle]')
  await buttons.first().click()
  await expect(root).toHaveAttribute('data-music-state', 'playing')
  await page.waitForTimeout(250)
  await buttons.first().click()
  await expect(root).toHaveAttribute('data-music-state', 'paused')
  const pausedAt = await page.evaluate(() => [...(window as any).cynosura.homeMusicSwitcherLifecycle.audioGraphs][0].audio.currentTime)
  expect(pausedAt).toBeGreaterThan(0)
  await buttons.first().click()
  await expect(root).toHaveAttribute('data-music-state', 'playing')
  expect(await page.evaluate(() => [...(window as any).cynosura.homeMusicSwitcherLifecycle.audioGraphs][0].audio.currentTime)).toBeGreaterThanOrEqual(pausedAt)
  // Offscreen play controls become visible when reached by keyboard focus.
  await buttons.nth(1).focus()
  await page.keyboard.press('Enter')
  await expect(buttons.nth(1)).toHaveAttribute('aria-pressed', 'true')
  await expect(buttons.first()).toHaveAttribute('aria-pressed', 'false')
  await expect(page.locator('[data-music-original]')).toHaveAttribute('href', await page.locator('[data-music-item]').nth(1).getAttribute('data-link') as string)
  await navigate(page, '文章')
  expect(await page.evaluate(() => (window as any).cynosura.homeMusicSwitcherLifecycle.audioGraphs.size)).toBe(0)
  await navigate(page, '首页')
  await expect(root).toHaveAttribute('data-music-bound', 'true')
  expect(await page.evaluate(() => (window as any).cynosura.homeMusicSwitcherLifecycle.audioGraphs.size)).toBe(1)
})

test('music failures offer retry and unavailable tracks retain the original link', async ({ page }) => {
  const root = await prepareMusic(page)
  let fail = true
  await page.route('https://audio.example.test/**', route => fail ? route.abort() : route.fulfill({ contentType: 'audio/wav', body: wav }))
  const first = page.locator('[data-music-play-toggle]').first()
  await first.click()
  await expect(root).toHaveAttribute('data-music-state', 'error')
  await expect(page.locator('[data-music-status]')).toContainText('加载失败')
  await expect(first).toHaveAttribute('aria-label', /^重试/)
  fail = false
  await first.click()
  await expect(root).toHaveAttribute('data-music-state', 'playing')
  await page.locator('[data-music-item]').nth(2).evaluate(row => { (row as HTMLElement).dataset.previewUrl = '' })
  await page.locator('[data-music-select]').nth(2).click()
  await expect(root).toHaveAttribute('data-music-state', 'unavailable')
  await expect(page.locator('[data-music-play-toggle]').nth(2)).toBeDisabled()
  await expect(page.locator('[data-music-status]')).toContainText('暂无试听')
  await expect(page.locator('[data-music-original]')).toHaveAttribute('target', '_blank')
})

test('a stalled music request can be cancelled and does not block selection', async ({ page }) => {
  const root = await prepareMusic(page)
  let release!: () => void
  const response = new Promise<void>(resolve => { release = resolve })
  await page.route('https://audio.example.test/**', async route => {
    await response
    await route.fulfill({ contentType: 'audio/wav', body: wav }).catch(() => {})
  })
  try {
    const first = page.locator('[data-music-play-toggle]').first()
    await first.click()
    await expect(root).toHaveAttribute('data-music-state', 'loading')
    await expect(first).toHaveAttribute('aria-label', /^取消加载/)
    await first.click()
    await expect(root).toHaveAttribute('data-music-state', 'paused')
    await page.locator('[data-music-select]').nth(1).click()
    await expect(page.locator('[data-music-select]').nth(1)).toHaveAttribute('aria-pressed', 'true')
    await expect(root).toHaveAttribute('data-music-state', 'idle')
  } finally { release() }
})

test('public page layouts stay within the viewport and preserve heading structure', async ({ page }) => {
  for (const route of ['./', 'posts/', 'posts/category/御笔/', 'posts/tag/宋徽宗/', 'posts/baozheng-qingguan/', 'friends/', 'about/', 'rss/', 'search/']) {
    await page.goto(route)
    await expect(page.locator('h1')).toHaveCount(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

test('theme preference persists across reloads, navigation and system changes', async ({ page }) => {
  await page.goto('./')
  const picker = page.getByRole('combobox', { name: '外观主题' })
  await picker.selectOption('dark')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await navigate(page, '文章')
  await expect(picker).toHaveValue('dark')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(picker).toHaveValue('dark')
  await picker.selectOption('light')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await picker.selectOption('system')
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})

test('theme works with unavailable storage and is applied before the body', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage unavailable') } })
    Object.assign(window, { earlyThemes: [] })
    new MutationObserver(() => {
      if (document.body) (window as any).earlyThemes.push(document.documentElement.dataset.theme)
    }).observe(document, { childList: true, subtree: true })
  })
  await page.goto('./')
  await expect(page.getByRole('combobox', { name: '外观主题' })).toHaveValue('system')
  await page.getByRole('combobox', { name: '外观主题' }).selectOption('dark')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await navigate(page, '文章')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  const themes = await page.evaluate(() => (window as any).earlyThemes)
  expect(themes.length).toBeGreaterThan(0)
  expect(themes.every((theme: string | undefined) => theme === 'light' || theme === 'dark')).toBe(true)
})

test('RSS entry opens the subscription page and article metadata uses site dates', async ({ page, request }) => {
  await page.goto('./')
  const rss = page.locator('.nav-links').getByRole('link', { name: 'RSS 订阅', exact: true })
  if (await rss.isVisible()) await rss.click()
  else {
    await page.getByRole('button', { name: '打开菜单', exact: true }).click()
    await page.locator('#drawer-panel').getByRole('link', { name: 'RSS', exact: true }).click()
  }
  await expect(page.getByRole('heading', { name: '订阅手札', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: '打开订阅源' })).toHaveAttribute('href', /rss\.xml$/)
  const feed = await (await request.get('rss.xml')).text()
  expect(feed).toContain('12 May 2026')
  await page.getByRole('link', { name: '翻阅手札', exact: true }).click()
  await page.locator('.post-card').first().click()
  await expect(page.locator('.post-site-date')).toContainText('2026-05-12')
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article')
  const article = await page.locator('script[type="application/ld+json"]').evaluateAll(scripts => scripts.map(script => JSON.parse(script.textContent!)).find(value => value['@type'] === 'BlogPosting'))
  expect(article.datePublished).toBe('2026-05-12')
})
