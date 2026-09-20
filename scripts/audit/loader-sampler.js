// Injected before page load so the whole intro sequence is captured.
// Samples the reference's intro overlay at 100ms intervals into window.__ldr.
(() => {
  window.__ldr = { samples: [], startedAt: performance.now() }

  const num = (v) => {
    const n = parseFloat(v)
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : v
  }

  const readTransform = (el) => {
    if (!el) return null
    const t = getComputedStyle(el).transform
    if (!t || t === 'none') return 'none'
    const m = t.match(/matrix3?d?\(([^)]+)\)/)
    if (!m) return t
    const p = m[1].split(',').map(Number)
    return p.length === 16 ? { tx: num(p[12]), ty: num(p[13]) } : { tx: num(p[4]), ty: num(p[5]) }
  }

  const tick = () => {
    const wrap = document.querySelector('.md-introloader')
    const curtain = document.querySelector('.md-loader')
    const cols = Array.from(document.querySelectorAll('.csmodo__num'))
    const numbers = document.querySelector('.csmodo__numbers')
    const firstDigit = document.querySelector('.csmodo__num-item')

    if (wrap || curtain) {
      window.__ldr.samples.push({
        t: Math.round(performance.now() - window.__ldr.startedAt),
        introloader: wrap
          ? {
              cls: wrap.className,
              opacity: getComputedStyle(wrap).opacity,
              display: getComputedStyle(wrap).display,
              visibility: getComputedStyle(wrap).visibility,
              bg: getComputedStyle(wrap).backgroundColor,
              padding: getComputedStyle(wrap).padding,
              alignItems: getComputedStyle(wrap).alignItems,
              justifyContent: getComputedStyle(wrap).justifyContent,
              rect: [Math.round(wrap.getBoundingClientRect().width), Math.round(wrap.getBoundingClientRect().height)]
            }
          : null,
        curtain: curtain ? { cls: curtain.className, blocks: curtain.querySelectorAll('.md-loader__block').length } : null,
        numbers: numbers
          ? {
              rect: [num(numbers.getBoundingClientRect().width), num(numbers.getBoundingClientRect().height)],
              transform: readTransform(numbers),
              top: num(numbers.getBoundingClientRect().top),
              left: num(numbers.getBoundingClientRect().left)
            }
          : null,
        colCount: cols.length,
        cols: cols.map((c) => ({
          left: getComputedStyle(c).left,
          transform: readTransform(c),
          transitionDuration: getComputedStyle(c).transitionDuration,
          transitionTiming: getComputedStyle(c).transitionTimingFunction
        })),
        digitFont: firstDigit
          ? {
              family: getComputedStyle(firstDigit).fontFamily,
              size: getComputedStyle(firstDigit).fontSize,
              lineHeight: getComputedStyle(firstDigit).lineHeight,
              color: getComputedStyle(firstDigit).color
            }
          : null,
        // Which digit is currently centred in the 207.2px window
        visible: (() => {
          if (!cols.length) return null
          const out = []
          cols.forEach((c) => {
            const items = Array.from(c.querySelectorAll('.csmodo__num-item'))
            const cr = c.getBoundingClientRect()
            // The window is the .csmodo__numbers box
            const wr = numbers.getBoundingClientRect()
            let best = null
            items.forEach((it) => {
              const ir = it.getBoundingClientRect()
              const overlap = Math.min(ir.bottom, wr.bottom) - Math.max(ir.top, wr.top)
              if (overlap > 0 && (!best || overlap > best.overlap)) best = { d: it.textContent.trim(), overlap: Math.round(overlap) }
            })
            out.push(best ? best.d : '?')
            void cr
          })
          return out.join('')
        })()
      })
    }

    if (performance.now() - window.__ldr.startedAt < 9000) requestAnimationFrame(tick)
  }

  requestAnimationFrame(tick)
})()
