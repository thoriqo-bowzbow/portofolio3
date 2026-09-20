/**
 * Regression sweep after adding the modal.
 *
 * The modal touches the layout shell and the header, so the features completed in
 * earlier passes are re-checked rather than assumed: the P0 scroll-scrubbed video,
 * the P1 hero layer parallax, the P0 loader, the display typography, and the
 * standalone contact section the modal was carved out of.
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

  const hero = document.querySelector('.hero__scroller')
  const range = hero ? Math.max(1, hero.offsetHeight - window.innerHeight) : 1
  const progress = hero ? Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / range)) : 0

  const video = document.querySelector('.hero__video')
  const loader = document.querySelector('.site-loader')
  const contact = document.querySelector('#contact')
  const contactForm = document.querySelector('#contact-form')
  const contactInputs = contactForm ? contactForm.querySelectorAll('input, textarea').length : 0

  const displayEl = document.querySelector('.hero__title-text')

  return JSON.stringify({
    scrollY: Math.round(window.scrollY),
    heroProgress: Math.round(progress * 1000) / 1000,

    video: video
      ? {
          present: true,
          duration: video.duration,
          currentTime: Math.round(video.currentTime * 1000) / 1000,
          paused: video.paused,
          opacity: getComputedStyle(video).opacity
        }
      : { present: false },

    heroParallax: {
      title: ty(document.querySelector('.hero__title')),
      desc: ty(document.querySelector('.hero__desc-text')),
      countNum: ty(document.querySelector('.hero-block__count-num'))
    },

    loader: { present: !!loader },

    // Top-level sections, so a missing one is obvious
    sections: Array.from(document.querySelectorAll('section[id]')).map((s) => s.id),

    contact: {
      present: !!contact,
      formPresent: !!contactForm,
      fieldCount: contactInputs,
      // The modal must not have replaced this surface
      formIsInsideModal: !!(contactForm && contactForm.closest('.modal'))
    },

    displayFont: displayEl
      ? getComputedStyle(displayEl).fontFamily.split(',')[0].replace(/"/g, '')
      : null,

    modal: { present: !!document.querySelector('.modal') }
  })
})()
