/**
 * Reconciliation verification probe.
 *
 * Confirms in one pass:
 *
 * - the image **reservoir geometry** survived the motion removal (the crop is part
 *   of the composition and had to stay: 160%/-30% gallery, 130%/-15% testimonial)
 * - nothing writes a transform to those images any more
 * - the features that must not regress are still working: hero parallax, hero
 *   video scrub, loader, header scroll state, modal
 */
(() => {
  const ty = (el) => {
    if (!el) return null
    const t = getComputedStyle(el).transform
    if (!t || t === 'none') return 0
    const m = t.match(/matrix3?d?\(([^)]+)\)/)
    if (!m) return null
    const p = m[1].split(',').map(Number)
    return Math.round((p.length === 16 ? p[13] : p[5]) * 100) / 100
  }
  const r2 = (n) => Math.round(n * 100) / 100

  /* --- reservoir geometry ------------------------------------------------- */
  const frame = (el) => {
    const card = el.closest('.highlight-tile, .testimonial-card')
    if (!card) return null
    const cr = card.getBoundingClientRect()
    const ir = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return {
      cardH: Math.round(cr.height),
      imgH: Math.round(ir.height),
      heightPct: r2((ir.height / cr.height) * 100),
      // Offset of the image's top from the card's top, as a % of card height
      topPct: r2(((ir.top - cr.top) / cr.height) * 100),
      cssHeight: cs.height,
      cssTop: cs.top,
      objectFit: cs.objectFit,
      position: cs.position,
      willChange: cs.willChange,
      transform: ty(el)
    }
  }

  const galleryImg = document.querySelector('.highlight-tile__image')
  const reviewImg = document.querySelector('.testimonial-card__image')

  /* --- hero layers -------------------------------------------------------- */
  const hero = document.querySelector('.hero__scroller')
  const range = hero ? Math.max(1, hero.offsetHeight - window.innerHeight) : 1
  const progress = hero ? Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / range)) : 0

  const video = document.querySelector('.hero__video')

  /* --- header ------------------------------------------------------------- */
  const header = document.querySelector('.site-header')

  return JSON.stringify(
    {
      scrollY: Math.round(window.scrollY),

      reservoir: {
        gallery: galleryImg ? frame(galleryImg) : null,
        testimonial: reviewImg ? frame(reviewImg) : null
      },

      imageMotion: {
        gallery: Array.from(document.querySelectorAll('.highlight-tile__image')).map(ty),
        testimonial: Array.from(document.querySelectorAll('.testimonial-card__image')).map(ty)
      },

      scrollHint: {
        present: !!document.querySelector('.hero__scroll-hint'),
        line: !!document.querySelector('.hero__scroll-hint-line')
      },

      hero: {
        progress: Math.round(progress * 1000) / 1000,
        layers: {
          title: ty(document.querySelector('.hero__title')),
          desc: ty(document.querySelector('.hero__desc-text')),
          countNum: ty(document.querySelector('.hero-block__count-num')),
          countImg: ty(document.querySelector('.hero-block__count-image')),
          infoTitle: ty(document.querySelector('.hero-block__info-title')),
          infoDesc: ty(document.querySelector('.hero-block__info-desc')),
          infoActions: ty(document.querySelector('.hero-block__info-actions'))
        }
      },

      video: video
        ? {
            present: true,
            currentTime: Math.round(video.currentTime * 1000) / 1000,
            duration: video.duration,
            paused: video.paused,
            opacity: getComputedStyle(video).opacity
          }
        : { present: false },

      loader: { present: !!document.querySelector('.site-loader') },

      header: {
        present: !!header,
        isScrolled: header ? header.classList.contains('is-scrolled') : null,
        position: header ? getComputedStyle(header).position : null
      },

      modal: {
        triggerPresent: !!Array.from(document.querySelectorAll('button')).find((b) =>
          /get in touch/i.test(b.textContent)
        ),
        open: !!document.querySelector('.modal')
      },

      type: {
        displayFont: (() => {
          const el = document.querySelector('.hero__title-text')
          return el ? getComputedStyle(el).fontFamily.split(',')[0].replace(/"/g, '') : null
        })()
      }
    },
    null,
    1
  )
})()
