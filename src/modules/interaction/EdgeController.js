import appStore, {
  graphStore as graphStore_2,
  uiStore as uiStore_2,
  workspaceStore as workspaceStore_2,
} from '../../core/stores/appStore.js';
import { isNodeType } from '../registry.js';
import { commit } from '../history.js';
import {
  screenToWorld,
  worldToScreen,
  isPointInRect,
  hitTestNode,
  findClosestNode,
  generateId,
  getNodeScreenRect,
  createNodeSpatialIndex,
  queryNodeSpatialIndexAtWorldPoint,
} from '../../core/math.js';
import { createLinkCursor, getCursorSize } from '../cursorUtils.js';
import {
  rafSampleLatest,
  getDisplayedMediaSizeFromNode,
  getDisplayedVideoMetaFromNode,
} from '../../utils/dom.js';
import {
  buildSourceMediaNodePayload,
  getAIGenerationDefaultSizeByType,
  getAIGenerationNodeSize,
  getNodeDefaultSize,
} from '../../services/fileService.js';
import { createPanorama360NodeData, PANORAMA_SCENE_DEFAULT_SIZE } from '../panoramaSceneNode/sceneNode.js';
import {
  createStoryboardScriptNodeData,
  STORYBOARD_SCRIPT_DEFAULT_SIZE,
} from '../../core/storyboardScriptFactory.js';
import { isDreaminaStyleVideoModel, normalizeDreaminaVideoRouteMode } from '../dreaminaVideoModelHelper.js';
import {
  getTargetInputPolicy,
  hasUsableInputNodeSource,
  isInputKindAllowed,
  isRhPersonReplaceWorkflowModel,
  normalizeInputKind,
  resolveEffectiveInputKind,
} from '../modelInputPolicy.js';
import {
  getMediaClipInputKind,
  isMediaClipNodeType,
  isSupportedMediaClipInput,
} from '../../components/media-clip/mediaClipState.js';
import { removeCoveredAssetInputRefForConnection } from '../promptAssetInputOverride.js';
import { getNodeCreationMenuItem } from '../nodeCreationMenuCatalog.js';
import { t } from '../../i18n/index.js';
import {
  fixedInputSlotAcceptsSource,
  getExclusiveSlotsForFixedSlot,
  getFixedInputSlotConfigFromManifest,
} from '../fixedInputAssetRefs.js';
import { stripImageGenerationResultStateForDerivedNode } from '../../core/imageTaskRuntimeState.js';
import { wouldCreateGroupOutputCycle } from '../groupDynamicOutput.js';
import { ANIME_REAL_MODEL_ID } from '../../manifests/index.js';
const graphStore = appStore?.graphStore || graphStore_2 || appStore,
  uiStore = appStore?.uiStore || uiStore_2 || appStore,
  workspaceStore = appStore?.workspaceStore || workspaceStore_2 || appStore;
function getStateRaw() {
  return { ...graphStore.getStateRaw(), ...uiStore.getStateRaw(), ...workspaceStore.getStateRaw() };
}
function getState() {
  return { ...graphStore.getState(), ...uiStore.getState(), ...workspaceStore.getState() };
}
function _buildOutEdgeMap(_0x2f7d97) {
  const _0x26e25a = new Map();
  for (const _0x3e7753 of _0x2f7d97) {
    if (!_0x3e7753) continue;
    const _0x44ed5d = _0x3e7753.sourceId,
      _0x160379 = _0x3e7753.targetId;
    if (!_0x44ed5d || !_0x160379) continue;
    let _0x38e65b = _0x26e25a.get(_0x44ed5d);
    (!_0x38e65b && ((_0x38e65b = new Set()), _0x26e25a.set(_0x44ed5d, _0x38e65b)), _0x38e65b.add(_0x160379));
  }
  return _0x26e25a;
}
const _edgeIndexCache = { edges: null, edgesRev: -1, outMap: new Map(), incomingByTarget: new Map() };
function _applyNodeCreationMenuMeta(_0x225664) {
  const _0x12ed1b = getNodeCreationMenuItem(_0x225664?.type);
  if (!_0x12ed1b) return _0x225664;
  return {
    ..._0x225664,
    label: _0x12ed1b.label || _0x225664.label,
    desc: _0x12ed1b.subtitle || _0x225664.desc,
    badge: _0x12ed1b.badge ?? _0x225664.badge,
    defaultName: _0x12ed1b.defaultName || _0x12ed1b.label || _0x225664.label,
  };
}
function _buildEdgeIndexes(_0x22b996) {
  const _0xfd670d = new Map(),
    _0x2329f2 = new Map();
  for (const _0x1be15c of Object.values(_0x22b996 || {})) {
    if (!_0x1be15c) continue;
    const _0x3ed0b4 = _0x1be15c.sourceId,
      _0x1a7009 = _0x1be15c.targetId;
    if (_0x3ed0b4 && _0x1a7009) {
      let _0x4539ce = _0xfd670d.get(_0x3ed0b4);
      (!_0x4539ce && ((_0x4539ce = new Set()), _0xfd670d.set(_0x3ed0b4, _0x4539ce)),
        _0x4539ce.add(_0x1a7009));
    }
    if (_0x1a7009) {
      let _0x325ca8 = _0x2329f2.get(_0x1a7009);
      (!_0x325ca8 && ((_0x325ca8 = []), _0x2329f2.set(_0x1a7009, _0x325ca8)), _0x325ca8.push(_0x1be15c));
    }
  }
  return { outMap: _0xfd670d, incomingByTarget: _0x2329f2 };
}
function _getEdgeIndexes(_0x55c5e6, _0x1bf1b) {
  if (!_0x55c5e6 || typeof _0x55c5e6 !== 'object')
    return (
      (_edgeIndexCache.edges = null),
      (_edgeIndexCache.edgesRev = -1),
      (_edgeIndexCache.outMap = new Map()),
      (_edgeIndexCache.incomingByTarget = new Map()),
      _edgeIndexCache
    );
  const _0x58872b = Number.isFinite(_0x1bf1b) ? _0x1bf1b : -1;
  if (_edgeIndexCache.edges === _0x55c5e6 && _edgeIndexCache.edgesRev === _0x58872b) return _edgeIndexCache;
  const { outMap: _0x54daac, incomingByTarget: _0x3e0bac } = _buildEdgeIndexes(_0x55c5e6);
  return (
    (_edgeIndexCache.edges = _0x55c5e6),
    (_edgeIndexCache.edgesRev = _0x58872b),
    (_edgeIndexCache.outMap = _0x54daac),
    (_edgeIndexCache.incomingByTarget = _0x3e0bac),
    _edgeIndexCache
  );
}
function _getOutEdgeMap(_0x5dc17d, _0x1ec9df) {
  return _getEdgeIndexes(_0x5dc17d, _0x1ec9df).outMap;
}
function _getIncomingEdgesByTarget(_0x5c2f66, _0x1c56a8, _0x32a313) {
  if (!_0x32a313) return [];
  return _getEdgeIndexes(_0x5c2f66, _0x1c56a8).incomingByTarget.get(_0x32a313) || [];
}
let _getDragContext = () => ({});
const _SVG_NS = 'http://www.w3.org/2000/svg',
  _AI_TEXT_DEFAULT_SIZE = getAIGenerationDefaultSizeByType('ai-text'),
  _AI_IMAGE_DEFAULT_SIZE = getAIGenerationDefaultSizeByType('ai-image'),
  _AI_VIDEO_DEFAULT_SIZE = getAIGenerationDefaultSizeByType('ai-video'),
  _AI_AUDIO_DEFAULT_SIZE = getAIGenerationDefaultSizeByType('ai-audio'),
  _PANORAMA_360_TARGET_TYPES = new Set(['panorama-360', 'panorama_360', 'panorama360']),
  _PANORAMA_SOURCE_BLOCKED_TYPES = new Set([
    'panorama-scene',
    'panorama_scene',
    'panorama-360',
    'panorama_360',
    'panorama360',
  ]),
  _PANORAMA_360_IMAGE_SOURCE_TYPES = new Set(['source-image', 'ai-image', 'image']),
  _NODE_SPATIAL_INDEX_DEFAULT_KEY = 'default',
  _NODE_SPATIAL_INDEX_EDGE_HOVER_KEY = 'edge-hover',
  _nodeSpatialIndexCache = new Map();
function _resolveEdgeHoverNodeRect(_0xa19bac) {
  if (!_0xa19bac || typeof _0xa19bac !== 'object') return null;
  return {
    x: _0xa19bac.x,
    y: _0xa19bac.y,
    width: _0xa19bac.width || (isNodeType(_0xa19bac, 'group') ? 0x190 : 0x104),
    height: _0xa19bac.height || (isNodeType(_0xa19bac, 'group') ? 0x12c : 80),
  };
}
function _getNodeSpatialIndex(_0x2db259, _0xef270c, _0xfab0c3 = _NODE_SPATIAL_INDEX_DEFAULT_KEY) {
  if (!_0x2db259 || typeof _0x2db259 !== 'object') return null;
  const _0x282554 = Number.isFinite(_0xef270c) ? _0xef270c : -1,
    _0x6f7ddd = _nodeSpatialIndexCache.get(_0xfab0c3);
  if (_0x6f7ddd && _0x6f7ddd.nodes === _0x2db259 && _0x6f7ddd.persistRev === _0x282554)
    return _0x6f7ddd.index;
  const _0x422213 =
    _0xfab0c3 === _NODE_SPATIAL_INDEX_EDGE_HOVER_KEY
      ? createNodeSpatialIndex(_0x2db259, { resolveRect: _resolveEdgeHoverNodeRect })
      : createNodeSpatialIndex(_0x2db259);
  return (
    _nodeSpatialIndexCache.set(_0xfab0c3, { nodes: _0x2db259, persistRev: _0x282554, index: _0x422213 }),
    _0x422213
  );
}
function _svgEl(_0x2a407d, _0x46082d, _0x463d3f, _0x1ea830) {
  const _0x2317ca = document.createElementNS(_SVG_NS, 'svg');
  return (
    _0x2317ca.setAttribute('width', String(_0x2a407d)),
    _0x2317ca.setAttribute('height', String(_0x46082d)),
    _0x2317ca.setAttribute('viewBox', '0 0 24 24'),
    _0x2317ca.setAttribute('fill', 'none'),
    _0x2317ca.setAttribute('stroke', _0x463d3f),
    _0x2317ca.setAttribute('stroke-width', String(_0x1ea830)),
    _0x2317ca
  );
}
function _iconAiText(_0x28309b) {
  const _0x4c1519 = _svgEl(18, 18, _0x28309b, 1.8),
    _0x1e1e99 = document.createElementNS(_SVG_NS, 'path');
  _0x1e1e99.setAttribute('d', 'M12 20h9');
  const _0x55e64b = document.createElementNS(_SVG_NS, 'path');
  return (
    _0x55e64b.setAttribute('d', 'M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z'),
    _0x4c1519.appendChild(_0x1e1e99),
    _0x4c1519.appendChild(_0x55e64b),
    _0x4c1519
  );
}
function _iconAiImage(_0x3fb0d5) {
  const _0x3a958b = _svgEl(18, 18, _0x3fb0d5, 1.8),
    _0x3d82bf = document.createElementNS(_SVG_NS, 'rect');
  (_0x3d82bf.setAttribute('x', '3'),
    _0x3d82bf.setAttribute('y', '3'),
    _0x3d82bf.setAttribute('width', '18'),
    _0x3d82bf.setAttribute('height', '18'),
    _0x3d82bf.setAttribute('rx', '3'));
  const _0x39a8c9 = document.createElementNS(_SVG_NS, 'circle');
  (_0x39a8c9.setAttribute('cx', '8.5'),
    _0x39a8c9.setAttribute('cy', '8.5'),
    _0x39a8c9.setAttribute('r', '1.5'),
    _0x39a8c9.setAttribute('fill', _0x3fb0d5));
  const _0x4289ee = document.createElementNS(_SVG_NS, 'polyline');
  return (
    _0x4289ee.setAttribute('points', '21 15 16 10 5 21'),
    _0x3a958b.appendChild(_0x3d82bf),
    _0x3a958b.appendChild(_0x39a8c9),
    _0x3a958b.appendChild(_0x4289ee),
    _0x3a958b
  );
}
function _iconAiVideo(_0x4180a8) {
  const _0x41e0cf = _svgEl(18, 18, _0x4180a8, 1.8),
    _0x153d21 = document.createElementNS(_SVG_NS, 'rect');
  (_0x153d21.setAttribute('x', '2'),
    _0x153d21.setAttribute('y', '6'),
    _0x153d21.setAttribute('width', '15'),
    _0x153d21.setAttribute('height', '12'),
    _0x153d21.setAttribute('rx', '2'));
  const _0x33be38 = document.createElementNS(_SVG_NS, 'path');
  return (
    _0x33be38.setAttribute('d', 'M17 9l5-3v12l-5-3V9z'),
    _0x41e0cf.appendChild(_0x153d21),
    _0x41e0cf.appendChild(_0x33be38),
    _0x41e0cf
  );
}
function _iconAiAudio(_0x40071a) {
  const _0x48d632 = _svgEl(18, 18, _0x40071a, 1.8),
    _0x53561d = document.createElementNS(_SVG_NS, 'path');
  _0x53561d.setAttribute('d', 'M9 18V5l12-2v13');
  const _0x13383d = document.createElementNS(_SVG_NS, 'circle');
  (_0x13383d.setAttribute('cx', '6'), _0x13383d.setAttribute('cy', '18'), _0x13383d.setAttribute('r', '3'));
  const _0x2512b8 = document.createElementNS(_SVG_NS, 'circle');
  return (
    _0x2512b8.setAttribute('cx', '18'),
    _0x2512b8.setAttribute('cy', '16'),
    _0x2512b8.setAttribute('r', '3'),
    _0x48d632.appendChild(_0x53561d),
    _0x48d632.appendChild(_0x13383d),
    _0x48d632.appendChild(_0x2512b8),
    _0x48d632
  );
}
function _iconStoryboardScript(_0x4f507b) {
  const _0x39564e = _svgEl(18, 18, _0x4f507b, 1.8),
    _0x241f8a = document.createElementNS(_SVG_NS, 'rect');
  (_0x241f8a.setAttribute('x', '3'),
    _0x241f8a.setAttribute('y', '4'),
    _0x241f8a.setAttribute('width', '18'),
    _0x241f8a.setAttribute('height', '16'),
    _0x241f8a.setAttribute('rx', '2'));
  const _0x10640a = document.createElementNS(_SVG_NS, 'line');
  (_0x10640a.setAttribute('x1', '3'),
    _0x10640a.setAttribute('y1', '9'),
    _0x10640a.setAttribute('x2', '21'),
    _0x10640a.setAttribute('y2', '9'));
  const _0x3831db = document.createElementNS(_SVG_NS, 'line');
  (_0x3831db.setAttribute('x1', '3'),
    _0x3831db.setAttribute('y1', '14'),
    _0x3831db.setAttribute('x2', '21'),
    _0x3831db.setAttribute('y2', '14'));
  const _0x42ea9d = document.createElementNS(_SVG_NS, 'line');
  return (
    _0x42ea9d.setAttribute('x1', '8'),
    _0x42ea9d.setAttribute('y1', '4'),
    _0x42ea9d.setAttribute('x2', '8'),
    _0x42ea9d.setAttribute('y2', '20'),
    _0x39564e.appendChild(_0x241f8a),
    _0x39564e.appendChild(_0x10640a),
    _0x39564e.appendChild(_0x3831db),
    _0x39564e.appendChild(_0x42ea9d),
    _0x39564e
  );
}
function _iconSourceText(_0x15fea2) {
  const _0x218551 = _svgEl(18, 18, _0x15fea2, 1.8),
    _0x4af48d = document.createElementNS(_SVG_NS, 'polyline');
  _0x4af48d.setAttribute('points', '4 7 4 4 20 4 20 7');
  const _0x5b0b94 = document.createElementNS(_SVG_NS, 'line');
  (_0x5b0b94.setAttribute('x1', '9'),
    _0x5b0b94.setAttribute('y1', '20'),
    _0x5b0b94.setAttribute('x2', '15'),
    _0x5b0b94.setAttribute('y2', '20'));
  const _0x2e267e = document.createElementNS(_SVG_NS, 'line');
  return (
    _0x2e267e.setAttribute('x1', '12'),
    _0x2e267e.setAttribute('y1', '4'),
    _0x2e267e.setAttribute('x2', '12'),
    _0x2e267e.setAttribute('y2', '20'),
    _0x218551.appendChild(_0x4af48d),
    _0x218551.appendChild(_0x5b0b94),
    _0x218551.appendChild(_0x2e267e),
    _0x218551
  );
}
function _isPanorama360TargetType(_0x19ec72) {
  return _PANORAMA_360_TARGET_TYPES.has(String(_0x19ec72 || '').trim());
}
function _isBlockedOutputNodeType(_0x4ed193) {
  return _PANORAMA_SOURCE_BLOCKED_TYPES.has(String(_0x4ed193 || '').trim());
}
function _isPanorama360ImageSourceType(_0x48e847) {
  return _PANORAMA_360_IMAGE_SOURCE_TYPES.has(String(_0x48e847 || '').trim());
}
function _isStoryboardInputTargetType(_0x5c56fb) {
  const _0x5e24bc = String(_0x5c56fb || '').trim();
  return _0x5e24bc === 'storyboard' || _0x5e24bc === 'storyboard-script';
}
function _isModelPolicyTargetType(_0x4cc57c) {
  const _0x1f9ad6 = String(_0x4cc57c || '').trim();
  return (
    _0x1f9ad6 === 'ai-image' ||
    _0x1f9ad6 === 'ai-text' ||
    _0x1f9ad6 === 'ai-video' ||
    _0x1f9ad6 === 'ai-audio'
  );
}
function _isSharedInputPolicyTargetType(_0x2d1745) {
  return _isModelPolicyTargetType(_0x2d1745) || _isStoryboardInputTargetType(_0x2d1745);
}
export function getAllowedInputNodeTypesForSidePlus(_0x547547) {
  const _0x48bc35 = String(_0x547547 || '').trim(),
    _0x32abdb = {
      'source-image': ['source-image', 'ai-image'],
      'ai-image': ['source-image', 'ai-image'],
      'ai-audio': ['source-text', 'ai-text', 'source-audio', 'source-video', 'ai-audio', 'ai-video'],
      'ai-video': ['source-text', 'source-video', 'ai-image', 'ai-audio', 'ai-video'],
      'ai-text': ['source-text', 'ai-image', 'ai-video', 'ai-audio'],
      'media-clip': ['source-image', 'ai-image', 'source-video', 'ai-video', 'source-audio', 'ai-audio'],
      storyboard: ['source-text', 'source-image', 'source-video', 'ai-text', 'ai-image', 'ai-video'],
      'storyboard-script': ['source-text', 'source-image', 'source-video', 'ai-text', 'ai-image', 'ai-video'],
      'panorama-360': ['source-image', 'ai-image'],
      panorama_360: ['source-image', 'ai-image'],
      panorama360: ['source-image', 'ai-image'],
    };
  return _0x32abdb[_0x48bc35] || ['source-text'];
}
export function getAllowedGenerationNodeTypesForQuoteMenu(_0x4a887d = []) {
  const _0x19a89a = ['ai-text', 'ai-image', 'ai-video', 'ai-audio', 'storyboard-script', 'panorama-360'],
    _0x5e79c9 = Array.isArray(_0x4a887d) ? _0x4a887d.filter(Boolean) : [];
  return _0x19a89a.filter((_0x32f908) =>
    _0x5e79c9.some((_0x5a06c4) =>
      isValidConnection(_0x5a06c4, { id: '__fake_' + _0x32f908, type: _0x32f908 }),
    ),
  );
}
export function setDragContextGetter(_0x383fd0) {
  _getDragContext = typeof _0x383fd0 === 'function' ? _0x383fd0 : () => ({});
}
export function isValidConnection(_0xce8d47, _0x3107f5) {
  if (!_0xce8d47 || !_0x3107f5) return false;
  if (_0xce8d47.id === _0x3107f5.id) return false;
  const _0x3dbe65 = _0xce8d47.type || '',
    _0xb9d441 = _0x3107f5.type || '';
  if (_0x3dbe65 === 'debug' || _isBlockedOutputNodeType(_0x3dbe65)) return false;
  const _0xe74154 = (_0x5b0396) =>
    _0x5b0396 === 'ai-image' ||
    _0x5b0396 === 'ai-text' ||
    _0x5b0396 === 'ai-video' ||
    _0x5b0396 === 'ai-audio' ||
    _0x5b0396 === 'media-clip' ||
    _isStoryboardInputTargetType(_0x5b0396) ||
    _0x5b0396 === 'group' ||
    _isPanorama360TargetType(_0x5b0396);
  if (!_0xe74154(_0xb9d441)) return false;
  if (_0x3dbe65 === 'group') return _0xb9d441 === 'group' || _isSharedInputPolicyTargetType(_0xb9d441);
  if (_isPanorama360TargetType(_0xb9d441)) {
    if (!_isPanorama360ImageSourceType(_0x3dbe65)) return false;
  }
  if (isMediaClipNodeType(_0xb9d441)) return isSupportedMediaClipInput(_0xce8d47);
  if (_0xb9d441 === 'ai-image') {
    const _0x5db519 = ['source-image', 'image', 'ai-image', 'source-text', 'text', 'ai-text'];
    if (!_0x5db519.includes(_0x3dbe65)) return false;
  }
  if (_0xb9d441 === 'ai-audio') {
    if (_0x3dbe65 === 'source-image' || _0x3dbe65 === 'image' || _0x3dbe65 === 'ai-image') return false;
  }
  if (_isSharedInputPolicyTargetType(_0xb9d441)) {
    const _0x4f7965 = resolveEffectiveInputKind(_0xce8d47);
    if (_0x4f7965 && !isInputKindAllowed(getTargetInputPolicy(_0x3107f5), _0x4f7965)) return false;
    const _0x4fb0b4 = getFixedInputSlotConfigFromManifest(_0x3107f5);
    if (_0x4fb0b4 && _0x4f7965 && _0x4f7965 !== 'text') {
      const _0x1cd8e2 = new Set(_0x4fb0b4.visibleSlots || []),
        _0x317c52 = _0x4fb0b4.slotOrderByType?.[_0x4f7965] || [],
        _0x4ab2ab = _0x317c52.filter((_0x1d47fe) => _0x1cd8e2.has(_0x1d47fe)),
        _0x424623 = _0x4ab2ab.length > 0 ? _0x4ab2ab : _0x317c52;
      if (
        _0x424623.length > 0 &&
        !_0x424623.some((_0x51ac5d) => fixedInputSlotAcceptsSource(_0x4fb0b4, _0x51ac5d, _0xce8d47))
      )
        return false;
    }
  }
  if (resolveEffectiveInputKind(_0xce8d47) === 'video' && !hasUsableInputNodeSource(_0xce8d47)) return false;
  return true;
}
function _videoSourceKey(_0x5684fa) {
  if (!_0x5684fa || typeof _0x5684fa !== 'object') return '';
  return (
    String(_0x5684fa.localPath || '').trim() ||
    String(_0x5684fa.displayLocalPath || '').trim() ||
    String(_0x5684fa.originalLocalPath || '').trim() ||
    String(_0x5684fa.videoLocalPath || '').trim() ||
    String(_0x5684fa.videoUrl || '').trim() ||
    String(_0x5684fa.src || '').trim() ||
    String(_0x5684fa.url || '').trim() ||
    String(_0x5684fa.resultUrl || '').trim() ||
    String(_0x5684fa.sourceUrl || '').trim() ||
    String(_0x5684fa.thumbId || '').trim()
  );
}
function _isUnavailableVideoRecord(_0x314326) {
  const _0x1b03d4 = _videoSourceKey(_0x314326);
  if (!_0x1b03d4) return false;
  return (
    _0x314326?.mediaUnavailable === true &&
    String(_0x314326?.mediaUnavailableSource || '').trim() === _0x1b03d4
  );
}
const SIDE_PLUS_POINTER_BLOCKER_SELECTOR = [
  '.text-prompt-panel',
  '.prompt-input-wrapper',
  '.prompt-textarea',
  '.prompt-panel-footer',
  '.floating-menu',
  '.img-model-menu',
  '.model-menu',
  '.fa-model-menu',
  '.img-ratio-popup',
  '.rh-res-popup',
  '.rh-adv-panel',
  '.rh-vram-adv-panel',
  '.node-floating-toolbar',
  '[data-ui-stop="1"]',
].join(',');
export function isSidePlusPointerBlockedByElement(_0x5484d5) {
  const _0x26ba0a =
    _0x5484d5 && typeof _0x5484d5.closest === 'function' ? _0x5484d5 : _0x5484d5?.parentElement || null;
  if (!_0x26ba0a) return false;
  if (_0x26ba0a.closest('.side-plus-btn, #v2-side-plus-holder')) return false;
  return !!_0x26ba0a.closest(SIDE_PLUS_POINTER_BLOCKER_SELECTOR);
}
function _isSidePlusPointerBlockedAt(_0x1dbac6, _0x2f2228) {
  if (typeof document === 'undefined') return false;
  if (!Number.isFinite(_0x1dbac6) || !Number.isFinite(_0x2f2228)) return false;
  const _0x399b0d = document.elementFromPoint?.(_0x1dbac6, _0x2f2228);
  return isSidePlusPointerBlockedByElement(_0x399b0d);
}
export function resolveSidePlusRenderState({
  isDraggingPlus: isDraggingPlus = false,
  isNodeDragging: isNodeDragging = false,
  isBoxSelecting: isBoxSelecting = false,
  isConnecting: isConnecting = false,
  isPanning: isPanning = false,
  isZooming: isZooming = false,
  isViewportAnimating: isViewportAnimating = false,
  isSpaceHeld: isSpaceHeld = false,
  selectedCount: selectedCount = 0,
  requestedSelectionOnly: requestedSelectionOnly = false,
} = {}) {
  const _0x5b89c4 = Number(selectedCount) || 0,
    _0xf075ac = _0x5b89c4 > 0,
    _0x59c652 = _0x5b89c4 >= 2;
  if (isDraggingPlus) return { shouldClear: true, selectionOnly: false };
  if (isNodeDragging) return { shouldClear: true, selectionOnly: false };
  if (_0xf075ac && (isBoxSelecting || isConnecting || isSpaceHeld))
    return { shouldClear: false, selectionOnly: true };
  if (isBoxSelecting || isConnecting) return { shouldClear: true, selectionOnly: false };
  const _0x5ec43a = requestedSelectionOnly || _0x59c652;
  if (isSpaceHeld && !isPanning && !_0x5ec43a) return { shouldClear: true, selectionOnly: false };
  return { shouldClear: false, selectionOnly: _0x5ec43a };
}
export function shouldShowSidePlusForNode({
  sideDistance: _0x28dccf,
  threshold: _0x273b18,
  isSelected: isSelected = false,
  isHovered: isHovered = false,
  isInside: isInside = false,
  nodeType: nodeType = '',
} = {}) {
  if (isSelected) return true;
  if (!isHovered) return false;
  const _0x437439 = Number(_0x28dccf),
    _0x30496b = Number(_0x273b18);
  if (Number.isFinite(_0x437439) && Number.isFinite(_0x30496b) && _0x437439 < _0x30496b) return true;
  return !!isInside && String(nodeType || '').trim() !== 'group';
}
export function shouldUseInlineMediaClipAddSlot(_0x3be2fe = '') {
  return isMediaClipNodeType(_0x3be2fe);
}
export function shouldShowRightSidePlusForNodeType(_0x163357 = '') {
  const _0x2e365c = String(_0x163357 || '').trim();
  if (_0x2e365c === 'comment-note') return false;
  if (_0x2e365c === 'storyboard') return false;
  if (_0x2e365c === 'collage') return false;
  return !_isBlockedOutputNodeType(_0x2e365c) && !shouldUseInlineMediaClipAddSlot(_0x2e365c);
}
export function getGroupSidePlusAnchorCandidateIds({
  nodes: _0x4121f5,
  viewport: _0xab6abb,
  mx: _0x5532ff,
  my: _0x1f8989,
  threshold: _0x115d7a,
  gap: gap = 36,
} = {}) {
  if (!Number.isFinite(_0x5532ff) || !Number.isFinite(_0x1f8989)) return [];
  const _0xeba8ab = Number(_0xab6abb?.zoom) || 1,
    _0x5a7f89 = Number(_0x115d7a);
  if (!Number.isFinite(_0x5a7f89)) return [];
  const _0x3f8d24 = [];
  for (const [_0x4429a7, _0x532d20] of Object.entries(_0x4121f5 || {})) {
    if (!isNodeType(_0x532d20, 'group')) continue;
    const _0x4e2f4e = String(_0x532d20?.id || _0x4429a7 || '').trim();
    if (!_0x4e2f4e) continue;
    const _0x54d946 = _0x532d20.width || 0x190,
      _0x19b235 = _0x532d20.height || 0x12c,
      _0x4a6574 = getNodeScreenRect(
        { x: _0x532d20.x, y: _0x532d20.y, width: _0x54d946, height: _0x19b235 },
        _0xab6abb,
      ),
      _0x58d4ff = _0x4a6574.right + gap * _0xeba8ab,
      _0x1c479d = _0x4a6574.top + _0x4a6574.height / 2;
    if (Math.hypot(_0x5532ff - _0x58d4ff, _0x1f8989 - _0x1c479d) < _0x5a7f89) _0x3f8d24.push(_0x4e2f4e);
  }
  return _0x3f8d24;
}
export function resolveSidePlusCandidateIds({
  selectedIds: selectedIds = [],
  isMultiSelection: isMultiSelection = false,
  selectionOnly: selectionOnly = false,
  hoverNodeId: hoverNodeId = null,
  groupAnchorIds: groupAnchorIds = [],
} = {}) {
  const _0xeec6fb = Array.isArray(groupAnchorIds) ? groupAnchorIds.filter(Boolean) : [],
    _0x1c7e46 = Array.isArray(selectedIds) ? selectedIds.filter(Boolean) : [],
    _0x7a8581 = isMultiSelection ? new Set() : new Set(_0x1c7e46),
    _0x567be2 = new Set(),
    _0x244e5f = !isMultiSelection && !selectionOnly && _0xeec6fb.length > 0;
  !isMultiSelection && !selectionOnly && hoverNodeId && !_0x244e5f && _0x7a8581.add(hoverNodeId);
  if (!isMultiSelection && !selectionOnly)
    for (const _0x5a64de of _0xeec6fb) {
      (_0x7a8581.add(_0x5a64de), _0x567be2.add(_0x5a64de));
    }
  return { candidateIds: _0x7a8581, sideAnchorHoverIds: _0x567be2 };
}
export function computeMultiSelectionBoundsForSidePlus(_0x2ecb43, _0x3fdbbd, _0x1526a0 = {}) {
  const _0x1e6bc3 = Array.isArray(_0x2ecb43) ? _0x2ecb43 : [];
  if (_0x1e6bc3.length < 2) return null;
  const _0x5234bd =
      _0x1526a0?.movedNodeIds && typeof _0x1526a0.movedNodeIds[Symbol.iterator] === 'function'
        ? new Set(_0x1526a0.movedNodeIds)
        : null,
    _0x5593b9 = Number.isFinite(_0x1526a0?.offsetX) ? _0x1526a0.offsetX : 0,
    _0x1c3914 = Number.isFinite(_0x1526a0?.offsetY) ? _0x1526a0.offsetY : 0;
  let _0x448428 = Infinity,
    _0x455108 = Infinity,
    _0x43c949 = -Infinity,
    _0x31f52d = -Infinity,
    _0x1c2e1c = 0;
  for (const _0x4154a3 of _0x1e6bc3) {
    const _0x490b6d = _0x3fdbbd?.[_0x4154a3];
    if (!_0x490b6d) continue;
    const _0x24b808 = _0x5234bd?.has(_0x4154a3) === true,
      _0x4045d0 = _0x490b6d.x + (_0x24b808 ? _0x5593b9 : 0),
      _0x235a74 = _0x490b6d.y + (_0x24b808 ? _0x1c3914 : 0);
    _0x1c2e1c += 1;
    const _0x4d603a = _0x490b6d.width || 0x104,
      _0x12f8fe = _0x490b6d.height || 100,
      _0x1016e6 = _0x4045d0,
      _0x3c5e46 = _0x490b6d.type !== 'group' ? _0x235a74 - 30 : _0x235a74,
      _0x3fd964 = _0x4045d0 + _0x4d603a,
      _0x4e9d97 = _0x235a74 + _0x12f8fe;
    ((_0x448428 = Math.min(_0x448428, _0x1016e6)),
      (_0x455108 = Math.min(_0x455108, _0x3c5e46)),
      (_0x43c949 = Math.max(_0x43c949, _0x3fd964)),
      (_0x31f52d = Math.max(_0x31f52d, _0x4e9d97)));
  }
  if (_0x1c2e1c < 2 || !Number.isFinite(_0x448428) || !Number.isFinite(_0x455108)) return null;
  return { minX: _0x448428, minY: _0x455108, maxX: _0x43c949, maxY: _0x31f52d };
}
let _draftEdgeCache = {
  pathEl: null,
  lastStartX: 0,
  lastStartY: 0,
  lastEndX: 0,
  lastEndY: 0,
  lastSide: '',
  lastZoom: 0,
};
function _resetDraftEdgeCache(_0x5f4e20 = null) {
  _draftEdgeCache = {
    pathEl: _0x5f4e20,
    lastStartX: 0,
    lastStartY: 0,
    lastEndX: 0,
    lastEndY: 0,
    lastSide: '',
    lastZoom: 0,
  };
}
function _getDraftEdgePath() {
  if (typeof document === 'undefined') return (_resetDraftEdgeCache(), null);
  const _0x225235 = document.getElementById('v2-edges');
  if (!_0x225235) return (_resetDraftEdgeCache(), null);
  let _0x476b1c = _draftEdgeCache.pathEl;
  return (
    _0x476b1c &&
      (_0x476b1c.parentNode !== _0x225235 || _0x476b1c.isConnected === false) &&
      (_0x476b1c.remove?.(), (_0x476b1c = null)),
    !_0x476b1c &&
      ((_0x476b1c = _0x225235.querySelector?.('#v2-draft-edge') || null),
      _0x476b1c &&
        (_0x476b1c.parentNode !== _0x225235 || _0x476b1c.isConnected === false) &&
        (_0x476b1c = null)),
    !_0x476b1c &&
      ((_0x476b1c = document.createElementNS('http://www.w3.org/2000/svg', 'path')),
      (_0x476b1c.id = 'v2-draft-edge'),
      _0x476b1c.setAttribute('class', 'conn-drag-path'),
      _0x476b1c.setAttribute('fill', 'none'),
      _0x476b1c.setAttribute('stroke', 'var(--indigo-70)'),
      _0x476b1c.setAttribute('stroke-linecap', 'round'),
      _0x225235.appendChild(_0x476b1c)),
    _draftEdgeCache.pathEl !== _0x476b1c && _resetDraftEdgeCache(_0x476b1c),
    _0x476b1c
  );
}
function _renderDraftEdgeDirectly(_0x2b24b3, _0x2e4776, _0xac5d47, _0x4be113, _0x2dd109, _0x47d3c8) {
  const _0x1606d0 = _getDraftEdgePath();
  if (!_0x1606d0) return;
  const _0x152c91 = Math.hypot(_0xac5d47 - _0x2b24b3, _0x4be113 - _0x2e4776);
  if (_0x152c91 < 5) {
    _0x1606d0.style.display = 'none';
    return;
  }
  const _0x5d4f02 =
      _0x2b24b3 !== _draftEdgeCache.lastStartX ||
      _0x2e4776 !== _draftEdgeCache.lastStartY ||
      _0xac5d47 !== _draftEdgeCache.lastEndX ||
      _0x4be113 !== _draftEdgeCache.lastEndY ||
      _0x2dd109 !== _draftEdgeCache.lastSide,
    _0x333716 = _0x47d3c8.zoom !== _draftEdgeCache.lastZoom;
  if (_0x5d4f02) {
    const _0x27eed1 = _0x2dd109 === 'left',
      _0x58fd36 = Math.abs(_0xac5d47 - _0x2b24b3),
      _0x938310 = Math.min(_0x58fd36 * 0.75, 80),
      _0x4282a1 = _0x27eed1 ? _0x2b24b3 - _0x938310 : _0x2b24b3 + _0x938310,
      _0x372607 = _0x27eed1 ? _0xac5d47 + _0x938310 : _0xac5d47 - _0x938310,
      _0x2b6290 =
        'M ' +
        _0x2b24b3 +
        ' ' +
        _0x2e4776 +
        ' C ' +
        _0x4282a1 +
        ' ' +
        _0x2e4776 +
        ', ' +
        _0x372607 +
        ' ' +
        _0x4be113 +
        ', ' +
        _0xac5d47 +
        ' ' +
        _0x4be113;
    (_0x1606d0.setAttribute('d', _0x2b6290),
      (_draftEdgeCache.lastStartX = _0x2b24b3),
      (_draftEdgeCache.lastStartY = _0x2e4776),
      (_draftEdgeCache.lastEndX = _0xac5d47),
      (_draftEdgeCache.lastEndY = _0x4be113),
      (_draftEdgeCache.lastSide = _0x2dd109));
  }
  (_0x333716 &&
    (_0x1606d0.setAttribute('stroke-width', '' + 2 / _0x47d3c8.zoom),
    (_0x1606d0.style.strokeDasharray = 6 / _0x47d3c8.zoom + ' ' + 4 / _0x47d3c8.zoom),
    (_draftEdgeCache.lastZoom = _0x47d3c8.zoom)),
    (_0x1606d0.style.display = 'block'));
}
function _clearDraftEdgeDirectly() {
  const _0x1a2536 = document.getElementById('v2-draft-edge');
  if (_0x1a2536) _0x1a2536.style.display = 'none';
}
export function createEdgeController() {
  function _0x163f29(_0x259c4e, _0x2ef569, _0xfd7b9a, _0xfb7699, _0x3c64ef) {
    if (!_0x2ef569 || !_0x2ef569.target) return false;
    const _0x1ebf84 = _0x2ef569.target.closest('.v2-handle');
    if (!_0x1ebf84) return false;
    return (
      _0x2ef569.preventDefault(),
      _0x2ef569.stopPropagation(),
      (_0x259c4e.isConnecting = true),
      (_0x259c4e.connectSourceId = _0x1ebf84.dataset.nodeId),
      (_0x259c4e.connectStartX = _0xfd7b9a),
      (_0x259c4e.connectStartY = _0xfb7699),
      (_0x259c4e.connectSide = 'left'),
      _renderDraftEdgeDirectly(_0xfd7b9a, _0xfb7699, _0xfd7b9a, _0xfb7699, 'left', _0x3c64ef),
      true
    );
  }
  function _0x43e68d(_0x4904eb, _0x561e6e, _0x28a177, _0x2a5581, _0x4943f6, _0x83a03e, _0x48f1a9, _0x3b2dc1) {
    _renderDraftEdgeDirectly(
      _0x4904eb.connectStartX || _0x2a5581,
      _0x4904eb.connectStartY || _0x4943f6,
      _0x2a5581,
      _0x4943f6,
      _0x4904eb.connectSide || 'left',
      _0x83a03e,
    );
    const _0x46a558 = _getNodeSpatialIndex(
      _0x48f1a9,
      getStateRaw()._persistRev,
      _NODE_SPATIAL_INDEX_DEFAULT_KEY,
    );
    let _0x276e85 = hitTestNode(
      _0x561e6e,
      _0x28a177,
      _0x48f1a9,
      _0x83a03e,
      _0x4904eb.connectSourceId,
      false,
      { spatialIndex: _0x46a558 },
    );
    if (_0x276e85 && _0x3b2dc1?.invalidNodeIds?.includes(_0x276e85)) _0x276e85 = null;
    return (
      (_0x3b2dc1?.hoverId || null) !== _0x276e85 &&
        graphStore.setConnOverlay({ hoverId: _0x276e85, side: _0x4904eb.connectSide }),
      true
    );
  }
  function _0x44c388(_0x363740, _0x59577d, _0xa3ec5f) {
    const _0x17c57f = getStateRaw(),
      { viewport: _0x14e54b, nodes: _0x1422fe } = _0x17c57f,
      _0x2986ae = _getNodeSpatialIndex(_0x1422fe, _0x17c57f._persistRev, _NODE_SPATIAL_INDEX_DEFAULT_KEY),
      _0x15b1fa = hitTestNode(_0x59577d, _0xa3ec5f, _0x1422fe, _0x14e54b, _0x363740.connectSourceId, false, {
        spatialIndex: _0x2986ae,
      }),
      _0x4f62e4 = _0x15b1fa ? _0x1422fe[_0x15b1fa] : null;
    let _0x46df7b = false;
    return (
      _0x4f62e4 &&
        (_0x46df7b = addEdgeWithPolicies({ sourceId: _0x363740.connectSourceId, targetId: _0x4f62e4.id })),
      _clearDraftEdgeDirectly(),
      graphStore.clearConnOverlay(),
      _0x46df7b
    );
  }
  return { tryStartHandleConnect: _0x163f29, updateHandleConnect: _0x43e68d, finishHandleConnect: _0x44c388 };
}
export function initConnectionHandles(_0x34f268) {
  const _0x4a61e9 = document.createElement('div');
  ((_0x4a61e9.id = 'v2-side-plus-holder'),
    Object.assign(_0x4a61e9.style, {
      position: 'fixed',
      inset: '0',
      pointerEvents: 'none',
      zIndex: '95',
      overflow: 'visible',
    }),
    document.body.appendChild(_0x4a61e9));
  const _0x2e08e7 = new Map(),
    _0x149b28 = new Map();
  let _0x375c5c = {
    dragging: false,
    srcId: null,
    sourceNodeIds: [],
    plusKind: 'node',
    side: 'right',
    ax: 0,
    ay: 0,
    sx: 0,
    sy: 0,
    lastX: 0,
    lastY: 0,
    anchorWorldX: null,
    anchorWorldY: null,
    didAssistPan: false,
  };
  function _0x3d2cdf(_0x4c892d, _0x176ac8 = null) {
    const _0x577574 = [],
      _0x39aaaf = new Set(),
      _0x2109c2 = Array.isArray(_0x4c892d) ? _0x4c892d : [];
    for (const _0x3b221b of _0x2109c2) {
      const _0x422cf3 = String(_0x3b221b || '').trim();
      if (!_0x422cf3 || _0x39aaaf.has(_0x422cf3)) continue;
      (_0x39aaaf.add(_0x422cf3), _0x577574.push(_0x422cf3));
    }
    const _0x3971e2 = String(_0x176ac8 || '').trim();
    if (_0x577574.length === 0 && _0x3971e2) _0x577574.push(_0x3971e2);
    return _0x577574;
  }
  function _0x16b783({
    sourceNodeId: _0xe61b16,
    targetNodeId: _0x475165,
    side: _0x32e081,
    nodes: _0xd6b82f,
    edges: _0x5556a8,
    outMap: _0x424c6f,
  }) {
    if (!_0xe61b16 || !_0x475165 || _0xe61b16 === _0x475165) return false;
    const _0x101667 = _0xd6b82f?.[_0xe61b16],
      _0x54aa1f = _0xd6b82f?.[_0x475165];
    if (!_0x101667 || !_0x54aa1f) return false;
    const _0x100ed8 = _0x32e081 === 'right' ? _0x101667 : _0x54aa1f,
      _0x48bbc0 = _0x32e081 === 'right' ? _0x54aa1f : _0x101667;
    if (!_0x100ed8?.id || !_0x48bbc0?.id) return false;
    const _0x221174 = !!_0x424c6f.get(_0x100ed8.id)?.has(_0x48bbc0.id);
    if (_0x221174) return false;
    if (
      String(_0x100ed8.type || '').trim() === 'group' &&
      String(_0x48bbc0.type || '').trim() === 'group' &&
      wouldCreateGroupOutputCycle({
        sourceId: _0x100ed8.id,
        targetId: _0x48bbc0.id,
        nodes: _0xd6b82f,
        edges: _0x5556a8,
      })
    )
      return false;
    return isValidConnection(_0x100ed8, _0x48bbc0);
  }
  function _0xedd222(_0x45baa5, _0x8c089, _0x24dfa1, _0x36b10d, _0x4d7e52) {
    if (_0x4d7e52 !== 'right') return;
    if (String(_0x24dfa1?.type || '') !== 'ai-video') return;
    if (String(_0x36b10d?.type || '') !== 'ai-video') return;
    const _0xb96e4c = getFixedInputSlotConfigFromManifest(_0x36b10d);
    if (_0xb96e4c?.slotKindById?.sourceVideo === 'video' && _0xb96e4c?.slotKindById?.refImage === 'image')
      return;
    const _0x3b324a = Number(_0x36b10d.width || 0),
      _0xac0510 = Number(_0x36b10d.height || 0),
      _0x1d67c0 =
        (Array.isArray(_0x36b10d.videos) && _0x36b10d.videos.length > 0) ||
        String(_0x36b10d.videoUrl || '').trim() ||
        String(_0x36b10d.localPath || '').trim() ||
        String(_0x36b10d.thumbId || '').trim();
    if (_0x3b324a !== 0x12c || _0xac0510 !== 0x12c || _0x1d67c0) return;
    const _0x26607c = getStateRaw(),
      _0x31b4bf = _0x26607c.nodes?.[_0x8c089];
    if (!_0x31b4bf) return;
    const _0xb8a00b = Number(_0x31b4bf.x || 0) + Number(_0x31b4bf.width || 0) / 2,
      _0xbace3f = Number(_0x31b4bf.y || 0) + Number(_0x31b4bf.height || 0) / 2,
      _0x1e3d21 = Date.now(),
      _0x56416d = () => {
        const _0x19efa3 = getDisplayedMediaSizeFromNode(_0x45baa5, 'video'),
          _0x38fc07 = Number(_0x19efa3?.w || 0),
          _0x56db81 = Number(_0x19efa3?.h || 0);
        let _0x3995d0 = _0x38fc07,
          _0x304081 = _0x56db81;
        if (!(_0x3995d0 > 0 && _0x304081 > 0)) {
          const _0x234fbe = getStateRaw(),
            _0xfe4b5 = _0x234fbe.nodes?.[_0x45baa5];
          if (_0xfe4b5) {
            const _0x79efc1 = Number(_0xfe4b5.mainVideoIndex),
              _0x37a8b5 = Number.isFinite(_0x79efc1) ? Math.max(0, Math.trunc(_0x79efc1)) : 0,
              _0x1eaa4c = Array.isArray(_0xfe4b5.videos) ? _0xfe4b5.videos : [],
              _0x9c03d9 = _0x1eaa4c[_0x37a8b5],
              _0x898e3e = Number(_0x9c03d9?.videoWidth || 0),
              _0x78e717 = Number(_0x9c03d9?.videoHeight || 0),
              _0x445c6b = Number(_0xfe4b5.selectedVideoWidth || 0),
              _0x14ab5e = Number(_0xfe4b5.selectedVideoHeight || 0),
              _0x1261f3 = Number(_0xfe4b5.videoWidth || 0),
              _0xd0aeb = Number(_0xfe4b5.videoHeight || 0);
            if (_0x898e3e > 0 && _0x78e717 > 0) ((_0x3995d0 = _0x898e3e), (_0x304081 = _0x78e717));
            else {
              if (_0x445c6b > 0 && _0x14ab5e > 0) ((_0x3995d0 = _0x445c6b), (_0x304081 = _0x14ab5e));
              else _0x1261f3 > 0 && _0xd0aeb > 0 && ((_0x3995d0 = _0x1261f3), (_0x304081 = _0xd0aeb));
            }
          }
        }
        if (_0x3995d0 > 0 && _0x304081 > 0) {
          const _0xe886f5 = _0x3995d0 / _0x304081;
          if (Number.isFinite(_0xe886f5) && _0xe886f5 > 0) {
            const _0x52eee5 = getAIGenerationNodeSize(_0x3995d0, _0x304081),
              _0x3ba9c1 = _0x52eee5.width,
              _0xc2fc86 = _0x52eee5.height;
            (graphStore.updateNodeData(_0x8c089, {
              width: _0x3ba9c1,
              height: _0xc2fc86,
              x: _0xb8a00b - _0x3ba9c1 / 2,
              y: _0xbace3f - _0xc2fc86 / 2,
            }),
              commit());
          }
          return;
        }
        if (Date.now() - _0x1e3d21 < 0x4b0) requestAnimationFrame(_0x56416d);
      };
    requestAnimationFrame(_0x56416d);
  }
  function _0x3d791a() {
    const { nodes: _0x30173f, edges: _0x165eec, _edgesRev: _0x38058d } = getStateRaw(),
      _0x4b6645 = _getOutEdgeMap(_0x165eec, _0x38058d),
      _0x4a03d1 = _0x3d2cdf(_0x375c5c.sourceNodeIds, _0x375c5c.srcId),
      _0x5ad59d = new Set(_0x4a03d1),
      _0x2bb05e = [];
    for (const [_0x9aca6f, _0x3c68a2] of Object.entries(_0x30173f)) {
      if (_0x5ad59d.has(_0x9aca6f)) {
        _0x2bb05e.push(_0x9aca6f);
        continue;
      }
      let _0x1b28fe = false;
      for (const _0x37af9c of _0x4a03d1) {
        if (
          !_0x16b783({
            sourceNodeId: _0x37af9c,
            targetNodeId: _0x9aca6f,
            side: _0x375c5c.side,
            nodes: _0x30173f,
            edges: _0x165eec,
            outMap: _0x4b6645,
          })
        )
          continue;
        _0x1b28fe = true;
        break;
      }
      if (!_0x1b28fe) _0x2bb05e.push(_0x9aca6f);
    }
    graphStore.setConnOverlay({ srcId: _0x375c5c.srcId, invalidNodeIds: _0x2bb05e, side: _0x375c5c.side });
  }
  function _0x3bd2b4() {
    graphStore.clearConnOverlay();
  }
  function _0x3c97f8() {
    for (const _0x4591b6 of _0x2e08e7.values()) _0x4591b6.remove();
    (_0x2e08e7.clear(), _0x149b28.clear(), _0x4a61e9.classList.remove('is-selection-plus-visible'));
  }
  function _0xfe3c2c(_0x5de0a2, _0x122f02, _0x23c011) {
    const _0x34c293 = _0x2e08e7.get(_0x5de0a2);
    if (_0x34c293) return _0x34c293;
    const _0x3c3786 = document.createElement('button');
    return (
      (_0x3c3786.type = 'button'),
      (_0x3c3786.className = 'side-plus-btn'),
      (_0x3c3786.textContent = ''),
      (_0x3c3786.dataset.plusKind = 'node'),
      _0x3c3786.setAttribute('aria-label', t('edgeController.addConnection')),
      _0x3c3786.addEventListener('pointerdown', (_0x3095d6) => {
        if (_0x3095d6.button === 1 || window._spaceHeld) return;
        if (_0x3095d6.button !== 0) return;
        const _0x2440c8 = _0x149b28.get(_0x5de0a2);
        if (!_0x2440c8) return;
        const _0x2cd442 = _0x3d2cdf(_0x2440c8.sourceNodeIds, _0x2440c8.nodeId),
          _0x41cde0 = getStateRaw(),
          _0x52522c =
            _0x2440c8.plusKind === 'multi'
              ? screenToWorld(_0x2440c8.ax, _0x2440c8.ay, _0x41cde0.viewport)
              : null;
        (_0x3095d6.stopPropagation(),
          _0x3095d6.preventDefault(),
          (_0x375c5c = {
            dragging: true,
            srcId: _0x2440c8.nodeId,
            sourceNodeIds: _0x2cd442,
            plusKind: _0x2440c8.plusKind === 'multi' ? 'multi' : 'node',
            side: _0x2440c8.side,
            ax: _0x2440c8.ax,
            ay: _0x2440c8.ay,
            sx: _0x3095d6.clientX,
            sy: _0x3095d6.clientY,
            lastX: _0x3095d6.clientX,
            lastY: _0x3095d6.clientY,
            anchorWorldX: _0x52522c?.x ?? null,
            anchorWorldY: _0x52522c?.y ?? null,
            didAssistPan: false,
          }),
          _0x3d791a(),
          _0x3c97f8());
      }),
      _0x4a61e9.appendChild(_0x3c3786),
      _0x2e08e7.set(_0x5de0a2, _0x3c3786),
      _0x149b28.set(_0x5de0a2, {
        nodeId: _0x122f02,
        side: _0x23c011,
        sourceNodeIds: _0x122f02 ? [_0x122f02] : [],
        plusKind: 'node',
        ax: 0,
        ay: 0,
      }),
      _0x3c3786
    );
  }
  function _0x348d44(
    _0x1b2930,
    _0x3f252f,
    _0x3e120f,
    _0x4fcb35,
    _0x13dc63,
    _0x2d4064,
    _0xa2573,
    _0x409c64,
    _0x381018,
    _0x15d93c = {},
  ) {
    const _0x338366 = Number(_0x15d93c?.sizeMultiplier),
      _0x2127f4 = Number.isFinite(_0x338366) && _0x338366 > 0 ? _0x338366 : 1,
      _0x417d5d = 20 * _0x2d4064 * _0x2127f4,
      _0x50df88 = _0x417d5d / 2,
      _0x330eca = String(_0x15d93c?.key || _0x3f252f + ':' + _0x3e120f),
      _0x2ce93d = _0x15d93c?.plusKind === 'multi' ? 'multi' : 'node',
      _0xfe85a2 = _0x3d2cdf(_0x15d93c?.sourceNodeIds, _0x3f252f),
      _0xa0f861 = _0xfe3c2c(_0x330eca, _0x3f252f, _0x3e120f);
    ((_0xa0f861.dataset.plusKind = _0x2ce93d),
      _0xa0f861.classList.toggle('side-plus-btn--multi', _0x2ce93d === 'multi'),
      (_0xa0f861.style.width = _0x417d5d + 'px'),
      (_0xa0f861.style.height = _0x417d5d + 'px'),
      (_0xa0f861.style.fontSize = _0x417d5d + 'px'),
      (_0xa0f861.style.display = 'flex'),
      (_0xa0f861.style.alignItems = 'center'),
      (_0xa0f861.style.justifyContent = 'center'));
    let _0x413213 = _0x4fcb35,
      _0x2929ec = _0x13dc63,
      _0x51cda3 = false;
    if (_0xa2573 !== undefined && _0x409c64 !== undefined) {
      const _0x307f09 = _0xa2573 - _0x4fcb35,
        _0x210d36 = _0x409c64 - _0x13dc63,
        _0x491ef8 = Math.hypot(_0x307f09, _0x210d36),
        _0x3c20e5 = 100 * _0x2d4064;
      if (_0x491ef8 < _0x3c20e5 && !_0x381018) {
        const _0x8a86d = Math.min(_0x491ef8, 45 * _0x2d4064),
          _0x358958 = Math.atan2(_0x210d36, _0x307f09);
        ((_0x413213 += Math.cos(_0x358958) * _0x8a86d),
          (_0x2929ec += Math.sin(_0x358958) * _0x8a86d),
          (_0xa0f861.style.background = 'var(--white-10)'),
          (_0x51cda3 = true));
      }
    }
    if (!_0x51cda3) _0xa0f861.style.background = '';
    ((_0xa0f861.style.left = _0x413213 - _0x50df88 + 'px'),
      (_0xa0f861.style.top = _0x2929ec - _0x50df88 + 'px'));
    const _0x3ba417 = _0x149b28.get(_0x330eca);
    (_0x3ba417 &&
      ((_0x3ba417.nodeId = _0x3f252f),
      (_0x3ba417.side = _0x3e120f),
      (_0x3ba417.sourceNodeIds = _0xfe85a2),
      (_0x3ba417.plusKind = _0x2ce93d),
      (_0x3ba417.ax = _0x413213),
      (_0x3ba417.ay = _0x2929ec)),
      _0x1b2930.add(_0x330eca));
  }
  function _0x1a4de5(_0x54ac50, _0x1f2152, _0x4c32e4 = {}) {
    const _0x2d7e0c = _getDragContext(),
      _0x5e5d87 = _0x4c32e4 && typeof _0x4c32e4 === 'object' ? _0x4c32e4 : {},
      _0x32abd0 = ['settingsModal', 'aboutModal', 'historyModal'];
    if (
      _0x32abd0.some((_0x33429e) => {
        const _0x518976 = document.getElementById(_0x33429e);
        return _0x518976 && _0x518976.style.display === 'flex';
      })
    ) {
      _0x3c97f8();
      return;
    }
    if (!_0x375c5c.dragging && _isSidePlusPointerBlockedAt(_0x54ac50, _0x1f2152)) {
      _0x3c97f8();
      return;
    }
    const _0x50f08e = getStateRaw(),
      {
        nodes: _0x30ee97,
        viewport: _0x42a532,
        selectedNodeIds: _0x42468b,
        _persistRev: _0x5e9614,
      } = _0x50f08e;
    if (!Object.keys(_0x30ee97).length) {
      _0x3c97f8();
      return;
    }
    let _0x1314f9 = _0x30ee97;
    const _0x501db9 =
      _0x5e5d87.nodeSizeOverrides && typeof _0x5e5d87.nodeSizeOverrides === 'object'
        ? _0x5e5d87.nodeSizeOverrides
        : null;
    if (_0x501db9)
      for (const [_0x365689, _0x4e086a] of Object.entries(_0x501db9)) {
        const _0x2c5b2a = _0x30ee97[_0x365689];
        if (!_0x2c5b2a) continue;
        const _0x58f9f5 = Number(_0x4e086a?.width),
          _0x3cb5f0 = Number(_0x4e086a?.height);
        if (!(Number.isFinite(_0x58f9f5) && Number.isFinite(_0x3cb5f0))) continue;
        if (_0x1314f9 === _0x30ee97) _0x1314f9 = { ..._0x30ee97 };
        _0x1314f9[_0x365689] = { ..._0x2c5b2a, width: _0x58f9f5, height: _0x3cb5f0 };
      }
    const _0x208f87 = _0x1314f9 !== _0x30ee97,
      _0x4b6555 = Array.isArray(_0x42468b) ? _0x42468b : [],
      _0x41d008 = new Set(_0x4b6555),
      _0x2989c4 = typeof document !== 'undefined' ? document.body : null,
      _0x469fec = resolveSidePlusRenderState({
        isDraggingPlus: _0x375c5c.dragging,
        isNodeDragging: !!_0x2d7e0c.isDragging,
        isBoxSelecting: !!_0x2d7e0c.isBoxSelecting,
        isConnecting: !!_0x2d7e0c.isConnecting,
        isPanning: !!_0x2d7e0c.isPanning,
        isZooming: !!_0x2989c4?.classList?.contains('is-zooming'),
        isViewportAnimating: !!_0x2989c4?.classList?.contains('is-viewport-animating'),
        isSpaceHeld: !!window._spaceHeld,
        selectedCount: _0x41d008.size,
        requestedSelectionOnly: _0x5e5d87.selectionOnly === true,
      });
    _0x4a61e9.classList.toggle('is-selection-plus-visible', _0x469fec.selectionOnly && _0x41d008.size > 0);
    if (_0x469fec.shouldClear) {
      _0x3c97f8();
      return;
    }
    const _0x549a70 = _0x469fec.selectionOnly;
    let _0x19950d = null,
      _0x3804b1 = false;
    if (_0x549a70) ((_0x19950d = null), (_0x3804b1 = false));
    else {
      if (_0x2d7e0c.isDragging && _0x2d7e0c.targetNodeId)
        ((_0x19950d = _0x2d7e0c.targetNodeId), (_0x3804b1 = true));
      else {
        const _0x194b8c = _0x208f87
            ? null
            : _getNodeSpatialIndex(_0x30ee97, _0x5e9614, _NODE_SPATIAL_INDEX_DEFAULT_KEY),
          _0x4508ad = findClosestNode(_0x54ac50, _0x1f2152, _0x1314f9, _0x42a532, true, {
            spatialIndex: _0x194b8c,
          });
        _0x4508ad && ((_0x19950d = _0x4508ad.nodeId), (_0x3804b1 = _0x4508ad.isInside));
      }
    }
    const _0x53e504 = _0x42a532.zoom || 1,
      _0x2f53fa = 36,
      _0x472e11 = 70 * _0x53e504;
    let _0x357d06 = Number.isFinite(_0x54ac50) ? _0x54ac50 : undefined,
      _0xb7f980 = Number.isFinite(_0x1f2152) ? _0x1f2152 : undefined;
    _0x549a70 && ((_0x357d06 = undefined), (_0xb7f980 = undefined));
    const _0x92cb30 = _0x41d008.size >= 2,
      _0x20dc59 =
        !_0x92cb30 && !_0x549a70
          ? getGroupSidePlusAnchorCandidateIds({
              nodes: _0x1314f9,
              viewport: _0x42a532,
              mx: _0x54ac50,
              my: _0x1f2152,
              threshold: _0x472e11,
              gap: _0x2f53fa,
            })
          : [],
      { candidateIds: _0x15a8ee, sideAnchorHoverIds: _0x340d3e } = resolveSidePlusCandidateIds({
        selectedIds: _0x4b6555,
        isMultiSelection: _0x92cb30,
        selectionOnly: _0x549a70,
        hoverNodeId: _0x19950d,
        groupAnchorIds: _0x20dc59,
      }),
      _0x3e32d5 = new Set(),
      _0x3b8b4f = shouldShowRightSidePlusForNodeType;
    for (const _0x5c8514 of _0x15a8ee) {
      const _0x25d803 = _0x1314f9[_0x5c8514];
      if (!_0x25d803) continue;
      if (shouldUseInlineMediaClipAddSlot(_0x25d803.type)) continue;
      const _0x215f1b =
          _0x2d7e0c.isDragging && (_0x41d008.has(_0x5c8514) || _0x2d7e0c.targetNodeId === _0x5c8514),
        _0x110a4f = _0x215f1b && Number.isFinite(_0x2d7e0c.pendingDx) ? _0x2d7e0c.pendingDx : 0,
        _0x44e847 = _0x215f1b && Number.isFinite(_0x2d7e0c.pendingDy) ? _0x2d7e0c.pendingDy : 0,
        _0x3b08cc = _0x25d803.width || (isNodeType(_0x25d803, 'group') ? 0x190 : 0x104),
        _0x3de05b = _0x25d803.height || (isNodeType(_0x25d803, 'group') ? 0x12c : 80),
        _0x5df0ae = getNodeScreenRect(
          { x: _0x25d803.x + _0x110a4f, y: _0x25d803.y + _0x44e847, width: _0x3b08cc, height: _0x3de05b },
          _0x42a532,
        ),
        _0x3bd791 = _0x5df0ae.top + _0x5df0ae.height / 2,
        _0x225f76 = _0x5df0ae.left - _0x2f53fa * _0x53e504,
        _0x59814c = _0x5df0ae.right + _0x2f53fa * _0x53e504,
        _0x155ddb = Math.hypot(_0x54ac50 - _0x225f76, _0x1f2152 - _0x3bd791),
        _0x7b156 = Math.hypot(_0x54ac50 - _0x59814c, _0x1f2152 - _0x3bd791),
        _0x5a2356 = _0x5c8514 === _0x19950d || _0x340d3e.has(_0x5c8514),
        _0x9f38a3 = _0x41d008.has(_0x5c8514),
        _0x224ea5 = _0x5c8514 === _0x19950d ? _0x3804b1 : false,
        _0x3afbcb = _0x224ea5 || (_0x2d7e0c.isDragging && _0x5c8514 === _0x2d7e0c.targetNodeId),
        _0x576551 = shouldShowSidePlusForNode({
          sideDistance: _0x155ddb,
          threshold: _0x472e11,
          isSelected: _0x9f38a3,
          isHovered: _0x5a2356,
          isInside: _0x224ea5,
          nodeType: _0x25d803.type,
        }),
        _0xaa6e45 = shouldShowSidePlusForNode({
          sideDistance: _0x7b156,
          threshold: _0x472e11,
          isSelected: _0x9f38a3,
          isHovered: _0x5a2356,
          isInside: _0x224ea5,
          nodeType: _0x25d803.type,
        }),
        _0x481fe6 = (_0x12160e) =>
          _0x12160e === 'ai-image' ||
          _0x12160e === 'ai-text' ||
          _0x12160e === 'ai-video' ||
          _0x12160e === 'ai-audio' ||
          _isPanorama360TargetType(_0x12160e);
      (_0x481fe6(_0x25d803.type) &&
        _0x576551 &&
        _0x348d44(
          _0x3e32d5,
          _0x5c8514,
          'left',
          _0x225f76,
          _0x3bd791,
          _0x53e504,
          _0x357d06,
          _0xb7f980,
          _0x3afbcb,
        ),
        _0x3b8b4f(_0x25d803.type) &&
          _0xaa6e45 &&
          _0x348d44(
            _0x3e32d5,
            _0x5c8514,
            'right',
            _0x59814c,
            _0x3bd791,
            _0x53e504,
            _0x357d06,
            _0xb7f980,
            _0x3afbcb,
          ));
    }
    const _0x1e36cf = _0x4b6555.filter((_0x52e9d5) => {
      const _0x2ef622 = _0x1314f9[_0x52e9d5];
      return !!_0x2ef622 && _0x3b8b4f(_0x2ef622.type);
    });
    if (_0x4b6555.length >= 2 && _0x1e36cf.length > 0) {
      const _0xf0b892 = _0x2d7e0c.isDragging && _0x41d008.has(_0x2d7e0c.targetNodeId),
        _0x1c8146 = computeMultiSelectionBoundsForSidePlus(
          _0x4b6555,
          _0x1314f9,
          _0xf0b892
            ? {
                movedNodeIds: _0x4b6555,
                offsetX: Number.isFinite(_0x2d7e0c.pendingDx) ? _0x2d7e0c.pendingDx : 0,
                offsetY: Number.isFinite(_0x2d7e0c.pendingDy) ? _0x2d7e0c.pendingDy : 0,
              }
            : undefined,
        );
      if (_0x1c8146) {
        const _0x3ed368 = 18,
          _0x18668e = getNodeScreenRect(
            {
              x: _0x1c8146.minX - _0x3ed368,
              y: _0x1c8146.minY - _0x3ed368,
              width: _0x1c8146.maxX - _0x1c8146.minX + _0x3ed368 * 2,
              height: _0x1c8146.maxY - _0x1c8146.minY + _0x3ed368 * 2,
            },
            _0x42a532,
          ),
          _0x1cea68 = _0x18668e.right + _0x2f53fa * _0x53e504,
          _0x556eea = _0x18668e.top + _0x18668e.height / 2,
          _0x5916ab =
            Number.isFinite(_0x54ac50) &&
            Number.isFinite(_0x1f2152) &&
            _0x54ac50 >= _0x18668e.left &&
            _0x54ac50 <= _0x18668e.right &&
            _0x1f2152 >= _0x18668e.top &&
            _0x1f2152 <= _0x18668e.bottom;
        _0x348d44(
          _0x3e32d5,
          _0x1e36cf[0],
          'right',
          _0x1cea68,
          _0x556eea,
          _0x53e504,
          _0x357d06,
          _0xb7f980,
          _0x5916ab,
          { key: 'multi:right', plusKind: 'multi', sourceNodeIds: _0x1e36cf, sizeMultiplier: 1.5 },
        );
      }
    }
    for (const [_0xc3b982, _0x2e3667] of _0x2e08e7.entries()) {
      if (_0x3e32d5.has(_0xc3b982)) continue;
      (_0x2e3667.remove(), _0x2e08e7.delete(_0xc3b982), _0x149b28.delete(_0xc3b982));
    }
  }
  const _0x5dd57f = rafSampleLatest(_0x1a4de5);
  ((window._v2UpdateSidePlus = _0x5dd57f),
    (window._v2UpdateSidePlusNow = _0x1a4de5),
    window.addEventListener('pointermove', (_0x4fc993) => {
      if (_0x375c5c.dragging) {
        let {
          viewport: _0x4361b1,
          nodes: _0x52d7ad,
          connOverlay: _0x5f2795,
          _persistRev: _0x4d15da,
        } = getStateRaw();
        if (window._spaceHeld === true) {
          const _0x402c0d = _0x4fc993.clientX - _0x375c5c.lastX,
            _0x32876e = _0x4fc993.clientY - _0x375c5c.lastY;
          if (_0x402c0d || _0x32876e) {
            ((_0x4361b1 = {
              x: (Number(_0x4361b1?.x) || 0) + _0x402c0d,
              y: (Number(_0x4361b1?.y) || 0) + _0x32876e,
              zoom: Number(_0x4361b1?.zoom) || 1,
            }),
              graphStore.updateViewport(_0x4361b1.x, _0x4361b1.y, _0x4361b1.zoom),
              (_0x375c5c.didAssistPan = true));
            const _0xd60529 = getStateRaw();
            ((_0x4361b1 = _0xd60529.viewport),
              (_0x52d7ad = _0xd60529.nodes),
              (_0x5f2795 = _0xd60529.connOverlay),
              (_0x4d15da = _0xd60529._persistRev));
          }
        }
        ((_0x375c5c.lastX = _0x4fc993.clientX), (_0x375c5c.lastY = _0x4fc993.clientY));
        const _0x559d1d = new Set(_0x5f2795?.invalidNodeIds || []),
          _0x281968 = _0x3d2cdf(_0x375c5c.sourceNodeIds, _0x375c5c.srcId),
          _0x1a4284 = new Set(_0x281968),
          _0x42ef72 = _0x52d7ad[_0x375c5c.srcId];
        let _0x488027 = 0,
          _0x181924 = 0;
        if (_0x375c5c.plusKind === 'multi') {
          if (Number.isFinite(_0x375c5c.anchorWorldX) && Number.isFinite(_0x375c5c.anchorWorldY))
            ((_0x488027 = _0x375c5c.anchorWorldX), (_0x181924 = _0x375c5c.anchorWorldY));
          else {
            const _0x31fa33 = screenToWorld(_0x375c5c.ax, _0x375c5c.ay, _0x4361b1);
            ((_0x488027 = _0x31fa33.x), (_0x181924 = _0x31fa33.y));
          }
        } else
          _0x42ef72 &&
            ((_0x488027 = _0x375c5c.side === 'right' ? _0x42ef72.x + (_0x42ef72.width || 0) : _0x42ef72.x),
            (_0x181924 = _0x42ef72.y + (_0x42ef72.height || 0) / 2));
        const { x: _0x9e9da9, y: _0x454848 } = screenToWorld(_0x4fc993.clientX, _0x4fc993.clientY, _0x4361b1);
        _renderDraftEdgeDirectly(_0x488027, _0x181924, _0x9e9da9, _0x454848, _0x375c5c.side, _0x4361b1);
        const _0x504577 = _getNodeSpatialIndex(_0x52d7ad, _0x4d15da, _NODE_SPATIAL_INDEX_EDGE_HOVER_KEY),
          _0x3c8de0 = queryNodeSpatialIndexAtWorldPoint(_0x504577, _0x9e9da9, _0x454848);
        let _0x390c44 = null;
        for (const _0x52f908 of _0x3c8de0) {
          const _0x2b74b8 = _0x52d7ad[_0x52f908];
          if (!_0x2b74b8) continue;
          if (_0x1a4284.has(_0x52f908)) continue;
          if (_0x559d1d.has(_0x52f908)) continue;
          const _0x27cd03 = _resolveEdgeHoverNodeRect(_0x2b74b8);
          if (!_0x27cd03) continue;
          if (
            isPointInRect(_0x9e9da9, _0x454848, _0x27cd03.x, _0x27cd03.y, _0x27cd03.width, _0x27cd03.height)
          ) {
            _0x390c44 = _0x52f908;
            break;
          }
        }
        (_0x5f2795?.hoverId || null) !== _0x390c44 &&
          graphStore.setConnOverlay({ hoverId: _0x390c44, side: _0x375c5c.side });
      } else _0x5dd57f(_0x4fc993.clientX, _0x4fc993.clientY);
    }),
    window.addEventListener(
      'pointerup',
      (_0xca0f80) => {
        if (!_0x375c5c.dragging) return;
        _0x375c5c.dragging = false;
        const {
            srcId: _0x18c1c6,
            sourceNodeIds: _0x1269a2,
            plusKind: _0x469830,
            side: _0x2df2da,
            sx: _0x1557e4,
            sy: _0x530e5f,
            didAssistPan: _0x1b4d66,
          } = _0x375c5c,
          _0x3e0cf4 = _0x3d2cdf(_0x1269a2, _0x18c1c6),
          _0x720d2d = new Set(_0x3e0cf4);
        ((_0x375c5c.srcId = null),
          (_0x375c5c.sourceNodeIds = []),
          (_0x375c5c.plusKind = 'node'),
          (_0x375c5c.anchorWorldX = null),
          (_0x375c5c.anchorWorldY = null),
          (_0x375c5c.didAssistPan = false),
          _0x3bd2b4());
        const _0x545087 = () => {
          (_clearDraftEdgeDirectly(), graphStore.clearConnOverlay());
        };
        if (
          !_0x1b4d66 &&
          Math.abs(_0xca0f80.clientX - _0x1557e4) < 5 &&
          Math.abs(_0xca0f80.clientY - _0x530e5f) < 5
        )
          return _0x545087();
        const {
            viewport: _0x472e92,
            nodes: _0xcffdf7,
            edges: _0x50e1bb,
            _persistRev: _0x31f6d1,
            _edgesRev: _0x1400c6,
          } = getStateRaw(),
          _0x463098 = _getNodeSpatialIndex(_0xcffdf7, _0x31f6d1, _NODE_SPATIAL_INDEX_DEFAULT_KEY);
        let _0x283ff8 = hitTestNode(
          _0xca0f80.clientX,
          _0xca0f80.clientY,
          _0xcffdf7,
          _0x472e92,
          _0x18c1c6,
          false,
          { spatialIndex: _0x463098 },
        );
        if (_0x283ff8 && _0x720d2d.has(_0x283ff8)) _0x283ff8 = null;
        if (_0x283ff8) {
          _0x545087();
          if (_0x469830 === 'multi') {
            if (_0x2df2da !== 'right') return;
            let _0x532956 = false;
            for (const _0x5cb8e3 of _0x3e0cf4) {
              if (!_0x5cb8e3 || _0x5cb8e3 === _0x283ff8) continue;
              const _0x5ef14a = getStateRaw(),
                _0x356cef = _0x5ef14a.nodes?.[_0x5cb8e3],
                _0x14b1d9 = _0x5ef14a.nodes?.[_0x283ff8];
              if (!_0x356cef || !_0x14b1d9) continue;
              if (!isValidConnection(_0x356cef, _0x14b1d9)) continue;
              const _0x3eb048 = addEdgeWithPolicies({ sourceId: _0x5cb8e3, targetId: _0x283ff8 });
              if (!_0x3eb048) continue;
              ((_0x532956 = true), _0xedd222(_0x5cb8e3, _0x283ff8, _0x356cef, _0x14b1d9, _0x2df2da));
            }
            if (!_0x532956) return;
            return;
          }
          const _0x1bfbb2 = _0x2df2da === 'right' ? _0x18c1c6 : _0x283ff8,
            _0x2e87a0 = _0x2df2da === 'right' ? _0x283ff8 : _0x18c1c6,
            _0x5a16c2 = _0xcffdf7[_0x1bfbb2],
            _0xf7735f = _0xcffdf7[_0x2e87a0],
            _0x174116 = _getOutEdgeMap(_0x50e1bb, _0x1400c6),
            _0x9679c4 = _getIncomingEdgesByTarget(_0x50e1bb, _0x1400c6, _0x2e87a0),
            _0x49e8d3 = !!_0x174116.get(_0x1bfbb2)?.has(_0x2e87a0);
          if (!isValidConnection(_0x5a16c2, _0xf7735f) || _0x49e8d3) return;
          const _0x2b5b20 = String(_0x5a16c2?.type || '').trim() === 'group';
          if (_0x2b5b20) {
            const _0x2afdf6 = addEdgeWithPolicies({ sourceId: _0x1bfbb2, targetId: _0x2e87a0 });
            if (!_0x2afdf6) return;
            _0xedd222(_0x1bfbb2, _0x2e87a0, _0x5a16c2, _0xf7735f, _0x2df2da);
            return;
          }
          if (_isAnimeRealTarget(_0xf7735f)) {
            if (!_isAnimeRealImageSrc(_0x5a16c2)) return;
            for (const _0x3b77b4 of _0x9679c4) graphStore.removeEdge(_0x3b77b4.id);
            _0xf7735f.rhAnimeRealRefUrl &&
              graphStore.updateNodeData(_0x2e87a0, {
                rhAnimeRealRefUrl: '',
                rhAnimeRealRefLocalPath: '',
                rhAnimeRealRefFileName: '',
              });
          }
          const _0x45e235 = _applyRhPersonReplaceV3FixedInputs({
            srcData: _0x5a16c2,
            tgtData: _0xf7735f,
            incomingEdges: _0x9679c4,
            nodes: _0xcffdf7,
            targetId: _0x2e87a0,
          });
          if (!_0x45e235.ok) return;
          const _0x33be5b = addEdgeWithPolicies({ sourceId: _0x1bfbb2, targetId: _0x2e87a0 });
          if (!_0x33be5b) return;
          _0xedd222(_0x1bfbb2, _0x2e87a0, _0x5a16c2, _0xf7735f, _0x2df2da);
          return;
        }
        if (_0x2df2da === 'left') {
          _showLeftQuoteMenu(_0xca0f80.clientX, _0xca0f80.clientY, _0x18c1c6, _0x472e92, _0x545087);
          return;
        }
        if (_0x2df2da !== 'right') {
          _0x545087();
          return;
        }
        if (_0x469830 === 'multi') {
          const _0x1deef4 = _0x3e0cf4.filter((_0x1eb77c) => !!_0xcffdf7[_0x1eb77c]);
          if (_0x1deef4.length === 0) {
            _0x545087();
            return;
          }
          _showQuoteMenu(_0xca0f80.clientX, _0xca0f80.clientY, _0x1deef4[0], _0x472e92, _0x545087, {
            sourceIds: _0x1deef4,
          });
          return;
        }
        const _0x3cd141 = _0xcffdf7[_0x18c1c6];
        if (!_0x3cd141) {
          _0x545087();
          return;
        }
        _showQuoteMenu(_0xca0f80.clientX, _0xca0f80.clientY, _0x18c1c6, _0x472e92, _0x545087);
      },
      { capture: true },
    ));
}
const _RH_ANIME_REAL_MODEL = ANIME_REAL_MODEL_ID,
  _isAnimeRealTarget = (_0x383296) =>
    !!_0x383296 && _0x383296.type === 'ai-image' && String(_0x383296.model || '') === _RH_ANIME_REAL_MODEL,
  _isAnimeRealImageSrc = (_0x3d19fc) => {
    const _0x49e008 = String(_0x3d19fc?.type || '');
    return _0x49e008 === 'source-image' || _0x49e008 === 'image' || _0x49e008 === 'ai-image';
  },
  _isRhPersonReplaceV3Target = (_0x14b5e3) =>
    !!_0x14b5e3 && _0x14b5e3.type === 'ai-image' && isRhPersonReplaceWorkflowModel(_0x14b5e3.model),
  _getRhV54RefKind = (_0x20eaef) => {
    return resolveEffectiveInputKind(_0x20eaef) || 'image';
  },
  _getAiAudioWorkflowKey = (_0x497eb0) => {
    if (!_0x497eb0 || String(_0x497eb0.type || '') !== 'ai-audio') return '';
    const _0x3c705b = String(_0x497eb0.audioWorkflowKey || '').trim();
    if (_0x3c705b) return _0x3c705b;
    const _0x508bde = String(_0x497eb0.model || '').trim();
    return _0x508bde;
  },
  _getManifestFixedInputConfig = (_0x29a076) => {
    const _0xa325cc = String(_0x29a076?.type || '').trim();
    if (_0xa325cc === 'ai-audio') {
      const _0x942a92 = _getAiAudioWorkflowKey(_0x29a076);
      return getFixedInputSlotConfigFromManifest({
        ..._0x29a076,
        audioWorkflowKey: _0x942a92,
        model: _0x942a92,
      });
    }
    return getFixedInputSlotConfigFromManifest(_0x29a076);
  },
  _edgeTimeKey = (_0x36ea2e) => {
    const _0xc92a7f = Number(_0x36ea2e?.createdAt);
    if (Number.isFinite(_0xc92a7f)) return _0xc92a7f;
    const _0x1d36de = String(_0x36ea2e?.id || ''),
      _0x342b57 = _0x1d36de.match(/(\d{10,})/g);
    if (_0x342b57 && _0x342b57.length) return Number(_0x342b57[_0x342b57.length - 1]) || 0;
    return 0;
  };
function _finishManifestFixedInputResult(_0x5410a1, _0x1dee81, _0x2bbf5e) {
  const _0x2b4e40 = String(_0x2bbf5e || '').trim();
  if (!_0x2b4e40) return { ok: true, refSlot: '' };
  const _0x53d158 = getExclusiveSlotsForFixedSlot(_0x5410a1?.exclusiveGroups, _0x2b4e40);
  if (_0x53d158.length > 1) {
    const _0x16153b = new Set(_0x53d158);
    for (const _0x5e1757 of Array.isArray(_0x1dee81) ? _0x1dee81 : []) {
      const _0x483bfa = String(_0x5e1757?.refSlot || '').trim();
      _0x5e1757?.id &&
        _0x483bfa !== _0x2b4e40 &&
        _0x16153b.has(_0x483bfa) &&
        graphStore.removeEdge(_0x5e1757.id);
    }
  }
  return { ok: true, refSlot: _0x2b4e40 };
}
function _canUseManifestFixedInputOverflow({
  config: _0xb15661,
  srcKind: _0x316879,
  tgtData: _0x4db174,
  incomingEdges: _0x1285d8,
  nodes: _0x3481cc,
}) {
  const _0x4f95ea = String(_0x316879 || '').trim();
  if (!_0x4f95ea || _0x4f95ea === 'text') return false;
  const _0x160c4b = new Set(_0xb15661?.visibleSlots || []),
    _0x5c4258 = (_0xb15661?.slotOrderByType?.[_0x4f95ea] || []).filter((_0xda8425) =>
      _0x160c4b.has(_0xda8425),
    ).length,
    _0x261385 = getTargetInputPolicy(_0x4db174),
    _0x1b584e = Number(_0x261385?.maxByKind?.[_0x4f95ea]);
  if (!Number.isFinite(_0x1b584e) || _0x1b584e <= _0x5c4258) return false;
  const _0x43e134 = (Array.isArray(_0x1285d8) ? _0x1285d8 : []).filter(
    (_0x45d772) => _getRhV54RefKind(_0x3481cc?.[_0x45d772?.sourceId]) === _0x4f95ea,
  ).length;
  return _0x43e134 < _0x1b584e;
}
function _allowsManifestFixedInputOverflow({ config: _0x36bf28, srcKind: _0x3bb716, tgtData: _0x432506 }) {
  const _0x49d7bf = String(_0x3bb716 || '').trim();
  if (!_0x49d7bf || _0x49d7bf === 'text') return false;
  const _0x2d9c5e = new Set(_0x36bf28?.visibleSlots || []),
    _0x28c990 = (_0x36bf28?.slotOrderByType?.[_0x49d7bf] || []).filter((_0x108190) =>
      _0x2d9c5e.has(_0x108190),
    ).length,
    _0x21c1d0 = getTargetInputPolicy(_0x432506),
    _0xc48831 = Number(_0x21c1d0?.maxByKind?.[_0x49d7bf]);
  return Number.isFinite(_0xc48831) && _0xc48831 > _0x28c990;
}
function _cycleManifestFixedInputWhenFull({
  config: _0x2edd32,
  srcKind: _0x17fa5d,
  tgtData: _0x5770a0,
  incomingEdges: _0x201139,
  nodes: _0x292f44,
  slotOrder: _0x4c41e6,
}) {
  const _0x411b07 = String(_0x17fa5d || '').trim();
  if (!_0x411b07 || _0x411b07 === 'text') return null;
  if (_0x2edd32?.manifest?.inputSlots?.cycleFixedInputWhenFull !== true) return null;
  const _0x11749a = getTargetInputPolicy(_0x5770a0),
    _0x293926 = Number(_0x11749a?.maxByKind?.[_0x411b07]);
  if (!Number.isFinite(_0x293926) || _0x293926 <= 0) return null;
  const _0x20b29e = new Set(_0x2edd32?.visibleSlots || []),
    _0xa57f95 = (_0x2edd32?.slotOrderByType?.[_0x411b07] || []).filter((_0x521d1f) =>
      _0x20b29e.has(_0x521d1f),
    ).length,
    _0x3e6d9b = (Array.isArray(_0x201139) ? _0x201139 : [])
      .filter((_0x46dc69) => _getRhV54RefKind(_0x292f44?.[_0x46dc69?.sourceId]) === _0x411b07)
      .sort((_0x27532e, _0x564df9) => _edgeTimeKey(_0x27532e) - _edgeTimeKey(_0x564df9));
  if (_0x3e6d9b.length < _0x293926) return null;
  const _0x4bd1d1 = _0x3e6d9b[0];
  if (!_0x4bd1d1?.id) return null;
  const _0x2d6cde = String(_0x4bd1d1.refSlot || '');
  graphStore.removeEdge(_0x4bd1d1.id);
  const _0x46b88b =
    _0x293926 <= _0xa57f95 && Array.isArray(_0x4c41e6) && _0x4c41e6.includes(_0x2d6cde) ? _0x2d6cde : '';
  return { ok: true, refSlot: _0x46b88b };
}
function _applyRhPersonReplaceV3FixedInputs({
  srcData: _0x3f4faf,
  tgtData: _0x41c7a2,
  incomingEdges: _0x3be89d,
  nodes: _0x475de3,
  targetId: _0x1836b2,
}) {
  if (!_isRhPersonReplaceV3Target(_0x41c7a2)) return { ok: true, refSlot: '' };
  if (!_isAnimeRealImageSrc(_0x3f4faf)) return { ok: false, refSlot: '' };
  const _0x4b1908 = ['replaceTarget', 'replacedImage'],
    _0x342fbf = Array.isArray(_0x3be89d) ? _0x3be89d : [],
    _0x51075a = _0x342fbf.filter((_0x2b8a45) => {
      const _0x708d7b = _0x475de3?.[_0x2b8a45.sourceId];
      return _isAnimeRealImageSrc(_0x708d7b);
    }),
    _0x7000bd = new Set(
      _0x51075a
        .map((_0x5c626f) => String(_0x5c626f.refSlot || ''))
        .filter((_0x2926ee) => _0x4b1908.includes(_0x2926ee)),
    ),
    _0x2c4b2d = _0x4b1908.find((_0x435112) => !_0x7000bd.has(_0x435112)) || '';
  if (_0x2c4b2d) return { ok: true, refSlot: _0x2c4b2d };
  let _0x5ecfcc = null;
  for (const _0x157608 of _0x51075a) {
    if (_0x4b1908.includes(String(_0x157608.refSlot || ''))) {
      if (!_0x5ecfcc || _edgeTimeKey(_0x157608) < _edgeTimeKey(_0x5ecfcc)) _0x5ecfcc = _0x157608;
    }
  }
  if (!_0x5ecfcc)
    for (const _0x54771e of _0x51075a) {
      if (!_0x5ecfcc || _edgeTimeKey(_0x54771e) < _edgeTimeKey(_0x5ecfcc)) _0x5ecfcc = _0x54771e;
    }
  if (_0x5ecfcc) graphStore.removeEdge(_0x5ecfcc.id);
  const _0x5cfd33 =
    _0x5ecfcc && _0x4b1908.includes(String(_0x5ecfcc.refSlot || ''))
      ? String(_0x5ecfcc.refSlot)
      : _0x4b1908[0];
  return { ok: true, refSlot: _0x5cfd33 };
}
function _applyManifestFixedInputs({
  srcData: _0x2e4285,
  tgtData: _0x91dad1,
  incomingEdges: _0x28f259,
  nodes: _0x102761,
  targetId: _0x5395a5,
  preferredRefSlot: _0x50e6b4,
}) {
  const _0x48a18a = String(_0x91dad1?.type || '').trim();
  if (_0x48a18a !== 'ai-video' && _0x48a18a !== 'ai-audio' && _0x48a18a !== 'ai-image')
    return { ok: true, refSlot: '' };
  if (_0x48a18a === 'ai-image' && _isRhPersonReplaceV3Target(_0x91dad1)) return { ok: true, refSlot: '' };
  const _0x322392 = _getManifestFixedInputConfig(_0x91dad1);
  if (!_0x322392) return { ok: true, refSlot: '' };
  const _0x27e76a = _getRhV54RefKind(_0x2e4285);
  if (_0x27e76a === 'text') return { ok: true, refSlot: '' };
  const _0x18fc28 = new Set(_0x322392.visibleSlots || []),
    _0xf71510 = _0x322392.slotOrderByType?.[_0x27e76a] || [],
    _0x10cb4a = _0xf71510.filter(
      (_0x331106) => _0x18fc28.has(_0x331106) && fixedInputSlotAcceptsSource(_0x322392, _0x331106, _0x2e4285),
    ),
    _0x5c2b8b = _0xf71510.filter(
      (_0x2d3daa) =>
        !_0x18fc28.has(_0x2d3daa) && fixedInputSlotAcceptsSource(_0x322392, _0x2d3daa, _0x2e4285),
    ),
    _0x24ceff = _0x10cb4a.length > 0 ? _0x10cb4a : _0x5c2b8b;
  if (_0x24ceff.length === 0) {
    if (
      _canUseManifestFixedInputOverflow({
        config: _0x322392,
        srcKind: _0x27e76a,
        tgtData: _0x91dad1,
        incomingEdges: _0x28f259,
        nodes: _0x102761,
      })
    )
      return { ok: true, refSlot: '' };
    return { ok: false, refSlot: '' };
  }
  const _0x5eced4 = _0x24ceff.includes(String(_0x50e6b4 || '')) ? String(_0x50e6b4 || '') : '',
    _0x37baef = Array.isArray(_0x28f259) ? _0x28f259 : [],
    _0x354f31 = _0x37baef.filter((_0x2de081) => {
      const _0x469f5c = _0x102761?.[_0x2de081.sourceId];
      return _getRhV54RefKind(_0x469f5c) === _0x27e76a;
    }),
    _0x581498 = _allowsManifestFixedInputOverflow({
      config: _0x322392,
      srcKind: _0x27e76a,
      tgtData: _0x91dad1,
    });
  for (const _0x536a6e of _0x354f31) {
    const _0x3d86a4 = String(_0x536a6e?.refSlot || '');
    if (_0x581498 && !_0x3d86a4) continue;
    (!_0x24ceff.includes(_0x3d86a4) ||
      !fixedInputSlotAcceptsSource(_0x322392, _0x3d86a4, _0x102761?.[_0x536a6e.sourceId])) &&
      graphStore.removeEdge(_0x536a6e.id);
  }
  const _0x20c862 = _0x354f31.filter(
      (_0x3dda57) =>
        _0x24ceff.includes(String(_0x3dda57?.refSlot || '')) &&
        fixedInputSlotAcceptsSource(_0x322392, _0x3dda57?.refSlot, _0x102761?.[_0x3dda57.sourceId]),
    ),
    _0x52f4b2 = new Set(
      _0x20c862
        .map((_0x528f09) => String(_0x528f09.refSlot || ''))
        .filter((_0x4dd6db) => _0x24ceff.includes(_0x4dd6db)),
    ),
    _0x6518b4 = _0x24ceff.find((_0x3cc4ff) => !_0x52f4b2.has(_0x3cc4ff)) || '';
  if (_0x5eced4 && !_0x52f4b2.has(_0x5eced4))
    return _finishManifestFixedInputResult(_0x322392, _0x37baef, _0x5eced4);
  if (_0x6518b4) return _finishManifestFixedInputResult(_0x322392, _0x37baef, _0x6518b4);
  if (
    _canUseManifestFixedInputOverflow({
      config: _0x322392,
      srcKind: _0x27e76a,
      tgtData: _0x91dad1,
      incomingEdges: _0x37baef,
      nodes: _0x102761,
    })
  )
    return { ok: true, refSlot: '' };
  const _0x1bcd59 = _cycleManifestFixedInputWhenFull({
    config: _0x322392,
    srcKind: _0x27e76a,
    tgtData: _0x91dad1,
    incomingEdges: _0x37baef,
    nodes: _0x102761,
    slotOrder: _0x24ceff,
  });
  if (_0x1bcd59) return _finishManifestFixedInputResult(_0x322392, _0x37baef, _0x1bcd59.refSlot);
  if (_0x24ceff.length === 1)
    return (
      _0x20c862.forEach((_0x367af5) => graphStore.removeEdge(_0x367af5.id)),
      _finishManifestFixedInputResult(_0x322392, _0x37baef, _0x24ceff[0])
    );
  if (_0x5eced4) {
    const _0x5d54c1 = _0x20c862.find((_0x3215fd) => String(_0x3215fd.refSlot || '') === _0x5eced4);
    if (_0x5d54c1) graphStore.removeEdge(_0x5d54c1.id);
    return _finishManifestFixedInputResult(_0x322392, _0x37baef, _0x5eced4);
  }
  const _0x53853c = _0x20c862.reduce(
      (_0x370a75, _0x40692e) =>
        !_edgeTimeKey(_0x370a75) || _edgeTimeKey(_0x40692e) > _edgeTimeKey(_0x370a75) ? _0x40692e : _0x370a75,
      null,
    ),
    _0x45f788 = String(_0x53853c?.refSlot || ''),
    _0x199dba = _0x24ceff.indexOf(_0x45f788),
    _0x175bb5 = _0x199dba >= 0 ? _0x24ceff[(_0x199dba + 1) % _0x24ceff.length] : _0x24ceff[0];
  let _0x238745 = null;
  for (const _0x5a53b7 of _0x20c862) {
    if (String(_0x5a53b7.refSlot || '') !== _0x175bb5) continue;
    if (!_0x238745 || _edgeTimeKey(_0x5a53b7) < _edgeTimeKey(_0x238745)) _0x238745 = _0x5a53b7;
  }
  if (!_0x238745)
    for (const _0x49ac20 of _0x20c862) {
      if (!_0x238745 || _edgeTimeKey(_0x49ac20) < _edgeTimeKey(_0x238745)) _0x238745 = _0x49ac20;
    }
  if (_0x238745) graphStore.removeEdge(_0x238745.id);
  const _0x3ebd7c =
    _0x238745 && _0x24ceff.includes(String(_0x238745.refSlot || '')) ? String(_0x238745.refSlot) : _0x175bb5;
  return _finishManifestFixedInputResult(_0x322392, _0x37baef, _0x3ebd7c);
}
function _isDreaminaVideoTarget(_0x1be551) {
  return (
    !!_0x1be551 &&
    String(_0x1be551.type || '') === 'ai-video' &&
    isDreaminaStyleVideoModel(_0x1be551.model, _0x1be551.provider)
  );
}
function _applyDreaminaVideoFixedInputs({
  srcData: _0x5954d0,
  tgtData: _0x5eca6b,
  incomingEdges: _0x182ed1,
  nodes: _0x37a77a,
  targetId: _0x56b72e,
}) {
  if (!_isDreaminaVideoTarget(_0x5eca6b)) return { ok: true, refSlot: '' };
  const _0x169b34 = normalizeDreaminaVideoRouteMode(_0x5eca6b?.dreaminaRouteMode, _0x5eca6b?.mode),
    _0x26d359 = _getRhV54RefKind(_0x5954d0),
    _0x454781 = Array.isArray(_0x182ed1) ? _0x182ed1 : [];
  if (_0x169b34 === 'frames2video') {
    if (_0x26d359 !== 'image') return { ok: false, refSlot: '' };
    for (const _0x288b3c of _0x454781) {
      const _0x58f0bd = _0x37a77a?.[_0x288b3c.sourceId];
      _getRhV54RefKind(_0x58f0bd) !== 'image' && graphStore.removeEdge(_0x288b3c.id);
    }
    const _0xc9a459 = _0x454781
      .filter((_0x2eb76d) => _getRhV54RefKind(_0x37a77a?.[_0x2eb76d.sourceId]) === 'image')
      .sort((_0x5032c8, _0x1a2b62) => _edgeTimeKey(_0x5032c8) - _edgeTimeKey(_0x1a2b62));
    while (_0xc9a459.length >= 2) {
      const _0xcf9fd1 = _0xc9a459.shift();
      if (_0xcf9fd1?.id) graphStore.removeEdge(_0xcf9fd1.id);
    }
    return { ok: true, refSlot: '' };
  }
  if (_0x169b34 === 'multiframe2video') {
    if (_0x26d359 !== 'image') return { ok: false, refSlot: '' };
    const _0x1129be = _0x454781
      .filter((_0x581b28) => _getRhV54RefKind(_0x37a77a?.[_0x581b28.sourceId]) === 'image')
      .sort((_0x27cc66, _0x5e5ea2) => _edgeTimeKey(_0x27cc66) - _edgeTimeKey(_0x5e5ea2));
    while (_0x1129be.length >= 20) {
      const _0x146c5f = _0x1129be.shift();
      if (_0x146c5f?.id) graphStore.removeEdge(_0x146c5f.id);
    }
    return { ok: true, refSlot: '' };
  }
  if (!['image', 'video', 'audio', 'text'].includes(_0x26d359)) return { ok: false, refSlot: '' };
  if (_0x26d359 === 'text') return { ok: true, refSlot: '' };
  const _0xde5e5e = _0x26d359 === 'image' ? 9 : 3,
    _0x1b696b = _0x454781
      .filter((_0x25fa59) => _getRhV54RefKind(_0x37a77a?.[_0x25fa59.sourceId]) === _0x26d359)
      .sort((_0x1d1afb, _0x25c86f) => _edgeTimeKey(_0x1d1afb) - _edgeTimeKey(_0x25c86f));
  while (_0x1b696b.length >= _0xde5e5e) {
    const _0xb31ea7 = _0x1b696b.shift();
    if (_0xb31ea7?.id) graphStore.removeEdge(_0xb31ea7.id);
  }
  return { ok: true, refSlot: '' };
}
function _applyGenericInputKindLimit({
  srcData: _0x56d3dd,
  tgtData: _0x158393,
  incomingEdges: _0x384968,
  nodes: _0x232170,
  sourceId: _0x58dbca,
}) {
  if (!_isModelPolicyTargetType(_0x158393?.type)) return { ok: true };
  if (_getManifestFixedInputConfig(_0x158393)) return { ok: true };
  if (_isDreaminaVideoTarget(_0x158393)) return { ok: true };
  const _0x2f9019 = resolveEffectiveInputKind(_0x56d3dd);
  if (!_0x2f9019 || _0x2f9019 === 'text') return { ok: true };
  const _0x21f18b = getTargetInputPolicy(_0x158393);
  if (!isInputKindAllowed(_0x21f18b, _0x2f9019)) return { ok: false };
  const _0x3fe312 = Number(_0x21f18b?.maxByKind?.[_0x2f9019]);
  if (!Number.isFinite(_0x3fe312)) return { ok: true };
  if (_0x3fe312 <= 0) return { ok: false };
  const _0x2dc0a7 = (Array.isArray(_0x384968) ? _0x384968 : []).some(
    (_0x29ae34) => _0x29ae34?.sourceId === _0x58dbca,
  );
  if (_0x2dc0a7) return { ok: true };
  const _0x49fc44 = (Array.isArray(_0x384968) ? _0x384968 : [])
    .filter((_0x1dcead) => _getRhV54RefKind(_0x232170?.[_0x1dcead?.sourceId]) === _0x2f9019)
    .sort((_0xbb0d37, _0x472074) => _edgeTimeKey(_0xbb0d37) - _edgeTimeKey(_0x472074));
  while (_0x49fc44.length >= _0x3fe312) {
    const _0x93d97a = _0x49fc44.shift();
    if (_0x93d97a?.id) graphStore.removeEdge(_0x93d97a.id);
  }
  return { ok: true };
}
function _applyMediaClipInputLimit({ srcData: _0x592ccf, tgtData: _0x5654a9 }) {
  if (!isMediaClipNodeType(_0x5654a9?.type)) return { ok: true };
  const _0x74f62f = getMediaClipInputKind(_0x592ccf);
  if (_0x74f62f !== 'video' && _0x74f62f !== 'image' && _0x74f62f !== 'audio') return { ok: false };
  if (!isSupportedMediaClipInput(_0x592ccf)) return { ok: false };
  return { ok: true };
}
function _replacePanorama360IncomingEdges({ tgtData: _0xd9e6b5, incomingEdges: _0x485b98 }) {
  if (!_isPanorama360TargetType(_0xd9e6b5?.type)) return;
  const _0x59d913 = Array.isArray(_0x485b98) ? _0x485b98 : [];
  for (const _0x2e044c of _0x59d913) {
    if (_0x2e044c?.id) graphStore.removeEdge(_0x2e044c.id);
  }
}
export function addEdgeWithPolicies({
  sourceId: _0x5bd9ef,
  targetId: _0xe31155,
  preferredRefSlot: _0x5ee42d,
}) {
  const _0x33ee29 = getStateRaw(),
    _0x1911a6 = _0x33ee29.nodes || {},
    _0x4b6419 = _0x1911a6[_0x5bd9ef],
    _0x396aee = _0x1911a6[_0xe31155];
  if (!_0x4b6419 || !_0x396aee) return false;
  if (!isValidConnection(_0x4b6419, _0x396aee)) return false;
  const _0x20254a = String(_0x4b6419.type || '').trim() === 'group';
  if (_0x20254a) {
    if (
      String(_0x396aee.type || '').trim() === 'group' &&
      wouldCreateGroupOutputCycle({
        sourceId: _0x5bd9ef,
        targetId: _0xe31155,
        nodes: _0x1911a6,
        edges: _0x33ee29.edges || {},
      })
    )
      return false;
    const _0x1a2026 = getStateRaw(),
      _0x2fd581 = !!_getOutEdgeMap(_0x1a2026.edges, _0x1a2026._edgesRev).get(_0x5bd9ef)?.has(_0xe31155);
    if (_0x2fd581) return false;
    return (
      graphStore.addEdge({
        id: 'edge-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        sourceId: _0x5bd9ef,
        targetId: _0xe31155,
        isGroupOutputLink: true,
        createdAt: Date.now(),
      }),
      true
    );
  }
  const _0x40ebce = _getIncomingEdgesByTarget(_0x33ee29.edges, _0x33ee29._edgesRev, _0xe31155);
  _replacePanorama360IncomingEdges({ tgtData: _0x396aee, incomingEdges: _0x40ebce });
  if (_isAnimeRealTarget(_0x396aee)) {
    if (!_isAnimeRealImageSrc(_0x4b6419)) return false;
    for (const _0x220020 of _0x40ebce) graphStore.removeEdge(_0x220020.id);
    _0x396aee.rhAnimeRealRefUrl &&
      graphStore.updateNodeData(_0xe31155, {
        rhAnimeRealRefUrl: '',
        rhAnimeRealRefLocalPath: '',
        rhAnimeRealRefFileName: '',
      });
  }
  const _0x217dd3 = _applyRhPersonReplaceV3FixedInputs({
    srcData: _0x4b6419,
    tgtData: _0x396aee,
    incomingEdges: _0x40ebce,
    nodes: _0x1911a6,
    targetId: _0xe31155,
  });
  if (!_0x217dd3.ok) return false;
  const _0x575e08 = _applyManifestFixedInputs({
    srcData: _0x4b6419,
    tgtData: _0x396aee,
    incomingEdges: _0x40ebce,
    nodes: _0x1911a6,
    targetId: _0xe31155,
    preferredRefSlot: _0x5ee42d,
  });
  if (!_0x575e08.ok) return false;
  const _0x5af90a = _applyDreaminaVideoFixedInputs({
    srcData: _0x4b6419,
    tgtData: _0x396aee,
    incomingEdges: _0x40ebce,
    nodes: _0x1911a6,
    targetId: _0xe31155,
  });
  if (!_0x5af90a.ok) return false;
  const _0x106ac3 = _applyMediaClipInputLimit({
    srcData: _0x4b6419,
    tgtData: _0x396aee,
    incomingEdges: _0x40ebce,
    nodes: _0x1911a6,
    sourceId: _0x5bd9ef,
  });
  if (!_0x106ac3.ok) return false;
  const _0x321e35 = _applyGenericInputKindLimit({
    srcData: _0x4b6419,
    tgtData: _0x396aee,
    incomingEdges: _0x40ebce,
    nodes: _0x1911a6,
    sourceId: _0x5bd9ef,
  });
  if (!_0x321e35.ok) return false;
  const _0xc6512a = getStateRaw(),
    _0x1054a5 = !!_getOutEdgeMap(_0xc6512a.edges, _0xc6512a._edgesRev).get(_0x5bd9ef)?.has(_0xe31155);
  if (_0x1054a5) return false;
  let _0x13c461 = '',
    _0x1ec436 = 0,
    _0x412598 = 0;
  if (String(_0x4b6419.type || '').includes('video')) {
    const _0x239296 = Array.isArray(_0x4b6419.videos) ? _0x4b6419.videos : [],
      _0x67479e = Number(_0x4b6419.mainVideoIndex),
      _0x1a6364 = Number.isFinite(_0x67479e) ? Math.max(0, Math.trunc(_0x67479e)) : 0,
      _0x3f600a = _0x239296[_0x1a6364] || null,
      _0x7de0ea = _0x239296.find(
        (_0xf62e2e) => _videoSourceKey(_0xf62e2e) && !_isUnavailableVideoRecord(_0xf62e2e),
      ),
      _0x22391b = _0x3f600a && !_isUnavailableVideoRecord(_0x3f600a) ? _0x3f600a : _0x7de0ea,
      _0x39cc74 =
        String(_0x22391b?.localPath || '').trim() ||
        String(_0x22391b?.displayLocalPath || '').trim() ||
        String(_0x22391b?.originalLocalPath || '').trim() ||
        String(_0x22391b?.videoLocalPath || '').trim() ||
        String(_0x22391b?.videoUrl || '').trim() ||
        (!_isUnavailableVideoRecord(_0x4b6419)
          ? String(_0x4b6419.localPath || '').trim() ||
            String(_0x4b6419.displayLocalPath || '').trim() ||
            String(_0x4b6419.originalLocalPath || '').trim() ||
            String(_0x4b6419.videoLocalPath || '').trim() ||
            String(_0x4b6419.videoUrl || '').trim() ||
            String(_0x4b6419.src || '').trim() ||
            String(_0x4b6419.url || '').trim() ||
            String(_0x4b6419.resultUrl || '').trim() ||
            String(_0x4b6419.sourceUrl || '').trim()
          : '');
    if (_0x39cc74) _0x13c461 = _0x39cc74;
    const _0x25eaff = Number(_0x3f600a?.videoWidth || 0),
      _0x5e0a9d = Number(_0x3f600a?.videoHeight || 0),
      _0x3028c2 = Number(_0x4b6419.selectedVideoWidth || 0),
      _0x4b04be = Number(_0x4b6419.selectedVideoHeight || 0),
      _0x1b3ec4 = Number(_0x4b6419.videoWidth || 0),
      _0x46f0ac = Number(_0x4b6419.videoHeight || 0);
    if (_0x25eaff > 0 && _0x5e0a9d > 0) ((_0x1ec436 = _0x25eaff), (_0x412598 = _0x5e0a9d));
    else {
      if (_0x3028c2 > 0 && _0x4b04be > 0) ((_0x1ec436 = _0x3028c2), (_0x412598 = _0x4b04be));
      else _0x1b3ec4 > 0 && _0x46f0ac > 0 && ((_0x1ec436 = _0x1b3ec4), (_0x412598 = _0x46f0ac));
    }
    if (!(_0x1ec436 > 0 && _0x412598 > 0 && _0x13c461))
      try {
        const _0x5d3516 = getDisplayedVideoMetaFromNode(_0x5bd9ef),
          _0xa56763 = String(_0x5d3516?.src || '').trim(),
          _0x4bdadd = Number(_0x5d3516?.w || 0),
          _0x30946c = Number(_0x5d3516?.h || 0);
        _0x4bdadd > 0 && _0x30946c > 0 && ((_0x1ec436 = _0x4bdadd), (_0x412598 = _0x30946c));
        if (_0xa56763)
          try {
            const _0x255496 = new URL(_0xa56763, window.location.origin),
              _0x43222d = String(_0x255496.pathname || '');
            if (_0x43222d.startsWith('/output/')) _0x13c461 = _0x43222d.replace(/^\/+/, '');
            else {
              if (_0x43222d.startsWith('/data/')) _0x13c461 = _0x43222d.replace(/^\/+/, '');
              else {
                if (_0x43222d.startsWith('/')) _0x13c461 = _0x43222d.replace(/^\/+/, '');
              }
            }
          } catch {
            if (_0xa56763.startsWith('/')) _0x13c461 = _0xa56763.replace(/^\/+/, '');
          }
      } catch {}
  }
  const _0x3b4e1f = _0x217dd3.refSlot || _0x575e08.refSlot || _0x5af90a.refSlot || '';
  (removeCoveredAssetInputRefForConnection({
    targetId: _0xe31155,
    targetNode: _0xc6512a.nodes?.[_0xe31155] || _0x396aee,
    sourceNode: _0x4b6419,
    sourceKind: resolveEffectiveInputKind(_0x4b6419),
    refSlot: _0x3b4e1f,
    incomingEdges: _getIncomingEdgesByTarget(_0xc6512a.edges, _0xc6512a._edgesRev, _0xe31155),
    nodes: _0xc6512a.nodes || _0x1911a6,
  }),
    graphStore.addEdge({
      id: 'edge-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      sourceId: _0x5bd9ef,
      targetId: _0xe31155,
      ...(_0x3b4e1f ? { refSlot: _0x3b4e1f } : null),
      ...(_0x13c461 ? { sourceMediaKey: _0x13c461 } : null),
      ...(_0x1ec436 > 0 && _0x412598 > 0 ? { sourceMediaW: _0x1ec436, sourceMediaH: _0x412598 } : null),
      createdAt: Date.now(),
    }));
  try {
    const _0x52d768 = _getManifestFixedInputConfig(_0x396aee),
      _0x88ba52 =
        String(_0x396aee?.type || '') === 'ai-video' &&
        (_0x52d768?.slotOrderByType?.video || []).includes('sourceVideo');
    if (_0x88ba52 && _0x1ec436 > 0 && _0x412598 > 0) {
      const _0xf6dbee =
          (Array.isArray(_0x396aee.videos) && _0x396aee.videos.length > 0) ||
          String(_0x396aee.videoUrl || '').trim() ||
          String(_0x396aee.localPath || '').trim() ||
          String(_0x396aee.thumbId || '').trim(),
        _0x258adc = String(_0x396aee.aspectRatio || '自适应');
      if (!_0xf6dbee && _0x258adc === '自适应') {
        const _0x37f3ca = getStateRaw(),
          _0x2b4a38 = _0x37f3ca.nodes?.[_0xe31155];
        if (_0x2b4a38) {
          const _0x392a12 = _0x1ec436 / _0x412598;
          if (Number.isFinite(_0x392a12) && _0x392a12 > 0) {
            const _0x2177e4 = getAIGenerationNodeSize(_0x1ec436, _0x412598),
              _0x43fb9c = _0x2177e4.width,
              _0x2572f1 = _0x2177e4.height,
              _0xf13067 = Number(_0x2b4a38.x || 0) + Number(_0x2b4a38.width || 0) / 2,
              _0x57bda3 = Number(_0x2b4a38.y || 0) + Number(_0x2b4a38.height || 0) / 2;
            graphStore.updateNodeData(_0xe31155, {
              width: _0x43fb9c,
              height: _0x2572f1,
              x: _0xf13067 - _0x43fb9c / 2,
              y: _0x57bda3 - _0x2572f1 / 2,
            });
          }
        }
      }
    }
  } catch {}
  return true;
}
export function initPickConnect(_0x22b613) {
  function _0x3d76d5(_0x346835, _0x592a47, _0x2ebfb5, _0x4a8ec6, _0x4365d4) {
    const _0x5759ef = _getOutEdgeMap(_0x4a8ec6, _0x4365d4),
      _0x58d685 = _0x2ebfb5[_0x346835],
      _0x32270f = [],
      _0x3095fc = _0x592a47 === 'left',
      _0x1637de = _0x592a47 === 'left' && _isAnimeRealTarget(_0x58d685),
      _0x3f41f1 = _0x592a47 === 'left' && _isRhPersonReplaceV3Target(_0x58d685),
      _0x460b69 = _0x592a47 === 'left' ? _getManifestFixedInputConfig(_0x58d685) : null,
      _0x1f5185 = new Set(_0x460b69?.visibleSlots || []);
    for (const [_0x696689, _0x206f58] of Object.entries(_0x2ebfb5)) {
      if (_0x696689 === _0x346835) continue;
      const _0x2264d4 = String(_0x206f58?.type || '').trim() === 'group';
      if (_0x1637de) {
        if (!_0x2264d4 && !_isAnimeRealImageSrc(_0x206f58)) {
          _0x32270f.push(_0x696689);
          continue;
        }
      }
      if (_0x3f41f1) {
        if (!_0x2264d4 && !_isAnimeRealImageSrc(_0x206f58)) {
          _0x32270f.push(_0x696689);
          continue;
        }
      }
      if (_0x460b69 && !_0x2264d4) {
        const _0x46cb2f = _getRhV54RefKind(_0x206f58),
          _0x2a816c = (_0x460b69.slotOrderByType?.[_0x46cb2f] || []).filter((_0x545bd1) =>
            _0x1f5185.has(_0x545bd1),
          );
        if (_0x46cb2f !== 'text' && _0x2a816c.length === 0) {
          _0x32270f.push(_0x696689);
          continue;
        }
      }
      const _0x62f679 = _0x3095fc ? _0x206f58 : _0x58d685,
        _0x4369f5 = _0x3095fc ? _0x58d685 : _0x206f58,
        _0x225d78 = !!(_0x62f679?.id && _0x4369f5?.id && _0x5759ef.get(_0x62f679.id)?.has(_0x4369f5.id));
      (!isValidConnection(_0x62f679, _0x4369f5) || _0x225d78) && _0x32270f.push(_0x696689);
    }
    return _0x32270f;
  }
  function _0x219d25(_0x1adb59, _0x41f2fe) {
    const { pickConnectMode: _0x35ac9e } = getStateRaw(),
      _0x4b7e9d = String(_0x35ac9e?.preferredRefSlot || '').trim(),
      _0x191506 = addEdgeWithPolicies({
        sourceId: _0x1adb59,
        targetId: _0x41f2fe,
        preferredRefSlot: _0x4b7e9d,
      });
    if (!_0x191506) return false;
    const {
      pickConnectMode: _0x493c01,
      nodes: _0xc066d5,
      edges: _0x54bd66,
      _edgesRev: _0x52c831,
    } = getStateRaw();
    if (_0x493c01 && _0x493c01.active) {
      const _0x1ea6f5 = _0x3d76d5(
        _0x493c01.sourceNodeId,
        _0x493c01.handleDirection,
        _0xc066d5,
        _0x54bd66,
        _0x52c831,
      );
      graphStore.setConnOverlay({ srcId: _0x493c01.sourceNodeId, invalidNodeIds: _0x1ea6f5 });
    }
    return true;
  }
  (_0x22b613.addEventListener(
    'contextmenu',
    (_0x4610c6) => {
      const { pickConnectMode: _0x5cb525 } = getStateRaw();
      if (!_0x5cb525 || !_0x5cb525.active) return;
      (_0x4610c6.preventDefault?.(),
        _0x4610c6.stopPropagation?.(),
        _0x4610c6.stopImmediatePropagation?.(),
        (_0x4610c6._pickConnectHandled = true),
        uiStore.setPickConnectMode({ active: false }));
    },
    true,
  ),
    _0x22b613.addEventListener(
      'click',
      (_0x599ce1) => {
        const { pickConnectMode: _0x83951c } = getStateRaw();
        if (!_0x83951c || !_0x83951c.active) return;
        const _0x45c72c = _0x599ce1.target.closest('.prompt-attachment-btn');
        if (_0x45c72c) {
          const _0x2ff5ac = _0x45c72c.closest('.v2-node');
          if (_0x2ff5ac && _0x2ff5ac.id === _0x83951c.sourceNodeId) {
            ((_0x599ce1._pickConnectHandled = true),
              _0x599ce1.stopImmediatePropagation(),
              uiStore.setPickConnectMode({ active: false }));
            return;
          }
        }
        const _0x1cdfe4 = _0x599ce1.target.closest('.v2-node');
        if (!_0x1cdfe4 || _0x1cdfe4.id === _0x83951c.sourceNodeId) return;
        const _0x56b7a1 = getStateRaw(),
          _0x3bf627 = _0x56b7a1.nodes[_0x1cdfe4.id];
        if (!_0x3bf627) return;
        const _0x19cfb9 = _0x83951c.handleDirection === 'left',
          _0x311938 = _0x19cfb9 ? _0x3bf627.id : _0x83951c.sourceNodeId,
          _0x3a4501 = _0x19cfb9 ? _0x83951c.sourceNodeId : _0x3bf627.id,
          _0x41b10f = _0x56b7a1.nodes[_0x311938],
          _0x3a5ac6 = _0x56b7a1.nodes[_0x3a4501];
        if (!isValidConnection(_0x41b10f, _0x3a5ac6)) return;
        _0x219d25(_0x311938, _0x3a4501) &&
          ((_0x599ce1._pickConnectHandled = true), _0x599ce1.stopImmediatePropagation());
      },
      true,
    ),
    _0x22b613.addEventListener('pointermove', (_0x2dff67) => {
      const {
        pickConnectMode: _0x2defc8,
        nodes: _0x41de0e,
        viewport: _0x3dc8b8,
        connOverlay: _0x2b8385,
        _persistRev: _0x1371c9,
      } = getStateRaw();
      if (!_0x2defc8 || !_0x2defc8.active) return;
      const _0x363957 = _getNodeSpatialIndex(_0x41de0e, _0x1371c9, _NODE_SPATIAL_INDEX_DEFAULT_KEY);
      let _0x193f6f = hitTestNode(
        _0x2dff67.clientX,
        _0x2dff67.clientY,
        _0x41de0e,
        _0x3dc8b8,
        _0x2defc8.sourceNodeId,
        false,
        { spatialIndex: _0x363957 },
      );
      (_0x193f6f &&
        _0x2b8385 &&
        _0x2b8385.invalidNodeIds &&
        _0x2b8385.invalidNodeIds.includes(_0x193f6f) &&
        (_0x193f6f = null),
        _0x2defc8.hoverNodeId !== _0x193f6f && uiStore.setPickConnectHover(_0x193f6f));
    }));
  const _0x412441 = (_0x334758) => {
    _0x334758.target.closest('[contenteditable="true"]') && _0x334758.target.blur();
  };
  let _0xd3826b = false,
    _0x5778d4 = null,
    _0x35d883 = null;
  uiStore.subscribeSelector(
    (_0x26eff0) => ({
      active: !!_0x26eff0.pickConnectMode?.active,
      sourceNodeId: _0x26eff0.pickConnectMode?.sourceNodeId || null,
      handleDirection: _0x26eff0.pickConnectMode?.handleDirection || null,
    }),
    ({ active: _0x591eb0, sourceNodeId: _0x5a4615, handleDirection: _0x183c9f }) => {
      if (_0x591eb0) {
        (_0x22b613.classList.add('is-connecting'), document.addEventListener('focusin', _0x412441, true));
        const _0x53d6c4 = getCursorSize(),
          _0x1d0ece = createLinkCursor({ size: _0x53d6c4 });
        (document.documentElement.classList.add('is-connecting-mode'),
          document.documentElement.style.setProperty('--connect-cursor', _0x1d0ece));
        if (!_0xd3826b || _0x5778d4 !== _0x5a4615 || _0x35d883 !== _0x183c9f) {
          ((_0xd3826b = true), (_0x5778d4 = _0x5a4615), (_0x35d883 = _0x183c9f));
          const { nodes: _0x3dfc97, edges: _0x5db1de, _edgesRev: _0x39d371 } = getStateRaw(),
            _0x12d087 = _0x3d76d5(_0x5a4615, _0x183c9f, _0x3dfc97, _0x5db1de, _0x39d371);
          graphStore.setConnOverlay({ srcId: _0x5a4615, invalidNodeIds: _0x12d087 });
        }
      } else
        (_0x22b613.classList.remove('is-connecting'),
          document.removeEventListener('focusin', _0x412441, true),
          document.documentElement.classList.remove('is-connecting-mode'),
          document.documentElement.style.removeProperty('--connect-cursor'),
          _0xd3826b &&
            ((_0xd3826b = false),
            (_0x5778d4 = null),
            graphStore.setSelectionBox({ active: false }),
            uiStore.setPickConnectHover(null),
            graphStore.clearConnOverlay()));
    },
  );
}
function _showQuoteMenu(_0x57b1b5, _0x9af7f2, _0x1b90d7, _0x2d5ac7, _0x14b710, _0x347d77 = {}) {
  document.querySelector('.v2-quote-menu')?.remove();
  const { nodes: _0x7d3ac } = getStateRaw(),
    _0x51c337 = (_0x2ef038, _0x1137f5 = null) => {
      const _0x7335df = [],
        _0x137e92 = new Set(),
        _0x5b87f4 = Array.isArray(_0x2ef038) ? _0x2ef038 : [];
      for (const _0x5b11e3 of _0x5b87f4) {
        const _0x47f25d = String(_0x5b11e3 || '').trim();
        if (!_0x47f25d || _0x137e92.has(_0x47f25d)) continue;
        (_0x137e92.add(_0x47f25d), _0x7335df.push(_0x47f25d));
      }
      const _0x28b75c = String(_0x1137f5 || '').trim();
      if (_0x7335df.length === 0 && _0x28b75c) _0x7335df.push(_0x28b75c);
      return _0x7335df;
    },
    _0x3e56d1 = _0x51c337(_0x347d77?.sourceIds, _0x1b90d7).filter((_0x4bb3d1) => !!_0x7d3ac[_0x4bb3d1]),
    _0x537482 = _0x3e56d1.includes(_0x1b90d7) ? _0x1b90d7 : _0x3e56d1[0],
    _0x536f04 = _0x537482 ? _0x7d3ac[_0x537482] : null;
  if (!_0x536f04) {
    _0x14b710?.();
    return;
  }
  const _0x5a68d4 = _0x3e56d1.map((_0x48084c) => _0x7d3ac[_0x48084c]).filter(Boolean),
    _0x35bcfc = (_0x3564a9, _0x397f93) => {
      const _0x1d06fa = getDisplayedMediaSizeFromNode(_0x3564a9, _0x397f93),
        _0x22876f = Number(_0x1d06fa?.w || 0),
        _0x22b722 = Number(_0x1d06fa?.h || 0),
        _0x464c2a = _0x22876f > 0 && _0x22b722 > 0 ? _0x22876f / _0x22b722 : 0;
      return Number.isFinite(_0x464c2a) && _0x464c2a > 0 ? _0x464c2a : 0;
    },
    _0x3f7dc0 = (_0x57fb19, _0x457de0, _0x3789fc, _0x491136) => {
      const _0x270d03 = Number(_0x491136);
      if (!(Number.isFinite(_0x270d03) && _0x270d03 > 0)) return false;
      const _0xa1d303 = getAIGenerationNodeSize(
          _0x270d03 >= 1 ? _0x270d03 : 1,
          _0x270d03 >= 1 ? 1 : 1 / _0x270d03,
        ),
        _0x504981 = _0xa1d303.width,
        _0x2f645f = _0xa1d303.height,
        _0x55d66b = getStateRaw(),
        _0x1ac4bd = _0x55d66b.nodes?.[_0x57fb19];
      if (!_0x1ac4bd) return false;
      return (
        graphStore.updateNodeData(_0x57fb19, {
          width: _0x504981,
          height: _0x2f645f,
          x: _0x457de0 - _0x504981 / 2,
          y: _0x3789fc - _0x2f645f / 2,
        }),
        commit(),
        true
      );
    },
    _0x11424f = (_0x15c179, _0x17466a) => {
      const _0x2a746f = getStateRaw(),
        _0x2d116e = _0x2a746f.nodes || {},
        _0x1f4e84 = _0x2d116e[_0x15c179],
        _0x5f4ee7 = _0x2d116e[_0x17466a];
      if (!_0x1f4e84 || !_0x5f4ee7) return;
      if (String(_0x1f4e84.type || '') !== 'ai-video') return;
      if (String(_0x5f4ee7.type || '') !== 'ai-video') return;
      const _0x16b79e = Number(_0x5f4ee7.width || 0),
        _0x452f1c = Number(_0x5f4ee7.height || 0);
      if (!(_0x16b79e === _AI_VIDEO_DEFAULT_SIZE.width && _0x452f1c === _AI_VIDEO_DEFAULT_SIZE.height))
        return;
      const _0xc68944 =
        (Array.isArray(_0x5f4ee7.videos) && _0x5f4ee7.videos.length > 0) ||
        String(_0x5f4ee7.videoUrl || '').trim() ||
        String(_0x5f4ee7.localPath || '').trim() ||
        String(_0x5f4ee7.thumbId || '').trim();
      if (_0xc68944) return;
      const _0x4c4bdd = Number(_0x5f4ee7.x || 0) + _0x16b79e / 2,
        _0x5d30b4 = Number(_0x5f4ee7.y || 0) + _0x452f1c / 2,
        _0x140377 = Date.now(),
        _0x44cd6c = () => {
          const _0xba1689 = getDisplayedMediaSizeFromNode(_0x15c179, 'video'),
            _0x2b5920 = Number(_0xba1689?.w || 0),
            _0x98e057 = Number(_0xba1689?.h || 0);
          let _0x3008ca = _0x2b5920,
            _0x413e6e = _0x98e057;
          if (!(_0x3008ca > 0 && _0x413e6e > 0)) {
            const _0x7bcbf2 = getStateRaw(),
              _0x5eac4a = _0x7bcbf2.nodes?.[_0x15c179];
            if (_0x5eac4a) {
              const _0x30f0c0 = Number(_0x5eac4a.mainVideoIndex),
                _0xa0c71b = Number.isFinite(_0x30f0c0) ? Math.max(0, Math.trunc(_0x30f0c0)) : 0,
                _0x5d82d6 = Array.isArray(_0x5eac4a.videos) ? _0x5eac4a.videos : [],
                _0xcd4d08 = _0x5d82d6[_0xa0c71b],
                _0x21a033 = Number(_0xcd4d08?.videoWidth || 0),
                _0x5d5550 = Number(_0xcd4d08?.videoHeight || 0),
                _0x3b0e9b = Number(_0x5eac4a.selectedVideoWidth || 0),
                _0x96c032 = Number(_0x5eac4a.selectedVideoHeight || 0),
                _0x53115c = Number(_0x5eac4a.videoWidth || 0),
                _0x4fe482 = Number(_0x5eac4a.videoHeight || 0);
              if (_0x21a033 > 0 && _0x5d5550 > 0) ((_0x3008ca = _0x21a033), (_0x413e6e = _0x5d5550));
              else {
                if (_0x3b0e9b > 0 && _0x96c032 > 0) ((_0x3008ca = _0x3b0e9b), (_0x413e6e = _0x96c032));
                else _0x53115c > 0 && _0x4fe482 > 0 && ((_0x3008ca = _0x53115c), (_0x413e6e = _0x4fe482));
              }
            }
          }
          if (_0x3008ca > 0 && _0x413e6e > 0) {
            _0x3f7dc0(_0x17466a, _0x4c4bdd, _0x5d30b4, _0x3008ca / _0x413e6e);
            return;
          }
          if (Date.now() - _0x140377 < 0x4b0) requestAnimationFrame(_0x44cd6c);
        };
      requestAnimationFrame(_0x44cd6c);
    },
    _0x1c9e56 = screenToWorld(_0x57b1b5, _0x9af7f2, _0x2d5ac7),
    _0x496400 = document.createElement('div');
  _0x496400.className = 'v2-quote-menu';
  const _0x4f13a3 = document.createElement('div');
  ((_0x4f13a3.className = 'v2-quote-title'),
    (_0x4f13a3.textContent = t('edgeController.quoteMenuTitle')),
    _0x496400.appendChild(_0x4f13a3));
  const _0x136227 = 'var(--white-50)',
    _0x3ed055 = 'var(--white-02)',
    _0xf14637 = [
      {
        iconEl: _iconAiText(_0x136227),
        iconBg: _0x3ed055,
        label: '文本',
        desc: '文案、脚本、提示词',
        type: 'ai-text',
        w: _AI_TEXT_DEFAULT_SIZE.width,
        h: _AI_TEXT_DEFAULT_SIZE.height,
      },
      {
        iconEl: _iconAiImage(_0x136227),
        iconBg: _0x3ed055,
        label: '图像',
        desc: '图片、海报、角色素材',
        type: 'ai-image',
        w: _AI_IMAGE_DEFAULT_SIZE.width,
        h: _AI_IMAGE_DEFAULT_SIZE.height,
      },
      {
        iconEl: _iconAiVideo(_0x136227),
        iconBg: _0x3ed055,
        label: '视频',
        desc: '短片、转场、动态镜头',
        type: 'ai-video',
        w: _AI_VIDEO_DEFAULT_SIZE.width,
        h: _AI_VIDEO_DEFAULT_SIZE.height,
      },
      {
        iconEl: _iconAiAudio(_0x136227),
        iconBg: _0x3ed055,
        label: '音频',
        desc: '配音、音效、音乐',
        type: 'ai-audio',
        w: _AI_AUDIO_DEFAULT_SIZE.width,
        h: _AI_AUDIO_DEFAULT_SIZE.height,
      },
      {
        iconEl: _iconStoryboardScript(_0x136227),
        iconBg: _0x3ed055,
        label: '分镜脚本',
        desc: '镜头表、提示词、节奏',
        type: 'storyboard-script',
        w: STORYBOARD_SCRIPT_DEFAULT_SIZE.width,
        h: STORYBOARD_SCRIPT_DEFAULT_SIZE.height,
        badge: 'BETA',
      },
      {
        iconEl: _iconAiImage(_0x136227),
        iconBg: _0x3ed055,
        label: '360全景图',
        desc: '全景画面与空间关系',
        type: 'panorama-360',
        w: PANORAMA_SCENE_DEFAULT_SIZE.width,
        h: PANORAMA_SCENE_DEFAULT_SIZE.height,
      },
    ].map(_applyNodeCreationMenuMeta),
    _0x369c7e = new Set(getAllowedGenerationNodeTypesForQuoteMenu(_0x5a68d4)),
    _0x575fb6 = _0xf14637.filter((_0x3f0731) => _0x369c7e.has(_0x3f0731.type));
  (_0x575fb6.forEach((_0x57c314) => {
    const _0x47a635 = document.createElement('button');
    _0x47a635.className = 'v2-menu-row' + (_0x57c314.desc ? ' has-desc' : '');
    const _0x34ef5b = document.createElement('div');
    ((_0x34ef5b.className = 'v2-menu-ico'), _0x34ef5b.replaceChildren());
    if (_0x57c314.iconEl) _0x34ef5b.appendChild(_0x57c314.iconEl.cloneNode(true));
    if (_0x57c314.iconBg) _0x34ef5b.style.background = _0x57c314.iconBg;
    const _0x20f0a6 = document.createElement('div');
    _0x20f0a6.className = 'v2-menu-txt-wrap';
    const _0x4e82ca = document.createElement('span');
    ((_0x4e82ca.className = 'v2-menu-lbl'), (_0x4e82ca.textContent = _0x57c314.label));
    if (_0x57c314.badge) {
      const _0x5247df = document.createElement('span');
      ((_0x5247df.textContent = _0x57c314.badge),
        (_0x5247df.className = 'v2-badge-beta'),
        _0x4e82ca.appendChild(_0x5247df));
    }
    _0x20f0a6.appendChild(_0x4e82ca);
    if (_0x57c314.desc) {
      const _0x93ef0f = document.createElement('span');
      ((_0x93ef0f.className = 'v2-menu-sub'),
        (_0x93ef0f.textContent = _0x57c314.desc),
        _0x20f0a6.appendChild(_0x93ef0f));
    }
    (_0x47a635.appendChild(_0x34ef5b),
      _0x47a635.appendChild(_0x20f0a6),
      _0x47a635.addEventListener('click', (_0x3908a2) => {
        _0x3908a2.stopPropagation();
        const _0x2520d4 = generateId(_0x57c314.type);
        let _0xda7be5 = _0x57c314.w,
          _0x5d4ad5 = _0x57c314.h;
        if (
          (_0x57c314.type === 'ai-image' || _0x57c314.type === 'ai-video') &&
          ((_0x536f04.width && _0x536f04.height) || (_0x536f04.videoWidth && _0x536f04.videoHeight))
        ) {
          let _0x4306da = 0;
          if (_0x57c314.type === 'ai-video' && String(_0x536f04.type || '') !== 'ai-video') {
            const _0x15f959 = Number(_0x536f04.mainVideoIndex) || 0,
              _0x3c63a0 = Math.max(0, Math.trunc(_0x15f959)),
              _0x595815 = Array.isArray(_0x536f04.videos) ? _0x536f04.videos : [],
              _0x40b594 = String(_0x536f04.localPath || '').trim(),
              _0x1f67a2 = String(_0x536f04.videoUrl || '').trim(),
              _0x5e72aa = Number(_0x536f04.selectedVideoWidth || 0),
              _0x31d47a = Number(_0x536f04.selectedVideoHeight || 0);
            let _0x2052be = _0x3c63a0;
            if (_0x595815.length) {
              let _0x2a4bd7 = -1;
              _0x40b594 &&
                (_0x2a4bd7 = _0x595815.findIndex(
                  (_0x5c523) => String(_0x5c523?.localPath || '').trim() === _0x40b594,
                ));
              _0x2a4bd7 < 0 &&
                _0x1f67a2 &&
                (_0x2a4bd7 = _0x595815.findIndex(
                  (_0x2eaa88) => String(_0x2eaa88?.videoUrl || '').trim() === _0x1f67a2,
                ));
              if (_0x2a4bd7 >= 0) _0x2052be = _0x2a4bd7;
              else {
                if (_0x3c63a0 >= _0x595815.length) _0x2052be = 0;
              }
            } else _0x2052be = 0;
            const _0x4d3c47 = _0x595815[_0x2052be] || _0x595815[0] || null,
              _0x38e7e9 = _0x4d3c47 ? Number(_0x4d3c47.videoWidth || _0x4d3c47.width || 0) : 0,
              _0x13a57b = _0x4d3c47 ? Number(_0x4d3c47.videoHeight || _0x4d3c47.height || 0) : 0;
            _0x4306da =
              (_0x5e72aa > 0 && _0x31d47a > 0 ? _0x5e72aa / _0x31d47a : 0) ||
              _0x35bcfc(_0x537482, 'video') ||
              (_0x38e7e9 > 0 && _0x13a57b > 0 ? _0x38e7e9 / _0x13a57b : 0) ||
              (_0x536f04.videoWidth && _0x536f04.videoHeight
                ? _0x536f04.videoWidth / _0x536f04.videoHeight
                : 0) ||
              (_0x536f04.width && _0x536f04.height ? _0x536f04.width / _0x536f04.height : 0);
          } else
            _0x4306da =
              _0x35bcfc(_0x537482, 'image') ||
              (_0x536f04.width && _0x536f04.height ? _0x536f04.width / _0x536f04.height : 0);
          if (!(Number.isFinite(_0x4306da) && _0x4306da > 0)) _0x4306da = 1;
          const _0x41dfbb = getAIGenerationNodeSize(
            _0x4306da >= 1 ? _0x4306da : 1,
            _0x4306da >= 1 ? 1 : 1 / _0x4306da,
          );
          ((_0xda7be5 = _0x41dfbb.width), (_0x5d4ad5 = _0x41dfbb.height));
        }
        let _0x1fc743 = {
          id: _0x2520d4,
          type: _0x57c314.type,
          x: _0x1c9e56.x - _0xda7be5 / 2,
          y: _0x1c9e56.y - _0x5d4ad5 / 2,
          width: _0xda7be5,
          height: _0x5d4ad5,
          name: _0x57c314.defaultName || _0x57c314.label,
        };
        (_0x57c314.type === 'ai-image' || _0x57c314.type === 'ai-video') &&
          !Object.prototype.hasOwnProperty.call(_0x1fc743, 'aspectRatio') &&
          (_0x1fc743.aspectRatio = '自适应');
        if (_0x536f04.type === _0x57c314.type) {
          const _0x1772cc = { ..._0x536f04 };
          (delete _0x1772cc.id,
            delete _0x1772cc.x,
            delete _0x1772cc.y,
            delete _0x1772cc.width,
            delete _0x1772cc.height,
            delete _0x1772cc.name,
            delete _0x1772cc.prompt,
            delete _0x1772cc.outputText,
            stripImageGenerationResultStateForDerivedNode(_0x1772cc),
            delete _0x1772cc.batchSize,
            (_0x1fc743 = { ..._0x1772cc, ..._0x1fc743 }));
        }
        _isPanorama360TargetType(_0x1fc743.type) &&
          (_0x1fc743 = createPanorama360NodeData({
            id: _0x1fc743.id,
            x: _0x1fc743.x,
            y: _0x1fc743.y,
            width: _0x1fc743.width,
            height: _0x1fc743.height,
            name: _0x1fc743.name,
          }));
        _0x1fc743.type === 'storyboard-script' &&
          (_0x1fc743 = createStoryboardScriptNodeData({
            id: _0x1fc743.id,
            x: _0x1fc743.x,
            y: _0x1fc743.y,
            width: _0x1fc743.width,
            height: _0x1fc743.height,
            name: _0x1fc743.name,
          }));
        graphStore.addNode(_0x1fc743);
        let _0x3799ed = false,
          _0x4805dd = '';
        for (const _0x56a0c6 of _0x3e56d1) {
          const _0x1b963e = getStateRaw(),
            _0x4a80d5 = _0x1b963e.nodes?.[_0x56a0c6],
            _0x3ff464 = _0x1b963e.nodes?.[_0x2520d4];
          if (!_0x4a80d5 || !_0x3ff464) continue;
          if (!isValidConnection(_0x4a80d5, _0x3ff464)) continue;
          const _0x930288 = addEdgeWithPolicies({ sourceId: _0x56a0c6, targetId: _0x2520d4 });
          if (!_0x930288) continue;
          _0x3799ed = true;
          if (!_0x4805dd) _0x4805dd = _0x56a0c6;
        }
        if (!_0x3799ed && _0x3e56d1.length === 1) {
          const _0x2a611f = generateId('edge');
          (graphStore.addEdge({
            id: _0x2a611f,
            sourceId: _0x3e56d1[0],
            targetId: _0x2520d4,
            createdAt: Date.now(),
          }),
            (_0x3799ed = true),
            (_0x4805dd = _0x3e56d1[0]));
        }
        (graphStore.setSelectedNodes([_0x2520d4]),
          commit(),
          _0x57c314.type === 'ai-video' && _0x4805dd && _0x11424f(_0x4805dd, _0x2520d4),
          _0x2c600e?.(),
          _0x496400.remove(),
          _0x14b710?.());
      }),
      _0x496400.appendChild(_0x47a635));
  }),
    document.body.appendChild(_0x496400));
  const _0x3d859b = () => {
    const _0x5759e4 = getStateRaw().viewport || _0x2d5ac7,
      _0x3eec94 = worldToScreen(_0x1c9e56.x, _0x1c9e56.y, _0x5759e4);
    ((_0x496400.style.left = _0x3eec94.x + 'px'), (_0x496400.style.top = _0x3eec94.y + 'px'));
  };
  _0x3d859b();
  const _0x2c600e = graphStore.subscribeSelector(
      (_0x158e91) => _0x158e91.viewport,
      () => _0x3d859b(),
    ),
    _0x51922a = (_0xa9e5b0) => {
      if (_0x496400.contains(_0xa9e5b0.target)) return;
      (_0x2c600e?.(),
        _0x496400.remove(),
        document.removeEventListener('mousedown', _0x51922a, true),
        _0x14b710?.());
    };
  requestAnimationFrame(() => document.addEventListener('mousedown', _0x51922a, true));
}
function _showLeftQuoteMenu(_0x276faa, _0x2a7cb7, _0x124aa9, _0x4d413a, _0x1803c7) {
  document.querySelector('.v2-quote-menu')?.remove();
  const { nodes: _0x1fdb2a } = getState(),
    _0x11eef9 = _0x1fdb2a[_0x124aa9];
  if (!_0x11eef9) {
    _0x1803c7?.();
    return;
  }
  const _0x261a02 = screenToWorld(_0x276faa, _0x2a7cb7, _0x4d413a),
    _0x3f2fbf = document.createElement('div');
  _0x3f2fbf.className = 'v2-quote-menu';
  const _0x3e58de = document.createElement('div');
  ((_0x3e58de.className = 'v2-quote-title'),
    (_0x3e58de.textContent = t('edgeController.inputMenuTitle')),
    _0x3f2fbf.appendChild(_0x3e58de));
  const _0x5a8b63 = [
      {
        iconEl: _iconSourceText('var(--white-50)'),
        iconBg: 'var(--white-05)',
        label: '源文本',
        desc: '纯文本片段',
        type: 'source-text',
        ...getNodeDefaultSize('source-text'),
      },
      {
        iconEl: _iconAiImage('var(--white-50)'),
        iconBg: 'var(--white-05)',
        label: '源图像',
        desc: '参考图、首帧、素材',
        type: 'source-image',
        ...getNodeDefaultSize('source-image'),
      },
      {
        iconEl: _iconAiAudio('var(--white-50)'),
        iconBg: 'var(--white-05)',
        label: '源音频',
        desc: '本地或上传音频',
        type: 'source-audio',
        ...getNodeDefaultSize('source-audio'),
      },
      {
        iconEl: _iconAiVideo('var(--white-50)'),
        iconBg: 'var(--white-05)',
        label: '源视频',
        desc: '本地或上传视频',
        type: 'source-video',
        ...getNodeDefaultSize('source-video'),
      },
      {
        iconEl: _iconAiText('var(--white-50)'),
        iconBg: 'var(--white-05)',
        label: '文本',
        desc: '文案、脚本、提示词',
        type: 'ai-text',
        w: _AI_TEXT_DEFAULT_SIZE.width,
        h: _AI_TEXT_DEFAULT_SIZE.height,
      },
      {
        iconEl: _iconAiImage('var(--white-50)'),
        iconBg: 'var(--white-05)',
        label: '图像',
        desc: '图片、海报、角色素材',
        type: 'ai-image',
        w: _AI_IMAGE_DEFAULT_SIZE.width,
        h: _AI_IMAGE_DEFAULT_SIZE.height,
      },
      {
        iconEl: _iconAiVideo('var(--white-50)'),
        iconBg: 'var(--white-05)',
        label: '视频',
        desc: '短片、转场、动态镜头',
        type: 'ai-video',
        w: _AI_VIDEO_DEFAULT_SIZE.width,
        h: _AI_VIDEO_DEFAULT_SIZE.height,
      },
      {
        iconEl: _iconAiAudio('var(--white-50)'),
        iconBg: 'var(--white-05)',
        label: '音频',
        desc: '配音、音效、音乐',
        type: 'ai-audio',
        w: _AI_AUDIO_DEFAULT_SIZE.width,
        h: _AI_AUDIO_DEFAULT_SIZE.height,
      },
    ].map(_applyNodeCreationMenuMeta),
    _0x1302d2 = getAllowedInputNodeTypesForSidePlus(_0x11eef9.type),
    _0x40b5c7 = _0x5a8b63.filter((_0x11e391) => _0x1302d2.includes(_0x11e391.type));
  (_0x40b5c7.forEach((_0x26143c) => {
    const _0x11688b = document.createElement('button');
    ((_0x11688b.className = 'v2-menu-row' + (_0x26143c.desc ? ' has-desc' : '')),
      (_0x11688b.style.marginBottom = '2px'));
    const _0x19677a = document.createElement('div');
    ((_0x19677a.className = 'v2-menu-ico'), _0x19677a.replaceChildren());
    if (_0x26143c.iconEl) _0x19677a.appendChild(_0x26143c.iconEl.cloneNode(true));
    if (_0x26143c.iconBg) _0x19677a.style.background = _0x26143c.iconBg;
    const _0x7e6843 = document.createElement('div');
    ((_0x7e6843.className = 'v2-menu-txt-wrap'),
      Object.assign(_0x7e6843.style, {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        flex: '1',
        minWidth: '0',
      }));
    const _0x2e0c5f = document.createElement('span');
    ((_0x2e0c5f.className = 'v2-menu-lbl'),
      Object.assign(_0x2e0c5f.style, {
        fontSize: '16px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }),
      (_0x2e0c5f.textContent = _0x26143c.label));
    if (_0x26143c.badge) {
      const _0x68f7cb = document.createElement('span');
      ((_0x68f7cb.textContent = _0x26143c.badge),
        Object.assign(_0x68f7cb.style, {
          fontSize: '10px',
          padding: '1px 6px',
          borderRadius: '10px',
          border: '1px solid var(--stroke-danger)',
          color: 'var(--text-danger)',
          background: 'var(--fill-danger-soft)',
          fontWeight: '700',
          letterSpacing: '0.3px',
        }),
        _0x2e0c5f.appendChild(_0x68f7cb));
    }
    _0x7e6843.appendChild(_0x2e0c5f);
    if (_0x26143c.desc) {
      const _0xefdb = document.createElement('span');
      ((_0xefdb.className = 'v2-menu-sub'),
        (_0xefdb.textContent = _0x26143c.desc),
        _0x7e6843.appendChild(_0xefdb));
    }
    (_0x11688b.appendChild(_0x19677a),
      _0x11688b.appendChild(_0x7e6843),
      _0x11688b.addEventListener('click', (_0x277cd2) => {
        _0x277cd2.stopPropagation();
        const _0x26567c = generateId(_0x26143c.type);
        let _0x50820a = {
          id: _0x26567c,
          type: _0x26143c.type,
          x: _0x261a02.x - 150,
          y: _0x261a02.y,
          width: _0x26143c.width ?? _0x26143c.w,
          height: _0x26143c.height ?? _0x26143c.h,
          name: _0x26143c.defaultName || _0x26143c.label,
        };
        (_0x26143c.type === 'ai-image' || _0x26143c.type === 'ai-video') &&
          !Object.prototype.hasOwnProperty.call(_0x50820a, 'aspectRatio') &&
          (_0x50820a.aspectRatio = '自适应');
        if (_0x11eef9.type === _0x26143c.type) {
          const _0x2cf82a = { ..._0x11eef9 };
          (delete _0x2cf82a.id,
            delete _0x2cf82a.x,
            delete _0x2cf82a.y,
            delete _0x2cf82a.width,
            delete _0x2cf82a.height,
            delete _0x2cf82a.name,
            delete _0x2cf82a.prompt,
            delete _0x2cf82a.outputText,
            stripImageGenerationResultStateForDerivedNode(_0x2cf82a),
            delete _0x2cf82a.batchSize,
            (_0x50820a = { ..._0x2cf82a, ..._0x50820a }));
        }
        if (_0x50820a.type === 'source-image' || _0x50820a.type === 'source-video')
          _0x50820a = buildSourceMediaNodePayload(_0x50820a);
        else
          _isPanorama360TargetType(_0x50820a.type) &&
            (_0x50820a = createPanorama360NodeData({
              id: _0x50820a.id,
              x: _0x50820a.x,
              y: _0x50820a.y,
              width: _0x50820a.width,
              height: _0x50820a.height,
            }));
        graphStore.addNode(_0x50820a);
        const _0x106fe5 = addEdgeWithPolicies({ sourceId: _0x26567c, targetId: _0x124aa9 });
        if (!_0x106fe5) {
          const _0x599bd9 = generateId('edge');
          graphStore.addEdge({
            id: _0x599bd9,
            sourceId: _0x26567c,
            targetId: _0x124aa9,
            createdAt: Date.now(),
          });
        }
        (graphStore.setSelectedNodes([_0x26567c]),
          commit(),
          _0x187bf3?.(),
          _0x3f2fbf.remove(),
          _0x1803c7?.());
      }),
      _0x3f2fbf.appendChild(_0x11688b));
  }),
    document.body.appendChild(_0x3f2fbf));
  const _0x558bc2 = () => {
    const _0x239fc1 = getStateRaw().viewport || _0x4d413a,
      _0x27bc1d = worldToScreen(_0x261a02.x, _0x261a02.y, _0x239fc1);
    ((_0x3f2fbf.style.left = _0x27bc1d.x + 'px'), (_0x3f2fbf.style.top = _0x27bc1d.y + 'px'));
  };
  _0x558bc2();
  const _0x187bf3 = graphStore.subscribeSelector(
      (_0x282775) => _0x282775.viewport,
      () => _0x558bc2(),
    ),
    _0x183f65 = (_0x5b57ea) => {
      if (_0x3f2fbf.contains(_0x5b57ea.target)) return;
      (_0x187bf3?.(),
        _0x3f2fbf.remove(),
        document.removeEventListener('mousedown', _0x183f65, true),
        _0x1803c7?.());
    };
  requestAnimationFrame(() => document.addEventListener('mousedown', _0x183f65, true));
}
