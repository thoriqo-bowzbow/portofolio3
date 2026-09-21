<script setup lang="ts">
/**
 * Review modal — the testimonials section's "Leave yours" destination.
 *
 * The reference exposes two modals: the header's request form and this one,
 * reached from "Leave yours" under the testimonials subtitle. Measured from the
 * live site before building:
 *
 * ```
 * panel      ~750 × 660, padding 70px 60px, #fff, square corners
 * title      "What do you think", large display face
 * layout     two columns — photo dropzone left, fields right
 * dropzone   dashed 1px border, square, centred glyph + "Choose or Drop"
 * fields     Your name / Your email / Your position / Share your review…
 * hint       0 / 10 words minimum, right-aligned under the textarea
 * submit     dark button, right-aligned
 * ```
 *
 * It shares `ModalShell`, so the scrim, panel geometry, motion and the whole
 * accessibility layer are identical to the request modal's.
 *
 * **No fake success.** No endpoint ships with this repository, so a valid
 * submission reports that nothing was sent rather than claiming delivery.
 */
import { reviewModal } from '~/data/reviewModal'

const { isOpen, close } = useReviewModal()

const MIN_WORDS = 10

const form = reactive({ name: '', email: '', position: '', review: '' })
const errors = reactive<Record<string, string>>({})
const status = ref<'idle' | 'submitting' | 'not-configured'>('idle')

/** Local object URL for the chosen photograph; revoked when it is replaced. */
const photoName = ref('')
const photoUrl = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** The reference counts words, not characters — its hint reads "min 10 words". */
const wordCount = computed(() => form.review.trim().split(/\s+/).filter(Boolean).length)
const wordHint = computed(() => reviewModal.wordHint(wordCount.value, MIN_WORDS))

function onFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (photoUrl.value) URL.revokeObjectURL(photoUrl.value)
  photoUrl.value = URL.createObjectURL(file)
  photoName.value = file.name
}

function clearPhoto() {
  if (photoUrl.value) URL.revokeObjectURL(photoUrl.value)
  photoUrl.value = ''
  photoName.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k])

  if (!form.name.trim()) errors.name = reviewModal.errors.name
  if (!form.email.trim()) errors.email = reviewModal.errors.email
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = reviewModal.errors.emailInvalid
  if (!form.position.trim()) errors.position = reviewModal.errors.position
  if (wordCount.value < MIN_WORDS) errors.review = reviewModal.errors.review

  return Object.keys(errors).length === 0
}

async function submit() {
  if (status.value === 'submitting') return

  if (!validate()) {
    status.value = 'idle'
    return
  }

  status.value = 'submitting'

  // No endpoint ships with this repository. The delay keeps the button's loading
  // state legible without implying a request that did not happen.
  await new Promise((resolve) => setTimeout(resolve, 400))

  status.value = 'not-configured'
}

function reset() {
  form.name = ''
  form.email = ''
  form.position = ''
  form.review = ''
  Object.keys(errors).forEach((k) => delete errors[k])
  status.value = 'idle'
  clearPhoto()
}

/** A closed modal must not reopen holding the previous attempt's state. */
watch(isOpen, (open) => {
  if (!open) reset()
})

onBeforeUnmount(() => {
  if (photoUrl.value) URL.revokeObjectURL(photoUrl.value)
})
</script>

<template>
  <ModalShell
    :open="isOpen"
    labelled-by="review-modal-title"
    initial-focus="#review-modal-name"
    @close="close"
  >
    <button type="button" class="review__close" :aria-label="reviewModal.close" @click="close">
      <img src="/icons/icon-close.svg" alt="" aria-hidden="true">
    </button>

    <h3 id="review-modal-title" class="review__title">{{ reviewModal.title }}</h3>
    <p class="review__desc">{{ reviewModal.description }}</p>

    <form class="review__form" novalidate @submit.prevent="submit">
      <div class="review__upload">
        <p class="review__upload-label">{{ reviewModal.upload.label }}<span aria-hidden="true">*</span></p>

        <label class="review__dropzone" :class="{ 'has-photo': photoUrl }">
          <input
            ref="fileInput"
            class="visually-hidden"
            type="file"
            :accept="reviewModal.upload.accept"
            :aria-label="reviewModal.upload.ariaLabel"
            @change="onFile"
          >

          <template v-if="photoUrl">
            <img class="review__preview" :src="photoUrl" alt="">
            <span class="review__preview-name">{{ photoName }}</span>
          </template>

          <template v-else>
            <img class="review__dropzone-icon" src="/icons/icon-profile.svg" alt="" aria-hidden="true">
            <span class="review__dropzone-hint">{{ reviewModal.upload.hint }}</span>
          </template>
        </label>

        <button
          v-if="photoUrl"
          type="button"
          class="review__upload-clear"
          @click="clearPhoto"
        >Remove photo</button>
      </div>

      <div class="review__fields">
        <MdInput
          id="review-modal-name"
          v-model="form.name"
          :label="reviewModal.fields.name.label"
          autocomplete="name"
          :error="errors.name"
          required
        />

        <MdInput
          id="review-modal-email"
          v-model="form.email"
          type="email"
          :label="reviewModal.fields.email.label"
          autocomplete="email"
          :error="errors.email"
          required
        />

        <MdInput
          id="review-modal-position"
          v-model="form.position"
          :label="reviewModal.fields.position.label"
          autocomplete="organization-title"
          :error="errors.position"
          required
        />

        <div class="review__review">
          <MdTextarea
            id="review-modal-review"
            v-model="form.review"
            :label="reviewModal.fields.review.label"
            :error="errors.review"
            required
          />
          <p class="review__hint" aria-hidden="true">{{ wordHint }}</p>
        </div>
      </div>

      <p v-if="status === 'not-configured'" class="review__notice" role="status">
        {{ reviewModal.notConfigured }}
      </p>

      <MdButton
        class="review__submit"
        variant="dark"
        type="submit"
        :label="reviewModal.submit"
        :loading="status === 'submitting'"
      />
    </form>
  </ModalShell>
</template>

<style scoped lang="scss">
.review__close {
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

  &:hover {
    opacity: 0.6;
    transform: rotate(90deg);
  }
}

.review__title {
  @include display(34px, 700);

  color: $c-ink;
  margin: 0;
}

.review__desc {
  font-size: 14px;
  font-weight: 400;
  line-height: 160%;
  color: $c-ink-60;
  margin: 10px 0 0;
  padding-right: 40px;
}

// The reference puts the dropzone beside the fields rather than above them.
.review__form {
  display: grid;
  grid-template-columns: 300px 1fr;
  align-items: start;
  gap: 10px 20px;
  margin: 25px 0 0;
}

.review__upload {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.review__upload-label {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.4;
  color: $c-ink-30;
  margin: 0;
}

.review__dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  aspect-ratio: 3 / 4;
  border: 1px dashed $c-ink-30;
  cursor: pointer;
  overflow: hidden;
  transition: $dur-hover;
  text-align: center;
  padding: 15px;

  &:hover,
  &:focus-within {
    border-color: $c-ink-60;
  }

  &.has-photo {
    border-style: solid;
    border-color: $c-ink-10;
  }
}

.review__dropzone-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
  opacity: 0.35;
}

.review__dropzone-hint {
  font-size: 14px;
  font-weight: 400;
  color: $c-ink-30;
}

.review__preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.review__preview-name {
  font-size: 12px;
  color: $c-ink-60;
  word-break: break-all;
}

.review__upload-clear {
  @include button-reset;
  @include focus-ring;

  align-self: flex-start;
  font-size: 12px;
  color: $c-ink-60;
  text-decoration: underline;

  &:hover {
    color: $c-ink;
  }
}

.review__fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.review__review {
  position: relative;
}

.review__hint {
  font-size: 12px;
  font-weight: 400;
  line-height: 1.4;
  color: $c-ink-30;
  text-align: right;
  margin: 4px 0 0;
}

.review__notice {
  grid-column: 1 / -1;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.5;
  color: $c-success-deep;
  margin: 0;
}

.review__submit {
  grid-column: 1 / -1;
  justify-self: end;
  padding: 0 20px;
  margin: 5px 0 0;
  // "Leave yours" and the contact form both sit at 0.7, and so does this submit.
  background: $c-ink-60;
}

@include lg-down {
  .review__form {
    grid-template-columns: 1fr;
  }

  .review__dropzone {
    aspect-ratio: 16 / 9;
  }
}

@include sm-down {
  .review__title {
    font-size: 26px;
  }

  .review__desc {
    padding-right: 30px;
  }

  .review__close {
    top: 18px;
    right: 18px;
  }
}

@include reduced-motion {
  .review__close:hover {
    transform: none;
  }
}
</style>
