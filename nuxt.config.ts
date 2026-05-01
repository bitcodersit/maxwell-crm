// https://nuxt.com/docs/api/configuration/nuxt-config
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/tailwind.css'],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        'clsx',
        'reka-ui',
        '@vueuse/core',
        'tailwind-merge',
        '@vue/devtools-kit',
        '@vue/devtools-core',
        'class-variance-authority',
      ],
    },
  },
  modules: ['@nuxtjs/color-mode', 'nuxt-auth-utils', 'shadcn-nuxt'],
  colorMode: {
    storage: 'cookie',
  },
  nitro: {
    rollupConfig: {
      plugins: [vue()],
    },
  },
  shadcn: {
    /**
     * Prefix for all the imported component.
     * @default "Ui"
     */
    prefix: 'Ui',
    /**
     * Directory that the component lives in.
     * Will respect the Nuxt aliases.
     * @link https://nuxt.com/docs/api/nuxt-config#alias
     * @default "@/components/ui"
     */
    componentDir: '@/components/ui',
  },
})
