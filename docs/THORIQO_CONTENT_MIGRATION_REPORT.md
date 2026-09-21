# Thoriqo Content Migration Report

Replacing the demo identity with the supplied CV for **Thoriqo Salafu Sholihin**,
without touching the Mameed-derived visual and interaction system.

**The visual clone is not claimed as complete.** The design system survived the
migration intact — every motion, reveal, loader and modal check still passes — but
two sections now render with genuinely empty content because the CV lists no
projects and no testimonials. That is a content gap, not a layout regression, and
it is documented in §5.

---

## 1. What was migrated

### Identity

| field | value | source |
|---|---|---|
| `displayName` | Thoriqo | short form of the CV name; matches the CV's own handles |
| `fullName` | Thoriqo Salafu Sholihin | CV |
| `role` | IT Support Specialist & Network Engineer | CV |
| `location` | **Jakarta, Indonesia** | see §5 — the CV gives two different regencies |
| `positioning` | IT Support Specialist & Network Engineer | CV role line |

### Experience — `data/experience.ts`

Three roles, in the CV's order, with the CV's employers, titles and dates:

| title | employer | dates |
|---|---|---|
| IT Support | PT. Wahana Harta Nusantara | April — September 2026 |
| Network Engineer & Technical Lead | Venous Group | June 2024 — December 2025 |
| Admin Operasional | CV. Kahe Group | October 2023 — June 2024 |

The CV gives **no description of the work performed** for any role, so each
`summary` carries an explicit TODO rather than invented responsibilities.

### Education — `data/education.ts` (new)

One entry: SMA Negeri 1 Anjatan, IPS, July 2020 — May 2023, Ujian Sekolah
89.14/100. Rendered inside the existing Experience timeline through the same
`ExperienceRow`, marked with a small `EDUCATION` tag. No new section, no layout
change — the reference has no education band and adding one would have been a
redesign.

### Skills — `data/stack.ts` + `scripts/generate-assets.mjs`

All 18 CV skills, split across the section's existing three boxes. Nothing added,
nothing dropped:

- **Networking** (12) — TCP/IP, LAN/WLAN, subnetting, routing, switching, MikroTik, Ruijie Reyee, UTP, fibre optic, fusion splicer, OTDR, OPM
- **Systems & tooling** (12) — Git, CI/CD, Docker, Linux, Windows 10/11, macOS, Python, AI/API integration, agentic AI, MCP, local server administration, backup/recovery
- **Support & hardware** (7) — helpdesk, IT asset management, PC repair, laptop assembly, network printer, barcode scanner, CCTV/NVR/DVR

The group titles were renamed from the reference's ("My professional stack",
"Had an experience with", "Loved using") because "Loved using" above CCTV/NVR/DVR
reads as nonsense. The three-box layout is unchanged.

The stack marks are generated monograms, so the icon catalogue was regenerated
from the new list — `stack-icons.json` and the SVGs on disk cannot drift. 50
marks became 31.

### Hero story blocks — `data/hero.ts`

The CV has no narrative prose, so each of the three blocks is built from one area
of the CV's own skill list — Support, Networks, Infrastructure. No project,
employer or result is claimed.

### Contact — `data/contact.ts`

Phone `+62 851-1102-0740`, email `thoriqosalafusholihin@gmail.com`, LinkedIn
`in/thoriqo`, GitHub `github.com/thoriqo-bowzbow` — all from the CV.

### CV download

`public/cv.pdf` regenerated from the new data (2,763 bytes, one page). Verified
present and correct: every migrated fact appears in the document and no demo
identity remains.

---

## 2. Demo identity removed

Every occurrence of the demo identity was removed from data, components,
metadata and generated assets. Verified by grep: **no matches** for `Kamran`,
`Yusupov`, `kamran.dev`, `Northline`, `Cobalt Labs`, `Atlas Booking` or any of the
other invented product names, across `data/`, `components/`, `composables/`,
`layouts/`, `pages/`, `app.config.ts` and `nuxt.config.ts`.

Specifically:

- **Metadata** — `<title>`, `description`, `og:title`, `og:description` and
  `app.config.seo` all rewritten for the real identity
- **Contact URLs** — the fake `kamran.dev`, `linkedin.com/in/kamran-yusupov` and
  `github.com/kamran-yusupov` are gone
- **Generated assets** — the nine invented product wordmarks (Atlas Booking,
  Ledger, Waypoint, Console, Beacon, Relay, Harbour Goods, Kestrel, Fieldnote)
  were removed from the generator along with `public/images/project-marks/`; the
  invented names no longer live in the repository
- **Copy** — the Highlights subtitle ("booking platforms to internal consoles"),
  the Testimonials subtitle ("Feedback from the teams and clients I have worked
  alongside") and `testimonialsIntro` all described demo content and were rewritten
- **Footer quote** — the attribution now reads as a quotation from its author
  rather than being framed as Thoriqo's own line. See §5.

---

## 3. Sections left without fabricated content

Per the instruction, these use explicit empty states rather than invented content:

| section | state | what renders |
|---|---|---|
| **Selected work** (`#projects`) | `highlights: []` | heading, subtitle, and "No case studies published yet." |
| **Testimonials** (`#reviews`) | `testimonials: []` | heading, subtitle, "Leave yours" button, the review modal, and a line stating no reviews are published |
| **Role projects** | `projects: []` per role | the project grid is not rendered at all; the row keeps its org, dates and TODO line |

Every section is still present. Nothing was deleted to make the page look
finished: the Highlights mosaic, the Testimonials staircase, the project grid and
their reveal animations are all still in the markup, waiting for real entries.
Each data module documents how to fill it.

The Testimonials section deliberately keeps its **"Leave yours"** action and the
review modal, so the empty section is a working invitation rather than a hole.

---

## 4. Links verified

`scripts/audit/link-integrity.mjs` against both the dev server and the production
build:

```
PLACEHOLDER LINKS: 0
BROKEN ANCHORS:    0
MISSING ASSETS:    0
RESULT: every link and asset resolves
```

Every external URL is one the CV states. Two were **removed** rather than
re-pointed, because the CV supports neither: the "Writing" contact channel
(`kamran.dev/notes`) and the "Photography" social. The side rail therefore carries
three socials instead of the reference's four.

---

## 5. Content gaps and decisions needing your input

1. **Location — the CV contradicts itself.** Its header says **Jakarta Barat**;
   its professional summary says **Jakarta Timur**. Neither was chosen silently.
   The site presents **"Jakarta, Indonesia"**, which is true of both and claims
   nothing about which regency is current. Say which one is right and it can be
   made specific.

2. **No role descriptions.** The CV lists titles, employers and dates but no
   duties or outcomes for any of the three roles. Each row shows a TODO line.
   Supply the descriptions and they drop straight in.

3. **No projects, no testimonials.** Covered in §3.

4. **No prose biography.** The CV has no narrative, so the About section's
   line-by-line bio is built from its facts — roles, employers, dates, education,
   languages. It reads as a factual timeline rather than a personal statement. If
   you write a few lines, they belong in `profile.bio`.

5. **The footer's pull-quote.** The CV supplies no personal quotation. The footer
   currently carries the Kent Beck line, attributed to him, with the blurb changed
   so it no longer implies the words are Thoriqo's. Replace it with something in
   his own words, or remove it.

6. **No phone country formatting given beyond the CV's own** — presented as
   `+62 851-1102-0740`.

---

## 6. Bugs found and fixed during the migration

1. **The email address was unreadable.** `ContactCard` truncates its value with
   `text-overflow: ellipsis` and `white-space: nowrap` — which the reference does
   too, and which was harmless for the demo's short values. The real address
   `thoriqosalafusholihin@gmail.com` measures 201px against a 187px box, so it
   rendered as `thoriqosalafusholihin@gma…`. Changed to wrap, which keeps the
   address readable and leaves short values on one line.

2. **Two hero buttons carried the header CTA's label.** The first draft of the new
   hero copy used "Get in touch" for two story-block actions, duplicating the
   header's primary CTA and making the first DOM match ambiguous. Renamed to
   "Contact".

3. **The Highlights and Testimonials subtitles asserted content that no longer
   existed** — "booking platforms to internal consoles", "Feedback from the teams
   and clients I have worked alongside". Both contradicted the empty state
   directly beneath them. Rewritten.

4. **Dead space where the project grid used to be.** `ExperienceRow` rendered the
   grid unconditionally, so an empty `projects` array left `margin: 40px 0 150px`
   of nothing. Now rendered only when there is something to show.

These were found by running the audit scripts against the migrated content, not by
reading the diff. The overlap, clipping and escaping probes reported nothing else.

One test-harness fragility worth recording: `modal-interaction-test.mjs` selects
the first button matching `/get in touch/i`, and at mobile widths the header's
desktop CTA collapses to zero size and cannot take focus. Run at a mobile viewport
that test reports one spurious failure; at 1366 or 1440 it is 22/22.

---

## 7. Verification

| check | result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run build` | exit 0, Nitro server built |
| `npm run verify` | exit 0 |
| `npm run audit:responsive` | **8/8 viewports clean**, 0 overflowing elements |
| typography check (`--ttitle`) | passing at all 8 viewports |
| runtime check, dev **and production**, 1366×768 / 1440×900 / 1920×1080 / 390×844 / 430×932 | **all 5 clean** — no overflow, 0 page errors, 0 console warnings, all surfaces present |
| text collisions @ 1440×900 | **1** — the intentional hero title/card overlap |
| clipped / escaping text | none |
| link integrity | **0 placeholders, 0 broken anchors, 0 missing assets** |
| request modal regression | **22/22 passed** |
| review modal ("Leave yours") | opens, fields present, closes |
| hero parallax @ 1366 / 1440 / 1920 | every layer tracks `−speed/10` |
| hero parallax @ 390×844 | no parallax, matching the reference |
| loader, video scrub, smooth scroll | unchanged and working |
| `public/cv.pdf` over HTTP | 200, 2,763 bytes, `application/pdf` |

### Section heights at 1440×900

| section | before migration | after |
|---|---|---|
| hero | 4500 | 4500 |
| about | 2995 | 1989 |
| experience | 3773 | 1354 |
| highlights | 910 | 307 |
| testimonials | 1151 | 553 |
| contact | 1139 | 1158 |
| footer | 900 | 900 |
| **document** | **15368** | **10761** |

The reductions are content volume, not layout: the CV has three roles and no
projects, where the demo had long invented role histories and ten case studies.
Every section still renders, at its full width, with its own reveal behaviour and
its place in the scroll order intact.

---

## 8. Scope

**Changed:** `data/profile.ts`, `data/experience.ts`, `data/education.ts` (new),
`data/stack.ts`, `data/hero.ts`, `data/contact.ts`, `data/projects.ts`,
`data/testimonials.ts`, `data/types.ts`, `data/stack-icons.json` (regenerated),
`app.config.ts`, `nuxt.config.ts`, `scripts/generate-assets.mjs`,
`scripts/generate-cv.mjs`, `public/cv.pdf` (regenerated),
`components/sections/HighlightsSection.vue`, `TestimonialsSection.vue`,
`ExperienceSection.vue`, `ExperienceRow.vue`, `ContactCard.vue`, and the
regenerated `public/icons/stack/`.

**Unchanged:** the layout and grid system, typography, hero video and its scrub,
the loader, both modals' motion and accessibility layer, smooth scroll, the
reveal system, the responsive breakpoints, and the section order.
