# P1 Typography Report

Implements the typography finding from
[`FINAL_FIDELITY_AUDIT.md`](FINAL_FIDELITY_AUDIT.md) — §`[Typography — display
family identity]` (P1) and §`[Typography — cap-height / optical size]` (P1).

**Selected face: Trirong** (Google Fonts, SIL Open Font License 1.1), weights
400 / 500 / 700, self-hosted through `@fontsource` — the same mechanism the
project already used for Montserrat.

The project is **not** complete. P1 items other than typography, and all P2/P3
items, remain open.

---

## 1. The audit's diagnosis was wrong, and the fix had to change with it

The audit reported that Playfair Display's **cap-height** was "~12–16% too tall"
and recommended "a cap-height ratio of ~0.88 applied to display roles".
Implementing that would have made the type **worse**.

Measuring the reference glyph by glyph shows the 12–16% is not cap-height at all:

| glyph | SK Zweig @200px | /em |
|---|---|---|
| `H` `E` (`EFHILNTZ` mean) | 140.4 | **0.702** cap height |
| `o` `c` `e` `s` | 104 | **0.520** x-height (round) |
| `b` `d` `f` `h` `k` `l` | 138.1 | **0.690** ascenders |
| `x` `v` | **114** | anomalous — see below |

Two corrections follow:

1. **The excess is in the ascenders, not the caps.** The audit measured
   `actualBoundingBoxAscent` on whole strings, which returns the *tallest glyph in
   the string* — driven by ascenders, not capitals. Reading it as cap-height is
   the misdiagnosis. In Playfair the ascenders reach 0.785/em against a 0.710/em
   cap; in SK Zweig they reach 0.690 against a 0.702 cap. SK Zweig's ascenders sit
   **just below** its capitals (`asc/cap` = **0.983**); Playfair's overshoot by
   **10.6%** (`asc/cap` = 1.106). That ratio, not cap-height, is the finding.

2. **SK Zweig's `x` and `v` are outliers.** Both measure 114/200 where every other
   lowercase is 101–104. Reading x-height from `x` alone — as the audit's probe
   did — overstates the reference's x-height by 9% (0.570 instead of 0.525) and
   sets a target no other face can hit. Every measurement here uses the flat
   lowercase set (`n u z`) cross-checked against the round one (`o c e s`).

Had the audit's recommended 0.88 size scale been applied, caps that are already
correct (+1.1%) would have become 12% too small, and the actual defect —
ascenders 13.8% too tall — would have been untouched.

**Consequence for the fix:** no corrective size scale is needed or wanted. The
declared `font-size` values are correct and the real requirement is a face whose
ascender-to-cap ratio is ≈0.98. All responsive type tokens are therefore
unchanged.

---

## 2. Font search

### 2.1 Is an authorised SK Zweig available locally?

**No.** Searched the repository, `node_modules`, the user profile directory and
the system font directory:

- repository font files: only `@fontsource` Montserrat and Playfair Display
- `C:\Windows\Fonts`: Georgia and Times New Roman families only
- no `*zweig*` file anywhere on the accessible volume

SK Zweig is a commercial retail licence and is not redistributable, so the
substitute path was taken.

### 2.2 Candidate sweep

126 open-licensed serif families were pulled from Google Fonts and measured with
canvas metrics against SK Zweig's profile, in two passes (a broad sweep and a
second pass targeted at short-ascender faces). Scoring used absolute `/em`
errors rather than ratios, since what makes a heading look the wrong size is the
absolute cap, ascender and x-height at a given `font-size`.

**Measurement hazards found and controlled for.** Two would have produced a
confident but wrong answer:

- **`document.fonts.check()` lies.** This browser returns `true` for a family
  that does not exist at all, so an initial sweep reported "loaded: 64/64". Every
  candidate measurement was re-validated by comparing its rendered width against a
  deliberately-absent family — if they match, the face never loaded. They did
  load, but the earlier result was not evidence of anything.
- **A double quote inside a double-quoted `style` attribute** silently truncates
  the declaration, so an early visual comparison rendered every "face" in the page
  default and looked identical. Family names are single-quoted throughout.

### 2.3 Weight filter

The reference loads SK Zweig 400 **and** 700, and this build uses display 700 in
two real places — `.site-footer__quote-text` and `.testimonial-card__name` — plus
500 on the `Get in touch` CTA. A perfect metric fit at 400 is useless if 700 has
to be synthesised, so availability was read from the Google Fonts API (requesting
`wght@400;500;700` and checking the response), not from `document.fonts.check()`.

This disqualified three of the four best metric matches:

| family | weights | outcome |
|---|---|---|
| Yeseva One | 400 only | rejected |
| Marcellus | 400 only | rejected |
| DM Serif Display | 400 only | rejected |
| Sanchez | 400 only | rejected |
| Brawler | 400, 700 — no 500 | rejected |
| Sumana | 400, 700 — no 500 | rejected |

### 2.4 Final ranking

Ranked on optical error against SK Zweig, with the layout consequences measured
on the site's real content (21 wrappable display elements, 4 non-wrapping titles):

| # | family | cap err | x err | asc err | optical total | asc/cap | wrap diffs | nowrap overflow |
|---|---|---|---|---|---|---|---|---|
| 1 | Lora | 0.28% | 1.77% | 9.42% | 11.47% | 1.079 | 0 | 0 |
| 2 | Bitter | 0.28% | 2.45% | 12.32% | 15.05% | 1.107 | 0 | 0 |
| 3 | **Karma** | 3.04% | 4.63% | 1.45% | 9.12% | 1.028 | 1 | 0 |
| 4 | IBM Plex Serif | 0.28% | 0.54% | 10.14% | 10.97% | 1.086 | 1 | 0 |
| 7 | *Playfair Display* (before) | 1.14% | 0.68% | **13.77%** | 15.59% | 1.106 | 1 | 0 |
| 14 | **Trirong** (selected) | 0.43% | 3.67% | **3.04%** | **7.14%** | **1.009** | 1 | 1 |

Reference `asc/cap` = **0.983**.

Trirong has the best optical total and the closest `asc/cap` of any face that
ships the required weights — 1.009 against the reference's 0.983, where Playfair
sits at 1.106.

**Why not Lora or Bitter** (which change no wrapping): they barely improve the
actual defect. Their `asc/cap` values, 1.079 and 1.107, are close to Playfair's
1.106 — the ascender overshoot the audit flagged would have survived almost
intact. Optimising for wrapping fidelity alone would have meant not fixing the
P1 finding at all.

**Why not Karma** (second-best optical, no nowrap overflow): it trades a 1.45%
ascender error for a 3.04% cap error and a 4.63% x-height error, and its
`asc/cap` of 1.028 is further from the reference than Trirong's 1.009. Trirong is
better on cap height, x-height and the defining ratio; Karma is better only on the
single nowrap-overflow case below.

---

## 3. Measurements

All figures below come from probes kept in `scripts/audit/`, run against the live
reference and against the built site. Optical values are from one probe so the
"before" and "after" columns are internally consistent.

| metric | SK Zweig | Playfair (before) | Trirong (after) |
|---|---|---|---|
| cap-height / em | 0.702 | 0.710 (+1.14%) | **0.705 (+0.43%)** |
| x-height / em | 0.525 | 0.515 (−0.68%) | 0.505 (−3.67%) |
| ascender / em | 0.690 | 0.785 (**+13.77%**) | **0.711 (+3.04%)** |
| **asc / cap** | **0.983** | **1.106** | **1.009** |
| x / cap | 0.748 | 0.725 | 0.716 |
| **total optical error** | — | **15.59%** | **7.14%** |

The dominant error — the one the audit found — drops from **+13.77% to +3.04%**,
a **78% reduction**, and the defining ratio moves from 1.106 to 1.009 against a
reference of 0.983.

### 3.1 Representative heading widths

| string | size | SK Zweig | Playfair dev | Trirong dev |
|---|---|---|---|---|
| `Experience` | 36 | 188.57 | −3.6% | **+0.6%** |
| `Highlights` | 100 | 464.10 | +0.5% | +6.2% |
| `Get in touch` | 36 | 196.74 | +0.8% | +6.6% |
| `Selected work` | 36 | 231.95 | −2.4% | +2.5% |

Trirong runs wider than Playfair on these four. Across all 31 real display
strings the same holds — Trirong is **6.07%** mean absolute deviation against
Playfair's **2.63%**. This is the cost of the fix and it is real; it is reported
in full in §4.2.

### 3.2 Per-glyph advances

| | Playfair | Trirong |
|---|---|---|
| mean divergence over the 52-glyph alphabet | 8.26% | **7.97%** |
| worst single glyph | 29.44% (`J`) | 34.93% (`j`) |

Mean per-glyph advance improves slightly; the worst-case outlier is slightly
worse but on a different glyph.

### 3.3 Line wrapping

Measured by greedy word wrap, in the page's own resolved font, over the site's
**real display elements at their real container widths** — not a sample of
headings.

- **21 wrappable elements:** Trirong differs on **1**.
  - `Marta Kowalczyk` @28px/700 in a 226px card: 1 line → 2 lines.
    Playfair also differs on 1 (a different string, `Kamran Yusupov`), so the
    count is unchanged from before.
- **4 non-wrapping elements** (`.scramble` section titles and the nav CTA carry
  `white-space: nowrap`, so they never wrap — they extend past their container
  instead):
  - `Experience` — fits in both
  - `Selected work` — fits in both
  - `Get in touch` — fits in both
  - `What people say` @56px — fits in SK Zweig (418.8px in a 432px box),
    **extends 7.5px past the box in Trirong** (439.5px)

> Note on method: an earlier version of this test simulated wrapping for *every*
> display element and reported "2 of 25 differences", including a section title
> that appeared to break onto two lines. It does not — `.scramble` forces
> `nowrap`, and direct inspection of the rendered element showed a single 97px
> line at 56px type. The corrected test skips non-wrapping elements and reports
> the true count of 1.

---

## 4. Remaining deviation

### 4.1 Optical size is fixed; it is not identical

Caps are within 0.43% and ascenders within 3.04%, so headings now read at the
reference's size. It is still a different typeface: every letterform is a
different shape, and no metric substitution reaches identity. Only licensing SK
Zweig would.

### 4.2 The face runs ~6% wider than the reference

This is the significant remaining deviation and it is a genuine trade, not a
residual rounding error:

- mean absolute deviation across 31 real display strings: **6.07%** (Playfair: 2.63%)
- worst case: **38.4%**, on the hero numeral `01`

The worst case is a figure-style difference rather than a defect. SK Zweig uses
proportional figures — its `01` is 171.3px where `02` is 219.4px — while Trirong's
figures are tabular, so `01`, `02` and `03` all render at 237.15px. The hero's
three story-block numerals therefore align at a consistent width instead of
varying; arguably better for a numeral role, but not what the reference does.

The rest of the width excess is spread thinly: most strings are within 5%, and
the largest non-figure deviations are bold strings (`Ines Marques` +13.6%,
`Priya Raghunathan` +12.9%, the footer quote +15.1%), because Trirong's 700 is
wider than SK Zweig's.

Consequences are bounded and known: one testimonial name wraps to two lines, and
one section title extends 7.5px past its container into whitespace. Both are
documented in §3.3. There is no horizontal overflow at any of the eight audited
viewports.

### 4.3 x-height is now slightly under rather than slightly over

−3.67% against Playfair's −0.68%. Both are small and in the same direction; the
change is a consequence of gaining the ascender match and was accepted
deliberately.

### 4.4 Latin subset only

The display face loads `latin-400` and `latin-700` only. Trirong also ships
`thai`, `latin-ext` and `vietnamese` subsets which would add roughly 100 KB for a
site whose content is entirely English. If non-Latin display content is ever
added, the subset list in `nuxt.config.ts` needs extending.

### 4.5 The reference's own rendering is partly accidental

As recorded in the audit, the reference declares `PT Mono` for its loader digits
but never loads it. That is untouched here — the loader's serif stack is a
separate, deliberate choice documented in `P0_FIX_REPORT.md`.

---

## 5. Files changed

```
assets/styles/_tokens.scss     $font-display: Playfair → Trirong, with rationale
nuxt.config.ts                 font import: playfair index.css → trirong latin 400/700
package.json                   -@fontsource-variable/playfair-display
                               +@fontsource/trirong
docs/P1_TYPOGRAPHY_REPORT.md   this document
```

**No component file was modified.** `$font-display` is the single token behind
every display role the task names — hero display, section titles, card titles,
display numerals and the footer quote all reference it — so swapping the token
reaches exactly those roles and nothing else. Body typography is driven by
`$font-body` (Montserrat) and is untouched.

**Not touched:** hero parallax, loader, hero video, modal, gallery, testimonials,
contact, footer structure. Confirmed by `git diff --name-only`.

### 5.1 Font payload

| | before | after |
|---|---|---|
| display face files | 4 subsets (variable) | 2 static faces |
| display payload | 89,808 B | **41,660 B** |

A **53.6% reduction**. Playfair Display is fully removed from the build output —
verified by searching `.output/public/_nuxt` for `playfair*`, which returns
nothing.

### 5.2 Probe scripts added

```
scripts/audit/type-metrics.js         family + advance fingerprint
scripts/audit/type-precise.js         high-precision ascent read at 200px
scripts/audit/type-profile.js         full glyph-class profile
scripts/audit/type-ascents.js         reconciles string ascent vs cap height
scripts/audit/type-candidates.js      first-pass candidate sweep
scripts/audit/type-select.js          scored sweep with weight filter
scripts/audit/type-final-select.js    optical + real-string width scoring
scripts/audit/type-wrap-select.js     optical + wrapping scoring
scripts/audit/type-wrap-detail.js     which strings break, per candidate
scripts/audit/type-wrapping.mjs       wrap diff vs the live reference
scripts/audit/type-wrap-extract.js    real display elements + container widths
scripts/audit/type-extract-strings.js display strings in use
scripts/audit/type-real-strings.js    real strings at real sizes
scripts/audit/type-three-way.js       SK Zweig / Playfair / Trirong widths
scripts/audit/type-render-compare.js  visual shortlist render
scripts/audit/type-loadcheck.js       proves whether a webfont actually loaded
scripts/audit/type-sanity.js          validates candidate measurements
```

---

## 6. Verification

### 6.1 `npm run typecheck` — clean

Exit code 0, no output.

### 6.2 `npm run build` — succeeds

Client, SSR and Nitro all build. Build output confirms:

```
trirong-latin-400-normal.woff2    20.77 kB
trirong-latin-700-normal.woff2    20.89 kB
```

and no `playfair*` files anywhere in `.output`.

### 6.3 Responsive audit — 8/8 clean

`npm run audit:responsive`, all eight viewports (375, 390, 430, 768, 820, 1366,
1440, 1920):

- horizontal overflow: **no** at every viewport
- overflowing elements: **0** at every viewport
- responsive type tokens verified unchanged: `--ttitle` reports 32 / 32 / 32 /
  32 / 26 / 36 / 36 / 56px at the eight viewports, matching expectation exactly

Section heights shifted by under 1.5% (e.g. `about` 2965 → 2995 at 1440×900,
`contact` 1129 → 1139), which is the expected consequence of different font
metrics and not a layout change.

### 6.4 Font metric comparison — §3

Measured before and after against the live reference, per §3 and §4.

### 6.5 Visual check

The hero, testimonials section and section titles were rendered and inspected at
1440×900 and at mobile widths. The `What people say` title — the one flagged as
extending past its container — was inspected directly: it renders on a single
97px line at 56px type, unclipped, with no effect on the surrounding layout.

---

## 7. Status

**P1 typography complete** — the selected face is implemented and verified, with
the remaining deviation measured and documented.

Not complete: the audit's other P1 items (modal, footer quote randomisation,
inert parallax decision), all P2 and P3 items, and the `gsap.registerPlugin`
defect recorded in `P0_FIX_REPORT.md` §4.1. The portfolio is not finished.
