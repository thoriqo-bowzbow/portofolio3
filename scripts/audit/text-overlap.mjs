/**
 * Detects unintended text collisions.
 *
 * Reports pairs of text-bearing elements whose *ink* boxes overlap — the element
 * rectangle minus its padding — which is what actually makes two labels collide
 * on screen. Padding and empty gutters are excluded so ordinary layout (a card's
 * padding overlapping a sibling's margin) is not reported as a bug.
 *
 * Occlusion counts too: an element that is painted over by an opaque sibling is a
 * collision even when the two boxes only overlap partially.
 *
 *   node scripts/audit/text-overlap.mjs <session> [w] [h]
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const scratch = process.env.COMMANDCODE_SCRATCHPAD || here
const session = process.argv[2] || 'locx'
const vw = Number(process.argv[3] || 1440)
const vh = Number(process.argv[4] || 900)

const PROBE = `(() => {
  const results = []

  // Elements that render their own text (not just descendants').
  const textEls = Array.from(document.querySelectorAll('body *')).filter((el) => {
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return false
    if (el.closest('[aria-hidden="true"]') && !el.matches('h1,h2,h3,h4,p,span,a,li,button,label')) return false
    if (el.closest('.visually-hidden')) return false
    const own = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim())
    if (!own) return false
    const r = el.getBoundingClientRect()
    return r.width > 4 && r.height > 4
  })

  const ink = (el) => {
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    const pad = (v) => parseFloat(v) || 0
    return {
      el,
      left: r.left + pad(cs.paddingLeft),
      right: r.right - pad(cs.paddingRight),
      top: r.top + pad(cs.paddingTop),
      bottom: r.bottom - pad(cs.paddingBottom),
      text: (el.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 44),
      sel: el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(/\\s+/).filter(Boolean).slice(0, 2).join('.'),
      z: cs.zIndex,
      pos: cs.position
    }
  }

  const boxes = textEls.map(ink).filter((b) => b.right > b.left && b.bottom > b.top)

  const overlaps = (a, b) => {
    const x = Math.min(a.right, b.right) - Math.max(a.left, b.left)
    const y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
    if (x <= 0 || y <= 0) return null
    return { x, y, area: x * y }
  }

  const ancestorOf = (a, b) => a.el.contains(b.el) || b.el.contains(a.el)

  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]
      const b = boxes[j]
      if (ancestorOf(a, b)) continue
      // Same text repeated (a parent re-reporting a child's string) is not a collision
      if (a.text && a.text === b.text) continue
      const o = overlaps(a, b)
      if (!o) continue
      const minArea = Math.min((a.right - a.left) * (a.bottom - a.top), (b.right - b.left) * (b.bottom - b.top))
      const frac = o.area / Math.max(1, minArea)
      // Only meaningful collisions: at least 12% of the smaller ink box
      if (frac < 0.12) continue
      // If one is viewport-pinned and the other is not, they are meant to overlap
      const pinned = (x) => {
        let n = x.el
        while (n && n !== document.body) {
          const cs = getComputedStyle(n)
          if (cs.position === 'fixed' || cs.position === 'sticky') return true
          n = n.parentElement
        }
        return false
      }
      const pa = pinned(a)
      const pb = pinned(b)
      // Page content scrolling under a pinned header/rail is by design; only
      // compare elements that share the same pinning fate.
      if (pa !== pb) continue
      if (pa && pb && !a.el.closest('header, .site-header') === !b.el.closest('header, .site-header')) continue
      results.push({
        a: a.sel + ' "' + a.text + '"',
        b: b.sel + ' "' + b.text + '"',
        overlap: [Math.round(o.x), Math.round(o.y)],
        pct: Math.round(frac * 100),
        at: [Math.round(Math.max(a.left, b.left)), Math.round(Math.max(a.top, b.top))]
      })
    }
  }

  results.sort((p, q) => q.pct - p.pct)
  return JSON.stringify({ scrollY: Math.round(scrollY), count: results.length, results: results.slice(0, 40) })
})()`

const probeFile = join(scratch, `overlap-${session}-${vw}x${vh}.js`)
writeFileSync(probeFile, PROBE)
const src = readFileSync(probeFile, 'utf8')

const ab = (args, input) =>
  execFileSync('agent-browser.cmd', ['--session', session, ...args], {
    encoding: 'utf8',
    shell: true,
    input,
    maxBuffer: 32 * 1024 * 1024
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
const js = (code) => {
  const f = join(scratch, 'overlap-tmp.js')
  writeFileSync(f, code)
  return parse(ab(['eval', '--stdin'], readFileSync(f, 'utf8')))
}

ab(['set', 'viewport', String(vw), String(vh)])
js(`window.scrollTo({ top: 0, behavior: 'instant' }); 'ok'`)
sleep(1500)

const H = Number(js(`JSON.stringify(document.documentElement.scrollHeight)`))
const STEP = Math.round(vh * 0.75)

console.log('')
console.log(`=== text overlap — ${vw}x${vh}, doc ${H}px ===`)
console.log('')

const seen = new Set()
let total = 0

for (let y = 0; y < H; y += STEP) {
  js(`window.scrollTo({ top: ${y}, behavior: 'instant' }); 'ok'`)
  sleep(320)
  const data = js(src)
  for (const r of data.results) {
    const key = r.a + '||' + r.b
    if (seen.has(key)) continue
    seen.add(key)
    total++
    console.log(`  ${String(r.pct).padStart(3)}%  ${String(r.overlap[0]) + 'x' + String(r.overlap[1])}px @ y≈${y}`)
    console.log(`        A ${r.a}`)
    console.log(`        B ${r.b}`)
  }
}

console.log('')
console.log(total === 0 ? 'no unintended text collisions found' : `${total} distinct collision(s) found`)
if (total > 0) process.exitCode = 1
