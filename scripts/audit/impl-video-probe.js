(() => {
  const v = document.querySelector('.hero__video')
  if (!v) return JSON.stringify({ error: 'no .hero__video in DOM' })
  const cs = getComputedStyle(v)
  return JSON.stringify({
    src: v.currentSrc || v.getAttribute('src'),
    duration: v.duration,
    currentTime: Math.round(v.currentTime * 1000) / 1000,
    paused: v.paused,
    muted: v.muted,
    autoplay: v.autoplay,
    loop: v.loop,
    playsInline: v.playsInline,
    readyState: v.readyState,
    networkState: v.networkState,
    opacity: cs.opacity,
    position: cs.position,
    objectFit: cs.objectFit,
    rect: [Math.round(v.getBoundingClientRect().width), Math.round(v.getBoundingClientRect().height)],
    videoW: v.videoWidth,
    videoH: v.videoHeight,
    heroProgress: (() => {
      const hero = document.querySelector('.hero')
      if (!hero) return null
      const r = hero.getBoundingClientRect()
      const total = r.height - window.innerHeight
      const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0
      return Math.round(p * 1000) / 1000
    })(),
    scrollY: Math.round(window.scrollY)
  })
})()
