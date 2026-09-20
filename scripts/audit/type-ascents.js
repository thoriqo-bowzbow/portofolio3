/**
 * Reconciles the audit's cap-height claim.
 *
 * The audit measured `actualBoundingBoxAscent` on whole strings ("Experience",
 * "Get in touch"), which is the *maximum* ascent of any glyph in the string — so
 * it is driven by whichever is tallest: the cap, a lowercase ascender, or the dot
 * on an `i`. That is not cap-height, and the two diverge sharply between faces
 * whose ascenders sit well above their caps.
 *
 * This probe measures both, on the same face, so the two numbers can be compared
 * without conflating them.
 */
(async () => {
  await document.fonts.ready

  const canvas = document.createElement('canvas')
  canvas.width = 4000
  canvas.height = 900
  const ctx = canvas.getContext('2d')
  const r2 = (n) => Math.round(n * 100) / 100

  const displayEl =
    document.querySelector('.md-interctv__title-text') ||
    document.querySelector('.hero__title-text') ||
    document.querySelector('h1, h2, h3')
  const family = getComputedStyle(displayEl).fontFamily.split(',')[0].replace(/["']/g, '').trim()

  const S = 36
  ctx.font = `400 ${S}px "${family}"`

  const ascent = (t) => r2(ctx.measureText(t).actualBoundingBoxAscent)

  const strings = ['Experience', 'Highlights', 'Get in touch', 'Selected work']

  return JSON.stringify(
    {
      family,
      size: S,
      // True cap height — the single tallest capital
      capH: ascent('H'),
      capPerEm: r2(ascent('H') / S),
      // x-height
      xH: ascent('x'),
      xPerEm: r2(ascent('x') / S),
      // Ascender letters, to show how far above the caps they reach
      ascB: ascent('b'),
      ascI: ascent('i'),
      ascT: ascent('t'),
      // The metric the audit actually reported: string max ascent
      stringAscents: strings.map((t) => ({
        text: t,
        ascent: ascent(t),
        perEm: r2(ascent(t) / S)
      }))
    },
    null,
    1
  )
})()
