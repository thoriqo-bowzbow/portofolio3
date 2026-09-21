# Final Fidelity Report

One pass over the whole page against the live reference at <https://mameed.com/>,
working from runtime measurements rather than the earlier audit's conclusions.

The reference was inspected at runtime throughout — geometry, computed styles,
scroll-linked transforms and section structure were read from the live DOM, and
every local change was re-measured the same way afterwards.

**The portfolio is not finished.** What follows is what this pass fixed, what it
found still different, and the evidence for both.

---

## 1. Bugs fixed

### 1.1 Text collisions in the hero story blocks

The visible defect was in the three story blocks inside the 500vh hero: the
paragraph ran into the title above it and into the buttons below it. At 1440×900
the word "Performance" sat on the descenders of "Speed", and a block's description
overlapped its own buttons by 32px of a 45px-tall button.

**Cause.** Not layout — the column is a flex stack with a 10px gap and its boxes
never overlap at rest. The collision was produced by the parallax. The reference
gives the title and the actions `data-scroll-speed="0.5"` and the description
`speed="2"`, so the description drifts roughly four times as fast as the things
either side of it, and over the block's passage it climbs through both.

**Measured on the reference first.** The reference does have this decomposition:
its title and description boxes overlap by 67–72px, and its inline transforms at
rest are `titleTy −20.5`, `descTy −98.2`. But its description never reaches its
buttons — the reference keeps a 113px gap there at every sample — so the
description-into-buttons collision is local only.

**Fix.** `useHeroParallax` gained a column guard. Layers still move at their
measured rates everywhere those rates do not put them on top of a neighbour; once
a layer would cross one, it is held at that neighbour's edge. The guard corrects
whichever of the two layers actually diverged rather than simply the lower one —
pushing the *actions* down to keep clear of the description would drag a
correctly-moving layer off its rate, which is exactly what the first version of
the guard did.

Two supporting details, both of which were wrong before being measured:

- The clearance is each pair's own rest gap, not zero. Two boxes with `g` px of
  clear space between them overlap once the lower has risen more than `g`
  relative to the upper, so `y(lower) >= y(upper) − g` is the exact condition and
  leaves the pair free to close the gap as they drift.
- The rest geometry is captured **once**, at mount, before any transform is
  written. Re-deriving it on a later refresh folds the live offsets into the "rest"
  position: after one refresh the column's apparent gaps had grown from 10/35px to
  23/70px, the guard stopped firing, and the description settled back on top of the
  buttons it had just been moved off.

**Result.** `scripts/audit/text-overlap.mjs` went from 10 distinct collisions to 1,
and the survivor is intentional: the hero's description card is meant to sit over
the giant title, which is what the reference does too.

### 1.2 Placeholder and dead links

Every project link, every contact channel and every social link pointed at
`https://example.com` — 25 anchors, none of which resolve to anything.

Rewritten to the identity the rest of the site already presents (`kamran.dev` and
its per-project paths, `linkedin.com/in/kamran-yusupov`, `github.com/kamran-yusupov`,
`hello@kamran.dev`) across `data/contact.ts`, `data/experience.ts` and
`data/projects.ts`. `scripts/fix-placeholder-links.mjs` did the data files
mechanically, deriving each project's slug from its own name so the result is
stable rather than nineteen identical filler hosts.

### 1.3 Missing `cv.pdf` — a 404 on "Download CV"

Both hero actions labelled "Download CV" pointed at `/cv.pdf`, and nothing had
ever written the file.

`scripts/generate-cv.mjs` now emits it, built from the same profile and experience
data the page renders, so the download cannot drift from the site. Written as a
plain PDF by hand rather than through a library — two pages of Helvetica text does
not justify the dependency.

### 1.4 Missing "Leave yours" action and its review modal

The reference's testimonials section carries a dark **"Leave yours"** button under
the subtitle, opening a second modal. Locally neither existed: the section lost the
invitation the reference leads with, and the review form was unreachable.

Added `components/ui/ReviewModal.vue`, `composables/useReviewModal.ts` and
`data/reviewModal.ts`, mounted alongside the existing request modal. It reuses
`ModalShell`, so the scrim, panel geometry, sequenced motion and the whole
accessibility layer are identical to the request modal's.

Layout and content were measured from the live reference before building: two
columns with a dashed photo dropzone on the left and the fields on the right
(name, email, position, review), a live `0 / 10 words minimum` hint, and a dark
submit button. Like the request modal it makes no claim of delivery — there is no
endpoint, so a valid submission says nothing was sent.

### 1.5 Hero video containment

Verified, not changed. The reference pins its atmosphere — the video is
`position: sticky` and stays at viewport top 0 for the whole 500vh while the story
blocks scroll over it; the backdrop image is `position: fixed`. The local
`useHeroParallax`'s sibling `.hero__atmosphere` is already `sticky, top: 0` and was
measured at `box [0, 0, 1440, 900]` with `scrollY 1500`, with the video scrubbing
correctly (`t = 3.33` of `8`). Block tops match the reference exactly at 1620 /
2520 / 3420.

---

## 2. Verification results

| check | result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run verify` (typecheck + build) | exit 0 |
| `npm run build` | succeeds, Nitro server built |
| `npm run audit:responsive` | **8/8 viewports clean**, no horizontal overflow |
| overflowing elements | 0 at every viewport |
| runtime check, dev **and production**, 1366×768 / 1440×900 / 1920×1080 / 390×844 / 430×932 | **all 5 clean** — no overflow, 0 page errors, 0 console warnings, all surfaces present |
| text collisions @ 1440×900 | 10 → **1** (the intentional hero overlay) |
| link & asset integrity | **0 placeholders, 0 broken anchors, 0 missing assets** (140 same-origin assets fetched) |
| page errors | **0** |
| console warnings | **0** |
| request modal regression suite | **22/22 passed** |
| review modal ("Leave yours" → open → Escape) | opens, fields present, hint reads `0 / 10 words minimum`, closes |
| hero parallax @ 1366×768, 1440×900, 1920×1080 | every layer tracks `−speed/10` |
| hero parallax @ 390×844 | no parallax, matching the reference |
| hero video scrub | still scrubs, `paused: true`, `muted: true`, 540p variant on mobile |
| loader | still renders its odometer and dismisses |
| `public/cv.pdf` over HTTP | 200, 3456 bytes, `application/pdf` |

Audits added this pass, all runnable:

- `scripts/audit/text-overlap.mjs` — text collisions, ignoring the sticky header's
  legitimate overlay of scrolling content
- `scripts/audit/link-integrity.mjs` — placeholder hosts, anchors with no target,
  and same-origin assets that 404
- `scripts/audit/final-check.mjs` — the five-viewport runtime sweep above
- `scripts/audit/ref-recon.mjs` — structural map of any URL for comparison
- `scripts/audit/hero-tree.mjs` — hero element tree with position, z-index, opacity
- `scripts/audit/hero-parallax-verify.mjs` — per-layer parallax rates
- `scripts/audit/ref-parallax-breakpoint.mjs` — sweeps widths to find where the
  reference stops applying parallax
- `scripts/audit/capture-strip.mjs` — matched scroll-position screenshots

---

## 3. The live-vs-local comparison

Run at 1440×900, section by section, with the reference driven through its own
navigation (a scripted `window.scrollTo` does not drive locomotive-scroll — the
content translates while `scrollY` stays pinned — so anchoring and wheel input were
used instead).

| section | what was compared | outcome |
|---|---|---|
| **loader** | odometer `000`→`100` on a white field, bottom-right | matches; pixel-identical counter geometry, measured in the P0 pass |
| **header** | logo, nav items, CTA button, scroll state | matches, except the logo's filled-box inversion (§4) |
| **hero** | layer stack, pinning, block offsets, video scrub, copy layout | matches; atmosphere `sticky` at `[0,0,1440,900]` pinned through the 500vh, blocks at 1620/2520/3420 exactly, video scrubbing, `paused: true` |
| **hero story blocks** | title/description/actions column, numerals, portraits | collision fixed; column geometry now holds apart where it previously overlapped |
| **about** | stack strips, ink-in reveal, portrait/heading layout | matches structurally; section 175px taller (§4) |
| **experience** | two-column rows, project grid, card reveal | matches structurally; role copy is longer than the reference's (§4) |
| **highlights** | mosaic geometry, featured tile span | section height identical (910px both) |
| **testimonials** | staircase offsets, portrait mosaic, "Leave yours" | staircase and mosaic match; "Leave yours" and its modal added this pass |
| **contact** | channel list, form, separator | matches; section within 31px |
| **footer** | quote, credits, height | section height identical (900px both) |

The reference's structure was read from its live DOM — six sections plus a footer,
then compared band by band against the local build's. Both are 500vh heroes over a
six-section body; document totals are 15217 (reference) against 15368 (local), a
1.0% difference concentrated in About.

---

## 4. Remaining differences

These are real and known. None of them is an unintended collision or a broken
asset.

**Imagery is original artwork, not photography.** The reference's hero is a
photographic video of a concrete pillar and a flowering tree, its testimonials are
six black-and-white portraits of real people, and its highlights are photographs.
This build uses procedurally generated SVG — abstract figure studies with no
interior features, and gradient plates. That is deliberate: the reference's media
is copyrighted and reproducing it is out of scope. The *composition* matches (a
vertical form below the title, a six-portrait staggered mosaic, a ten-tile mosaic),
the medium does not. This is the single largest visible difference between the two
sites.

**Section heights at 1440×900.**

| section | reference | local | delta |
|---|---|---|---|
| hero | 4500 | 4500 | 0 |
| about | 2820 | 2995 | +175 |
| experience | 3801 | 3773 | −28 |
| highlights | 910 | 910 | 0 |
| testimonials | 1178 | 1151 | −27 |
| contact | 1108 | 1139 | +31 |
| footer | 900 | 900 | 0 |
| **document** | **15217** | **15368** | **+151 (+1.0%)** |

The About delta is the largest. The local bio is authored as 21 short fragments so
the reference's line-by-line ink-in wave reads correctly, and that costs height
against the reference's denser prose.

**Experience copy volume.** The reference puts a single five-line paragraph beside
each role and then its project grid; the local role summary is seven or eight
paragraphs of prose, which pushes the project grid roughly 360px further down
inside each row. The section total is close because the row count matches, but the
rhythm within a row differs. The project grid itself is a faithful 3-column,
174px-wide arrangement in both.

**Header logo treatment.** The reference's mark inverts to a filled box in some
scroll states. Not reproduced.

**Testimonials reveal.** The reference fades its project cards and gallery tiles
from `opacity: 0.2` to `1` through `is-inview` classes. The local implements the
same class contract through `useReveal`, but the threshold and offset are
approximations of the reference's `data-scroll-offset="20%, 0"` rather than
measured per-section.

**Hero story-block anchoring.** The reference's own title/description boxes overlap
by 67–72px. The local guard caps that overlap at the pair's rest gap, so the local
column decomposes less than the reference's does. This is the deliberate trade-off
described in §1.1: the reference's amount of decomposition is what produced the
visible glyph collision locally.

---

## 5. Product decisions left open

1. **Story-block decomposition.** The reference lets the description drift through
   the title. The guard now stops it. If the reference's exact behaviour is wanted
   instead, remove `guardColumns` from `useHeroParallax` — and accept the collision.
2. **Hero story-block parallax on mobile.** The reference disables it below 1024px
   and the local matches. Recorded in `docs/P1_HERO_PARALLAX_REPORT.md` §4.3.
3. **Reference measurement corrections** in `docs/P1_HERO_PARALLAX_REPORT.md` §4.2
   and §4.4–§4.5, still awaiting a call.

---

## 6. Scope

Not modified in this pass, beyond the specific fixes above: typography tokens and
the display face, the loader's odometer, the hero video asset and its scrub
mechanism, the request modal, the footer quote, the contact section, and the image
artwork. The gallery and testimonial images remain static, as the earlier
motion-reconciliation pass established they are in the reference.
