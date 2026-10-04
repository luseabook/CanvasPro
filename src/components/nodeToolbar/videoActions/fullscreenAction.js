import { attachMediaElementPlaybackSource } from '../../../services/desktopMediaBlobSource.js';
export function bindVideoFullscreenAction(value) {
  const { toolbarEl: toolbarEl, _getCurrentVideoUrl: _getCurrentVideoUrl } = value,
    el = toolbarEl.querySelector('.act-fullscreen');
  el &&
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      const enabled = _getCurrentVideoUrl();
      if (!enabled) return;
      const el2 = document.createElement('div');
      Object.assign(el2.style, {
        position: 'fixed',
        inset: '0',
        background: 'var(--overlay-dim)',
        zIndex: '99999',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'zoom-out',
      });
      const el3 = document.createElement('video');
      ((el3.autoplay = true),
        (el3.controls = true),
        (el3.loop = true),
        void attachMediaElementPlaybackSource(el3, enabled, { preload: 'auto' }).catch(() => {
          !String(el3.getAttribute?.('src') || el3.src || '').trim() && ((el3.src = enabled), el3.load?.());
        }),
        Object.assign(el3.style, { maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }),
        el2.addEventListener('click', (event2) => {
          if (event2.target === el2) el2.remove();
        }),
        el2.appendChild(el3),
        document.body.appendChild(el2));
    });
}
