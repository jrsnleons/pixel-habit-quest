import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

// BASE_PATH is set by the GitHub Pages workflow (e.g. /pixel-habit-quest/).
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Pixel Habit Quest',
        short_name: 'Habit Quest',
        description: 'A cozy habit tracker where your pixel pet thrives when you keep your habits.',
        theme_color: '#fdf3ec',
        background_color: '#fdf3ec',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: `${base}index.html`,
        // Never cache Supabase API calls; progress must come from the server.
        navigateFallbackDenylist: [/^\/auth/, /^\/rest/],
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
  },
})
