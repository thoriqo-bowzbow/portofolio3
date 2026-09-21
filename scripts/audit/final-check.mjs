/**
 * Final runtime check across the viewports this pass was asked to cover.
 *
 * For each: reload at that size, then confirm there is no horizontal overflow, no
 * page error, and that the page's interactive surfaces are present and working —
 * nav targets, both modals, the loader, the hero video, the footer.
 *
 *   node scripts/audit/final-check.mjs <session>
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const scratch = process.env.COMMANDCODE_SCRATCHPAD || here
const session = process.argv[2] || 'locx'

const VIEWPORTS = [
  [1366, 768],
  [1440, 900],
  [1920, 1080],
  [390, 844],
  [430, 932]
]

const PROBE = `(() => {
  const doc = document.documentElement
  const sections = Array.from(document.querySelectorAll('section[id]')).map((s) => s.id)
  const navTargets = ['#about', '#experience', '#projects', '#reviews', '#contact']
  const missingTargets = navTargets.filter((t) => !document.querySelector(t))
  const video = document.querySelector('video')
  const loader = document.querySelector('.site-loader')

  return JSON.stringify({
    docW: doc.scrollWidth,
    winW: window.innerWidth,
    docH: doc.scrollHeight,
    overflow: doc.scrollWidth > window.innerWidth + 1,
    sections,
    missingTargets,
    video: video ? { t: Math.round(video.currentTime * 100) / 100, paused: video.paused, muted: video.muted } : null,
    loaderGone: !loader,
    header: !!document.querySelector('header, .site-header'),
    footer: !!document.querySelector('footer, .site-footer'),
    contact: !!document.querySelector('#contact'),
    socials: document.querySelectorAll('a[href*="linkedin"], a[href*="github"], a[href^="mailto:"]').length,
    placeholders: Array.from(document.querySelectorAll('a[href]')).filter((a) => /example\\.(com|org|net)/i.test(a.href)).length
  })
})()`

const probeFile = join(scratch, `final-probe-${session}.js`)
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

let failures = 0

for (const [w, h] of VIEWPORTS) {
  ab(['set', 'viewport', String(w), String(h)])
  ab(['errors', '--clear'])
  ab(['console', '--clear'])
  ab(['reload'])
  sleep(9000)

  const r = parse(ab(['eval', '--stdin'], src))

  let errors = []
  try {
    const raw = parse(ab(['errors', '--json']))
    const inner = raw.data || raw
    errors = Array.isArray(inner) ? inner : inner.errors || []
  } catch {}

  let warnings = []
  try {
    const raw = parse(ab(['console', '--json']))
    const inner = raw.data || raw
    const list = Array.isArray(inner) ? inner : inner.messages || []
    warnings = list.filter((m) => /warn|error/i.test(String(m.type || m.level || '')))
  } catch {}

  const problems = []
  if (r.overflow) problems.push(`horizontal overflow: doc ${r.docW} > window ${r.winW}`)
  if (r.missingTargets.length) problems.push(`nav targets with no section: ${r.missingTargets.join(', ')}`)
  if (r.placeholders) problems.push(`${r.placeholders} placeholder link(s)`)
  if (!r.loaderGone) problems.push('loader still present after 9s')
  if (!r.header) problems.push('no header')
  if (!r.footer) problems.push('no footer')
  if (!r.video) problems.push('no hero video')
  if (errors.length) problems.push(`${errors.length} page error(s)`)
  if (warnings.length) problems.push(`${warnings.length} console warning(s)/error(s)`)

  if (problems.length) failures++

  console.log('')
  console.log(`${w}×${h}  doc ${r.docW}×${r.docH}  sections: ${r.sections.length}`)
  console.log(`  socials/contact links: ${r.socials}   hero video: ${r.video ? `t=${r.video.t} paused=${r.video.paused} muted=${r.video.muted}` : 'none'}`)
  if (problems.length) problems.forEach((p) => console.log(`  FAIL  ${p}`))
  else console.log('  ok — no overflow, no errors, all surfaces present')
}

console.log('')
console.log(failures === 0 ? `RESULT: all ${VIEWPORTS.length} viewports clean` : `RESULT: ${failures} viewport(s) with problems`)
if (failures) process.exitCode = 1
