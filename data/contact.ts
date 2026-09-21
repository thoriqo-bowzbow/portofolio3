import type { ContactChannel, SocialLink } from './types'

/**
 * Contact channels and social links.
 *
 * Every address here resolves to the same identity the rest of the site presents.
 * Nothing points at a placeholder host: those are indistinguishable from broken
 * links to a visitor, and a portfolio whose contact block is dead reads as
 * unfinished regardless of how the rest of it looks.
 */
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
    value: 'hello@kamran.dev',
    href: 'mailto:hello@kamran.dev',
    icon: '/icons/icon-mail.svg'
  },
  {
    label: 'LinkedIn',
    value: 'in/kamran-yusupov',
    href: 'https://www.linkedin.com/in/kamran-yusupov',
    icon: '/icons/icon-network.svg',
    external: true
  },
  {
    label: 'Code',
    value: 'github.com/kamran-yusupov',
    href: 'https://github.com/kamran-yusupov',
    icon: '/icons/icon-code.svg',
    external: true
  },
  {
    label: 'Writing',
    value: 'kamran.dev/notes',
    href: 'https://kamran.dev/notes',
    icon: '/icons/icon-link.svg',
    external: true
  }
]

export const socialLinks: SocialLink[] = [
  { label: 'Code', href: 'https://github.com/kamran-yusupov', icon: '/icons/icon-code.svg' },
  { label: 'Message', href: 'mailto:hello@kamran.dev', icon: '/icons/icon-chat.svg' },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/kamran-yusupov',
    icon: '/icons/icon-network.svg'
  },
  { label: 'Photography', href: 'https://kamran.dev/photography', icon: '/icons/icon-camera.svg' }
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
