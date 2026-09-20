/**
 * Full lowercase + capital ascent profile at 200px.
 *
 * x-height should be read from the *flat-topped* lowercase (`n u v z`)
 * cross-checked against the round ones (`o c e`), which overshoot slightly. A
 * single-glyph read is not enough: if a face has an anomalous `x`, measuring only
 * `x` sets a target that no other font can match and the whole selection is
 * skewed by one glyph.
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
  const family = getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim()

  const S = 200
  ctx.font = `400 ${S}px "${family}"`

  const asc = (t) => Math.round(ctx.measureText(t).actualBoundingBoxAscent * 100) / 100
  const r3 = (n) => Math.round(n * 1000) / 1000

  const flatLower = ['n', 'u', 'v', 'z', 'x']
  const roundLower = ['o', 'c', 'e', 's']
  const ascLower = ['b', 'd', 'f', 'h', 'k', 'l', 't']
  const caps = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

  const flat = flatLower.map((c) => ({ c, a: asc(c) }))
  const round = roundLower.map((c) => ({ c, a: asc(c) }))
  const ascenders = ascLower.map((c) => ({ c, a: asc(c) }))
  const capList = caps.map((c) => ({ c, a: asc(c) }))

  const mean = (list) => list.reduce((s, o) => s + o.a, 0) / list.length
  const max = (list) => Math.max(...list.map((o) => o.a))

  // Exclude 'x' from the flat set for the headline number, reporting it apart
  const flatNoX = flat.filter((o) => o.c !== 'x')

  return JSON.stringify(
    {
      family,
      size: S,
      flatLower: flat,
      roundLower: round,
      ascenders,
      caps: capList,
      derived: {
        // The honest x-height: flat lowercase, excluding the outlier
        xHeightFlatNoX: r3(mean(flatNoX) / S),
        xHeightFlat: r3(mean(flat) / S),
        xHeightRound: r3(mean(round) / S),
        xOnly: r3(asc('x') / S),
        oOnly: r3(asc('o') / S),
        // Cap height from the flat-topped capitals only
        capHeightFlatCaps: r3(
          mean(capList.filter((o) => 'EFHILNTZ'.includes(o.c))) / S
        ),
        capHeightMax: r3(max(capList) / S),
        ascenderHeight: r3(mean(ascenders) / S),
        // The characterising ratios
        xToCap: r3(mean(flatNoX) / mean(capList.filter((o) => 'EFHILNTZ'.includes(o.c)))),
        ascToCap: r3(mean(ascenders) / mean(capList.filter((o) => 'EFHILNTZ'.includes(o.c))))
      }
    },
    null,
    1
  )
})()
