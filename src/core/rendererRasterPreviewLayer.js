import { computeNodesWorldBounds } from './math.js';
import { getRendererNodeLabelKind } from './rendererNodePresentation.js';
import { canReuseRasterPaint } from './rendererRasterPaintPlan.js';
import { createRendererRasterPaintSurface } from './rendererRasterPaintSurface.js';
import { isCanvasImageDisplayLoadPending, preloadCanvasImage } from '../modules/canvasMediaScheduler.js';
const DEFAULT_NODE_WIDTH = 0xa0,
  DEFAULT_NODE_HEIGHT = 0x78,
  DEFAULT_WORLD_PADDING = 0x30,
  DEFAULT_MAX_CANVAS_DIMENSION = 0x1000,
  DEFAULT_MAX_BITMAP_PIXELS = 0x8 * 0x400 * 0x400,
  DEFAULT_MAX_DPR = 0x2,
  DEFAULT_MAX_IMAGE_CACHE = 0x280,
  DEFAULT_MAX_NEW_IMAGES_PER_SYNC = 0x18,
  DEFAULT_DENSE_MAX_NEW_IMAGES_PER_SYNC = 0x30,
  DEFAULT_MAX_READY_IMAGES_PER_FRAME = 0x8,
  DEFAULT_DENSE_MAX_READY_IMAGES_PER_FRAME = 0x10,
  DENSE_READY_REVEAL_NODE_COUNT = 0x140;
function finiteNumber(_0x4ad3a9, _0x5ed32f = 0x0) {
  const _0x32f9d2 = Number(_0x4ad3a9);
  return Number['isFinite'](_0x32f9d2) ? _0x32f9d2 : _0x5ed32f;
}
function positiveInteger(_0x2abe56, _0x4f25d6) {
  const _0x47cf5d = Math['trunc'](finiteNumber(_0x2abe56, _0x4f25d6));
  return _0x47cf5d > 0x0 ? _0x47cf5d : _0x4f25d6;
}
function normalizeIdSet(_0xb9cb64) {
  const _0x2afb29 = new Set();
  if (!_0xb9cb64 || typeof _0xb9cb64[Symbol['iterator']] !== 'function') return _0x2afb29;
  for (const _0x1a58b2 of _0xb9cb64) {
    const _0x578da5 = String(_0x1a58b2?.['id'] ?? _0x1a58b2 ?? '')['trim']();
    if (_0x578da5) _0x2afb29['add'](_0x578da5);
  }
  return _0x2afb29;
}
function resolveMediaLoadingBusy(_0xe6481d) {
  if (_0xe6481d && Object['prototype']['hasOwnProperty']['call'](_0xe6481d, 'mediaLoadingBusy'))
    return _0xe6481d['mediaLoadingBusy'] === !![];
  return _0xe6481d?.['viewportBusy'] === !![];
}
function normalizeSources(_0x1bae0a) {
  const _0x4d73f4 =
      typeof _0x1bae0a === 'string'
        ? [_0x1bae0a]
        : Array['isArray'](_0x1bae0a)
          ? _0x1bae0a
          : Array['isArray'](_0x1bae0a?.['sources'])
            ? _0x1bae0a['sources']
            : [_0x1bae0a?.['source'], _0x1bae0a?.['src']],
    _0x802e23 = [],
    _0xa33fce = new Set();
  for (const _0x4c900a of _0x4d73f4 || []) {
    const _0x3a3590 = String(_0x4c900a || '')['trim']();
    if (!_0x3a3590 || _0xa33fce['has'](_0x3a3590)) continue;
    (_0xa33fce['add'](_0x3a3590), _0x802e23['push'](_0x3a3590));
  }
  return _0x802e23;
}
function getNode(_0x46acc7, _0x49c960) {
  if (_0x46acc7 instanceof Map) return _0x46acc7['get'](_0x49c960) || null;
  return _0x46acc7?.[_0x49c960] || null;
}
function getCandidateIds(_0x45ea2d, _0x11fe81) {
  if (_0x11fe81 && typeof _0x11fe81[Symbol['iterator']] === 'function') return normalizeIdSet(_0x11fe81);
  if (_0x45ea2d instanceof Map) return normalizeIdSet(_0x45ea2d['keys']());
  return normalizeIdSet(Object['keys'](_0x45ea2d || {}));
}
function getNodeKind(_0x4ab123) {
  const _0x1b56b9 = getRendererNodeLabelKind(_0x4ab123?.['type']);
  if (_0x1b56b9) return _0x1b56b9;
  const _0x4ac4af = String(_0x4ab123?.['type'] || '')['toLowerCase']();
  if (_0x4ac4af['includes']('video') || _0x4ac4af['includes']('media-clip')) return 'video';
  if (_0x4ac4af['includes']('image')) return 'image';
  if (_0x4ac4af['includes']('text') || _0x4ac4af['includes']('comment')) return 'text';
  if (_0x4ac4af['includes']('group')) return 'group';
  return 'node';
}
function getNodeLabel(_0x3b217d, _0x3194cb) {
  const _0x249d2d =
    _0x3194cb === 'video'
      ? 'Video'
      : _0x3194cb === 'image'
        ? 'Image'
        : _0x3194cb === 'text'
          ? 'Text'
          : _0x3194cb === 'group'
            ? 'Group'
            : 'Node';
  return String(
    _0x3b217d?.['name'] || _0x3b217d?.['title'] || _0x3b217d?.['text'] || _0x3b217d?.['prompt'] || _0x249d2d,
  )
    ['replace'](/\s+/g, '\x20')
    ['trim']()
    ['slice'](0x0, _0x3194cb === 'text' ? 0x60 : 0x24);
}
function getCssColor(_0x3e2dfa, _0x506bba, _0x11e57a) {
  try {
    const _0x2c7de8 = _0x3e2dfa?.['getPropertyValue']?.(_0x506bba);
    return String(_0x2c7de8 || '')['trim']() || _0x11e57a;
  } catch {
    return _0x11e57a;
  }
}
function readPalette(_0x1ecad2) {
  const _0x4923c8 = _0x1ecad2?.['documentElement'] || _0x1ecad2?.['body'],
    _0x440ed2 = _0x1ecad2?.['defaultView'] || globalThis['window'];
  let _0xbeec54 = null;
  try {
    _0xbeec54 = _0x440ed2?.['getComputedStyle']?.(_0x4923c8) || null;
  } catch {}
  return {
    nodeFill: getCssColor(_0xbeec54, '--surface-node', 'ButtonFace'),
    nodeStroke: getCssColor(_0xbeec54, '--stroke-default', 'GrayText'),
    text: getCssColor(_0xbeec54, '--text-primary', 'CanvasText'),
    placeholder: getCssColor(_0xbeec54, '--text-secondary', 'GrayText'),
    nodeLabel: getCssColor(_0xbeec54, '--white-40', 'GrayText'),
  };
}
function getPaletteThemeKey(_0x4e9b01) {
  const _0x5c337a = _0x4e9b01?.['documentElement'] || _0x4e9b01?.['body'],
    _0x4edb35 = _0x5c337a?.['getAttribute']?.('data-theme') || '',
    _0x2726f9 = String(_0x5c337a?.['className'] || ''),
    _0x2078ac = String(_0x4e9b01?.['readyState'] || '');
  return _0x2078ac + '\x1f' + _0x4edb35 + '\x1f' + _0x2726f9;
}
function applyPaletteOverrides(_0x2b78fc, _0x4d7b3e = {}) {
  return {
    nodeFill: _0x4d7b3e['nodeFill'] || _0x2b78fc['nodeFill'],
    nodeStroke: _0x4d7b3e['nodeStroke'] || _0x2b78fc['nodeStroke'],
    text: _0x4d7b3e['text'] || _0x2b78fc['text'],
    placeholder: _0x4d7b3e['placeholder'] || _0x2b78fc['placeholder'],
    nodeLabel: _0x4d7b3e['nodeLabel'] || _0x2b78fc['nodeLabel'],
  };
}
function formatCssNumber(_0x734a40) {
  const _0xc4072f = Math['abs'](_0x734a40) < 0.0001 ? 0x0 : _0x734a40;
  return String(_0xc4072f);
}
function normalizeExplicitWorldBounds(_0x1f27e6) {
  if (!_0x1f27e6 || typeof _0x1f27e6 !== 'object') return null;
  const _0x10155a = finiteNumber(_0x1f27e6['left'] ?? _0x1f27e6['minX'], NaN),
    _0x29c82a = finiteNumber(_0x1f27e6['top'] ?? _0x1f27e6['minY'], NaN),
    _0x191873 = finiteNumber(_0x1f27e6['width'], finiteNumber(_0x1f27e6['maxX'], NaN) - _0x10155a),
    _0x2acea6 = finiteNumber(_0x1f27e6['height'], finiteNumber(_0x1f27e6['maxY'], NaN) - _0x29c82a);
  if (
    !Number['isFinite'](_0x10155a) ||
    !Number['isFinite'](_0x29c82a) ||
    !(_0x191873 > 0x0) ||
    !(_0x2acea6 > 0x0)
  )
    return null;
  return { left: _0x10155a, top: _0x29c82a, width: _0x191873, height: _0x2acea6 };
}
function computeRasterWorldBounds(_0x381b2c, _0x47f5b8) {
  const _0x5b6644 = normalizeExplicitWorldBounds(_0x47f5b8?.['worldBounds']);
  if (_0x5b6644) return _0x5b6644;
  const _0x4fbfe0 = computeNodesWorldBounds(_0x381b2c);
  if (!_0x4fbfe0) return null;
  const _0x42b4ef = Math['max'](0x0, finiteNumber(_0x47f5b8?.['worldPadding'], DEFAULT_WORLD_PADDING)),
    _0x42bf4f = Math['floor'](_0x4fbfe0['minX'] - _0x42b4ef),
    _0x204232 = Math['floor'](_0x4fbfe0['minY'] - _0x42b4ef),
    _0x5efa5e = Math['ceil'](_0x4fbfe0['maxX'] + _0x42b4ef),
    _0x4730d0 = Math['ceil'](_0x4fbfe0['maxY'] + _0x42b4ef);
  return {
    left: _0x42bf4f,
    top: _0x204232,
    width: Math['max'](0x1, _0x5efa5e - _0x42bf4f),
    height: Math['max'](0x1, _0x4730d0 - _0x204232),
  };
}
function createEmptyStats(_0x40d7af = 0x0, _0x1e7420 = ![]) {
  return {
    active: ![],
    supported: _0x1e7420,
    drawnNodeIds: [],
    drawnMediaNodeIds: [],
    drawnNodeCount: 0x0,
    mediaDrawCount: 0x0,
    mediaSourceCount: 0x0,
    placeholderCount: 0x0,
    candidateCount: 0x0,
    excludedNodeCount: 0x0,
    bitmapWidth: 0x0,
    bitmapHeight: 0x0,
    cssWidth: 0x0,
    cssHeight: 0x0,
    dpr: 0x1,
    renderScale: 0x1,
    effectiveScale: 0x1,
    rasterScale: 0x1,
    revision: _0x40d7af,
    worldBounds: null,
    cachedImageCount: 0x0,
    pendingImageCount: 0x0,
    readyImageCount: 0x0,
    loadedImageCount: 0x0,
    errorImageCount: 0x0,
    cacheLimit: 0x0,
    cacheHitCount: 0x0,
    cacheMissCount: 0x0,
    skippedBusyImageCount: 0x0,
    startedImageCount: 0x0,
    revealedImageCount: 0x0,
  };
}
function defaultRequestFrame(_0x43a3ec) {
  if (typeof globalThis['requestAnimationFrame'] === 'function')
    return globalThis['requestAnimationFrame'](_0x43a3ec);
  return (_0x43a3ec(), null);
}
function defaultCancelFrame(_0x32c9c0) {
  _0x32c9c0 != null &&
    typeof globalThis['cancelAnimationFrame'] === 'function' &&
    globalThis['cancelAnimationFrame'](_0x32c9c0);
}
function drawImageCover(_0x58281a, _0x2fc7e0, _0x1c9f57) {
  const _0x167a7f = Math['max'](
      0x0,
      finiteNumber(_0x2fc7e0?.['naturalWidth'] ?? _0x2fc7e0?.['videoWidth'] ?? _0x2fc7e0?.['width'], 0x0),
    ),
    _0x5da2aa = Math['max'](
      0x0,
      finiteNumber(_0x2fc7e0?.['naturalHeight'] ?? _0x2fc7e0?.['videoHeight'] ?? _0x2fc7e0?.['height'], 0x0),
    );
  try {
    if (!(_0x167a7f > 0x0 && _0x5da2aa > 0x0))
      return (
        _0x58281a['drawImage'](
          _0x2fc7e0,
          _0x1c9f57['x'],
          _0x1c9f57['y'],
          _0x1c9f57['width'],
          _0x1c9f57['height'],
        ),
        !![]
      );
    const _0x2973e0 = _0x167a7f / _0x5da2aa,
      _0x939860 = _0x1c9f57['width'] / _0x1c9f57['height'];
    let _0x18c872 = 0x0,
      _0x5bd6b6 = 0x0,
      _0xa41737 = _0x167a7f,
      _0x5c95dd = _0x5da2aa;
    if (_0x2973e0 > _0x939860)
      ((_0xa41737 = _0x5da2aa * _0x939860), (_0x18c872 = (_0x167a7f - _0xa41737) / 0x2));
    else
      _0x2973e0 < _0x939860 &&
        ((_0x5c95dd = _0x167a7f / _0x939860), (_0x5bd6b6 = (_0x5da2aa - _0x5c95dd) / 0x2));
    return (
      _0x58281a['drawImage'](
        _0x2fc7e0,
        _0x18c872,
        _0x5bd6b6,
        _0xa41737,
        _0x5c95dd,
        _0x1c9f57['x'],
        _0x1c9f57['y'],
        _0x1c9f57['width'],
        _0x1c9f57['height'],
      ),
      !![]
    );
  } catch {
    return ![];
  }
}
function strokeRoundedRect(_0x5161fb, _0x2322d3, _0x377c47, _0x56896f, _0x19b7cb, _0x182b67) {
  if (typeof _0x5161fb['roundRect'] === 'function') {
    (_0x5161fb['beginPath'](),
      _0x5161fb['roundRect'](_0x2322d3, _0x377c47, _0x56896f, _0x19b7cb, _0x182b67),
      _0x5161fb['stroke']());
    return;
  }
  _0x5161fb['strokeRect'](_0x2322d3, _0x377c47, _0x56896f, _0x19b7cb);
}
function strokeCircle(_0x5932d6, _0x70ed0e, _0x15b82e, _0x1eca1e) {
  if (typeof _0x5932d6['arc'] !== 'function') return;
  (_0x5932d6['beginPath'](),
    _0x5932d6['arc'](_0x70ed0e, _0x15b82e, _0x1eca1e, 0x0, Math['PI'] * 0x2),
    _0x5932d6['stroke']());
}
function drawMediaTypeIcon(_0x3b841a, _0x28e76c, _0x5d5c04, _0x172d00, _0x31aaf6, _0x21ef8d) {
  if (!['image', 'video']['includes'](_0x28e76c)) return ![];
  if (!(_0x31aaf6 > 0x0) || _0x31aaf6 * _0x21ef8d < 0x3) return ![];
  const _0x369fb4 = _0x31aaf6 / 0x18,
    _0x12aa9c = _0x5d5c04 - _0x31aaf6 / 0x2,
    _0x390d61 = _0x172d00 - _0x31aaf6 / 0x2,
    _0x82ca9c = (_0x2bf941) => _0x12aa9c + _0x2bf941 * _0x369fb4,
    _0x1a36a9 = (_0x214f8d) => _0x390d61 + _0x214f8d * _0x369fb4;
  _0x3b841a['lineWidth'] = Math['min'](3.2, Math['max'](1.2, 0.7 / Math['max'](0.01, _0x21ef8d)));
  if (_0x28e76c === 'image')
    return (
      strokeRoundedRect(
        _0x3b841a,
        _0x82ca9c(0x3),
        _0x1a36a9(0x3),
        0x12 * _0x369fb4,
        0x12 * _0x369fb4,
        0x2 * _0x369fb4,
      ),
      strokeCircle(_0x3b841a, _0x82ca9c(8.5), _0x1a36a9(8.5), 1.5 * _0x369fb4),
      _0x3b841a['beginPath'](),
      _0x3b841a['moveTo'](_0x82ca9c(0x15), _0x1a36a9(0xf)),
      _0x3b841a['lineTo'](_0x82ca9c(0x10), _0x1a36a9(0xa)),
      _0x3b841a['lineTo'](_0x82ca9c(0x5), _0x1a36a9(0x15)),
      _0x3b841a['stroke'](),
      !![]
    );
  if (_0x28e76c === 'video')
    return (
      strokeRoundedRect(
        _0x3b841a,
        _0x82ca9c(0x1),
        _0x1a36a9(0x5),
        0xf * _0x369fb4,
        0xe * _0x369fb4,
        0x2 * _0x369fb4,
      ),
      _0x3b841a['beginPath'](),
      _0x3b841a['moveTo'](_0x82ca9c(0x17), _0x1a36a9(0x7)),
      _0x3b841a['lineTo'](_0x82ca9c(0x10), _0x1a36a9(0xc)),
      _0x3b841a['lineTo'](_0x82ca9c(0x17), _0x1a36a9(0x11)),
      _0x3b841a['closePath'](),
      _0x3b841a['stroke'](),
      !![]
    );
  return ![];
}
function drawPlaceholder(_0x4617d0, _0x17e05b, _0x25f037, _0x3b5a8f, _0x486a6c) {
  const _0x2d9770 = Math['min'](0x28, _0x17e05b['width'] * 0.32, _0x17e05b['height'] * 0.32);
  ((_0x4617d0['strokeStyle'] = _0x25f037['placeholder']), (_0x4617d0['globalAlpha'] = _0x486a6c * 0.72));
  const _0x54e22b = drawMediaTypeIcon(
    _0x4617d0,
    _0x17e05b['kind'],
    _0x17e05b['x'] + _0x17e05b['width'] / 0x2,
    _0x17e05b['y'] + _0x17e05b['height'] / 0x2,
    _0x2d9770,
    _0x3b5a8f,
  );
  if (!_0x54e22b) {
    const _0x15547f = Math['min'](0x12, Math['max'](0xa, _0x17e05b['height'] * 0.12));
    _0x15547f * _0x3b5a8f >= 0x7 &&
      ((_0x4617d0['fillStyle'] = _0x25f037['placeholder']),
      (_0x4617d0['font'] = '500 ' + _0x15547f + 'px system-ui, sans-serif'),
      _0x4617d0['fillText'](
        _0x17e05b['label'],
        _0x17e05b['x'] + 0x8,
        _0x17e05b['y'] + _0x17e05b['height'] / 0x2 + _0x15547f * 0.35,
        Math['max'](0x1, _0x17e05b['width'] - 0x10),
      ));
  }
  _0x4617d0['globalAlpha'] = _0x486a6c;
}
function drawNodeLabel(_0x319991, _0x38d1ff, _0x31a331, _0x31f7ae, _0x22c847) {
  if (!['image', 'video']['includes'](_0x38d1ff['kind'])) return;
  const _0x49fb17 = 0x15;
  if (_0x49fb17 * _0x31f7ae < 0x3) return;
  const _0x57410f = _0x49fb17 * 1.33;
  ((_0x319991['globalAlpha'] = _0x22c847 * 0.64),
    (_0x319991['strokeStyle'] = _0x31a331['nodeLabel']),
    (_0x319991['fillStyle'] = _0x31a331['nodeLabel']),
    drawMediaTypeIcon(
      _0x319991,
      _0x38d1ff['kind'],
      _0x38d1ff['x'] + _0x57410f / 0x2,
      _0x38d1ff['y'] - 0x8 - _0x57410f / 0x2,
      _0x57410f,
      _0x31f7ae,
    ));
  const _0x153465 = '500\x20' + _0x49fb17 + 'px system-ui, sans-serif';
  if (_0x319991['font'] !== _0x153465) _0x319991['font'] = _0x153465;
  (_0x319991['fillText'](
    _0x38d1ff['label'],
    _0x38d1ff['x'] + _0x57410f + 0x6,
    _0x38d1ff['y'] - 0xa,
    Math['max'](0x1, _0x38d1ff['width'] - _0x57410f - 0x6),
  ),
    (_0x319991['globalAlpha'] = _0x22c847));
}
export function createRendererRasterPreviewLayer({
  documentRef: documentRef = globalThis['document'],
  resolveMediaSources: resolveMediaSources = null,
  createImage: createImage = null,
  requestFrame: requestFrame = defaultRequestFrame,
  cancelFrame: cancelFrame = defaultCancelFrame,
  maxImageCache: maxImageCache = DEFAULT_MAX_IMAGE_CACHE,
  maxNewImagesPerSync: maxNewImagesPerSync = null,
  maxReadyImagesPerFrame: maxReadyImagesPerFrame = null,
  maxCanvasDimension: maxCanvasDimension = DEFAULT_MAX_CANVAS_DIMENSION,
  maxBitmapPixels: maxBitmapPixels = DEFAULT_MAX_BITMAP_PIXELS,
  maxDpr: maxDpr = DEFAULT_MAX_DPR,
  onMediaPresented: onMediaPresented = null,
} = {}) {
  const _0x407d51 = Math['max'](0x0, Math['trunc'](finiteNumber(maxImageCache, DEFAULT_MAX_IMAGE_CACHE))),
    _0x508cdb = Number(maxNewImagesPerSync),
    _0x4f2dc9 = maxNewImagesPerSync != null && Number['isFinite'](_0x508cdb) && _0x508cdb >= 0x0,
    _0x232f73 = _0x4f2dc9 ? Math['max'](0x0, Math['trunc'](_0x508cdb)) : DEFAULT_MAX_NEW_IMAGES_PER_SYNC,
    _0x4ac2bf = _0x4f2dc9 ? _0x232f73 : DEFAULT_DENSE_MAX_NEW_IMAGES_PER_SYNC,
    _0x10c733 = Number(maxReadyImagesPerFrame),
    _0x53e251 = Number['isFinite'](_0x10c733) && _0x10c733 > 0x0,
    _0x27659c = _0x53e251 ? Math['max'](0x1, Math['trunc'](_0x10c733)) : DEFAULT_MAX_READY_IMAGES_PER_FRAME,
    _0x5e7309 = _0x53e251 ? _0x27659c : DEFAULT_DENSE_MAX_READY_IMAGES_PER_FRAME,
    _0x148a62 = new Map(),
    _0x43c99a = new Map();
  let _0x466b59 = null,
    _0x261037 = null,
    _0x442475 = null,
    _0x25a125 = ![],
    _0x9b2b41 = ![],
    _0x1a0e80 = ![],
    _0x2dd307 = 0x0,
    _0x333997 = { ...createEmptyStats(), cacheLimit: _0x407d51 },
    _0x17729e = null,
    _0x2fb358 = null,
    _0x535472 = 0x0,
    _0x58f114 = 0x0,
    _0x2189ba = null,
    _0x4540f9 = null,
    _0x1c2e8b = null;
  function _0x5ca0cc() {
    _0x58f114 += 0x1;
    const _0x51397c = _0x2189ba;
    _0x2189ba = null;
    if (!_0x51397c) return;
    if (_0x51397c['kind'] === 'idle' && typeof globalThis['cancelIdleCallback'] === 'function')
      globalThis['cancelIdleCallback'](_0x51397c['id']);
    else _0x51397c['kind'] === 'timer' && clearTimeout(_0x51397c['id']);
  }
  function _0x8dfc37() {
    if (!_0x466b59 || (_0x466b59['width'] <= 0x1 && _0x466b59['height'] <= 0x1)) return;
    _0x5ca0cc();
    const _0x303455 = _0x58f114,
      _0x3c65ec = () => {
        if (_0x303455 !== _0x58f114) return;
        _0x2189ba = null;
        if (_0x1a0e80 || !_0x466b59 || (_0x17729e?.['items']?.['length'] || 0x0) > 0x0) return;
        _0x442475?.['resize'](0x1, 0x1);
      };
    typeof globalThis['requestIdleCallback'] === 'function'
      ? (_0x2189ba = { kind: 'idle', id: globalThis['requestIdleCallback'](_0x3c65ec, { timeout: 0x1f4 }) })
      : (_0x2189ba = { kind: 'timer', id: setTimeout(_0x3c65ec, 0x60) });
  }
  function _0x35249c(_0x37be9d) {
    const _0x5b5b08 = getPaletteThemeKey(documentRef);
    return (
      (!_0x1c2e8b || _0x5b5b08 !== _0x4540f9) &&
        ((_0x1c2e8b = readPalette(documentRef)), (_0x4540f9 = _0x5b5b08)),
      _0x37be9d && typeof _0x37be9d === 'object' ? applyPaletteOverrides(_0x1c2e8b, _0x37be9d) : _0x1c2e8b
    );
  }
  function _0x36fc99(_0x2097f1) {
    let _0x4b9782 = 0x0,
      _0x4e85eb = 0x0,
      _0x42b548 = 0x0,
      _0x2c6e4d = 0x0;
    for (const _0x1786e9 of _0x148a62['values']()) {
      if (_0x1786e9['status'] === 'pending') _0x4b9782 += 0x1;
      else {
        if (_0x1786e9['status'] === 'ready') _0x4e85eb += 0x1;
        else {
          if (_0x1786e9['status'] === 'loaded') _0x42b548 += 0x1;
          else {
            if (_0x1786e9['status'] === 'error') _0x2c6e4d += 0x1;
          }
        }
      }
    }
    _0x333997 = {
      ..._0x2097f1,
      cachedImageCount: _0x148a62['size'],
      mediaSourceCount: _0x148a62['size'],
      pendingImageCount: _0x4b9782,
      readyImageCount: _0x4e85eb,
      loadedImageCount: _0x42b548,
      errorImageCount: _0x2c6e4d,
      cacheLimit: _0x407d51,
    };
    if (_0x466b59) {
      _0x466b59['__aicanvasRasterPreviewStats'] = _0x333997;
      const _0x215b85 = new Set(_0x333997['drawnMediaNodeIds'] || []);
      _0x466b59['__aicanvasRasterPreviewRevealItems'] = (_0x17729e?.['items'] || [])
        ['filter']((_0x45dfb7) => _0x45dfb7['kind'] === 'image' && _0x45dfb7['sources']['length'] > 0x0)
        ['map']((_0x1c367b) => {
          const _0x302881 = _0x5ac41e(_0x1c367b),
            _0x4e3013 = _0x302881['find'](
              (_0xcd9957) => _0x148a62['get'](_0xcd9957)?.['status'] === 'loaded',
            );
          return {
            height: _0x1c367b['height'],
            kind: _0x1c367b['kind'],
            nodeId: _0x1c367b['id'],
            ready: _0x215b85['has'](_0x1c367b['id']),
            source: _0x4e3013 || _0x302881[0x0] || _0x1c367b['sources'][0x0] || '',
            width: _0x1c367b['width'],
            x: _0x1c367b['x'],
            y: _0x1c367b['y'],
          };
        })
        ['filter']((_0xc73719) => _0xc73719['source']);
    }
    return _0x333997;
  }
  function _0xf40a36() {
    for (const _0x3bea97 of _0x148a62['values']()) {
      if (_0x3bea97['status'] === 'ready') return !![];
    }
    return ![];
  }
  function _0x4c8919() {
    let _0x3b88db = 0x0;
    for (const _0x41aa51 of _0x148a62['values']()) {
      if (_0x41aa51['status'] === 'pending') _0x3b88db += 0x1;
    }
    return _0x3b88db;
  }
  function _0x31af67(_0x28e07a = _0x27659c) {
    const _0x5e5cbf = [];
    for (const _0xe8bb55 of _0x148a62['values']()) {
      if (_0xe8bb55['status'] !== 'ready') continue;
      ((_0xe8bb55['status'] = 'loaded'), _0x5e5cbf['push'](_0xe8bb55['source']));
      if (_0x5e5cbf['length'] >= _0x28e07a) break;
    }
    return _0x5e5cbf;
  }
  function _0x426b70() {
    _0x535472 += 0x1;
    if (_0x2fb358 != null) cancelFrame(_0x2fb358);
    _0x2fb358 = null;
  }
  function _0x53ecf3() {
    if (_0x1a0e80 || !_0x17729e || _0x17729e['viewportBusy'] || _0x2fb358 != null) return;
    const _0x49e768 = ++_0x535472;
    let _0x40b447 = ![];
    const _0x54cbf5 = requestFrame(() => {
      _0x40b447 = !![];
      if (_0x49e768 !== _0x535472 || _0x1a0e80) return;
      ((_0x2fb358 = null), _0x1ba124());
    });
    if (!_0x40b447) _0x2fb358 = _0x54cbf5;
  }
  function _0x2f6229(_0x381ad7) {
    if (!_0x381ad7 || _0x381ad7['listenersRemoved']) return;
    _0x381ad7['listenersRemoved'] = !![];
    const { image: _0x42a397, onLoad: _0x2b6e8c, onError: _0x3594ce } = _0x381ad7;
    if (typeof _0x42a397?.['removeEventListener'] === 'function')
      (_0x42a397['removeEventListener']('load', _0x2b6e8c),
        _0x42a397['removeEventListener']('error', _0x3594ce));
    else {
      if (_0x42a397) {
        if (_0x42a397['onload'] === _0x2b6e8c) _0x42a397['onload'] = null;
        if (_0x42a397['onerror'] === _0x3594ce) _0x42a397['onerror'] = null;
      }
    }
  }
  function _0x3b3533(_0x5121a8) {
    if (!_0x5121a8) return;
    _0x2f6229(_0x5121a8);
    try {
      if (_0x5121a8['ownsImage'] === !![] && _0x5121a8['image']) _0x5121a8['image']['src'] = '';
    } catch {}
  }
  function _0xdafbb5(_0x31f88c) {
    const _0x243f56 = _0x148a62['get'](_0x31f88c);
    if (!_0x243f56) return ![];
    return (_0x148a62['delete'](_0x31f88c), _0x3b3533(_0x243f56), !![]);
  }
  function _0x30e53b(_0x49d3cd) {
    if (!_0x49d3cd || _0x148a62['get'](_0x49d3cd['source']) !== _0x49d3cd) return;
    (_0x148a62['delete'](_0x49d3cd['source']), _0x148a62['set'](_0x49d3cd['source'], _0x49d3cd));
  }
  function _0x172065(_0x383e7b = null) {
    for (const [_0x303d08] of _0x148a62) {
      if (_0x383e7b instanceof Set ? _0x383e7b['has'](_0x303d08) : _0x303d08 === _0x383e7b) continue;
      return _0xdafbb5(_0x303d08);
    }
    return ![];
  }
  function _0x14bce3(_0x5dea06, _0x553f17 = null) {
    if (!_0x5dea06 || _0x407d51 <= 0x0) return null;
    while (_0x148a62['size'] >= _0x407d51) {
      if (!_0x172065(_0x553f17 || _0x5dea06)) return null;
    }
    const _0x30c73d = typeof createImage === 'function' ? createImage() : null,
      _0xb21312 = {
        image: _0x30c73d,
        ownsImage: !!_0x30c73d,
        listenersRemoved: ![],
        onError: null,
        onLoad: null,
        source: _0x5dea06,
        status: 'pending',
      };
    _0x148a62['set'](_0x5dea06, _0xb21312);
    if (!_0x30c73d)
      return (
        preloadCanvasImage(_0x5dea06, {
          decode: !![],
          requireImage: !![],
          priority: 0x5,
          fetchPriority: 'auto',
          scope: 'renderer-raster-preview',
          deferWhenPaused: !![],
        })['then'](
          (_0x34a08e) => {
            if (_0x148a62['get'](_0x5dea06) !== _0xb21312 || _0xb21312['status'] !== 'pending') return;
            if (!_0x34a08e?.['image']) {
              ((_0xb21312['status'] = 'error'), _0x53ecf3());
              return;
            }
            ((_0xb21312['image'] = _0x34a08e['image']),
              (_0xb21312['status'] = 'ready'),
              _0x30e53b(_0xb21312),
              _0x53ecf3());
          },
          () => {
            if (_0x148a62['get'](_0x5dea06) !== _0xb21312) return;
            ((_0xb21312['status'] = 'error'), _0x53ecf3());
          },
        ),
        _0xb21312
      );
    ((_0xb21312['onLoad'] = () => {
      if (_0x148a62['get'](_0x5dea06) !== _0xb21312) return;
      _0x2f6229(_0xb21312);
      const _0x554b06 = () => {
        if (_0x148a62['get'](_0x5dea06) !== _0xb21312 || _0xb21312['status'] !== 'pending') return;
        ((_0xb21312['status'] = 'ready'), _0x30e53b(_0xb21312), _0x53ecf3());
      };
      try {
        const _0x407a42 = typeof _0x30c73d['decode'] === 'function' ? _0x30c73d['decode']() : null;
        _0x407a42 && typeof _0x407a42['then'] === 'function'
          ? Promise['resolve'](_0x407a42)['then'](_0x554b06, _0x554b06)
          : _0x554b06();
      } catch {
        _0x554b06();
      }
    }),
      (_0xb21312['onError'] = () => {
        if (_0x148a62['get'](_0x5dea06) !== _0xb21312) return;
        ((_0xb21312['status'] = 'error'), _0x2f6229(_0xb21312), _0x53ecf3());
      }));
    typeof _0x30c73d['addEventListener'] === 'function'
      ? (_0x30c73d['addEventListener']('load', _0xb21312['onLoad']),
        _0x30c73d['addEventListener']('error', _0xb21312['onError']))
      : ((_0x30c73d['onload'] = _0xb21312['onLoad']), (_0x30c73d['onerror'] = _0xb21312['onError']));
    try {
      ((_0x30c73d['decoding'] = 'async'), (_0x30c73d['src'] = _0x5dea06));
    } catch {
      ((_0xb21312['status'] = 'error'), _0x2f6229(_0xb21312));
    }
    return _0xb21312;
  }
  function _0x5df0b3(_0xedd34a) {
    if (_0x1a0e80 || !_0xedd34a || typeof documentRef?.['createElement'] !== 'function') return ![];
    !_0x466b59 &&
      ((_0x466b59 = documentRef['createElement']('canvas')),
      (_0x466b59['className'] = 'v2-raster-preview-canvas'),
      (_0x466b59['dataset']['role'] = 'raster-preview-canvas'),
      _0x466b59['setAttribute']?.('data-role', 'raster-preview-canvas'),
      _0x466b59['setAttribute']?.('aria-hidden', 'true'),
      Object['assign'](_0x466b59['style'], {
        display: 'none',
        height: '1px',
        left: '0px',
        top: '0px',
        width: '1px',
      }));
    if (_0x466b59['parentNode'] !== _0xedd34a) _0xedd34a['appendChild']?.(_0x466b59);
    return (
      !_0x25a125 &&
        ((_0x25a125 = !![]),
        (_0x442475 = createRendererRasterPaintSurface(_0x466b59)),
        (_0x261037 = _0x442475['context']),
        (_0x9b2b41 = Boolean(
          _0x261037 &&
          typeof _0x261037['setTransform'] === 'function' &&
          typeof _0x261037['clearRect'] === 'function' &&
          typeof _0x261037['fillRect'] === 'function' &&
          typeof _0x261037['strokeRect'] === 'function' &&
          typeof _0x261037['drawImage'] === 'function',
        )),
        !_0x9b2b41 && ((_0x261037 = null), (_0x466b59['style']['display'] = 'none'))),
      _0x9b2b41
    );
  }
  function _0x2096aa(_0x56a938, _0x5425f9, _0x514088) {
    const _0x343df2 = getCandidateIds(_0x56a938, _0x5425f9),
      _0x429cc8 = normalizeIdSet(_0x514088?.['excludedNodeIds']),
      _0x407891 = String(_0x514088?.['sourceNodeId'] || '')['trim'](),
      _0x26eaad = String(_0x514088?.['hoverNodeId'] || '')['trim']();
    if (_0x407891) _0x429cc8['add'](_0x407891);
    if (_0x26eaad) _0x429cc8['add'](_0x26eaad);
    const _0x24cc39 = normalizeIdSet(_0x514088?.['invalidNodeIds']),
      _0x1289ac =
        typeof _0x514088?.['resolveMediaSources'] === 'function'
          ? _0x514088['resolveMediaSources']
          : resolveMediaSources,
      _0x37435c = [];
    let _0x232c44 = 0x0;
    for (const _0x183066 of _0x343df2) {
      if (_0x429cc8['has'](_0x183066)) {
        _0x232c44 += 0x1;
        continue;
      }
      const _0x5a8f46 = getNode(_0x56a938, _0x183066);
      if (!_0x5a8f46 || typeof _0x5a8f46 !== 'object') continue;
      const _0x5a94c3 = Math['max'](0x1, finiteNumber(_0x5a8f46['width'], DEFAULT_NODE_WIDTH)),
        _0x38f7c1 = Math['max'](0x1, finiteNumber(_0x5a8f46['height'], DEFAULT_NODE_HEIGHT)),
        _0x552a9c = getNodeKind(_0x5a8f46);
      if (_0x552a9c === 'audio') continue;
      let _0x1f378d = [];
      if (typeof _0x1289ac === 'function')
        try {
          _0x1f378d = normalizeSources(_0x1289ac(_0x5a8f46, { nodeId: _0x183066, options: _0x514088 }));
        } catch {
          _0x1f378d = [];
        }
      _0x37435c['push']({
        height: _0x38f7c1,
        id: _0x183066,
        invalid: _0x24cc39['has'](_0x183066),
        kind: _0x552a9c,
        label: getNodeLabel(_0x5a8f46, _0x552a9c),
        sources: _0x1f378d,
        width: _0x5a94c3,
        x: finiteNumber(_0x5a8f46['x'], 0x0),
        y: finiteNumber(_0x5a8f46['y'], 0x0),
      });
    }
    const _0x2156e2 =
        _0x514088?.['mediaLoadNodeIds'] == null ? null : normalizeIdSet(_0x514088['mediaLoadNodeIds']),
      _0x211c8f =
        _0x2156e2 === null
          ? _0x37435c
          : [
              ..._0x37435c['filter']((_0x2798d2) => _0x2156e2['has'](_0x2798d2['id'])),
              ..._0x37435c['filter'](
                (_0x1acd25) =>
                  !_0x2156e2['has'](_0x1acd25['id']) &&
                  _0x1acd25['sources']['some']((_0x413370) => _0x148a62['has'](_0x413370)),
              ),
            ],
      _0x1e649d = new Set(),
      _0x4cab33 = _0x211c8f['reduce'](
        (_0x27ce06, _0x129f46) => Math['max'](_0x27ce06, _0x129f46['sources']['length']),
        0x0,
      );
    for (let _0x5def87 = 0x0; _0x5def87 < _0x4cab33 && _0x1e649d['size'] < _0x407d51; _0x5def87 += 0x1) {
      for (const _0x7628de of _0x211c8f) {
        const _0x2b9480 = _0x7628de['sources'][_0x5def87];
        if (_0x2b9480) _0x1e649d['add'](_0x2b9480);
        if (_0x1e649d['size'] >= _0x407d51) break;
      }
    }
    return {
      admittedSources: _0x1e649d,
      mediaLoadNodeIds: _0x2156e2,
      candidateCount: _0x343df2['size'],
      excludedNodeCount: _0x232c44,
      items: _0x37435c,
      options: _0x514088,
      paintScaleKey: [
        _0x514088?.['dpr'] ?? globalThis['devicePixelRatio'] ?? 0x1,
        _0x514088?.['viewport']?.['zoom'] ?? _0x514088?.['zoom'],
        _0x514088?.['renderScale'],
        _0x514088?.['maxDpr'],
        _0x514088?.['maxCanvasDimension'],
        _0x514088?.['maxBitmapPixels'],
      ]['join']('|'),
      palette: _0x37435c['length'] > 0x0 ? _0x35249c(_0x514088?.['palette']) : _0x1c2e8b,
      viewportBusy: resolveMediaLoadingBusy(_0x514088),
      worldBounds: computeRasterWorldBounds(_0x37435c, _0x514088),
    };
  }
  function _0x280b02(_0x476364, _0x4d3446) {
    const _0x2cd8c9 = Math['max'](
        0.1,
        finiteNumber(_0x4d3446?.['dpr'], finiteNumber(globalThis['devicePixelRatio'], 0x1)),
      ),
      _0x1581e8 = Math['max'](
        0.0001,
        finiteNumber(_0x4d3446?.['viewport']?.['zoom'] ?? _0x4d3446?.['zoom'], 0x1),
      ),
      _0xe68c8c = Math['max'](0.0001, finiteNumber(_0x4d3446?.['renderScale'], _0x1581e8 * _0x2cd8c9)),
      _0x122d27 = Math['max'](0.1, finiteNumber(_0x4d3446?.['maxDpr'], maxDpr)),
      _0x4be4f7 = Math['min'](_0xe68c8c, _0x122d27),
      _0xd73510 = positiveInteger(
        _0x4d3446?.['maxCanvasDimension'],
        positiveInteger(maxCanvasDimension, DEFAULT_MAX_CANVAS_DIMENSION),
      ),
      _0x6b79e1 = positiveInteger(
        _0x4d3446?.['maxBitmapPixels'],
        positiveInteger(maxBitmapPixels, DEFAULT_MAX_BITMAP_PIXELS),
      );
    let _0x58f2b2 = Math['max'](
        0.0001,
        Math['min'](
          _0x4be4f7,
          _0xd73510 / _0x476364['width'],
          _0xd73510 / _0x476364['height'],
          Math['sqrt'](_0x6b79e1 / (_0x476364['width'] * _0x476364['height'])),
        ),
      ),
      _0x4076e8 = Math['max'](0x1, Math['min'](_0xd73510, Math['floor'](_0x476364['width'] * _0x58f2b2))),
      _0x1ad453 = Math['max'](0x1, Math['min'](_0xd73510, Math['floor'](_0x476364['height'] * _0x58f2b2)));
    if (_0x4076e8 * _0x1ad453 > _0x6b79e1) {
      const _0x18bf00 = Math['sqrt'](_0x6b79e1 / (_0x4076e8 * _0x1ad453));
      ((_0x4076e8 = Math['max'](0x1, Math['floor'](_0x4076e8 * _0x18bf00))),
        (_0x1ad453 = Math['max'](0x1, Math['floor'](_0x1ad453 * _0x18bf00))));
    }
    return (
      (_0x58f2b2 = Math['min'](_0x58f2b2, _0x4076e8 / _0x476364['width'], _0x1ad453 / _0x476364['height'])),
      _0x442475['resize'](_0x4076e8, _0x1ad453),
      Object['assign'](_0x466b59['style'], {
        display: 'block',
        height: formatCssNumber(_0x476364['height']) + 'px',
        left: formatCssNumber(_0x476364['left']) + 'px',
        top: formatCssNumber(_0x476364['top']) + 'px',
        width: formatCssNumber(_0x476364['width']) + 'px',
      }),
      _0x261037['setTransform'](0x1, 0x0, 0x0, 0x1, 0x0, 0x0),
      _0x261037['clearRect'](0x0, 0x0, _0x4076e8, _0x1ad453),
      _0x261037['setTransform'](
        _0x58f2b2,
        0x0,
        0x0,
        _0x58f2b2,
        _0x476364['left'] === 0x0 ? 0x0 : -_0x476364['left'] * _0x58f2b2,
        _0x476364['top'] === 0x0 ? 0x0 : -_0x476364['top'] * _0x58f2b2,
      ),
      (_0x261037['imageSmoothingEnabled'] = !![]),
      (_0x261037['imageSmoothingQuality'] = 'low'),
      {
        bitmapHeight: _0x1ad453,
        bitmapWidth: _0x4076e8,
        dpr: _0x2cd8c9,
        effectiveScale: _0x58f2b2,
        rasterScale: _0x58f2b2,
        renderScale: _0xe68c8c,
      }
    );
  }
  function _0x5ac41e(_0x5be49a) {
    const _0xa2f098 = _0x17729e?.['admittedSources'];
    return _0x5be49a['sources']['filter']((_0xfd51f8) => _0xa2f098?.['has'](_0xfd51f8));
  }
  function _0x436cc1(_0x29f62e, _0x324bc6) {
    const _0x20f983 = _0x5ac41e(_0x29f62e);
    for (const _0x4704c2 of _0x20f983) {
      const _0xbfa183 = _0x148a62['get'](_0x4704c2);
      if (_0xbfa183?.['status'] !== 'loaded') continue;
      (_0x30e53b(_0xbfa183), (_0x324bc6['cacheHitCount'] += 0x1));
      if (drawImageCover(_0x261037, _0xbfa183['image'], _0x29f62e))
        return (_0x43c99a['set'](_0x29f62e['id'], _0x4704c2), !![]);
    }
    return ![];
  }
  function _0x17a81c(_0x46db1f, _0x4b14f3) {
    if (_0x17729e?.['mediaLoadNodeIds'] && !_0x17729e['mediaLoadNodeIds']['has'](_0x46db1f['id'])) return ![];
    const _0x301ee8 = _0x17729e?.['admittedSources'],
      _0x12f5a3 = _0x5ac41e(_0x46db1f);
    for (const _0x56a2bb of _0x12f5a3) {
      const _0x2a1843 = _0x148a62['get'](_0x56a2bb);
      if (
        _0x2a1843?.['status'] === 'pending' ||
        _0x2a1843?.['status'] === 'ready' ||
        _0x2a1843?.['status'] === 'loaded'
      )
        return ![];
      if (_0x2a1843?.['status'] === 'error') continue;
      if (isCanvasImageDisplayLoadPending(_0x56a2bb)) return ![];
      _0x4b14f3['cacheMissCount'] += 0x1;
      if (_0x4b14f3['viewportBusy']) return ((_0x4b14f3['skippedBusyImageCount'] += 0x1), ![]);
      if (_0x4b14f3['newImageStartsRemaining'] <= 0x0) return ![];
      _0x4b14f3['newImageStartsRemaining'] -= 0x1;
      const _0x1495e8 = _0x14bce3(_0x56a2bb, _0x301ee8);
      if (_0x1495e8) _0x4b14f3['startedImageCount'] += 0x1;
      return ![];
    }
    return ![];
  }
  function _0x5df7ee(_0x399c91, _0x97a350) {
    if (_0x399c91['sources']['length'] === 0x0) return ![];
    if (_0x436cc1(_0x399c91, _0x97a350)) return !![];
    return (_0x17a81c(_0x399c91, _0x97a350), ![]);
  }
  function _0x558bb6(_0xd6f942, _0x143821, _0x2e8e44, _0x7937d6) {
    const _0x359c11 = _0xd6f942['invalid'] ? 0.38 : 0x1,
      _0xc05c65 = _0xd6f942['kind'] === 'image' || _0xd6f942['kind'] === 'video';
    _0x261037['globalAlpha'] = _0x359c11;
    !_0xc05c65 &&
      ((_0x261037['fillStyle'] = _0x143821['nodeFill']),
      _0x261037['fillRect'](_0xd6f942['x'], _0xd6f942['y'], _0xd6f942['width'], _0xd6f942['height']));
    const _0x2f250f = _0x5df7ee(_0xd6f942, _0x7937d6);
    if (!_0x2f250f) {
      if (_0xc05c65) return ((_0x261037['globalAlpha'] = 0x1), ![]);
      drawPlaceholder(_0x261037, _0xd6f942, _0x143821, _0x2e8e44, _0x359c11);
    }
    return (
      (_0x261037['globalAlpha'] = _0x359c11),
      (_0x261037['strokeStyle'] = _0x143821['nodeStroke']),
      (_0x261037['lineWidth'] = Math['max'](0x1 / _0x2e8e44, 0.5)),
      _0x261037['strokeRect'](_0xd6f942['x'], _0xd6f942['y'], _0xd6f942['width'], _0xd6f942['height']),
      drawNodeLabel(_0x261037, _0xd6f942, _0x143821, _0x2e8e44, _0x359c11),
      _0x2f250f
    );
  }
  function _0x1c3cb5(_0x1d62d2, _0x57b2cf) {
    const _0x5efdbf = Number(_0x57b2cf?.['maxNewImagesPerSync']),
      _0x2f4059 = Number['isFinite'](_0x5efdbf) && _0x5efdbf >= 0x0;
    return _0x2f4059
      ? Math['max'](0x0, Math['trunc'](_0x5efdbf))
      : _0x1d62d2['length'] >= DENSE_READY_REVEAL_NODE_COUNT
        ? _0x4ac2bf
        : _0x232f73;
  }
  function _0x4ce45a(_0x536b4d, _0x5ec276) {
    const _0x598d6f = _0x4c8919();
    return {
      cacheHitCount: 0x0,
      cacheMissCount: 0x0,
      newImageStartsRemaining: _0x5ec276
        ? 0x0
        : Math['min'](_0x536b4d, Math['max'](0x0, _0x536b4d - _0x598d6f)),
      skippedBusyImageCount: 0x0,
      startedImageCount: 0x0,
      viewportBusy: _0x5ec276,
    };
  }
  function _0x1ba124() {
    if (_0x1a0e80 || !_0x17729e || _0x17729e['viewportBusy'] || !_0x9b2b41 || !_0x466b59 || !_0x261037)
      return _0x333997;
    const { items: _0xa2d816, options: _0x1a503c, palette: _0x2f0ee3, worldBounds: _0x2f821a } = _0x17729e;
    if (!_0x2f821a || _0xa2d816['length'] === 0x0 || _0x333997['active'] !== !![]) return _0x4c18c3();
    _0x2dd307 += 0x1;
    const _0x32b8f = _0xa2d816['length'] >= DENSE_READY_REVEAL_NODE_COUNT ? _0x5e7309 : _0x27659c,
      _0x57269b = new Set(_0x31af67(_0x32b8f)),
      _0x5ef7d2 = Math['max'](0.0001, finiteNumber(_0x333997['rasterScale'], 0x1)),
      _0x263a91 = new Set(_0x333997['drawnMediaNodeIds'] || []),
      _0x237869 = [],
      _0x41cbdc = _0x4ce45a(0x0, ![]);
    if (_0x57269b['size'] > 0x0)
      for (const _0x1d57ce of _0xa2d816) {
        if (
          _0x263a91['has'](_0x1d57ce['id']) ||
          !_0x1d57ce['sources']['some']((_0x8198fd) => _0x57269b['has'](_0x8198fd))
        )
          continue;
        _0x558bb6(_0x1d57ce, _0x2f0ee3, _0x5ef7d2, _0x41cbdc) &&
          (_0x263a91['add'](_0x1d57ce['id']), _0x237869['push'](_0x1d57ce['id']));
      }
    const _0x175039 = _0x1c3cb5(_0xa2d816, _0x1a503c);
    _0x41cbdc['newImageStartsRemaining'] = Math['min'](_0x175039, Math['max'](0x0, _0x175039 - _0x4c8919()));
    for (const _0xbc78da of _0xa2d816) {
      if (_0x263a91['has'](_0xbc78da['id'])) continue;
      _0x17a81c(_0xbc78da, _0x41cbdc);
      if (_0x41cbdc['newImageStartsRemaining'] <= 0x0) break;
    }
    if (_0x237869['length'] > 0x0) _0x442475['present']();
    const _0x53fbe9 = _0x36fc99({
      ..._0x333997,
      drawnMediaNodeIds: [..._0x263a91],
      mediaDrawCount: _0x263a91['size'],
      placeholderCount: _0xa2d816['reduce'](
        (_0x43485f, _0x23be5c) =>
          _0x43485f +
          Number(
            _0x23be5c['kind'] !== 'image' &&
              _0x23be5c['kind'] !== 'video' &&
              !_0x263a91['has'](_0x23be5c['id']),
          ),
        0x0,
      ),
      revision: _0x2dd307,
      cacheHitCount: _0x41cbdc['cacheHitCount'],
      cacheMissCount: _0x41cbdc['cacheMissCount'],
      skippedBusyImageCount: _0x41cbdc['skippedBusyImageCount'],
      startedImageCount: _0x41cbdc['startedImageCount'],
      revealedImageCount: _0x57269b['size'],
    });
    if (_0x237869['length'] > 0x0 && typeof onMediaPresented === 'function')
      try {
        onMediaPresented({ nodeIds: _0x237869, revision: _0x2dd307 });
      } catch {}
    if (_0xf40a36()) _0x53ecf3();
    return _0x53fbe9;
  }
  function _0x4c18c3() {
    if (_0x1a0e80 || !_0x17729e || !_0x9b2b41 || !_0x466b59 || !_0x261037) return _0x333997;
    ((_0x2dd307 += 0x1), _0x43c99a['clear']());
    const { items: _0x23b8e1, options: _0x12d97e, palette: _0xb37c7e, worldBounds: _0x3114e5 } = _0x17729e,
      _0x49f0c2 = _0x23b8e1['length'] >= DENSE_READY_REVEAL_NODE_COUNT ? _0x5e7309 : _0x27659c,
      _0x28180e = _0x17729e['viewportBusy'] ? 0x0 : _0x31af67(_0x49f0c2)['length'];
    if (!_0x3114e5 || _0x23b8e1['length'] === 0x0)
      return (
        (_0x466b59['style']['display'] = 'none'),
        _0x8dfc37(),
        _0x36fc99({
          ...createEmptyStats(_0x2dd307, !![]),
          candidateCount: _0x17729e['candidateCount'],
          excludedNodeCount: _0x17729e['excludedNodeCount'],
        })
      );
    _0x5ca0cc();
    const _0x46d2c1 = _0x280b02(_0x3114e5, _0x12d97e),
      _0x4a8198 = _0x1c3cb5(_0x23b8e1, _0x12d97e),
      _0xa8df38 = _0x4ce45a(_0x4a8198, _0x17729e['viewportBusy']),
      _0x1a6ff0 = [],
      _0x4c355a = [];
    let _0x11c786 = 0x0;
    _0x261037['lineWidth'] = Math['max'](0x1 / _0x46d2c1['rasterScale'], 0.5);
    for (const _0x13e0bf of _0x23b8e1) {
      const _0x24fe29 = _0x558bb6(_0x13e0bf, _0xb37c7e, _0x46d2c1['rasterScale'], _0xa8df38);
      if (_0x24fe29) _0x4c355a['push'](_0x13e0bf['id']);
      else _0x13e0bf['kind'] !== 'image' && _0x13e0bf['kind'] !== 'video' && (_0x11c786 += 0x1);
      _0x1a6ff0['push'](_0x13e0bf['id']);
    }
    _0x442475['present']();
    const _0x177221 = _0x36fc99({
      active: _0x1a6ff0['length'] > 0x0,
      supported: !![],
      drawnNodeIds: _0x1a6ff0,
      drawnMediaNodeIds: _0x4c355a,
      drawnNodeCount: _0x1a6ff0['length'],
      mediaDrawCount: _0x4c355a['length'],
      placeholderCount: _0x11c786,
      candidateCount: _0x17729e['candidateCount'],
      excludedNodeCount: _0x17729e['excludedNodeCount'],
      bitmapWidth: _0x46d2c1['bitmapWidth'],
      bitmapHeight: _0x46d2c1['bitmapHeight'],
      cssWidth: _0x3114e5['width'],
      cssHeight: _0x3114e5['height'],
      dpr: _0x46d2c1['dpr'],
      renderScale: _0x46d2c1['renderScale'],
      effectiveScale: _0x46d2c1['effectiveScale'],
      rasterScale: _0x46d2c1['rasterScale'],
      revision: _0x2dd307,
      worldBounds: { ..._0x3114e5 },
      cacheHitCount: _0xa8df38['cacheHitCount'],
      cacheMissCount: _0xa8df38['cacheMissCount'],
      skippedBusyImageCount: _0xa8df38['skippedBusyImageCount'],
      startedImageCount: _0xa8df38['startedImageCount'],
      revealedImageCount: _0x28180e,
    });
    if (!_0x17729e['viewportBusy'] && _0xf40a36()) _0x53ecf3();
    return _0x177221;
  }
  function _0x4a003b(_0xfb878c, _0x367563, _0x3c9609, _0x3115c5 = {}) {
    const _0x34f554 =
      _0x3115c5?.['viewportBusy'] === !![] &&
      _0x3115c5?.['reuseWhileBusy'] === !![] &&
      _0x3115c5?.['forceRender'] !== !![] &&
      _0x333997['active'] &&
      (Number(_0x3c9609?.['size']) > 0x0 || Number(_0x3c9609?.['length']) > 0x0);
    if (_0x34f554 && _0x5df0b3(_0xfb878c)) {
      const _0x14a79a = resolveMediaLoadingBusy(_0x3115c5);
      _0x17729e && (_0x17729e['viewportBusy'] = _0x14a79a);
      if (_0x14a79a) _0x426b70();
      else {
        if (_0xf40a36()) _0x53ecf3();
      }
      return _0x333997;
    }
    _0x426b70();
    const _0x11157f = _0x2096aa(_0x367563, _0x3c9609, _0x3115c5);
    if ((!_0x11157f['worldBounds'] || _0x11157f['items']['length'] === 0x0) && !_0x466b59)
      return (
        (_0x2dd307 += 0x1),
        (_0x17729e = _0x11157f),
        _0x36fc99({
          ...createEmptyStats(_0x2dd307, !![]),
          candidateCount: _0x11157f['candidateCount'],
          excludedNodeCount: _0x11157f['excludedNodeCount'],
        })
      );
    if (!_0x5df0b3(_0xfb878c))
      return (
        (_0x2dd307 += 0x1),
        (_0x17729e = null),
        _0x36fc99({
          ...createEmptyStats(_0x2dd307, ![]),
          candidateCount: _0x11157f['candidateCount'],
          excludedNodeCount: _0x11157f['excludedNodeCount'],
        })
      );
    const _0x10cc64 =
      _0x333997['active'] &&
      _0x3115c5?.['forceRender'] !== !![] &&
      canReuseRasterPaint(_0x17729e, _0x11157f) &&
      _0x11157f['items']['every']((_0x19074c) => {
        if (!_0x43c99a['has'](_0x19074c['id'])) return !![];
        const _0x3391f2 = _0x19074c['sources']['find'](
          (_0x4dcd6a) =>
            _0x11157f['admittedSources']['has'](_0x4dcd6a) &&
            ['loaded', 'ready']['includes'](_0x148a62['get'](_0x4dcd6a)?.['status']),
        );
        return _0x3391f2 === _0x43c99a['get'](_0x19074c['id']);
      });
    _0x17729e = _0x11157f;
    if (_0x10cc64) return _0x1ba124();
    return _0x4c18c3();
  }
  function _0x117d04(_0x3528a3) {
    const _0x1aa1e1 = String(_0x3528a3 || '')['trim']();
    if (!_0x1aa1e1 || !_0x17729e) return ![];
    const _0x4f891b = _0x17729e['items'] || [],
      _0x5baabd = _0x4f891b['filter']((_0xa1e995) => _0xa1e995['id'] !== _0x1aa1e1);
    if (_0x5baabd['length'] === _0x4f891b['length']) return ![];
    return (
      _0x426b70(),
      (_0x17729e = {
        ..._0x17729e,
        excludedNodeCount: Number(_0x17729e['excludedNodeCount'] || 0x0) + 0x1,
        items: _0x5baabd,
        worldBounds: computeRasterWorldBounds(_0x5baabd, _0x17729e['options']),
      }),
      _0x4c18c3(),
      !![]
    );
  }
  function _0x5bff7c(_0x5503a3) {
    const _0x30887a = String(_0x5503a3 || '')['trim']();
    if (
      !_0x30887a ||
      _0x1a0e80 ||
      !_0x466b59 ||
      !_0x9b2b41 ||
      !_0x17729e ||
      !_0x333997?.['worldBounds'] ||
      typeof documentRef?.['createElement'] !== 'function'
    )
      return null;
    const _0x106ca5 = _0x17729e['items']?.['find']?.((_0x1e6df8) => _0x1e6df8['id'] === _0x30887a);
    if (!_0x106ca5) return null;
    const _0xdd6f28 = _0x106ca5['kind'] === 'image' || _0x106ca5['kind'] === 'video';
    if (_0xdd6f28 && !(_0x333997['drawnMediaNodeIds'] || [])['includes'](_0x30887a)) return null;
    const _0x32cfdc = _0x333997['worldBounds'],
      _0x508648 = Math['max'](0.0001, finiteNumber(_0x333997['effectiveScale'], 0x1)),
      _0xa32265 = (_0x106ca5['x'] - _0x32cfdc['left']) * _0x508648,
      _0x353995 = (_0x106ca5['y'] - _0x32cfdc['top']) * _0x508648,
      _0x179e35 = _0x106ca5['width'] * _0x508648,
      _0x22deab = _0x106ca5['height'] * _0x508648,
      _0x13ebf1 = Math['max'](0x0, _0xa32265),
      _0x287ccc = Math['max'](0x0, _0x353995),
      _0x2d5c7e = Math['min'](_0x466b59['width'], _0xa32265 + _0x179e35),
      _0x235c64 = Math['min'](_0x466b59['height'], _0x353995 + _0x22deab),
      _0x247ee4 = _0x2d5c7e - _0x13ebf1,
      _0x27d7b5 = _0x235c64 - _0x287ccc;
    if (!(_0x247ee4 > 0x0) || !(_0x27d7b5 > 0x0)) return null;
    const _0x2aa705 = documentRef['createElement']('canvas');
    ((_0x2aa705['width'] = Math['max'](0x1, Math['ceil'](_0x179e35))),
      (_0x2aa705['height'] = Math['max'](0x1, Math['ceil'](_0x22deab))));
    const _0x310d52 = _0x2aa705['getContext']?.('2d', { alpha: !![] }) || null;
    if (!_0x310d52 || typeof _0x310d52['drawImage'] !== 'function') return null;
    const _0x208792 = _0x2aa705['width'] / _0x179e35,
      _0x55c3a6 = _0x2aa705['height'] / _0x22deab;
    try {
      _0x310d52['drawImage'](
        _0x466b59,
        _0x13ebf1,
        _0x287ccc,
        _0x247ee4,
        _0x27d7b5,
        (_0x13ebf1 - _0xa32265) * _0x208792,
        (_0x287ccc - _0x353995) * _0x55c3a6,
        _0x247ee4 * _0x208792,
        _0x27d7b5 * _0x55c3a6,
      );
    } catch {
      return null;
    }
    return {
      canvas: _0x2aa705,
      height: _0x106ca5['height'],
      kind: _0x106ca5['kind'],
      label: _0x106ca5['label'],
      nodeId: _0x30887a,
      revision: _0x333997['revision'],
      sources: [..._0x106ca5['sources']],
      width: _0x106ca5['width'],
    };
  }
  function _0x37e0dc(_0x1248a7) {
    if (_0x1a0e80 || !_0x17729e) return _0x333997;
    const _0x5de0ed = _0x17729e['viewportBusy'];
    _0x17729e['viewportBusy'] = _0x1248a7 === !![];
    if (_0x17729e['viewportBusy']) _0x426b70();
    else _0x5de0ed && _0xf40a36() ? _0x1ba124() : _0x53ecf3();
    return _0x36fc99(_0x333997);
  }
  function _0x549efd(_0x3546a7 = {}) {
    if (_0x1a0e80) return _0x333997;
    let _0x51497e = null,
      _0x17d611 = _0x407d51;
    if (_0x3546a7 && typeof _0x3546a7[Symbol['iterator']] === 'function')
      _0x51497e = normalizeIdSet(_0x3546a7);
    else
      _0x3546a7 &&
        typeof _0x3546a7 === 'object' &&
        (Object['prototype']['hasOwnProperty']['call'](_0x3546a7, 'keepSources') &&
          (_0x51497e = normalizeIdSet(_0x3546a7['keepSources'])),
        (_0x17d611 = Math['max'](0x0, Math['trunc'](finiteNumber(_0x3546a7['maxEntries'], _0x407d51)))));
    let _0x37eae0 = ![];
    for (const [_0x379076, _0x401fc1] of Array['from'](_0x148a62['entries']())) {
      ((_0x51497e && !_0x51497e['has'](_0x379076)) || (!_0x51497e && _0x401fc1['status'] === 'error')) &&
        (_0x37eae0 = _0xdafbb5(_0x379076) || _0x37eae0);
    }
    while (_0x148a62['size'] > _0x17d611) {
      const _0x1c7bdb = _0x172065();
      if (!_0x1c7bdb) break;
      _0x37eae0 = !![];
    }
    if (_0x37eae0 && _0x17729e && _0x9b2b41) {
      const _0x3a2dc3 = _0x17729e['viewportBusy'];
      _0x17729e['viewportBusy'] = !![];
      const _0x192f4e = _0x4c18c3();
      return ((_0x17729e['viewportBusy'] = _0x3a2dc3), _0x192f4e);
    }
    return _0x36fc99(_0x333997);
  }
  function _0x27f096() {
    if (_0x1a0e80) return;
    ((_0x1a0e80 = !![]), _0x5ca0cc(), _0x426b70(), (_0x17729e = null));
    for (const _0x4dd5e1 of _0x148a62['values']()) _0x3b3533(_0x4dd5e1);
    (_0x148a62['clear'](), _0x43c99a['clear'](), (_0x2dd307 += 0x1));
    const _0x1181ec = _0x466b59;
    ((_0x333997 = { ...createEmptyStats(_0x2dd307, _0x9b2b41), cacheLimit: _0x407d51 }),
      _0x1181ec &&
        ((_0x1181ec['__aicanvasRasterPreviewStats'] = _0x333997),
        (_0x1181ec['__aicanvasRasterPreviewRevealItems'] = []),
        (_0x1181ec['width'] = 0x1),
        (_0x1181ec['height'] = 0x1),
        (_0x1181ec['style']['display'] = 'none'),
        _0x1181ec['remove']?.()),
      _0x442475?.['release'](),
      (_0x442475 = null),
      (_0x466b59 = null),
      (_0x261037 = null));
  }
  function _0x4d4fb4() {
    return _0x333997;
  }
  return {
    sync: _0x4a003b,
    captureNodeFrame: _0x5bff7c,
    excludeNode: _0x117d04,
    setMediaLoadingBusy: _0x37e0dc,
    prune: _0x549efd,
    destroy: _0x27f096,
    getStats: _0x4d4fb4,
  };
}
