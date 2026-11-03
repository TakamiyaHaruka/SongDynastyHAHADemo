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

横卷独立于画册配置；桌面使用 1280 / 1920 响应式资源，手机使用右侧亭松的方形裁切。预加载与 picture 使用相同的媒体条件，避免同时下载两套横卷。第一批先完成三幅精选的 640px 缩略图与 1536px 完整构图；其余十幅的制作记录见本文件第二批说明。

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


## 第二批：完成其余十幅画册

2026-11-03 使用内置 image_gen 工具继续生成十幅原创插画，全部与第一批采用同一绢本、水墨淡彩风格。所有最终素材已放入项目；画册十三幅现在全部使用 WebP 缩略图和独立完整大图。

展开画册的缩略图统一采用 3:2 画幅，完整大图保留同样比例；640px 缩略图使用质量 76，1536px 大图使用质量 84，均为 sharp WebP effort 6。未展开时不请求这十幅缩略图，完整大图仍只在展卷时加载。

| 画作 | 文件前缀 | 640px 缩略图 | 1536px 完整图 |
| --- | --- | ---: | ---: |
| 夏 · 荷塘清趣 | `summer-lotus` | 17,998 bytes | 210,488 bytes |
| 秋 · 枫叶如丹 | `autumn-maple` | 40,958 bytes | 382,222 bytes |
| 竹石清趣 | `bamboo-stone` | 21,380 bytes | 223,040 bytes |
| 桃花流水鳜鱼肥 | `peach-blossom-fish` | 24,460 bytes | 253,468 bytes |
| 出水芙蓉 | `lotus-bloom` | 9,906 bytes | 180,314 bytes |
| 松下问童子 | `pine-scholar` | 41,210 bytes | 411,934 bytes |
| 艮岳一隅 | `imperial-courtyard` | 52,966 bytes | 445,040 bytes |
| 秋山晚翠 | `autumn-mountain` | 28,158 bytes | 297,360 bytes |
| 寒梅傲雪 | `plum-branch` | 22,640 bytes | 194,116 bytes |
| 瑞鹤呈祥 | `auspicious-cranes` | 28,552 bytes | 262,416 bytes |

文件均位于 `src/assets/artwork/generated/<文件前缀>-640.webp` 与 `<文件前缀>-1536.webp`；PNG 原稿留在 `.cache/artwork-sources/<文件前缀>.png`。

### 第二批最终提示词

#### summer-lotus

```text
Use case: historical-scene. Asset type: finished original gallery painting for a Song-inspired literary website, coordinated with refined Song-style ink and light mineral pigment artworks on warm ivory silk. Primary request: A tranquil summer lotus pond: elegant broad lotus leaves, three pale pink blossoms, slender reeds and quiet water ripples; distant shore dissolves into mist. Cool sage and celadon with restrained pink. Style/medium: museum-quality contemporary homage, delicate ink brushwork and precise fine lines, subtle aged silk texture, harmonious muted celadon, sage, warm grey and restrained mineral pigments. Composition: horizontal landscape about 3:2, a single complete balanced painting, key subject concentrated in the central area; quiet breathing space. Flat scanned artwork edge to edge. Text: none. Constraints: no writing, no calligraphy, no seals, no lettering, no borders, no frame, no watermark, no collage, no UI. Keep subjects distinct from the other paintings while maintaining the same material and understated palette.
```

#### autumn-maple

```text
Use case: historical-scene. Asset type: finished original gallery painting for a Song-inspired literary website, coordinated with refined Song-style ink and light mineral pigment artworks on warm ivory silk. Primary request: A delicate maple tree with russet-red leaves leaning above a quiet autumn stream, a low stone bank and misty mountains. Restrained vermilion foliage, muted ochre and grey-green ink. Style/medium: museum-quality contemporary homage, delicate ink brushwork and precise fine lines, subtle aged silk texture, harmonious muted celadon, sage, warm grey and restrained mineral pigments. Composition: horizontal landscape about 3:2, a single complete balanced painting, key subject concentrated in the central area; quiet breathing space. Flat scanned artwork edge to edge. Text: none. Constraints: no writing, no calligraphy, no seals, no lettering, no borders, no frame, no watermark, no collage, no UI. Keep subjects distinct from the other paintings while maintaining the same material and understated palette.
```

#### bamboo-stone

```text
Use case: historical-scene. Asset type: finished original gallery painting for a Song-inspired literary website, coordinated with refined Song-style ink and light mineral pigment artworks on warm ivory silk. Primary request: A refined cluster of slender bamboo stalks and gracefully varied leaves growing beside a weathered scholar's rock, with empty silk around them and faint ground moss. Grey-green bamboo and warm grey ink, elegant natural asymmetry. Style/medium: museum-quality contemporary homage, delicate ink brushwork and precise fine lines, subtle aged silk texture, harmonious muted celadon, sage, warm grey and restrained mineral pigments. Composition: horizontal landscape about 3:2, a single complete balanced painting, key subject concentrated in the central area; quiet breathing space. Flat scanned artwork edge to edge. Text: none. Constraints: no writing, no calligraphy, no seals, no lettering, no borders, no frame, no watermark, no collage, no UI. Keep subjects distinct from the other paintings while maintaining the same material and understated palette.
```

#### peach-blossom-fish

```text
Use case: historical-scene. Asset type: finished original gallery painting for a Song-inspired literary website, coordinated with refined Song-style ink and light mineral pigment artworks on warm ivory silk. Primary request: A flowering peach branch over clear shallow stream water, drifting pale pink petals, underwater rocks and two natural mandarin fish subtly visible beneath ripples. Peach blossoms are delicate accents; fish have authentic organic silhouettes. Style/medium: museum-quality contemporary homage, delicate ink brushwork and precise fine lines, subtle aged silk texture, harmonious muted celadon, sage, warm grey and restrained mineral pigments. Composition: horizontal landscape about 3:2, a single complete balanced painting, key subject concentrated in the central area; quiet breathing space. Flat scanned artwork edge to edge. Text: none. Constraints: no writing, no calligraphy, no seals, no lettering, no borders, no frame, no watermark, no collage, no UI. Keep subjects distinct from the other paintings while maintaining the same material and understated palette.
```

#### lotus-bloom

```text
Use case: historical-scene. Asset type: finished original gallery painting for a Song-inspired literary website, coordinated with refined Song-style ink and light mineral pigment artworks on warm ivory silk. Primary request: An intimate elegant botanical lotus study: one fresh pale pink lotus flower above a softly curved stem, a seedpod and a single large sage leaf beside still water. Fine precise petals and veins, spacious negative space, refined rather than lush. Style/medium: museum-quality contemporary homage, delicate ink brushwork and precise fine lines, subtle aged silk texture, harmonious muted celadon, sage, warm grey and restrained mineral pigments. Composition: horizontal landscape about 3:2, a single complete balanced painting, key subject concentrated in the central area; quiet breathing space. Flat scanned artwork edge to edge. Text: none. Constraints: no writing, no calligraphy, no seals, no lettering, no borders, no frame, no watermark, no collage, no UI. Keep subjects distinct from the other paintings while maintaining the same material and understated palette.
```

#### pine-scholar

```text
Use case: historical-scene. Asset type: finished original gallery painting for a Song-inspired literary website, coordinated with refined Song-style ink and light mineral pigment artworks on warm ivory silk. Primary request: A poetic mountain scene with a broad ancient pine, beneath it a tiny traditionally dressed scholar conversing with a young attendant, a winding stone path disappearing into mist. The figures are small brush-painted accents inside the landscape, no close-up faces. Style/medium: museum-quality contemporary homage, delicate ink brushwork and precise fine lines, subtle aged silk texture, harmonious muted celadon, sage, warm grey and restrained mineral pigments. Composition: horizontal landscape about 3:2, a single complete balanced painting, key subject concentrated in the central area; quiet breathing space. Flat scanned artwork edge to edge. Text: none. Constraints: no writing, no calligraphy, no seals, no lettering, no borders, no frame, no watermark, no collage, no UI. Keep subjects distinct from the other paintings while maintaining the same material and understated palette.
```

#### imperial-courtyard

```text
Use case: historical-scene. Asset type: finished original gallery painting for a Song-inspired literary website, coordinated with refined Song-style ink and light mineral pigment artworks on warm ivory silk. Primary request: A quiet corner of a Song-inspired imperial garden: modest timber pavilion with an elegant tiled roof, natural Taihu rocks, a small reflective pond, willow branches and a winding path. Restrained historic architecture integrated into nature, no monumental palace. Style/medium: museum-quality contemporary homage, delicate ink brushwork and precise fine lines, subtle aged silk texture, harmonious muted celadon, sage, warm grey and restrained mineral pigments. Composition: horizontal landscape about 3:2, a single complete balanced painting, key subject concentrated in the central area; quiet breathing space. Flat scanned artwork edge to edge. Text: none. Constraints: no writing, no calligraphy, no seals, no lettering, no borders, no frame, no watermark, no collage, no UI. Keep subjects distinct from the other paintings while maintaining the same material and understated palette.
```

#### autumn-mountain

```text
Use case: historical-scene. Asset type: finished original gallery painting for a Song-inspired literary website, coordinated with refined Song-style ink and light mineral pigment artworks on warm ivory silk. Primary request: Distant layered autumn mountains across an open lake, a few russet trees along a rocky near shore, fine dark pines and a tiny far-off roof amid mist. Spacious evening atmosphere and pale celadon peaks, distinct from a foreground pavilion composition. Style/medium: museum-quality contemporary homage, delicate ink brushwork and precise fine lines, subtle aged silk texture, harmonious muted celadon, sage, warm grey and restrained mineral pigments. Composition: horizontal landscape about 3:2, a single complete balanced painting, key subject concentrated in the central area; quiet breathing space. Flat scanned artwork edge to edge. Text: none. Constraints: no writing, no calligraphy, no seals, no lettering, no borders, no frame, no watermark, no collage, no UI. Keep subjects distinct from the other paintings while maintaining the same material and understated palette.
```

#### plum-branch

```text
Use case: historical-scene. Asset type: finished original gallery painting for a Song-inspired literary website, coordinated with refined Song-style ink and light mineral pigment artworks on warm ivory silk. Primary request: An elegant close study of dark gnarled plum branches with sparse white and muted cinnabar blossoms and a light dusting of snow, above weathered rocks. A diagonal branch creates quiet strength; delicate stamens and restrained brushwork, spacious mist. Style/medium: museum-quality contemporary homage, delicate ink brushwork and precise fine lines, subtle aged silk texture, harmonious muted celadon, sage, warm grey and restrained mineral pigments. Composition: horizontal landscape about 3:2, a single complete balanced painting, key subject concentrated in the central area; quiet breathing space. Flat scanned artwork edge to edge. Text: none. Constraints: no writing, no calligraphy, no seals, no lettering, no borders, no frame, no watermark, no collage, no UI. Keep subjects distinct from the other paintings while maintaining the same material and understated palette.
```

#### auspicious-cranes

```text
Use case: historical-scene. Asset type: finished original gallery painting for a Song-inspired literary website, coordinated with refined Song-style ink and light mineral pigment artworks on warm ivory silk. Primary request: Three graceful red-crowned cranes: two standing beside a pine and natural rocks at the water's edge, a third gliding across a spacious pale sky above. Anatomically coherent slender legs, long necks and black wing feathers, tiny restrained red crown accents. No heraldic symbols. Style/medium: museum-quality contemporary homage, delicate ink brushwork and precise fine lines, subtle aged silk texture, harmonious muted celadon, sage, warm grey and restrained mineral pigments. Composition: horizontal landscape about 3:2, a single complete balanced painting, key subject concentrated in the central area; quiet breathing space. Flat scanned artwork edge to edge. Text: none. Constraints: no writing, no calligraphy, no seals, no lettering, no borders, no frame, no watermark, no collage, no UI. Keep subjects distinct from the other paintings while maintaining the same material and understated palette.
```
