<script setup lang="ts">
/**
 * Testimonial card.
 *
 * Portrait card, dormant at `opacity .4`, greyscale image in a 130%/-15% reservoir.
 *
 * **No scroll parallax.** All six `.md-rvwcard__image` in the reference carry
 * `data-scroll-speed="1"` and sample at `translateY: 0` while in view. The
 * reservoir is retained because it is in the reference's CSS and governs the crop;
 * the motion is not. See docs/P1_MOTION_RECONCILIATION_REPORT.md.
 *
 * Hover runs the frosted takeover with the text cascade at 0.2s / 0.5s / 0.8s
 * (RECON §7.6).
 *
 * The vertical staircase is not applied here — it is a `:nth-child` rule on the
 * grid, because it depends on position in the list.
 */
import type { Testimonial } from '~/data/types'

const props = defineProps<{
  testimonial: Testimonial
}>()

const root = ref<HTMLElement | null>(null)
</script>

<template>
  <article ref="root" class="testimonial-card">
    <img
      class="testimonial-card__image"
      :src="props.testimonial.portrait"
      :alt="`Portrait of ${props.testimonial.name}`"
      loading="lazy"
      decoding="async"
    >

    <div class="testimonial-card__info">
      <h3 class="testimonial-card__name">{{ props.testimonial.name }}</h3>
      <p class="testimonial-card__job">{{ props.testimonial.role }}</p>
      <p class="testimonial-card__text">{{ props.testimonial.quote }}</p>
    </div>
  </article>
</template>

<style scoped lang="scss">
.testimonial-card {
  width: 100%;
  overflow: hidden;
  height: 400px;
  transition: $dur-hover;
  opacity: 0.4;
  background: $c-black;
  position: relative;
  pointer-events: none;

  &.is-inview {
    opacity: 1;
    pointer-events: all;
  }
}

.testimonial-card__image {
  height: 130%;
  width: 100%;
  object-fit: cover;
  top: -15%;
  position: relative;
  filter: grayscale(1);
}

.testimonial-card__info {
  @include frosted($c-white-70, 5px);

  position: absolute;
  z-index: 2;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 40px;
  transition: 0.8s;
  opacity: 0;
}

.testimonial-card__name {
  color: $c-ink;
  font-family: $font-display;
  font-size: 28px;
  font-weight: 700;
  font-style: normal;
  line-height: 120%;
  transition: $dur-hover;
  opacity: 0;
  margin: 0;
}

.testimonial-card__job {
  color: $c-ink-60;
  font-size: 14px;
  font-weight: 400;
  font-style: normal;
  line-height: 120%;
  margin: 0 0 30px;
  transition: $dur-hover;
  opacity: 0;
}

.testimonial-card__text {
  color: $c-ink;
  font-size: 15px;
  font-style: normal;
  font-weight: 500;
  line-height: 160%;
  transition: $dur-hover;
  height: 100px;
  opacity: 0;
  margin: 0;
}

.testimonial-card:hover {
  .testimonial-card__info {
    opacity: 1;
  }

  .testimonial-card__name {
    animation: fade-in-up 0.6s $ease-reveal 0.2s 1 forwards;
  }

  .testimonial-card__job {
    animation: fade-in-up 0.6s $ease-reveal 0.5s 1 forwards;
  }

  .testimonial-card__text {
    animation: fade-in-up 0.6s $ease-reveal 0.8s 1 forwards;
  }
}

@include xl-down {
  .testimonial-card {
    height: 300px;
  }

  .testimonial-card__info {
    padding: 25px;
  }

  .testimonial-card__name {
    font-size: 16px;
  }

  .testimonial-card__job {
    font-size: 12px;
  }

  .testimonial-card__text {
    font-size: 12px;
  }
}

@include sm-down {
  .testimonial-card {
    height: 290px;
  }

  .testimonial-card__info {
    padding: 20px;
  }

  .testimonial-card__name {
    font-size: 18px;
  }

  .testimonial-card__job {
    margin: 0 0 10px;
  }

  .testimonial-card__text {
    font-size: 12px;
  }
}

@include reduced-motion {
  .testimonial-card:hover {
    .testimonial-card__info {
      opacity: 1;
    }

    .testimonial-card__name,
    .testimonial-card__job,
    .testimonial-card__text {
      animation: none;
      opacity: 1;
      transform: none;
      visibility: visible;
    }
  }
}
</style>
