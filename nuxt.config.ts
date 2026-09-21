import { fileURLToPath } from 'node:url'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },

  /**
   * `experimental.appManifest` is switched off.
   *
   * ## Why
   *
   * With it on (the Nuxt default), a cold `nuxt dev` can print, several times:
   *
   * ```
   * ERROR  Pre-transform error: Failed to resolve import "#app-manifest"
   *        from "node_modules/nuxt/dist/app/composables/manifest.js?v=…"
   * Plugin: vite:import-analysis
   * ```
   *
   * That is an upstream race, not a problem with this project. The chain:
   *
   * 1. `nuxt/dist/app/plugins/router.js` imports `getRouteRules` from
   *    `composables/manifest.js`, so that module is always in the client graph.
   * 2. `manifest.js` contains a **server-only** dynamic import —
   *    `if (import.meta.server) { import("#app-manifest") }`. For the client
   *    build Vite replaces `import.meta.server` with `false`, leaving
   *    `if (false) { import("#app-manifest") }`. The branch is dead code and
   *    never runs.
   * 3. Vite's `vite:import-analysis` statically scans the `import()` argument
   *    anyway and tries to *resolve* it. `#app-manifest` is a virtual module
   *    that Nitro registers later in the build, and on the client it is meant to
   *    be satisfied by Nuxt's `nuxt:client:aliases` plugin, which is attached per
   *    environment. On a cold start the resolution can run before that alias is
   *    in place, so it fails and is reported as a pre-transform error.
   *
   * Tracked upstream as nuxt/nuxt#33606 (closed, with a minimal reproduction).
   * Adding a Vite `@vite-ignore` hint does not help — the failing step is
   * resolution, not the import-analysis hint. Nuxt 3.21.11 is still affected and
   * is the latest 3.x, so there is no release to upgrade to, and patching
   * `node_modules` is not an option.
   *
   * ## Why it is safe here
   *
   * The app manifest only serves two things: **client-side route rules** and
   * **loading prerendered payloads**. This site declares no `routeRules`, is not
   * prerendered, and ships a single page — so the feature is inert, and the
   * imports it generates are dead weight in the client bundle either way. The
   * error is log noise on a code path this site never executes.
   *
   * ## Removing this
   *
   * Drop the block once Nuxt resolves the race (check nuxt/nuxt#33606), or before
   * this project adds `routeRules` or prerendering — at that point the manifest
   * becomes load-bearing and must be switched back on.
   */
  experimental: {
    appManifest: false
  },

  modules: [],

  // Keep component names flat (<SiteHeader>, not <LayoutSiteHeader>) so the
  // components/ subdirectories stay organisational rather than name-bearing.
  components: [{ path: '~/components', pathPrefix: false }],

  css: [
    // Self-hosted fonts — no runtime network dependency.
    // Only the `latin` subsets of the display face are loaded: its only content
    // is English, and Trirong also ships thai / latin-ext / vietnamese subsets
    // that would otherwise add ~100 KB for nothing.
    '@fontsource/montserrat/300.css',
    '@fontsource/montserrat/400.css',
    '@fontsource/montserrat/500.css',
    '@fontsource/montserrat/600.css',
    '@fontsource/trirong/latin-400.css',
    '@fontsource/trirong/latin-700.css',
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
      title: 'Thoriqo Salafu Sholihin — IT Support Specialist & Network Engineer',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#fafafa' },
        {
          name: 'description',
          content:
            'IT Support Specialist and Network Engineer based in Jakarta, Indonesia — end-user support, network infrastructure and operational administration.'
        },
        { name: 'robots', content: 'index, follow' },
        {
          property: 'og:title',
          content: 'Thoriqo Salafu Sholihin — IT Support Specialist & Network Engineer'
        },
        {
          property: 'og:description',
          content:
            'End-user support, network infrastructure and operational administration, based in Jakarta, Indonesia.'
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
