/**
 * Eased anchor navigation.
 *
 * The reference calls `scrollTo(target, { offset: 0, duration: 3000, lerp: 0.05 })`
 * (RECON §6) — a deliberately slow three-second travel, not a jump. Duration
 * scales down for short distances so it does not feel sluggish up close, while
 * the long-haul feel is preserved.
 */
const FULL_DURATION = 3000
const MIN_DURATION = 700

function durationFor(distance: number): number {
  const viewport = window.innerHeight || 1
  const ratio = Math.min(1, Math.abs(distance) / (viewport * 4))
  return Math.round(MIN_DURATION + (FULL_DURATION - MIN_DURATION) * ratio)
}

export function useAnchorNav() {
  const goTo = (target: string) => {
    if (import.meta.server) return

    const element = document.querySelector<HTMLElement>(target)
    if (!element) return

    const distance = element.getBoundingClientRect().top
    // Reduced-motion users get an instant jump (handled inside scrollToTarget)
    scrollToTarget(target, { duration: durationFor(distance), offset: 0 })
  }

  return { goTo }
}
