/**
 * Dumps the reference hero's element tree with the properties that decide how it
 * behaves on scroll — position, opacity, transform, z-index and background — so
 * the local build can be made to match rather than guessed at.
 *
 *   node scripts/audit/hero-tree.mjs <session> [scrollY]
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const scratch = process.env.COMMANDCODE_SCRATCHPAD || here
const session = process.argv[2] || 'refx'
const target = Number(process.argv[3] || 0)

const PROBE = `(() => {
  const root = document.querySelector('.md-interctv') || document.querySelector('section')
  if (!root) return JSON.stringify({ error: 'no hero root' })

  const px = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? Math.round(n * 100) / 100 : v }
  const describe = (el, depth) => {
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    const o = {
      d: depth,
      tag: el.tagName.toLowerCase(),
      cls: (el.className || '').toString().split(/\\s+/).filter(Boolean).slice(0, 3).join('.'),
      pos: cs.position,
      top: px(cs.top),
      z: cs.zIndex,
      op: px(cs.opacity),
      tf: cs.transform === 'none' ? 'none' : cs.transform.slice(0, 60),
      bg: cs.backgroundColor,
      bgImg: cs.backgroundImage === 'none' ? '' : cs.backgroundImage.slice(0, 40),
      // viewport-relative box, so scroll effects are visible in the numbers
      box: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
      vis: cs.visibility,
      disp: cs.display
    }
    const txt = (el.childNodes.length && Array.from(el.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ').trim()) || ''
    if (txt) o.text = txt.slice(0, 50)
    if (el.tagName === 'VIDEO') { o.video = { t: px(el.currentTime), dur: px(el.duration), paused: el.paused, muted: el.muted, loop: el.loop } }
    return o
  }

  const rows = []
  const walk = (el, depth) => {
    if (depth > 4) return
    // Only structural / meaningful nodes, to keep the dump readable
    const cs = getComputedStyle(el)
    const isMeaningful = depth <= 2 || cs.position === 'fixed' || cs.position === 'sticky' ||
      cs.position === 'absolute' || el.tagName === 'VIDEO' || el.tagName === 'IMG' ||
      (el.className || '').toString().match(/holder|overlay|bg|backdrop|mask|fade|layer|intro/i)
    if (isMeaningful) rows.push(describe(el, depth))
    if (depth < 4) Array.from(el.children).forEach((c) => walk(c, depth + 1))
  }
  walk(root, 0)

  return JSON.stringify({
    scrollY: Math.round(scrollY),
    vh: innerHeight,
    root: describe(root, 0),
    rows
  })
})()`

const probeFile = join(scratch, `hero-tree-${session}.js`)
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

const jump = join(scratch, 'hero-tree-jump.js')
writeFileSync(jump, `window.scrollTo({ top: ${target}, behavior: 'instant' }); 'ok'`)
ab(['eval', '--stdin'], readFileSync(jump, 'utf8'))
sleep(1400)

const data = parse(ab(['eval', '--stdin'], src))

console.log('')
console.log(`=== hero tree @ scrollY ${data.scrollY} (vh ${data.vh}) ===`)
console.log('')
console.log(
  'd  tag          cls                              pos        z     op      box[l,t,w,h]           transform'
)
for (const r of data.rows) {
  console.log(
    `${String(r.d).padEnd(2)} ${r.tag.padEnd(12)} ${(r.cls || '-').padEnd(32)} ${String(r.pos).padEnd(10)} ${String(r.z).padEnd(5)} ${String(r.op).padEnd(7)} ${JSON.stringify(r.box).padEnd(22)} ${String(r.tf).slice(0, 40)}`
  )
  if (r.text || r.bg !== 'rgba(0, 0, 0, 0)' || r.bgImg || r.video) {
    const bits = []
    if (r.bg !== 'rgba(0, 0, 0, 0)') bits.push(`bg=${r.bg}`)
    if (r.bgImg) bits.push(`bgImg=${r.bgImg}`)
    if (r.video) bits.push(`video t=${r.video.t}/${r.video.dur} paused=${r.video.paused}`)
    if (r.text) bits.push(`"${r.text}"`)
    if (bits.length) console.log(`${' '.repeat(15)}${bits.join('  ')}`)
  }
}
console.log('')
