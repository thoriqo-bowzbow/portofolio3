/**
 * Sanity check: confirm the candidate metrics are measured from real faces and
 * not from a silent fallback.
 *
 * Measures each family alongside a deliberately-absent family and the generic
 * `serif`. If a candidate's numbers equal the absent family's, it never loaded
 * and its earlier score was fiction.
 */
(async () => {
  const css = document.createElement('link')
  css.rel = 'stylesheet'
  css.href =
    'https://fonts.googleapis.com/css2?family=Trirong:wght@400;700&family=Marcellus&family=DM+Serif+Display&family=Brawler&display=block'
  document.head.appendChild(css)
  await new Promise((res) => {
    css.onload = res
    css.onerror = res
    setTimeout(res, 15000)
  })

  const names = ['ZZNoSuchFontZZ', 'serif', 'Trirong', 'Marcellus', 'DM Serif Display', 'Brawler']
  await Promise.all(
    ['Trirong', 'Marcellus', 'DM Serif Display', 'Brawler'].map((f) =>
      document.fonts.load(`400 200px "${f}"`).catch(() => {})
    )
  )
  await document.fonts.ready

  const canvas = document.createElement('canvas')
  canvas.width = 4000
  canvas.height = 1200
  const ctx = canvas.getContext('2d')
  const S = 200
  const r3 = (n) => Math.round(n * 1000) / 1000
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length

  const FLAT_CAPS = 'EFHILNTZ'.split('')
  const LOWER = ['n', 'u', 'z', 'o', 'c', 'e', 's']
  const ASCENDERS = ['b', 'd', 'h', 'k', 'l']

  const rows = names.map((n) => {
    const stack = n === 'serif' ? 'serif' : `"${n}"`
    ctx.font = `400 ${S}px ${stack}`
    const A = (t) => ctx.measureText(t).actualBoundingBoxAscent
    return {
      family: n,
      capPerEm: r3(mean(FLAT_CAPS.map(A)) / S),
      xPerEm: r3(mean(LOWER.map(A)) / S),
      ascPerEm: r3(mean(ASCENDERS.map(A)) / S),
      widthOfHamburgefonstiv: r3(ctx.measureText('Hamburgefonstiv').width)
    }
  })

  return JSON.stringify(
    {
      note: 'ZZNoSuchFontZZ and serif must be identical; every other row must differ',
      rows
    },
    null,
    1
  )
})()
