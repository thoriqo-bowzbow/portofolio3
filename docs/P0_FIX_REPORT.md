# P0 Fix Report

Implements the two P0 findings from [`FINAL_FIDELITY_AUDIT.md`](FINAL_FIDELITY_AUDIT.md):

1. **Hero atmosphere** — replace the static SVG backdrop with an original
   scroll-scrubbed `<video>`.
2. **Loader** — replace the five-column curtain with the odometer reveal the
   reference actually uses.

P1, P2 and P3 findings were **not** touched. The project is not complete; only
these two items are.

---

## 1. What changed

### 1.1 Hero atmosphere — P0 finding 1

The hero's pinned atmosphere is now two stacked layers: the existing
`hero-backdrop.svg` paints immediately and remains as poster/fallback, and an
original scroll-scrubbed WebM fades in above it once it can render a frame.

**Original media, generated not sourced.** `scripts/generate-hero-sequence.mjs`
renders 192 frames (24 fps × 8s) at 320×180 and pipes them to ffmpeg, which
upscales with lanczos and encodes VP9. Nothing is downloaded, copied or derived
from the reference's `vidos_scroll_2k.webm` — the frames are composed from a
small deterministic noise model in the same palette family as the existing SVG,
so the poster and the first video frame agree and there is no visible switch.

| Variant | Resolution | Size |
|---|---|---|
| `hero-atmosphere.webm` | 1920×1080 | 31 271 B |
| `hero-atmosphere-540.webm` | 960×540 | 14 932 B |

Both variants together are **46 KB** — smaller than a single mid-size JPEG, and
small enough that the whole clip buffers almost immediately, which is what makes
frame-accurate seeking affordable.

**Behaviour.** `currentTime` is driven from hero scroll progress one-to-one. The
video is never played: it stays `paused` for its entire life and is only seeked.
A `<video>` with no `src` in the template means nothing is fetched when the
feature is disabled.

**Requirements from the brief, and where each is satisfied:**

| # | Requirement | Implementation |
|---|---|---|
| 1 | Original visual sequence | `scripts/generate-hero-sequence.mjs`, fully generative |
| 2 | No reference media | No network fetch of any reference asset |
| 3 | Rendered as WebM | VP9 in Matroska/WebM via ffmpeg |
| 4 | ~8s of progression | 8.000s exactly (ffprobe) |
| 5 | `<video>` element | `.hero__video` |
| 6 | Muted + playsinline | `muted playsinline` attributes |
| 7 | Must not autoplay | `autoplay` absent; `play()` never called; `paused` asserted true in every verification sample |
| 8 | `currentTime` from scroll | `useScrubVideo`, one seek per animation frame |
| 9 | Existing 500vh hero | Reused unchanged |
| 10 | SVG as poster/fallback | Base layer under the video **and** `poster` attribute |
| 11 | Preserve z-index | Video sits inside `.hero__atmosphere` (z 0); `.hero__holder` remains z 2, so the cut-out still crosses over the name |
| 12 | Preserve responsive | Mobile uses large-viewport units and a 540p source; 8/8 viewports clean |
| 13 | Reduced motion safe path | Feature is skipped entirely — no `src` is set at all |
| 14 | No layout shift | Both layers `position: absolute; inset: 0`; section heights byte-identical before and after |
| 15 | Mobile performance | 960×540 source on ≤768px — a quarter of the decode cost |

**Why this does not use ScrollTrigger** — see §4.1. This is the one notable
design decision in the fix and it is deliberate.

### 1.2 Loader — P0 finding 2

`SiteLoader.vue` was rewritten from the five-column curtain into a white field
with a rolling odometer. The curtain is gone, not preserved.

The reference was **re-inspected before implementing**, with a sampler injected
before page load so the whole sequence was captured. Measured against it:

| Property | Reference | Implementation |
|---|---|---|
| Field | full screen, `#fff`, `fixed`, `z-index: 11` | same |
| Padding (≥769px) | `100px 150px` | same |
| Alignment | `flex-end` / `flex-end` (bottom-right) | same |
| Padding (≤768px) | `50px 0`, bottom-**centre** | same |
| Counter box | `[957, 593, 333, 207]` at 1440×900 | **`[957, 593, 333, 207]`** |
| Window | 333.013 × 207.188, `overflow: hidden` | same |
| Columns | 3 × 93px at x 0 / 111.004 / 222.009 | same |
| Glyph | 185px, line box 213px, pure black | same |
| Digit font | `PT Mono` declared but **never loaded** → browser serif | explicit `'Times New Roman', Times, Georgia, serif` |
| Hold at 000 | ~740ms | ~960ms (see §4.4) |
| Roll to 100 | ~2770ms | 2782ms |
| Hold at 100 | ~1240ms | 1200ms |
| Exit fade | ~1000ms | 1000ms |
| Total | ~5742ms | ~6002ms |

Timing was derived from a 331-sample capture of the reference's overlay at
100ms intervals, not from its CSS alone.

**Counter mechanism.** Three wheels, each a vertical strip of digits translated
so the target sits in a fixed window. Strips are 2 / 11 / 41 items for
hundreds / tens / units — the same proportion the reference uses, because a
100-step units strip would spend 101 DOM nodes to express something only the
last few cycles of which are ever legible.

The easing is `easeInOutQuad`. That is not a guess: the reference's normalised
wheel travel measures 0.014 / 0.091 / 0.272 / 0.510 / 0.776 / 0.940 at
9 / 23 / 39 / 55 / 73 / 90 percent of elapsed time, which tracks it closely, and
the reference's declared animation curve is `ease-in-out`.

**Accessibility.** The overlay is a real `role="progressbar"` exposing a live
`aria-valuenow`, and the rolling digit strips are `aria-hidden` so a screen
reader is not read a stream of digit noise. All dimensions derive from a single
`--odo-scale` token so the numeral scales below 360px instead of overflowing.

**Requirement 7 — cannot block the application.** The overlay is
`pointer-events: none`, so it cannot trap input even if it lingered, and it
dismisses on a timer chain that does not depend on animation completion.

**Requirement 8 — direct navigation and reload.** The overlay and the `000`
state are both in the server-rendered output, so the server and the first client
frame agree. An earlier version branched the markup on `prefers-reduced-motion`,
which made the server emit one variant and the client swap to the other on
hydration — a flash of the wrong state. That is fixed: the counter renders
unconditionally and takes an `instant` prop instead.

---

## 2. Files changed

**Added**

```
scripts/generate-hero-sequence.mjs      original WebM generator (ffmpeg pipeline)
composables/useScrubVideo.ts            scroll → currentTime driver
components/ui/OdometerCounter.vue       rolling-digit counter
public/media/hero-atmosphere.webm       1920×1080, 31 271 B
public/media/hero-atmosphere-540.webm   960×540,  14 932 B
docs/P0_FIX_REPORT.md                   this document
scripts/audit/loader-sampler.js         reference timing capture
scripts/audit/loader-geometry.js        reference geometry capture
scripts/audit/impl-loader-sampler.js    implementation timing capture
scripts/audit/impl-video-probe.js       implementation scrub probe
```

**Modified**

```
components/layout/SiteLoader.vue        rewritten: curtain → odometer reveal
components/sections/HeroSection.vue     video layer added to .hero__atmosphere
package.json                            "assets:hero-video" script
```

**Not touched** (out of scope, confirmed by timestamp check): gallery parallax,
testimonial parallax, typography, modal, footer, contact, mobile navigation,
hero layer parallax.

---

## 3. Verification

Every check below was run twice: once against the Nuxt dev server during
development, and again from a clean checkout state — `npm run typecheck`,
`npm run build`, then a fresh `node .output/server/index.mjs` process driving a
fresh browser session. Both passes agree; the figures quoted are from the second.

### 3.1 `npm run typecheck` — clean

No output. Zero errors across the project, including the new composable and
component.

### 3.2 `npm run build` — succeeds

Client + SSR + Nitro all build. New chunks confirmed present:
`OdometerCounter-styles.*.mjs`. Both `.webm` files appear in
`.output/public/media/`.

### 3.3 Application runs

Dev server and the **production server** (`node .output/server/index.mjs`) both
serve the page. Production SSR payload 124 095 B.

Everything in §3.4–§3.7 was re-run against the **production build** on a clean
`node .output/server/index.mjs` process, not just the dev server. Both report the
same results; the numbers below are the production figures.

### 3.4 Loader verified

Sampled at 100ms intervals across its whole life via an injected sampler, on the
production server.

```
first sample  t=41ms    value=0    overlay=1440×900   padding=100px 150px
                        align=flex-end/flex-end     bg=rgb(255,255,255)
                        counter=[957, 593, 333, 207]
                        glyph=Times New Roman 185px / line-height 213px / #000

value changes 41ms → 877ms   value 0      (hold at 000)
              877ms → 3658ms counts 1 … 100  (2781ms roll)
              4858ms        fade begins      (1200ms hold at 100)

final state   value=100   cls="site-loader is-fading"
              digitTys=[-213, -2130, -8520]

distinct values: 101        monotonic: yes
```

101 distinct values, strictly monotonic from `0` to `100`. Every digit wheel is
in continuous motion through the roll; the hundreds wheel reaches its stop first,
then tens, then units (`-213` is settled while units is still at `-8498` of
`-8520` in the dev trace).

Additional checks:

- **Geometry equals the reference** — counter rect `[957, 593, 333, 207]`, padding
  `100px 150px`, `justify-content: flex-end`, glyph `Times New Roman`. These are
  the exact values measured from the reference, to the pixel.
- **ARIA** — `role="progressbar"`, `aria-label="Loading"`, `aria-valuemin="0"`,
  `aria-valuemax="100"`, live `aria-valuenow` mid-roll; digit columns
  `aria-hidden="true"`; overlay `pointer-events: none`.
- **Dismisses** — `loader dismissed` after ~6s in both dev and production.
- **Reload** — verified across many reloads; the server-rendered `000` matches the
  first client frame with no flash.
- **Mobile** — at 390×844 the counter is bottom-centre at `--odo-scale: 0.86`, no
  horizontal overflow.
- **Visual** — captured at three points: the `000` hold, mid-roll, and settled on
  `100`. Mid-roll captures show partial glyphs clipped at the window edges, which
  is the intended odometer effect.

### 3.5 Hero scrub verified

Production server, wheel-scrolled through the hero's 500vh range:

| scrollY | heroProgress | currentTime | paused | opacity |
|---|---|---|---|---|
| 0 | 0 | 0 | true | 1 |
| 600 | 0.167 | 1.333 | true | 1 |
| 1200 | 0.333 | 2.667 | true | 1 |
| 1800 | 0.5 | 4 | true | 1 |
| 2400 | 0.667 | 5.333 | true | 1 |
| 3000 | 0.833 | 6.667 | true | 1 |
| 3600 | 1 | 7.94 | true | 1 |

`currentTime = heroProgress × 8` exactly (7.94 is the 0.06s end-epsilon).
`paused` is `true` in **every** sample — the brief's requirement 7.
`readyState: 4`, `videoW: 1920`, `videoH: 1080`, `opacity: 1`.

Mobile variant selection at 390×844: `src = hero-atmosphere-540.webm`,
`videoW: 960`, `videoH: 540`, `rect: [390, 844]` — fills the viewport.

### 3.6 Reduced motion verified

With `prefers-reduced-motion: reduce` forced:

```
src: null   readyState: 0   networkState: 0   opacity: 0   paused: true
```

No source is set, so **no video is requested at all**. The SVG backdrop is the
sole atmosphere. The loader renders the settled `100` with no rolling and
dismisses after 500ms.

### 3.7 No horizontal overflow

`npm run audit:responsive` against the **production server** — **8/8 viewports
clean**, zero overflowing elements at 375, 390, 430, 768, 820, 1366, 1440 and
1920.

Section heights are byte-identical to the pre-fix measurements
(`hero: 4500`, `about: 2965`, `experience: 3759`, `highlights: 910`,
`testimonials: 1151`, `contact: 1129`, `site-footer: 900` at 1440×900),
confirming requirement 14 — no layout shift.

### 3.8 No console errors

`0 page errors` in both dev and production after a fresh browser session.

> Note: an intermediate run reported 12 `ScrollTrigger.create` errors. Those came
> from a stale Vite-transformed module cached in the **browser**, not from the
> source — line 58 of the current file is an unrelated destructuring statement,
> and a fresh browser context on the same dev server reported zero. Confirmed by
> re-running in a new session and against the production build.

### 3.9 Accessibility unchanged

axe-core before and after: **45 passes, 1 violation, 1 incomplete** — identical
counts, identical ratios (`1.04` on 3 hero nodes axe cannot evaluate over an
image, `1.95` on 7 dormant ink-in fragments). No new issues from either fix.

---

## 4. Remaining limitations

### 4.1 The codebase has a missing GSAP plugin registration

**`gsap.registerPlugin(ScrollTrigger)` is never called anywhere in the
repository.** Every `scrollTrigger:` tween config is therefore silently
discarded, and GSAP logs `Invalid property scrollTrigger … Missing plugin?` for
each one.

This was discovered while wiring the video and is **left unfixed**, because
fixing it would change the behaviour of `useParallax` — the gallery and
testimonial tweens — which this pass was told not to touch.

Two consequences worth recording:

- **It also corrects a claim in the audit.** `FINAL_FIDELITY_AUDIT.md` describes
  this implementation's gallery parallax as "active" on the basis of a measured
  `translateY` of `−94.5`. That reading is right but the mechanism was wrong:
  with the plugin missing, GSAP runs `gsap.fromTo` as a plain 0.5s tween, so the
  image animates once and is then left permanently offset. It is not a running
  parallax; it is a one-shot displacement that never gets scrubbed. The finding's
  *conclusion* (the reference's is inert, this one moves) still holds — the
  severity is simply higher than reported.
- **It is why P0-1 avoids ScrollTrigger.** Depending on that plugin would have
  made the scrub fail the same way. Progress is derived directly from the hero's
  bounding rect once per frame instead — exact, cheap, and with no plugin
  prerequisite.

Recommended as its own follow-up: register the plugin, then re-evaluate the
gallery and testimonial parallax against the reference (which is where the audit's
P1 items 6 and 7 already sit).

### 4.2 The atmosphere is generated, not photography

The reference's backdrop is a 2560×1440 photograph-driven video. This is a
generated gradient field in the same palette as the existing SVG. The scroll
*behaviour* now matches; the imagery does not, and cannot without original
photography. Recorded as audit P1 item 9.

### 4.3 No adaptive source switching

The variant is chosen once, at mount, by a media query. Rotating a device across
the 768px boundary will not re-pick the source — it keeps the one it loaded.
Re-picking would mean reloading and re-seeking the video mid-scroll, which is a
worse experience than the extra decode cost it saves. A `<source media>` list was
considered and rejected: `media` on `<video>` sources is inconsistently
implemented, and a non-matching pair can leave the element with no source at all.

### 4.4 The counter starts later than the reference's

The reference's roll begins ~740ms after navigation. This one begins ~960ms,
because the counter's clock starts when Vue hydrates rather than when the
document does. The roll itself is the same length (2782ms vs ~2770ms), so the
whole sequence is ~260ms longer end to end. Closing that gap would mean starting
the animation from a blocking inline script, which would cost more than the
delay it removes.

### 4.5 The units wheel is not a true 100-step roll

The units strip is 41 items, matching the reference's proportion, so it cycles
through roughly four visible revolutions rather than ten. At the speed it turns
this is not legible as a count — it reads as a blur settling on the right digit,
which is the intended effect — but it is not mechanically literal. A 101-item
strip would be literal and would cost 60 more DOM nodes for no visible gain.

### 4.6 The reference's odometer font is an accident

The reference declares `font-family: PT Mono` for its digits but never loads PT
Mono, so they render in the browser's default serif. This implementation asks for
`'Times New Roman', Times, Georgia, serif` explicitly, which reproduces the
observed rendering on Windows/macOS deterministically rather than depending on a
font being absent. On platforms whose default serif differs the two will diverge
slightly — but the reference diverges too, and for the same reason.

### 4.7 Not verified on physical devices

Mobile behaviour was verified by viewport emulation and by the reduced-motion and
Save-Data code paths, not on real hardware. VP9 seek performance on a low-end
phone is the main open risk; the 540p variant exists to mitigate it but has not
been measured on a real device.

---

## 5. Status

**P0 complete — both findings implemented and verified.**

Not complete: P1 (7 items), P2 (4), P3 (5) from the audit remain open, plus the
plugin-registration defect recorded in §4.1. The portfolio project as a whole is
not finished.
