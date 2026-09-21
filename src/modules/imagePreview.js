import { getImage } from './storage.js';
import { firstNonEmpty } from '../utils/validators.js';
import {
  resolveCanvasImagePreviewUrl,
  resolveCanvasImageThumbUrl,
} from '../services/canvasMediaLocalService.js';
import { attachMediaElementPlaybackSource } from '../services/desktopMediaBlobSource.js';
export async function resolveNodeImagePreviewSource(_0x5c3d8f) {
  if (!_0x5c3d8f) return null;
  const _0x14552f = Array.isArray(_0x5c3d8f.images) ? _0x5c3d8f.images : [],
    _0x2c51ec = _0x5c3d8f.mainImageIndex || 0,
    _0x1fcf5f = _0x14552f[_0x2c51ec] || null,
    _0x13c0a5 = firstNonEmpty(_0x1fcf5f?.sourceId, _0x5c3d8f.sourceId);
  if (_0x13c0a5)
    try {
      const _0x707051 = await getImage(_0x13c0a5);
      if (_0x707051) return { url: URL.createObjectURL(_0x707051), revokeUrlOnClose: true };
    } catch (_0x1173b2) {}
  const _0x382e98 = firstNonEmpty(
    resolveCanvasImagePreviewUrl(_0x1fcf5f),
    resolveCanvasImagePreviewUrl(_0x5c3d8f),
  );
  if (_0x382e98) return { url: _0x382e98, revokeUrlOnClose: false };
  const _0x308625 = firstNonEmpty(
    resolveCanvasImageThumbUrl(_0x1fcf5f),
    resolveCanvasImageThumbUrl(_0x5c3d8f),
  );
  if (_0x308625) return { url: _0x308625, revokeUrlOnClose: false };
  return null;
}
function markSidebarSubmenuOwner(_0x29e093, _0x52752d) {
  const _0x5b1060 = String(_0x52752d || '').trim();
  if (_0x5b1060) _0x29e093.dataset.sidebarSubmenuOwner = _0x5b1060;
}
const IMAGE_PREVIEW_MIN_SCALE = 0.25,
  IMAGE_PREVIEW_MAX_SCALE = 6,
  IMAGE_PREVIEW_WHEEL_INTENSITY = 0.0015;
function clampNumber(_0x53e677, _0x1291b8, _0x4074a1) {
  const _0x3463e3 = Number(_0x53e677);
  if (!Number.isFinite(_0x3463e3)) return _0x1291b8;
  return Math.min(_0x4074a1, Math.max(_0x1291b8, _0x3463e3));
}
function stopPreviewEvent(_0x505afb) {
  (_0x505afb?.preventDefault?.(), _0x505afb?.stopPropagation?.());
}
function getOverlayCenterPoint(_0xcc10b3) {
  const _0x494dfb = _0xcc10b3.getBoundingClientRect?.();
  if (!_0x494dfb)
    return { x: (globalThis.window?.innerWidth || 0) / 2, y: (globalThis.window?.innerHeight || 0) / 2 };
  return { x: _0x494dfb.left + _0x494dfb.width / 2, y: _0x494dfb.top + _0x494dfb.height / 2 };
}
function isPointerInsideElementBounds(_0x182e4a, _0x51d93a) {
  if (!_0x182e4a || !_0x51d93a) return false;
  const _0x41bf9b = Number(_0x51d93a.clientX),
    _0x53f159 = Number(_0x51d93a.clientY);
  if (!Number.isFinite(_0x41bf9b) || !Number.isFinite(_0x53f159)) return _0x51d93a.target === _0x182e4a;
  const _0x196a8e = _0x182e4a.getBoundingClientRect?.();
  if (!_0x196a8e) return _0x51d93a.target === _0x182e4a;
  const _0x4353ee = Number(_0x196a8e.left),
    _0x1a3cf5 = Number(_0x196a8e.top),
    _0x57b86d = Number.isFinite(Number(_0x196a8e.right))
      ? Number(_0x196a8e.right)
      : _0x4353ee + Number(_0x196a8e.width || 0),
    _0xf31097 = Number.isFinite(Number(_0x196a8e.bottom))
      ? Number(_0x196a8e.bottom)
      : _0x1a3cf5 + Number(_0x196a8e.height || 0);
  if (
    !Number.isFinite(_0x4353ee) ||
    !Number.isFinite(_0x1a3cf5) ||
    !Number.isFinite(_0x57b86d) ||
    !Number.isFinite(_0xf31097) ||
    _0x57b86d <= _0x4353ee ||
    _0xf31097 <= _0x1a3cf5
  )
    return _0x51d93a.target === _0x182e4a;
  return _0x41bf9b >= _0x4353ee && _0x41bf9b <= _0x57b86d && _0x53f159 >= _0x1a3cf5 && _0x53f159 <= _0xf31097;
}
function applyImagePreviewTransform(_0x5c28c4, _0x5aca4a, _0x2fbe84) {
  (_0x5c28c4.style.setProperty('--image-preview-offset-x', Math.round(_0x2fbe84.offsetX * 100) / 100 + 'px'),
    _0x5c28c4.style.setProperty('--image-preview-offset-y', Math.round(_0x2fbe84.offsetY * 100) / 100 + 'px'),
    _0x5aca4a.style.setProperty(
      '--image-preview-scale',
      String(Math.round(_0x2fbe84.scale * 0x3e8) / 0x3e8),
    ));
}
export function openImagePreview(_0x3c37f, _0x5362d6 = {}) {
  if (!_0x3c37f) return () => {};
  const _0x2c46bf = !!_0x5362d6.revokeUrlOnClose,
    _0x2bf324 = { scale: 1, offsetX: 0, offsetY: 0 };
  let _0x35a000 = null,
    _0x4391e3 = false;
  const _0x334b04 = document.createElement('div');
  ((_0x334b04.className = 'v2-image-preview-overlay'),
    (_0x334b04.style.zIndex = '99999'),
    markSidebarSubmenuOwner(_0x334b04, _0x5362d6.sidebarSubmenuOwner));
  const _0x1f9ca1 = document.createElement('div');
  _0x1f9ca1.className = 'v2-image-preview-stage';
  const _0x5b83f7 = document.createElement('img');
  ((_0x5b83f7.className = 'v2-image-preview-media'),
    (_0x5b83f7.src = _0x3c37f),
    (_0x5b83f7.alt = _0x5362d6.alt || 'Image preview'),
    (_0x5b83f7.draggable = false),
    applyImagePreviewTransform(_0x1f9ca1, _0x5b83f7, _0x2bf324));
  const _0x4ae2cc = () => {
      (globalThis.window?.removeEventListener?.('pointermove', _0x5aede4, true),
        globalThis.window?.removeEventListener?.('pointerup', _0x2ed59a, true),
        globalThis.window?.removeEventListener?.('pointercancel', _0x2ed59a, true));
    },
    _0x32ae35 = () => {
      (_0x4ae2cc(), _0x334b04.classList.remove('is-panning'), (_0x35a000 = null));
    },
    _0x4f3003 = () => {
      if (_0x4391e3) return;
      ((_0x4391e3 = true),
        document.removeEventListener('keydown', _0x27e086, true),
        _0x32ae35(),
        _0x334b04.remove());
      if (_0x2c46bf)
        try {
          URL.revokeObjectURL(_0x3c37f);
        } catch (_0xb69672) {}
    },
    _0x27e086 = (_0x6bc085) => {
      _0x6bc085.key === 'Escape' && (_0x6bc085.preventDefault(), _0x6bc085.stopPropagation(), _0x4f3003());
    },
    _0x48f3fd = (_0x2fa321) => {
      stopPreviewEvent(_0x2fa321);
      const _0x38f928 = _0x2bf324.scale,
        _0x271ff3 = Math.exp(-Number(_0x2fa321.deltaY || 0) * IMAGE_PREVIEW_WHEEL_INTENSITY),
        _0x3c1224 = clampNumber(_0x38f928 * _0x271ff3, IMAGE_PREVIEW_MIN_SCALE, IMAGE_PREVIEW_MAX_SCALE);
      if (_0x3c1224 === _0x38f928) return;
      const _0x3fb6df = getOverlayCenterPoint(_0x334b04),
        _0x24ad5e = Number(_0x2fa321.clientX || 0) - _0x3fb6df.x,
        _0x2d9294 = Number(_0x2fa321.clientY || 0) - _0x3fb6df.y,
        _0x566119 = _0x3c1224 / _0x38f928;
      ((_0x2bf324.offsetX = _0x24ad5e - (_0x24ad5e - _0x2bf324.offsetX) * _0x566119),
        (_0x2bf324.offsetY = _0x2d9294 - (_0x2d9294 - _0x2bf324.offsetY) * _0x566119),
        (_0x2bf324.scale = _0x3c1224),
        applyImagePreviewTransform(_0x1f9ca1, _0x5b83f7, _0x2bf324));
    },
    _0x334521 = (_0x1c8ffb) => {
      if (_0x1c8ffb.button != null && _0x1c8ffb.button !== 0) return;
      if (!isPointerInsideElementBounds(_0x5b83f7, _0x1c8ffb)) return;
      (stopPreviewEvent(_0x1c8ffb),
        _0x32ae35(),
        (_0x35a000 = {
          pointerId: _0x1c8ffb.pointerId,
          startX: Number(_0x1c8ffb.clientX || 0),
          startY: Number(_0x1c8ffb.clientY || 0),
          offsetX: _0x2bf324.offsetX,
          offsetY: _0x2bf324.offsetY,
        }),
        _0x334b04.classList.add('is-panning'),
        _0x1f9ca1.setPointerCapture?.(_0x1c8ffb.pointerId),
        globalThis.window?.addEventListener?.('pointermove', _0x5aede4, true),
        globalThis.window?.addEventListener?.('pointerup', _0x2ed59a, true),
        globalThis.window?.addEventListener?.('pointercancel', _0x2ed59a, true));
    };
  function _0x5aede4(_0x2111ea) {
    if (!_0x35a000) return;
    if (
      _0x35a000.pointerId != null &&
      _0x2111ea.pointerId != null &&
      _0x2111ea.pointerId !== _0x35a000.pointerId
    )
      return;
    (stopPreviewEvent(_0x2111ea),
      (_0x2bf324.offsetX = _0x35a000.offsetX + Number(_0x2111ea.clientX || 0) - _0x35a000.startX),
      (_0x2bf324.offsetY = _0x35a000.offsetY + Number(_0x2111ea.clientY || 0) - _0x35a000.startY),
      applyImagePreviewTransform(_0x1f9ca1, _0x5b83f7, _0x2bf324));
  }
  function _0x2ed59a(_0x32f896) {
    if (!_0x35a000) return;
    if (
      _0x35a000.pointerId != null &&
      _0x32f896?.pointerId != null &&
      _0x32f896.pointerId !== _0x35a000.pointerId
    )
      return;
    stopPreviewEvent(_0x32f896);
    try {
      _0x1f9ca1.releasePointerCapture?.(_0x35a000.pointerId);
    } catch (_0x489b63) {}
    _0x32ae35();
  }
  return (
    _0x334b04.addEventListener('click', (_0x18cb19) => {
      if (isPointerInsideElementBounds(_0x5b83f7, _0x18cb19)) {
        _0x18cb19.stopPropagation();
        return;
      }
      _0x4f3003();
    }),
    _0x334b04.addEventListener('wheel', _0x48f3fd, { passive: false }),
    _0x5b83f7.addEventListener('pointerdown', _0x334521),
    _0x5b83f7.addEventListener('dragstart', stopPreviewEvent),
    _0x1f9ca1.appendChild(_0x5b83f7),
    _0x334b04.appendChild(_0x1f9ca1),
    document.addEventListener('keydown', _0x27e086, true),
    document.body.appendChild(_0x334b04),
    _0x4f3003
  );
}
export function openVideoPreview(_0x505278, _0x521688 = {}) {
  if (!_0x505278) return () => {};
  const _0x13004e = document.createElement('div');
  (markSidebarSubmenuOwner(_0x13004e, _0x521688.sidebarSubmenuOwner),
    Object.assign(_0x13004e.style, {
      position: 'fixed',
      inset: '0',
      background: 'var(--overlay-dim)',
      zIndex: '99999',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'zoom-out',
    }));
  const _0x19edf1 = document.createElement('video');
  ((_0x19edf1.controls = true),
    (_0x19edf1.autoplay = _0x521688.autoplay !== false),
    (_0x19edf1.loop = _0x521688.loop !== false),
    (_0x19edf1.muted = !!_0x521688.muted),
    void attachMediaElementPlaybackSource(_0x19edf1, _0x505278, { preload: 'auto' }).catch(() => {
      !String(_0x19edf1.getAttribute?.('src') || _0x19edf1.src || '').trim() &&
        ((_0x19edf1.src = _0x505278), _0x19edf1.load?.());
    }),
    Object.assign(_0x19edf1.style, { maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }));
  const _0x4a466f = () => {
      document.removeEventListener('keydown', _0x101256, true);
      try {
        _0x19edf1.pause();
      } catch (_0x484f3e) {}
      _0x13004e.remove();
    },
    _0x101256 = (_0x924dc0) => {
      _0x924dc0.key === 'Escape' && (_0x924dc0.preventDefault(), _0x924dc0.stopPropagation(), _0x4a466f());
    };
  (_0x13004e.addEventListener('click', (_0x122fb9) => {
    if (_0x122fb9.target === _0x13004e) _0x4a466f();
  }),
    _0x13004e.appendChild(_0x19edf1),
    document.addEventListener('keydown', _0x101256, true),
    document.body.appendChild(_0x13004e));
  try {
    const _0x363d6e = _0x19edf1.play?.();
    _0x363d6e && typeof _0x363d6e.catch === 'function' && _0x363d6e.catch(() => {});
  } catch (_0x571a44) {}
  return _0x4a466f;
}
export async function openNodeImagePreview(_0xde6749) {
  const _0x145251 = await resolveNodeImagePreviewSource(_0xde6749);
  if (!_0x145251) return () => {};
  return openImagePreview(_0x145251.url, { revokeUrlOnClose: _0x145251.revokeUrlOnClose });
}
