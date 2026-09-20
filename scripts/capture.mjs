/**
 * Captures implementation section screenshots at a given viewport.
 *   node scripts/capture.mjs <session> <width> <height> <prefix> <outDir>
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const [, , session = 'porto', w = '1440', h = '900', prefix = 'impl', outDir = 'tools/shots'] = process.argv

// agent-browser will not create the destination directory itself
mkdirSync(outDir, { recursive: true })

// Global npm bin dir; agent-browser ships a .cmd shim on Windows
const BIN = process.platform === 'win32' ? 'agent-browser.cmd' : 'agent-browser'

const ab = (args) =>
  execFileSync(BIN, ['--session', session, ...args], { encoding: 'utf8', shell: process.platform === 'win32' })

const SECTIONS = [
  ['hero', 0],
  ['hero-block-1', 1620],
  ['hero-block-2', 2520],
  ['hero-block-3', 3420],
  ['about', 4500],
  ['about-stack', 6100],
  ['experience', 7320],
  ['experience-2', 8600],
  ['highlights', 11121],
  ['testimonials', 12031],
  ['contact', 13209],
  ['footer', 14400]
]

ab(['set', 'viewport', String(w), String(h)])
ab(['reload'])
ab(['wait', '--load', 'networkidle'])
ab(['wait', '3000'])

const report = []
for (const [name, y] of SECTIONS) {
  const docH = Number(ab(['eval', 'document.documentElement.scrollHeight']).trim())
  const target = Math.min(y, Math.max(0, docH - Number(h)))
  ab(['eval', `window.scrollTo({top:${target},behavior:'instant'}); 'ok'`])
  ab(['wait', '1200'])
  const file = `${outDir}/${prefix}-${w}-${name}.png`
  ab(['screenshot', file])
  report.push({ name, y: target, file })
}

console.log(JSON.stringify(report, null, 1))
