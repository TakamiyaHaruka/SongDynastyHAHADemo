import hero1280 from '../assets/artwork/generated/hero-autumn-scroll-1280.webp?url'
import hero1920 from '../assets/artwork/generated/hero-autumn-scroll-1920.webp?url'
import heroMobile from '../assets/artwork/generated/hero-autumn-scroll-mobile.webp?url'

// An independent 3:1 scroll with a separate crop for narrow screens.
export const homeHeroArtwork = {
  src: hero1280,
  srcSet: `${hero1280} 1280w, ${hero1920} 1920w`,
  sizes: '(min-width: 1200px) 1136px, 100vw',
  mobileSrc: heroMobile,
  width: 1920,
  height: 640,
  alt: '秋山晚翠，远山烟水间，松枝掩映着一座临水小亭',
  title: '秋山晚翠',
  position: 'center',
}
