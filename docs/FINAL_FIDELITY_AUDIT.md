# Final Fidelity Audit

**Scope.** Repository-level comparison between this implementation (`portofolio3`)
and the live reference at `https://mameed.com/`. Diagnosis only — no fixes
applied, no architecture changed.

**Proof of diagnosis-only scope.** Verified by modification time:

```
IMPLEMENTATION FILES TOUCHED DURING THE AUDIT PASS:  0
AUDIT ARTEFACTS CREATED:                            12
  docs/FINAL_FIDELITY_AUDIT.md
  scripts/audit/*.js  (11 probe scripts)
```

Zero files under `components/`, `composables/`, `data/`, `assets/`, `layouts/`,
`pages/`, `public/`, `nuxt.config.ts`, `package.json` or `app.config.ts` were
modified. The only repository changes are this document and the probe scripts.

**Reference revision.** Verified unchanged from reconnaissance. Asset hashes are
byte-identical to those recorded in `MAMEED_RECON.md`:

```
/js/chunk-vendors.b8192096.js
/js/app.0ca013e2.js
/css/app.6597a6a3.css          (25 108 B)
/css/home.49753d55.css         (21 957 B, route chunk)
```

Because the stylesheets are unchanged, every CSS-derived finding in
`MAMEED_RECON.md` remains valid — hover states, transitions, breakpoints, sizes.
**Every new finding in this document comes from the JS/runtime layer**, which
reconnaissance sampled far less thoroughly than the CSS layer.

**Method.** This pass deliberately did *not* re-run the existing geometry diff as
its primary evidence. That diff checks ~50 scalar properties (widths, font-sizes,
colours) and is structurally unable to detect the classes of difference that
matter most here — font *identity*, per-glyph metrics, whether a declared motion
is *actually running*, or whether a UI surface exists at all. Instead:

| Technique | Detects |
|---|---|
| Canvas text metrics for both families | cap-height, per-glyph advance, optical size |
| `document.fonts` enumeration | actual families and weights |
| Attribute inventory (`data-scroll-speed`, `data-scroll-sticky`, `data-scroll-call`) | declared motion config |
| **Transform sampling across a scroll sweep** | whether declared motion actually runs |
| Live interaction (click, wheel) | UI surfaces and behaviours |
| Repeat page loads | non-deterministic content |

The transform sweep is what produced the most consequential findings: several
motions the reference *declares* are inert, and several it declares are ones this
implementation does not have at all.

**Probe scripts.** The one-off in-page probes used for this pass are kept under
`scripts/audit/` so the method is reproducible. Each is run against a live page
via `agent-browser eval --stdin`, targeting whichever session is pointed at the
reference or the local dev server:

| Probe | Measures |
|---|---|
| `font-metrics.js` | canvas string widths, ascent, and full alphabet advances for whatever family the page resolves to — run against both sites and diffed |
| `structure-dump.js` | top-level section tree with rects |
| `block-inventory.js` | every BEM block present, to find constructs with no local equivalent |
| `scramble-audit.js` | which elements carry `.md-hacktext`, and which display-font text does not |
| `sticky-probe.js` | computed `position` / `top` / document position of the titling columns |
| `parallax-probe.js` … `parallax-probe3.js` | `matrix3d` translateY of speed-bearing elements, plus their `data-*` registration |
| `parallax-sweep.js` | gallery/testimonial translateY across a scroll sweep |
| `hero-parallax.js` | all seven hero layer speeds and offsets in one call |
| `video-probe.js` | `currentTime`, `paused`, `duration`, `readyState` of the hero video |

The decisive technique throughout is reading `getComputedStyle(el).transform`,
parsing the `matrix3d`, and taking index 13 as translateY — then repeating across
several scroll positions. A motion that is declared but never applied returns an
identity matrix, which is how the inert findings were established.

---

## [Typography — display family identity]

**REFERENCE:**
`font-family: "SK Zweig"` — static faces, weights 400 and 700 loaded, plus a
separate `"SK Zweig Med"` w500 family that is registered but **unloaded/unused**.

**LOCAL:**
`font-family: "Playfair Display Variable", "Playfair Display", Georgia,
"Times New Roman", serif` — one variable face spanning w400–900.

**DIFFERENCE:**
Different typeface. Every letterform in every heading, card title, numeral, quote
and section heading is a different shape. This is the largest single visual
difference remaining in the project and it affects the majority of the page's
visible surface area.

**SEVERITY:** P1

**ROOT CAUSE:**
Documented and deliberate (`VISUAL_QA.md` deviation 10) — SK Zweig is a
commercial retail licence and cannot be redistributed. The substitute was chosen
for role (editorial didone, high stroke contrast) rather than for metric
compatibility, and that trade was never revisited.

**RECOMMENDED FIX:**
Two paths, in order of fidelity:
1. License SK Zweig and self-host it. This is the only way to reach visual
   identity, and the reference's own `@font-face` declarations can be mirrored
   directly (400 + 700, `font-display: swap`).
2. If licensing is out of scope, re-select the substitute on **metric**
   compatibility rather than stylistic resemblance — match cap-height/em and
   x-height/em to SK Zweig, then re-check every fixed heading size. Currently the
   substitute is ~12–16% taller at the same px, so all display sizes are
   optically too large (see next finding).

---

## [Typography — cap-height / optical size]

**REFERENCE:**
Measured with canvas `actualBoundingBoxAscent` at identical nominal sizes:

| text | size | ascent |
|---|---|---|
| `Experience` | 36px | 25 |
| `Highlights` | 100px | 70 |
| `Get in touch` | 36px | 25 |
| `Selected work` | 36px | 25 |

**LOCAL:**
Same strings, same sizes:

| text | size | ascent | Δ |
|---|---|---|---|
| `Experience` | 36px | 28 | **+3 (+12.0%)** |
| `Highlights` | 100px | 79 | **+9 (+12.9%)** |
| `Get in touch` | 36px | 29 | **+4 (+16.0%)** |
| `Selected work` | 36px | 29 | **+4 (+16.0%)** |

**DIFFERENCE:**
At the same `font-size`, Playfair Display renders cap-height ~12–16% taller than
SK Zweig. Consequence: **every heading in this implementation is optically larger
than the reference's at the same declared size** — section titles, card titles,
org names, numerals, quote text. The declared `font-size` values match the
reference exactly (which is why the geometry diff passes), but the rendered type
is bigger.

This is invisible to width-based checks because Playfair's *advance widths* are
narrower, partially cancelling the height increase in a measured line box.

**SEVERITY:** P1

**ROOT CAUSE:**
Substitute font selected without metric matching (same root cause as the previous
finding). The geometry diff verified `font-size` and `line-height` — both of which
match — so it could not surface this.

**RECOMMENDED FIX:**
Either license the original face, or apply a corrective size scale to display
roles only. A cap-height ratio of ~0.88 would bring Playfair's caps in line;
that means roughly `--ttitle: 32px` where the reference declares 36px, applied
**only** to `.section-title`, `.hero-block__info-title`, card titles and the
footer quote — not to the fluid token itself, which other roles depend on. Verify
by re-measuring ascent rather than width.

---

## [Typography — per-glyph proportions]

**REFERENCE:**
Alphabet advance widths at 100px, e.g. `J:46.2  M:81.5  W:95.3  i:29.6  m:90.4`.

**LOCAL:**
Mean divergence across the 52-glyph alphabet: **8.26%**. Worst glyph `J`:
reference 46.2 vs local 32.6 — **29.4% narrower**.

**DIFFERENCE:**
Individual letterform widths differ by ~8% on average and up to ~29% on outliers,
while whole-string widths happen to land within 0.1–3.6%. Line breaks will
therefore fall in different places on any paragraph set in the display face, and
headings with many narrow glyphs (J, I, i, l, L) render visibly tighter.

**SEVERITY:** P3

**ROOT CAUSE:**
Same substitute-font root cause. Only surfaces on strings containing narrow
glyphs; the display face is used mainly for short headings, limiting exposure.

**RECOMMENDED FIX:**
Resolved automatically by licensing the original face. If not licensing, prefer
strings short enough that wrap points rarely matter, and spot-check any heading
containing I/J/L/i/l.

---

## [Typography — font rendering and face registration]

**REFERENCE:**
7 registered faces — one file per weight per family, no unicode-range
subsetting. `Montserrat` 300/400/500/600 + `SK Zweig` 400/700 + unused
`SK Zweig Med` 500.

**LOCAL:**
24 registered faces in production (5 unicode subsets × 4 Montserrat weights + 4
Playfair subsets). In **dev mode only**, 48 font-face rules are present — the
font CSS is both linked and inlined by Vite. Production output contains exactly
24 (`entry-styles.*.mjs`), so this is a dev-server artifact, not a shipped defect.

**DIFFERENCE:**
Subsetting strategy differs (reference ships one file per weight; this build
ships unicode-range subsets). Rendered glyphs are identical within a family.
Not a visual difference.

Two genuine rendering sub-findings:

1. **Variable vs static.** This build interpolates weight across w400–900; the
   reference snaps to discrete 400/700. Only observable if a weight other than
   400/700 is ever requested — none currently are.
2. **`PT Mono` fallback.** The reference declares `font-family: PT Mono` for its
   loader digits but never loads PT Mono, so the digits render in the
   browser-default serif. This is a defect in the reference that a faithful port
   would need to reproduce deliberately (see the Loader finding).

**SEVERITY:** P3

**ROOT CAUSE:**
Subsetting and variable-font choices are consequences of using `@fontsource`;
neither changes rendered output.

**RECOMMENDED FIX:**
None required for fidelity. The dev-mode 48-face duplication could be quietened
by removing the font entries from `nuxt.config.css` and importing them from
`main.scss` instead, but there is no production impact.

---

## [Hero — layer parallax]

**REFERENCE:**
Every hero layer carries `data-scroll` + `data-scroll-speed`, and the transforms
**actually run**. Measured on `.md-block-1`, settled, across `scrollY 0 → 1620`:

| layer | speed | ty @0 | ty @1620 | rate (px/px) |
|---|---|---|---|---|
| `.md-block__count-num` | 6 | +70.99 | −145.01 | −0.1333 |
| `.md-block__count-image` | 10 | +163.31 | −196.69 | −0.2222 |
| `.md-block__info-title` | 0.5 | −0.12 | −18.12 | −0.0111 |
| `.md-block__info-desc` | 2 | +27.20 | −44.80 | −0.0444 |
| `.mdbtn` | 0.5 | +14.71 | −3.29 | −0.0111 |

Rate ÷ speed is **−0.02222 = −1/45** for all five layers, i.e.

```
translateY per px scrolled = −speed / 45
```

Additionally, `.md-interctv__title` (speed 8) and `.md-interctv__desc` (speed 2)
carry **constant** displacements of **−718.39** and **−179.60** throughout the
hero — the name and intro card do not sit at their layout position.

**LOCAL:**
`heroTitleTy: 0`, `heroCountNumTy: 0` measured at the same scroll position. No
`data-scroll-speed` equivalent exists; the hero has a one-shot GSAP entrance
(`opacity 0→1, y 60→0`) and nothing scroll-linked.

**DIFFERENCE:**
The reference hero is a **seven-layer differential drift**: numeral, portrait,
heading, body and buttons each move at a different rate as the 500vh scrolls,
and the name and card are permanently offset from layout. This implementation
reproduces the hero's *stacking order* faithfully but none of its *drift*.

Because the hero occupies 500vh — roughly a third of the document — this is the
single largest motion difference in the project.

**SEVERITY:** P1

*Borderline P0 — the composition is identical at rest, but the mechanism that
makes 500vh of scrolling worth scrolling is absent.*

**ROOT CAUSE:**
`MAMEED_RECON.md` §12.3 recorded the parallax magnitudes as UNKNOWN (the source
map did not expose them and the CSS carries none — they live in DOM attributes).
`useParallax.ts` was therefore written to *derive* amplitude from negative space
rather than read it from the reference, and was applied only to gallery and
testimonial images. No hero parallax was ever implemented.

**RECOMMENDED FIX:**
The values are now known. Add a scroll-linked tween per hero layer using
`rate = −speed / 45`:

| element | speed | rate |
|---|---|---|
| `.hero__title-text` (note: constant offset, not a rate) | 8 | fixed `−718px` while hero in view |
| `.hero__desc-text` (constant offset) | 2 | fixed `−180px` |
| `.hero-block__count-num` | 6 | −0.1333 |
| `.hero-block__count-image` | 10 | −0.2222 |
| `.hero-block__info-title` | 0.5 | −0.0111 |
| `.hero-block__info-desc` | 2 | −0.0444 |
| `.hero-block__info-actions` | 0.5 | −0.0111 |

Scope each to the hero range (`ScrollTrigger` `start: 'top top'`, `end: 'bottom
bottom'`, `scrub`), and verify by sampling `getComputedStyle().transform` matrix
index 13 across a scroll sweep — exactly as this audit did.

---

## [Hero — atmosphere asset and behaviour]

**REFERENCE:**
A real `<video>`: `https://mameed.com/media/vidos_scroll_2k.webm`,
**2560×1440**, duration **8.042s**, `position: sticky`, `object-fit: cover`,
`data-scroll-sticky`. Confirmed **scroll-scrubbed**, not autoplaying:

```
paused = true, autoplay = false, loop = false
currentTime: 0.643 → 0.965 → 1.287 → 1.608   (across successive wheel scrolls)
```

**LOCAL:**
`heroBackdrop: /images/hero-backdrop.svg` — a static generated SVG.
`document.querySelectorAll('video').length === 0`.

**DIFFERENCE:**
The hero backdrop is animated in the reference and static here. The scrub means
the atmosphere *is* the scroll indicator: the imagery advances as you scroll,
giving the 500vh a sense of progress. A static gradient cannot reproduce that.

Compounding: the reference's `<video>` sits **under** a transparent cut-out
`.md-intertv__holder-image` (a 2560×1440 webp with alpha) — two independent
full-viewport layers, one moving via scrub, one fixed. This build's equivalent is
a single flat `hero-backdrop.svg` plus a single `hero-foreground.svg`.

**SEVERITY:** P0

**ROOT CAUSE:**
`VISUAL_QA.md` deviation 11 recorded this as accepted because "reversing that
would mean shipping a video asset, which is out of scope for an original-assets
build." That reasoning is sound for the *reference's* video (not reproducible
without copying their footage), but the conclusion — static backdrop, no
animated atmosphere layer at all — was never revisited. The gap is the *absence
of a scrubbed layer*, not the absence of *their* file.

**RECOMMENDED FIX:**
Produce an original scroll-scrubbed hero layer and scrub it with the same
mechanism:
1. Generate an original looping sequence (the existing SVG generator can emit
   frames, or render a short original 3D/2D sequence to webm). ~8s at 1440p
   matches the reference's cadence.
2. Mount it as `<video muted playsinline preload="auto">` with
   `position: sticky; top: 0`, and drive `currentTime` from a GSAP ScrollTrigger
   `scrub` across the hero range rather than from `play()`.
3. Keep the current `hero-backdrop.svg` as the `poster` so first paint is
   immediate.
4. Verify the scrub by sampling `currentTime` across a wheel sweep — the
   reference advanced ~0.32s per 700px of wheel.

---

## [Hero — cut-out layer positioning]

**REFERENCE:**
`.md-interctv__holder-image` is `position: fixed` with
`data-scroll-target=".md-interctv"` — its containing block is the hero section
(the section carries `will-change: transform` from the global reset), so it stays
registered to the hero for the full 4500px.

**LOCAL:**
`.hero__foreground` is `position: absolute` inside `.hero__holder`, which is
`height: 100vh`. The cut-out therefore lives in the first viewport only.

**DIFFERENCE:**
Beyond 100vh the reference's cut-out is still present (fixed to the hero), while
this build's has scrolled away with its holder. In practice the name and card are
also only in the first viewport, so the *first* viewport looks the same — the
divergence is only observable if the hero's composition is inspected past 100vh
scroll. Low impact, but it is a real structural difference in how the layers are
scoped.

**SEVERITY:** P2

**ROOT CAUSE:**
The holder was given `height: 100vh` to contain the name and card, and the
cut-out was placed inside it rather than given its own section-scoped layer.

**RECOMMENDED FIX:**
Move `.hero__foreground` out of `.hero__holder` and scope it to `.hero` directly
(`position: absolute; top: 0; height: 100vh` inside the 4500px section, or
`position: fixed` relying on the section's `will-change: transform` as the
reference does). Re-verify the name/cut-out z-order afterwards — the name sits
*behind* the cut-out and that relationship must survive the move.

---

## [Parallax — gallery images]

**REFERENCE:**
All 10 `.md-glrycard__image` elements carry `data-scroll` +
`data-scroll-speed` with individually randomised values:

```
0.4417  0.1527  0.2635  0.2702  0.9878  0.3961  0.6176  0.9052  0.2338  0.1830
```

Measured `translateY` across a scroll sweep at `scrollY` 10900 / 11500 / 11800 /
12300 — while the tiles were fully within the viewport (`viewportY` from +810
down to −1184):

```
scrollY=10900  ty: 0 0 0 0 0 0 0 0 0 0
scrollY=11500  ty: 0 0 0 0 0 0 0 0 0 0
scrollY=11800  ty: 0 0 0 0 0 0 0 0 0 0
scrollY=12300  ty: 0 0 0 0 0 0 0 0 0 0
```

**The declared gallery parallax is inert.** All 11 visible speed-bearing elements
reported `translateY: 0` simultaneously.

**LOCAL:**
`.highlight-tile__image` has a live GSAP + ScrollTrigger tween; measured
`galleryImgTy: −94.5`.

**DIFFERENCE:**
**This implementation animates and the reference does not.** The repository adds
gallery parallax that the live site does not exhibit. This is the inverse of a
fidelity gap: it is invented motion.

**SEVERITY:** P1

**ROOT CAUSE:**
`MAMEED_RECON.md` §7.5 correctly inferred the `160% / −30%` reservoir geometry
from CSS and read it as "a parallax reservoir". The reservoir exists in the
markup, but the motion that would use it never runs. `useParallax.ts` was written
to fill the inferred reservoir, encoding an inference as a fact. The brief's
instruction — "Do not invent motion merely to make the page look interesting" —
was violated unintentionally, because the reservoir's presence looked like proof
of motion.

**RECOMMENDED FIX:**
Remove the parallax tween from `HighlightTile.vue` and drop the
`useParallax` call. Keep the `160% / −30%` image geometry — that *is* in the
reference's CSS and affects how the image crops. Then decide whether to
re-implement with the reference's actual (randomised, 0.15–0.99) speeds if the
inertness turns out to be a bug in the reference rather than intent; that
determination is not possible from the outside and should be a product decision.

---

## [Parallax — testimonial images]

**REFERENCE:**
All 6 `.md-rvwcard__image` carry `data-scroll-speed="1"`. Measured across the
same four scroll positions, while the cards were in view: `ty: 0 0 0 0 0 0`.
**Inert.**

**LOCAL:**
`.testimonial-card__image` has a live tween; measured `rvwImgTy: −40.5`.

**DIFFERENCE:**
Same class as the gallery finding — this build animates, the reference does not.

**SEVERITY:** P1

**ROOT CAUSE:**
Identical to the gallery: `130% / −15%` reservoir inferred from CSS, motion
supplied by `useParallax.ts`. Note the reference's uniform speed of `1` here
versus randomised values in the gallery suggests the two were authored
differently — possibly the gallery values are generated per-render while the
testimonial value is a constant. If any of this motion is meant to run, the
testimonial set is the more likely candidate.

**RECOMMENDED FIX:**
As above — remove the tween from `TestimonialCard.vue`, retain the reservoir
geometry, and re-evaluate against the reference after the inertness question is
resolved.

---

## [Loader / intro sequence]

**REFERENCE:**
`document.querySelector('.md-loader')` → **`null`**. The 5-column curtain
documented in `MAMEED_RECON.md` §9.2 is **dead code** and never mounts.

The live intro is `.md-introloader`, which contains an **odometer counter**:

- Full-screen white field, `z-index: 11`, `position: fixed`
- `padding: 100px 150px`, `align-items: flex-end; justify-content: flex-end` →
  content anchored **bottom-right**
- Three rolling digit columns (`.csmodo__numbers`, 333.01 × 207.2), each column
  a strip of `0 1 2 3 4 5 6 7 8 9` at `font-size: 185px`
- Captured live: reads **`000`** on load, then the third column rolls toward `1`
  (visible mid-roll in the second frame), counting up over ~3s via the
  `odometer-count` keyframe
- Then `odometer-disappear` at 3.2s (`translateY(-100px)`, fade), and the
  overlay fades over 1s

Note: the digits are declared `font-family: PT Mono`, which the reference never
loads, so they actually render in the **browser-default serif** — visible in the
captures as a Didone-ish face rather than a monospace.

**LOCAL:**
`site-loader` renders a **5-column curtain**: five 20%-wide strips alternating
`#fff`/`#f9f9f9`, each dropping from `translateY(-200px)` with staggered
durations 0.8/1.1/1.4/1.7/2.0s, then the whole overlay fades. Held for a minimum
of 1400ms then faded over 1000ms.

**DIFFERENCE:**
The two openings share nothing. One is five vertical strips falling and fading;
the other is a counting numeral in the bottom-right corner of a white page. This
is the first thing a visitor sees, and it sets the site's tone.

**SEVERITY:** P0

**ROOT CAUSE:**
`MAMEED_RECON.md` §9.2 documented **both** components — the curtain
(`.md-loader`, five blocks) *and* `.md-introloader` (fixed, white,
`padding: 100px 150px`, flex-end) — but the build implemented the curtain and
ignored the wrapper. §12.4 separately recorded the odometer's usage as UNKNOWN
("whether the home route instantiates it is unconfirmed"). The two were never
connected: the odometer *is* the content of `md-introloader`, and `md-loader` is
the unused one. The recon documented the wrong component as primary.

**RECOMMENDED FIX:**
1. Replace `SiteLoader.vue`'s curtain with a white full-screen overlay using
   `padding: 100px 150px` and bottom-right flex alignment — the existing
   `.md-introloader` rules are already transcribed in the recon.
2. Port the odometer as a `RollingCounter` component using the `.csmodo`
   keyframes already documented: three columns absolutely positioned at
   `left: 0`, `left: 111.0044401776px`, `left: 222.00888px` (thirds of 333.01),
   `translateY(calc(-100% + 207.2px))` over 3s, `cubic-bezier(0,1.01,0,2)`,
   with the first column at `transition-duration: 2s`.
3. Decide the digit font explicitly. Matching the reference's *rendered* output
   means specifying a serif fallback rather than loading PT Mono; matching its
   *intent* means loading PT Mono. The captures show the serif fallback, so
   serif is what "same as reference" actually looks like.
4. Keep the 3s count → 3.2s disappear → 1s fade timing; remove the curtain's
   staggered block durations.

---

## [Navigation — primary CTA]

**REFERENCE:**
"Get in touch" calls `openRequestModal()` → `this.$store.dispatch('openRequestModal')`
→ adds `.md-show` to `.md-lvp__wrapper`. Captured live:

- Full-screen scrim: `rgba(37, 35, 36, 0.6)` + `backdrop-filter: blur(5px)`,
  `z-index: 13` — the page behind is visibly blurred and darkened
- `.md-lvp` panel: **600 × 633**, `padding: 70px 60px`, `background: #fff`,
  centred, square corners
- Close button, top-right ~30px inset
- Title "Leave your request" at 34px
- Two `.md-input` fields ("Your Name", "Your email") + one `.md-textarea`
  ("Summary of your message (min 10 words)") with a live word-count hint
  bottom-right
- One `.mdbtn` "Send request", dark fill, right-aligned

A second trigger exists — `.md-rvws__btn` "Leave yours" — which opens a review
form variant using `.md-lvp .md-review` (grid `250px 1fr`) with a `.md-phinput`
photo upload. Its content is lazy and did not populate reliably in the automated
session; the request variant was captured in full.

**LOCAL:**
`MdButton` with `@click="navigate(primaryCta.target)"` → `goTo('#contact')` →
eased scroll to the contact section. No modal element exists in the repository
(`modal: false`).

**DIFFERENCE:**
A completely different interaction and a missing UI surface. The most prominent
control in the header — present on every screen once scrolled, since the black
mark is the only persistent chrome — opens a modal with a backdrop blur in the
reference, and scrolls in this build. The reviews section additionally lacks the
"Leave yours" review-submission flow.

**SEVERITY:** P1

**ROOT CAUSE:**
`MAMEED_RECON.md` §12.9 flagged the `.md-lvp` modal as an explicit UNKNOWN: "its
open/close animation on real interaction was not observed end-to-end." The
correct call at the time was to exclude it — but the *trigger* was never
identified either, so the header CTA was wired to the contact section as a
reasonable-looking substitute rather than flagged as a stub. `VISUAL_QA.md`
records the contact form's missing backend but not the missing modal.

**RECOMMENDED FIX:**
1. Add `components/ui/ModalShell.vue` — fixed scrim `rgba(37,35,36,.6)` +
   `backdrop-filter: blur(5px)`, `z-index: 13`, centring a 600px white panel with
   `padding: 70px 60px`; `fade-in`/`fade-in-up-short` in, `fade-out`/
   `fade-out-up-short` out (both keyframe sets are already in the recon).
2. Move the contact form into it as `RequestModal`, reusing `MdInput`,
   `MdTextarea` and `MdButton`; add the close button (`opacity .6` +
   `rotate(90deg)` on hover).
3. Repoint `primaryCta` from `#contact` to an `openRequestModal()` call, and keep
   the contact section as the standalone fallback surface.
4. Trap focus, restore focus on close, close on Escape and scrim click, and lock
   body scroll while open — none of which the reference does, so this is a
   deliberate accessibility addition to document.
5. Add the reviews variant only after the request variant is verified.

---

## [Navigation — heading semantics]

**REFERENCE:**
Nav links are `<h3 class="md-hacktext md-header__link">` — 10 of them (5 desktop
+ 5 in the mobile drawer). The hero name is `<p class="md-interctv__title-text">`.
The footer quote is `<h2 class="md-footer__quote-text">`. The reference page has
**no `<h1>`**.

**LOCAL:**
Nav links are `<span role="link" tabindex="0">`. The hero name is `<h1>` with a
`visually-hidden` full name and role. The footer quote is `<blockquote>` with a
`<figcaption>`.

**DIFFERENCE:**
Semantic only, no visual impact. The reference's heading structure is invalid
(nav links as `h3`, no `h1`); this build's is correct. Flagged for completeness
because the audit asked for text-reveal and navigation behaviour, and the element
type is part of how the reveal is wired in the reference (`compHacktext` renders
an `h3` unconditionally).

**SEVERITY:** P3

**ROOT CAUSE:**
Deliberate accessibility correction, recorded in `PRODUCTION_AUDIT.md` §4.

**RECOMMENDED FIX:**
None — keep the corrected semantics. Note it so a future reviewer does not
"fix" it back toward the reference.

---

## [Navigation — scroll affordance]

**REFERENCE:**
No scroll indicator exists. A class-name sweep for `scroll|hint|cue|indicator|down`
across the whole document returns only `has-scroll-init` (the scroll library's
own root class), `md-interctv__scroller` (a layout wrapper) and
`md-contact__form-hint` (an unrelated form hint).

**LOCAL:**
`.hero__scroll-hint` — a 1px white line, 56px tall, centred at `bottom: 40px`
with a looping `scaleY` animation, wrapped in a `<button>` that scrolls to
`#about`. Confirmed rendering at rect `[712, 4388, 17, 72]`.

**DIFFERENCE:**
Extra UI not present in the reference. Small in area but it sits in the most
scrutinised part of the page and animates on a loop, drawing the eye.

**SEVERITY:** P2

**ROOT CAUSE:**
Added during implementation as a usability aid for a 500vh hero, without checking
back against the reference. Not recorded as a deviation in `VISUAL_QA.md`, so it
is currently an *undocumented* addition.

**RECOMMENDED FIX:**
Remove it, or keep it and record it explicitly as an intentional addition with a
rationale. Given the brief's "do not invent motion" instruction, removal is the
consistent choice — the reference's scroll-scrubbed video performs this role.

---

## [Structure — section order]

**REFERENCE:**
`.mdHome` → `section.md-interctv` → `.md-about` → `.md-exp` → `.md-glry` →
`.md-rvws` → `.md-contact`, then `footer.md-footer`. Ids: `#main`, `#about`,
`#experience`, `#projects`, `#reviews`, `#contact`.

**LOCAL:**
`HeroSection` → `AboutSection` → `ExperienceSection` → `HighlightsSection` →
`TestimonialsSection` → `ContactSection`, then `SiteFooter`. Identical ids.

**DIFFERENCE:** **None.** Verified by live DOM dump.

**SEVERITY:** —

**ROOT CAUSE:** N/A

**RECOMMENDED FIX:** None.

---

## [Structure — section spacing and heights]

**REFERENCE (1440×900):**
`4500 / 2820 / 3801 / 910 / 1178 / 1108 / 900` — document **15217**.

**LOCAL (1440×900):**
`4500 / 2965 / 3759 / 910 / 1151 / 1129 / 900` — document **15314**.

| section | reference | local | Δ |
|---|---|---|---|
| hero | 4500 | 4500 | 0 |
| about | 2820 | 2965 | **+145 (+5.1%)** |
| experience | 3801 | 3759 | −42 (−1.1%) |
| highlights | 910 | 910 | 0 |
| testimonials | 1178 | 1151 | −27 (−2.3%) |
| contact | 1108 | 1129 | +21 (+1.9%) |
| footer | 900 | 900 | 0 |
| **document** | **15217** | **15314** | **+97 (+0.6%)** |

At 390×844: reference **17488**, local **17882** (**+394, +2.3%**).

**DIFFERENCE:**
Only About is materially off, at +5.1%. Everything else is within ±2.3%, and the
document total is within 0.6% on desktop.

**SEVERITY:** P2

*The mobile document-height delta (+394px, +2.3%) is recorded here as a P3
sub-finding rather than as its own section; it shares this root cause.*

**ROOT CAUSE:**
Content volume, not spacing. Section padding (`100px 0` → `50px 0`), the master
grid, the inter-element gaps and the component dimensions all match exactly
(verified in the geometry diff). This build carries ~29 lines of bio copy against
the reference's ~19–23, and 20 experience summary fragments against 18.

**RECOMMENDED FIX:**
No change recommended. Two rounds of trimming already reduced a `+388px` About
gap to `+145px`; further reduction would mean deleting content to hit a pixel
target. Document the residual as content-driven, which
`VISUAL_QA.md` deviation 3 already does.

---

## [Structure — container, grid, and responsive tokens]

**REFERENCE / LOCAL:** identical across all eight audited viewports.

| viewport | `--ttitle` | container | split |
|---|---|---|---|
| 375×812 | 32px | full-bleed | flex column |
| 390×844 | 32px | full-bleed | flex column |
| 430×932 | 32px | full-bleed | flex column |
| 768×1024 | 32px | 576px | flex column |
| 820×1180 | 26px | 768px | 20% / auto |
| 1366×768 | 36px | 992px | 30% / auto |
| 1440×900 | 36px | 992px | 30% / auto |
| 1920×1080 | 56px | 1440px | 30% / auto |

Grid tracks at 1440: reference `288.594px 623.406px` gap `50px`; local identical.
No horizontal overflow at any width.

Mobile sticky values also verified equal:

| property | reference | local |
|---|---|---|
| `.md-exp__titling` position / top | `sticky` / `594px` | `sticky` / `calc(100lvh - 250px)` = 594px |
| `.md-exp__block-title` position / top / height / bg | `sticky` / `644px` / `200px` / `#fff` | `sticky` / `644px` / `200px` / `#fff` |
| `.md-header` at ≤768 | `display: none` | `display: none` |
| `.md-mobheader` at ≤768 | 90×90, `opacity: 1` | 90×90, `opacity: 1` |
| `.md-intcontacts` at ≤768 | `fixed` | `fixed` |

**DIFFERENCE:** **None.**

**SEVERITY:** —

**ROOT CAUSE:** N/A

**RECOMMENDED FIX:** None. This is the strongest-matching layer of the project,
which is expected — the reference's stylesheets are the one part of it that is
fully inspectable, and they were transcribed directly.

---

## [Structure — `data-scroll-sticky` is declared but inert]

**REFERENCE:**
10 elements carry `data-scroll-sticky` **with** a `data-scroll-target`:

```
.md-interctv__holder-image  → .md-interctv
.md-interctv__canvas        → .md-interctv
.md-about__titling          → .md-about
.md-exp__titling            → .md-exp
.md-exp__block-title × 3    → #rs, #lumos, #kirano
.md-glry__titling           → .md-glry
.md-rvws__titling           → .md-rvws
.md-contact__titling        → .md-contact
```

Measured at `scrollY 4900`, inside the About range: `.md-about__titling` is
`position: static`, `top: auto`, `viewportY: −300`, `docY: 4600` — it scrolled
away with its section. No inline `position` or `top` was applied. **The section
titling columns are not pinned on desktop**; the attribute is inert.

**LOCAL:**
No `data-scroll-sticky` equivalent on desktop. `ExperienceSection.vue` applies
`position: sticky` to the titling column at ≤768px only.

**DIFFERENCE:**
None visible. Worth recording because the markup advertises a behaviour the site
does not perform, and because it is evidence that locomotive-scroll's
sticky/speed features are broadly non-functional on this site — the same pattern
as the inert gallery and testimonial parallax. Three independent declared-motion
mechanisms are inert, which suggests the scroll library's advanced features are
misconfigured or disabled globally.

**SEVERITY:** P3

**ROOT CAUSE:**
Reference-side. Possibly a locomotive-scroll version or config issue.

**RECOMMENDED FIX:**
None for fidelity. Do **not** "fix" this by pinning the titling columns — that
would diverge from observed behaviour. Flag it because it means the three inert
motions (gallery parallax, testimonial parallax, titling sticky) should be
treated as one investigation: if the reference's scroll library is broken, some
of its declared motion may be *intended* rather than absent, and the choice to
match observed behaviour versus intended behaviour becomes a product decision.

---

## [Scroll — header, mark, rails]

**REFERENCE (verified at `scrollY 600`):**
- `.md-header__wrapper` → `position: fixed`, `height: 0`, full width
- `.md-header` → `matrix(1,0,0,1,0,-100)` — rect `y −100…0`, fully off-screen
- `.md-intcontacts` → `opacity: 0`
- `.md-mobheader` → gains `.md-scrolled`, `opacity: 1`, rect `675,0 → 765,90`

**LOCAL:**
- `.site-header` → `position: fixed`, `height: 0`
- `.site-header__bar` → `matrix(1,0,0,1,0,-100)`, rect `y −100…0`
- `.side-rails` → `opacity: 0`
- `.mobile-mark` → `is-scrolled`, `opacity: 1`, rect `675,0 → 765,90`

**DIFFERENCE:** **None.** Thresholds (100 / 300) and all four resulting states
match exactly.

**SEVERITY:** —

**ROOT CAUSE:** N/A

**RECOMMENDED FIX:** None.

---

## [Scroll — text reveal]

**REFERENCE:**
15 `.md-hacktext` elements: 10 nav links (14px, desktop + mobile) and 5 section
titles (36px: `md-about__title`, `md-exp__title`, `md-glry__title`,
`md-rvws__title`, `md-contact__title`). Triggered by `data-scroll-call` with
`data-scroll-offset="20%, 0"`. Testimonial cards additionally carry
`data-scroll-call="card_0"…"card_5"` with `data-scroll-offset="40%, 0"`.

**LOCAL:**
`ScrambleText` on 10 nav links + 5 `SectionTitle` instances = 15. Same alphabet,
same per-length tick interval (50/30/20ms), same `iteration += 1/3` advance, same
frozen `+5px` width. Reveal driven by `IntersectionObserver` with
`rootMargin: 0px 0px -threshold% 0px` rather than by named scroll calls.

**DIFFERENCE:**
Scope matches exactly — no extra or missing scramble targets. Two sub-differences:

1. **Trigger offsets.** Reference titles fire at `20%, 0` (element 20% up from the
   viewport bottom) and testimonial cards at `40%, 0`. Local uses `0%` for titles
   and `0.05` for cards — i.e. **local reveals fire earlier than the reference**.
   This was a deliberate accessibility change (commit intent: complete the ink-in
   before the line is readable) but it does change when the scramble is seen.
2. **Testimonial card reveal.** Reference has an explicit per-card scroll call at
   `40%, 0`; local uses a generic `IntersectionObserver` child scan. Observable
   difference is timing, not mechanism.

**SEVERITY:** P3

**ROOT CAUSE:**
Offset `20%, 0` was transcribed into `MAMEED_RECON.md` but `useReveal.ts`
implements a `rootMargin`-based approximation, and the About/Experience/
Testimonials call sites were then tuned to `0` for the ink-in contrast work.

**RECOMMENDED FIX:**
Map the reference's offset syntax to `rootMargin` precisely: `20%, 0` means the
trigger line sits 20% up from the viewport bottom, i.e.
`rootMargin: '0px 0px -20% 0px'`. Apply that to section titles, `-40%` to
testimonial cards, and `-40%` to the gallery equivalents if any exist. Then
re-check the ink-in contrast trade-off separately rather than by moving the
shared threshold.

---

## [Scroll — hero video and cut-out registration]

**REFERENCE:**
`.md-interctv__canvas` (`position: sticky`) and `.md-interctv__holder-image`
(`position: fixed`) both carry `data-scroll-target=".md-interctv"`, so both are
registered to the hero for its full 4500px.

**LOCAL:**
`.hero__atmosphere` is `position: sticky` inside `.hero__scroller` (500vh), so it
is already registered for the full hero and behaves equivalently. No video
exists.

**DIFFERENCE:**
The sticky atmosphere matches. The cut-out does not — see the
[Hero — cut-out layer positioning] finding.

**SEVERITY:** —

**ROOT CAUSE:** N/A

**RECOMMENDED FIX:** None beyond the cut-out finding.

---

## [Content — footer quote]

**REFERENCE:**
The quote is **randomised on every page load**. Three consecutive reloads:

```
1. "The lotus rises from the mud, yet it is never stained."      — Indian wisdom
2. "It is better to be a warrior in a garden than a gardener in a war." — Japanese proverb
3. "If a goodbye hurts, it only means the time together was real and well spent." — Some bro
```

The attribution changes with the quote. `MAMEED_RECON.md` §7.8 recorded
`"Imperfect action is better than perfect inaction"` — a fourth variant, captured
during reconnaissance and then treated as a fixed string.

**LOCAL:**
`data/profile.ts` → `quote: { text: 'Make it work, make it right, make it fast.',
attribution: 'Kent Beck' }`. Static; identical on every load.

**DIFFERENCE:**
The footer is a rotating quotation in the reference and a fixed one here. The
footer occupies a full 100vh and the quote is its visual centrepiece, so the
section is materially less interesting on repeat visits. It also means no single
quote can be "the" correct one — the recon's recorded value was only ever one
sample.

**SEVERITY:** P2

**ROOT CAUSE:**
The recon captured one render and recorded it as a fixed value; there was no
repeat-load check. Nothing in the CSS or source map indicates a rotation (the
quotes are likely data in the unretrieved home route chunk).

**RECOMMENDED FIX:**
Convert `profile.quote` to `profile.quotes: Array<{ text, attribution }>` and
select one at random on mount. Because the selection must be SSR-safe and stable
across hydration, pick it in a `useState`-backed composable initialised on the
server rather than in `onMounted`, or render the first quote server-side and swap
after hydration. Populate with original quotations of comparable length and
register so the 900px / three-line layout is exercised by every entry.

---

## [Content — image composition]

**REFERENCE:**
Real photography: a 2560×1440 cut-out webp with alpha composited over the video;
10 gallery photographs; 6 testimonial portraits; project logos; ~55 stack marks
under `/img/*.svg`.

**LOCAL:**
Generated SVG throughout: `hero-backdrop.svg`, `hero-foreground.svg`, 10 abstract
product compositions, 6 rim-lit figure studies, 9 project monograms, 50 stack
monograms, 15 interface glyphs. 94 files, 136.6 KB total.

**DIFFERENCE:**
The largest remaining *surface-area* difference after the typeface. The
generated art is deliberately abstract — product compositions rather than
screenshots, tonal silhouettes rather than portraits — so it reads as art
direction rather than as failed imitation. But it is not photography, and the
reference's gallery in particular derives much of its impact from real images.

**SEVERITY:** P1

**ROOT CAUSE:**
Required by the brief: original assets only, no reference photography. The
gallery compositions were re-drawn once already to survive the parallax crop
(`VISUAL_QA.md` "Resolved" item 4), and the portraits were reworked twice.

**RECOMMENDED FIX:**
This cannot be closed with generated art at the current level of abstraction.
Options in descending fidelity:
1. Commission or license original photography for the gallery and portraits —
   the single highest-leverage remaining change after the typeface.
2. Keep abstract art but raise its quality: the gallery compositions currently
   read as flat vector mockups. Rendering them with realistic depth, texture and
   type would close much of the gap while staying original.
3. If the parallax is removed (per the gallery/testimonial findings), the images
   no longer need a 160% reservoir, which frees the composition to be designed
   for its actual 1×1 and 2×2 crops rather than for a moving window — worth doing
   in the same pass.

---

## Totals

Counted by enumerated finding section above (22 sections, of which 4 — section
order, container/grid/responsive, scroll chrome, and hero layer registration —
record **no difference** and are excluded).

| Severity | Count | Findings |
|---|---|---|
| **P0** | **2** | Loader (odometer vs curtain); hero atmosphere (scrubbed video vs static SVG) |
| **P1** | **7** | Display family; cap-height / optical size; hero layer parallax absent; gallery parallax invented; testimonial parallax invented; CTA modal absent; image composition |
| **P2** | **4** | Hero cut-out scoping; invented scroll affordance; section spacing (About +5.1%); footer quote static |
| **P3** | **5** | Per-glyph proportions; font registration and rendering; heading semantics; reveal trigger offsets; `data-scroll-sticky` inert |
| **Total** | **18** | |

Two further differences are recorded **inside** other sections rather than as
their own, and are therefore not counted above: the hero name/card's constant
parallax displacement (within *Hero — layer parallax*) and the mobile document
height delta (within *Structure — section spacing*).

The four sections recording no difference are the strongest-matching layer of the
project, which is expected: the reference's stylesheets are the one part of it
that is fully inspectable, and they were transcribed directly. Every finding above
comes from the JS/runtime layer, which reconnaissance sampled far less
thoroughly than the CSS layer.

### Top 10 highest-impact differences

1. **Loader is a completely different opening** (P0) — odometer counting `000→100`
   bottom-right on a white field, versus five falling columns. First thing a
   visitor sees. `md-loader` (curtain) is dead code in the reference;
   `md-introloader` + `.csmodo` (odometer) is the live one.

2. **Hero atmosphere is static instead of scroll-scrubbed video** (P0) — reference
   scrubs a 2560×1440, 8.042s webm (`currentTime` 0 → 1.608 measured). The scrub
   is what makes 500vh of hero feel like progress.

3. **Hero layers have no parallax** (P1) — reference drifts seven layers at
   `rate = −speed/45` px/px (verified across five elements, perfectly
   consistent), plus constant offsets of −718px / −180px on the name and card.
   Local parallax on hero layers: `0`.

4. **Display typeface is a different family** (P1) — `SK Zweig` vs `Playfair
   Display Variable`. Affects every heading, card title, numeral and quote.

5. **Headings render ~12–16% optically larger** (P1) — Playfair's cap-height
   exceeds SK Zweig's at identical `font-size`. Declared sizes match the
   reference exactly, which is why the geometry diff passes; the *rendered* size
   does not.

6. **Gallery parallax is invented motion** (P1) — reference declares
   `data-scroll-speed` 0.15–0.99 on all ten tiles but `translateY` is `0` at
   every sampled position. Local applies a live tween (`−94.5`).

7. **Testimonial parallax is invented motion** (P1) — same pattern; reference
   `speed="1"`, inert. Local applies a live tween (`−40.5`).

8. **"Get in touch" opens a modal in the reference, scrolls here** (P1) — a
   600×633 blurred-scrim modal ("Leave your request", 2 fields + textarea) plus a
   second review-submission variant. Neither exists in the repository.

9. **Image composition is generated SVG, not photography** (P1) — 94 generated
   files versus the reference's photographic gallery, portraits and cut-out.

10. **Footer quote is static, reference randomises it per load** (P2) — three
    consecutive loads produced three different quotations. A full-height section
    whose centrepiece never changes.

### One cross-cutting observation

Three separate motion mechanisms are **declared in the reference's markup but
inert at runtime**: gallery image parallax (10 elements), testimonial image
parallax (6 elements) and section-titling sticky (10 elements). All three are
locomotive-scroll features. That pattern suggests the reference's scroll library
is misconfigured or partly disabled rather than that the motion was deliberately
removed.

This matters for findings 3, 6 and 7. Finding 3 (missing hero parallax) is
unambiguous — the hero layers demonstrably *do* move. Findings 6 and 7 are
ambiguous: matching *observed* behaviour means removing the local tweens;
matching *intent* means keeping them and raising the amplitude to the declared
speeds. That is a product decision, not an engineering one, and it should be made
explicitly rather than defaulted.

---

**Status: diagnosis only. No fixes applied. The project is not complete.**
