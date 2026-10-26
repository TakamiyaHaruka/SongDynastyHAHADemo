# 性能基线与预算

基线保存在 `performance-baseline.json`，预算保存在项目根目录的 `performance-budget.json`。基线取自 2026-10-26 本轮优化前的生产构建，供后续比较；正常验证不会覆盖它。

## 资源预算

| 指标 | 优化前基线 | 阻断阈值 |
| --- | ---: | ---: |
| 单页 HTML 最大 gzip 大小 | 12,620 bytes | 16,384 bytes |
| 全站 CSS gzip 总大小 | 19,034 bytes | 25,600 bytes |
| 全站 JS gzip 总大小 | 12,167 bytes | 20,480 bytes |
| 全站 WOFF2 字体总大小 | 519,352 bytes | 614,400 bytes |

CSS/JS 预算统计构建目录内全部同类资源，而非假定所有页面都会请求它们；字体不重复压缩。阈值为当前基线保留扩展余量，新增依赖、字体或样式超出阈值时会使检查失败。不要只为了让 CI 通过而提高阈值，应先确认增加的资源是否必要。

运行 `pnpm build` 后执行 `pnpm check:perf`。本次结果写入 `.cache/performance-resources.json`。如以后需要重建经过确认的基线，可显式运行 `node scripts/check-performance.mjs --record-baseline`，随后重新记录运行环境与浏览器指标。

## 浏览器预算

性能项目使用现有 Chromium：

- 冷加载：1440 × 1000，100ms 网络延迟，200 KiB/s 下载，4 倍 CPU 节流；最大内容绘制不超过 4500ms，累计布局位移不超过 0.1。
- 预热切换：首页、文章、友人、关于共 8 次站内切换，P95 不超过 800ms。
- 隔离外部 HTTPS 资源，保留本地页面、字体、画作和脚本请求。测量结果不代表所有用户的真实网络表现。

优化前本机测得 LCP 1948ms、CLS 0、切换 P95 62.6ms。时间指标会受机器负载影响，阈值留有 CI 环境余量。浏览器结果保存在 Playwright 报告的 JSON 附件中。

`pnpm test:e2e` 先运行功能回归，再运行性能项目。单独复测性能可执行：

```sh
pnpm test:e2e --project=performance --no-deps
```

发布流水线包含资源预算、链接检查与浏览器性能预算；失败时保留报告、截图和 trace。项目仍只使用 Chromium，本轮未增加跨浏览器矩阵。
