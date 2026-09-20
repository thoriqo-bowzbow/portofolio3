<script setup lang="ts">
/**
 * Contact — channel cards, an `or` separator flanked by hairlines, and the form.
 * Section background stays `#fafafa` against the white testimonials band above
 * (RECON §6, §7.7).
 */
import { contactChannels, contactSection } from '~/data/contact'

const socialsRef = ref<HTMLElement | null>(null)
useRevealChildren(socialsRef, '.contact-card', { threshold: 0.05 })
</script>

<template>
  <section id="contact" class="contact">
    <div class="contact__content container">
      <div class="contact__titling">
        <SectionTitle :title="contactSection.title" />
        <p class="contact__subtitle">{{ contactSection.subtitle }}</p>
      </div>

      <div class="contact__info">
        <div ref="socialsRef" class="contact__socials">
          <ContactCard
            v-for="channel in contactChannels"
            :key="channel.label"
            :channel="channel"
          />
        </div>

        <p class="contact__separator">{{ contactSection.separator }}</p>

        <ContactForm />
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.contact {
  @include section-padding;
}

.contact__content {
  @include grid-split;

  position: relative;
}

.contact__titling {
  align-self: flex-start;
}

// The reference sets this heading at weight 500 rather than 400
.contact__titling :deep(.section-title) {
  font-weight: 500;
}

.contact__subtitle {
  @include section-subtitle(160%);
}

.contact__info {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.contact__socials {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  width: 100%;
}

.contact__separator {
  color: $c-ink;
  font-family: $font-display;
  font-size: 26px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;

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

@include xl-down {
  .contact__socials {
    grid-template-columns: repeat(2, 1fr);
  }
}

@include md-down {
  .contact__socials {
    gap: 10px;
  }

  .contact__separator {
    font-size: 22px;
  }
}

@include sm-down {
  .contact__content {
    gap: 20px;
  }
}
</style>
