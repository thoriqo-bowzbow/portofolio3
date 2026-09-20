/**
 * Determines whether a webfont actually loaded, and measures it reliably.
 *
 * `document.fonts.check()` cannot be used: this browser returns `true` for a
 * family that does not exist at all, because it counts the fallback. Every
 * "loaded: 64" style result is therefore worthless.
 *
 * The reliable signal is **width divergence**: measure a string in the candidate
 * family, then in a guaranteed-absent family, then in an explicitly different
 * fallback. If the candidate matches the absent-family width, it is falling back
 * and has not loaded.
 *
 * Also verifies that `fonts.gstatic.com` is reachable, since the Google CSS can
 * return 200 while the font files themselves are blocked.
 */
(async () => {
  const css = document.createElement('link')
  css.rel = 'stylesheet'
  css.href =
    'https://fonts.googleapis.com/css2?family=Trirong:wght@400;700&family=Marcellus&family=DM+Serif+Display&family=Playfair+Display:wght@400;700&family=Brawler&display=block'
  document.head.appendChild(css)

  const cssLoaded = await new Promise((res) => {
    css.onload = () => res('ok')
    css.onerror = () => res('error')
    setTimeout(() => res('timeout'), 15000)
  })

  const probe = document.createElement('span')
  probe.style.cssText =
    'position:absolute;left:-9999px;top:0;white-space:nowrap;font-size:100px;'
  probe.textContent = 'Hamburgefonstiv'
  document.body.appendChild(probe)

  const widthOf = (stack) => {
    probe.style.fontFamily = stack
    return Math.round(probe.getBoundingClientRect().width * 100) / 100
  }

  // A family that cannot exist — its width IS the fallback width
  const absent = widthOf('"ZZNoSuchFontZZ", serif')
  const genericSerif = widthOf('serif')
  const genericSans = widthOf('sans-serif')

  // Force each candidate to load, then measure
  const names = ['Trirong', 'Marcellus', 'DM Serif Display', 'Playfair Display', 'Brawler']
  await Promise.all(
    names.flatMap((n) => [
      document.fonts.load(`400 100px "${n}"`).catch(() => {}),
      document.fonts.load(`700 100px "${n}"`).catch(() => {})
    ])
  )
  await document.fonts.ready

  const results = names.map((n) => {
    const w = widthOf(`"${n}", serif`)
    return {
      family: n,
      width: w,
      // Loaded iff it differs from the absent-family fallback width
      loaded: w !== absent,
      deltaVsFallback: Math.round((w - absent) * 100) / 100
    }
  })

  // Which @font-face entries did the document actually register?
  const registered = Array.from(document.fonts).map((f) => `${f.family} ${f.weight} ${f.status}`)

  return JSON.stringify(
    {
      cssLoaded,
      absentWidth: absent,
      genericSerif,
      genericSans,
      // If these three are identical, no webfont is resolving at all
      results,
      registeredCount: registered.length,
      registeredSample: registered.slice(0, 24)
    },
    null,
    1
  )
})()
