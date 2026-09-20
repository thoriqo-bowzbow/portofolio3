<script setup lang="ts">
/**
 * Site intro.
 *
 * A white field with a rolling odometer counting `000` → `100` in the
 * bottom-right corner, then the whole overlay fades away.
 *
 * Reconstructed from the reference's observed behaviour — see
 * `docs/FINAL_FIDELITY_AUDIT.md`, P0 finding 2. The reference's `md-loader`
 * curtain (five falling columns) is dead code on its home route and is **not**
 * reproduced here. No reference source is used.
 *
 * Observed reference geometry and timing, matched below:
 *
 *   field         full screen, `#fff`, `position: fixed`, `z-index: 11`
 *   padding       100px 150px, content anchored bottom-right  (≥769px)
 *                 50px 0, content anchored bottom-centre       (≤768px)
 *   counter       333 × 207.2px, settled bottom-right
 *   hold          000 for ~0.7s
 *   roll          ~2.8s to 100
 *   hold          100 for ~1.2s
 *   exit          opacity 1 → 0 over 1s
 *   total         ~5.7s, matching the reference's measured 5.74s
 *
 * Deliberate differences from the reference, both accessibility-driven:
 * the overlay exposes a real `progressbar` to assistive tech, and it is skipped
 * entirely under `prefers-reduced-motion`.
 */
const { isReady, isLoaderVisible } = useSiteReady()

/** Matches the reference's measured segment lengths. */
const ROLL_MS = 2800
const HOLD_BEFORE_MS = 700
const HOLD_AFTER_MS = 1200
const FADE_MS = 1000
/** Reduced-motion: how long the settled value stays up before dismissing. */
const INSTANT_HOLD_MS = 500

const reduced = useReducedMotion()

const isFading = ref(false)

let timers: Array<ReturnType<typeof setTimeout>> = []

const clearTimers = () => {
  timers.forEach(clearTimeout)
  timers = []
}

const after = (ms: number, fn: () => void) => {
  timers.push(setTimeout(fn, ms))
}

const beginExit = () => {
  if (isFading.value) return
  isFading.value = true
  after(FADE_MS, () => {
    isLoaderVisible.value = false
    isReady.value = true
  })
}

/**
 * Fired by the counter once it has settled on 100.
 *
 * The counter is rendered unconditionally — including in the server output — so
 * that the server and the first client frame agree on `000`. Branching the
 * markup on `prefers-reduced-motion` would make the server emit one variant and
 * the client swap to the other on hydration, flashing the wrong state.
 */
const onSettled = () => {
  after(reduced.value ? INSTANT_HOLD_MS : HOLD_AFTER_MS, beginExit)
}

onBeforeUnmount(clearTimers)
</script>

<template>
  <div v-if="isLoaderVisible" class="site-loader" :class="{ 'is-fading': isFading }">
    <OdometerCounter
      class="site-loader__counter"
      :to="100"
      :digits="3"
      :duration="ROLL_MS"
      :delay="HOLD_BEFORE_MS"
      :instant="reduced"
      @complete="onSettled"
    />
  </div>
</template>

<style scoped lang="scss">
.site-loader {
  position: fixed;
  inset: 0;
  z-index: 11;
  background: $c-surface;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 100px 150px;
  transition: opacity $dur-enter;
  // The overlay never needs pointer events. Keeping it transparent to input
  // means it cannot trap a click even if it were to linger.
  pointer-events: none;

  &.is-fading {
    opacity: 0;
  }
}

.site-loader__counter {
  flex-shrink: 0;
}

@include sm-down {
  .site-loader {
    // The reference anchors the counter bottom-centre on phones and uses large
    // viewport units so browser chrome appearing does not shift it.
    height: 100lvh;
    padding: 50px 0;
    justify-content: center;
  }
}
</style>
