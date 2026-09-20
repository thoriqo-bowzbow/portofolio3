<script setup lang="ts">
/**
 * Floating-label text input.
 *
 * Reproduces the reference's `.md-input` (.md-input__label) behaviour exactly
 * (RECON §7.7): the real placeholder is transparent, a sibling label sits
 * centred, and the `:placeholder-shown` state drives the lift to the top of the
 * field with a reduced font size.
 *
 * The label is a real `<label for>` rather than the reference's bare span, so
 * the field is properly associated.
 */
const props = withDefaults(
  defineProps<{
    label: string
    type?: 'text' | 'email' | 'tel'
    modelValue: string
    required?: boolean
    autocomplete?: string
    error?: string
    id?: string
  }>(),
  {
    type: 'text',
    required: false,
    autocomplete: undefined,
    error: undefined,
    id: undefined
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const uid = useId()
const fieldId = computed(() => props.id ?? `field-${uid}`)
const errorId = computed(() => `${fieldId.value}-error`)
</script>

<template>
  <div class="field" :class="{ 'has-error': Boolean(props.error) }">
    <div class="field__wrapper">
      <input
        :id="fieldId"
        class="field__input"
        :type="props.type"
        :value="props.modelValue"
        :required="props.required"
        :autocomplete="props.autocomplete"
        :aria-invalid="props.error ? 'true' : undefined"
        :aria-describedby="props.error ? errorId : undefined"
        :placeholder="props.label"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      >
      <label class="field__label" :for="fieldId">{{ props.label }}</label>
    </div>
    <p v-if="props.error" :id="errorId" class="field__error" role="alert">{{ props.error }}</p>
  </div>
</template>

<style scoped lang="scss">
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  position: relative;
}

.field__wrapper {
  position: relative;
  display: flex;
}

.field__input {
  display: inline-block;
  width: 100%;
  padding: 15px 20px;
  line-height: 1.5;
  height: 55px;
  border: 1px solid $c-ink-20;
  border-radius: $radius-none;
  background: $c-surface;
  font-size: 14px;
  color: $c-ink-80;
  transition: border-color $dur-hover, padding $dur-hover;

  &::placeholder {
    opacity: 0;
  }

  // Lift the value so the floating label has room
  &:not(:placeholder-shown) {
    padding: 15px 20px 0;
  }

  &:focus {
    border-color: $c-focus;
  }
}

.field__label {
  position: absolute;
  top: 50%;
  left: 20px;
  font-size: 14px;
  color: $c-ink-40;
  transform: translateY(-50%);
  transition: 0.4s;
  pointer-events: none;
}

.field__input:not(:placeholder-shown) + .field__label {
  top: 10px;
  transform: revert;
  font-size: 11px;
  padding: 0 2px;
  color: $c-ink-30;
}

.field.has-error {
  .field__input {
    border-color: $c-error;
  }

  .field__label {
    color: $c-error;
  }
}

.field__error {
  font-size: 12px;
  line-height: 1.4;
  color: $c-error-deep;
}

@include sm-down {
  .field__input {
    padding: 10px 15px;
    height: 50px;

    &:not(:placeholder-shown) {
      padding: 15px 15px 0;
    }
  }

  .field__label {
    left: 15px;
    font-size: 13px;
  }

  .field__input:not(:placeholder-shown) + .field__label {
    top: 8px;
    font-size: 11px;
  }
}
</style>
