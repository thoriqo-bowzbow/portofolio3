/**
 * Ranks open-licensed serifs against SK Zweig's *corrected* profile.
 *
 * The audit reported a 12–16% "cap-height" excess. Measuring the reference glyph
 * by glyph shows that is not cap height at all:
 *
 *   SK Zweig   cap 0.702   x-height 0.525   ascenders 0.690   asc/cap 0.983
 *   Playfair   cap 0.710   x-height 0.515   ascenders 0.785   asc/cap 1.106
 *
 * Cap differs by +1.1% and x-height by −1.9% — both negligible. The whole error
 * is in the **ascenders**, which overshoot the cap by 10.6% where the reference's
 * sit just below it. So `ascToCap` is the discriminating metric, and the audit's
 * recommended 0.88 size scale would be actively wrong: it would shrink caps that
 * are already correct.
 *
 * Note also that SK Zweig's `x` and `v` are anomalous — both 114/200 where every
 * other lowercase is 101–104. Reading x-height from `x` alone therefore
 * overstates the reference by 9%; this probe uses the flat lowercase set instead.
 */
(async () => {
  const TARGET = {
    capPerEm: 0.702,
    xPerEm: 0.525,
    ascPerEm: 0.69,
    xToCap: 0.748,
    ascToCap: 0.983,
    advances: {
      A: 66.4, B: 69.3, C: 69.8, D: 71.8, E: 62.8, F: 59.8, G: 71.3, H: 70.5,
      I: 26.3, J: 46.2, K: 72.2, L: 59.8, M: 81.5, N: 63.8, O: 73.1, P: 64.3,
      Q: 73.1, R: 66.2, S: 62.4, T: 58.1, U: 73.6, V: 62, W: 95.3, X: 72.7,
      Y: 66.8, Z: 72.8, a: 56.6, b: 61.3, c: 52.2, d: 55.1, e: 54.9, f: 36.4,
      g: 58.2, h: 61.2, i: 29.6, j: 22.9, k: 61.1, l: 27.6, m: 90.4, n: 61.3,
      o: 57.3, p: 61.2, q: 61.2, r: 44.6, s: 51.1, t: 38.5, u: 60.1, v: 59.6,
      w: 84.6, x: 65.9, y: 58.9, z: 56.6
    }
  }

  const CANDIDATES = [
    // editorial / high contrast
    'Bodoni Moda', 'Prata', 'DM Serif Display', 'Instrument Serif', 'Abril Fatface',
    'Rozha One', 'Playfair Display', 'Young Serif',
    // text serifs
    'Literata', 'Petrona', 'Faustina', 'Fraunces', 'Newsreader', 'Source Serif 4',
    'Crimson Pro', 'EB Garamond', 'Cormorant Garamond', 'Lora', 'Libre Baskerville',
    'Libre Caslon Text', 'Spectral', 'PT Serif', 'Noto Serif Display', 'Bitter',
    'Zilla Slab', 'Rosarivo', 'Gelasio', 'Tinos', 'Cardo', 'Neuton', 'Vollkorn',
    'Alegreya', 'Marcellus', 'Domine', 'Arvo', 'Bree Serif', 'Arapey', 'Judson',
    'Amiri', 'Trirong', 'Kameron', 'Belgrano', 'Brawler', 'Kreon',
    // short-ascender / large x-height candidates
    'Alegreya SC', 'Gilda Display', 'Sorts Mill Goudy', 'Old Standard TT',
    'Playfair', 'Coustard', 'Gabriela', 'Adamina', 'Andada Pro', 'Unna',
    'Bodoni Moda SC', 'Montserrat', 'Rosario', 'Yrsa', 'Gentium Book Plus',
    'Charis SIL', 'Merriweather', 'Roboto Serif', 'Noticia Text', 'Baskervville'
  ]

  const families = CANDIDATES.map((f) => `family=${encodeURIComponent(f)}`).join('&')
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?${families}&display=block`
  document.head.appendChild(link)

  await new Promise((res) => {
    link.onload = res
    link.onerror = res
    setTimeout(res, 20000)
  })

  const canvas = document.createElement('canvas')
  canvas.width = 4000
  canvas.height = 1200
  const ctx = canvas.getContext('2d')
  const r3 = (n) => Math.round(n * 1000) / 1000
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length

  await Promise.all(CANDIDATES.map((f) => document.fonts.load(`400 200px "${f}"`).catch(() => {})))
  await document.fonts.ready

  const S = 200
  const FLAT_CAPS = 'EFHILNTZ'.split('')
  const FLAT_LOWER = ['n', 'u', 'z']
  const ROUND_LOWER = ['o', 'c', 'e', 's']
  const ASCENDERS = ['b', 'd', 'h', 'k', 'l']
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

  const measure = (family) => {
    if (!document.fonts.check(`400 ${S}px "${family}"`)) return { family, unloaded: true }
    ctx.font = `400 ${S}px "${family}"`
    const A = (t) => ctx.measureText(t).actualBoundingBoxAscent

    const cap = mean(FLAT_CAPS.map(A))
    const xh = mean([...FLAT_LOWER, ...ROUND_LOWER].map(A))
    const asc = mean(ASCENDERS.map(A))

    const adv = {}
    // Advances must be read at the same nominal size as the reference table
    // (100px), not at the 200px used for the ascent reads — otherwise every
    // candidate appears to be exactly 100% too wide.
    ctx.font = `400 100px "${family}"`
    for (const ch of alphabet) adv[ch] = ctx.measureText(ch).width
    const devs = alphabet.split('').map((ch) =>
      Math.abs(adv[ch] - TARGET.advances[ch]) / TARGET.advances[ch]
    )
    const meanDev = mean(devs)
    const worstDev = Math.max(...devs)
    const worstCh = alphabet.split('')[devs.indexOf(worstDev)]

    const ascToCap = asc / cap
    const xToCap = xh / cap

    return {
      family,
      capPerEm: r3(cap / S),
      xPerEm: r3(xh / S),
      ascPerEm: r3(asc / S),
      ascToCap: r3(ascToCap),
      xToCap: r3(xToCap),
      capErrPct: r3(((cap / S - TARGET.capPerEm) / TARGET.capPerEm) * 100),
      xErrPct: r3(((xh / S - TARGET.xPerEm) / TARGET.xPerEm) * 100),
      // How far the ascenders overshoot the cap, as a percentage of cap height
      ascOvershootPct: r3((ascToCap - 1) * 100),
      ascOverTargetPct: r3((ascToCap - TARGET.ascToCap) * 100),
      meanAdvDevPct: r3(meanDev * 100),
      worstAdvDevPct: r3(worstDev * 100),
      worstGlyph: worstCh,
      score: r3(
        Math.abs(ascToCap - TARGET.ascToCap) * 900 +
          Math.abs(xToCap - TARGET.xToCap) * 500 +
          Math.abs(cap / S - TARGET.capPerEm) * 250 +
          meanDev * 250
      )
    }
  }

  const results = CANDIDATES.map(measure)
  const loaded = results.filter((r) => !r.unloaded)
  loaded.sort((a, b) => a.score - b.score)

  return JSON.stringify(
    {
      target: { capPerEm: TARGET.capPerEm, xPerEm: TARGET.xPerEm, ascToCap: TARGET.ascToCap, xToCap: TARGET.xToCap },
      loadedCount: loaded.length,
      unloaded: results.filter((r) => r.unloaded).map((r) => r.family),
      ranked: loaded
    },
    null,
    1
  )
})()
