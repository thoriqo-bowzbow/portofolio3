<script setup lang="ts">
/**
 * The reference's `.mdbtn` — square, 45px tall, white, with a 1.05 scale hover.
 * Renders as a `<button>` by default or an `<a>` when `href` is supplied.
 */
const props = withDefaults(
  defineProps<{
    label: string
    href?: string
    external?: boolean
    /** Dark fill variant used by the testimonial CTA and form submit. */
    variant?: 'light' | 'dark'
    icon?: string
    /** Replaces the label while a request is in flight. */
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit'
  }>(),
  {
    href: undefined,
    external: false,
    variant: 'light',
    icon: undefined,
    loading: false,
    disabled: false,
    type: 'button'
  }
)

const emit = defineEmits<{ (e: 'click', ev: MouseEvent): void }>()

const tag = computed(() => (props.href ? 'a' : 'button'))
const isInert = computed(() => props.disabled || props.loading)

const onClick = (ev: MouseEvent) => {
  if (isInert.value) {
    ev.preventDefault()
    return
  }
  emit('click', ev)
}
</script>

<template>
  <component
    :is="tag"
    class="btn"
    :class="[`btn--${props.variant}`, { 'is-loading': props.loading, 'is-disabled': isInert }]"
    :href="props.href"
    :target="props.external ? '_blank' : undefined"
    :rel="props.external ? 'noopener noreferrer' : undefined"
    :type="tag === 'button' ? props.type : undefined"
    :disabled="tag === 'button' ? isInert : undefined"
    :aria-disabled="isInert || undefined"
    :aria-busy="props.loading || undefined"
    @click="onClick"
  >
    <img v-if="props.icon && !props.loading" class="btn__icon" :src="props.icon" alt="" aria-hidden="true">
    <span class="btn__text">{{ props.label }}</span>
    <img
      v-if="props.loading"
      class="btn__loading"
      src="/icons/icon-spinner.svg"
      alt=""
      aria-hidden="true"
    >
  </component>
</template>

<style scoped lang="scss">
.btn {
  @include button-reset;
  @include focus-ring;

  display: inline-flex;
  padding: 12px 20px;
  justify-content: center;
  align-items: center;
  gap: 10px;
  height: 45px;
  transition: $dur-hover;
  background: $c-surface;
  will-change: transform;
  position: relative;

  &:hover:not(.is-disabled) {
    transform: scale(1.05);
  }

  &:active:not(.is-disabled) {
    transform: scale(1);
  }
}

.btn__text {
  color: $c-ink;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 120%;
  transition: 0.2s;
  white-space: nowrap;
}

.btn__icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
  display: flex;
}

.btn__loading {
  width: 20px;
  height: 20px;
  display: flex;
  object-fit: contain;
  animation: rotater 1s linear infinite;
  position: absolute;
  z-index: 3;
  top: calc(50% - 10px);
  left: calc(50% - 10px);
  transition: $dur-hover;
}

.btn--dark {
  background: $c-ink-70;

  .btn__text {
    color: $c-surface;
  }
}

.btn.is-loading {
  opacity: 0.7;
  pointer-events: none;

  .btn__text,
  .btn__icon {
    opacity: 0;
  }
}

.btn.is-disabled {
  cursor: not-allowed;
}

@include reduced-motion {
  .btn:hover {
    transform: none;
  }

  .btn__loading {
    animation: none;
  }
}
</style>
