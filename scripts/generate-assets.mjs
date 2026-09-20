/**
 * Original asset generator.
 *
 * Produces every raster-equivalent asset the portfolio needs as hand-authored SVG.
 * Nothing here is derived from any third-party artwork, photography or brand mark —
 * all geometry is generated from the parameters below.
 *
 *   node scripts/generate-assets.mjs
 */
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pub = join(root, 'public')

const write = (rel, content) => {
  const target = join(pub, rel)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, content.trim() + '\n', 'utf8')
}

// Deterministic PRNG so regenerating produces byte-identical assets
const rng = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}

// =============================================================================
// Palette
// =============================================================================
const INK = '#252324'

/** Editorial project palettes — cool neutrals through to warm accents. */
const PALETTES = [
  { bg: '#eef1f6', fg: '#1c2430', a: '#3b6ea8', b: '#8fb3d9', c: '#f2f5f9' },
  { bg: '#f4efe6', fg: '#2a231c', a: '#a8703b', b: '#d9b98f', c: '#faf6ef' },
  { bg: '#0f1b1e', fg: '#e8f1f0', a: '#2f6f6b', b: '#7fb3ae', c: '#16302f' },
  { bg: '#f5f0f2', fg: '#2c1f28', a: '#8a3b63', b: '#c98fae', c: '#fbf7f9' },
  { bg: '#eaf0ea', fg: '#1f2a22', a: '#3f7a4c', b: '#93bf9c', c: '#f4f8f4' },
  { bg: '#12110f', fg: '#f0ece4', a: '#b8863b', b: '#e0c48c', c: '#1e1c18' },
  { bg: '#eef0f4', fg: '#232830', a: '#4a5570', b: '#9aa4bd', c: '#f6f7fa' },
  { bg: '#f6efec', fg: '#2f211b', a: '#b5563a', b: '#e0a18c', c: '#fbf5f2' },
  { bg: '#101828', fg: '#e6ecf7', a: '#3d5a9c', b: '#8ba3d4', c: '#1a2438' },
  { bg: '#f2f1ed', fg: '#26251f', a: '#6b6a52', b: '#b3b298', c: '#f8f8f5' },
]

// =============================================================================
// 1. Hero — TWO layers sharing one coordinate space.
//
// The reference's hero stacks: atmosphere (video) → name (z1) → transparent
// cut-out (z2) → frosted card (z3). The foreground cut-out deliberately overlaps
// the letters, which is what gives the hero its depth. Reproduced here as two
// SVGs on a common 1920×1080 canvas so the layers register exactly.
// =============================================================================
const HERO_W = 1920
const HERO_H = 1080

/** Shared placement of the standing form so both layers agree. */
const FORM = { x: 870, y: 470 }

function heroBackdrop() {
  const rand = rng(20260920)

  // Soft atmospheric strata — broad, low-contrast, no hard silhouettes. The
  // reference's backdrop is photographic sky; hard geometric ridges read as
  // decoration and fight the type.
  const strata = Array.from({ length: 9 }, (_, i) => {
    const y = 180 + i * 96 + rand() * 40
    const o = (0.028 + rand() * 0.05).toFixed(3)
    const h = (54 + rand() * 80).toFixed(0)
    return `<ellipse cx="${(200 + rand() * 1520).toFixed(0)}" cy="${y.toFixed(0)}" rx="${(760 + rand() * 640).toFixed(0)}" ry="${h}" fill="#fff" opacity="${o}"/>`
  }).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${HERO_W} ${HERO_H}" width="${HERO_W}" height="${HERO_H}" role="img" aria-label="Atmospheric gradient backdrop">
  <defs>
    <linearGradient id="skyBody" x1="0" y1="0" x2="0.15" y2="1">
      <stop offset="0%" stop-color="#33496a"/>
      <stop offset="22%" stop-color="#45607f"/>
      <stop offset="44%" stop-color="#54708e"/>
      <stop offset="63%" stop-color="#44607c"/>
      <stop offset="82%" stop-color="#33465d"/>
      <stop offset="100%" stop-color="#22303f"/>
    </linearGradient>
    <radialGradient id="bloom" cx="0.38" cy="0.24" r="0.62">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.20"/>
      <stop offset="52%" stop-color="#fff" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <!-- Even scrim: the hero story blocks can land anywhere in the viewport, so
         every band has to hold white type. A dip in the middle would leave a
         light band where a block's heading falls. -->
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0a1420" stop-opacity="0.46"/>
      <stop offset="42%" stop-color="#0a1420" stop-opacity="0.34"/>
      <stop offset="70%" stop-color="#0a1420" stop-opacity="0.38"/>
      <stop offset="100%" stop-color="#0a1420" stop-opacity="0.54"/>
    </linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="40"/></filter>
  </defs>

  <rect width="${HERO_W}" height="${HERO_H}" fill="url(#skyBody)"/>
  <g filter="url(#soft)">${strata}</g>
  <rect width="${HERO_W}" height="${HERO_H}" fill="url(#bloom)"/>

  <!-- Horizon: one soft band only, so the composition has a base without decoration -->
  <ellipse cx="${HERO_W * 0.5}" cy="${HERO_H + 40}" rx="${HERO_W * 0.78}" ry="180" fill="#1d2834" opacity="0.34" filter="url(#soft)"/>

  <!-- Scrim: guarantees white type holds contrast wherever a story block lands -->
  <rect width="${HERO_W}" height="${HERO_H}" fill="url(#scrim)"/>
</svg>`
}

function heroForeground() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${HERO_W} ${HERO_H}" width="${HERO_W}" height="${HERO_H}" role="img" aria-label="Sculptural foreground form">
  <defs>
    <linearGradient id="stone" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f4f3f0"/>
      <stop offset="42%" stop-color="#d8d6d1"/>
      <stop offset="72%" stop-color="#8f8d88"/>
      <stop offset="100%" stop-color="#3a3a38"/>
    </linearGradient>
    <linearGradient id="plinth" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#eceae6"/>
      <stop offset="45%" stop-color="#cfcdc8"/>
      <stop offset="78%" stop-color="#83817c"/>
      <stop offset="100%" stop-color="#33322f"/>
    </linearGradient>
  </defs>

  <!-- Standing form: the compositional anchor. Opaque, overlaps the hero name. -->
  <g transform="translate(${FORM.x} ${FORM.y})">
    <path d="M-118 470 L-104 96 L84 74 L136 470 Z" fill="url(#plinth)"/>
    <path d="M-104 96 L84 74 L90 104 L-96 128 Z" fill="#fbfbf9" opacity="0.92"/>
    <path d="M-118 470 L136 470 L148 500 L-132 500 Z" fill="#c9c7c2" opacity="0.8"/>
    <path d="M62 74 L136 470 L98 470 L34 92 Z" fill="#000" opacity="0.18"/>
    <ellipse cx="-30" cy="150" rx="66" ry="26" fill="#fff" opacity="0.16"/>

    <!-- Vessel resting on the plinth -->
    <path d="M-52 92 L-40 -14 L46 -22 L60 92 Z" fill="url(#stone)"/>
    <path d="M-40 -14 L46 -22 L50 8 L-44 16 Z" fill="#fdfdfb" opacity="0.9"/>
    <path d="M34 -22 L60 92 L36 92 L16 -16 Z" fill="#000" opacity="0.2"/>
    <path d="M-52 92 L60 92 L66 116 L-58 116 Z" fill="#b9b7b2" opacity="0.85"/>
    <path d="M-40 40 C-10 30 20 34 44 46" stroke="#a9a7a2" stroke-width="3" fill="none" opacity="0.6"/>
    <path d="M-42 66 C-12 56 18 60 46 72" stroke="#a9a7a2" stroke-width="3" fill="none" opacity="0.5"/>
  </g>

  <!-- Branch: organic counterweight, also crossing the name -->
  <g stroke="#8a6a52" fill="none" stroke-linecap="round" transform="translate(${FORM.x} ${FORM.y})">
    <path d="M-16 -30 C-30 -110 -8 -176 46 -224" stroke-width="9" opacity="0.92"/>
    <path d="M46 -224 C82 -256 132 -268 176 -256" stroke-width="5" opacity="0.86"/>
    <path d="M34 -204 C64 -192 106 -186 142 -196" stroke-width="3.5" opacity="0.7"/>
    <path d="M8 -156 C40 -142 72 -132 106 -138" stroke-width="3" opacity="0.55"/>
    <path d="M176 -256 C208 -252 230 -236 242 -212" stroke-width="2.5" opacity="0.6"/>
    <path d="M120 -262 C142 -274 168 -276 188 -268" stroke-width="2" opacity="0.45"/>
  </g>
</svg>`
}

// =============================================================================
// 2. Highlight tiles — original stylised product compositions.
//
// IMPORTANT: these are displayed through a 160%-tall / -30%-top parallax
// reservoir, so only the middle ~62% band of the canvas is ever guaranteed
// visible. Every composition therefore keeps its subject inside a central
// "safe band" (y 300–600) and keeps the outer bands simple tone — otherwise a
// centre crop slices the subject into an unreadable fragment.
// =============================================================================
function highlight(i, palette, kind) {
  const p = PALETTES[palette]
  const W = 1200
  const H = 900
  const id = `h${i}`

  // Visible in any crop: a soft vignette so edges never look severed
  const vignette = `
    <rect width="${W}" height="${H}" fill="${p.fg}" opacity="0.05"/>
    <rect x="0" y="0" width="${W}" height="120" fill="${p.bg}" opacity="0.55"/>
    <rect x="0" y="${H - 120}" width="${W}" height="120" fill="${p.bg}" opacity="0.55"/>`

  // A bold central subject with generous scale reads at any tile size
  const safeSubject = (inner) => `<g transform="translate(0 0)">${inner}</g>`

  const layouts = {
    // Marketing landing page — hero block centred
    landing: safeSubject(`
      <rect x="96" y="286" width="440" height="30" rx="6" fill="${p.fg}" opacity="0.78"/>
      <rect x="96" y="334" width="330" height="30" rx="6" fill="${p.fg}" opacity="0.78"/>
      <rect x="96" y="396" width="390" height="13" rx="7" fill="${p.fg}" opacity="0.32"/>
      <rect x="96" y="424" width="300" height="13" rx="7" fill="${p.fg}" opacity="0.32"/>
      <rect x="96" y="474" width="168" height="52" rx="4" fill="${p.a}"/>
      <rect x="284" y="474" width="150" height="52" rx="4" fill="${p.fg}" opacity="0.14"/>
      <rect x="672" y="272" width="440" height="286" rx="8" fill="${p.a}" opacity="0.92"/>
      <circle cx="892" cy="415" r="86" fill="${p.b}" opacity="0.62"/>
      <path d="M700 500 L760 430 L830 470 L920 372 L1010 420 L1080 350" stroke="${p.c}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
      <rect x="96" y="580" width="1016" height="16" rx="8" fill="${p.fg}" opacity="0.1"/>`),

    // Data dashboard — chart centred, bars oversized
    dashboard: safeSubject(`
      <rect x="120" y="250" width="960" height="400" rx="10" fill="${p.fg}" opacity="0.07"/>
      ${Array.from({ length: 11 }, (_, k) => {
        const x = 176 + k * 82
        const h = 90 + ((k * 53) % 220)
        return `<rect x="${x}" y="${600 - h}" width="52" height="${h}" rx="4" fill="${p.a}" opacity="${0.42 + (k % 4) * 0.16}"/>`
      }).join('')}
      <path d="M176 520 L272 452 L368 486 L464 392 L560 430 L656 340 L752 386 L848 300 L944 340 L1024 288"
            stroke="${p.fg}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.72"/>
      <rect x="176" y="286" width="190" height="20" rx="10" fill="${p.fg}" opacity="0.5"/>
      <rect x="900" y="278" width="176" height="44" rx="6" fill="${p.a}"/>`),

    // Editorial — one large headline block, image band through the middle
    editorial: safeSubject(`
      <rect x="150" y="300" width="820" height="26" rx="13" fill="${p.a}"/>
      <rect x="150" y="352" width="900" height="50" rx="6" fill="${p.fg}" opacity="0.78"/>
      <rect x="150" y="418" width="620" height="50" rx="6" fill="${p.fg}" opacity="0.78"/>
      <rect x="150" y="498" width="420" height="100" rx="6" fill="${p.a}" opacity="0.82"/>
      <rect x="598" y="498" width="452" height="100" rx="6" fill="${p.c}" opacity="0.7"/>
      <rect x="150" y="636" width="900" height="14" rx="7" fill="${p.fg}" opacity="0.26"/>`),

    // Commerce — a single oversized product card centred
    commerce: safeSubject(`
      <rect x="300" y="252" width="600" height="416" rx="12" fill="${p.c}" opacity="0.96"/>
      <rect x="300" y="252" width="600" height="272" rx="12" fill="${p.a}" opacity="0.9"/>
      <circle cx="600" cy="388" r="84" fill="${p.b}" opacity="0.7"/>
      <rect x="344" y="562" width="280" height="22" rx="11" fill="${p.fg}" opacity="0.55"/>
      <rect x="344" y="602" width="180" height="18" rx="9" fill="${p.fg}" opacity="0.3"/>
      <rect x="760" y="556" width="96" height="56" rx="6" fill="${p.a}"/>
      <rect x="140" y="290" width="120" height="340" rx="10" fill="${p.fg}" opacity="0.08"/>
      <rect x="940" y="290" width="120" height="340" rx="10" fill="${p.fg}" opacity="0.08"/>`),

    // Spatial — a route sweeping across the centre
    spatial: safeSubject(`
      <rect x="96" y="236" width="1008" height="428" rx="10" fill="${p.a}" opacity="0.14"/>
      ${Array.from({ length: 7 }, (_, k) =>
        `<line x1="96" y1="${252 + k * 68}" x2="1104" y2="${252 + k * 68}" stroke="${p.fg}" stroke-width="1.5" opacity="0.09"/>`
      ).join('')}
      ${Array.from({ length: 15 }, (_, k) =>
        `<line x1="${96 + k * 72}" y1="236" x2="${96 + k * 72}" y2="664" stroke="${p.fg}" stroke-width="1.5" opacity="0.09"/>`
      ).join('')}
      <path d="M180 620 C340 520 430 560 560 440 C690 320 800 380 1020 268"
            stroke="${p.a}" stroke-width="11" fill="none" stroke-linecap="round"/>
      <circle cx="180" cy="620" r="26" fill="${p.a}"/>
      <circle cx="1020" cy="268" r="34" fill="${p.fg}" opacity="0.85"/>
      <circle cx="1020" cy="268" r="62" fill="${p.fg}" opacity="0.16"/>`),

    // Documents — a dense record list
    documents: safeSubject(`
      <rect x="140" y="236" width="920" height="428" rx="10" fill="${p.c}" opacity="0.96"/>
      <rect x="184" y="278" width="300" height="26" rx="6" fill="${p.fg}" opacity="0.6"/>
      <rect x="880" y="272" width="140" height="40" rx="5" fill="${p.a}"/>
      ${Array.from({ length: 5 }, (_, k) => `
        <rect x="184" y="${344 + k * 60}" width="836" height="44" rx="5" fill="${p.fg}" opacity="${k % 2 ? 0.055 : 0.095}"/>
        <rect x="208" y="${360 + k * 60}" width="${220 + (k % 3) * 96}" height="13" rx="6" fill="${p.fg}" opacity="0.3"/>
        <rect x="880" y="${360 + k * 60}" width="116" height="13" rx="6" fill="${p.a}" opacity="0.55"/>`
      ).join('')}`)
  }

  const body = layouts[kind] || layouts.landing

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Project preview composition ${i}">
  <defs>
    <clipPath id="clip-${id}"><rect width="${W}" height="${H}"/></clipPath>
  </defs>
  <g clip-path="url(#clip-${id})">
    <rect width="${W}" height="${H}" fill="${p.bg}"/>
    ${body}
    ${vignette}
  </g>
</svg>`
}

// =============================================================================
// 3. Testimonial portraits — original rim-lit figure studies.
//
// The reference renders these greyscale behind a frosted overlay, so what has to
// read at ~300px tall is tonal mass and lighting, not facial detail. Drawing a
// literal face at this scale reads as an avatar illustration and cheapens the
// section, so these are instead treated as high-contrast studio silhouettes:
// near-black figure, one strong rim light, grainy ground. That is unambiguously
// original artwork and it photographs well under the greyscale filter.
//
// Displayed through a 130% / -15% parallax reservoir, so the subject is centred.
// =============================================================================
function portrait(i) {
  const rand = rng(770000 + i * 977)
  const W = 800
  const H = 1000
  const id = `p${i}`

  const ground = 7 + Math.floor(rand() * 8)
  const shoulder = 250 + rand() * 90
  const headR = 132 + rand() * 30
  const headY = 430 + rand() * 50
  const lean = (rand() - 0.5) * 60
  // Rim light comes from the left or the right, alternating down the grid
  const fromLeft = i % 2 === 0
  const rimStrength = 0.55 + rand() * 0.3

  const grain = Array.from({ length: 170 }, () => {
    const x = (rand() * W).toFixed(0)
    const y = (rand() * H).toFixed(0)
    const r = (0.5 + rand() * 1.7).toFixed(1)
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${(0.012 + rand() * 0.05).toFixed(3)}"/>`
  }).join('')

  const cx = W / 2 + lean
  const rimW = 26

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Figure study ${i}">
  <defs>
    <linearGradient id="ground-${id}" x1="${fromLeft ? 0 : 1}" y1="0" x2="${fromLeft ? 1 : 0}" y2="0.9">
      <stop offset="0%" stop-color="hsl(215 12% ${ground + 30}%)"/>
      <stop offset="40%" stop-color="hsl(215 14% ${ground + 14}%)"/>
      <stop offset="100%" stop-color="hsl(215 16% ${ground}%)"/>
    </linearGradient>
    <linearGradient id="body-${id}" x1="${fromLeft ? 0.1 : 0.9}" y1="0" x2="${fromLeft ? 0.9 : 0.1}" y2="0.6">
      <stop offset="0%" stop-color="hsl(215 14% ${ground + 22}%)"/>
      <stop offset="26%" stop-color="hsl(215 16% ${ground + 4}%)"/>
      <stop offset="100%" stop-color="hsl(215 18% ${ground - 2}%)"/>
    </linearGradient>
    <radialGradient id="glow-${id}" cx="${fromLeft ? 0.24 : 0.76}" cy="0.3" r="0.66">
      <stop offset="0%" stop-color="#eaf1fb" stop-opacity="${(rimStrength * 0.4).toFixed(2)}"/>
      <stop offset="55%" stop-color="#eaf1fb" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#eaf1fb" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="falloff-${id}" cx="0.5" cy="0.55" r="0.74">
      <stop offset="0%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.42"/>
    </radialGradient>
    <clipPath id="clip-${id}"><rect width="${W}" height="${H}"/></clipPath>
  </defs>

  <g clip-path="url(#clip-${id})">
    <rect width="${W}" height="${H}" fill="url(#ground-${id})"/>
    <rect width="${W}" height="${H}" fill="url(#glow-${id})"/>

    <!-- Head and neck: a single mass, no interior features -->
    <path d="M${cx - headR} ${headY + 150}
             C${cx - headR - 6} ${headY - 40} ${cx - headR * 0.56} ${headY - headR * 1.16} ${cx} ${headY - headR * 1.16}
             C${cx + headR * 0.56} ${headY - headR * 1.16} ${cx + headR + 6} ${headY - 40} ${cx + headR} ${headY + 150}
             L${cx + headR * 0.46} ${headY + 268}
             L${cx - headR * 0.46} ${headY + 268} Z"
          fill="url(#body-${id})"/>

    <!-- Shoulders -->
    <path d="M${cx - shoulder} ${H}
             C${cx - shoulder + 52} ${headY + 306} ${cx - headR * 1.5} ${headY + 250} ${cx} ${headY + 246}
             C${cx + headR * 1.5} ${headY + 250} ${cx + shoulder - 52} ${headY + 306} ${cx + shoulder} ${H} Z"
          fill="url(#body-${id})"/>

    <!-- Rim light: a thin bright edge tracing the lit side -->
    <g opacity="${rimStrength.toFixed(2)}" fill="none" stroke="#f2f7ff" stroke-linecap="round">
      <path d="M${cx + (fromLeft ? -headR : headR)} ${headY + 118}
               C${cx + (fromLeft ? -headR - 4 : headR + 4)} ${headY - 44} ${cx + (fromLeft ? -headR * 0.58 : headR * 0.58)} ${headY - headR * 1.12} ${cx} ${headY - headR * 1.14}"
            stroke-width="${rimW}" opacity="0.5"/>
      <path d="M${cx + (fromLeft ? -shoulder + 60 : shoulder - 60)} ${H - 24}
               C${cx + (fromLeft ? -shoulder + 96 : shoulder - 96)} ${headY + 320} ${cx + (fromLeft ? -headR * 1.6 : headR * 1.6)} ${headY + 258} ${cx} ${headY + 252}"
            stroke-width="${Math.round(rimW * 0.6)}" opacity="0.35"/>
    </g>

    <rect width="${W}" height="${H}" fill="url(#falloff-${id})"/>
    ${grain}
  </g>
</svg>`
}

// =============================================================================
// 4. Stack marks — original abstract monograms, one per technology.
//
// Every form must hold a centred two-letter monogram legibly at 65px, so only
// shapes with a solid interior are used (a two-bar form was tried and dropped:
// the glyph had nowhere to sit). Hues are spread deterministically around the
// wheel so a 24-tile grid does not collapse into one colour.
// =============================================================================
const MARK_FORMS = ['hex', 'circle', 'square', 'triangle', 'diamond', 'shield', 'ring', 'rounded']

function stackMark(name, hue) {
  const words = name.split(/[\s.+\-/]+/).filter(Boolean)
  const initials = (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase()

  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 9973
  const form = MARK_FORMS[h % MARK_FORMS.length]

  const ink = `hsl(${hue} 58% 36%)`
  const tint = `hsl(${hue} 52% 92%)`
  const ringW = 13

  const shapes = {
    hex: `<path d="M32 5 L55 18.5 L55 45.5 L32 59 L9 45.5 L9 18.5 Z" fill="currentColor"/>`,
    circle: `<circle cx="32" cy="32" r="28" fill="currentColor"/>`,
    square: `<rect x="5" y="5" width="54" height="54" rx="8" fill="currentColor"/>`,
    triangle: `<path d="M32 7 L59 55 L5 55 Z" fill="currentColor"/>`,
    diamond: `<path d="M32 4 L60 32 L32 60 L4 32 Z" fill="currentColor"/>`,
    shield: `<path d="M32 4 L57 14 V34 C57 48 45 57 32 61 C19 57 7 48 7 34 V14 Z" fill="currentColor"/>`,
    ring: `<circle cx="32" cy="32" r="28" fill="currentColor"/><circle cx="32" cy="32" r="${28 - ringW}" fill="${tint}"/>`,
    rounded: `<rect x="4" y="4" width="56" height="56" rx="18" fill="currentColor"/>`
  }

  // Solid forms carry white type; the ring's interior is the tint, so it needs ink
  const useTintPlate = form === 'ring'
  const textFill = useTintPlate ? ink : '#fff'
  const glyphSize = initials.length > 1 ? 20 : 26

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="${name}">
  <g style="color:${ink}">${shapes[form]}</g>
  <text x="32" y="33" text-anchor="middle" dominant-baseline="central"
        font-family="Montserrat, Arial, sans-serif" font-size="${glyphSize}"
        font-weight="600" letter-spacing="-0.4" fill="${textFill}">${initials}</text>
</svg>`
}

// =============================================================================
// 4b. Project monograms — 120×50 wordmarks for the experience tiles.
//     The reference normalises each project's real logo into this box; these are
//     original marks for original projects.
// =============================================================================
const PROJECTS = [
  'Atlas Booking',
  'Ledger',
  'Waypoint',
  'Console',
  'Beacon',
  'Relay',
  'Harbour Goods',
  'Kestrel',
  'Fieldnote'
]

function projectMark(name, index) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

  const tints = [
    '#2f4f7a', '#7a4a2f', '#2f6b52', '#5a3f7a',
    '#7a5f2f', '#2f5f7a', '#7a2f4a', '#3f5a2f', '#4a4a7a'
  ]
  const tint = tints[index % tints.length]
  const word = name.split(/\s+/)[0]

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 50" width="120" height="50" role="img" aria-label="${name}">
  <g font-family="Montserrat, Arial, sans-serif" fill="${tint}">
    <text x="0" y="34" font-size="${word.length > 7 ? 15 : 18}" font-weight="600" letter-spacing="0.4">${word.toUpperCase()}</text>
  </g>
  <rect x="0" y="41" width="26" height="3" fill="${tint}" opacity="0.55"/>
  <text x="31" y="45" font-family="Montserrat, Arial, sans-serif" font-size="9" font-weight="500"
        fill="${tint}" opacity="0.65" letter-spacing="1.6">${initials}</text>
</svg>`
}

// =============================================================================
// 5. Interface icons — original geometric glyphs
// =============================================================================
const ICON = (paths) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`

const icons = {
  // Rotating "+" affordance used on project / highlight links
  'icon-more': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none">
    <circle cx="12" cy="12" r="10.6" stroke="currentColor" stroke-width="1.4" opacity="0.35"/>
    <path d="M12 7.4 V16.6 M7.4 12 H16.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
  </svg> `,

  'icon-close': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#252324" stroke-width="1.8" stroke-linecap="round">
    <path d="M5 5 L19 19 M19 5 L5 19"/>
  </svg>`,

  'icon-menu': ICON(`<path d="M3 6h18M3 12h18M3 18h18"/>`),

  // Social / contact glyphs
  'icon-profile': ICON(`<circle cx="12" cy="8.2" r="4.1"/><path d="M4 20.4c0-4 3.6-6.6 8-6.6s8 2.6 8 6.6"/>`),
  'icon-chat': ICON(`<path d="M20.5 11.6c0 4.2-3.8 7.6-8.5 7.6-1 0-2-.15-2.9-.42L4 20.4l1.5-4.1A7.2 7.2 0 0 1 3.5 11.6C3.5 7.4 7.3 4 12 4s8.5 3.4 8.5 7.6Z"/>`),
  'icon-network': ICON(`<rect x="2.6" y="2.6" width="18.8" height="18.8" rx="3"/><path d="M7.2 10.4v6.4M7.2 7.3v.1M11.4 16.8v-3.6a2.2 2.2 0 0 1 4.4 0v3.6"/>`),
  'icon-camera': ICON(`<rect x="3" y="3" width="18" height="18" rx="4.5"/><circle cx="12" cy="12" r="4.2"/><path d="M17.4 6.9v.02"/>`),
  'icon-phone': ICON(`<path d="M21 16.9v2.6a1.8 1.8 0 0 1-2 1.8 17.8 17.8 0 0 1-7.7-2.8 17.5 17.5 0 0 1-5.4-5.4A17.8 17.8 0 0 1 3.1 5.4 1.8 1.8 0 0 1 4.9 3.4h2.6a1.8 1.8 0 0 1 1.8 1.6c.11.8.32 1.6.63 2.4a1.8 1.8 0 0 1-.41 1.9l-1.1 1.1a14 14 0 0 0 5.4 5.4l1.1-1.1a1.8 1.8 0 0 1 1.9-.41c.77.3 1.57.51 2.4.63A1.8 1.8 0 0 1 21 16.9Z"/>`),
  'icon-mail': ICON(`<rect x="2.6" y="4.6" width="18.8" height="14.8" rx="2.4"/><path d="m3.4 6.4 8.6 6.2 8.6-6.2"/>`),
  'icon-link': ICON(`<path d="M10.2 13.8a4.4 4.4 0 0 0 6.3 0l2.6-2.6a4.4 4.4 0 0 0-6.3-6.3l-1.5 1.5"/><path d="M13.8 10.2a4.4 4.4 0 0 0-6.3 0l-2.6 2.6a4.4 4.4 0 0 0 6.3 6.3l1.5-1.5"/>`),
  'icon-code': ICON(`<path d="m8.4 7.6-4.6 4.4 4.6 4.4M15.6 7.6l4.6 4.4-4.6 4.4M13.4 4.4l-2.8 15.2"/>`),
  'icon-branch': ICON(`<circle cx="6.4" cy="5.6" r="2.4"/><circle cx="6.4" cy="18.4" r="2.4"/><circle cx="17.6" cy="9.6" r="2.4"/><path d="M6.4 8v8M17.6 12c0 4-5.6 3.2-11.2 6.4"/>`),
  'icon-arrow': ICON(`<path d="M4.5 12h15M13 5.5 19.5 12 13 18.5"/>`),
  'icon-download': ICON(`<path d="M12 3v12M7.4 10.8 12 15.4l4.6-4.6M4 20.5h16"/>`),
  'icon-spinner': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 3a9 9 0 1 0 9 9" /></svg>`
}

// =============================================================================
// 6. Brand marks
// =============================================================================

/** Wordmark used in the header + mobile mark: three stacked syllables. */
function wordmark(rel, fill) {
  const lines = ['POR', 'TFO', 'LIO']
  const lineH = 22
  const startY = 22
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80" role="img" aria-label="Wordmark">
  <g font-family="Montserrat, Arial, sans-serif" font-size="17" font-weight="600" letter-spacing="2.2" fill="${fill}">
    ${lines.map((l, i) => `<text x="40" y="${startY + i * lineH}" text-anchor="middle">${l}</text>`).join('')}
  </g>
</svg>`
}

// =============================================================================
// 7. Stack catalogue — names the data layer also consumes, so the two cannot drift
// =============================================================================
const STACK = {
  core: [
    ['TypeScript', 214], ['JavaScript', 45], ['Vue', 152], ['Nuxt', 148],
    ['Pinia', 45], ['React', 200], ['Sass', 330], ['Tailwind CSS', 190],
    ['Vite', 268], ['Webpack', 210], ['GSAP', 96], ['HTML', 18],
    ['CSS', 205], ['Accessibility', 250], ['Design Systems', 280], ['Testing', 8],
    ['Vitest', 90], ['Playwright', 160], ['Vuex', 152], ['Vuetify', 178],
    ['Zustand', 30], ['Rollup', 12], ['PostCSS', 322], ['Web Components', 224]
  ],
  experienced: [
    ['Node.js', 118], ['GraphQL', 300], ['REST APIs', 190], ['PostgreSQL', 222],
    ['Docker', 205], ['CI / CD', 24], ['Nginx', 140], ['Redis', 6],
    ['Figma', 275], ['Storybook', 330], ['MongoDB', 140], ['Kubernetes', 220],
    ['GitLab CI', 22], ['Linux', 200]
  ],
  favoured: [
    ['VS Code', 205], ['Git', 12], ['GitHub Actions', 265], ['ESLint', 275],
    ['Prettier', 190], ['Stylelint', 320], ['Lighthouse', 30], ['Notion', 0],
    ['Linear', 250], ['Raycast', 8], ['Obsidian', 268], ['Excalidraw', 12]
  ]
}

const STACK_TINTS = { core: 214, experienced: 275, favoured: 160 }

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const buildStackManifest = () => {
  const manifest = {}
  let globalIndex = 0
  Object.entries(STACK).forEach(([group, items]) => {
    manifest[group] = items.map(([name]) => {
      let h = 0
      for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 9973
      // Golden-angle walk: adjacent tiles never share a hue, and the whole
      // catalogue ends up spread across the wheel.
      const hue = Math.round((globalIndex * 137.508 + STACK_TINTS[group]) % 360)
      globalIndex += 1
      const slug = slugify(name)
      write(`icons/stack/${slug}.svg`, stackMark(name, hue))
      return { name, slug }
    })
  })
  return manifest
}

// =============================================================================
// Emit
// =============================================================================
rmSync(join(pub, 'images'), { recursive: true, force: true })
rmSync(join(pub, 'icons'), { recursive: true, force: true })

const stackManifest = buildStackManifest()
mkdirSync(join(root, 'data'), { recursive: true })
writeFileSync(
  join(root, 'data', 'stack-icons.json'),
  JSON.stringify(stackManifest, null, 2) + '\n',
  'utf8'
)

write('images/hero-backdrop.svg', heroBackdrop())
write('images/hero-foreground.svg', heroForeground())

const HIGHLIGHT_KINDS = ['landing', 'dashboard', 'editorial', 'commerce', 'spatial', 'documents', 'landing', 'dashboard', 'editorial', 'commerce']
HIGHLIGHT_KINDS.forEach((kind, i) => {
  write(`images/highlights/hl-${String(i + 1).padStart(2, '0')}.svg`, highlight(i, i % PALETTES.length, kind))
})

for (let i = 1; i <= 6; i++) write(`images/testimonials/portrait-${String(i).padStart(2, '0')}.svg`, portrait(i))

PROJECTS.forEach((name, i) => {
  write(`images/project-marks/${slugify(name)}.svg`, projectMark(name, i))
})

Object.entries(icons).forEach(([name, svg]) => write(`icons/${name}.svg`, svg))

write('icons/logo.svg', wordmark('icons/logo.svg', '#ffffff'))
write('icons/logo-dark.svg', wordmark('icons/logo-dark.svg', INK))
write('favicon.svg', wordmark('favicon.svg', INK))

console.log('assets generated')
