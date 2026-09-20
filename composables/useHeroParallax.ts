import type { Ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Hero layer parallax.
 *
 * Every hero layer drifts at its own rate as the 500vh hero scrolls, reproducing
 * the reference's `data-scroll-speed` mechanism with ScrollTrigger's `scrub`.
 *
 * ## The rate
 *
 * ```
 * translateY per px scrolled = −speed / 45
 * ```
 *
 * — the rule recorded in `docs/FINAL_FIDELITY_AUDIT.md`, applied over the hero's
 * own scroll range (`top top` → `bottom bottom`).
 *
 * ## Read the report before changing these numbers
 *
 * Live measurement of the reference gives a different underlying rate than the
 * audit recorded — `−speed / 10`, saturating after about one viewport — and shows
 * that the reference disables hero parallax entirely on phones. Both findings are
 * written up with their evidence in `docs/P1_HERO_PARALLAX_REPORT.md` §4; the
 * spec's `−speed / 45` is implemented here because over this build's hero range it
 * lands within ~11% of the reference's measured end states, whereas `−speed / 10`
 * over the same range would travel 4.5× too far.
 *
 * ## Layers
 *
 * The audit lists seven. Six are transformed directly; the **title is applied to
 * its wrapper** `.hero__title` rather than to `.hero__title-text`, because the
 * entrance animation tweens `y` on the text element itself and the two would
 * fight for the same property. The wrapper is a full-viewport flex box, so moving
 * it displaces the name by exactly the same amount.
 */

/** `translateY` per px scrolled, per unit of speed. */
const SPEED_TO_RATE = 1 / 45

/**
 * Layer speeds, measured from the reference's `data-scroll-speed` attributes.
 * Selectors are queried inside the hero scroller so they resolve across the
 * child components that render them.
 */
export const HERO_PARALLAX_LAYERS: ReadonlyArray<{ selector: string; speed: number }> = [
  { selector: '.hero__title', speed: 8 },
  { selector: '.hero__desc-text', speed: 2 },
  { selector: '.hero-block__count-num', speed: 6 },
  { selector: '.hero-block__count-image', speed: 10 },
  { selector: '.hero-block__info-title', speed: 0.5 },
  { selector: '.hero-block__info-desc', speed: 2 },
  { selector: '.hero-block__info-actions', speed: 0.5 }
]

export interface HeroParallaxOptions {
  /** Overrides the default layer table. */
  layers?: ReadonlyArray<{ selector: string; speed: number }>
}

export function useHeroParallax(
  scroller: Ref<HTMLElement | null>,
  options: HeroParallaxOptions = {}
) {
  const layers = options.layers ?? HERO_PARALLAX_LAYERS
  const reduced = useReducedMotion()

  /** Every element found at mount, paired with its layer's speed. */
  const resolved: Array<{ el: HTMLElement; speed: number }> = []

  /** The scroll distance the hero travels, i.e. its height minus one viewport. */
  let range = 0
  let trigger: ScrollTrigger | null = null

  const measure = () => {
    const hero = scroller.value
    if (!hero) return
    range = Math.max(0, hero.offsetHeight - window.innerHeight)
  }

  /**
   * Applies every layer's offset for a hero progress of 0 → 1.
   *
   * One pass rather than one tween per layer: seven tweens watching the same
   * range would each re-measure on every refresh for no benefit.
   */
  const apply = (progress: number) => {
    for (const { el, speed } of resolved) {
      gsap.set(el, { y: -speed * SPEED_TO_RATE * range * progress, force3D: true })
    }
  }

  onMounted(() => {
    if (!import.meta.client || reduced.value) return

    const hero = scroller.value
    if (!hero) return

    for (const layer of layers) {
      // `querySelectorAll` — each of the three story blocks contains a copy, and
      // every one of them should drift at its layer's rate.
      hero.querySelectorAll<HTMLElement>(layer.selector).forEach((el) => {
        resolved.push({ el, speed: layer.speed })
      })
    }

    if (!resolved.length) return

    measure()

    const proxy = { progress: 0 }

    trigger =
      gsap.to(proxy, {
        progress: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          // The range depends on the viewport, so re-measure on every refresh
          invalidateOnRefresh: true,
          onRefresh: measure
        },
        onUpdate: () => apply(proxy.progress)
      }).scrollTrigger ?? null

    // A refresh can land between mount and the first scroll, so seed the offsets
    // from wherever the hero currently sits rather than assuming the top.
    if (trigger) apply(trigger.progress)
  })

  onBeforeUnmount(() => {
    trigger?.kill()
    trigger = null

    // Leave no inline transforms behind — the next mount must start from layout.
    resolved.forEach(({ el }) => gsap.set(el, { clearProps: 'transform' }))
    resolved.length = 0
  })

  /** Number of elements currently driven; used by the audit probe. */
  const layerCount = () => resolved.length

  return { layerCount }
}
