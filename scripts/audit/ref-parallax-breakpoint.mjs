/**
 * Finds the viewport width at which the reference stops applying hero parallax.
 *
 * The goal requires mobile to preserve the reference's no-parallax behaviour, so
 * the breakpoint has to be measured rather than assumed from the scroll library's
 * `smartphone: { smooth: false }` setting — those are two different switches and
 * need not share a value.
 *
 * For each width: scroll a fixed number of wheel ticks and report the hero title's
 * transform. Non-zero means parallax is running at that width.
 *
 *   node scripts/audit/ref-parallax-breakpoint.mjs [session]
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const scratch = process.env.COMMANDCODE_SCRATCHPAD || here
const session = process.argv[2] || 'refm'

const WIDTHS = [
  [1024, 768],
  [1023, 768],
  [1022, 768],
  [1020, 768],
  [1016, 768],
  [1008, 768],
  [1001, 768],
  [1000, 768],
  [1440, 900]
]

const probe = `(() => {
  const ty = (el) => {
    if (!el) return null
    const t = getComputedStyle(el).transform
    if (!t || t === 'none') return 0
    const m = t.match(/matrix3?d?\\(([^)]+)\\)/)
    if (!m) return null
    const p = m[1].split(',').map(Number)
    return Math.round((p.length === 16 ? p[13] : p[5]) * 100) / 100
  }
  return JSON.stringify({
    title: ty(document.querySelector('.md-interctv__title')),
    desc: ty(document.querySelector('.md-interctv__desc')),
    innerW: window.innerWidth,
    nativeScrollY: Math.round(window.scrollY)
  })
})()`

const probeFile = join(scratch, 'ref-breakpoint-probe.js')
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

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)

console.log('')
console.log('width  hero-title ty  hero-desc ty   native scrollY   verdict')
for (const [w, h] of WIDTHS) {
  ab(['set', 'viewport', String(w), String(h)])
  ab(['open', 'https://mameed.com/'])
  sleep(1800)

  // A few wheel ticks so any parallax has something to act on
  for (let i = 0; i < 3; i++) ab(['mouse', 'wheel', '700'])
  sleep(1000)

  const r = parse(ab(['eval', '--stdin'], src))
  const moving = typeof r === 'object' && (Math.abs(r.title) > 0.5 || Math.abs(r.desc) > 0.5)
  console.log(
    `${String(w).padEnd(7)}${String(r.title).padEnd(15)}${String(r.desc).padEnd(16)}${String(r.nativeScrollY).padEnd(17)}${moving ? 'PARALLAX RUNS' : 'no parallax'}`
  )
}
