import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import expressiveCode from 'astro-expressive-code'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://TakamiyaHaruka.github.io',
  base: '/SongDynastyHAHADemo',
  prefetch: {
    defaultStrategy: 'hover',
  },
  image: {
    layout: 'constrained',
    responsiveStyles: false,
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    expressiveCode({
      themes: ['one-dark-pro'],
    }),
    sitemap(),
  ],
})
