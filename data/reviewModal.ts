/**
 * Copy for the review modal.
 *
 * The reference exposes a second modal behind the testimonials section's "Leave
 * yours" action, distinct from the header's request modal: it collects a name,
 * an email, a position and the review itself, plus an optional photograph. The
 * strings here are written for this site rather than lifted from the reference.
 */
export const reviewModal = {
  title: 'What do you think',
  description:
    'Fill in the fields below and send your review. I read every one of them, and I welcome any feedback you would like to share.',
  close: 'Close review form',

  fields: {
    name: { label: 'Your name' },
    email: { label: 'Your email' },
    position: { label: 'Your position' },
    review: { label: 'Share your review…' }
  },

  upload: {
    label: 'Upload a photo',
    hint: 'Choose or Drop',
    ariaLabel: 'Choose a photograph to attach to your review',
    accept: 'image/*'
  },

  submit: 'Submit review',
  submitting: 'Sending',

  /**
   * The reference's hint counts words rather than characters and reads
   * "0 / 10 words minimum", so the minimum is a word count.
   */
  wordHint: (count: number, minimum: number) =>
    `${count} / ${minimum} words minimum`,

  errors: {
    name: 'Please add your name',
    email: 'Please add your email',
    emailInvalid: 'That does not look like an email address',
    position: 'Please add your position',
    review: 'Please write at least 10 words'
  },

  /** Shown after a valid submission. No endpoint ships, so nothing is claimed. */
  notConfigured:
    'Nothing was sent — this build has no review endpoint configured. Copy the text somewhere safe if you need it.'
} as const
