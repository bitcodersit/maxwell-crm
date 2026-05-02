// https://nuxt.com/docs/api/configuration/nuxt-config
import vue from '@vitejs/plugin-vue'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  css: ['~/assets/css/main.css'],
  modules: ['@nuxt/eslint', '@nuxt/ui', '@vueuse/nuxt', 'nuxt-auth-utils', '@nuxt/image'],
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'icon', type: 'image/png', href: '/favicon-192.png', sizes: '192x192' },
      ],
    },
  },
  devtools: {
    enabled: true,
  },
  colorMode: {
    storage: 'cookie',
  },
  routeRules: {
    '/api/**': {
      cors: true,
    },
  },
  nitro: {
    rollupConfig: {
      plugins: [vue()],
    },
    experimental: {
      openAPI: true,
    },
  },
  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'date-fns',
        '@internationalized/date',
        '@unovis/vue',
      ],
    },
  },
  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs',
      },
    },
  },
})
