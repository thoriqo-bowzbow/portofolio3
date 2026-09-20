/**
 * Sweeps the reference's hero layers with real wheel input and reports each
 * layer's transform, so the motion law can be derived from live data rather than
 * from a single sampled position.
 *
 * `window.scrollTo` is useless here: the reference uses locomotive-scroll, which
 * drives the page with transforms and leaves native scroll at 0. Only genuine
 * wheel events move it.
 *
 *   node scripts/audit/ref-hero-sweep.mjs [session] [ticks]
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const scratch = process.env.COMMANDCODE_SCRATCHPAD || join(dirname(fileURLToPath(import.meta.url)))
const session = process.argv[2] || 'ref'
const ticks = Number(process.argv[3] || 10)

const SELECTORS = {
  section: '.md-interctv',
  title: '.md-interctv__title',
  desc: '.md-interctv__desc',
  holderImg: '.md-interctv__holder-image',
  b1num: '.md-block-1 .md-block__count-num',
  b1img: '.md-block-1 .md-block__count-image',
  b1title: '.md-block-1 .md-block__info-title',
  b1desc: '.md-block-1 .md-block__info-desc',
  b1btn: '.md-block-1 .mdbtn',
  b2num: '.md-block-2 .md-block__count-num',
  b2img: '.md-block-2 .md-block__count-image'
}

const probe = `(() => {
  const S = ${JSON.stringify(SELECTORS)}
  const ty = (s) => {
    const e = document.querySelector(s)
    if (!e) return null
    const t = getComputedStyle(e).transform
    if (!t || t === 'none') return 0
    const m = t.match(/matrix3?d?\\(([^)]+)\\)/)
    if (!m) return null
    const p = m[1].split(',').map(Number)
    const v = p.length === 16 ? p[13] : p[5]
    return Math.round(v * 100) / 100
  }
  const out = { tick: window.__tick || 0, scrollY: Math.round(window.scrollY) }
  for (const k of Object.keys(S)) out[k] = ty(S[k])
  return JSON.stringify(out)
})()`

const probeFile = join(scratch, 'ref-hero-probe.js')
writeFileSync(probeFile, probe)

const ab = (args, input) =>
  execFileSync('agent-browser.cmd', ['--session', session, ...args], {
    encoding: 'utf8',
    shell: true,
    input,
    maxBuffer: 16 * 1024 * 1024
  })

const parse = (s) => {
  let v = JSON.parse(s.trim())
  while (typeof v === 'string') v = JSON.parse(v)
  return v
}

const probeSource = readFileSync(probeFile, 'utf8')

const rows = []
for (let i = 0; i <= ticks; i++) {
  execFileSync(
    'agent-browser.cmd',
    ['--session', session, 'eval', `window.__tick = ${i}; 'ok'`],
    { encoding: 'utf8', shell: true }
  )
  rows.push(parse(ab(['eval', '--stdin'], probeSource)))
  if (i < ticks) {
    ab(['mouse', 'wheel', '700'])
  }
}

const keys = Object.keys(SELECTORS)
const cols = ['scrollY', ...keys]
console.log('')
console.log(
  'tick  ' +
    cols
      .map((k) => k.padStart(10))
      .join('')
)
for (const r of rows) {
  console.log(
    String(r.tick).padEnd(6) +
      cols.map((k) => String(r[k] === null ? '-' : r[k]).padStart(10)).join('')
  )
}

// Derive the per-tick deltas to check each layer moves linearly
console.log('')
console.log('per-tick delta (must be constant for a linear rate):')
const last = rows[rows.length - 1]
const first = rows[0]
for (const k of keys) {
  if (first[k] === null || last[k] === null) continue
  const total = last[k] - first[k]
  const perTick = total / (last.tick - first.tick || 1)
  console.log(`  ${k.padEnd(11)} total=${String(total).padStart(10)}  perTick=${perTick.toFixed(3)}`)
}

console.log('')
console.log('speed metadata:')
for (const k of ['title', 'desc', 'b1num', 'b1img', 'b1title', 'b1desc', 'b1btn']) {
  const el = SELECTORS[k]
  const sp = execFileSync(
    'agent-browser.cmd',
    [
      '--session',
      session,
      'eval',
      `(document.querySelector('${el}') ? document.querySelector('${el}').getAttribute('data-scroll-speed') : 'n/a')`
    ],
    { encoding: 'utf8', shell: true }
  ).trim()
  console.log(`  ${k.padEnd(11)} ${sp}`)
}
