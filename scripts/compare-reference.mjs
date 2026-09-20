/**
 * Compares implementation geometry against the reference measurements captured
 * during reconnaissance (docs/MAMEED_RECON.md §6, §4, §5).
 *
 *   node scripts/compare-reference.mjs <impl.json>
 */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const file = process.argv[2] ?? join(root, 'tools', 'impl-1440.json')

const raw = readFileSync(file, 'utf8').trim()
let impl = JSON.parse(raw)
if (typeof impl === 'string') impl = JSON.parse(impl)

/**
 * Reference values, all measured at 1440×900 (RECON §4–§7).
 * `null` means the reference has no direct equivalent at this viewport.
 */
const REF = {
  doc: { scrollH: 15217, vw: 1440, vh: 900 },
  sections: {
    hero: { h: 4500 },
    about: { h: 2820 },
    experience: { h: 3801 },
    highlights: { h: 910 },
    testimonials: { h: 1178 },
    contact: { h: 1108 },
    footer: { h: 900 }
  },
  container: { w: 992, left: 224 },
  aboutContent: { w: 992, gtc: '288.594px 623.406px', gap: '50px' },
  aboutTitle: { fs: '36px', fw: '400' },
  aboutPara: { fs: '15px', fw: '500', lh: '27px', color: 'rgb(37, 35, 36)' },
  stack: { w: 623.41, pad: '70px' },
  stackTitle: { fs: '26px' },
  stackTile: { w: 65, h: 65 },
  expRow: { w: 962, mar: '0px 0px 100px' },
  expOrg: { fs: '22px', fw: '400' },
  expDates: { fs: '26px', fw: '300', color: 'rgba(37, 35, 36, 0.5)' },
  expProjects: { gtc: null, gap: '50px', mar: '40px 0px 150px' },
  glryGrid: { gtc: null, gap: '10px' },
  glryCard: { w: 148.34, h: 170 },
  rvwCard: { h: 300 },
  ctcard: { w: 301.7, pad: '30px' },
  contactForm: { w: 400 },
  footerText: { fs: '18px', w: 600 },
  footerQuoteText: { fs: '36px', fw: '700' },
  footerAuthor: { fs: '20px', color: 'rgba(37, 35, 36, 0.4)' },
  navLink: { fs: '14px', color: 'rgb(255, 255, 255)' },
  heroTitle: { fs: '212px' },
  heroDesc: { fs: '14px', fw: '500', lh: '25.2px', w: 650 }
}

const rows = []
let pass = 0
let fail = 0

const fmt = (v) => {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'number') return String(Math.round(v * 100) / 100)
  return String(v)
}

function check(label, actual, expected, tolerance = 0) {
  if (expected === null || expected === undefined) return
  if (actual === null || actual === undefined) {
    rows.push({ label, actual: 'MISSING', expected: fmt(expected), ok: false })
    fail++
    return
  }

  let ok
  if (typeof expected === 'number' && typeof actual === 'number') {
    ok = Math.abs(actual - expected) <= tolerance
  } else {
    ok = String(actual) === String(expected)
  }

  rows.push({
    label,
    actual: fmt(actual),
    expected: fmt(expected),
    delta: typeof expected === 'number' && typeof actual === 'number'
      ? fmt(Math.round((actual - expected) * 100) / 100)
      : '',
    ok
  })
  ok ? pass++ : fail++
}

// Document
check('doc.scrollHeight', impl.doc?.scrollH, REF.doc.scrollH, 60)

// Section heights
for (const [name, ref] of Object.entries(REF.sections)) {
  check(`section ${name} height`, impl.sections?.[name]?.h, ref.h, Math.max(30, ref.h * 0.06))
}

// Container & grid
check('container width', impl.container?.w, REF.container.w, 2)
check('container left', impl.container?.left, REF.container.left, 2)
check('about grid columns', impl.aboutContent?.gtc, REF.aboutContent.gtc)
check('about grid gap', impl.aboutContent?.gap, REF.aboutContent.gap)

// Type
check('about title size', impl.aboutTitle?.fs, REF.aboutTitle.fs)
check('body copy size', impl.aboutPara?.fs, REF.aboutPara.fs)
check('body copy weight', impl.aboutPara?.fw, REF.aboutPara.fw)
check('body copy line-height', impl.aboutPara?.lh, REF.aboutPara.lh)
check('body copy colour (revealed)', impl.aboutPara?.color, REF.aboutPara.color)

check('stack box padding', impl.stack?.pad, REF.stack.pad)
check('stack title size', impl.stackTitle?.fs, REF.stackTitle.fs)
check('stack tile width', impl.stackTile?.w, REF.stackTile.w, 1)
check('stack tile height', impl.stackTile?.h, REF.stackTile.h, 1)

check('experience row width', impl.expRow?.w, REF.expRow.w, 2)
check('experience row margin', impl.expRow?.mar, REF.expRow.mar)
check('experience org size', impl.expOrg?.fs, REF.expOrg.fs)
check('experience dates size', impl.expDates?.fs, REF.expDates.fs)
check('experience dates weight', impl.expDates?.fw, REF.expDates.fw)
check('experience dates colour', impl.expDates?.color, REF.expDates.color)
check('projects gap', impl.expProjects?.gap, REF.expProjects.gap)
check('projects margin', impl.expProjects?.mar, REF.expProjects.mar)

check('gallery gap', impl.glryGrid?.gap, REF.glryGrid.gap)
check('gallery card width', impl.glryCard?.w, REF.glryCard.w, 3)
check('gallery card height', impl.glryCard?.h, REF.glryCard.h, 3)

check('testimonial card height', impl.rvwCard?.h, REF.rvwCard.h, 5)
check('contact card padding', impl.ctcard?.pad, REF.ctcard.pad)
check('contact card width', impl.ctcard?.w, REF.ctcard.w, 3)
check('contact form width', impl.contactForm?.w, REF.contactForm.w, 1)

check('footer quote size', impl.footerQuoteText?.fs, REF.footerQuoteText.fs)
check('footer quote weight', impl.footerQuoteText?.fw, REF.footerQuoteText.fw)
check('footer author size', impl.footerAuthor?.fs, REF.footerAuthor.fs)
check('footer author colour', impl.footerAuthor?.color, REF.footerAuthor.color)
check('footer text width', impl.footerText?.w, REF.footerText.w, 2)
check('footer text size', impl.footerText?.fs, REF.footerText.fs)

check('nav link size', impl.navLink?.fs, REF.navLink.fs)
check('nav link colour', impl.navLink?.color, REF.navLink.color)

check('hero name size', impl.heroTitle?.fs, REF.heroTitle.fs)
check('hero card width', impl.heroDesc?.w, REF.heroDesc.w, 2)
check('hero card size', impl.heroDesc?.fs, REF.heroDesc.fs)
check('hero card weight', impl.heroDesc?.fw, REF.heroDesc.fw)
check('hero card line-height', impl.heroDesc?.lh, REF.heroDesc.lh)

// Report
const w = (s, n) => String(s ?? '').padEnd(n)
console.log('\n  ' + w('PROPERTY', 34) + w('IMPL', 24) + w('REFERENCE', 24) + w('Δ', 12) + 'RESULT')
console.log('  ' + '-'.repeat(104))
for (const r of rows) {
  console.log(
    '  ' +
      w(r.label, 34) +
      w(r.actual, 24) +
      w(r.expected, 24) +
      w(r.delta ?? '', 12) +
      (r.ok ? 'ok' : 'MISMATCH')
  )
}
console.log(`\n  ${pass} matched, ${fail} mismatched, ${rows.length} checks total\n`)
