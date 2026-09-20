/**
 * Checks whether the reference's story-block info column overlaps itself.
 *
 * `.md-block__info-title` carries speed 0.5 and `.md-block__info-desc` speed 2 —
 * a 4x ratio. In a tightly stacked flex column a differential that large would
 * drive the description up through the title. This measures the real rectangles
 * to find out whether the reference actually collides, or whether something else
 * (a reveal animation, a margin, a larger gap) absorbs the difference.
 */
(() => {
  const rect = (el) => {
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height) }
  }
  const ty = (el) => {
    if (!el) return null
    const t = getComputedStyle(el).transform
    if (!t || t === 'none') return 0
    const m = t.match(/matrix3?d?\(([^)]+)\)/)
    if (!m) return null
    const p = m[1].split(',').map(Number)
    return Math.round((p.length === 16 ? p[13] : p[5]) * 100) / 100
  }

  const out = {}
  for (const n of [1, 2, 3]) {
    const block = document.querySelector(`.md-block-${n}`)
    if (!block) continue
    const title = block.querySelector('.md-block__info-title')
    const desc = block.querySelector('.md-block__info-desc')
    const btn = block.querySelector('.mdbtn')
    const info = block.querySelector('.md-block__info')

    const t = rect(title)
    const d = rect(desc)
    const b = rect(btn)

    out[`block${n}`] = {
      info: rect(info),
      title: { ...t, ty: ty(title), speed: title?.getAttribute('data-scroll-speed') },
      desc: { ...d, ty: ty(desc), speed: desc?.getAttribute('data-scroll-speed') },
      btn: { ...b, ty: ty(btn), speed: btn?.getAttribute('data-scroll-speed') },
      // Negative gap means the description has risen above the title's baseline
      titleToDescGap: t && d ? d.top - t.bottom : null,
      descToBtnGap: d && b ? b.top - d.bottom : null
    }
  }
  return JSON.stringify(out, null, 1)
})()
