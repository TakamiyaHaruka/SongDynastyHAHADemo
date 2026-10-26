import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import expressiveCode from 'astro-expressive-code'
import sitemap from '@astrojs/sitemap'
import siteFonts from './integrations/site-fonts.mjs'
import { prepareMusicCards } from './src/lib/music-cache.ts'
import { homeMusicAppleLinks } from './src/data/home-music.ts'

export default defineConfig({
  site: 'https://TakamiyaHaruka.github.io',
  base: '/SongDynastyHAHADemo',
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  image: {
    layout: 'constrained',
    responsiveStyles: false,
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Keep lazy SVGs and Unicode font subsets independently cacheable.
      assetsInlineLimit: (file) => /\.(?:svg|woff2)$/.test(file) ? false : undefined,
    },
  },
  integrations: [
    siteFonts({ prepareMetadata: root => prepareMusicCards(homeMusicAppleLinks, { root }) }),
    expressiveCode({
      themes: ['one-dark-pro'],
    }),
    sitemap(),
  ],
})
