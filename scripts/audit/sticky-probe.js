(() => {
  const probe = () => {
    const out = {}
    ;[
      '.md-about__titling',
      '.md-exp__titling',
      '.md-glry__titling',
      '.md-rvws__titling',
      '.md-contact__titling'
    ].forEach((s) => {
      const el = document.querySelector(s)
      if (!el) return
      const cs = getComputedStyle(el)
      const r = el.getBoundingClientRect()
      out[s] = {
        pos: cs.position,
        top: cs.top,
        viewportY: Math.round(r.top),
        docY: Math.round(r.top + window.scrollY),
        inlineTop: el.style.top || '',
        inlinePos: el.style.position || ''
      }
    })
    return { scrollY: Math.round(window.scrollY), nodes: out }
  }
  return JSON.stringify(probe(), null, 1)
})()
