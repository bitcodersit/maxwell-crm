// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    'nuxt-auth-utils',
  ],
  colorMode: {
    storage: 'cookie',
  },
  tailwindcss: {
    config: {
      darkMode: 'class',
    },
  },
})