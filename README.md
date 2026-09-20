# Portfolio

A personal portfolio built with **Nuxt 3 · Vue 3 · TypeScript · SCSS · GSAP ·
ScrollTrigger · Lenis**.

The visual and interaction design is modelled on the reference site analysed in
[`docs/MAMEED_RECON.md`](docs/MAMEED_RECON.md) — section order, layout grid,
typography hierarchy, spacing rhythm, responsive behaviour and motion language.
**All content, imagery and marks in this repository are original**, and no
reference text, photography, logos or illustrations are reproduced. See
[`docs/VISUAL_QA.md`](docs/VISUAL_QA.md) for the fidelity comparison and the list
of deliberate deviations.

---

## Requirements

- **Node.js ≥ 20** (developed on 24)
- npm 10+
- No global tooling required. `git` only if you want to clone.

## Getting started

```bash
npm install        # installs deps and runs `nuxt prepare`
npm run dev        # http://localhost:3000
```

That is the whole setup — there are no environment variables, no secrets and no
external services. Fonts and every image are committed and self-hosted, so the
site builds and runs offline.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with HMR on :3000 |
| `npm run build` | Production build → `.output/` |
| `npm run preview` | Serve the production build locally |
| `npm run generate` | Static-site generation (if you want a CDN-hosted build) |
| `npm run typecheck` | `vue-tsc` over the whole project — expected to be clean |
| `npm run verify` | `typecheck` then `build` — run this before pushing |
| `npm run assets` | Regenerate every SVG asset from `scripts/generate-assets.mjs` |
| `npm run audit:responsive` | Headless overflow/token audit across 8 viewports |
| `npm run compare` | Diff live geometry against the reference measurements |

`assets`, `audit:responsive` and `compare` are development tools. The audit and
compare scripts drive a real browser through
[`agent-browser`](https://www.npmjs.com/package/agent-browser); they are
optional and nothing in the build depends on them.

## Project layout

```
assets/styles/     design system — tokens, mixins, reset, typography, layout, motion
components/
  layout/          SiteHeader, SideRails, SiteFooter, SiteLoader
  sections/        Hero, About, Experience, Highlights, Testimonials, Contact
  ui/              ScrambleText, SectionTitle, MdButton, MdInput, MdTextarea
composables/       smooth scroll, scroll state, reveal, scramble, parallax, anchor nav
data/              all content, separated from presentation
layouts/default    app shell
pages/index.vue    composes the six sections
public/            self-hosted fonts, generated SVG imagery and icons
scripts/           asset generator + QA tooling
docs/              reconnaissance, component map, visual QA, production audit
```

Content lives entirely in `data/`. Every presentational component takes props, so
the site can be re-skinned by editing `data/*.ts` and `assets/styles/_tokens.scss`
without touching component markup.

## Editing the content

| File | Controls |
|---|---|
| `data/profile.ts` | name, hero intro, bio fragments, footer blurb and quote |
| `data/hero.ts` | the three hero story blocks |
| `data/experience.ts` | roles and their projects |
| `data/projects.ts` | the highlights mosaic |
| `data/stack.ts` | technology groups (reads `data/stack-icons.json`) |
| `data/testimonials.ts` | testimonial cards |
| `data/contact.ts` | contact channels and form copy |
| `data/navigation.ts` | nav labels and their section anchors |

Image references point at files in `public/`. Replace them with your own by
dropping files in `public/images/` and updating the paths in `data/`.

### Regenerating artwork

All raster-equivalent artwork is generated as SVG by
`scripts/generate-assets.mjs`, so it is version-controllable and diffable:

```bash
npm run assets
```

This emits the hero layers, highlight previews, figure studies, project marks,
stack monograms and interface icons, plus `data/stack-icons.json` — the manifest
that keeps `data/stack.ts` in sync with the files on disk. Edit the palettes and
parameters at the top of the script to change the art direction.

## Notes on the scroll behaviour

- Lenis drives smooth scrolling on pointer devices and is **disabled below
  768px**, matching the reference.
- **`prefers-reduced-motion` is fully honoured**: smoothing is skipped, reveals
  resolve immediately, parallax is not attached and the loader curtain is
  suppressed. See `composables/useReducedMotion.ts`.
- GSAP tickers, ScrollTriggers, IntersectionObservers, Lenis instances and
  window listeners are all torn down in `onBeforeUnmount`.

## Deployment

The build output in `.output/` is a standard Nitro server:

```bash
npm run build
node .output/server/index.mjs      # PORT / HOST env vars are respected
```

For a static host, `npm run generate` produces `.output/public/`.

## Documentation

| Document | Contents |
|---|---|
| [`docs/MAMEED_RECON.md`](docs/MAMEED_RECON.md) | how the reference was measured; every token, dimension and animation, with UNKNOWNs flagged |
| [`docs/MAMEED_COMPONENT_MAP.md`](docs/MAMEED_COMPONENT_MAP.md) | reference structure → this codebase's component tree, and the deliberate deviations |
| [`docs/VISUAL_QA.md`](docs/VISUAL_QA.md) | section-by-section fidelity comparison and remaining deviations |
| [`docs/PRODUCTION_AUDIT.md`](docs/PRODUCTION_AUDIT.md) | build, performance, accessibility and dependency audit |
