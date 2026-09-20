/**
 * Renders the display-face shortlist on a http origin (Google Fonts will not load
 * from file://) so the candidates can be compared by eye against the page's own
 * type in the same conditions.
 */
(async () => {
  // Family names use single quotes: a double quote inside a double-quoted style
  // attribute terminates the attribute, which silently drops the whole
  // font-family declaration and renders everything in the page default.
  const FACES = [
    { label: 'Playfair Display — current', stack: "'Playfair Display', serif" },
    { label: 'Trirong — candidate 1', stack: "'Trirong', serif" },
    { label: 'Marcellus — candidate 2', stack: "'Marcellus', serif" },
    { label: 'DM Serif Display — candidate 3', stack: "'DM Serif Display', serif" },
    { label: 'Brawler — candidate 6', stack: "'Brawler', serif" }
  ]

  document.head.innerHTML = ''
  document.body.innerHTML = ''
  document.body.style.cssText = 'margin:0;padding:26px 36px;background:#fff;color:#252324'

  const fontLink = document.createElement('link')
  fontLink.rel = 'stylesheet'
  fontLink.href =
    'https://fonts.googleapis.com/css2?family=Trirong:wght@400;700&family=Marcellus&family=DM+Serif+Display&family=Playfair+Display:wght@400;700&family=Brawler&display=block'
  document.head.appendChild(fontLink)

  await new Promise((res) => {
    fontLink.onload = res
    fontLink.onerror = res
    setTimeout(res, 15000)
  })
  await Promise.all(
    ['Trirong', 'Marcellus', 'DM Serif Display', 'Playfair Display', 'Brawler'].map((f) =>
      document.fonts.load(`400 40px "${f}"`).catch(() => {})
    )
  )
  await document.fonts.ready

  const rows = FACES.map(
    (f) => `
    <section style="padding:16px 0 20px;border-bottom:1px solid #e8e8e8">
      <div style="font:500 11px/1 ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase;color:#8a8a8a;margin-bottom:10px">${f.label}</div>
      <div style="font-family:${f.stack};font-size:36px;line-height:1.12">Experience&nbsp;&nbsp; Highlights&nbsp;&nbsp; Selected work</div>
      <div style="font-family:${f.stack};font-size:62px;line-height:1.05;margin-top:4px">Kamran</div>
      <div style="font-family:${f.stack};font-size:52px;line-height:1.15">0123&nbsp;&nbsp;100</div>
      <div style="font-family:${f.stack};font-size:23px;line-height:1.45;margin-top:4px">The work is less about components and more about agreeing what good looks like.</div>
      <div style="font-family:${f.stack};font-size:15px;margin-top:6px;color:#666">Get in touch &middot; About &middot; j i l I J L b d h k &nbsp;|&nbsp; <b>Bold 700</b></div>
    </section>`
  ).join('')

  document.body.innerHTML = `<div style="font:400 12px/1.5 ui-monospace,monospace;color:#555;margin-bottom:8px">
    Display-face shortlist — same sizes as the site's own display tokens (36 / 62 / 52 / 23 / 15px)
  </div>${rows}`

  return 'rendered: ' + FACES.length + ' faces'
})()
