export function renderStoryGenerationSpinner({ button: button = ![] } = {}) {
  return (
    '<span class="storyboard-script-loading-spinner' +
    (button ? ' story-action-button-spinner' : '') +
    '" aria-hidden="true"></span>'
  );
}
export function syncStoryAsyncButton(el, value, { spinnerOnly: spinnerOnly = ![] } = {}) {
  if (!el) return ![];
  const enabled = value === !![];
  (el['setAttribute']?.('aria-busy', String(enabled)),
    el['classList']?.['toggle']?.('is-story-spinner-only', enabled && spinnerOnly));
  const enabled2 = el['querySelector']?.('.story-action-button-spinner');
  if (enabled && !enabled2)
    el['insertAdjacentHTML']?.('afterbegin', renderStoryGenerationSpinner({ button: !![] }));
  else !enabled && enabled2?.['remove']?.();
  return enabled;
}
