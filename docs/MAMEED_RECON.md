# Mameed.com — Reconnaissance Report

Reference inspected live on 2026-09-20 via headless Chrome (CDP, agent-browser 0.37.1)
at `https://mameed.com/`.

**Method.** The reference is a Vue 2 SPA (webpack, `#app` mount, `chunk-vendors` + `app`
bundles). Because the site's scroll library keeps sections at `opacity: 0` until they are
scroll-revealed — and because a naive `window.scrollTo` jump does not trigger its
`data-scroll-call` events — measurements were taken two ways and cross-checked:

1. **Live DOM measurement** — `getBoundingClientRect` + `getComputedStyle` on ~120
   selectors, at 1440×900 and 390×844.
2. **Static stylesheet analysis** — the two shipped stylesheets were downloaded and
   de-minified (`app.css` 25 108 B → 1 307 lines; `home.css` 21 957 B → 1 133 lines).
   These are authoritative for values that depend on state.
3. **Source-map inspection** — `app.js.map` was fetched and its 88 embedded sources
   extracted, to read the *behavioural* logic (scroll config, reveal triggers, text
   scramble) rather than guessing it.

Values that could not be determined with confidence are marked **UNKNOWN** rather than
invented. See [§12](#12-unknowns).

> **Content boundary.** This document records *structure, geometry, tokens and motion*
> — the design system. The reference's personal copy, photographs, project logos and
> marks are **not** reproduced here and are **not** used in the implementation. The
> build uses original content and original assets. Where a reference string is quoted
> below it is only to identify a slot's role, not to be copied.

---

## 1. Document & scroll model

| Property | Value | Source |
|---|---|---|
| `<body>` background | `#fafafa` | computed + `app.css` |
| `<html>` background | transparent | computed |
| Body font | `Montserrat, sans-serif` @ `16px` | computed |
| Default text colour | `rgb(0,0,0)` (body) / `rgb(37,35,36)` (components) | computed |
| `body` overflow-x | `hidden` | `app.css` |
| `body` overflow-y | `scroll` | `app.css` |
| `body` min-width | `320px` | `app.css` |
| Total document height @1440×900 | **15 217 px** | measured |
| Total document height @390×844 | **17 517 px** | measured |
| Webkit scrollbar | `width/height: 5px`, track `#f1f1f1`, thumb `rgba(28,79,209,.5)` radius `10px` | `app.css` |

### Scroll library

`locomotive-scroll` **v4.1.3** (confirmed in the CSS banner comment and in
`BaseLayout.vue`). Configuration, verbatim from source:

```js
new LocomotiveScroll({
  el: document.querySelector('[data-scroll-container]'),
  smooth: true,
  lerp: 0.09,
  smartphone: { smooth: false },
  tablet: { smooth: true },
});
```

`html` receives `has-scroll-init has-scroll-smooth`; `body { overflow: hidden }`; the
container is translated. A `ResizeObserver` on the root calls `scroll.update()`.
Sections carry `data-scroll-section`; reveal targets carry `data-scroll`.

**Note for the port.** The reference's smooth-scroll is a *transform-driven* virtual
scroll. The implementation uses **Lenis** (native scroll + rAF interpolation), which is
the modern equivalent and keeps `position: sticky`, native `scrollTo`, IntersectionObserver
and the browser's own scrollbar behaving normally. This is a deliberate, documented
deviation — it changes the *mechanism*, not the observed *feel* (see §9).

---

## 2. Global reset & primitives

From `app.css`:

```css
*, p, ul {
  margin: 0; padding: 0; list-style: none; box-sizing: border-box;
  scroll-behavior: smooth; outline: none;
  font-family: Montserrat, sans-serif;
}
a { color: inherit; cursor: pointer; }
a, a:hover { text-decoration: none; }
img { display: flex; }
section { overflow: hidden; will-change: transform; }
```

Two consequences worth reproducing deliberately:

- `scroll-behavior: smooth` is on **every** element (so anchor navigation eases).
- `outline: none` globally — the reference has **no visible focus ring**. The
  implementation restores a focus-visible ring for accessibility (documented deviation).

### Buttons — `.mdbtn`

```css
.mdbtn {
  all: unset; box-sizing: border-box;
  display: inline-flex; padding: 12px 20px;
  justify-content: center; align-items: center; gap: 10px;
  height: 45px; cursor: pointer; transition: .3s;
  background: #fff; will-change: transform;
}
.mdbtn:hover  { transform: scale(1.05); }
.mdbtn:active { transform: scale(1); }
.mdbtn__text  { color: #252324; font-size: 14px; font-weight: 400; line-height: 120%; white-space: nowrap; }
```

Measured instance: `126.38 × 45` at `padding: 12px 20px`. **Radius `0px`** — the design
is entirely square-cornered except where noted.

A `::after` pseudo-element overlay (`background:#252324; backdrop-filter: blur(100px)`)
is declared for a loading state but sits at `opacity: 0; visibility: hidden`.

---

## 3. Colour system

The palette is extremely small. Every value below was observed in computed styles.

| Token | Value | Role |
|---|---|---|
| `$bg` | `#fafafa` | page background |
| `$surface` | `#ffffff` | cards, white section backgrounds, buttons |
| `$ink` | `#252324` (`rgb(37,35,36)`) | primary text, dark fills |
| `$ink-80` | `rgba(37,35,36,.8)` | input value text |
| `$ink-70` | `rgba(37,35,36,.7)` | dark button fill |
| `$ink-60` | `rgba(37,35,36,.6)` | subtitles, modal scrim |
| `$ink-50` | `rgba(37,35,36,.5)` | footer copy, dates |
| `$ink-40` | `rgba(37,35,36,.4)` | form labels, quote attribution |
| `$ink-30` | `rgba(37,35,36,.3)` | separators, float-label active |
| `$ink-20` | `rgba(37,35,36,.2)` | **inactive body copy**, input borders, rules |
| `$ink-10` | `rgba(37,35,36,.1)` | hairlines, card shadow tint |
| `$white` | `#ffffff` | on-image text, hero type |
| `$white-70` | `hsla(0,0%,100%,.7)` | frosted panels over imagery |
| `$white-60` | `hsla(0,0%,100%,.6)` | frosted panel (hover) |
| `$white-50` | `hsla(0,0%,100%,.5)` | desc hover panel |
| `$white-20` | `hsla(0,0%,100%,.2)` | gallery overlay surface |
| `$error` | `#f53737` / `#ba0d0d` | form error border / error text |
| `$success` | `#52d834` / `#249c55` | form success border / text |
| `$focus-blue` | `rgba(0,76,255,.6)` | input focus border |
| scrollbar accent | `rgba(28,79,209,.5)` | webkit scrollbar thumb |

**The single most important behaviour:** body copy is authored at `rgba(37,35,36,.2)` and
transitions to `#252324` when the element enters the viewport (`.is-inview`). This
"text inks in as you scroll" is a signature of the reference and is reproduced.

```css
.md-about__list p { color: rgba(37,35,36,.2); transition: .5s; }
.md-about__list p.is-inview { color: #252324; }
```

The same pattern is reused for `.md-expblock__desc`, `.md-rvws__info-text`,
`.md-about__stack-title` (via opacity) and the logo strips (via `filter`).

---

## 4. Typography

Two families only.

| Family | Weights loaded | Role |
|---|---|---|
| **Montserrat** | 300, 400, 500, 600 | all body copy, UI, nav, buttons, labels, numerals-in-text |
| **SK Zweig** | 400, 700 (500 declared as `"SK Zweig Med"`, **never used / unloaded**) | every display heading, quote, card name |

`font-display: swap` on all faces. Both are served as `woff2` + `woff`; SK Zweig also
ships `ttf`.

> **Licensing.** SK Zweig is a commercial retail typeface. It is **not** redistributed in
> this repository. See `docs/PRODUCTION_AUDIT.md` for the substitute strategy.

### Fluid token scale

Declared twice (global + per-route), identical both times:

```css
:root { --ttitle: 56px; --tsubtitle: 20px; --desctext: 23px; }
@media (max-width: 1540px) { :root { --ttitle: 36px; --tsubtitle: 16px; --desctext: 15px; } }
@media (max-width:  992px) { :root { --ttitle: 26px; --tsubtitle: 12px; --desctext: 13px; } }
@media (max-width:  768px) { :root { --ttitle: 32px; --tsubtitle: 14px; --desctext: 4.16667vw; } }
```

Note the deliberate non-monotonicity: `--ttitle` **rises** from 26 → 32 px at the mobile
breakpoint, and `--desctext` becomes viewport-relative (`4.16667vw` — a 24-step scale,
i.e. exactly the 1/24 of viewport used by the golden-ratio grid systems).

### Measured type roles

| Role | Selector | 1440×900 | 390×844 |
|---|---|---|---|
| Section title | `.md-about__title`, `.md-exp__title`, `.md-glry__title`, `.md-rvws__title`, `.md-contact__title` | `--ttitle` = **36 px** SK Zweig 400 (contact: **500**), `normal` lh | `--ttitle` = **32 px** |
| Section subtitle | `.__subtitle` | `--tsubtitle` = **16 px** Montserrat 300, lh `140%`, `$ink-60` | **14 px**, lh `140%` |
| Body/description | `.__list p`, `.md-expblock__desc`, `.md-rvws__info-text` | `--desctext` = **15 px** Montserrat **500**, lh **180%** (27 px) | **16.25 px** (=4.16667vw), lh 29.25 px |
| Hero name | `.md-interctv__title-text` | **212 px** SK Zweig 400 white | **90 px** |
| Hero intro card | `.md-interctv__desc-text` | **14 px** Montserrat **500**, lh **180%** | **12 px** |
| Hero block title | `.md-block__info-title` | **46 px** SK Zweig 400 white | — |
| Hero block body | `.md-block__info-desc` | **14 px** Montserrat **300**, lh **180%** | **14 px** 400 |
| Hero block numeral | `.md-block__count-num` | **242 px** SK Zweig 400 white, `opacity:.3` | **80 px** |
| Experience org | `.md-expblock__title` | **22 px** Montserrat 400 | 22 px |
| Experience sub | `.md-expblock__subtitle` | **14 px** Montserrat 300, lh `160%`, `$ink-50` | **16 px** |
| Experience dates | `.md-expblock__dates` | **26 px** Montserrat 300, `$ink-50` | 26 px |
| Project name | `.md-expblock__project-title` | **22 px** Montserrat **600** | **18 px** |
| Project body | `.md-expblock__project-desc` | **14 px** Montserrat 300, lh `150%` | **13 px**, lh `140%` |
| Card name | `.md-rvwcard__name` | **16 px** SK Zweig **700**, lh `120%` | **18 px** |
| Card job | `.md-rvwcard__job` | **12 px** Montserrat 400, `$ink-60` | 12 px |
| Card body | `.md-rvwcard__text` | **12 px** Montserrat 500, lh `160%` | 12 px |
| Contact card title | `.md-ctcard__details-title` | **20 px** Montserrat **500**, lh `100%` | **14 px** |
| Contact card body | `.md-ctcard__details-desc` | **12 px** Montserrat 300, lh `160%`, `$ink-60` | 12 px |
| Contact separator | `.md-contact__separator` | **26 px** SK Zweig 400 | **22 px** |
| Form title | `.md-contact__form-title` | **28 px** SK Zweig 400, lh `120%`, `$ink-60` | 28 px |
| Form subtitle | `.md-contact__form-subtitle` | **14 px** Montserrat 300, lh `160%`, `$ink-60` | 14 px |
| Input | `.md-input` | **14 px**, `padding: 15px 20px`, `height: 55px` | 14 px, `padding: 10px 15px`, `height: 50px` |
| Footer quote | `.md-footer__quote-text` | **36 px** SK Zweig **700**, `#252324` | **24 px** |
| Footer attribution | `.md-footer__quote-author` | **20 px** SK Zweig 400, `$ink-40` | **16 px** |
| Footer blurb | `.md-footer__text` | **18 px** Montserrat 400, lh `140%`, `$ink-50`, width **600 px** | **14 px** |
| Footer legal | `.md-footer__copyright-*` | **12 px**, lh `140%`, `$ink-50` | **10 px** |
| Nav link | `.md-header__link` | **14 px** Montserrat 400 white | hidden (desktop header `display:none`) |
| Button label | `.mdbtn__text` | **14 px** Montserrat 400, lh `120%` | 14 px |

All headings in the reference are `font-weight: 400` unless noted — the display face is
used at regular weight, which is what gives the typography its editorial, unhurried feel.

---

## 5. Container & spacing system

```css
.container { width: 1440px; margin: 0 auto; }

@media (max-width: 1540px) { .container { width: 100%; max-width: 992px; padding: 0 15px; } }
@media (max-width:  992px) { .container { max-width: 768px; } }
@media (max-width:  768px) { .container { max-width: 576px; } }
@media (max-width:  576px) { .container { max-width: unset; } }
```

Measured at 1440×900: container is **992 × N** with `padding: 0 15px` and
`margin: 0 auto` → **962 px** of usable content, horizontally centred (left edge 239 px).

### The master grid

Every content section uses the **same** two-column grid:

```css
grid-template-columns: 30% auto;   /* → 20% auto below 992px */
gap: 50px;                          /* → 0 below 768px, where layout becomes flex column */
```

Measured at 1440: `288.594px 623.406px` (30 % / 70 % of 962). The left column holds the
section title + subtitle and is `align-self: flex-start`; the right column holds all
content. This single rule is what makes six visually distinct sections feel like one
document.

### Vertical rhythm

| Token | Value |
|---|---|
| Section padding | `100px 0` desktop → **`50px 0`** at ≤768 px |
| Between title and subtitle | `gap: 10px` |
| Title → content block | inherited from grid `gap: 50px` |
| Paragraph line-height | `180%` (body), `140%`–`160%` (secondary) |
| Experience row bottom rule margin | `0 0 100px` (last row: `0`) |
| Projects grid margin | `40px 0 150px` desktop → `40px 0 40px`, `row-gap: 50px` mobile |
| Hero scroller | `height: 500vh` |

### Grids

| Grid | Desktop (>992) | ≤992 | ≤768 |
|---|---|---|---|
| Experience projects | `repeat(3, 1fr)`, gap `50px` | `repeat(2, 1fr)` | 2 col, `gap:10px; row-gap:50px` |
| Gallery | `repeat(4, 1fr)`, `grid-auto-rows: 170px`, gap `10px` | rows `120px` | `repeat(3,1fr)` |
| Testimonials | `repeat(3, 1fr)`, gap `20px` | `repeat(2,1fr)` | 2 col |
| Contact socials | `repeat(3, 1fr)`, gap `20px` | — | `repeat(2,1fr)`, gap `10px` |

---

## 6. Section order & geometry

Measured at **1440×900** (container 992, content 962):

| # | Section | `id` | `top` | `height` | Background |
|---|---|---|---|---|---|
| 0 | `header.md-header__wrapper` | — | 0 | 0 (`height:0`, children overflow) | transparent |
| 1 | `section.md-interctv` | `#main` | 0 | **4 500** (= 500 vh) | transparent |
| 2 | `section.md-about` | `#about` | 4 500 | **2 820** | transparent (`#fafafa`) |
| 3 | `section.md-exp` | `#experience` | 7 320 | **3 801** | **`#fff`** |
| 4 | `section.md-glry` | `#projects` | 11 121 | **910** | transparent |
| 5 | `section.md-rvws` | `#reviews` | 12 031 | **1 178** | **`#fff`** |
| 6 | `section.md-contact` | `#contact` | 13 209 | **1 108** | transparent |
| 7 | `footer.md-footer` | — | 14 317 | **900** (= 100 vh) | **`#fff`** |

Total **15 217 px**. The alternating `#fafafa` / `#fff` banding is the primary means of
section separation — there are no dividers except the `1px` rules inside Experience.

At **390×844** the same sections measure 5 064 / 3 332 / 5 040 / 949 / 1 685 / 971 / **476**
(total **17 517 px**). Note `md-footer` collapses to `min-height: 40vh` on mobile.

### Anchor mapping (nav → section ids)

`About → #about`, `Experience → #experience`, `Projects → #projects`,
`Testimonials → #reviews`, `Contact → #contact`. Navigation calls the scroll library's
`scrollTo(target, { offset: 0, duration: 3000, lerp: 0.05 })` — a slow 3-second eased
travel, not a jump.

---

## 7. Section-by-section structure

### 7.1 Header (`compHeader.vue` → `.md-header`)

A **100 px** tall bar inside a `height: 0` wrapper, three columns:

| Column | Width | Content |
|---|---|---|
| `.md-header__logo` | `20%`, `flex-shrink:0` | `80 × 80` logo link, stacked three-line wordmark, `transition: .6s`, hover `opacity: .6` |
| `.md-header__links` | `flex-grow:1` | centred nav, `gap: 50px` → **35 px** ≤1540; links `14 px` white |
| `.md-header__actions` | `20%`, `flex-shrink:0`, `justify-content: flex-end` | `.mdbtn` "Get in touch" |

**Scroll behaviour** (`initScrollListener`): `isScrolled = scrollY > 100` →
wrapper gains `.md-scrolled` → `position: fixed; top/left/right: 0`, and
`.md-header { transform: translateY(-100%) }`.

Verified at 1440×900 with `scrollY = 600`:

| Element | Result |
|---|---|
| `.md-header__wrapper` | `position: fixed`, full width, `height: 0` |
| `.md-header` | `matrix(1,0,0,1,0,-100)` → rect `y: -100 … 0` — **entirely off-screen**. Logo, nav *and* the CTA all disappear. |
| `.md-intcontacts` | `opacity: 0` (scroll ≥ 300) |
| `.md-mobheader` | gains `.md-scrolled` → `opacity: 1`, `transform: none` → **the 90×90 black mark appears at top centre on desktop too** (rect `675,0 → 765,90`, `z-index: 12`) |

So on scroll the persistent chrome becomes a single centred black square containing the
wordmark — the same mark that is the mobile header. This is the site's only always-visible
navigation affordance once you leave the hero.

`isContactVisible = scrollY < 300` → `.md-intcontacts` gains `.md-show`
(`opacity:0; visibility:hidden` → `1/visible`, `transition: .6s`).

**Side rails — `.md-intcontacts`**: `height:100vh; width:100vw; position: sticky; top:0;
z-index:4`, container is `flex; align-items: flex-end; justify-content: space-between`.
Two blocks, each `flex column; align-items: center; gap: 10px; font-size: 14px;
color: #fff; opacity: .5`:

- **left** — 4 social icons, `20 × 20`, `gap: 10px`, hover `scale(1.1)`
- **right** — "Send me mail" with `writing-mode: vertical-rl`

Each block terminates in `:after { width:1px; height:200px; background:#fff; margin:10px 0 0 }`
— the **hairline that hangs below each rail** (visible in the hero screenshot).

Measured: block `20 × 330` at `x=239` (flush with the container's left content edge).

Below 768 px the desktop header is `display:none` and `.md-mobheader` takes over: a
**`90 × 90` black square** fixed at `left: calc(50% - 45px)`, containing the same stacked
wordmark. Clicking it runs `mobHeadOpen` (2 s): width stays 90 px while height grows to
450 px, then width expands to 350 px and `left` re-centres to `calc(50% - 175px)` — a
two-phase L-shaped expansion, with the logo travelling from centre to `bottom:-25px` and
`.`md-mobheader__content` un-clipping via `max-width: 0 → 100%` after a 1.5 s delay.

### 7.2 Hero (`mb-interctv` → `.md-interctv`)

The most complex section: **500 vh** of scroll driving a stack of fixed/sticky layers.

```
.md-interctv                     position: relative; overflow: visible
├── .md-interctv__title          100vw × 100vh, absolute, flex-centred
│   └── .md-interctv__title-text SK Zweig 212px white, margin: -100px 0 0 0
├── .md-interctv__holder         100vw × 100vh, absolute
│   └── .md-interctv__holder-image  object-fit: cover, position: fixed, 100vw × 100vh
├── .md-interctv__desc           100vw × 100vh, absolute, z-index 3, flex-centred
│   └── .md-interctv__desc-text   650px wide, padding 35px 40px, $white-70 + blur(5px),
│                                 margin: 350px 0 0 0
├── .md-interctv__canvas         object-fit: cover, position: sticky, 100vw × 100vh
├── .md-interctv__scroller       height: 500vh
└── .md-interctv__block ×3       absolute, left:0 right:0
    ├── .md-block-1  top: 180vh
    ├── .md-block-2  top: 280vh   (content reversed, info right-aligned)
    └── .md-block-3  top: 380vh
```

Each block:

```html
<div class="md-block__content">          flex, row-reverse, space-between, align-centre
  <div class="md-block__count">          30% wide, opacity .3, justify-end, padding-bottom 50px
    <span class="md-block__count-num">   242px SK Zweig white
    <img  class="md-block__count-image"> 250×300, greyscale, opacity .7, absolute bottom-left
  </div>
  <div class="md-block__info">           35% wide, column, align-start, gap 10px
    <h2 class="md-block__info-title">    46px SK Zweig white
    <p  class="md-block__info-desc">     14px Montserrat 300, lh 180%
    <div class="md-block__info-actions"> flex, gap 20px
  </div>
</div>
```

`md-block-1` measured `1440 × 346.63`; blocks 2 and 3 `1440 × 340`.
`.md-block-2` sets `flex-direction: row` and right-aligns its info column.

The **numeral + grayscale portrait** pairing (large `SK Zweig` number at `opacity:.3`
overlapping a small greyscale photograph) is the hero's distinctive motif.

**Hero hover detail:** `.md-block__info-desc` has a `::after` that is a
`$white-50 + blur(5px)` panel with `width: 0`, positioned `top:-20px; left:-30px;
bottom:-20px`. On hover, `width` grows to `calc(100% + 60px)` and the text flips to
`#252324` — a frosted highlight that wipes out from behind the paragraph.

At ≤768 px the hero becomes `600lvh`, the title drops to `90px` with `margin: -200px 0 0 0`,
the fixed image becomes `position: sticky`, and each block's content becomes a
`column` inside a fixed `100dvh` box.

### 7.3 About (`.md-about`)

```
.md-about__content                    grid 30% / auto, gap 50px
├── .md-about__titling                column, gap 10px, align-self: flex-start
│   ├── .md-about__title              --ttitle, SK Zweig
│   └── .md-about__subtitle           --tsubtitle, Montserrat 300, $ink-60, align-self: center
└── .md-about__info
    ├── .md-about__list               column of <p>, --desctext/500/180%, $ink-20 → $ink
    ├── .md-about__list-images        flex wrap centre, gap 40px, margin 40px 0,
    │                                 filter: grayscale(1) opacity(.4) → revert on .is-inview
    │                                 img { height: 60px; object-fit: contain }
    └── .md-about__stack              margin-top 50px, bg #fff,
                                      box-shadow: 0 0 20px -10px rgba(0,0,0,.1),
                                      padding: 70px   (→ 40px 30px + 1px border ≤768)
        ├── .md-about__stack-title ×3  26px SK Zweig, opacity .3 → 1 (is-inview), margin-bottom 15px
        └── .md-about__stack-list      flex wrap, gap 15px
            └── .md-about__stack-item  80×80 (→65 ≤1540, →50 ≤768)
                                       opacity .3, grayscale(1), pointer-events: none
                                       → .is-inview: filter revert, opacity 1, pointer-events all
```

**Stack-item hover — the label slide.** Each item carries `data-label`. A `::after`
holding `content: attr(data-label)` is absolutely positioned over the tile with
`max-width: 0`, `justify-content: flex-end`, `background:#fff`,
`box-shadow: 0 0 20px -10px rgba(0,0,0,.1)`, `z-index: -1`, `overflow: hidden`,
`white-space: nowrap`, `font-size: 14px`, `text-transform: capitalize`. On hover
`max-width` → `300%` with `padding: 0 20px 0 110%`, so a **white label plate grows out
from under the icon to the right**, and the icon itself `scale(1.05)`.

Measured desktop: 55 items, `65 × 65`, `gap: 15px`. Three groups (stack / experienced /
loved), stack box `623.41 × 570` at `padding: 70px`. Mobile: 55 items `50 × 50`,
`gap: 5px`, box `360 × 446`.

### 7.4 Experience (`.md-exp`)

Background `#fff`. Content grid `30% / auto`, gap `50px`. Title is in a
`position: relative; z-index: 3; background: #fff` titling column.

Three `.md-exp__info` rows, each `grid-column: 1 / 3` (full width) with an internal
`grid-template-columns: 30% auto; gap: 50px` and `border-bottom: 1px solid $ink-20;
margin: 0 0 100px` (last row none).

| Part | Type |
|---|---|
| `.md-exp__block-title` → `.md-expblock__title` | 22px Montserrat 400 `$ink` |
| `.md-expblock__subtitle` | 14px Montserrat 300 lh 160% `$ink-50`, width 90% |
| `.md-expblock__dates` | 26px Montserrat 300 `$ink-50` |
| `.md-expblock__desc` | `--desctext` / 500 / 180%, `$ink-20` → `$ink` on `.is-inview` |
| `.md-expblock__projects` | grid `repeat(3,1fr)` gap 50px, `margin: 40px 0 150px` |
| `.md-expblock__project` | grayscale(1) + opacity .2 → revert on `.is-inview` |
| `.md-expblock__project-logo` | 120×50, opacity .7, img `object-fit:contain; object-position: bottom left` |
| `.md-expblock__project-link` | gap 5px, opacity .5 → .8 hover; `::after` 18×18 arrow that `rotate(45deg)` on hover |

Measured rows: `962 × 1182`, `962 × 920`, `962 × 1107`. Projects `174.47` wide
(= (623.41 − 100)/3). 18 description paragraphs total.

### 7.5 Gallery / Highlights (`.md-glry`)

```
.md-glry__grid   grid-template-columns: repeat(4, 1fr)
                 grid-auto-rows: 170px     (→120px ≤992)
                 gap: 10px;  overflow: hidden
.md-glrycard     opacity: 0; filter: grayscale(1) opacity(.4)  → .is-inview: opacity 1, filter revert
                 :first-child, :nth-child(7) { grid-column: span 2; grid-row: span 2 }
.md-glrycard img  position: absolute; top: -30%; height: 160%; width: 100%; object-fit: cover
```

The `top:-30% / height:160%` on the image is a **parallax reservoir** — the image is 60%
taller than its frame so it can be translated on scroll without exposing an edge.

Measured: 10 cards. Large cards `306.7 × 350`, small `148.34 × 170`.

**Hover — the staggered frosted takeover.** `.md-glrycard__info` is a full-bleed
`$white-20 + blur(10px)` overlay, `padding: 30px` (`50px` on the 2×2 cards),
`opacity: 0`. On hover: `background` → `$white-60`, `opacity` → 1, and its three children
run **three separate `fade-in-up` animations with escalating delays**:

```css
:hover .md-glrycard__info-title { animation: fade-in-up 1s ease-in-out .5s 1 forwards; }
:hover .md-glrycard__info-desc  { animation: fade-in-up 1s ease-in-out .8s 1 forwards; }
:hover .md-glrycard__info-link  { animation: fade-in-up 1s ease-in-out 1.4s 1 forwards; }
```

`fade-in-up` is `translateY(100%) → 0, opacity 0 → 1, visibility → visible`. The 0.5 /
0.8 / 1.4 s stagger is slow and deliberate — the overlay resolves in a leisurely cascade.
Child `opacity: 0; visibility: hidden` prerequisites mean the text only exists mid-hover.
Title 18px (24px on large), desc 12px (16px, `line-clamp: 10`) `$ink-60`, link with the
same rotating `::after` arrow.

Card `transition: .8s`; the whole tile is `opacity: 0` until `.is-inview`.

Below 768 px `.md-glrycard__info { display: none }` — **the overlay is desktop-only**,
and `:first-child`, `:nth-child(5)`, `:nth-child(7)` span 2, with `:last-child` hidden.

### 7.6 Testimonials (`.md-rvws`)

Background `#fff`. Titling column gains a `.md-rvws__btn` (dark fill `$ink-70`, white
label, `margin-top: 20px`).

`.md-rvws__info-text` is `--desctext`/500/180% `$ink-20` → `$ink`, then
`.md-rvws__info-list` grid `repeat(3,1fr)` gap 20px `margin-top: 50px`.

**The staircase.** Cards are offset vertically in a repeating 3-step pattern:

```css
.md-rvwcard                 height: 400px (→300 ≤1540, →290 ≤768)
                            bg: #000; opacity: .4; pointer-events: none
                            overflow: hidden; transition: .3s
.is-inview                  opacity: 1; pointer-events: all
.md-rvwcard:nth-child(3n+2) { margin: 100px 0 -100px 0; }
.md-rvwcard:nth-child(3n+3) { margin: 200px 0 -200px 0; }
```

The positive-then-negative margin pair means each card **drops down but does not add
height** — so columns 2 and 3 sit progressively lower while the grid's overall height is
unchanged. This is what produces the staggered masonry look in the reference screenshot.

`.md-rvwcard__image` is `height: 130%; top: -15%` (another parallax reservoir),
`filter: grayscale(1)`. `.md-rvwcard__info` is a
`$white-70 + blur(5px)` full-bleed overlay, `padding: 40px`, `opacity: 0`; on hover
`opacity: 1` and name / job / text animate `fade-in-up .6s` staggered at **.2 / .5 / .8 s**.

At ≤992 the pattern changes to `repeat(2,1fr)` with `:nth-child(2n+2) { margin: 50px 0 -50px }`.

### 7.7 Contact (`.md-contact`)

```
.md-contact__socials   grid repeat(3,1fr) → repeat(2,1fr) ≤1540, gap 20px → 10px ≤992
.md-ctcard             flex; gap 20px; padding 30px; background #fff; filter: grayscale(1)
                       hover: filter revert + box-shadow 0 0 30px -5px rgba(37,37,37,.05)
.md-ctcard__image      35×35, opacity .5
.md-ctcard__details-title  20px Montserrat 500 lh 100%
.md-ctcard__details-desc   12px Montserrat 300 lh 160% $ink-60
.md-contact__separator 26px SK Zweig centred, ::before/::after 100px×1px $ink-30 margin 0 20px
.md-contact__form      400px, margin 0 auto, column, gap 5px
```

The card `filter: grayscale(1) → revert` is the same ink-in language applied to icons.

The form uses `.md-input` — a **floating-label** field:
`height: 55px; padding: 15px 20px; border: 1px solid $ink-20; background: #fff;
font-size: 14px`. The real `::placeholder` is `opacity: 0`; a sibling `.md-input__label`
is absolutely positioned `top: 50%; left: 20px; transform: translateY(-50%);
transition: .4s`. Using `:not(:placeholder-shown) + label` (excluding the `<textarea>`
pseudo variant) the label rises to `top: 10px`, `transform: revert`, `font-size: 11px`,
`color: $ink-30`, and the input gains `padding: 15px 20px 0`. Focus border
`rgba(0,76,255,.6)`.

### 7.8 Footer (`.md-footer`)

`background: #fff; overflow: hidden`. `.md-footer__content` is **100 vh**, flex column,
`padding: 100px 0 20px`, and contains three zones:

1. `.md-footer__text` — **600 px** wide, 18px, lh 140%, `$ink-50`, centred, with
   `margin: 0 0 auto 0` so it pins to the top of the flex column.
2. `.md-footer__quote` — `position: absolute`, **900 px** wide, centred; holds
   `.md-footer__quote-text` (54px SK Zweig 700 `#252324`, centred) and
   `.md-footer__quote-author` (20px SK Zweig, `$ink-40`) whose `::before`/`::after` are
   **100 px × 1 px `$ink-30` rules with `margin: 0 20px`** flanking the text.
3. `.md-footer__copyright` — `flex; justify-content: space-between; padding: 0 30px`,
   12px `$ink-50` — a maker credit left, "last updated" right.

At ≤1540 the quote shrinks to 800 px / 36px with `margin-top: -50px`.
At ≤768 the footer is no longer 100 vh; it becomes `min-height: 40vh` with
`gap: 80px`, the quote un-absolutes into flow at 24px, the flanking rules shrink to 40 px,
and the copyright becomes `column-reverse`, 10px.
A `box-shadow: 0 0 20px -5px rgba(37,35,36,.2)` is added on mobile.

---

## 8. Image treatment

Recurring rules — these are the "look" of the imagery:

| Pattern | Implementation | Where |
|---|---|---|
| Full-bleed cover | `object-fit: cover` on a `100vw × 100vh` layer | hero |
| Parallax reservoir | container `overflow: hidden`; image `height: 160%; top: -30%` | gallery |
| Parallax reservoir (alt) | image `height: 130%; top: -15%` | testimonials |
| Desaturate + dim | `filter: grayscale(1); opacity: .2` → `revert / 1` on reveal | project tiles |
| Desaturate + dim (soft) | `filter: grayscale(1) opacity(.4)` → `revert` | logo strips |
| Desaturate only | `filter: grayscale(1)` → `revert` on hover | contact cards, stack tiles |
| Greyscale portrait accent | `filter: grayscale(1); opacity: .7` | hero block portraits |
| Logo normalisation | `height: 60px; object-fit: contain` | logo strips |
| Logo normalisation (boxed) | `120 × 50; object-fit: contain; object-position: bottom left; opacity: .7` | project logos |

Logos are always normalised into a fixed box and left-bottom aligned, so different
aspect ratios align on a common baseline.

---

## 9. Motion language

### 9.1 Scroll library config

`lerp: 0.09` — a fairly heavy smoothing factor (slower follow). `smooth: false` on
smartphones, `true` on tablet and desktop. Nav travel is `duration: 3000, lerp: 0.05`.

### 9.2 Page-load choreography

Two layers, both CSS-driven:

**`@keyframes headerAppear`** on `.md-header`, applied on load:
`animation: headerAppear 1s ease-in-out 1 forwards`.
*(Keyframe body not present in `app.css`/`home.css` — declared in a chunk not
inspected. **UNKNOWN** — inferred: a `translateY` fade-in. See §12.)*

**Site loader** (`.md-loader` / `.md-introloader`, rendered while `isSiteLoading`):

```css
.md-loader__block            width: 20%; height: 100%; background: #fff;
                             transform: translateY(-200px);
                             animation: blockAppear .8s ease-in-out 1 forwards;
.md-loader__block:nth-child(2n) { background: #f9f9f9; }
/* each of the 5 blocks gets a longer duration and a later-ish delay: */
:first-child { animation-delay: -.1s; animation-duration: .8s; }
:nth-child(2){ animation-delay: 0s;   animation-duration: 1.1s; }
:nth-child(3){ animation-delay: .1s;  animation-duration: 1.4s; }
:nth-child(4){ animation-delay: .2s;  animation-duration: 1.7s; }
:nth-child(5){ animation-delay: .3s;  animation-duration: 2s;   }

@keyframes blockAppear { 0% { transform: translateY(-200px) }
                         to { transform: translateY(0); opacity: 1; background: #fff } }
```

So: **five vertical columns, 20 % wide each, alternating `#fff` / `#f9f9f9`, each
dropping down from above with a staggered duration that increases left→right** —
a curtain that resolves into a white field, then fades
(`.md-introloader.md-animate { opacity: 0 }` with `transition: 1s`).

`.md-introloader` is `position: fixed; z-index: 11; background: #fff; padding: 100px 150px;
align-items: flex-end; justify-content: flex-end` (content bottom-right; on mobile
`padding: 50px 0; height: 100lvh; justify-content: center`).

### 9.3 Text scramble — `.md-hacktext` (the signature reveal)

Every heading and nav link is a `<CompHacktext>` rendering:

```html
<h3 class="md-hacktext" :data-value="label" :style="{width: fixedWidth}" @mouseover="onhover">
  {{ label }}
</h3>
```

Behaviour, read from source:

```js
letters: "&Ø@#$%^&*><+!XYZABCDEFGHIJKLMNOPQRSTUVWXYZ"
timeout: duration ?? (len <= 4 ? 50 : len <= 8 ? 30 : 20)     // ms per tick
fixedWidth = el.offsetWidth + 5 + "px"                         // frozen on mount

iteration = 0
setInterval(() => {
  el.innerText = [...el.innerText].map((ch, i) =>
      i < iteration ? el.dataset.value[i]
                    : letters[Math.floor(Math.random() * letters.length)]
  ).join("");
  if (iteration >= el.dataset.value.length) clearInterval();
  iteration += 1 / 3;                                          // 3 ticks per character
}, timeout);
```

**Trigger:** `onhover` (mouseover), and `onCall()` fired by the scroll library when the
element's `data-scroll-call="title_<slug>"` enters — `data-scroll-offset="20%, 0"`,
`data-scroll-repeat`.

So headings **decrypt from symbol noise into their final text**, both on scroll-in and on
hover. `fixedWidth` prevents reflow while the glyph widths change. `.md-hacktext` is
`white-space: nowrap; cursor: pointer; transition: .3s`.

### 9.4 Scroll-reveal choreography (CSS-driven)

| Target | From | To | Duration |
|---|---|---|---|
| `.md-about__list p`, `.md-expblock__desc`, `.md-rvws__info-text` | `color: $ink-20` | `#252324` | `.5s` |
| `.md-about__list-images` | `grayscale(1) opacity(.4)` | `revert` | `.6s` |
| `.md-about__stack-title` | `opacity: .3` | `1` | `.6s` |
| `.md-about__stack-item` | `opacity:.3; grayscale(1)` | `opacity:1; revert` | `.3s` |
| `.md-expblock__project` | `grayscale(1); opacity:.2` | `revert; 1` | `.8s` |
| `.md-glrycard` | `opacity:0; grayscale(1) opacity(.4)` | `1; revert; translateY(0)` | `.8s` |
| `.md-rvwcard` | `opacity:.4` | `1` | `.3s` |

### 9.5 Hover micro-interactions (inventory)

| Element | Effect |
|---|---|
| `.mdbtn` | `scale(1.05)` / `scale(1)` on active |
| `.md-header__logo-link` | `opacity: .6`, `transition: .6s` |
| `.md-hacktext` (all headings, all nav) | character scramble |
| `.md-intcontacts__block-social` | `scale(1.1)` |
| `.md-about__stack-item` | icon `scale(1.05)` + white label plate expands right |
| `.md-expblock__project-link` | `opacity: .5 → .8`, arrow `rotate(45deg)` |
| `.md-glrycard` | frosted overlay + 3-stage staggered text cascade |
| `.md-glrycard__info-link` | arrow `rotate(45deg)` |
| `.md-rvwcard` | frosted overlay + 3-stage staggered text cascade |
| `.md-ctcard` | `grayscale(1) → revert` + soft shadow |
| `.md-block__info-desc` | frosted panel wipes out from behind |
| `.md-lvp__close` | `opacity: .6` + `rotate(90deg)` |
| `.md-select__list-item` | `background: #f3f3f3` |

### 9.6 Numerals — `.csmodo` odometer

A counting-numeral widget exists in `app.css` (`compOdometer.vue`): a `333.01 × 207.2`
window containing three absolutely-positioned columns of digits at `left: 0`,
`111.0044401776px`, `222.00888px` (i.e. exactly 1/3 and 2/3 of the width), font
`PT Mono 185px`. On animation each column translates `translateY(calc(-100% + 207.2px))`
over `3s`, staggered by `transition-duration: 2s` on the first column, using
`cubic-bezier(0, 1.01, 0, 2)` — a strong overshoot curve. Afterwards the whole window
runs `odometer-disappear` (`translateY(-100px)`, fade) at `3.2s`.

**Whether this is used on the home route is not confirmed — the home view chunk was not
retrieved. Marked UNKNOWN (§12).**

### 9.7 Easing & duration vocabulary

| Curve | Used for |
|---|---|
| `ease-in-out` | all reveal animations, loader blocks, mobile header |
| `cubic-bezier(.77, .24, .43, .87)` | `.md-mobheader` transform, `1s` |
| `cubic-bezier(0, 1.01, 0, 2)` | odometer overshoot |
| `linear` | loading spinner (`rotater`) |
| bare `.3s` (default `ease`) | the overwhelming majority of micro-interactions |
| `.5s` / `.6s` / `.8s` | colour / filter / card reveals |

Recurring durations: **`.3s`** for hover, **`.5s`–`.8s`** for reveals, **`1s`–`2s`** for
entrance choreography, **`3s`** for nav travel.

### 9.8 `prefers-reduced-motion`

**Not handled anywhere in the reference** — no `@media (prefers-reduced-motion)` block
exists in either stylesheet, and no guard appears in the inspected sources.
The implementation adds one (documented deviation).

---

## 10. Responsive behaviour

### Breakpoints (four, nested)

| Width | Effect |
|---|---|
| **> 1540** | container `1440px` fixed; `--ttitle: 56px`; stack tiles `80px`; gallery/testimonial type at full size; quote `900px / 54px` |
| **≤ 1540** | container `max-width: 992px; padding: 0 15px`; `--ttitle: 36px`; nav gap `50 → 35px`, link `16 → 14px`; stack tiles `65px`; testimonial cards `400 → 300px`, name `28 → 16px`; hero name `282 → 212px`, block title `96 → 46px`, numeral `372 → 242px`; contact socials `3 → 2` cols; footer quote `900→800px`, `54 → 36px` |
| **≤ 1200** | hero name `212 → 160px`; numerals `242 → 202px`; block count margins tighten |
| **≤ 992** | container `768px`; `--ttitle: 26px`; grid `30% → 20% auto`; gallery rows `170 → 120px`; testimonials `3 → 2` cols; experience projects `3 → 2` cols; contact padding `100 → 50px` |
| **≤ 768** | container `576px`; **`--ttitle: 32px`** (up), `--desubtitle: 14px`, `--desctext: 4.16667vw`; **desktop header `display:none`**, mobile header on; every section `100 → 50px` padding; all grids become `flex-direction: column` with `gap: 20px`; hero `500 → 600lvh`; gallery overlay `display:none`; footer un-absolutes |
| **≤ 576** | container `max-width: unset`; inputs shrink to `50px`; `.md-app { min-height: 1000px }`; `-webkit-tap-highlight-color: transparent` |

### Mobile-specific design (not merely scaled)

1. **Header swaps entirely** — a `90 × 90` black square wordmark centred at top, which
   expands to a `350 × 450` panel on tap. The desktop bar is removed, not shrunk.
2. **Side rails become a bottom bar** — `.md-intcontacts` switches from a full-height
   sticky overlay with vertical `writing-mode` rails to a `position: fixed` frosted
   (`rgba(37,35,36,.4) + blur(5px)`) panel anchored bottom-centre, with the social icons
   in a **horizontal row** (`30 × 30`, up from `20 × 20`) and the mail link de-rotated to
   horizontal. The 200 px hairlines are `display: none`.
3. **About** becomes a flex column; the titling block becomes a **300 px wide block with a
   1 px vertical rule running down its left edge** (`.md-about__titling:after`,
   `top:-15px; left:-20px; bottom:-15px`), a device that appears nowhere on desktop.
4. **Experience** — `.md-exp__titling` becomes `position: sticky` at
   `top: calc(100lvh - 250px)` with `height: 50px; justify-content: flex-end`, and each
   `.md-exp__block` gets `margin: -200px 0 0 0; padding: 0 0 200px 0` with its
   `.md-exp__block-title` sticky at `top: calc(100lvh - 200px)`, `height: 200px`,
   `background: #fff; z-index: 2`. This produces a **pinned-heading effect where each
   company name docks near the bottom of the screen and is replaced by the next**.
5. **Gallery** drops the hover overlay entirely and re-flows `4 → 3` columns.
6. **Testimonials** staircase is disabled (`margin: unset`).
7. Uses modern viewport units throughout: `100lvh`, `100dvh`, `lvh` — `lvh` (large
   viewport) for pinned heights so the mobile browser chrome does not jump the layout.

---

## 11. Assets & dependencies observed

| Aspect | Value |
|---|---|
| Fonts | Montserrat (300/400/500/600) self-hosted woff2+woff; SK Zweig (400/700) self-hosted ttf+woff+woff2 |
| Icons | SVG sprite modules under `src/assets/icons`; ~55 stack-logo SVGs under `/img/*.svg` |
| Images | `/media/*` — hero photograph, 10 gallery images, 6 testimonial portraits |
| Libraries | `locomotive-scroll@4.1.3`; `webpack` + `@vue/vue-loader-v15`; `babel-loader`; `thread-loader` |
| Analytics | Yandex Metrika (`mc.yandex.ru`) with `webvisor`, `clickmap`, `trackLinks` |
| JS payload | `app.js` 45 455 B + `chunk-vendors` (not measured) |
| CSS payload | `app.css` 25 108 B + `home.css` 21 957 B |
| Cache headers | content-hashed filenames (`app.6597a6a3.css`) |
| Source maps | **shipped publicly** (`app.js.map`, 168 436 B) |

No CSS framework is used — every rule is hand-authored. No `tailwind`, `bootstrap` or
utility CSS is present (the `bootstrap4`/`bootstrap5`/`tailwind` names in the asset list
are merely *stack logos* the author displays).

---

## 12. UNKNOWNs

Values I could **not** determine reliably and did **not** invent:

1. **`@keyframes headerAppear`** body — referenced by `.md-header` but not present in the
   two stylesheets fetched. Likely a `translateY`/opacity entrance; exact values unknown.
   *(Implementation uses a defined equivalent — documented in `VISUAL_QA.md`.)*
2. **Home-view component sources** — `app.js` contains only shared/shell components
   (`compHeader`, `compFooter`, `compSiteloader`, `compHacktext`, `compTitle`,
   `compOdometer`, `compButton`, form inputs). The home route's section components live in
   a lazy `home` chunk whose JS was not retrieved. Their *template structure* was therefore
   reconstructed from the DOM + CSS rather than read from source.
3. **Scroll-call offsets per element** — only the generic `.md-hacktext`-driven title
   offset (`20%, 0`) was read. Per-section `data-scroll-offset` / `data-scroll-speed`
   values (notably the parallax speeds on gallery and testimonial images) were not
   extracted. **The parallax magnitude is UNKNOWN**; the reservoir geometry
   (`160%/-30%`, `130%/-15%`) bounds it but the actual travel per scroll is not known.
4. **`.csmodo` odometer usage on home** — component exists; whether the home route
   instantiates it is unconfirmed.
5. **Exact hero → About transition.** The hero is `500vh` with absolutely-positioned
   blocks and a `z-index` stack; how the section hands off to `.md-about` (a pin release,
   a fade, or a plain scroll) is not determinable from CSS alone.
6. **`md-loader` timing vs. real asset load** — `isSiteLoading` is set to `true` in
   `data()`; the code that sets it to `false` (and whether it waits on any promise /
   minimum duration) lives in code not retrieved.
7. **Mobile menu open/close exact easing interplay** — the two-phase keyframes are known,
   but `md-closing` runs `mobHeadClose 2s ease-in-out .5s` while the JS `setTimeout` for
   state reset is `2500ms`; the visual result at the boundary was not frame-verified.
8. **Hover states on touch devices** — not testable in the available environment.
9. **The `.md-lvp` modal (project detail / hire form)** — full styling captured, but it is
   only reachable behind `openRequestModal`; its open/close animation on real interaction
   was not observed end-to-end.

---

## 13. Verified vs. inferred — summary

| Confidence | Items |
|---|---|
| **Measured directly** (computed styles / rects) | container widths, all grid templates, all section heights and offsets, all type sizes/weights/line-heights, all colours, button metrics, card metrics, mobile reflow of every section |
| **Read from stylesheet source** | all transitions, all keyframes present in the two sheets, hover mechanics, filter recipes, sticky/pinned mobile behaviour, breakpoint values |
| **Read from JS source** | locomotive config (`lerp .09`), scroll thresholds (`100` / `300`), nav travel (`3000ms`), hash targets, hacktext algorithm and its `letters` alphabet, mobile header phase timings, loader block count |
| **Inferred (flagged)** | `headerAppear` body, parallax magnitudes, home-chunk template structure |
| **Unknown (flagged)** | listed in §12 |
