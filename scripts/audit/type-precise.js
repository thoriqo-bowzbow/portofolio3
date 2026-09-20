/**
 * High-precision metric read at 200px, plus the rendered weight, so a face that
 * is being synthetically bolded or silently substituted cannot masquerade as the
 * intended one. 200px keeps rounding error to a hundredth of an em.
 */
(async () => {
  await document.fonts.ready

  const canvas = document.createElement('canvas')
  canvas.width = 4000
  canvas.height = 1200
  const ctx = canvas.getContext('2d')

  const el =
    document.querySelector('.md-interctv__title-text') ||
    document.querySelector('.hero__title-text') ||
    document.querySelector('h1, h2, h3')
  const cs = getComputedStyle(el)
  const family = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim()

  const S = 200
  ctx.font = `400 ${S}px "${family}"`

  const m = (t) => ({
    ascent: Math.round(ctx.measureText(t).actualBoundingBoxAscent * 100) / 100,
    width: Math.round(ctx.measureText(t).width * 100) / 100
  })

  const r3 = (n) => Math.round(n * 1000) / 1000
  const perEm = (v) => r3(v / S)

  const H = m('H')
  const x = m('x')
  const o = m('o')
  const b = m('b')
  const h = m('h')
  const E = m('E')

  return JSON.stringify(
    {
      element: el.className,
      family,
      declaredWeight: cs.fontWeight,
      renderedSize: cs.fontSize,
      loaded: {
        400: document.fonts.check(`400 ${S}px "${family}"`),
        700: document.fonts.check(`700 ${S}px "${family}"`)
      },
      at200: { H, x, o, b, h, E },
      perEm: {
        cap: perEm(H.ascent),
        xHeight: perEm(x.ascent),
        oHeight: perEm(o.ascent),
        ascender: perEm(b.ascent),
        // The two ratios that characterise a face's optical proportions
        xToCap: r3(x.ascent / H.ascent),
        ascToCap: r3(b.ascent / H.ascent)
      }
    },
    null,
    1
  )
})()
