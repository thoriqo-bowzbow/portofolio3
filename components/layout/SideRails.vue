<script setup lang="ts">
/**
 * Hero side rails.
 *
 * Desktop: a full-height overlay pinned to the first viewport with a column of
 * social icons bottom-left and a vertically-set mail link bottom-right, each
 * terminating in a 200px hairline (RECON §7.1).
 *
 * Mobile: the same two blocks collapse into a fixed frosted bar anchored to the
 * bottom of the viewport, socials in a horizontal row at 30×30 and the mail link
 * de-rotated — a genuinely different layout, not a scaled one.
 *
 * Positioning note: the reference declares `position: sticky !important` while
 * its parent carries `height: 0`, which makes sticky resolve to the static
 * position. `absolute` is used here for the same visual result, deterministically.
 */
import { socialLinks, contactSection } from '~/data/contact'

const { railsVisible } = useScrollState()
const { goTo } = useAnchorNav()

const mailHref = computed(
  () => socialLinks.find((link) => link.href.startsWith('mailto:'))?.href ?? '#contact'
)
</script>

<template>
  <aside class="side-rails" :class="{ 'is-visible': railsVisible }" aria-label="Contact links">
    <div class="side-rails__inner container">
      <div class="side-rails__block">
        <a
          v-for="link in socialLinks"
          :key="link.label"
          class="side-rails__social"
          :href="link.href"
          :target="link.href.startsWith('http') ? '_blank' : undefined"
          :rel="link.href.startsWith('http') ? 'noopener noreferrer' : undefined"
          :aria-label="link.label"
          :title="link.label"
        >
          <img :src="link.icon" alt="" aria-hidden="true">
        </a>
      </div>

      <div class="side-rails__block">
        <a
          class="side-rails__mail"
          :href="mailHref"
          @click.prevent="goTo('#contact')"
        >{{ contactSection.railMail }}</a>
      </div>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.side-rails {
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 4;
  transition: 0.6s;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;

  &.is-visible {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }
}

.side-rails__inner {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.side-rails__block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: $c-surface;
  opacity: 0.5;
  transition: 0.6s;
  padding-bottom: 40px;

  &::after {
    display: inline-flex;
    width: 1px;
    height: 200px;
    background: $c-surface;
    content: '';
    margin: 10px 0 0;
  }
}

.side-rails__social {
  @include focus-ring(2px, $c-surface);

  width: 20px;
  height: 20px;
  display: flex;
  transition: $dur-hover;
  cursor: pointer;
  color: $c-surface;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    // Icons are authored in ink; invert them to read on the hero imagery
    filter: brightness(0) invert(1);
  }

  &:hover {
    transform: scale(1.1);
  }
}

.side-rails__mail {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  cursor: pointer;
  color: $c-surface;
  @include focus-ring(2px, $c-surface);
}

@include sm-down {
  .side-rails {
    position: fixed;
    top: 0;
    padding: 50px 0;
    pointer-events: none;
  }

  .side-rails__inner {
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    @include frosted($c-scrim-mobile, 5px);

    padding: 15px 25px;
    height: unset;
    width: unset;
    align-self: flex-end;
    margin-bottom: 60px;
    pointer-events: auto;
  }

  .side-rails__block {
    flex-direction: row;
    opacity: 1;
    padding-bottom: 0;

    &::after {
      display: none;
    }
  }

  .side-rails__mail {
    writing-mode: unset;
    text-orientation: unset;
    font-size: 14px;
  }

  .side-rails__social {
    width: 30px;
    height: 30px;
  }
}
</style>
