let _previewEl = null,
  _previewImgEl = null,
  _activeWrapEl = null,
  _rafId = 0,
  _hasGlobalHideHooks = false,
  _hideTimerId = 0,
  _currentSrc = '',
  _pendingSrc = '';
import { ensureThumbDecoded } from './refThumbMediaReveal.js';
function _ensurePreviewEl() {
  if (_previewEl) return _previewEl;
  const _0xdcc5cd = document.createElement('div');
  _0xdcc5cd.className = 'ref-hover-preview';
  const _0x35e0a8 = document.createElement('img');
  return (
    (_0x35e0a8.className = 'ref-hover-preview-img'),
    (_0x35e0a8.alt = ''),
    _0xdcc5cd.appendChild(_0x35e0a8),
    document.body.appendChild(_0xdcc5cd),
    (_previewEl = _0xdcc5cd),
    (_previewImgEl = _0x35e0a8),
    _0xdcc5cd
  );
}
function _hide() {
  if (_hideTimerId) clearTimeout(_hideTimerId);
  _hideTimerId = 0;
  if (_rafId) cancelAnimationFrame(_rafId);
  ((_rafId = 0), (_activeWrapEl = null), (_pendingSrc = ''));
  if (_previewEl) _previewEl.classList.remove('is-visible');
  if (_previewImgEl) _previewImgEl.classList.remove('is-pending');
}
export function hideRefThumbHoverPreview(_0x18e0f5) {
  if (_activeWrapEl && (_0x18e0f5 === _activeWrapEl || _0x18e0f5?.contains?.(_activeWrapEl))) _hide();
}
function _scheduleHide(_0x687a03 = 80) {
  if (_hideTimerId) clearTimeout(_hideTimerId);
  _hideTimerId = window.setTimeout(() => {
    ((_hideTimerId = 0), _hide());
  }, _0x687a03);
}
function _schedulePosition() {
  if (_rafId) return;
  _rafId = requestAnimationFrame(() => {
    _rafId = 0;
    if (!_activeWrapEl || !_previewEl) return;
    const _0x153279 = _activeWrapEl.getBoundingClientRect(),
      _0x473c84 = _0x153279.left + _0x153279.width / 2,
      _0x506059 = _0x153279.top - 10;
    ((_previewEl.style.left = Math.round(_0x473c84) + 'px'),
      (_previewEl.style.top = Math.round(_0x506059) + 'px'));
  });
}
function _getThumbImgSrc(_0x5dcee8) {
  const _0x31c784 = _0x5dcee8.querySelector('img.ref-thumb-media'),
    _0x56d3fd = String(_0x31c784?.getAttribute('src') || '').trim();
  return _0x56d3fd || '';
}
export function resolveRefThumbHoverPreviewUrl(_0x5a9aef) {
  const _0x4aea05 = String(_0x5a9aef?.dataset?.previewSrc || '').trim();
  if (_0x4aea05) return _0x4aea05;
  const _0x4cfe46 = String(_0x5a9aef?.dataset?.thumbSrc || '').trim();
  if (_0x4cfe46) return _0x4cfe46;
  return _getThumbImgSrc(_0x5a9aef);
}
export function _resetRefThumbHoverPreviewForTests() {
  ((_previewEl = null),
    (_previewImgEl = null),
    (_activeWrapEl = null),
    (_rafId = 0),
    (_hasGlobalHideHooks = false),
    (_hideTimerId = 0),
    (_currentSrc = ''),
    (_pendingSrc = ''));
}
function _showForWrap(_0x594c71) {
  const _0x1a7b6a = resolveRefThumbHoverPreviewUrl(_0x594c71);
  if (!_0x1a7b6a) {
    _hide();
    return;
  }
  (_ensurePreviewEl(), (_activeWrapEl = _0x594c71));
  if (_hideTimerId) clearTimeout(_hideTimerId);
  _hideTimerId = 0;
  if (_previewImgEl) {
    const _0x9a2b0a = !!_previewEl?.classList.contains('is-visible');
    if (!_0x9a2b0a)
      ((_currentSrc = _0x1a7b6a),
        (_pendingSrc = ''),
        _previewImgEl.classList.remove('is-pending'),
        (_previewImgEl.src = _0x1a7b6a),
        ensureThumbDecoded(_0x1a7b6a));
    else {
      if (!_currentSrc)
        ((_currentSrc = _0x1a7b6a),
          (_pendingSrc = ''),
          _previewImgEl.classList.remove('is-pending'),
          (_previewImgEl.src = _0x1a7b6a));
      else {
        if (_currentSrc !== _0x1a7b6a) {
          ((_currentSrc = _0x1a7b6a), (_pendingSrc = _0x1a7b6a));
          const _0xf68cd8 = _0x1a7b6a;
          (_previewImgEl.classList.add('is-pending'),
            (_previewImgEl.src = _0xf68cd8),
            ensureThumbDecoded(_0x1a7b6a).then(() => {
              if (_pendingSrc !== _0xf68cd8) return;
              if (!_previewImgEl) return;
              ((_pendingSrc = ''), _previewImgEl.classList.remove('is-pending'));
            }));
        }
      }
    }
  }
  (_previewEl.classList.add('is-visible'), _schedulePosition());
}
function _ensureGlobalHideHooks() {
  if (_hasGlobalHideHooks) return;
  ((_hasGlobalHideHooks = true),
    window.addEventListener('scroll', _hide, true),
    window.addEventListener('blur', _hide, true),
    window.addEventListener('wheel', _hide, { passive: true, capture: true }));
}
export function bindRefThumbHoverPreview(_0x20de20) {
  if (!_0x20de20) return () => {};
  _ensureGlobalHideHooks();
  const _0x411423 = (_0x2e92cd) => {
      const _0x25dcef = _0x2e92cd.target?.closest?.('.ref-thumb-wrap');
      if (!_0x25dcef || !_0x20de20.contains(_0x25dcef)) return;
      _showForWrap(_0x25dcef);
    },
    _0xe9cf1 = (_0x5ac355) => {
      const _0x16604d = _0x5ac355.target?.closest?.('.ref-thumb-wrap');
      if (!_0x16604d || !_0x20de20.contains(_0x16604d)) return;
      const _0x20c710 = _0x5ac355.relatedTarget;
      if (_0x20c710 && _0x16604d.contains(_0x20c710)) return;
      if (_0x20c710 && _0x20de20.contains(_0x20c710)) {
        _scheduleHide(80);
        return;
      }
      _hide();
    },
    _0xfd089c = () => {
      if (!_activeWrapEl) return;
      if (!_0x20de20.contains(_activeWrapEl)) {
        _hide();
        return;
      }
      _schedulePosition();
    },
    _0x4fd7eb = () => _hide();
  return (
    _0x20de20.addEventListener('pointerover', _0x411423),
    _0x20de20.addEventListener('pointerout', _0xe9cf1),
    _0x20de20.addEventListener('pointermove', _0xfd089c),
    _0x20de20.addEventListener('pointerdown', _0x4fd7eb, true),
    () => {
      (_0x20de20.removeEventListener('pointerover', _0x411423),
        _0x20de20.removeEventListener('pointerout', _0xe9cf1),
        _0x20de20.removeEventListener('pointermove', _0xfd089c),
        _0x20de20.removeEventListener('pointerdown', _0x4fd7eb, true));
    }
  );
}
