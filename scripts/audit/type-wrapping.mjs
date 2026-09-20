/**
 * Generates a line-wrapping probe from the real display elements, then runs it
 * against both sites via `agent-browser eval --stdin`.
 *
 * Greedy word wrap, measured with the page's own display font — so it reports
 * what the browser would actually do, not an estimate.
 *
 *   node scripts/audit/type-wrapping.mjs
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const scratch = process.env.COMMANDCODE_SCRATCHPAD || __dirname

const elements = JSON.parse(readFileSync(join(scratch, 'wrap-elems.json'), 'utf8').trim())
const all = typeof elements === 'string' ? JSON.parse(elements) : elements

// Only elements that can actually wrap. The scramble effect forces
// `white-space: nowrap` on section titles and the nav CTA, so simulating a wrap
// for those reports differences that cannot occur in the layout.
const list = all.filter((e) => e.canWrap)
const nowrapList = all.filter((e) => !e.canWrap)

const probe = `(async () => {
  await document.fonts.ready
  const ELEMENTS = ${JSON.stringify(list)}
  const canvas = document.createElement('canvas')
  canvas.width = 8000
  canvas.height = 900
  const ctx = canvas.getContext('2d')
  const el = document.querySelector('.md-interctv__title-text') || document.querySelector('.hero__title-text') || document.querySelector('h1, h2, h3')
  const family = getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim()

  const wrapCount = (text, size, weight, avail) => {
    ctx.font = weight + ' ' + size + 'px "' + family + '"'
    const words = text.split(/\\s+/).filter(Boolean)
    let lines = 1, cur = ''
    for (const w of words) {
      const next = cur ? cur + ' ' + w : w
      if (ctx.measureText(next).width <= avail) { cur = next; continue }
      lines++
      cur = w
    }
    return lines
  }

  return JSON.stringify({
    family,
    rows: ELEMENTS.map((e) => ({
      text: e.text, size: e.fontSize, weight: e.fontWeight, avail: e.contentWidth,
      lines: wrapCount(e.text, e.fontSize, e.fontWeight, e.contentWidth)
    }))
  })
})()`

const probeFile = join(scratch, 'wrap-probe.js')
writeFileSync(probeFile, probe)

const ab = (session) =>
  execFileSync('agent-browser.cmd', ['--session', session, 'eval', '--stdin'], {
    input: readFileSync(probeFile, 'utf8'),
    encoding: 'utf8',
    shell: true,
    maxBuffer: 32 * 1024 * 1024
  })

const parse = (s) => {
  let v = JSON.parse(s.trim())
  while (typeof v === 'string') v = JSON.parse(v)
  return v
}

const ref = parse(ab('ref'))
const loc = parse(ab('loc'))

let diffs = 0
console.log('')
console.log('string                                   size  w    avail  SK Zweig  Trirong  ')
for (let i = 0; i < ref.rows.length; i++) {
  const a = ref.rows[i]
  const b = loc.rows[i]
  const same = a.lines === b.lines
  if (!same) diffs++
  console.log(
    a.text.slice(0, 38).padEnd(40) +
      String(a.size).padEnd(6) +
      String(a.weight).padEnd(5) +
      String(a.avail).padEnd(7) +
      String(a.lines).padEnd(10) +
      String(b.lines).padEnd(9) +
      (same ? '' : '  <-- DIFFERENT')
  )
}
console.log('')
console.log(`ref font: ${ref.family}   local font: ${loc.family}`)
console.log(`wrapping differences: ${diffs} of ${ref.rows.length} wrappable elements`)

// nowrap elements cannot wrap, so the only meaningful comparison is by how much
// the text runs past its container
console.log('')
console.log('non-wrapping (.scramble) — overflow past container, in px at reference width:')
const nprobe = `(async () => {
  await document.fonts.ready
  const E = ${JSON.stringify(nowrapList)}
  const c = document.createElement('canvas'); c.width = 8000; c.height = 900
  const x = c.getContext('2d')
  const el = document.querySelector('.md-interctv__title-text') || document.querySelector('.hero__title-text') || document.querySelector('h1, h2, h3')
  const fam = getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim()
  return JSON.stringify(E.map((e) => {
    x.font = e.fontWeight + ' ' + e.fontSize + 'px "' + fam + '"'
    return { text: e.text, size: e.fontSize, avail: e.contentWidth, width: Math.round(x.measureText(e.text).width * 100) / 100 }
  }))
})()`
writeFileSync(probeFile, nprobe)
const refN = parse(ab('ref'))
const locN = parse(ab('loc'))
for (let i = 0; i < refN.length; i++) {
  const a = refN[i]
  const b = locN[i]
  console.log(
    '  ' +
      a.text.slice(0, 26).padEnd(28) +
      String(a.size).padEnd(6) +
      'avail=' + String(a.avail).padEnd(8) +
      'SK Zweig ' + String(a.width).padEnd(10) + (a.width > a.avail ? 'overflow' : 'fits') + '  ' +
      'Trirong ' + String(b.width).padEnd(10) + (b.width > b.avail ? 'overflow' : 'fits')
  )
}
