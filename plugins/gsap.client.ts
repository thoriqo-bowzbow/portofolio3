import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Single point of GSAP plugin registration.
 *
 * **Why this file exists.** `gsap.registerPlugin(ScrollTrigger)` was never called
 * anywhere in this repository, so every `scrollTrigger:` tween config was silently
 * discarded — GSAP logged `Invalid property scrollTrigger … Missing plugin?` and
 * ran the tween as a plain one-shot animation.
 *
 * Registering in a Nuxt plugin rather than in a composable makes the ordering
 * guaranteed and the registration single: plugins run once, before any component
 * setup, so every composable that imports `ScrollTrigger` from `gsap/ScrollTrigger`
 * gets an instance that is already registered.
 *
 * **Scope.** Registration stays even though the gallery and testimonial parallax
 * it once revealed have since been removed as invented motion. `useHeroParallax`
 * depends on it, as does the Lenis scroll → trigger sync in `useSmoothScroll`. Only
 * the tweens that conflicted with the observed reference were removed — see
 * docs/P1_MOTION_RECONCILIATION_REPORT.md.
 *
 * Client-only: `gsap/ScrollTrigger` touches `window` at module scope.
 */
export default defineNuxtPlugin(() => {
  gsap.registerPlugin(ScrollTrigger)
})
