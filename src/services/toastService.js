const DEFAULT_DURATION = 0xb54,
  ALERT_DURATION = 0x1388,
  ICONS = { ok: '', warn: '⚠️', error: '✕', success: '✓' };
export function showToast(_0x20ad90, _0x1d5988 = 'ok', _0x5a8d6c) {
  const _0x9863da = document.getElementById('v2-toast-wrap');
  if (!_0x9863da) {
    console.warn('[Toast]', _0x20ad90);
    return;
  }
  const _0x2d0a62 = _0x1d5988 === 'warning' ? 'warn' : _0x1d5988,
    _0x552db8 = _0x2d0a62 === 'error' || _0x2d0a62 === 'warn',
    _0x6b5a6d = _0x552db8 ? ALERT_DURATION : DEFAULT_DURATION,
    _0x4ef428 = Number.isFinite(Number(_0x5a8d6c)) ? Math.max(0, Number(_0x5a8d6c)) : _0x6b5a6d,
    _0xd016d = _0x552db8 ? Math.max(ALERT_DURATION, _0x4ef428) : _0x4ef428,
    _0x308845 = ICONS[_0x2d0a62] ?? '',
    _0x55fffc = document.createElement('div');
  _0x55fffc.className = 'v2-toast' + (_0x2d0a62 !== 'ok' ? ' ' + _0x2d0a62 : '');
  _0xd016d > DEFAULT_DURATION && !_0x552db8 && _0x55fffc.classList.add('is-long');
  if (_0x308845) {
    const _0x124f90 = document.createElement('span');
    ((_0x124f90.className = 'v2-toast-icon'),
      (_0x124f90.textContent = _0x308845),
      _0x55fffc.appendChild(_0x124f90));
  }
  const _0x31ec96 = document.createElement('span');
  const message = String(_0x20ad90 ?? '').replace(/\s+/g, ' ').trim();
  ((_0x31ec96.textContent = message.length > 320 ? message.slice(0, 319) + '…' : message),
    _0x55fffc.appendChild(_0x31ec96),
    _0x9863da.appendChild(_0x55fffc),
    setTimeout(() => {
      _0x55fffc.remove();
    }, _0xd016d));
}
export function showSuccess(_0x513817, _0x5b51dc) {
  showToast(_0x513817, 'success', _0x5b51dc);
}
export function showError(_0x167962, _0x5c1397) {
  showToast(_0x167962, 'error', _0x5c1397);
}
export function showWarning(_0xb5e53f, _0x1b2efa) {
  showToast(_0xb5e53f, 'warn', _0x1b2efa);
}
export function initToastService() {
  ((window.showToast = showToast),
    (window.showSuccess = showSuccess),
    (window.showError = showError),
    (window.showWarning = showWarning));
}
