(() => {
  const v = document.querySelector('.md-interctv__canvas')
  if (!v) return JSON.stringify({ error: 'no video element' })
  const cs = getComputedStyle(v)
  return JSON.stringify({
    tag: v.tagName.toLowerCase(),
    src: v.currentSrc || v.getAttribute('src'),
    duration: v.duration,
    currentTime: Math.round(v.currentTime * 1000) / 1000,
    paused: v.paused,
    muted: v.muted,
    autoplay: v.autoplay,
    loop: v.loop,
    readyState: v.readyState,
    pos: cs.position,
    objectFit: cs.objectFit,
    poster: v.getAttribute('poster'),
    videoWidth: v.videoWidth,
    videoHeight: v.videoHeight,
    scrollY: Math.round(window.scrollY)
  })
})()
