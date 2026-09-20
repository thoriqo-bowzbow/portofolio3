/**
 * Measures the real contrast of white hero type against the rendered backdrop.
 *
 * axe-core cannot evaluate text over an image, so it falls back to the page
 * background and reports a false failure. This loads the backdrop SVG into a
 * canvas, samples the bands where the hero story blocks land, and computes the
 * WCAG contrast ratio against #ffffff.
 */
(() => {
  const srgb = (c) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  const luminance = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b)
  const contrast = (a, b) => {
    const l1 = luminance(a)
    const l2 = luminance(b)
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
  }

  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const W = 480
      const H = 270
      const canvas = document.createElement('canvas')
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, W, H)

      // Sample a grid across the whole backdrop — a story block can land on any
      // band, so the worst case anywhere is what matters.
      const data = ctx.getImageData(0, 0, W, H).data
      const samples = []
      for (let y = 4; y < H - 4; y += 6) {
        for (let x = 10; x < W - 10; x += 16) {
          const i = (y * W + x) * 4
          samples.push({
            xy: [x, y],
            rgb: [data[i], data[i + 1], data[i + 2]],
            ratio: contrast([data[i], data[i + 1], data[i + 2]], [255, 255, 255])
          })
        }
      }

      const ratios = samples.map((s) => s.ratio)
      const worst = samples.reduce((a, b) => (b.ratio < a.ratio ? b : a))
      const under3 = samples.filter((s) => s.ratio < 3).length
      const under45 = samples.filter((s) => s.ratio < 4.5).length

      resolve(
        JSON.stringify(
          {
            sampleCount: samples.length,
            minRatio: Math.round(Math.min(...ratios) * 100) / 100,
            maxRatio: Math.round(Math.max(...ratios) * 100) / 100,
            meanRatio:
              Math.round((ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100) / 100,
            worstSample: { at: worst.xy, rgb: worst.rgb, ratio: Math.round(worst.ratio * 100) / 100 },
            samplesUnder3to1: under3,
            samplesUnder4_5to1: under45,
            verdict:
              Math.min(...ratios) >= 3
                ? 'PASS — every band holds at least 3:1 for large text'
                : 'FAIL — some bands fall below 3:1'
          },
          null,
          1
        )
      )
    }
    img.onerror = () => resolve(JSON.stringify({ error: 'backdrop failed to load' }))
    img.src = '/images/hero-backdrop.svg?' + Date.now()
  })
})()
