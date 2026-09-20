<script setup lang="ts">
/**
 * Floating-label textarea — the `.md-textarea` counterpart to MdInput.
 * Label lifts from `top: 27px` to `top: 12px` and the min-height is 150px.
 */
const props = withDefaults(
  defineProps<{
    label: string
    modelValue: string
    required?: boolean
    error?: string
    id?: string
  }>(),
  { required: false, error: undefined, id: undefined }
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
      <textarea
        :id="fieldId"
        class="field__input"
        :value="props.modelValue"
        :required="props.required"
        :aria-invalid="props.error ? 'true' : undefined"
        :aria-describedby="props.error ? errorId : undefined"
        :placeholder="props.label"
        @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      />
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
  display: block;
  width: 100%;
  padding: 15px 20px;
  line-height: 1.5;
  border: 1px solid $c-ink-20;
  border-radius: $radius-none;
  background: $c-surface;
  font-size: 14px;
  font-weight: 300;
  resize: vertical;
  min-height: 150px;
  max-height: 300px;
  color: $c-ink-80;
  font-family: $font-body;
  transition: border-color $dur-hover, padding $dur-hover;

  &::placeholder {
    opacity: 0;
  }

  &:not(:placeholder-shown) {
    padding: 25px 20px 0;
  }

  &:focus {
    border-color: $c-focus;
  }
}

.field__label {
  position: absolute;
  top: 27px;
  left: 23px;
  font-size: 14px;
  color: $c-ink-40;
  transform: translateY(-50%);
  transition: 0.4s;
  pointer-events: none;
}

.field__input:not(:placeholder-shown) + .field__label {
  top: 12px;
  left: 20px;
  transform: revert;
  font-size: 11px;
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
  }

  .field__label {
    top: 22px;
    left: 15px;
    font-size: 13px;
  }
}
</style>
