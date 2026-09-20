/**
 * Shared open state for the request modal.
 *
 * `useState` rather than a plain ref so the header (which triggers) and the modal
 * (which is mounted once in the layout) share one value without prop drilling.
 * A boolean is enough — only one modal exists, and the reference's store works
 * the same way (`openRequestModal` / `closeRequestModal` actions on a flag).
 */
export function useRequestModal() {
  const isOpen = useState('request-modal-open', () => false)

  const open = () => {
    isOpen.value = true
  }

  const close = () => {
    isOpen.value = false
  }

  return { isOpen, open, close }
}
