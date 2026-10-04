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
  const el = document.createElement('div');
  el.className = 'ref-hover-preview';
  const value = document.createElement('img');
  return (
    (value.className = 'ref-hover-preview-img'),
    (value.alt = ''),
    el.appendChild(value),
    document.body.appendChild(el),
    (_previewEl = el),
    (_previewImgEl = value),
    el
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
export function hideRefThumbHoverPreview(item) {
  if (_activeWrapEl && (item === _activeWrapEl || item?.contains?.(_activeWrapEl))) _hide();
}
function _scheduleHide(key = 80) {
  if (_hideTimerId) clearTimeout(_hideTimerId);
  _hideTimerId = window.setTimeout(() => {
    ((_hideTimerId = 0), _hide());
  }, key);
}
function _schedulePosition() {
  if (_rafId) return;
  _rafId = requestAnimationFrame(() => {
    _rafId = 0;
    if (!_activeWrapEl || !_previewEl) return;
    const box = _activeWrapEl.getBoundingClientRect(),
      index = box.left + box.width / 2,
      result = box.top - 10;
    ((_previewEl.style.left = Math.round(index) + 'px'), (_previewEl.style.top = Math.round(result) + 'px'));
  });
}
function _getThumbImgSrc(el2) {
  const data = el2.querySelector('img.ref-thumb-media'),
    options = String(data?.getAttribute('src') || '').trim();
  return options || '';
}
export function resolveRefThumbHoverPreviewUrl(el3) {
  const target = String(el3?.dataset?.previewSrc || '').trim();
  if (target) return target;
  const source = String(el3?.dataset?.thumbSrc || '').trim();
  if (source) return source;
  return _getThumbImgSrc(el3);
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
function _showForWrap(next) {
  const refThumbHoverPreviewUrl = resolveRefThumbHoverPreviewUrl(next);
  if (!refThumbHoverPreviewUrl) {
    _hide();
    return;
  }
  (_ensurePreviewEl(), (_activeWrapEl = next));
  if (_hideTimerId) clearTimeout(_hideTimerId);
  _hideTimerId = 0;
  if (_previewImgEl) {
    const enabled = !!_previewEl?.classList.contains('is-visible');
    if (!enabled)
      ((_currentSrc = refThumbHoverPreviewUrl),
        (_pendingSrc = ''),
        _previewImgEl.classList.remove('is-pending'),
        (_previewImgEl.src = refThumbHoverPreviewUrl),
        ensureThumbDecoded(refThumbHoverPreviewUrl));
    else {
      if (!_currentSrc)
        ((_currentSrc = refThumbHoverPreviewUrl),
          (_pendingSrc = ''),
          _previewImgEl.classList.remove('is-pending'),
          (_previewImgEl.src = refThumbHoverPreviewUrl));
      else {
        if (_currentSrc !== refThumbHoverPreviewUrl) {
          ((_currentSrc = refThumbHoverPreviewUrl), (_pendingSrc = refThumbHoverPreviewUrl));
          const current = refThumbHoverPreviewUrl;
          (_previewImgEl.classList.add('is-pending'),
            (_previewImgEl.src = current),
            ensureThumbDecoded(refThumbHoverPreviewUrl).then(() => {
              if (_pendingSrc !== current) return;
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
export function bindRefThumbHoverPreview(el4) {
  if (!el4) return () => {};
  _ensureGlobalHideHooks();
  const entry = (event) => {
      const enabled2 = event.target?.closest?.('.ref-thumb-wrap');
      if (!enabled2 || !el4.contains(enabled2)) return;
      _showForWrap(enabled2);
    },
    record = (event2) => {
      const enabled3 = event2.target?.closest?.('.ref-thumb-wrap');
      if (!enabled3 || !el4.contains(enabled3)) return;
      const payload = event2.relatedTarget;
      if (payload && enabled3.contains(payload)) return;
      if (payload && el4.contains(payload)) {
        _scheduleHide(80);
        return;
      }
      _hide();
    },
    handle = () => {
      if (!_activeWrapEl) return;
      if (!el4.contains(_activeWrapEl)) {
        _hide();
        return;
      }
      _schedulePosition();
    },
    state = () => _hide();
  return (
    el4.addEventListener('pointerover', entry),
    el4.addEventListener('pointerout', record),
    el4.addEventListener('pointermove', handle),
    el4.addEventListener('pointerdown', state, true),
    () => {
      (el4.removeEventListener('pointerover', entry),
        el4.removeEventListener('pointerout', record),
        el4.removeEventListener('pointermove', handle),
        el4.removeEventListener('pointerdown', state, true));
    }
  );
}
