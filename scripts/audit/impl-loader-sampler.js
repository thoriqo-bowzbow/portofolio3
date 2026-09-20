// Samples this implementation's intro overlay across its lifetime.
// Injected before page load so the whole sequence is captured.
(() => {
  window.__myldr = { samples: [], startedAt: performance.now() }

  const readTy = (el) => {
    if (!el) return null
    const t = getComputedStyle(el).transform
    if (!t || t === 'none') return 0
    const m = t.match(/matrix3?d?\(([^)]+)\)/)
    if (!m) return 0
    const p = m[1].split(',').map(Number)
    return Math.round((p.length === 16 ? p[13] : p[5]) * 100) / 100
  }

  const tick = () => {
    const wrap = document.querySelector('.site-loader')
    if (wrap) {
      const bar = wrap.querySelector('[role="progressbar"]')
      const cols = Array.from(wrap.querySelectorAll('.odometer__column'))
      const digits = Array.from(wrap.querySelectorAll('.odometer__digit'))
      const win = wrap.querySelector('.odometer__window')
      const glyph = wrap.querySelector('.odometer__glyph')
      const wr = wrap.getBoundingClientRect()
      const cr = bar ? bar.getBoundingClientRect() : null

      window.__myldr.samples.push({
        t: Math.round(performance.now() - window.__myldr.startedAt),
        value: bar ? bar.getAttribute('aria-valuenow') : null,
        cls: wrap.className,
        opacity: getComputedStyle(wrap).opacity,
        padding: getComputedStyle(wrap).padding,
        align: getComputedStyle(wrap).alignItems + '/' + getComputedStyle(wrap).justifyContent,
        bg: getComputedStyle(wrap).backgroundColor,
        overlay: [Math.round(wr.width), Math.round(wr.height)],
        counter: cr ? [Math.round(cr.left), Math.round(cr.top), Math.round(cr.width), Math.round(cr.height)] : null,
        window: win ? [Math.round(win.getBoundingClientRect().width), Math.round(win.getBoundingClientRect().height)] : null,
        cols: cols.map((c) => ({ left: getComputedStyle(c).left, ty: readTy(c) })),
        digitTys: digits.map(readTy),
        glyph: glyph
          ? {
              font: getComputedStyle(glyph).fontFamily.split(',')[0].replace(/"/g, ''),
              size: getComputedStyle(glyph).fontSize,
              lineHeight: getComputedStyle(glyph).lineHeight,
              color: getComputedStyle(glyph).color
            }
          : null
      })
    }

    if (performance.now() - window.__myldr.startedAt < 9000) requestAnimationFrame(tick)
  }

  requestAnimationFrame(tick)
})()
