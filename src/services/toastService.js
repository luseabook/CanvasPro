const DEFAULT_DURATION = 0xb54,
  ALERT_DURATION = 0x1388,
  ICONS = { ok: '', warn: '⚠️', error: '✕', success: '✓' };
export function showToast(value, item = 'ok', key) {
  const el = document.getElementById('v2-toast-wrap');
  if (!el) {
    console.warn('[Toast]', value);
    return;
  }
  const index = item === 'warning' ? 'warn' : item,
    enabled = index === 'error' || index === 'warn',
    result = enabled ? ALERT_DURATION : DEFAULT_DURATION,
    data = Number.isFinite(Number(key)) ? Math.max(0, Number(key)) : result,
    options = enabled ? Math.max(ALERT_DURATION, data) : data,
    target = ICONS[index] ?? '',
    el2 = document.createElement('div');
  el2.className = 'v2-toast' + (index !== 'ok' ? ' ' + index : '');
  options > DEFAULT_DURATION && !enabled && el2.classList.add('is-long');
  if (target) {
    const el3 = document.createElement('span');
    ((el3.className = 'v2-toast-icon'), (el3.textContent = target), el2.appendChild(el3));
  }
  const el4 = document.createElement('span');
  const message = String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  ((el4.textContent = message.length > 320 ? message.slice(0, 319) + '…' : message),
    el2.appendChild(el4),
    el.appendChild(el2),
    setTimeout(() => {
      el2.remove();
    }, options));
}
export function showSuccess(source, next) {
  showToast(source, 'success', next);
}
export function showError(current, entry) {
  showToast(current, 'error', entry);
}
export function showWarning(record, payload) {
  showToast(record, 'warn', payload);
}
export function initToastService() {
  ((window.showToast = showToast),
    (window.showSuccess = showSuccess),
    (window.showError = showError),
    (window.showWarning = showWarning));
}
