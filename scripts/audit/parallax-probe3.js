(() => {
  const attrs = (el) =>
    Array.from(el.attributes)
      .map((a) => a.name)
      .filter((n) => n.startsWith('data-'))
      .join(',')

  const rows = Array.from(document.querySelectorAll('[data-scroll-speed]')).map((el) => {
    const cls = typeof el.className === 'string' ? el.className : ''
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return {
      cls,
      speed: el.getAttribute('data-scroll-speed'),
      dataAttrs: attrs(el),
      hasDataScroll: el.hasAttribute('data-scroll'),
      pos: cs.position,
      transform: cs.transform === 'none' ? 'none' : cs.transform.slice(0, 40),
      top: cs.top,
      willChange: cs.willChange,
      viewportY: Math.round(r.top)
    }
  })

  // Group by class so the summary is readable
  const byClass = {}
  rows.forEach((r) => {
    if (!byClass[r.cls]) byClass[r.cls] = { n: 0, hasDataScroll: r.hasDataScroll, attrs: r.dataAttrs, speeds: [], transformed: 0 }
    byClass[r.cls].n += 1
    byClass[r.cls].speeds.push(r.speed)
    if (r.transform !== 'none') byClass[r.cls].transformed += 1
  })

  return JSON.stringify(byClass, null, 1)
})()
