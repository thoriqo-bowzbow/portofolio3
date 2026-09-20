(() => {
  const rows = []
  const walk = (el, depth) => {
    const cls = typeof el.className === 'string' ? el.className.split(' ').filter(Boolean) : []
    const r = el.getBoundingClientRect()
    rows.push(
      `${'  '.repeat(depth)}${el.tagName.toLowerCase()}${cls.length ? '.' + cls.join('.') : ''} [${Math.round(r.width)}x${Math.round(r.height)}]`
    )
    if (depth < 2) Array.from(el.children).forEach((c) => walk(c, depth + 1))
  }
  walk(document.querySelector('.mdHome') || document.body, 0)
  return JSON.stringify(rows.join('\n'))
})()
