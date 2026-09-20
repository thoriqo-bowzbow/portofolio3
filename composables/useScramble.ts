import type { Ref } from 'vue'

/**
 * Character-scramble text reveal.
 *
 * A faithful reimplementation of the reference's `compHacktext.vue` algorithm
 * (RECON §9.3) — the alphabet, the per-length tick interval, the `1/3`
 * character advance and the frozen `+5px` width all match the observed
 * behaviour. It fires on scroll-enter *and* on hover.
 */

/** Reference alphabet, verbatim from source. */
const ALPHABET = '&Ø@#$%^&*><+!XYZABCDEFGHIJKLMNOPQRSTUVWXYZ'

/** Per-character dwell time in ms, derived from label length. */
function intervalFor(length: number): number {
  if (length <= 4) return 50
  if (length <= 8) return 30
  return 20
}

export interface ScrambleOptions {
  /** Override the derived interval. */
  duration?: number
}

export function useScramble(label: Ref<string>, options: ScrambleOptions = {}) {
  const el = ref<HTMLElement | null>(null)
  const reduced = useReducedMotion()
  const display = ref(label.value)

  let timer: ReturnType<typeof setInterval> | null = null
  let iteration = 0

  const clear = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  const run = () => {
    if (import.meta.server) return
    if (reduced.value) {
      display.value = label.value
      return
    }

    const target = label.value
    clear()
    iteration = 0

    const tick = options.duration ?? intervalFor(target.length)

    timer = setInterval(() => {
      let next = ''
      for (let i = 0; i < target.length; i += 1) {
        next += i < iteration ? target[i] : ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
      }
      display.value = next

      if (iteration >= target.length) {
        display.value = target
        clear()
      }
      iteration += 1 / 3
    }, tick)
  }

  /** Measure and freeze the width so glyph swaps never reflow the line. */
  const lockWidth = () => {
    if (!import.meta.client || !el.value) return
    const width = el.value.offsetWidth
    if (width > 0) el.value.style.width = `${width + 5}px`
  }

  const reveal = () => {
    display.value = label.value
    nextTick(lockWidth)
  }

  onMounted(() => {
    if (!import.meta.client) return
    nextTick(() => {
      display.value = label.value
      lockWidth()
    })
  })

  onBeforeUnmount(clear)
  watch(label, () => {
    display.value = label.value
    nextTick(lockWidth)
  })

  return { el, display, run, clear, reveal, lockWidth }
}
