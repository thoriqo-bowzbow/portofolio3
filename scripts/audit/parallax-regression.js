/**
 * Gallery and testimonial image motion check.
 *
 * History: before `gsap.registerPlugin(ScrollTrigger)` existed, the `scrollTrigger:`
 * config in `useParallax` was discarded and GSAP ran the tween as a plain 0.5s
 * animation, leaving the image parked at its end offset. Registering the plugin
 * then made the tween genuinely scroll-linked.
 *
 * Both states have since been superseded: the reference's equivalent images were
 * measured inert (`translateY: 0` across every sampled position while in view), so
 * the tweens were removed and the images should now be **static at 0**. This probe
 * exists to confirm that, and to catch the motion returning.
 *
 * Note the values must be read while the tiles are on screen — an element outside
 * its trigger range reports 0 for reasons unrelated to whether motion is wired up.
 */
(() => {
  const ty = (el) => {
    if (!el) return null
    const t = getComputedStyle(el).transform
    if (!t || t === 'none') return 0
    const m = t.match(/matrix3?d?\(([^)]+)\)/)
    if (!m) return null
    const p = m[1].split(',').map(Number)
    return Math.round((p.length === 16 ? p[13] : p[5]) * 100) / 100
  }

  const gallery = Array.from(document.querySelectorAll('.highlight-tile__image'))
  const reviews = Array.from(document.querySelectorAll('.testimonial-card__image'))

  // For each, how far the tile sits relative to the viewport — parallax is a
  // function of this, so it is the meaningful companion to the offset.
  const rel = (el) => {
    const frame = el.closest('.highlight-tile, .testimonial-card')
    if (!frame) return null
    const r = frame.getBoundingClientRect()
    return Math.round((r.top + r.height / 2 - window.innerHeight / 2) * 100) / 100
  }

  return JSON.stringify({
    scrollY: Math.round(window.scrollY),
    gallery: gallery.map((el) => ({ ty: ty(el), frameCentreOffset: rel(el) })),
    testimonials: reviews.map((el) => ({ ty: ty(el), frameCentreOffset: rel(el) })),
    // A registered ScrollTrigger stamps its instances; without the plugin this
    // is 0 because no instance can be constructed.
    triggerCount: (window.ScrollTrigger && window.ScrollTrigger.getAll)
      ? window.ScrollTrigger.getAll().length
      : 'not exposed on window'
  })
})()
