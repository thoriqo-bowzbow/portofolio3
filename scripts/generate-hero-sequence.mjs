/**
 * Generates the hero atmosphere sequence — an ORIGINAL scroll-scrubbed backdrop.
 *
 * The reference scrubs an 8.042s 2560×1440 WebM. This produces an equivalent
 * *behaviour* with entirely original imagery: no frame, pixel or motion path is
 * derived from the reference's media.
 *
 * Design notes
 * ------------
 * • The sequence is the *atmosphere* only. The hero's sculptural cut-out is a
 *   separate SVG layer that composites on top, so the video only needs soft
 *   gradients — no fine detail.
 * • It is therefore rendered at low resolution and upscaled by ffmpeg with
 *   lanczos. Gradients survive that upscale cleanly while the file stays small.
 * • Ordered dither is applied before upscaling. Without it, an 8-bit gradient at
 *   this scale bands visibly once magnified.
 * • The palette and composition deliberately continue `hero-backdrop.svg`, which
 *   ships as the poster — so the first paint and the first video frame agree and
 *   there is no visible switch.
 * • Deterministic: no Math.random, so regenerating is byte-identical.
 *
 *   node scripts/generate-hero-sequence.mjs
 */
import { spawn } from 'node:child_process'
import { mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'media')
const outFile = join(outDir, 'hero-atmosphere.webm')

// --- Encoding parameters -----------------------------------------------------
const SRC_W = 320 // source raster; ffmpeg upscales to the output sizes below
const SRC_H = 180
const FPS = 24
const DURATION = 8 // seconds — matches the reference's ~8s cadence
const FRAMES = FPS * DURATION

/**
 * Two encode targets. Phones get a 960×540 variant: the same visual result at a
 * quarter of the decode cost, which matters because scrubbing forces repeated
 * seeks. The component picks one at mount via a media query.
 */
const VARIANTS = [
  { file: 'hero-atmosphere.webm', w: 1920, h: 1080, crf: '36' },
  { file: 'hero-atmosphere-540.webm', w: 960, h: 540, crf: '35' }
]

// --- Palette (continues hero-backdrop.svg) -----------------------------------
const STOPS = [
  { at: 0.0, c: [0x33, 0x49, 0x6a] },
  { at: 0.22, c: [0x45, 0x60, 0x7f] },
  { at: 0.44, c: [0x54, 0x70, 0x8e] },
  { at: 0.63, c: [0x44, 0x60, 0x7c] },
  { at: 0.82, c: [0x33, 0x46, 0x5d] },
  { at: 1.0, c: [0x22, 0x30, 0x3f] }
]

function sampleGradient(t) {
  const x = Math.min(1, Math.max(0, t))
  for (let i = 0; i < STOPS.length - 1; i += 1) {
    const a = STOPS[i]
    const b = STOPS[i + 1]
    if (x >= a.at && x <= b.at) {
      const k = (x - a.at) / (b.at - a.at)
      return [
        a.c[0] + (b.c[0] - a.c[0]) * k,
        a.c[1] + (b.c[1] - a.c[1]) * k,
        a.c[2] + (b.c[2] - a.c[2]) * k
      ]
    }
  }
  return STOPS[STOPS.length - 1].c.slice()
}

// --- Atmosphere fields -------------------------------------------------------
// Each layer is a set of soft, slowly-drifting gaussian blobs. Evaluating at
// source resolution keeps this cheap; the upscale does the smoothing.

const layer = (seed, blobs, speed, amp) => ({
  seed,
  speed,
  amp,
  blobs: Array.from({ length: blobs }, (_, i) => {
    // Deterministic pseudo-random placement
    const h = (seed * 7919 + i * 104729) % 100000
    return {
      cx: ((h % 1000) / 1000) * 1.6 - 0.3,
      cy: (((h >> 3) % 1000) / 1000) * 1.2 - 0.1,
      r: 0.22 + (((h >> 7) % 1000) / 1000) * 0.5,
      drift: 0.06 + (((h >> 11) % 1000) / 1000) * 0.22,
      phase: (((h >> 13) % 1000) / 1000) * Math.PI * 2,
      weight: 0.45 + (((h >> 17) % 1000) / 1000) * 0.55
    }
  })
})

const LAYERS = [
  layer(3, 5, 0.10, 0.055),
  layer(11, 6, 0.17, 0.045),
  layer(29, 7, 0.26, 0.032)
]

/** Global light bloom — drifts slowly across the upper field. */
const BLOOM = { speed: 0.11, amp: 0.22, cx: 0.38, cy: 0.26, r: 0.62 }

function fieldValue(nx, ny, t) {
  let v = 0
  for (const L of LAYERS) {
    let acc = 0
    for (const b of L.blobs) {
      const cx = b.cx + Math.sin(t * L.speed * Math.PI * 2 + b.phase) * b.drift
      const cy = b.cy + Math.cos(t * L.speed * Math.PI * 2 * 0.7 + b.phase) * b.drift * 0.5
      const dx = nx - cx
      const dy = (ny - cy) * 1.55 // squash vertically — strata read as horizontal bands
      const d2 = dx * dx + dy * dy
      acc += b.weight * Math.exp(-d2 / (b.r * b.r))
    }
    v += acc * L.amp
  }

  // Bloom
  const bx = BLOOM.cx + Math.sin(t * BLOOM.speed * Math.PI * 2) * 0.06
  const by = BLOOM.cy + Math.cos(t * BLOOM.speed * Math.PI * 2 * 0.8) * 0.04
  const bdx = nx - bx
  const bdy = ny - by
  const bd2 = bdx * bdx + bdy * bdy
  v += BLOOM.amp * Math.exp(-bd2 / (BLOOM.r * BLOOM.r))

  return v
}

// 8×8 ordered dither matrix, normalised to [-0.5, 0.5)
const BAYER = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60,
  28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47,
  7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21
].map((v) => v / 64 - 0.5)

const frame = new Uint8Array(SRC_W * SRC_H * 3)

function renderFrame(f) {
  const t = f / FRAMES

  // The scene settles slightly cooler and deeper over the 8s, so scrubbing has
  // a perceptible direction rather than feeling like a loop.
  const depth = 0.05 * t
  const warm = Math.sin(t * Math.PI) * 0.06

  for (let y = 0; y < SRC_H; y += 1) {
    const ny = y / SRC_H
    const grad = sampleGradient(ny + depth)
    for (let x = 0; x < SRC_W; x += 1) {
      const nx = x / SRC_W
      const v = fieldValue(nx, ny, t)

      // Vignette — keeps the corners from going flat
      const vx = (nx - 0.5) * 2
      const vy = (ny - 0.5) * 2
      const vig = 1 - 0.22 * Math.min(1, vx * vx * 0.55 + vy * vy * 0.75)

      const dith = BAYER[(y % 8) * 8 + (x % 8)]

      const i = (y * SRC_W + x) * 3
      for (let c = 0; c < 3; c += 1) {
        // Bloom lifts all channels but lifts blue least → warm highlight
        const lift = c === 2 ? v * 0.72 : c === 0 ? v : v * 0.88
        const warmBias = c === 0 ? warm * 26 : c === 2 ? -warm * 22 : 0
        const out = grad[c] * vig + lift * 255 + warmBias + dith
        frame[i + c] = out < 0 ? 0 : out > 255 ? 255 : out
      }
    }
  }

  return frame
}

// --- Encode ------------------------------------------------------------------
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

/**
 * Pipes the generated frames into ffmpeg once per variant. Frames are rendered
 * once and reused, so the second encode costs only ffmpeg time.
 */
function encode(variant) {
  return new Promise((resolve, reject) => {
    const args = [
      '-hide_banner',
      '-loglevel', 'error',
      '-y',
      '-f', 'rawvideo',
      '-pix_fmt', 'rgb24',
      '-s', `${SRC_W}x${SRC_H}`,
      '-r', String(FPS),
      '-i', 'pipe:0',
      '-vf', `scale=${variant.w}:${variant.h}:flags=lanczos`,
      '-c:v', 'libvpx-vp9',
      '-b:v', '0',
      '-crf', variant.crf,
      '-deadline', 'good',
      '-cpu-used', '2',
      '-row-mt', '1',
      '-tile-columns', '2',
      '-g', String(FPS * 4),
      '-an',
      '-pix_fmt', 'yuv420p',
      join(outDir, variant.file)
    ]

    const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] })
    ff.on('error', reject)

    let written = 0
    const writeNext = () => {
      while (written < FRAMES) {
        const buf = Buffer.from(renderFrame(written).buffer)
        written += 1
        if (!ff.stdin.write(buf)) {
          ff.stdin.once('drain', writeNext)
          return
        }
      }
      ff.stdin.end()
    }

    ff.on('close', (code) => {
      if (code !== 0) reject(new Error(`ffmpeg exited with code ${code}`))
      else resolve()
    })

    writeNext()
  })
}

const run = async () => {
  for (const variant of VARIANTS) {
    await encode(variant)
    console.log(`${variant.file} written (${FRAMES} frames, ${DURATION}s, ${variant.w}x${variant.h})`)
  }
}

run().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
