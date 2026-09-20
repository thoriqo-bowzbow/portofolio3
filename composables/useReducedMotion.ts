/**
 * Reactive `prefers-reduced-motion` flag.
 *
 * The reference has no reduced-motion handling at all (RECON §9.8); this is a
 * deliberate addition. Every motion composable consults it.
 */
export function useReducedMotion() {
  const reduced = ref(false)

  if (import.meta.client) {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduced.value = mql.matches
    const onChange = (e: MediaQueryListEvent) => {
      reduced.value = e.matches
    }
    onMounted(() => mql.addEventListener('change', onChange))
    onBeforeUnmount(() => mql.removeEventListener('change', onChange))
  }

  return reduced
}
