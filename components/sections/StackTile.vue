<script setup lang="ts">
/**
 * One stack tile.
 *
 * 80×80 (65 ≤1540, 50 ≤768), dormant at `opacity .3 + grayscale(1)` until
 * revealed. On hover a white plate carrying `data-label` grows out from beneath
 * the icon to the right — the reference implements this with a `::after` sized
 * `max-width: 0 → 300%` and `padding-left: 110%`, so the label appears to slide
 * out from behind the tile (RECON §7.3).
 */
const props = defineProps<{
  name: string
  slug: string
}>()

const label = computed(() => props.name)
</script>

<template>
  <span
    class="stack-tile"
    :data-label="label"
    :title="label"
    tabindex="0"
    role="img"
    :aria-label="label"
  >
    <img
      :src="`/icons/stack/${props.slug}.svg`"
      :alt="''"
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      width="64"
      height="64"
    >
  </span>
</template>

<style scoped lang="scss">
.stack-tile {
  width: 80px;
  height: 80px;
  display: flex;
  position: relative;
  z-index: 1;
  cursor: pointer;
  transition: $dur-hover;
  opacity: 0.3;
  filter: grayscale(1);
  pointer-events: none;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    transition: $dur-hover;
  }

  // The sliding label plate
  &::after {
    position: absolute;
    content: attr(data-label);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-shrink: 0;
    overflow: hidden;
    white-space: nowrap;
    top: 0;
    left: 0;
    bottom: 0;
    max-width: 0;
    transition: $dur-hover;
    background: $c-surface;
    z-index: -1;
    box-shadow: 0 0 20px -10px rgba(0, 0, 0, 0.1);
    font-size: 14px;
    text-transform: capitalize;
    color: $c-ink;
  }

  &:hover {
    z-index: 2;

    img {
      transform: scale(1.05);
    }

    &::after {
      max-width: 300%;
      padding: 0 20px 0 110%;
    }
  }

  &:focus-visible {
    outline: 2px solid $c-focus;
    outline-offset: 4px;
  }

  &.is-inview {
    filter: revert;
    opacity: 1;
    pointer-events: all;
  }
}

@include xl-down {
  .stack-tile {
    width: 65px;
    height: 65px;
  }
}

@include sm-down {
  .stack-tile {
    width: 50px;
    height: 50px;
    flex-shrink: 0;

    img {
      width: 110%;
      height: 110%;
    }

    // No hover plate on touch
    &::after {
      content: none;
    }
  }
}
</style>
