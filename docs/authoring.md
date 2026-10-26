# 手札维护

## 新建草稿

```sh
pnpm post:new spring-notes --title "春日记"
pnpm post:new history-notes --title "一页旧事" --date 1043-06-01 --category "奏折"
```

命令在 `src/content/blog/<文章标识>/index.md` 中创建草稿，默认使用香港时区的当天日期。Npm 用户可运行 `npm run post:new -- spring-notes --title "春日记"`。

标识使用小写字母、数字与连字符；不接受路径、系统保留名称或重名文章。已有目录以及同名 `.md` / `.mdx` 文件均不会被覆盖。可使用 `--published-at YYYY-MM-DD` 明确本站收录日。新草稿默认 `draft: true`，不会生成公开页面。

## 日期的含义

| 字段 | 用途 |
| --- | --- |
| `date` | 展示日期或历史题材日期，用于站内列表、时间线和前后篇排序 |
| `publishedAt` | 本站收录日期，发布时必填，用于 RSS 和文章结构化数据 |
| `updatedAt` | 实际更新日期，可选且不能早于 `publishedAt` |
| `pubDate` | 兼容旧内容的展示日期别名；新文章使用 `date` |

未填写 `date` 时，页面使用 `publishedAt`。所有日期必须是有效的日历日期，不能以时间戳或不补零的日期代替。无日期的草稿可以保留；填写了日期就会进行校验。

宋代示例文章保留 1043～1117 年的题材日期，本站收录日以 Git 首次记录 2026-05-12 回填。这是迁移依据，不代表这些文章在互联网上首次发表的时间。公开页面同时显示题材日期与本站收录日，元数据不再将宋代年份作为本站发布时间。

## 发布与检查

确认标题、日期、分类、简介和正文后，将 `draft` 改为 `false`。运行 `pnpm validate`，或逐项运行：

```sh
pnpm check
pnpm test
pnpm build
pnpm check:links
pnpm check:perf
pnpm test:e2e
```

链接检查读取构建后的页面，检查站内页面、图片、脚本、样式及标题锚点。外部网站不在此检查范围内，以避免远端波动阻断发布。
