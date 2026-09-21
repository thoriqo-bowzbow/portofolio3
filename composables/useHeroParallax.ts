import type { Ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Hero layer parallax.
 *
 * Every hero layer drifts at its own rate as the 500vh hero scrolls, reproducing
 * the reference's `data-scroll-speed` mechanism.
 *
 * ## The rate, corrected
 *
 * ```
 * translateY per px scrolled = −speed / 10
 * ```
 *
 * An earlier version of this file used **−speed / 45**, taken from
 * `FINAL_FIDELITY_AUDIT.md`. That figure was wrong: the audit divided a single
 * layer's travel by a `scrollY` reading that was 4.5× the real scroll offset —
 * and 4.5 is exactly 45/10, which is why its constant came out 4.5× too small.
 * Re-measuring against the hero section's own transform, which *is* the scroll
 * offset under locomotive-scroll, gives −speed/10 on five independent layers at
 * two viewport heights. See `docs/P1_HERO_PARALLAX_REPORT.md` §4.1.
 *
 * ## Anchoring — two behaviours, both measured
 *
 * A single rate is not enough to reproduce the reference: the layers are not all
 * anchored in the same place.
 *
 * - **Title and description** move linearly from the hero's top and are anchored
 *   there — measured `y = 0` at `scrollY 0`.
 * - **Story layers** are anchored near their own position, so they sit *below*
 *   their layout spot on approach and *above* it on exit. Measured on
 *   `.md-block-1 .md-block__count-image`: `+479` while entering, `−377` while
 *   leaving, at a constant rate of −1.0.
 *
 * Driving every layer from the hero top instead would fling the story layers far
 * above their own blocks for the whole passage, so the anchor is per layer.
 *
 * ## Saturation
 *
 * Each layer's travel stops once it has left the viewport, which is what the
 * reference does — its title freezes at `−717.83` and its description at
 * `−179.46` because neither is on screen any more. With a 900px viewport this
 * produces `−720` and `−180`, within 0.3% of the measured values.
 */

/** `translateY` per px scrolled, per unit of speed. */
const SPEED_TO_RATE = 1 / 10

/**
 * Parallax runs at 1024px and above, and not below it.
 *
 * Measured by sweeping the reference across nine widths: at 1024 the title reads
 * `−287.5` with native scroll pinned at 0 (transform-driven scrolling, parallax
 * active), and at 1023 it reads `0` with native scroll at 2100. One pixel is the
 * whole difference, so the threshold is exact rather than approximate.
 */
const DESKTOP_QUERY = '(min-width: 1024px)'

/**
 * Where a layer's zero point sits.
 *
 * - `hero-top` — measured from the hero's top edge, saturating after one viewport.
 * - `self` — measured from the layer's own centre crossing the viewport centre.
 */
type Anchor = 'hero-top' | 'self'

interface LayerSpec {
  selector: string
  speed: number
  anchor: Anchor
}

/**
 * Layer speeds, from the reference's `data-scroll-speed` attributes, and the
 * anchor behaviour measured for each. Selectors are queried inside the hero
 * scroller so they resolve across the child components that render them.
 */
export const HERO_PARALLAX_LAYERS: ReadonlyArray<LayerSpec> = [
  { selector: '.hero__title', speed: 8, anchor: 'hero-top' },
  { selector: '.hero__desc-text', speed: 2, anchor: 'hero-top' },
  { selector: '.hero-block__count-num', speed: 6, anchor: 'self' },
  { selector: '.hero-block__count-image', speed: 10, anchor: 'self' },
  { selector: '.hero-block__info-title', speed: 0.5, anchor: 'self' },
  { selector: '.hero-block__info-desc', speed: 2, anchor: 'self' },
  { selector: '.hero-block__info-actions', speed: 0.5, anchor: 'self' }
]

export interface HeroParallaxOptions {
  /** Overrides the default layer table. */
  layers?: ReadonlyArray<LayerSpec>
}

/** A layer paired with its speed and its measured position in the hero. */
interface Resolved {
  el: HTMLElement
  speed: number
  anchorMode: Anchor
  /**
   * The layer's centre measured from the hero's top edge, in px.
   *
   * Layout only — no transform. Cached here because reading it from a live rect
   * would fold the offset we are currently applying into the measurement.
   */
  centreFromHeroTop: number
  /** The `y` currently written to this element, so later reads can remove it. */
  appliedY: number
  /**
   * The layer's box in document coordinates with no transform applied.
   *
   * Used by `guardColumns` to work out how much clear space sits between two
   * siblings. Layout only, for the same reason as `centreFromHeroTop`.
   */
  restTop: number
  restBottom: number
  /** True once the rest box above has been captured for this element. */
  restMeasured: boolean
}

export function useHeroParallax(
  scroller: Ref<HTMLElement | null>,
  options: HeroParallaxOptions = {}
) {
  const layers = options.layers ?? HERO_PARALLAX_LAYERS
  const reduced = useReducedMotion()

  /*
   * `gsap.matchMedia` rather than a manual width check: it re-runs the callback
   * when the query starts matching and reverts the context when it stops, so
   * crossing 1024px in either direction rebuilds the triggers and clears the
   * transforms without any resize listener of our own.
   */
  const mm = gsap.matchMedia()

  /** Every element currently driven; empty below the breakpoint. */
  let resolved: Resolved[] = []
  let range = 0
  let trigger: ScrollTrigger | null = null

  /** Scroll distance the hero travels — its height minus one viewport. */
  const measure = () => {
    const hero = scroller.value
    if (!hero) return
    range = Math.max(0, hero.offsetHeight - window.innerHeight)
  }

  /**
   * Caches each layer's centre, measured from the hero's top edge.
   *
   * Two subtleties, both of which produced wrong offsets before they were handled:
   *
   * - **The applied transform is removed first.** `getBoundingClientRect()`
   *   reports the element *after* the `y` we have written to it, so measuring it
   *   as-is folds the current offset into the stored position. Every refresh then
   *   moved the anchor by that offset again, and a viewport change could leave a
   *   layer parked against the wrong end of its window.
   * - **Positions are relative to the hero, not the document.** The value handed
   *   to `apply` is the distance the hero has travelled from its top, so anchors
   *   have to be in the same space. The hero's own top is subtracted out.
   *
   * The *window* is deliberately not stored here — it depends only on the live
   * viewport and is derived in `apply`.
   */
  const measureLayers = () => {
    const hero = scroller.value
    if (!hero) return

    const heroTop = hero.getBoundingClientRect().top + window.scrollY

    for (const layer of resolved) {
      const rect = layer.el.getBoundingClientRect()
      const layoutTop = rect.top + window.scrollY - layer.appliedY
      layer.centreFromHeroTop = layoutTop + rect.height / 2 - heroTop

      /*
       * The rest geometry is captured once, on the first pass — the one that runs
       * at mount, before any transform has been written.
       *
       * It has to be, because the guard's clearance is only meaningful against the
       * *untransformed* boxes. Re-deriving it on a later refresh folds whatever
       * offsets were live at that moment into the "rest" position: after one
       * refresh the column's apparent gaps had grown from 10/35px to 23/70px, the
       * clamp stopped firing, and the description settled back on top of the
       * buttons it had just been moved off.
       */
      if (!layer.restMeasured) {
        layer.restTop = layoutTop
        layer.restBottom = layoutTop + rect.height
        layer.restMeasured = true
      }
    }
  }

  /**
   * Applies every layer's offset for the hero's current scroll position.
   *
   * `scroll` is the distance the hero has travelled from its top. Each layer's
   * offset is measured from its **own** anchor, then clamped symmetrically to its
   * window. That clamp is the saturation: past either end the layer has left the
   * viewport, and the reference freezes it rather than continuing to move it.
   *
   * Both the anchor and the window are derived from the **live** viewport here,
   * not cached at refresh time. They are the two viewport-dependent quantities in
   * the rule, and a viewport that changes without a refresh firing — a window
   * resized back to a width ScrollTrigger has already seen, say — would otherwise
   * leave the layers frozen against the previous viewport's boundaries.
   *
   * The window length differs by anchor because the two were measured differently:
   *
   * - `hero-top` layers are anchored at the hero's top and stop after one full
   *   viewport — the reference's title freezes at `−717.83` with a 900px viewport,
   *   i.e. after 897px of scroll.
   * - `self` layers are anchored where their own centre crosses the viewport
   *   centre and stop half a viewport either side, giving ±450 for a 900px
   *   viewport. That matches the measured story-layer amplitude:
   *   `.md-block-1 .md-block__count-image` ran `+479` on approach to `−377` on
   *   exit, an amplitude of roughly ±430.
   */
  const apply = (scroll: number) => {
    const vh = window.innerHeight

    for (const layer of resolved) {
      const anchoredToHeroTop = layer.anchorMode === 'hero-top'
      const windowLength = anchoredToHeroTop ? vh : vh / 2
      const anchor = anchoredToHeroTop ? 0 : layer.centreFromHeroTop - vh / 2

      const offset = Math.max(-windowLength, Math.min(windowLength, scroll - anchor))
      layer.appliedY = -layer.speed * SPEED_TO_RATE * offset
    }

    guardColumns()

    for (const layer of resolved) {
      gsap.set(layer.el, { y: layer.appliedY, force3D: true })
    }
  }

  /**
   * Stops siblings inside one info column from crossing each other.
   *
   * The story-block info column carries three layers at two very different
   * rates — the title and the actions at 0.5, the description at 2 — so the
   * description drifts up roughly four times as fast as the things around it.
   * Left alone it climbs through the title above it and, later, down into the
   * buttons below it, and the result is plainly readable on screen: at 1440×900
   * the word "Performance" lands on the descenders of "Speed", and a block's
   * description overlaps its own buttons by 32px of a 45px-tall button.
   *
   * Each layer still moves at its measured rate everywhere that rate does not put
   * it on top of a neighbour. Past that point it holds against the neighbour's
   * edge. The column as a whole keeps drifting, which is the part that reads as
   * motion — only the collision is removed.
   *
   * The bound is the pair's own rest gap, not zero. For a layer sitting below its
   * predecessor with `g` px of clear space between their boxes, the two overlap
   * once the lower one has been raised by more than `g` relative to the upper —
   * so `y(lower) >= y(upper) − g` is the exact "do not overlap" condition, and it
   * leaves the pair free to close that gap as they drift.
   */
  const guardColumns = () => {
    const groups = new Map<Element, Resolved[]>()

    for (const layer of resolved) {
      const column = layer.el.parentElement?.closest('.hero-block__info')
      if (!column) continue
      const bucket = groups.get(column)
      if (bucket) bucket.push(layer)
      else groups.set(column, [layer])
    }

    groups.forEach((layers) => {
      // Document order, so `layers[i]` sits below `layers[i - 1]` at rest
      layers.sort((a, b) =>
        a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
      )

      for (let i = 1; i < layers.length; i++) {
        const upper = layers[i - 1]
        const lower = layers[i]
        // Clear space between the two boxes before any transform is applied
        const gap = Math.max(0, lower.restTop - upper.restBottom)
        // Overlap once the lower layer has risen past the upper one's bottom edge
        // by more than `gap`.
        const excess = upper.appliedY - gap - lower.appliedY
        if (excess <= 0) continue

        /*
         * Correct whichever of the two is the one that diverged, not simply the
         * lower one.
         *
         * In this layout that is always the description: it runs at speed 2 while
         * the title and actions around it run at 0.5. Pushing the *actions* down to
         * keep clear of it — the obvious reading of the constraint — drags a layer
         * that was behaving correctly off its measured rate, and the palette of
         * per-step rates then shows the buttons moving at −0.077 instead of
         * −0.050. Moving the faster layer back instead leaves the other two exact.
         */
        if (lower.speed >= upper.speed) {
          lower.appliedY += excess
        } else {
          upper.appliedY -= excess
        }
      }
    })
  }

  onMounted(() => {
    if (!import.meta.client || reduced.value) return

    const hero = scroller.value
    if (!hero) return

    mm.add(DESKTOP_QUERY, () => {
      resolved = []

      for (const layer of layers) {
        hero.querySelectorAll<HTMLElement>(layer.selector).forEach((el) => {
          resolved.push({
            el,
            speed: layer.speed,
            anchorMode: layer.anchor,
            centreFromHeroTop: 0,
            appliedY: 0,
            restTop: 0,
            restBottom: 0,
            restMeasured: false
          })
        })
      }

      if (!resolved.length) return

      measure()
      measureLayers()

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
            // The range and each layer's measured centre depend on layout, so
            // they are re-measured on every refresh rather than cached at mount.
            // The viewport-dependent half of the rule lives in `apply`, so it
            // cannot go stale between refreshes.
            invalidateOnRefresh: true,
            onRefresh: () => {
              measure()
              measureLayers()
            }
          },
          onUpdate: () => apply(proxy.progress * range)
        }).scrollTrigger ?? null

      // Seed from wherever the hero currently sits rather than assuming the top.
      apply((trigger?.progress ?? 0) * range)

      // Reverting the context kills the trigger; the transforms are cleared
      // explicitly so the layers return to their layout positions.
      return () => {
        const els = resolved.map((layer) => layer.el)
        trigger = null
        resolved = []
        els.forEach((el) => gsap.set(el, { clearProps: 'transform' }))
      }
    })
  })

  onBeforeUnmount(() => {
    mm.revert()
    resolved = []
    trigger = null
  })

  /** Number of elements currently driven; 0 below the breakpoint. Used by probes. */
  const layerCount = () => resolved.length

  return { layerCount }
}
