import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const limits = JSON.parse(readFileSync(resolve('performance-budget.json'), 'utf8')).runtime

test('cold home stays within the weak-network paint and layout budgets', async ({ page, context }, info) => {
  const cdp = await context.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.setBlockedURLs', { urls: ['https://*'] })
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false, latency: limits.coldNetworkLatencyMs,
    downloadThroughput: limits.coldDownloadBytesPerSecond, uploadThroughput: limits.coldDownloadBytesPerSecond,
  })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: limits.cpuSlowdown })
  await page.addInitScript(() => {
    const state = { lcp: 0, cls: 0 }
    Object.assign(window, { sitePaintMetrics: state })
    new PerformanceObserver(list => { for (const entry of list.getEntries()) state.lcp = entry.startTime }).observe({ type: 'largest-contentful-paint', buffered: true })
    new PerformanceObserver(list => {
      for (const entry of list.getEntries() as any) if (!entry.hadRecentInput) state.cls += entry.value
    }).observe({ type: 'layout-shift', buffered: true })
  })
  await page.goto('./', { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  await expect.poll(() => page.evaluate(() => (window as any).sitePaintMetrics.lcp)).toBeGreaterThan(0)
  const measured = await page.evaluate(() => ({
    ...(window as any).sitePaintMetrics,
    firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
  }))
  await info.attach('cold-performance.json', { body: JSON.stringify({ measured, limits }, null, 2), contentType: 'application/json' })
  console.log(`Cold performance: ${JSON.stringify(measured)}`)
  expect(measured.lcp).toBeLessThanOrEqual(limits.largestContentfulPaintMs)
  expect(measured.cls).toBeLessThanOrEqual(limits.layoutShift)
})

test('repeated navigation stays within the warm transition budget', async ({ page, context }, info) => {
  const cdp = await context.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.setBlockedURLs', { urls: ['https://*'] })
  await page.addInitScript(() => {
    const durations: number[] = []
    let start: number | undefined
    Object.assign(window, { siteNavigationMetrics: durations })
    document.addEventListener('astro:before-preparation', () => { start = performance.now() })
    document.addEventListener('astro:page-load', () => { if (start !== undefined) { durations.push(performance.now() - start); start = undefined } })
  })
  await page.goto('./')
  const labels = ['文章', '友人', '关于', '首页', '文章', '友人', '关于', '首页']
  for (const [index, label] of labels.entries()) {
    await page.locator('.nav-links').getByRole('link', { name: label, exact: true }).click()
    await expect(page.locator('.nav-links [aria-current="page"]')).toHaveText(label)
    await expect.poll(() => page.evaluate(() => (window as any).siteNavigationMetrics.length)).toBe(index + 1)
  }
  const durations = await page.evaluate(() => (window as any).siteNavigationMetrics as number[])
  const sorted = [...durations].sort((a, b) => a - b)
  const p95 = sorted[Math.ceil(sorted.length * 0.95) - 1]
  await info.attach('navigation-performance.json', { body: JSON.stringify({ durations, p95, limit: limits.navigationP95Ms }, null, 2), contentType: 'application/json' })
  console.log(`Navigation performance: ${JSON.stringify({ durations, p95 })}`)
  expect(p95).toBeLessThanOrEqual(limits.navigationP95Ms)
})
