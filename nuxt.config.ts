// https://nuxt.com/docs/api/configuration/nuxt-config
import vue from '@vitejs/plugin-vue'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  runtimeConfig: {
    storageUrl: '', // NUXT_STORAGE_URL
    emailCronSecret: '', // NUXT_EMAIL_CRON_SECRET
    public: {
      siteUrl: '', // NUXT_PUBLIC_SITE_URL
    },
  },
  devServer: {
    port: 5173,
  },
  css: ['~/assets/css/main.css'],
  modules: ['@nuxt/eslint', '@nuxt/ui', '@vueuse/nuxt', 'nuxt-auth-utils', '@nuxt/image', 'nuxt-cron'],
  image: {
    format: ['webp'],
  },
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
  cron: {
    runOnInit: true,
    jobsDir: 'cron',
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
