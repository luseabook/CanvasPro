import { isNodeInsideViewportPadding } from './rendererVirtualization.js';
import {
  resolveCanvasImageLowZoomUrl,
  resolveCanvasImageThumbUrl,
  toCanvasLocalUrl,
} from '../services/canvasMediaLocalService.js';
import { cancelQueuedCanvasImagePreloads, preloadCanvasImage } from '../modules/canvasMediaScheduler.js';
const DEFAULT_CONTAINER_WIDTH = 0x640,
  DEFAULT_CONTAINER_HEIGHT = 0x384,
  DEFAULT_WARMUP_PADDING = 0x384,
  DEFAULT_MAX_WARMUP_JOBS = 240,
  CANVAS_MEDIA_WARMUP_SCOPE = 'canvas-visible-media-warmup';
function normalizeNodes(_0x2bf983) {
  if (Array.isArray(_0x2bf983)) return _0x2bf983;
  if (_0x2bf983 && typeof _0x2bf983 === 'object') return Object.values(_0x2bf983);
  return [];
}
function normalizeViewport(_0x1868f2) {
  return {
    x: Number.isFinite(Number(_0x1868f2?.x)) ? Number(_0x1868f2.x) : 0,
    y: Number.isFinite(Number(_0x1868f2?.y)) ? Number(_0x1868f2.y) : 0,
    zoom: Number.isFinite(Number(_0x1868f2?.zoom)) && Number(_0x1868f2.zoom) > 0 ? Number(_0x1868f2.zoom) : 1,
  };
}
function getElementSize(_0x3c39f8) {
  return {
    width: Math.max(1, Math.round(Number(_0x3c39f8?.clientWidth) || DEFAULT_CONTAINER_WIDTH)),
    height: Math.max(1, Math.round(Number(_0x3c39f8?.clientHeight) || DEFAULT_CONTAINER_HEIGHT)),
  };
}
function getViewportWorldCenter(_0x549f3f, _0x4949d6, _0x2d4c15) {
  const _0x24082b = Math.max(0.0001, Number(_0x549f3f?.zoom) || 1),
    _0x45cdfa = Number.isFinite(Number(_0x549f3f?.x)) ? Number(_0x549f3f.x) : 0,
    _0x3e7c59 = Number.isFinite(Number(_0x549f3f?.y)) ? Number(_0x549f3f.y) : 0;
  return {
    x: ((0 - _0x45cdfa) / _0x24082b + (_0x4949d6 - _0x45cdfa) / _0x24082b) / 2,
    y: ((0 - _0x3e7c59) / _0x24082b + (_0x2d4c15 - _0x3e7c59) / _0x24082b) / 2,
  };
}
function getNodeCenterDistanceSq(_0x1211d7, _0x356442) {
  const _0x539df2 = Number.isFinite(Number(_0x1211d7?.x)) ? Number(_0x1211d7.x) : 0,
    _0x457760 = Number.isFinite(Number(_0x1211d7?.y)) ? Number(_0x1211d7.y) : 0,
    _0x3ebff2 = Math.max(1, Number(_0x1211d7?.width) || 160),
    _0x51419e = Math.max(1, Number(_0x1211d7?.height) || 120),
    _0x5ce1c5 = _0x539df2 + _0x3ebff2 / 2 - _0x356442.x,
    _0x34f188 = _0x457760 + _0x51419e / 2 - _0x356442.y;
  return _0x5ce1c5 * _0x5ce1c5 + _0x34f188 * _0x34f188;
}
function normalizeSelectedNodeIds(_0x495705, _0x319550) {
  const _0x15a253 =
    _0x319550 instanceof Set || Array.isArray(_0x319550) ? _0x319550 : _0x495705?.selectedNodeIds;
  return new Set(
    Array.from(_0x15a253 || [])
      .map((_0x140d9a) => String(_0x140d9a || ''))
      .filter(Boolean),
  );
}
function getDistancePriorityBoost(_0x470810, _0x32413e, _0x289aff, _0x157b0f) {
  const _0x570f1e = Math.max(0.0001, Number(_0x32413e?.zoom) || 1),
    _0x511939 = Math.max(_0x289aff / _0x570f1e, _0x157b0f / _0x570f1e, 1),
    _0x19b25a = Math.sqrt(Math.max(0, _0x470810)) / _0x511939;
  return Math.max(0, Math.round(18 - _0x19b25a * 18));
}
function isWarmupUrl(_0x5b6382) {
  const _0x10980f = String(_0x5b6382 || '').trim();
  if (!_0x10980f) return false;
  if (/^https?:\/\//i.test(_0x10980f)) return false;
  return (
    _0x10980f.startsWith('/') ||
    _0x10980f.startsWith('data:image/') ||
    _0x10980f.startsWith('blob:') ||
    _0x10980f.startsWith('aic-local-preview:')
  );
}
function isLikelyVideoUrl(_0x4bd7ca) {
  return /\.(?:mp4|mov|webm|m4v|avi|mkv)(?:[?#].*)?$/i.test(String(_0x4bd7ca || '').trim());
}
function toWarmupUrl(_0x198a7b) {
  const _0x728c5e = String(_0x198a7b || '').trim();
  if (!_0x728c5e) return '';
  if (isWarmupUrl(_0x728c5e)) return _0x728c5e;
  return toCanvasLocalUrl(_0x728c5e);
}
function pushWarmupJob(_0x5a34b1, _0x532124, _0x15ed66, _0x86366e, _0x1c4cdc, _0x137e53, _0x2fa31c = {}) {
  const _0x3fafc4 = toWarmupUrl(_0x15ed66);
  if (!isWarmupUrl(_0x3fafc4) || _0x532124.has(_0x3fafc4)) return;
  if (isLikelyVideoUrl(_0x3fafc4)) return;
  (_0x532124.add(_0x3fafc4),
    _0x5a34b1.push({
      url: _0x3fafc4,
      priority: _0x86366e,
      nodeId: String(_0x1c4cdc || ''),
      reason: _0x137e53,
      distanceSq: Number.isFinite(Number(_0x2fa31c.distanceSq)) ? Number(_0x2fa31c.distanceSq) : 0,
      visible: _0x2fa31c.visible === true,
      selected: _0x2fa31c.selected === true,
      order: _0x5a34b1.length,
    }));
}
function getPrimaryListItem(_0x5d1587, _0x394ef8 = 0) {
  if (!Array.isArray(_0x5d1587) || _0x5d1587.length === 0) return null;
  const _0x2232c1 = Number.isFinite(Number(_0x394ef8)) ? Math.max(0, Math.trunc(Number(_0x394ef8))) : 0;
  return _0x5d1587[_0x2232c1] || _0x5d1587[0] || null;
}
function addImageWarmupJobs(
  _0x2f73e3,
  _0x30bb64,
  _0x5b9060,
  { primary: primary = true, priorityOffset: priorityOffset = 0, meta: meta = {} } = {},
) {
  const _0x4ec136 = primary ? 20 : 0;
  (pushWarmupJob(
    _0x2f73e3,
    _0x30bb64,
    resolveCanvasImageThumbUrl(_0x5b9060) || resolveCanvasImageLowZoomUrl(_0x5b9060),
    90 + _0x4ec136 + priorityOffset,
    _0x5b9060?.id,
    primary ? 'image-thumb-primary' : 'image-thumb-nearby',
    meta,
  ),
    pushWarmupJob(
      _0x2f73e3,
      _0x30bb64,
      resolveCanvasImageThumbUrl(_0x5b9060),
      70 + _0x4ec136 + priorityOffset,
      _0x5b9060?.id,
      primary ? 'image-thumb-dedupe-primary' : 'image-thumb-dedupe-nearby',
      meta,
    ));
}
function addVideoPosterWarmupJobs(
  _0x23a640,
  _0x3e03cc,
  _0x51e7dd,
  { primary: primary = true, priorityOffset: priorityOffset = 0, meta: meta = {} } = {},
) {
  const _0x565fb0 = (primary ? 95 : 70) + priorityOffset;
  for (const _0x3f3d5a of [
    _0x51e7dd?.posterLocalPath,
    _0x51e7dd?.thumbLocalPath,
    _0x51e7dd?.posterUrl,
    _0x51e7dd?.thumbUrl,
    _0x51e7dd?.videoThumbSrc,
    _0x51e7dd?.capturePreviewUrl,
  ]) {
    pushWarmupJob(_0x23a640, _0x3e03cc, _0x3f3d5a, _0x565fb0, _0x51e7dd?.id, 'video-poster', meta);
  }
}
export function collectCanvasVisibleMediaWarmupJobs({
  canvas: canvas = null,
  nodes: nodes = canvas?.nodes,
  viewport: viewport = canvas?.viewport,
  containerWidth: containerWidth = DEFAULT_CONTAINER_WIDTH,
  containerHeight: containerHeight = DEFAULT_CONTAINER_HEIGHT,
  padding: padding = DEFAULT_WARMUP_PADDING,
  maxJobs: maxJobs = DEFAULT_MAX_WARMUP_JOBS,
  selectedNodeIds: selectedNodeIds = canvas?.selectedNodeIds,
} = {}) {
  const _0x505e07 = normalizeNodes(nodes),
    _0x407d54 = normalizeViewport(viewport),
    _0x311479 = normalizeSelectedNodeIds(canvas, selectedNodeIds),
    _0x4df904 = getViewportWorldCenter(_0x407d54, containerWidth, containerHeight),
    _0x12c51c = [],
    _0x51d22c = [],
    _0x116832 = new Set();
  for (const _0x31b0bc of _0x505e07) {
    if (!_0x31b0bc?.id) continue;
    if (!isNodeInsideViewportPadding(_0x31b0bc, _0x407d54, containerWidth, containerHeight, padding))
      continue;
    const _0x3b3c4c = isNodeInsideViewportPadding(_0x31b0bc, _0x407d54, containerWidth, containerHeight, 0),
      _0x341c80 = getNodeCenterDistanceSq(_0x31b0bc, _0x4df904);
    _0x12c51c.push({
      node: _0x31b0bc,
      selected: _0x311479.has(String(_0x31b0bc.id || '')),
      visible: _0x3b3c4c,
      distanceSq: _0x341c80,
      order: _0x12c51c.length,
    });
  }
  _0x12c51c.sort((_0x36125d, _0x1581b4) => {
    if (_0x36125d.selected !== _0x1581b4.selected) return _0x36125d.selected ? -1 : 1;
    if (_0x36125d.visible !== _0x1581b4.visible) return _0x36125d.visible ? -1 : 1;
    if (_0x36125d.distanceSq !== _0x1581b4.distanceSq) return _0x36125d.distanceSq - _0x1581b4.distanceSq;
    return _0x36125d.order - _0x1581b4.order;
  });
  for (const _0x40e27f of _0x12c51c) {
    const _0xb19014 = _0x40e27f.node,
      _0x2decf8 = String(_0xb19014.type || '').toLowerCase(),
      _0xcd8b98 =
        (_0x40e27f.selected ? 40 : 0) +
        (_0x40e27f.visible ? 18 : 0) +
        getDistancePriorityBoost(_0x40e27f.distanceSq, _0x407d54, containerWidth, containerHeight),
      _0x6822e4 = {
        selected: _0x40e27f.selected,
        visible: _0x40e27f.visible,
        distanceSq: _0x40e27f.distanceSq,
      };
    if (_0x2decf8.includes('image')) {
      addImageWarmupJobs(_0x51d22c, _0x116832, _0xb19014, {
        primary: true,
        priorityOffset: _0xcd8b98,
        meta: _0x6822e4,
      });
      const _0x3443bb = getPrimaryListItem(_0xb19014.images, _0xb19014.mainImageIndex);
      if (_0x3443bb)
        addImageWarmupJobs(_0x51d22c, _0x116832, _0x3443bb, {
          primary: false,
          priorityOffset: _0xcd8b98,
          meta: _0x6822e4,
        });
    } else {
      if (_0x2decf8.includes('video')) {
        const _0x12298f = getPrimaryListItem(_0xb19014.videos, _0xb19014.mainVideoIndex);
        if (_0x12298f)
          addVideoPosterWarmupJobs(_0x51d22c, _0x116832, _0x12298f, {
            primary: true,
            priorityOffset: _0xcd8b98,
            meta: _0x6822e4,
          });
        addVideoPosterWarmupJobs(_0x51d22c, _0x116832, _0xb19014, {
          primary: !_0x12298f,
          priorityOffset: _0xcd8b98,
          meta: _0x6822e4,
        });
      }
    }
    if (_0x51d22c.length >= maxJobs) break;
  }
  return _0x51d22c
    .sort(
      (_0x25c436, _0x2760ae) =>
        _0x2760ae.priority - _0x25c436.priority ||
        _0x25c436.distanceSq - _0x2760ae.distanceSq ||
        _0x25c436.order - _0x2760ae.order,
    )
    .slice(0, Math.max(0, Math.round(Number(maxJobs) || 0)));
}
export function warmupCanvasVisibleMedia({
  canvas: canvas = null,
  containerEl: containerEl = null,
  maxJobs: maxJobs = DEFAULT_MAX_WARMUP_JOBS,
  cancelStaleQueued: cancelStaleQueued = true,
} = {}) {
  const _0x3227e3 =
      cancelStaleQueued === false
        ? 0
        : cancelQueuedCanvasImagePreloads({
            scope: CANVAS_MEDIA_WARMUP_SCOPE,
            reason: 'replaced by newer viewport',
          }),
    _0x1e3a63 = getElementSize(containerEl),
    _0x4cb172 = collectCanvasVisibleMediaWarmupJobs({
      canvas: canvas,
      containerWidth: _0x1e3a63.width,
      containerHeight: _0x1e3a63.height,
      maxJobs: maxJobs,
    });
  for (const _0x3f3e36 of _0x4cb172) {
    preloadCanvasImage(_0x3f3e36.url, {
      priority: _0x3f3e36.priority,
      fetchPriority: 'auto',
      scope: CANVAS_MEDIA_WARMUP_SCOPE,
    }).catch(() => {});
  }
  return { scheduledCount: _0x4cb172.length, canceledStaleCount: _0x3227e3, jobs: _0x4cb172 };
}
