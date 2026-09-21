/**
 * Runtime audit of everything the page links to.
 *
 * Checks three classes of defect, all of which read as "unfinished" to a visitor:
 *
 * 1. **Placeholder hosts** — `example.com` and friends, which never resolve to
 *    anything real.
 * 2. **In-page anchors** whose target id does not exist, so the link silently
 *    does nothing.
 * 3. **Same-origin assets** that 404 — a missing poster, icon or download.
 *
 * Cross-origin links are reported but not fetched: a 200 from someone else's
 * server says nothing about the build.
 *
 *   node scripts/audit/link-integrity.mjs <session> <url>
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const scratch = process.env.COMMANDCODE_SCRATCHPAD || here
const session = process.argv[2] || 'locx'
const origin = process.argv[3] || 'http://localhost:3000'

const PLACEHOLDER = /(^|\.)(example\.(com|org|net)|test\.(com|invalid)|your-?domain|acme\.(com|test)|foo\.bar|domain\.com)/i

const PROBE = `(() => {
  const links = Array.from(document.querySelectorAll('a[href]')).map((a) => ({
    href: a.getAttribute('href'),
    resolved: a.href,
    text: (a.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 40)
  }))
  const ids = new Set(Array.from(document.querySelectorAll('[id]')).map((e) => e.id))
  const assets = new Set()
  document.querySelectorAll('img[src], video[src], source[src], link[href]').forEach((el) => {
    const v = el.getAttribute('src') || el.getAttribute('href')
    if (v) assets.add(v)
  })
  // Anything the CSS actually fetches. The quotes have to come off inside the
  // pattern: stripping them afterwards with a backreference does not work here,
  // and it left every font URL ending in a stray %22.
  Array.from(document.styleSheets).forEach((sheet) => {
    try {
      Array.from(sheet.cssRules || []).forEach((rule) => {
        const t = rule.cssText || ''
        const matches = t.match(/url\\(\\s*['"]?[^'")]+['"]?\\s*\\)/g)
        if (!matches) return
        matches.forEach((raw) => {
          const inner = raw.match(/url\\(\\s*['"]?([^'")]+?)['"]?\\s*\\)/)
          if (inner && inner[1]) assets.add(inner[1])
        })
      })
    } catch {}
  })
  return JSON.stringify({ links, ids: Array.from(ids), assets: Array.from(assets) })
})()`

const probeFile = join(scratch, `linkcheck-${session}.js`)
writeFileSync(probeFile, PROBE)

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

const data = parse(ab(['eval', '--stdin'], readFileSync(probeFile, 'utf8')))

const problems = { placeholder: [], anchor: [], asset: [], external: 0, ok: 0 }

for (const l of data.links) {
  const href = l.href || ''
  if (href.startsWith('#')) {
    const id = href.slice(1)
    if (!id) problems.anchor.push({ href, text: l.text, why: 'href="#" goes nowhere' })
    else if (!data.ids.includes(id)) problems.anchor.push({ href, text: l.text, why: `no element with id "${id}"` })
    else problems.ok++
    continue
  }
  let host = ''
  try {
    host = new URL(l.resolved).host
  } catch {
    problems.anchor.push({ href, text: l.text, why: 'unparseable href' })
    continue
  }
  if (PLACEHOLDER.test(host)) {
    problems.placeholder.push({ href, text: l.text, why: `placeholder host ${host}` })
    continue
  }
  if (l.resolved.startsWith(origin)) {
    problems.ok++
    continue
  }
  problems.external++
}

// Same-origin assets, fetched for real
const seen = new Set()
for (const a of data.assets) {
  let u
  try {
    u = new URL(a, origin)
  } catch {
    continue
  }
  if (u.origin !== new URL(origin).origin) continue
  if (seen.has(u.pathname)) continue
  seen.add(u.pathname)
  let status = 0
  try {
    const res = await fetch(u.href, { method: 'GET' })
    status = res.status
  } catch (err) {
    status = -1
  }
  if (status !== 200) problems.asset.push({ href: u.pathname, why: `HTTP ${status}` })
}

console.log('')
console.log(`=== link & asset integrity — ${origin} ===`)
console.log('')
console.log(`in-page links ok      : ${problems.ok}`)
console.log(`external links        : ${problems.external} (not fetched)`)
console.log(`same-origin assets    : ${seen.size} checked`)
console.log('')

const section = (title, rows) => {
  console.log(`${title}: ${rows.length}`)
  rows.forEach((r) => console.log(`  - ${r.href}${r.text ? ` ("${r.text}")` : ''} — ${r.why}`))
  console.log('')
}

section('PLACEHOLDER LINKS', problems.placeholder)
section('BROKEN ANCHORS', problems.anchor)
section('MISSING ASSETS', problems.asset)

const bad = problems.placeholder.length + problems.anchor.length + problems.asset.length
console.log(bad === 0 ? 'RESULT: every link and asset resolves' : `RESULT: ${bad} problem(s)`)
if (bad) process.exitCode = 1
