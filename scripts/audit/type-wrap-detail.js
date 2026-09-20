/**
 * Names the specific strings whose wrapping changes, per candidate, and checks
 * the weights each family actually ships.
 *
 * Which string breaks matters more than how many: a testimonial name taking two
 * lines inside a fixed-height card is a different problem from a section title
 * taking two lines.
 */
(async () => {
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
    { text: 'Experience', size: 56, weight: 400, avail: 432, refLines: 1 },
    { text: 'Selected work', size: 56, weight: 400, avail: 432, refLines: 1 },
    { text: 'What people say', size: 56, weight: 400, avail: 432, refLines: 1 },
    { text: 'Ines Marques', size: 28, weight: 700, avail: 226, refLines: 1 },
    { text: 'Tomas Berg', size: 28, weight: 700, avail: 226, refLines: 1 },
    { text: 'Priya Raghunathan', size: 28, weight: 700, avail: 226, refLines: 2 },
    { text: 'Daniel Osei', size: 28, weight: 700, avail: 226, refLines: 1 },
    { text: 'Marta Kowalczyk', size: 28, weight: 700, avail: 226, refLines: 1 },
    { text: 'Yusuf Karim', size: 28, weight: 700, avail: 226, refLines: 1 },
    { text: 'Get in touch', size: 56, weight: 500, avail: 432, refLines: 1 },
    { text: 'or', size: 26, weight: 400, avail: 958, refLines: 1 },
    { text: 'Send a message', size: 28, weight: 400, avail: 400, refLines: 1 },
    { text: 'Make it work, make it right, make it fast.', size: 54, weight: 700, avail: 900, refLines: 2 },
    { text: 'Kent Beck', size: 20, weight: 400, avail: 900, refLines: 1 }
  ]

  const CANDIDATES = ['Playfair Display', 'Trirong', 'Karma', 'Brawler', 'Lora', 'Bitter', 'Sumana']
  const NAMES = { 'Playfair Display': 'playfair-display', Trirong: 'trirong', Karma: 'karma', Brawler: 'brawler', Lora: 'lora', Bitter: 'bitter', Sumana: 'sumana' }

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

  // Weight availability, read from the API rather than document.fonts.check,
  // which reports true for families that do not exist at all.
  const weights = {}
  for (const f of CANDIDATES) {
    try {
      const r = await fetch(
        `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f)}:wght@400;500;700&display=block`
      )
      if (r.status !== 200) {
        weights[f] = 'request rejected'
        continue
      }
      const css = await r.text()
      weights[f] = [
        ...new Set(
          (css.match(/font-weight:\s*([0-9]+)/g) || []).map((s) => s.replace(/[^0-9]/g, ''))
        )
      ]
        .sort()
        .join(',')
    } catch (e) {
      weights[f] = 'error'
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = 8000
  canvas.height = 900
  const ctx = canvas.getContext('2d')

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

  const out = {}
  for (const family of CANDIDATES) {
    const diffs = []
    for (const e of ELEMENTS) {
      ctx.font = `${e.weight} ${e.size}px "${family}"`
      const lines = wrapCount(e.text, e.size, e.weight, e.avail)
      if (lines !== e.refLines) {
        const w = ctx.measureText(e.text).width
        diffs.push({
          text: e.text,
          size: e.size,
          refLines: e.refLines,
          lines,
          width: Math.round(w * 100) / 100,
          avail: e.avail,
          overflowPct: Math.round((w / e.avail) * 1000) / 10
        })
      }
    }
    out[family] = { fileId: NAMES[family], availableWeights: weights[family], diffs, diffCount: diffs.length }
  }

  return JSON.stringify(out, null, 1)
})()
