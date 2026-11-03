import springThumbnail from '../assets/artwork/generated/spring-peach-stream-640.webp?url'
import springFull from '../assets/artwork/generated/spring-peach-stream-1536.webp?url'
import summerThumbnail from '../assets/artwork/generated/summer-lotus-640.webp?url'
import summerFull from '../assets/artwork/generated/summer-lotus-1536.webp?url'
import autumnThumbnail from '../assets/artwork/generated/autumn-maple-640.webp?url'
import autumnFull from '../assets/artwork/generated/autumn-maple-1536.webp?url'
import winterThumbnail from '../assets/artwork/generated/winter-plum-640.webp?url'
import winterFull from '../assets/artwork/generated/winter-plum-1536.webp?url'
import bambooThumbnail from '../assets/artwork/generated/bamboo-stone-640.webp?url'
import bambooFull from '../assets/artwork/generated/bamboo-stone-1536.webp?url'
import peachThumbnail from '../assets/artwork/generated/peach-blossom-fish-640.webp?url'
import peachFull from '../assets/artwork/generated/peach-blossom-fish-1536.webp?url'
import mountainThumbnail from '../assets/artwork/generated/mountain-dwelling-640.webp?url'
import mountainFull from '../assets/artwork/generated/mountain-dwelling-1536.webp?url'
import lotusThumbnail from '../assets/artwork/generated/lotus-bloom-640.webp?url'
import lotusFull from '../assets/artwork/generated/lotus-bloom-1536.webp?url'
import pineThumbnail from '../assets/artwork/generated/pine-scholar-640.webp?url'
import pineFull from '../assets/artwork/generated/pine-scholar-1536.webp?url'
import courtyardThumbnail from '../assets/artwork/generated/imperial-courtyard-640.webp?url'
import courtyardFull from '../assets/artwork/generated/imperial-courtyard-1536.webp?url'
import autumnMountainThumbnail from '../assets/artwork/generated/autumn-mountain-640.webp?url'
import autumnMountainFull from '../assets/artwork/generated/autumn-mountain-1536.webp?url'
import plumThumbnail from '../assets/artwork/generated/plum-branch-640.webp?url'
import plumFull from '../assets/artwork/generated/plum-branch-1536.webp?url'
import cranesThumbnail from '../assets/artwork/generated/auspicious-cranes-640.webp?url'
import cranesFull from '../assets/artwork/generated/auspicious-cranes-1536.webp?url'

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

const painting = (src: string, fullSrc: string, alt: string): HomeGalleryItem => ({
  src, fullSrc, alt, width: 640, height: 427, fullWidth: 1536, fullHeight: 1024,
})

export const homeGallerySeasons: HomeGallerySeasonItem[] = [
  { ...painting(springThumbnail, springFull, '春 · 桃花流水'), label: '春' },
  { ...painting(summerThumbnail, summerFull, '夏 · 荷塘清趣'), label: '夏' },
  { ...painting(autumnThumbnail, autumnFull, '秋 · 枫叶如丹'), label: '秋' },
  { ...painting(winterThumbnail, winterFull, '冬 · 踏雪寻梅'), label: '冬' },
]

export const homeGalleryItems: HomeGalleryItem[] = [
  painting(bambooThumbnail, bambooFull, '竹石清趣'),
  painting(peachThumbnail, peachFull, '桃花流水鳜鱼肥'),
  painting(mountainThumbnail, mountainFull, '山居秋暝'),
  painting(lotusThumbnail, lotusFull, '出水芙蓉'),
  painting(pineThumbnail, pineFull, '松下问童子'),
  painting(courtyardThumbnail, courtyardFull, '艮岳一隅'),
  painting(autumnMountainThumbnail, autumnMountainFull, '秋山晚翠'),
  painting(plumThumbnail, plumFull, '寒梅傲雪'),
  painting(cranesThumbnail, cranesFull, '瑞鹤呈祥'),
]
