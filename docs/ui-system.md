# UI 组件与样式约定

保留宋代手札的纸色、朱砂色与衬线字体。借鉴 Astro Demo 的组件组合和样式职责划分，新增页面从公共组件组合，避免复制整套页面或依靠全局覆盖修正组件。

## 公共组件

- `SectionHeading.astro`：页面和分区标题。`variant="page"` 配合 `level="h1"`；默认分区为 h2，`compact` 用于次级分组。支持 label、description、标题 id，以及 leading / actions 插槽。
- `ActionLink.astro`：链接形式的操作入口。variant 为 primary、outline 或 text，其余原生链接属性直接传入。真正执行操作的控件使用原生 button。
- `PostCollection.astro`：总目和分类页共用的文章集合布局。桌面展示侧栏，窄屏将分类放在文章之前。
- `PostCard.astro`：文章列表条目，使用 h2，保留完整的简介及独立的日期、分类信息。
- `FriendCard.astro`：友人链接，常来常往与休眠分组使用同一组件，显示完整介绍。

## 样式职责

- `base.css`：字体、色彩、间距、字级、容器及动效变量，重置与页面基础规则。明暗主题共用布局变量。
- `components.css`：标题标签、分类标签、按钮、文字链接等共享基础样式。
- `navigation.css`：导航、移动菜单、页脚。菜单事件由 `src/scripts/navigation.ts` 管理。
- `editorial.css`：公共页面留白、分区节奏与跳转正文入口。
- `music.css`：只由 `HomeMusicPanel.astro` 引入。
- 主题由 `public/js/theme-init.js` 在正文解析前初始化，`ThemePicker.astro` 提供浅色、深色与跟随系统选择。新增颜色使用主题变量，不直接根据系统媒体查询绕过手动选择。
- `prose.css`：只由文章详情页引入。
- 各 Astro 组件的 style 块：组件自身的卡片、网格与响应式规则。不要再向公共文件追加旧版首页、时间线或画廊样式。

## 布局与交互

- 导航、正文和页脚使用相同的 `--layout-width`、`--page-gutter`。
- 普通内页使用 `container-main page-shell`，首页分区使用 `section-block`。
- 优先使用 `--space-*`、`--section-space`、`--layout-gap`、`--text-page` 和 `--text-section`，避免为每个页面另建相近的数值。
- 分类和网格使用 `minmax(0, 1fr)`，文本区域允许收缩，长标题与简介换行。
- 手机端主要操作目标至少 44px；菜单打开后焦点留在菜单内，Esc 关闭并返回触发按钮。
- 保留 ClientRouter、hover 预取及脚本离页清理；新增交互需适配 astro:page-load / astro:before-swap。
- `GalleryViewer.astro` 与 `src/scripts/gallery.ts` 管理画册原生对话框：大图使用 `object-fit: contain`，只在打开或切换时赋予图片地址；关闭时恢复滚动及触发按钮焦点，离页时释放对话框与事件。
- 音乐列表的选曲与播放使用相邻的原生按钮，避免交互控件嵌套；状态通过单独的 polite live region 播报，原曲链接始终可用。播放请求支持取消和超时，离页时解除事件、计时器及音频。

## 验证

执行 `npm run check`、`npm test`、`npm run build`。修改布局后检查首页、文章总目、分类、文章详情、友人、关于，在 320 / 390 / 768 / 1440px 和明暗主题下验证溢出、标题层级与交互。新增 CSS 还需确认没有让音乐或正文样式重新进入不相关页面。

`npm run test:e2e` 在生产构建上自动检查上述关键流程与主题、宽度组合，并检查弱网首屏与预热导航预算。首次使用需安装 Playwright Chromium；`npm run validate` 还包含站内链接和资源预算，CI 在全部检查通过后部署。

## 文章发布

- `src/lib/post-schema.ts` 校验标题、展示日期、本站收录日期、更新日期和草稿状态，并兼容旧版展示字段 `pubDate`。RSS 与 BlogPosting 元数据使用 `publishedAt`，展示与时间线使用 `date`。
- 公共页面、RSS 和 OG 路由统一调用 `getPublishedPosts()`，避免自行调用 `getCollection()` 漏出草稿。
- `templates/post.md` 是新文章起点，`pnpm post:new <标识>` 可创建草稿并检查重名。发布前补齐 `publishedAt` 并移除草稿状态；未发布文章不生成详情、分类或分享图。

## 字体与画作资源

- `integrations/site-fonts.mjs` 在开发、检查及构建前先准备音乐快照，再扫描 `src/`、`public/js/`、音乐资料缓存和当次快照，按其中出现的字符生成 Inter 与 Noto Serif SC 字体子集。页面从同一份 `.cache/music-build.json` 读取音乐，避免冷缓存或缓存写入失败造成字库与歌名不同步；保留逐首长期缓存的失败重试规则。开发时新增或删除文字会自动更新，无须手工维护汉字清单。
- 生成字体、CSS 及清单位于 `.cache/site-fonts/`，缺失时自动创建，不提交生成文件。字体内容作为缓存键的一部分，字体包或文字变化后会生成新的资源地址。构建环境需要安装开发依赖中的 `subset-font`。
- `BaseLayout.astro` 统一加载生成的字体 CSS；字体文件独立输出，避免小字体被内联到每页共享的 CSS。字体授权文件位于 `public/fonts/`，随站点一起发布。
- 画作 SVG 源文件位于 `src/assets/artwork/`，在 `src/data/home-gallery.ts` 中导入并声明真实宽高。Vite 输出带哈希的独立地址，让重复使用的画作共用缓存。
- 首屏横卷由首页 head 插槽预加载；第一幅精选画作提前加载，其余精选及展开画册使用原生懒加载。不要把首屏可见的画作全部改为懒加载，也不要把整套画册内联到 HTML。
