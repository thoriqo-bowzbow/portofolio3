<script setup lang="ts">
/**
 * Character-scramble text.
 *
 * Port of the reference's `compHacktext.vue` (RECON §9.3). Renders a heading
 * whose glyphs decrypt from symbol noise into the final string, firing both when
 * it scrolls into view and when it is hovered.
 *
 * The width is frozen on mount to `offsetWidth + 5px` so the varying widths of
 * the random glyphs never reflow the surrounding layout — the reason the
 * reference does the same.
 */
const props = withDefaults(
  defineProps<{
    label: string
    /** Tag to render. Headings by default; `span` for inline use. */
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'span' | 'div'
    /** Milliseconds between ticks. Derived from label length when omitted. */
    duration?: number
    /** Re-run the scramble each time the element re-enters the viewport. */
    repeat?: boolean
    /** Scramble on pointer hover. */
    hover?: boolean
  }>(),
  {
    as: 'h3',
    duration: undefined,
    repeat: false,
    hover: true
  }
)

const label = computed(() => props.label)
const { el, display, run, lockWidth } = useScramble(label, { duration: props.duration })

const reduced = useReducedMotion()
let observer: IntersectionObserver | null = null

const onPointerEnter = () => {
  if (props.hover) run()
}

const onResize = () => {
  if (!el.value) return
  el.value.style.width = ''
  nextTick(lockWidth)
}

onMounted(() => {
  if (!import.meta.client) return

  nextTick(lockWidth)
  window.addEventListener('resize', onResize, { passive: true })

  if (reduced.value || !el.value) return

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          run()
        } else if (props.repeat) {
          display.value = label.value
        }
      })
    },
    { rootMargin: '0px 0px -15% 0px', threshold: 0 }
  )
  observer.observe(el.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
  if (import.meta.client) window.removeEventListener('resize', onResize)
})
</script>

<template>
  <component
    :is="props.as"
    ref="el"
    class="scramble"
    :data-value="label"
    @mouseenter="onPointerEnter"
    @focus="onPointerEnter"
  >{{ display }}</component>
</template>

<style scoped lang="scss">
.scramble {
  display: inline-block;
  white-space: nowrap;
  cursor: pointer;
  transition: $dur-hover;
}

@include reduced-motion {
  .scramble {
    cursor: inherit;
  }
}
</style>
