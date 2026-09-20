<script setup lang="ts">
/**
 * About — bio, normalised logo strips and the three stack boxes.
 *
 * Layout is the shared 30% / auto master grid (RECON §5, §7.3). Body paragraphs
 * begin at `$c-ink-20` and ink in individually as they cross the reveal line; the
 * logo strips hold `grayscale(1) opacity(.4)` until revealed and then snap to
 * full colour.
 */
import { profile } from '~/data/profile'
import { stack } from '~/data/stack'

const root = ref<HTMLElement | null>(null)
const infoRef = ref<HTMLElement | null>(null)

// threshold 0 → the reveal fires the moment a fragment touches the viewport
// edge, so the .5s ink-in completes well before the line reaches the reading
// zone. Body copy is never *read* in its dormant colour.
const { targets: paragraphs } = useRevealChildren(infoRef, '.about__paragraph', { threshold: 0 })
const { targets: strips } = useRevealChildren(infoRef, '.about__logos', { threshold: 0.2 })

/**
 * Bio paragraphs and logo strips are interleaved: a strip is emitted after the
 * paragraph index it declares, so the reading rhythm of text → proof → text is
 * data-driven rather than hand-placed in the template.
 */
type Block =
  | { kind: 'paragraph'; text: string; index: number }
  | { kind: 'logos'; logos: { name: string; src: string }[] }

const blocks = computed<Block[]>(() => {
  const out: Block[] = []
  profile.bio.forEach((text, index) => {
    out.push({ kind: 'paragraph', text, index })
    profile.logoStrips
      .filter((strip) => strip.afterParagraph === index)
      .forEach((strip) => out.push({ kind: 'logos', logos: strip.logos }))
  })
  return out
})
</script>

<template>
  <section id="about" ref="root" class="about">
    <div class="about__content container">
      <div class="about__titling">
        <h2 class="about__title">{{ profile.fullName }}</h2>
        <p class="about__subtitle">{{ profile.positioning }}</p>
      </div>

      <div ref="infoRef" class="about__info">
        <div class="about__list">
          <template v-for="(block, i) in blocks" :key="i">
            <p v-if="block.kind === 'paragraph'" class="about__paragraph">
              {{ block.text }}
            </p>
            <div v-else class="about__logos">
              <img
                v-for="logoItem in block.logos"
                :key="logoItem.name"
                :src="logoItem.src"
                :alt="logoItem.name"
                loading="lazy"
                decoding="async"
                height="60"
              >
            </div>
          </template>
        </div>

        <StackGroup v-for="group in stack" :key="group.title" :group="group" />
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.about {
  @include section-padding;
}

.about__content {
  @include grid-split;
}

.about__titling {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-self: flex-start;
}

.about__title {
  @include section-title;
  // The reference's About title is the person's name, not a section label —
  // it reads a touch larger than the other section headings at small sizes.
  max-width: 100%;
}

.about__subtitle {
  @include section-subtitle;
}

.about__info {
  flex-grow: 1;
  overflow: hidden;
}

.about__list {
  display: flex;
  flex-direction: column;
}

.about__paragraph {
  @include ink-in-text;
}

.about__logos {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 40px;
  width: 100%;
  margin: 40px 0;
  filter: grayscale(1) opacity(0.4);
  transition: 0.6s;

  img {
    height: 60px;
    width: auto;
    object-fit: contain;
  }

  &.is-inview {
    filter: revert;
  }
}

@include sm-down {
  .about__content {
    gap: 20px;
  }

  .about__titling {
    gap: 0;
    position: relative;
    width: 300px;
    max-width: calc(100% - 20px);
    margin: 0 0 20px 20px;

    // The vertical rule that appears only on mobile
    &::after {
      position: absolute;
      top: -15px;
      left: -20px;
      bottom: -15px;
      width: 1px;
      background: $c-ink;
      content: '';
    }
  }

  .about__logos {
    gap: 20px;
    margin: 30px 0;

    img {
      height: 40px;
    }
  }
}
</style>
