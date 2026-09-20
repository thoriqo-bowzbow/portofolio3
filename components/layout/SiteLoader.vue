<script setup lang="ts">
/**
 * Site loader curtain.
 *
 * Five 20%-wide columns drop from above with a staggered duration increasing
 * left→right, alternating two near-white tones, then the whole field fades
 * (RECON §9.2). Transcribed from the reference's `compSiteloader.vue` keyframes.
 */
const { isReady, isLoaderVisible } = useSiteReady()

/** Minimum time the curtain is held, so fast loads do not flash. */
const MIN_VISIBLE_MS = 1400
const FADE_MS = 1000

const startedAt = ref(0)
const isFading = ref(false)
let timers: Array<ReturnType<typeof setTimeout>> = []

const dismiss = () => {
  const elapsed = Date.now() - startedAt.value
  const wait = Math.max(0, MIN_VISIBLE_MS - elapsed)

  timers.push(
    setTimeout(() => {
      isFading.value = true
      timers.push(
        setTimeout(() => {
          isLoaderVisible.value = false
          isReady.value = true
        }, FADE_MS)
      )
    }, wait)
  )
}

onMounted(() => {
  startedAt.value = Date.now()

  if (document.readyState === 'complete') {
    dismiss()
    return
  }

  window.addEventListener('load', dismiss, { once: true })
  // Guards against a stalled subresource holding the curtain indefinitely
  timers.push(setTimeout(dismiss, 4000))
})

onBeforeUnmount(() => {
  window.removeEventListener('load', dismiss)
  timers.forEach(clearTimeout)
  timers = []
})
</script>

<template>
  <div
    v-if="isLoaderVisible"
    class="site-loader"
    :class="{ 'is-fading': isFading }"
    aria-hidden="true"
  >
    <div class="site-loader__curtain">
      <span v-for="n in 5" :key="n" class="site-loader__block" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.site-loader {
  position: fixed;
  inset: 0;
  z-index: 11;
  background: $c-surface;
  transition: $dur-enter;
  pointer-events: none;

  &.is-fading {
    opacity: 0;
  }
}

.site-loader__curtain {
  display: flex;
  height: 100%;
}

.site-loader__block {
  width: 20%;
  height: 100%;
  background: $c-surface;
  transform: translateY(-200px);
  animation: block-appear 0.8s $ease-reveal 1 forwards;

  &:nth-child(2n) {
    background: #f9f9f9;
  }

  &:nth-child(1) {
    animation-delay: -0.1s;
    animation-duration: 0.8s;
  }

  &:nth-child(2) {
    animation-delay: 0s;
    animation-duration: 1.1s;
  }

  &:nth-child(3) {
    animation-delay: 0.1s;
    animation-duration: 1.4s;
  }

  &:nth-child(4) {
    animation-delay: 0.2s;
    animation-duration: 1.7s;
  }

  &:nth-child(5) {
    animation-delay: 0.3s;
    animation-duration: 2s;
  }
}

@include reduced-motion {
  .site-loader {
    display: none;
  }
}
</style>
