import { readFile, writeFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'
import { filesIn } from './check-links.mjs'

export async function measureBuild(root) {
  const result = { htmlGzipMaxBytes: 0, cssGzipTotalBytes: 0, jsGzipTotalBytes: 0, fontBytes: 0 }
  for (const file of await filesIn(root)) {
    const extension = extname(file)
    if (!['.html', '.css', '.js', '.woff2'].includes(extension)) continue
    const bytes = await readFile(file)
    if (extension === '.woff2') result.fontBytes += bytes.length
    else if (extension === '.html') result.htmlGzipMaxBytes = Math.max(result.htmlGzipMaxBytes, gzipSync(bytes).length)
    else if (extension === '.css') result.cssGzipTotalBytes += gzipSync(bytes).length
    else result.jsGzipTotalBytes += gzipSync(bytes).length
  }
  return result
}

export function checkBudgets(measured, limits) {
  return Object.entries(limits).flatMap(([name, limit]) => {
    if (!Number.isFinite(measured[name]) || !Number.isFinite(limit) || limit < 0) return [`${name}：无效或缺失的性能指标。`]
    return measured[name] > limit ? [`${name}：${measured[name]} > ${limit} bytes`] : []
  })
}

async function main() {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const measured = await measureBuild(resolve(root, 'dist'))
  if (process.argv.includes('--record-baseline')) {
    await writeFile(resolve(root, 'docs/performance-baseline.json'), JSON.stringify({ note: '2026-10-26 优化前生产构建；HTML/CSS/JS 使用 gzip 大小，字体使用原始大小。', resources: measured }, null, 2) + '\n')
    console.log('已保存优化前资源基线。')
    return
  }
  const budget = JSON.parse(await readFile(resolve(root, 'performance-budget.json'), 'utf8'))
  const errors = checkBudgets(measured, budget.resources)
  console.table(Object.entries(measured).map(([metric, bytes]) => ({ metric, bytes, limit: budget.resources[metric] })))
  if (errors.length) { for (const error of errors) console.error(error); process.exitCode = 1 }
  else console.log('资源体积预算通过。')
  await writeFile(resolve(root, '.cache/performance-resources.json'), JSON.stringify({ measured, limits: budget.resources, passed: !errors.length }, null, 2) + '\n')
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => { console.error(error.message); process.exitCode = 1 })
}
