import { t } from '../../../i18n/index.js';
function toolbarText(_0x205275) {
  return t('nodeToolbar.common.' + _0x205275);
}
export function bindVideoDownloadAction(_0x3308d6) {
  const {
      toolbarEl: _0x5c4bf1,
      fetchRemoteBlob: _0x2eae66,
      _guessDownloadName: _0x53a26f,
      _triggerHrefDownload: _0x4d9e1d,
      _isProbablyLocalUrl: _0x372586,
      _getCurrentVideoUrl: _0x14d885,
    } = _0x3308d6,
    _0x148758 = _0x5c4bf1.querySelector('.act-download');
  _0x148758 &&
    _0x148758.addEventListener('click', async (_0x7507b0) => {
      _0x7507b0.stopPropagation();
      const _0x1cbcd7 = _0x14d885();
      if (!_0x1cbcd7) {
        alert(toolbarText('noDownloadableVideo'));
        return;
      }
      const _0x2cd70f = _0x53a26f(_0x1cbcd7);
      if (_0x372586(_0x1cbcd7)) {
        _0x4d9e1d(_0x1cbcd7, _0x2cd70f);
        return;
      }
      try {
        const _0x24a22a = new AbortController(),
          _0x5a3223 = setTimeout(() => _0x24a22a.abort(), 0x4e20),
          _0x460f14 = await _0x2eae66(_0x1cbcd7, { signal: _0x24a22a.signal });
        clearTimeout(_0x5a3223);
        const _0x1ee641 = window.URL.createObjectURL(_0x460f14);
        (_0x4d9e1d(_0x1ee641, _0x2cd70f), setTimeout(() => window.URL.revokeObjectURL(_0x1ee641), 0x5dc));
      } catch {
        _0x4d9e1d(_0x1cbcd7, _0x2cd70f);
      }
    });
}
