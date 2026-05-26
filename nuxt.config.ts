// https://nuxt.com/docs/api/configuration/nuxt-config
import vue from '@vitejs/plugin-vue'

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    'nuxt-auth-utils',
    '@nuxt/image',
    'nuxt-cron',
    '@peterbud/nuxt-query',
    'nuxt-easy-lightbox'
  ],
  components: [
    {
      path: '~/components',
      pathPrefix: false
    }
  ],
  devtools: {
    enabled: true
  },
  app: {
    head: {
      link: [
        {
          rel: 'icon',
          type: 'image/png',
          href: '/favicon.png'
        },
        {
          rel: 'icon',
          type: 'image/png',
          href: '/favicon-192.png',
          sizes: '192x192'
        }
      ]
    }
  },
  css: ['~/assets/css/main.css'],
  colorMode: {
    storage: 'cookie'
  },
  runtimeConfig: {
    storageUrl: '', // NUXT_STORAGE_URL
    emailCronSecret: '', // NUXT_EMAIL_CRON_SECRET
    public: {
      siteUrl: '' // NUXT_PUBLIC_SITE_URL
    }
  },
  routeRules: {
    '/api/**': {
      cors: true
    }
  },
  devServer: {
    port: 5173
  },
  compatibilityDate: '2025-07-15',
  nitro: {
    rollupConfig: {
      plugins: [vue()]
    },
    experimental: {
      openAPI: true
    }
  },
  vite: {
    optimizeDeps: {
      include: [
        '@internationalized/date',
        '@nuxt/ui > prosemirror-gapcursor',
        '@nuxt/ui > prosemirror-model',
        '@nuxt/ui > prosemirror-state',
        '@nuxt/ui > prosemirror-transform',
        '@nuxt/ui > prosemirror-view',
        '@unovis/vue',
        '@vue/devtools-core',
        '@vue/devtools-kit',
        '@vueuse/integrations/useSortable',
        'date-fns',
        'zod'
      ]
    }
  },
  cron: {
    runOnInit: true,
    jobsDir: 'cron'
  },
  eslint: {
    config: {
      standalone: true,
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },
  image: {
    format: ['webp']
  },
  nuxtQuery: {
    autoImports: true
  }
})
