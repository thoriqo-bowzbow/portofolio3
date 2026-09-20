import { fileURLToPath } from 'node:url'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },

  modules: [],

  // Keep component names flat (<SiteHeader>, not <LayoutSiteHeader>) so the
  // components/ subdirectories stay organisational rather than name-bearing.
  components: [{ path: '~/components', pathPrefix: false }],

  css: [
    // Self-hosted fonts — no runtime network dependency
    '@fontsource/montserrat/300.css',
    '@fontsource/montserrat/400.css',
    '@fontsource/montserrat/500.css',
    '@fontsource/montserrat/600.css',
    '@fontsource-variable/playfair-display/index.css',
    '~/assets/styles/main.scss'
  ],

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          // Vite 7 already uses the Sass modern compiler; `api` is no longer a
          // valid option. `loadPaths` lets every SFC resolve the bare "tokens"
          // and "mixins" modules injected below.
          //
          // Every SFC <style lang="scss"> block gets the design tokens and mixins
          // so components never import them by hand. Partials under
          // assets/styles @use them explicitly, because Sass resolves those
          // itself and never sees this injection.
          additionalData: '@use "tokens" as *; @use "mixins" as *;',
          loadPaths: [fileURLToPath(new URL('./assets/styles', import.meta.url))]
        }
      }
    }
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Kamran Yusupov — Frontend Engineer',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#fafafa' },
        {
          name: 'description',
          content:
            'Frontend engineer building interfaces where type, spacing and motion agree with each other. Design systems, performance and the details nobody notices when they are right.'
        },
        { name: 'robots', content: 'index, follow' },
        { property: 'og:title', content: 'Kamran Yusupov — Frontend Engineer' },
        {
          property: 'og:description',
          content:
            'Design systems, performance and the details nobody notices when they are right.'
        },
        { property: 'og:type', content: 'website' }
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]
    },
    pageTransition: false
  },

  nitro: {
    compressPublicAssets: true,
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },
})
