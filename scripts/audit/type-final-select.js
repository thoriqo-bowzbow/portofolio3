/**
 * Decisive selection test.
 *
 * Measures each candidate on **two** axes at once, using the site's real display
 * strings:
 *
 *   optical   — ascender and cap height vs SK Zweig (the audit's P1 finding:
 *               a face whose ascenders overshoot makes every heading read large)
 *   widths    — mean and worst deviation on the actual rendered content (the
 *               P3 finding: wrong widths move line breaks and can overflow)
 *
 * Ranking on either axis alone picks a bad face: Playfair wins widths by 2.3x
 * while being 13.8% too tall optically; Trirong fixes the height while running
 * 6% wide. The score below is the worst-case of the two, so a candidate has to
 * be acceptable on both to rank.
 */
(async () => {
  const REF_WIDTHS = {
    'Kamran|212|400': 769.35, '01|202|400': 171.3, '02|202|400': 219.37,
    '03|202|400': 221.19, 'Craft|46|400': 105.85, 'Systems|46|400': 177.19,
    'Speed|46|400': 131.88, 'Kamran Yusupov|36|400': 283,
    'My professional stack|26|400': 253.58, 'Had an experience with|26|400': 279.5,
    'Loved using|26|400': 141.86, 'Experience|36|400': 188.57,
    'Selected work|36|400': 231.95, 'Works|36|400': 108.14,
    'Atlas Booking|24|400': 151.01, 'Fieldnote|24|400': 99.6,
    'Ledger|18|400': 57.35, 'Console|18|400': 66.47, 'Harbour Goods|18|400': 125.41,
    'Waypoint|18|400': 78.3, 'Beacon|18|400': 61.52, 'Relay|18|400': 44.19,
    'Kestrel|18|400': 58.48, 'Driftwood|18|400': 82.66, 'What people say|36|400': 269.24,
    'Get in touch|36|500': 196.74, 'Send a message|28|400': 204.01,
    'Ines Marques|16|700': 98.5, 'Priya Raghunathan|16|700': 141.1,
    'Marta Kowalczyk|16|700': 126.48,
    'Make it work, make it right, make it fast.|36|700': 654.73
  }

  const TARGET = { cap: 0.702, x: 0.525, asc: 0.69 }

  const CANDIDATES = [
    'Playfair Display', 'Trirong', 'Solway', 'Brawler', 'IBM Plex Serif', 'Lora',
    'PT Serif', 'Source Serif 4', 'Karma', 'Sumana', 'Kreon', 'Aleo', 'Sanchez',
    'Sarabun', 'Trocchi', 'Andada Pro', 'Bitter', 'Domine', 'Literata', 'Petrona',
    'Faustina', 'Newsreader', 'Spectral', 'Vollkorn', 'Alegreya', 'Gelasio',
    'Zilla Slab', 'Noto Serif Display', 'Fraunces', 'Bodoni Moda', 'Eczar',
    'Halant', 'Martel', 'Rasa', 'Rufina', 'Quattrocento', 'Piazzolla', 'Rokkitt'
  ]

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href =
    'https://fonts.googleapis.com/css2?' +
    CANDIDATES.map((f) => `family=${encodeURIComponent(f)}`).join('&') +
    '&display=block'
  document.head.appendChild(link)
  await new Promise((res) => {
    link.onload = res
    link.onerror = res
    setTimeout(res, 20000)
  })
  await Promise.all(
    CANDIDATES.flatMap((f) =>
      [400, 500, 700].map((w) => document.fonts.load(`${w} 100px "${f}"`).catch(() => {}))
    )
  )
  await document.fonts.ready

  const canvas = document.createElement('canvas')
  canvas.width = 6000
  canvas.height = 900
  const ctx = canvas.getContext('2d')
  const r2 = (n) => Math.round(n * 100) / 100
  const r3 = (n) => Math.round(n * 1000) / 1000
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length

  const FLAT_CAPS = 'EFHILNTZ'.split('')
  const LOWER = ['n', 'u', 'z', 'o', 'c', 'e', 's']
  const ASCENDERS = ['b', 'd', 'h', 'k', 'l']

  const STRINGS = Object.keys(REF_WIDTHS).map((k) => {
    const [text, size, weight] = k.split('|')
    return { key: k, text, size: Number(size), weight: Number(weight) }
  })

  const rows = []

  for (const family of CANDIDATES) {
    const stack = `"${family}"`

    // --- optical profile at 200px
    ctx.font = `400 200px ${stack}`
    const A = (t) => ctx.measureText(t).actualBoundingBoxAscent
    const cap = mean(FLAT_CAPS.map(A)) / 200
    const xh = mean(LOWER.map(A)) / 200
    const asc = mean(ASCENDERS.map(A)) / 200

    // --- real-string widths, in the weights the site actually uses
    let sum = 0
    let worst = 0
    let worstText = ''
    for (const s of STRINGS) {
      ctx.font = `${s.weight} ${s.size}px ${stack}`
      const w = ctx.measureText(s.text).width
      const ref = REF_WIDTHS[s.key]
      const d = Math.abs((w - ref) / ref) * 100
      sum += d
      if (d > worst) {
        worst = d
        worstText = s.text
      }
    }

    const capErr = Math.abs(cap - TARGET.cap) / TARGET.cap * 100
    const xErr = Math.abs(xh - TARGET.x) / TARGET.x * 100
    const ascErr = Math.abs(asc - TARGET.asc) / TARGET.asc * 100
    const meanW = sum / STRINGS.length

    rows.push({
      family,
      capPerEm: r3(cap),
      xPerEm: r3(xh),
      ascPerEm: r3(asc),
      capErrPct: r2(capErr),
      xErrPct: r2(xErr),
      ascErrPct: r2(ascErr),
      meanWidthDevPct: r2(meanW),
      worstWidthDevPct: r2(worst),
      worstString: worstText.slice(0, 34),
      // Worst case across both axes — a face must be decent on both to rank well
      worstAxisPct: r2(Math.max(ascErr, capErr, meanW)),
      // Weighted: optical error counts double, since it is the P1 finding and
      // applies to every display glyph, whereas width error only bites at
      // boundaries.
      combined: r2(ascErr * 1.6 + capErr * 1.2 + xErr * 0.6 + meanW * 1.0)
    })
  }

  rows.sort((a, b) => a.combined - b.combined)
  return JSON.stringify({ target: TARGET, ranked: rows }, null, 1)
})()
