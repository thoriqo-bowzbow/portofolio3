(() => {
  const ty = (el) => {
    if (!el) return null
    const t = getComputedStyle(el).transform
    if (!t || t === 'none') return 0
    const m = t.match(/matrix3?d?\(([^)]+)\)/)
    if (!m) return 0
    const p = m[1].split(',').map(Number)
    return p.length === 16 ? Math.round(p[13] * 100) / 100 : Math.round(p[5] * 100) / 100
  }
  const g = Array.from(document.querySelectorAll('.md-glrycard__image'))
  const r = Array.from(document.querySelectorAll('.md-rvwcard__image'))
  const blocks = Array.from(document.querySelectorAll('.md-block__count-image'))
  return JSON.stringify({
    scrollY: Math.round(window.scrollY),
    gallery: g.map((el, i) => ({ i, speed: +(el.getAttribute('data-scroll-speed') || 0).slice(0, 5), ty: ty(el), vy: Math.round(el.getBoundingClientRect().top) })),
    rvw: r.map((el, i) => ({ i, speed: el.getAttribute('data-scroll-speed'), ty: ty(el), vy: Math.round(el.getBoundingClientRect().top) })),
    blockImgs: blocks.map((el, i) => ({ i, speed: el.getAttribute('data-scroll-speed'), ty: ty(el), vy: Math.round(el.getBoundingClientRect().top) }))
  })
})()
