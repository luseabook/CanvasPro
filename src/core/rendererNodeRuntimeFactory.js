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
function createNodeLabel(_0x4ff4c0, _0x57df82, _0x391893) {
  const _0x4c9a12 = _0x4ff4c0['id'],
    _0x26087d = _0x391893['createElement']('div');
  ((_0x26087d['className'] = 'node-label'), (_0x26087d['dataset']['nodeId'] = _0x4c9a12));
  const _0x1cbfe5 = getRendererNodeLabelKind(_0x57df82);
  if (_0x1cbfe5) _0x26087d['dataset']['labelKind'] = _0x1cbfe5;
  const _0x402744 = getRendererDefaultNodeLabel(_0x4ff4c0),
    _0x5823bd = hasNodeTypeBetaBadge(_0x57df82),
    _0x215197 = _0x4ff4c0['name'] || _0x402744,
    _0x29e1d1 = formatRendererNodeLabelText(_0x215197);
  return (
    (_0x26087d['dataset']['fullName'] = _0x215197),
    (_0x26087d['dataset']['defaultName'] = _0x402744),
    (_0x26087d['dataset']['isBeta'] = _0x5823bd ? '1' : '0'),
    setRendererNodeLabelContent(
      _0x26087d,
      {
        labelKind: _0x1cbfe5,
        displayLabelText: _0x29e1d1,
        defaultName: _0x402744,
        isBeta: _0x5823bd,
        fullLabelText: _0x215197,
      },
      _0x391893,
    ),
    _0x26087d
  );
}
function createNodeTimer(_0x1b5d07, _0x5319d8) {
  const _0x1a1cd9 = _0x5319d8['createElement']('div');
  return (
    (_0x1a1cd9['className'] = 'node-timer'),
    (_0x1a1cd9['dataset']['nodeId'] = _0x1b5d07),
    (_0x1a1cd9['style']['position'] = 'absolute'),
    (_0x1a1cd9['style']['bottom'] = 'calc(100% + 8px)'),
    (_0x1a1cd9['style']['right'] = '0'),
    (_0x1a1cd9['style']['fontSize'] = '13px'),
    (_0x1a1cd9['style']['color'] = 'var(--text-primary)'),
    (_0x1a1cd9['style']['padding'] = '2px 8px'),
    (_0x1a1cd9['style']['whiteSpace'] = 'nowrap'),
    (_0x1a1cd9['style']['userSelect'] = 'none'),
    (_0x1a1cd9['style']['pointerEvents'] = 'none'),
    (_0x1a1cd9['style']['zIndex'] = '10'),
    (_0x1a1cd9['style']['maxWidth'] = '100%'),
    (_0x1a1cd9['style']['borderRadius'] = '6px'),
    (_0x1a1cd9['style']['transition'] = 'all 0.2s'),
    (_0x1a1cd9['style']['background'] = 'transparent'),
    (_0x1a1cd9['style']['border'] = '1px solid transparent'),
    (_0x1a1cd9['style']['display'] = 'none'),
    (_0x1a1cd9['textContent'] = ''),
    _0x1a1cd9
  );
}
function createVideoMeta(_0x360e22, _0x382496) {
  const _0x3646c6 = _0x382496['createElement']('div');
  return (
    (_0x3646c6['className'] = 'node-video-meta'),
    (_0x3646c6['dataset']['nodeId'] = _0x360e22),
    (_0x3646c6['dataset']['visible'] = '0'),
    (_0x3646c6['textContent'] = ''),
    _0x3646c6
  );
}
export function prepareRendererNodeRuntime({
  node: _0x5c3a37,
  selectedNodeSet: _0x146f25,
  selectedNodeRankMap: _0x415939,
  dragContext: _0x4b9e9d,
  dragTargets: _0x4853cb,
  options: options = {},
  documentObject: documentObject = globalThis['document'],
} = {}) {
  if (!_0x5c3a37?.['id'] || !documentObject?.['createElement'])
    throw new TypeError('[rendererNodeRuntimeFactory] node and document are required');
  const _0x2f4dda = _0x5c3a37['id'],
    _0x9e19bf = _0x146f25 || new Set(),
    _0x35a9fe = _0x4b9e9d || {},
    _0x262794 = documentObject['createElement']('div');
  ((_0x262794['id'] = _0x2f4dda),
    (_0x262794['dataset']['nodeId'] = _0x2f4dda),
    syncNodeMediaMetricsDataset(_0x262794, _0x5c3a37));
  const _0x426eaf = normalizeNodeType(_0x5c3a37['type']),
    _0x63479e = getNodeWrapperExtraClasses(_0x426eaf);
  _0x262794['className'] = 'v2-node node' + (_0x63479e ? '\x20' + _0x63479e : '');
  const _0xd62017 = _0x9e19bf['has'](_0x2f4dda);
  _0xd62017 && _0x262794['classList']['add']('selected', 'v2-selected');
  (Object['assign'](_0x262794['style'], {
    position: 'absolute',
    top: '0',
    left: '0',
    width: _0x5c3a37['width'] + 'px',
    height: _0x5c3a37['height'] + 'px',
    transform: 'translate(' + _0x5c3a37['x'] + 'px, ' + _0x5c3a37['y'] + 'px)',
    zIndex: getRendererNodeZIndex(_0x5c3a37, _0xd62017, _0x415939?.['get']?.(_0x2f4dda) ?? -0x1),
    display: 'flex',
    flexDirection: 'column',
  }),
    (_0x262794['_posKey'] =
      _0x5c3a37['x'] + ',' + _0x5c3a37['y'] + ',' + _0x5c3a37['width'] + ',' + _0x5c3a37['height']),
    syncRendererNodeDragTransform(_0x262794, _0x5c3a37, {
      active: _0x35a9fe['isDragging'] === !![] && _0x4853cb?.['has']?.(_0x2f4dda) === !![],
      offsetX: _0x35a9fe['pendingDx'],
      offsetY: _0x35a9fe['pendingDy'],
    }));
  const _0x158b1f = _0x35a9fe['isDragging'] === !![] && _0x4853cb?.['has']?.(_0x2f4dda) === !![];
  _0x158b1f && _0x262794['classList']['add']('is-dragging');
  _0x158b1f &&
    (_0x35a9fe['hasMoved'] || !_0x35a9fe['wasSelectedOnDown']) &&
    _0x262794['classList']['add']('is-ui-hidden');
  if (isNodeType(_0x5c3a37, 'group')) {
    const _0x56c670 = _0x5c3a37['color'] || 'var(--indigo)';
    ((_0x262794['style']['borderColor'] = getRendererGroupColorWithOpacity(_0x56c670, '60')),
      (_0x262794['style']['backgroundColor'] = getRendererGroupColorWithOpacity(_0x56c670, '05')),
      _0x262794['style']['setProperty']('--current-group-color', _0x56c670));
  }
  if (!isNodeType(_0x5c3a37, ['group', 'comment-note'])) {
    const _0x16ee0e = createNodeLabel(_0x5c3a37, _0x426eaf, documentObject);
    (_0x262794['appendChild'](_0x16ee0e), (_0x262794['__v2_name_el'] = _0x16ee0e));
    const _0x5116bd = createNodeTimer(_0x2f4dda, documentObject);
    (_0x262794['appendChild'](_0x5116bd), (_0x262794['__v2_timer_el'] = _0x5116bd));
    if (isNodeType(_0x5c3a37, ['source-video', 'ai-video'])) {
      const _0x1bca7b = createVideoMeta(_0x2f4dda, documentObject);
      (_0x262794['appendChild'](_0x1bca7b), (_0x262794['__v2_video_meta_el'] = _0x1bca7b));
    }
  }
  const _0x2c9562 = getNodeClass(_0x5c3a37['type']),
    _0x8cfeb2 = new _0x2c9562(
      withRendererDeferredMountHints(_0x5c3a37, {
        deferMedia: options['deferMediaOnMount'] === !![],
        deferDetails: options['deferDetailsOnMount'] === !![],
        eagerVideoPreview: options['eagerVideoPreviewOnMount'] === !![],
        prebuildOffscreen: options['prebuildOffscreen'] === !![],
      }),
    ),
    _0x5c76f8 = _0x8cfeb2['mount']();
  return (
    _0x5c76f8 &&
      (_0x5c76f8['classList']['add']('v2-node-component'),
      (_0x5c76f8['style']['flex'] = '1'),
      (_0x5c76f8['style']['width'] = '100%'),
      (_0x5c76f8['style']['minHeight'] = '0'),
      (_0x5c76f8['style']['minWidth'] = '0'),
      (_0x5c76f8['style']['display'] = 'flex'),
      (_0x5c76f8['style']['flexDirection'] = 'column'),
      (_0x5c76f8['style']['overflow'] = VISIBLE_CONTENT_OVERFLOW_NODE_TYPES['has'](_0x426eaf)
        ? 'visible'
        : 'hidden'),
      _0x262794['appendChild'](_0x5c76f8)),
    { nodeId: _0x2f4dda, wrapperEl: _0x262794, instance: _0x8cfeb2, canonicalType: _0x426eaf }
  );
}
export function disposePreparedRendererNodeRuntime(_0xcb7fdc) {
  if (!_0xcb7fdc) return;
  try {
    _0xcb7fdc['instance']?.['unmount']?.();
  } catch {}
  _0xcb7fdc['wrapperEl']?.['remove']?.();
}
