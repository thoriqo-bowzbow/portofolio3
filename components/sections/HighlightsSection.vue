<script setup lang="ts">
/**
 * Highlights — a four-column mosaic.
 *
 * `grid-auto-rows: 170px` (120px ≤992) with a 10px gap; tiles marked `featured`
 * span 2×2, which is how the reference resolves the grid (RECON §7.5). On
 * ≤768px the mosaic re-flows to three columns, tiles 5 and 7 become featured, the
 * last tile is dropped and the hover overlay is removed.
 */
import { highlights } from '~/data/projects'

const gridRef = ref<HTMLElement | null>(null)
useRevealChildren(gridRef, '.highlight-tile', { threshold: 0.08 })
</script>

<template>
  <section id="projects" class="highlights">
    <div class="highlights__content container">
      <div class="highlights__titling">
        <SectionTitle title="Selected work" />
        <!--
          The previous subtitle described booking platforms and internal consoles,
          which were the demo identity's invented products. The CV lists no
          projects, so the copy now describes what the section will hold rather
          than claiming work that is not there.
        -->
        <p class="highlights__subtitle">
          Case studies are added here as they are cleared for publication.
        </p>
      </div>

      <div v-if="highlights.length" ref="gridRef" class="highlights__grid">
        <HighlightTile v-for="item in highlights" :key="item.title" :item="item" />
      </div>

      <!--
        Empty state. The CV lists no projects and this repository must not invent
        any, so rather than leave a collapsed grid the section says so plainly.
        The mosaic markup above is untouched for when real entries arrive.
      -->
      <p v-else class="highlights__empty">
        No case studies published yet.
      </p>
    </div>
  </section>
</template>

<style scoped lang="scss">
.highlights {
  @include section-padding;
}

.highlights__content {
  @include grid-split;

  position: relative;
}

.highlights__titling {
  align-self: flex-start;
}

.highlights__subtitle {
  @include section-subtitle;
}

.highlights__grid {
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 170px;
  gap: 10px;
  width: 100%;
  overflow: hidden;
}

// Empty state: occupies the grid's place in the split so the section keeps its
// two-column shape instead of collapsing to a bare heading.
.highlights__empty {
  font-size: 14px;
  font-weight: 300;
  line-height: 160%;
  color: $c-ink-50;
  margin: 0;
}

@include md-down {
  .highlights__grid {
    grid-auto-rows: 120px;
  }
}

@include sm-down {
  .highlights__content {
    gap: 20px;
  }

  .highlights__grid {
    grid-template-columns: repeat(3, 1fr);
  }

  // Reference keeps 1, 5 and 7 as the double-width cells on mobile
  .highlights__grid :deep(.highlight-tile:nth-child(1)),
  .highlights__grid :deep(.highlight-tile:nth-child(5)),
  .highlights__grid :deep(.highlight-tile:nth-child(7)) {
    grid-column: span 2;
    grid-row: span 2;
  }

  .highlights__grid :deep(.highlight-tile:last-child) {
    display: none;
  }
}
</style>
