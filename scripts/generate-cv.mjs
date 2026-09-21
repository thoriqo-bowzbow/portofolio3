/**
 * Emits `public/cv.pdf` — the file every "Download CV" action links to.
 *
 * Content mirrors the site's own data modules (`data/profile.ts`,
 * `data/experience.ts`, `data/education.ts`, `data/stack.ts`) so the download
 * cannot drift from the page. Every line is taken from the supplied CV: the CV
 * lists roles, employers and dates without descriptions, and it lists no projects,
 * so this document states those same facts and no others.
 *
 * Written as a plain PDF by hand rather than through a library: the document is
 * one page of Helvetica text, and a dependency for that would be more surface
 * area than the generator.
 *
 *   node scripts/generate-cv.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// ---------------------------------------------------------------------------
// Content — mirrors the data modules above
// ---------------------------------------------------------------------------
const profile = {
  name: 'Thoriqo Salafu Sholihin',
  role: 'IT Support Specialist & Network Engineer',
  /**
   * The CV's own header says Jakarta Barat and its summary says Jakarta Timur.
   * The document therefore states the city only, matching the site, rather than
   * silently picking one regency.
   */
  location: 'Jakarta, Indonesia',
  email: 'thoriqosalafusholihin@gmail.com',
  phone: '+62 851-1102-0740',
  links: 'linkedin.com/in/thoriqo  ·  github.com/thoriqo-bowzbow'
}

const experience = [
  { title: 'IT Support', org: 'PT. Wahana Harta Nusantara', period: 'April — September 2026' },
  { title: 'Network Engineer & Technical Lead', org: 'Venous Group', period: 'June 2024 — December 2025' },
  { title: 'Admin Operasional', org: 'CV. Kahe Group', period: 'October 2023 — June 2024' }
]

const education = [
  { school: 'SMA Negeri 1 Anjatan', track: 'IPS', period: 'July 2020 — May 2023', result: 'Ujian Sekolah 89.14/100' }
]

const skills = [
  'Networking — TCP/IP, subnetting, routing, switching, LAN/WLAN, MikroTik, Ruijie Reyee',
  'Cabling — UTP, fibre optic, fusion splicer, OTDR, OPM',
  'Systems — Windows 10/11, Linux/Ubuntu, macOS, local server administration',
  'Tooling — Git, CI/CD, Docker, Python scripting, backup and recovery',
  'Integration — AI/API integration, agentic AI, MCP and plugin integration',
  'Support — helpdesk, IT asset management, PC and laptop repair and assembly',
  'Peripherals — network printer, barcode, scanner, CCTV/NVR/DVR'
]

const languages = 'Indonesian  ·  English'

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
    .replace(/\u00b7/g, '-')

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

/** A page is a list of { font, size, text, y } runs, plus rules. */
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
push('F2', 11, profile.role, 16)
push('F2', 10, profile.location, 14)
push('F2', 10, `${profile.email}  ·  ${profile.phone}`, 14)
push('F2', 10, profile.links, 20)
rule()

push('F1', 13, 'Experience', 18)
for (const job of experience) {
  push('F1', 11, job.title, 14)
  push('F2', 10, `${job.org}   ${job.period}`, 20)
}
y -= 6

push('F1', 13, 'Education', 18)
for (const ed of education) {
  push('F1', 11, ed.school, 14)
  push('F2', 10, `${ed.track}   ${ed.period}`, 14)
  push('F2', 10, ed.result, 20)
}
y -= 6

push('F1', 13, 'Skills', 18)
for (const group of skills) {
  for (const l of wrap(group, 88)) push('F2', 10, l)
}
y -= 6

push('F1', 13, 'Languages', 18)
push('F2', 10, languages, 20)

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
