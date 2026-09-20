/**
 * Responsive audit.
 *
 * For each required viewport: checks for horizontal overflow, measure the
 * section stack, and verifies the design tokens resolve to the values the
 * reference uses at that breakpoint (RECON §4, §5, §10).
 *
 *   node scripts/audit-responsive.mjs [session]
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const session = process.argv[2] ?? 'porto'
const BIN = process.platform === 'win32' ? 'agent-browser.cmd' : 'agent-browser'

/**
 * The probe is written to a file and piped through `eval --stdin`; passing this
 * much JavaScript as a shell argument gets mangled by cmd.exe.
 */
const probeFile = join(mkdtempSync(join(tmpdir(), 'resp-')), 'probe.js')

const ab = (args, input) =>
  execFileSync(BIN, ['--session', session, ...args], {
    encoding: 'utf8',
    input,
    shell: process.platform === 'win32',
    maxBuffer: 32 * 1024 * 1024
  })

const VIEWPORTS = [
  { name: 'iPhone SE', w: 375, h: 812, ttitle: '32px', container: 'unset-ish', split: 'flex' },
  { name: 'iPhone 14', w: 390, h: 844, ttitle: '32px', container: 'unset-ish', split: 'flex' },
  { name: 'iPhone Pro Max', w: 430, h: 932, ttitle: '32px', container: 'unset-ish', split: 'flex' },
  { name: 'iPad portrait', w: 768, h: 1024, ttitle: '32px', container: '576px', split: 'flex' },
  { name: 'iPad Air', w: 820, h: 1180, ttitle: '26px', container: '768px', split: '20% auto' },
  { name: 'Laptop', w: 1366, h: 768, ttitle: '36px', container: '992px', split: '30% auto' },
  { name: 'Desktop', w: 1440, h: 900, ttitle: '36px', container: '992px', split: '30% auto' },
  { name: 'Desktop XL', w: 1920, h: 1080, ttitle: '56px', container: '1440px', split: '30% auto' }
]

const PROBE = `(() => {
  const px = (v) => Math.round(parseFloat(v) * 100) / 100;
  const title = document.querySelector('.about__title');
  const content = document.querySelector('.about__content');
  const container = document.querySelector('.about .container');

  // Horizontal overflow: any element extending past the viewport
  const offenders = [];
  document.querySelectorAll('body *').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    const cs = getComputedStyle(el);
    if (cs.position === 'fixed') return;
    if (r.right > innerWidth + 2 || r.left < -2) {
      offenders.push({
        sel: el.tagName.toLowerCase() + '.' + (typeof el.className === 'string' ? el.className.split(' ').filter(Boolean).slice(0, 2).join('.') : ''),
        left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width)
      });
    }
  });

  return JSON.stringify({
    vw: innerWidth,
    vh: innerHeight,
    docW: document.documentElement.scrollWidth,
    docH: document.documentElement.scrollHeight,
    overflowX: document.documentElement.scrollWidth > innerWidth + 1,
    ttitle: getComputedStyle(document.documentElement).getPropertyValue('--ttitle').trim(),
    tsubtitle: getComputedStyle(document.documentElement).getPropertyValue('--tsubtitle').trim(),
    desctext: getComputedStyle(document.documentElement).getPropertyValue('--desctext').trim(),
    titleSize: title ? getComputedStyle(title).fontSize : null,
    containerW: container ? px(container.getBoundingClientRect().width) : null,
    splitDisplay: content ? getComputedStyle(content).display : null,
    splitCols: content ? getComputedStyle(content).gridTemplateColumns : null,
    sections: Array.from(document.querySelectorAll('section, footer')).map((s) => ({
      cls: (s.className || '').replace(' md-', ''), h: Math.round(s.getBoundingClientRect().height)
    })),
    offenders: offenders.slice(0, 12),
    offenderCount: offenders.length
  }, null, 1);
})()`

writeFileSync(probeFile, PROBE, 'utf8')

const results = []
for (const vp of VIEWPORTS) {
  ab(['set', 'viewport', String(vp.w), String(vp.h)])
  ab(['reload'])
  ab(['wait', '--load', 'networkidle'])
  ab(['wait', '2600'])
  const raw = ab(['eval', '--stdin'], readFileSync(probeFile, 'utf8')).trim()
  let data = JSON.parse(raw)
  if (typeof data === 'string') data = JSON.parse(data)
  results.push({ vp, data })
}

let failures = 0
console.log('\n  RESPONSIVE AUDIT\n  ' + '='.repeat(88))
for (const { vp, data } of results) {
  const ttitleOk = data.ttitle === vp.ttitle
  const overflowOk = !data.overflowX
  const offenderOk = data.offenderCount === 0
  if (!ttitleOk || !overflowOk || !offenderOk) failures += 1

  console.log(`\n  ${vp.name}  ${vp.w}×${vp.h}`)
  console.log(
    `    --ttitle        ${data.ttitle.padEnd(10)} expected ${vp.ttitle.padEnd(10)} ${ttitleOk ? 'ok' : 'MISMATCH'}`
  )
  console.log(
    `    --tsubtitle     ${data.tsubtitle.padEnd(10)}   --desctext ${data.desctext}`
  )
  console.log(
    `    container       ${String(data.containerW).padEnd(10)} expected ${vp.container}`
  )
  console.log(
    `    split           ${String(data.splitDisplay).padEnd(6)} ${String(data.splitCols || '').slice(0, 30)}`
  )
  console.log(
    `    doc  ${data.docW}×${data.docH}   horizontal overflow: ${data.overflowX ? 'YES' : 'no'} ${overflowOk ? 'ok' : 'FAIL'}`
  )
  console.log(
    `    overflowing elements: ${data.offenderCount} ${offenderOk ? 'ok' : 'FAIL'}`
  )
  if (!offenderOk) {
    data.offenders.forEach((o) => console.log(`      · ${o.sel}  left=${o.left} right=${o.right} w=${o.w}`))
  }
  console.log(
    `    sections  ${data.sections.map((s) => `${s.cls}:${s.h}`).join('  ')}`
  )
}

console.log(`\n  ${results.length - failures}/${results.length} viewports clean\n`)
process.exit(failures > 0 ? 1 : 0)
