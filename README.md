# 大宋王朝 · 宋代手札

基于 Astro 的静态博客，以画卷、御笔手札和案头闲情组织内容。

## 本地开发

使用 Node.js 22.12+（或 24+）与 pnpm。

```sh
pnpm install --frozen-lockfile
pnpm dev --port 4322
pnpm check
pnpm test
pnpm build
pnpm preview --port 4322
```

项目路径为 `/SongDynastyHAHADemo/`。默认部署到 GitHub Pages；站点域名与部署路径在 `astro.config.mjs` 中配置。

## 内容与素材

- 文章位于 `src/content/blog/<文章标识>/index.md`。执行 `pnpm post:new spring-notes --title "春日记"` 可创建草稿，也可从 `templates/post.md` 复制。新模板默认为 `draft: true`，完成后改为 `false` 发布。未填写 `draft` 时默认已发布。
- `date` 是页面展示或历史题材日期，`publishedAt` 是本站收录日期，`updatedAt` 为可选的实际更新日期，格式均为有效的 `YYYY-MM-DD`。发布时必须有 `publishedAt`；未填写展示日期时使用该日期。旧字段 `pubDate` 仍兼容为展示日期，与 `date` 同时填写时必须一致；更新日期不能早于本站收录日期。日期缺失、无效或标题为空会使检查和构建报错。
- 首页、文章总目、分类、详情、RSS、前后篇及分享图共用已发布文章集合，草稿不会生成公开页面、分类、分享图或站点地图条目。站内按展示日期倒序、同日按文章标识排序；RSS 按本站收录日期排序，文章元数据使用实际收录与更新日期。日期不用于定时发布，草稿状态决定是否公开。五篇宋代示例文章的 `publishedAt` 依据首次 Git 收录记录回填为 2026-05-12，并非对原始历史文献年代的改写。详细约定见 `docs/authoring.md`。
- 首屏横卷在 `src/data/home-artwork.ts` 中配置 `src`、`alt`、`title` 和裁切位置 `position`。
- 画册在 `src/data/home-gallery.ts` 中配置，SVG 源文件位于 `src/assets/artwork/`。首页显示三幅精选，其余画作通过“展阅其余画作”展开后按需加载。点击画作可展卷查看完整构图，支持按钮与左右方向键循环切换、Esc 或点击遮罩关闭；关闭后恢复原位置与焦点。
- 图片目前沿用原有 SVG 占位。以后可将生成的图片放入 `public/images/`，并将素材地址改为带部署路径的地址，例如 `withBase('/images/hero.webp')`（`withBase` 来自 `src/utils/paths.ts`）。横卷适合约 3:1 的构图。
- 艺事、文房器物的详细介绍在“关于”页展示，数据位于 `src/data/home-info.ts`。
- 音乐链接在 `src/data/home-music.ts` 中维护。构建前读取 Apple Music，成功的资料逐首缓存 24 小时；刷新失败时继续使用上次成功的资料，下次构建会重试。字体裁剪和页面渲染共用 `.cache/music-build.json` 中的当次快照，首次构建也包含最新歌名的字形。首次构建没有缓存且接口不可用时，曲目显示占位并禁用试听，其余页面仍可构建。
- 音乐的选曲、播放和原曲入口相互独立。方向键与 Home / End 可选曲，Enter / 空格操作当前按钮；加载中可取消，失败后可重试，无试听时仍可前往 Apple Music。暂停保留进度，切歌从头播放，离页时释放音频。
- 社交地址在 `src/data/social-links.ts` 中维护，空地址不会展示。
- RSS 图标与站内入口打开 `/rss/` 订阅说明页，实际订阅源仍为 `/rss.xml`；页面的 RSS 自动发现链接指向 XML 订阅源。
- 导航中的外观选项支持浅色、深色与跟随系统。选择保存在本地，刷新和站内切换继续使用；存储不可用时仍可在当前浏览过程中切换主题。
- 字体在开发、检查及构建前按源码与音乐缓存中的文字自动裁剪，新增文章后会重新生成，无须手动补字。生成文件位于 `.cache/site-fonts/`，授权文件位于 `public/fonts/`。公共 UI 与资源约定见 `docs/ui-system.md`。

## 验证与部署

`pnpm check` 检查 Astro 组件和 TypeScript；`pnpm test` 检查音乐交互与缓存、发布规则、新建草稿、链接检查、性能预算、问候语、前后篇及字体，并在隔离副本中构建草稿和旧日期字段的样例，验证公开产物。测试不依赖外网。

浏览器测试首次运行前执行 `pnpm exec playwright install chromium`。随后执行 `pnpm build`、`pnpm test:e2e`，或用 `pnpm validate` 一次完成类型检查、测试、构建、站内链接、资源预算和浏览器回归。浏览器回归自动启动 4349 端口的生产预览，覆盖导航、分类、文章目录、前后篇、画册、音乐、RSS、主题偏好以及明暗主题和四种宽度；音频使用本地生成的测试声音，不依赖真实试听服务。功能回归通过后再运行弱网首屏与预热导航性能预算。报告和失败截图、trace 位于 `.cache/playwright-report/` 与 `.cache/playwright-results/`。

`pnpm check:links` 在生产产物上检查站内链接、资源与锚点；`pnpm check:perf` 检查压缩后的 HTML/CSS/JS 及字体体积。基线、阈值和运行方法见 `docs/performance.md`。

优化基线及本轮交互的验收记录见 `docs/validation.md`。

GitHub Actions 对提交到 `main` 的代码和指向 `main` 的 Pull Request 执行检查、测试、构建、站内链接、性能预算与 Chromium 回归，全部通过后仅 `main` 分支部署到 Pages。也可在 Actions 页面手动运行流程。安装依赖使用锁文件，音乐资料通过 Actions 缓存跨构建复用。

`dist/`、`.astro/` 和 `.cache/` 是自动生成目录，不纳入版本管理。本地文件仍可保留；缺失时会在开发或构建时重新生成。音乐缓存位于 `.cache/music-metadata.json`，兼容旧版缓存格式；需要强制刷新时可删除该文件后重新构建。
