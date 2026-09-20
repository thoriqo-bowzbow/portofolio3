(async () => {
  const strings = ['Experience', 'Highlights', 'Get in touch', 'Selected work', 'Hnmoae']
  const sizes = [36, 100, 36, 36, 212]

  await document.fonts.ready

  const canvas = document.createElement('canvas')
  canvas.width = 3000
  canvas.height = 600
  const ctx = canvas.getContext('2d')

  const measure = (text, family, size, weight) => {
    ctx.font = `${weight} ${size}px ${family}`
    const m = ctx.measureText(text)
    return {
      width: Math.round(m.width * 100) / 100,
      ascent: Math.round(m.actualBoundingBoxAscent * 100) / 100,
      descent: Math.round(m.actualBoundingBoxDescent * 100) / 100,
      capHeight: m.actualBoundingBoxAscent
    }
  }

  // The display family actually resolved, whichever element carries it.
  // NOTE: the reference's hero name is a <p>, not an <h1>, so fall back.
  const displayEl =
    document.querySelector('h1') ||
    document.querySelector('.md-interctv__title-text') ||
    document.querySelector('.hero__title-text') ||
    document.querySelector('h2, h3')

  const displayFamily = getComputedStyle(displayEl)
    .fontFamily.split(',')[0]
    .replace(/"/g, '')
    .trim()
  const bodyFamily = 'Montserrat'

  const out = { displayFamily, bodyFamily, measurements: [] }

  strings.forEach((s, i) => {
    const size = sizes[i]
    out.measurements.push({
      text: s,
      size,
      display: measure(s, `"${displayFamily}"`, size, 400),
      body400: measure(s, bodyFamily, size, 400)
    })
  })

  // Character advance profile for the display face at 100px — shows per-glyph
  // width differences that a single string width can hide.
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  ctx.font = `400 100px "${displayFamily}"`
  const advances = {}
  for (const ch of alphabet) advances[ch] = Math.round(ctx.measureText(ch).width * 100) / 100
  out.displayAdvances100 = advances

  return JSON.stringify(out, null, 1)
})()
