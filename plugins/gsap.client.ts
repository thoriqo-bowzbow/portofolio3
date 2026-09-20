import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Single point of GSAP plugin registration.
 *
 * **Why this file exists.** `gsap.registerPlugin(ScrollTrigger)` was never called
 * anywhere in this repository, so every `scrollTrigger:` tween config was silently
 * discarded — GSAP logged `Invalid property scrollTrigger … Missing plugin?` and
 * ran the tween as a plain one-shot animation. `useParallax` was the visible
 * casualty: instead of tracking scroll, its images animated once to their end
 * offset and stayed there.
 *
 * Registering in a Nuxt plugin rather than in a composable makes the ordering
 * guaranteed and the registration single: plugins run once, before any component
 * setup, so every composable that imports `ScrollTrigger` from `gsap/ScrollTrigger`
 * gets an instance that is already registered. Registering inside `useSmoothScroll`
 * would have worked only because that composable happens to mount first.
 *
 * `ScrollTrigger` is imported by `useSmoothScroll` (scroll → trigger sync),
 * `useParallax` (gallery and testimonial drift) and `useHeroParallax` (the hero
 * layers). All three rely on this registration.
 *
 * Client-only: `gsap/ScrollTrigger` touches `window` at module scope.
 */
export default defineNuxtPlugin(() => {
  gsap.registerPlugin(ScrollTrigger)
})
