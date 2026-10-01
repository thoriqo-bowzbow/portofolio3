import type { ContactChannel, SocialLink } from './types'

/**
 * Contact channels and social links, migrated from the supplied CV.
 *
 * Every address below is one the CV states, with one exception: the CV still
 * carries an older LinkedIn handle (`in/thoriqo`), and the profile URL here is
 * the owner's current one. The previous "Writing" channel and "Photography"
 * social were removed rather than re-pointed: the CV supports neither, and
 * carrying a link to a site that does not exist is worse than carrying one fewer
 * link.
 *
 * The WhatsApp and email channels both point at the service the address is
 * actually read on — `wa.me` rather than `tel:`, and Gmail's compose link rather
 * than `mailto:` — so a click lands somewhere the message can be sent from. The
 * CV gives no Calendly URL, so that one is still not offered even though the
 * reference site has it.
 *
 * There is deliberately no contact form. The reference has one, but every channel
 * above already opens somewhere a message can be sent from, so a form would be a
 * third route to the same inbox — and the only one that cannot work at all
 * without a backend.
 */
export const contactChannels: ContactChannel[] = [
  {
    label: 'WhatsApp',
    value: '+62 851-1102-0740',
    href: 'https://wa.me/6285111020740',
    icon: '/icons/icon-whatsapp.svg',
    external: true
  },
  {
    label: 'LinkedIn',
    value: 'in/thoriqo-salafu-sholihin',
    href: 'https://www.linkedin.com/in/thoriqo-salafu-sholihin',
    icon: '/icons/icon-linkedin.svg',
    external: true
  },
  {
    label: 'Email',
    value: 'thoriqosalafusholihin@gmail.com',
    // `view=cm` is Gmail's compose mode: it opens a pre-addressed message rather
    // than the inbox, and the bare /mail/ path lets Google pick whichever
    // account the visitor is already signed into.
    href: 'https://mail.google.com/mail/?view=cm&fs=1&to=thoriqosalafusholihin@gmail.com',
    icon: '/icons/icon-gmail.svg',
    external: true
  },
  {
    label: 'GitHub',
    value: 'github.com/thoriqo-bowzbow',
    href: 'https://github.com/thoriqo-bowzbow',
    icon: '/icons/icon-github.svg',
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
    href: 'https://www.linkedin.com/in/thoriqo-salafu-sholihin',
    icon: '/icons/icon-network.svg'
  }
]

export const contactSection = {
  title: 'Get in touch',
  subtitle: 'Feel free to contact me any time',
  railMail: 'Send me mail'
} as const
