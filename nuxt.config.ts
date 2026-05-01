// https://nuxt.com/docs/api/configuration/nuxt-config
import vue from '@vitejs/plugin-vue'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  modules: [
    '@nuxt/ui',
    'nuxt-auth-utils',
  ],
  colorMode: {
    storage: 'cookie',
  },
  vite:{
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
      ]
    }
  },
  nitro: {
    rollupConfig: {
      plugins: [vue()],
    },
  },
})