<script setup lang="ts">
/**
 * Modal shell — scrim, panel, and the behaviours a dialog needs.
 *
 * ## Geometry and animation, from the live reference
 *
 * Recon recorded the `.md-lvp` modal as an explicit UNKNOWN ("its open/close
 * animation on real interaction was not observed end-to-end"), so the motion was
 * measured before implementing rather than guessed:
 *
 * ```
 * open   scrim  fade-in             0.6s ease-in-out   (opacity 0 → 1)
 *        panel  fade-in-up-short    0.6s               (opacity 0 → 1, y 50 → 0)
 * close  panel  fade-out-up-short   0.6s               (opacity 1 → 0, y 0 → −50)
 *        scrim  fade-out            0.6s ease-in-out   (opacity 1 → 0)
 * ```
 *
 * The two phases run **in sequence, not together** — sampled frame by frame, the
 * panel does not begin until the scrim has finished, and on close the scrim does
 * not begin until the panel has finished. Total 1.2s each way.
 *
 * ```
 * scrim  rgba(37, 35, 36, 0.6) + backdrop-filter blur(5px), z-index 13
 * panel  600 × 633, padding 70px 60px, #fff, square corners, centred
 * ```
 *
 * ## What this adds beyond the reference
 *
 * The reference implements none of the following; they are deliberate
 * accessibility additions, documented in `docs/P1_MODAL_REPORT.md`:
 *
 * - focus is trapped in the panel while open
 * - focus returns to the element that opened it
 * - Escape closes; so does a click on the scrim (but not on the panel)
 * - background scroll is locked, with scrollbar-width compensation so the page
 *   behind does not shift sideways
 * - the panel is a real `role="dialog" aria-modal="true"` with a label
 * - `prefers-reduced-motion` collapses both animations to instant
 */
const props = withDefaults(
  defineProps<{
    open: boolean
    /** id of the element naming the dialog. */
    labelledBy?: string
    /** Selector for the element to focus on open; falls back to the panel. */
    initialFocus?: string
  }>(),
  { labelledBy: undefined, initialFocus: undefined }
)

const emit = defineEmits<{ (e: 'close'): void }>()

/**
 * `entering` → `idle` → `leaving-panel` → `leaving-scrim` → unmounted.
 *
 * The panel only exists in the DOM while the modal is open, so the exit animation
 * has to finish before unmounting — hence explicit phases rather than a boolean.
 * The two leaving phases keep the reference's sequencing: the panel animates out
 * first, and only then does the scrim fade.
 */
const phase = ref<'closed' | 'entering' | 'idle' | 'leaving-panel' | 'leaving-scrim'>('closed')
const panel = ref<HTMLElement | null>(null)
const scrimEl = ref<HTMLElement | null>(null)

const reduced = useReducedMotion()

/** Set while the scrim is still fading in, so the panel waits its turn. */
const isPanelVisible = computed(() => phase.value === 'idle')
const isLeavingPanel = computed(() => phase.value === 'leaving-panel')
const isLeavingScrim = computed(() => phase.value === 'leaving-scrim')

let timers: Array<ReturnType<typeof setTimeout>> = []
let restoreFocusTo: HTMLElement | null = null
let scrollLock: (() => void) | null = null

const after = (ms: number, fn: () => void) => {
  timers.push(setTimeout(fn, ms))
}

const clearTimers = () => {
  timers.forEach(clearTimeout)
  timers = []
}

/* -------------------------------------------------------------------------- */
/* Scroll lock                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Locks background scrolling and compensates for the disappearing scrollbar.
 *
 * Lenis drives native scroll in this build, so `overflow: hidden` alone is not
 * enough — without stopping the instance too, wheel input would keep moving the
 * page underneath the modal.
 */
function lockScroll() {
  const lenis = getLenis()
  lenis?.stop()

  const { body, documentElement } = document
  const previousOverflow = body.style.overflow
  const previousPadding = body.style.paddingRight
  const scrollbar = window.innerWidth - documentElement.clientWidth

  body.style.overflow = 'hidden'
  if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`

  scrollLock = () => {
    body.style.overflow = previousOverflow
    body.style.paddingRight = previousPadding
    lenis?.start()
  }
}

/* -------------------------------------------------------------------------- */
/* Focus                                                                       */
/* -------------------------------------------------------------------------- */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

const focusable = (): HTMLElement[] =>
  panel.value ? Array.from(panel.value.querySelectorAll<HTMLElement>(FOCUSABLE)) : []

/**
 * Keeps Tab inside the panel. Wraps at both ends rather than letting focus
 * escape to the page behind, which is still in the DOM and still focusable.
 */
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    return
  }

  if (event.key !== 'Tab') return

  const items = focusable()
  if (!items.length) {
    event.preventDefault()
    return
  }

  const first = items[0]
  const last = items[items.length - 1]
  const active = document.activeElement as HTMLElement | null

  if (event.shiftKey && (active === first || !panel.value?.contains(active))) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}

/**
 * Bound to the document, not the wrapper.
 *
 * During the 600ms scrim phase focus is still on the trigger, outside the modal,
 * so a wrapper-level listener would miss an Escape pressed in that window.
 */
const attachKeys = () => document.addEventListener('keydown', onKeydown, true)
const detachKeys = () => document.removeEventListener('keydown', onKeydown, true)

/* -------------------------------------------------------------------------- */
/* Open / close                                                                */
/* -------------------------------------------------------------------------- */

const startEnter = () => {
  // The opener is remembered before the panel takes focus, so it can be handed
  // back when the modal closes.
  restoreFocusTo = (document.activeElement as HTMLElement) ?? null

  phase.value = 'entering'
  lockScroll()
  attachKeys()

  const settle = () => {
    phase.value = 'idle'
    const target = props.initialFocus ? panel.value?.querySelector<HTMLElement>(props.initialFocus) : null
    ;(target ?? focusable()[0] ?? panel.value)?.focus()
  }

  if (reduced.value) {
    settle()
    return
  }
  // Phase one is the scrim; the panel waits for it.
  after(600, settle)
}

const startLeave = () => {
  if (phase.value.startsWith('leaving') || phase.value === 'closed') return
  clearTimers()

  if (reduced.value) {
    finishLeave()
    return
  }

  // Phase one is the panel; the scrim waits for it, matching the reference's
  // measured sequence rather than fading both at once.
  phase.value = 'leaving-panel'
  after(600, () => {
    phase.value = 'leaving-scrim'
    after(600, finishLeave)
  })
}

const finishLeave = () => {
  clearTimers()
  detachKeys()
  phase.value = 'closed'
  scrollLock?.()
  scrollLock = null
  restoreFocusTo?.focus?.()
  restoreFocusTo = null
}

watch(
  () => props.open,
  (open) => {
    if (!import.meta.client) return
    if (open) startEnter()
    else startLeave()
  }
)

/** A click on the scrim closes; a click inside the panel must not. */
const onScrimClick = (event: MouseEvent) => {
  if (event.target === scrimEl.value) emit('close')
}

onBeforeUnmount(() => {
  clearTimers()
  scrollLock?.()
})

defineExpose({ panel })
</script>

<template>
  <Teleport to="body">
    <div
      v-if="phase !== 'closed'"
      class="modal"
      :class="{ 'is-leaving-panel': isLeavingPanel, 'is-leaving-scrim': isLeavingScrim }"
    >
      <div ref="scrimEl" class="modal__scrim" @click="onScrimClick" />

      <div
        ref="panel"
        class="modal__panel"
        :class="{ 'is-visible': isPanelVisible }"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="props.labelledBy"
      >
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
/**
 * Two independent animations, each on its own element, sequenced by the phase
 * machine rather than by CSS delay — so a close part-way through an open still
 * plays the correct order.
 */
.modal {
  position: fixed;
  inset: 0;
  z-index: 13;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: modal-fade-in $dur-modal $ease-reveal 1 both;

  &.is-leaving-scrim {
    animation: modal-fade-out $dur-modal $ease-reveal 1 both;
  }
}

.modal__scrim {
  position: absolute;
  inset: 0;
  background: $c-ink-60;
  -webkit-backdrop-filter: blur(5px);
  backdrop-filter: blur(5px);
}

.modal__panel {
  position: relative;
  width: 600px;
  max-width: calc(100vw - 30px);
  max-height: calc(100vh - 30px);
  overflow-y: auto;
  padding: 70px 60px;
  background: $c-surface;
  border-radius: $radius-none;
  // Rises into place on open, leaves upward on close — matching the reference's
  // fade-in-up-short / fade-out-up-short.
  transform: translateY(50px);
  opacity: 0;

  &.is-visible {
    animation: modal-panel-in $dur-modal $ease-default 1 both;
  }
}

.is-leaving-panel .modal__panel {
  animation: modal-panel-out $dur-modal $ease-default 1 both;
}

@keyframes modal-fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes modal-fade-out {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
}

@keyframes modal-panel-in {
  from {
    opacity: 0;
    transform: translateY(50px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes modal-panel-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }

  to {
    opacity: 0;
    transform: translateY(-50px);
  }
}

@include sm-down {
  .modal__panel {
    padding: 50px 25px;
    max-width: calc(100vw - 24px);
    max-height: calc(100vh - 24px);
  }
}

@include reduced-motion {
  .modal,
  .modal__panel,
  .is-leaving-panel .modal__panel,
  .is-leaving-scrim {
    animation: none;
  }

  .modal__panel {
    opacity: 1;
    transform: none;
  }
}
</style>
