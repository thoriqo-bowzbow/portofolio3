/**
 * Captures matched scroll positions from a browser session, for side-by-side
 * comparison of the reference against the local build.
 *
 *   node scripts/audit/capture-strip.mjs <session> <prefix> <scrollY,scrollY,...>
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const scratch = process.env.COMMANDCODE_SCRATCHPAD || here
const session = process.argv[2] || 'locx'
const prefix = process.argv[3] || 'cap'
const positions = (process.argv[4] || '0,900,1620').split(',').map(Number)

const outDir = join(scratch, `cap-${prefix}`)
mkdirSync(outDir, { recursive: true })

const ab = (args, input) =>
  execFileSync('agent-browser.cmd', ['--session', session, ...args], {
    encoding: 'utf8',
    shell: true,
    input,
    maxBuffer: 32 * 1024 * 1024
  })

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)

const jump = join(scratch, 'cap-jump.js')

/*
 * The reference reveals content on `is-inview` with a CSS transition, so a
 * scripted jump lands mid-animation and captures a washed-out frame. Wait long
 * enough for the reveal to settle before shooting.
 */
const SETTLE = Number(process.env.CAPTURE_SETTLE || 2600)

for (const y of positions) {
  writeFileSync(jump, `window.scrollTo({ top: ${y}, behavior: 'instant' }); 'ok'`)
  ab(['eval', '--stdin'], readFileSync(jump, 'utf8'))
  // Two waits: the jump itself settles, then the reveal transition completes.
  sleep(SETTLE)
  writeFileSync(jump, `window.scrollTo({ top: ${y}, behavior: 'instant' }); 'ok'`)
  ab(['eval', '--stdin'], readFileSync(jump, 'utf8'))
  sleep(SETTLE)
  const file = join(outDir, `${prefix}-${String(y).padStart(6, '0')}.png`)
  ab(['screenshot', file])
  console.log(`  ${String(y).padStart(6)}  ${file}`)
}
