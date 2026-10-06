export function renderStoryGenerationSpinner({ button: button = false } = {}) {
  return (
    '<span class="storyboard-script-loading-spinner' +
    (button ? ' story-action-button-spinner' : '') +
    '" aria-hidden="true"></span>'
  );
}
export function syncStoryAsyncButton(el, value, { spinnerOnly: spinnerOnly = false } = {}) {
  if (!el) return false;
  const enabled = value === true;
  (el.setAttribute?.('aria-busy', String(enabled)),
    el.classList?.toggle?.('is-story-spinner-only', enabled && spinnerOnly));
  const enabled2 = el.querySelector?.('.story-action-button-spinner');
  if (enabled && !enabled2)
    el.insertAdjacentHTML?.('afterbegin', renderStoryGenerationSpinner({ button: true }));
  else !enabled && enabled2?.remove?.();
  return enabled;
}
