/**
 * Emits `public/cv.pdf` — the file the hero's "Download CV" action links to.
 *
 * That link was a 404: the button shipped pointing at `/cv.pdf` and nothing ever
 * wrote the file. Rather than remove the action, this builds the document from
 * the same `data/profile.ts` and `data/experience.ts` the site renders, so the
 * download cannot drift from the page.
 *
 * Written as a plain PDF by hand rather than through a library: the document is
 * two pages of Helvetica text, and a dependency for that would be more surface
 * area than the generator.
 *
 *   node scripts/generate-cv.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// ---------------------------------------------------------------------------
// Content — mirrors data/profile.ts and data/experience.ts
// ---------------------------------------------------------------------------
const profile = {
  name: 'Kamran Yusupov',
  role: 'Frontend Engineer',
  location: 'Lisbon, Portugal',
  contact: 'hello@kamran.dev',
  site: 'kamran.dev',
  summary:
    'Frontend engineer who ships interfaces that feel inevitable. Eight years across product teams, design systems and platform work, with a bias toward boring technology and measurable performance.'
}

const experience = [
  {
    org: 'Northline',
    period: '2022 — Present',
    role: 'Lead frontend across three concurrent booking and logistics platforms. Own the architecture, the design system and the release process.',
    bullets: [
      'Rebuilt the booking flow around a single state machine, cutting median completion time by roughly a third.',
      'Introduced a shared token layer so four products inherit one visual language.',
      'Took the worst dashboard from 4.4s to 1.2s first interaction on a mid-tier laptop.'
    ]
  },
  {
    org: 'Cobalt Labs',
    period: '2019 — 2022',
    role: 'Second frontend hire at a Series B SaaS company. Consolidated four competing visual languages into one system.',
    bullets: [
      'Built the component library and its documentation site, still in use four years later.',
      'Moved a single bundle to route-level code splitting: 4.1s to 1.3s first interaction.',
      'Ran an incremental framework migration with weekly production releases and no rollback.'
    ]
  },
  {
    org: 'Independent practice',
    period: '2017 — 2019',
    role: 'Scoped engagements with founders and small product teams, taken end to end.',
    bullets: [
      'Delivered marketing sites, storefronts, booking systems and internal tools.',
      'Two client sites from this period are still running largely untouched.'
    ]
  }
]

const skills = [
  'TypeScript, Vue 3, Nuxt, React',
  'SCSS, design tokens, component systems',
  'GSAP, ScrollTrigger, motion design',
  'Vite, Webpack, CI bundle budgets',
  'Accessibility, visual regression testing',
  'Performance profiling and Core Web Vitals'
]

// ---------------------------------------------------------------------------
// Layout — A4 at 72dpi, 12pt baseline grid
// ---------------------------------------------------------------------------
const PAGE_W = 595.28
const PAGE_H = 841.89
const MARGIN = 56
const LINE = 14

const esc = (s) =>
  String(s)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    // The core PDF fonts are Latin-1; fold the typographic characters we use
    .replace(/[\u2014\u2013]/g, '-')
    .replace(/[\u2019\u2018]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')

/** Wraps at roughly 92 characters, close to the measure at 10pt Helvetica. */
function wrap(text, width = 92) {
  const words = String(text).split(/\s+/)
  const lines = []
  let line = ''
  for (const word of words) {
    if ((line + ' ' + word).trim().length > width) {
      if (line) lines.push(line.trim())
      line = word
    } else {
      line = (line + ' ' + word).trim()
    }
  }
  if (line) lines.push(line.trim())
  return lines
}

/** A page is a list of { font, size, gap, text } runs. */
const pages = []
let page = []
let y = PAGE_H - MARGIN

const push = (font, size, text, gap = LINE) => {
  if (y < MARGIN + LINE) {
    pages.push(page)
    page = []
    y = PAGE_H - MARGIN
  }
  page.push({ font, size, text, y })
  y -= gap
}

const rule = () => {
  if (y < MARGIN + LINE) {
    pages.push(page)
    page = []
    y = PAGE_H - MARGIN
  }
  page.push({ rule: true, y })
  y -= LINE
}

push('F1', 22, profile.name, 26)
push('F2', 11, `${profile.role}  ·  ${profile.location}`, 16)
push('F2', 10, `${profile.contact}  ·  ${profile.site}`, 20)
rule()

for (const l of wrap(profile.summary)) push('F2', 10, l)
y -= 10

push('F1', 13, 'Experience', 18)
for (const job of experience) {
  push('F1', 11, `${job.org}   ${job.period}`, 15)
  for (const l of wrap(job.role)) push('F2', 10, l)
  for (const b of job.bullets) {
    for (const [i, l] of wrap(b, 88).entries()) {
      push('F2', 10, i === 0 ? `- ${l}` : `  ${l}`, i === 0 ? LINE : LINE)
    }
  }
  y -= 8
}

push('F1', 13, 'Skills', 18)
for (const l of wrap(skills.join('  ·  '))) push('F2', 10, l)

pages.push(page)
page = []

// ---------------------------------------------------------------------------
// PDF assembly
// ---------------------------------------------------------------------------
const objects = []
const contentStreams = pages.map((runs) => {
  let out = ''
  for (const run of runs) {
    if (run.rule) {
      out += `0.8 w 0.7 G ${MARGIN} ${run.y + 4} m ${PAGE_W - MARGIN} ${run.y + 4} l S\n`
      continue
    }
    out += `BT /${run.font} ${run.size} Tf 0 g ${MARGIN} ${run.y} Td (${esc(run.text)}) Tj ET\n`
  }
  return out
})

const FONT_BOLD = 3
const FONT_REG = 4
const firstContent = 5
const firstPage = firstContent + contentStreams.length

objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
objects[2] =
  `<< /Type /Pages /Kids [${pages.map((_, i) => `${firstPage + i} 0 R`).join(' ')}] /Count ${pages.length} >>`
objects[FONT_BOLD] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'
objects[FONT_REG] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'

contentStreams.forEach((stream, i) => {
  objects[firstContent + i] = `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}endstream`
})

pages.forEach((_, i) => {
  objects[firstPage + i] =
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
    `/Resources << /Font << /F1 ${FONT_BOLD} 0 R /F2 ${FONT_REG} 0 R >> >> ` +
    `/Contents ${firstContent + i} 0 R >>`
})

let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'
const offsets = [0]
const maxObj = Math.max(...Object.keys(objects).map(Number))

for (let i = 1; i <= maxObj; i++) {
  offsets[i] = Buffer.byteLength(pdf, 'latin1')
  pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`
}

const xrefAt = Buffer.byteLength(pdf, 'latin1')
pdf += `xref\n0 ${maxObj + 1}\n0000000000 65535 f \n`
for (let i = 1; i <= maxObj; i++) {
  pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
}
pdf += `trailer\n<< /Size ${maxObj + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`

const out = join(root, 'public', 'cv.pdf')
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, Buffer.from(pdf, 'latin1'))

console.log(`wrote ${out} — ${pages.length} page(s), ${Buffer.byteLength(pdf, 'latin1')} bytes`)
