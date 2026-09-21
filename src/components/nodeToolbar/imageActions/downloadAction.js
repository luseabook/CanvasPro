import { t } from '../../../i18n/index.js';
function toolbarText(_0x1e9f7a) {
  return t('nodeToolbar.common.' + _0x1e9f7a);
}
export function bindImageDownloadAction(_0x357927) {
  const {
      toolbarEl: _0x13cb73,
      getNodeData: _0x4eb9fe,
      getImage: _0x278f9f,
      localPathToUrl: _0x4b65d7,
      fetchRemoteBlob: _0x37ee6a,
    } = _0x357927,
    _0xf735f3 = _0x13cb73.querySelector('.act-download');
  _0xf735f3 &&
    _0xf735f3.addEventListener('click', async (_0x39b7d3) => {
      _0x39b7d3.stopPropagation();
      const _0x3934e2 = _0x4eb9fe();
      if (!_0x3934e2) {
        alert(toolbarText('nodeMissing'));
        return;
      }
      const _0x27bed0 = (_0x5ee0e0) =>
          String(_0x5ee0e0 || '')
            .trim()
            .replace(/[\\/:*?"<>|]/g, '_'),
        _0x20de64 = (_0x3d213f) => {
          const _0x230569 = String(_0x3d213f || '').trim();
          if (!_0x230569) return '';
          const _0x15f135 = _0x230569.split('#')[0].split('?')[0],
            _0x4d42e8 = _0x15f135.split('/').pop() || '';
          return _0x4d42e8;
        },
        _0x583df4 = (_0x7a3082) => {
          const _0x25f3d2 = String(_0x7a3082 || '').trim();
          if (!_0x25f3d2) return '';
          if (
            _0x25f3d2.startsWith('http://') ||
            _0x25f3d2.startsWith('https://') ||
            _0x25f3d2.startsWith('blob:') ||
            _0x25f3d2.startsWith('data:')
          )
            return _0x25f3d2;
          if (_0x25f3d2.startsWith('/')) return _0x25f3d2;
          return _0x4b65d7(_0x25f3d2) || '/' + _0x25f3d2.replace(/^\/+/, '');
        },
        _0x643fbc = (_0x237680) => {
          const _0x2e52cc = String(_0x237680 || '').trim();
          if (!_0x2e52cc) return false;
          if (_0x2e52cc.startsWith('/')) return true;
          try {
            const _0x20cdfe = new URL(_0x2e52cc, window.location.href);
            return _0x20cdfe.origin === window.location.origin;
          } catch {
            return false;
          }
        },
        _0x3ac400 = (_0x4b56f2) => {
          const _0x36958b = _0x27bed0(_0x3934e2.fileName);
          if (_0x36958b) return _0x36958b;
          const _0x40da51 = _0x27bed0(_0x20de64(_0x4b56f2));
          if (_0x40da51) return _0x40da51.includes('.') ? _0x40da51 : _0x40da51 + '.png';
          return 'image_' + Date.now() + '.png';
        },
        _0x2387b9 = (_0x4099c7, _0x4c7248) => {
          const _0x3f364f = document.createElement('a');
          ((_0x3f364f.href = _0x4099c7),
            (_0x3f364f.download = _0x4c7248),
            (_0x3f364f.rel = 'noopener'),
            document.body.appendChild(_0x3f364f),
            _0x3f364f.click(),
            _0x3f364f.remove());
        },
        _0x500b66 = _0x583df4(_0x3934e2.localPath) || (_0x643fbc(_0x3934e2.src) ? _0x3934e2.src : ''),
        _0x3729a7 =
          _0x3934e2.sourceUrl ||
          _0x3934e2.src ||
          _0x3934e2.resultUrl ||
          _0x3934e2.imageUrl ||
          _0x3934e2.thumbUrl,
        _0x401ef1 = _0x3ac400(_0x500b66 || _0x3729a7);
      if (!_0x500b66 && !_0x3729a7 && !_0x3934e2.sourceId) {
        alert(toolbarText('noDownloadableImage'));
        return;
      }
      if (_0x500b66) {
        _0x2387b9(_0x500b66, _0x401ef1);
        return;
      }
      if (_0x3934e2.sourceId)
        try {
          const _0x2bdfe3 = await _0x278f9f(_0x3934e2.sourceId);
          if (_0x2bdfe3) {
            const _0x4bce32 = window.URL.createObjectURL(_0x2bdfe3);
            (_0x2387b9(_0x4bce32, _0x401ef1), setTimeout(() => window.URL.revokeObjectURL(_0x4bce32), 0x3e8));
            return;
          }
        } catch {}
      if (!_0x3729a7) {
        alert(toolbarText('noDownloadableImage'));
        return;
      }
      if (_0x643fbc(_0x3729a7)) {
        _0x2387b9(_0x3729a7, _0x401ef1);
        return;
      }
      try {
        const _0x5861f3 = new AbortController(),
          _0x25f914 = setTimeout(() => _0x5861f3.abort(), 0x3a98),
          _0x2ecdd4 = await _0x37ee6a(_0x3729a7, { signal: _0x5861f3.signal });
        clearTimeout(_0x25f914);
        const _0x1a3542 = window.URL.createObjectURL(_0x2ecdd4);
        (_0x2387b9(_0x1a3542, _0x401ef1), setTimeout(() => window.URL.revokeObjectURL(_0x1a3542), 0x3e8));
      } catch {
        _0x2387b9(_0x3729a7, _0x401ef1);
      }
    });
}
