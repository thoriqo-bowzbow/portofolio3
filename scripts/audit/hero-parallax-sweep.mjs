/**
 * Sweeps this implementation's hero across its scroll range and reports each
 * layer's runtime transform, so the effective rate can be checked against
 * `−speed / 45` rather than assumed.
 *
 *   node scripts/audit/hero-parallax-sweep.mjs [session] [steps]
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const scratch = process.env.COMMANDCODE_SCRATCHPAD || here
const session = process.argv[2] || 'loc'
const steps = Number(process.argv[3] || 8)

const probe = readFileSync(join(here, 'hero-parallax-impl.js'), 'utf8')
const probeFile = join(scratch, 'hero-impl-probe.js')
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

/** Speeds from the reference's data-scroll-speed attributes. */
const SPEEDS = {
  title: 8,
  desc: 2,
  countNum: 6,
  countImg: 10,
  infoTitle: 0.5,
  infoDesc: 2,
  infoActions: 0.5
}

const range = (() => {
  const first = parse(ab(['eval', '--stdin'], probe))
  return { range: first.range, heroHeight: first.heroHeight, viewport: first.viewport }
})()

console.log('')
console.log(`hero ${range.heroHeight}px, viewport ${range.viewport}px, range ${range.range}px`)

/** Synchronous sleep — avoids spawning a child just to wait. */
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)

const rows = []
for (let i = 0; i <= steps; i++) {
  const scrollY = Math.round((range.range * i) / steps)
  ab(['eval', `window.scrollTo({top:${scrollY},behavior:'instant'}); 'ok'`])
  // Let Lenis settle and the scrub catch up
  sleep(300)
  rows.push(parse(ab(['eval', '--stdin'], probe)))
}

const keys = Object.keys(SPEEDS)
console.log('')
console.log('scroll   progress ' + keys.map((k) => k.padStart(11)).join(''))
for (const r of rows) {
  console.log(
    String(r.scrollY).padEnd(9) +
      String(r.progress).padEnd(9) +
      keys.map((k) => String((r.layers[k] || [])[0] ?? '-').padStart(11)).join('')
  )
}

console.log('')
console.log('effective rate (px of translateY per px scrolled), against the −speed/45 rule:')
console.log('layer        speed   measured    expected    delta')
for (const k of keys) {
  const first = rows[0]
  const last = rows[rows.length - 1]
  const dy = (last.layers[k] || [0])[0] - (first.layers[k] || [0])[0]
  const dx = last.scrollY - first.scrollY
  const measured = dx ? dy / dx : 0
  const expected = -(SPEEDS[k] / 45)
  const delta = Math.abs(measured - expected)
  console.log(
    `  ${k.padEnd(11)} ${String(SPEEDS[k]).padEnd(6)} ` +
      `${measured.toFixed(5).padStart(9)}  ${expected.toFixed(5).padStart(9)}  ` +
      `${delta < 0.0005 ? 'ok' : 'MISMATCH ' + delta.toFixed(5)}`
  )
}
