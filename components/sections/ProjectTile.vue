<script setup lang="ts">
/**
 * A single project in the experience grid.
 *
 * Dormant at `grayscale(1) opacity .2` until revealed (RECON §7.4). The mark is
 * normalised into a 120×50 box and bottom-left aligned so different marks share a
 * baseline. The link carries an 18×18 glyph that rotates 45° on hover.
 */
import type { Project } from '~/data/types'

const props = defineProps<{
  project: Project
}>()
</script>

<template>
  <article class="project-tile">
    <div class="project-tile__logo">
      <img
        :src="props.project.logo"
        :alt="`${props.project.name} mark`"
        loading="lazy"
        decoding="async"
        width="120"
        height="50"
      >
    </div>

    <h3 class="project-tile__title">{{ props.project.name }}</h3>
    <p class="project-tile__desc">{{ props.project.description }}</p>

    <a
      v-if="props.project.link"
      class="project-tile__link"
      :href="props.project.link.href"
      :target="props.project.link.external ? '_blank' : undefined"
      :rel="props.project.link.external ? 'noopener noreferrer' : undefined"
    >{{ props.project.link.label }}</a>
  </article>
</template>

<style scoped lang="scss">
.project-tile {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  filter: grayscale(1);
  opacity: 0.2;
  transition: 0.8s;

  &.is-inview {
    opacity: 1;
    filter: revert;
  }
}

.project-tile__logo {
  width: 120px;
  height: 50px;
  margin: 0 0 10px;
  opacity: 0.7;

  img {
    display: flex;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: bottom left;
  }
}

.project-tile__title {
  font-size: 22px;
  font-weight: 600;
  color: $c-ink;
  margin: 0 0 5px;
}

.project-tile__desc {
  display: flex;
  font-size: 14px;
  line-height: 150%;
  font-weight: 300;
  color: $c-ink;
}

.project-tile__link {
  @include focus-ring;

  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 5px;
  color: $c-ink;
  opacity: 0.5;
  cursor: pointer;
  margin: 15px 0 0;
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

@include sm-down {
  .project-tile__title {
    font-size: 18px;
  }

  .project-tile__desc {
    font-size: 13px;
    line-height: 140%;
  }
}
</style>
