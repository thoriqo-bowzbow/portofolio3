<script setup lang="ts">
/**
 * Request modal — the header CTA's destination.
 *
 * Replaces the previous behaviour, where "Get in touch" scrolled to `#contact`.
 * Recon recorded the reference's `.md-lvp` modal as an explicit UNKNOWN, so the
 * panel geometry, typography and field metrics below were measured from the live
 * reference before building (see `docs/P1_MODAL_REPORT.md`).
 *
 * ```
 * panel      600 × 633, padding 70px 60px, #fff, square corners
 * close      absolute, top/right 30px, 40 × 40, 25px icon
 * title      34px / 700, display face, #252324
 * fields     480 × 55, 1px rgba(37,35,36,.2), square, 15px 20px padding
 * textarea   480 × 150, 14px / 300
 * hint       12px, rgba(37,35,36,.3), right-aligned, live word count
 * submit     right-aligned dark button
 * ```
 *
 * **No fake success.** This repository has no endpoint, so a valid submission
 * reports that nothing was sent — the same policy as the standalone contact form.
 */
import { requestModal } from '~/data/requestModal'

const { isOpen, close } = useRequestModal()

const MIN_WORDS = 10

const form = reactive({ name: '', email: '', message: '' })
const errors = reactive<Record<string, string>>({})
const status = ref<'idle' | 'submitting' | 'not-configured'>('idle')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** The reference counts words, not characters — its hint reads "min 10 words". */
const wordCount = computed(() => form.message.trim().split(/\s+/).filter(Boolean).length)

const wordHint = computed(() => requestModal.wordHint(wordCount.value, MIN_WORDS))

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k])

  if (!form.name.trim()) errors.name = requestModal.errors.name
  if (!form.email.trim()) errors.email = requestModal.errors.email
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = requestModal.errors.emailInvalid
  if (wordCount.value < MIN_WORDS) errors.message = requestModal.errors.message

  return Object.keys(errors).length === 0
}

async function submit() {
  if (status.value === 'submitting') return

  if (!validate()) {
    status.value = 'idle'
    return
  }

  status.value = 'submitting'

  // No endpoint ships with this repository — see the component docblock. The
  // delay keeps the button's loading state legible without implying a request
  // that did not happen.
  await new Promise((resolve) => setTimeout(resolve, 400))

  status.value = 'not-configured'
}

function reset() {
  form.name = ''
  form.email = ''
  form.message = ''
  Object.keys(errors).forEach((k) => delete errors[k])
  status.value = 'idle'
}

/** A closed modal must not reopen holding the previous attempt's errors. */
watch(isOpen, (open) => {
  if (!open) reset()
})
</script>

<template>
  <ModalShell
    :open="isOpen"
    labelled-by="request-modal-title"
    initial-focus="#request-modal-name"
    @close="close"
  >
    <button type="button" class="request__close" :aria-label="requestModal.close" @click="close">
      <img src="/icons/icon-close.svg" alt="" aria-hidden="true">
    </button>

    <h3 id="request-modal-title" class="request__title">{{ requestModal.title }}</h3>
    <p class="request__desc">{{ requestModal.description }}</p>

    <form class="request__form" novalidate @submit.prevent="submit">
      <MdInput
        id="request-modal-name"
        v-model="form.name"
        :label="requestModal.fields.name.label"
        autocomplete="name"
        :error="errors.name"
        required
      />

      <MdInput
        id="request-modal-email"
        v-model="form.email"
        type="email"
        :label="requestModal.fields.email.label"
        autocomplete="email"
        :error="errors.email"
        required
      />

      <div class="request__message">
        <MdTextarea
          id="request-modal-message"
          v-model="form.message"
          :label="requestModal.fields.message.label"
          :error="errors.message"
          required
        />
        <p class="request__hint" aria-hidden="true">{{ wordHint }}</p>
      </div>

      <p
        v-if="status === 'not-configured'"
        class="request__notice"
        role="status"
      >{{ requestModal.notConfigured }}</p>

      <MdButton
        class="request__submit"
        variant="dark"
        type="submit"
        :label="requestModal.submit"
        :loading="status === 'submitting'"
      />
    </form>
  </ModalShell>
</template>

<style scoped lang="scss">
// 40 × 40 at 30px inset, matching the reference's `.md-lvp__close`.
.request__close {
  @include button-reset;
  @include focus-ring;

  position: absolute;
  top: 30px;
  right: 30px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: $dur-hover;

  img {
    width: 25px;
    height: 25px;
    object-fit: contain;
  }

  // The reference rotates the glyph a quarter turn and dims it.
  &:hover {
    opacity: 0.6;
    transform: rotate(90deg);
  }
}

.request__title {
  @include display(34px, 700);

  color: $c-ink;
  margin: 0;
}

.request__desc {
  font-size: 14px;
  font-weight: 400;
  line-height: 160%;
  color: $c-ink-60;
  margin: 10px 0 0;
  padding-right: 40px;
}

.request__form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 25px 0 0;
}

.request__message {
  position: relative;
}

.request__hint {
  font-size: 12px;
  font-weight: 400;
  line-height: 1.4;
  color: $c-ink-30;
  text-align: right;
  margin: 4px 0 0;
}

.request__notice {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.5;
  color: $c-success-deep;
  margin: 0;
}

.request__submit {
  align-self: flex-end;
  padding: 0 20px;
  margin: 5px 0 0;
  // The reference gives its modal submit a lighter fill than its other dark
  // buttons — 0.6 here against 0.7 on "Leave yours" and the contact form. Matched
  // locally rather than in MdButton, which is shared and correct as it stands.
  background: $c-ink-60;
}

@include sm-down {
  .request__title {
    font-size: 26px;
  }

  .request__desc {
    padding-right: 30px;
  }

  .request__close {
    top: 18px;
    right: 18px;
  }
}

@include reduced-motion {
  .request__close:hover {
    transform: none;
  }
}
</style>
