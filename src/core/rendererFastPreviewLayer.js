import { hasPresentedVideoFrame } from '../services/videoFramePresentation.js';
import { isTaskCancelled, isTaskFailed } from './generationTaskUiState.js';
import { resolveCanvasImageSourceUrl, resolveCanvasVideoDisplayUrl } from '../services/canvasMediaLocalService.js';
import { cancelQueuedCanvasImagePreloads, forgetCanvasImageDisplayLoad, isCanvasImageDisplayLoadTracked, isCanvasImagePreloadCoolingDown, isCanvasImagePreloadPending, isCanvasImagePreloadSharedImage, preloadCanvasImage } from '../modules/canvasMediaScheduler.js';
import { toCanvasLocalUrl } from '../services/canvasMediaLocalService.js';
const FAST_PREVIEW_NODE_COUNT_THRESHOLD = 48,
  FAST_PREVIEW_CANDIDATE_THRESHOLD = 16,
  FAST_PREVIEW_NODE_PER_SYNC_LIMIT = 0x104,
  FAST_PREVIEW_MEDIA_PER_SYNC_LIMIT = 240,
  FAST_PREVIEW_NON_MEDIA_PER_SYNC_LIMIT = 48,
  FAST_PREVIEW_LAYER_PADDING = 96;
function toNumber(_0x309daa, _0x2b22a0 = 0) {
  const _0x3e8917 = Number(_0x309daa);
  return Number.isFinite(_0x3e8917) ? _0x3e8917 : _0x2b22a0;
}
function getPreviewKind(_0xf96b6c = {}) {
  const _0x1020bb = String(_0xf96b6c.type || '').toLowerCase();
  if (_0x1020bb.includes('group')) return 'group';
  if (_0x1020bb.includes('video') || _0x1020bb.includes('media-clip')) return 'video';
  if (_0x1020bb.includes('image')) return 'image';
  if (_0x1020bb.includes('text') || _0x1020bb.includes('comment')) return 'text';
  return 'node';
}
function isWebPreviewNode(_0x20ee83 = {}) {
  return (
    String(_0x20ee83?.type || '')
      .trim()
      .toLowerCase() === 'web-preview'
  );
}
function getPreviewText(_0x217560 = {}, _0x4aee78 = 'node') {
  const _0x41f074 =
    _0x4aee78 === 'image'
      ? 'Image'
      : _0x4aee78 === 'video'
        ? 'Video'
        : _0x4aee78 === 'text'
          ? 'Text'
          : 'Node';
  return String(_0x217560.name || _0x217560.title || _0x217560.prompt || _0x217560.text || _0x41f074)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, _0x4aee78 === 'text' ? 160 : 48);
}
function getPrimaryListItem(_0xe6d201, _0x1d4166 = 0) {
  if (!Array.isArray(_0xe6d201) || _0xe6d201.length === 0) return null;
  const _0x8f8b1a = Math.max(0, Math.trunc(Number(_0x1d4166) || 0));
  return _0xe6d201[_0x8f8b1a] || _0xe6d201[0] || null;
}
function firstLocalPreviewUrl(_0x11c494 = []) {
  for (const _0x59f3cd of _0x11c494) {
    const _0xefd3bf = toCanvasLocalUrl(_0x59f3cd);
    if (_0xefd3bf) return _0xefd3bf;
  }
  return '';
}
function uniquePreviewUrls(_0x10fb44 = []) {
  const _0x5a3400 = [],
    _0x3e2c15 = new Set();
  for (const _0x21e2d4 of _0x10fb44) {
    const _0x8a0fac = String(_0x21e2d4 || '').trim();
    if (!_0x8a0fac || _0x3e2c15.has(_0x8a0fac)) continue;
    (_0x3e2c15.add(_0x8a0fac), _0x5a3400.push(_0x8a0fac));
  }
  return _0x5a3400;
}
function isLikelyImagePreviewUrl(_0x57f96e) {
  const _0xe405aa = String(_0x57f96e || '').trim();
  if (!_0xe405aa) return false;
  if (/^(data:image\/|blob:)/i.test(_0xe405aa)) return true;
  return /\.(?:png|jpe?g|webp|gif|avif|bmp)(?:[?#].*)?$/i.test(_0xe405aa);
}
function getExplicitImagePreviewUrls(_0x1cef1d = {}) {
  return (
    (_0x1cef1d = _0x1cef1d && typeof _0x1cef1d === 'object' ? _0x1cef1d : {}),
    [
      firstLocalPreviewUrl([
        _0x1cef1d.thumbLocalPath,
        _0x1cef1d.previewLocalPath,
        _0x1cef1d.thumbnailLocalPath,
        _0x1cef1d.thumbUrl,
        _0x1cef1d.previewUrl,
        _0x1cef1d.thumbnailUrl,
      ]),
      firstLocalPreviewUrl([_0x1cef1d.displayLocalPath, _0x1cef1d.displayUrl, _0x1cef1d.imageUrl]),
    ]
  );
}
function getExplicitVideoPreviewUrls(_0x4243f1 = {}) {
  return (
    (_0x4243f1 = _0x4243f1 && typeof _0x4243f1 === 'object' ? _0x4243f1 : {}),
    [
      _0x4243f1.posterLocalPath,
      _0x4243f1.thumbLocalPath,
      _0x4243f1.previewLocalPath,
      _0x4243f1.thumbnailLocalPath,
      _0x4243f1.videoThumbSrc,
      _0x4243f1.posterUrl,
      _0x4243f1.thumbUrl,
      _0x4243f1.previewUrl,
      _0x4243f1.thumbnailUrl,
    ]
      .map((_0x7b4e0d) => toCanvasLocalUrl(_0x7b4e0d))
      .filter(isLikelyImagePreviewUrl)
  );
}
function getPreviewMediaUrls(_0x596a5c = {}, _0x2c440a = 'node') {
  if (_0x2c440a === 'image') {
    const _0x41a59a = getPrimaryListItem(_0x596a5c.images, _0x596a5c.mainImageIndex);
    return uniquePreviewUrls([
      ...getExplicitImagePreviewUrls(_0x596a5c),
      ...getExplicitImagePreviewUrls(_0x41a59a),
    ]);
  }
  if (_0x2c440a === 'video') {
    const _0x4be464 = getPrimaryListItem(_0x596a5c.videos, _0x596a5c.mainVideoIndex);
    return uniquePreviewUrls([
      ...getExplicitVideoPreviewUrls(_0x4be464),
      ...getExplicitVideoPreviewUrls(_0x596a5c),
    ]);
  }
  return [];
}
function shouldUseFastPreviewLayer(_0x4b6b1d, _0x2088ea) {
  const _0x997569 = Object.keys(_0x4b6b1d || {}).length,
    _0x405169 = _0x2088ea instanceof Set ? _0x2088ea.size : 0;
  return _0x997569 >= FAST_PREVIEW_NODE_COUNT_THRESHOLD || _0x405169 >= FAST_PREVIEW_CANDIDATE_THRESHOLD;
}
function createEmptyStats() {
  return {
    fastPreviewCount: 0,
    visibleFastPreviewCount: 0,
    previewWithMediaCount: 0,
    deferredMountedWithPreviewCount: 0,
  };
}
function createPreviewEl(_0x3c2b92) {
  const _0x44b13d = document.createElement('div');
  ((_0x44b13d.className = 'v2-fast-preview-node'), (_0x44b13d.dataset.nodeId = _0x3c2b92));
  const _0x13ab79 = document.createElement('div');
  return ((_0x13ab79.className = 'v2-fast-preview-label'), _0x44b13d.appendChild(_0x13ab79), _0x44b13d);
}
function getPreviewGeometry(_0x3e6710 = {}) {
  const _0xfcb4ce = toNumber(_0x3e6710.x, 0),
    _0x943bc0 = toNumber(_0x3e6710.y, 0),
    _0x24a451 = Math.max(1, toNumber(_0x3e6710.width, 160)),
    _0x125184 = Math.max(1, toNumber(_0x3e6710.height, 120));
  return { x: _0xfcb4ce, y: _0x943bc0, width: _0x24a451, height: _0x125184 };
}
function setPreviewMediaSrc(_0x26bfd1, _0x442dc0, _0x9cfca6) {
  const _0x10c9a8 = _0x442dc0[_0x9cfca6] || '';
  if (!_0x10c9a8) return false;
  return (
    (_0x26bfd1.dataset.srcIndex = String(_0x9cfca6)),
    _0x26bfd1.getAttribute?.('src') !== _0x10c9a8 &&
      _0x26bfd1.src !== _0x10c9a8 &&
      (_0x26bfd1.src = _0x10c9a8),
    true
  );
}
function syncPreviewMedia(_0x4d45ba, _0x1023d3, _0x3c02a9) {
  let _0x466fee = _0x4d45ba.querySelector('.v2-fast-preview-media');
  const _0x36750e = uniquePreviewUrls(Array.isArray(_0x1023d3) ? _0x1023d3 : [_0x1023d3]);
  if (_0x36750e.length === 0) {
    (_0x466fee?.remove?.(), delete _0x4d45ba.dataset.hasMedia, delete _0x4d45ba.dataset.previewSrcCount);
    return;
  }
  if (!_0x466fee) {
    ((_0x466fee = document.createElement('img')),
      (_0x466fee.className = 'v2-fast-preview-media'),
      (_0x466fee.decoding = 'async'),
      (_0x466fee.loading = 'eager'),
      (_0x466fee.alt = ''));
    try {
      _0x466fee.fetchPriority = 'high';
    } catch {}
    if (typeof _0x4d45ba.insertBefore === 'function')
      _0x4d45ba.insertBefore(_0x466fee, _0x4d45ba.firstChild || null);
    else
      typeof _0x4d45ba.prepend === 'function'
        ? _0x4d45ba.prepend(_0x466fee)
        : _0x4d45ba.appendChild(_0x466fee);
  }
  ((_0x466fee._previewSources = _0x36750e),
    (_0x466fee.onerror = () => {
      const _0x455a67 = Math.max(0, Number(_0x466fee.dataset?.srcIndex) || 0),
        _0x44b99d = _0x455a67 + 1;
      !setPreviewMediaSrc(_0x466fee, _0x466fee._previewSources || [], _0x44b99d) &&
        (_0x466fee.onerror = null);
    }),
    setPreviewMediaSrc(_0x466fee, _0x36750e, 0),
    (_0x466fee.alt = _0x3c02a9 || ''),
    (_0x4d45ba.dataset.hasMedia = '1'),
    (_0x4d45ba.dataset.previewSrcCount = String(_0x36750e.length)));
}
function syncPreviewEl(
  _0x6a524a,
  _0x20172d,
  {
    kind: _0x145904,
    text: _0x466d29,
    sources: _0x1fb84f,
    geometry: _0x588993,
    offsetX: offsetX = 0,
    offsetY: offsetY = 0,
  },
) {
  const {
      x: _0x20f680,
      y: _0x3d2656,
      width: _0x207ee1,
      height: _0x1cbe5d,
    } = _0x588993 || getPreviewGeometry(_0x20172d),
    _0x50ff32 = _0x20f680 - offsetX,
    _0x57a208 = _0x3d2656 - offsetY,
    _0x328f75 = Array.isArray(_0x1fb84f) ? _0x1fb84f.join('>') : String(_0x1fb84f || ''),
    _0xe79b4b =
      _0x50ff32 +
      ',' +
      _0x57a208 +
      ',' +
      _0x207ee1 +
      ',' +
      _0x1cbe5d +
      '|' +
      _0x145904 +
      '|' +
      _0x466d29 +
      '|' +
      _0x328f75;
  if (_0x6a524a._previewSig === _0xe79b4b) return;
  (Object.assign(_0x6a524a.style, {
    width: _0x207ee1 + 'px',
    height: _0x1cbe5d + 'px',
    transform: 'translate(' + _0x50ff32 + 'px, ' + _0x57a208 + 'px)',
  }),
    (_0x6a524a.className = 'v2-fast-preview-node v2-fast-preview-node--' + _0x145904),
    (_0x6a524a.dataset.kind = _0x145904));
  const _0x33ebad = _0x6a524a.querySelector('.v2-fast-preview-label');
  if (_0x33ebad) _0x33ebad.textContent = _0x466d29;
  (syncPreviewMedia(_0x6a524a, _0x1fb84f, _0x466d29), (_0x6a524a._previewSig = _0xe79b4b));
}
function syncLayerBounds(_0x22e7d0, _0x21578b) {
  if (!_0x22e7d0 || !Array.isArray(_0x21578b) || _0x21578b.length === 0) return null;
  let _0x495b4f = Infinity,
    _0x28b517 = Infinity,
    _0x3b6a02 = -Infinity,
    _0x2fc5d0 = -Infinity;
  for (const _0x487d1a of _0x21578b) {
    const _0x33287f = _0x487d1a?.geometry;
    if (!_0x33287f) continue;
    ((_0x495b4f = Math.min(_0x495b4f, _0x33287f.x)),
      (_0x28b517 = Math.min(_0x28b517, _0x33287f.y)),
      (_0x3b6a02 = Math.max(_0x3b6a02, _0x33287f.x + _0x33287f.width)),
      (_0x2fc5d0 = Math.max(_0x2fc5d0, _0x33287f.y + _0x33287f.height)));
  }
  if (![_0x495b4f, _0x28b517, _0x3b6a02, _0x2fc5d0].every(Number.isFinite)) return null;
  const _0x231cda = _0x495b4f - FAST_PREVIEW_LAYER_PADDING,
    _0x3c5db5 = _0x28b517 - FAST_PREVIEW_LAYER_PADDING,
    _0x193ab7 = Math.max(1, _0x3b6a02 - _0x495b4f + FAST_PREVIEW_LAYER_PADDING * 2),
    _0x3a2c9d = Math.max(1, _0x2fc5d0 - _0x28b517 + FAST_PREVIEW_LAYER_PADDING * 2),
    _0x234523 = _0x231cda + ',' + _0x3c5db5 + ',' + _0x193ab7 + ',' + _0x3a2c9d;
  return (
    _0x22e7d0._previewBoundsSig !== _0x234523 &&
      (Object.assign(_0x22e7d0.style, {
        left: _0x231cda + 'px',
        top: _0x3c5db5 + 'px',
        width: _0x193ab7 + 'px',
        height: _0x3a2c9d + 'px',
      }),
      (_0x22e7d0._previewBoundsSig = _0x234523)),
    { offsetX: _0x231cda, offsetY: _0x3c5db5 }
  );
}
export function createRendererFastPreviewLayer({ getWrapper: _0x42cedb, isMounted: _0x175ca4 } = {}) {
  const _0x4ca13a = new Map(),
    _0x4146ee = new Set();
  let _0x781d1 = null,
    _0x591a80 = createEmptyStats();
  function _0x46ba9a(_0x2d248b) {
    if (!_0x2d248b) return null;
    return (
      _0x781d1 && _0x781d1.parentNode !== _0x2d248b && (_0x781d1.remove?.(), (_0x781d1 = null)),
      !_0x781d1 &&
        ((_0x781d1 = document.createElement('div')),
        (_0x781d1.className = 'v2-fast-preview-layer'),
        (_0x781d1.dataset.role = 'fast-preview-layer')),
      !_0x781d1.isConnected &&
        (typeof _0x2d248b.prepend === 'function'
          ? _0x2d248b.prepend(_0x781d1)
          : _0x2d248b.appendChild(_0x781d1)),
      _0x781d1
    );
  }
  function _0x41b48d() {
    (_0x4ca13a.forEach((_0x158485) => _0x158485?.remove?.()),
      _0x4ca13a.clear(),
      _0x4146ee.clear(),
      _0x781d1?.remove?.(),
      (_0x781d1 = null),
      (_0x591a80 = createEmptyStats()));
  }
  function _0x1dff3a() {
    const _0x4f94dc = createEmptyStats();
    for (const [_0x14439a, _0x1203ab] of _0x4ca13a.entries()) {
      _0x4f94dc.fastPreviewCount += 1;
      if (_0x1203ab?.isConnected !== false) _0x4f94dc.visibleFastPreviewCount += 1;
      if (_0x1203ab?.dataset?.hasMedia === '1') _0x4f94dc.previewWithMediaCount += 1;
      const _0x638b94 = _0x42cedb?.(_0x14439a);
      _0x175ca4?.(_0x14439a) &&
        _0x638b94?.isConnected !== false &&
        (_0x638b94?.classList?.contains?.('v2-node-detail-deferred') ||
          _0x638b94?.dataset?.detailStage === 'deferred') &&
        (_0x4f94dc.deferredMountedWithPreviewCount += 1);
    }
    return ((_0x591a80 = _0x4f94dc), _0x4f94dc);
  }
  function _0x4df134(_0x16f636) {
    _0x4146ee.delete(String(_0x16f636 || ''));
    const _0x4d555f = _0x4ca13a.get(_0x16f636);
    if (!_0x4d555f) return;
    (_0x4d555f.remove?.(), _0x4ca13a.delete(_0x16f636));
    if (_0x4ca13a.size === 0) _0x41b48d();
    else _0x1dff3a();
  }
  function _0xe510b(_0x1169d6) {
    if (!_0x1169d6) return false;
    if (_0x1169d6.classList?.contains?.('selected') || _0x1169d6.classList?.contains?.('v2-selected'))
      return true;
    const _0x1dbdb7 = typeof document !== 'undefined' ? document.activeElement : null;
    return !!(_0x1dbdb7 && _0x1169d6.contains?.(_0x1dbdb7));
  }
  function _0x40a673(_0x3f769e, _0x38c57b, { kind: kind = '', hasMedia: hasMedia = false } = {}) {
    const _0x23dbe4 = _0x4146ee.has(String(_0x3f769e || '')),
      _0x37c4ce = _0x42cedb?.(_0x3f769e),
      _0x212612 = !!_0x37c4ce && _0x175ca4?.(_0x3f769e) && _0x37c4ce.isConnected !== false;
    if (_0x38c57b?.has?.(_0x3f769e) || _0xe510b(_0x37c4ce)) return _0x23dbe4 && hasMedia;
    if (_0x23dbe4) return hasMedia;
    if (!_0x212612) return true;
    if ((kind === 'image' || kind === 'video') && !hasMedia) return false;
    if (
      _0x37c4ce.classList?.contains?.('v2-node-detail-deferred') ||
      _0x37c4ce.dataset?.detailStage === 'deferred'
    )
      return true;
    return false;
  }
  function _0x25d77a(_0x17dcfd) {
    if (!_0x17dcfd) return;
    _0x4146ee.add(String(_0x17dcfd));
  }
  function _0x2a8132(_0x32a89b) {
    if (!_0x32a89b) return;
    (_0x4146ee.delete(String(_0x32a89b)), _0x4df134(_0x32a89b));
  }
  function _0x38ca70(_0x520c9d, _0x5b3294, _0x5182b8, _0x386908) {
    if (!shouldUseFastPreviewLayer(_0x5b3294, _0x5182b8)) return _0x41b48d();
    const _0x57cbd3 = [];
    let _0x54fd51 = FAST_PREVIEW_NON_MEDIA_PER_SYNC_LIMIT;
    for (const _0x5f13f7 of Object.values(_0x5b3294 || {})) {
      const _0x39c1a6 = String(_0x5f13f7?.id || '');
      if (!_0x39c1a6 || !_0x5182b8?.has?.(_0x39c1a6)) continue;
      if (isWebPreviewNode(_0x5f13f7)) continue;
      const _0x282057 = getPreviewKind(_0x5f13f7),
        _0x482013 = getPreviewMediaUrls(_0x5f13f7, _0x282057);
      if (!_0x40a673(_0x39c1a6, _0x386908, { kind: _0x282057, hasMedia: _0x482013.length > 0 })) continue;
      if (_0x282057 !== 'image' && _0x282057 !== 'video') {
        if (_0x54fd51 <= 0) continue;
        _0x54fd51 -= 1;
      }
      _0x57cbd3.push({
        node: _0x5f13f7,
        nodeId: _0x39c1a6,
        kind: _0x282057,
        sources: _0x482013,
        geometry: getPreviewGeometry(_0x5f13f7),
      });
      if (_0x57cbd3.length >= FAST_PREVIEW_NODE_PER_SYNC_LIMIT) break;
    }
    if (_0x57cbd3.length === 0) return _0x41b48d();
    const _0x40f22c = _0x46ba9a(_0x520c9d);
    if (!_0x40f22c) return;
    const _0x2d13d0 = syncLayerBounds(_0x40f22c, _0x57cbd3) || { offsetX: 0, offsetY: 0 },
      _0x42ef9d = new Set();
    let _0x499948 = FAST_PREVIEW_MEDIA_PER_SYNC_LIMIT;
    for (const {
      node: _0x4f6040,
      nodeId: _0xc6e290,
      kind: _0x457713,
      sources: _0x3dcc58,
      geometry: _0x12f788,
    } of _0x57cbd3) {
      _0x42ef9d.add(_0xc6e290);
      let _0x493a3a = _0x4ca13a.get(_0xc6e290);
      if (!_0x493a3a)
        ((_0x493a3a = createPreviewEl(_0xc6e290)),
          _0x4ca13a.set(_0xc6e290, _0x493a3a),
          _0x40f22c.appendChild(_0x493a3a));
      else _0x493a3a.parentNode !== _0x40f22c && _0x40f22c.appendChild(_0x493a3a);
      const _0x5914c8 = _0x499948 > 0 ? _0x3dcc58 : [];
      if (_0x5914c8.length > 0) _0x499948 -= 1;
      syncPreviewEl(_0x493a3a, _0x4f6040, {
        kind: _0x457713,
        text: getPreviewText(_0x4f6040, _0x457713),
        sources: _0x5914c8,
        geometry: _0x12f788,
        offsetX: _0x2d13d0.offsetX,
        offsetY: _0x2d13d0.offsetY,
      });
    }
    for (const _0x53e7e4 of Array.from(_0x4ca13a.keys())) {
      if (!_0x42ef9d.has(_0x53e7e4)) _0x4df134(_0x53e7e4);
    }
    _0x1dff3a();
  }
  return {
    clear: _0x41b48d,
    getStats: () => ({ ..._0x591a80 }),
    releaseNode: _0x2a8132,
    removeNode: _0x4df134,
    retainNode: _0x25d77a,
    sync: _0x38ca70,
  };
}

const FAST_PREVIEW_MEDIA_SRC_BATCH_SIZE = 0xc;
const FAST_PREVIEW_FALLBACK_NODE_CREATE_BATCH_SIZE = 0x50;
const FAST_PREVIEW_LARGE_CANDIDATE_COUNT = 0xb4;
const FAST_PREVIEW_HUGE_CANDIDATE_COUNT = 0x168;
const FAST_PREVIEW_LARGE_MEDIA_SRC_BATCH_SIZE = 0xa;
const FAST_PREVIEW_HUGE_MEDIA_SRC_BATCH_SIZE = 0x8;
const FAST_PREVIEW_BUSY_MEDIA_SRC_BATCH_SIZE = 0x8;
const FAST_PREVIEW_VIDEO_MEDIA_SRC_BATCH_SIZE = 0x8;
const FAST_PREVIEW_LARGE_VIDEO_MEDIA_SRC_BATCH_SIZE = 0x6;
const FAST_PREVIEW_HUGE_VIDEO_MEDIA_SRC_BATCH_SIZE = 0x4;
const FAST_PREVIEW_BUSY_VIDEO_MEDIA_SRC_BATCH_SIZE = 0x2;
const FAST_PREVIEW_BUSY_HINT_TTL_MS = 0xb4;
const FAST_PREVIEW_BUSY_MEDIA_SRC_RETRY_MS = 0x40;
const FAST_PREVIEW_MEDIA_PRELOAD_PRIORITY = 0x2d;
const FAST_PREVIEW_LOW_PRIORITY_MEDIA_PRELOAD_PRIORITY = 0x19;
const FAST_PREVIEW_BUSY_MEDIA_PRELOAD_PRIORITY = 0x14;
const FAST_PREVIEW_VIEWPORT_BUSY_PRELOAD_CANCEL_PRIORITY_LIMIT = 0x50;
const FAST_PREVIEW_NODE_POOL_LIMIT = 0x140;
const FAST_PREVIEW_DETACHED_NODE_CACHE_LIMIT = 0xf0;
const FAST_PREVIEW_DETACHED_IN_FLIGHT_CACHE_LIMIT = 0x208;
const FAST_PREVIEW_MEDIA_PRELOAD_SCOPE = "renderer-fast-preview-media";
const FAST_PREVIEW_MOTION_MIN_DISTANCE_SQ = 0x4;
const FAST_PREVIEW_MINIMAL_INTERACTION_DETAIL_MAX_ZOOM = 0.08;
const FAST_PREVIEW_AUDIO_WAVE_PATH = "M10,40 L10,40 M15,30 L15,50 M20,20 L20,60 M25,35 L25,45 M30,25 L30,55 M35,15 L35,65 M40,30 L40,50 M45,38 L45,42 M50,22 L50,58 M55,18 L55,62 M60,28 L60,52 M65,32 L65,48 M70,24 L70,56 M75,36 L75,44 M80,20 L80,60 M85,16 L85,64 M90,26 L90,54 M95,34 L95,46 M100,22 L100,58 M105,18 L105,62 M110,30 L110,50 M115,38 L115,42 M120,15 L120,65 M125,25 L125,55 M130,35 L130,45 M135,20 L135,60 M140,30 L140,50 M145,40 L145,40 M150,25 L150,55 M155,15 L155,65 M160,30 L160,50 M165,38 L165,42 M170,22 L170,58 M175,18 L175,62 M180,28 L180,52 M185,32 L185,48 M190,24 L190,56";

function nowPerf(){return typeof performance!=="undefined"&&performance&&typeof performance['now']==="function"?performance["now"]():Date["now"]();}

function isViewportInteractionBusyForPreview(){const _0x3485a2=typeof document!=="undefined"?document?.['body']?.["classList"]:null;return Boolean(_0x3485a2?.["contains"]?.("is-panning")||_0x3485a2?.['contains']?.('is-zooming')||_0x3485a2?.["contains"]?.('is-viewport-animating'));}

function isDirectViewportGestureBusyForPreview(){const _0x24039d=typeof document!=="undefined"?document?.['body']?.['classList']:null;return Boolean(_0x24039d?.["contains"]?.('is-panning')||_0x24039d?.["contains"]?.('is-zooming'));}

function isElementVisible(_0x3c15b1){if(!_0x3c15b1||_0x3c15b1["isConnected"]===![])return![];if(_0x3c15b1["hidden"]===!![]||_0x3c15b1["classList"]?.["contains"]?.("is-hidden"))return![];const _0x2bf84f=_0x3c15b1['style']||{};return _0x2bf84f["display"]!=='none'&&_0x2bf84f["visibility"]!=='hidden'&&_0x2bf84f["opacity"]!=='0';}

function isMountedImageReady(_0x5d098e){const _0x4bb21d=String(_0x5d098e?.["currentSrc"]||_0x5d098e?.['src']||_0x5d098e?.["getAttribute"]?.('src')||'')["trim"]();if(!_0x4bb21d||!isElementVisible(_0x5d098e))return![];if(_0x5d098e["complete"]===![])return![];return Number(_0x5d098e["naturalWidth"]||0x0)>0x0||_0x5d098e["complete"]===undefined;}

function isMountedVideoReady(_0x4a8993){const _0x5da41b=String(_0x4a8993?.['currentSrc']||_0x4a8993?.["src"]||_0x4a8993?.["getAttribute"]?.("src")||'')['trim']();return!!_0x5da41b&&isElementVisible(_0x4a8993)&&(Number(_0x4a8993["readyState"]||0x0)>=0x2||hasPresentedVideoFrame(_0x4a8993));}

function hasActiveMountedVideoPlayback(_0x57f513){return Array['from'](_0x57f513?.['querySelectorAll']?.('video')||[])["some"](_0x3040e0=>isMountedPresentationMediaElement(_0x3040e0)&&isMountedVideoReady(_0x3040e0)&&_0x3040e0["paused"]===![]&&_0x3040e0["ended"]!==!![]);}

function hasMountedMediaElement(_0x421470){return!!(_0x421470?.["querySelector"]?.('img')||_0x421470?.["querySelector"]?.("video"));}

function isMountedPresentationMediaElement(_0x2883e0){const _0x14dc06=String(_0x2883e0?.['tagName']||'')["toLowerCase"](),_0x52b7c3=_0x2883e0?.["classList"];if(_0x14dc06==="img")return!!(_0x52b7c3?.["contains"]?.("node-img")||_0x52b7c3?.["contains"]?.("v2-media-preview")||_0x52b7c3?.['contains']?.("aigen-image-media")||_0x52b7c3?.["contains"]?.("source-video-poster-frame")||_0x52b7c3?.["contains"]?.("source-video-capture-preview")||_0x52b7c3?.["contains"]?.("ai-video-deferred-poster"));if(_0x14dc06==="video")return!![];return![];}

function isMountedMediaReady(_0x4015e4){if(!hasMountedMediaElement(_0x4015e4))return![];const _0x19fc32=Array["from"](_0x4015e4?.['querySelectorAll']?.("img")||[])["filter"](isMountedPresentationMediaElement),_0x201302=Array["from"](_0x4015e4?.['querySelectorAll']?.('video')||[])["filter"](isMountedPresentationMediaElement);if(_0x19fc32['length']===0x0&&_0x201302["length"]===0x0)return![];for(const _0x22bd5a of _0x19fc32){if(isMountedImageReady(_0x22bd5a))return!![];}for(const _0x154f9c of _0x201302){if(isMountedVideoReady(_0x154f9c))return!![];}return![];}

function isFastPreviewReleasedForPlayback(_0x2182c7){return _0x2182c7?.["dataset"]?.["fastPreviewReleasedForPlayback"]==='1';}

function getPrimaryListItemIndex(_0x49d440,_0x5326fd=0x0){if(!Array["isArray"](_0x49d440)||_0x49d440["length"]===0x0)return 0x0;return Math["max"](0x0,Math["min"](_0x49d440["length"]-0x1,Math["trunc"](Number(_0x5326fd)||0x0)));}

function normalizeViewport(_0x1596dc={}){const _0x2e5e95=Number(_0x1596dc?.["zoom"]);return{'x':Number['isFinite'](Number(_0x1596dc?.['x']))?Number(_0x1596dc['x']):0x0,'y':Number['isFinite'](Number(_0x1596dc?.['y']))?Number(_0x1596dc['y']):0x0,'zoom':Number["isFinite"](_0x2e5e95)&&_0x2e5e95>0x0?_0x2e5e95:0x1};}

function getViewportContainerSize(_0x2329bb={}){return{'width':Math["max"](0x1,Number(_0x2329bb["containerWidth"]??_0x2329bb["containerW"])||(typeof window!=="undefined"?Number(window["innerWidth"]):0x0)||0x640),'height':Math['max'](0x1,Number(_0x2329bb['containerHeight']??_0x2329bb["containerH"])||(typeof window!=="undefined"?Number(window["innerHeight"]):0x0)||0x384)};}

function getViewportWorldCenter(_0x54d4cc={}){const _0x38335c=normalizeViewport(_0x54d4cc["viewport"]),{width:_0x555cf9,height:_0x15fbe0}=getViewportContainerSize(_0x54d4cc);return{'x':((0x0-_0x38335c['x'])/_0x38335c["zoom"]+(_0x555cf9-_0x38335c['x'])/_0x38335c["zoom"])/0x2,'y':((0x0-_0x38335c['y'])/_0x38335c["zoom"]+(_0x15fbe0-_0x38335c['y'])/_0x38335c["zoom"])/0x2};}

function resolveMediaSrcBatchSize(_0x3dc9ea,_0x1b60b9={}){const _0x3f42b6=Number(_0x1b60b9["batchLimit"]);if(Number["isFinite"](_0x3f42b6)&&_0x3f42b6>=0x0)return Math["max"](0x0,Math["trunc"](_0x3f42b6));if(_0x1b60b9["viewportBusy"]===!![])return FAST_PREVIEW_BUSY_MEDIA_SRC_BATCH_SIZE;if(_0x3dc9ea>=FAST_PREVIEW_HUGE_CANDIDATE_COUNT)return FAST_PREVIEW_HUGE_MEDIA_SRC_BATCH_SIZE;if(_0x3dc9ea>=FAST_PREVIEW_LARGE_CANDIDATE_COUNT)return FAST_PREVIEW_LARGE_MEDIA_SRC_BATCH_SIZE;return FAST_PREVIEW_MEDIA_SRC_BATCH_SIZE;}

function resolveVideoMediaSrcBatchSize(_0x107f94,_0x9c9181={}){const _0x17d551=Number(_0x9c9181['batchLimit']);if(Number["isFinite"](_0x17d551)&&_0x17d551>=0x0)return Math["max"](0x0,Math["trunc"](_0x17d551));if(_0x9c9181["viewportBusy"]===!![])return FAST_PREVIEW_BUSY_VIDEO_MEDIA_SRC_BATCH_SIZE;if(_0x107f94>=FAST_PREVIEW_HUGE_CANDIDATE_COUNT)return FAST_PREVIEW_HUGE_VIDEO_MEDIA_SRC_BATCH_SIZE;if(_0x107f94>=FAST_PREVIEW_LARGE_CANDIDATE_COUNT)return FAST_PREVIEW_LARGE_VIDEO_MEDIA_SRC_BATCH_SIZE;return FAST_PREVIEW_VIDEO_MEDIA_SRC_BATCH_SIZE;}

function hasExplicitPreviewValue(_0x7c8ede={},_0x135b9e=[]){if(!_0x7c8ede||typeof _0x7c8ede!=="object")return![];return _0x135b9e["some"](_0x30a55c=>!!String(_0x7c8ede[_0x30a55c]||'')["trim"]());}

function hasPreviewMediaHint(_0x235963={},_0xe2b108="node"){if(_0xe2b108==="image"){const _0xfc132f=getPrimaryListItem(_0x235963["images"],_0x235963["mainImageIndex"]);return[_0x235963,_0xfc132f]["some"](_0x501127=>hasExplicitPreviewValue(_0x501127,["thumbLocalPath","previewLocalPath","thumbnailLocalPath","thumbUrl","previewUrl","thumbnailUrl","displayLocalPath",'displayUrl',"imageUrl"]));}if(_0xe2b108==="video"){const _0x1a7a23=getPrimaryListItem(_0x235963["videos"],_0x235963["mainVideoIndex"]);if(String(_0x235963['type']||'')["trim"]()["toLowerCase"]()==="ai-video"&&(isTaskFailed(_0x235963)||isTaskCancelled(_0x235963)||!!String(_0x1a7a23?.["error"]||'')["trim"]()))return![];const _0x5f4b75=[_0x1a7a23];return(!_0x1a7a23||!Array['isArray'](_0x235963["videos"])||_0x235963["videos"]['length']<=0x1)&&_0x5f4b75["push"](_0x235963),_0x5f4b75["some"](_0xd80627=>hasExplicitPreviewValue(_0xd80627,["posterLocalPath","thumbLocalPath",'previewLocalPath',"thumbnailLocalPath","videoThumbSrc","posterUrl","thumbUrl","previewUrl","thumbnailUrl"]));}return![];}

function getNodePresentationMediaUrls(_0x53d0a8={}){const _0x93faf=getPreviewKind(_0x53d0a8),_0x3fc41b=[...getPreviewMediaUrls(_0x53d0a8,_0x93faf,{'displayFirst':![]}),...getPreviewMediaUrls(_0x53d0a8,_0x93faf,{'displayFirst':!![]})];if(_0x93faf==="image"){const _0x2338d2=getPrimaryListItem(_0x53d0a8['images'],_0x53d0a8["mainImageIndex"]);for(const _0x5452eb of[_0x2338d2,_0x53d0a8]){const _0x457cf2=resolveCanvasImageSourceUrl(_0x5452eb||{});if(_0x457cf2)_0x3fc41b["push"](_0x457cf2);}}if(_0x93faf==="video"){const _0x3e9ebb=getPrimaryListItem(_0x53d0a8["videos"],_0x53d0a8["mainVideoIndex"]),_0x55def2=resolveCanvasVideoDisplayUrl(_0x3e9ebb||{});if(_0x55def2)_0x3fc41b["push"](_0x55def2);if(!_0x3e9ebb||Array['isArray'](_0x53d0a8["videos"])&&_0x53d0a8['videos']["length"]<=0x1){const _0x1d2075=resolveCanvasVideoDisplayUrl(_0x53d0a8);if(_0x1d2075)_0x3fc41b["push"](_0x1d2075);}}return uniquePreviewUrls(_0x3fc41b);}

function readPresentationMediaSource(_0x5b2706){return String(_0x5b2706?.["dataset"]?.["desktopMediaSourceUrl"]||_0x5b2706?.["getAttribute"]?.("src")||_0x5b2706?.['currentSrc']||_0x5b2706?.['src']||'')["trim"]();}

function canonicalizePresentationMediaSource(_0x144dd1){const _0x34ef14=String(_0x144dd1||'')["trim"]();if(!_0x34ef14)return'';if(/^(?:blob:|data:|aic-local-preview:)/i["test"](_0x34ef14))return _0x34ef14;if(typeof URL!=="function")return _0x34ef14;const _0x6f2fd=String(globalThis["document"]?.['baseURI']||globalThis["location"]?.["href"]||globalThis["location"]?.["origin"]||"http://localhost/");try{return new URL(_0x34ef14,_0x6f2fd)["href"];}catch{return _0x34ef14;}}

function isPresentationMediaSourceForNode(_0x576497,_0x86a113){if(!_0x86a113)return!![];const _0x523cfb=readPresentationMediaSource(_0x576497);if(!_0x523cfb)return![];const _0x1430b6=getNodePresentationMediaUrls(_0x86a113);if(_0x1430b6["includes"](_0x523cfb))return!![];const _0x279d44=canonicalizePresentationMediaSource(_0x523cfb);return _0x1430b6['some'](_0x45b452=>canonicalizePresentationMediaSource(_0x45b452)===_0x279d44);}

export function resolveRendererPreviewNodePresentation(_0x5650f2={},{displayFirst:displayFirst=![]}={}){const _0x421a78=getPreviewKind(_0x5650f2);return{'kind':_0x421a78,'text':getPreviewText(_0x5650f2,_0x421a78),'geometry':getPreviewGeometry(_0x5650f2),'sources':getPreviewMediaUrls(_0x5650f2,_0x421a78,{'displayFirst':displayFirst})};}

function createPreviewSvgElement(_0x4fe7cc){return typeof document["createElementNS"]==="function"?document["createElementNS"]('http://www.w3.org/2000/svg',_0x4fe7cc):document["createElement"](_0x4fe7cc);}

function setPreviewSvgAttributes(_0x199499,_0x622b6){for(const [_0x3e8144,_0x32ac16]of Object['entries'](_0x622b6)){_0x199499['setAttribute'](_0x3e8144,_0x32ac16);}return _0x199499;}

function createAudioPreviewWaveform(_0x18cb24){const _0x43cf3f=document["createElement"]("div");_0x43cf3f['className']='waveform\x20'+_0x18cb24;const _0x22e3a1=setPreviewSvgAttributes(createPreviewSvgElement("svg"),{'width':'100%','height':'80','viewBox':"0 0 200 80",'preserveAspectRatio':"none"});return _0x22e3a1["appendChild"](setPreviewSvgAttributes(createPreviewSvgElement("path"),{'d':FAST_PREVIEW_AUDIO_WAVE_PATH,'stroke':"var(--blue)",'stroke-width':'2','stroke-linecap':"round",'fill':"none"})),_0x22e3a1['appendChild'](setPreviewSvgAttributes(createPreviewSvgElement("path"),{'d':"M0,40 L200,40",'stroke':'var(--blue)','stroke-width':'1','stroke-dasharray':"2 4",'opacity':"0.4",'fill':"none"})),_0x43cf3f["appendChild"](_0x22e3a1),_0x43cf3f;}

function getAudioPreviewDuration(_0x3bd5e5={}){const _0x15f12f=getPrimaryListItem(_0x3bd5e5['audios'],_0x3bd5e5["mainAudioIndex"]);for(const _0x3229b4 of[_0x15f12f?.["audioDuration"],_0x15f12f?.['duration'],_0x3bd5e5["audioDuration"],_0x3bd5e5['duration']]){const _0x11efd9=Number(_0x3229b4);if(Number["isFinite"](_0x11efd9)&&_0x11efd9>0x0)return _0x11efd9;}return 0x0;}

function formatAudioPreviewTime(_0x21292b){const _0xed8e40=Math["max"](0x0,Math["floor"](Number(_0x21292b)||0x0)),_0x3fc94c=Math['floor'](_0xed8e40/0xe10),_0x53d9c8=Math['floor'](_0xed8e40%0xe10/0x3c),_0xaa1d2b=String(_0xed8e40%0x3c)["padStart"](0x2,'0');return _0x3fc94c>0x0?_0x3fc94c+':'+String(_0x53d9c8)['padStart'](0x2,'0')+':'+_0xaa1d2b:_0x53d9c8+':'+_0xaa1d2b;}

function getAudioPreviewTimeText(_0x536589={}){return "0:00 / "+formatAudioPreviewTime(getAudioPreviewDuration(_0x536589));}

function ensureAudioPreviewContent(_0x522dc2,_0x1fcdb4,_0x165be1){let _0x11b796=_0x522dc2["querySelector"]('.v2-fast-preview-audio-card');if(!_0x11b796){_0x11b796=document["createElement"]('div'),_0x11b796['className']="v2-fast-preview-audio-card audio-card",_0x11b796["appendChild"](createAudioPreviewWaveform('waveform-bg')),_0x11b796["appendChild"](createAudioPreviewWaveform('waveform-unplayed'));const _0x55f181=document["createElement"]('div');_0x55f181["className"]="audio-controls";const _0x23b19a=document["createElement"]("button");_0x23b19a['className']="audio-play-btn",_0x23b19a["setAttribute"]('type',"button"),_0x23b19a["setAttribute"]("tabindex",'-1'),_0x23b19a["setAttribute"]("aria-hidden","true");const _0x252323=setPreviewSvgAttributes(createPreviewSvgElement("svg"),{'width':'12','height':'12','viewBox':"0 0 24 24",'fill':'currentColor'});_0x252323["appendChild"](setPreviewSvgAttributes(createPreviewSvgElement("polygon"),{'points':'5\x203\x2019\x2012\x205\x2021\x205\x203'})),_0x23b19a["appendChild"](_0x252323),_0x55f181["appendChild"](_0x23b19a);const _0x5ce838=document["createElement"]('div');_0x5ce838["className"]="audio-time-wrap";const _0xc47eeb=document["createElement"]("span");_0xc47eeb['className']="audio-time-display",_0x5ce838['appendChild'](_0xc47eeb),_0x55f181["appendChild"](_0x5ce838),_0x11b796["appendChild"](_0x55f181),_0x522dc2["prepend"](_0x11b796);}const _0x453c1a=_0x11b796["querySelector"](".audio-time-display"),_0x155bbc=getAudioPreviewTimeText(_0x1fcdb4);if(_0x453c1a&&_0x453c1a["textContent"]!==_0x155bbc)_0x453c1a["textContent"]=_0x155bbc;const _0x424436=_0x522dc2["querySelector"](".v2-fast-preview-label");if(!_0x424436)return;_0x424436["className"]="v2-fast-preview-label v2-fast-preview-audio-label node-label";if(_0x424436["dataset"]["audioPreviewLabel"]!=='1'){for(const _0x57cd44 of Array['from'](_0x424436['children']||[]))_0x57cd44["remove"]?.();_0x424436['textContent']='';const _0x271a41=document["createElement"]("span");_0x271a41["className"]='node-label-icon',_0x271a41["dataset"]["labelKind"]="audio";const _0x3e58b9=document["createElement"]("span");_0x3e58b9["className"]='node-label-text',_0x424436["appendChild"](_0x271a41),_0x424436['appendChild'](_0x3e58b9),_0x424436["dataset"]["audioPreviewLabel"]='1';}const _0x38eb73=_0x424436["querySelector"]('.node-label-text');if(_0x38eb73&&_0x38eb73["textContent"]!==_0x165be1)_0x38eb73["textContent"]=_0x165be1;}

function resetAudioPreviewContent(_0x291d63,_0x275437){_0x291d63["querySelector"]('.v2-fast-preview-audio-card')?.["remove"]?.();const _0x399b6f=_0x291d63["querySelector"](".v2-fast-preview-label");if(!_0x399b6f)return;if(_0x399b6f["dataset"]["audioPreviewLabel"]==='1'){for(const _0x5b8890 of Array["from"](_0x399b6f["children"]||[]))_0x5b8890["remove"]?.();delete _0x399b6f["dataset"]["audioPreviewLabel"];}_0x399b6f["className"]='v2-fast-preview-label';if(_0x399b6f["textContent"]!==_0x275437)_0x399b6f["textContent"]=_0x275437;}

function syncPreviewStaticContent(_0x55183b,_0x441c5b,_0x224982,_0x1ea0ae){if(_0x224982==="audio")ensureAudioPreviewContent(_0x55183b,_0x441c5b,_0x1ea0ae);else resetAudioPreviewContent(_0x55183b,_0x1ea0ae);}

function getPreviewMediaCurrentSrc(_0x2e8aa5){return String(_0x2e8aa5?.["getAttribute"]?.("src")||_0x2e8aa5?.['src']||'')["trim"]();}

function clearPreviewMediaSrc(_0x3b9f33){if(!_0x3b9f33)return;forgetCanvasImageDisplayLoad(_0x3b9f33),_0x3b9f33['onload']=null,_0x3b9f33['onerror']=null;if(isCanvasImagePreloadSharedImage(_0x3b9f33)){_0x3b9f33['remove']?.();return;}_0x3b9f33["removeAttribute"]?.("src"),_0x3b9f33['src']='',_0x3b9f33["_previewSources"]=[],_0x3b9f33["_previewSrcPreloadUrl"]='',_0x3b9f33['_previewMediaQueuePriority']=null,_0x3b9f33["_previewMediaSrcBatchLimit"]=null,_0x3b9f33["_previewVideoMediaSrcBatchLimit"]=null,_0x3b9f33["_previewDirectWhenBlank"]=![],_0x3b9f33["_previewPresentedNotificationKey"]='';if(_0x3b9f33['style'])_0x3b9f33["style"]['visibility']='';delete _0x3b9f33["dataset"]["srcIndex"],delete _0x3b9f33["dataset"]['previewLoaded'],delete _0x3b9f33["dataset"]["previewKind"],delete _0x3b9f33["dataset"]["previewCritical"];}

function isPreviewMediaLoaded(_0x44f2bb){if(!getPreviewMediaCurrentSrc(_0x44f2bb))return![];return _0x44f2bb?.["dataset"]?.['previewLoaded']==='1'||_0x44f2bb?.["complete"]===!![]||Number(_0x44f2bb?.["naturalWidth"]||0x0)>0x0||Number(_0x44f2bb?.["naturalHeight"]||0x0)>0x0;}

function getPreviewRasterFrameEl(_0x354deb){return _0x354deb?.["querySelector"]?.('.v2-fast-preview-raster-frame')||null;}

function isPreviewRasterFrameReady(_0x468005){const _0x5a5261=getPreviewRasterFrameEl(_0x468005);return!!_0x5a5261&&_0x5a5261["isConnected"]!==![];}

function restorePreviewRasterFrameState(_0x530c7c){if(!getPreviewRasterFrameEl(_0x530c7c))return![];return _0x530c7c["dataset"]["hasMedia"]='1',_0x530c7c["dataset"]["rasterFrame"]='1',delete _0x530c7c["dataset"]["placeholderReady"],!![];}

function removePreviewRasterFrame(_0x190e56){const _0x50b0c0=getPreviewRasterFrameEl(_0x190e56);_0x50b0c0?.["remove"]?.(),delete _0x190e56?.['_previewRasterFrame'];if(!_0x190e56?.["dataset"])return!!_0x50b0c0;delete _0x190e56["dataset"]["rasterFrame"];const _0x135354=_0x190e56["querySelector"]?.(".v2-fast-preview-media");if(!isPreviewMediaLoaded(_0x135354))delete _0x190e56["dataset"]['hasMedia'];return!!_0x50b0c0;}

function attachPreviewRasterFrame(_0x16490d,_0xf7f125){const _0x2432c3=_0xf7f125?.["canvas"];if(!_0x16490d||!_0x2432c3)return![];const _0x495877=getPreviewRasterFrameEl(_0x16490d);if(_0x495877&&_0x495877!==_0x2432c3)_0x495877["remove"]?.();_0x2432c3["className"]="v2-fast-preview-raster-frame",_0x2432c3['classList']?.['add']?.("v2-fast-preview-raster-frame");_0x2432c3["dataset"]&&(_0x2432c3["dataset"]["nodeId"]=String(_0xf7f125['nodeId']||_0x16490d["dataset"]?.["nodeId"]||''));_0x2432c3["setAttribute"]?.("aria-hidden","true");if(_0x2432c3['parentNode']!==_0x16490d)_0x16490d["appendChild"]?.(_0x2432c3);return _0x16490d["_previewRasterFrame"]=_0xf7f125,restorePreviewRasterFrameState(_0x16490d);}

function isPreviewRasterFrameCompatible(_0x4d53b0,_0x1a65d7){const _0x3e0af=_0x4d53b0?.["_previewRasterFrame"];if(!_0x3e0af||_0x4d53b0?.["_previewDragActive"]===!![])return!![];if(_0x3e0af['kind']&&_0x1a65d7?.["kind"]&&_0x3e0af['kind']!==_0x1a65d7['kind'])return![];if(Number['isFinite'](Number(_0x3e0af['width']))&&Number['isFinite'](Number(_0x1a65d7?.["geometry"]?.["width"]))&&Number(_0x3e0af['width'])!==Number(_0x1a65d7["geometry"]["width"]))return![];if(Number["isFinite"](Number(_0x3e0af["height"]))&&Number["isFinite"](Number(_0x1a65d7?.["geometry"]?.["height"]))&&Number(_0x3e0af["height"])!==Number(_0x1a65d7["geometry"]["height"]))return![];const _0x2f9d0b=uniquePreviewUrls(_0x3e0af["sources"]||[]),_0x4dcb77=uniquePreviewUrls(_0x1a65d7?.["sources"]||[]);if(_0x2f9d0b["length"]===0x0||_0x4dcb77["length"]===0x0)return!![];const _0x15d420=new Set(_0x4dcb77);return _0x2f9d0b['some'](_0x250b0b=>_0x15d420["has"](_0x250b0b));}

function isPreviewMediaRequestInFlight(_0x159170){return!!getPreviewMediaCurrentSrc(_0x159170)&&_0x159170?.["dataset"]?.['previewLoaded']!=='1'&&_0x159170?.["complete"]!==!![]&&Number(_0x159170?.['naturalWidth']||0x0)<=0x0&&Number(_0x159170?.['naturalHeight']||0x0)<=0x0;}

function isPreviewMediaResourceProtected(_0x153c8a){return isCanvasImageDisplayLoadTracked(_0x153c8a)||isPreviewMediaRequestInFlight(_0x153c8a)||isCanvasImagePreloadSharedImage(_0x153c8a);}

function isPreviewVideoMedia(_0x1fe3ce){return String(_0x1fe3ce?.['dataset']?.["previewKind"]||'')["trim"]()==='video';}

function isPreviewCriticalMedia(_0x4a822e){return _0x4a822e?.["dataset"]?.['previewCritical']==='1';}

function getReusableLoadedPreviewMediaSource(_0x501c0e,_0x1ec9f4){const _0x32b3d9=_0x501c0e?.["querySelector"]?.(".v2-fast-preview-media");if(!isPreviewMediaLoaded(_0x32b3d9))return'';const _0x50faac=getPreviewMediaCurrentSrc(_0x32b3d9);if(!_0x50faac)return'';const _0x48c6a2=uniquePreviewUrls(Array["isArray"](_0x1ec9f4)?_0x1ec9f4:[_0x1ec9f4]);return _0x48c6a2["includes"](_0x50faac)?_0x50faac:'';}

function hasRetainablePaintedPreviewMedia(_0x3579cf,{includeImages:includeImages=![]}={}){const _0x45fa02=_0x3579cf?.['querySelector']?.('.v2-fast-preview-media');return isPreviewMediaLoaded(_0x45fa02)&&(includeImages||isPreviewVideoMedia(_0x45fa02));}

function getRetainablePaintedPreviewMediaSource(_0x260dfa,_0xe4ac92){if(!hasRetainablePaintedPreviewMedia(_0x260dfa,{'includeImages':!![]}))return'';return getReusableLoadedPreviewMediaSource(_0x260dfa,_0xe4ac92);}

function restorePaintedPreviewMedia(_0x4f7df0){const _0xdd3fa6=_0x4f7df0?.["querySelector"]?.(".v2-fast-preview-media");if(!isPreviewMediaLoaded(_0xdd3fa6))return![];delete _0xdd3fa6["dataset"]['previewResourceOnly'];if(_0xdd3fa6["style"])_0xdd3fa6["style"]["visibility"]='';_0x4f7df0["dataset"]["hasMedia"]='1';const _0xd8be2d=Array["isArray"](_0xdd3fa6["_previewSources"])?_0xdd3fa6["_previewSources"]["length"]:0x0;if(_0xd8be2d>0x0)_0x4f7df0['dataset']["previewSrcCount"]=String(_0xd8be2d);return!![];}

function getReusableCurrentPreviewMediaSource(_0x3651b8,_0x1f86d3){const _0x2baa24=_0x3651b8?.["querySelector"]?.(".v2-fast-preview-media"),_0x118b79=getPreviewMediaCurrentSrc(_0x2baa24)||String(_0x2baa24?.["_previewSrcPreloadUrl"]||'')["trim"]();if(!_0x118b79)return'';const _0x1b2d97=uniquePreviewUrls(Array["isArray"](_0x1f86d3)?_0x1f86d3:[_0x1f86d3]);return _0x1b2d97["includes"](_0x118b79)?_0x118b79:'';}

function nextPreviewMediaPreloadToken(_0x3687cf){if(!_0x3687cf)return 0x0;const _0x39d8c5=(Number(_0x3687cf["_previewSrcPreloadToken"])||0x0)+0x1;return _0x3687cf["_previewSrcPreloadToken"]=_0x39d8c5,_0x39d8c5;}

function isPreviewMediaPreloadCurrent(_0x146279,_0x51e73e,_0x3462ee,_0x229534=0x0){if(!_0x146279||_0x146279["isConnected"]===![])return![];if(_0x146279["_previewSrcPreloadToken"]!==_0x3462ee)return![];const _0x5c4b25=_0x146279["_previewSources"]||[];return String(_0x5c4b25[_0x229534]||'')["trim"]()===String(_0x51e73e||'')["trim"]();}

function resolvePreviewMediaPreloadPriority(_0xaf0900,{viewportBusy:viewportBusy=![]}={}){if(viewportBusy)return FAST_PREVIEW_BUSY_MEDIA_PRELOAD_PRIORITY;if(_0xaf0900?.["loading"]==="lazy")return FAST_PREVIEW_LOW_PRIORITY_MEDIA_PRELOAD_PRIORITY;return FAST_PREVIEW_MEDIA_PRELOAD_PRIORITY;}

function applyPreviewMediaSrcAfterPreload(_0x11dd8a,_0x400f03,_0x10e6f6=0x0,_0x272618={}){const _0x4c74c2=_0x400f03[_0x10e6f6]||'';if(!_0x4c74c2)return![];const _0x3c3112=_0x11dd8a["getAttribute"]?.("src")||_0x11dd8a['src']||'';if(_0x3c3112===_0x4c74c2)return!![];if(String(_0x11dd8a['_previewSrcPreloadUrl']||'')['trim']()===_0x4c74c2)return!![];const _0x1cd01b=!isPreviewVideoMedia(_0x11dd8a)&&isCanvasImagePreloadCoolingDown(_0x4c74c2);if(_0x1cd01b)return!![];if(_0x272618["directWhenBlank"]===!![]&&!_0x3c3112&&(isPreviewVideoMedia(_0x11dd8a)||!isCanvasImagePreloadPending(_0x4c74c2)))return setPreviewMediaSrc(_0x11dd8a,_0x400f03,_0x10e6f6);if(/^(data:image\/|blob:)/i["test"](_0x4c74c2)||typeof Image!=='function')return setPreviewMediaSrc(_0x11dd8a,_0x400f03,_0x10e6f6);const _0x2c43b6=nextPreviewMediaPreloadToken(_0x11dd8a);return _0x11dd8a['_previewSrcPreloadUrl']=_0x4c74c2,preloadCanvasImage(_0x4c74c2,{'decode':_0x272618["decode"]===!![],'requireImage':!![],'priority':resolvePreviewMediaPreloadPriority(_0x11dd8a,_0x272618),'fetchPriority':_0x11dd8a?.["fetchPriority"]==='high'?'high':'auto','scope':FAST_PREVIEW_MEDIA_PRELOAD_SCOPE,'deferWhenPaused':_0x272618['viewportBusy']===!![]||_0x11dd8a?.["loading"]==="lazy"})['then'](()=>{if(!isPreviewMediaPreloadCurrent(_0x11dd8a,_0x4c74c2,_0x2c43b6,_0x10e6f6))return;setPreviewMediaSrc(_0x11dd8a,_0x400f03,_0x10e6f6),_0x11dd8a["_previewSrcPreloadUrl"]='';},()=>{if(!isPreviewMediaPreloadCurrent(_0x11dd8a,_0x4c74c2,_0x2c43b6,_0x10e6f6))return;_0x11dd8a["_previewSrcPreloadUrl"]='';}),!![];}

function setPreviewMediaSrcJoiningSharedAcquisition(_0x395873,_0x15260c,_0x79567d=0x0,_0x6b887e={}){const _0x12829d=_0x15260c[_0x79567d]||'';if(!_0x12829d)return![];if(!isPreviewVideoMedia(_0x395873)&&!/^(data:image\/|blob:)/i['test'](_0x12829d)&&_0x6b887e['directWhenBlank']!==!![]&&(isCanvasImagePreloadPending(_0x12829d)||isCanvasImagePreloadCoolingDown(_0x12829d)))return applyPreviewMediaSrcAfterPreload(_0x395873,_0x15260c,_0x79567d,{..._0x6b887e,'directWhenBlank':![]});return setPreviewMediaSrc(_0x395873,_0x15260c,_0x79567d);}

export function cancelRendererFastPreviewMediaPreloads({includeActive:includeActive=![],belowPriority:belowPriority=null,reason:reason="canceled"}={}){return cancelQueuedCanvasImagePreloads({'scope':FAST_PREVIEW_MEDIA_PRELOAD_SCOPE,'includeActive':includeActive,'belowPriority':belowPriority,'reason':reason});}

function previewMediaNeedsSrc(_0x1815c9,_0x57555a){const _0xa8eb0d=uniquePreviewUrls(Array["isArray"](_0x57555a)?_0x57555a:[_0x57555a])[0x0]||'';if(!_0xa8eb0d)return![];const _0xd75215=_0x1815c9?.["querySelector"]?.(".v2-fast-preview-media");if(!_0xd75215)return!![];return(_0xd75215['getAttribute']?.("src")||_0xd75215["src"]||'')!==_0xa8eb0d;}

function applyPreviewDragTransform(_0x506a3c){if(!_0x506a3c)return![];const _0x5b63bf=toNumber(_0x506a3c["_previewBaseX"],0x0),_0x561ee5=toNumber(_0x506a3c['_previewBaseY'],0x0),_0x347239=_0x506a3c["_previewDragActive"]===!![],_0x152914=_0x347239?toNumber(_0x506a3c["_previewDragDx"],0x0):0x0,_0x1973d5=_0x347239?toNumber(_0x506a3c["_previewDragDy"],0x0):0x0;_0x506a3c["style"]["transform"]="translate("+(_0x5b63bf+_0x152914)+"px, "+(_0x561ee5+_0x1973d5)+"px)",_0x506a3c["classList"]?.["toggle"]?.("is-dragging-proxy",_0x347239);if(_0x347239)_0x506a3c["dataset"]["dragProxy"]='1';else delete _0x506a3c["dataset"]['dragProxy'];return!![];}

function resetPreviewDragState(_0x370035){if(!_0x370035)return;_0x370035["_previewDragActive"]=![],_0x370035["_previewDragDx"]=0x0,_0x370035["_previewDragDy"]=0x0,applyPreviewDragTransform(_0x370035),_0x370035["classList"]?.["remove"]?.("is-dragging-proxy"),delete _0x370035["dataset"]["dragProxy"];}

function settlePreviewDragState(_0x2cb882,_0xfb316f=0x0,_0x49dad2=0x0){if(!_0x2cb882)return![];return _0x2cb882['_previewBaseX']=toNumber(_0x2cb882["_previewBaseX"],0x0)+toNumber(_0xfb316f,0x0),_0x2cb882["_previewBaseY"]=toNumber(_0x2cb882['_previewBaseY'],0x0)+toNumber(_0x49dad2,0x0),_0x2cb882["_previewDragActive"]=![],_0x2cb882["_previewDragDx"]=0x0,_0x2cb882["_previewDragDy"]=0x0,applyPreviewDragTransform(_0x2cb882);}

function isStoryboardEditingNode(_0x651881={}){return String(_0x651881?.["type"]||'')["trim"]()["toLowerCase"]()==="storyboard"&&_0x651881["isEditing"];}

function syncPreviewConnectionState(_0x10bfc0,_0x17ea0b={},{connOverlay:connOverlay=null,pickConnectMode:pickConnectMode=null}={}){const _0x958c45=String(_0x17ea0b?.['id']||_0x10bfc0?.['dataset']?.["nodeId"]||'')["trim"]();if(!_0x958c45||!_0x10bfc0?.["classList"])return;const _0x16ae7d=String(connOverlay?.['srcId']||'')["trim"](),_0x148597=pickConnectMode?.["active"]?String(pickConnectMode["sourceNodeId"]||'')['trim']():'',_0x110958=!!_0x148597&&_0x958c45===_0x148597,_0x1b631=!!_0x16ae7d&&_0x958c45===_0x16ae7d,_0x49cb3f=isStoryboardEditingNode(_0x17ea0b),_0x181768=_0x1b631||_0x110958||_0x49cb3f,_0x45ae59=Array["isArray"](connOverlay?.["invalidNodeIds"])?connOverlay["invalidNodeIds"]:[],_0x223c4e=!_0x181768&&_0x45ae59["includes"](_0x958c45),_0x4b213f=pickConnectMode?.["active"]?String(pickConnectMode["hoverNodeId"]||'')["trim"]():'',_0x314902=!!_0x4b213f&&_0x958c45===_0x4b213f,_0x2d7d0b=connOverlay?.["hoverId"]===_0x958c45||_0x314902,_0x5afb17=_0x2d7d0b&&(connOverlay?.['side']==='left'||_0x314902&&pickConnectMode?.["handleDirection"]==='left');_0x10bfc0['classList']["toggle"]("conn-src",_0x181768),_0x10bfc0['classList']["toggle"]("conn-invalid",_0x223c4e),_0x10bfc0["classList"]["toggle"]("conn-hoverTarget",_0x2d7d0b),_0x10bfc0["classList"]["toggle"]('conn-hover-output',_0x5afb17),_0x10bfc0['classList']["toggle"]('conn-hover-input',_0x2d7d0b&&!_0x5afb17);}

function buildPreviewCandidateSyncSignature(_0x317b82,_0x4198ba,_0x5090be=null){const {node:_0x2e17df,nodeId:_0x11c690,kind:_0x273fbf,sources:sources=[],geometry:geometry={}}=_0x317b82||{},_0x5346eb=_0x4198ba?.["options"]||{},_0x2ffb28=_0x5346eb["connOverlay"]||{},_0xcf3d85=_0x5346eb["pickConnectMode"]||{},_0x3a72d5=_0x4198ba?.["mediaPlan"]?.["explicitMediaSourceOwnerIds"],_0x505e5b=_0x4198ba?.["requiredImmediateMediaSourceOwnerIds"],_0x483506=Array["isArray"](_0x2ffb28['invalidNodeIds'])?_0x2ffb28['invalidNodeIds']:[],_0x90db53=_0x5090be?.['querySelector']?.('.v2-fast-preview-media')||null,_0x227d82=String(sources[0x0]||'')['trim'](),_0x44701f=(_0x317b82?.["fullEligibleVisible"]===!![]||_0x317b82?.["visible"]===!![])&&(_0x273fbf==="video"||toNumber(_0x4198ba?.['visibleMediaCandidateCount'],0x0)<=toNumber(_0x4198ba?.["immediateMediaSrcLimit"],0x0)),_0x4137a0=toNumber(geometry['x'],0x0)-toNumber(_0x4198ba?.["layerBounds"]?.["offsetX"],0x0),_0x10e915=toNumber(geometry['y'],0x0)-toNumber(_0x4198ba?.["layerBounds"]?.['offsetY'],0x0);return[_0x11c690,_0x273fbf,_0x317b82?.['text']??getPreviewText(_0x2e17df,_0x273fbf),sources['join']('>'),_0x4137a0,_0x10e915,toNumber(geometry["width"],0x0),toNumber(geometry["height"],0x0),_0x317b82?.["nearViewport"]===!![]?0x1:0x0,_0x317b82?.['visible']===!![]?0x1:0x0,_0x317b82?.["fullEligibleVisible"]===!![]?0x1:0x0,_0x317b82?.["fullEligiblePreview"]===!![]?0x1:0x0,_0x317b82?.["fullEligibleMotionAhead"]===!![]?0x1:0x0,_0x317b82?.["motionFront"]===!![]?0x1:0x0,_0x317b82?.["motionAhead"]===!![]?0x1:0x0,_0x317b82?.["selected"]===!![]?0x1:0x0,_0x317b82?.["retained"]===!![]?0x1:0x0,_0x317b82?.["mounted"]===!![]?0x1:0x0,_0x4198ba?.["mediaPlan"]?.["nodeIdsWithMedia"]?.["has"]?.(_0x11c690)===!![]?0x1:0x0,_0x3a72d5===null?"legacy":_0x3a72d5?.["has"]?.(_0x11c690)===!![]?0x1:0x0,_0x505e5b===null?"legacy":_0x505e5b?.["has"]?.(_0x11c690)===!![]?0x1:0x0,_0x4198ba?.["mediaPlan"]?.["lowPriority"]===!![]?0x1:0x0,_0x4198ba?.['mediaPlan']?.["prefetchAhead"]===!![]?0x1:0x0,_0x4198ba?.["mediaLoading"]||'',_0x4198ba?.["mediaFetchPriority"]||'',_0x44701f?0x1:0x0,_0x4198ba?.["viewportBusy"]===!![]?0x1:0x0,_0x5346eb["suppressNewMedia"]===!![]?0x1:0x0,_0x5346eb["suspendNewMediaSrc"]===!![]?0x1:0x0,_0x5346eb["previewMotion"]?.['zoomChanged']===!![]?0x1:0x0,String(_0x2ffb28["srcId"]||''),String(_0x2ffb28["hoverId"]||''),String(_0x2ffb28["side"]||''),_0x483506["includes"](_0x11c690)?0x1:0x0,_0xcf3d85["active"]===!![]?0x1:0x0,String(_0xcf3d85['sourceNodeId']||''),String(_0xcf3d85["hoverNodeId"]||''),String(_0xcf3d85["handleDirection"]||''),isStoryboardEditingNode(_0x2e17df)?0x1:0x0,_0x5090be?.["dataset"]?.['mediaSourceOwner']||'',_0x5090be?.["dataset"]?.["hasMedia"]||'',_0x5090be?.['dataset']?.["placeholderReady"]||'',_0x90db53?getPreviewMediaCurrentSrc(_0x90db53):'',_0x90db53?.["_previewSrcPreloadUrl"]||'',_0x90db53?.['dataset']?.["previewResourceOnly"]||'',_0x90db53?.['style']?.['visibility']||'',_0x90db53?.["loading"]||'',_0x90db53?.["fetchPriority"]||'',_0x227d82&&_0x273fbf!=="video"&&isCanvasImagePreloadCoolingDown(_0x227d82)?0x1:0x0]["join"]('\x1f');}
