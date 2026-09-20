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

  const targets = {
    heroTitle: '.md-interctv__title',
    heroDesc: '.md-interctv__desc',
    blockCountImg: '.md-block-1 .md-block__count-image',
    blockCountNum: '.md-block-1 .md-block__count-num',
    blockInfoTitle: '.md-block-1 .md-block__info-title',
    galleryImg1: '.md-glrycard:nth-child(1) img',
    galleryImg2: '.md-glrycard:nth-child(2) img',
    galleryImg3: '.md-glrycard:nth-child(3) img',
    rvwImg1: '.md-rvwcard:nth-child(1) img',
    rvwImg2: '.md-rvwcard:nth-child(2) img'
  }

  const out = { scrollY: Math.round(window.scrollY), translateY: {}, docTop: {} }
  Object.entries(targets).forEach(([k, sel]) => {
    const el = document.querySelector(sel)
    out.translateY[k] = ty(el)
    out.docTop[k] = el ? Math.round(el.getBoundingClientRect().top + window.scrollY - ty(el)) : null
  })
  return JSON.stringify(out)
})()
