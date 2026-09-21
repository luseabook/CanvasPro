import { t } from '../../i18n/index.js';
export function initAppShellUi({
  store: _0x223ed4,
  initMinimap: _0x1769ee,
  minimapEl: _0x33bcfd,
  btnMinimapEl: _0x238628,
  minimapWrapperEl: _0x2301b3,
  btnToggleDotsEl: _0x2c2f86,
  applySnapGridEnabled: _0x397e88,
  readSnapGridEnabled: _0x2a056a,
  applyGridDotsPrefFromStorage: _0x50ac3a,
  showDevToast: _0x19d03e,
} = {}) {
  const _0x3c3029 = document.getElementById('canvasVersionBadge');
  if (_0x3c3029) {
    const _0x27e292 = document.querySelector('meta[name="app-version"]')?.getAttribute('content'),
      _0x3ff1bc = String(_0x27e292 || '')
        .trim()
        .replace(/^v\s*/i, '');
    _0x3c3029.textContent = _0x3ff1bc ? t('appShell.currentVersionBadge', { version: _0x3ff1bc }) : '';
  }
  _0x33bcfd && _0x1769ee?.(_0x33bcfd, _0x223ed4);
  if (_0x238628 && _0x2301b3) {
    _0x238628.addEventListener('click', () => {
      (_0x2301b3.classList.toggle('open'), _0x238628.classList.toggle('active'));
    });
    const _0x4c8adf = () => {
      const _0x281948 = Object.keys(_0x223ed4?.getState?.().nodes || {}).length > 0;
      (_0x2301b3.classList.toggle('open', _0x281948), _0x238628.classList.toggle('active', _0x281948));
    };
    setTimeout(_0x4c8adf, 150);
  }
  (_0x2c2f86 &&
    (_0x397e88?.(_0x2a056a?.(), { emitEvent: false }),
    _0x2c2f86.addEventListener('click', () => {
      const _0x4489ef = !_0x2a056a?.();
      (_0x397e88?.(_0x4489ef),
        window.showToast?.(
          _0x4489ef
            ? t('appBusinessEvents.toggles.snapGrid.on')
            : t('appBusinessEvents.toggles.snapGrid.off'),
        ));
    })),
    _0x50ac3a?.(),
    void _0x19d03e);
}
