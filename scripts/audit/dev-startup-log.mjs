/**
 * Captures a full `nuxt dev` startup, including the noisy part, then stops it.
 *
 * The dev server never exits on its own and its reporter buffers when stdout is
 * not a TTY, so the run is wrapped: start it, wait for the log to go quiet, then
 * kill the process tree and read what it wrote.
 *
 *   node scripts/audit/dev-startup-log.mjs [outfile] [waitMs]
 */
import { spawn } from 'node:child_process'
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const out = process.argv[2] || join(root, 'tools', 'dev-startup.log')
const waitMs = Number(process.argv[3] || 45000)

mkdirSync(dirname(out), { recursive: true })

const child = spawn('npx', ['nuxt', 'dev', '--port', '3000'], {
  cwd: root,
  shell: true,
  windowsHide: true,
  env: { ...process.env, NODE_ENV: 'development', FORCE_COLOR: '0', NO_COLOR: '1' }
})

let buffer = ''
child.stdout.on('data', (d) => {
  buffer += d.toString()
})
child.stderr.on('data', (d) => {
  buffer += d.toString()
})

const strip = (s) =>
  s
    // eslint-disable-next-line no-control-regex
    .replace(/\u001B\[[0-9;]*[A-Za-z]/g, '')
    .replace(/\r/g, '')

/*
 * Keep the server alive by actually using it.
 *
 * The client module graph is only completed when a page is requested: Nuxt warms
 * the client environment, but the transform of the app entry — and therefore of
 * everything reachable from it, including `manifest.js` — happens on the first
 * real request. A harness that only starts the server and waits will never see
 * the pre-transform error this script exists to catch.
 *
 * Only real routes: this is a one-page site, so `#experience` is an anchor on `/`
 * and requesting it as a path just produces router warnings that drown the log.
 */
const hit = setInterval(async () => {
  try {
    await fetch('http://localhost:3000/', { signal: AbortSignal.timeout(4000) })
  } catch {}
}, 6000)

setTimeout(async () => {
  clearInterval(hit)
  child.kill('SIGTERM')
  // Give the reporter a moment to flush before the tree is torn down
  await new Promise((r) => setTimeout(r, 1200))
  try {
    spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { shell: true, windowsHide: true })
  } catch {}

  const clean = strip(buffer)
  writeFileSync(out, clean, 'utf8')

  const lines = clean.split('\n')
  const errors = lines.filter((l) => /error|failed to resolve|warn/i.test(l))

  console.log(`captured ${lines.length} lines -> ${out}`)
  console.log(`error/warning lines: ${errors.length}`)
  console.log('')
  errors.slice(0, 40).forEach((l) => console.log('  ' + l.trim()))
  if (existsSync(out)) console.log(`\n(full log at ${out})`)
}, waitMs)
