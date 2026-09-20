/**
 * Lenis smooth scroll, wired into GSAP's ticker and ScrollTrigger.
 *
 * Replaces the reference's `locomotive-scroll@4` instance (see
 * docs/MAMEED_COMPONENT_MAP.md §7 deviation 1). The observable behaviour that
 * matters — heavy interpolation, disabled on phones — is preserved:
 *
 *   reference: new LocomotiveScroll({ smooth: true, lerp: 0.09,
 *                                    smartphone: { smooth: false } })
 *
 * The instance is module-scoped and reference-counted: mounting several
 * consumers creates one Lenis, and it is only torn down when the last one
 * unmounts.
 */
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/** Reference lerp value (RECON §9.1). */
const LERP = 0.09

/** Below this width the reference disables smoothing entirely. */
const NO_SMOOTH_QUERY = '(max-width: 768px)'

/** Reference anchor travel budget (RECON §6). */
const FULL_DURATION = 3000
const MIN_DURATION = 700

let lenis: Lenis | null = null
let tickerFn: ((time: number) => void) | null = null
let detachScroll: (() => void) | null = null
let detachBreakpoint: (() => void) | null = null
let consumers = 0
let disabledByPreference = false

function teardown() {
  if (tickerFn) {
    gsap.ticker.remove(tickerFn)
    tickerFn = null
  }
  detachScroll?.()
  detachScroll = null
  detachBreakpoint?.()
  detachBreakpoint = null
  lenis?.destroy()
  lenis = null
  document.documentElement.classList.remove('has-smooth-scroll', 'lenis', 'lenis-smooth')
}

function boot() {
  if (lenis || import.meta.server) return

  const shouldSmooth = !window.matchMedia(NO_SMOOTH_QUERY).matches

  lenis = new Lenis({
    lerp: LERP,
    smoothWheel: shouldSmooth,
    syncTouch: false,
    autoRaf: false,
    anchors: false
  })

  document.documentElement.classList.add('has-smooth-scroll')

  // Let users tab/click through without Lenis fighting browser-native behaviour
  lenis.on('scroll', ScrollTrigger.update)
  detachScroll = () => lenis?.off('scroll', ScrollTrigger.update)

  // Drive Lenis from GSAP so animations and scrolling share one clock
  tickerFn = (time: number) => lenis?.raf(time * 1000)
  gsap.ticker.add(tickerFn)
  gsap.ticker.lagSmoothing(0)

  // Rebuild when the phone breakpoint flips smoothing on or off
  const mql = window.matchMedia(NO_SMOOTH_QUERY)
  const onBreakpoint = () => {
    teardown()
    boot()
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }
  mql.addEventListener('change', onBreakpoint)
  detachBreakpoint = () => mql.removeEventListener('change', onBreakpoint)
}

/** Eased programmatic scroll. Works with or without a live Lenis instance. */
export function scrollToTarget(
  target: string | number,
  options: { duration?: number; offset?: number } = {}
) {
  if (import.meta.server) return

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (lenis && !reduced) {
    lenis.scrollTo(target, {
      duration: (options.duration ?? FULL_DURATION) / 1000,
      offset: options.offset ?? 0
    })
    return
  }

  if (typeof target === 'string') {
    document.querySelector(target)?.scrollIntoView({ block: 'start' })
  } else {
    window.scrollTo({ top: target, behavior: 'auto' })
  }
}

export function getLenis() {
  return lenis
}

export function useSmoothScroll() {
  if (import.meta.client) {
    onMounted(() => {
      consumers += 1
      if (consumers > 1) return

      disabledByPreference = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (disabledByPreference) return

      boot()
      // Layout settles after fonts and images; ScrollTrigger needs a re-measure
      requestAnimationFrame(() => ScrollTrigger.refresh())
    })

    onBeforeUnmount(() => {
      consumers = Math.max(0, consumers - 1)
      if (consumers === 0) teardown()
    })
  }

  return { scrollTo: scrollToTarget, get instance() { return lenis } }
}
