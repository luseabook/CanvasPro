export function createStoryboardBackdropImage(enabled) {
  if (!enabled) return null;
  const el = document.createElement('img');
  return (
    (el.className = 'storyboard-source-backdrop'),
    el.setAttribute('src', enabled),
    el.setAttribute('aria-hidden', 'true'),
    (el.decoding = 'async'),
    (el.loading = 'eager'),
    Object.assign(el.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      objectFit: 'fill',
      opacity: '1',
      pointerEvents: 'none',
      zIndex: '0',
    }),
    el
  );
}
export function syncStoryboardBackdropImage({
  container: container,
  grid: grid,
  backdropEl: backdropEl,
  nextUrl: nextUrl,
} = {}) {
  if (!container) return backdropEl || null;
  let el2 = backdropEl || container.querySelector?.('.storyboard-source-backdrop') || null;
  if (!nextUrl) return (el2?.remove?.(), null);
  if (!el2) {
    el2 = createStoryboardBackdropImage(nextUrl);
    const value = grid && grid.parentNode === container ? grid : container.firstElementChild || null;
    typeof container.insertBefore === 'function' && value
      ? container.insertBefore(el2, value)
      : container.appendChild(el2);
  } else el2.getAttribute('src') !== nextUrl && el2.setAttribute('src', nextUrl);
  return el2;
}
