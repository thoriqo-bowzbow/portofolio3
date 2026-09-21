/**
 * Shared open state for the review modal.
 *
 * Mirrors `useRequestModal`: the testimonials section triggers it and the modal is
 * mounted once in the layout, so the flag lives in `useState` rather than being
 * threaded through props.
 */
export function useReviewModal() {
  const isOpen = useState('review-modal-open', () => false)

  const open = () => {
    isOpen.value = true
  }

  const close = () => {
    isOpen.value = false
  }

  return { isOpen, open, close }
}
