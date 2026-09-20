/**
 * Shared site-readiness flag.
 *
 * Coordinates the loader curtain with the hero entrance so the two do not
 * overlap. The reference keeps its curtain behind an `isSiteLoading` data flag
 * whose resolution logic lives in code that was not retrievable (RECON §12.6);
 * this is a defined equivalent — the curtain clears once the window has loaded
 * *and* a minimum display time has elapsed, so the choreography never flashes.
 */
export function useSiteReady() {
  const isReady = useState('site-ready', () => false)
  const isLoaderVisible = useState('site-loader-visible', () => true)
  return { isReady, isLoaderVisible }
}
