<script setup lang="ts">
/**
 * Section heading.
 *
 * Mirrors the reference's `compTitle.vue` → `compHacktext.vue` pairing: the title
 * scrambles on scroll-enter and on hover, and is the sole heading for its
 * section.
 */
const props = withDefaults(
  defineProps<{
    title: string
    /** Rendered above the title where the design calls for an eyebrow. */
    as?: 'h2' | 'h3'
  }>(),
  { as: 'h2' }
)
</script>

<template>
  <ScrambleText
    :as="props.as"
    :label="props.title"
    class="section-title"
    :duration="50"
  />
</template>

<style scoped lang="scss">
.section-title {
  @include section-title;
}
</style>
