import { isNodeType } from '../modules/registry.js';
import {
  resolveCanvasAudioUrl,
  resolveCanvasVideoDisplayUrl,
  resolveCanvasVideoPosterUrl,
  resolveCanvasVideoUrl,
} from '../services/canvasMediaLocalService.js';
import {
  isNodeInsideViewportPadding,
  RENDERER_VIRTUALIZATION_CONFIG,
  resolveRendererLowZoomMountLimit,
} from './rendererVirtualization.js';
const PRIORITY_MEDIA_TYPES = Object['freeze']([
    'source-video',
    'video',
    'ai-video',
    'source-audio',
    'audio',
    'ai-audio',
  ]),
  PRIORITY_VIDEO_TYPES = Object['freeze'](['source-video', 'video', 'ai-video']);
function hasResolvedVideo(_0x400b7b) {
  if (!isNodeType(_0x400b7b, PRIORITY_VIDEO_TYPES)) return ![];
  if (resolveCanvasVideoDisplayUrl(_0x400b7b)) return !![];
  const _0x18990b = Array['isArray'](_0x400b7b?.['videos']) ? _0x400b7b['videos'] : [];
  return _0x18990b['some']((_0x6e57ac) => !!resolveCanvasVideoDisplayUrl(_0x6e57ac));
}
export function resolveRendererLowZoomRealVideoNodeIds({
  nodes: _0xbbcc9f,
  candidateNodeIds: _0x4285a3,
  selectedNodeIds: _0x141203,
  priorityNodeIds: _0x2939a2,
  viewport: _0x88b31b,
  nodeCount: nodeCount = 0x0,
  containerWidth: _0x525759,
  containerHeight: _0x49881a,
} = {}) {
  const _0x3d7148 = new Set(),
    _0x165424 = resolveRendererLowZoomMountLimit({ viewport: _0x88b31b, nodeCount: nodeCount });
  if (_0x165424 <= 0x0) return _0x3d7148;
  const _0x2abda0 = _0xbbcc9f && typeof _0xbbcc9f === 'object' ? _0xbbcc9f : {},
    _0x3f8a71 = _0x4285a3 instanceof Set ? _0x4285a3 : new Set(_0x4285a3 || []),
    _0x2b1cfb =
      _0x141203 instanceof Set ? Array['from'](_0x141203) : Array['isArray'](_0x141203) ? _0x141203 : [];
  for (const _0x34a2d7 of _0x2b1cfb) {
    const _0x4d2a86 = _0x2abda0[_0x34a2d7];
    if (!_0x3f8a71['has'](_0x34a2d7) || !hasResolvedVideo(_0x4d2a86)) continue;
    _0x3d7148['add'](_0x34a2d7);
  }
  const _0x424ebd = Number(_0x525759),
    _0x2a4e14 = Number(_0x49881a);
  if (!(_0x424ebd > 0x0) || !(_0x2a4e14 > 0x0) || _0x3d7148['size'] >= _0x165424) return _0x3d7148;
  const _0x3ea699 = _0x2939a2 instanceof Set ? _0x2939a2 : new Set(_0x2939a2 || []);
  for (const _0x21ecf5 of _0x3ea699) {
    if (_0x3d7148['has'](_0x21ecf5) || !_0x3f8a71['has'](_0x21ecf5)) continue;
    const _0x5cf73e = _0x2abda0[_0x21ecf5];
    if (
      !hasResolvedVideo(_0x5cf73e) ||
      !isNodeInsideViewportPadding(_0x5cf73e, _0x88b31b, _0x424ebd, _0x2a4e14, 0x0)
    )
      continue;
    _0x3d7148['add'](_0x21ecf5);
    if (_0x3d7148['size'] >= _0x165424) return _0x3d7148;
  }
  for (const _0x1d797e of _0x3f8a71) {
    if (_0x3d7148['has'](_0x1d797e)) continue;
    const _0x28f48b = _0x2abda0[_0x1d797e];
    if (
      !hasResolvedVideo(_0x28f48b) ||
      !isNodeInsideViewportPadding(_0x28f48b, _0x88b31b, _0x424ebd, _0x2a4e14, 0x0)
    )
      continue;
    _0x3d7148['add'](_0x1d797e);
    if (_0x3d7148['size'] >= _0x165424) break;
  }
  return _0x3d7148;
}
export function syncRendererPendingSourceVideoActivationIds({
  nodes: _0x26033a,
  sourceKeysByNodeId: _0x28dbcd,
  pendingNodeIds: _0x1b2aca,
  isPresented: _0x19a522,
  scanNodes: scanNodes = !![],
} = {}) {
  const _0x29183d = _0x26033a && typeof _0x26033a === 'object' ? _0x26033a : {},
    _0x333826 = _0x28dbcd instanceof Map ? _0x28dbcd : new Map(),
    _0x47211c = _0x1b2aca instanceof Set ? _0x1b2aca : new Set();
  if (scanNodes !== ![]) {
    const _0x4414bb = new Set();
    for (const [_0x4dd0af, _0x180ffd] of Object['entries'](_0x29183d)) {
      if (!_0x4dd0af || !isNodeType(_0x180ffd, 'source-video')) continue;
      _0x4414bb['add'](_0x4dd0af);
      const _0x667757 = String(resolveCanvasVideoUrl(_0x180ffd) || '')['trim'](),
        _0xe76a2d = String(_0x333826['get'](_0x4dd0af) || '')['trim']();
      if (_0x667757 && _0x667757 !== _0xe76a2d) _0x47211c['add'](_0x4dd0af);
      else !_0x667757 && _0x47211c['delete'](_0x4dd0af);
      _0x333826['set'](_0x4dd0af, _0x667757);
    }
    for (const _0x54b9b9 of _0x333826['keys']()) {
      if (_0x4414bb['has'](_0x54b9b9)) continue;
      (_0x333826['delete'](_0x54b9b9), _0x47211c['delete'](_0x54b9b9));
    }
  }
  if (typeof _0x19a522 === 'function')
    for (const _0x30e443 of Array['from'](_0x47211c)) {
      const _0x358f00 = String(_0x333826['get'](_0x30e443) || '')['trim']();
      (!_0x358f00 || _0x19a522(_0x30e443, _0x358f00) === !![]) && _0x47211c['delete'](_0x30e443);
    }
  return _0x47211c;
}
export function applyRendererLowZoomRealVideoCandidates(_0x182930, _0x3961bb) {
  if (!(_0x3961bb instanceof Set) || _0x3961bb['size'] === 0x0) return _0x182930;
  const _0x2b054c = new Set(_0x182930?.['mountCandidateIds']),
    _0x49099d = new Set(_0x182930?.['parkCandidateIds']);
  for (const _0x1e3789 of _0x3961bb) {
    (_0x2b054c['add'](_0x1e3789), _0x49099d['delete'](_0x1e3789));
  }
  return { ..._0x182930, mountCandidateIds: _0x2b054c, parkCandidateIds: _0x49099d };
}
function hasResolvedPriorityMedia(_0x120af3) {
  if (!isNodeType(_0x120af3, PRIORITY_MEDIA_TYPES)) return ![];
  if (isNodeType(_0x120af3, ['source-audio', 'audio', 'ai-audio'])) return !!resolveCanvasAudioUrl(_0x120af3);
  return hasResolvedVideo(_0x120af3);
}
function collectActiveNodeIds({
  selectedNodeIds: _0x4995ca,
  connOverlay: _0xb6062,
  pickConnectMode: _0x38b0bc,
} = {}) {
  const _0xc26625 = new Set(
    _0x4995ca instanceof Set ? _0x4995ca : Array['isArray'](_0x4995ca) ? _0x4995ca : [],
  );
  return (
    [
      _0xb6062?.['srcId'],
      _0xb6062?.['hoverId'],
      _0x38b0bc?.['sourceNodeId'],
      _0x38b0bc?.['srcId'],
      _0x38b0bc?.['hoverNodeId'],
      _0x38b0bc?.['hoverId'],
    ]['forEach']((_0x40d1b9) => {
      if (_0x40d1b9) _0xc26625['add'](_0x40d1b9);
    }),
    _0xc26625
  );
}
export function hasRendererPriorityMediaWork({
  nodes: _0x108fe2,
  selectedNodeIds: _0x3ef344,
  connOverlay: _0x67dcba,
  pickConnectMode: _0x4c92ef,
  viewport: _0x22b550,
  containerWidth: _0x575808,
  containerHeight: _0x34f434,
  viewportPadding: viewportPadding = 0xc8,
  candidateNodeIds: _0x5b82f9,
} = {}) {
  const _0x42bb6b = _0x108fe2 && typeof _0x108fe2 === 'object' ? _0x108fe2 : {},
    _0x1526a3 = collectActiveNodeIds({
      selectedNodeIds: _0x3ef344,
      connOverlay: _0x67dcba,
      pickConnectMode: _0x4c92ef,
    });
  for (const _0x2e11c2 of _0x1526a3) {
    if (hasResolvedPriorityMedia(_0x42bb6b[_0x2e11c2])) return !![];
  }
  const _0x20dd94 = Number(_0x575808),
    _0x510fb6 = Number(_0x34f434);
  if (!_0x22b550 || !(_0x20dd94 > 0x0) || !(_0x510fb6 > 0x0)) return ![];
  const _0xdf2dfe = (_0x2bbdfb) =>
    hasResolvedPriorityMedia(_0x2bbdfb) &&
    isNodeInsideViewportPadding(_0x2bbdfb, _0x22b550, _0x20dd94, _0x510fb6, viewportPadding);
  if (_0x5b82f9 != null && typeof _0x5b82f9[Symbol['iterator']] === 'function') {
    for (const _0x9aaeed of _0x5b82f9) {
      if (_0xdf2dfe(_0x42bb6b[_0x9aaeed])) return !![];
    }
    return ![];
  }
  return Object['values'](_0x42bb6b)['some'](_0xdf2dfe);
}
export function shouldDeferInitialVideoMediaOnMount({
  node: _0x2ba57b,
  nodeId: _0x4b7a82,
  isSelected: _0x582fd5,
  isSelectionRelated: _0x8f3086,
  dragTargets: _0x48cc5c,
  nodeCount: nodeCount = 0x0,
  mountCandidateCount: mountCandidateCount = 0x0,
} = {}) {
  if (!_0x4b7a82 || !isNodeType(_0x2ba57b, ['source-video', 'video', 'ai-video'])) return ![];
  if (_0x582fd5 || _0x8f3086 || _0x48cc5c?.['has']?.(_0x4b7a82)) return ![];
  return (
    Number(nodeCount || 0x0) >= RENDERER_VIRTUALIZATION_CONFIG['veryDenseNodeCount'] ||
    Number(mountCandidateCount || 0x0) >= 0xc
  );
}
export function shouldEagerPosterlessSourceVideoOnMount({
  node: _0x272e7d,
  isVisibleVideoMediaNode: _0x534dc8,
} = {}) {
  if (!_0x534dc8 || !isNodeType(_0x272e7d, 'source-video')) return ![];
  return !!resolveCanvasVideoUrl(_0x272e7d) && !resolveCanvasVideoPosterUrl(_0x272e7d);
}
export const __rendererPriorityMediaWorkForTest = { hasResolvedPriorityMedia: hasResolvedPriorityMedia };
