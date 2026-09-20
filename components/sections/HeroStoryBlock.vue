<script setup lang="ts">
/**
 * Hero story block — one of the three narrative panels the 500vh hero scrolls
 * through.
 *
 * Composition (RECON §7.2): a large low-opacity numeral over a small greyscale
 * portrait on one side, the title + body + actions on the other. Block 2 mirrors
 * the arrangement, exactly as the reference does with `flex-direction: row` plus
 * a right-aligned info column.
 *
 * The body copy carries a frosted panel that wipes out from behind on hover and
 * flips the text to ink.
 */
import type { HeroStory } from '~/data/types'

const props = withDefaults(
  defineProps<{
    story: HeroStory
    /** `left` puts the numeral on the left; `right` mirrors it. */
    align?: 'left' | 'right'
  }>(),
  { align: 'left' }
)

const { goTo } = useAnchorNav()

const onAction = (href: string) => {
  if (href.startsWith('#')) goTo(href)
}
</script>

<template>
  <div class="hero-block" :class="`hero-block--${props.align}`">
    <div class="hero-block__content container">
      <div class="hero-block__count">
        <span class="hero-block__count-num">{{ props.story.numeral }}</span>
        <img
          class="hero-block__count-image"
          :src="props.story.image"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
        >
      </div>

      <div class="hero-block__info">
        <h2 class="hero-block__info-title">{{ props.story.title }}</h2>
        <p class="hero-block__info-desc">{{ props.story.description }}</p>
        <div class="hero-block__info-actions">
          <MdButton
            v-for="action in props.story.actions"
            :key="action.label"
            :label="action.label"
            :href="action.href.startsWith('#') ? undefined : action.href"
            :external="action.external"
            @click="onAction(action.href)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.hero-block {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 2;
}

.hero-block__content {
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  justify-content: space-between;
}

.hero-block--right .hero-block__content {
  flex-direction: row;
}

.hero-block--right .hero-block__info {
  text-align: right;
  align-items: flex-end;
}

.hero-block__count {
  width: 30%;
  height: 100%;
  opacity: 0.3;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 0 50px;
  position: relative;
}

.hero-block__count-num {
  color: $c-surface;
  text-align: right;
  font-family: $font-display;
  font-size: 242px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  position: relative;
  z-index: 2;
  // Guarantees the numeral stays legible wherever it lands on the backdrop
}

.hero-block__count-image {
  position: absolute;
  z-index: 1;
  bottom: 0;
  left: 0;
  opacity: 0.7;
  height: 300px;
  width: 250px;
  filter: grayscale(1);
  object-fit: cover;
}

.hero-block__info {
  width: 35%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.hero-block__info-title {
  color: $c-surface;
  font-family: $font-display;
  font-size: 46px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
}

.hero-block__info-desc {
  color: $c-surface;
  font-family: $font-body;
  font-size: 14px;
  font-style: normal;
  font-weight: 300;
  line-height: 180%;
  margin: 0 0 25px;
  transition: $dur-hover;
  position: relative;

  &::after {
    position: absolute;
    content: '';
    top: -20px;
    left: -30px;
    bottom: -20px;
    width: 0;
    background: $c-white-50;
    -webkit-backdrop-filter: blur(5px);
    backdrop-filter: blur(5px);
    z-index: -1;
    transition: $dur-hover;
  }

  &:hover {
    color: $c-ink;

    &::after {
      width: calc(100% + 60px);
    }
  }
}

.hero-block__info-actions {
  display: flex;
  gap: 20px;
}

@include xl-down {
  .hero-block__count-num {
    font-size: 202px;
  }

  .hero-block__info-title {
    font-size: 46px;
  }
}

@include lg-down {
  .hero-block__count-num {
    font-size: 202px;
  }
}

@include sm-down {
  .hero-block__content,
  .hero-block--right .hero-block__content {
    flex-direction: column;
    gap: 40px;
    align-items: flex-start;
    padding-top: 40px;
  }

  .hero-block__count {
    width: 200px;
    padding-bottom: 0;
    align-self: flex-start;
    justify-content: flex-start;
  }

  .hero-block__count-num {
    font-size: 80px;
    text-align: left;
  }

  .hero-block__count-image {
    width: 150px;
    height: 200px;
    left: auto;
    right: -40px;
  }

  .hero-block__info {
    width: 100%;
  }

  .hero-block--right .hero-block__info {
    text-align: left;
    align-items: flex-start;
  }

  .hero-block__info-title {
    font-size: 32px;
  }

  .hero-block__info-desc {
    padding: 30px;
    color: $c-ink;
    font-weight: 400;
    @include frosted($c-white-70, 5px);

    font-size: 14px;
    line-height: 150%;
    margin: 0 0 5px;

    &::after {
      content: none;
    }

    &:hover {
      color: $c-ink;
      pointer-events: none;
    }
  }
}
</style>
