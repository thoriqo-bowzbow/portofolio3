<script setup lang="ts">
/**
 * Contact channel card.
 *
 * Dormant at `grayscale(1)`; hovering restores colour and lifts a very soft
 * shadow. The icon is held at `opacity .5` so the label leads (RECON §7.7).
 */
import type { ContactChannel } from '~/data/types'

const props = defineProps<{
  channel: ContactChannel
}>()
</script>

<template>
  <a
    class="contact-card"
    :href="props.channel.href"
    :target="props.channel.external ? '_blank' : undefined"
    :rel="props.channel.external ? 'noopener noreferrer' : undefined"
  >
    <span class="contact-card__image">
      <img
        class="contact-card__image-file"
        :src="props.channel.icon"
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
      >
    </span>

    <span class="contact-card__details">
      <span class="contact-card__details-title">{{ props.channel.label }}</span>
      <span class="contact-card__details-desc">{{ props.channel.value }}</span>
    </span>
  </a>
</template>

<style scoped lang="scss">
.contact-card {
  @include focus-ring;

  width: 100%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 20px;
  padding: 30px;
  background: $c-surface;
  transition: $dur-hover;
  filter: grayscale(1);

  &:hover {
    filter: revert;
    box-shadow: 0 0 30px -5px rgba(37, 37, 37, 0.05);
  }
}

.contact-card__image {
  display: flex;
  width: 35px;
  height: 35px;
  flex-shrink: 0;
  opacity: 0.5;
}

.contact-card__image-file {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.contact-card__details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.contact-card__details-title {
  color: $c-ink;
  font-size: 20px;
  font-style: normal;
  font-weight: 500;
  line-height: 100%;
}

.contact-card__details-desc {
  color: $c-ink-60;
  font-size: 12px;
  font-style: normal;
  font-weight: 300;
  line-height: 160%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@include md-down {
  .contact-card {
    padding: 15px;
    gap: 10px;
  }

  .contact-card__image {
    width: 25px;
    height: 25px;
  }

  .contact-card__details-title {
    font-size: 14px;
  }
}
</style>
