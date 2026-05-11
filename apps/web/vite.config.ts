import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

import ui from '@nuxt/ui/vite'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    ui({
      ui: {
        colors: {
          primary: 'emerald',
          neutral: 'slate',
        },
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Reparte',
        short_name: 'Reparte',
        description: 'Divisor de contas de supermercado via NFC-e',
        theme_color: '#10b981',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: { cacheName: 'images', expiration: { maxEntries: 50 } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@reparte/types': fileURLToPath(
        new URL('../../packages/types/src/index.ts', import.meta.url),
      ),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
