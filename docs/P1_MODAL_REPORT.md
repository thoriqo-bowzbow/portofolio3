# P1 Primary CTA Modal Report

Implements the modal finding from [`FINAL_FIDELITY_AUDIT.md`](FINAL_FIDELITY_AUDIT.md) —
§`[Navigation — primary CTA]` (P1).

The header's "Get in touch" now opens a request modal instead of scrolling to
`#contact`. The contact section remains as its own surface.

The portfolio is **not** complete. The audit's remaining P1 items and all P2/P3
items are still open.

---

## 1. What the reference does

`MAMEED_RECON.md` §12.9 recorded the `.md-lvp` modal as an explicit UNKNOWN —
"its open/close animation on real interaction was not observed end-to-end" — which
is why the first build shipped a scroll instead. So it was measured before being
implemented, not after.

### 1.1 Static geometry

Read from the live DOM with the modal open at 1440×900:

```
scrim    full screen, background rgba(37, 35, 36, 0.6)
         backdrop-filter: blur(5px), z-index: 13
panel    [420, 133, 600, 633]  padding 70px 60px  #fff  border-radius 0
close    absolute, top 30px right 30px, 40 × 40, 25px icon
```

| element | rect | typography |
|---|---|---|
| title "Leave your request" | `[480, 203, 480, 41]` | 34px / 700, display face, `rgb(37,35,36)` |
| description | `[480, 254, 480, 67]` | 14px / 400, `rgba(37,35,36,.6)` |
| "Your Name" label | `[500, 360, 78, 18]` | 14px / 400, `rgba(37,35,36,.4)` |
| name input | `[480, 342, 480, 55]` | 14px / 400, `1px solid rgba(37,35,36,.2)`, square |
| "Your email" label | `[500, 425, 75, 18]` | 14px / 400, `rgba(37,35,36,.4)` |
| email input | `[480, 407, 480, 55]` | as above, `type=email` |
| textarea label | `[503, 490, 294, 18]` | 14px / 400, `rgba(37,35,36,.4)` |
| textarea | `[480, 472, 480, 150]` | 14px / 300, rows 4, `resize: vertical` |
| word hint | `[816, 597, 134, 15]` | 12px / 400, `rgba(37,35,36,.3)` |
| submit | `[827, 652, 133, 45]` | 14px, `rgba(37,35,36,.6)` fill, white text |

Textarea `name="messageSummary"`, `rows=4`. Success message element is
`14px / 700`, `rgb(36,156,85)`, collapsed to zero height when idle.

### 1.2 Animation — sampled frame by frame

Captured from the click through to settled, at ~16ms intervals:

```
open   scrim   fade-in             0.6s ease-in-out   opacity 0 → 1
       panel   fade-in-up-short    0.6s               opacity 0 → 1, translateY 50 → 0
close  panel   fade-out-up-short   0.6s               opacity 1 → 0, translateY 0 → −50
       scrim   fade-out            0.6s ease-in-out   opacity 1 → 0
```

The two phases run **in sequence, not together**. On open, the panel's opacity
stays at exactly 0 until the scrim reaches 1; on close, the scrim stays at 1 until
the panel reaches 0. Total 1.2s each way.

The panel is not unmounted when closed — it stays in the DOM at `display: block`
with `opacity: 0`.

---

## 2. What was built

```
components/ui/ModalShell.vue      scrim, panel, phases, focus, scroll lock
components/ui/RequestModal.vue    the form, reusing MdInput / MdTextarea / MdButton
composables/useRequestModal.ts    shared open state (useState)
data/requestModal.ts              copy
```

**Reused primitives.** `MdInput`, `MdTextarea` and `MdButton` already matched the
reference's `.md-input` / `.md-textarea` / `.mdbtn` down to the 15px 20px padding,
55px field height, square corners and 45px button — they were built from the same
recon. The modal adds no new field styling; it only supplies copy and ids.

**Wired from both header CTAs** — the desktop bar's and the persistent black
mark's (which is the only header on mobile) — through one shared boolean. The
reference reaches the same modal from both via a store action.

**Changed elsewhere:**

```
components/layout/SiteHeader.vue   both CTAs call openRequestModal instead of goTo
data/navigation.ts                 primaryCta.target removed — it no longer navigates
layouts/default.vue                <RequestModal /> mounted once, teleported to body
assets/styles/_tokens.scss         +$dur-modal: 0.6s, the measured per-phase duration
```

`_tokens.scss` gained one **motion** token. No typography token was touched — the
new file is in the §4 list of files changed and nothing type-related moved.

---

## 3. Verification

### 3.1 Geometry against the reference

| property | reference | built | |
|---|---|---|---|
| scrim background | `rgba(37, 35, 36, 0.6)` | same | ✓ |
| scrim backdrop-filter | `blur(5px)` | same | ✓ |
| scrim size | 1440 × 900 | 1440 × 900 | ✓ |
| panel box | `[420, 133, 600, 633]` | `[420, 130, 600, 640]` | 7px taller |
| panel padding | `70px 60px` | same | ✓ |
| panel background | `rgb(255,255,255)` | same | ✓ |
| panel radius | `0px` | `0px` | ✓ |
| close box | `[950, 163, 40, 40]` | `[950, 160, 40, 40]` | ✓ |
| title | 34px / 700, `rgb(37,35,36)` | same | ✓ |
| name input | `[480, 342, 480, 55]` | `[480, 339, 480, 55]` | ✓ |
| email input | `[480, 407, 480, 55]` | `[480, 404, 480, 55]` | ✓ |
| textarea | `[480, 472, 480, 150]` | `[480, 469, 480, 150]` | ✓ |
| field border | `rgba(37,35,36,0.2)`, 1px, square | same | ✓ |
| field padding | `15px 20px` | same | ✓ |
| word hint | 12px, `rgba(37,35,36,.3)`, right | same | ✓ |
| submit box | `[827, 652, 133, 45]` | `[827, 655, 133, 45]` | ✓ |
| submit fill | `rgba(37,35,36,0.6)` | same | ✓ |

Everything lines up within 3px. The only real difference is the panel's height:
**640 against 633**, a 1.1% difference, because Trirong's normal line-height is
looser than SK Zweig's for the 34px title.

### 3.2 Animation against the reference

```
open    t=9765  scrim opacity 0 → 1        panel opacity 0,  translateY 50
        t=10418 scrim opacity 1            panel opacity 0.16 → 1, translateY 41.8 → 0
        t=10971 settled

close   t=131185  is-leaving-panel   panel opacity 1 → 0, translateY 0 → −49.2   scrim 1
        t=131788  is-leaving-scrim   scrim opacity 1 → 0                          panel 0
        t=132335 unmounted
```

Same order, same durations, same 50px travel, same easing. The close sequencing
was fixed during verification: the first implementation faded panel and scrim
together over 600ms, which the reference does not do.

### 3.3 Interaction — 22/22

`node scripts/audit/modal-interaction-test.mjs` drives the real page:

```
  ok   opens from the header CTA
  ok   body scroll is locked while open
  ok   initial focus is inside the panel
  ok   initial focus is the name field
  ok   panel has focusable controls — 5 controls
  ok   Tab at the end wraps to the first control
  ok   Shift+Tab at the start wraps to the last control
  ok   empty submit produces three field errors
  ok   invalid fields are marked aria-invalid
  ok   no success notice on invalid submit
  ok   invalid email is rejected
  ok   word-count hint updates live — 2 / 10 then 11 / 10
  ok   valid submit shows a notice
  ok   notice does not claim the message was sent
  ok   Escape closes the modal
  ok   body scroll is unlocked after close
  ok   focus returns to the header CTA
  ok   reopens for the scrim test
  ok   clicking the scrim closes the modal
  ok   reopens for the close-button test
  ok   close button closes the modal
  ok   background scrolling is blocked while open — scrollY 0 → 0
```

### 3.4 Mobile

At 390×844 the panel is `[12, 112, 366, 620]` with `padding: 50px 25px`, the title
drops to 26px, the close button moves to an 18px inset, and all three fields plus
the submit fit without horizontal overflow. `max-height: calc(100vh - 24px)` with
`overflow-y: auto` keeps it reachable on short viewports.

### 3.5 `npm run typecheck` — clean

Exit code 0.

### 3.6 `npm run build` — succeeds

Client, SSR and Nitro all build. `ModalShell-styles` and `RequestModal-styles`
chunks present.

### 3.7 `npm run audit:responsive` — 8/8 clean

All eight viewports: no horizontal overflow, 0 overflowing elements, `--ttitle`
tokens unchanged, and **section heights byte-identical** to the pre-modal run — the
modal is teleported and fixed, so it contributes nothing to layout.

### 3.8 No console errors

```
page errors:              0
console warnings/errors:  0
```

### 3.9 No regressions

| feature | check | result |
|---|---|---|
| P0 scroll-scrubbed video | `currentTime` at progress 0 / 0.417 / 0.833 | `0 / 3.333 / 6.667`, `paused: true`, `opacity: 1` |
| P1 hero layer parallax | title / desc / numeral at scrollY 0 / 1800 / 3600 | `0 / −320 / −640`, `0 / −80 / −160`, `0 / −240 / −480` — ratio preserved |
| P0 loader | after settle | dismissed; geometry unchanged |
| P1 typography | `.hero__title-text` family | `Trirong` |
| Contact section | present, form fields | 6 sections intact, `#contact-form` with 3 fields, **not** inside the modal |

---

## 4. What was added beyond the reference

The reference implements none of these. They are deliberate additions, recorded
here so the divergence is known:

- **Focus trap.** Tab and Shift+Tab cycle within the panel. Without it focus walks
  out into the page behind, which is still in the DOM.
- **Focus restoration.** The element that opened the modal gets focus back.
- **Escape closes.** Bound to the document rather than the wrapper, because during
  the 600ms scrim phase focus is still on the trigger and a wrapper listener would
  miss it.
- **Scrim click closes** (panel clicks do not).
- **Scroll lock** with scrollbar-width compensation, so the page behind does not
  shift sideways when the scrollbar disappears. Lenis is stopped as well as setting
  `overflow: hidden`, since Lenis drives native scroll here and `overflow` alone
  would not stop wheel input.
- **`role="dialog" aria-modal="true"`** with `aria-labelledby` pointing at the
  title, and a labelled close button. The reference's close control is a bare
  `<span>` with a background image.
- **`prefers-reduced-motion`** collapses both phases to instant.

**No fake success.** The reference's own success element reads "Thank you! Your
request has been successfully submitted." This repository has no endpoint, so a
valid submission instead reports *"This form is not connected to a backend yet, so
nothing has been sent. Email me directly and I will reply."* — the same policy as
the standalone contact form. A test asserts the notice never claims success.

---

## 5. Remaining deviation

### 5.1 Panel is 7px taller (640 vs 633)

Trirong's normal line-height at 34px is looser than SK Zweig's, so the title box is
59px against 41px. The overall panel ends up 1.1% taller. Fixing it would mean
forcing a line-height on the modal title, which is a typography decision that
belongs with the typography pass rather than this one.

### 5.2 The word hint's box differs, not its appearance

The reference's hint shrink-wraps to 134px positioned at x=816; this one spans the
field width with `text-align: right`. Both render the text hard against the right
edge, so the difference is not visible — only the measured box differs.

### 5.3 The reference's review variant is not implemented

The reference has a **second** modal triggered by `.md-rvws__btn` "Leave yours" —
a review form using `.md-lvp .md-review` with a `250px 1fr` grid and a
`.md-phinput` photo upload. It is a different form with a different trigger. The
audit noted its content "is lazy and did not populate reliably in the automated
session", so it was not captured in full and is not reproduced here. It remains
out of scope.

### 5.4 No backend

Unchanged from the standalone contact form: this repository ships no endpoint, so
submission cannot actually send. The modal says so explicitly rather than implying
otherwise.

---

## 6. Status

**Primary CTA modal complete** — measured against the live reference, implemented
with the project's existing primitives, and verified by 22 passing interaction
tests plus geometry, animation, responsive and regression checks.

Not complete: the audit's other P1 items (footer quote randomisation, the
inert-parallax product decision), the corrections recorded in
`P1_HERO_PARALLAX_REPORT.md` §4, the review-modal variant in §5.3, and all P2/P3
items. The portfolio is not finished.
