/**
 * Copy for the request modal.
 *
 * The reference's own strings were read from the live DOM and are recorded in
 * `docs/P1_MODAL_REPORT.md` for comparison; these are original, in the same voice
 * as the rest of the site's `data/` modules.
 */
export const requestModal = {
  title: 'Leave your request',
  description:
    'Tell me what you are building and roughly what you need. I read everything and reply within a couple of days.',
  fields: {
    name: { label: 'Your name', placeholder: 'Your name' },
    email: { label: 'Your email', placeholder: 'Your email' },
    message: {
      label: 'Summary of your message (min 10 words)',
      placeholder: 'Summary of your message (min 10 words)'
    }
  },
  submit: 'Send request',
  close: 'Close the request form',
  /** Mirrors the reference's "0 / 10 words minimum" hint. */
  wordHint: (count: number, minimum: number) => `${count} / ${minimum} words minimum`,
  /**
   * Shown when validation passes. There is no endpoint in this repository, so the
   * form must not claim the message was sent — see `RequestModal.vue`.
   */
  notConfigured:
    'This form is not connected to a backend yet, so nothing has been sent. Email me directly and I will reply.',
  errors: {
    name: 'Please tell me your name.',
    email: 'An email address is required.',
    emailInvalid: 'That does not look like an email address.',
    message: 'A sentence or two is plenty — at least 10 words.'
  }
} as const
