(() => {
  const blocks = {}
  document.querySelectorAll('*').forEach((el) => {
    const cls = typeof el.className === 'string' ? el.className : ''
    cls.split(/\s+/).forEach((c) => {
      if (!c || c.startsWith('data-v') || c.startsWith('is-') || c.startsWith('md-scroll')) return
      const block = c.split('__')[0]
      if (!/^(md-|c-|cs)/.test(block)) return
      if (!blocks[block]) blocks[block] = { count: 0, mods: new Set() }
      blocks[block].count += 1
      const rest = c.split('__')[1]
      if (rest) blocks[block].mods.add(rest)
    })
  })
  const out = Object.entries(blocks)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([k, v]) => `${k}  x${v.count}  [${Array.from(v.mods).slice(0, 6).join(', ')}]`)
  return JSON.stringify(out.join('\n'))
})()
