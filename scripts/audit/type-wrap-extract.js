/**
 * Lists every display-face element with the width it actually has to wrap inside,
 * so line breaking can be compared between SK Zweig and a substitute using the
 * site's real content and real containers.
 */
(() => {
  const out = []

  document.querySelectorAll('body *').forEach((el) => {
    if (el.children.length) return
    const text = (el.textContent || '').trim()
    if (text.length < 2) return

    const cs = getComputedStyle(el)
    if (!/Trirong|Playfair|SK Zweig/i.test(cs.fontFamily)) return
    if (cs.display === 'none' || cs.visibility === 'hidden') return

    const rect = el.getBoundingClientRect()
    if (rect.width < 4) return

    // The width the text actually has to wrap inside is the *parent's* content
    // box, not the element's own — these elements are fit-content, so their
    // clientWidth just equals the text width and would make every wrap test
    // degenerate.
    const parent = el.parentElement
    if (!parent) return
    const pcs = getComputedStyle(parent)
    const contentWidth =
      parent.clientWidth -
      parseFloat(pcs.paddingLeft || 0) -
      parseFloat(pcs.paddingRight || 0)

    if (contentWidth < 4) return

    const r = el.getBoundingClientRect()
    const lineHeight = parseFloat(cs.lineHeight)
    const lines = Number.isFinite(lineHeight) && lineHeight > 0
      ? Math.max(1, Math.round(r.height / lineHeight))
      : 1

    out.push({
      text,
      fontSize: parseFloat(cs.fontSize),
      fontWeight: cs.fontWeight,
      contentWidth: Math.round(contentWidth * 100) / 100,
      renderedLines: lines,
      // Elements carrying the scramble effect are `white-space: nowrap`, so they
      // never wrap no matter how wide the text gets — simulating a wrap for them
      // produces phantom differences. Recorded so the wrap test can skip them.
      whiteSpace: cs.whiteSpace,
      canWrap: cs.whiteSpace !== 'nowrap' && cs.whiteSpace !== 'pre',
      // How far the text extends past the container, which is what nowrap
      // elements do instead of wrapping
      overflowPx: Math.round((r.width - contentWidth) * 100) / 100,
      cls: String(el.className).slice(0, 48)
    })
  })

  // One entry per unique text/size/weight/width combination
  const seen = new Set()
  const unique = out.filter((o) => {
    const k = [o.text, o.fontSize, o.fontWeight, o.contentWidth].join('|')
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })

  return JSON.stringify(unique, null, 1)
})()
