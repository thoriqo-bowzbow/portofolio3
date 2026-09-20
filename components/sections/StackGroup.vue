<script setup lang="ts">
/**
 * A white stack box containing one labelled group of technology tiles.
 *
 * The group title starts at `opacity: .3` and rises to 1 when the box is
 * revealed (RECON §7.3).
 */
import type { StackGroup } from '~/data/types'

const props = defineProps<{
  group: StackGroup
}>()

const root = ref<HTMLElement | null>(null)
const { targets } = useRevealChildren(root, '.stack-tile', { threshold: 0.1 })
useReveal([root], { threshold: 0.1 })
</script>

<template>
  <div ref="root" class="stack-group">
    <h3 class="stack-group__title">{{ props.group.title }}</h3>
    <div class="stack-group__list">
      <StackTile
        v-for="item in props.group.items"
        :key="item.slug"
        :name="item.name"
        :slug="item.slug"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.stack-group {
  margin: 50px 0 0;
  background: $c-surface;
  box-shadow: 0 0 20px -10px rgba(0, 0, 0, 0.1);
  padding: 70px;
  width: 100%;

  &.is-inview .stack-group__title {
    opacity: 1;
  }
}

.stack-group__title {
  color: $c-ink;
  font-family: $font-display;
  font-size: 26px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  margin: 0 0 15px;
  opacity: 0.3;
  transition: 0.6s;
}

.stack-group__list {
  display: flex;
  width: 100%;
  flex-wrap: wrap;
  gap: 15px;
}

@include sm-down {
  .stack-group {
    padding: 40px 30px;
    border: 1px solid $c-ink-10;
    margin: 20px 0;
    box-shadow: none;
  }

  .stack-group__title {
    font-size: 20px;
  }

  .stack-group__list {
    gap: 5px;
  }
}
</style>
