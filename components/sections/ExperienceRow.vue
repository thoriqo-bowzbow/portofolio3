<script setup lang="ts">
/**
 * One role in the experience list.
 *
 * Spans both grid columns of the section and re-establishes the same 30% / auto
 * split internally, separated from its neighbours by a hairline (RECON §7.4).
 * The summary paragraphs ink in as the row is revealed.
 */
import type { Role } from '~/data/types'

const props = defineProps<{
  role: Role
  /** Optional small tag above the organisation, e.g. "Education". */
  label?: string
}>()

const root = ref<HTMLElement | null>(null)
const bodyRef = ref<HTMLElement | null>(null)

// threshold 0 on the copy so the ink-in completes before the line is readable
useRevealChildren(bodyRef, '.experience-row__summary', { threshold: 0 })
useRevealChildren(bodyRef, '.project-tile', { threshold: 0.05 })
</script>

<template>
  <div ref="root" class="experience-row">
    <div class="experience-row__title">
      <p v-if="props.label" class="experience-row__label">{{ props.label }}</p>
      <h3 class="experience-row__org">{{ props.role.organisation }}</h3>
      <p class="experience-row__context">{{ props.role.context }}</p>
      <p class="experience-row__dates">{{ props.role.period }}</p>
    </div>

    <div ref="bodyRef" class="experience-row__body">
      <p
        v-for="(line, i) in props.role.summary"
        :key="i"
        class="experience-row__summary"
      >{{ line }}</p>

      <div v-if="props.role.projects.length" class="experience-row__projects">
        <ProjectTile
          v-for="project in props.role.projects"
          :key="project.name"
          :project="project"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.experience-row {
  width: 100%;
  flex-shrink: 0;
  grid-column: 1 / 3;
  display: grid;
  grid-template-columns: $grid-split-desktop auto;
  gap: $grid-gap;
  border-bottom: 1px solid $c-ink-20;
  margin: 0 0 100px;

  &:last-child {
    border: none;
    margin: 0;
  }
}

.experience-row__title {
  align-self: flex-start;
}

// Small uppercase tag above the organisation, used to mark the education entry.
// Sized to sit under the org name's optical weight rather than compete with it.
.experience-row__label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: $c-ink-30;
  margin: 0 0 6px;
}

.experience-row__org {
  font-size: 22px;
  font-weight: 400;
  display: flex;
  color: $c-ink;
  margin: 0 0 5px;
}

.experience-row__context {
  font-size: 14px;
  font-weight: 300;
  color: $c-ink-50;
  line-height: 160%;
  width: 90%;
  margin: 0 0 25px;
}

.experience-row__dates {
  font-size: 26px;
  font-weight: 300;
  color: $c-ink-50;
}

.experience-row__summary {
  @include ink-in-text;
}

.experience-row__projects {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 50px;
  margin: 40px 0 150px;
}

@include md-down {
  .experience-row {
    grid-template-columns: $grid-split-tablet auto;
  }

  .experience-row__org {
    font-size: 18px;
  }

  .experience-row__context {
    font-size: 12px;
  }

  .experience-row__dates {
    font-size: 18px;
  }

  .experience-row__projects {
    grid-template-columns: repeat(2, 1fr);
  }
}

@include sm-down {
  .experience-row {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin: 0 0 30px;
  }

  .experience-row__org {
    font-size: 22px;
  }

  .experience-row__context {
    font-size: 16px;
    margin: 0 0 5px;
  }

  .experience-row__dates {
    font-size: 26px;
  }

  .experience-row__projects {
    gap: 10px;
    row-gap: 50px;
    margin: 40px 0;
  }
}
</style>
