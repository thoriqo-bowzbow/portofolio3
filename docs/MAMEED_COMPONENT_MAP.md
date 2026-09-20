# Mameed.com — Component Map

Reference: `https://mameed.com/` · inspected 2026-09-20 · see `MAMEED_RECON.md` for
measurements and evidence.

This document maps the reference's **DOM structure, class vocabulary and composition
graph** onto the implementation's component tree. It is the bridge between recon and
code.

---

## 1. Reference's own architecture

The reference is Vue 2 + webpack. Its naming convention is a hand-rolled BEM:

```
md-<block>            element root           .md-glry
md-<block>__<element> child                  .md-glry__grid
md-<block>__<element>--<modifier>            .md-lvpform-input--photo
md-<state>            state class            .md-scrolled  .md-show  .md-opened  .md-closing
is-inview             scroll-revealed flag
c-<block>             third-party            .c-scrollbar
```

`md-` = "mameed". State classes are toggled from JS; `is-inview` is toggled by the
scroll library. 11 root blocks were identified.

### Shell graph (confirmed from extracted sources)

```
BaseLayout.vue                          → .md-app[data-scroll-container]
├── compHeader.vue                     → header.md-header__wrapper[data-scroll-section]
│   ├── .md-header.container
│   │   ├── .md-header__logo     → logo.svg (80×80)
│   │   ├── .md-header__links    → compHacktext × 5 (nav)
│   │   └── .md-header__actions  → compButton "Get in touch"
│   ├── .md-mobheader            → logo.svg (90×90 black square; expands to 350×450)
│   └── .md-intcontacts          → 2 × .md-intcontacts__block (socials | mail)
├── RouterView[data-scroll-container]
│   └── <home view>              → the 6 content sections + hero
├── compFooter.vue               → footer.md-footer[data-scroll-section]
│   ├── .md-footer__text
│   ├── .md-footer__quote        → __quote-text + __quote-author
│   └── .md-footer__copyright    → __copyright-made + __copyright-update
├── compSiteloader.vue           → .md-loader / .md-introloader (v-if isSiteLoading)
└── compLeaveapp.vue             → exit-intent modal
```

### Shared components (all confirmed present in `app.js`)

| Component | Renders | Reused by |
|---|---|---|
| `compHacktext.vue` | `<h3.md-hacktext :data-value>` | **every heading and nav link** |
| `compTitle.vue` | wraps `compHacktext` with `data-scroll-call`, `data-scroll-offset="20%, 0"` | all section titles |
| `compButton.vue` | `.mdbtn` + optional `.mdbtn__icon` / `.mdbtn__loading` | header, hero blocks, project links, footer |
| `compHeader.vue` | desktop bar + mobile square + side rails | shell |
| `compFooter.vue` | quote + credits | shell |
| `compSiteloader.vue` | 5-column curtain | shell |
| `compOdometer.vue` | `.csmodo` counting numerals | *usage unconfirmed* |
| `compInput.vue` / `compTextarea.vue` / `compSelect.vue` / `compPhotoUpload.vue` | form primitives | contact form, modals |
| `compLeaveapp.vue` | exit modal | shell |
| `formRequest/Review/Employee.vue` | modal bodies | `.md-lvp` |

`compHacktext` and `compButton` are the two components that define the site's
personality — they appear in the header, in the hero, in six sections and in the footer.

---

## 2. Section inventory

| # | Reference block | `id` | Role | Key children |
|---|---|---|---|---|
| H | `.md-header` | — | fixed bar + rails + mobile square | logo, 5 nav links, CTA btn, 4 socials, mail rail |
| 1 | `.md-interctv` | `#main` | **Hero** — 500vh pinned narrative | title, fixed bg image, frosted intro, 3 story blocks |
| 2 | `.md-about` | `#about` | **About** — bio + stack | title, subtitle, 23 paras, 4 logo strips, 3 stack groups |
| 3 | `.md-exp` | `#experience` | **Experience** — 3 roles × projects | title, 3 rows, 18 project tiles |
| 4 | `.md-glry` | `#projects` | **Highlights** — 10-tile mosaic | title, subway grid, hover overlays |
| 5 | `.md-rvws` | `#reviews` | **Testimonials** — staircase | title, blurb, CTA, 6 portrait cards |
| 6 | `.md-contact` | `#contact` | **Contact** — cards + form | title, 6 contact cards, separator, form |
| 7 | `.md-footer` | — | **Footer** — 100vh quote | blurb, quote + attribution, legal |

---

## 3. Implementation architecture

Target: **Nuxt 3 · Vue 3 · TypeScript · SCSS · GSAP + ScrollTrigger · Lenis**.

### 3.1 Directory layout

```
portofolio3/
├── assets/
│   ├── styles/
│   │   ├── _tokens.scss          # colour, type, space, breakpoint, motion tokens
│   │   ├── _mixins.scss          # respond(), container(), grid-split(), reveal()
│   │   ├── _reset.scss           # normalise + reference reset semantics
│   │   ├── _typography.scss      # h1–h6, body, .u-* type utilities
│   │   ├── _layout.scss          # .container, section rhythm, .lg-grid
│   │   ├── _motion.scss          # keyframes, reveal classes, reduced-motion
│   │   └── main.scss             # @use entrypoint
│   └── icons/                    # original SVG marks
├── components/
│   ├── layout/
│   │   ├── SiteHeader.vue        # desktop bar + mobile square + side rails
│   │   ├── SiteFooter.vue        # 100vh quote footer
│   │   ├── SiteLoader.vue        # 5-column curtain
│   │   ├── SideRails.vue         # .md-intcontacts equivalent
│   │   └── NavLinks.vue          # shared nav list
│   ├── sections/
│   │   ├── HeroSection.vue       # 500vh pinned hero
│   │   ├── HeroStoryBlock.vue    # 1 of 3 story blocks
│   │   ├── AboutSection.vue
│   │   ├── StackGroup.vue        # one stack box + tiles
│   │   ├── StackTile.vue         # 80/65/50 tile with slide-out label
│   │   ├── ExperienceSection.vue
│   │   ├── ExperienceRow.vue     # one role
│   │   ├── ProjectTile.vue       # logo + name + desc + link
│   │   ├── HighlightsSection.vue
│   │   ├── HighlightTile.vue     # mosaic cell + hover takeover
│   │   ├── TestimonialsSection.vue
│   │   ├── TestimonialCard.vue   # staircase card
│   │   ├── ContactSection.vue
│   │   ├── ContactCard.vue
│   │   └── ContactForm.vue
│   └── ui/
│       ├── ScrambleText.vue      # compHacktext equivalent
│       ├── SectionTitle.vue      # compTitle equivalent (scramble + reveal trigger)
│       ├── MdButton.vue          # .mdbtn
│       ├── MdInput.vue           # floating-label input
│       ├── MdTextarea.vue
│       └── RevealText.vue        # ink-in body copy wrapper
├── composables/
│   ├── useSmoothScroll.ts        # Lenis lifecycle + rAF + ScrollTrigger proxy
│   ├── useScrollState.ts         # scrollY-derived flags (scrolled / railsVisible)
│   ├── useReveal.ts              # IntersectionObserver → .is-inview
│   ├── useScramble.ts            # character-scramble algorithm
│   ├── useParallax.ts            # image-reservoir parallax
│   ├── useReducedMotion.ts       # prefers-reduced-motion
│   └── useAnchorNav.ts           # eased anchor travel
├── data/
│   ├── profile.ts                # name, roles, intro, bio paragraphs
│   ├── experience.ts             # roles + their projects
│   ├── projects.ts               # highlights mosaic
│   ├── stack.ts                  # 3 stack groups + tiles
│   ├── testimonials.ts           # 6 cards
│   ├── contact.ts                # contact channels + form copy
│   ├── navigation.ts             # nav items ↔ section ids
│   └── types.ts                  # shared interfaces
├── public/
│   ├── images/                   # original imagery
│   └── icons/                    # original marks
├── layouts/
│   └── default.vue               # shell: header + slot + footer
├── pages/
│   └── index.vue                 # composes the 6 sections
├── docs/
│   ├── MAMEED_RECON.md
│   ├── MAMEED_COMPONENT_MAP.md
│   ├── VISUAL_QA.md
│   └── PRODUCTION_AUDIT.md
└── nuxt.config.ts
```

### 3.2 Reference block → implementation component

| Reference | Implementation | Notes |
|---|---|---|
| `BaseLayout.vue` | `layouts/default.vue` | shell; loader is a child of the layout |
| `.md-header__wrapper` | `SiteHeader.vue` | same slide-away behaviour at `scrollY > 100` |
| `.md-mobheader` | `SiteHeader.vue` (`MobileMark`) | two-phase expansion keyframes |
| `.md-intcontacts` | `SiteRails.vue` | desktop rails / mobile bottom bar |
| `.md-loader` / `.md-introloader` | `SiteLoader.vue` | 5 columns, staggered durations |
| `.md-interctv` | `HeroSection.vue` | 500vh; owns ScrollTrigger pin |
| `.md-interctv__block` | `HeroStoryBlock.vue` | × 3; `variant` prop flips to `row` |
| `.md-block__count-num` + image | inside `HeroStoryBlock.vue` | numeral + greyscale portrait |
| `.md-about` | `AboutSection.vue` | |
| `.md-about__list-images` | `AboutSection.vue` (`LogoStrip`) | inline sub-component (used 4×) |
| `.md-about__stack` | `StackGroup.vue` | × 3 |
| `.md-about__stack-item` | `StackTile.vue` | × 55; `data-label` slide-out |
| `.md-exp` | `ExperienceSection.vue` | |
| `.md-exp__info` | `ExperienceRow.vue` | × 3 |
| `.md-expblock__project` | `ProjectTile.vue` | × 18 |
| `.md-glry` | `HighlightsSection.vue` | |
| `.md-glrycard` | `HighlightTile.vue` | × 10; `featured` prop for 2×2 |
| `.md-rvws` | `TestimonialsSection.vue` | |
| `.md-rvwcard` | `TestimonialCard.vue` | staircase via `:nth-child` in CSS |
| `.md-contact` | `ContactSection.vue` | |
| `.md-ctcard` | `ContactCard.vue` | × 6 |
| `.md-contact__form` | `ContactForm.vue` | |
| `.md-input` | `MdInput.vue` | floating label |
| `.md-footer` | `SiteFooter.vue` | |
| `compHacktext.vue` | `ui/ScrambleText.vue` | |
| `compTitle.vue` | `ui/SectionTitle.vue` | |
| `compButton.vue` | `ui/MdButton.vue` | |
| `compOdometer.vue` | *not ported* | usage unconfirmed (RECON §12.4) |

### 3.3 Composable → reference mechanism

| Composable | Replaces | Reference source of truth |
|---|---|---|
| `useSmoothScroll` | `new LocomotiveScroll({...})` | `BaseLayout.vue`: `lerp: 0.09`, smooth off on smartphone |
| `useScrollState` | `scroll.on('scroll', ...)` in `compHeader.vue` | thresholds `> 100` and `< 300` |
| `useReveal` | locomotive `data-scroll` / `is-inview` | every `.is-inview` CSS rule |
| `useScramble` | `runAnimation()` in `compHacktext.vue` | alphabet, per-tick timeout, `iteration += 1/3` |
| `useAnchorNav` | `goTo()` in `compHeader.vue` | `duration: 3000`, `lerp: 0.05` |
| `useParallax` | locomotive `data-scroll-speed` | **magnitude UNKNOWN** — bounded by reservoir geometry |

### 3.4 Data → component bindings

| Data module | Feeds |
|---|---|
| `profile.ts` | `HeroSection` (name, intro), `AboutSection` (bio paras, subtitle, logo strips), `SiteFooter` (blurb, quote) |
| `experience.ts` | `ExperienceSection` → `ExperienceRow` → `ProjectTile` |
| `projects.ts` | `HighlightsSection` → `HighlightTile` |
| `stack.ts` | `AboutSection` → `StackGroup` → `StackTile` |
| `testimonials.ts` | `TestimonialsSection` → `TestimonialCard` |
| `contact.ts` | `ContactSection` → `ContactCard`, `ContactForm`; also `SiteRails` |
| `navigation.ts` | `SiteHeader`, `SiteFooter` |

All presentation components receive data as props — no component imports a `data/`
module directly except `pages/index.vue` and `layouts/default.vue`. This keeps content
swappable and satisfies the "content separate from presentation" requirement.

---

## 4. Class-naming strategy

The reference's `md-` prefix is its own. The implementation uses the **same structural
idiom** (block / `__element` / state class) with a project-scoped prefix so the mapping
stays legible without implying origin:

| Reference | Implementation | Where |
|---|---|---|
| `.md-header` | `.site-header` | `SiteHeader.vue` |
| `.md-header__wrapper.md-scrolled` | `.site-header.is-scrolled` | state class |
| `.md-mobheader.md-opened` | `.mobile-mark.is-open` | state class |
| `.md-intcontacts` | `.side-rails` | `SideRails.vue` |
| `.mdbtn` | `.btn` | `MdButton.vue` |
| `.md-hacktext` | `.scramble` | `ScrambleText.vue` |
| `.md-interctv` | `.hero` | `HeroSection.vue` |
| `.md-block__info` | `.hero-block__info` | `HeroStoryBlock.vue` |
| `.md-about` | `.about` | `AboutSection.vue` |
| `.md-about__stack-item` | `.stack-tile` | `StackTile.vue` |
| `.md-exp` | `.experience` | `ExperienceSection.vue` |
| `.md-expblock__project` | `.project-tile` | `ProjectTile.vue` |
| `.md-glry` | `.highlights` | `HighlightsSection.vue` |
| `.md-glrycard` | `.highlight-tile` | `HighlightTile.vue` |
| `.md-rvws` | `.testimonials` | `TestimonialsSection.vue` |
| `.md-rvwcard` | `.testimonial-card` | `TestimonialCard.vue` |
| `.md-contact` | `.contact` | `ContactSection.vue` |
| `.md-ctcard` | `.contact-card` | `ContactCard.vue` |
| `.md-footer` | `.site-footer` | `SiteFooter.vue` |
| `.is-inview` | `.is-inview` | **kept** — shared reveal contract |
| `.container` | `.container` | **kept** — same semantics |

`.is-inview` and `.container` are kept verbatim because they are behavioural/generic
rather than identity-bearing, and keeping them makes the recon→code mapping direct.

---

## 5. Token map

Reference `:root` variables are preserved 1:1 in name and value (SCSS):

```scss
// _tokens.scss
$ttitle: 56px;    $tsubtitle: 20px;    $desctext: 23px;
// ≤1540px
$ttitle: 36px;    $tsubtitle: 16px;    $desctext: 15px;
// ≤992px
$ttitle: 26px;    $tsubtitle: 12px;    $desctext: 13px;
// ≤768px
$ttitle: 32px;    $tsubtitle: 14px;    $desctext: 4.16667vw;
```

Breakpoints (from the reference, exact):

```scss
$bp-xl: 1540px;   // container 1440 → 992;  --ttitle 56 → 36
$bp-lg: 1200px;   // hero type step-down
$bp-md:  992px;   // container 992 → 768;   grid 30% → 20%
$bp-sm:  768px;   // container 768 → 576;   desktop header → mobile mark
$bp-xs:  576px;   // container unset
```

Motion tokens (extracted frequency analysis):

```scss
$ease-default: ease;                              // .3s — the whole hover layer
$ease-reveal:  ease-in-out;                       // .5–.8s reveals
$ease-panel:   cubic-bezier(.77,.24,.43,.87);     // 1s — mobile mark
$ease-overshoot: cubic-bezier(0,1.01,0,2);        // odometer
$dur-hover:  .3s;
$dur-reveal: .5s;
$dur-card:   .8s;
$dur-enter:  1s;
$dur-nav:    3000ms;
```

---

## 6. Fidelity checklist — what must NOT be simplified

These are the elements that carry the design's identity. Collapsing any of them into a
generic card/grid would break fidelity:

1. **The scramble reveal** on every heading and nav link — must encrypt→decrypt, on both
   scroll-enter *and* hover, with the frozen `+5px` width.
2. **Ink-in body copy** — `rgba(37,35,36,.2) → #252324` on scroll-in. Not a fade.
3. **The 500vh hero** with layered fixed image, centred display name, frosted intro card,
   and three absolutely-positioned story blocks at 180/280/380 vh.
4. **Numeral + greyscale portrait** motif in each hero story block (`opacity: .3`
   numeral overlapping a small photo).
5. **The 30% / auto master grid** shared by all six content sections — 50px gap, 100px
   section padding.
6. **The alternating `#fafafa` / `#fff` section banding** as the only separator.
7. **Stack-tile label slide-out** (`max-width: 0 → 300%`, `padding-left: 110%`, white
   plate, `z-index: -1`).
8. **The gallery mosaic** — 4 cols, 170px rows, 10px gap, first and seventh spanning 2×2,
   images at `160%` height with `-30%` top.
9. **The gallery hover takeover** — frosted `blur(10px)` overlay with the 0.5 / 0.8 / 1.4s
   three-stage text cascade.
10. **The testimonial staircase** — paired positive/negative margins
    (`100/-100`, `200/-200`) that offset without adding height.
11. **The 100vh footer** with a 900px quote pinned centre, flanked by 100px hairlines.
12. **The mobile mark** — a 90×90 black square that expands in two phases to 350×450.
13. **Mobile bottom contact bar** replacing the desktop side rails, with de-rotated text
    and enlarged icons.
14. **The mobile pinned experience headings** (`top: calc(100lvh - 250px)`).
15. **Square corners everywhere** — `border-radius: 0` is a deliberate design position.
16. **Four breakpoints, including the non-monotonic type scale** (`--ttitle` rises
    26 → 32px at 768px, `--desctext` becomes `4.16667vw`).

---

## 7. Deliberate deviations

| # | Deviation | Reason |
|---|---|---|
| 1 | **Lenis instead of locomotive-scroll 4** | locomotive v4 is unmaintained and its transform-scroll breaks native `sticky`, `scrollTo`, IntersectionObserver and browser scrollbars. Lenis is the modern equivalent and keeps the observed feel (`lerp 0.09`). |
| 2 | **GSAP + ScrollTrigger** instead of a bespoke rAF loop | Requested stack; also gives correct pinning/cleanup, which the reference does manually. |
| 3 | **`prefers-reduced-motion` support added** | The reference has none; required for a production-grade build. |
| 4 | **Visible `:focus-visible` ring added** | The reference sets `outline: none` globally, which is an accessibility failure. |
| 5 | **Original type pairing instead of SK Zweig** | SK Zweig is a commercial retail licence and cannot be redistributed. A metrically-similar licensed alternative is used; the display/body split, weights and hierarchy are preserved. |
| 6 | **Original content, imagery and marks** | Required — no reference copy, photography, logos or illustrations are reproduced. |
| 7 | **`.csmodo` odometer not ported** | Its use on the home route is unconfirmed (RECON §12.4); porting it would be inventing motion, which the brief forbids. |
