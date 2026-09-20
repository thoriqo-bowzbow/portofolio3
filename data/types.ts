/** Shared content contracts. Presentation components consume these only. */

export interface NavItem {
  label: string
  target: string
}

export interface LinkRef {
  label: string
  href: string
  /** Opens in a new tab when true. */
  external?: boolean
}

export interface LogoEntry {
  name: string
  src: string
}

export interface Profile {
  /** Rendered as the oversized display name in the hero. Single word works best. */
  displayName: string
  fullName: string
  role: string
  location: string
  /** One-line descriptor under the About title. */
  positioning: string
  /** Frosted card copy in the hero. */
  intro: string
  /** Body paragraphs — each entry is one line and inks in on scroll. */
  bio: string[]
  /** Logo strips interleaved between bio paragraphs, keyed by the paragraph index they follow. */
  logoStrips: Array<{ afterParagraph: number; logos: LogoEntry[] }>
  footerBlurb: string
  quote: { text: string; attribution: string }
  credits: { builtWith: string; updated: string }
}

export interface HeroStory {
  /** Two-digit numeral rendered at low opacity behind the portrait. */
  numeral: string
  title: string
  description: string
  image: string
  actions: LinkRef[]
}

export interface Project {
  name: string
  description: string
  /** Normalised 120×50 mark rendered above the name. */
  logo: string
  link?: LinkRef
}

export interface Role {
  organisation: string
  context: string
  period: string
  summary: string[]
  projects: Project[]
}

export interface Highlight {
  title: string
  description: string
  image: string
  link?: LinkRef
  /** Occupies a 2×2 cell in the mosaic. Two per set read best. */
  featured?: boolean
}

export interface StackGroup {
  title: string
  items: Array<{ name: string; slug: string }>
}

export interface Testimonial {
  name: string
  role: string
  quote: string
  portrait: string
}

export interface ContactChannel {
  label: string
  value: string
  href: string
  icon: string
  external?: boolean
}

export interface SocialLink {
  label: string
  href: string
  icon: string
}
