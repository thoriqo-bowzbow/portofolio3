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
</script>

<template>
  <section id="reviews" class="testimonials">
    <div class="testimonials__content container">
      <div class="testimonials__titling">
        <SectionTitle title="What people say" />
        <p class="testimonials__subtitle">
          Feedback from the teams and clients I have worked alongside.
        </p>
      </div>

      <div ref="introRef" class="testimonials__info">
        <p class="testimonials__info-text">{{ testimonialsIntro }}</p>

        <div ref="listRef" class="testimonials__list">
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
