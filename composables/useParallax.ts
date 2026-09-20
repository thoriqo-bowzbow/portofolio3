import type { Ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Bounded image parallax.
 *
 * The reference reserves headroom for parallax by sizing images larger than
 * their frame — galleries at `height: 160%; top: -30%`, testimonial portraits at
 * `height: 130%; top: -15%` (RECON §7.5, §8). The exact travel per scroll is one
 * of the documented UNKNOWNs (RECON §12.3), so this implementation derives the
 * amplitude from the geometry instead of guessing a speed: the image may move by
 * the *smaller* of its two overflow bands, guaranteeing no edge is ever exposed.
 *
 * With a 160%/-30% reservoir that yields ±30% of the frame height; with
 * 130%/-15% it yields ±15%.
 */
export function useParallax(
  container: Ref<HTMLElement | null>,
  image: Ref<HTMLElement | null>,
  options: { reservoirFraction?: number; safety?: number } = {}
) {
  const { reservoirFraction = 0.3, safety = 0.9 } = options
  const reduced = useReducedMotion()
  let trigger: ScrollTrigger | null = null

  onMounted(() => {
    if (!import.meta.client || !container.value || !image.value) return
    if (reduced.value) return

    const frameHeight = container.value.offsetHeight
    if (!frameHeight) return

    // Overflow on each side of the reservoir, minus a small safety margin so a
    // sub-pixel rounding error cannot reveal the frame background.
    const amplitude = frameHeight * reservoirFraction * safety
    if (amplitude < 1) return

    const tween = gsap.fromTo(
      image.value,
      { y: amplitude },
      {
        y: -amplitude,
        ease: 'none',
        scrollTrigger: {
          trigger: container.value,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
          invalidateOnRefresh: true
        }
      }
    )

    trigger = tween.scrollTrigger ?? null
  })

  onBeforeUnmount(() => {
    trigger?.kill()
    trigger = null
    if (image.value) gsap.set(image.value, { clearProps: 'transform' })
  })
}
