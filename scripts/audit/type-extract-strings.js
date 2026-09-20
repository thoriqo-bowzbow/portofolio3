/**
 * Extracts every string actually rendered in the display face, so width fidelity
 * and line wrapping can be tested against the real content rather than a
 * hand-picked sample of four headings.
 */
(() => {
  const displayFamily = getComputedStyle(document.body)
    .getPropertyValue('--font-display')
    .trim()

  const isDisplay = (el) => {
    const ff = getComputedStyle(el).fontFamily
    // Match on the resolved family name of the display token
    return /Trirong|Playfair|SK Zweig/i.test(ff)
  }

  const seen = new Set()
  const out = []

  document.querySelectorAll('body *').forEach((el) => {
    if (el.children.length) return // leaf text nodes only
    const text = (el.textContent || '').trim()
    if (!text || text.length < 2) return
    if (!isDisplay(el)) return

    const cs = getComputedStyle(el)
    const key = text + '|' + cs.fontSize + '|' + cs.fontWeight
    if (seen.has(key)) return
    seen.add(key)

    out.push({
      text,
      fontSize: parseFloat(cs.fontSize),
      fontWeight: cs.fontWeight,
      // Width the string occupies at its rendered size
      renderedWidth: Math.round(el.getBoundingClientRect().width * 100) / 100,
      cls: String(el.className).slice(0, 60)
    })
  })

  return JSON.stringify({ count: out.length, strings: out }, null, 1)
})()
