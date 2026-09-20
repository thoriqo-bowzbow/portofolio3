/**
 * Modal probe — run against this implementation.
 *
 * Reports the same surface the reference was measured with, so the two can be
 * diffed directly: scrim colour/blur/z-index, panel box and padding, every field's
 * box and typography, the hint, the submit button, the animation currently
 * applied, scroll-lock state, and where focus sits.
 */
(() => {
  const px = (v) => Math.round(parseFloat(v) * 100) / 100
  const rect = (el) => {
    if (!el) return null
    const r = el.getBoundingClientRect()
    return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]
  }
  const cs = (el, ...p) => {
    if (!el) return null
    const s = getComputedStyle(el)
    return p.reduce((o, k) => ((o[k] = s[k]), o), {})
  }

  const modal = document.querySelector('.modal')
  if (!modal) {
    return JSON.stringify({
      present: false,
      scrollLocked: getComputedStyle(document.body).overflow,
      activeElement: document.activeElement
        ? String(document.activeElement.className || document.activeElement.tagName).slice(0, 50)
        : null
    })
  }

  const scrim = modal.querySelector('.modal__scrim')
  const panel = modal.querySelector('.modal__panel')

  const fields = Array.from(panel.querySelectorAll('input, textarea')).map((el) => ({
    tag: el.tagName,
    id: el.id,
    type: el.getAttribute('type'),
    placeholder: el.getAttribute('placeholder'),
    ariaInvalid: el.getAttribute('aria-invalid'),
    ariaDescribedby: el.getAttribute('aria-describedby'),
    rect: rect(el),
    style: cs(el, 'fontSize', 'fontWeight', 'color', 'borderColor', 'borderWidth', 'borderRadius', 'padding', 'backgroundColor')
  }))

  const labels = Array.from(panel.querySelectorAll('label, .field__label')).map((el) => ({
    text: el.textContent.trim().slice(0, 50),
    for: el.getAttribute('for'),
    rect: rect(el),
    color: getComputedStyle(el).color
  }))

  const errors = Array.from(panel.querySelectorAll('[role="alert"], .field__error')).map((el) => ({
    id: el.id,
    text: el.textContent.trim().slice(0, 80),
    rect: rect(el)
  }))

  return JSON.stringify(
    {
      present: true,
      modalClass: modal.className,
      scrim: cs(scrim, 'backgroundColor', 'backdropFilter', 'position', 'zIndex'),
      scrimRect: rect(scrim),
      panel: {
        rect: rect(panel),
        role: panel.getAttribute('role'),
        ariaModal: panel.getAttribute('aria-modal'),
        ariaLabelledby: panel.getAttribute('aria-labelledby'),
        labelledByExists: !!document.getElementById(panel.getAttribute('aria-labelledby')),
        style: cs(panel, 'padding', 'backgroundColor', 'borderRadius', 'maxWidth', 'maxHeight', 'overflowY')
      },
      title: (() => {
        const t = panel.querySelector('#request-modal-title')
        return t
          ? { text: t.textContent.trim(), rect: rect(t), style: cs(t, 'fontSize', 'fontWeight', 'fontFamily', 'color', 'marginTop') }
          : null
      })(),
      desc: (() => {
        const d = panel.querySelector('.request__desc')
        return d ? { rect: rect(d), style: cs(d, 'fontSize', 'color') } : null
      })(),
      fields,
      labels,
      errors,
      hint: (() => {
        const h = panel.querySelector('.request__hint')
        return h ? { text: h.textContent.trim(), rect: rect(h), style: cs(h, 'fontSize', 'color', 'textAlign') } : null
      })(),
      notice: (() => {
        const n = panel.querySelector('.request__notice')
        return n ? { text: n.textContent.trim().slice(0, 90), role: n.getAttribute('role') } : null
      })(),
      submit: (() => {
        const b = panel.querySelector('button[type="submit"]')
        return b
          ? {
              text: b.textContent.trim(),
              rect: rect(b),
              style: cs(b, 'backgroundColor', 'padding', 'borderRadius', 'height'),
              loading: b.classList.contains('is-loading')
            }
          : null
      })(),
      close: (() => {
        const c = panel.querySelector('.request__close')
        return c
          ? { rect: rect(c), label: c.getAttribute('aria-label'), style: cs(c, 'position', 'top', 'right', 'width', 'height') }
          : null
      })(),
      scrollLocked: getComputedStyle(document.body).overflow,
      bodyPaddingRight: document.body.style.paddingRight || '(none)',
      activeElement: document.activeElement
        ? {
            tag: document.activeElement.tagName,
            id: document.activeElement.id,
            cls: String(document.activeElement.className).slice(0, 50)
          }
        : null
    },
    null,
    1
  )
})()
