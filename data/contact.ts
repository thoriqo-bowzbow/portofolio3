import type { ContactChannel, SocialLink } from './types'

export const contactChannels: ContactChannel[] = [
  {
    label: 'Phone',
    value: '+351 900 000 000',
    href: 'tel:+351900000000',
    icon: '/icons/icon-phone.svg'
  },
  {
    label: 'Message',
    value: 'Weekdays, 09:00 — 18:00 WET',
    href: '#contact-form',
    icon: '/icons/icon-chat.svg'
  },
  {
    label: 'Email',
    value: 'hello@example.com',
    href: 'mailto:hello@example.com',
    icon: '/icons/icon-mail.svg'
  },
  {
    label: 'LinkedIn',
    value: 'in/kamran-yusupov',
    href: 'https://example.com',
    icon: '/icons/icon-network.svg',
    external: true
  },
  {
    label: 'Code',
    value: 'github.com/kamran',
    href: 'https://example.com',
    icon: '/icons/icon-code.svg',
    external: true
  },
  {
    label: 'Writing',
    value: 'notes.example.com',
    href: 'https://example.com',
    icon: '/icons/icon-link.svg',
    external: true
  }
]

export const socialLinks: SocialLink[] = [
  { label: 'Code', href: 'https://example.com', icon: '/icons/icon-code.svg' },
  { label: 'Message', href: 'mailto:hello@example.com', icon: '/icons/icon-chat.svg' },
  { label: 'LinkedIn', href: 'https://example.com', icon: '/icons/icon-network.svg' },
  { label: 'Photography', href: 'https://example.com', icon: '/icons/icon-camera.svg' }
]

export const contactSection = {
  title: 'Get in touch',
  subtitle: 'Feel free to contact me any time',
  separator: 'or',
  form: {
    title: 'Send a message',
    subtitle: 'Tell me what you are building and roughly what you need. I reply to everything within a couple of days.',
    fields: {
      name: { label: 'Your name', placeholder: 'Your name' },
      email: { label: 'Your email', placeholder: 'Your email' },
      message: { label: 'Your message', placeholder: 'What are you working on?' }
    },
    submit: 'Send message',
    hint: 'All fields required'
  },
  railMail: 'Send me mail'
} as const
