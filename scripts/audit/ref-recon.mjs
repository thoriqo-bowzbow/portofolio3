/**
 * Dumps a structural map of the live reference so it can be compared with the
 * local build section by section: scroll order, geometry, headings, imagery and
 * links.
 *
 *   node scripts/audit/ref-recon.mjs <session> [w] [h]
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const scratch = process.env.COMMANDCODE_SCRATCHPAD || here
const session = process.argv[2] || 'refx'
const vw = Number(process.argv[3] || 1440)
const vh = Number(process.argv[4] || 900)

const PROBE = `(() => {
  const out = { viewport: [innerWidth, innerHeight], doc: [document.documentElement.scrollWidth, document.documentElement.scrollHeight] }

  // Anything that looks like a top-level band, in document order.
  const bands = []
  const seen = new Set()
  document.querySelectorAll('section, header, footer, main > div, .md-interctv, [class*="section"]').forEach((el) => {
    const r = el.getBoundingClientRect()
    if (r.height < 80 || r.width < 300) return
    const top = Math.round(r.top + scrollY)
    const key = top + 'x' + Math.round(r.height)
    if (seen.has(key)) return
    seen.add(key)
    bands.push({
      tag: el.tagName.toLowerCase(),
      cls: (el.className || '').toString().split(/\\s+/).filter((c) => c && !/^(is-|has-)/.test(c)).slice(0, 3).join(' '),
      top,
      h: Math.round(r.height),
      bg: getComputedStyle(el).backgroundColor,
      pos: getComputedStyle(el).position,
      text: (el.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 90)
    })
  })
  bands.sort((a, b) => a.top - b.top)
  out.bands = bands

  // Headings, in document order
  out.headings = Array.from(document.querySelectorAll('h1,h2,h3,h4')).map((h) => ({
    tag: h.tagName.toLowerCase(),
    cls: (h.className || '').toString().split(/\\s+/).slice(0, 2).join(' '),
    text: (h.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 70),
    fs: Math.round(parseFloat(getComputedStyle(h).fontSize) * 10) / 10,
    ff: getComputedStyle(h).fontFamily.split(',')[0].replace(/["']/g, ''),
    fw: getComputedStyle(h).fontWeight,
    top: Math.round(h.getBoundingClientRect().top + scrollY)
  }))

  const px = (v) => Math.round(parseFloat(v) * 10) / 10
  out.images = Array.from(document.querySelectorAll('img')).slice(0, 60).map((im) => {
    const r = im.getBoundingClientRect()
    const cs = getComputedStyle(im)
    return {
      src: (im.currentSrc || im.src || '').replace(/^https?:\\/\\/[^/]+/, '').slice(0, 90),
      alt: (im.alt || '').slice(0, 40),
      box: [Math.round(r.width), Math.round(r.height)],
      top: Math.round(r.top + scrollY),
      fit: cs.objectFit,
      pos: cs.objectPosition
    }
  })

  out.links = Array.from(document.querySelectorAll('a[href]')).map((a) => ({
    href: (a.getAttribute('href') || '').slice(0, 80),
    text: (a.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 40)
  }))

  out.videos = Array.from(document.querySelectorAll('video')).map((v) => ({
    src: (v.currentSrc || v.src || '').split('/').pop(),
    box: [Math.round(v.getBoundingClientRect().width), Math.round(v.getBoundingClientRect().height)],
    muted: v.muted, loop: v.loop, autoplay: v.autoplay, paused: v.paused
  }))

  return JSON.stringify(out)
})()`

const probeFile = join(scratch, `recon-${session}-${vw}x${vh}.js`)
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

const js = (code) => {
  const f = join(scratch, 'recon-tmp.js')
  writeFileSync(f, code)
  return parse(ab(['eval', '--stdin'], readFileSync(f, 'utf8')))
}

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)

const url = process.argv[5] || 'https://mameed.com/'
ab(['set', 'viewport', String(vw), String(vh)])
ab(['open', url])
sleep(4500)

// Walk the page in a few large jumps so lazy imagery resolves, then return to the
// top. Driven from here rather than one async in-page loop: the async form does
// not survive the one-shot eval transport and the call never returns. Skipped when
// SKIP_SCROLL=1 — the local build runs Lenis, which owns scrolling and makes a
// scripted walk through it unreliable.
if (!process.env.SKIP_SCROLL) {
  const H = Number(js(`JSON.stringify(document.documentElement.scrollHeight)`))
  const STEP = vh * 2
  for (let y = 0; y < H; y += STEP) {
    js(`scrollTo(0, ${y}); JSON.stringify({ ok: true })`)
    sleep(420)
  }
  js(`scrollTo(0, 0); JSON.stringify({ ok: true })`)
  sleep(1600)
}

const map = js(src)
const out = join(scratch, `recon-${session}-${vw}x${vh}.json`)
writeFileSync(out, JSON.stringify(map, null, 2))

console.log('')
console.log(`=== ${url} @ ${vw}x${vh} ===`)
console.log(`doc ${map.doc[0]}x${map.doc[1]}`)
console.log('')
console.log('--- bands (document order) ---')
for (const b of map.bands) {
  console.log(
    `${String(b.top).padStart(7)}  h${String(b.h).padStart(6)}  ${b.pos.padEnd(9)} ${b.bg.padEnd(22)} ${b.tag}.${b.cls}`
  )
  if (b.text) console.log(`${' '.repeat(12)}"${b.text}"`)
}
console.log('')
console.log('--- headings ---')
for (const h of map.headings) {
  console.log(`${String(h.top).padStart(7)}  ${h.tag.padEnd(3)} ${String(h.fs).padStart(5)}px ${h.fw.padEnd(4)} ${h.ff.padEnd(18)} "${h.text}"`)
}
console.log('')
console.log('--- images ---')
for (const i of map.images) {
  console.log(`${String(i.top).padStart(7)}  ${String(i.box[0]).padStart(5)}x${String(i.box[1]).padEnd(5)} fit=${i.fit.padEnd(7)} pos=${(i.pos||'').padEnd(14)} ${i.src}`)
}
console.log('')
console.log('--- links ---')
const byHost = {}
for (const l of map.links) {
  let h = l.href
  const m = h.match(/^https?:\/\/([^/]+)/)
  h = m ? m[1] : h
  byHost[h] = byHost[h] || []
  byHost[h].push(l.text)
}
for (const [h, texts] of Object.entries(byHost)) {
  console.log(`  ${h.padEnd(34)} x${String(texts.length).padStart(3)}  ${texts.slice(0, 4).join(' | ').slice(0, 70)}`)
}
console.log('')
console.log('--- videos ---')
for (const v of map.videos) console.log(`  ${v.src}  ${v.box[0]}x${v.box[1]}  muted=${v.muted} loop=${v.loop} autoplay=${v.autoplay} paused=${v.paused}`)
console.log('')
console.log(`full map written to ${out}`)
