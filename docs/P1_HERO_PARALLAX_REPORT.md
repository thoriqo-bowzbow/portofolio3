# P1 Hero Layer Parallax Report

Implements the hero layer-parallax finding from
[`FINAL_FIDELITY_AUDIT.md`](FINAL_FIDELITY_AUDIT.md) — §`[Hero — layer parallax]`
(P1, "borderline P0").

It also implements the **centralized ScrollTrigger registration** the same audit
pass discovered was missing, which was a prerequisite: without it, no scroll-linked
tween in this repository could run.

> ## ⚠️ CORRECTION — the rate, the mobile behaviour and the anchoring were all wrong
>
> **This section supersedes §1.2, §2.1, §2.2, §4.1 and §4.3 below.** Those sections
> describe the first implementation, which used `−speed / 45` on every viewport.
> That was wrong on all three counts and has been corrected. The superseded sections
> are kept so the reasoning trail stays intact, but **do not read them as the
> current behaviour.**
>
> Corrections 1 and 2 below are separate defects found at different times. 1 is the
> rule itself; 2 is the measurement that feeds it — the rule was right on paper and
> still produced wrong offsets on screen.
>
> ### Correction 1 — the rule
>
> **1. The rate was 4.5× too small.** The original implementation used
> `−speed / 45`, taken from `FINAL_FIDELITY_AUDIT.md`. The audit had derived that
> constant by dividing one layer's travel by a recorded `scrollY` of 1620 — but the
> real scroll offset at that moment was 360. `1620 / 360 = 4.5`, and `45 / 10 = 4.5`,
> so the audit's constant came out exactly 4.5× too small. This document's own §4.1
> identified the error but the specified value was implemented anyway, because the
> task named the audit authoritative. The live measurement is `−speed / 10`.
>
> **2. Parallax runs on desktop only.** The first implementation enabled it at every
> viewport. The reference does not: sweeping nine widths, the hero title reads
> `−287.5` at 1024px with native scroll pinned at 0, and `0` at 1023px with native
> scroll at 2100. The switch is exactly at **1024px**.
>
> ### The corrected rule
>
> ```
> translateY per px scrolled = −speed / 10        (min-width: 1024px only)
> ```
>
> | layer | speed | rate |
> |---|---|---|
> | hero title | 8 | −0.800 |
> | intro card | 2 | −0.200 |
> | story numeral | 6 | −0.600 |
> | story portrait | 10 | −1.000 |
> | story title | 0.5 | −0.050 |
> | story description | 2 | −0.200 |
> | story actions | 0.5 | −0.050 |
>
> ### Anchoring
>
> A single rate is not enough — the layers are not all anchored in the same place,
> and driving them all from the hero's top would fling the story layers far above
> their own blocks.
>
> - **Title and description** are anchored at the hero's top and saturate after one
>   viewport. At a 900px viewport that produces `−720` and `−180`, against the
>   reference's measured `−717.83` and `−179.46` — within 0.3%.
> - **Story layers** are anchored where their own centre crosses the viewport
>   centre, and saturate half a viewport either side. That gives ±450 for the
>   portrait at a 900px viewport, against the reference's measured ±428
>   (`+479` on approach, `−377` on exit).
>
> The title and description are therefore **not** constant offsets. The audit's
> `−718.39` / `−179.60` are the *saturated end states*, sampled after the motion had
> already frozen; `−718.39 / 8 = −179.60 / 2 = −89.8` is the giveaway that both
> scale with speed.
>
> ### Correction 2 — the measurement bug that broke the anchoring
>
> The rule above was in place, but the story layers did not follow it. The
> anchoring was measured from the wrong thing, and it took a re-run of the
> verification to catch it.
>
> **What was wrong.** `measureLayers` read `getBoundingClientRect()` on elements
> that already carried the `y` we had written to them. A rect reports the element
> *after* its transform, so every refresh folded the current offset into the stored
> anchor — and the anchor then moved the offset again. Separately, the window
> length was cached at refresh time, so a viewport whose height changed without a
> refresh firing left the layers clamped against the *previous* viewport's
> boundaries.
>
> **Evidence — identical viewport, identical scroll, different result.** At
> 1440×900, `scrollY 1345`, before and after a resize out to 1920×1080 and back:
>
> ```
>                             1440×900, scrollY 1345
>                  before resize      after resize       correct
>   title                −720              −864            −720
>   desc                 −180              −216            −180
>   countImg             +450              +540            +75
> ```
>
> `−864` is `−0.8 × 1080`: the 1080px viewport's saturation value, still being
> applied on a 900px viewport. The story layers were the same class of error in the
> other direction — pinned against one end of their window, crossing to the other
> end abruptly rather than tracking scroll. At 1440×900 and `scrollY 0` the same
> layer read `+284.5` in one run and `+450` in another, which is not reproducible
> behaviour.
>
> **The fix.** `composables/useHeroParallax.ts` now:
>
> 1. subtracts the applied `y` before measuring, so the stored value is layout and
>    not layout-plus-current-offset;
> 2. stores only the layer's centre **relative to the hero's top**, which is the
>    space `apply` already receives its scroll value in;
> 3. derives both the anchor and the window from the **live** `window.innerHeight`
>    inside `apply`, so the two viewport-dependent quantities in the rule cannot go
>    stale between refreshes.
>
> This is a fix to how the rule is measured, not a change to the rule. No
> breakpoint, speed, saturation window or DOM structure moved.
>
> **After the fix**, at the same 1440×900 / `scrollY 1345`: title `−720`,
> desc `−180`, `countNum` `0`, `countImg` `+75` — and the same values before and
> after the resize round trip. `countNum` at exactly `0` is the anchor rule working:
> the numeral sits at its layout position at the moment its centre crosses the
> viewport centre.
>
> ### Mobile
>
> Below 1024px the composable creates no triggers at all, via
> `gsap.matchMedia('(min-width: 1024px)')`, so every layer keeps its layout
> transform and crossing the breakpoint in either direction rebuilds cleanly. The
> P0 video scrub is **not** affected — it is a separate mechanism, and it still
> runs on mobile with the 540p variant.
>
> The threshold is exact, checked at the boundary rather than only at the wide and
> narrow ends: at **1023×768** all seven layers read `0` at every sampled scroll
> position, and at **1024×768** all seven run at the rates in the table above.
>
> ### Final verification
>
> Rate measured from runtime transforms across the linear span of each layer's
> travel:
>
> | viewport | title | desc | countNum | countImg | infoTitle | infoDesc | infoActions | result |
> |---|---|---|---|---|---|---|---|---|
> | 1366×768 | −0.8000 | −0.2000 | −0.6000 | −1.0000 | −0.0500 | −0.2000 | −0.0500 | all ok |
> | 1440×900 | −0.8000 | −0.2000 | −0.6000 | −1.0000 | −0.0500 | −0.2000 | −0.0500 | all ok |
> | 1920×1080 | −0.8000 | −0.2000 | −0.6000 | −1.0000 | −0.0500 | −0.2000 | −0.0500 | all ok |
> | 390×844 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | no parallax |
>
> Saturation scales with the viewport as it should: the title freezes at `−614.4`
> at 768px tall, `−720` at 900px, and `−864` at 1080px — exactly `−0.8 × viewport`.
>
> The story layers track rather than pin. Each passes through zero at its own anchor
> and saturates half a viewport either side, so the amplitude scales with the
> viewport too:
>
> | viewport | `countNum` travel | zero crossing | `countImg` travel |
> |---|---|---|---|
> | 1366×768 | `+230.4 … −230.4` | between 768 and 1152 | `+384 … −384` |
> | 1440×900 | `+270 … −270` | `scrollY 1345` | `+450 … −450` |
> | 1920×1080 | `+324 … −324` | between 1080 and 1620 | `+540 … −540` |
> | 390×844 | `0` | not applicable | `0` |
>
> Reduced motion: at 1440×900 with `prefers-reduced-motion: reduce` forced, all
> seven layers read `0` at both `scrollY 0` and `scrollY 3600` (hero progress 1) —
> no triggers are created at all. The P0 video is skipped independently, as designed
> (`currentTime 0`, `duration null`, `opacity 0`).
>
> Regression checks after the fix: `npm run typecheck` clean and `npm run build`
> succeeds (client, SSR and Nitro); `npm run audit:responsive` **8/8 clean** — no
> horizontal overflow and 0 overflowing elements at all eight viewports, with
> section heights unchanged from the pre-parallax run (1440×900 still reports
> `about:2995` / `contact:1139`, the values the typography pass recorded);
> **0 page errors and 0 console warnings**, with no ScrollTrigger messages; the
> loader still renders its odometer and dismisses on schedule; the P0 video still
> scrubs (`currentTime 7.94` of 8, `paused: true`, `opacity: 1` at the end of the
> hero range); the gallery and testimonial images remain static at `0`; and all
> 22 modal interaction tests pass.
>
> The superseded sections below are retained as a record. §4.2 (title and
> description are not constant offsets) and §4.4 (the info column decomposes, in the
> reference too) remain accurate. §4.5 is partly superseded and carries its own note.

The portfolio is **not** complete. The audit's other P1 items and all P2/P3 items
remain open.

---

## 1. What changed

### 1.1 Centralized ScrollTrigger registration

**The defect.** `gsap.registerPlugin(ScrollTrigger)` was never called anywhere in
the repository. Consequences, confirmed live:

- Every `scrollTrigger:` tween config was silently discarded with
  `Invalid property scrollTrigger … Missing plugin?`
- `useParallax` — used by the gallery and testimonials — therefore ran as a plain
  0.5s tween. The image animated once to its end offset and stayed there. It was
  never scroll-linked.
- This is why the P0 video scrub deliberately avoided ScrollTrigger.

**The fix.** `plugins/gsap.client.ts` registers it exactly once, before any
component setup. A Nuxt plugin rather than a composable, because plugins are
guaranteed to run before the app mounts — registering inside `useSmoothScroll`
would have worked only by accident of mount order, and `useParallax` would still
be able to run first.

Verified: no `Invalid property scrollTrigger` and no `Please gsap.registerPlugin`
messages appear anywhere in the console (0 warnings total), where previously there
were dozens per page load.

### 1.2 Hero layer parallax

`composables/useHeroParallax.ts` drives seven layers from one ScrollTrigger.

```
translateY per px scrolled = −speed / 45
```

applied over the hero's own range (`start: 'top top'`, `end: 'bottom bottom'`), so
the motion begins at the hero top and resolves at the hero bottom.

| layer | selector | speed | rate |
|---|---|---|---|
| hero title | `.hero__title` | 8 | −0.17778 |
| intro card | `.hero__desc-text` | 2 | −0.04444 |
| story numeral | `.hero-block__count-num` | 6 | −0.13333 |
| story portrait | `.hero-block__count-image` | 10 | −0.22222 |
| story title | `.hero-block__info-title` | 0.5 | −0.01111 |
| story description | `.hero-block__info-desc` | 2 | −0.04444 |
| story actions | `.hero-block__info-actions` | 0.5 | −0.01111 |

**Two deliberate implementation choices:**

1. **The title's transform is applied to its wrapper `.hero__title`, not to
   `.hero__title-text`.** The hero entrance animation tweens `y` on the text
   element itself (`gsap.fromTo(wordRef, { y: 60 }, { y: 0 })`). Both writing `y` to
   the same element would fight: a scroll during the 1.4s entrance would snap the
   name. The wrapper is a full-viewport flex box, so displacing it moves the name
   by exactly the same amount with no shared property.
2. **One ScrollTrigger, not seven.** The layers share the same range, so a single
   trigger tweens a proxy and one pass writes every layer's `y`. Seven triggers
   over the same range would each re-measure on refresh for no benefit.

The story layers resolve with `querySelectorAll`, so all three blocks drift —
21 elements in total.

### 1.3 Files

```
plugins/gsap.client.ts                    NEW  centralized registration
composables/useHeroParallax.ts            NEW  the seven-layer drift
components/sections/HeroSection.vue       +1 line to wire it in (plus a comment)
scripts/audit/hero-parallax-impl.js       NEW  runtime transform probe
scripts/audit/hero-parallax-sweep.mjs     NEW  scroll sweep + rate check
scripts/audit/ref-hero-sweep.mjs          NEW  reference measurement sweep
scripts/audit/ref-block-overlap.js        NEW  reference info-column overlap check
scripts/audit/scroll-reference-probe.js   NEW  reference scroll-reference probe
scripts/audit/scroll-offset-probe.js      NEW  reference scroll-offset probe
scripts/audit/parallax-regression.js      NEW  gallery/testimonial regression check
docs/P1_HERO_PARALLAX_REPORT.md           NEW  this document
```

No other component, composable or style file was modified. Gallery and testimonial
code is untouched.

---

## 2. Verification

### 2.1 Runtime transforms — desktop 1440×900

Hero 4500px, viewport 900px, range **3600px**. Sampled at nine scroll positions
across the full range, reading `getComputedStyle().transform` matrix index 13.

```
scroll   progress       title       desc   countNum   countImg  infoTitle   infoDesc  infoActions
0        0                  0          0          0          0          0          0          0
450      0.125            -80        -20        -60       -100         -5        -20         -5
900      0.25            -160        -40       -120       -200        -10        -40        -10
1350     0.375           -240        -60       -180       -300        -15        -60        -15
1800     0.5             -320        -80       -240       -400        -20        -80        -20
2250     0.625           -400       -100       -300       -500        -25       -100        -25
2700     0.75            -480       -120       -360       -600        -30       -120        -30
3150     0.875           -560       -140       -420       -700        -35       -140        -35
3600     1               -640       -160       -480       -800        -40       -160        -40
```

```
layer        speed   measured    expected    result
  title       8       -0.17778   -0.17778  ok
  desc        2       -0.04444   -0.04444  ok
  countNum    6       -0.13333   -0.13333  ok
  countImg    10      -0.22222   -0.22222  ok
  infoTitle   0.5     -0.01111   -0.01111  ok
  infoDesc    2       -0.04444   -0.04444  ok
  infoActions 0.5     -0.01111   -0.01111  ok
```

Every layer is exactly linear and every measured rate matches `−speed / 45` to
five decimal places. The first sample confirms the motion starts at the hero top
(all offsets 0 at progress 0).

### 2.2 Runtime transforms — mobile 390×844

Hero 5064px, viewport 844px, range 4220px — the range is derived from the element,
so it adapts without any breakpoint logic.

```
scroll   progress       title       desc   countNum   countImg  infoTitle   infoDesc  infoActions
0        0                  0          0          0          0          0          0          0
1055     0.25         -187.56     -46.89    -140.67    -234.44     -11.72     -46.89     -11.72
2110     0.5          -375.11     -93.78    -281.33    -468.89     -23.44     -93.78     -23.44
3165     0.75         -562.67    -140.67       -422    -703.33     -35.17    -140.67     -35.17
4220     1            -750.22    -187.56    -562.67    -937.78     -46.89    -187.56     -46.89
```

All seven rates match. Mobile parallax is enabled — see §4.3 for how that differs
from the reference.

### 2.3 Reduced motion

With `prefers-reduced-motion: reduce` forced, every layer stays at `0` at all three
sampled positions (progress 0, 0.5, 1). The composable returns before creating the
trigger, so no inline transforms are written at all.

The P0 video path is unaffected and still skips: `src: null`, `readyState: 0`,
`opacity: 0` — no video is requested.

### 2.4 `npm run typecheck` — clean

Exit code 0, no output.

### 2.5 `npm run build` — succeeds

Client, SSR and Nitro all build. `registerPlugin` is present in
`.output/server/chunks/build/server.mjs`, confirming the plugin is bundled.

### 2.6 `npm run audit:responsive` — 8/8 clean

All eight viewports (375, 390, 430, 768, 820, 1366, 1440, 1920):

- horizontal overflow: **no** at every viewport
- overflowing elements: **0** at every viewport
- `--ttitle` tokens unchanged (32 / 32 / 32 / 32 / 26 / 36 / 36 / 56px)
- section heights **identical** to the pre-parallax run

Section heights being byte-identical is the expected result and is worth stating:
the parallax is transform-only, so it cannot affect layout or introduce reflow.

### 2.7 No console errors or plugin warnings

```
page errors:            0
console warnings:       0
ScrollTrigger-plugin messages: 0
```

Previously the page emitted dozens of `Invalid property scrollTrigger … Missing
plugin?` warnings per load.

### 2.8 P0 video scrub preserved

| scrollY | heroProgress | currentTime | paused | opacity |
|---|---|---|---|---|
| 0 | 0 | 0 | true | 1 |
| 1800 | 0.5 | 4 | true | 1 |
| 3600 | 1 | 7.94 | true | 1 |

`currentTime = progress × 8` exactly, `paused: true` throughout. The two scroll
consumers on the hero — the video scrub and the layer parallax — do not interfere:
the video is driven off `gsap.ticker` with a bounding-rect read, the parallax off
ScrollTrigger, and neither writes to the other's elements.

### 2.9 Loader preserved

Mid-roll: overlay 1440×900, `padding: 100px 150px`,
`justify-content: flex-end`, counter rect `[957, 593, 333, 207]` — the exact
geometry measured from the reference — `aria-valuenow` advancing. Dismissed on
schedule.

---

## 3. Regression check on existing ScrollTrigger usage

Registering the plugin necessarily changed the two consumers that were previously
silently broken. This is the inspection the goal asked for.

### 3.1 `useParallax` — gallery and testimonials now animate

**Before registration:** the `scrollTrigger:` config was discarded, so
`gsap.fromTo(image, { y: amplitude }, { y: −amplitude })` ran as a plain 0.5s tween.
The images animated once to their end offset and stayed there — frozen at
`−94.5` / `−40.5` regardless of scroll. That is the state the audit measured and
reported as "gallery parallax active".

**After registration:** measured across the sections' real scroll range:

| scrollY | gallery `translateY` (first 4 tiles) | testimonial `translateY` (first 3) |
|---|---|---|
| 10800 | 44.3, 17.42, 17.42, 32.86 | 40.5, 40.5, 40.5 |
| 11400 | −46.42, −34.06, −34.06, −18.62 | 40.5, 40.5, 40.5 |
| 12000 | −94.5, −45.9, −45.9, −45.9 | 7.36, 14.11, 20.86 |
| 12600 | −94.5, −45.9, −45.9, −45.9 | −33.14, −26.39, −19.64 |
| 13200 | −94.5, −45.9, −45.9, −45.9 | −40.5, −40.5, −40.5 |

Each image now tracks scroll and the tiles are staggered against one another,
which is what `useParallax` was written to do. **No code in `useParallax`,
`HighlightTile.vue` or `TestimonialCard.vue` was changed** — this is the plugin
starting to work.

**Flagged, not resolved.** The reference's gallery and testimonial parallax is
*inert* (audit findings 6 and 7). Making this build's work therefore moves it
further from the reference on that specific axis, while fixing a genuine bug. That
is the "match observed vs match intended" product decision the audit already
raised, and it is not mine to settle in this pass.

### 3.2 `useSmoothScroll` — unchanged in effect

It already called `ScrollTrigger.update` on Lenis scroll and `ScrollTrigger.refresh()`
on mount and breakpoint change. Those calls were no-ops before (there were no
triggers to update) and now do what they were written to do.

---

## 4. Corrections to the audit, and remaining deviation

Measuring the reference live produced four findings that contradict the audit's
description of the same motion. They are recorded here because they affect any
future pass on this area.

### 4.1 The reference's rate is −speed / 10, not −speed / 45

> **Superseded — see the correction at the top of this document.** This section
> correctly identified the discrepancy but the implementation kept using
> `−speed / 45` because the task named the audit authoritative. The rate is now
> `−speed / 10`, as measured here.

The audit's rate was derived from a single `b1num` sample: `+70.99 → −145.01` over
a recorded `scrollY 0 → 1620`, giving `−216 / 1620 = −0.1333 = −6/45`.

Live measurement of the reference gives a different constant. The hero section
`.md-interctv` carries its own transform, and its value **is** the scroll offset
(it has no `data-scroll-speed`; `window.scrollY` stays 0 because locomotive-scroll
drives the page with transforms). Reading the layers against that offset:

| layer | speed | measured rate | −speed/10 | −speed/45 |
|---|---|---|---|---|
| `.md-interctv__title` | 8 | −0.800 | ✓ | ✗ |
| `.md-interctv__desc` | 2 | −0.200 | ✓ | ✗ |
| `.md-block-1 .md-block__count-num` | 6 | −0.600 | ✓ | ✗ |
| `.md-block-1 .md-block__count-image` | 10 | −1.000 | ✓ | ✗ |
| `.md-block-1 .md-block__info-title` | 0.5 | −0.050 | ✓ | ✗ |

Five independent confirmations, at two viewport heights. The audit's `1620` is
4.5× the true scroll offset of 360 — and 4.5 = 45/10, which is why its constant
came out exactly 4.5× too small.

### 4.2 The title and description are not constant offsets

The audit states the title and description "carry **constant** displacements of
`−718.39` and `−179.60` throughout the hero".

They do not. Both move linearly with scroll (`title = 0.80 × scroll`,
`desc = 0.20 × scroll`) and then **saturate** once they have left the viewport:

```
scroll   section      title      desc
-739.65  -739.65   -591.72   -147.93     ratio 0.800 / 0.200
-884.26  -884.26   -707.41   -176.85     ratio 0.800 / 0.200
-1016.52 -1016.52  -717.83   -179.46     saturated
-1355.80 -1355.80  -717.83   -179.46     saturated
```

`−718.39` and `−179.60` are the *saturated end states*, sampled after the freeze
and read as if they were the whole behaviour. `−718.39 / 8 = −179.60 / 2 = −89.8`,
which is the giveaway that both scale with speed.

**This matters.** Applying a constant `−718px` offset to this build's hero title
would displace the name permanently by 718px and destroy the composition — the
name is not at the reference's layout position. The implementation therefore
treats all seven layers as rate-driven, which is what they are.

### 4.3 The reference disables hero parallax on phones

> **Superseded — see the correction at the top of this document.** This section
> found that the reference applies no parallax on mobile, and the implementation
> enabled it anyway as "a deliberate superset of the reference". That was the wrong
> call: the goal is to match observed behaviour, and mobile now creates no triggers
> at all. The breakpoint is exactly 1024px, not the 768px assumed here.

At 390×844 every layer's transform is `0` at every scroll position, while
`window.scrollY` advances normally (700, 1400, … 5600) — locomotive-scroll uses
native scroll on phones (`smartphone: { smooth: false }`) and applies no parallax
at all.

This build **enables** it on mobile, because the goal asks for desktop and mobile
support, and because the motion is bounded (largest mobile displacement 937px on
the fastest layer, at the very end of the range). Documented as a deliberate
superset of the reference rather than an oversight.

### 4.4 The story-block info column decomposes — and so does the reference's

Applying speeds 0.5 / 2 / 0.5 to a tightly stacked flex column (10px gap between
title and description) drives the description up through the title. Measured in
this build at progress 0.833:

```
title  −33.3
desc   −133.3      relative displacement 100px against a 46px-tall title
```

That reads as overlap, and it is visible in a screenshot. **The reference does the
same thing.** Measured on `.md-block-1` across its passage:

```
titleTy    descTy     title→desc gap    desc→btn gap
  23.88       0.00        −14             35
  17.88      94.86         87            −59
 -12.12     -19.42          3             58
 -18.12     -43.42        −15             76
 -23.86     -67.98        −34             94
 -23.86    −109.76        −76            121
```

The gap goes negative and keeps going: the description passes up through the title
and away from the buttons. The reference's info column visibly comes apart as it
scrolls.

This is implemented faithfully because the goal names the audit's speeds as
authoritative, and because "fixing" it would mean inventing motion the reference
does not have. It is flagged here as a candidate for a product decision, alongside
the inert-parallax question in §3.1.

### 4.5 Block layers travel further here than in the reference

> **Superseded — see the correction at the top of this document.** This section
> describes the `−speed / 45` implementation, which drove every layer from the hero
> top across the full 3600px range. The story layers are now anchored where their
> own centre crosses the viewport centre and saturate half a viewport either side,
> so their travel is bounded at ±450 on a 900px viewport — against the reference's
> measured ±428 — rather than accumulating over the whole range. Only the
> observation that the rate constant matters is still relevant.

Because the spec's rate is applied over this build's full 3600px hero range, while
the reference applies its rate over roughly one viewport, the story layers cover
more ground within their visible passage — the portrait's total travel is 800px
here against roughly 850px in the reference *per block*, but distributed across a
much longer scroll, so ~3× more of it happens while the block is on screen.

Consequence: at the end of the range `.hero-block-3`'s portrait sits roughly 670px
above its layout position, near the top of the viewport, while the block itself is
still visible. It is transform-only, so nothing reflows or overflows — the
responsive audit is clean at all eight viewports — but it is more displacement
than the reference shows at the same point.

Using `−speed / 45` was chosen over the measured `−speed / 10` because the spec
names it as the reference rule and as authoritative, and because `−speed / 10`
over this hero's range would give the title 2880px of travel. Over this range
`−speed / 45` lands within about 11% of the reference's measured end states
(title −640 against the reference's −718, description −160 against −180).

---

## 5. Status

**Hero layer parallax complete and corrected** — the seven layers run at
`−speed / 10` on desktop (`min-width: 1024px`) and are static below it, both
verified against runtime transforms at 1366×768, 1440×900, 1920×1080 and 390×844,
with reduced motion, the P0 video, the loader, the modal, the static gallery and
testimonial images, and the responsive layout all preserved.

**Anchoring fixed** — each layer's window is derived from the live viewport inside
`apply`, and its position is measured with the applied transform subtracted, so the
offsets are reproducible across resizes and every story layer crosses zero at its
own anchor. Before that fix the same viewport at the same scroll could report two
different offsets, and the story layers sat against the wrong end of their window.

**Centralized ScrollTrigger registration complete** — one plugin, registering once
before mount, no remaining plugin warnings.

Not complete: the audit's other P1 items (footer quote randomisation, image
composition), all P2/P3 items, the open product decisions listed in
`P1_HERO_PARALLAX_REPORT.md` §4.2 and §4.4–§4.5, and the review-modal variant noted
in `P1_MODAL_REPORT.md` §5.3. The portfolio is not finished.
