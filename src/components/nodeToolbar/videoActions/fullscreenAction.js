import { attachMediaElementPlaybackSource } from '../../../services/desktopMediaBlobSource.js';
export function bindVideoFullscreenAction(_0x31f274) {
  const { toolbarEl: _0x59ee7c, _getCurrentVideoUrl: _0x45aa70 } = _0x31f274,
    _0x283727 = _0x59ee7c.querySelector('.act-fullscreen');
  _0x283727 &&
    _0x283727.addEventListener('click', (_0x3487c3) => {
      _0x3487c3.stopPropagation();
      const _0x38676a = _0x45aa70();
      if (!_0x38676a) return;
      const _0x2d54c1 = document.createElement('div');
      Object.assign(_0x2d54c1.style, {
        position: 'fixed',
        inset: '0',
        background: 'var(--overlay-dim)',
        zIndex: '99999',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'zoom-out',
      });
      const _0x349b6d = document.createElement('video');
      ((_0x349b6d.autoplay = true),
        (_0x349b6d.controls = true),
        (_0x349b6d.loop = true),
        void attachMediaElementPlaybackSource(_0x349b6d, _0x38676a, { preload: 'auto' }).catch(() => {
          !String(_0x349b6d.getAttribute?.('src') || _0x349b6d.src || '').trim() &&
            ((_0x349b6d.src = _0x38676a), _0x349b6d.load?.());
        }),
        Object.assign(_0x349b6d.style, { maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }),
        _0x2d54c1.addEventListener('click', (_0x24741d) => {
          if (_0x24741d.target === _0x2d54c1) _0x2d54c1.remove();
        }),
        _0x2d54c1.appendChild(_0x349b6d),
        document.body.appendChild(_0x2d54c1));
    });
}
