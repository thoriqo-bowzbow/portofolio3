/**
 * Corrected candidate comparison.
 *
 * Uses only elements that can actually wrap (`white-space` not `nowrap`) and the
 * true SK Zweig line counts measured live on the reference, so no phantom
 * differences from the scramble effect's `nowrap` are counted.
 *
 * The `.scramble` titles are reported separately as overflow, since that is what
 * a nowrap element does when its text grows.
 */
(async () => {
  // Real elements with their real containers; refLines measured on the reference.
  const ELEMENTS = [
    { text: 'Kamran', size: 212, weight: 400, avail: 805, refLines: 1 },
    { text: '01', size: 242, weight: 400, avail: 432, refLines: 1 },
    { text: 'Craft', size: 46, weight: 400, avail: 504, refLines: 1 },
    { text: '02', size: 242, weight: 400, avail: 432, refLines: 1 },
    { text: 'Systems', size: 46, weight: 400, avail: 504, refLines: 1 },
    { text: '03', size: 242, weight: 400, avail: 432, refLines: 1 },
    { text: 'Speed', size: 46, weight: 400, avail: 504, refLines: 1 },
    { text: 'Kamran Yusupov', size: 56, weight: 400, avail: 432, refLines: 2 },
    { text: 'My professional stack', size: 26, weight: 400, avail: 818, refLines: 1 },
    { text: 'Had an experience with', size: 26, weight: 400, avail: 818, refLines: 1 },
    { text: 'Loved using', size: 26, weight: 400, avail: 818, refLines: 1 },
    { text: 'Ines Marques', size: 28, weight: 700, avail: 226, refLines: 1 },
    { text: 'Tomas Berg', size: 28, weight: 700, avail: 226, refLines: 1 },
    { text: 'Priya Raghunathan', size: 28, weight: 700, avail: 226, refLines: 2 },
    { text: 'Daniel Osei', size: 28, weight: 700, avail: 226, refLines: 1 },
    { text: 'Marta Kowalczyk', size: 28, weight: 700, avail: 226, refLines: 1 },
    { text: 'Yusuf Karim', size: 28, weight: 700, avail: 226, refLines: 1 },
    { text: 'or', size: 26, weight: 400, avail: 958, refLines: 1 },
    { text: 'Send a message', size: 28, weight: 400, avail: 400, refLines: 1 },
    { text: 'Make it work, make it right, make it fast.', size: 54, weight: 700, avail: 900, refLines: 2 },
    { text: 'Kent Beck', size: 20, weight: 400, avail: 900, refLines: 1 }
  ]

  // nowrap titles: compared by overflow, not wrapping
  const NOWRAP = [
    { text: 'Experience', size: 56, weight: 400, avail: 432, refWidth: 293.33 },
    { text: 'Selected work', size: 56, weight: 400, avail: 432, refWidth: 360.81 },
    { text: 'What people say', size: 56, weight: 400, avail: 432, refWidth: 418.82 },
    { text: 'Get in touch', size: 56, weight: 500, avail: 432, refWidth: 306.04 }
  ]

  const TARGET = { cap: 0.702, x: 0.525, asc: 0.69 }

  const CANDIDATES = [
    'Playfair Display', 'Trirong', 'Karma', 'Brawler', 'Lora', 'Bitter',
    'Sumana', 'Solway', 'PT Serif', 'IBM Plex Serif', 'Source Serif 4',
    'Vollkorn', 'Sarabun', 'Aleo', 'Kreon', 'Faustina', 'Newsreader',
    'Literata', 'Petrona', 'Andada Pro', 'Spectral', 'Alegreya', 'Gelasio',
    'Trocchi', 'Rokkitt', 'Domine'
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

  // Weight availability from the API — document.fonts.check() is not trustworthy
  const weights = {}
  for (const f of CANDIDATES) {
    try {
      const r = await fetch(
        `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f)}:wght@400;500;700&display=block`
      )
      const css = r.status === 200 ? await r.text() : ''
      weights[f] = [
        ...new Set((css.match(/font-weight:\s*([0-9]+)/g) || []).map((s) => s.replace(/[^0-9]/g, '')))
      ]
        .sort()
        .join(',')
    } catch {
      weights[f] = '?'
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = 8000
  canvas.height = 900
  const ctx = canvas.getContext('2d')
  const r2 = (n) => Math.round(n * 100) / 100
  const r3 = (n) => Math.round(n * 1000) / 1000
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length

  const FLAT_CAPS = 'EFHILNTZ'.split('')
  const LOWER = ['n', 'u', 'z', 'o', 'c', 'e', 's']
  const ASCENDERS = ['b', 'd', 'h', 'k', 'l']

  const wrapCount = (text, size, weight, avail) => {
    const words = text.split(/\s+/).filter(Boolean)
    let lines = 1
    let cur = ''
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w
      if (ctx.measureText(next).width <= avail) cur = next
      else {
        lines += 1
        cur = w
      }
    }
    return lines
  }

  const rows = []

  for (const family of CANDIDATES) {
    ctx.font = `400 200px "${family}"`
    const A = (t) => ctx.measureText(t).actualBoundingBoxAscent
    const cap = mean(FLAT_CAPS.map(A)) / 200
    const xh = mean(LOWER.map(A)) / 200
    const asc = mean(ASCENDERS.map(A)) / 200

    let wrapDiffs = 0
    const broken = []
    for (const e of ELEMENTS) {
      ctx.font = `${e.weight} ${e.size}px "${family}"`
      const lines = wrapCount(e.text, e.size, e.weight, e.avail)
      if (lines !== e.refLines) {
        wrapDiffs += 1
        broken.push(e.text)
      }
    }

    let nowrapOverflows = 0
    const overflowing = []
    for (const n of NOWRAP) {
      ctx.font = `${n.weight} ${n.size}px "${family}"`
      const w = ctx.measureText(n.text).width
      const refOverflows = n.refWidth > n.avail
      const thisOverflows = w > n.avail
      if (thisOverflows && !refOverflows) {
        nowrapOverflows += 1
        overflowing.push(n.text)
      }
    }

    const capErr = (Math.abs(cap - TARGET.cap) / TARGET.cap) * 100
    const xErr = (Math.abs(xh - TARGET.x) / TARGET.x) * 100
    const ascErr = (Math.abs(asc - TARGET.asc) / TARGET.asc) * 100

    rows.push({
      family,
      availableWeights: weights[family],
      has500: (weights[family] || '').split(',').includes('500'),
      capPerEm: r3(cap),
      xPerEm: r3(xh),
      ascPerEm: r3(asc),
      capErrPct: r2(capErr),
      xErrPct: r2(xErr),
      ascErrPct: r2(ascErr),
      opticalTotalPct: r2(capErr + xErr + ascErr),
      ascToCap: r3(asc / cap),
      wrapDiffs,
      broken,
      nowrapOverflows,
      overflowing
    })
  }

  rows.sort(
    (a, b) =>
      Number(b.has500) - Number(a.has500) ||
      a.wrapDiffs + a.nowrapOverflows * 0.5 - (b.wrapDiffs + b.nowrapOverflows * 0.5) ||
      a.opticalTotalPct - b.opticalTotalPct
  )

  return JSON.stringify({ refAscToCap: 0.983, ranked: rows }, null, 1)
})()
