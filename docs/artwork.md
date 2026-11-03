# 首页画作制作记录

2026-11-03 使用内置 image_gen 工具，按 imagegen 技能生成四幅宋画风格的原创插画，作为网站正式视觉素材。它们是 AI 生成的当代风格演绎，并非古画扫描件。

## 项目文件

正式交付位于 `src/assets/artwork/generated/`，均为压缩后的 WebP：

| 画作 | 页面资源 | 大图或其他尺寸 |
| --- | --- | --- |
| 秋山晚翠横卷 | `hero-autumn-scroll-1280.webp`（71,210 bytes） | `hero-autumn-scroll-1920.webp`（154,550 bytes）；`hero-autumn-scroll-mobile.webp`（125,178 bytes） |
| 春 · 桃花流水 | `spring-peach-stream-640.webp`（35,258 bytes） | `spring-peach-stream-1536.webp`（331,250 bytes） |
| 山居秋暝 | `mountain-dwelling-640.webp`（43,170 bytes） | `mountain-dwelling-1536.webp`（393,544 bytes） |
| 冬 · 踏雪寻梅 | `winter-plum-640.webp`（18,472 bytes） | `winter-plum-1536.webp`（173,020 bytes） |

横卷独立于画册配置；桌面使用 1280 / 1920 响应式资源，手机使用右侧亭松的方形裁切。预加载与 picture 使用相同的媒体条件，避免同时下载两套横卷。三幅精选先显示 640px 缩略图，展卷后才请求 1536px 完整构图；其余十幅保留原有 SVG。

WebP 使用项目的 sharp 编码：横卷质量 78，缩略图质量 76，大图质量 84，effort 6。PNG 原稿保存在本机 `.cache/artwork-sources/`，不进入站点构建；正式 WebP 已进入项目源码。

## 最终生成提示词

### hero-autumn-scroll

```text
Use case: historical-scene. Asset type: finished website hero painting for a Song dynasty inspired literary blog. Create a sophisticated original Chinese Song-style ink and light mineral pigment landscape painting on warm ivory silk, panoramic composition approximately 3:1. Misty autumn mountains, slender pines, quiet river and a tiny pavilion, muted celadon, warm grey ink and restrained russet accents. Mountain and pavilion details occupy the RIGHT two thirds; LEFT third is open ivory mist for existing website text overlay. The scene must still feel composed when cropped to the center/right on a phone. Delicate layered brushwork, rich subtle detail, refined museum-quality contemporary homage, flat scanned artwork edge to edge. No border, no frame, no writing, no seals, no lettering, no watermark, no UI. Output wide landscape.
```

### spring-peach-stream

```text
Use case: historical-scene. Asset type: finished featured gallery painting for a Song dynasty inspired literary blog, title Spring peach blossom stream (no text in image). Create an original refined Chinese ink and light mineral pigment painting on warm ivory silk. A stream curves below a delicate flowering peach tree, light pink blossoms, mossy rocks and distant mist. Harmonious muted celadon, warm grey ink and a few soft coral blossoms. Horizontal landscape approximately 3:2, the main tree, blossoms and river form a beautiful central band that survives a wide thumbnail crop, with complete balanced composition visible on opening. Museum-quality fine brushwork, quiet abundant negative space, flat scanned artwork edge to edge. No border, no frame, no writing, no seals, no lettering, no watermark, no UI. Coordinate visually with Song autumn landscape and winter plum paintings.
```

### mountain-dwelling

```text
Use case: historical-scene. Asset type: finished featured gallery painting for a Song dynasty inspired literary blog, title Quiet mountain dwelling (no text in image). Create an original refined Chinese ink and light mineral pigment painting on warm ivory silk. Layered misty mountain slopes, a modest secluded pavilion beneath elegant pine trees, a narrow stream and rocky bank. Harmonious muted celadon and sage, warm grey ink and very restrained russet. Horizontal landscape approximately 3:2, place the dwelling and main pine across the middle band so both remain visible in a wide thumbnail crop, with a rich balanced complete composition on opening. Museum-quality delicate brushwork, breathing space and atmospheric distance, flat scanned artwork edge to edge. No border, no frame, no writing, no seals, no lettering, no watermark, no UI. Coordinate visually with a Song peach blossom stream and winter plum painting.
```

### winter-plum

```text
Use case: historical-scene. Asset type: finished featured gallery painting for a Song dynasty inspired literary blog, title Winter plum in snow (no text in image). Create an original refined Chinese Song-style ink and light mineral pigment painting on warm ivory silk. A twisting elegant dark plum branch bearing a few pale red blossoms above snow dusted stones, distant bare slopes dissolve into mist. Harmonious warm ivory, warm grey ink, extremely pale celadon and restrained cinnabar pink blossoms. Horizontal landscape approximately 3:2, center the branch and blossoms in a central band that remains attractive when cropped to a wide gallery thumbnail, while the full image is a balanced complete painting. Museum-quality delicate brushwork, quiet and spacious, flat scanned artwork edge to edge. No border, no frame, no writing, no seals, no lettering, no watermark, no UI. Coordinate visually with a Song peach blossom stream and mountain dwelling painting.
```
