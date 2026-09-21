<script setup lang="ts">
/**
 * Testimonials — the staircase.
 *
 * Three columns whose 2nd and 3rd cards are offset downward by 100px and 200px
 * using *paired* positive/negative margins (`100px 0 -100px`, `200px 0 -200px`).
 * The negative bottom margin cancels the height the offset would otherwise add,
 * so the columns stair-step while the grid's overall height stays put — the
 * single most distinctive layout trick in the reference (RECON §7.6).
 *
 * At ≤992px it re-flows to two columns with a 50px offset on every second card.
 */
import { testimonials, testimonialsIntro } from '~/data/testimonials'

const listRef = ref<HTMLElement | null>(null)
const introRef = ref<HTMLElement | null>(null)

// threshold 0 on the copy so the ink-in completes before the line is readable
useRevealChildren(introRef, '.testimonials__info-text', { threshold: 0 })
useRevealChildren(listRef, '.testimonial-card', { threshold: 0.05 })

/**
 * "Leave yours" opens the review modal.
 *
 * The reference carries this action under the testimonials subtitle, and it is
 * the only way into the review form — without it the modal is unreachable and the
 * section loses the invitation the reference leads with.
 */
const { open: openReviewModal } = useReviewModal()
</script>

<template>
  <section id="reviews" class="testimonials">
    <div class="testimonials__content container">
      <div class="testimonials__titling">
        <SectionTitle title="What people say" />
        <!--
          The previous subtitle said "Feedback from the teams and clients I have
          worked alongside" — untrue while the mosaic is empty, and it contradicted
          the empty state directly beneath it.
        -->
        <p class="testimonials__subtitle">
          Reviews from the people I have worked with, published with their permission.
        </p>

        <MdButton
          class="testimonials__cta"
          variant="dark"
          :label="'Leave yours'"
          @click="openReviewModal()"
        />
      </div>

      <div ref="introRef" class="testimonials__info">
        <p class="testimonials__info-text">{{ testimonialsIntro }}</p>

        <!--
          Empty state. The CV lists no referees or quotations, and fabricated
          testimonials are the most damaging thing a portfolio can carry, so the
          mosaic stays empty and says so. The staircase markup is untouched for
          when real reviews arrive.
        -->
        <p v-if="!testimonials.length" class="testimonials__empty">
          No reviews published yet — the form is open if you would like to leave one.
        </p>

        <div v-else ref="listRef" class="testimonials__list">
          <TestimonialCard
            v-for="item in testimonials"
            :key="item.name"
            :testimonial="item"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.testimonials {
  @include section-padding;

  background: $c-surface;
}

.testimonials__content {
  @include grid-split;

  position: relative;
}

.testimonials__titling {
  align-self: flex-start;
}

.testimonials__subtitle {
  @include section-subtitle(160%);
}

// Sits directly under the subtitle on the left, matching the reference's
// placement rather than trailing the mosaic on the right.
.testimonials__cta {
  align-self: flex-start;
  margin: 25px 0 0;
  padding: 0 20px;
}

.testimonials__info {
  margin: 0 0 200px;
}

.testimonials__info-text {
  @include ink-in-text;
}

.testimonials__list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin: 50px 0 0;
}

// Empty state. The section keeps its two-column split and its full height so the
// page's section rhythm is unchanged while the mosaic has no cards to show.
.testimonials__empty {
  font-size: 14px;
  font-weight: 300;
  line-height: 160%;
  color: $c-ink-50;
  margin: 50px 0 0;
}

// The staircase
.testimonials__list :deep(.testimonial-card:nth-child(3n + 2)) {
  margin: 100px 0 -100px;
}

.testimonials__list :deep(.testimonial-card:nth-child(3n + 3)) {
  margin: 200px 0 -200px;
}

@include md-down {
  .testimonials__list {
    grid-template-columns: repeat(2, 1fr);
  }

  .testimonials__list :deep(.testimonial-card),
  .testimonials__list :deep(.testimonial-card:nth-child(3n + 2)),
  .testimonials__list :deep(.testimonial-card:nth-child(3n + 3)) {
    height: 350px;
    margin: 0;
  }

  .testimonials__list :deep(.testimonial-card:nth-child(2n + 2)) {
    margin: 50px 0 -50px;
  }
}

@include sm-down {
  .testimonials__content {
    gap: 20px;
  }

  .testimonials__list {
    gap: 20px;
  }
}
</style>
