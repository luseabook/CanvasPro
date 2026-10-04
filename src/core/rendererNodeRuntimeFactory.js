import { getNodeClass, isNodeType } from '../modules/registry.js';
import { getNodeWrapperExtraClasses, hasNodeTypeBetaBadge, normalizeNodeType } from '../modules/nodeMeta.js';
import { syncNodeMediaMetricsDataset } from '../modules/nodeMediaMetrics.js';
import { withRendererDeferredMountHints } from './rendererDeferredMedia.js';
import {
  formatRendererNodeLabelText,
  getRendererDefaultNodeLabel,
  getRendererGroupColorWithOpacity,
  getRendererNodeLabelKind,
  getRendererNodeZIndex,
  setRendererNodeLabelContent,
  syncRendererNodeDragTransform,
} from './rendererNodePresentation.js';
const VISIBLE_CONTENT_OVERFLOW_NODE_TYPES = new Set([
  'storyboard',
  'storyboard-script',
  'collage',
  'whiteboard',
  'media-clip',
  'panorama-scene',
  'panorama-360',
]);
function createNodeLabel(error, value, el) {
  const item = error['id'],
    el2 = el['createElement']('div');
  ((el2['className'] = 'node-label'), (el2['dataset']['nodeId'] = item));
  const labelKind = getRendererNodeLabelKind(value);
  if (labelKind) el2['dataset']['labelKind'] = labelKind;
  const defaultName = getRendererDefaultNodeLabel(error),
    isBeta = hasNodeTypeBetaBadge(value),
    fullLabelText = error['name'] || defaultName,
    displayLabelText = formatRendererNodeLabelText(fullLabelText);
  return (
    (el2['dataset']['fullName'] = fullLabelText),
    (el2['dataset']['defaultName'] = defaultName),
    (el2['dataset']['isBeta'] = isBeta ? '1' : '0'),
    setRendererNodeLabelContent(
      el2,
      {
        labelKind: labelKind,
        displayLabelText: displayLabelText,
        defaultName: defaultName,
        isBeta: isBeta,
        fullLabelText: fullLabelText,
      },
      el,
    ),
    el2
  );
}
function createNodeTimer(key, el3) {
  const el4 = el3['createElement']('div');
  return (
    (el4['className'] = 'node-timer'),
    (el4['dataset']['nodeId'] = key),
    (el4['style']['position'] = 'absolute'),
    (el4['style']['bottom'] = 'calc(100% + 8px)'),
    (el4['style']['right'] = '0'),
    (el4['style']['fontSize'] = '13px'),
    (el4['style']['color'] = 'var(--text-primary)'),
    (el4['style']['padding'] = '2px 8px'),
    (el4['style']['whiteSpace'] = 'nowrap'),
    (el4['style']['userSelect'] = 'none'),
    (el4['style']['pointerEvents'] = 'none'),
    (el4['style']['zIndex'] = '10'),
    (el4['style']['maxWidth'] = '100%'),
    (el4['style']['borderRadius'] = '6px'),
    (el4['style']['transition'] = 'all 0.2s'),
    (el4['style']['background'] = 'transparent'),
    (el4['style']['border'] = '1px solid transparent'),
    (el4['style']['display'] = 'none'),
    (el4['textContent'] = ''),
    el4
  );
}
function createVideoMeta(index, el5) {
  const el6 = el5['createElement']('div');
  return (
    (el6['className'] = 'node-video-meta'),
    (el6['dataset']['nodeId'] = index),
    (el6['dataset']['visible'] = '0'),
    (el6['textContent'] = ''),
    el6
  );
}
export function prepareRendererNodeRuntime({
  node: node,
  selectedNodeSet: selectedNodeSet,
  selectedNodeRankMap: selectedNodeRankMap,
  dragContext: dragContext,
  dragTargets: dragTargets,
  options: options = {},
  documentObject: documentObject = globalThis['document'],
} = {}) {
  if (!node?.['id'] || !documentObject?.['createElement'])
    throw new TypeError('[rendererNodeRuntimeFactory] node and document are required');
  const nodeId = node['id'],
    map = selectedNodeSet || new Set(),
    active = dragContext || {},
    wrapperEl = documentObject['createElement']('div');
  ((wrapperEl['id'] = nodeId),
    (wrapperEl['dataset']['nodeId'] = nodeId),
    syncNodeMediaMetricsDataset(wrapperEl, node));
  const canonicalType = normalizeNodeType(node['type']),
    nodeWrapperExtraClasses = getNodeWrapperExtraClasses(canonicalType);
  wrapperEl['className'] = 'v2-node node' + (nodeWrapperExtraClasses ? '\x20' + nodeWrapperExtraClasses : '');
  const result = map['has'](nodeId);
  result && wrapperEl['classList']['add']('selected', 'v2-selected');
  (Object['assign'](wrapperEl['style'], {
    position: 'absolute',
    top: '0',
    left: '0',
    width: node['width'] + 'px',
    height: node['height'] + 'px',
    transform: 'translate(' + node['x'] + 'px, ' + node['y'] + 'px)',
    zIndex: getRendererNodeZIndex(node, result, selectedNodeRankMap?.['get']?.(nodeId) ?? -0x1),
    display: 'flex',
    flexDirection: 'column',
  }),
    (wrapperEl['_posKey'] = node['x'] + ',' + node['y'] + ',' + node['width'] + ',' + node['height']),
    syncRendererNodeDragTransform(wrapperEl, node, {
      active: active['isDragging'] === !![] && dragTargets?.['has']?.(nodeId) === !![],
      offsetX: active['pendingDx'],
      offsetY: active['pendingDy'],
    }));
  const data = active['isDragging'] === !![] && dragTargets?.['has']?.(nodeId) === !![];
  data && wrapperEl['classList']['add']('is-dragging');
  data &&
    (active['hasMoved'] || !active['wasSelectedOnDown']) &&
    wrapperEl['classList']['add']('is-ui-hidden');
  if (isNodeType(node, 'group')) {
    const target = node['color'] || 'var(--indigo)';
    ((wrapperEl['style']['borderColor'] = getRendererGroupColorWithOpacity(target, '60')),
      (wrapperEl['style']['backgroundColor'] = getRendererGroupColorWithOpacity(target, '05')),
      wrapperEl['style']['setProperty']('--current-group-color', target));
  }
  if (!isNodeType(node, ['group', 'comment-note'])) {
    const nodeLabel = createNodeLabel(node, canonicalType, documentObject);
    (wrapperEl['appendChild'](nodeLabel), (wrapperEl['__v2_name_el'] = nodeLabel));
    const nodeTimer = createNodeTimer(nodeId, documentObject);
    (wrapperEl['appendChild'](nodeTimer), (wrapperEl['__v2_timer_el'] = nodeTimer));
    if (isNodeType(node, ['source-video', 'ai-video'])) {
      const videoMeta = createVideoMeta(nodeId, documentObject);
      (wrapperEl['appendChild'](videoMeta), (wrapperEl['__v2_video_meta_el'] = videoMeta));
    }
  }
  const run = getNodeClass(node['type']),
    instance = new run(
      withRendererDeferredMountHints(node, {
        deferMedia: options['deferMediaOnMount'] === !![],
        deferDetails: options['deferDetailsOnMount'] === !![],
        eagerVideoPreview: options['eagerVideoPreviewOnMount'] === !![],
        prebuildOffscreen: options['prebuildOffscreen'] === !![],
      }),
    ),
    el7 = instance['mount']();
  return (
    el7 &&
      (el7['classList']['add']('v2-node-component'),
      (el7['style']['flex'] = '1'),
      (el7['style']['width'] = '100%'),
      (el7['style']['minHeight'] = '0'),
      (el7['style']['minWidth'] = '0'),
      (el7['style']['display'] = 'flex'),
      (el7['style']['flexDirection'] = 'column'),
      (el7['style']['overflow'] = VISIBLE_CONTENT_OVERFLOW_NODE_TYPES['has'](canonicalType)
        ? 'visible'
        : 'hidden'),
      wrapperEl['appendChild'](el7)),
    { nodeId: nodeId, wrapperEl: wrapperEl, instance: instance, canonicalType: canonicalType }
  );
}
export function disposePreparedRendererNodeRuntime(enabled) {
  if (!enabled) return;
  try {
    enabled['instance']?.['unmount']?.();
  } catch {}
  enabled['wrapperEl']?.['remove']?.();
}
