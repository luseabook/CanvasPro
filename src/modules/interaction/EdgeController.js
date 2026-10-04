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
import { readViewportInteractionState } from '../../core/viewportInteractionState.js';
import {
  beginViewportPanPreview,
  flushViewportPanPreview,
  getViewportPanPreview,
  isViewportPanPreviewActive,
  updateViewportPanPreview,
} from '../../core/viewportPanPreview.js';
import { createViewportPreviewCoordinator } from './viewportPreviewCoordinator.js';
import {
  createGroupSidePlusCandidateIdCache,
  createSidePlusGeometryOverlay,
  findClosestNodeWithGeometryOverrides,
} from './sidePlusGeometry.js';
import { buildConnectionPathGeometry, normalizeConnectionLineStyle } from '../../core/edgePathGeometry.js';
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
import { createWhiteboardNodeData, WHITEBOARD_DEFAULT_SIZE } from '../whiteboard/whiteboardNodeData.js';
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
  resolveFixedInputSlotForRef,
} from '../fixedInputAssetRefs.js';
import { stripImageGenerationResultStateForDerivedNode } from '../../core/imageTaskRuntimeState.js';
import { wouldCreateGroupOutputCycle } from '../groupDynamicOutput.js';
import { ANIME_REAL_MODEL_ID } from '../../manifests/index.js';
const graphStore = appStore?.['graphStore'] || graphStore_2 || appStore,
  uiStore = appStore?.['uiStore'] || uiStore_2 || appStore,
  workspaceStore = appStore?.['workspaceStore'] || workspaceStore_2 || appStore,
  SIDE_PLUS_EXIT_REMOVAL_DELAY_MS = 0x8c,
  SIDE_PLUS_ASSIST_PAN_PREVIEW_OWNER = 'side-plus-connect-assist-pan';
function getStateRaw() {
  return { ...graphStore['getStateRaw'](), ...uiStore['getStateRaw'](), ...workspaceStore['getStateRaw']() };
}
function getState() {
  return { ...graphStore['getState'](), ...uiStore['getState'](), ...workspaceStore['getState']() };
}
function _buildOutEdgeMap(value) {
  const map = new Map();
  for (const enabled of value) {
    if (!enabled) continue;
    const enabled2 = enabled['sourceId'],
      enabled3 = enabled['targetId'];
    if (!enabled2 || !enabled3) continue;
    let enabled4 = map['get'](enabled2);
    (!enabled4 && ((enabled4 = new Set()), map['set'](enabled2, enabled4)),
      enabled4['add'](enabled3));
  }
  return map;
}
const _edgeIndexCache = { edges: null, edgesRev: -0x1, outMap: new Map(), incomingByTarget: new Map() };
function _applyNodeCreationMenuMeta(args) {
  const label = getNodeCreationMenuItem(args?.['type']);
  if (!label) return args;
  return {
    ...args,
    label: label['label'] || args['label'],
    desc: label['subtitle'] || args['desc'],
    badge: label['badge'] ?? args['badge'],
    defaultName: label['defaultName'] || label['label'] || args['label'],
  };
}
function _buildEdgeIndexes(item) {
  const outMap = new Map(),
    incomingByTarget = new Map();
  for (const enabled5 of Object['values'](item || {})) {
    if (!enabled5) continue;
    const key = enabled5['sourceId'],
      index = enabled5['targetId'];
    if (key && index) {
      let enabled6 = outMap['get'](key);
      (!enabled6 && ((enabled6 = new Set()), outMap['set'](key, enabled6)),
        enabled6['add'](index));
    }
    if (index) {
      let list = incomingByTarget['get'](index);
      (!list && ((list = []), incomingByTarget['set'](index, list)),
        list['push'](enabled5));
    }
  }
  return { outMap: outMap, incomingByTarget: incomingByTarget };
}
function _getEdgeIndexes(enabled7, result) {
  if (!enabled7 || typeof enabled7 !== 'object')
    return (
      (_edgeIndexCache['edges'] = null),
      (_edgeIndexCache['edgesRev'] = -0x1),
      (_edgeIndexCache['outMap'] = new Map()),
      (_edgeIndexCache['incomingByTarget'] = new Map()),
      _edgeIndexCache
    );
  const data = Number['isFinite'](result) ? result : -0x1;
  if (_edgeIndexCache['edges'] === enabled7 && _edgeIndexCache['edgesRev'] === data)
    return _edgeIndexCache;
  const { outMap: outMap2, incomingByTarget: incomingByTarget2 } = _buildEdgeIndexes(enabled7);
  return (
    (_edgeIndexCache['edges'] = enabled7),
    (_edgeIndexCache['edgesRev'] = data),
    (_edgeIndexCache['outMap'] = outMap2),
    (_edgeIndexCache['incomingByTarget'] = incomingByTarget2),
    _edgeIndexCache
  );
}
function _getOutEdgeMap(options, target) {
  return _getEdgeIndexes(options, target)['outMap'];
}
function _getIncomingEdgesByTarget(source, next, enabled8) {
  if (!enabled8) return [];
  return _getEdgeIndexes(source, next)['incomingByTarget']['get'](enabled8) || [];
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
    x: x['x'],
    y: x['y'],
    width: x['width'] || (isNodeType(x, 'group') ? 0x190 : 0x104),
    height: x['height'] || (isNodeType(x, 'group') ? 0x12c : 0x50),
  };
}
function _getNodeSpatialIndex(nodes, current, entry = _NODE_SPATIAL_INDEX_DEFAULT_KEY) {
  if (!nodes || typeof nodes !== 'object') return null;
  const persistRev = Number['isFinite'](current) ? current : -0x1,
    state = _nodeSpatialIndexCache['get'](entry);
  if (state && state['nodes'] === nodes && state['persistRev'] === persistRev)
    return state['index'];
  const index2 =
    entry === _NODE_SPATIAL_INDEX_EDGE_HOVER_KEY
      ? createNodeSpatialIndex(nodes, { resolveRect: _resolveEdgeHoverNodeRect })
      : createNodeSpatialIndex(nodes);
  return (
    _nodeSpatialIndexCache['set'](entry, { nodes: nodes, persistRev: persistRev, index: index2 }),
    index2
  );
}
function _svgEl(record, payload, handle, config) {
  const el = document['createElementNS'](_SVG_NS, 'svg');
  return (
    el['setAttribute']('width', String(record)),
    el['setAttribute']('height', String(payload)),
    el['setAttribute']('viewBox', '0 0 24 24'),
    el['setAttribute']('fill', 'none'),
    el['setAttribute']('stroke', handle),
    el['setAttribute']('stroke-width', String(config)),
    el
  );
}
function _iconAiText(scope) {
  const el2 = _svgEl(0x12, 0x12, scope, 1.8),
    el3 = document['createElementNS'](_SVG_NS, 'path');
  el3['setAttribute']('d', 'M12 20h9');
  const el4 = document['createElementNS'](_SVG_NS, 'path');
  return (
    el4['setAttribute']('d', 'M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z'),
    el2['appendChild'](el3),
    el2['appendChild'](el4),
    el2
  );
}
function _iconAiImage(input) {
  const el5 = _svgEl(0x12, 0x12, input, 1.8),
    el6 = document['createElementNS'](_SVG_NS, 'rect');
  (el6['setAttribute']('x', '3'),
    el6['setAttribute']('y', '3'),
    el6['setAttribute']('width', '18'),
    el6['setAttribute']('height', '18'),
    el6['setAttribute']('rx', '3'));
  const el7 = document['createElementNS'](_SVG_NS, 'circle');
  (el7['setAttribute']('cx', '8.5'),
    el7['setAttribute']('cy', '8.5'),
    el7['setAttribute']('r', '1.5'),
    el7['setAttribute']('fill', input));
  const el8 = document['createElementNS'](_SVG_NS, 'polyline');
  return (
    el8['setAttribute']('points', '21 15 16 10 5 21'),
    el5['appendChild'](el6),
    el5['appendChild'](el7),
    el5['appendChild'](el8),
    el5
  );
}
function _iconAiVideo(output) {
  const el9 = _svgEl(0x12, 0x12, output, 1.8),
    el10 = document['createElementNS'](_SVG_NS, 'rect');
  (el10['setAttribute']('x', '2'),
    el10['setAttribute']('y', '6'),
    el10['setAttribute']('width', '15'),
    el10['setAttribute']('height', '12'),
    el10['setAttribute']('rx', '2'));
  const el11 = document['createElementNS'](_SVG_NS, 'path');
  return (
    el11['setAttribute']('d', 'M17\x209l5-3v12l-5-3V9z'),
    el9['appendChild'](el10),
    el9['appendChild'](el11),
    el9
  );
}
function _iconAiAudio(value2) {
  const el12 = _svgEl(0x12, 0x12, value2, 1.8),
    el13 = document['createElementNS'](_SVG_NS, 'path');
  el13['setAttribute']('d', 'M9 18V5l12-2v13');
  const el14 = document['createElementNS'](_SVG_NS, 'circle');
  (el14['setAttribute']('cx', '6'),
    el14['setAttribute']('cy', '18'),
    el14['setAttribute']('r', '3'));
  const el15 = document['createElementNS'](_SVG_NS, 'circle');
  return (
    el15['setAttribute']('cx', '18'),
    el15['setAttribute']('cy', '16'),
    el15['setAttribute']('r', '3'),
    el12['appendChild'](el13),
    el12['appendChild'](el14),
    el12['appendChild'](el15),
    el12
  );
}
function _iconStoryboardScript(value3) {
  const el16 = _svgEl(0x12, 0x12, value3, 1.8),
    el17 = document['createElementNS'](_SVG_NS, 'rect');
  (el17['setAttribute']('x', '3'),
    el17['setAttribute']('y', '4'),
    el17['setAttribute']('width', '18'),
    el17['setAttribute']('height', '16'),
    el17['setAttribute']('rx', '2'));
  const el18 = document['createElementNS'](_SVG_NS, 'line');
  (el18['setAttribute']('x1', '3'),
    el18['setAttribute']('y1', '9'),
    el18['setAttribute']('x2', '21'),
    el18['setAttribute']('y2', '9'));
  const el19 = document['createElementNS'](_SVG_NS, 'line');
  (el19['setAttribute']('x1', '3'),
    el19['setAttribute']('y1', '14'),
    el19['setAttribute']('x2', '21'),
    el19['setAttribute']('y2', '14'));
  const el20 = document['createElementNS'](_SVG_NS, 'line');
  return (
    el20['setAttribute']('x1', '8'),
    el20['setAttribute']('y1', '4'),
    el20['setAttribute']('x2', '8'),
    el20['setAttribute']('y2', '20'),
    el16['appendChild'](el17),
    el16['appendChild'](el18),
    el16['appendChild'](el19),
    el16['appendChild'](el20),
    el16
  );
}
function _iconWhiteboard(value4) {
  const el21 = _svgEl(0x12, 0x12, value4, 1.8),
    el22 = document['createElementNS'](_SVG_NS, 'rect');
  (el22['setAttribute']('x', '3'),
    el22['setAttribute']('y', '4'),
    el22['setAttribute']('width', '18'),
    el22['setAttribute']('height', '16'),
    el22['setAttribute']('rx', '2'));
  const el23 = document['createElementNS'](_SVG_NS, 'path');
  el23['setAttribute']('d', 'M7\x208h10');
  const el24 = document['createElementNS'](_SVG_NS, 'path');
  el24['setAttribute']('d', 'M7 15c2.2-3 4.6-3 6.8 0 1.1 1.5 2.2 1.5 3.2 0');
  const el25 = document['createElementNS'](_SVG_NS, 'path');
  return (
    el25['setAttribute']('d', 'M14.5 11.5l2.5-2.5 2 2-2.5 2.5-2.7.7.7-2.7z'),
    el21['appendChild'](el22),
    el21['appendChild'](el23),
    el21['appendChild'](el24),
    el21['appendChild'](el25),
    el21
  );
}
function _iconSourceText(value5) {
  const el26 = _svgEl(0x12, 0x12, value5, 1.8),
    el27 = document['createElementNS'](_SVG_NS, 'polyline');
  el27['setAttribute']('points', '4 7 4 4 20 4 20 7');
  const el28 = document['createElementNS'](_SVG_NS, 'line');
  (el28['setAttribute']('x1', '9'),
    el28['setAttribute']('y1', '20'),
    el28['setAttribute']('x2', '15'),
    el28['setAttribute']('y2', '20'));
  const el29 = document['createElementNS'](_SVG_NS, 'line');
  return (
    el29['setAttribute']('x1', '12'),
    el29['setAttribute']('y1', '4'),
    el29['setAttribute']('x2', '12'),
    el29['setAttribute']('y2', '20'),
    el26['appendChild'](el27),
    el26['appendChild'](el28),
    el26['appendChild'](el29),
    el26
  );
}
function _isPanorama360TargetType(value6) {
  return _PANORAMA_360_TARGET_TYPES['has'](String(value6 || '')['trim']());
}
function _isBlockedOutputNodeType(value7) {
  return _PANORAMA_SOURCE_BLOCKED_TYPES['has'](String(value7 || '')['trim']());
}
function _isPanorama360ImageSourceType(value8) {
  return _PANORAMA_360_IMAGE_SOURCE_TYPES['has'](String(value8 || '')['trim']());
}
function _isStoryboardInputTargetType(value9) {
  const value10 = String(value9 || '')['trim']();
  return value10 === 'storyboard' || value10 === 'storyboard-script';
}
function _isModelPolicyTargetType(value11) {
  const value12 = String(value11 || '')['trim']();
  return (
    value12 === 'ai-image' ||
    value12 === 'ai-text' ||
    value12 === 'ai-video' ||
    value12 === 'ai-audio'
  );
}
function _isSharedInputPolicyTargetType(value13) {
  return _isModelPolicyTargetType(value13) || _isStoryboardInputTargetType(value13);
}
export function getAllowedInputNodeTypesForSidePlus(value14) {
  const enabled9 =
      value14 && typeof value14 === 'object' && !Array['isArray'](value14) ? value14 : null,
    value15 = String(enabled9?.['type'] || value14 || '')['trim'](),
    value16 = {
      'source-image': ['source-image', 'ai-image'],
      'ai-image': ['source-image', 'ai-image'],
      whiteboard: ['source-image', 'ai-image'],
      'ai-audio': ['source-text', 'ai-text', 'source-audio', 'source-video', 'ai-audio', 'ai-video'],
      'ai-video': ['source-text', 'source-video', 'ai-image', 'ai-audio', 'ai-video'],
      'ai-text': ['source-text', 'source-video', 'ai-image', 'ai-video', 'ai-audio'],
      'media-clip': ['source-image', 'ai-image', 'source-video', 'ai-video', 'source-audio', 'ai-audio'],
      storyboard: ['source-text', 'source-image', 'source-video', 'ai-text', 'ai-image', 'ai-video'],
      'storyboard-script': ['source-text', 'source-image', 'source-video', 'ai-text', 'ai-image', 'ai-video'],
      'panorama-360': ['source-image', 'ai-image'],
      panorama_360: ['source-image', 'ai-image'],
      panorama360: ['source-image', 'ai-image'],
    },
    list2 = value16[value15] || ['source-text'];
  if (!enabled9 || !_isSharedInputPolicyTargetType(value15)) return list2;
  const targetInputPolicy = getTargetInputPolicy(enabled9);
  return list2['filter']((value17) => isInputKindAllowed(targetInputPolicy, normalizeInputKind(value17)));
}
export function getAllowedGenerationNodeTypesForQuoteMenu(list3 = []) {
  const list4 = [
      'ai-text',
      'ai-image',
      'ai-video',
      'ai-audio',
      'storyboard-script',
      'panorama-360',
      'whiteboard',
    ],
    list5 = Array['isArray'](list3) ? list3['filter'](Boolean) : [];
  return list4['filter']((type) =>
    list5['some']((value18) =>
      isValidConnection(value18, { id: '__fake_' + type, type: type }),
    ),
  );
}
export function setDragContextGetter(value19) {
  _getDragContext = typeof value19 === 'function' ? value19 : () => ({});
}
export function isValidConnection(enabled10, enabled11) {
  if (!enabled10 || !enabled11) return ![];
  if (enabled10['id'] === enabled11['id']) return ![];
  const value20 = enabled10['type'] || '',
    value21 = enabled11['type'] || '';
  if (value20 === 'debug' || _isBlockedOutputNodeType(value20)) return ![];
  const run = (value22) =>
    value22 === 'ai-image' ||
    value22 === 'ai-text' ||
    value22 === 'ai-video' ||
    value22 === 'ai-audio' ||
    value22 === 'media-clip' ||
    _isStoryboardInputTargetType(value22) ||
    value22 === 'group' ||
    _isPanorama360TargetType(value22) ||
    value22 === 'whiteboard';
  if (!run(value21)) return ![];
  if (value21 === 'whiteboard') return value20 === 'source-image' || value20 === 'ai-image';
  if (value20 === 'group') return value21 === 'group' || _isSharedInputPolicyTargetType(value21);
  if (_isPanorama360TargetType(value21)) {
    if (!_isPanorama360ImageSourceType(value20)) return ![];
  }
  if (isMediaClipNodeType(value21)) return isSupportedMediaClipInput(enabled10);
  if (value21 === 'ai-image') {
    const list6 = ['source-image', 'image', 'ai-image', 'source-text', 'text', 'ai-text'];
    if (!list6['includes'](value20)) return ![];
  }
  if (value21 === 'ai-audio') {
    if (value20 === 'source-image' || value20 === 'image' || value20 === 'ai-image') return ![];
  }
  if (_isSharedInputPolicyTargetType(value21)) {
    const effectiveInputKind = resolveEffectiveInputKind(enabled10);
    if (effectiveInputKind && !isInputKindAllowed(getTargetInputPolicy(enabled11), effectiveInputKind)) return ![];
    const fixedInputSlotConfigFromManifest = getFixedInputSlotConfigFromManifest(enabled11);
    if (fixedInputSlotConfigFromManifest && effectiveInputKind && effectiveInputKind !== 'text') {
      const map2 = new Set(fixedInputSlotConfigFromManifest['visibleSlots'] || []),
        list7 = fixedInputSlotConfigFromManifest['slotOrderByType']?.[effectiveInputKind] || [],
        list8 = list7['filter']((value23) => map2['has'](value23)),
        list9 = list8['length'] > 0x0 ? list8 : list7;
      if (
        list9['length'] > 0x0 &&
        !list9['some']((value24) => fixedInputSlotAcceptsSource(fixedInputSlotConfigFromManifest, value24, enabled10))
      )
        return ![];
    }
  }
  if (resolveEffectiveInputKind(enabled10) === 'video' && !hasUsableInputNodeSource(enabled10)) return ![];
  return !![];
}
function _videoSourceKey(response) {
  if (!response || typeof response !== 'object') return '';
  return (
    String(response['localPath'] || '')['trim']() ||
    String(response['displayLocalPath'] || '')['trim']() ||
    String(response['originalLocalPath'] || '')['trim']() ||
    String(response['videoLocalPath'] || '')['trim']() ||
    String(response['videoUrl'] || '')['trim']() ||
    String(response['src'] || '')['trim']() ||
    String(response['url'] || '')['trim']() ||
    String(response['resultUrl'] || '')['trim']() ||
    String(response['sourceUrl'] || '')['trim']() ||
    String(response['thumbId'] || '')['trim']()
  );
}
function _isUnavailableVideoRecord(value25) {
  const _videoSourceKey2 = _videoSourceKey(value25);
  if (!_videoSourceKey2) return ![];
  return (
    value25?.['mediaUnavailable'] === !![] &&
    String(value25?.['mediaUnavailableSource'] || '')['trim']() === _videoSourceKey2
  );
}
const SIDE_PLUS_POINTER_BLOCKER_SELECTOR = [
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
]['join'](',');
export function isSidePlusPointerBlockedByElement(el30) {
  const el31 =
    el30 && typeof el30['closest'] === 'function'
      ? el30
      : el30?.['parentElement'] || null;
  if (!el31) return ![];
  if (el31['closest']('.side-plus-btn, #v2-side-plus-holder')) return ![];
  return !!el31['closest'](SIDE_PLUS_POINTER_BLOCKER_SELECTOR);
}
function _isSidePlusPointerOnCanvasSurface(el32) {
  const enabled12 =
    el32 && typeof el32['closest'] === 'function'
      ? el32
      : el32?.['parentElement'] || null;
  if (!enabled12 || typeof document === 'undefined') return !![];
  const el33 = document['getElementById']?.('v2-canvas');
  if (!el33) return !![];
  const value26 = el33['closest']?.('.v2-canvas-stage') || null;
  return (
    enabled12 === el33 ||
    el33['contains']?.(enabled12) === !![] ||
    enabled12 === value26 ||
    value26?.['contains']?.(enabled12) === !![]
  );
}
function _resolveSidePlusPointerElementAt(value27, value28, value29) {
  if (value29 !== undefined) return value29;
  if (typeof document === 'undefined') return null;
  if (!Number['isFinite'](value27) || !Number['isFinite'](value28)) return null;
  return document['elementFromPoint']?.(value27, value28) || null;
}
function _resolveSidePlusPointerNodeIdByElement(el34) {
  const el35 =
      el34 && typeof el34['closest'] === 'function'
        ? el34
        : el34?.['parentElement'] || null,
    el36 = el35?.['closest']?.('.v2-node');
  return String(el36?.['dataset']?.['nodeId'] || el36?.['id'] || '')['trim']();
}
function _resolveSidePlusPointerContextAt(value30, value31, value32) {
  const _resolveSidePlusPointerElementAt2 = _resolveSidePlusPointerElementAt(value30, value31, value32);
  let policy = 'allow';
  if (isSidePlusPointerBlockedByElement(_resolveSidePlusPointerElementAt2)) policy = 'block';
  else !_isSidePlusPointerOnCanvasSurface(_resolveSidePlusPointerElementAt2) && (policy = 'selection-only');
  return { policy: policy, nodeId: _resolveSidePlusPointerNodeIdByElement(_resolveSidePlusPointerElementAt2) };
}
export function resolveSidePlusPointerPolicyAt(value33, value34, value35) {
  return _resolveSidePlusPointerContextAt(value33, value34, value35)['policy'];
}
export function isSidePlusPointerBlockedAt(value36, value37, value38) {
  return resolveSidePlusPointerPolicyAt(value36, value37, value38) === 'block';
}
export function resolveSidePlusLayerZIndex(value39) {
  const value40 = Number['parseInt'](String(value39 ?? ''), 0xa),
    value41 = Number['isFinite'](value40) ? value40 : 0xa;
  return String(Math['max'](0x0, value41 - 0x1));
}
export function resolveSidePlusButtonPosition({
  screenX: screenX,
  screenY: screenY,
  screenRadius: screenRadius,
  cssRadius: cssRadius,
  viewport: viewport,
  holderUsesWorldCoordinates: holderUsesWorldCoordinates,
}) {
  if (holderUsesWorldCoordinates) {
    const left = screenToWorld(screenX, screenY, viewport);
    return { left: left['x'] - cssRadius, top: left['y'] - cssRadius };
  }
  return { left: screenX - screenRadius, top: screenY - screenRadius };
}
export function resolveSidePlusRenderState({
  isDraggingPlus: isDraggingPlus = ![],
  isNodeDragging: isNodeDragging = ![],
  isBoxSelecting: isBoxSelecting = ![],
  isConnecting: isConnecting = ![],
  isPanning: isPanning = ![],
  isZooming: isZooming = ![],
  isViewportAnimating: isViewportAnimating = ![],
  isSpaceHeld: isSpaceHeld = ![],
  selectedCount: selectedCount = 0x0,
  requestedSelectionOnly: requestedSelectionOnly = ![],
} = {}) {
  const count = Number(selectedCount) || 0x0,
    value42 = count > 0x0,
    value43 = count >= 0x2;
  if (isDraggingPlus) return { shouldClear: !![], selectionOnly: ![] };
  if (isNodeDragging) return { shouldClear: !![], selectionOnly: ![] };
  if (value42 && (isBoxSelecting || isConnecting || isSpaceHeld))
    return { shouldClear: ![], selectionOnly: !![] };
  if (isBoxSelecting || isConnecting) return { shouldClear: !![], selectionOnly: ![] };
  const selectionOnly2 = requestedSelectionOnly || value43;
  if (isSpaceHeld && !isPanning && !selectionOnly2) return { shouldClear: !![], selectionOnly: ![] };
  return { shouldClear: ![], selectionOnly: selectionOnly2 };
}
export function shouldShowSidePlusForNode({
  sideDistance: sideDistance,
  threshold: threshold,
  isSelected: isSelected = ![],
  isHovered: isHovered = ![],
  isInside: isInside = ![],
  nodeType: nodeType = '',
} = {}) {
  if (isSelected) return !![];
  if (!isHovered) return ![];
  const value44 = Number(sideDistance),
    value45 = Number(threshold);
  if (Number['isFinite'](value44) && Number['isFinite'](value45) && value44 < value45) return !![];
  return !!isInside && String(nodeType || '')['trim']() !== 'group';
}
export function shouldUseInlineMediaClipAddSlot(value46 = '') {
  return isMediaClipNodeType(value46);
}
export function shouldShowRightSidePlusForNodeType(value47 = '') {
  const value48 = String(value47 || '')['trim']();
  if (value48 === 'debug') return ![];
  if (value48 === 'comment-note') return ![];
  if (value48 === 'whiteboard') return ![];
  if (value48 === 'storyboard') return ![];
  if (value48 === 'collage') return ![];
  return !_isBlockedOutputNodeType(value48) && !shouldUseInlineMediaClipAddSlot(value48);
}
export function getGroupSidePlusAnchorCandidateIds({
  nodes: nodes2,
  candidateIds: candidateIds,
  viewport: viewport2,
  mx: mx,
  my: my,
  threshold: threshold2,
  gap: gap = 0x24,
} = {}) {
  if (!Number['isFinite'](mx) || !Number['isFinite'](my)) return [];
  const value49 = Number(viewport2?.['zoom']) || 0x1,
    value50 = Number(threshold2);
  if (!Number['isFinite'](value50)) return [];
  const list10 = [],
    value51 = Array['isArray'](candidateIds)
      ? candidateIds['map']((value52) => [value52, nodes2?.[value52]])
      : Object['entries'](nodes2 || {});
  for (const [value53, x2] of value51) {
    if (!isNodeType(x2, 'group')) continue;
    const enabled13 = String(x2?.['id'] || value53 || '')['trim']();
    if (!enabled13) continue;
    const width = x2['width'] || 0x190,
      height = x2['height'] || 0x12c,
      box = getNodeScreenRect(
        { x: x2['x'], y: x2['y'], width: width, height: height },
        viewport2,
      ),
      value54 = box['right'] + gap * value49,
      value55 = box['top'] + box['height'] / 0x2;
    if (Math['hypot'](mx - value54, my - value55) < value50) list10['push'](enabled13);
  }
  return list10;
}
export function resolveSidePlusCandidateIds({
  selectedIds: selectedIds = [],
  isMultiSelection: isMultiSelection = ![],
  selectionOnly: selectionOnly = ![],
  hoverNodeId: hoverNodeId = null,
  groupAnchorIds: groupAnchorIds = [],
} = {}) {
  const list11 = Array['isArray'](groupAnchorIds) ? groupAnchorIds['filter'](Boolean) : [],
    value56 = Array['isArray'](selectedIds) ? selectedIds['filter'](Boolean) : [],
    candidateIds2 = isMultiSelection ? new Set() : new Set(value56),
    sideAnchorHoverIds = new Set(),
    enabled14 = !isMultiSelection && !selectionOnly && list11['length'] > 0x0;
  !isMultiSelection && !selectionOnly && hoverNodeId && !enabled14 && candidateIds2['add'](hoverNodeId);
  if (!isMultiSelection && !selectionOnly)
    for (const value57 of list11) {
      (candidateIds2['add'](value57), sideAnchorHoverIds['add'](value57));
    }
  return { candidateIds: candidateIds2, sideAnchorHoverIds: sideAnchorHoverIds };
}
export function computeMultiSelectionBoundsForSidePlus(value58, value59, value60 = {}) {
  const list12 = Array['isArray'](value58) ? value58 : [];
  if (list12['length'] < 0x2) return null;
  const map3 =
      value60?.['movedNodeIds'] && typeof value60['movedNodeIds'][Symbol['iterator']] === 'function'
        ? new Set(value60['movedNodeIds'])
        : null,
    value61 = Number['isFinite'](value60?.['offsetX']) ? value60['offsetX'] : 0x0,
    value62 = Number['isFinite'](value60?.['offsetY']) ? value60['offsetY'] : 0x0;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity,
    count2 = 0x0;
  for (const value63 of list12) {
    const box2 = value59?.[value63];
    if (!box2) continue;
    const value64 = map3?.['has'](value63) === !![],
      value65 = box2['x'] + (value64 ? value61 : 0x0),
      value66 = box2['y'] + (value64 ? value62 : 0x0);
    count2 += 0x1;
    const value67 = box2['width'] || 0x104,
      value68 = box2['height'] || 0x64,
      value69 = value65,
      value70 = box2['type'] !== 'group' ? value66 - 0x1e : value66,
      value71 = value65 + value67,
      value72 = value66 + value68;
    ((minX = Math['min'](minX, value69)),
      (minY = Math['min'](minY, value70)),
      (maxX = Math['max'](maxX, value71)),
      (maxY = Math['max'](maxY, value72)));
  }
  if (count2 < 0x2 || !Number['isFinite'](minX) || !Number['isFinite'](minY)) return null;
  return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
}
let _draftEdgeCache = {
  pathEl: null,
  lastStartX: 0x0,
  lastStartY: 0x0,
  lastEndX: 0x0,
  lastEndY: 0x0,
  lastSide: '',
  lastPathStyle: '',
  lastZoom: 0x0,
};
function _resetDraftEdgeCache(pathEl = null) {
  _draftEdgeCache = {
    pathEl: pathEl,
    lastStartX: 0x0,
    lastStartY: 0x0,
    lastEndX: 0x0,
    lastEndY: 0x0,
    lastSide: '',
    lastPathStyle: '',
    lastZoom: 0x0,
  };
}
function _getDraftEdgePath() {
  if (typeof document === 'undefined') return (_resetDraftEdgeCache(), null);
  const el37 = document['getElementById']('v2-edges');
  if (!el37) return (_resetDraftEdgeCache(), null);
  let el38 = _draftEdgeCache['pathEl'];
  return (
    el38 &&
      (el38['parentNode'] !== el37 || el38['isConnected'] === ![]) &&
      (el38['remove']?.(), (el38 = null)),
    !el38 &&
      ((el38 = el37['querySelector']?.('#v2-draft-edge') || null),
      el38 &&
        (el38['parentNode'] !== el37 || el38['isConnected'] === ![]) &&
        (el38 = null)),
    !el38 &&
      ((el38 = document['createElementNS']('http://www.w3.org/2000/svg', 'path')),
      (el38['id'] = 'v2-draft-edge'),
      el38['setAttribute']('class', 'conn-drag-path'),
      el38['setAttribute']('fill', 'none'),
      el38['setAttribute']('stroke', 'var(--indigo-70)'),
      el38['setAttribute']('stroke-linecap', 'round'),
      el37['appendChild'](el38)),
    _draftEdgeCache['pathEl'] !== el38 && _resetDraftEdgeCache(el38),
    el38
  );
}
function _renderDraftEdgeDirectly(startX, startY, endX, endY, startSide, box3) {
  const el39 = _getDraftEdgePath();
  if (!el39) return;
  const count3 = Math['hypot'](endX - startX, endY - startY);
  if (count3 < 0x5) {
    el39['style']['display'] = 'none';
    return;
  }
  const style = normalizeConnectionLineStyle(uiStore['getStateRaw']()?.['ui']?.['connectionLineStyle']),
    value73 =
      startX !== _draftEdgeCache['lastStartX'] ||
      startY !== _draftEdgeCache['lastStartY'] ||
      endX !== _draftEdgeCache['lastEndX'] ||
      endY !== _draftEdgeCache['lastEndY'] ||
      startSide !== _draftEdgeCache['lastSide'] ||
      style !== _draftEdgeCache['lastPathStyle'],
    value74 = box3['zoom'] !== _draftEdgeCache['lastZoom'];
  if (value73) {
    const value75 = Math['abs'](endX - startX),
      curveOffset = Math['min'](value75 * 0.75, 0x50),
      connectionPathGeometry = buildConnectionPathGeometry({
        startX: startX,
        startY: startY,
        endX: endX,
        endY: endY,
        style: style,
        startSide: startSide,
        curveOffset: curveOffset,
      });
    (el39['setAttribute']('d', connectionPathGeometry['d']),
      (_draftEdgeCache['lastStartX'] = startX),
      (_draftEdgeCache['lastStartY'] = startY),
      (_draftEdgeCache['lastEndX'] = endX),
      (_draftEdgeCache['lastEndY'] = endY),
      (_draftEdgeCache['lastSide'] = startSide),
      (_draftEdgeCache['lastPathStyle'] = style));
  }
  (value74 &&
    (el39['setAttribute']('stroke-width', '' + 0x2 / box3['zoom']),
    (el39['style']['strokeDasharray'] = 0x6 / box3['zoom'] + '\x20' + 0x4 / box3['zoom']),
    (_draftEdgeCache['lastZoom'] = box3['zoom'])),
    (el39['style']['display'] = 'block'));
}
function _clearDraftEdgeDirectly() {
  const el40 = document['getElementById']('v2-draft-edge');
  if (el40) el40['style']['display'] = 'none';
}
export function createEdgeController() {
  function tryStartHandleConnect(value76, event, value77, value78, value79) {
    if (!event || !event['target']) return ![];
    const el41 = event['target']['closest']('.v2-handle');
    if (!el41) return ![];
    return (
      event['preventDefault'](),
      event['stopPropagation'](),
      (value76['isConnecting'] = !![]),
      (value76['connectSourceId'] = el41['dataset']['nodeId']),
      (value76['connectStartX'] = value77),
      (value76['connectStartY'] = value78),
      (value76['connectSide'] = 'left'),
      _renderDraftEdgeDirectly(value77, value78, value77, value78, 'left', value79),
      !![]
    );
  }
  function updateHandleConnect(side, value80, value81, value82, value83, value84, value85, value86) {
    _renderDraftEdgeDirectly(
      side['connectStartX'] || value82,
      side['connectStartY'] || value83,
      value82,
      value83,
      side['connectSide'] || 'left',
      value84,
    );
    const spatialIndex = _getNodeSpatialIndex(
      value85,
      getStateRaw()['_persistRev'],
      _NODE_SPATIAL_INDEX_DEFAULT_KEY,
    );
    let hoverId = hitTestNode(
      value80,
      value81,
      value85,
      value84,
      side['connectSourceId'],
      ![],
      { spatialIndex: spatialIndex },
    );
    if (hoverId && value86?.['invalidNodeIds']?.['includes'](hoverId)) hoverId = null;
    return (
      (value86?.['hoverId'] || null) !== hoverId &&
        graphStore['setConnOverlay']({ hoverId: hoverId, side: side['connectSide'] }),
      !![]
    );
  }
  function finishHandleConnect(sourceId, value87, value88) {
    const stateRaw = getStateRaw(),
      { viewport: viewport3, nodes: nodes3 } = stateRaw,
      spatialIndex2 = _getNodeSpatialIndex(nodes3, stateRaw['_persistRev'], _NODE_SPATIAL_INDEX_DEFAULT_KEY),
      hitTestNode2 = hitTestNode(value87, value88, nodes3, viewport3, sourceId['connectSourceId'], ![], {
        spatialIndex: spatialIndex2,
      }),
      targetId = hitTestNode2 ? nodes3[hitTestNode2] : null;
    let addEdgeWithPolicies2 = ![];
    return (
      targetId &&
        (addEdgeWithPolicies2 = addEdgeWithPolicies({
          sourceId: sourceId['connectSourceId'],
          targetId: targetId['id'],
        })),
      _clearDraftEdgeDirectly(),
      graphStore['clearConnOverlay'](),
      addEdgeWithPolicies2
    );
  }
  return { tryStartHandleConnect: tryStartHandleConnect, updateHandleConnect: updateHandleConnect, finishHandleConnect: finishHandleConnect };
}
export function initConnectionHandles(value89) {
  const el42 = document['createElement']('div');
  el42['id'] = 'v2-side-plus-holder';
  const enabled15 = document['getElementById']('v2-canvas'),
    holderUsesWorldCoordinates2 = !!enabled15;
  (Object['assign'](
    el42['style'],
    holderUsesWorldCoordinates2
      ? {
          position: 'absolute',
          left: '0',
          top: '0',
          width: '0',
          height: '0',
          pointerEvents: 'none',
          zIndex: 'auto',
          overflow: 'visible',
        }
      : { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '95', overflow: 'visible' },
  ),
    (enabled15 || document['body'])['appendChild'](el42));
  const map4 = new Map(),
    map5 = new Map(),
    map6 = new Map(),
    map7 = createGroupSidePlusCandidateIdCache();
  let side2 = {
    dragging: ![],
    srcId: null,
    sourceNodeIds: [],
    plusKind: 'node',
    side: 'right',
    ax: 0x0,
    ay: 0x0,
    sx: 0x0,
    sy: 0x0,
    lastX: 0x0,
    lastY: 0x0,
    anchorWorldX: null,
    anchorWorldY: null,
    didAssistPan: ![],
    assistPanViewport: null,
  };
  const store = createViewportPreviewCoordinator({
    beginPreview: beginViewportPanPreview,
    updatePreview(box4) {
      updateViewportPanPreview(box4['x'], box4['y'], box4['zoom']);
    },
    flushPreview: flushViewportPanPreview,
    getPreview: getViewportPanPreview,
    isPreviewActive: isViewportPanPreviewActive,
  });
  function sourceNodeIds(value90, value91 = null) {
    const list13 = [],
      map8 = new Set(),
      value92 = Array['isArray'](value90) ? value90 : [];
    for (const value93 of value92) {
      const enabled16 = String(value93 || '')['trim']();
      if (!enabled16 || map8['has'](enabled16)) continue;
      (map8['add'](enabled16), list13['push'](enabled16));
    }
    const value94 = String(value91 || '')['trim']();
    if (list13['length'] === 0x0 && value94) list13['push'](value94);
    return list13;
  }
  function run2({
    sourceNodeId: sourceNodeId,
    targetNodeId: targetNodeId,
    side: side3,
    nodes: nodes4,
    edges: edges,
    outMap: outMap3,
  }) {
    if (!sourceNodeId || !targetNodeId || sourceNodeId === targetNodeId) return ![];
    const enabled17 = nodes4?.[sourceNodeId],
      enabled18 = nodes4?.[targetNodeId];
    if (!enabled17 || !enabled18) return ![];
    const sourceId2 = side3 === 'right' ? enabled17 : enabled18,
      targetId2 = side3 === 'right' ? enabled18 : enabled17;
    if (!sourceId2?.['id'] || !targetId2?.['id']) return ![];
    const value95 = !!outMap3['get'](sourceId2['id'])?.['has'](targetId2['id']);
    if (value95) return ![];
    if (
      String(sourceId2['type'] || '')['trim']() === 'group' &&
      String(targetId2['type'] || '')['trim']() === 'group' &&
      wouldCreateGroupOutputCycle({
        sourceId: sourceId2['id'],
        targetId: targetId2['id'],
        nodes: nodes4,
        edges: edges,
      })
    )
      return ![];
    return isValidConnection(sourceId2, targetId2);
  }
  function run3(value96, value97, value98, box5, value99) {
    if (value99 !== 'right') return;
    if (String(value98?.['type'] || '') !== 'ai-video') return;
    if (String(box5?.['type'] || '') !== 'ai-video') return;
    const fixedInputSlotConfigFromManifest2 = getFixedInputSlotConfigFromManifest(box5);
    if (
      fixedInputSlotConfigFromManifest2?.['slotKindById']?.['sourceVideo'] === 'video' &&
      fixedInputSlotConfigFromManifest2?.['slotKindById']?.['refImage'] === 'image'
    )
      return;
    const count4 = Number(box5['width'] || 0x0),
      count5 = Number(box5['height'] || 0x0),
      value100 =
        (Array['isArray'](box5['videos']) && box5['videos']['length'] > 0x0) ||
        String(box5['videoUrl'] || '')['trim']() ||
        String(box5['localPath'] || '')['trim']() ||
        String(box5['thumbId'] || '')['trim']();
    if (count4 !== 0x12c || count5 !== 0x12c || value100) return;
    const stateRaw2 = getStateRaw(),
      box6 = stateRaw2['nodes']?.[value97];
    if (!box6) return;
    const x3 = Number(box6['x'] || 0x0) + Number(box6['width'] || 0x0) / 0x2,
      y = Number(box6['y'] || 0x0) + Number(box6['height'] || 0x0) / 0x2,
      count6 = Date['now'](),
      value101 = () => {
        const displayedMediaSizeFromNode = getDisplayedMediaSizeFromNode(value96, 'video'),
          value102 = Number(displayedMediaSizeFromNode?.['w'] || 0x0),
          value103 = Number(displayedMediaSizeFromNode?.['h'] || 0x0);
        let count7 = value102,
          count8 = value103;
        if (!(count7 > 0x0 && count8 > 0x0)) {
          const stateRaw3 = getStateRaw(),
            value104 = stateRaw3['nodes']?.[value96];
          if (value104) {
            const value105 = Number(value104['mainVideoIndex']),
              value106 = Number['isFinite'](value105) ? Math['max'](0x0, Math['trunc'](value105)) : 0x0,
              value107 = Array['isArray'](value104['videos']) ? value104['videos'] : [],
              value108 = value107[value106],
              count9 = Number(value108?.['videoWidth'] || 0x0),
              count10 = Number(value108?.['videoHeight'] || 0x0),
              count11 = Number(value104['selectedVideoWidth'] || 0x0),
              count12 = Number(value104['selectedVideoHeight'] || 0x0),
              count13 = Number(value104['videoWidth'] || 0x0),
              count14 = Number(value104['videoHeight'] || 0x0);
            if (count9 > 0x0 && count10 > 0x0) ((count7 = count9), (count8 = count10));
            else {
              if (count11 > 0x0 && count12 > 0x0) ((count7 = count11), (count8 = count12));
              else count13 > 0x0 && count14 > 0x0 && ((count7 = count13), (count8 = count14));
            }
          }
        }
        if (count7 > 0x0 && count8 > 0x0) {
          const count15 = count7 / count8;
          if (Number['isFinite'](count15) && count15 > 0x0) {
            const box7 = getAIGenerationNodeSize(count7, count8),
              width2 = box7['width'],
              height2 = box7['height'];
            (graphStore['updateNodeData'](value97, {
              width: width2,
              height: height2,
              x: x3 - width2 / 0x2,
              y: y - height2 / 0x2,
            }),
              commit());
          }
          return;
        }
        if (Date['now']() - count6 < 0x4b0) requestAnimationFrame(value101);
      };
    requestAnimationFrame(value101);
  }
  function run4() {
    const { nodes: nodes5, edges: edges2, _edgesRev: _edgesRev } = getStateRaw(),
      outMap4 = _getOutEdgeMap(edges2, _edgesRev),
      value109 = sourceNodeIds(side2['sourceNodeIds'], side2['srcId']),
      map9 = new Set(value109),
      invalidNodeIds = [];
    for (const [targetNodeId2, value110] of Object['entries'](nodes5)) {
      if (map9['has'](targetNodeId2)) {
        invalidNodeIds['push'](targetNodeId2);
        continue;
      }
      let enabled19 = ![];
      for (const sourceNodeId2 of value109) {
        if (
          !run2({
            sourceNodeId: sourceNodeId2,
            targetNodeId: targetNodeId2,
            side: side2['side'],
            nodes: nodes5,
            edges: edges2,
            outMap: outMap4,
          })
        )
          continue;
        enabled19 = !![];
        break;
      }
      if (!enabled19) invalidNodeIds['push'](targetNodeId2);
    }
    graphStore['setConnOverlay']({
      srcId: side2['srcId'],
      invalidNodeIds: invalidNodeIds,
      side: side2['side'],
    });
  }
  function run5() {
    graphStore['clearConnOverlay']();
  }
  function run6(value111, el43) {
    const value112 = map6['get'](value111);
    (value112 !== undefined && (window['clearTimeout'](value112), map6['delete'](value111)),
      el43['classList']['remove']('is-exiting'));
  }
  function run7(value113, el44) {
    if (map6['has'](value113)) return;
    el44['classList']['add']('is-exiting');
    const value114 = window['setTimeout'](() => {
      map6['delete'](value113);
      if (map4['get'](value113) !== el44 || !el44['classList']['contains']('is-exiting'))
        return;
      (el44['remove'](), map4['delete'](value113), map5['delete'](value113));
    }, SIDE_PLUS_EXIT_REMOVAL_DELAY_MS);
    map6['set'](value113, value114);
  }
  function run8() {
    for (const value115 of map6['values']()) {
      window['clearTimeout'](value115);
    }
    map6['clear']();
    for (const el45 of map4['values']()) el45['remove']();
    (map4['clear'](),
      map5['clear'](),
      el42['classList']['remove']('is-selection-plus-visible'));
  }
  function run9(value116, nodeId, side4) {
    const value117 = map4['get'](value116);
    if (value117) return value117;
    const el46 = document['createElement']('button');
    return (
      (el46['type'] = 'button'),
      (el46['className'] = 'side-plus-btn'),
      (el46['textContent'] = ''),
      (el46['dataset']['plusKind'] = 'node'),
      el46['setAttribute']('aria-label', t('edgeController.addConnection')),
      el46['addEventListener']('pointerdown', (sx) => {
        if (sx['button'] === 0x1 || window['_spaceHeld']) return;
        if (sx['button'] !== 0x0) return;
        window['v2ClearTrackedViewportFocus']?.('side-plus-start');
        const srcId = map5['get'](value116);
        if (!srcId) return;
        const sourceNodeIds2 = sourceNodeIds(srcId['sourceNodeIds'], srcId['nodeId']),
          stateRaw4 = getStateRaw(),
          anchorWorldX =
            srcId['plusKind'] === 'multi'
              ? screenToWorld(srcId['ax'], srcId['ay'], stateRaw4['viewport'])
              : null;
        (sx['stopPropagation'](),
          sx['preventDefault'](),
          (side2 = {
            dragging: !![],
            srcId: srcId['nodeId'],
            sourceNodeIds: sourceNodeIds2,
            plusKind: srcId['plusKind'] === 'multi' ? 'multi' : 'node',
            side: srcId['side'],
            ax: srcId['ax'],
            ay: srcId['ay'],
            sx: sx['clientX'],
            sy: sx['clientY'],
            lastX: sx['clientX'],
            lastY: sx['clientY'],
            anchorWorldX: anchorWorldX?.['x'] ?? null,
            anchorWorldY: anchorWorldX?.['y'] ?? null,
            didAssistPan: ![],
            assistPanViewport: null,
          }),
          run4(),
          run8());
      }),
      el42['appendChild'](el46),
      map4['set'](value116, el46),
      map5['set'](value116, {
        nodeId: nodeId,
        side: side4,
        sourceNodeIds: nodeId ? [nodeId] : [],
        plusKind: 'node',
        ax: 0x0,
        ay: 0x0,
      }),
      el46
    );
  }
  function run10(
    value118,
    value119,
    value120,
    value121,
    value122,
    value123,
    value124,
    value125,
    enabled20,
    viewport4 = {},
  ) {
    const count16 = Number(viewport4?.['sizeMultiplier']),
      value126 = Number['isFinite'](count16) && count16 > 0x0 ? count16 : 0x1,
      value127 = 0x14 * value123 * value126,
      screenRadius2 = value127 / 0x2,
      value128 = holderUsesWorldCoordinates2 ? value127 / Math['max'](value123, Number['EPSILON']) : value127,
      cssRadius2 = value128 / 0x2,
      value129 = String(viewport4?.['key'] || value119 + ':' + value120),
      value130 = viewport4?.['plusKind'] === 'multi' ? 'multi' : 'node',
      value131 = sourceNodeIds(viewport4?.['sourceNodeIds'], value119),
      el47 = run9(value129, value119, value120);
    (run6(value129, el47),
      (el47['dataset']['plusKind'] = value130),
      (el47['dataset']['side'] = value120),
      el47['classList']['toggle']('side-plus-btn--multi', value130 === 'multi'));
    const el48 = value119 ? document['getElementById'](value119) : null,
      value132 =
        el48?.['style']?.['zIndex'] ||
        (el48 && typeof getComputedStyle === 'function' ? getComputedStyle(el48)['zIndex'] : '');
    ((el47['style']['zIndex'] = resolveSidePlusLayerZIndex(value132)),
      (el47['style']['width'] = value128 + 'px'),
      (el47['style']['height'] = value128 + 'px'),
      (el47['style']['fontSize'] = value128 + 'px'),
      (el47['style']['display'] = 'flex'),
      (el47['style']['alignItems'] = 'center'),
      (el47['style']['justifyContent'] = 'center'));
    let screenX2 = value121,
      screenY2 = value122,
      enabled21 = ![];
    if (value124 !== undefined && value125 !== undefined) {
      const value133 = value124 - value121,
        value134 = value125 - value122,
        value135 = Math['hypot'](value133, value134),
        value136 = 0x64 * value123;
      if (value135 < value136 && !enabled20) {
        const value137 = Math['min'](value135, 0x2d * value123),
          value138 = Math['atan2'](value134, value133);
        ((screenX2 += Math['cos'](value138) * value137),
          (screenY2 += Math['sin'](value138) * value137),
          (el47['style']['background'] = 'var(--white-10)'),
          (enabled21 = !![]));
      }
    }
    if (!enabled21) el47['style']['background'] = '';
    const box8 = resolveSidePlusButtonPosition({
      screenX: screenX2,
      screenY: screenY2,
      screenRadius: screenRadius2,
      cssRadius: cssRadius2,
      viewport: viewport4?.['viewport'] || getStateRaw()['viewport'],
      holderUsesWorldCoordinates: holderUsesWorldCoordinates2,
    });
    ((el47['style']['left'] = box8['left'] + 'px'),
      (el47['style']['top'] = box8['top'] + 'px'));
    const value139 = map5['get'](value129);
    (value139 &&
      ((value139['nodeId'] = value119),
      (value139['side'] = value120),
      (value139['sourceNodeIds'] = value131),
      (value139['plusKind'] = value130),
      (value139['ax'] = screenX2),
      (value139['ay'] = screenY2)),
      value118['add'](value129));
  }
  function run11(screenX3, screenY3, value140 = {}) {
    const interactionState = _getDragContext(),
      requestedSelectionOnly2 = value140 && typeof value140 === 'object' ? value140 : {},
      value141 = side2['dragging']
        ? { policy: 'allow', nodeId: '' }
        : _resolveSidePlusPointerContextAt(screenX3, screenY3, requestedSelectionOnly2['pointerTarget']),
      value142 = value141['policy'],
      list14 = ['settingsModal', 'aboutModal', 'historyModal'];
    if (
      list14['some']((value143) => {
        const el49 = document['getElementById'](value143);
        return el49 && el49['style']['display'] === 'flex';
      })
    ) {
      run8();
      return;
    }
    if (!side2['dragging'] && value142 === 'block') {
      run8();
      return;
    }
    const stateRaw5 = getStateRaw(),
      {
        nodes: nodes6,
        selectedNodeIds: selectedNodeIds,
        _nodeCount: _nodeCount,
        _nodesRev: _nodesRev,
        _nodeGeometryRev: _nodeGeometryRev,
        _persistRev: _persistRev,
      } = stateRaw5,
      viewport5 = getViewportPanPreview() || stateRaw5['viewport'];
    if ((Number['isFinite'](_nodeCount) ? _nodeCount : Object['keys'](nodes6)['length']) === 0x0) {
      run8();
      return;
    }
    const value144 =
        requestedSelectionOnly2['nodeSizeOverrides'] && typeof requestedSelectionOnly2['nodeSizeOverrides'] === 'object'
          ? requestedSelectionOnly2['nodeSizeOverrides']
          : null,
      geometryNodes = createSidePlusGeometryOverlay(nodes6, value144),
      value145 = geometryNodes !== nodes6,
      overrideNodeIds = value145 ? Object['keys'](geometryNodes) : [],
      value146 = value141['nodeId'] && geometryNodes[value141['nodeId']] ? value141['nodeId'] : null,
      selectedIds2 = Array['isArray'](selectedNodeIds) ? selectedNodeIds : [],
      selectedCount2 = new Set(selectedIds2),
      isPanning2 = readViewportInteractionState({ interactionState: interactionState }),
      sidePlusRenderState = resolveSidePlusRenderState({
        isDraggingPlus: side2['dragging'],
        isNodeDragging: !!interactionState['isDragging'],
        isBoxSelecting: !!interactionState['isBoxSelecting'],
        isConnecting: !!interactionState['isConnecting'],
        isPanning: isPanning2['isPanning'],
        isZooming: isPanning2['isZooming'],
        isViewportAnimating: isPanning2['isViewportAnimating'],
        isSpaceHeld: !!window['_spaceHeld'],
        selectedCount: selectedCount2['size'],
        requestedSelectionOnly: requestedSelectionOnly2['selectionOnly'] === !![] || value142 === 'selection-only',
      });
    el42['classList']['toggle'](
      'is-selection-plus-visible',
      sidePlusRenderState['selectionOnly'] && selectedCount2['size'] > 0x0,
    );
    if (sidePlusRenderState['shouldClear']) {
      run8();
      return;
    }
    const selectionOnly3 = sidePlusRenderState['selectionOnly'];
    let hoverNodeId2 = null,
      enabled22 = ![];
    if (selectionOnly3) ((hoverNodeId2 = null), (enabled22 = ![]));
    else {
      if (interactionState['isDragging'] && interactionState['targetNodeId'])
        ((hoverNodeId2 = interactionState['targetNodeId']), (enabled22 = !![]));
      else {
        if (value146) ((hoverNodeId2 = value146), (enabled22 = !![]));
        else {
          const spatialIndex3 = _getNodeSpatialIndex(
              nodes6,
              Number['isFinite'](_nodeGeometryRev) ? _nodeGeometryRev : _persistRev,
              _NODE_SPATIAL_INDEX_DEFAULT_KEY,
            ),
            closestNodeWithGeometryOverrides = findClosestNodeWithGeometryOverrides({
              screenX: screenX3,
              screenY: screenY3,
              nodes: nodes6,
              geometryNodes: geometryNodes,
              overrideNodeIds: overrideNodeIds,
              viewport: viewport5,
              spatialIndex: spatialIndex3,
              ignoreGroup: !![],
            });
          closestNodeWithGeometryOverrides && ((hoverNodeId2 = closestNodeWithGeometryOverrides['nodeId']), (enabled22 = closestNodeWithGeometryOverrides['isInside']));
        }
      }
    }
    const value147 = viewport5['zoom'] || 0x1,
      gap2 = 0x24,
      threshold3 = 0x46 * value147;
    let value148 = Number['isFinite'](screenX3) ? screenX3 : undefined,
      value149 = Number['isFinite'](screenY3) ? screenY3 : undefined;
    selectionOnly3 && ((value148 = undefined), (value149 = undefined));
    const isMultiSelection2 = selectedCount2['size'] >= 0x2,
      candidateIds3 = map7['get'](nodes6, Number['isFinite'](_nodesRev) ? _nodesRev : _persistRev),
      groupAnchorIds2 =
        !isMultiSelection2 && !selectionOnly3
          ? getGroupSidePlusAnchorCandidateIds({
              nodes: geometryNodes,
              candidateIds: candidateIds3,
              viewport: viewport5,
              mx: screenX3,
              my: screenY3,
              threshold: threshold3,
              gap: gap2,
            })
          : [],
      { candidateIds: candidateIds4, sideAnchorHoverIds: sideAnchorHoverIds2 } = resolveSidePlusCandidateIds({
        selectedIds: selectedIds2,
        isMultiSelection: isMultiSelection2,
        selectionOnly: selectionOnly3,
        hoverNodeId: hoverNodeId2,
        groupAnchorIds: groupAnchorIds2,
      }),
      map10 = new Set(),
      handler = shouldShowRightSidePlusForNodeType;
    for (const value150 of candidateIds4) {
      const x4 = geometryNodes[value150];
      if (!x4) continue;
      if (shouldUseInlineMediaClipAddSlot(x4['type'])) continue;
      const value151 =
          interactionState['isDragging'] && (selectedCount2['has'](value150) || interactionState['targetNodeId'] === value150),
        value152 = value151 && Number['isFinite'](interactionState['pendingDx']) ? interactionState['pendingDx'] : 0x0,
        value153 = value151 && Number['isFinite'](interactionState['pendingDy']) ? interactionState['pendingDy'] : 0x0,
        width3 = x4['width'] || (isNodeType(x4, 'group') ? 0x190 : 0x104),
        height3 = x4['height'] || (isNodeType(x4, 'group') ? 0x12c : 0x50),
        box9 = getNodeScreenRect(
          {
            x: x4['x'] + value152,
            y: x4['y'] + value153,
            width: width3,
            height: height3,
          },
          viewport5,
        ),
        value154 = box9['top'] + box9['height'] / 0x2,
        value155 = box9['left'] - gap2 * value147,
        value156 = box9['right'] + gap2 * value147,
        sideDistance2 = Math['hypot'](screenX3 - value155, screenY3 - value154),
        sideDistance3 = Math['hypot'](screenX3 - value156, screenY3 - value154),
        isHovered2 = value150 === hoverNodeId2 || sideAnchorHoverIds2['has'](value150),
        isSelected2 = selectedCount2['has'](value150),
        isInside2 = value150 === hoverNodeId2 ? enabled22 : ![],
        value157 = isInside2 || (interactionState['isDragging'] && value150 === interactionState['targetNodeId']),
        shouldShowSidePlusForNode2 = shouldShowSidePlusForNode({
          sideDistance: sideDistance2,
          threshold: threshold3,
          isSelected: isSelected2,
          isHovered: isHovered2,
          isInside: isInside2,
          nodeType: x4['type'],
        }),
        shouldShowSidePlusForNode3 = shouldShowSidePlusForNode({
          sideDistance: sideDistance3,
          threshold: threshold3,
          isSelected: isSelected2,
          isHovered: isHovered2,
          isInside: isInside2,
          nodeType: x4['type'],
        }),
        handler2 = (value158) =>
          value158 === 'ai-image' ||
          value158 === 'ai-text' ||
          value158 === 'ai-video' ||
          value158 === 'ai-audio' ||
          _isPanorama360TargetType(value158) ||
          value158 === 'whiteboard';
      (handler2(x4['type']) &&
        shouldShowSidePlusForNode2 &&
        run10(
          map10,
          value150,
          'left',
          value155,
          value154,
          value147,
          value148,
          value149,
          value157,
          { viewport: viewport5 },
        ),
        handler(x4['type']) &&
          shouldShowSidePlusForNode3 &&
          run10(
            map10,
            value150,
            'right',
            value156,
            value154,
            value147,
            value148,
            value149,
            value157,
            { viewport: viewport5 },
          ));
    }
    const sourceNodeIds3 = selectedIds2['filter']((value159) => {
      const enabled23 = geometryNodes[value159];
      return !!enabled23 && handler(enabled23['type']);
    });
    if (selectedIds2['length'] >= 0x2 && sourceNodeIds3['length'] > 0x0) {
      const value160 = interactionState['isDragging'] && selectedCount2['has'](interactionState['targetNodeId']),
        x5 = computeMultiSelectionBoundsForSidePlus(
          selectedIds2,
          geometryNodes,
          value160
            ? {
                movedNodeIds: selectedIds2,
                offsetX: Number['isFinite'](interactionState['pendingDx']) ? interactionState['pendingDx'] : 0x0,
                offsetY: Number['isFinite'](interactionState['pendingDy']) ? interactionState['pendingDy'] : 0x0,
              }
            : undefined,
        );
      if (x5) {
        const value161 = 0x12,
          box10 = getNodeScreenRect(
            {
              x: x5['minX'] - value161,
              y: x5['minY'] - value161,
              width: x5['maxX'] - x5['minX'] + value161 * 0x2,
              height: x5['maxY'] - x5['minY'] + value161 * 0x2,
            },
            viewport5,
          ),
          value162 = box10['right'] + gap2 * value147,
          value163 = box10['top'] + box10['height'] / 0x2,
          value164 =
            Number['isFinite'](screenX3) &&
            Number['isFinite'](screenY3) &&
            screenX3 >= box10['left'] &&
            screenX3 <= box10['right'] &&
            screenY3 >= box10['top'] &&
            screenY3 <= box10['bottom'];
        run10(
          map10,
          sourceNodeIds3[0x0],
          'right',
          value162,
          value163,
          value147,
          value148,
          value149,
          value164,
          {
            key: 'multi:right',
            plusKind: 'multi',
            sourceNodeIds: sourceNodeIds3,
            sizeMultiplier: 1.5,
            viewport: viewport5,
          },
        );
      }
    }
    for (const [value165, value166] of map4['entries']()) {
      if (map10['has'](value165)) continue;
      run7(value165, value166);
    }
  }
  const run12 = rafSampleLatest(run11);
  ((window['_v2UpdateSidePlus'] = run12), (window['_v2UpdateSidePlusNow'] = run11));
  function run13() {
    const box11 = store['commit'](SIDE_PLUS_ASSIST_PAN_PREVIEW_OWNER);
    side2['assistPanViewport'] = null;
    if (!box11) return null;
    window['_v2FlushMinimapViewportPreview']?.(box11);
    const run14 = () => {
      (graphStore['updateViewport'](box11['x'], box11['y'], box11['zoom']),
        graphStore['markViewportPersist']?.());
    };
    if (typeof graphStore['batch'] === 'function') graphStore['batch'](run14);
    else run14();
    return box11;
  }
  const run15 = rafSampleLatest((clientX, clientY) => {
    run16({ clientX: clientX, clientY: clientY }, !![]);
  });
  function run17() {
    const value167 = {
      ...side2,
      sourceNodeIds: sourceNodeIds(side2['sourceNodeIds'], side2['srcId']),
    };
    return (
      (side2['dragging'] = ![]),
      (side2['srcId'] = null),
      (side2['sourceNodeIds'] = []),
      (side2['plusKind'] = 'node'),
      (side2['anchorWorldX'] = null),
      (side2['anchorWorldY'] = null),
      (side2['didAssistPan'] = ![]),
      (side2['assistPanViewport'] = null),
      run5(),
      value167
    );
  }
  function run18() {
    if (!side2['dragging']) return ![];
    return (run15['cancel']?.(), run13(), run17(), _clearDraftEdgeDirectly(), !![]);
  }
  function run16(pointerTarget, enabled24 = ![]) {
    if (side2['dragging'] && !enabled24 && pointerTarget?.['buttons'] === 0x0) {
      run18();
      return;
    }
    if (side2['dragging'] && !enabled24) {
      run15(pointerTarget['clientX'], pointerTarget['clientY']);
      return;
    }
    if (side2['dragging']) {
      let {
        viewport: viewport6,
        nodes: nodes7,
        connOverlay: connOverlay,
        _persistRev: _persistRev2,
      } = getStateRaw();
      viewport6 = side2['assistPanViewport'] || viewport6;
      if (window['_spaceHeld'] === !![]) {
        const value168 = pointerTarget['clientX'] - side2['lastX'],
          value169 = pointerTarget['clientY'] - side2['lastY'];
        if (value168 || value169) {
          const enabled25 = !!side2['assistPanViewport'],
            box12 =
              side2['assistPanViewport'] ||
              store['acquire'](SIDE_PLUS_ASSIST_PAN_PREVIEW_OWNER, viewport6);
          box12 &&
            ((viewport6 = {
              x: (Number(box12['x']) || 0x0) + value168,
              y: (Number(box12['y']) || 0x0) + value169,
              zoom: Number(box12['zoom']) || 0x1,
            }),
            (side2['assistPanViewport'] = viewport6),
            store['update'](SIDE_PLUS_ASSIST_PAN_PREVIEW_OWNER, viewport6),
            (side2['didAssistPan'] = !![]),
            !enabled25 && window['_v2ScheduleMinimapViewportPreview']?.(box12, { force: !![] }),
            window['_v2ScheduleMinimapViewportPreview']?.(viewport6));
        }
      }
      ((side2['lastX'] = pointerTarget['clientX']), (side2['lastY'] = pointerTarget['clientY']));
      const map11 = new Set(connOverlay?.['invalidNodeIds'] || []),
        value170 = sourceNodeIds(side2['sourceNodeIds'], side2['srcId']),
        map12 = new Set(value170),
        box13 = nodes7[side2['srcId']];
      let value171 = 0x0,
        value172 = 0x0;
      if (side2['plusKind'] === 'multi') {
        if (Number['isFinite'](side2['anchorWorldX']) && Number['isFinite'](side2['anchorWorldY']))
          ((value171 = side2['anchorWorldX']), (value172 = side2['anchorWorldY']));
        else {
          const box14 = screenToWorld(side2['ax'], side2['ay'], viewport6);
          ((value171 = box14['x']), (value172 = box14['y']));
        }
      } else
        box13 &&
          ((value171 =
            side2['side'] === 'right' ? box13['x'] + (box13['width'] || 0x0) : box13['x']),
          (value172 = box13['y'] + (box13['height'] || 0x0) / 0x2));
      const { x: x6, y: y2 } = screenToWorld(
        pointerTarget['clientX'],
        pointerTarget['clientY'],
        viewport6,
      );
      _renderDraftEdgeDirectly(value171, value172, x6, y2, side2['side'], viewport6);
      const _getNodeSpatialIndex2 = _getNodeSpatialIndex(nodes7, _persistRev2, _NODE_SPATIAL_INDEX_EDGE_HOVER_KEY),
        queryNodeSpatialIndexAtWorldPoint2 = queryNodeSpatialIndexAtWorldPoint(_getNodeSpatialIndex2, x6, y2);
      let hoverId2 = null;
      for (const value173 of queryNodeSpatialIndexAtWorldPoint2) {
        const enabled26 = nodes7[value173];
        if (!enabled26) continue;
        if (map12['has'](value173)) continue;
        if (map11['has'](value173)) continue;
        const box15 = _resolveEdgeHoverNodeRect(enabled26);
        if (!box15) continue;
        if (
          isPointInRect(
            x6,
            y2,
            box15['x'],
            box15['y'],
            box15['width'],
            box15['height'],
          )
        ) {
          hoverId2 = value173;
          break;
        }
      }
      (connOverlay?.['hoverId'] || null) !== hoverId2 &&
        graphStore['setConnOverlay']({ hoverId: hoverId2, side: side2['side'] });
    } else
      run12(pointerTarget['clientX'], pointerTarget['clientY'], { pointerTarget: pointerTarget['target'] || null });
  }
  window['addEventListener']('pointermove', run16);
  function run19(clientX2) {
    if (!side2['dragging']) return;
    (run15['cancel']?.(),
      run16({ clientX: clientX2['clientX'], clientY: clientX2['clientY'] }, !![]),
      run13());
    const {
        srcId: srcId2,
        sourceNodeIds: sourceNodeIds4,
        plusKind: plusKind,
        side: side5,
        sx: sx2,
        sy: sy,
        didAssistPan: didAssistPan,
      } = run17(),
      map13 = new Set(sourceNodeIds4),
      handler3 = () => {
        (_clearDraftEdgeDirectly(), graphStore['clearConnOverlay']());
      };
    if (
      !didAssistPan &&
      Math['abs'](clientX2['clientX'] - sx2) < 0x5 &&
      Math['abs'](clientX2['clientY'] - sy) < 0x5
    )
      return handler3();
    const {
        viewport: viewport7,
        nodes: nodes8,
        edges: edges3,
        _persistRev: _persistRev3,
        _edgesRev: _edgesRev2,
      } = getStateRaw(),
      spatialIndex4 = _getNodeSpatialIndex(nodes8, _persistRev3, _NODE_SPATIAL_INDEX_DEFAULT_KEY);
    let targetId3 = hitTestNode(
      clientX2['clientX'],
      clientX2['clientY'],
      nodes8,
      viewport7,
      srcId2,
      ![],
      { spatialIndex: spatialIndex4 },
    );
    if (targetId3 && map13['has'](targetId3)) targetId3 = null;
    if (targetId3) {
      handler3();
      if (plusKind === 'multi') {
        if (side5 !== 'right') return;
        let enabled27 = ![];
        for (const sourceId3 of sourceNodeIds4) {
          if (!sourceId3 || sourceId3 === targetId3) continue;
          const stateRaw6 = getStateRaw(),
            enabled28 = stateRaw6['nodes']?.[sourceId3],
            enabled29 = stateRaw6['nodes']?.[targetId3];
          if (!enabled28 || !enabled29) continue;
          if (!isValidConnection(enabled28, enabled29)) continue;
          const addEdgeWithPolicies3 = addEdgeWithPolicies({ sourceId: sourceId3, targetId: targetId3 });
          if (!addEdgeWithPolicies3) continue;
          ((enabled27 = !![]), run3(sourceId3, targetId3, enabled28, enabled29, side5));
        }
        if (!enabled27) return;
        return;
      }
      const sourceId4 = side5 === 'right' ? srcId2 : targetId3,
        targetId4 = side5 === 'right' ? targetId3 : srcId2,
        srcData = nodes8[sourceId4],
        tgtData = nodes8[targetId4],
        map14 = _getOutEdgeMap(edges3, _edgesRev2),
        incomingEdges = _getIncomingEdgesByTarget(edges3, _edgesRev2, targetId4),
        value174 = !!map14['get'](sourceId4)?.['has'](targetId4);
      if (!isValidConnection(srcData, tgtData) || value174) return;
      const value175 = String(srcData?.['type'] || '')['trim']() === 'group';
      if (value175) {
        const addEdgeWithPolicies4 = addEdgeWithPolicies({ sourceId: sourceId4, targetId: targetId4 });
        if (!addEdgeWithPolicies4) return;
        run3(sourceId4, targetId4, srcData, tgtData, side5);
        return;
      }
      if (_isAnimeRealTarget(tgtData)) {
        if (!_isAnimeRealImageSrc(srcData)) return;
        for (const value176 of incomingEdges) graphStore['removeEdge'](value176['id']);
        tgtData['rhAnimeRealRefUrl'] &&
          graphStore['updateNodeData'](targetId4, {
            rhAnimeRealRefUrl: '',
            rhAnimeRealRefLocalPath: '',
            rhAnimeRealRefFileName: '',
          });
      }
      const response2 = _applyRhPersonReplaceV3FixedInputs({
        srcData: srcData,
        tgtData: tgtData,
        incomingEdges: incomingEdges,
        nodes: nodes8,
        targetId: targetId4,
      });
      if (!response2['ok']) return;
      const addEdgeWithPolicies5 = addEdgeWithPolicies({ sourceId: sourceId4, targetId: targetId4 });
      if (!addEdgeWithPolicies5) return;
      run3(sourceId4, targetId4, srcData, tgtData, side5);
      return;
    }
    if (side5 === 'left') {
      _showLeftQuoteMenu(clientX2['clientX'], clientX2['clientY'], srcId2, viewport7, handler3);
      return;
    }
    if (side5 !== 'right') {
      handler3();
      return;
    }
    if (plusKind === 'multi') {
      const sourceIds = sourceNodeIds4['filter']((value177) => !!nodes8[value177]);
      if (sourceIds['length'] === 0x0) {
        handler3();
        return;
      }
      _showQuoteMenu(clientX2['clientX'], clientX2['clientY'], sourceIds[0x0], viewport7, handler3, {
        sourceIds: sourceIds,
      });
      return;
    }
    const enabled30 = nodes8[srcId2];
    if (!enabled30) {
      handler3();
      return;
    }
    _showQuoteMenu(clientX2['clientX'], clientX2['clientY'], srcId2, viewport7, handler3);
  }
  (window['addEventListener']('pointerup', run19, { capture: !![] }),
    window['addEventListener']('pointercancel', run18, { capture: !![] }),
    window['addEventListener']('blur', run18));
}
const _RH_ANIME_REAL_MODEL = ANIME_REAL_MODEL_ID,
  _isAnimeRealTarget = (enabled31) =>
    !!enabled31 &&
    enabled31['type'] === 'ai-image' &&
    String(enabled31['model'] || '') === _RH_ANIME_REAL_MODEL,
  _isAnimeRealImageSrc = (value178) => {
    const value179 = String(value178?.['type'] || '');
    return value179 === 'source-image' || value179 === 'image' || value179 === 'ai-image';
  },
  _isRhPersonReplaceV3Target = (enabled32) =>
    !!enabled32 && enabled32['type'] === 'ai-image' && isRhPersonReplaceWorkflowModel(enabled32['model']),
  _getRhV54RefKind = (value180) => {
    return resolveEffectiveInputKind(value180) || 'image';
  },
  _getAiAudioWorkflowKey = (enabled33) => {
    if (!enabled33 || String(enabled33['type'] || '') !== 'ai-audio') return '';
    const value181 = String(enabled33['audioWorkflowKey'] || '')['trim']();
    if (value181) return value181;
    const value182 = String(enabled33['model'] || '')['trim']();
    return value182;
  },
  _getManifestFixedInputConfig = (args2) => {
    const value183 = String(args2?.['type'] || '')['trim']();
    if (value183 === 'ai-audio') {
      const audioWorkflowKey = _getAiAudioWorkflowKey(args2);
      return getFixedInputSlotConfigFromManifest({
        ...args2,
        audioWorkflowKey: audioWorkflowKey,
        model: audioWorkflowKey,
      });
    }
    return getFixedInputSlotConfigFromManifest(args2);
  },
  _edgeTimeKey = (value184) => {
    const value185 = Number(value184?.['createdAt']);
    if (Number['isFinite'](value185)) return value185;
    const value186 = String(value184?.['id'] || ''),
      list15 = value186['match'](/(\d{10,})/g);
    if (list15 && list15['length']) return Number(list15[list15['length'] - 0x1]) || 0x0;
    return 0x0;
  };
function _finishManifestFixedInputResult(value187, value188, value189) {
  const refSlot = String(value189 || '')['trim']();
  if (!refSlot) return { ok: !![], refSlot: '' };
  const list16 = getExclusiveSlotsForFixedSlot(value187?.['exclusiveGroups'], refSlot);
  if (list16['length'] > 0x1) {
    const map15 = new Set(list16);
    for (const value190 of Array['isArray'](value188) ? value188 : []) {
      const value191 = String(value190?.['refSlot'] || '')['trim']();
      value190?.['id'] &&
        value191 !== refSlot &&
        map15['has'](value191) &&
        graphStore['removeEdge'](value190['id']);
    }
  }
  return { ok: !![], refSlot: refSlot };
}
function _canUseManifestFixedInputOverflow({
  config: config2,
  srcKind: srcKind,
  tgtData: tgtData2,
  incomingEdges: incomingEdges2,
  nodes: nodes9,
}) {
  const enabled34 = String(srcKind || '')['trim']();
  if (!enabled34 || enabled34 === 'text') return ![];
  const map16 = new Set(config2?.['visibleSlots'] || []),
    value192 = (config2?.['slotOrderByType']?.[enabled34] || [])['filter']((value193) =>
      map16['has'](value193),
    )['length'],
    targetInputPolicy2 = getTargetInputPolicy(tgtData2),
    value194 = Number(targetInputPolicy2?.['maxByKind']?.[enabled34]);
  if (!Number['isFinite'](value194) || value194 <= value192) return ![];
  const value195 = (Array['isArray'](incomingEdges2) ? incomingEdges2 : [])['filter'](
    (value196) => _getRhV54RefKind(nodes9?.[value196?.['sourceId']]) === enabled34,
  )['length'];
  return value195 < value194;
}
function _allowsManifestFixedInputOverflow({ config: config3, srcKind: srcKind2, tgtData: tgtData3 }) {
  const enabled35 = String(srcKind2 || '')['trim']();
  if (!enabled35 || enabled35 === 'text') return ![];
  const map17 = new Set(config3?.['visibleSlots'] || []),
    value197 = (config3?.['slotOrderByType']?.[enabled35] || [])['filter']((value198) =>
      map17['has'](value198),
    )['length'],
    targetInputPolicy3 = getTargetInputPolicy(tgtData3),
    value199 = Number(targetInputPolicy3?.['maxByKind']?.[enabled35]);
  return Number['isFinite'](value199) && value199 > value197;
}
function _cycleManifestFixedInputWhenFull({
  config: config4,
  srcKind: srcKind3,
  tgtData: tgtData4,
  incomingEdges: incomingEdges3,
  nodes: nodes10,
  slotOrder: slotOrder,
  resolvedSlotByEdgeId: resolvedSlotByEdgeId = null,
}) {
  const enabled36 = String(srcKind3 || '')['trim']();
  if (!enabled36 || enabled36 === 'text') return null;
  if (config4?.['manifest']?.['inputSlots']?.['cycleFixedInputWhenFull'] !== !![]) return null;
  const targetInputPolicy4 = getTargetInputPolicy(tgtData4),
    count17 = Number(targetInputPolicy4?.['maxByKind']?.[enabled36]);
  if (!Number['isFinite'](count17) || count17 <= 0x0) return null;
  const map18 = new Set(config4?.['visibleSlots'] || []),
    value200 = (config4?.['slotOrderByType']?.[enabled36] || [])['filter']((value201) =>
      map18['has'](value201),
    )['length'],
    list17 = (Array['isArray'](incomingEdges3) ? incomingEdges3 : [])
      ['filter']((value202) => _getRhV54RefKind(nodes10?.[value202?.['sourceId']]) === enabled36)
      ['sort']((value203, value204) => _edgeTimeKey(value203) - _edgeTimeKey(value204));
  if (list17['length'] < count17) return null;
  const enabled37 = list17[0x0];
  if (!enabled37?.['id']) return null;
  const value205 = String(resolvedSlotByEdgeId?.['get'](enabled37['id']) || enabled37['refSlot'] || '');
  graphStore['removeEdge'](enabled37['id']);
  const refSlot2 =
    count17 <= value200 && Array['isArray'](slotOrder) && slotOrder['includes'](value205)
      ? value205
      : '';
  return { ok: !![], refSlot: refSlot2 };
}
function _applyRhPersonReplaceV3FixedInputs({
  srcData: srcData2,
  tgtData: tgtData5,
  incomingEdges: incomingEdges4,
  nodes: nodes11,
  targetId: targetId5,
}) {
  if (!_isRhPersonReplaceV3Target(tgtData5)) return { ok: !![], refSlot: '' };
  if (!_isAnimeRealImageSrc(srcData2)) return { ok: ![], refSlot: '' };
  const list18 = ['replaceTarget', 'replacedImage'],
    list19 = Array['isArray'](incomingEdges4) ? incomingEdges4 : [],
    list20 = list19['filter']((value206) => {
      const value207 = nodes11?.[value206['sourceId']];
      return _isAnimeRealImageSrc(value207);
    }),
    map19 = new Set(
      list20['map']((value208) => String(value208['refSlot'] || ''))['filter']((value209) =>
        list18['includes'](value209),
      ),
    ),
    refSlot3 = list18['find']((value210) => !map19['has'](value210)) || '';
  if (refSlot3) return { ok: !![], refSlot: refSlot3 };
  let enabled38 = null;
  for (const value211 of list20) {
    if (list18['includes'](String(value211['refSlot'] || ''))) {
      if (!enabled38 || _edgeTimeKey(value211) < _edgeTimeKey(enabled38)) enabled38 = value211;
    }
  }
  if (!enabled38)
    for (const value212 of list20) {
      if (!enabled38 || _edgeTimeKey(value212) < _edgeTimeKey(enabled38)) enabled38 = value212;
    }
  if (enabled38) graphStore['removeEdge'](enabled38['id']);
  const refSlot4 =
    enabled38 && list18['includes'](String(enabled38['refSlot'] || ''))
      ? String(enabled38['refSlot'])
      : list18[0x0];
  return { ok: !![], refSlot: refSlot4 };
}
function _applyManifestFixedInputs({
  srcData: srcData3,
  tgtData: tgtData6,
  incomingEdges: incomingEdges5,
  nodes: nodes12,
  targetId: targetId6,
  preferredRefSlot: preferredRefSlot,
}) {
  const value213 = String(tgtData6?.['type'] || '')['trim']();
  if (value213 !== 'ai-video' && value213 !== 'ai-audio' && value213 !== 'ai-image')
    return { ok: !![], refSlot: '' };
  if (value213 === 'ai-image' && _isRhPersonReplaceV3Target(tgtData6)) return { ok: !![], refSlot: '' };
  const config5 = _getManifestFixedInputConfig(tgtData6);
  if (!config5) return { ok: !![], refSlot: '' };
  const srcKind4 = _getRhV54RefKind(srcData3);
  if (srcKind4 === 'text') return { ok: !![], refSlot: '' };
  const map20 = new Set(config5['visibleSlots'] || []),
    list21 = config5['slotOrderByType']?.[srcKind4] || [],
    list22 = list21['filter'](
      (value214) =>
        map20['has'](value214) && fixedInputSlotAcceptsSource(config5, value214, srcData3),
    ),
    value215 = list21['filter'](
      (value216) =>
        !map20['has'](value216) && fixedInputSlotAcceptsSource(config5, value216, srcData3),
    ),
    slotOrder2 = list22['length'] > 0x0 ? list22 : value215;
  if (slotOrder2['length'] === 0x0) {
    if (
      _canUseManifestFixedInputOverflow({
        config: config5,
        srcKind: srcKind4,
        tgtData: tgtData6,
        incomingEdges: incomingEdges5,
        nodes: nodes12,
      })
    )
      return { ok: !![], refSlot: '' };
    return { ok: ![], refSlot: '' };
  }
  const value217 = slotOrder2['includes'](String(preferredRefSlot || '')) ? String(preferredRefSlot || '') : '',
    incomingEdges6 = Array['isArray'](incomingEdges5) ? incomingEdges5 : [],
    value218 = incomingEdges6['filter']((value219) => {
      const value220 = nodes12?.[value219['sourceId']];
      return _getRhV54RefKind(value220) === srcKind4;
    }),
    _allowsManifestFixedInputOverflow2 = _allowsManifestFixedInputOverflow({
      config: config5,
      srcKind: srcKind4,
      tgtData: tgtData6,
    }),
    resolvedSlotByEdgeId2 = new Map(),
    occupiedSlots = new Set(),
    list23 = [];
  for (const refSlot5 of value218) {
    const fixedInputSlotForRef = resolveFixedInputSlotForRef({
        fixedInputConfig: config5,
        refSlot: refSlot5?.['refSlot'],
        kind: srcKind4,
        occupiedSlots: occupiedSlots,
        sourceNode: nodes12?.[refSlot5['sourceId']],
      }),
      value221 = String(fixedInputSlotForRef['slot'] || '');
    if (value221 && slotOrder2['includes'](value221)) {
      (resolvedSlotByEdgeId2['set'](refSlot5['id'], value221),
        occupiedSlots['add'](value221),
        list23['push'](refSlot5));
      continue;
    }
    if (
      _allowsManifestFixedInputOverflow2 &&
      (fixedInputSlotForRef['reason'] === 'occupied' ||
        fixedInputSlotForRef['reason'] === 'overflow' ||
        !String(refSlot5?.['refSlot'] || '')['trim']())
    )
      continue;
    graphStore['removeEdge'](refSlot5['id']);
  }
  const run20 = (value222) =>
      String(resolvedSlotByEdgeId2['get'](value222?.['id']) || value222?.['refSlot'] || ''),
    map21 = new Set(
      list23['map']((value223) => run20(value223))['filter']((value224) =>
        slotOrder2['includes'](value224),
      ),
    ),
    value225 = slotOrder2['find']((value226) => !map21['has'](value226)) || '';
  if (value217 && !map21['has'](value217))
    return _finishManifestFixedInputResult(config5, incomingEdges6, value217);
  if (value225) return _finishManifestFixedInputResult(config5, incomingEdges6, value225);
  if (
    _canUseManifestFixedInputOverflow({
      config: config5,
      srcKind: srcKind4,
      tgtData: tgtData6,
      incomingEdges: incomingEdges6,
      nodes: nodes12,
    })
  )
    return { ok: !![], refSlot: '' };
  const _cycleManifestFixedInputWhenFull2 = _cycleManifestFixedInputWhenFull({
    config: config5,
    srcKind: srcKind4,
    tgtData: tgtData6,
    incomingEdges: incomingEdges6,
    nodes: nodes12,
    slotOrder: slotOrder2,
    resolvedSlotByEdgeId: resolvedSlotByEdgeId2,
  });
  if (_cycleManifestFixedInputWhenFull2) return _finishManifestFixedInputResult(config5, incomingEdges6, _cycleManifestFixedInputWhenFull2['refSlot']);
  if (slotOrder2['length'] === 0x1)
    return (
      list23['forEach']((value227) => graphStore['removeEdge'](value227['id'])),
      _finishManifestFixedInputResult(config5, incomingEdges6, slotOrder2[0x0])
    );
  if (value217) {
    const value228 = list23['find']((value229) => run20(value229) === value217);
    if (value228) graphStore['removeEdge'](value228['id']);
    return _finishManifestFixedInputResult(config5, incomingEdges6, value217);
  }
  const value230 = list23['reduce'](
      (value231, value232) =>
        !_edgeTimeKey(value231) || _edgeTimeKey(value232) > _edgeTimeKey(value231) ? value232 : value231,
      null,
    ),
    value233 = run20(value230),
    count18 = slotOrder2['indexOf'](value233),
    value234 = count18 >= 0x0 ? slotOrder2[(count18 + 0x1) % slotOrder2['length']] : slotOrder2[0x0];
  let enabled39 = null;
  for (const value235 of list23) {
    if (run20(value235) !== value234) continue;
    if (!enabled39 || _edgeTimeKey(value235) < _edgeTimeKey(enabled39)) enabled39 = value235;
  }
  if (!enabled39)
    for (const value236 of list23) {
      if (!enabled39 || _edgeTimeKey(value236) < _edgeTimeKey(enabled39)) enabled39 = value236;
    }
  if (enabled39) graphStore['removeEdge'](enabled39['id']);
  const value237 =
    enabled39 && slotOrder2['includes'](run20(enabled39)) ? run20(enabled39) : value234;
  return _finishManifestFixedInputResult(config5, incomingEdges6, value237);
}
function _isDreaminaVideoTarget(enabled40) {
  return (
    !!enabled40 &&
    String(enabled40['type'] || '') === 'ai-video' &&
    isDreaminaStyleVideoModel(enabled40['model'], enabled40['provider'])
  );
}
function _applyDreaminaVideoFixedInputs({
  srcData: srcData4,
  tgtData: tgtData7,
  incomingEdges: incomingEdges7,
  nodes: nodes13,
  targetId: targetId7,
}) {
  if (!_isDreaminaVideoTarget(tgtData7)) return { ok: !![], refSlot: '' };
  const dreaminaVideoRouteMode = normalizeDreaminaVideoRouteMode(tgtData7?.['dreaminaRouteMode'], tgtData7?.['mode']),
    _getRhV54RefKind2 = _getRhV54RefKind(srcData4),
    list24 = Array['isArray'](incomingEdges7) ? incomingEdges7 : [];
  if (dreaminaVideoRouteMode === 'frames2video') {
    if (_getRhV54RefKind2 !== 'image') return { ok: ![], refSlot: '' };
    for (const value238 of list24) {
      const value239 = nodes13?.[value238['sourceId']];
      _getRhV54RefKind(value239) !== 'image' && graphStore['removeEdge'](value238['id']);
    }
    const list25 = list24['filter'](
      (value240) => _getRhV54RefKind(nodes13?.[value240['sourceId']]) === 'image',
    )['sort']((value241, value242) => _edgeTimeKey(value241) - _edgeTimeKey(value242));
    while (list25['length'] >= 0x2) {
      const value243 = list25['shift']();
      if (value243?.['id']) graphStore['removeEdge'](value243['id']);
    }
    return { ok: !![], refSlot: '' };
  }
  if (dreaminaVideoRouteMode === 'multiframe2video') {
    if (_getRhV54RefKind2 !== 'image') return { ok: ![], refSlot: '' };
    const list26 = list24['filter'](
      (value244) => _getRhV54RefKind(nodes13?.[value244['sourceId']]) === 'image',
    )['sort']((value245, value246) => _edgeTimeKey(value245) - _edgeTimeKey(value246));
    while (list26['length'] >= 0x14) {
      const value247 = list26['shift']();
      if (value247?.['id']) graphStore['removeEdge'](value247['id']);
    }
    return { ok: !![], refSlot: '' };
  }
  if (!['image', 'video', 'audio', 'text']['includes'](_getRhV54RefKind2)) return { ok: ![], refSlot: '' };
  if (_getRhV54RefKind2 === 'text') return { ok: !![], refSlot: '' };
  const targetInputPolicy5 = getTargetInputPolicy(tgtData7),
    count19 = Number(targetInputPolicy5?.['maxByKind']?.[_getRhV54RefKind2]);
  if (!Number['isFinite'](count19) || count19 <= 0x0) return { ok: ![], refSlot: '' };
  const list27 = list24['filter'](
    (value248) => _getRhV54RefKind(nodes13?.[value248['sourceId']]) === _getRhV54RefKind2,
  )['sort']((value249, value250) => _edgeTimeKey(value249) - _edgeTimeKey(value250));
  while (list27['length'] >= count19) {
    const value251 = list27['shift']();
    if (value251?.['id']) graphStore['removeEdge'](value251['id']);
  }
  return { ok: !![], refSlot: '' };
}
function _applyGenericInputKindLimit({
  srcData: srcData5,
  tgtData: tgtData8,
  incomingEdges: incomingEdges8,
  nodes: nodes14,
  sourceId: sourceId5,
}) {
  if (!_isModelPolicyTargetType(tgtData8?.['type'])) return { ok: !![] };
  if (_getManifestFixedInputConfig(tgtData8)) return { ok: !![] };
  if (_isDreaminaVideoTarget(tgtData8)) return { ok: !![] };
  const effectiveInputKind2 = resolveEffectiveInputKind(srcData5);
  if (!effectiveInputKind2 || effectiveInputKind2 === 'text') return { ok: !![] };
  const targetInputPolicy6 = getTargetInputPolicy(tgtData8);
  if (!isInputKindAllowed(targetInputPolicy6, effectiveInputKind2)) return { ok: ![] };
  const count20 = Number(targetInputPolicy6?.['maxByKind']?.[effectiveInputKind2]);
  if (!Number['isFinite'](count20)) return { ok: !![] };
  if (count20 <= 0x0) return { ok: ![] };
  const value252 = (Array['isArray'](incomingEdges8) ? incomingEdges8 : [])['some'](
    (value253) => value253?.['sourceId'] === sourceId5,
  );
  if (value252) return { ok: !![] };
  const list28 = (Array['isArray'](incomingEdges8) ? incomingEdges8 : [])
    ['filter']((value254) => _getRhV54RefKind(nodes14?.[value254?.['sourceId']]) === effectiveInputKind2)
    ['sort']((value255, value256) => _edgeTimeKey(value255) - _edgeTimeKey(value256));
  while (list28['length'] >= count20) {
    const value257 = list28['shift']();
    if (value257?.['id']) graphStore['removeEdge'](value257['id']);
  }
  return { ok: !![] };
}
function _applyMediaClipInputLimit({ srcData: srcData6, tgtData: tgtData9 }) {
  if (!isMediaClipNodeType(tgtData9?.['type'])) return { ok: !![] };
  const mediaClipInputKind = getMediaClipInputKind(srcData6);
  if (mediaClipInputKind !== 'video' && mediaClipInputKind !== 'image' && mediaClipInputKind !== 'audio') return { ok: ![] };
  if (!isSupportedMediaClipInput(srcData6)) return { ok: ![] };
  return { ok: !![] };
}
function _replacePanorama360IncomingEdges({ tgtData: tgtData10, incomingEdges: incomingEdges9 }) {
  if (!_isPanorama360TargetType(tgtData10?.['type'])) return;
  const value258 = Array['isArray'](incomingEdges9) ? incomingEdges9 : [];
  for (const value259 of value258) {
    if (value259?.['id']) graphStore['removeEdge'](value259['id']);
  }
}
function _replaceWhiteboardIncomingEdges({ tgtData: tgtData11, incomingEdges: incomingEdges10 }) {
  if (String(tgtData11?.['type'] || '')['trim']() !== 'whiteboard') return;
  const value260 = Array['isArray'](incomingEdges10) ? incomingEdges10 : [];
  for (const value261 of value260) {
    if (value261?.['id']) graphStore['removeEdge'](value261['id']);
  }
}
export function addEdgeWithPolicies({
  sourceId: sourceId6,
  targetId: targetId8,
  preferredRefSlot: preferredRefSlot2,
}) {
  const edges4 = getStateRaw(),
    nodes15 = edges4['nodes'] || {},
    srcData7 = nodes15[sourceId6],
    tgtData12 = nodes15[targetId8];
  if (!srcData7 || !tgtData12) return ![];
  if (!isValidConnection(srcData7, tgtData12)) return ![];
  const value262 = String(srcData7['type'] || '')['trim']() === 'group';
  if (value262) {
    if (
      String(tgtData12['type'] || '')['trim']() === 'group' &&
      wouldCreateGroupOutputCycle({
        sourceId: sourceId6,
        targetId: targetId8,
        nodes: nodes15,
        edges: edges4['edges'] || {},
      })
    )
      return ![];
    const stateRaw7 = getStateRaw(),
      value263 = !!_getOutEdgeMap(stateRaw7['edges'], stateRaw7['_edgesRev'])
        ['get'](sourceId6)
        ?.['has'](targetId8);
    if (value263) return ![];
    return (
      graphStore['addEdge']({
        id: 'edge-' + Date['now']() + '-' + Math['random']()['toString'](0x24)['slice'](0x2, 0x6),
        sourceId: sourceId6,
        targetId: targetId8,
        isGroupOutputLink: !![],
        createdAt: Date['now'](),
      }),
      !![]
    );
  }
  const incomingEdges11 = _getIncomingEdgesByTarget(edges4['edges'], edges4['_edgesRev'], targetId8);
  (_replacePanorama360IncomingEdges({ tgtData: tgtData12, incomingEdges: incomingEdges11 }),
    _replaceWhiteboardIncomingEdges({ tgtData: tgtData12, incomingEdges: incomingEdges11 }));
  if (_isAnimeRealTarget(tgtData12)) {
    if (!_isAnimeRealImageSrc(srcData7)) return ![];
    for (const value264 of incomingEdges11) graphStore['removeEdge'](value264['id']);
    tgtData12['rhAnimeRealRefUrl'] &&
      graphStore['updateNodeData'](targetId8, {
        rhAnimeRealRefUrl: '',
        rhAnimeRealRefLocalPath: '',
        rhAnimeRealRefFileName: '',
      });
  }
  const response3 = _applyRhPersonReplaceV3FixedInputs({
    srcData: srcData7,
    tgtData: tgtData12,
    incomingEdges: incomingEdges11,
    nodes: nodes15,
    targetId: targetId8,
  });
  if (!response3['ok']) return ![];
  const response4 = _applyManifestFixedInputs({
    srcData: srcData7,
    tgtData: tgtData12,
    incomingEdges: incomingEdges11,
    nodes: nodes15,
    targetId: targetId8,
    preferredRefSlot: preferredRefSlot2,
  });
  if (!response4['ok']) return ![];
  const response5 = _applyDreaminaVideoFixedInputs({
    srcData: srcData7,
    tgtData: tgtData12,
    incomingEdges: incomingEdges11,
    nodes: nodes15,
    targetId: targetId8,
  });
  if (!response5['ok']) return ![];
  const response6 = _applyMediaClipInputLimit({
    srcData: srcData7,
    tgtData: tgtData12,
    incomingEdges: incomingEdges11,
    nodes: nodes15,
    sourceId: sourceId6,
  });
  if (!response6['ok']) return ![];
  const response7 = _applyGenericInputKindLimit({
    srcData: srcData7,
    tgtData: tgtData12,
    incomingEdges: incomingEdges11,
    nodes: nodes15,
    sourceId: sourceId6,
  });
  if (!response7['ok']) return ![];
  const targetNode = getStateRaw(),
    value265 = !!_getOutEdgeMap(targetNode['edges'], targetNode['_edgesRev'])
      ['get'](sourceId6)
      ?.['has'](targetId8);
  if (value265) return ![];
  let sourceMediaKey = '',
    sourceMediaW = 0x0,
    sourceMediaH = 0x0;
  if (String(srcData7['type'] || '')['includes']('video')) {
    const list29 = Array['isArray'](srcData7['videos']) ? srcData7['videos'] : [],
      value266 = Number(srcData7['mainVideoIndex']),
      value267 = Number['isFinite'](value266) ? Math['max'](0x0, Math['trunc'](value266)) : 0x0,
      value268 = list29[value267] || null,
      value269 = list29['find'](
        (value270) => _videoSourceKey(value270) && !_isUnavailableVideoRecord(value270),
      ),
      value271 = value268 && !_isUnavailableVideoRecord(value268) ? value268 : value269,
      value272 =
        String(value271?.['localPath'] || '')['trim']() ||
        String(value271?.['displayLocalPath'] || '')['trim']() ||
        String(value271?.['originalLocalPath'] || '')['trim']() ||
        String(value271?.['videoLocalPath'] || '')['trim']() ||
        String(value271?.['videoUrl'] || '')['trim']() ||
        (!_isUnavailableVideoRecord(srcData7)
          ? String(srcData7['localPath'] || '')['trim']() ||
            String(srcData7['displayLocalPath'] || '')['trim']() ||
            String(srcData7['originalLocalPath'] || '')['trim']() ||
            String(srcData7['videoLocalPath'] || '')['trim']() ||
            String(srcData7['videoUrl'] || '')['trim']() ||
            String(srcData7['src'] || '')['trim']() ||
            String(srcData7['url'] || '')['trim']() ||
            String(srcData7['resultUrl'] || '')['trim']() ||
            String(srcData7['sourceUrl'] || '')['trim']()
          : '');
    if (value272) sourceMediaKey = value272;
    const count21 = Number(value268?.['videoWidth'] || 0x0),
      count22 = Number(value268?.['videoHeight'] || 0x0),
      count23 = Number(srcData7['selectedVideoWidth'] || 0x0),
      count24 = Number(srcData7['selectedVideoHeight'] || 0x0),
      count25 = Number(srcData7['videoWidth'] || 0x0),
      count26 = Number(srcData7['videoHeight'] || 0x0);
    if (count21 > 0x0 && count22 > 0x0) ((sourceMediaW = count21), (sourceMediaH = count22));
    else {
      if (count23 > 0x0 && count24 > 0x0) ((sourceMediaW = count23), (sourceMediaH = count24));
      else count25 > 0x0 && count26 > 0x0 && ((sourceMediaW = count25), (sourceMediaH = count26));
    }
    if (!(sourceMediaW > 0x0 && sourceMediaH > 0x0 && sourceMediaKey))
      try {
        const displayedVideoMetaFromNode = getDisplayedVideoMetaFromNode(sourceId6),
          value273 = String(displayedVideoMetaFromNode?.['src'] || '')['trim'](),
          count27 = Number(displayedVideoMetaFromNode?.['w'] || 0x0),
          count28 = Number(displayedVideoMetaFromNode?.['h'] || 0x0);
        count27 > 0x0 && count28 > 0x0 && ((sourceMediaW = count27), (sourceMediaH = count28));
        if (value273)
          try {
            const uRL = new URL(value273, window['location']['origin']),
              value274 = String(uRL['pathname'] || '');
            if (value274['startsWith']('/output/')) sourceMediaKey = value274['replace'](/^\/+/, '');
            else {
              if (value274['startsWith']('/data/')) sourceMediaKey = value274['replace'](/^\/+/, '');
              else {
                if (value274['startsWith']('/')) sourceMediaKey = value274['replace'](/^\/+/, '');
              }
            }
          } catch {
            if (value273['startsWith']('/')) sourceMediaKey = value273['replace'](/^\/+/, '');
          }
      } catch {}
  }
  const refSlot6 = response3['refSlot'] || response4['refSlot'] || response5['refSlot'] || '';
  (removeCoveredAssetInputRefForConnection({
    targetId: targetId8,
    targetNode: targetNode['nodes']?.[targetId8] || tgtData12,
    sourceNode: srcData7,
    sourceKind: resolveEffectiveInputKind(srcData7),
    refSlot: refSlot6,
    incomingEdges: _getIncomingEdgesByTarget(targetNode['edges'], targetNode['_edgesRev'], targetId8),
    nodes: targetNode['nodes'] || nodes15,
  }),
    graphStore['addEdge']({
      id: 'edge-' + Date['now']() + '-' + Math['random']()['toString'](0x24)['slice'](0x2, 0x6),
      sourceId: sourceId6,
      targetId: targetId8,
      ...(refSlot6 ? { refSlot: refSlot6 } : null),
      ...(sourceMediaKey ? { sourceMediaKey: sourceMediaKey } : null),
      ...(sourceMediaW > 0x0 && sourceMediaH > 0x0 ? { sourceMediaW: sourceMediaW, sourceMediaH: sourceMediaH } : null),
      createdAt: Date['now'](),
    }));
  try {
    const _getManifestFixedInputConfig2 = _getManifestFixedInputConfig(tgtData12),
      value275 =
        String(tgtData12?.['type'] || '') === 'ai-video' &&
        (_getManifestFixedInputConfig2?.['slotOrderByType']?.['video'] || [])['includes']('sourceVideo');
    if (value275 && sourceMediaW > 0x0 && sourceMediaH > 0x0) {
      const enabled41 =
          (Array['isArray'](tgtData12['videos']) && tgtData12['videos']['length'] > 0x0) ||
          String(tgtData12['videoUrl'] || '')['trim']() ||
          String(tgtData12['localPath'] || '')['trim']() ||
          String(tgtData12['thumbId'] || '')['trim'](),
        value276 = String(tgtData12['aspectRatio'] || '自适应');
      if (!enabled41 && value276 === '自适应') {
        const stateRaw8 = getStateRaw(),
          box16 = stateRaw8['nodes']?.[targetId8];
        if (box16) {
          const count29 = sourceMediaW / sourceMediaH;
          if (Number['isFinite'](count29) && count29 > 0x0) {
            const box17 = getAIGenerationNodeSize(sourceMediaW, sourceMediaH),
              width4 = box17['width'],
              height4 = box17['height'],
              x7 = Number(box16['x'] || 0x0) + Number(box16['width'] || 0x0) / 0x2,
              y3 = Number(box16['y'] || 0x0) + Number(box16['height'] || 0x0) / 0x2;
            graphStore['updateNodeData'](targetId8, {
              width: width4,
              height: height4,
              x: x7 - width4 / 0x2,
              y: y3 - height4 / 0x2,
            });
          }
        }
      }
    }
  } catch {}
  return !![];
}
export function initPickConnect(el50) {
  function run21(value277, value278, value279, value280, value281) {
    const map22 = _getOutEdgeMap(value280, value281),
      value282 = value279[value277],
      list30 = [],
      value283 = value278 === 'left',
      value284 = value278 === 'left' && _isAnimeRealTarget(value282),
      value285 = value278 === 'left' && _isRhPersonReplaceV3Target(value282),
      value286 = value278 === 'left' ? _getManifestFixedInputConfig(value282) : null,
      map23 = new Set(value286?.['visibleSlots'] || []);
    for (const [value287, value288] of Object['entries'](value279)) {
      if (value287 === value277) continue;
      const enabled42 = String(value288?.['type'] || '')['trim']() === 'group';
      if (value284) {
        if (!enabled42 && !_isAnimeRealImageSrc(value288)) {
          list30['push'](value287);
          continue;
        }
      }
      if (value285) {
        if (!enabled42 && !_isAnimeRealImageSrc(value288)) {
          list30['push'](value287);
          continue;
        }
      }
      if (value286 && !enabled42) {
        const _getRhV54RefKind3 = _getRhV54RefKind(value288),
          list31 = (value286['slotOrderByType']?.[_getRhV54RefKind3] || [])['filter']((value289) =>
            map23['has'](value289),
          );
        if (_getRhV54RefKind3 !== 'text' && list31['length'] === 0x0) {
          list30['push'](value287);
          continue;
        }
      }
      const value290 = value283 ? value288 : value282,
        value291 = value283 ? value282 : value288,
        value292 = !!(
          value290?.['id'] &&
          value291?.['id'] &&
          map22['get'](value290['id'])?.['has'](value291['id'])
        );
      (!isValidConnection(value290, value291) || value292) && list30['push'](value287);
    }
    return list30;
  }
  function run22(sourceId7, targetId9) {
    const { pickConnectMode: pickConnectMode } = getStateRaw(),
      preferredRefSlot3 = String(pickConnectMode?.['preferredRefSlot'] || '')['trim'](),
      addEdgeWithPolicies6 = addEdgeWithPolicies({
        sourceId: sourceId7,
        targetId: targetId9,
        preferredRefSlot: preferredRefSlot3,
      });
    if (!addEdgeWithPolicies6) return ![];
    const {
      pickConnectMode: pickConnectMode2,
      nodes: nodes16,
      edges: edges5,
      _edgesRev: _edgesRev3,
    } = getStateRaw();
    if (pickConnectMode2 && pickConnectMode2['active']) {
      const invalidNodeIds2 = run21(
        pickConnectMode2['sourceNodeId'],
        pickConnectMode2['handleDirection'],
        nodes16,
        edges5,
        _edgesRev3,
      );
      graphStore['setConnOverlay']({ srcId: pickConnectMode2['sourceNodeId'], invalidNodeIds: invalidNodeIds2 });
    }
    return !![];
  }
  (el50['addEventListener'](
    'contextmenu',
    (event2) => {
      const { pickConnectMode: pickConnectMode3 } = getStateRaw();
      if (!pickConnectMode3 || !pickConnectMode3['active']) return;
      (event2['preventDefault']?.(),
        event2['stopPropagation']?.(),
        event2['stopImmediatePropagation']?.(),
        (event2['_pickConnectHandled'] = !![]),
        uiStore['setPickConnectMode']({ active: ![] }));
    },
    !![],
  ),
    el50['addEventListener'](
      'click',
      (event3) => {
        const { pickConnectMode: pickConnectMode4 } = getStateRaw();
        if (!pickConnectMode4 || !pickConnectMode4['active']) return;
        const el51 = event3['target']['closest']('.prompt-attachment-btn');
        if (el51) {
          const value293 = el51['closest']('.v2-node');
          if (value293 && value293['id'] === pickConnectMode4['sourceNodeId']) {
            ((event3['_pickConnectHandled'] = !![]),
              event3['stopImmediatePropagation'](),
              uiStore['setPickConnectMode']({ active: ![] }));
            return;
          }
        }
        const stateRaw9 = getStateRaw(),
          value294 = event3['target']['closest']('.v2-node');
        let hitTestNode3 = value294?.['id'] || '';
        if (!hitTestNode3) {
          const spatialIndex5 = _getNodeSpatialIndex(
            stateRaw9['nodes'],
            stateRaw9['_persistRev'],
            _NODE_SPATIAL_INDEX_DEFAULT_KEY,
          );
          hitTestNode3 = hitTestNode(
            event3['clientX'],
            event3['clientY'],
            stateRaw9['nodes'],
            stateRaw9['viewport'],
            pickConnectMode4['sourceNodeId'],
            ![],
            { spatialIndex: spatialIndex5 },
          );
        }
        if (!hitTestNode3 || hitTestNode3 === pickConnectMode4['sourceNodeId']) return;
        const enabled43 = stateRaw9['nodes'][hitTestNode3];
        if (!enabled43) return;
        const value295 = pickConnectMode4['handleDirection'] === 'left',
          value296 = value295 ? enabled43['id'] : pickConnectMode4['sourceNodeId'],
          value297 = value295 ? pickConnectMode4['sourceNodeId'] : enabled43['id'],
          value298 = stateRaw9['nodes'][value296],
          value299 = stateRaw9['nodes'][value297];
        if (!isValidConnection(value298, value299)) return;
        run22(value296, value297) &&
          ((event3['_pickConnectHandled'] = !![]), event3['stopImmediatePropagation']());
      },
      !![],
    ),
    el50['addEventListener']('pointermove', (event4) => {
      const {
        pickConnectMode: pickConnectMode5,
        nodes: nodes17,
        viewport: viewport8,
        connOverlay: connOverlay2,
        _persistRev: _persistRev4,
      } = getStateRaw();
      if (!pickConnectMode5 || !pickConnectMode5['active']) return;
      const spatialIndex6 = _getNodeSpatialIndex(nodes17, _persistRev4, _NODE_SPATIAL_INDEX_DEFAULT_KEY);
      let hitTestNode4 = hitTestNode(
        event4['clientX'],
        event4['clientY'],
        nodes17,
        viewport8,
        pickConnectMode5['sourceNodeId'],
        ![],
        { spatialIndex: spatialIndex6 },
      );
      (hitTestNode4 &&
        connOverlay2 &&
        connOverlay2['invalidNodeIds'] &&
        connOverlay2['invalidNodeIds']['includes'](hitTestNode4) &&
        (hitTestNode4 = null),
        pickConnectMode5['hoverNodeId'] !== hitTestNode4 && uiStore['setPickConnectHover'](hitTestNode4));
    }));
  const value300 = (event5) => {
    event5['target']['closest']('[contenteditable="true"]') && event5['target']['blur']();
  };
  function run23(value301) {
    document?.['body']?.['classList']?.['toggle']?.('pick-connect-active', value301 === !![]);
  }
  let enabled44 = ![],
    value302 = null,
    value303 = null;
  uiStore['subscribeSelector'](
    (sourceNodeId3) => ({
      active: !!sourceNodeId3['pickConnectMode']?.['active'],
      sourceNodeId: sourceNodeId3['pickConnectMode']?.['sourceNodeId'] || null,
      handleDirection: sourceNodeId3['pickConnectMode']?.['handleDirection'] || null,
    }),
    ({ active: active, sourceNodeId: sourceNodeId4, handleDirection: handleDirection }) => {
      run23(active);
      if (active) {
        (el50['classList']['add']('is-connecting'),
          document['addEventListener']('focusin', value300, !![]));
        const size = getCursorSize(),
          linkCursor = createLinkCursor({ size: size });
        (document['documentElement']['classList']['add']('is-connecting-mode'),
          document['documentElement']['style']['setProperty']('--connect-cursor', linkCursor));
        if (!enabled44 || value302 !== sourceNodeId4 || value303 !== handleDirection) {
          ((enabled44 = !![]), (value302 = sourceNodeId4), (value303 = handleDirection));
          const { nodes: nodes18, edges: edges6, _edgesRev: _edgesRev4 } = getStateRaw(),
            invalidNodeIds3 = run21(sourceNodeId4, handleDirection, nodes18, edges6, _edgesRev4);
          graphStore['setConnOverlay']({ srcId: sourceNodeId4, invalidNodeIds: invalidNodeIds3 });
        }
      } else
        (el50['classList']['remove']('is-connecting'),
          document['removeEventListener']('focusin', value300, !![]),
          document['documentElement']['classList']['remove']('is-connecting-mode'),
          document['documentElement']['style']['removeProperty']('--connect-cursor'),
          enabled44 &&
            ((enabled44 = ![]),
            (value302 = null),
            graphStore['setSelectionBox']({ active: ![] }),
            uiStore['setPickConnectHover'](null),
            graphStore['clearConnOverlay']()));
    },
  );
}
function _createSidePlusCreationMenu(value304) {
  const el52 = document['createElement']('div');
  el52['className'] = 'v2-quote-menu\x20v2-node-menu-section\x20v2-node-menu-compact';
  const el53 = document['createElement']('div');
  el53['className'] = 'v2-menu-section';
  const el54 = document['createElement']('span');
  ((el54['className'] = 'v2-menu-title'), (el54['textContent'] = value304));
  const value305 = document['createElement']('div');
  return (
    (value305['className'] = 'v2-menu-rule'),
    el53['appendChild'](el54),
    el53['appendChild'](value305),
    el52['appendChild'](el53),
    el52
  );
}
function _showQuoteMenu(value306, value307, value308, value309, value310, value311 = {}) {
  document['querySelector']('.v2-quote-menu')?.['remove']();
  const { nodes: nodes19 } = getStateRaw(),
    handler4 = (value312, value313 = null) => {
      const list32 = [],
        map24 = new Set(),
        value314 = Array['isArray'](value312) ? value312 : [];
      for (const value315 of value314) {
        const enabled45 = String(value315 || '')['trim']();
        if (!enabled45 || map24['has'](enabled45)) continue;
        (map24['add'](enabled45), list32['push'](enabled45));
      }
      const value316 = String(value313 || '')['trim']();
      if (list32['length'] === 0x0 && value316) list32['push'](value316);
      return list32;
    },
    sourceId8 = handler4(value311?.['sourceIds'], value308)['filter'](
      (value317) => !!nodes19[value317],
    ),
    value318 = sourceId8['includes'](value308) ? value308 : sourceId8[0x0],
    box18 = value318 ? nodes19[value318] : null;
  if (!box18) {
    value310?.();
    return;
  }
  const value319 = sourceId8['map']((value320) => nodes19[value320])['filter'](Boolean),
    handler5 = (value321, value322) => {
      const displayedMediaSizeFromNode2 = getDisplayedMediaSizeFromNode(value321, value322),
        count30 = Number(displayedMediaSizeFromNode2?.['w'] || 0x0),
        count31 = Number(displayedMediaSizeFromNode2?.['h'] || 0x0),
        count32 = count30 > 0x0 && count31 > 0x0 ? count30 / count31 : 0x0;
      return Number['isFinite'](count32) && count32 > 0x0 ? count32 : 0x0;
    },
    handler6 = (value323, x8, y4, value324) => {
      const count33 = Number(value324);
      if (!(Number['isFinite'](count33) && count33 > 0x0)) return ![];
      const box19 = getAIGenerationNodeSize(
          count33 >= 0x1 ? count33 : 0x1,
          count33 >= 0x1 ? 0x1 : 0x1 / count33,
        ),
        width5 = box19['width'],
        height5 = box19['height'],
        stateRaw10 = getStateRaw(),
        enabled46 = stateRaw10['nodes']?.[value323];
      if (!enabled46) return ![];
      return (
        graphStore['updateNodeData'](value323, {
          width: width5,
          height: height5,
          x: x8 - width5 / 0x2,
          y: y4 - height5 / 0x2,
        }),
        commit(),
        !![]
      );
    },
    handler7 = (value325, value326) => {
      const stateRaw11 = getStateRaw(),
        value327 = stateRaw11['nodes'] || {},
        enabled47 = value327[value325],
        box20 = value327[value326];
      if (!enabled47 || !box20) return;
      if (String(enabled47['type'] || '') !== 'ai-video') return;
      if (String(box20['type'] || '') !== 'ai-video') return;
      const value328 = Number(box20['width'] || 0x0),
        value329 = Number(box20['height'] || 0x0);
      if (!(value328 === _AI_VIDEO_DEFAULT_SIZE['width'] && value329 === _AI_VIDEO_DEFAULT_SIZE['height']))
        return;
      const value330 =
        (Array['isArray'](box20['videos']) && box20['videos']['length'] > 0x0) ||
        String(box20['videoUrl'] || '')['trim']() ||
        String(box20['localPath'] || '')['trim']() ||
        String(box20['thumbId'] || '')['trim']();
      if (value330) return;
      const value331 = Number(box20['x'] || 0x0) + value328 / 0x2,
        value332 = Number(box20['y'] || 0x0) + value329 / 0x2,
        count34 = Date['now'](),
        value333 = () => {
          const displayedMediaSizeFromNode3 = getDisplayedMediaSizeFromNode(value325, 'video'),
            value334 = Number(displayedMediaSizeFromNode3?.['w'] || 0x0),
            value335 = Number(displayedMediaSizeFromNode3?.['h'] || 0x0);
          let count35 = value334,
            count36 = value335;
          if (!(count35 > 0x0 && count36 > 0x0)) {
            const stateRaw12 = getStateRaw(),
              value336 = stateRaw12['nodes']?.[value325];
            if (value336) {
              const value337 = Number(value336['mainVideoIndex']),
                value338 = Number['isFinite'](value337) ? Math['max'](0x0, Math['trunc'](value337)) : 0x0,
                value339 = Array['isArray'](value336['videos']) ? value336['videos'] : [],
                value340 = value339[value338],
                count37 = Number(value340?.['videoWidth'] || 0x0),
                count38 = Number(value340?.['videoHeight'] || 0x0),
                count39 = Number(value336['selectedVideoWidth'] || 0x0),
                count40 = Number(value336['selectedVideoHeight'] || 0x0),
                count41 = Number(value336['videoWidth'] || 0x0),
                count42 = Number(value336['videoHeight'] || 0x0);
              if (count37 > 0x0 && count38 > 0x0) ((count35 = count37), (count36 = count38));
              else {
                if (count39 > 0x0 && count40 > 0x0) ((count35 = count39), (count36 = count40));
                else count41 > 0x0 && count42 > 0x0 && ((count35 = count41), (count36 = count42));
              }
            }
          }
          if (count35 > 0x0 && count36 > 0x0) {
            handler6(value326, value331, value332, count35 / count36);
            return;
          }
          if (Date['now']() - count34 < 0x4b0) requestAnimationFrame(value333);
        };
      requestAnimationFrame(value333);
    },
    x9 = screenToWorld(value306, value307, value309),
    el55 = _createSidePlusCreationMenu(t('edgeController.quoteMenuTitle')),
    value341 = 'var(--white-50)',
    iconBg = 'var(--white-05)',
    list33 = [
      {
        iconEl: _iconAiText(value341),
        iconBg: iconBg,
        label: '文本',
        desc: '文案、脚本、提示词',
        type: 'ai-text',
        w: _AI_TEXT_DEFAULT_SIZE['width'],
        h: _AI_TEXT_DEFAULT_SIZE['height'],
      },
      {
        iconEl: _iconAiImage(value341),
        iconBg: iconBg,
        label: '图像',
        desc: '图片、海报、角色素材',
        type: 'ai-image',
        w: _AI_IMAGE_DEFAULT_SIZE['width'],
        h: _AI_IMAGE_DEFAULT_SIZE['height'],
      },
      {
        iconEl: _iconAiVideo(value341),
        iconBg: iconBg,
        label: '视频',
        desc: '短片、转场、动态镜头',
        type: 'ai-video',
        w: _AI_VIDEO_DEFAULT_SIZE['width'],
        h: _AI_VIDEO_DEFAULT_SIZE['height'],
      },
      {
        iconEl: _iconAiAudio(value341),
        iconBg: iconBg,
        label: '音频',
        desc: '配音、音效、音乐',
        type: 'ai-audio',
        w: _AI_AUDIO_DEFAULT_SIZE['width'],
        h: _AI_AUDIO_DEFAULT_SIZE['height'],
      },
      {
        iconEl: _iconStoryboardScript(value341),
        iconBg: iconBg,
        label: '分镜脚本',
        desc: '镜头表、提示词、节奏',
        type: 'storyboard-script',
        w: STORYBOARD_SCRIPT_DEFAULT_SIZE['width'],
        h: STORYBOARD_SCRIPT_DEFAULT_SIZE['height'],
        badge: 'BETA',
      },
      {
        iconEl: _iconAiImage(value341),
        iconBg: iconBg,
        label: '360全景图',
        desc: '全景画面与空间关系',
        type: 'panorama-360',
        w: PANORAMA_SCENE_DEFAULT_SIZE['width'],
        h: PANORAMA_SCENE_DEFAULT_SIZE['height'],
      },
      {
        iconEl: _iconWhiteboard(value341),
        iconBg: iconBg,
        label: '白板',
        desc: '画图、标注、文字说明',
        type: 'whiteboard',
        w: WHITEBOARD_DEFAULT_SIZE['width'],
        h: WHITEBOARD_DEFAULT_SIZE['height'],
      },
    ]['map'](_applyNodeCreationMenuMeta),
    map25 = new Set(getAllowedGenerationNodeTypesForQuoteMenu(value319)),
    list34 = list33['filter']((value342) => map25['has'](value342['type']));
  (list34['forEach']((type2) => {
    const el56 = document['createElement']('button');
    el56['className'] = 'v2-menu-row' + (type2['desc'] ? '\x20has-desc' : '');
    const el57 = document['createElement']('div');
    ((el57['className'] = 'v2-menu-ico'), el57['replaceChildren']());
    if (type2['iconEl']) el57['appendChild'](type2['iconEl']['cloneNode'](!![]));
    if (type2['iconBg']) el57['style']['background'] = type2['iconBg'];
    const el58 = document['createElement']('div');
    el58['className'] = 'v2-menu-txt-wrap';
    const el59 = document['createElement']('span');
    ((el59['className'] = 'v2-menu-lbl'), (el59['textContent'] = type2['label']));
    if (type2['badge']) {
      const el60 = document['createElement']('span');
      ((el60['textContent'] = type2['badge']),
        (el60['className'] = 'v2-badge-beta'),
        el59['appendChild'](el60));
    }
    el58['appendChild'](el59);
    if (type2['desc']) {
      const el61 = document['createElement']('span');
      ((el61['className'] = 'v2-menu-sub'),
        (el61['textContent'] = type2['desc']),
        el58['appendChild'](el61));
    }
    (el56['appendChild'](el57),
      el56['appendChild'](el58),
      el56['addEventListener']('click', (event6) => {
        event6['stopPropagation']();
        const id = generateId(type2['type']);
        let width6 = type2['w'],
          height6 = type2['h'];
        if (
          (type2['type'] === 'ai-image' || type2['type'] === 'ai-video') &&
          ((box18['width'] && box18['height']) ||
            (box18['videoWidth'] && box18['videoHeight']))
        ) {
          let count43 = 0x0;
          if (type2['type'] === 'ai-video' && String(box18['type'] || '') !== 'ai-video') {
            const value343 = Number(box18['mainVideoIndex']) || 0x0,
              value344 = Math['max'](0x0, Math['trunc'](value343)),
              list35 = Array['isArray'](box18['videos']) ? box18['videos'] : [],
              value345 = String(box18['localPath'] || '')['trim'](),
              value346 = String(box18['videoUrl'] || '')['trim'](),
              count44 = Number(box18['selectedVideoWidth'] || 0x0),
              count45 = Number(box18['selectedVideoHeight'] || 0x0);
            let value347 = value344;
            if (list35['length']) {
              let count46 = -0x1;
              value345 &&
                (count46 = list35['findIndex'](
                  (value348) => String(value348?.['localPath'] || '')['trim']() === value345,
                ));
              count46 < 0x0 &&
                value346 &&
                (count46 = list35['findIndex'](
                  (value349) => String(value349?.['videoUrl'] || '')['trim']() === value346,
                ));
              if (count46 >= 0x0) value347 = count46;
              else {
                if (value344 >= list35['length']) value347 = 0x0;
              }
            } else value347 = 0x0;
            const box21 = list35[value347] || list35[0x0] || null,
              count47 = box21 ? Number(box21['videoWidth'] || box21['width'] || 0x0) : 0x0,
              count48 = box21 ? Number(box21['videoHeight'] || box21['height'] || 0x0) : 0x0;
            count43 =
              (count44 > 0x0 && count45 > 0x0 ? count44 / count45 : 0x0) ||
              handler5(value318, 'video') ||
              (count47 > 0x0 && count48 > 0x0 ? count47 / count48 : 0x0) ||
              (box18['videoWidth'] && box18['videoHeight']
                ? box18['videoWidth'] / box18['videoHeight']
                : 0x0) ||
              (box18['width'] && box18['height'] ? box18['width'] / box18['height'] : 0x0);
          } else
            count43 =
              handler5(value318, 'image') ||
              (box18['width'] && box18['height'] ? box18['width'] / box18['height'] : 0x0);
          if (!(Number['isFinite'](count43) && count43 > 0x0)) count43 = 0x1;
          const box22 = getAIGenerationNodeSize(
            count43 >= 0x1 ? count43 : 0x1,
            count43 >= 0x1 ? 0x1 : 0x1 / count43,
          );
          ((width6 = box22['width']), (height6 = box22['height']));
        }
        let id2 = {
          id: id,
          type: type2['type'],
          x: x9['x'] - width6 / 0x2,
          y: x9['y'] - height6 / 0x2,
          width: width6,
          height: height6,
          name: type2['defaultName'] || type2['label'],
        };
        (type2['type'] === 'ai-image' || type2['type'] === 'ai-video') &&
          !Object['prototype']['hasOwnProperty']['call'](id2, 'aspectRatio') &&
          (id2['aspectRatio'] = '自适应');
        if (box18['type'] === type2['type']) {
          const box23 = { ...box18 };
          (delete box23['id'],
            delete box23['x'],
            delete box23['y'],
            delete box23['width'],
            delete box23['height'],
            delete box23['name'],
            delete box23['prompt'],
            delete box23['outputText'],
            stripImageGenerationResultStateForDerivedNode(box23),
            delete box23['batchSize'],
            (id2 = { ...box23, ...id2 }));
        }
        _isPanorama360TargetType(id2['type']) &&
          (id2 = createPanorama360NodeData({
            id: id2['id'],
            x: id2['x'],
            y: id2['y'],
            width: id2['width'],
            height: id2['height'],
            name: id2['name'],
          }));
        id2['type'] === 'storyboard-script' &&
          (id2 = createStoryboardScriptNodeData({
            id: id2['id'],
            x: id2['x'],
            y: id2['y'],
            width: id2['width'],
            height: id2['height'],
            name: id2['name'],
          }));
        id2['type'] === 'whiteboard' &&
          (id2 = createWhiteboardNodeData({
            id: id2['id'],
            x: id2['x'],
            y: id2['y'],
            width: id2['width'],
            height: id2['height'],
            name: id2['name'],
          }));
        graphStore['addNode'](id2);
        let enabled48 = ![],
          enabled49 = '';
        for (const sourceId9 of sourceId8) {
          const stateRaw13 = getStateRaw(),
            enabled50 = stateRaw13['nodes']?.[sourceId9],
            enabled51 = stateRaw13['nodes']?.[id];
          if (!enabled50 || !enabled51) continue;
          if (!isValidConnection(enabled50, enabled51)) continue;
          const addEdgeWithPolicies7 = addEdgeWithPolicies({ sourceId: sourceId9, targetId: id });
          if (!addEdgeWithPolicies7) continue;
          enabled48 = !![];
          if (!enabled49) enabled49 = sourceId9;
        }
        if (!enabled48 && sourceId8['length'] === 0x1) {
          const id3 = generateId('edge');
          (graphStore['addEdge']({
            id: id3,
            sourceId: sourceId8[0x0],
            targetId: id,
            createdAt: Date['now'](),
          }),
            (enabled48 = !![]),
            (enabled49 = sourceId8[0x0]));
        }
        (graphStore['setSelectedNodes']([id]),
          commit(),
          type2['type'] === 'ai-video' && enabled49 && handler7(enabled49, id),
          value350?.(),
          el55['remove'](),
          value310?.());
      }),
      el55['appendChild'](el56));
  }),
    document['body']['appendChild'](el55));
  const run24 = () => {
    const stateRaw14 = getStateRaw()['viewport'] || value309,
      box24 = worldToScreen(x9['x'], x9['y'], stateRaw14);
    ((el55['style']['left'] = box24['x'] + 'px'),
      (el55['style']['top'] = box24['y'] + 'px'));
  };
  run24();
  const value350 = graphStore['subscribeSelector'](
      (value351) => value351['viewport'],
      () => run24(),
    ),
    value352 = (event7) => {
      if (el55['contains'](event7['target'])) return;
      (value350?.(),
        el55['remove'](),
        document['removeEventListener']('mousedown', value352, !![]),
        value310?.());
    };
  requestAnimationFrame(() => document['addEventListener']('mousedown', value352, !![]));
}
function _showLeftQuoteMenu(value353, value354, targetId10, value355, value356) {
  document['querySelector']('.v2-quote-menu')?.['remove']();
  const { nodes: nodes20 } = getState(),
    args3 = nodes20[targetId10];
  if (!args3) {
    value356?.();
    return;
  }
  const x10 = screenToWorld(value353, value354, value355),
    el62 = _createSidePlusCreationMenu(t('edgeController.inputMenuTitle')),
    list36 = [
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
        w: _AI_TEXT_DEFAULT_SIZE['width'],
        h: _AI_TEXT_DEFAULT_SIZE['height'],
      },
      {
        iconEl: _iconAiImage('var(--white-50)'),
        iconBg: 'var(--white-05)',
        label: '图像',
        desc: '图片、海报、角色素材',
        type: 'ai-image',
        w: _AI_IMAGE_DEFAULT_SIZE['width'],
        h: _AI_IMAGE_DEFAULT_SIZE['height'],
      },
      {
        iconEl: _iconAiVideo('var(--white-50)'),
        iconBg: 'var(--white-05)',
        label: '视频',
        desc: '短片、转场、动态镜头',
        type: 'ai-video',
        w: _AI_VIDEO_DEFAULT_SIZE['width'],
        h: _AI_VIDEO_DEFAULT_SIZE['height'],
      },
      {
        iconEl: _iconAiAudio('var(--white-50)'),
        iconBg: 'var(--white-05)',
        label: '音频',
        desc: '配音、音效、音乐',
        type: 'ai-audio',
        w: _AI_AUDIO_DEFAULT_SIZE['width'],
        h: _AI_AUDIO_DEFAULT_SIZE['height'],
      },
    ]['map'](_applyNodeCreationMenuMeta),
    list37 = getAllowedInputNodeTypesForSidePlus(args3),
    list38 = list36['filter']((value357) => list37['includes'](value357['type']));
  (list38['forEach']((type3) => {
    const el63 = document['createElement']('button');
    el63['className'] = 'v2-menu-row' + (type3['desc'] ? ' has-desc' : '');
    const el64 = document['createElement']('div');
    ((el64['className'] = 'v2-menu-ico'), el64['replaceChildren']());
    if (type3['iconEl']) el64['appendChild'](type3['iconEl']['cloneNode'](!![]));
    if (type3['iconBg']) el64['style']['background'] = type3['iconBg'];
    const el65 = document['createElement']('div');
    el65['className'] = 'v2-menu-txt-wrap';
    const el66 = document['createElement']('span');
    ((el66['className'] = 'v2-menu-lbl'), (el66['textContent'] = type3['label']));
    if (type3['badge']) {
      const el67 = document['createElement']('span');
      ((el67['textContent'] = type3['badge']),
        (el67['className'] = 'v2-badge-beta'),
        el66['appendChild'](el67));
    }
    el65['appendChild'](el66);
    if (type3['desc']) {
      const el68 = document['createElement']('span');
      ((el68['className'] = 'v2-menu-sub'),
        (el68['textContent'] = type3['desc']),
        el65['appendChild'](el68));
    }
    (el63['appendChild'](el64),
      el63['appendChild'](el65),
      el63['addEventListener']('click', (event8) => {
        event8['stopPropagation']();
        const id4 = generateId(type3['type']);
        let id5 = {
          id: id4,
          type: type3['type'],
          x: x10['x'] - 0x96,
          y: x10['y'],
          width: type3['width'] ?? type3['w'],
          height: type3['height'] ?? type3['h'],
          name: type3['defaultName'] || type3['label'],
        };
        (type3['type'] === 'ai-image' || type3['type'] === 'ai-video') &&
          !Object['prototype']['hasOwnProperty']['call'](id5, 'aspectRatio') &&
          (id5['aspectRatio'] = '自适应');
        if (args3['type'] === type3['type']) {
          const box25 = { ...args3 };
          (delete box25['id'],
            delete box25['x'],
            delete box25['y'],
            delete box25['width'],
            delete box25['height'],
            delete box25['name'],
            delete box25['prompt'],
            delete box25['outputText'],
            stripImageGenerationResultStateForDerivedNode(box25),
            delete box25['batchSize'],
            (id5 = { ...box25, ...id5 }));
        }
        if (id5['type'] === 'source-image' || id5['type'] === 'source-video')
          id5 = buildSourceMediaNodePayload(id5);
        else
          _isPanorama360TargetType(id5['type']) &&
            (id5 = createPanorama360NodeData({
              id: id5['id'],
              x: id5['x'],
              y: id5['y'],
              width: id5['width'],
              height: id5['height'],
            }));
        graphStore['addNode'](id5);
        const addEdgeWithPolicies8 = addEdgeWithPolicies({ sourceId: id4, targetId: targetId10 });
        if (!addEdgeWithPolicies8) {
          const id6 = generateId('edge');
          graphStore['addEdge']({
            id: id6,
            sourceId: id4,
            targetId: targetId10,
            createdAt: Date['now'](),
          });
        }
        (graphStore['setSelectedNodes']([id4]),
          commit(),
          value358?.(),
          el62['remove'](),
          value356?.());
      }),
      el62['appendChild'](el63));
  }),
    document['body']['appendChild'](el62));
  const run25 = () => {
    const stateRaw15 = getStateRaw()['viewport'] || value355,
      box26 = worldToScreen(x10['x'], x10['y'], stateRaw15);
    ((el62['style']['left'] = box26['x'] + 'px'),
      (el62['style']['top'] = box26['y'] + 'px'));
  };
  run25();
  const value358 = graphStore['subscribeSelector'](
      (value359) => value359['viewport'],
      () => run25(),
    ),
    value360 = (event9) => {
      if (el62['contains'](event9['target'])) return;
      (value358?.(),
        el62['remove'](),
        document['removeEventListener']('mousedown', value360, !![]),
        value356?.());
    };
  requestAnimationFrame(() => document['addEventListener']('mousedown', value360, !![]));
}
