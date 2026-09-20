/**
 * Samples this implementation's modal animation frame by frame, in the same shape
 * the reference was measured with, so the two timelines can be compared directly.
 *
 *   node scripts/audit/impl-modal-anim.mjs [session] [open|close]
 */
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const scratch = process.env.COMMANDCODE_SCRATCHPAD || here
const session = process.argv[2] || 'loc'
const action = process.argv[3] || 'open'

const probe = `(() => {
  const wrap = document.querySelector('.modal')
  const panel = wrap ? wrap.querySelector('.modal__panel') : null
  if (!wrap) return JSON.stringify({ state: 'absent', t: performance.now() })
  const wcs = getComputedStyle(wrap)
  const pcs = panel ? getComputedStyle(panel) : null
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
    state: 'present',
    t: Math.round(performance.now()),
    wrapCls: wrap.className,
    wrapOpacity: wcs.opacity,
    wrapAnim: wcs.animationName + ' ' + wcs.animationDuration,
    panelOpacity: pcs ? pcs.opacity : null,
    panelTy: ty(panel),
    panelAnim: pcs ? pcs.animationName + ' ' + pcs.animationDuration : null
  })
})()`

const probeFile = join(scratch, 'impl-modal-anim-probe.js')
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

// Kick off the action and start sampling immediately. Written to a file and piped
// because a multi-line eval as a shell argument is mangled by cmd.exe.
const kick = `(() => {
  ${
    action === 'open'
      ? "const b = Array.from(document.querySelectorAll('button')).filter((x) => /get in touch/i.test(x.textContent))[0]; b && b.click();"
      : "const c = document.querySelector('.request__close'); c && c.click();"
  }
  return 'started'
})()`

const kickFile = join(scratch, 'impl-modal-kick.js')
writeFileSync(kickFile, kick)

ab(['eval', '--stdin'], kick)

const rows = []
for (let i = 0; i < 40; i++) {
  rows.push(parse(ab(['eval', '--stdin'], probe)))
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 60)
}

console.log('')
console.log(`${action} — sampled every ~60ms`)
console.log('time    wrapCls                          wrapOp   wrapAnim                       panelOp   panelTy   panelAnim')
for (const r of rows) {
  if (r.state === 'absent') {
    console.log(`${String(r.t).padEnd(8)}ABSENT`)
  } else {
    console.log(
      String(r.t).padEnd(8) +
        String(r.wrapCls).padEnd(32) +
        String(r.wrapOpacity).padEnd(9) +
        String(r.wrapAnim).padEnd(31) +
        String(r.panelOpacity).padEnd(10) +
        String(r.panelTy).padEnd(10) +
        String(r.panelAnim)
    )
  }
}

const first = rows.find((r) => r.state === 'present')
const last = [...rows].reverse().find((r) => r.state === 'present')
if (first && last) {
  console.log('')
  console.log(`first present: t=${first.t}  last present: t=${last.t}`)
}
