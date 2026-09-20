/**
 * Fills in the modal details the first pass could not locate by guessed selector:
 * the word-count hint, the textarea placeholder, the close button's markup, the
 * button's resting colours, and every text node inside the panel in document
 * order — so nothing is inferred from a selector that happened to match.
 */
(() => {
  const panel = document.querySelector('.md-lvp')
  if (!panel) return JSON.stringify({ error: 'no .md-lvp' })

  const cs = (el, ...props) => {
    const s = getComputedStyle(el)
    return props.reduce((o, p) => ((o[p] = s[p]), o), {})
  }

  // Every leaf text node in the panel, in order, with its computed style
  const texts = []
  panel.querySelectorAll('*').forEach((el) => {
    if (el.children.length) return
    const t = (el.textContent || '').trim()
    if (!t) return
    const r = el.getBoundingClientRect()
    const s = getComputedStyle(el)
    texts.push({
      text: t.slice(0, 60),
      tag: el.tagName,
      cls: String(el.className).slice(0, 44),
      rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
      font: `${s.fontSize}/${s.fontWeight} ${s.fontFamily.split(',')[0]}`,
      color: s.color,
      textAlign: s.textAlign
    })
  })

  const closeBtn = panel.querySelector('button, .md-lvp__close, [class*="close"]')
  const submit = Array.from(panel.querySelectorAll('.mdbtn, button')).find((b) =>
    /send/i.test(b.textContent)
  )
  const ta = panel.querySelector('textarea')

  return JSON.stringify(
    {
      panelChildren: Array.from(panel.children).map((el) => ({
        tag: el.tagName,
        cls: String(el.className).slice(0, 50),
        rect: (() => {
          const r = el.getBoundingClientRect()
          return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]
        })(),
        display: getComputedStyle(el).display
      })),
      close: closeBtn
        ? {
            tag: closeBtn.tagName,
            cls: String(closeBtn.className).slice(0, 50),
            html: closeBtn.innerHTML.slice(0, 160),
            style: cs(closeBtn, 'position', 'top', 'right', 'width', 'height', 'opacity', 'transition', 'background', 'border'),
            rect: (() => {
              const r = closeBtn.getBoundingClientRect()
              return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]
            })()
          }
        : null,
      textarea: ta
        ? {
            placeholder: ta.getAttribute('placeholder'),
            rows: ta.getAttribute('rows'),
            maxlength: ta.getAttribute('maxlength'),
            required: ta.hasAttribute('required'),
            cls: ta.className,
            style: cs(ta, 'fontSize', 'fontWeight', 'fontFamily', 'color', 'border', 'borderRadius', 'resize', 'outline'),
            id: ta.id,
            name: ta.getAttribute('name')
          }
        : null,
      submit: submit
        ? {
            text: submit.textContent.trim(),
            cls: submit.className,
            style: cs(submit, 'backgroundColor', 'color', 'fontSize', 'fontWeight', 'padding', 'borderRadius', 'border', 'textTransform', 'letterSpacing'),
            disabled: submit.disabled,
            type: submit.getAttribute('type'),
            html: submit.outerHTML.slice(0, 200)
          }
        : null,
      inputs: Array.from(panel.querySelectorAll('input')).map((i) => ({
        placeholder: i.getAttribute('placeholder'),
        type: i.getAttribute('type'),
        required: i.hasAttribute('required'),
        id: i.id,
        name: i.getAttribute('name'),
        cls: i.className,
        style: cs(i, 'fontSize', 'fontWeight', 'fontFamily', 'color', 'border', 'borderRadius', 'padding', 'background'),
        hasLabelEl: !!i.closest('label'),
        prevSiblingText:
          i.previousElementSibling && !i.previousElementSibling.children.length
            ? i.previousElementSibling.textContent.trim().slice(0, 40)
            : null
      })),
      texts
    },
    null,
    1
  )
})()
