<script setup lang="ts">
/**
 * Experience — three roles, each with its project set.
 *
 * The only dark→light banding change is the white section background; there are
 * no dividers other than the hairline each row carries (RECON §6, §7.4).
 *
 * On ≤768px the titling column becomes `position: sticky` near the bottom of the
 * viewport (the reference pins it at `calc(100lvh - 250px)`), and each row's
 * heading docks at `calc(100lvh - 200px)` with a white backing so the incoming
 * role replaces the outgoing one as you scroll.
 */
import { experience } from '~/data/experience'
import { education } from '~/data/education'

const titlingRef = ref<HTMLElement | null>(null)

/**
 * Education is presented as one more entry in the same timeline rather than as a
 * new band: the reference has no education section, and the CV supplies a single
 * qualification that fits the row's shape exactly. The layout is untouched.
 */
const educationRows = computed(() =>
  education.map((entry) => ({
    organisation: entry.institution,
    context: entry.context,
    period: entry.period,
    summary: [entry.result],
    projects: []
  }))
)
</script>

<template>
  <section id="experience" class="experience">
    <div class="experience__content container">
      <div ref="titlingRef" class="experience__titling">
        <SectionTitle title="Experience" />
      </div>

      <ExperienceRow v-for="role in experience" :key="role.organisation" :role="role" />

      <ExperienceRow
        v-for="entry in educationRows"
        :key="entry.organisation"
        :role="entry"
        label="Education"
      />
    </div>
  </section>
</template>

<style scoped lang="scss">
.experience {
  @include section-padding;

  background: $c-surface;
}

.experience__content {
  @include grid-split;

  position: relative;
}

.experience__titling {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-self: flex-start;
  position: relative;
  z-index: 3;
  background: $c-surface;
}

@include sm-down {
  .experience {
    position: relative;
    overflow: unset;
  }

  .experience__content {
    gap: 0;
  }

  .experience__titling {
    width: 100%;
    position: sticky;
    top: calc(100lvh - 250px);
    height: 50px;
    display: flex;
    justify-content: flex-end;
    background: transparent;

    :deep(.section-title) {
      background: $c-surface;
    }
  }
}
</style>
