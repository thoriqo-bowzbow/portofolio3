(() => {
  const ty = (el) => {
    const t = getComputedStyle(el).transform
    if (!t || t === 'none') return 0
    const m = t.match(/matrix3?d?\(([^)]+)\)/)
    if (!m) return 0
    const p = m[1].split(',').map(Number)
    return p.length === 16 ? Math.round(p[13] * 100) / 100 : Math.round(p[5] * 100) / 100
  }

  const rows = Array.from(document.querySelectorAll('[data-scroll-speed]')).map((el) => {
    const r = el.getBoundingClientRect()
    const speed = parseFloat(el.getAttribute('data-scroll-speed'))
    const cls = typeof el.className === 'string' ? el.className : ''
    return {
      cls,
      tag: el.tagName.toLowerCase(),
      speed,
      viewportY: Math.round(r.top),
      h: Math.round(r.height),
      translateY: ty(el),
      // derived rate: translateY per px scrolled, if consistent
      rate: null
    }
  })

  // Only report elements currently intersecting the viewport
  const visible = rows.filter((r) => r.viewportY < innerHeight && r.viewportY + r.h > 0)

  return JSON.stringify(
    {
      scrollY: Math.round(window.scrollY),
      total: rows.length,
      visibleCount: visible.length,
      visible: visible.slice(0, 20),
      zeroTransformVisible: visible.filter((r) => r.translateY === 0).length
    },
    null,
    1
  )
})()
