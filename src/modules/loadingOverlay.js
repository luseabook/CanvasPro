const pendingLoadings = new WeakMap();
function normalizeVariant(options = {}) {
  return options && options.variant === 'static' ? 'static' : 'full';
}
function applyLoadingVariant(el, value) {
  (el.classList.add('img-preview-loading'),
    value === 'static'
      ? el.classList.add('img-preview-loading--static')
      : el.classList.remove('img-preview-loading--static'));
}
export function startLoading(el2, item = {}) {
  if (!el2) return;
  const variant = normalizeVariant(item),
    key = pendingLoadings.get(el2);
  if (key) {
    key.variant = variant;
    return;
  }
  if (el2.classList?.contains?.('img-preview-loading') || el2.querySelector?.('.img-loading-overlay')) {
    applyLoadingVariant(el2, variant);
    return;
  }
  const index = { variant: variant };
  (pendingLoadings.set(el2, index),
    setTimeout(() => {
      if (pendingLoadings.get(el2) !== index) return;
      if (el2.querySelector('.img-loading-overlay')) return;
      applyLoadingVariant(el2, index.variant);
      const el3 = document.createElement('div');
      el3.className = 'img-loading-overlay';
      if (index.variant !== 'static') {
        const result = document.createElement('div');
        ((result.className = 'img-loading-shimmer'), el3.appendChild(result));
      }
      el2.appendChild(el3);
    }, 50));
}
export function stopLoading(el4) {
  if (!el4) return;
  (pendingLoadings.delete(el4),
    el4.classList.remove('img-preview-loading'),
    el4.classList.remove('img-preview-loading--static'),
    el4.querySelectorAll('.img-loading-overlay').forEach((el5) => el5.remove()));
}
