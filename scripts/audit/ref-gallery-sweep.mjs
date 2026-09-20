/**
 * Sweeps the reference's gallery and testimonial images and reports whether their
 * declared `data-scroll-speed` parallax actually runs.
 *
 * The audit reported these as inert, but the audit's own note warns that declared
 * motion and running motion are different things — and the same mistake was made
 * in the opposite direction for the hero, where the audit read a saturated value
 * as a constant. So this re-measures rather than inheriting the claim.
 *
 * The reference drives the page with transforms (locomotive-scroll), so progress
 * is read from the section that carries the scroll offset, exactly as the hero
 * sweep does.
 *
 *   node scripts/audit/ref-gallery-sweep.mjs [session] [ticks]
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const scratch = process.env.COMMANDCODE_SCRATCHPAD || here
const session = process.argv[2] || 'refm'
const ticks = Number(process.argv[3] || 14)

const probe = `(() => {
  const ty = (el) => {
    const t = getComputedStyle(el).transform
    if (!t || t === 'none') return 0
    const m = t.match(/matrix3?d?\\(([^)]+)\\)/)
    if (!m) return null
    const p = m[1].split(',').map(Number)
    return Math.round((p.length === 16 ? p[13] : p[5]) * 100) / 100
  }
  const gallery = Array.from(document.querySelectorAll('.md-glrycard__image'))
  const reviews = Array.from(document.querySelectorAll('.md-rvwcard__image'))
  // How far each tile sits from the viewport centre — parallax is a function of
  // this, so a static result is only meaningful alongside it.
  const offset = (el) => {
    const card = el.closest('.md-glrycard, .md-rvwcard') || el
    const r = card.getBoundingClientRect()
    return Math.round(r.top + r.height / 2 - window.innerHeight / 2)
  }
  return JSON.stringify({
    tick: window.__tick || 0,
    scrollProxy: (() => {
      const s = document.querySelector('.md-interctv, section')
      const t = s ? getComputedStyle(s).transform : 'none'
      if (!t || t === 'none') return 0
      const m = t.match(/matrix3?d?\\(([^)]+)\\)/)
      return m ? Math.round(Number(m[1].split(',')[13]) * 100) / 100 : 0
    })(),
    gallery: gallery.map((e) => ({ ty: ty(e), speed: e.getAttribute('data-scroll-speed'), off: offset(e) })),
    reviews: reviews.map((e) => ({ ty: ty(e), speed: e.getAttribute('data-scroll-speed'), off: offset(e) }))
  })
})()`

const probeFile = join(scratch, 'ref-gallery-probe.js')
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

const rows = []
for (let i = 0; i <= ticks; i++) {
  execFileSync('agent-browser.cmd', ['--session', session, 'eval', `window.__tick = ${i}; 'ok'`], {
    encoding: 'utf8',
    shell: true
  })
  rows.push(parse(ab(['eval', '--stdin'], src)))
  if (i < ticks) ab(['mouse', 'wheel', '700'])
}

console.log('')
console.log('tick  scrollProxy  gallery ty (all)                          reviews ty (all)')
for (const r of rows) {
  const g = (r.gallery || []).map((x) => x.ty).join(' ')
  const v = (r.reviews || []).map((x) => x.ty).join(' ')
  console.log(`${String(r.tick).padEnd(6)}${String(r.scrollProxy).padEnd(13)}${g.padEnd(48)}${v}`)
}

const first = rows[0]
const last = rows[rows.length - 1]
const moved = (list, key) => {
  const a = (first[key] || []).map((x) => x.ty)
  const b = (last[key] || []).map((x) => x.ty)
  return a.some((v, i) => Math.abs(v - (b[i] ?? v)) > 0.5)
}

console.log('')
console.log(`gallery moved across the sweep:    ${moved(first, 'gallery')}`)
console.log(`testimonials moved across the sweep: ${moved(first, 'reviews')}`)
console.log(`gallery speeds: ${(first.gallery || []).map((x) => x.speed).join(' ')}`)
console.log(`review speeds:  ${(first.reviews || []).map((x) => x.speed).join(' ')}`)
