import { buildSourceMediaNodePayload } from '../../services/fileService.js';
import { buildCanvasLocalImageFields } from '../../services/canvasMediaLocalService.js';
import { generateId, screenToWorld } from '../../core/math.js';
import { t } from '../../i18n/index.js';
export const RESULT_IMAGE_DRAG_OUT_THRESHOLD_PX = 6;
function asObject(_0x59787d) {
  return _0x59787d && typeof _0x59787d === 'object' && !Array.isArray(_0x59787d) ? _0x59787d : null;
}
function firstNonEmptyString(..._0x2bfb32) {
  for (const _0x50fca5 of _0x2bfb32) {
    const _0x1becaf = String(_0x50fca5 || '').trim();
    if (_0x1becaf) return _0x1becaf;
  }
  return '';
}
function toPositiveInt(_0x849518) {
  const _0x14417a = Number(_0x849518);
  if (!Number.isFinite(_0x14417a) || _0x14417a <= 0) return 0;
  return Math.max(1, Math.round(_0x14417a));
}
function pickImageWidth(_0xc8337b) {
  return (
    toPositiveInt(_0xc8337b?.originalWidth) ||
    toPositiveInt(_0xc8337b?.imageWidth) ||
    toPositiveInt(_0xc8337b?.width) ||
    toPositiveInt(_0xc8337b?.metadata?.width)
  );
}
function pickImageHeight(_0x575287) {
  return (
    toPositiveInt(_0x575287?.originalHeight) ||
    toPositiveInt(_0x575287?.imageHeight) ||
    toPositiveInt(_0x575287?.height) ||
    toPositiveInt(_0x575287?.metadata?.height)
  );
}
function pickFallbackSize({ fallbackWidth: fallbackWidth = 0, fallbackHeight: fallbackHeight = 0 } = {}) {
  const _0x400954 = toPositiveInt(fallbackWidth),
    _0x251ff8 = toPositiveInt(fallbackHeight);
  return _0x400954 > 0 && _0x251ff8 > 0 ? { width: _0x400954, height: _0x251ff8 } : null;
}
function fileNameFromPath(_0x5179e5) {
  const _0x4c7ce3 = String(_0x5179e5 || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');
  if (!_0x4c7ce3) return '';
  const _0x4f3e1c = _0x4c7ce3.split('/');
  return String(_0x4f3e1c[_0x4f3e1c.length - 1] || '').trim();
}
export function normalizeResultImageForDragOut(_0x4ff4c9) {
  const _0x5d091a = asObject(_0x4ff4c9);
  if (!_0x5d091a || firstNonEmptyString(_0x5d091a.error)) return null;
  const _0x2d8a08 = buildCanvasLocalImageFields(_0x5d091a, { includeSrc: true }),
    _0x130d1f = firstNonEmptyString(
      _0x2d8a08.src,
      _0x2d8a08.imageUrl,
      _0x2d8a08.sourceUrl,
      _0x2d8a08.thumbUrl,
      _0x2d8a08.localPath,
      _0x2d8a08.originalLocalPath,
      _0x2d8a08.displayLocalPath,
      _0x2d8a08.thumbLocalPath,
    );
  if (!_0x130d1f) return null;
  const _0x120b33 = pickImageWidth(_0x5d091a),
    _0x8ace94 = pickImageHeight(_0x5d091a),
    _0x1554a1 = firstNonEmptyString(
      _0x5d091a.fileName,
      fileNameFromPath(_0x2d8a08.localPath),
      fileNameFromPath(_0x2d8a08.originalLocalPath),
      fileNameFromPath(_0x2d8a08.displayLocalPath),
    );
  return {
    ..._0x2d8a08,
    ...(_0x120b33 > 0 ? { imageWidth: _0x120b33, originalWidth: _0x120b33 } : {}),
    ...(_0x8ace94 > 0 ? { imageHeight: _0x8ace94, originalHeight: _0x8ace94 } : {}),
    ...(_0x1554a1 ? { fileName: _0x1554a1 } : {}),
  };
}
export function hasUsableResultImageForDragOut(_0x13ede3) {
  return !!normalizeResultImageForDragOut(_0x13ede3);
}
export function buildResultImageDragOutNodePayload({
  image: _0xf43da4,
  viewport: viewport = { x: 0, y: 0, zoom: 1 },
  screenX: screenX = 0,
  screenY: screenY = 0,
  fallbackWidth: fallbackWidth = 0,
  fallbackHeight: fallbackHeight = 0,
  id: id = '',
  createId: createId = () => generateId('source-image'),
  name: name = '',
} = {}) {
  const _0x1dc07a = normalizeResultImageForDragOut(_0xf43da4);
  if (!_0x1dc07a) return null;
  const _0x4a215c = String(id || '').trim() || createId(),
    _0x2782df = toPositiveInt(_0x1dc07a.imageWidth),
    _0x455340 = toPositiveInt(_0x1dc07a.imageHeight),
    _0x1d864d = pickFallbackSize({ fallbackWidth: fallbackWidth, fallbackHeight: fallbackHeight }),
    _0x5e4354 = screenToWorld(screenX, screenY, viewport || { x: 0, y: 0, zoom: 1 }),
    _0x261db4 =
      _0x2782df > 0 && _0x455340 > 0
        ? { naturalWidth: _0x2782df, naturalHeight: _0x455340, needsAutoResize: false }
        : _0x1d864d
          ? {
              width: _0x1d864d.width,
              height: _0x1d864d.height,
              fixedSize: true,
              needsAutoResize: false,
              useExplicitSizeAsSource: true,
            }
          : { needsAutoResize: true },
    _0x135cf9 = buildSourceMediaNodePayload({
      ..._0x1dc07a,
      ..._0x261db4,
      id: _0x4a215c,
      type: 'source-image',
      x: 0,
      y: 0,
      name: firstNonEmptyString(name, _0x1dc07a.fileName, t('aigenImage.result.imageFallbackName')),
      src: _0x1dc07a.src || _0x1dc07a.imageUrl || _0x1dc07a.sourceUrl || '',
    });
  return {
    ..._0x135cf9,
    x: _0x5e4354.x - (_0x135cf9.width || 0) / 2,
    y: _0x5e4354.y - (_0x135cf9.height || 0) / 2,
  };
}
function getEventClientPoint(_0x4d3aac) {
  return {
    x: Number.isFinite(Number(_0x4d3aac?.clientX)) ? Number(_0x4d3aac.clientX) : 0,
    y: Number.isFinite(Number(_0x4d3aac?.clientY)) ? Number(_0x4d3aac.clientY) : 0,
  };
}
function getElementSize(_0x13e204) {
  const _0x17ba9a =
    _0x13e204 && typeof _0x13e204.getBoundingClientRect === 'function'
      ? _0x13e204.getBoundingClientRect()
      : null;
  return {
    width: toPositiveInt(_0x17ba9a?.width) || toPositiveInt(_0x13e204?.offsetWidth),
    height: toPositiveInt(_0x17ba9a?.height) || toPositiveInt(_0x13e204?.offsetHeight),
  };
}
function resolveOption(_0xc8fe7f, ..._0x209271) {
  return typeof _0xc8fe7f === 'function' ? _0xc8fe7f(..._0x209271) : _0xc8fe7f;
}
function removeGhost(_0x3b328e) {
  if (!_0x3b328e) return;
  (_0x3b328e.style &&
    ((_0x3b328e.style.transition = 'opacity 0.16s cubic-bezier(0.4, 0, 0.2, 1)'),
    (_0x3b328e.style.opacity = '0')),
    setTimeout(() => _0x3b328e.remove?.(), 160));
}
export function createResultImageDragGhost({
  sourceEl: sourceEl = null,
  fallbackSrc: fallbackSrc = '',
  width: width = 0,
  height: height = 0,
  documentRef: documentRef = globalThis.document,
} = {}) {
  if (!documentRef?.createElement) return null;
  const _0x446dc7 = Math.max(1, toPositiveInt(width) || 120),
    _0x1e0cc6 = Math.max(1, toPositiveInt(height) || 120),
    _0xeafabc = documentRef.createElement('div');
  ((_0xeafabc.className = 'v2-ghost-image result-image-drag-ghost'),
    Object.assign(_0xeafabc.style, { width: _0x446dc7 + 'px', height: _0x1e0cc6 + 'px' }));
  const _0x66eba0 = documentRef.createElement('img'),
    _0x39c6b9 = firstNonEmptyString(sourceEl?.currentSrc, sourceEl?.src, fallbackSrc);
  if (_0x39c6b9) _0x66eba0.setAttribute('src', _0x39c6b9);
  return (_0xeafabc.appendChild(_0x66eba0), _0xeafabc);
}
export function startResultImageDragOutPointer(_0x208726, _0x14bf6b = {}) {
  if (!_0x208726 || _0x208726.button !== 0) return false;
  const _0x30bca5 = _0x14bf6b.targetEl || _0x208726.currentTarget;
  if (!_0x30bca5) return false;
  _0x208726.stopPropagation?.();
  const _0x21ba0e = _0x30bca5.ownerDocument || globalThis.document,
    _0x32ea2f = _0x21ba0e?.body || globalThis.document?.body,
    _0x4d11b5 = getEventClientPoint(_0x208726);
  let _0x3fc66f = false,
    _0x2ef11a = null,
    _0x22d651 = false;
  const _0x5c3907 = () => {
      if (_0x22d651) return;
      ((_0x22d651 = true),
        _0x21ba0e?.removeEventListener?.('pointermove', _0x10bcd7, true),
        _0x21ba0e?.removeEventListener?.('pointerup', _0x3793c5, true),
        _0x21ba0e?.removeEventListener?.('pointercancel', _0x1a763b, true));
      try {
        _0x30bca5.releasePointerCapture?.(_0x208726.pointerId);
      } catch {}
      _0x14bf6b.onDragEnd?.();
    },
    _0x292b62 = (_0x3a2969) => {
      if (_0x3fc66f) return true;
      const _0x3f05de = getEventClientPoint(_0x3a2969);
      if (
        Math.hypot(_0x3f05de.x - _0x4d11b5.x, _0x3f05de.y - _0x4d11b5.y) <= RESULT_IMAGE_DRAG_OUT_THRESHOLD_PX
      )
        return false;
      const _0xba48b3 = resolveOption(_0x14bf6b.image);
      if (!hasUsableResultImageForDragOut(_0xba48b3))
        return (
          _0x14bf6b.markClickSuppressed?.(),
          _0x14bf6b.showToast?.(t('aigenImage.result.dragUnavailable'), 'warning'),
          _0x5c3907(),
          false
        );
      ((_0x3fc66f = true), _0x14bf6b.markClickSuppressed?.(), _0x14bf6b.onDragStart?.());
      const _0x397c55 = resolveOption(_0x14bf6b.getGhostSourceElement),
        _0x3f55fe = resolveOption(_0x14bf6b.getGhostSize) || getElementSize(_0x397c55 || _0x30bca5);
      return (
        (_0x2ef11a =
          _0x14bf6b.createGhost?.({
            sourceEl: _0x397c55 || _0x30bca5,
            fallbackSrc: resolveOption(_0x14bf6b.getFallbackSrc) || '',
            width: _0x3f55fe.width,
            height: _0x3f55fe.height,
            documentRef: _0x21ba0e,
          }) ||
          createResultImageDragGhost({
            sourceEl: _0x397c55 || _0x30bca5,
            fallbackSrc: resolveOption(_0x14bf6b.getFallbackSrc) || '',
            width: _0x3f55fe.width,
            height: _0x3f55fe.height,
            documentRef: _0x21ba0e,
          })),
        _0x2ef11a &&
          (_0x32ea2f?.appendChild?.(_0x2ef11a),
          (_0x2ef11a.style.transform =
            'translate(' + _0x3f05de.x + 'px, ' + _0x3f05de.y + 'px) translate(-50%, -50%)')),
        true
      );
    };
  function _0x10bcd7(_0x37db57) {
    if (!_0x292b62(_0x37db57)) return;
    (_0x37db57.preventDefault?.(), _0x37db57.stopPropagation?.());
    const _0x2bdcfe = getEventClientPoint(_0x37db57);
    _0x2ef11a &&
      (_0x2ef11a.style.transform =
        'translate(' + _0x2bdcfe.x + 'px, ' + _0x2bdcfe.y + 'px) translate(-50%, -50%)');
  }
  function _0x3793c5(_0x1c925f) {
    const _0x23e032 = _0x3fc66f;
    _0x5c3907();
    if (!_0x23e032) return;
    (_0x1c925f.preventDefault?.(), _0x1c925f.stopPropagation?.());
    const _0x51f030 = resolveOption(_0x14bf6b.image),
      _0x2527ea =
        resolveOption(_0x14bf6b.getNodeFallbackSize) ||
        resolveOption(_0x14bf6b.getGhostSize) ||
        getElementSize(_0x30bca5),
      _0x2c843b = buildResultImageDragOutNodePayload({
        image: _0x51f030,
        viewport: resolveOption(_0x14bf6b.getViewport) || { x: 0, y: 0, zoom: 1 },
        screenX: Number(_0x1c925f?.clientX ?? _0x4d11b5.x),
        screenY: Number(_0x1c925f?.clientY ?? _0x4d11b5.y),
        fallbackWidth: _0x2527ea.width,
        fallbackHeight: _0x2527ea.height,
        createId: _0x14bf6b.createId,
        name: resolveOption(_0x14bf6b.getNodeName),
      });
    if (!_0x2c843b) {
      (_0x14bf6b.showToast?.(t('aigenImage.result.dragUnavailable'), 'warning'), removeGhost(_0x2ef11a));
      return;
    }
    (_0x14bf6b.addNode?.(_0x2c843b),
      _0x14bf6b.setSelectedNodes?.([_0x2c843b.id]),
      _0x14bf6b.commit?.(),
      _0x14bf6b.onCreated?.(_0x2c843b),
      removeGhost(_0x2ef11a));
  }
  function _0x1a763b(_0x51e555) {
    (_0x51e555?.stopPropagation?.(), _0x5c3907(), removeGhost(_0x2ef11a));
  }
  try {
    _0x30bca5.setPointerCapture?.(_0x208726.pointerId);
  } catch {}
  return (
    _0x21ba0e?.addEventListener?.('pointermove', _0x10bcd7, true),
    _0x21ba0e?.addEventListener?.('pointerup', _0x3793c5, true),
    _0x21ba0e?.addEventListener?.('pointercancel', _0x1a763b, true),
    true
  );
}
export function bindResultImageDragOutGesture(_0x31f4ec, _0x403f87 = {}) {
  if (!_0x31f4ec?.addEventListener) return () => {};
  const _0x35d45b = (_0x447d63) => {
    if (_0x403f87.isEnabled && !_0x403f87.isEnabled()) return;
    startResultImageDragOutPointer(_0x447d63, { ..._0x403f87, targetEl: _0x31f4ec });
  };
  return (
    _0x31f4ec.addEventListener('pointerdown', _0x35d45b),
    () => _0x31f4ec.removeEventListener?.('pointerdown', _0x35d45b)
  );
}
