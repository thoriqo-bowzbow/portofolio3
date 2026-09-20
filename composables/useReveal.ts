import type { Ref } from 'vue'

interface RevealOptions {
  /** Fraction of the viewport the element must cross before revealing. */
  threshold?: number
  /** Keep the class after the first reveal (reference default: true). */
  repeat?: boolean
  /** Fire a callback the first time the element enters. */
  onEnter?: () => void
}

/**
 * Scroll reveal — the implementation's replacement for locomotive-scroll's
 * `data-scroll` / `data-scroll-class="is-inview"` behaviour.
 *
 * Every dormant→revealed CSS rule in the reference keys off `.is-inview`, so the
 * contract is preserved exactly: this only adds and removes the class.
 */
export function useReveal(
  targets: Ref<HTMLElement | null> | Ref<HTMLElement | null>[],
  options: RevealOptions = {}
) {
  const { threshold = 0.15, repeat = false, onEnter } = options
  const reduced = useReducedMotion()
  let observer: IntersectionObserver | null = null

  const toArray = () => (Array.isArray(targets) ? targets : [targets])

  const revealAll = () => {
    toArray().forEach((t) => t.value?.classList.add('is-inview'))
  }

  onMounted(() => {
    if (!import.meta.client) return

    // Reduced motion: no scroll dependency, everything is simply visible
    if (reduced.value) {
      revealAll()
      onEnter?.()
      return
    }

    const elements = Array.from(
      new Set(
        toArray()
          .map((t) => t.value)
          .filter((el): el is HTMLElement => Boolean(el))
      )
    )
    if (!elements.length) return

    let entered = false

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement
          if (entry.isIntersecting) {
            el.classList.add('is-inview')
            if (!entered) {
              entered = true
              onEnter?.()
            }
          } else if (repeat) {
            el.classList.remove('is-inview')
          }
        })
      },
      {
        // Matches the reference's `data-scroll-offset="20%, 0"` intent: reveal
        // once the element is meaningfully inside the viewport, not at first pixel.
        rootMargin: `0px 0px -${Math.round(threshold * 100)}% 0px`,
        threshold: 0
      }
    )

    elements.forEach((el) => observer?.observe(el))
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return { revealAll }
}

/**
 * Reveals a container's children individually, one observer per child.
 * Used by the gallery mosaic, testimonial grid and stack groups, where the
 * reference marks each tile separately.
 */
export function useRevealChildren(
  container: Ref<HTMLElement | null>,
  selector: string,
  options: RevealOptions = {}
) {
  const { threshold = 0.15, repeat = false, onEnter } = options
  const reduced = useReducedMotion()
  let observer: IntersectionObserver | null = null

  const targets = ref<HTMLElement[]>([])

  onMounted(() => {
    if (!import.meta.client || !container.value) return

    targets.value = Array.from(container.value.querySelectorAll<HTMLElement>(selector))
    if (!targets.value.length) return

    if (reduced.value) {
      targets.value.forEach((el) => el.classList.add('is-inview'))
      onEnter?.()
      return
    }

    let entered = false
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement
          if (entry.isIntersecting) {
            el.classList.add('is-inview')
            if (!entered) {
              entered = true
              onEnter?.()
            }
          } else if (repeat) {
            el.classList.remove('is-inview')
          }
        })
      },
      {
        rootMargin: `0px 0px -${Math.round(threshold * 100)}% 0px`,
        threshold: 0
      }
    )

    targets.value.forEach((el) => observer?.observe(el))
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return { targets }
}
