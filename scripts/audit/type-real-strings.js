/**
 * Measures the site's real display strings at their real rendered sizes, in
 * whatever display face the page resolves to.
 *
 * Four hand-picked headings are not enough to judge width fidelity or wrapping:
 * the risk is a specific string crossing a container boundary. This uses the
 * actual content.
 */
(async () => {
  await document.fonts.ready

  const STRINGS = [
    ['Kamran', 212, 400],
    ['01', 202, 400],
    ['02', 202, 400],
    ['03', 202, 400],
    ['Craft', 46, 400],
    ['Systems', 46, 400],
    ['Speed', 46, 400],
    ['Kamran Yusupov', 36, 400],
    ['My professional stack', 26, 400],
    ['Had an experience with', 26, 400],
    ['Loved using', 26, 400],
    ['Experience', 36, 400],
    ['Selected work', 36, 400],
    ['Works', 36, 400],
    ['Atlas Booking', 24, 400],
    ['Fieldnote', 24, 400],
    ['Ledger', 18, 400],
    ['Console', 18, 400],
    ['Harbour Goods', 18, 400],
    ['Waypoint', 18, 400],
    ['Beacon', 18, 400],
    ['Relay', 18, 400],
    ['Kestrel', 18, 400],
    ['Driftwood', 18, 400],
    ['What people say', 36, 400],
    ['Get in touch', 36, 500],
    ['Send a message', 28, 400],
    ['Ines Marques', 16, 700],
    ['Priya Raghunathan', 16, 700],
    ['Marta Kowalczyk', 16, 700],
    ['Make it work, make it right, make it fast.', 36, 700]
  ]

  const canvas = document.createElement('canvas')
  canvas.width = 6000
  canvas.height = 900
  const ctx = canvas.getContext('2d')

  const el =
    document.querySelector('.md-interctv__title-text') ||
    document.querySelector('.hero__title-text') ||
    document.querySelector('h1, h2, h3')
  const family = getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim()

  const rows = STRINGS.map(([text, size, weight]) => {
    // Fall back to 400 if the face has no such weight, so a missing weight shows
    // up as a wrong width rather than silently measuring the fallback family.
    const useWeight = document.fonts.check(`${weight} ${size}px "${family}"`) ? weight : 400
    ctx.font = `${useWeight} ${size}px "${family}"`
    return {
      text,
      size,
      weight,
      usedWeight: useWeight,
      width: Math.round(ctx.measureText(text).width * 100) / 100
    }
  })

  return JSON.stringify({ family, rows }, null, 1)
})()
