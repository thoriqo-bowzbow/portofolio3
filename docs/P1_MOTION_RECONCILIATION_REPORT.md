# P1 Motion Reconciliation Report

Makes the runtime match the **observed** live reference rather than the declared
intent of its markup, for the two parallax findings the audit raised as P1 and the
scroll affordance it raised as P2.

| finding | severity | outcome |
|---|---|---|
| `[Parallax — gallery images]` | P1 | motion removed |
| `[Parallax — testimonial images]` | P1 | motion removed |
| `[Navigation — scroll affordance]` | P2 | UI removed |

The portfolio is **not** complete. The remaining issues are listed in §6.

---

## 1. Gallery motion

### 1.1 The reference is inert — re-measured, not inherited

The audit reported the reference's gallery as inert, but the audit's own method
note warns that declared attributes and running motion are different things — and
on the hero the same team read a saturated value as a constant. So this was
re-measured with a 17-sample wheel sweep while the tiles were in view:

```
tick  scrollProxy  gallery translateY (all ten)
0     —           0 0 0 0 0 0 0 0 0 0
…
16    —           0 0 0 0 0 0 0 0 0 0

gallery moved across the sweep: false
```

Ten `.md-glrycard__image` elements, each carrying its own `data-scroll-speed`:

```
0.7245  0.2564  0.6162  0.8359  0.5881  0.1458  0.4670  0.4413  0.2129  0.7898
```

Note those are **not** the values the audit recorded (`0.4417  0.1527  …`). The
reference regenerates them on every page load. That is worth knowing on its own:
the attribute is randomised decoration, not authored configuration, which makes
"the motion never runs" more likely to be a defect than a deliberate choice — but
observed behaviour is what this build matches, and observed behaviour is static.

### 1.2 What was found locally

After `gsap.registerPlugin(ScrollTrigger)` was added in the hero-parallax pass, the
`useParallax` tween that had previously been silently discarded became genuinely
scroll-linked. Measured before the fix, 1440×900:

```
scroll    image translateY (first five of ten)
10458     94.5,  45.9,  45.9,  45.9,  45.9 …
10704     58.82, 25.65, 25.65, 41.1,  41.1 …
10949     21.77, 4.63,  4.63,  20.08, 20.08 …
11195     -15.42,-16.47,-16.47,-1.0,  -1.0 …
11441     -52.62,-37.58,-37.58,-22.… 
11687     -89.81,-45.9, -45.9, -43.24,…
11932     -94.5, -45.9, -45.9, -45.9, -45.9 …

image  samples=80  range -94.5 … 94.5  spread=189px  inView=true  →  MOVES
```

A 189px travel the reference does not have.

### 1.3 The fix

The `useParallax(root, image, …)` call and its now-unused `image` ref were removed
from `HighlightTile.vue`. After:

```
image  samples=80  range 0 … 0  spread=0px  inView=true  →  static
```

`inView=true` matters here: the tiles were on screen for every sample, so the
static result reflects absent motion rather than an element sitting outside its
trigger range.

### 1.4 Reservoir geometry preserved

The oversized, offset image is part of the reference's CSS and governs how the
image crops, so it was kept. Measured after the change:

```
gallery: cardH=350  imgH=560  heightPct=160  topPct=-30
         cssHeight=560px  cssTop=-105px  objectFit=cover  position=absolute
```

`160%` and `-30%` intact. Only the motion is gone.

---

## 2. Testimonial motion

### 2.1 The reference is inert

Same method, same sweep. Six `.md-rvwcard__image`, all with
`data-scroll-speed="1"` — a constant, unlike the gallery's randomised set — and
all reporting `translateY: 0` at every sampled position.

### 2.2 What was found locally

```
scroll    image translateY (all six)
11368     40.5,   40.5,   40.5,   40.5,   40.5,   40.5
11648     31.12,  37.87,  40.5,   40.5,   40.5,   40.5
11928     12.22,  18.97,  25.72,  33.82,  40.5,   40.5
12208     -6.68,  0.07,   6.82,   14.92,  21.… 
12489     -25.65, -18.9,  -12.15, -4.05,  …
12769     -40.5,  -37.8,  -31.05, -22.95, …
13049     -40.5,  -40.5,  -40.5,  -40.5,  -40.5,  -40.5

image  samples=48  range -40.5 … 40.5  spread=81px  inView=true  →  MOVES
```

An 81px travel, with the cards staggered against one another — the reference's
cards hold their staircase positions statically.

### 2.3 The fix

`useParallax` removed from `TestimonialCard.vue`, along with the `image` ref and
the inline `will-change: transform` on `.testimonial-card__image` — a compositor
hint for a transform that is no longer applied only pins the element to its own
layer for nothing.

```
image  samples=48  range 0 … 0  spread=0px  inView=true  →  static
```

### 2.4 Reservoir geometry preserved

```
testimonial: cardH=300  imgH=390  heightPct=130  topPct=-15
             cssHeight=390px  cssTop=-45px  objectFit=cover  position=relative
```

`130%` and `-15%` intact.

---

## 3. ScrollTrigger regression

**Registration is kept.** `plugins/gsap.client.ts` still registers ScrollTrigger
once, before mount. Its docblock was updated to state why it survives now that the
two consumers it once fixed have been removed: `useHeroParallax` depends on it, as
does the Lenis `scroll → ScrollTrigger.update` sync in `useSmoothScroll`.

Removing the plugin would break the hero parallax, so the registration is
untouched. Only the tweens that conflicted with the observed reference were
removed:

- `components/sections/HighlightTile.vue` — `useParallax` call deleted
- `components/sections/TestimonialCard.vue` — `useParallax` call deleted
- `composables/useParallax.ts` — **deleted**, both call sites gone

Its name was also the thing that caused the bug. `@mixin parallax-image` in
`_mixins.scss` asserted a behaviour the reference does not exhibit, and a mixin
named for a motion is exactly what makes "the reservoir exists, therefore motion
exists" look like evidence. It is now `reservoir-image`, documented as geometry
rather than motion. Both call sites updated.

**No console warnings.** With the plugin registered, GSAP no longer emits
`Invalid property scrollTrigger … Missing plugin?`; still 0 warnings, 0 page
errors after this pass.

---

## 4. Scroll-hint change

`[Navigation — scroll affordance]` (P2) recorded `.hero__scroll-hint` as extra UI
with no reference counterpart, and its recommended fix was removal. Removed:

```
template          the <button> and its two spans
styles            .hero__scroll-hint, .hero__scroll-hint-line
keyframes         @keyframes hero-hint (the looping scaleY)
responsive        the ≤768px bottom: 120px override
reduced-motion    the animation: none override
script            the now-unused const { goTo } = useAnchorNav()
```

Verified gone from both source and the live DOM:

```
source references to scroll-hint/hero-hint:  none
live DOM:  { hintEl: false, hintLine: false }
```

Section heights are unchanged at every viewport, as expected for an absolutely
positioned element.

---

## 5. Hero regression

The hero parallax must still follow `translateY rate = −speed / 45`. Measured at
three viewports, with the range derived from each hero's own height:

**1440×900** — hero 4500px, range 3600px:

```
scroll   progress  title     desc     countNum  countImg  infoTitle  infoDesc  infoActions
0        0         0         0        0         0         0          0         0
1125     0.3125    -200      -50      -150      -250      -12.5      -50       -12.5
2250     0.625     -400      -100     -300      -500      -25        -100      -25
3600     1         -640      -160     -480      -800      -40        -160      -40
```

**1366×768** — hero 3840px, range 3072px:

```
960      0.3125    -170.67   -42.67   -128      -213.33   -10.67     -42.67    -10.67
1920     0.625     -341.33   -85.33   -256      -426.67   -21.33     -85.33    -21.33
2880     0.9375    -512      -128     -384      -640      -32        -128      -32
```

**390×844** — hero 5064px, range 4220px:

```
1266     0.3       -225.07   -56.27   -168.8    -281.33   -14.07     -56.27    -14.07
2532     0.6       -450.13   -112.53  -337.6    -562.67   -28.13     -112.53   -28.13
4431     1.05→1    -750.22   -187.56  -562.67   -937.78   -46.89     -187.56   -46.89
```

Every value equals `−speed/45 × scrollY` exactly — for example at 1366×768,
`8/45 × 960 = 170.67`, `10/45 × 960 = 213.33`, `0.5/45 × 960 = 10.67`. The rate is
identical at all three viewports because it is expressed per pixel scrolled, and
the range adapts automatically from the element's height.

Also verified unchanged: the P0 video still scrubs (`currentTime` 7.94 with
`paused: true` and `opacity: 1` at the end of the hero range), the loader still
renders its odometer and dismisses, the header still switches to
`position: fixed` with `is-scrolled` past 100px, the display face is still Trirong,
and the header CTA still opens the modal.

### 5.1 Modal regression

All 22 interaction tests still pass after this pass:

```
22/22 passed — open from CTA, scroll lock, initial focus, Tab wrap both ends,
three-field validation, aria-invalid wiring, live word count, invalid-email
rejection, no fake success, Escape, scrim click, close button, focus restoration,
background scroll blocked
```

---

## 6. Verification

### 6.1 `npm run typecheck` — clean

Exit code 0.

### 6.2 `npm run build` — succeeds

Client, SSR and Nitro all build.

### 6.3 `npm run audit:responsive` — 8/8 clean

No horizontal overflow and 0 overflowing elements at 375, 390, 430, 768, 820,
1366, 1440 and 1920. `--ttitle` tokens unchanged. Section heights **identical** to
the pre-pass run, confirming the removals were layout-neutral.

### 6.4 Runtime sampling — three viewports

Gallery and testimonial images, sampled across each section's scroll range while
in view:

| viewport | gallery image | testimonial image |
|---|---|---|
| 1440×900 | 80 samples, range `0…0`, spread 0px, in view | 48 samples, range `0…0`, spread 0px, in view |
| 1366×768 | 80 samples, range `0…0`, spread 0px, in view | 48 samples, range `0…0`, spread 0px, in view |
| 390×844 | 80 samples, range `0…0`, spread 0px, in view | 48 samples, range `0…0`, spread 0px, in view |

**Effectively static at every viewport and every position — matching the
reference's measured behaviour.**

Hero layers: moving at exactly `−speed/45` at all three viewports (§5).

### 6.5 No console errors

```
page errors:              0
console warnings/errors:  0
```

### 6.6 Files changed

```
components/sections/HighlightTile.vue     useParallax + ref removed; mixin call renamed
components/sections/TestimonialCard.vue   useParallax + ref + will-change removed
components/sections/HeroSection.vue       scroll hint removed (−60 lines)
assets/styles/_mixins.scss                parallax-image → reservoir-image, will-change dropped
plugins/gsap.client.ts                    docblock: why registration survives
composables/useParallax.ts                DELETED — both call sites gone
scripts/audit/ref-gallery-sweep.mjs       NEW  reference inertness sweep
scripts/audit/local-motion-sweep.mjs      NEW  reusable runtime motion sweep
scripts/audit/motion-reconciliation-verify.js  NEW  geometry + feature probe
scripts/audit/parallax-regression.js      docblock updated to the new expectation
```

**Not touched**, per the goal: typography, modal, footer quote, contact, image
artwork. `git diff --name-only` confirms.

---

## 7. Remaining issues

Open from `FINAL_FIDELITY_AUDIT.md`, with what has been cleared since:

**Cleared**

```
P0  Hero — atmosphere asset and behaviour        P0_FIX_REPORT.md
P0  Loader / intro sequence                      P0_FIX_REPORT.md
P1  Typography — display family identity         P1_TYPOGRAPHY_REPORT.md
P1  Typography — cap-height / optical size       P1_TYPOGRAPHY_REPORT.md
P1  Hero — layer parallax                        P1_HERO_PARALLAX_REPORT.md
P1  Parallax — gallery images                    this pass
P1  Parallax — testimonial images                this pass
P1  Navigation — primary CTA                     P1_MODAL_REPORT.md
P2  Navigation — scroll affordance               this pass
```

**Still open**

```
P1  Content — image composition
P2  Hero — cut-out layer positioning
P2  Structure — section spacing and heights
P2  Content — footer quote (randomises per load in the reference)
P3  Typography — per-glyph proportions
P3  Typography — font rendering and face registration
P3  Navigation — heading semantics
P3  Structure — data-scroll-sticky declared but inert
P3  Scroll — text reveal
```

**Open by decision, not oversight.** `P1_HERO_PARALLAX_REPORT.md` §4 records three
places where live measurement contradicted the audit and the specified behaviour
was implemented anyway, pending a product call:

- the reference's hero rate is `−speed/10` with a one-viewport range, not
  `−speed/45` over the hero range (§4.1, §4.2)
- the reference disables hero parallax entirely on phones; this build enables it
  (§4.3)
- the reference's story-block info column overlaps itself as it scrolls, and so
  does this build's, because the speeds are reproduced faithfully (§4.4)

`P1_MODAL_REPORT.md` §5.3 records the reference's second modal — the "Leave yours"
review variant with photo upload — as unimplemented, its content never having
populated reliably enough to capture.

---

## 8. Status

**Motion reconciliation complete.** The gallery and testimonial images are now
static, matching the observed reference; the invented scroll hint is gone; the
reservoir geometry that governs cropping is preserved; and the hero parallax, video
scrub, loader, header, modal and responsive layout all still verify at three
viewports.

The portfolio is still not finished — the issues in §7 remain, and the P0/P1/P2/P3
backlog has not been exhausted.
