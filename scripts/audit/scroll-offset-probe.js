/**
 * Finds the reference's real scroll position.
 *
 * locomotive-scroll drives the page with a transform rather than native scroll,
 * so `window.scrollY` stays at 0 and cannot be used to derive a px-per-px rate.
 * The virtual scroll offset lives on the scroll container's transform (or on the
 * instance, if it is reachable). Without this, the ratio between two layers is
 * visible but the absolute rate is not.
 */
(() => {
  const ty = (el) => {
    if (!el) return null
    const t = getComputedStyle(el).transform
    if (!t || t === 'none') return 0
    const m = t.match(/matrix3?d?\(([^)]+)\)/)
    if (!m) return null
    const p = m[1].split(',').map(Number)
    return p.length === 16 ? Math.round(p[13] * 100) / 100 : Math.round(p[5] * 100) / 100
  }

  const container =
    document.querySelector('[data-scroll-container]') ||
    document.querySelector('#app > *') ||
    document.querySelector('#app')

  // The instance is not exposed globally, so read the transform instead.
  const containerTy = ty(container)

  // Any element whose transform reflects the raw scroll offset
  const candidates = {}
  ;['#app', '[data-scroll-container]', '.app', '.smooth-scroll', 'main'].forEach((s) => {
    const el = document.querySelector(s)
    if (el) candidates[s] = ty(el)
  })

  return JSON.stringify(
    {
      windowScrollY: Math.round(window.scrollY),
      documentScrollTop: Math.round(document.documentElement.scrollTop),
      bodyScrollTop: Math.round(document.body.scrollTop),
      containerSelector: container ? container.tagName + (container.id ? '#' + container.id : '') : null,
      containerTy,
      candidates,
      // The hero section's own offset — locomotive may translate inner sections
      // rather than the root container.
      titleTy: ty(document.querySelector('.md-interctv__title')),
      // Any element carrying a transform large enough to be the scroll offset
      bigTransforms: Array.from(document.querySelectorAll('div,main,section'))
        .map((el) => ({ cls: String(el.className).slice(0, 40), ty: ty(el) }))
        .filter((o) => o.ty !== null && Math.abs(o.ty) > 50)
        .slice(0, 8)
    },
    null,
    1
  )
})()
