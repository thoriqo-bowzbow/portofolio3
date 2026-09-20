/**
 * Runtime motion sweep for this implementation.
 *
 * Scrolls through a named section and samples computed `translateY` for a set of
 * selectors, reporting whether each moved and by how much.
 *
 * The important detail is that it samples **while the elements are in view**. A
 * trigger that has not entered its range reports a static 0 for reasons that have
 * nothing to do with whether the motion is implemented, so a static result is only
 * meaningful alongside the element's viewport offset — which is reported too.
 *
 *   node scripts/audit/local-motion-sweep.mjs <session> <viewportW> <viewportH> [group]
 *
 * groups: gallery | testimonial | hero
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const scratch = process.env.COMMANDCODE_SCRATCHPAD || here
const session = process.argv[2] || 'loc'
const vw = Number(process.argv[3] || 1440)
const vh = Number(process.argv[4] || 900)
const group = process.argv[5] || 'gallery'

const GROUPS = {
  gallery: {
    anchor: '#projects',
    selectors: { image: '.highlight-tile__image', tile: '.highlight-tile' },
    steps: 7
  },
  testimonial: {
    anchor: '#reviews',
    selectors: { image: '.testimonial-card__image', tile: '.testimonial-card' },
    steps: 7
  },
  hero: {
    anchor: '#main',
    selectors: {
      title: '.hero__title',
      desc: '.hero__desc-text',
      countNum: '.hero-block__count-num',
      countImg: '.hero-block__count-image',
      infoTitle: '.hero-block__info-title',
      infoDesc: '.hero-block__info-desc',
      infoActions: '.hero-block__info-actions'
    },
    steps: 8
  }
}

const cfg = GROUPS[group]
if (!cfg) {
  console.error(`unknown group "${group}" — expected one of ${Object.keys(GROUPS).join(', ')}`)
  process.exit(1)
}

const probe = `(() => {
  const S = ${JSON.stringify(cfg.selectors)}
  const ty = (el) => {
    const t = getComputedStyle(el).transform
    if (!t || t === 'none') return 0
    const m = t.match(/matrix3?d?\\(([^)]+)\\)/)
    if (!m) return null
    const p = m[1].split(',').map(Number)
    return Math.round((p.length === 16 ? p[13] : p[5]) * 100) / 100
  }
  const out = { scrollY: Math.round(window.scrollY), vh: window.innerHeight, groups: {} }
  for (const [key, sel] of Object.entries(S)) {
    const els = Array.from(document.querySelectorAll(sel))
    out.groups[key] = els.map((e) => ({
      ty: ty(e),
      // Distance of the element's centre from the viewport centre. 0 means it is
      // mid-screen and definitely within any reasonable trigger range.
      centre: Math.round(e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2 - window.innerHeight / 2)
    }))
  }
  return JSON.stringify(out)
})()`

const probeFile = join(scratch, `local-motion-${group}.js`)
writeFileSync(probeFile, probe)
const src = readFileSync(probeFile, 'utf8')

const ab = (args, input) =>
  execFileSync('agent-browser.cmd', ['--session', session, ...args], {
    encoding: 'utf8',
    shell: true,
    input,
    maxBuffer: 16 * 1024 * 1024
  })

const parse = (s) => {
  const t = s.trim()
  try {
    let v = JSON.parse(t)
    while (typeof v === 'string') v = JSON.parse(v)
    return v
  } catch {
    return t
  }
}

const js = (source) => {
  const f = join(scratch, 'local-motion-tmp.js')
  writeFileSync(f, source)
  return parse(ab(['eval', '--stdin'], readFileSync(f, 'utf8')))
}

ab(['set', 'viewport', String(vw), String(vh)])
js(`window.scrollTo({ top: 0, behavior: 'instant' }); JSON.stringify({ ok: true })`)
Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 900)

// Find the anchor section's document position and sweep across it
const anchorTop = js(`(() => {
  const el = document.querySelector(${JSON.stringify(cfg.anchor)})
  if (!el) return JSON.stringify({ top: null })
  return JSON.stringify({ top: Math.round(el.getBoundingClientRect().top + window.scrollY), h: el.offsetHeight })
})()`)

if (anchorTop.top === null) {
  console.error(`anchor ${cfg.anchor} not found`)
  process.exit(1)
}

console.log('')
console.log(`${group} — ${vw}×${vh}, anchor ${cfg.anchor} at ${anchorTop.top}px (height ${anchorTop.h})`)
console.log('')

const start = Math.max(0, anchorTop.top - Math.round(vh * 0.9))
const end = anchorTop.top + anchorTop.h
const rows = []

for (let i = 0; i <= cfg.steps; i++) {
  const y = Math.round(start + ((end - start) * i) / cfg.steps)
  js(`window.scrollTo({ top: ${y}, behavior: 'instant' }); JSON.stringify({ ok: true })`)
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 700)
  rows.push(parse(ab(['eval', '--stdin'], src)))
}

const keys = Object.keys(cfg.selectors)
console.log('scroll    ' + keys.map((k) => k.padStart(28)).join(''))
for (const r of rows) {
  const cells = keys.map((k) => {
    const list = r.groups[k] || []
    const tys = list.map((x) => x.ty).join(',')
    return tys.length > 26 ? tys.slice(0, 25) + '…' : tys
  })
  console.log(String(r.scrollY).padEnd(10) + cells.map((c) => c.padStart(28)).join(''))
}

console.log('')
console.log('verdict:')
for (const k of keys) {
  const first = (rows[0].groups[k] || []).map((x) => x.ty)
  const all = rows.flatMap((r) => (r.groups[k] || []).map((x) => x.ty))
  const min = Math.min(...all)
  const max = Math.max(...all)
  const spread = Math.round((max - min) * 100) / 100

  // Were the elements on screen at any point? A static result is only meaningful
  // if they were.
  const centres = rows.flatMap((r) => (r.groups[k] || []).map((x) => x.centre))
  const minAbsCentre = Math.min(...centres.map(Math.abs))

  console.log(
    `  ${k.padEnd(12)} samples=${all.length}  range ${min} … ${max}  spread=${spread}px` +
      `  inView=${minAbsCentre < vh}  →  ${spread > 0.5 ? 'MOVES' : 'static'}`
  )
  void first
}
