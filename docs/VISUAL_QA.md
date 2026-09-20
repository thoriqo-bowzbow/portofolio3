# Visual QA

Implementation compared against the live reference at `https://mameed.com/`,
inspected 2026-09-20. Reference measurements and their provenance are in
[`MAMEED_RECON.md`](MAMEED_RECON.md); the mapping between the two codebases is in
[`MAMEED_COMPONENT_MAP.md`](MAMEED_COMPONENT_MAP.md).

## Method

Three complementary checks, because no single one is sufficient:

1. **Geometry diff** — `npm run compare` measures ~50 properties on the running
   implementation and diffs them against the values recorded during
   reconnaissance at 1440×900. This catches structural drift in the design
   system (container, grid, type scale, component dimensions).
2. **Responsive audit** — `npm run audit:responsive` drives headless Chrome
   through 8 viewports, asserting there is no horizontal overflow, no element
   escaping the viewport, and that the fluid type tokens resolve to the
   reference's values at every breakpoint.
3. **Screenshot review** — full-resolution captures of every section at 1440×900
   and 390×844, reviewed side by side with the equivalent reference captures.

Screenshots are produced with `node scripts/capture.mjs <session> <w> <h>
<prefix> <outDir>` (see the script header for arguments).

## Geometry diff — 47 / 49 checks match

```
doc.scrollHeight                  15314     15217      +97     (content volume)
section hero height               4500      4500        0      ok
section about height              2965      2820      +145     ok
section experience height         3759      3801       -42     ok
section highlights height         910       910         0      ok
section testimonials height       1151      1178       -27     ok
section contact height            1129.02   1108      +21.02   ok
section footer height             900       900         0      ok
container width / offset          992 / 224 992 / 224   0      ok
about grid columns                288.594px 623.406px   —      ok
about grid gap                    50px      50px        —      ok
section title size / weight       36px/400  36px/400    —      ok
body copy  size/weight/lh/margin  15px/500/27px         —      ok
stack box padding                 70px      70px        —      ok
stack title size                  26px      26px        —      ok
stack tile                        65×65     65×65       0      ok
experience row width / margin     962 / 0 0 100px       —      ok
experience org / dates            22px / 26px/300       —      ok
experience dates colour           rgba(37,35,36,.5)     —      ok
projects gap / margin             50px / 40 0 150px     —      ok
gallery gap                       10px      10px        —      ok
gallery tile (regular)            148.34×170 148.34×170 0      ok
testimonial card height           300       300         0      ok
contact card padding / width      30px / 301.7          —      ok
contact form width                400       400         0      ok
footer quote  size / weight       36px / 700            —      ok
footer author size / colour       20px / rgba(...,.4)   —      ok
footer blurb width / size         600 / 18px            —      ok
nav link size / colour            14px / #fff           —      ok
hero name size                    212px     212px       —      ok
hero card  650 / 14 / 500 / 25.2  650px     650px       0      ok
```

Two checks do not match, both explained under *Known deviations* below.

## Responsive audit — 8 / 8 viewports clean

| Viewport | `--ttitle` | container | split | overflow | offending elements |
|---|---|---|---|---|---|
| 375×812 | 32px ✓ | full-bleed | flex column | none | 0 |
| 390×844 | 32px ✓ | full-bleed | flex column | none | 0 |
| 430×932 | 32px ✓ | full-bleed | flex column | none | 0 |
| 768×1024 | 32px ✓ | 576px | flex column | none | 0 |
| 820×1180 | 26px ✓ | 768px | 20% / auto | none | 0 |
| 1366×768 | 36px ✓ | 992px | 30% / auto | none | 0 |
| 1440×900 | 36px ✓ | 992px | 30% / auto | none | 0 |
| 1920×1080 | 56px ✓ | 1440px | 30% / auto | none | 0 |

The non-monotonic step in the reference's type scale (`--ttitle` **rises** from
26px to 32px at the 768px breakpoint, and `--desctext` becomes `4.16667vw`) is
reproduced exactly at all eight widths.

## Section-by-section findings

Findings are ordered by the priority agreed for this QA pass: structure first,
then typography, spacing, imagery, motion, responsive behaviour and
micro-interactions.

### 1. Header — matches

Three-column bar (20% / flex / 20%) at 100px tall inside a zero-height wrapper;
80×80 stacked wordmark; centred nav; CTA right-aligned. Verified at 1440×900.

Scroll behaviour reproduces the reference exactly, verified on both:

| | Reference | Implementation |
|---|---|---|
| wrapper at `scrollY > 100` | `position: fixed` | `position: fixed` |
| bar | `translateY(-100%)`, rect `y −100…0` | `translateY(-100%)`, rect `y −100…0` |
| side rails at `scrollY > 300` | `opacity: 0` | `opacity: 0` |
| black mark | appears, 90×90 at `675,0` | appears, 90×90 at `675,0` |

**Mismatch found and fixed.** The entrance animation `headerAppear` was initially
applied to the bar with `animation-fill-mode: forwards`. A filled animation
outranks ordinary declarations, so the animated `transform` silently overrode
`translateY(-100%)` and the header never left the screen. The entrance now lives
on the wrapper and the scroll transform on the bar. This also illuminated the
reference's own behaviour, which was re-verified live rather than inferred.

### 2. Hero — matches, with one correction

The reference's hero is a 500vh narrative in which the atmosphere is **pinned**
for the whole section while three story blocks scroll past at 180 / 280 / 380vh.

**Mismatch found and fixed.** The first implementation put the backdrop in a
100vh absolutely-positioned holder, so it scrolled away after the first viewport
and the story blocks landed on the bare page background — white text on
`#fafafa`. The backdrop is now a `position: sticky` layer spanning the full
500vh, so the blocks always sit over imagery as they do in the reference.

Layer order within the first viewport is also faithful, and this was the subtlest
detail in the whole build: **the name sits between two background layers**, with
a transparent foreground cut-out above it, so the sculptural form crosses over
the letters. Verified by hiding each layer in turn on the live reference.

| Level | Reference | Implementation |
|---|---|---|
| atmosphere | sticky video | sticky SVG backdrop |
| name | `absolute`, z1 | `absolute`, z1 |
| foreground | cut-out with alpha, z2 | cut-out with alpha, z2 |
| intro card | `absolute`, z3 | `absolute`, z3 |

Type and geometry: name 212px ✓, intro card 650px / 14px / 500 / 180% ✓,
`margin-top: -100px` ✓ and `350px` ✓, blocks at `180vh / 280vh / 380vh` ✓,
block title 46px ✓, numeral 242px at `opacity: .3` ✓.

**Deviation (asset).** The reference's atmosphere is a scroll-scrubbed 2K video.
This build uses a static SVG backdrop. Reversing that would mean shipping a video
asset, which is out of scope for an original-assets build.

**Deviation (art).** The reference's backdrop is a photograph. This one is a
generated gradient-and-haze composition. It was iterated three times:

1. Hard ridgelines — read as decoration rather than atmosphere and fought the
   type. Replaced with soft strata.
2. **Light mid-band** — the story blocks landed on a pale area and white type
   measured poorly. A local scrim was tried but its bounding box produced a
   visible rectangular edge, so it was removed; instead the sky gradient was
   deepened and given an *even* scrim across every band, because a story block
   can land anywhere in the viewport and a dip in the middle of the gradient
   would leave a light band exactly where a heading falls.
3. Verified by measurement rather than eye: `scripts/backdrop-contrast.js`
   rasterises the backdrop and samples it on a 1276-point grid. Minimum contrast
   against white is **6.17:1**, mean 10.11:1, with zero samples below 4.5:1.

A text-shadow was also applied during this pass and then removed — with the
backdrop corrected it was unnecessary, and its presence caused axe-core to report
"insufficient contrast between the foreground and shadow colour", which is noise
rather than signal.

### 3. About — matches

Shared 30% / auto grid at 50px gap, 100px section padding, 70px stack boxes,
65px tiles at 15px gap, logo strips at 60px with `grayscale(1) opacity(.4)`
lifting on reveal.

The body copy reproduces the reference's **per-line ink-in**: copy is authored as
short fragments, each its own `<p>`, rendered with no margin so it reads as
continuous prose while inking in one line at a time. Verified live at
`scrollY 4560`: 15 of 24 fragments revealed, the in-view ones at
`rgb(37, 35, 36)` and the off-screen ones still at `rgba(37, 35, 36, 0.2)`.

**Deviation (content volume).** About is `+145px` (+5.1%) taller than the
reference. The cause is purely text volume — the reference carries ~19–23 lines
of bio, this build carries ~29. Every *structural* property inside the section
matches exactly (grid, gaps, padding, tile size, strip treatment). Two rounds of
trimming already closed a `+388px` gap to `+145px`; further reduction would mean
deleting content purely to hit a pixel target, which is the wrong trade.

**Deviation (asset).** Logo strips use original generated monograms rather than
real product marks.

### 4. Experience — matches

Three rows spanning both grid columns, each re-establishing the 30% / auto split
internally, separated by a `1px rgba(37,35,36,.2)` hairline with `margin: 0 0
100px`. Row width 962px ✓, margin ✓, org 22px ✓, context 14px/300/`$ink-50` ✓,
dates 26px/300 ✓, `--desctext` ink-in ✓, project grid `repeat(3,1fr)` at 50px
with `margin: 40px 0 150px` ✓, logo box 120×50 with `object-position: bottom left`
✓, and the 18×18 arrow that rotates 45° on hover ✓.

### 5. Highlights — matches

4-column mosaic, `grid-auto-rows: 170px`, 10px gap, tiles 1 and 7 spanning 2×2 —
measured `148.34×170` regular and `306.7×350` featured, identical to the
reference. Images sit in a `160%` / `-30%` parallax reservoir. Hover runs the
three-stage frosted takeover with the text cascade at 0.5 / 0.8 / 1.4s; on
≤768px the overlay is removed entirely, as in the reference.

**Mismatch found and fixed.** The first tile compositions were laid out across
the full canvas, so the parallax crop — which only guarantees the middle ~62%
band — sliced them into unreadable fragments. Compositions were re-drawn to keep
their subject inside a central safe band with quiet outer bands.

**Deviation (asset).** The reference shows project screenshots; this build shows
generated abstract product compositions.

### 6. Testimonials — matches

The staircase is the most distinctive layout in the reference and is reproduced
with the same paired positive/negative margins (`100/-100`, `200/-200` on
`nth-child(3n+2)` / `nth-child(3n+3)`), so columns step down without adding
height. At ≤992px it re-flows to two columns with a 50px offset on every second
card. Cards 300px at 1440 ✓, `130%` / `-15%` image reservoir ✓, greyscale, and
the hover cascade at 0.2 / 0.5 / 0.8s ✓.

**Deviation (asset) — iterated twice.** Testimonial portraits were the weakest
element in the first pass. Version one drew literal faces and read as cartoon
avatars, which cheapened the section. Version two moved to tonal figure studies
but still read as generic avatars. Version three treats them as **rim-lit studio
silhouettes** — near-black figure, one strong edge light, grainy ground. That
reads as art direction rather than illustration, and it survives the greyscale
filter the reference applies. This is a deliberate art-direction decision, made
because a literal face cannot be faked convincingly with original vector art.

### 7. Contact — matches

Channel cards in a 2-column grid (`repeat(2,1fr)` below 1540, as in the
reference) at 30px padding and 35px icons held at `opacity: .5`; card 301.7px
wide ✓ with `grayscale(1) → revert` on hover. The `or` separator at 26px with
100px flanking hairlines, and a 400px form with floating-label fields at 55px
tall and `border: 1px solid rgba(37,35,36,.2)`.

**Deviation (functional).** The reference posts to a backend that is not part of
this repository. The form here validates fully client-side and then reports that
no endpoint is configured, rather than appearing to send and silently discarding
the message. `submit()` in `ContactForm.vue` is the single integration point.

### 8. Footer — matches

100vh white panel; 600px blurb pinned to the top via `margin: 0 0 auto`; a 900px
quote absolutely centred at 54px/700 in the display face, attributed with two
100px hairlines at `margin: 0 20px`; and a space-between 12px credits row at
`padding: 0 30px`. At ≤1540 the quote steps to 800px / 36px with `margin-top:
-50px`; at ≤768 the panel stops being 100vh, becomes `min-height: 40vh` with
`gap: 80px`, un-absolutes the quote, shrinks the rules to 40px and switches the
credits to `column-reverse`.

## Motion verification

| Behaviour | Status |
|---|---|
| Character scramble on every heading + nav link | Verified — triggers on scroll-enter **and** hover; alphabet, per-length tick interval, `1/3` advance and frozen `+5px` width all match the reference source |
| Body copy ink-in (`$ink-20 → $ink`) | Verified live, per fragment |
| Desaturate → colour reveal (tiles, cards, logos, strips) | Verified |
| Gallery / testimonial hover cascades with staggered delays | Verified |
| Hero name entrance after the loader clears | Verified |
| Loader curtain (5 columns, staggered durations) | Verified |
| Sticky-layered 500vh hero | Verified |
| Eased anchor travel (3000ms budget, scaled by distance) | Verified |
| Reduced-motion path | Verified — smoothing skipped, reveals resolve immediately, no parallax |
| `prefers-reduced-motion` | **Deviation** — the reference has none; this build adds it |

## Known deviations

### Resolved during this pass

1. **Header never hid on scroll** — a filled entrance animation overrode the
   scroll transform. Fixed by moving the entrance to the wrapper.
2. **Hero backdrop scrolled away** — story blocks landed on bare background with
   unreadable white type. Fixed with a sticky full-length atmosphere layer.
3. **Mobile mark never appeared on desktop** — the `is-scrolled` class binding was
   missing.
4. **Gallery crops unreadable** — compositions re-drawn for the parallax safe band.
5. **Stack monograms illegible** — the two-bar form left the glyph nowhere to sit;
   replaced with interior-bearing shapes, and hues redistributed on a golden-angle
   walk.
6. **Testimonial portraits read as avatars** — reworked twice, landing on rim-lit
   silhouettes.
7. **Install-time Sass failure** — `@use` cannot target `.css`; font CSS moved to
   Vite's CSS pipeline, and partials made self-sufficient for tokens and mixins
   via `loadPaths`.
8. **Hero type contrast** — the backdrop's mid-band was too light for white type.
   Deepened and given an even scrim; verified at 6.17:1 minimum by measurement.
9. **Accessibility** — added the missing `<title>` and `h1`, made the side rails a
   landmark, and raised the dormant ink-in tone from the reference's `0.2` (1.49:1)
   to `0.32` (1.95:1).

### Open, and deliberate

| # | Deviation | Why it stands |
|---|---|---|
| 1 | **Body copy colour reads `rgba(37,35,36,.2)` in the geometry diff** | Not a defect. The diff is measured at `scrollY 0`, where About is correctly dormant. Verified live that in-view fragments resolve to `rgb(37,35,36)`. |
| 2 | **Document height `+97px` (+0.6%)** | Composition of the About content-volume difference below. |
| 3 | **About `+145px` (+5.1%)** | Text volume: ~29 lines of bio vs the reference's ~19–23. Every structural property matches. Trimming further would degrade the content to hit a pixel target. |
| 4 | **Dormant body copy measures 1.95:1** | The ink-in effect *is* the reference's signature; removing it would defeat the project. Mitigated four ways: the tone was raised from 0.2, the reveal now fires at the viewport edge so the transition completes before the text is readable, reduced-motion reveals immediately, and `prefers-contrast: more` disables the effect entirely. See `PRODUCTION_AUDIT.md` §4. |
| 5 | **Lenis instead of locomotive-scroll 4** | locomotive v4 is unmaintained and its transform-scroll breaks native `position: sticky`, `scrollTo`, IntersectionObserver and browser scrollbars. Lenis preserves the observed feel (`lerp 0.09`, smoothing off below 768px). |
| 6 | **GSAP + ScrollTrigger instead of a bespoke rAF loop** | Requested stack; gives correct pinning, refresh and teardown. |
| 7 | **`prefers-reduced-motion` support added** | The reference has none. Required for a production build. |
| 8 | **Visible `:focus-visible` ring added** | The reference sets `outline: none` globally, which is an accessibility failure. The ring is suppressed for pointer interaction so the visual result is unchanged. |
| 9 | **Two palette tones nudged for AA** | `$c-ink-60` on `#fafafa` measures 4.15:1, just under the 4.5:1 threshold for normal text; subtitles use a one-step-darker `$c-ink-60-readable` (5.2:1). The original tone is retained wherever it already passes. |
| 10 | **Display typeface is an open-licensed substitute** | SK Zweig is a commercial retail licence and cannot be redistributed. The display/body split, weights (400 for headings, 700 for the footer quote, 500 for the contact title) and hierarchy are preserved. Letterform width differs slightly; sizes were matched to the reference rather than tuned per-glyph. |
| 11 | **Original content, imagery and marks** | Required by the brief — no reference copy, photography, logos or illustrations are reproduced. |
| 12 | **Odometer component not ported** | Its use on the reference's home route could not be confirmed (RECON §12.4). Porting it would be inventing motion, which the brief forbids. |
| 13 | **Hero atmosphere is static, not a scroll-scrubbed video** | Would require shipping a video asset. |
| 14 | **Parallax amplitude derived from geometry, not copied** | The reference's `data-scroll-speed` values were not extractable (RECON §12.3). Amplitude is instead computed from the reservoir each image is given — ±30% of frame height for the gallery's `160%/-30%`, ±15% for the testimonial `130%/-15%` — which is the largest travel that guarantees no edge is exposed. |
| 15 | **Form has no backend** | The reference posts to a service that is not part of this repository. The form validates fully client-side and reports that no endpoint is configured rather than appearing to send and discarding the message. |

### Documented UNKNOWNs

Carried forward from `MAMEED_RECON.md` §12, unresolved and not guessed at:
the body of `@keyframes headerAppear` (a defined equivalent is used and
documented in `_motion.scss`); the reference's home-route component sources; its
per-element scroll-call offsets and parallax speeds; and whether its odometer
component is used on the home route.

## Verification commands

```bash
npm run verify              # typecheck + production build, both clean
npm run audit:responsive    # 8 viewports, asserts no overflow
npm run compare             # geometry diff against the reference
```
