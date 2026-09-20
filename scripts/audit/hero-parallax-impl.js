/**
 * Hero layer parallax probe — run against this implementation.
 *
 * Reports each layer's runtime `translateY` (matrix index 13) alongside the hero's
 * scroll progress and the scroll distance that produced it, so the effective rate
 * can be checked against the rule rather than eyeballed.
 *
 * Usage: pipe through `agent-browser eval --stdin`, or call
 * `scripts/audit/hero-parallax-sweep.mjs` to sweep positions automatically.
 */
(() => {
  const ty = (el) => {
    if (!el) return null
    const t = getComputedStyle(el).transform
    if (!t || t === 'none') return 0
    const m = t.match(/matrix3?d?\(([^)]+)\)/)
    if (!m) return null
    const p = m[1].split(',').map(Number)
    const v = p.length === 16 ? p[13] : p[5]
    return Math.round(v * 100) / 100
  }

  const hero = document.querySelector('.hero__scroller') || document.querySelector('.hero')
  if (!hero) return JSON.stringify({ error: 'hero not found' })

  const rect = hero.getBoundingClientRect()
  const range = Math.max(1, hero.offsetHeight - window.innerHeight)
  const progress = Math.min(1, Math.max(0, -rect.top / range))

  const LAYERS = {
    title: '.hero__title',
    titleText: '.hero__title-text',
    desc: '.hero__desc-text',
    countNum: '.hero-block__count-num',
    countImg: '.hero-block__count-image',
    infoTitle: '.hero-block__info-title',
    infoDesc: '.hero-block__info-desc',
    infoActions: '.hero-block__info-actions'
  }

  const out = {
    scrollY: Math.round(window.scrollY),
    heroHeight: hero.offsetHeight,
    viewport: window.innerHeight,
    range: Math.round(range),
    progress: Math.round(progress * 1000) / 1000,
    layers: {},
    // Distinct elements per layer — the story layers resolve to several nodes
    counts: {}
  }

  for (const [key, selector] of Object.entries(LAYERS)) {
    const els = Array.from(document.querySelectorAll(selector))
    out.counts[key] = els.length
    out.layers[key] = els.slice(0, 3).map(ty)
  }

  // Whether ScrollTrigger actually registered — the failure this fix exists for
  out.scrollTriggerRegistered = Boolean(
    window.ScrollTrigger ||
      (window.gsap && window.gsap.core && window.gsap.core.globals && window.gsap.core.globals().ScrollTrigger)
  )

  return JSON.stringify(out)
})()
