/**
 * Establishes what the reference's transforms are relative to.
 *
 * The hero section itself carries a transform, so reading a layer's transform in
 * isolation cannot tell whether it is parallax or just inherited scroll. This
 * walks the ancestor chain and reports each element's own transform plus the
 * scroll-related attributes, and cross-checks with a fixed-position reference
 * (an element's viewport rect is the ground truth for how far the page has
 * actually moved).
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

  const attr = (el, name) => (el ? el.getAttribute(name) : null)

  const hero = document.querySelector('.md-interctv')

  const chain = []
  let el = hero
  while (el && el !== document.documentElement) {
    chain.push({
      tag: el.tagName,
      cls: String(el.className).slice(0, 44),
      ownTy: ty(el),
      speed: attr(el, 'data-scroll-speed'),
      sticky: attr(el, 'data-scroll-sticky'),
      target: attr(el, 'data-scroll-target'),
      section: attr(el, 'data-scroll-section'),
      position: getComputedStyle(el).position,
      // Viewport rect is the ground truth: it folds in every ancestor transform
      rectTop: Math.round(el.getBoundingClientRect().top * 100) / 100
    })
    el = el.parentElement
  }

  // The first element after the hero that is NOT part of the hero — its rect.top
  // tells us how far the document has genuinely travelled.
  const after = document.querySelector('.md-block-1') || document.querySelector('section + *')

  return JSON.stringify(
    {
      windowScrollY: Math.round(window.scrollY),
      heroRectTop: Math.round(hero.getBoundingClientRect().top * 100) / 100,
      // How far the hero has moved up the viewport = the effective scroll
      heroScrolledBy: Math.round((0 - hero.getBoundingClientRect().top) * 100) / 100,
      titleTy: ty(document.querySelector('.md-interctv__title')),
      descTy: ty(document.querySelector('.md-interctv__desc')),
      ancestorChain: chain
    },
    null,
    1
  )
})()
