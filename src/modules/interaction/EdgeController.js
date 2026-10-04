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
function _buildOutEdgeMap(value) {
  const map = new Map();
  for (const enabled of value) {
    if (!enabled) continue;
    const enabled2 = enabled.sourceId,
      enabled3 = enabled.targetId;
    if (!enabled2 || !enabled3) continue;
    let enabled4 = map.get(enabled2);
    (!enabled4 && ((enabled4 = new Set()), map.set(enabled2, enabled4)), enabled4.add(enabled3));
  }
  return map;
}
const _edgeIndexCache = { edges: null, edgesRev: -1, outMap: new Map(), incomingByTarget: new Map() };
function _applyNodeCreationMenuMeta(args) {
  const label = getNodeCreationMenuItem(args?.type);
  if (!label) return args;
  return {
    ...args,
    label: label.label || args.label,
    desc: label.subtitle || args.desc,
    badge: label.badge ?? args.badge,
    defaultName: label.defaultName || label.label || args.label,
  };
}
function _buildEdgeIndexes(item) {
  const outMap = new Map(),
    incomingByTarget = new Map();
  for (const enabled5 of Object.values(item || {})) {
    if (!enabled5) continue;
    const key = enabled5.sourceId,
      index = enabled5.targetId;
    if (key && index) {
      let enabled6 = outMap.get(key);
      (!enabled6 && ((enabled6 = new Set()), outMap.set(key, enabled6)), enabled6.add(index));
    }
    if (index) {
      let list = incomingByTarget.get(index);
      (!list && ((list = []), incomingByTarget.set(index, list)), list.push(enabled5));
    }
  }
  return { outMap: outMap, incomingByTarget: incomingByTarget };
}
function _getEdgeIndexes(enabled7, result) {
  if (!enabled7 || typeof enabled7 !== 'object')
    return (
      (_edgeIndexCache.edges = null),
      (_edgeIndexCache.edgesRev = -1),
      (_edgeIndexCache.outMap = new Map()),
      (_edgeIndexCache.incomingByTarget = new Map()),
      _edgeIndexCache
    );
  const data = Number.isFinite(result) ? result : -1;
  if (_edgeIndexCache.edges === enabled7 && _edgeIndexCache.edgesRev === data) return _edgeIndexCache;
  const { outMap: outMap2, incomingByTarget: incomingByTarget2 } = _buildEdgeIndexes(enabled7);
  return (
    (_edgeIndexCache.edges = enabled7),
    (_edgeIndexCache.edgesRev = data),
    (_edgeIndexCache.outMap = outMap2),
    (_edgeIndexCache.incomingByTarget = incomingByTarget2),
    _edgeIndexCache
  );
}
function _getOutEdgeMap(options, target) {
  return _getEdgeIndexes(options, target).outMap;
}
function _getIncomingEdgesByTarget(source, next, enabled8) {
  if (!enabled8) return [];
  return _getEdgeIndexes(source, next).incomingByTarget.get(enabled8) || [];
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
function _resolveEdgeHoverNodeRect(x) {
  if (!x || typeof x !== 'object') return null;
  return {
    x: x.x,
    y: x.y,
    width: x.width || (isNodeType(x, 'group') ? 0x190 : 0x104),
    height: x.height || (isNodeType(x, 'group') ? 0x12c : 80),
  };
}
function _getNodeSpatialIndex(nodes, current, entry = _NODE_SPATIAL_INDEX_DEFAULT_KEY) {
  if (!nodes || typeof nodes !== 'object') return null;
  const persistRev = Number.isFinite(current) ? current : -1,
    record = _nodeSpatialIndexCache.get(entry);
  if (record && record.nodes === nodes && record.persistRev === persistRev) return record.index;
  const index2 =
    entry === _NODE_SPATIAL_INDEX_EDGE_HOVER_KEY
      ? createNodeSpatialIndex(nodes, { resolveRect: _resolveEdgeHoverNodeRect })
      : createNodeSpatialIndex(nodes);
  return (_nodeSpatialIndexCache.set(entry, { nodes: nodes, persistRev: persistRev, index: index2 }), index2);
}
function _svgEl(payload, handle, state, config) {
  const el = document.createElementNS(_SVG_NS, 'svg');
  return (
    el.setAttribute('width', String(payload)),
    el.setAttribute('height', String(handle)),
    el.setAttribute('viewBox', '0 0 24 24'),
    el.setAttribute('fill', 'none'),
    el.setAttribute('stroke', state),
    el.setAttribute('stroke-width', String(config)),
    el
  );
}
function _iconAiText(scope) {
  const el2 = _svgEl(18, 18, scope, 1.8),
    el3 = document.createElementNS(_SVG_NS, 'path');
  el3.setAttribute('d', 'M12 20h9');
  const el4 = document.createElementNS(_SVG_NS, 'path');
  return (
    el4.setAttribute('d', 'M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z'),
    el2.appendChild(el3),
    el2.appendChild(el4),
    el2
  );
}
function _iconAiImage(input) {
  const el5 = _svgEl(18, 18, input, 1.8),
    el6 = document.createElementNS(_SVG_NS, 'rect');
  (el6.setAttribute('x', '3'),
    el6.setAttribute('y', '3'),
    el6.setAttribute('width', '18'),
    el6.setAttribute('height', '18'),
    el6.setAttribute('rx', '3'));
  const el7 = document.createElementNS(_SVG_NS, 'circle');
  (el7.setAttribute('cx', '8.5'),
    el7.setAttribute('cy', '8.5'),
    el7.setAttribute('r', '1.5'),
    el7.setAttribute('fill', input));
  const el8 = document.createElementNS(_SVG_NS, 'polyline');
  return (
    el8.setAttribute('points', '21 15 16 10 5 21'),
    el5.appendChild(el6),
    el5.appendChild(el7),
    el5.appendChild(el8),
    el5
  );
}
function _iconAiVideo(output) {
  const el9 = _svgEl(18, 18, output, 1.8),
    el10 = document.createElementNS(_SVG_NS, 'rect');
  (el10.setAttribute('x', '2'),
    el10.setAttribute('y', '6'),
    el10.setAttribute('width', '15'),
    el10.setAttribute('height', '12'),
    el10.setAttribute('rx', '2'));
  const el11 = document.createElementNS(_SVG_NS, 'path');
  return (el11.setAttribute('d', 'M17 9l5-3v12l-5-3V9z'), el9.appendChild(el10), el9.appendChild(el11), el9);
}
function _iconAiAudio(value2) {
  const el12 = _svgEl(18, 18, value2, 1.8),
    el13 = document.createElementNS(_SVG_NS, 'path');
  el13.setAttribute('d', 'M9 18V5l12-2v13');
  const el14 = document.createElementNS(_SVG_NS, 'circle');
  (el14.setAttribute('cx', '6'), el14.setAttribute('cy', '18'), el14.setAttribute('r', '3'));
  const el15 = document.createElementNS(_SVG_NS, 'circle');
  return (
    el15.setAttribute('cx', '18'),
    el15.setAttribute('cy', '16'),
    el15.setAttribute('r', '3'),
    el12.appendChild(el13),
    el12.appendChild(el14),
    el12.appendChild(el15),
    el12
  );
}
function _iconStoryboardScript(value3) {
  const el16 = _svgEl(18, 18, value3, 1.8),
    el17 = document.createElementNS(_SVG_NS, 'rect');
  (el17.setAttribute('x', '3'),
    el17.setAttribute('y', '4'),
    el17.setAttribute('width', '18'),
    el17.setAttribute('height', '16'),
    el17.setAttribute('rx', '2'));
  const el18 = document.createElementNS(_SVG_NS, 'line');
  (el18.setAttribute('x1', '3'),
    el18.setAttribute('y1', '9'),
    el18.setAttribute('x2', '21'),
    el18.setAttribute('y2', '9'));
  const el19 = document.createElementNS(_SVG_NS, 'line');
  (el19.setAttribute('x1', '3'),
    el19.setAttribute('y1', '14'),
    el19.setAttribute('x2', '21'),
    el19.setAttribute('y2', '14'));
  const el20 = document.createElementNS(_SVG_NS, 'line');
  return (
    el20.setAttribute('x1', '8'),
    el20.setAttribute('y1', '4'),
    el20.setAttribute('x2', '8'),
    el20.setAttribute('y2', '20'),
    el16.appendChild(el17),
    el16.appendChild(el18),
    el16.appendChild(el19),
    el16.appendChild(el20),
    el16
  );
}
function _iconSourceText(value4) {
  const el21 = _svgEl(18, 18, value4, 1.8),
    el22 = document.createElementNS(_SVG_NS, 'polyline');
  el22.setAttribute('points', '4 7 4 4 20 4 20 7');
  const el23 = document.createElementNS(_SVG_NS, 'line');
  (el23.setAttribute('x1', '9'),
    el23.setAttribute('y1', '20'),
    el23.setAttribute('x2', '15'),
    el23.setAttribute('y2', '20'));
  const el24 = document.createElementNS(_SVG_NS, 'line');
  return (
    el24.setAttribute('x1', '12'),
    el24.setAttribute('y1', '4'),
    el24.setAttribute('x2', '12'),
    el24.setAttribute('y2', '20'),
    el21.appendChild(el22),
    el21.appendChild(el23),
    el21.appendChild(el24),
    el21
  );
}
function _isPanorama360TargetType(value5) {
  return _PANORAMA_360_TARGET_TYPES.has(String(value5 || '').trim());
}
function _isBlockedOutputNodeType(value6) {
  return _PANORAMA_SOURCE_BLOCKED_TYPES.has(String(value6 || '').trim());
}
function _isPanorama360ImageSourceType(value7) {
  return _PANORAMA_360_IMAGE_SOURCE_TYPES.has(String(value7 || '').trim());
}
function _isStoryboardInputTargetType(value8) {
  const value9 = String(value8 || '').trim();
  return value9 === 'storyboard' || value9 === 'storyboard-script';
}
function _isModelPolicyTargetType(value10) {
  const value11 = String(value10 || '').trim();
  return value11 === 'ai-image' || value11 === 'ai-text' || value11 === 'ai-video' || value11 === 'ai-audio';
}
function _isSharedInputPolicyTargetType(value12) {
  return _isModelPolicyTargetType(value12) || _isStoryboardInputTargetType(value12);
}
export function getAllowedInputNodeTypesForSidePlus(value13) {
  const value14 = String(value13 || '').trim(),
    value15 = {
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
  return value15[value14] || ['source-text'];
}
export function getAllowedGenerationNodeTypesForQuoteMenu(list2 = []) {
  const list3 = ['ai-text', 'ai-image', 'ai-video', 'ai-audio', 'storyboard-script', 'panorama-360'],
    list4 = Array.isArray(list2) ? list2.filter(Boolean) : [];
  return list3.filter((type) =>
    list4.some((item2) => isValidConnection(item2, { id: '__fake_' + type, type: type })),
  );
}
export function setDragContextGetter(value16) {
  _getDragContext = typeof value16 === 'function' ? value16 : () => ({});
}
export function isValidConnection(enabled9, enabled10) {
  if (!enabled9 || !enabled10) return false;
  if (enabled9.id === enabled10.id) return false;
  const value17 = enabled9.type || '',
    value18 = enabled10.type || '';
  if (value17 === 'debug' || _isBlockedOutputNodeType(value17)) return false;
  const run = (value19) =>
    value19 === 'ai-image' ||
    value19 === 'ai-text' ||
    value19 === 'ai-video' ||
    value19 === 'ai-audio' ||
    value19 === 'media-clip' ||
    _isStoryboardInputTargetType(value19) ||
    value19 === 'group' ||
    _isPanorama360TargetType(value19);
  if (!run(value18)) return false;
  if (value17 === 'group') return value18 === 'group' || _isSharedInputPolicyTargetType(value18);
  if (_isPanorama360TargetType(value18)) {
    if (!_isPanorama360ImageSourceType(value17)) return false;
  }
  if (isMediaClipNodeType(value18)) return isSupportedMediaClipInput(enabled9);
  if (value18 === 'ai-image') {
    const list5 = ['source-image', 'image', 'ai-image', 'source-text', 'text', 'ai-text'];
    if (!list5.includes(value17)) return false;
  }
  if (value18 === 'ai-audio') {
    if (value17 === 'source-image' || value17 === 'image' || value17 === 'ai-image') return false;
  }
  if (_isSharedInputPolicyTargetType(value18)) {
    const effectiveInputKind = resolveEffectiveInputKind(enabled9);
    if (effectiveInputKind && !isInputKindAllowed(getTargetInputPolicy(enabled10), effectiveInputKind))
      return false;
    const fixedInputSlotConfigFromManifest = getFixedInputSlotConfigFromManifest(enabled10);
    if (fixedInputSlotConfigFromManifest && effectiveInputKind && effectiveInputKind !== 'text') {
      const map2 = new Set(fixedInputSlotConfigFromManifest.visibleSlots || []),
        list6 = fixedInputSlotConfigFromManifest.slotOrderByType?.[effectiveInputKind] || [],
        list7 = list6.filter((item3) => map2.has(item3)),
        list8 = list7.length > 0 ? list7 : list6;
      if (
        list8.length > 0 &&
        !list8.some((item4) => fixedInputSlotAcceptsSource(fixedInputSlotConfigFromManifest, item4, enabled9))
      )
        return false;
    }
  }
  if (resolveEffectiveInputKind(enabled9) === 'video' && !hasUsableInputNodeSource(enabled9)) return false;
  return true;
}
function _videoSourceKey(response) {
  if (!response || typeof response !== 'object') return '';
  return (
    String(response.localPath || '').trim() ||
    String(response.displayLocalPath || '').trim() ||
    String(response.originalLocalPath || '').trim() ||
    String(response.videoLocalPath || '').trim() ||
    String(response.videoUrl || '').trim() ||
    String(response.src || '').trim() ||
    String(response.url || '').trim() ||
    String(response.resultUrl || '').trim() ||
    String(response.sourceUrl || '').trim() ||
    String(response.thumbId || '').trim()
  );
}
function _isUnavailableVideoRecord(value20) {
  const _videoSourceKey2 = _videoSourceKey(value20);
  if (!_videoSourceKey2) return false;
  return (
    value20?.mediaUnavailable === true &&
    String(value20?.mediaUnavailableSource || '').trim() === _videoSourceKey2
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
export function isSidePlusPointerBlockedByElement(el25) {
  const el26 = el25 && typeof el25.closest === 'function' ? el25 : el25?.parentElement || null;
  if (!el26) return false;
  if (el26.closest('.side-plus-btn, #v2-side-plus-holder')) return false;
  return !!el26.closest(SIDE_PLUS_POINTER_BLOCKER_SELECTOR);
}
function _isSidePlusPointerBlockedAt(value21, value22) {
  if (typeof document === 'undefined') return false;
  if (!Number.isFinite(value21) || !Number.isFinite(value22)) return false;
  const value23 = document.elementFromPoint?.(value21, value22);
  return isSidePlusPointerBlockedByElement(value23);
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
  const count = Number(selectedCount) || 0,
    value24 = count > 0,
    value25 = count >= 2;
  if (isDraggingPlus) return { shouldClear: true, selectionOnly: false };
  if (isNodeDragging) return { shouldClear: true, selectionOnly: false };
  if (value24 && (isBoxSelecting || isConnecting || isSpaceHeld))
    return { shouldClear: false, selectionOnly: true };
  if (isBoxSelecting || isConnecting) return { shouldClear: true, selectionOnly: false };
  const selectionOnly2 = requestedSelectionOnly || value25;
  if (isSpaceHeld && !isPanning && !selectionOnly2) return { shouldClear: true, selectionOnly: false };
  return { shouldClear: false, selectionOnly: selectionOnly2 };
}
export function shouldShowSidePlusForNode({
  sideDistance: sideDistance,
  threshold: threshold,
  isSelected: isSelected = false,
  isHovered: isHovered = false,
  isInside: isInside = false,
  nodeType: nodeType = '',
} = {}) {
  if (isSelected) return true;
  if (!isHovered) return false;
  const value26 = Number(sideDistance),
    value27 = Number(threshold);
  if (Number.isFinite(value26) && Number.isFinite(value27) && value26 < value27) return true;
  return !!isInside && String(nodeType || '').trim() !== 'group';
}
export function shouldUseInlineMediaClipAddSlot(value28 = '') {
  return isMediaClipNodeType(value28);
}
export function shouldShowRightSidePlusForNodeType(value29 = '') {
  const value30 = String(value29 || '').trim();
  if (value30 === 'comment-note') return false;
  if (value30 === 'storyboard') return false;
  if (value30 === 'collage') return false;
  return !_isBlockedOutputNodeType(value30) && !shouldUseInlineMediaClipAddSlot(value30);
}
export function getGroupSidePlusAnchorCandidateIds({
  nodes: nodes2,
  viewport: viewport,
  mx: mx,
  my: my,
  threshold: threshold2,
  gap: gap = 36,
} = {}) {
  if (!Number.isFinite(mx) || !Number.isFinite(my)) return [];
  const value31 = Number(viewport?.zoom) || 1,
    value32 = Number(threshold2);
  if (!Number.isFinite(value32)) return [];
  const list9 = [];
  for (const [value33, x2] of Object.entries(nodes2 || {})) {
    if (!isNodeType(x2, 'group')) continue;
    const enabled11 = String(x2?.id || value33 || '').trim();
    if (!enabled11) continue;
    const width = x2.width || 0x190,
      height = x2.height || 0x12c,
      box = getNodeScreenRect({ x: x2.x, y: x2.y, width: width, height: height }, viewport),
      value34 = box.right + gap * value31,
      value35 = box.top + box.height / 2;
    if (Math.hypot(mx - value34, my - value35) < value32) list9.push(enabled11);
  }
  return list9;
}
export function resolveSidePlusCandidateIds({
  selectedIds: selectedIds = [],
  isMultiSelection: isMultiSelection = false,
  selectionOnly: selectionOnly = false,
  hoverNodeId: hoverNodeId = null,
  groupAnchorIds: groupAnchorIds = [],
} = {}) {
  const list10 = Array.isArray(groupAnchorIds) ? groupAnchorIds.filter(Boolean) : [],
    value36 = Array.isArray(selectedIds) ? selectedIds.filter(Boolean) : [],
    candidateIds = isMultiSelection ? new Set() : new Set(value36),
    sideAnchorHoverIds = new Set(),
    enabled12 = !isMultiSelection && !selectionOnly && list10.length > 0;
  !isMultiSelection && !selectionOnly && hoverNodeId && !enabled12 && candidateIds.add(hoverNodeId);
  if (!isMultiSelection && !selectionOnly)
    for (const value37 of list10) {
      (candidateIds.add(value37), sideAnchorHoverIds.add(value37));
    }
  return { candidateIds: candidateIds, sideAnchorHoverIds: sideAnchorHoverIds };
}
export function computeMultiSelectionBoundsForSidePlus(value38, value39, value40 = {}) {
  const list11 = Array.isArray(value38) ? value38 : [];
  if (list11.length < 2) return null;
  const map3 =
      value40?.movedNodeIds && typeof value40.movedNodeIds[Symbol.iterator] === 'function'
        ? new Set(value40.movedNodeIds)
        : null,
    value41 = Number.isFinite(value40?.offsetX) ? value40.offsetX : 0,
    value42 = Number.isFinite(value40?.offsetY) ? value40.offsetY : 0;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity,
    count2 = 0;
  for (const value43 of list11) {
    const box2 = value39?.[value43];
    if (!box2) continue;
    const value44 = map3?.has(value43) === true,
      value45 = box2.x + (value44 ? value41 : 0),
      value46 = box2.y + (value44 ? value42 : 0);
    count2 += 1;
    const value47 = box2.width || 0x104,
      value48 = box2.height || 100,
      value49 = value45,
      value50 = box2.type !== 'group' ? value46 - 30 : value46,
      value51 = value45 + value47,
      value52 = value46 + value48;
    ((minX = Math.min(minX, value49)),
      (minY = Math.min(minY, value50)),
      (maxX = Math.max(maxX, value51)),
      (maxY = Math.max(maxY, value52)));
  }
  if (count2 < 2 || !Number.isFinite(minX) || !Number.isFinite(minY)) return null;
  return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
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
function _resetDraftEdgeCache(pathEl = null) {
  _draftEdgeCache = {
    pathEl: pathEl,
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
  const el27 = document.getElementById('v2-edges');
  if (!el27) return (_resetDraftEdgeCache(), null);
  let el28 = _draftEdgeCache.pathEl;
  return (
    el28 && (el28.parentNode !== el27 || el28.isConnected === false) && (el28.remove?.(), (el28 = null)),
    !el28 &&
      ((el28 = el27.querySelector?.('#v2-draft-edge') || null),
      el28 && (el28.parentNode !== el27 || el28.isConnected === false) && (el28 = null)),
    !el28 &&
      ((el28 = document.createElementNS('http://www.w3.org/2000/svg', 'path')),
      (el28.id = 'v2-draft-edge'),
      el28.setAttribute('class', 'conn-drag-path'),
      el28.setAttribute('fill', 'none'),
      el28.setAttribute('stroke', 'var(--indigo-70)'),
      el28.setAttribute('stroke-linecap', 'round'),
      el27.appendChild(el28)),
    _draftEdgeCache.pathEl !== el28 && _resetDraftEdgeCache(el28),
    el28
  );
}
function _renderDraftEdgeDirectly(value53, value54, value55, value56, value57, box3) {
  const el29 = _getDraftEdgePath();
  if (!el29) return;
  const count3 = Math.hypot(value55 - value53, value56 - value54);
  if (count3 < 5) {
    el29.style.display = 'none';
    return;
  }
  const value58 =
      value53 !== _draftEdgeCache.lastStartX ||
      value54 !== _draftEdgeCache.lastStartY ||
      value55 !== _draftEdgeCache.lastEndX ||
      value56 !== _draftEdgeCache.lastEndY ||
      value57 !== _draftEdgeCache.lastSide,
    value59 = box3.zoom !== _draftEdgeCache.lastZoom;
  if (value58) {
    const value60 = value57 === 'left',
      value61 = Math.abs(value55 - value53),
      value62 = Math.min(value61 * 0.75, 80),
      value63 = value60 ? value53 - value62 : value53 + value62,
      value64 = value60 ? value55 + value62 : value55 - value62,
      value65 =
        'M ' +
        value53 +
        ' ' +
        value54 +
        ' C ' +
        value63 +
        ' ' +
        value54 +
        ', ' +
        value64 +
        ' ' +
        value56 +
        ', ' +
        value55 +
        ' ' +
        value56;
    (el29.setAttribute('d', value65),
      (_draftEdgeCache.lastStartX = value53),
      (_draftEdgeCache.lastStartY = value54),
      (_draftEdgeCache.lastEndX = value55),
      (_draftEdgeCache.lastEndY = value56),
      (_draftEdgeCache.lastSide = value57));
  }
  (value59 &&
    (el29.setAttribute('stroke-width', '' + 2 / box3.zoom),
    (el29.style.strokeDasharray = 6 / box3.zoom + ' ' + 4 / box3.zoom),
    (_draftEdgeCache.lastZoom = box3.zoom)),
    (el29.style.display = 'block'));
}
function _clearDraftEdgeDirectly() {
  const el30 = document.getElementById('v2-draft-edge');
  if (el30) el30.style.display = 'none';
}
export function createEdgeController() {
  function tryStartHandleConnect(value66, event, value67, value68, value69) {
    if (!event || !event.target) return false;
    const el31 = event.target.closest('.v2-handle');
    if (!el31) return false;
    return (
      event.preventDefault(),
      event.stopPropagation(),
      (value66.isConnecting = true),
      (value66.connectSourceId = el31.dataset.nodeId),
      (value66.connectStartX = value67),
      (value66.connectStartY = value68),
      (value66.connectSide = 'left'),
      _renderDraftEdgeDirectly(value67, value68, value67, value68, 'left', value69),
      true
    );
  }
  function updateHandleConnect(side, value70, value71, value72, value73, value74, value75, value76) {
    _renderDraftEdgeDirectly(
      side.connectStartX || value72,
      side.connectStartY || value73,
      value72,
      value73,
      side.connectSide || 'left',
      value74,
    );
    const spatialIndex = _getNodeSpatialIndex(
      value75,
      getStateRaw()._persistRev,
      _NODE_SPATIAL_INDEX_DEFAULT_KEY,
    );
    let hoverId = hitTestNode(value70, value71, value75, value74, side.connectSourceId, false, {
      spatialIndex: spatialIndex,
    });
    if (hoverId && value76?.invalidNodeIds?.includes(hoverId)) hoverId = null;
    return (
      (value76?.hoverId || null) !== hoverId &&
        graphStore.setConnOverlay({ hoverId: hoverId, side: side.connectSide }),
      true
    );
  }
  function finishHandleConnect(sourceId, value77, value78) {
    const stateRaw = getStateRaw(),
      { viewport: viewport2, nodes: nodes3 } = stateRaw,
      spatialIndex2 = _getNodeSpatialIndex(nodes3, stateRaw._persistRev, _NODE_SPATIAL_INDEX_DEFAULT_KEY),
      hitTestNode2 = hitTestNode(value77, value78, nodes3, viewport2, sourceId.connectSourceId, false, {
        spatialIndex: spatialIndex2,
      }),
      targetId = hitTestNode2 ? nodes3[hitTestNode2] : null;
    let addEdgeWithPolicies2 = false;
    return (
      targetId &&
        (addEdgeWithPolicies2 = addEdgeWithPolicies({
          sourceId: sourceId.connectSourceId,
          targetId: targetId.id,
        })),
      _clearDraftEdgeDirectly(),
      graphStore.clearConnOverlay(),
      addEdgeWithPolicies2
    );
  }
  return {
    tryStartHandleConnect: tryStartHandleConnect,
    updateHandleConnect: updateHandleConnect,
    finishHandleConnect: finishHandleConnect,
  };
}
export function initConnectionHandles(value79) {
  const el32 = document.createElement('div');
  ((el32.id = 'v2-side-plus-holder'),
    Object.assign(el32.style, {
      position: 'fixed',
      inset: '0',
      pointerEvents: 'none',
      zIndex: '95',
      overflow: 'visible',
    }),
    document.body.appendChild(el32));
  const map4 = new Map(),
    map5 = new Map();
  let side2 = {
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
  function run2(value80, value81 = null) {
    const list12 = [],
      map6 = new Set(),
      value82 = Array.isArray(value80) ? value80 : [];
    for (const value83 of value82) {
      const enabled13 = String(value83 || '').trim();
      if (!enabled13 || map6.has(enabled13)) continue;
      (map6.add(enabled13), list12.push(enabled13));
    }
    const value84 = String(value81 || '').trim();
    if (list12.length === 0 && value84) list12.push(value84);
    return list12;
  }
  function run3({
    sourceNodeId: sourceNodeId,
    targetNodeId: targetNodeId,
    side: side3,
    nodes: nodes4,
    edges: edges,
    outMap: outMap3,
  }) {
    if (!sourceNodeId || !targetNodeId || sourceNodeId === targetNodeId) return false;
    const enabled14 = nodes4?.[sourceNodeId],
      enabled15 = nodes4?.[targetNodeId];
    if (!enabled14 || !enabled15) return false;
    const sourceId2 = side3 === 'right' ? enabled14 : enabled15,
      targetId2 = side3 === 'right' ? enabled15 : enabled14;
    if (!sourceId2?.id || !targetId2?.id) return false;
    const value85 = !!outMap3.get(sourceId2.id)?.has(targetId2.id);
    if (value85) return false;
    if (
      String(sourceId2.type || '').trim() === 'group' &&
      String(targetId2.type || '').trim() === 'group' &&
      wouldCreateGroupOutputCycle({
        sourceId: sourceId2.id,
        targetId: targetId2.id,
        nodes: nodes4,
        edges: edges,
      })
    )
      return false;
    return isValidConnection(sourceId2, targetId2);
  }
  function run4(value86, value87, value88, box4, value89) {
    if (value89 !== 'right') return;
    if (String(value88?.type || '') !== 'ai-video') return;
    if (String(box4?.type || '') !== 'ai-video') return;
    const fixedInputSlotConfigFromManifest2 = getFixedInputSlotConfigFromManifest(box4);
    if (
      fixedInputSlotConfigFromManifest2?.slotKindById?.sourceVideo === 'video' &&
      fixedInputSlotConfigFromManifest2?.slotKindById?.refImage === 'image'
    )
      return;
    const count4 = Number(box4.width || 0),
      count5 = Number(box4.height || 0),
      value90 =
        (Array.isArray(box4.videos) && box4.videos.length > 0) ||
        String(box4.videoUrl || '').trim() ||
        String(box4.localPath || '').trim() ||
        String(box4.thumbId || '').trim();
    if (count4 !== 0x12c || count5 !== 0x12c || value90) return;
    const stateRaw2 = getStateRaw(),
      box5 = stateRaw2.nodes?.[value87];
    if (!box5) return;
    const x3 = Number(box5.x || 0) + Number(box5.width || 0) / 2,
      y = Number(box5.y || 0) + Number(box5.height || 0) / 2,
      count6 = Date.now(),
      value91 = () => {
        const displayedMediaSizeFromNode = getDisplayedMediaSizeFromNode(value86, 'video'),
          value92 = Number(displayedMediaSizeFromNode?.w || 0),
          value93 = Number(displayedMediaSizeFromNode?.h || 0);
        let count7 = value92,
          count8 = value93;
        if (!(count7 > 0 && count8 > 0)) {
          const stateRaw3 = getStateRaw(),
            value94 = stateRaw3.nodes?.[value86];
          if (value94) {
            const value95 = Number(value94.mainVideoIndex),
              value96 = Number.isFinite(value95) ? Math.max(0, Math.trunc(value95)) : 0,
              value97 = Array.isArray(value94.videos) ? value94.videos : [],
              value98 = value97[value96],
              count9 = Number(value98?.videoWidth || 0),
              count10 = Number(value98?.videoHeight || 0),
              count11 = Number(value94.selectedVideoWidth || 0),
              count12 = Number(value94.selectedVideoHeight || 0),
              count13 = Number(value94.videoWidth || 0),
              count14 = Number(value94.videoHeight || 0);
            if (count9 > 0 && count10 > 0) ((count7 = count9), (count8 = count10));
            else {
              if (count11 > 0 && count12 > 0) ((count7 = count11), (count8 = count12));
              else count13 > 0 && count14 > 0 && ((count7 = count13), (count8 = count14));
            }
          }
        }
        if (count7 > 0 && count8 > 0) {
          const count15 = count7 / count8;
          if (Number.isFinite(count15) && count15 > 0) {
            const box6 = getAIGenerationNodeSize(count7, count8),
              width2 = box6.width,
              height2 = box6.height;
            (graphStore.updateNodeData(value87, {
              width: width2,
              height: height2,
              x: x3 - width2 / 2,
              y: y - height2 / 2,
            }),
              commit());
          }
          return;
        }
        if (Date.now() - count6 < 0x4b0) requestAnimationFrame(value91);
      };
    requestAnimationFrame(value91);
  }
  function run5() {
    const { nodes: nodes5, edges: edges2, _edgesRev: _edgesRev } = getStateRaw(),
      outMap4 = _getOutEdgeMap(edges2, _edgesRev),
      value99 = run2(side2.sourceNodeIds, side2.srcId),
      map7 = new Set(value99),
      invalidNodeIds = [];
    for (const [targetNodeId2, value100] of Object.entries(nodes5)) {
      if (map7.has(targetNodeId2)) {
        invalidNodeIds.push(targetNodeId2);
        continue;
      }
      let enabled16 = false;
      for (const sourceNodeId2 of value99) {
        if (
          !run3({
            sourceNodeId: sourceNodeId2,
            targetNodeId: targetNodeId2,
            side: side2.side,
            nodes: nodes5,
            edges: edges2,
            outMap: outMap4,
          })
        )
          continue;
        enabled16 = true;
        break;
      }
      if (!enabled16) invalidNodeIds.push(targetNodeId2);
    }
    graphStore.setConnOverlay({ srcId: side2.srcId, invalidNodeIds: invalidNodeIds, side: side2.side });
  }
  function run6() {
    graphStore.clearConnOverlay();
  }
  function run7() {
    for (const el33 of map4.values()) el33.remove();
    (map4.clear(), map5.clear(), el32.classList.remove('is-selection-plus-visible'));
  }
  function run8(value101, nodeId, side4) {
    const value102 = map4.get(value101);
    if (value102) return value102;
    const el34 = document.createElement('button');
    return (
      (el34.type = 'button'),
      (el34.className = 'side-plus-btn'),
      (el34.textContent = ''),
      (el34.dataset.plusKind = 'node'),
      el34.setAttribute('aria-label', t('edgeController.addConnection')),
      el34.addEventListener('pointerdown', (sx) => {
        if (sx.button === 1 || window._spaceHeld) return;
        if (sx.button !== 0) return;
        const srcId = map5.get(value101);
        if (!srcId) return;
        const sourceNodeIds = run2(srcId.sourceNodeIds, srcId.nodeId),
          stateRaw4 = getStateRaw(),
          anchorWorldX =
            srcId.plusKind === 'multi' ? screenToWorld(srcId.ax, srcId.ay, stateRaw4.viewport) : null;
        (sx.stopPropagation(),
          sx.preventDefault(),
          (side2 = {
            dragging: true,
            srcId: srcId.nodeId,
            sourceNodeIds: sourceNodeIds,
            plusKind: srcId.plusKind === 'multi' ? 'multi' : 'node',
            side: srcId.side,
            ax: srcId.ax,
            ay: srcId.ay,
            sx: sx.clientX,
            sy: sx.clientY,
            lastX: sx.clientX,
            lastY: sx.clientY,
            anchorWorldX: anchorWorldX?.x ?? null,
            anchorWorldY: anchorWorldX?.y ?? null,
            didAssistPan: false,
          }),
          run5(),
          run7());
      }),
      el32.appendChild(el34),
      map4.set(value101, el34),
      map5.set(value101, {
        nodeId: nodeId,
        side: side4,
        sourceNodeIds: nodeId ? [nodeId] : [],
        plusKind: 'node',
        ax: 0,
        ay: 0,
      }),
      el34
    );
  }
  function run9(
    value103,
    value104,
    value105,
    value106,
    value107,
    value108,
    value109,
    value110,
    enabled17,
    event2 = {},
  ) {
    const count16 = Number(event2?.sizeMultiplier),
      value111 = Number.isFinite(count16) && count16 > 0 ? count16 : 1,
      value112 = 20 * value108 * value111,
      value113 = value112 / 2,
      value114 = String(event2?.key || value104 + ':' + value105),
      value115 = event2?.plusKind === 'multi' ? 'multi' : 'node',
      value116 = run2(event2?.sourceNodeIds, value104),
      el35 = run8(value114, value104, value105);
    ((el35.dataset.plusKind = value115),
      el35.classList.toggle('side-plus-btn--multi', value115 === 'multi'),
      (el35.style.width = value112 + 'px'),
      (el35.style.height = value112 + 'px'),
      (el35.style.fontSize = value112 + 'px'),
      (el35.style.display = 'flex'),
      (el35.style.alignItems = 'center'),
      (el35.style.justifyContent = 'center'));
    let value117 = value106,
      value118 = value107,
      enabled18 = false;
    if (value109 !== undefined && value110 !== undefined) {
      const value119 = value109 - value106,
        value120 = value110 - value107,
        value121 = Math.hypot(value119, value120),
        value122 = 100 * value108;
      if (value121 < value122 && !enabled17) {
        const value123 = Math.min(value121, 45 * value108),
          value124 = Math.atan2(value120, value119);
        ((value117 += Math.cos(value124) * value123),
          (value118 += Math.sin(value124) * value123),
          (el35.style.background = 'var(--white-10)'),
          (enabled18 = true));
      }
    }
    if (!enabled18) el35.style.background = '';
    ((el35.style.left = value117 - value113 + 'px'), (el35.style.top = value118 - value113 + 'px'));
    const value125 = map5.get(value114);
    (value125 &&
      ((value125.nodeId = value104),
      (value125.side = value105),
      (value125.sourceNodeIds = value116),
      (value125.plusKind = value115),
      (value125.ax = value117),
      (value125.ay = value118)),
      value103.add(value114));
  }
  function run10(mx2, my2, value126 = {}) {
    const _getDragContext2 = _getDragContext(),
      requestedSelectionOnly2 = value126 && typeof value126 === 'object' ? value126 : {},
      list13 = ['settingsModal', 'aboutModal', 'historyModal'];
    if (
      list13.some((item5) => {
        const el36 = document.getElementById(item5);
        return el36 && el36.style.display === 'flex';
      })
    ) {
      run7();
      return;
    }
    if (!side2.dragging && _isSidePlusPointerBlockedAt(mx2, my2)) {
      run7();
      return;
    }
    const stateRaw5 = getStateRaw(),
      {
        nodes: nodes6,
        viewport: viewport3,
        selectedNodeIds: selectedNodeIds,
        _persistRev: _persistRev,
      } = stateRaw5;
    if (!Object.keys(nodes6).length) {
      run7();
      return;
    }
    let nodes7 = nodes6;
    const value127 =
      requestedSelectionOnly2.nodeSizeOverrides &&
      typeof requestedSelectionOnly2.nodeSizeOverrides === 'object'
        ? requestedSelectionOnly2.nodeSizeOverrides
        : null;
    if (value127)
      for (const [value128, box7] of Object.entries(value127)) {
        const args2 = nodes6[value128];
        if (!args2) continue;
        const width3 = Number(box7?.width),
          height3 = Number(box7?.height);
        if (!(Number.isFinite(width3) && Number.isFinite(height3))) continue;
        if (nodes7 === nodes6) nodes7 = { ...nodes6 };
        nodes7[value128] = { ...args2, width: width3, height: height3 };
      }
    const value129 = nodes7 !== nodes6,
      selectedIds2 = Array.isArray(selectedNodeIds) ? selectedNodeIds : [],
      selectedCount2 = new Set(selectedIds2),
      el37 = typeof document !== 'undefined' ? document.body : null,
      sidePlusRenderState = resolveSidePlusRenderState({
        isDraggingPlus: side2.dragging,
        isNodeDragging: !!_getDragContext2.isDragging,
        isBoxSelecting: !!_getDragContext2.isBoxSelecting,
        isConnecting: !!_getDragContext2.isConnecting,
        isPanning: !!_getDragContext2.isPanning,
        isZooming: !!el37?.classList?.contains('is-zooming'),
        isViewportAnimating: !!el37?.classList?.contains('is-viewport-animating'),
        isSpaceHeld: !!window._spaceHeld,
        selectedCount: selectedCount2.size,
        requestedSelectionOnly: requestedSelectionOnly2.selectionOnly === true,
      });
    el32.classList.toggle(
      'is-selection-plus-visible',
      sidePlusRenderState.selectionOnly && selectedCount2.size > 0,
    );
    if (sidePlusRenderState.shouldClear) {
      run7();
      return;
    }
    const selectionOnly3 = sidePlusRenderState.selectionOnly;
    let hoverNodeId2 = null,
      value130 = false;
    if (selectionOnly3) ((hoverNodeId2 = null), (value130 = false));
    else {
      if (_getDragContext2.isDragging && _getDragContext2.targetNodeId)
        ((hoverNodeId2 = _getDragContext2.targetNodeId), (value130 = true));
      else {
        const spatialIndex3 = value129
            ? null
            : _getNodeSpatialIndex(nodes6, _persistRev, _NODE_SPATIAL_INDEX_DEFAULT_KEY),
          closestNode = findClosestNode(mx2, my2, nodes7, viewport3, true, {
            spatialIndex: spatialIndex3,
          });
        closestNode && ((hoverNodeId2 = closestNode.nodeId), (value130 = closestNode.isInside));
      }
    }
    const value131 = viewport3.zoom || 1,
      gap2 = 36,
      threshold3 = 70 * value131;
    let value132 = Number.isFinite(mx2) ? mx2 : undefined,
      value133 = Number.isFinite(my2) ? my2 : undefined;
    selectionOnly3 && ((value132 = undefined), (value133 = undefined));
    const isMultiSelection2 = selectedCount2.size >= 2,
      groupAnchorIds2 =
        !isMultiSelection2 && !selectionOnly3
          ? getGroupSidePlusAnchorCandidateIds({
              nodes: nodes7,
              viewport: viewport3,
              mx: mx2,
              my: my2,
              threshold: threshold3,
              gap: gap2,
            })
          : [],
      { candidateIds: candidateIds2, sideAnchorHoverIds: sideAnchorHoverIds2 } = resolveSidePlusCandidateIds({
        selectedIds: selectedIds2,
        isMultiSelection: isMultiSelection2,
        selectionOnly: selectionOnly3,
        hoverNodeId: hoverNodeId2,
        groupAnchorIds: groupAnchorIds2,
      }),
      map8 = new Set(),
      handler = shouldShowRightSidePlusForNodeType;
    for (const value134 of candidateIds2) {
      const x4 = nodes7[value134];
      if (!x4) continue;
      if (shouldUseInlineMediaClipAddSlot(x4.type)) continue;
      const value135 =
          _getDragContext2.isDragging &&
          (selectedCount2.has(value134) || _getDragContext2.targetNodeId === value134),
        value136 = value135 && Number.isFinite(_getDragContext2.pendingDx) ? _getDragContext2.pendingDx : 0,
        value137 = value135 && Number.isFinite(_getDragContext2.pendingDy) ? _getDragContext2.pendingDy : 0,
        width4 = x4.width || (isNodeType(x4, 'group') ? 0x190 : 0x104),
        height4 = x4.height || (isNodeType(x4, 'group') ? 0x12c : 80),
        box8 = getNodeScreenRect(
          { x: x4.x + value136, y: x4.y + value137, width: width4, height: height4 },
          viewport3,
        ),
        value138 = box8.top + box8.height / 2,
        value139 = box8.left - gap2 * value131,
        value140 = box8.right + gap2 * value131,
        sideDistance2 = Math.hypot(mx2 - value139, my2 - value138),
        sideDistance3 = Math.hypot(mx2 - value140, my2 - value138),
        isHovered2 = value134 === hoverNodeId2 || sideAnchorHoverIds2.has(value134),
        isSelected2 = selectedCount2.has(value134),
        isInside2 = value134 === hoverNodeId2 ? value130 : false,
        value141 = isInside2 || (_getDragContext2.isDragging && value134 === _getDragContext2.targetNodeId),
        shouldShowSidePlusForNode2 = shouldShowSidePlusForNode({
          sideDistance: sideDistance2,
          threshold: threshold3,
          isSelected: isSelected2,
          isHovered: isHovered2,
          isInside: isInside2,
          nodeType: x4.type,
        }),
        shouldShowSidePlusForNode3 = shouldShowSidePlusForNode({
          sideDistance: sideDistance3,
          threshold: threshold3,
          isSelected: isSelected2,
          isHovered: isHovered2,
          isInside: isInside2,
          nodeType: x4.type,
        }),
        handler2 = (value142) =>
          value142 === 'ai-image' ||
          value142 === 'ai-text' ||
          value142 === 'ai-video' ||
          value142 === 'ai-audio' ||
          _isPanorama360TargetType(value142);
      (handler2(x4.type) &&
        shouldShowSidePlusForNode2 &&
        run9(map8, value134, 'left', value139, value138, value131, value132, value133, value141),
        handler(x4.type) &&
          shouldShowSidePlusForNode3 &&
          run9(map8, value134, 'right', value140, value138, value131, value132, value133, value141));
    }
    const sourceNodeIds2 = selectedIds2.filter((item6) => {
      const enabled19 = nodes7[item6];
      return !!enabled19 && handler(enabled19.type);
    });
    if (selectedIds2.length >= 2 && sourceNodeIds2.length > 0) {
      const value143 = _getDragContext2.isDragging && selectedCount2.has(_getDragContext2.targetNodeId),
        x5 = computeMultiSelectionBoundsForSidePlus(
          selectedIds2,
          nodes7,
          value143
            ? {
                movedNodeIds: selectedIds2,
                offsetX: Number.isFinite(_getDragContext2.pendingDx) ? _getDragContext2.pendingDx : 0,
                offsetY: Number.isFinite(_getDragContext2.pendingDy) ? _getDragContext2.pendingDy : 0,
              }
            : undefined,
        );
      if (x5) {
        const value144 = 18,
          box9 = getNodeScreenRect(
            {
              x: x5.minX - value144,
              y: x5.minY - value144,
              width: x5.maxX - x5.minX + value144 * 2,
              height: x5.maxY - x5.minY + value144 * 2,
            },
            viewport3,
          ),
          value145 = box9.right + gap2 * value131,
          value146 = box9.top + box9.height / 2,
          value147 =
            Number.isFinite(mx2) &&
            Number.isFinite(my2) &&
            mx2 >= box9.left &&
            mx2 <= box9.right &&
            my2 >= box9.top &&
            my2 <= box9.bottom;
        run9(map8, sourceNodeIds2[0], 'right', value145, value146, value131, value132, value133, value147, {
          key: 'multi:right',
          plusKind: 'multi',
          sourceNodeIds: sourceNodeIds2,
          sizeMultiplier: 1.5,
        });
      }
    }
    for (const [value148, el38] of map4.entries()) {
      if (map8.has(value148)) continue;
      (el38.remove(), map4.delete(value148), map5.delete(value148));
    }
  }
  const run11 = rafSampleLatest(run10);
  ((window._v2UpdateSidePlus = run11),
    (window._v2UpdateSidePlusNow = run10),
    window.addEventListener('pointermove', (event3) => {
      if (side2.dragging) {
        let {
          viewport: viewport4,
          nodes: nodes8,
          connOverlay: connOverlay,
          _persistRev: _persistRev2,
        } = getStateRaw();
        if (window._spaceHeld === true) {
          const value149 = event3.clientX - side2.lastX,
            value150 = event3.clientY - side2.lastY;
          if (value149 || value150) {
            ((viewport4 = {
              x: (Number(viewport4?.x) || 0) + value149,
              y: (Number(viewport4?.y) || 0) + value150,
              zoom: Number(viewport4?.zoom) || 1,
            }),
              graphStore.updateViewport(viewport4.x, viewport4.y, viewport4.zoom),
              (side2.didAssistPan = true));
            const stateRaw6 = getStateRaw();
            ((viewport4 = stateRaw6.viewport),
              (nodes8 = stateRaw6.nodes),
              (connOverlay = stateRaw6.connOverlay),
              (_persistRev2 = stateRaw6._persistRev));
          }
        }
        ((side2.lastX = event3.clientX), (side2.lastY = event3.clientY));
        const map9 = new Set(connOverlay?.invalidNodeIds || []),
          value151 = run2(side2.sourceNodeIds, side2.srcId),
          map10 = new Set(value151),
          box10 = nodes8[side2.srcId];
        let value152 = 0,
          value153 = 0;
        if (side2.plusKind === 'multi') {
          if (Number.isFinite(side2.anchorWorldX) && Number.isFinite(side2.anchorWorldY))
            ((value152 = side2.anchorWorldX), (value153 = side2.anchorWorldY));
          else {
            const box11 = screenToWorld(side2.ax, side2.ay, viewport4);
            ((value152 = box11.x), (value153 = box11.y));
          }
        } else
          box10 &&
            ((value152 = side2.side === 'right' ? box10.x + (box10.width || 0) : box10.x),
            (value153 = box10.y + (box10.height || 0) / 2));
        const { x: x6, y: y2 } = screenToWorld(event3.clientX, event3.clientY, viewport4);
        _renderDraftEdgeDirectly(value152, value153, x6, y2, side2.side, viewport4);
        const _getNodeSpatialIndex2 = _getNodeSpatialIndex(
            nodes8,
            _persistRev2,
            _NODE_SPATIAL_INDEX_EDGE_HOVER_KEY,
          ),
          queryNodeSpatialIndexAtWorldPoint2 = queryNodeSpatialIndexAtWorldPoint(
            _getNodeSpatialIndex2,
            x6,
            y2,
          );
        let hoverId2 = null;
        for (const value154 of queryNodeSpatialIndexAtWorldPoint2) {
          const enabled20 = nodes8[value154];
          if (!enabled20) continue;
          if (map10.has(value154)) continue;
          if (map9.has(value154)) continue;
          const box12 = _resolveEdgeHoverNodeRect(enabled20);
          if (!box12) continue;
          if (isPointInRect(x6, y2, box12.x, box12.y, box12.width, box12.height)) {
            hoverId2 = value154;
            break;
          }
        }
        (connOverlay?.hoverId || null) !== hoverId2 &&
          graphStore.setConnOverlay({ hoverId: hoverId2, side: side2.side });
      } else run11(event3.clientX, event3.clientY);
    }),
    window.addEventListener(
      'pointerup',
      (event4) => {
        if (!side2.dragging) return;
        side2.dragging = false;
        const {
            srcId: srcId2,
            sourceNodeIds: sourceNodeIds3,
            plusKind: plusKind,
            side: side5,
            sx: sx2,
            sy: sy,
            didAssistPan: didAssistPan,
          } = side2,
          list14 = run2(sourceNodeIds3, srcId2),
          map11 = new Set(list14);
        ((side2.srcId = null),
          (side2.sourceNodeIds = []),
          (side2.plusKind = 'node'),
          (side2.anchorWorldX = null),
          (side2.anchorWorldY = null),
          (side2.didAssistPan = false),
          run6());
        const run12 = () => {
          (_clearDraftEdgeDirectly(), graphStore.clearConnOverlay());
        };
        if (!didAssistPan && Math.abs(event4.clientX - sx2) < 5 && Math.abs(event4.clientY - sy) < 5)
          return run12();
        const {
            viewport: viewport5,
            nodes: nodes9,
            edges: edges3,
            _persistRev: _persistRev3,
            _edgesRev: _edgesRev2,
          } = getStateRaw(),
          spatialIndex4 = _getNodeSpatialIndex(nodes9, _persistRev3, _NODE_SPATIAL_INDEX_DEFAULT_KEY);
        let targetId3 = hitTestNode(event4.clientX, event4.clientY, nodes9, viewport5, srcId2, false, {
          spatialIndex: spatialIndex4,
        });
        if (targetId3 && map11.has(targetId3)) targetId3 = null;
        if (targetId3) {
          run12();
          if (plusKind === 'multi') {
            if (side5 !== 'right') return;
            let enabled21 = false;
            for (const sourceId3 of list14) {
              if (!sourceId3 || sourceId3 === targetId3) continue;
              const stateRaw7 = getStateRaw(),
                enabled22 = stateRaw7.nodes?.[sourceId3],
                enabled23 = stateRaw7.nodes?.[targetId3];
              if (!enabled22 || !enabled23) continue;
              if (!isValidConnection(enabled22, enabled23)) continue;
              const addEdgeWithPolicies3 = addEdgeWithPolicies({ sourceId: sourceId3, targetId: targetId3 });
              if (!addEdgeWithPolicies3) continue;
              ((enabled21 = true), run4(sourceId3, targetId3, enabled22, enabled23, side5));
            }
            if (!enabled21) return;
            return;
          }
          const sourceId4 = side5 === 'right' ? srcId2 : targetId3,
            targetId4 = side5 === 'right' ? targetId3 : srcId2,
            srcData = nodes9[sourceId4],
            tgtData = nodes9[targetId4],
            map12 = _getOutEdgeMap(edges3, _edgesRev2),
            incomingEdges = _getIncomingEdgesByTarget(edges3, _edgesRev2, targetId4),
            value155 = !!map12.get(sourceId4)?.has(targetId4);
          if (!isValidConnection(srcData, tgtData) || value155) return;
          const value156 = String(srcData?.type || '').trim() === 'group';
          if (value156) {
            const addEdgeWithPolicies4 = addEdgeWithPolicies({ sourceId: sourceId4, targetId: targetId4 });
            if (!addEdgeWithPolicies4) return;
            run4(sourceId4, targetId4, srcData, tgtData, side5);
            return;
          }
          if (_isAnimeRealTarget(tgtData)) {
            if (!_isAnimeRealImageSrc(srcData)) return;
            for (const value157 of incomingEdges) graphStore.removeEdge(value157.id);
            tgtData.rhAnimeRealRefUrl &&
              graphStore.updateNodeData(targetId4, {
                rhAnimeRealRefUrl: '',
                rhAnimeRealRefLocalPath: '',
                rhAnimeRealRefFileName: '',
              });
          }
          const response2 = _applyRhPersonReplaceV3FixedInputs({
            srcData: srcData,
            tgtData: tgtData,
            incomingEdges: incomingEdges,
            nodes: nodes9,
            targetId: targetId4,
          });
          if (!response2.ok) return;
          const addEdgeWithPolicies5 = addEdgeWithPolicies({ sourceId: sourceId4, targetId: targetId4 });
          if (!addEdgeWithPolicies5) return;
          run4(sourceId4, targetId4, srcData, tgtData, side5);
          return;
        }
        if (side5 === 'left') {
          _showLeftQuoteMenu(event4.clientX, event4.clientY, srcId2, viewport5, run12);
          return;
        }
        if (side5 !== 'right') {
          run12();
          return;
        }
        if (plusKind === 'multi') {
          const sourceIds = list14.filter((item7) => !!nodes9[item7]);
          if (sourceIds.length === 0) {
            run12();
            return;
          }
          _showQuoteMenu(event4.clientX, event4.clientY, sourceIds[0], viewport5, run12, {
            sourceIds: sourceIds,
          });
          return;
        }
        const enabled24 = nodes9[srcId2];
        if (!enabled24) {
          run12();
          return;
        }
        _showQuoteMenu(event4.clientX, event4.clientY, srcId2, viewport5, run12);
      },
      { capture: true },
    ));
}
const _RH_ANIME_REAL_MODEL = ANIME_REAL_MODEL_ID,
  _isAnimeRealTarget = (enabled25) =>
    !!enabled25 && enabled25.type === 'ai-image' && String(enabled25.model || '') === _RH_ANIME_REAL_MODEL,
  _isAnimeRealImageSrc = (value158) => {
    const value159 = String(value158?.type || '');
    return value159 === 'source-image' || value159 === 'image' || value159 === 'ai-image';
  },
  _isRhPersonReplaceV3Target = (enabled26) =>
    !!enabled26 && enabled26.type === 'ai-image' && isRhPersonReplaceWorkflowModel(enabled26.model),
  _getRhV54RefKind = (value160) => {
    return resolveEffectiveInputKind(value160) || 'image';
  },
  _getAiAudioWorkflowKey = (enabled27) => {
    if (!enabled27 || String(enabled27.type || '') !== 'ai-audio') return '';
    const value161 = String(enabled27.audioWorkflowKey || '').trim();
    if (value161) return value161;
    const value162 = String(enabled27.model || '').trim();
    return value162;
  },
  _getManifestFixedInputConfig = (args3) => {
    const value163 = String(args3?.type || '').trim();
    if (value163 === 'ai-audio') {
      const audioWorkflowKey = _getAiAudioWorkflowKey(args3);
      return getFixedInputSlotConfigFromManifest({
        ...args3,
        audioWorkflowKey: audioWorkflowKey,
        model: audioWorkflowKey,
      });
    }
    return getFixedInputSlotConfigFromManifest(args3);
  },
  _edgeTimeKey = (value164) => {
    const value165 = Number(value164?.createdAt);
    if (Number.isFinite(value165)) return value165;
    const value166 = String(value164?.id || ''),
      list15 = value166.match(/(\d{10,})/g);
    if (list15 && list15.length) return Number(list15[list15.length - 1]) || 0;
    return 0;
  };
function _finishManifestFixedInputResult(value167, value168, value169) {
  const refSlot = String(value169 || '').trim();
  if (!refSlot) return { ok: true, refSlot: '' };
  const list16 = getExclusiveSlotsForFixedSlot(value167?.exclusiveGroups, refSlot);
  if (list16.length > 1) {
    const map13 = new Set(list16);
    for (const value170 of Array.isArray(value168) ? value168 : []) {
      const value171 = String(value170?.refSlot || '').trim();
      value170?.id && value171 !== refSlot && map13.has(value171) && graphStore.removeEdge(value170.id);
    }
  }
  return { ok: true, refSlot: refSlot };
}
function _canUseManifestFixedInputOverflow({
  config: config2,
  srcKind: srcKind,
  tgtData: tgtData2,
  incomingEdges: incomingEdges2,
  nodes: nodes10,
}) {
  const enabled28 = String(srcKind || '').trim();
  if (!enabled28 || enabled28 === 'text') return false;
  const map14 = new Set(config2?.visibleSlots || []),
    value172 = (config2?.slotOrderByType?.[enabled28] || []).filter((item8) => map14.has(item8)).length,
    targetInputPolicy = getTargetInputPolicy(tgtData2),
    value173 = Number(targetInputPolicy?.maxByKind?.[enabled28]);
  if (!Number.isFinite(value173) || value173 <= value172) return false;
  const value174 = (Array.isArray(incomingEdges2) ? incomingEdges2 : []).filter(
    (item9) => _getRhV54RefKind(nodes10?.[item9?.sourceId]) === enabled28,
  ).length;
  return value174 < value173;
}
function _allowsManifestFixedInputOverflow({ config: config3, srcKind: srcKind2, tgtData: tgtData3 }) {
  const enabled29 = String(srcKind2 || '').trim();
  if (!enabled29 || enabled29 === 'text') return false;
  const map15 = new Set(config3?.visibleSlots || []),
    value175 = (config3?.slotOrderByType?.[enabled29] || []).filter((item10) => map15.has(item10)).length,
    targetInputPolicy2 = getTargetInputPolicy(tgtData3),
    value176 = Number(targetInputPolicy2?.maxByKind?.[enabled29]);
  return Number.isFinite(value176) && value176 > value175;
}
function _cycleManifestFixedInputWhenFull({
  config: config4,
  srcKind: srcKind3,
  tgtData: tgtData4,
  incomingEdges: incomingEdges3,
  nodes: nodes11,
  slotOrder: slotOrder,
}) {
  const enabled30 = String(srcKind3 || '').trim();
  if (!enabled30 || enabled30 === 'text') return null;
  if (config4?.manifest?.inputSlots?.cycleFixedInputWhenFull !== true) return null;
  const targetInputPolicy3 = getTargetInputPolicy(tgtData4),
    count17 = Number(targetInputPolicy3?.maxByKind?.[enabled30]);
  if (!Number.isFinite(count17) || count17 <= 0) return null;
  const map16 = new Set(config4?.visibleSlots || []),
    value177 = (config4?.slotOrderByType?.[enabled30] || []).filter((item11) => map16.has(item11)).length,
    list17 = (Array.isArray(incomingEdges3) ? incomingEdges3 : [])
      .filter((item12) => _getRhV54RefKind(nodes11?.[item12?.sourceId]) === enabled30)
      .sort((item13, value178) => _edgeTimeKey(item13) - _edgeTimeKey(value178));
  if (list17.length < count17) return null;
  const enabled31 = list17[0];
  if (!enabled31?.id) return null;
  const value179 = String(enabled31.refSlot || '');
  graphStore.removeEdge(enabled31.id);
  const refSlot2 =
    count17 <= value177 && Array.isArray(slotOrder) && slotOrder.includes(value179) ? value179 : '';
  return { ok: true, refSlot: refSlot2 };
}
function _applyRhPersonReplaceV3FixedInputs({
  srcData: srcData2,
  tgtData: tgtData5,
  incomingEdges: incomingEdges4,
  nodes: nodes12,
  targetId: targetId5,
}) {
  if (!_isRhPersonReplaceV3Target(tgtData5)) return { ok: true, refSlot: '' };
  if (!_isAnimeRealImageSrc(srcData2)) return { ok: false, refSlot: '' };
  const list18 = ['replaceTarget', 'replacedImage'],
    list19 = Array.isArray(incomingEdges4) ? incomingEdges4 : [],
    list20 = list19.filter((item14) => {
      const value180 = nodes12?.[item14.sourceId];
      return _isAnimeRealImageSrc(value180);
    }),
    map17 = new Set(
      list20.map((item15) => String(item15.refSlot || '')).filter((item16) => list18.includes(item16)),
    ),
    refSlot3 = list18.find((item17) => !map17.has(item17)) || '';
  if (refSlot3) return { ok: true, refSlot: refSlot3 };
  let enabled32 = null;
  for (const value181 of list20) {
    if (list18.includes(String(value181.refSlot || ''))) {
      if (!enabled32 || _edgeTimeKey(value181) < _edgeTimeKey(enabled32)) enabled32 = value181;
    }
  }
  if (!enabled32)
    for (const value182 of list20) {
      if (!enabled32 || _edgeTimeKey(value182) < _edgeTimeKey(enabled32)) enabled32 = value182;
    }
  if (enabled32) graphStore.removeEdge(enabled32.id);
  const refSlot4 =
    enabled32 && list18.includes(String(enabled32.refSlot || '')) ? String(enabled32.refSlot) : list18[0];
  return { ok: true, refSlot: refSlot4 };
}
function _applyManifestFixedInputs({
  srcData: srcData3,
  tgtData: tgtData6,
  incomingEdges: incomingEdges5,
  nodes: nodes13,
  targetId: targetId6,
  preferredRefSlot: preferredRefSlot,
}) {
  const value183 = String(tgtData6?.type || '').trim();
  if (value183 !== 'ai-video' && value183 !== 'ai-audio' && value183 !== 'ai-image')
    return { ok: true, refSlot: '' };
  if (value183 === 'ai-image' && _isRhPersonReplaceV3Target(tgtData6)) return { ok: true, refSlot: '' };
  const config5 = _getManifestFixedInputConfig(tgtData6);
  if (!config5) return { ok: true, refSlot: '' };
  const srcKind4 = _getRhV54RefKind(srcData3);
  if (srcKind4 === 'text') return { ok: true, refSlot: '' };
  const map18 = new Set(config5.visibleSlots || []),
    list21 = config5.slotOrderByType?.[srcKind4] || [],
    list22 = list21.filter(
      (item18) => map18.has(item18) && fixedInputSlotAcceptsSource(config5, item18, srcData3),
    ),
    value184 = list21.filter(
      (item19) => !map18.has(item19) && fixedInputSlotAcceptsSource(config5, item19, srcData3),
    ),
    slotOrder2 = list22.length > 0 ? list22 : value184;
  if (slotOrder2.length === 0) {
    if (
      _canUseManifestFixedInputOverflow({
        config: config5,
        srcKind: srcKind4,
        tgtData: tgtData6,
        incomingEdges: incomingEdges5,
        nodes: nodes13,
      })
    )
      return { ok: true, refSlot: '' };
    return { ok: false, refSlot: '' };
  }
  const value185 = slotOrder2.includes(String(preferredRefSlot || '')) ? String(preferredRefSlot || '') : '',
    incomingEdges6 = Array.isArray(incomingEdges5) ? incomingEdges5 : [],
    list23 = incomingEdges6.filter((item20) => {
      const value186 = nodes13?.[item20.sourceId];
      return _getRhV54RefKind(value186) === srcKind4;
    }),
    _allowsManifestFixedInputOverflow2 = _allowsManifestFixedInputOverflow({
      config: config5,
      srcKind: srcKind4,
      tgtData: tgtData6,
    });
  for (const value187 of list23) {
    const enabled33 = String(value187?.refSlot || '');
    if (_allowsManifestFixedInputOverflow2 && !enabled33) continue;
    (!slotOrder2.includes(enabled33) ||
      !fixedInputSlotAcceptsSource(config5, enabled33, nodes13?.[value187.sourceId])) &&
      graphStore.removeEdge(value187.id);
  }
  const list24 = list23.filter(
      (item21) =>
        slotOrder2.includes(String(item21?.refSlot || '')) &&
        fixedInputSlotAcceptsSource(config5, item21?.refSlot, nodes13?.[item21.sourceId]),
    ),
    map19 = new Set(
      list24.map((item22) => String(item22.refSlot || '')).filter((item23) => slotOrder2.includes(item23)),
    ),
    value188 = slotOrder2.find((item24) => !map19.has(item24)) || '';
  if (value185 && !map19.has(value185))
    return _finishManifestFixedInputResult(config5, incomingEdges6, value185);
  if (value188) return _finishManifestFixedInputResult(config5, incomingEdges6, value188);
  if (
    _canUseManifestFixedInputOverflow({
      config: config5,
      srcKind: srcKind4,
      tgtData: tgtData6,
      incomingEdges: incomingEdges6,
      nodes: nodes13,
    })
  )
    return { ok: true, refSlot: '' };
  const _cycleManifestFixedInputWhenFull2 = _cycleManifestFixedInputWhenFull({
    config: config5,
    srcKind: srcKind4,
    tgtData: tgtData6,
    incomingEdges: incomingEdges6,
    nodes: nodes13,
    slotOrder: slotOrder2,
  });
  if (_cycleManifestFixedInputWhenFull2)
    return _finishManifestFixedInputResult(
      config5,
      incomingEdges6,
      _cycleManifestFixedInputWhenFull2.refSlot,
    );
  if (slotOrder2.length === 1)
    return (
      list24.forEach((item25) => graphStore.removeEdge(item25.id)),
      _finishManifestFixedInputResult(config5, incomingEdges6, slotOrder2[0])
    );
  if (value185) {
    const value189 = list24.find((item26) => String(item26.refSlot || '') === value185);
    if (value189) graphStore.removeEdge(value189.id);
    return _finishManifestFixedInputResult(config5, incomingEdges6, value185);
  }
  const value190 = list24.reduce(
      (item27, value191) =>
        !_edgeTimeKey(item27) || _edgeTimeKey(value191) > _edgeTimeKey(item27) ? value191 : item27,
      null,
    ),
    value192 = String(value190?.refSlot || ''),
    count18 = slotOrder2.indexOf(value192),
    value193 = count18 >= 0 ? slotOrder2[(count18 + 1) % slotOrder2.length] : slotOrder2[0];
  let enabled34 = null;
  for (const value194 of list24) {
    if (String(value194.refSlot || '') !== value193) continue;
    if (!enabled34 || _edgeTimeKey(value194) < _edgeTimeKey(enabled34)) enabled34 = value194;
  }
  if (!enabled34)
    for (const value195 of list24) {
      if (!enabled34 || _edgeTimeKey(value195) < _edgeTimeKey(enabled34)) enabled34 = value195;
    }
  if (enabled34) graphStore.removeEdge(enabled34.id);
  const value196 =
    enabled34 && slotOrder2.includes(String(enabled34.refSlot || '')) ? String(enabled34.refSlot) : value193;
  return _finishManifestFixedInputResult(config5, incomingEdges6, value196);
}
function _isDreaminaVideoTarget(enabled35) {
  return (
    !!enabled35 &&
    String(enabled35.type || '') === 'ai-video' &&
    isDreaminaStyleVideoModel(enabled35.model, enabled35.provider)
  );
}
function _applyDreaminaVideoFixedInputs({
  srcData: srcData4,
  tgtData: tgtData7,
  incomingEdges: incomingEdges7,
  nodes: nodes14,
  targetId: targetId7,
}) {
  if (!_isDreaminaVideoTarget(tgtData7)) return { ok: true, refSlot: '' };
  const dreaminaVideoRouteMode = normalizeDreaminaVideoRouteMode(tgtData7?.dreaminaRouteMode, tgtData7?.mode),
    _getRhV54RefKind2 = _getRhV54RefKind(srcData4),
    list25 = Array.isArray(incomingEdges7) ? incomingEdges7 : [];
  if (dreaminaVideoRouteMode === 'frames2video') {
    if (_getRhV54RefKind2 !== 'image') return { ok: false, refSlot: '' };
    for (const value197 of list25) {
      const value198 = nodes14?.[value197.sourceId];
      _getRhV54RefKind(value198) !== 'image' && graphStore.removeEdge(value197.id);
    }
    const list26 = list25
      .filter((item28) => _getRhV54RefKind(nodes14?.[item28.sourceId]) === 'image')
      .sort((item29, value199) => _edgeTimeKey(item29) - _edgeTimeKey(value199));
    while (list26.length >= 2) {
      const value200 = list26.shift();
      if (value200?.id) graphStore.removeEdge(value200.id);
    }
    return { ok: true, refSlot: '' };
  }
  if (dreaminaVideoRouteMode === 'multiframe2video') {
    if (_getRhV54RefKind2 !== 'image') return { ok: false, refSlot: '' };
    const list27 = list25
      .filter((item30) => _getRhV54RefKind(nodes14?.[item30.sourceId]) === 'image')
      .sort((item31, value201) => _edgeTimeKey(item31) - _edgeTimeKey(value201));
    while (list27.length >= 20) {
      const value202 = list27.shift();
      if (value202?.id) graphStore.removeEdge(value202.id);
    }
    return { ok: true, refSlot: '' };
  }
  if (!['image', 'video', 'audio', 'text'].includes(_getRhV54RefKind2)) return { ok: false, refSlot: '' };
  if (_getRhV54RefKind2 === 'text') return { ok: true, refSlot: '' };
  const value203 = _getRhV54RefKind2 === 'image' ? 9 : 3,
    list28 = list25
      .filter((item32) => _getRhV54RefKind(nodes14?.[item32.sourceId]) === _getRhV54RefKind2)
      .sort((item33, value204) => _edgeTimeKey(item33) - _edgeTimeKey(value204));
  while (list28.length >= value203) {
    const value205 = list28.shift();
    if (value205?.id) graphStore.removeEdge(value205.id);
  }
  return { ok: true, refSlot: '' };
}
function _applyGenericInputKindLimit({
  srcData: srcData5,
  tgtData: tgtData8,
  incomingEdges: incomingEdges8,
  nodes: nodes15,
  sourceId: sourceId5,
}) {
  if (!_isModelPolicyTargetType(tgtData8?.type)) return { ok: true };
  if (_getManifestFixedInputConfig(tgtData8)) return { ok: true };
  if (_isDreaminaVideoTarget(tgtData8)) return { ok: true };
  const effectiveInputKind2 = resolveEffectiveInputKind(srcData5);
  if (!effectiveInputKind2 || effectiveInputKind2 === 'text') return { ok: true };
  const targetInputPolicy4 = getTargetInputPolicy(tgtData8);
  if (!isInputKindAllowed(targetInputPolicy4, effectiveInputKind2)) return { ok: false };
  const count19 = Number(targetInputPolicy4?.maxByKind?.[effectiveInputKind2]);
  if (!Number.isFinite(count19)) return { ok: true };
  if (count19 <= 0) return { ok: false };
  const value206 = (Array.isArray(incomingEdges8) ? incomingEdges8 : []).some(
    (item34) => item34?.sourceId === sourceId5,
  );
  if (value206) return { ok: true };
  const list29 = (Array.isArray(incomingEdges8) ? incomingEdges8 : [])
    .filter((item35) => _getRhV54RefKind(nodes15?.[item35?.sourceId]) === effectiveInputKind2)
    .sort((item36, value207) => _edgeTimeKey(item36) - _edgeTimeKey(value207));
  while (list29.length >= count19) {
    const value208 = list29.shift();
    if (value208?.id) graphStore.removeEdge(value208.id);
  }
  return { ok: true };
}
function _applyMediaClipInputLimit({ srcData: srcData6, tgtData: tgtData9 }) {
  if (!isMediaClipNodeType(tgtData9?.type)) return { ok: true };
  const mediaClipInputKind = getMediaClipInputKind(srcData6);
  if (mediaClipInputKind !== 'video' && mediaClipInputKind !== 'image' && mediaClipInputKind !== 'audio')
    return { ok: false };
  if (!isSupportedMediaClipInput(srcData6)) return { ok: false };
  return { ok: true };
}
function _replacePanorama360IncomingEdges({ tgtData: tgtData10, incomingEdges: incomingEdges9 }) {
  if (!_isPanorama360TargetType(tgtData10?.type)) return;
  const value209 = Array.isArray(incomingEdges9) ? incomingEdges9 : [];
  for (const value210 of value209) {
    if (value210?.id) graphStore.removeEdge(value210.id);
  }
}
export function addEdgeWithPolicies({
  sourceId: sourceId6,
  targetId: targetId8,
  preferredRefSlot: preferredRefSlot2,
}) {
  const edges4 = getStateRaw(),
    nodes16 = edges4.nodes || {},
    srcData7 = nodes16[sourceId6],
    tgtData11 = nodes16[targetId8];
  if (!srcData7 || !tgtData11) return false;
  if (!isValidConnection(srcData7, tgtData11)) return false;
  const value211 = String(srcData7.type || '').trim() === 'group';
  if (value211) {
    if (
      String(tgtData11.type || '').trim() === 'group' &&
      wouldCreateGroupOutputCycle({
        sourceId: sourceId6,
        targetId: targetId8,
        nodes: nodes16,
        edges: edges4.edges || {},
      })
    )
      return false;
    const stateRaw8 = getStateRaw(),
      value212 = !!_getOutEdgeMap(stateRaw8.edges, stateRaw8._edgesRev).get(sourceId6)?.has(targetId8);
    if (value212) return false;
    return (
      graphStore.addEdge({
        id: 'edge-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        sourceId: sourceId6,
        targetId: targetId8,
        isGroupOutputLink: true,
        createdAt: Date.now(),
      }),
      true
    );
  }
  const incomingEdges10 = _getIncomingEdgesByTarget(edges4.edges, edges4._edgesRev, targetId8);
  _replacePanorama360IncomingEdges({ tgtData: tgtData11, incomingEdges: incomingEdges10 });
  if (_isAnimeRealTarget(tgtData11)) {
    if (!_isAnimeRealImageSrc(srcData7)) return false;
    for (const value213 of incomingEdges10) graphStore.removeEdge(value213.id);
    tgtData11.rhAnimeRealRefUrl &&
      graphStore.updateNodeData(targetId8, {
        rhAnimeRealRefUrl: '',
        rhAnimeRealRefLocalPath: '',
        rhAnimeRealRefFileName: '',
      });
  }
  const response3 = _applyRhPersonReplaceV3FixedInputs({
    srcData: srcData7,
    tgtData: tgtData11,
    incomingEdges: incomingEdges10,
    nodes: nodes16,
    targetId: targetId8,
  });
  if (!response3.ok) return false;
  const response4 = _applyManifestFixedInputs({
    srcData: srcData7,
    tgtData: tgtData11,
    incomingEdges: incomingEdges10,
    nodes: nodes16,
    targetId: targetId8,
    preferredRefSlot: preferredRefSlot2,
  });
  if (!response4.ok) return false;
  const response5 = _applyDreaminaVideoFixedInputs({
    srcData: srcData7,
    tgtData: tgtData11,
    incomingEdges: incomingEdges10,
    nodes: nodes16,
    targetId: targetId8,
  });
  if (!response5.ok) return false;
  const response6 = _applyMediaClipInputLimit({
    srcData: srcData7,
    tgtData: tgtData11,
    incomingEdges: incomingEdges10,
    nodes: nodes16,
    sourceId: sourceId6,
  });
  if (!response6.ok) return false;
  const response7 = _applyGenericInputKindLimit({
    srcData: srcData7,
    tgtData: tgtData11,
    incomingEdges: incomingEdges10,
    nodes: nodes16,
    sourceId: sourceId6,
  });
  if (!response7.ok) return false;
  const targetNode = getStateRaw(),
    value214 = !!_getOutEdgeMap(targetNode.edges, targetNode._edgesRev).get(sourceId6)?.has(targetId8);
  if (value214) return false;
  let sourceMediaKey = '',
    sourceMediaW = 0,
    sourceMediaH = 0;
  if (String(srcData7.type || '').includes('video')) {
    const list30 = Array.isArray(srcData7.videos) ? srcData7.videos : [],
      value215 = Number(srcData7.mainVideoIndex),
      value216 = Number.isFinite(value215) ? Math.max(0, Math.trunc(value215)) : 0,
      value217 = list30[value216] || null,
      value218 = list30.find((item37) => _videoSourceKey(item37) && !_isUnavailableVideoRecord(item37)),
      value219 = value217 && !_isUnavailableVideoRecord(value217) ? value217 : value218,
      value220 =
        String(value219?.localPath || '').trim() ||
        String(value219?.displayLocalPath || '').trim() ||
        String(value219?.originalLocalPath || '').trim() ||
        String(value219?.videoLocalPath || '').trim() ||
        String(value219?.videoUrl || '').trim() ||
        (!_isUnavailableVideoRecord(srcData7)
          ? String(srcData7.localPath || '').trim() ||
            String(srcData7.displayLocalPath || '').trim() ||
            String(srcData7.originalLocalPath || '').trim() ||
            String(srcData7.videoLocalPath || '').trim() ||
            String(srcData7.videoUrl || '').trim() ||
            String(srcData7.src || '').trim() ||
            String(srcData7.url || '').trim() ||
            String(srcData7.resultUrl || '').trim() ||
            String(srcData7.sourceUrl || '').trim()
          : '');
    if (value220) sourceMediaKey = value220;
    const count20 = Number(value217?.videoWidth || 0),
      count21 = Number(value217?.videoHeight || 0),
      count22 = Number(srcData7.selectedVideoWidth || 0),
      count23 = Number(srcData7.selectedVideoHeight || 0),
      count24 = Number(srcData7.videoWidth || 0),
      count25 = Number(srcData7.videoHeight || 0);
    if (count20 > 0 && count21 > 0) ((sourceMediaW = count20), (sourceMediaH = count21));
    else {
      if (count22 > 0 && count23 > 0) ((sourceMediaW = count22), (sourceMediaH = count23));
      else count24 > 0 && count25 > 0 && ((sourceMediaW = count24), (sourceMediaH = count25));
    }
    if (!(sourceMediaW > 0 && sourceMediaH > 0 && sourceMediaKey))
      try {
        const displayedVideoMetaFromNode = getDisplayedVideoMetaFromNode(sourceId6),
          value221 = String(displayedVideoMetaFromNode?.src || '').trim(),
          count26 = Number(displayedVideoMetaFromNode?.w || 0),
          count27 = Number(displayedVideoMetaFromNode?.h || 0);
        count26 > 0 && count27 > 0 && ((sourceMediaW = count26), (sourceMediaH = count27));
        if (value221)
          try {
            const uRL = new URL(value221, window.location.origin),
              value222 = String(uRL.pathname || '');
            if (value222.startsWith('/output/')) sourceMediaKey = value222.replace(/^\/+/, '');
            else {
              if (value222.startsWith('/data/')) sourceMediaKey = value222.replace(/^\/+/, '');
              else {
                if (value222.startsWith('/')) sourceMediaKey = value222.replace(/^\/+/, '');
              }
            }
          } catch {
            if (value221.startsWith('/')) sourceMediaKey = value221.replace(/^\/+/, '');
          }
      } catch {}
  }
  const refSlot5 = response3.refSlot || response4.refSlot || response5.refSlot || '';
  (removeCoveredAssetInputRefForConnection({
    targetId: targetId8,
    targetNode: targetNode.nodes?.[targetId8] || tgtData11,
    sourceNode: srcData7,
    sourceKind: resolveEffectiveInputKind(srcData7),
    refSlot: refSlot5,
    incomingEdges: _getIncomingEdgesByTarget(targetNode.edges, targetNode._edgesRev, targetId8),
    nodes: targetNode.nodes || nodes16,
  }),
    graphStore.addEdge({
      id: 'edge-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      sourceId: sourceId6,
      targetId: targetId8,
      ...(refSlot5 ? { refSlot: refSlot5 } : null),
      ...(sourceMediaKey ? { sourceMediaKey: sourceMediaKey } : null),
      ...(sourceMediaW > 0 && sourceMediaH > 0
        ? { sourceMediaW: sourceMediaW, sourceMediaH: sourceMediaH }
        : null),
      createdAt: Date.now(),
    }));
  try {
    const _getManifestFixedInputConfig2 = _getManifestFixedInputConfig(tgtData11),
      value223 =
        String(tgtData11?.type || '') === 'ai-video' &&
        (_getManifestFixedInputConfig2?.slotOrderByType?.video || []).includes('sourceVideo');
    if (value223 && sourceMediaW > 0 && sourceMediaH > 0) {
      const enabled36 =
          (Array.isArray(tgtData11.videos) && tgtData11.videos.length > 0) ||
          String(tgtData11.videoUrl || '').trim() ||
          String(tgtData11.localPath || '').trim() ||
          String(tgtData11.thumbId || '').trim(),
        value224 = String(tgtData11.aspectRatio || '自适应');
      if (!enabled36 && value224 === '自适应') {
        const stateRaw9 = getStateRaw(),
          box13 = stateRaw9.nodes?.[targetId8];
        if (box13) {
          const count28 = sourceMediaW / sourceMediaH;
          if (Number.isFinite(count28) && count28 > 0) {
            const box14 = getAIGenerationNodeSize(sourceMediaW, sourceMediaH),
              width5 = box14.width,
              height5 = box14.height,
              x7 = Number(box13.x || 0) + Number(box13.width || 0) / 2,
              y3 = Number(box13.y || 0) + Number(box13.height || 0) / 2;
            graphStore.updateNodeData(targetId8, {
              width: width5,
              height: height5,
              x: x7 - width5 / 2,
              y: y3 - height5 / 2,
            });
          }
        }
      }
    }
  } catch {}
  return true;
}
export function initPickConnect(el39) {
  function run13(value225, value226, value227, value228, value229) {
    const map20 = _getOutEdgeMap(value228, value229),
      value230 = value227[value225],
      list31 = [],
      value231 = value226 === 'left',
      value232 = value226 === 'left' && _isAnimeRealTarget(value230),
      value233 = value226 === 'left' && _isRhPersonReplaceV3Target(value230),
      value234 = value226 === 'left' ? _getManifestFixedInputConfig(value230) : null,
      map21 = new Set(value234?.visibleSlots || []);
    for (const [value235, value236] of Object.entries(value227)) {
      if (value235 === value225) continue;
      const enabled37 = String(value236?.type || '').trim() === 'group';
      if (value232) {
        if (!enabled37 && !_isAnimeRealImageSrc(value236)) {
          list31.push(value235);
          continue;
        }
      }
      if (value233) {
        if (!enabled37 && !_isAnimeRealImageSrc(value236)) {
          list31.push(value235);
          continue;
        }
      }
      if (value234 && !enabled37) {
        const _getRhV54RefKind3 = _getRhV54RefKind(value236),
          list32 = (value234.slotOrderByType?.[_getRhV54RefKind3] || []).filter((item38) =>
            map21.has(item38),
          );
        if (_getRhV54RefKind3 !== 'text' && list32.length === 0) {
          list31.push(value235);
          continue;
        }
      }
      const value237 = value231 ? value236 : value230,
        value238 = value231 ? value230 : value236,
        value239 = !!(value237?.id && value238?.id && map20.get(value237.id)?.has(value238.id));
      (!isValidConnection(value237, value238) || value239) && list31.push(value235);
    }
    return list31;
  }
  function run14(sourceId7, targetId9) {
    const { pickConnectMode: pickConnectMode } = getStateRaw(),
      preferredRefSlot3 = String(pickConnectMode?.preferredRefSlot || '').trim(),
      addEdgeWithPolicies6 = addEdgeWithPolicies({
        sourceId: sourceId7,
        targetId: targetId9,
        preferredRefSlot: preferredRefSlot3,
      });
    if (!addEdgeWithPolicies6) return false;
    const {
      pickConnectMode: pickConnectMode2,
      nodes: nodes17,
      edges: edges5,
      _edgesRev: _edgesRev3,
    } = getStateRaw();
    if (pickConnectMode2 && pickConnectMode2.active) {
      const invalidNodeIds2 = run13(
        pickConnectMode2.sourceNodeId,
        pickConnectMode2.handleDirection,
        nodes17,
        edges5,
        _edgesRev3,
      );
      graphStore.setConnOverlay({ srcId: pickConnectMode2.sourceNodeId, invalidNodeIds: invalidNodeIds2 });
    }
    return true;
  }
  (el39.addEventListener(
    'contextmenu',
    (event5) => {
      const { pickConnectMode: pickConnectMode3 } = getStateRaw();
      if (!pickConnectMode3 || !pickConnectMode3.active) return;
      (event5.preventDefault?.(),
        event5.stopPropagation?.(),
        event5.stopImmediatePropagation?.(),
        (event5._pickConnectHandled = true),
        uiStore.setPickConnectMode({ active: false }));
    },
    true,
  ),
    el39.addEventListener(
      'click',
      (event6) => {
        const { pickConnectMode: pickConnectMode4 } = getStateRaw();
        if (!pickConnectMode4 || !pickConnectMode4.active) return;
        const el40 = event6.target.closest('.prompt-attachment-btn');
        if (el40) {
          const value240 = el40.closest('.v2-node');
          if (value240 && value240.id === pickConnectMode4.sourceNodeId) {
            ((event6._pickConnectHandled = true),
              event6.stopImmediatePropagation(),
              uiStore.setPickConnectMode({ active: false }));
            return;
          }
        }
        const enabled38 = event6.target.closest('.v2-node');
        if (!enabled38 || enabled38.id === pickConnectMode4.sourceNodeId) return;
        const stateRaw10 = getStateRaw(),
          enabled39 = stateRaw10.nodes[enabled38.id];
        if (!enabled39) return;
        const value241 = pickConnectMode4.handleDirection === 'left',
          value242 = value241 ? enabled39.id : pickConnectMode4.sourceNodeId,
          value243 = value241 ? pickConnectMode4.sourceNodeId : enabled39.id,
          value244 = stateRaw10.nodes[value242],
          value245 = stateRaw10.nodes[value243];
        if (!isValidConnection(value244, value245)) return;
        run14(value242, value243) && ((event6._pickConnectHandled = true), event6.stopImmediatePropagation());
      },
      true,
    ),
    el39.addEventListener('pointermove', (event7) => {
      const {
        pickConnectMode: pickConnectMode5,
        nodes: nodes18,
        viewport: viewport6,
        connOverlay: connOverlay2,
        _persistRev: _persistRev4,
      } = getStateRaw();
      if (!pickConnectMode5 || !pickConnectMode5.active) return;
      const spatialIndex5 = _getNodeSpatialIndex(nodes18, _persistRev4, _NODE_SPATIAL_INDEX_DEFAULT_KEY);
      let hitTestNode3 = hitTestNode(
        event7.clientX,
        event7.clientY,
        nodes18,
        viewport6,
        pickConnectMode5.sourceNodeId,
        false,
        { spatialIndex: spatialIndex5 },
      );
      (hitTestNode3 &&
        connOverlay2 &&
        connOverlay2.invalidNodeIds &&
        connOverlay2.invalidNodeIds.includes(hitTestNode3) &&
        (hitTestNode3 = null),
        pickConnectMode5.hoverNodeId !== hitTestNode3 && uiStore.setPickConnectHover(hitTestNode3));
    }));
  const value246 = (event8) => {
    event8.target.closest('[contenteditable="true"]') && event8.target.blur();
  };
  let enabled40 = false,
    value247 = null,
    value248 = null;
  uiStore.subscribeSelector(
    (sourceNodeId3) => ({
      active: !!sourceNodeId3.pickConnectMode?.active,
      sourceNodeId: sourceNodeId3.pickConnectMode?.sourceNodeId || null,
      handleDirection: sourceNodeId3.pickConnectMode?.handleDirection || null,
    }),
    ({ active: active, sourceNodeId: sourceNodeId4, handleDirection: handleDirection }) => {
      if (active) {
        (el39.classList.add('is-connecting'), document.addEventListener('focusin', value246, true));
        const size = getCursorSize(),
          linkCursor = createLinkCursor({ size: size });
        (document.documentElement.classList.add('is-connecting-mode'),
          document.documentElement.style.setProperty('--connect-cursor', linkCursor));
        if (!enabled40 || value247 !== sourceNodeId4 || value248 !== handleDirection) {
          ((enabled40 = true), (value247 = sourceNodeId4), (value248 = handleDirection));
          const { nodes: nodes19, edges: edges6, _edgesRev: _edgesRev4 } = getStateRaw(),
            invalidNodeIds3 = run13(sourceNodeId4, handleDirection, nodes19, edges6, _edgesRev4);
          graphStore.setConnOverlay({ srcId: sourceNodeId4, invalidNodeIds: invalidNodeIds3 });
        }
      } else
        (el39.classList.remove('is-connecting'),
          document.removeEventListener('focusin', value246, true),
          document.documentElement.classList.remove('is-connecting-mode'),
          document.documentElement.style.removeProperty('--connect-cursor'),
          enabled40 &&
            ((enabled40 = false),
            (value247 = null),
            graphStore.setSelectionBox({ active: false }),
            uiStore.setPickConnectHover(null),
            graphStore.clearConnOverlay()));
    },
  );
}
function _showQuoteMenu(value249, value250, value251, value252, value253, value254 = {}) {
  document.querySelector('.v2-quote-menu')?.remove();
  const { nodes: nodes20 } = getStateRaw(),
    handler3 = (value255, value256 = null) => {
      const list33 = [],
        map22 = new Set(),
        value257 = Array.isArray(value255) ? value255 : [];
      for (const value258 of value257) {
        const enabled41 = String(value258 || '').trim();
        if (!enabled41 || map22.has(enabled41)) continue;
        (map22.add(enabled41), list33.push(enabled41));
      }
      const value259 = String(value256 || '').trim();
      if (list33.length === 0 && value259) list33.push(value259);
      return list33;
    },
    sourceId8 = handler3(value254?.sourceIds, value251).filter((item39) => !!nodes20[item39]),
    value260 = sourceId8.includes(value251) ? value251 : sourceId8[0],
    box15 = value260 ? nodes20[value260] : null;
  if (!box15) {
    value253?.();
    return;
  }
  const value261 = sourceId8.map((item40) => nodes20[item40]).filter(Boolean),
    handler4 = (value262, value263) => {
      const displayedMediaSizeFromNode2 = getDisplayedMediaSizeFromNode(value262, value263),
        count29 = Number(displayedMediaSizeFromNode2?.w || 0),
        count30 = Number(displayedMediaSizeFromNode2?.h || 0),
        count31 = count29 > 0 && count30 > 0 ? count29 / count30 : 0;
      return Number.isFinite(count31) && count31 > 0 ? count31 : 0;
    },
    handler5 = (value264, x8, y4, value265) => {
      const count32 = Number(value265);
      if (!(Number.isFinite(count32) && count32 > 0)) return false;
      const box16 = getAIGenerationNodeSize(count32 >= 1 ? count32 : 1, count32 >= 1 ? 1 : 1 / count32),
        width6 = box16.width,
        height6 = box16.height,
        stateRaw11 = getStateRaw(),
        enabled42 = stateRaw11.nodes?.[value264];
      if (!enabled42) return false;
      return (
        graphStore.updateNodeData(value264, {
          width: width6,
          height: height6,
          x: x8 - width6 / 2,
          y: y4 - height6 / 2,
        }),
        commit(),
        true
      );
    },
    handler6 = (value266, value267) => {
      const stateRaw12 = getStateRaw(),
        value268 = stateRaw12.nodes || {},
        enabled43 = value268[value266],
        box17 = value268[value267];
      if (!enabled43 || !box17) return;
      if (String(enabled43.type || '') !== 'ai-video') return;
      if (String(box17.type || '') !== 'ai-video') return;
      const value269 = Number(box17.width || 0),
        value270 = Number(box17.height || 0);
      if (!(value269 === _AI_VIDEO_DEFAULT_SIZE.width && value270 === _AI_VIDEO_DEFAULT_SIZE.height)) return;
      const value271 =
        (Array.isArray(box17.videos) && box17.videos.length > 0) ||
        String(box17.videoUrl || '').trim() ||
        String(box17.localPath || '').trim() ||
        String(box17.thumbId || '').trim();
      if (value271) return;
      const value272 = Number(box17.x || 0) + value269 / 2,
        value273 = Number(box17.y || 0) + value270 / 2,
        count33 = Date.now(),
        value274 = () => {
          const displayedMediaSizeFromNode3 = getDisplayedMediaSizeFromNode(value266, 'video'),
            value275 = Number(displayedMediaSizeFromNode3?.w || 0),
            value276 = Number(displayedMediaSizeFromNode3?.h || 0);
          let count34 = value275,
            count35 = value276;
          if (!(count34 > 0 && count35 > 0)) {
            const stateRaw13 = getStateRaw(),
              value277 = stateRaw13.nodes?.[value266];
            if (value277) {
              const value278 = Number(value277.mainVideoIndex),
                value279 = Number.isFinite(value278) ? Math.max(0, Math.trunc(value278)) : 0,
                value280 = Array.isArray(value277.videos) ? value277.videos : [],
                value281 = value280[value279],
                count36 = Number(value281?.videoWidth || 0),
                count37 = Number(value281?.videoHeight || 0),
                count38 = Number(value277.selectedVideoWidth || 0),
                count39 = Number(value277.selectedVideoHeight || 0),
                count40 = Number(value277.videoWidth || 0),
                count41 = Number(value277.videoHeight || 0);
              if (count36 > 0 && count37 > 0) ((count34 = count36), (count35 = count37));
              else {
                if (count38 > 0 && count39 > 0) ((count34 = count38), (count35 = count39));
                else count40 > 0 && count41 > 0 && ((count34 = count40), (count35 = count41));
              }
            }
          }
          if (count34 > 0 && count35 > 0) {
            handler5(value267, value272, value273, count34 / count35);
            return;
          }
          if (Date.now() - count33 < 0x4b0) requestAnimationFrame(value274);
        };
      requestAnimationFrame(value274);
    },
    x9 = screenToWorld(value249, value250, value252),
    el41 = document.createElement('div');
  el41.className = 'v2-quote-menu';
  const el42 = document.createElement('div');
  ((el42.className = 'v2-quote-title'),
    (el42.textContent = t('edgeController.quoteMenuTitle')),
    el41.appendChild(el42));
  const value282 = 'var(--white-50)',
    iconBg = 'var(--white-02)',
    list34 = [
      {
        iconEl: _iconAiText(value282),
        iconBg: iconBg,
        label: '文本',
        desc: '文案、脚本、提示词',
        type: 'ai-text',
        w: _AI_TEXT_DEFAULT_SIZE.width,
        h: _AI_TEXT_DEFAULT_SIZE.height,
      },
      {
        iconEl: _iconAiImage(value282),
        iconBg: iconBg,
        label: '图像',
        desc: '图片、海报、角色素材',
        type: 'ai-image',
        w: _AI_IMAGE_DEFAULT_SIZE.width,
        h: _AI_IMAGE_DEFAULT_SIZE.height,
      },
      {
        iconEl: _iconAiVideo(value282),
        iconBg: iconBg,
        label: '视频',
        desc: '短片、转场、动态镜头',
        type: 'ai-video',
        w: _AI_VIDEO_DEFAULT_SIZE.width,
        h: _AI_VIDEO_DEFAULT_SIZE.height,
      },
      {
        iconEl: _iconAiAudio(value282),
        iconBg: iconBg,
        label: '音频',
        desc: '配音、音效、音乐',
        type: 'ai-audio',
        w: _AI_AUDIO_DEFAULT_SIZE.width,
        h: _AI_AUDIO_DEFAULT_SIZE.height,
      },
      {
        iconEl: _iconStoryboardScript(value282),
        iconBg: iconBg,
        label: '分镜脚本',
        desc: '镜头表、提示词、节奏',
        type: 'storyboard-script',
        w: STORYBOARD_SCRIPT_DEFAULT_SIZE.width,
        h: STORYBOARD_SCRIPT_DEFAULT_SIZE.height,
        badge: 'BETA',
      },
      {
        iconEl: _iconAiImage(value282),
        iconBg: iconBg,
        label: '360全景图',
        desc: '全景画面与空间关系',
        type: 'panorama-360',
        w: PANORAMA_SCENE_DEFAULT_SIZE.width,
        h: PANORAMA_SCENE_DEFAULT_SIZE.height,
      },
    ].map(_applyNodeCreationMenuMeta),
    map23 = new Set(getAllowedGenerationNodeTypesForQuoteMenu(value261)),
    list35 = list34.filter((item41) => map23.has(item41.type));
  (list35.forEach((type2) => {
    const el43 = document.createElement('button');
    el43.className = 'v2-menu-row' + (type2.desc ? ' has-desc' : '');
    const el44 = document.createElement('div');
    ((el44.className = 'v2-menu-ico'), el44.replaceChildren());
    if (type2.iconEl) el44.appendChild(type2.iconEl.cloneNode(true));
    if (type2.iconBg) el44.style.background = type2.iconBg;
    const el45 = document.createElement('div');
    el45.className = 'v2-menu-txt-wrap';
    const el46 = document.createElement('span');
    ((el46.className = 'v2-menu-lbl'), (el46.textContent = type2.label));
    if (type2.badge) {
      const el47 = document.createElement('span');
      ((el47.textContent = type2.badge), (el47.className = 'v2-badge-beta'), el46.appendChild(el47));
    }
    el45.appendChild(el46);
    if (type2.desc) {
      const el48 = document.createElement('span');
      ((el48.className = 'v2-menu-sub'), (el48.textContent = type2.desc), el45.appendChild(el48));
    }
    (el43.appendChild(el44),
      el43.appendChild(el45),
      el43.addEventListener('click', (event9) => {
        event9.stopPropagation();
        const id = generateId(type2.type);
        let width7 = type2.w,
          height7 = type2.h;
        if (
          (type2.type === 'ai-image' || type2.type === 'ai-video') &&
          ((box15.width && box15.height) || (box15.videoWidth && box15.videoHeight))
        ) {
          let count42 = 0;
          if (type2.type === 'ai-video' && String(box15.type || '') !== 'ai-video') {
            const value283 = Number(box15.mainVideoIndex) || 0,
              value284 = Math.max(0, Math.trunc(value283)),
              list36 = Array.isArray(box15.videos) ? box15.videos : [],
              value285 = String(box15.localPath || '').trim(),
              value286 = String(box15.videoUrl || '').trim(),
              count43 = Number(box15.selectedVideoWidth || 0),
              count44 = Number(box15.selectedVideoHeight || 0);
            let value287 = value284;
            if (list36.length) {
              let count45 = -1;
              value285 &&
                (count45 = list36.findIndex((item42) => String(item42?.localPath || '').trim() === value285));
              count45 < 0 &&
                value286 &&
                (count45 = list36.findIndex((item43) => String(item43?.videoUrl || '').trim() === value286));
              if (count45 >= 0) value287 = count45;
              else {
                if (value284 >= list36.length) value287 = 0;
              }
            } else value287 = 0;
            const box18 = list36[value287] || list36[0] || null,
              count46 = box18 ? Number(box18.videoWidth || box18.width || 0) : 0,
              count47 = box18 ? Number(box18.videoHeight || box18.height || 0) : 0;
            count42 =
              (count43 > 0 && count44 > 0 ? count43 / count44 : 0) ||
              handler4(value260, 'video') ||
              (count46 > 0 && count47 > 0 ? count46 / count47 : 0) ||
              (box15.videoWidth && box15.videoHeight ? box15.videoWidth / box15.videoHeight : 0) ||
              (box15.width && box15.height ? box15.width / box15.height : 0);
          } else
            count42 =
              handler4(value260, 'image') || (box15.width && box15.height ? box15.width / box15.height : 0);
          if (!(Number.isFinite(count42) && count42 > 0)) count42 = 1;
          const box19 = getAIGenerationNodeSize(count42 >= 1 ? count42 : 1, count42 >= 1 ? 1 : 1 / count42);
          ((width7 = box19.width), (height7 = box19.height));
        }
        let id2 = {
          id: id,
          type: type2.type,
          x: x9.x - width7 / 2,
          y: x9.y - height7 / 2,
          width: width7,
          height: height7,
          name: type2.defaultName || type2.label,
        };
        (type2.type === 'ai-image' || type2.type === 'ai-video') &&
          !Object.prototype.hasOwnProperty.call(id2, 'aspectRatio') &&
          (id2.aspectRatio = '自适应');
        if (box15.type === type2.type) {
          const box20 = { ...box15 };
          (delete box20.id,
            delete box20.x,
            delete box20.y,
            delete box20.width,
            delete box20.height,
            delete box20.name,
            delete box20.prompt,
            delete box20.outputText,
            stripImageGenerationResultStateForDerivedNode(box20),
            delete box20.batchSize,
            (id2 = { ...box20, ...id2 }));
        }
        _isPanorama360TargetType(id2.type) &&
          (id2 = createPanorama360NodeData({
            id: id2.id,
            x: id2.x,
            y: id2.y,
            width: id2.width,
            height: id2.height,
            name: id2.name,
          }));
        id2.type === 'storyboard-script' &&
          (id2 = createStoryboardScriptNodeData({
            id: id2.id,
            x: id2.x,
            y: id2.y,
            width: id2.width,
            height: id2.height,
            name: id2.name,
          }));
        graphStore.addNode(id2);
        let enabled44 = false,
          enabled45 = '';
        for (const sourceId9 of sourceId8) {
          const stateRaw14 = getStateRaw(),
            enabled46 = stateRaw14.nodes?.[sourceId9],
            enabled47 = stateRaw14.nodes?.[id];
          if (!enabled46 || !enabled47) continue;
          if (!isValidConnection(enabled46, enabled47)) continue;
          const addEdgeWithPolicies7 = addEdgeWithPolicies({ sourceId: sourceId9, targetId: id });
          if (!addEdgeWithPolicies7) continue;
          enabled44 = true;
          if (!enabled45) enabled45 = sourceId9;
        }
        if (!enabled44 && sourceId8.length === 1) {
          const id3 = generateId('edge');
          (graphStore.addEdge({
            id: id3,
            sourceId: sourceId8[0],
            targetId: id,
            createdAt: Date.now(),
          }),
            (enabled44 = true),
            (enabled45 = sourceId8[0]));
        }
        (graphStore.setSelectedNodes([id]),
          commit(),
          type2.type === 'ai-video' && enabled45 && handler6(enabled45, id),
          value288?.(),
          el41.remove(),
          value253?.());
      }),
      el41.appendChild(el43));
  }),
    document.body.appendChild(el41));
  const run15 = () => {
    const stateRaw15 = getStateRaw().viewport || value252,
      box21 = worldToScreen(x9.x, x9.y, stateRaw15);
    ((el41.style.left = box21.x + 'px'), (el41.style.top = box21.y + 'px'));
  };
  run15();
  const value288 = graphStore.subscribeSelector(
      (value289) => value289.viewport,
      () => run15(),
    ),
    value290 = (event10) => {
      if (el41.contains(event10.target)) return;
      (value288?.(), el41.remove(), document.removeEventListener('mousedown', value290, true), value253?.());
    };
  requestAnimationFrame(() => document.addEventListener('mousedown', value290, true));
}
function _showLeftQuoteMenu(value291, value292, targetId10, value293, value294) {
  document.querySelector('.v2-quote-menu')?.remove();
  const { nodes: nodes21 } = getState(),
    args4 = nodes21[targetId10];
  if (!args4) {
    value294?.();
    return;
  }
  const x10 = screenToWorld(value291, value292, value293),
    el49 = document.createElement('div');
  el49.className = 'v2-quote-menu';
  const el50 = document.createElement('div');
  ((el50.className = 'v2-quote-title'),
    (el50.textContent = t('edgeController.inputMenuTitle')),
    el49.appendChild(el50));
  const list37 = [
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
    list38 = getAllowedInputNodeTypesForSidePlus(args4.type),
    list39 = list37.filter((item44) => list38.includes(item44.type));
  (list39.forEach((type3) => {
    const el51 = document.createElement('button');
    ((el51.className = 'v2-menu-row' + (type3.desc ? ' has-desc' : '')), (el51.style.marginBottom = '2px'));
    const el52 = document.createElement('div');
    ((el52.className = 'v2-menu-ico'), el52.replaceChildren());
    if (type3.iconEl) el52.appendChild(type3.iconEl.cloneNode(true));
    if (type3.iconBg) el52.style.background = type3.iconBg;
    const el53 = document.createElement('div');
    ((el53.className = 'v2-menu-txt-wrap'),
      Object.assign(el53.style, {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        flex: '1',
        minWidth: '0',
      }));
    const el54 = document.createElement('span');
    ((el54.className = 'v2-menu-lbl'),
      Object.assign(el54.style, {
        fontSize: '16px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }),
      (el54.textContent = type3.label));
    if (type3.badge) {
      const el55 = document.createElement('span');
      ((el55.textContent = type3.badge),
        Object.assign(el55.style, {
          fontSize: '10px',
          padding: '1px 6px',
          borderRadius: '10px',
          border: '1px solid var(--stroke-danger)',
          color: 'var(--text-danger)',
          background: 'var(--fill-danger-soft)',
          fontWeight: '700',
          letterSpacing: '0.3px',
        }),
        el54.appendChild(el55));
    }
    el53.appendChild(el54);
    if (type3.desc) {
      const el56 = document.createElement('span');
      ((el56.className = 'v2-menu-sub'), (el56.textContent = type3.desc), el53.appendChild(el56));
    }
    (el51.appendChild(el52),
      el51.appendChild(el53),
      el51.addEventListener('click', (event11) => {
        event11.stopPropagation();
        const id4 = generateId(type3.type);
        let id5 = {
          id: id4,
          type: type3.type,
          x: x10.x - 150,
          y: x10.y,
          width: type3.width ?? type3.w,
          height: type3.height ?? type3.h,
          name: type3.defaultName || type3.label,
        };
        (type3.type === 'ai-image' || type3.type === 'ai-video') &&
          !Object.prototype.hasOwnProperty.call(id5, 'aspectRatio') &&
          (id5.aspectRatio = '自适应');
        if (args4.type === type3.type) {
          const box22 = { ...args4 };
          (delete box22.id,
            delete box22.x,
            delete box22.y,
            delete box22.width,
            delete box22.height,
            delete box22.name,
            delete box22.prompt,
            delete box22.outputText,
            stripImageGenerationResultStateForDerivedNode(box22),
            delete box22.batchSize,
            (id5 = { ...box22, ...id5 }));
        }
        if (id5.type === 'source-image' || id5.type === 'source-video')
          id5 = buildSourceMediaNodePayload(id5);
        else
          _isPanorama360TargetType(id5.type) &&
            (id5 = createPanorama360NodeData({
              id: id5.id,
              x: id5.x,
              y: id5.y,
              width: id5.width,
              height: id5.height,
            }));
        graphStore.addNode(id5);
        const addEdgeWithPolicies8 = addEdgeWithPolicies({ sourceId: id4, targetId: targetId10 });
        if (!addEdgeWithPolicies8) {
          const id6 = generateId('edge');
          graphStore.addEdge({
            id: id6,
            sourceId: id4,
            targetId: targetId10,
            createdAt: Date.now(),
          });
        }
        (graphStore.setSelectedNodes([id4]), commit(), value295?.(), el49.remove(), value294?.());
      }),
      el49.appendChild(el51));
  }),
    document.body.appendChild(el49));
  const run16 = () => {
    const stateRaw16 = getStateRaw().viewport || value293,
      box23 = worldToScreen(x10.x, x10.y, stateRaw16);
    ((el49.style.left = box23.x + 'px'), (el49.style.top = box23.y + 'px'));
  };
  run16();
  const value295 = graphStore.subscribeSelector(
      (value296) => value296.viewport,
      () => run16(),
    ),
    value297 = (event12) => {
      if (el49.contains(event12.target)) return;
      (value295?.(), el49.remove(), document.removeEventListener('mousedown', value297, true), value294?.());
    };
  requestAnimationFrame(() => document.addEventListener('mousedown', value297, true));
}
