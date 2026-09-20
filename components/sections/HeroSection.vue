<script setup lang="ts">
/**
 * Hero — a 500vh scroll-driven narrative.
 *
 * Layer stack, read from the live DOM (RECON §7.2):
 *
 *   z0  atmosphere        STICKY, 100vw × 100vh — pinned for the whole 500vh, so
 *                         the hero never loses its backdrop while the story
 *                         blocks scroll past
 *   z2  holder            absolute, first viewport only:
 *         ├ cut-out       absolute — the transparent foreground form
 *         ├ name          absolute, z1 — behind the cut-out, so the form crosses
 *         │               over the letters
 *         └ intro card    absolute, z3 — the frosted panel, pushed down 350px
 *   z2  story blocks ×3   absolute at 180vh / 280vh / 380vh
 *
 * The reference achieves the same split with a `position: sticky` video for the
 * atmosphere and a `position: fixed` cut-out inside the transformed section for
 * the foreground. Only the atmosphere needs to persist; the name and card belong
 * to the first viewport and scroll away with it.
 */
import { gsap } from 'gsap'
import { heroStories } from '~/data/hero'
import { profile } from '~/data/profile'

const { isReady } = useSiteReady()

const root = ref<HTMLElement | null>(null)
const wordRef = ref<HTMLElement | null>(null)
const scrollerRef = ref<HTMLElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)

/**
 * Scroll-scrubbed atmosphere. The video's `currentTime` tracks hero scroll
 * progress one-to-one; it is never played. Falls back silently to the SVG
 * backdrop under reduced motion or Save-Data.
 */
const { isActive: videoActive } = useScrubVideo(videoRef, scrollerRef, {
  src: '/media/hero-atmosphere.webm',
  srcSmall: '/media/hero-atmosphere-540.webm'
})

/**
 * Differential layer drift across the 500vh. Each layer moves at
 * `−speed / 45` px per px scrolled — see `useHeroParallax` and
 * docs/P1_HERO_PARALLAX_REPORT.md.
 */
useHeroParallax(scrollerRef)

/** Story block offsets, matching the reference's 180vh / 280vh / 380vh. */
const blockOffsets = ['180vh', '280vh', '380vh'] as const

/**
 * Entrance: the name rises into place once the loader clears. The reference
 * gates its hero choreography behind the loader flag, so this waits for the same
 * signal rather than firing on mount.
 */
onMounted(() => {
  if (!import.meta.client || !wordRef.value) return

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    gsap.set(wordRef.value, { opacity: 1, y: 0 })
    return
  }

  const play = () => {
    gsap.fromTo(
      wordRef.value,
      { opacity: 0, y: 60 },
      { opacity: 1, y: 0, duration: 1.4, ease: 'power2.out', delay: 0.15 }
    )
  }

  if (isReady.value) play()
  else watch(isReady, (ready) => ready && play(), { once: true })
})
</script>

<template>
  <section id="main" ref="root" class="hero">
    <div class="hero__content">
      <div ref="scrollerRef" class="hero__scroller">
        <!-- Pinned atmosphere: stays for the whole 500vh.
             Two stacked layers — the SVG paints immediately and remains as the
             poster/fallback, the scroll-scrubbed video fades in above it once it
             has data. Both are absolutely positioned, so neither contributes to
             layout and there is no shift when the video arrives. -->
        <div class="hero__atmosphere">
          <img
            class="hero__backdrop"
            src="/images/hero-backdrop.svg"
            alt=""
            aria-hidden="true"
            fetchpriority="high"
            decoding="async"
          >

          <video
            ref="videoRef"
            class="hero__video"
            :class="{ 'is-active': videoActive }"
            poster="/images/hero-backdrop.svg"
            muted
            playsinline
            preload="auto"
            disablepictureinpicture
            disableremoteplayback
            aria-hidden="true"
            tabindex="-1"
          />
        </div>

        <div class="hero__holder">
          <div class="hero__title">
            <h1 ref="wordRef" class="hero__title-text">
              <span class="visually-hidden">{{ profile.fullName }} — {{ profile.role }}</span>
              <span aria-hidden="true">{{ profile.displayName }}</span>
            </h1>
          </div>

          <img
            class="hero__foreground"
            src="/images/hero-foreground.svg"
            alt=""
            aria-hidden="true"
            decoding="async"
          >

          <div class="hero__desc">
            <p class="hero__desc-text">{{ profile.intro }}</p>
          </div>
        </div>

        <HeroStoryBlock
          v-for="(story, i) in heroStories"
          :key="story.numeral"
          class="hero__block"
          :style="{ top: blockOffsets[i] }"
          :story="story"
          :align="i === 1 ? 'right' : 'left'"
        />
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.hero {
  overflow: visible;
  position: relative;
}

.hero__content {
  width: 100%;
}

.hero__scroller {
  height: $hero-height;
  position: relative;
}

// -----------------------------------------------------------------------------
// Pinned atmosphere — sticky for the full 500vh so the story blocks always sit
// over imagery rather than the page background.
// -----------------------------------------------------------------------------
.hero__atmosphere {
  position: sticky;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.hero__backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

// Scroll-scrubbed atmosphere. Sits directly above the poster SVG in the same
// stacking level; fades in only once it has decoded a frame, so the poster is
// never briefly replaced by an empty box.
.hero__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.4s ease;

  &.is-active {
    opacity: 1;
  }
}

// -----------------------------------------------------------------------------
// First-viewport stack: cut-out → name → card, with the name *behind* the
// cut-out so the form crosses over the letters.
// -----------------------------------------------------------------------------
.hero__holder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 2;
  overflow: hidden;
  pointer-events: none;
}

.hero__title {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.hero__title-text {
  font-family: $font-display;
  font-size: 212px;
  font-weight: 400;
  line-height: normal;
  color: $c-surface;
  margin: -100px 0 0;
  opacity: 0;
}

.hero__foreground {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 2;
}

.hero__desc {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
}

.hero__desc-text {
  width: 650px;
  padding: 35px 40px;
  color: $c-ink;
  font-family: $font-body;
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: 180%;
  @include frosted($c-white-70, 5px);

  margin: 350px 0 0;
}

@include xl-down {
  .hero__title-text {
    font-size: 212px;
  }

  .hero__desc-text {
    font-size: 14px;
    margin: 250px 0 0;
  }
}

@include lg-down {
  .hero__title-text {
    font-size: 160px;
  }
}

@include sm-down {
  .hero__scroller {
    height: $hero-height-sm;
  }

  // Mobile uses large-viewport units for the pinned layers so the browser
  // chrome appearing or hiding does not shift the composition (RECON §10).
  .hero__atmosphere,
  .hero__holder,
  .hero__title,
  .hero__desc,
  .hero__foreground {
    height: 100lvh;
  }

  .hero__title-text {
    font-size: 90px;
    margin: -200px 0 0;
  }

  .hero__desc-text {
    width: 80%;
    font-size: 12px;
    padding: 30px 20px 30px 30px;
    background: $c-white-50;
    margin: 100px 0 0;
  }
}

@include reduced-motion {
  .hero__title-text {
    opacity: 1;
  }
}
</style>
