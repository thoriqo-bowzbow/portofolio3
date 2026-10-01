<script setup lang="ts">
/**
 * Contact — the channel cards only.
 *
 * The reference also carries a message form below an `or` separator. It is not
 * reproduced: WhatsApp, Gmail compose and the address itself are each one click
 * from here, so a form would be a third route to the same inbox — and the only
 * one that cannot work without a backend. Every channel opens somewhere the
 * message can actually be sent from.
 *
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

@include xl-down {
  .contact__socials {
    grid-template-columns: repeat(2, 1fr);
  }
}

@include md-down {
  .contact__socials {
    gap: 10px;
  }
}

@include sm-down {
  .contact__content {
    gap: 20px;
  }
}

@include above($bp-sm) {
  // `section { overflow: hidden }` in the reset makes the section a scroll
  // container, which stops `position: sticky` dead. See @mixin sticky-titling.
  .contact {
    overflow: unset;
  }

  .contact__titling {
    @include sticky-titling;
  }
}
</style>
