import artwork0 from '../assets/artwork/generated/spring-peach-stream-640.webp?url'
import springFull from '../assets/artwork/generated/spring-peach-stream-1536.webp?url'
import artwork1 from '../assets/artwork/summer.svg?url'
import artwork2 from '../assets/artwork/autumn.svg?url'
import artwork3 from '../assets/artwork/generated/winter-plum-640.webp?url'
import winterFull from '../assets/artwork/generated/winter-plum-1536.webp?url'
import artwork4 from '../assets/artwork/bamboo-stone.svg?url'
import artwork5 from '../assets/artwork/peach-blossom.svg?url'
import artwork6 from '../assets/artwork/generated/mountain-dwelling-640.webp?url'
import mountainFull from '../assets/artwork/generated/mountain-dwelling-1536.webp?url'
import artwork7 from '../assets/artwork/lotus.svg?url'
import artwork8 from '../assets/artwork/pine.svg?url'
import artwork9 from '../assets/artwork/courtyard.svg?url'
import artwork10 from '../assets/artwork/autumn-mountain.svg?url'
import artwork11 from '../assets/artwork/plum.svg?url'
import artwork12 from '../assets/artwork/cranes.svg?url'

export interface HomeGalleryItem {
  src: string
  alt: string
  width: number
  height: number
  fullSrc?: string
  fullWidth?: number
  fullHeight?: number
}

export interface HomeGallerySeasonItem extends HomeGalleryItem {
  label: string
}

export const homeGallerySeasons: HomeGallerySeasonItem[] = [
  { src: artwork0, alt: "春 · 桃花流水", width: 640, height: 427, fullSrc: springFull, fullWidth: 1536, fullHeight: 1024, label: "春" },
  { src: artwork1, alt: "夏 · 荷塘清趣", width: 600, height: 800, label: "夏" },
  { src: artwork2, alt: "秋 · 枫叶如丹", width: 600, height: 800, label: "秋" },
  { src: artwork3, alt: "冬 · 踏雪寻梅", width: 640, height: 427, fullSrc: winterFull, fullWidth: 1536, fullHeight: 1024, label: "冬" },
]

export const homeGalleryItems: HomeGalleryItem[] = [
  { src: artwork4, alt: "竹石清趣", width: 600, height: 800 },
  { src: artwork5, alt: "桃花流水鳜鱼肥", width: 600, height: 400 },
  { src: artwork6, alt: "山居秋暝", width: 640, height: 427, fullSrc: mountainFull, fullWidth: 1536, fullHeight: 1024 },
  { src: artwork7, alt: "出水芙蓉", width: 600, height: 500 },
  { src: artwork8, alt: "松下问童子", width: 600, height: 900 },
  { src: artwork9, alt: "艮岳一隅", width: 600, height: 600 },
  { src: artwork10, alt: "秋山晚翠", width: 600, height: 450 },
  { src: artwork11, alt: "寒梅傲雪", width: 600, height: 750 },
  { src: artwork12, alt: "瑞鹤呈祥", width: 600, height: 550 },
]
