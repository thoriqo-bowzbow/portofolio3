/**
 * Shared scroll state.
 *
 * The reference reads the same two thresholds off its scroll library in
 * compHeader.vue:
 *
 *   isScrolled       = scrollY > 100   → header becomes fixed and slides away
 *   isContactVisible = scrollY < 300   → hero side rails fade in
 *
 * A single module-scoped listener feeds every consumer so adding components
 * does not add listeners.
 */
const HEADER_THRESHOLD = 100
const RAILS_THRESHOLD = 300

const scrollY = ref(0)
const isScrolled = computed(() => scrollY.value > HEADER_THRESHOLD)
const railsVisible = computed(() => scrollY.value < RAILS_THRESHOLD)

let consumers = 0
let detach: (() => void) | null = null
let rafId = 0

function attach() {
  const read = () => {
    scrollY.value = window.scrollY
  }

  const onScroll = () => {
    if (rafId) return
    rafId = requestAnimationFrame(() => {
      rafId = 0
      read()
    })
  }

  read()
  window.addEventListener('scroll', onScroll, { passive: true })
  detach = () => {
    window.removeEventListener('scroll', onScroll)
    if (rafId) cancelAnimationFrame(rafId)
    rafId = 0
  }
}

export function useScrollState() {
  if (import.meta.client) {
    onMounted(() => {
      consumers += 1
      if (consumers === 1) attach()
    })
    onBeforeUnmount(() => {
      consumers = Math.max(0, consumers - 1)
      if (consumers === 0) {
        detach?.()
        detach = null
      }
    })
  }

  return { scrollY, isScrolled, railsVisible }
}
