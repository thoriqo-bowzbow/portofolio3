/**
 * Three-way comparison on the site's real display strings: SK Zweig (reference,
 * measured live and embedded here), Playfair Display (previous substitute) and
 * Trirong (new substitute).
 *
 * Both candidates are pulled from Google Fonts for the comparison so they are
 * measured under identical conditions.
 */
(async () => {
  // Measured live from the reference site with the same probe
  const REF = {
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

  const STRINGS = Object.keys(REF).map((k) => {
    const [text, size, weight] = k.split('|')
    return { key: k, text, size: Number(size), weight: Number(weight) }
  })

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href =
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;700&family=Trirong:wght@400;500;700&display=block'
  document.head.appendChild(link)
  await new Promise((res) => {
    link.onload = res
    link.onerror = res
    setTimeout(res, 15000)
  })
  await Promise.all(
    ['Playfair Display', 'Trirong'].flatMap((f) =>
      [400, 500, 700].map((w) => document.fonts.load(`${w} 100px "${f}"`).catch(() => {}))
    )
  )
  await document.fonts.ready

  const canvas = document.createElement('canvas')
  canvas.width = 6000
  canvas.height = 900
  const ctx = canvas.getContext('2d')

  const measure = (family) =>
    STRINGS.map((s) => {
      ctx.font = `${s.weight} ${s.size}px "${family}"`
      const w = ctx.measureText(s.text).width
      const ref = REF[s.key]
      return { ...s, width: Math.round(w * 100) / 100, devPct: Math.round(((w - ref) / ref) * 1000) / 10 }
    })

  const summarise = (rows) => {
    const abs = rows.map((r) => Math.abs(r.devPct))
    return {
      meanAbsDevPct: Math.round((abs.reduce((a, b) => a + b, 0) / abs.length) * 100) / 100,
      maxAbsDevPct: Math.max(...abs),
      within2Pct: abs.filter((d) => d <= 2).length,
      within5Pct: abs.filter((d) => d <= 5).length,
      within10Pct: abs.filter((d) => d <= 10).length,
      total: abs.length
    }
  }

  const playfair = measure('Playfair Display')
  const trirong = measure('Trirong')

  return JSON.stringify(
    {
      perString: STRINGS.map((s, i) => ({
        text: s.text,
        size: s.size,
        weight: s.weight,
        ref: REF[s.key],
        playfair: playfair[i].width,
        playfairDevPct: playfair[i].devPct,
        trirong: trirong[i].width,
        trirongDevPct: trirong[i].devPct
      })),
      summary: {
        playfair: summarise(playfair),
        trirong: summarise(trirong)
      }
    },
    null,
    1
  )
})()
