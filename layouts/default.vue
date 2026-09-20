<script setup lang="ts">
/**
 * Application shell.
 *
 * Mirrors the reference's `BaseLayout.vue`: a header, the routed content and a
 * footer inside a flex column that keeps the footer at the bottom of short pages,
 * with the loader curtain mounted above everything while the site settles.
 *
 * The smooth-scroll controller is owned here so exactly one instance exists for
 * the whole app.
 */
useSmoothScroll()
</script>

<template>
  <div class="app-shell">
    <a class="skip-link" href="#main">Skip to content</a>

    <SiteHeader />
    <SideRails />

    <main class="app-main">
      <slot />
    </main>

    <SiteFooter />
    <SiteLoader />

    <!-- Teleported to <body>, so it overlays the shell regardless of stacking. -->
    <RequestModal />
  </div>
</template>

<style scoped lang="scss">
.app-main {
  display: block;
}
</style>
