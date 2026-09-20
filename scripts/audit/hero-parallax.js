(() => {
  const ty = (el) => {
    if (!el) return 'missing'
    const t = getComputedStyle(el).transform
    if (!t || t === 'none') return 0
    const m = t.match(/matrix3?d?\(([^)]+)\)/)
    if (!m) return 0
    const p = m[1].split(',').map(Number)
    return p.length === 16 ? Math.round(p[13] * 100) / 100 : Math.round(p[5] * 100) / 100
  }
  const q = (s) => document.querySelector(s)
  return JSON.stringify({
    scrollY: Math.round(window.scrollY),
    title: { speed: q('.md-interctv__title')?.getAttribute('data-scroll-speed'), ty: ty(q('.md-interctv__title')) },
    desc: { speed: q('.md-interctv__desc')?.getAttribute('data-scroll-speed'), ty: ty(q('.md-interctv__desc')) },
    holderImg: { speed: q('.md-interctv__holder-image')?.getAttribute('data-scroll-speed'), ty: ty(q('.md-interctv__holder-image')) },
    b1num: { speed: q('.md-block-1 .md-block__count-num')?.getAttribute('data-scroll-speed'), ty: ty(q('.md-block-1 .md-block__count-num')) },
    b1img: { speed: q('.md-block-1 .md-block__count-image')?.getAttribute('data-scroll-speed'), ty: ty(q('.md-block-1 .md-block__count-image')) },
    b1title: { speed: q('.md-block-1 .md-block__info-title')?.getAttribute('data-scroll-speed'), ty: ty(q('.md-block-1 .md-block__info-title')) },
    b1desc: { speed: q('.md-block-1 .md-block__info-desc')?.getAttribute('data-scroll-speed'), ty: ty(q('.md-block-1 .md-block__info-desc')) },
    b1btn: { speed: q('.md-block-1 .mdbtn')?.getAttribute('data-scroll-speed'), ty: ty(q('.md-block-1 .mdbtn')) }
  })
})()
