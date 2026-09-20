<script setup lang="ts">
/**
 * One tile in the highlights mosaic.
 *
 * Dormant at `opacity: 0` and desaturated until revealed.
 *
 * **No scroll parallax.** The image sits in a `160% / -30%` reservoir, but the
 * reference's equivalent is inert: all ten `.md-glrycard__image` elements declare
 * a randomised `data-scroll-speed` (measured 0.15–0.99, regenerated per load) and
 * yet sample at `translateY: 0` across the whole scroll range while in view. The
 * reservoir is kept because it is in the reference's CSS and governs how the image
 * crops; the motion that `useParallax` inferred from its presence is not. See
 * docs/P1_MOTION_RECONCILIATION_REPORT.md.
 *
 * Hover runs the reference's signature three-stage takeover: the frosted
 * `blur(10px)` overlay fades in while title, description and link cascade in at
 * 0.5s / 0.8s / 1.4s. On ≤768px the overlay does not exist at all.
 */
import type { Highlight } from '~/data/types'

const props = defineProps<{
  item: Highlight
}>()

const root = ref<HTMLElement | null>(null)
</script>

<template>
  <article
    ref="root"
    class="highlight-tile"
    :class="{ 'highlight-tile--featured': props.item.featured }"
  >
    <img
      class="highlight-tile__image"
      :src="props.item.image"
      :alt="`${props.item.title} preview`"
      loading="lazy"
      decoding="async"
    >

    <div class="highlight-tile__info">
      <h3 class="highlight-tile__title">{{ props.item.title }}</h3>
      <p class="highlight-tile__desc">{{ props.item.description }}</p>
      <a
        v-if="props.item.link"
        class="highlight-tile__link"
        :href="props.item.link.href"
        :target="props.item.link.external ? '_blank' : undefined"
        :rel="props.item.link.external ? 'noopener noreferrer' : undefined"
      >{{ props.item.link.label }}</a>
    </div>
  </article>
</template>

<style scoped lang="scss">
.highlight-tile {
  width: 100%;
  position: relative;
  overflow: hidden;
  transition: 0.8s;
  opacity: 0;
  filter: grayscale(1) opacity(0.4);

  // 2×2 cell — two of these per mosaic
  &--featured {
    grid-column: span 2;
    grid-row: span 2;
  }

  &.is-inview {
    opacity: 1;
    transform: translateY(0);
    filter: revert;
  }
}

.highlight-tile__image {
  @include reservoir-image(160%, -30%);
}

.highlight-tile__info {
  position: absolute;
  z-index: 2;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  @include frosted($c-white-20, 10px);

  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  transition: 0.6s;
  opacity: 0;
}

.highlight-tile__title {
  font-size: 18px;
  font-weight: 400;
  font-family: $font-display;
  color: $c-ink;
  letter-spacing: 1px;
  opacity: 0;
  transition: $dur-hover;
  visibility: hidden;
}

.highlight-tile__desc {
  font-size: 12px;
  line-height: 160%;
  opacity: 0;
  font-weight: 300;
  color: $c-ink-60;
  visibility: hidden;
  transition: $dur-hover;
  @include line-clamp(3);
}

.highlight-tile__link {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 5px;
  color: $c-ink;
  visibility: hidden;
  opacity: 0;
  cursor: pointer;
  margin: auto 0 0;
  transition: $dur-hover;

  &::after {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    content: '';
    width: 18px;
    height: 18px;
    transition: $dur-hover;
    background: url('/icons/icon-more.svg') no-repeat 50% / contain;
  }

  &:hover {
    opacity: 0.8;

    &::after {
      transform: rotate(45deg);
    }
  }
}

// Featured tiles get roomier type and a deeper description clamp
.highlight-tile--featured {
  .highlight-tile__info {
    padding: 50px;
  }

  .highlight-tile__title {
    font-size: 24px;
  }

  .highlight-tile__desc {
    font-size: 16px;
    -webkit-line-clamp: 10;
    line-clamp: 10;
  }
}

.highlight-tile:hover {
  .highlight-tile__info {
    background: $c-white-60;
    opacity: 1;
  }

  .highlight-tile__title {
    animation: fade-in-up 1s $ease-reveal 0.5s 1 forwards;
  }

  .highlight-tile__desc {
    animation: fade-in-up 1s $ease-reveal 0.8s 1 forwards;
  }

  .highlight-tile__link {
    animation: fade-in-up 1s $ease-reveal 1.4s 1 forwards;
  }
}

@include sm-down {
  .highlight-tile__info {
    padding: 15px;
    display: none;
  }

  .highlight-tile__title {
    font-size: 16px;
  }

  .highlight-tile__desc {
    font-size: 14px;
  }

  .highlight-tile:hover .highlight-tile__info {
    background: $c-white-20;
  }
}

@include reduced-motion {
  .highlight-tile:hover {
    .highlight-tile__info {
      opacity: 1;
    }

    .highlight-tile__title,
    .highlight-tile__desc,
    .highlight-tile__link {
      animation: none;
      opacity: 1;
      visibility: visible;
      transform: none;
    }
  }
}
</style>
