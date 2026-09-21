import type { Profile, LogoEntry } from './types'

/**
 * A skill mark, resolved from the same slug rule `scripts/generate-assets.mjs`
 * uses to name the files it writes, so a strip entry cannot point at a mark that
 * was never generated.
 */
const skillMark = (name: string): LogoEntry => ({
  name,
  src: `/icons/stack/${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.svg`
})

/**
 * Identity and About copy, migrated from the supplied CV.
 *
 * Every statement below is either a fact taken directly from the CV or a
 * neutral framing of one. Nothing is embellished: no metrics that are not in the
 * CV, no achievements that are not listed, no employers beyond the three, and no
 * adjectives the document does not support.
 *
 * ## Location — deliberately neutral
 *
 * The CV gives two different locations: **Jakarta Barat** in its header and
 * **Jakarta Timur** in the professional summary. Neither is silently preferred
 * here. The site presents "Jakarta, Indonesia", which is true of both readings and
 * makes no claim about which regency is current. Resolving this needs the CV
 * owner's input — see `docs/THORIQO_CONTENT_MIGRATION_REPORT.md` §5.
 */
export const profile: Profile = {
  /**
   * The hero's oversized display word. The reference renders a single given name
   * at display scale, so this is the short form of `fullName` — the same form the
   * CV's own LinkedIn and GitHub handles use.
   */
  displayName: 'Thoriqo',
  fullName: 'Thoriqo Salafu Sholihin',
  role: 'IT Support Specialist & Network Engineer',
  location: 'Jakarta, Indonesia',

  /** One-line descriptor under the About title. Kept to the CV's own role line. */
  positioning: 'IT Support Specialist & Network Engineer',

  /** Frosted card copy in the hero. A framing of the CV's stated roles only. */
  intro:
    'IT Support Specialist and Network Engineer based in Jakarta, Indonesia. I work across end-user support, network infrastructure and operational administration.',

  /**
   * Body copy is authored as short fragments, each rendered as its own <p> with
   * no margin. Consecutive fragments read as continuous prose while inking in one
   * line at a time as they cross the reveal line — the reference's signature
   * line-by-line wave.
   *
   * The CV contains no prose biography, so each fragment restates one fact from
   * it: role, employment history in reverse order, education, and languages.
   */
  bio: [
    'I am an IT Support Specialist and Network Engineer based in Jakarta, Indonesia.',

    'I work across end-user support, network infrastructure and operational administration.',

    'I worked in IT support at PT. Wahana Harta Nusantara from April to September 2026.',

    'Before that I was Network Engineer and Technical Lead at Venous Group,',
    'from June 2024 to December 2025.',

    'I started in operational administration at CV. Kahe Group,',
    'from October 2023 to June 2024.',

    'I studied IPS at SMA Negeri 1 Anjatan, graduating in May 2023',
    'with 89.14/100 in the Ujian Sekolah.',

    'I work in Indonesian and English.'
  ],

  /**
   * Logo strips interleaved between bio paragraphs, keyed by the paragraph index
   * they follow. Each mark is a CV skill, drawn from the same catalogue the stack
   * boxes use, so the two cannot drift.
   */
  logoStrips: [
    {
      afterParagraph: 1,
      logos: ['TCP/IP', 'MikroTik', 'Ruijie Reyee', 'LAN / WLAN'].map(skillMark)
    },
    {
      afterParagraph: 8,
      logos: ['Git', 'Docker', 'Linux', 'Python'].map(skillMark)
    }
  ],

  footerBlurb:
    'A conventional footer would put a sitemap, a newsletter form and four social icons here. This site has all of that above, so instead here is a line worth keeping.',

  /**
   * Attributed to its author, not presented as Thoriqo's own words — the CV
   * supplies no personal quotation. See the migration report §5.
   */
  quote: {
    text: 'Make it work, make it right, make it fast.',
    attribution: 'Kent Beck'
  },

  credits: {
    builtWith: 'Nuxt, TypeScript, SCSS, GSAP',
    updated: 'September 2026'
  }
}
