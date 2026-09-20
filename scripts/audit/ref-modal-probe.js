/**
 * Captures the reference's request modal end to end: what the trigger is, the
 * panel's geometry, every field's box and label, and the entrance animation
 * sampled frame by frame from the click.
 *
 * Installs itself before page load so the opening frames are not missed — the
 * earlier recon could not observe this end to end, which is why the modal was
 * excluded from the first build.
 */
(() => {
  const ty = (el) => {
    if (!el) return null
    const t = getComputedStyle(el).transform
    if (!t || t === 'none') return { tx: 0, ty: 0 }
    const m = t.match(/matrix3?d?\(([^)]+)\)/)
    if (!m) return null
    const p = m[1].split(',').map(Number)
    return p.length === 16
      ? { tx: Math.round(p[12] * 100) / 100, ty: Math.round(p[13] * 100) / 100 }
      : { tx: Math.round(p[4] * 100) / 100, ty: Math.round(p[5] * 100) / 100 }
  }

  const snap = (label) => {
    const wrap = document.querySelector('.md-lvp__wrapper')
    const panel = document.querySelector('.md-lvp')
    if (!wrap) return { label, t: null, wrap: 'absent' }

    const wcs = getComputedStyle(wrap)
    const pcs = panel ? getComputedStyle(panel) : null
    const wr = wrap.getBoundingClientRect()
    const pr = panel ? panel.getBoundingClientRect() : null

    const el = (sel) => {
      const e = document.querySelector(sel)
      if (!e) return null
      const r = e.getBoundingClientRect()
      const cs = getComputedStyle(e)
      return {
        rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
        font: cs.fontSize + '/' + cs.fontWeight + ' ' + cs.fontFamily.split(',')[0],
        color: cs.color,
        bg: cs.backgroundColor,
        padding: cs.padding
      }
    }

    return {
      label,
      t: Math.round(performance.now()),
      wrap: {
        cls: wrap.className,
        opacity: wcs.opacity,
        visibility: wcs.visibility,
        display: wcs.display,
        zIndex: wcs.zIndex,
        bg: wcs.backgroundColor,
        backdrop: wcs.backdropFilter || wcs.webkitBackdropFilter,
        transition: wcs.transition,
        transform: ty(wrap),
        animation: wcs.animationName + ' ' + wcs.animationDuration + ' ' + wcs.animationTimingFunction,
        rect: [Math.round(wr.width), Math.round(wr.height)]
      },
      panel: panel
        ? {
            cls: panel.className,
            opacity: pcs.opacity,
            transform: ty(panel),
            transition: pcs.transition,
            animation: pcs.animationName + ' ' + pcs.animationDuration,
            rect: [Math.round(pr.left), Math.round(pr.top), Math.round(pr.width), Math.round(pr.height)],
            padding: pcs.padding,
            bg: pcs.backgroundColor,
            radius: pcs.borderRadius,
            display: pcs.display,
            flexDirection: pcs.flexDirection,
            alignItems: pcs.alignItems
          }
        : null,
      close: el('.md-lvp__close, .md-lvp .md-close, .md-lvp button'),
      title: el('.md-lvp__title'),
      inputs: Array.from(document.querySelectorAll('.md-lvp .md-input')).map((i) => ({
        rect: (() => {
          const r = i.getBoundingClientRect()
          return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]
        })(),
        tag: i.tagName,
        type: i.getAttribute('type'),
        placeholder: i.getAttribute('placeholder'),
        cls: i.className,
        label: i.getAttribute('aria-label'),
        id: i.id
      })),
      textarea: el('.md-lvp .md-textarea'),
      buttons: Array.from(document.querySelectorAll('.md-lvp .mdbtn')).map((b) => {
        const r = b.getBoundingClientRect()
        const cs = getComputedStyle(b)
        return {
          text: b.textContent.trim().slice(0, 40),
          rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
          bg: cs.backgroundColor,
          color: cs.color,
          font: cs.fontSize
        }
      }),
      wordCount: el('.md-lvp__count, .md-lvp__hint, .md-lvp small')
    }
  }

  window.__modal = { samples: [], marks: [] }

  // Sample continuously so the opening frames are captured
  let sampling = false
  window.__startSampling = (ms) => {
    window.__modal.samples = []
    sampling = true
    const t0 = performance.now()
    const tick = () => {
      if (!sampling) return
      window.__modal.samples.push(snap('t+' + Math.round(performance.now() - t0)))
      if (performance.now() - t0 < ms) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }
  window.__stopSampling = () => {
    sampling = false
  }
  window.__snap = snap
})()
