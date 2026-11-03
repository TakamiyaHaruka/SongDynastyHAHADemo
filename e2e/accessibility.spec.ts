import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import type { Page, TestInfo } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('https://**', route => route.abort())
})

async function scan(page: Page, info: TestInfo, name: string) {
  await page.evaluate(() => document.fonts.ready)
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze()
  await info.attach(`${name}.json`, { body: JSON.stringify(results, null, 2), contentType: 'application/json' })
  expect(results.violations.map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) }))).toEqual([])
}

for (const [name, path] of [
  ['home', './'], ['posts', 'posts/'], ['category', 'posts/category/御笔/'],
  ['tag', 'posts/tag/宋徽宗/'], ['article', 'posts/huizong-yuji/'],
  ['friends', 'friends/'], ['about', 'about/'], ['rss', 'rss/'], ['not-found', '404.html'],
]) test(`accessible page: ${name}`, async ({ page }, info) => {
  await page.goto(path)
  await scan(page, info, name)
})

test('search form, filtered results and no-results state are accessible', async ({ page }, info) => {
  await page.goto('search/?q=艮岳')
  await expect(page.locator('[data-search-results]')).toHaveAttribute('aria-busy', 'false')
  await expect(page.getByRole('link', { name: /御制艮岳记/ })).toBeVisible()
  await scan(page, info, 'search-results')
  await page.getByRole('searchbox', { name: '关键词' }).fill('绝无此结果的手札')
  await page.getByRole('button', { name: '检索', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('未找到')
  await scan(page, info, 'search-empty')
})

test('gallery dialog and its keyboard focus remain accessible', async ({ page }, info) => {
  await page.goto('./')
  const opener = page.locator('[data-gallery-open]').first()
  await opener.click()
  await expect(page.locator('[data-gallery-stage]')).toHaveAttribute('aria-busy', 'false')
  await scan(page, info, 'gallery-dialog')
  await page.keyboard.press('Escape')
  await expect(opener).toBeFocused()
})

test('keyboard users can skip navigation and operate search using labels', async ({ page }) => {
  await page.goto('search/')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: '跳转到正文' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()
  const input = page.getByRole('searchbox', { name: '关键词' })
  await input.focus()
  await page.keyboard.type('艮岳')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('status')).toContainText('找到 1 篇')
})

test('color copy feedback keeps its visible text in the accessible name', async ({ page }, info) => {
  await page.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => {} }, configurable: true }) })
  await page.goto('about/')
  await page.locator('.color-swatch').first().click()
  await expect(page.locator('.color-hex').first()).toHaveText('已复制!')
  await scan(page, info, 'color-copied')
})

test('music error feedback and original links remain accessible', async ({ page }, info) => {
  await page.goto('./')
  await page.locator('[data-music-item]').evaluateAll(items => items.forEach(item => { (item as HTMLElement).dataset.previewUrl = 'https://audio.example.test/unavailable.wav' }))
  await page.locator('[data-music-select]').nth(1).click()
  await page.locator('[data-music-select]').first().click()
  await page.locator('[data-music-play-toggle]').first().click()
  await expect(page.locator('[data-home-music]')).toHaveAttribute('data-music-state', 'error')
  await scan(page, info, 'music-error')
})
