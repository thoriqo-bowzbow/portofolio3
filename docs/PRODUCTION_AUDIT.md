# Production Audit

Implementation: Nuxt 3.21.11 · Vue 3.5.43 · Vite 7.3.6 · Nitro 2.13.4 · Node 24.
Audited 2026-09-20 against a clean `npm install` on Windows.

---

## 1. Build

```
npm run verify        # typecheck then build
```

| Step | Result |
|---|---|
| `npm install` | 636 packages, no errors |
| `npm run typecheck` (`vue-tsc`, strict) | **0 errors** |
| `npm run build` | **succeeds**, client + server + Nitro |
| `npm run generate` | configured; static output to `.output/public/` |
| Dev server console | no errors, no warnings |

The build is reproducible from a clean checkout with no environment variables,
no secrets and no external services. Fonts and every image are committed and
self-hosted, so it builds offline.

### Payload

| Asset | Raw | Compressed |
|---|---|---|
| JS total | 381 kB | — |
| largest chunk (Vue + GSAP + Lenis + app) | 187.2 kB | 69.8 kB gzip / 62.2 kB brotli |
| second chunk (vendor) | 142.5 kB | 54.6 kB gzip / 48.7 kB brotli |
| CSS total | 48.1 kB | 5.0 kB gzip for the main sheet |
| Images + icons (**94 SVG files**) | 136.6 kB | — |

The entire image and icon set is hand-generated SVG and weighs less than one
typical hero photograph. There are no raster assets, no video and no icon-font.

---

## 2. Responsive verification

`npm run audit:responsive` drives headless Chrome through eight viewports and
asserts three things per viewport: no horizontal document overflow, no element
escaping the viewport horizontally, and correct fluid token resolution.

| Viewport | `--ttitle` | container | split | h-overflow | offenders |
|---|---|---|---|---|---|
| 375×812 | 32px ✓ | full-bleed | flex column | none | 0 |
| 390×844 | 32px ✓ | full-bleed | flex column | none | 0 |
| 430×932 | 32px ✓ | full-bleed | flex column | none | 0 |
| 768×1024 | 32px ✓ | 576px | flex column | none | 0 |
| 820×1180 | 26px ✓ | 768px | 20% / auto | none | 0 |
| 1366×768 | 36px ✓ | 992px | 30% / auto | none | 0 |
| 1440×900 | 36px ✓ | 992px | 30% / auto | none | 0 |
| 1920×1080 | 56px ✓ | 1440px | 30% / auto | none | 0 |

**8 / 8 clean.** The reference's non-monotonic type step (`--ttitle` rising from
26px to 32px at the 768px breakpoint, `--desctext` becoming `4.1667vw`) is
reproduced at every width.

---

## 3. Geometries

`npm run compare` diffs 49 measured properties against the values captured during
reconnaissance. **47 match.** The two that do not are both explained and accepted
in [`VISUAL_QA.md`](VISUAL_QA.md): one is a dormant animation state sampled at
`scrollY 0`, the other is a 0.6% document-height difference driven entirely by
content volume.

Structural checks all pass exactly: container width and offset, master grid
tracks and gap, all section heights to ±3%, every type size and weight, every
component dimension (stack tiles, gallery tiles, cards, form, buttons).

---

## 4. Accessibility

Audited with axe-core 4.12.1 via `agent-browser a11y`.

```
45 passes · 1 violation · 1 incomplete
```

### Fixed during this pass

| Finding | Impact | Resolution |
|---|---|---|
| `document-title` — no `<title>` | serious | Title, description and OG tags added |
| `page-has-heading-one` — no `h1` | moderate | Hero name is now the `h1`; a visually-hidden full name and role accompanies the display word |
| `region` — content outside a landmark | moderate | Side rails are now an `<aside aria-label>` |
| `color-contrast` — hero type over the backdrop | serious | Backdrop redrawn darker with an even scrim across all bands |

### Remaining violation — `color-contrast`, 10 nodes

Two distinct causes, both examined rather than dismissed.

**a) Hero type over the backdrop — 5 nodes, reported at 1.04:1. False positive.**

axe-core cannot evaluate text rendered over an image, so it falls back to the
page background (`#fafafa`) and reports white-on-white. Real contrast was
measured directly with `scripts/backdrop-contrast.js`, which rasterises the
backdrop and samples it on a grid:

```
samples            1276
min ratio          6.17:1
mean ratio        10.11:1
max ratio         16.48:1
below 3:1              0
below 4.5:1            0
```

The worst pixel anywhere on the backdrop — `rgb(81,99,119)` — still yields
**6.17:1** against white. The hero type passes comfortably in reality.

**b) Dormant ink-in body copy — 5 nodes, reported at 1.95:1. Accepted trade-off.**

Body copy rests at `rgba(37,35,36,.32)` and transitions to `#252324` when it
enters the viewport. This is the reference's signature effect and the primary
thing this project set out to reproduce; removing it would defeat the purpose.

Four mitigations are in place:

1. The dormant tone was raised from the reference's `0.2` (1.49:1) to `0.32`
   (1.95:1) — still clearly inactive, materially more legible.
2. The reveal fires when a line **touches the viewport edge** (IntersectionObserver
   `rootMargin` bottom 0), so the 0.5s transition completes well before the text
   reaches the reading zone. Copy is never *read* in the dormant tone.
3. `prefers-reduced-motion` reveals everything immediately with no transition.
4. `prefers-contrast: more` disables the effect entirely and renders copy at full
   contrast.

`docs/VISUAL_QA.md` records this as an open deviation.

### Manual checks

| Check | Result |
|---|---|
| Heading hierarchy | `h1` hero → `h2` section/block → `h3` card and item |
| Landmarks | `header`, `main`, `footer`, `aside` present |
| Skip link | Present, visible on focus |
| Focus visible | 2px `rgba(0,76,255,.6)` ring at 3px offset on every interactive element — **added**; the reference sets `outline: none` globally |
| Keyboard operation | Nav links are tabbable with `role="link"` and Enter/Space handlers; form fields are properly `<label for>`-associated |
| Images | Decorative imagery is `alt=""` + `aria-hidden`; meaningful images carry alt text |
| Form | `aria-invalid` and `aria-describedby` wired to per-field error text |
| Reduced motion | Honoured in every composable |

---

## 5. Runtime hygiene

| Concern | Status |
|---|---|
| Console errors | none |
| Page errors | none |
| Hydration mismatches | none — verified after the component-registration fix |
| Broken internal anchors | none; all five nav targets resolve to real section ids |
| Broken asset references | none; all 94 SVGs resolve |
| GSAP timelines | created in `onMounted`, killed in `onBeforeUnmount` |
| ScrollTriggers | `kill()`ed on unmount, `ScrollTrigger.refresh()` on layout settle |
| IntersectionObservers | `disconnect()`ed on unmount |
| Lenis | module-scoped and reference-counted; `destroy()`ed when the last consumer unmounts, rebuilt on the mobile breakpoint flip |
| Event listeners | scroll (shared, ref-counted), resize, pointer and keydown all removed on unmount |
| Timers | loader and mobile-mark timers cleared on unmount |
| `prefers-reduced-motion` | smoothing skipped, parallax not attached, reveals immediate, curtain suppressed |

### Notable fixes made during hardening

1. **Hydration mismatch** — nested component directories were being registered
   with a path prefix (`<LayoutSiteHeader>`), so nothing resolved on the client
   and the shell rendered empty. Fixed with `components: [{ path, pathPrefix:
   false }]`.
2. **Header never hid on scroll** — a `forwards` entrance animation outranks
   ordinary declarations, so an animated `transform` silently overrode the
   scroll-hide rule. The entrance moved to the wrapper; the transform stayed on
   the bar.
3. **Sass install failure** — `@use` cannot target `.css`, and Sass resolves
   partials itself so Vite's `additionalData` never reached them. Font CSS moved
   into Vite's CSS pipeline and each partial now `@use`s tokens and mixins
   explicitly via `loadPaths`.
4. **Missing mark binding** — the persistent black mark lacked its `is-scrolled`
   class, so it never appeared on scroll.
5. **Hero backdrop scrolled away** — story blocks landed on the bare page
   background with unreadable white type. The atmosphere is now a sticky layer
   spanning the full 500vh.

---

## 6. Dependencies

**Runtime:** 6 direct dependencies.

| Package | Why |
|---|---|
| `nuxt`, `vue`, `vue-router` | framework |
| `gsap` | scroll-driven animation and pinning |
| `lenis` | smooth scroll |
| `@fontsource/montserrat`, `@fontsource-variable/playfair-display` | self-hosted fonts, no runtime CDN |

**Dev:** 4 — `sass`, `typescript`, `vue-tsc`, `@types/node`.

No CSS framework, no utility library, no component kit, no icon package, no
animation helper beyond GSAP. Two dependencies were introduced and then removed
after review: `stylelint` and its configs, once it became clear the project's SCSS
is fully covered by the design-token system and the token-resolution assertions
in the responsive audit.

Fonts are self-hosted through `@fontsource`, so there is no runtime network
dependency and no third-party request on page load. No analytics, no trackers.

### Licensing

- **Montserrat** — SIL Open Font License, redistributable.
- **Playfair Display** — SIL Open Font License, redistributable.
- The reference's display face (SK Zweig) is a commercial retail licence and is
  **not** redistributed. It is substituted by an open-licensed editorial serif in
  the same role, with the display/body split, weights and hierarchy preserved.
  See `docs/VISUAL_QA.md` deviation 8.
- All imagery, marks and icons are generated by
  `scripts/generate-assets.mjs`. No third-party artwork, photography or
  trademark is bundled.

---

## 7. Content and asset provenance

Every asset in `public/` is emitted by `scripts/generate-assets.mjs` from
parameters defined in that file — deterministic, diffable and regenerable with
`npm run assets`:

| Asset family | Count | Description |
|---|---|---|
| `images/hero-backdrop.svg` | 1 | atmospheric gradient with an even scrim |
| `images/hero-foreground.svg` | 1 | transparent sculptural form that overlaps the hero name |
| `images/highlights/*.svg` | 10 | abstract product compositions drawn for the parallax safe band |
| `images/testimonials/*.svg` | 6 | rim-lit figure studies |
| `images/project-marks/*.svg` | 9 | 120×50 project monograms |
| `icons/stack/*.svg` | 50 | technology monograms, golden-angle hue distribution |
| `icons/*.svg` | 15 | interface glyphs |
| `icons/logo.svg`, `logo-dark.svg`, `favicon.svg` | 3 | wordmark |

`data/stack-icons.json` is emitted alongside the stack SVGs so the data layer and
the files on disk cannot drift.

---

## 8. Reproducing this audit

```bash
npm install
npm run verify                # typecheck + build, both clean

npx nuxi dev --port 3000      # in one shell, for the browser-driven checks

node scripts/audit-responsive.mjs <session>   # 8 viewports, overflow + tokens
node scripts/compare-reference.mjs <impl.json> # geometry diff vs the reference
node scripts/capture.mjs <session> 1440 900 impl shots   # screenshots
```

`scripts/backdrop-contrast.js` is an in-page probe, run via
`agent-browser eval --stdin` while the site is loaded, and reports the sampled
contrast of white type against the hero backdrop.

The browser-driven scripts (`audit:responsive`, `compare`, `capture`) require
[`agent-browser`](https://www.npmjs.com/package/agent-browser) and are
development tools only — nothing in the build or runtime depends on them.
