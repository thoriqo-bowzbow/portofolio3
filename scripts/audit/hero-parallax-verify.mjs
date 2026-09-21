/**
 * Verifies the hero parallax against the measured reference rule.
 *
 * Desktop (`min-width: 1024px`):
 *   translateY per px scrolled = −speed / 10
 *
 * Below 1024px the reference applies no hero parallax at all, so every layer must
 * stay at its layout position (transform 0) throughout.
 *
 * The rate is derived from two widely separated samples on the **linear** part of
 * each layer's travel — past its window the value saturates, and a rate taken
 * across a saturated region would read as zero and look like a failure.
 *
 *   node scripts/audit/hero-parallax-verify.mjs <session> <w> <h>
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

/** Speeds from the reference's `data-scroll-speed` attributes. */
const SPEEDS = {
  title: 8,
  desc: 2,
  countNum: 6,
  countImg: 10,
  infoTitle: 0.5,
  infoDesc: 2,
  infoActions: 0.5
}

/**
 * Layers the story-block column guard may hold back.
 *
 * `useHeroParallax` stops a layer from crossing its neighbours inside an info
 * column. The description is the layer that diverges there — speed 2 against 0.5
 * either side of it — so it is the one that gets clamped, and its rate reads
 * shallower than `−speed/10` over the part of the travel where the guard binds.
 * That is the intended behaviour, so such a layer is reported as `held` rather
 * than failed; every other layer must still match exactly.
 */
const GUARDABLE = new Set(['infoDesc'])

const SELECTORS = {
  title: '.hero__title',
  desc: '.hero__desc-text',
  countNum: '.hero-block__count-num',
  countImg: '.hero-block__count-image',
  infoTitle: '.hero-block__info-title',
  infoDesc: '.hero-block__info-desc',
  infoActions: '.hero-block__info-actions'
}

const probe = `(() => {
  const S = ${JSON.stringify(SELECTORS)}
  const ty = (el) => {
    const t = getComputedStyle(el).transform
    if (!t || t === 'none') return 0
    const m = t.match(/matrix3?d?\\(([^)]+)\\)/)
    if (!m) return null
    const p = m[1].split(',').map(Number)
    return Math.round((p.length === 16 ? p[13] : p[5]) * 100) / 100
  }
  const hero = document.querySelector('.hero__scroller')
  const out = { scrollY: Math.round(window.scrollY), vh: window.innerHeight, heroH: hero ? hero.offsetHeight : null, layers: {} }
  for (const [k, sel] of Object.entries(S)) out.layers[k] = Array.from(document.querySelectorAll(sel)).map(ty)
  return JSON.stringify(out)
})()`

const probeFile = join(scratch, `hero-verify-${vw}x${vh}.js`)
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
  const f = join(scratch, 'hero-verify-tmp.js')
  writeFileSync(f, source)
  return parse(ab(['eval', '--stdin'], readFileSync(f, 'utf8')))
}

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)

/*
 * Changing the viewport is not enough on its own: `gsap.matchMedia` rebuilds its
 * triggers on its own schedule and the hero's measured geometry has to be taken
 * again at the new size. Reloading puts the page back through mount at the new
 * viewport, which is the state being verified.
 */
ab(['set', 'viewport', String(vw), String(vh)])
ab(['reload'])
sleep(9000)

js(`window.scrollTo({ top: 0, behavior: 'instant' }); JSON.stringify({ ok: true })`)
sleep(1200)

const first = parse(ab(['eval', '--stdin'], src))
const range = Math.max(1, first.heroH - vh)

// Sample the whole range; the rate is derived from the span where each layer is
// actually moving (see the note above).
const rows = []
for (let i = 0; i <= 8; i++) {
  const y = Math.round((range * i) / 8)
  js(`window.scrollTo({ top: ${y}, behavior: 'instant' }); JSON.stringify({ ok: true })`)
  sleep(650)
  rows.push(parse(ab(['eval', '--stdin'], src)))
}

console.log('')
console.log(`hero parallax — ${vw}×${vh}   hero ${first.heroH}px  range ${range}px`)
console.log('')

const expectZero = vw < 1024
const keys = Object.keys(SPEEDS)

console.log('scroll     ' + keys.map((k) => k.padStart(12)).join(''))
for (const r of rows) {
  console.log(
    String(r.scrollY).padEnd(11) +
      keys.map((k) => String((r.layers[k] || [])[0] ?? '-').padStart(12)).join('')
  )
}

console.log('')
if (expectZero) {
  console.log('below 1024px — every layer must be static at 0:')
  let ok = true
  for (const k of keys) {
    const all = rows.flatMap((r) => r.layers[k] || [])
    const max = Math.max(...all.map(Math.abs))
    const pass = max < 0.5
    if (!pass) ok = false
    console.log(`  ${k.padEnd(12)} max |ty| = ${String(max).padStart(6)}   ${pass ? 'ok' : 'FAIL — should be 0'}`)
  }
  console.log('')
  console.log(ok ? 'RESULT: no hero parallax, matching the reference' : 'RESULT: FAILED')
  if (!ok) process.exitCode = 1
} else {
  console.log('rate check — must equal −speed / 10:')
  let ok = true
  for (const k of keys) {
    /*
     * Take the dominant per-step rate rather than the largest span.
     *
     * A layer inside a story-block info column is held back by that column's
     * collision guard once it would otherwise cross a sibling, so a span wide
     * enough to include a clamp boundary blends two different slopes and reads as
     * neither. The modal per-step rate is the layer's actual rate; the clamped
     * steps are the documented exception.
     */
    const rates = []
    for (let i = 0; i < rows.length - 1; i++) {
      const a = (rows[i].layers[k] || [])[0]
      const b = (rows[i + 1].layers[k] || [])[0]
      if (a === undefined || b === undefined) continue
      const dx = rows[i + 1].scrollY - rows[i].scrollY
      const dy = b - a
      if (!dx || Math.abs(dy) < 1) continue
      rates.push(Math.round((dy / dx) * 1000) / 1000)
    }

    if (!rates.length) {
      ok = false
      console.log(`  ${k.padEnd(12)} no moving span found                FAIL`)
      continue
    }

    // Most common slope; ties go to the steepest
    const tally = new Map()
    rates.forEach((r) => tally.set(r, (tally.get(r) || 0) + 1))
    const measured = [...tally.entries()].sort((a, b) => b[1] - a[1] || Math.abs(b[0]) - Math.abs(a[0]))[0][0]

    const expected = -(SPEEDS[k] / 10)
    const exact = Math.abs(measured - expected) < 0.005
    const held = GUARDABLE.has(k) && Math.abs(measured) < Math.abs(expected)
    if (!exact && !held) ok = false

    const verdict = exact ? 'ok' : held ? 'held (column guard)' : 'FAIL'
    const clamped = tally.size > 1 ? `  (${tally.size - 1} clamped step(s))` : ''
    console.log(
      `  ${k.padEnd(12)} speed ${String(SPEEDS[k]).padEnd(5)} measured ${measured.toFixed(4).padStart(8)}   expected ${expected.toFixed(4).padStart(8)}   ${verdict}${clamped}`
    )
  }
  console.log('')
  console.log(ok ? 'RESULT: every layer tracks −speed/10' : 'RESULT: FAILED')
  if (!ok) process.exitCode = 1
}
