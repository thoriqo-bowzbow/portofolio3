<script setup lang="ts">
/**
 * Footer.
 *
 * A full-height white panel where the pull-quote is absolutely centred in the
 * viewport, flanked by two 100px hairlines, with the blurb pinned to the top via
 * `margin-bottom: auto` and the credits row pinned to the bottom (RECON §7.8).
 *
 * On ≤768px the panel stops being 100vh, the quote returns to normal flow and the
 * flanking rules shrink — the mobile footer is a different composition.
 */
import { profile } from '~/data/profile'
</script>

<template>
  <footer class="site-footer">
    <div class="site-footer__content container">
      <p class="site-footer__text">{{ profile.footerBlurb }}</p>

      <figure class="site-footer__quote">
        <blockquote class="site-footer__quote-text">{{ profile.quote.text }}</blockquote>
        <figcaption class="site-footer__quote-author">{{ profile.quote.attribution }}</figcaption>
      </figure>

      <div class="site-footer__copyright">
        <p class="site-footer__copyright-made">{{ profile.credits.builtWith }}</p>
        <p class="site-footer__copyright-update">Updated {{ profile.credits.updated }}</p>
      </div>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.site-footer {
  background: $c-surface;
  overflow: hidden;
}

.site-footer__content {
  height: $footer-height;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  position: relative;
  padding: 100px 0 20px;
}

.site-footer__text {
  color: $c-ink-50;
  text-align: center;
  font-size: 18px;
  font-style: normal;
  font-weight: 400;
  line-height: 140%;
  margin: 0 0 auto;
  width: 600px;
}

.site-footer__quote {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 900px;
  margin: 0;
}

.site-footer__quote-text {
  color: $c-ink;
  font-size: 54px;
  font-weight: 700;
  text-align: center;
  font-family: $font-display;
  font-style: normal;
  line-height: normal;
  margin: 0;
}

.site-footer__quote-author {
  color: $c-ink-40;
  font-size: 20px;
  font-weight: 400;
  font-family: $font-display;
  font-style: normal;
  line-height: normal;
  position: relative;
  display: flex;
  align-items: center;

  &::before,
  &::after {
    content: '';
    width: 100px;
    height: 1px;
    background: $c-ink-30;
    margin: 0 20px;
    flex-shrink: 0;
  }
}

.site-footer__copyright {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 30px;
}

.site-footer__copyright-made,
.site-footer__copyright-update {
  color: $c-ink-50;
  text-align: center;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 140%;
  margin: 0;
}

@include xl-down {
  .site-footer__quote {
    width: 800px;
    margin: -50px 0 0;
  }

  .site-footer__quote-text {
    font-size: 36px;
  }
}

@include sm-down {
  .site-footer {
    box-shadow: 0 0 20px -5px rgba(37, 35, 36, 0.2);
    padding: 50px 0 0;
  }

  .site-footer__content {
    height: unset;
    min-height: 40vh;
    gap: 80px;
    padding: 0 30px;
  }

  .site-footer__text {
    width: unset;
    padding: 0 20px;
    font-size: 14px;
  }

  .site-footer__quote {
    width: unset;
    position: unset;
    height: unset;
    margin: 0;
  }

  .site-footer__quote-text {
    font-size: 24px;
    margin: 0 0 10px;
    height: unset;
    width: unset;
  }

  .site-footer__quote-author {
    font-size: 16px;

    &::before,
    &::after {
      width: 40px;
    }
  }

  .site-footer__copyright {
    flex-direction: column-reverse;
    padding: 0 0 10px;
    gap: 5px;
  }

  .site-footer__copyright-made,
  .site-footer__copyright-update {
    font-size: 10px;
  }
}
</style>
