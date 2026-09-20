import type { Ref } from 'vue'
import { gsap } from 'gsap'

/**
 * Scroll-scrubbed background video.
 *
 * Reproduces the reference's hero mechanism — a `<video>` whose `currentTime` is
 * driven by scroll progress rather than by playback (see
 * `docs/FINAL_FIDELITY_AUDIT.md`, P0 finding 1). The video is never played: it
 * stays `paused` for its whole life and is only ever seeked.
 *
 * **Why this does not use ScrollTrigger.** `gsap.registerPlugin(ScrollTrigger)`
 * is missing from this codebase, so every `scrollTrigger:` tween config is
 * silently discarded — see the note in `docs/P0_FIX_REPORT.md`. Depending on that
 * plugin here would have made this feature fail the same way. Scroll progress is
 * instead derived directly from the hero's own bounding rect once per frame,
 * which is exact, cheap (one layout read per frame), and has no plugin
 * prerequisite. It also keeps this change from altering the behaviour of the
 * gallery and testimonial tweens, which are out of scope for this pass.
 *
 * Why seeking needs care:
 *
 * • **Seeking is expensive.** Setting `currentTime` forces a decode from the
 *   nearest keyframe. Three guards keep it cheap: a minimum delta before a seek
 *   is issued, coalescing to one seek per animation frame, and a short GOP in the
 *   encoded asset (2s) so a seek never has to decode far.
 * • **`fastSeek` is not used.** It is allowed to land on any nearby frame, which
 *   would make the scrub feel imprecise. The assets total ~46 KB, so precise
 *   seeking is affordable.
 * • **It must not block first paint.** The hero's SVG backdrop paints
 *   immediately underneath; the video fades in on top only once it has data.
 *
 * Skipped entirely — leaving the SVG backdrop as the sole atmosphere — when the
 * user prefers reduced motion, has Save-Data enabled, or is on a 2G-class
 * connection.
 */

/** Ignore seeks smaller than this; below ~1 frame they are not visible. */
const MIN_SEEK_DELTA = 0.02

/** Leave a little headroom so the final seek never clamps at the duration. */
const END_EPSILON = 0.06

export interface ScrubVideoOptions {
  /** Full-size source. */
  src: string
  /** Smaller source for phones — a quarter of the decode cost. */
  srcSmall?: string
  /** Viewport at or below which `srcSmall` is used. */
  smallBreakpoint?: number
}

export function useScrubVideo(
  videoRef: Ref<HTMLVideoElement | null>,
  triggerRef: Ref<HTMLElement | null>,
  options: ScrubVideoOptions
) {
  const { src, srcSmall, smallBreakpoint = 768 } = options

  const reduced = useReducedMotion()

  /** True once enabled and mounted; false means the SVG backdrop stands alone. */
  const isActive = ref(false)

  let tickerFn: (() => void) | null = null
  let lastSeek = -1
  let pendingFrame = 0
  let pendingTime = 0

  const pickSource = () => {
    if (srcSmall && window.matchMedia(`(max-width: ${smallBreakpoint}px)`).matches) return srcSmall
    return src
  }

  /** One seek per animation frame, at most. */
  const flushSeek = () => {
    pendingFrame = 0
    const video = videoRef.value
    if (!video || !isActive.value) return

    const duration = video.duration
    if (!Number.isFinite(duration) || duration <= 0) return

    const time = Math.min(duration - END_EPSILON, Math.max(0, pendingTime))
    if (Math.abs(time - lastSeek) < MIN_SEEK_DELTA) return

    lastSeek = time
    video.currentTime = time
  }

  const requestSeek = (time: number) => {
    pendingTime = time
    if (pendingFrame) return
    pendingFrame = requestAnimationFrame(flushSeek)
  }

  /**
   * Hero scroll progress, 0 → 1, over the section's scrollable range.
   * Mirrors `start: 'top top'` → `end: 'bottom bottom'`.
   */
  const readProgress = (hero: HTMLElement) => {
    const total = hero.offsetHeight - window.innerHeight
    if (total <= 0) return 0
    const scrolled = -hero.getBoundingClientRect().top
    return Math.min(1, Math.max(0, scrolled / total))
  }

  const teardown = () => {
    if (pendingFrame) {
      cancelAnimationFrame(pendingFrame)
      pendingFrame = 0
    }
    if (tickerFn) {
      gsap.ticker.remove(tickerFn)
      tickerFn = null
    }
  }

  onMounted(() => {
    if (!import.meta.client) return

    // Respect user and device constraints — the SVG backdrop is a complete
    // atmosphere on its own, so skipping costs only the scroll-linked motion.
    if (reduced.value) return
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
      .connection
    if (connection?.saveData) return
    if (connection?.effectiveType && /(^|-)2g$/.test(connection.effectiveType)) return

    const video = videoRef.value
    const hero = triggerRef.value
    if (!video || !hero) return

    let started = false

    const onReady = () => {
      if (started) return
      started = true

      isActive.value = true

      const update = () => requestSeek(readProgress(hero) * video.duration)

      // Shares the clock Lenis already drives, so progress and scroll never
      // disagree by a frame.
      tickerFn = update
      gsap.ticker.add(tickerFn)

      update()
    }

    // Must be set before load begins.
    video.src = pickSource()
    video.load()

    /*
     * Wait for decodable data.
     *
     * A `loadeddata` listener alone is not sufficient: a small cached response
     * can satisfy the load before the listener is attached, and the event is then
     * missed entirely — leaving the video mounted, never activated and never
     * scrubbed. The frame-by-frame readyState check below is the reliable path;
     * the listener is kept only so the common case resolves without waiting a
     * frame.
     */
    video.addEventListener('loadeddata', onReady, { once: true })

    const waitForData = () => {
      if (started) return
      if (video.readyState >= 2) {
        onReady()
        return
      }
      requestAnimationFrame(waitForData)
    }
    requestAnimationFrame(waitForData)

    // Never play. Guarded explicitly so a future edit cannot silently start it.
    video.pause()
  })

  onBeforeUnmount(() => {
    videoRef.value?.pause()
    teardown()
  })

  return { isActive }
}
