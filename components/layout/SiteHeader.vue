<script setup lang="ts">
/**
 * Desktop navigation bar plus the persistent black mark.
 *
 * Scroll behaviour reproduced from the reference (RECON §7.1, verified at
 * scrollY 600):
 *   - `> 100px` → wrapper becomes `position: fixed`, the 100px bar translates
 *     fully off-screen, and the 90×90 mark appears at top centre.
 *   - On ≤768px the bar is removed entirely and the mark is the header.
 *
 * The mark expands in two phases (90×90 → 90×450 → 350×450) via keyframes.
 */
import { navigation, primaryCta } from '~/data/navigation'

const { isScrolled } = useScrollState()
const { goTo } = useAnchorNav()

const isOpen = ref(false)
const isClosing = ref(false)
const root = ref<HTMLElement | null>(null)

const CLOSE_ANIMATION_MS = 2500

let closeTimer: ReturnType<typeof setTimeout> | null = null

const navigate = (target: string) => {
  close()
  goTo(target)
}

const close = () => {
  if (isClosing.value || !isOpen.value) return
  isClosing.value = true
  closeTimer = setTimeout(() => {
    isOpen.value = false
    isClosing.value = false
    closeTimer = null
  }, CLOSE_ANIMATION_MS)
}

const toggle = () => {
  if (isClosing.value) return
  if (isOpen.value) {
    close()
    return
  }
  isOpen.value = true
}

const onDocumentClick = (event: MouseEvent) => {
  const mark = root.value?.querySelector('.mobile-mark')
  if (mark && !mark.contains(event.target as Node)) close()
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') close()
}

watch(isOpen, (open) => {
  if (!import.meta.client) return
  if (open) {
    document.addEventListener('click', onDocumentClick)
    document.addEventListener('keydown', onKeydown)
  } else {
    document.removeEventListener('click', onDocumentClick)
    document.removeEventListener('keydown', onKeydown)
  }
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
  if (closeTimer) clearTimeout(closeTimer)
})
</script>

<template>
  <header ref="root" class="site-header" :class="{ 'is-scrolled': isScrolled }">
    <div class="site-header__bar container">
      <div class="site-header__logo">
        <a
          class="site-header__logo-link"
          href="#main"
          aria-label="Back to top"
          @click.prevent="goTo('#main')"
        >
          <img class="site-header__logo-image" src="/icons/logo.svg" alt="" aria-hidden="true">
        </a>
      </div>

      <nav class="site-header__links" aria-label="Primary">
        <ScrambleText
          v-for="item in navigation"
          :key="item.target"
          class="site-header__link"
          as="span"
          :label="item.label"
          tabindex="0"
          role="link"
          @click="navigate(item.target)"
          @keydown.enter.prevent="navigate(item.target)"
          @keydown.space.prevent="navigate(item.target)"
        />
      </nav>

      <div class="site-header__actions">
        <MdButton :label="primaryCta.label" @click="navigate(primaryCta.target)" />
      </div>
    </div>

    <div
      class="mobile-mark"
      :class="{ 'is-scrolled': isScrolled, 'is-open': isOpen, 'is-closing': isClosing }"
    >
      <div class="mobile-mark__content">
        <div class="mobile-mark__actions">
          <MdButton :label="primaryCta.label" @click="navigate(primaryCta.target)" />
        </div>

        <nav class="mobile-mark__links" aria-label="Primary mobile">
          <ScrambleText
            v-for="item in navigation"
            :key="`m-${item.target}`"
            class="site-header__link"
            as="span"
            :label="item.label"
            tabindex="0"
            role="link"
            @click="navigate(item.target)"
            @keydown.enter.prevent="navigate(item.target)"
            @keydown.space.prevent="navigate(item.target)"
          />
        </nav>
      </div>

      <button
        class="mobile-mark__toggle"
        type="button"
        :aria-expanded="isOpen"
        :aria-label="isOpen ? 'Close menu' : 'Open menu'"
        @click.stop="toggle"
      >
        <img class="mobile-mark__logo" src="/icons/logo.svg" alt="" aria-hidden="true">
      </button>
    </div>
  </header>
</template>

<style scoped lang="scss">
// -----------------------------------------------------------------------------
// Desktop bar
// -----------------------------------------------------------------------------
.site-header {
  position: relative;
  z-index: 9;
  width: 100%;
  height: 0;

  // Entrance lives on the wrapper, NOT the bar. A `forwards` animation outranks
  // ordinary declarations, so an animated `transform` on the bar would override
  // the scroll-hide translate below and the header would never leave the screen.
  animation: header-appear 1s $ease-reveal 1 forwards;

  &.is-scrolled {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;

    .site-header__bar {
      transform: translateY(-100%);
    }
  }
}

.site-header__bar {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform $dur-enter $ease-panel;
}

.site-header__logo {
  width: 20%;
  flex-shrink: 0;
}

.site-header__logo-link {
  @include focus-ring;

  display: flex;
  width: 80px;
  height: 80px;
  transition: 0.6s;

  &:hover {
    opacity: 0.6;
  }
}

.site-header__logo-image {
  width: 100%;
  height: 100%;
}

.site-header__links {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 50px;
}

.site-header__link {
  font-weight: 400;
  font-size: 16px;
  color: $c-surface;
}

.site-header__actions {
  width: 20%;
  height: 100%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

// -----------------------------------------------------------------------------
// Persistent black mark — appears on scroll at every width, and is the sole
// header on mobile.
// -----------------------------------------------------------------------------
.mobile-mark {
  position: fixed;
  z-index: 12;
  top: 0;
  left: calc(50% - 45px);
  width: 90px;
  height: 90px;
  min-width: 90px;
  min-height: 90px;
  background: $c-black;
  opacity: 0;
  transform: translateY(-100%);
  transition: transform 1s $ease-panel;
  pointer-events: none;

  &.is-scrolled {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }

  &.is-open {
    pointer-events: auto;
    animation: mobile-mark-open 2s $ease-reveal 1 forwards;

    .mobile-mark__toggle {
      top: auto;
      bottom: -25px;
    }

    .mobile-mark__content {
      animation: mobile-mark-content-open 1s $ease-reveal 1.5s 1 forwards;
    }
  }

  &.is-closing {
    width: 350px;
    height: 450px;
    left: calc(50% - 175px);
    pointer-events: auto;
    animation: mobile-mark-close 2s $ease-reveal 0.5s 1 forwards;

    .mobile-mark__content {
      max-width: 100%;
      padding: 30px 20px;
      animation: mobile-mark-content-close 1s $ease-reveal 1 forwards;
    }
  }
}

.mobile-mark__toggle {
  @include button-reset;

  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  transition: $dur-hover;
  width: 80px;
  height: 80px;

  &:focus-visible {
    outline: 2px solid $c-surface;
    outline-offset: -8px;
  }

  &:hover {
    opacity: 0.6;
  }
}

.mobile-mark__logo {
  width: 80px;
  height: 80px;
  object-fit: contain;
}

.mobile-mark__content {
  transition: $dur-hover;
  margin: 0 auto;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 0;
  padding: 0;
}

.mobile-mark__actions {
  display: flex;
  justify-content: center;
}

.mobile-mark__links {
  width: 220px;
  display: flex;
  flex-direction: column;
  gap: 25px;
  padding: 40px 0;
}

@include xl-down {
  .site-header__links {
    gap: 35px;
  }

  .site-header__link {
    font-size: 14px;
  }
}

@include sm-down {
  .site-header__bar {
    display: none;
  }

  .mobile-mark {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }
}

@include reduced-motion {
  .site-header {
    animation: none;
  }

  .mobile-mark,
  .mobile-mark__content,
  .mobile-mark__toggle {
    animation: none !important;
    transition: none;
  }

  .mobile-mark.is-open {
    width: 350px;
    height: 450px;
    left: calc(50% - 175px);

    .mobile-mark__toggle {
      top: auto;
      bottom: -25px;
    }

    .mobile-mark__content {
      max-width: 100%;
      padding: 30px 20px;
    }
  }
}
</style>
