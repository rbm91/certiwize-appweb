import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VueI18nPlugin({
      include: resolve(dirname(fileURLToPath(import.meta.url)), './src/locales/**'),
      strictMessage: false,
      escapeHtml: false
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8788',
        changeOrigin: true,
      }
    }
  },
  build: {
    // Cibler Safari 14+ pour compatibilité JS iOS/macOS
    target: ['es2020', 'safari14'],
    rollupOptions: {
      output: {
        // Code-splitting pour réduire le bundle principal
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', 'pinia', 'vue-i18n'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
  // Configuration pour Vitest
  test: {
    environment: 'jsdom',
    globals: true,
  },
  css: {
    // Utiliser Lightning CSS pour convertir les fonctions CSS modernes
    // (oklch → rgb pour Safari < 15.4)
    transformer: 'lightningcss',
    lightningcss: {
      // Safari 14.0 = (14 << 16) | (0 << 8) = 917504
      targets: {
        safari: (14 << 16),
        ios_saf: (14 << 16),
      },
    },
  },
})
