<script setup lang="ts">
/**
 * Rolling-digit odometer.
 *
 * A mechanical-counter numeral: one vertical strip of digits per place value,
 * translated so the target digit sits in a fixed window. Reconstructed from the
 * reference's observed intro behaviour (`docs/FINAL_FIDELITY_AUDIT.md`, P0
 * finding 2) — none of its source is used.
 *
 * Observed reference geometry, matched here:
 *
 *   window        333 × 207.2px, overflow hidden
 *   columns       three, 93px wide, at x = 0 / 111.004 / 222.009
 *   digit         font-size 185px, line box 213px, pure black
 *   strips        2 / 11 / 41 items — the hundreds column is short because it
 *                 only ever travels one step
 *
 * Strip lengths differ per place value on purpose: a real odometer's units wheel
 * turns ten times for every single turn of its tens wheel, and spending 100 DOM
 * nodes on the units strip to express that would be wasteful when only the last
 * four cycles are ever visible.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    /** Value to count to. */
    to?: number
    /** Digit positions. */
    digits?: number
    /** Milliseconds spent rolling. */
    duration?: number
    /** Delay before the roll begins. */
    delay?: number
    /**
     * Skip the roll and land on the target immediately. Used for
     * `prefers-reduced-motion`, where a 2.8s rolling numeral is exactly the kind
     * of motion the setting exists to suppress.
     */
    instant?: boolean
  }>(),
  { to: 100, digits: 3, duration: 2800, delay: 700, instant: false }
)

const emit = defineEmits<{ (e: 'complete'): void }>()

/** Digit strips, indexed from the least significant place value. */
const STRIPS = [
  // units: four full cycles then the trailing zero of 100
  '0123456789'.repeat(4) + '0',
  // tens: one cycle then the trailing zero
  '0123456789' + '0',
  // hundreds: only ever 0 → 1
  '01'
].map((s) => s.split(''))

/** Columns are ordered most-significant-first for rendering (left → right). */
const columns = computed(() => {
  const out: { items: string[]; place: number; slot: number }[] = []
  for (let place = props.digits - 1; place >= 0; place -= 1) {
    out.push({
      items: STRIPS[place] ?? STRIPS[0],
      place,
      // Horizontal slot, counted from the LEFT. The most significant place value
      // occupies slot 0, so the numeral reads left-to-right like any other number.
      slot: props.digits - 1 - place
    })
  }
  return out
})

/** Linear roll position, 0 → 1. Drives the numeric readout. */
const progress = ref(0)
/** The value shown to assistive tech — always a clean integer 0 → `to`. */
const value = ref(0)

let raf = 0
let startAt = 0

/**
 * Symmetric ease-in-out — the wheel starts slowly, accelerates through the
 * middle of its travel, then decelerates into the stop.
 *
 * This is not an arbitrary choice: sampling the reference across its roll shows
 * normalised travel of 0.014 / 0.091 / 0.272 / 0.510 / 0.776 / 0.940 at
 * 9 / 23 / 39 / 55 / 73 / 90 percent of elapsed time, which tracks
 * `easeInOutQuad` closely. Its declared animation curve is `ease-in-out`.
 *
 * An overshoot curve was tried first and rejected: the excess clamps against the
 * end of each strip, so every wheel reached its stop by ~35% of the roll and then
 * sat motionless for the remaining two thirds.
 */
function easeWheel(t: number) {
  const x = Math.min(1, Math.max(0, t))
  return x < 0.5 ? 2 * x * x : 1 - 2 * (1 - x) * (1 - x)
}

/**
 * How far through its travel each wheel is at roll position `t`.
 *
 * Higher place values run slightly ahead, so the hundreds wheel settles while the
 * units wheel is still turning. Mechanically true — a real odometer's high wheels
 * complete their travel first — and it gives the settle a sense of sequence
 * rather than all three wheels stopping at once.
 */
function wheelProgress(t: number, place: number) {
  const lead = 1 - place * 0.12
  return easeWheel(Math.min(1, t / lead))
}

const tracked = computed(() =>
  columns.value.map((col) => {
    const maxIndex = col.items.length - 1
    const raw = wheelProgress(progress.value, col.place) * maxIndex
    // Unitless wheel position. The template multiplies it by the CSS line-height
    // token, so the offset stays correct at every scale without JS knowing the
    // rendered pixel size.
    const index = Math.min(maxIndex, Math.max(0, raw))
    return {
      items: col.items,
      place: col.place,
      slot: col.slot,
      index
    }
  })
)

const tick = (now: number) => {
  if (!startAt) startAt = now
  const elapsed = now - startAt - props.delay
  const t = Math.min(1, Math.max(0, elapsed / props.duration))

  progress.value = t
  value.value = Math.round(t * props.to)

  if (t < 1) {
    raf = requestAnimationFrame(tick)
  } else {
    progress.value = 1
    value.value = props.to
    raf = 0
    emit('complete')
  }
}

onMounted(() => {
  // Reduced motion: land on the target on the first frame, no rAF loop.
  if (props.instant) {
    progress.value = 1
    value.value = props.to
    emit('complete')
    return
  }

  raf = requestAnimationFrame(tick)
})

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
})

defineExpose({ value })
</script>

<template>
  <div
    class="odometer"
    role="progressbar"
    aria-label="Loading"
    aria-valuemin="0"
    :aria-valuemax="props.to"
    :aria-valuenow="value"
  >
    <div class="odometer__window">
      <div
        v-for="col in tracked"
        :key="col.place"
        class="odometer__column"
        :style="{ left: `calc(var(--odo-advance) * ${col.slot})` }"
        aria-hidden="true"
      >
        <span
          class="odometer__digit"
          :style="{ transform: `translate3d(0, calc(var(--odo-line) * ${-col.index}), 0)` }"
        >
          <span v-for="(d, i) in col.items" :key="i" class="odometer__glyph">{{ d }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
/**
 * Every dimension derives from `--odo-scale`, so the numeral scales as a unit
 * and the JS-driven offset (expressed in line-height multiples) stays correct
 * at any size. The reference's fixed 333px overflows below ~360px; scaling
 * keeps the same proportions inside the viewport instead.
 */
.odometer {
  --odo-scale: 1;
  --odo-line: calc(213px * var(--odo-scale));
  --odo-glyph: calc(185px * var(--odo-scale));
  --odo-advance: calc(111.00444px * var(--odo-scale));
  --odo-column: calc(93px * var(--odo-scale));
  --odo-window-w: calc(333.013px * var(--odo-scale));
  --odo-window-h: calc(207.188px * var(--odo-scale));

  width: var(--odo-window-w);
  height: var(--odo-window-h);
}

.odometer__window {
  position: relative;
  width: var(--odo-window-w);
  height: var(--odo-window-h);
  // Slightly shorter than one line box, which is what makes a rolling column
  // show a sliver of the incoming digit at its edges.
  overflow: hidden;
}

.odometer__column {
  position: absolute;
  top: 0;
  width: var(--odo-column);
  display: flex;
  flex-direction: column;
}

.odometer__digit {
  display: flex;
  flex-direction: column;
  will-change: transform;
}

.odometer__glyph {
  display: block;
  height: var(--odo-line);
  line-height: var(--odo-line);
  // The reference declares PT Mono but never loads it, so its digits actually
  // render in the browser default serif. An explicit serif stack reproduces the
  // observed rendering deterministically rather than depending on an absent font.
  font-family: 'Times New Roman', Times, Georgia, serif;
  font-size: var(--odo-glyph);
  font-weight: 400;
  color: #000;
  font-variant-numeric: tabular-nums lining-nums;
}

@include sm-down {
  .odometer {
    --odo-scale: 0.86;
  }
}

@include xs-down {
  .odometer {
    --odo-scale: 0.74;
  }
}

@include reduced-motion {
  .odometer__digit {
    will-change: auto;
  }
}
</style>
