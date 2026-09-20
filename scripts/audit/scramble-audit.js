(() => {
  const scrambles = Array.from(document.querySelectorAll('.md-hacktext')).map((el) => ({
    cls: typeof el.className === 'string' ? el.className : '',
    tag: el.tagName.toLowerCase(),
    text: (el.dataset.value || el.textContent || '').trim(),
    fs: getComputedStyle(el).fontSize,
    rect: [Math.round(el.getBoundingClientRect().width), Math.round(el.getBoundingClientRect().height)]
  }))

  // Elements that are headings in the reference but are NOT scrambled — these
  // are the ones a scalar "scramble everything" implementation would get wrong.
  const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6,p'))
    .filter((el) => {
      const cs = getComputedStyle(el)
      const fam = cs.fontFamily
      return fam.includes('SK Zweig') && parseFloat(cs.fontSize) >= 16
    })
    .map((el) => ({
      tag: el.tagName.toLowerCase(),
      cls: typeof el.className === 'string' ? el.className : '',
      text: (el.textContent || '').trim().slice(0, 40),
      fs: getComputedStyle(el).fontSize,
      isScramble: el.classList.contains('md-hacktext')
    }))

  return JSON.stringify({ scrambleCount: scrambles.length, scrambles, displayText: headings }, null, 1)
})()
