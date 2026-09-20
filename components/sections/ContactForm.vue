<script setup lang="ts">
/**
 * Contact form.
 *
 * Visual spec from the reference (RECON §7.7): a 400px column with a 5px gap,
 * an SK Zweig heading at 28px in `$c-ink-60`, and floating-label fields.
 *
 * The reference posts to a backend that is not part of this repository, so the
 * form performs full client-side validation and then reports that no endpoint is
 * configured — rather than pretending to send and silently discarding the
 * message. Swap `submit()` for a real transport to go live.
 */
import { contactSection } from '~/data/contact'

const form = reactive({ name: '', email: '', message: '' })
const errors = reactive<Record<string, string>>({})
const status = ref<'idle' | 'submitting' | 'success' | 'error'>('idle')
const serverMessage = ref('')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k])

  if (!form.name.trim()) errors.name = 'Please tell me your name.'
  if (!form.email.trim()) errors.email = 'An email address is required.'
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = 'That does not look like an email address.'
  if (form.message.trim().length < 10) errors.message = 'A sentence or two is plenty.'

  return Object.keys(errors).length === 0
}

async function submit() {
  if (status.value === 'submitting') return
  if (!validate()) {
    status.value = 'idle'
    return
  }

  status.value = 'submitting'
  serverMessage.value = ''

  // No endpoint ships with this repository — see the component docblock.
  await new Promise((resolve) => setTimeout(resolve, 400))

  status.value = 'error'
  serverMessage.value =
    'This form is not connected to a backend yet. Email me directly and I will reply.'
}

function reset() {
  form.name = ''
  form.email = ''
  form.message = ''
  status.value = 'idle'
  serverMessage.value = ''
}
</script>

<template>
  <div id="contact-form" class="contact-form">
    <h3 class="contact-form__title">{{ contactSection.form.title }}</h3>
    <p class="contact-form__subtitle">{{ contactSection.form.subtitle }}</p>

    <form class="contact-form__block" novalidate @submit.prevent="submit">
      <MdInput
        v-model="form.name"
        :label="contactSection.form.fields.name.label"
        autocomplete="name"
        :error="errors.name"
        required
      />

      <MdInput
        v-model="form.email"
        type="email"
        :label="contactSection.form.fields.email.label"
        autocomplete="email"
        :error="errors.email"
        required
      />

      <MdTextarea
        v-model="form.message"
        :label="contactSection.form.fields.message.label"
        :error="errors.message"
        required
      />

      <p
        v-if="status === 'error' && serverMessage"
        class="contact-form__notice contact-form__notice--error"
        role="alert"
      >{{ serverMessage }}</p>

      <p
        v-if="status === 'success'"
        class="contact-form__notice contact-form__notice--success"
        role="status"
      >{{ serverMessage }}</p>

      <MdButton
        class="contact-form__submit"
        variant="dark"
        type="submit"
        :label="contactSection.form.submit"
        :loading="status === 'submitting'"
      />

      <p class="contact-form__hint">{{ contactSection.form.hint }}</p>
    </form>
  </div>
</template>

<style scoped lang="scss">
.contact-form {
  width: 400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.contact-form__title {
  font-family: $font-display;
  font-size: 28px;
  font-weight: 400;
  line-height: 120%;
  color: $c-ink-60;
  text-align: center;
  font-style: normal;
  margin: 0;
}

.contact-form__subtitle {
  font-size: 14px;
  font-weight: 300;
  line-height: 160%;
  color: $c-ink-60;
  text-align: center;
  font-style: normal;
  margin: 0;
}

.contact-form__block {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 20px 0 0;
}

.contact-form__submit {
  align-self: flex-end;
  padding: 0 40px;
}

.contact-form__notice {
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  padding: 12px 16px;
  border-radius: 5px;
  text-align: center;
}

.contact-form__notice--error {
  background: rgba(186, 13, 13, 0.12);
  color: $c-error-deep;
}

.contact-form__notice--success {
  background: rgba(79, 215, 135, 0.12);
  color: $c-success-deep;
}

.contact-form__hint {
  font-size: 12px;
  color: $c-ink-40;
  margin: -4px 0 0 auto;
}

@include md-down {
  .contact-form {
    width: 350px;
    max-width: 100%;
  }
}
</style>
