import type { ContactChannel, SocialLink } from './types'

/**
 * Contact channels and social links, migrated from the supplied CV.
 *
 * Every address below is one the CV states. The previous "Writing" channel and
 * "Photography" social were removed rather than re-pointed: the CV supports
 * neither, and carrying a link to a site that does not exist is worse than
 * carrying one fewer link.
 *
 * The CV gives no WhatsApp or Calendly URL, so neither is offered here even though
 * the reference site has both.
 */
export const contactChannels: ContactChannel[] = [
  {
    label: 'Phone',
    value: '+62 851-1102-0740',
    href: 'tel:+6285111020740',
    icon: '/icons/icon-phone.svg'
  },
  {
    label: 'Message',
    value: 'Weekdays, 09:00 — 18:00 WIB',
    href: '#contact-form',
    icon: '/icons/icon-chat.svg'
  },
  {
    label: 'Email',
    value: 'thoriqosalafusholihin@gmail.com',
    href: 'mailto:thoriqosalafusholihin@gmail.com',
    icon: '/icons/icon-mail.svg'
  },
  {
    label: 'LinkedIn',
    value: 'in/thoriqo',
    href: 'https://www.linkedin.com/in/thoriqo',
    icon: '/icons/icon-network.svg',
    external: true
  },
  {
    label: 'Code',
    value: 'github.com/thoriqo-bowzbow',
    href: 'https://github.com/thoriqo-bowzbow',
    icon: '/icons/icon-code.svg',
    external: true
  }
]

/**
 * The side-rail socials. Three rather than the reference's four: the CV supports
 * a code host, a mail address and a professional profile, and nothing else.
 */
export const socialLinks: SocialLink[] = [
  { label: 'Code', href: 'https://github.com/thoriqo-bowzbow', icon: '/icons/icon-code.svg' },
  {
    label: 'Message',
    href: 'mailto:thoriqosalafusholihin@gmail.com',
    icon: '/icons/icon-chat.svg'
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/thoriqo',
    icon: '/icons/icon-network.svg'
  }
]

export const contactSection = {
  title: 'Get in touch',
  subtitle: 'Feel free to contact me any time',
  separator: 'or',
  form: {
    title: 'Send a message',
    subtitle: 'Tell me what you need and roughly when. I reply to everything within a couple of days.',
    fields: {
      name: { label: 'Your name', placeholder: 'Your name' },
      email: { label: 'Your email', placeholder: 'Your email' },
      message: { label: 'Your message', placeholder: 'What do you need?' }
    },
    submit: 'Send message',
    hint: 'All fields required'
  },
  railMail: 'Send me mail'
} as const
