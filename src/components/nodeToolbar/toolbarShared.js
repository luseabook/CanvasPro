import { t } from '../../i18n/index.js';
function toolbarText(_0x101b70, _0x1be8fb = {}) {
  return t('nodeToolbar.common.' + _0x101b70, _0x1be8fb);
}
export function showDevToast(_0x14b7b1, _0x501380 = '') {
  document.querySelectorAll('.v2-dev-toast').forEach((_0x1e246c) => _0x1e246c.remove());
  const _0x45e732 = document.createElement('div');
  _0x45e732.className = 'v2-dev-toast';
  if (_0x501380) {
    const _0x24204b = document.createElement('div');
    ((_0x24204b.className = 'v2-dev-toast-icon'),
      (_0x24204b.textContent = _0x501380),
      _0x45e732.appendChild(_0x24204b));
  }
  const _0x443726 = document.createElement('span');
  ((_0x443726.className = 'v2-dev-toast-text'),
    (_0x443726.textContent = toolbarText('developmentSuffix', { text: _0x14b7b1 })),
    _0x45e732.appendChild(_0x443726),
    document.body.appendChild(_0x45e732),
    _0x45e732.offsetHeight,
    _0x45e732.classList.add('is-visible'),
    setTimeout(() => {
      (_0x45e732.classList.remove('is-visible'), setTimeout(() => _0x45e732.remove(), 0x12c));
    }, 0x7d0));
}
