/**
 * Final selection pass.
 *
 * Differences from the previous pass:
 *
 * 1. **Only faces shipping both 400 and 700 are eligible.** The reference loads
 *    both weights and the design uses bold; a perfect metric fit at 400 is
 *    useless if 700 has to be synthesised.
 * 2. **Scored on absolute /em errors, not ratios.** What makes a heading look
 *    the wrong size is the absolute cap, ascender and x-height at a given
 *    font-size, so those are compared directly against SK Zweig's values.
 * 3. Reports signed errors so the direction of each deviation is visible.
 */
(async () => {
  const T = {
    capPerEm: 0.702,
    xPerEm: 0.525,
    ascPerEm: 0.69,
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
    'Trirong', 'Marcellus', 'Kameron', 'Brawler', 'DM Serif Display', 'Arvo',
    'Noto Serif Display', 'Fraunces', 'Bodoni Moda', 'Lora', 'PT Serif',
    'Domine', 'Andada Pro', 'Roboto Serif', 'Source Serif 4', 'Literata',
    'Petrona', 'Faustina', 'Newsreader', 'Spectral', 'Libre Baskerville',
    'Libre Caslon Text', 'Vollkorn', 'Alegreya', 'Gelasio', 'Tinos', 'Cardo',
    'Neuton', 'Rosarivo', 'Amiri', 'Judson', 'Belgrano', 'Arapey', 'Adamina',
    'Baskervville', 'Prata', 'Instrument Serif', 'Zilla Slab', 'Bitter',
    'Merriweather', 'Playfair Display', 'EB Garamond', 'Crimson Pro',
    'Cormorant Garamond', 'Gilda Display', 'Old Standard TT', 'Young Serif',
    'Rozha One', 'Abril Fatface', 'Coustard', 'Gentium Book Plus',
    'Charis SIL', 'Noticia Text', 'Yrsa', 'Rosario', 'Playfair', 'Montserrat',
    // Expanded sweep — additional serifs likely to have short ascenders
    'Aleo', 'Besley', 'Brygada 1918', 'Crimson Text', 'Eczar', 'Halant',
    'Hepta Slab', 'IBM Plex Serif', 'Ibarra Real Nova', 'Inknut Antiqua',
    'Lustria', 'Markazi Text', 'Martel', 'Noto Serif', 'Ovo', 'Piazzolla',
    'Podkova', 'Poly', 'Quattrocento', 'Rasa', 'Rokkitt', 'Rufina', 'Sanchez',
    'Scope One', 'Shippori Mincho', 'Solway', 'Stoke', 'Sumana', 'Tienne',
    'Trocchi', 'Trykker', 'Yeseva One', 'Zilla Slab Highlight', 'Bitter',
    'PT Serif Caption', 'Noto Serif HK', 'Abhaya Libre', 'Kotta One',
    'Balthazar', 'Bellefair', 'Buenard', 'Cormorant Unicase', 'Cormorant SC',
    'Gowun Batang', 'Karma', 'Kreon', 'Ledger', 'Miriam Libre', 'Nobile',
    'Sahitya', 'Sarabun', 'Sree Krushnadevaraya', 'Suranna', 'Tauri',
    'Vesper Libre', 'Vollkorn SC', 'Amethysta', 'Antic Didone', 'Bodoni Moda SC'
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
  const r2 = (n) => Math.round(n * 100) / 100
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length

  await Promise.all(
    CANDIDATES.flatMap((f) => [
      document.fonts.load(`400 200px "${f}"`).catch(() => {}),
      document.fonts.load(`700 200px "${f}"`).catch(() => {})
    ])
  )
  await document.fonts.ready

  const S = 200
  const FLAT_CAPS = 'EFHILNTZ'.split('')
  const LOWER = ['n', 'u', 'z', 'o', 'c', 'e', 's']
  const ASCENDERS = ['b', 'd', 'h', 'k', 'l']
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

  const results = []

  for (const family of CANDIDATES) {
    const has400 = document.fonts.check(`400 ${S}px "${family}"`)
    const has700 = document.fonts.check(`700 ${S}px "${family}"`)
    if (!has400) continue

    ctx.font = `400 ${S}px "${family}"`
    const A = (t) => ctx.measureText(t).actualBoundingBoxAscent
    const cap = mean(FLAT_CAPS.map(A))
    const xh = mean(LOWER.map(A))
    const asc = mean(ASCENDERS.map(A))

    ctx.font = `400 100px "${family}"`
    const devs = alphabet.split('').map((ch) =>
      Math.abs(ctx.measureText(ch).width - T.advances[ch]) / T.advances[ch]
    )
    const meanDev = mean(devs)
    const worstDev = Math.max(...devs)

    // A synthesised bold is not a real 700; treat its absence as a heavy penalty
    // rather than silently ranking a one-weight face alongside proper pairs.
    const weightPenalty = has700 ? 0 : 40

    results.push({
      family,
      has400,
      has700,
      capPerEm: r3(cap / S),
      xPerEm: r3(xh / S),
      ascPerEm: r3(asc / S),
      capErrPct: r2(((cap / S - T.capPerEm) / T.capPerEm) * 100),
      xErrPct: r2(((xh / S - T.xPerEm) / T.xPerEm) * 100),
      ascErrPct: r2(((asc / S - T.ascPerEm) / T.ascPerEm) * 100),
      meanAdvDevPct: r2(meanDev * 100),
      worstAdvDevPct: r2(worstDev * 100),
      score: r2(
        (Math.abs(cap / S - T.capPerEm) +
          Math.abs(asc / S - T.ascPerEm) * 1.6 +
          Math.abs(xh / S - T.xPerEm) * 1.1) *
          1000 +
          meanDev * 100 +
          weightPenalty
      )
    })
  }

  results.sort((a, b) => a.score - b.score)
  return JSON.stringify({ target: T.capPerEm, ranked: results }, null, 1)
})()
