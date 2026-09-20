/**
 * Full type-metric fingerprint for whatever display family the page resolves to.
 *
 * Run against both the reference and this implementation with `eval --stdin`,
 * then diff. Measures the properties that actually determine optical size and
 * line breaking, none of which a `font-size` check can see:
 *
 *   capHeight/em   'H'  — the dominant driver of a heading looking "bigger"
 *   xHeight/em     'x'  — drives how heavy lowercase prose reads
 *   asc/desc       'H' bounding box, for line box comparison
 *   advances       every letter at 100px, so per-glyph divergence is visible
 *                  rather than averaged away by whole-string widths
 *
 * Also reports which families the page actually resolved and registered, since a
 * declared family that never loaded silently falls back and would otherwise be
 * measured as if it were the intended face.
 */
(async () => {
  await document.fonts.ready

  const canvas = document.createElement('canvas')
  canvas.width = 4000
  canvas.height = 800
  const ctx = canvas.getContext('2d')
  const r2 = (n) => Math.round(n * 100) / 100

  const displayEl =
    document.querySelector('.md-interctv__title-text') ||
    document.querySelector('.hero__title-text') ||
    document.querySelector('h1, h2, h3')

  const stack = displayEl ? getComputedStyle(displayEl).fontFamily : ''
  const family = stack.split(',')[0].replace(/["']/g, '').trim()

  ctx.font = `400 100px "${family}"`

  const capHeight = ctx.measureText('H').actualBoundingBoxAscent
  const xHeight = ctx.measureText('x').actualBoundingBoxAscent
  const ascender = ctx.measureText('H').actualBoundingBoxAscent
  const descender = ctx.measureText('H').actualBoundingBoxDescent
  const emWidth = ctx.measureText('H').width

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  const advances = {}
  for (const ch of alphabet) advances[ch] = r2(ctx.measureText(ch).width)

  // Representative heading widths at their real rendered sizes
  const headings = [
    { text: 'Experience', size: 36 },
    { text: 'Highlights', size: 100 },
    { text: 'Get in touch', size: 36 },
    { text: 'Selected work', size: 36 }
  ]
  const headingWidths = headings.map((h) => {
    ctx.font = `400 ${h.size}px "${family}"`
    const m = ctx.measureText(h.text)
    return {
      text: h.text,
      size: h.size,
      width: r2(m.width),
      advancePerEm: r2(m.width / h.size)
    }
  })

  return JSON.stringify(
    {
      family,
      stack,
      resolved: document.fonts.check(`400 100px "${family}"`),
      capHeight: r2(capHeight),
      capHeightPerEm: r2(capHeight / 100),
      xHeight: r2(xHeight),
      xHeightPerEm: r2(xHeight / 100),
      ascender: r2(ascender),
      descender: r2(descender),
      HWidth: r2(emWidth),
      headingWidths,
      advances,
      loadedFamilies: Array.from(
        new Set(
          Array.from(document.fonts)
            .filter((f) => f.status === 'loaded')
            .map((f) => f.family)
        )
      )
    },
    null,
    1
  )
})()
