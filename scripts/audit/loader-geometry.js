// Captures the reference intro overlay's full geometry + typography shortly
// after it appears, before it dismisses (~5.7s after load).
(() => {
  window.__ldrGeo = null
  const capture = () => {
    const wrap = document.querySelector('.md-introloader')
    const n = document.querySelector('.csmodo__numbers')
    if (!wrap || !n) return false

    const cols = Array.from(document.querySelectorAll('.csmodo__num'))
    const items = cols[0] ? Array.from(cols[0].querySelectorAll('.csmodo__num-item')) : []
    const r = (el) => {
      const b = el.getBoundingClientRect()
      return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]
    }
    const cs = (el, p) => getComputedStyle(el)[p]

    window.__ldrGeo = {
      wrapper: {
        rect: r(wrap),
        padding: cs(wrap, 'padding'),
        bg: cs(wrap, 'backgroundColor'),
        alignItems: cs(wrap, 'alignItems'),
        justifyContent: cs(wrap, 'justifyContent'),
        zIndex: cs(wrap, 'zIndex'),
        position: cs(wrap, 'position'),
        transition: cs(wrap, 'transition'),
        display: cs(wrap, 'display'),
        fontFamily: cs(wrap, 'fontFamily')
      },
      numbers: {
        cls: n.className,
        rect: r(n),
        width: cs(n, 'width'),
        height: cs(n, 'height'),
        overflow: cs(n, 'overflow'),
        display: cs(n, 'display'),
        willChange: cs(n, 'willChange'),
        position: cs(n, 'position')
      },
      colCount: cols.length,
      cols: cols.map((c) => ({
        rect: r(c),
        left: cs(c, 'left'),
        top: cs(c, 'top'),
        position: cs(c, 'position'),
        display: cs(c, 'display'),
        flexDirection: cs(c, 'flexDirection'),
        transitionDuration: cs(c, 'transitionDuration'),
        transitionTimingFunction: cs(c, 'transitionTimingFunction')
      })),
      itemCount: items.length,
      itemTexts: items.map((i) => i.textContent).join(''),
      item: items[0]
        ? {
            rect: r(items[0]),
            fontFamily: cs(items[0], 'fontFamily'),
            fontSize: cs(items[0], 'fontSize'),
            lineHeight: cs(items[0], 'lineHeight'),
            color: cs(items[0], 'color'),
            display: cs(items[0], 'display')
          }
        : null
    }
    return true
  }

  const start = performance.now()
  const poll = () => {
    if (capture() || performance.now() - start > 4000) return
    requestAnimationFrame(poll)
  }
  requestAnimationFrame(poll)
})()
