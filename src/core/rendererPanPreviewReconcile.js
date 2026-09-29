import { getInteractionRenderState } from './interaction.js';
import { getViewportPanPreview, VIEWPORT_PAN_PREVIEW_FRAME_EVENT } from './viewportPanPreview.js';
import { readViewportInteractionState } from './viewportInteractionState.js';
import {
  getRendererStructuralReconcileDelayMs,
  RENDERER_VIRTUALIZATION_CONFIG,
} from './rendererVirtualization.js';
import { canReuseRendererViewportPreviewCoverage } from './rendererViewportPreviewCoverage.js';
import { resolveViewportInteractionReconcileDelay } from './rendererInteractionRenderPolicy.js';
import {
  isRendererRuntimeDiagnosticsEnabled,
  recordRendererRuntimeDiagnostic,
} from './rendererRuntimeDiagnostics.js';
const DENSE_PAN_PREVIEW_RECONCILE_INTERVAL_MS = 0x60,
  PAN_MEDIA_LOOKAHEAD_REFRESH_MS = 0xa0,
  DENSE_PAN_PREVIEW_HIGH_ZOOM_BUCKET_PX = 0xf0,
  DENSE_ZOOM_PREVIEW_RECONCILE_INTERVAL_MS = 0xa0;
function getWindowLike() {
  return typeof window !== 'undefined' ? window : globalThis;
}
function requestFrame(_0x2c3ce1) {
  const _0x19678a = getWindowLike();
  if (typeof _0x19678a?.['requestAnimationFrame'] === 'function')
    return _0x19678a['requestAnimationFrame'](_0x2c3ce1);
  return setTimeout(() => _0x2c3ce1(Date['now']()), 0x10);
}
function cancelFrame(_0xa65b51) {
  const _0x2189ef = getWindowLike();
  if (typeof _0x2189ef?.['cancelAnimationFrame'] === 'function') {
    _0x2189ef['cancelAnimationFrame'](_0xa65b51);
    return;
  }
  clearTimeout(_0xa65b51);
}
function normalizeViewport(_0x2114ce, _0x53c028 = null) {
  const _0x21b104 = _0x2114ce && typeof _0x2114ce === 'object' ? _0x2114ce : {},
    _0xd9a1e8 = _0x53c028 && typeof _0x53c028 === 'object' ? _0x53c028 : {},
    _0x40169c = Number(_0x21b104['x']),
    _0x1fe0ae = Number(_0x21b104['y']),
    _0x1c954a = Number(_0x21b104['zoom']),
    _0x500b4e = Number(_0xd9a1e8['x']),
    _0x300377 = Number(_0xd9a1e8['y']),
    _0x4ce6db = Number(_0xd9a1e8['zoom']),
    _0x1cc297 = Number['isFinite'](_0x1c954a) ? _0x1c954a : Number['isFinite'](_0x4ce6db) ? _0x4ce6db : 0x1;
  return {
    x: Number['isFinite'](_0x40169c) ? _0x40169c : Number['isFinite'](_0x500b4e) ? _0x500b4e : 0x0,
    y: Number['isFinite'](_0x1fe0ae) ? _0x1fe0ae : Number['isFinite'](_0x300377) ? _0x300377 : 0x0,
    zoom: _0x1cc297 > 0x0 ? _0x1cc297 : 0x1,
  };
}
function nowMs() {
  return typeof performance !== 'undefined' && performance && typeof performance['now'] === 'function'
    ? performance['now']()
    : Date['now']();
}
function quantizeSigned(_0x25907b, _0x37c2bc) {
  const _0x2caeaa = Math['max'](0x1, Number(_0x37c2bc) || 0x1);
  return Math['trunc'](Number(_0x25907b || 0x0) / _0x2caeaa) * _0x2caeaa;
}
function getDensePanPreviewBucket(_0x4921f3, _0x40c15c) {
  const _0x1fc2fe = Number(_0x4921f3?.['zoom']) || 0x1,
    _0x4f5ef8 = Number(_0x40c15c) || 0x0;
  if (_0x4f5ef8 < RENDERER_VIRTUALIZATION_CONFIG['denseNodeCount']) return null;
  const _0x197b02 =
      _0x1fc2fe <= RENDERER_VIRTUALIZATION_CONFIG['veryDenseLowZoomThreshold'] &&
      _0x4f5ef8 >= RENDERER_VIRTUALIZATION_CONFIG['veryDenseNodeCount'],
    _0x2fef10 =
      _0x1fc2fe <= RENDERER_VIRTUALIZATION_CONFIG['denseLowZoomThreshold'] &&
      _0x4f5ef8 >= RENDERER_VIRTUALIZATION_CONFIG['denseNodeCount'],
    _0xa1d0a5 = _0x197b02 ? 0xc0 : _0x2fef10 ? 0x40 : DENSE_PAN_PREVIEW_HIGH_ZOOM_BUCKET_PX;
  return {
    key:
      quantizeSigned(_0x4921f3['x'], _0xa1d0a5) +
      ':' +
      quantizeSigned(_0x4921f3['y'], _0xa1d0a5) +
      ':' +
      _0x1fc2fe['toFixed'](0x3),
    bucketSize: _0xa1d0a5,
  };
}
function addNodeAndChildren(_0x5d4c5d, _0x4f6b7c, _0x53503d) {
  if (!_0x4f6b7c || _0x5d4c5d['has'](_0x4f6b7c)) return;
  _0x5d4c5d['add'](_0x4f6b7c);
  const _0x498f92 = _0x53503d?.[_0x4f6b7c];
  if (!_0x498f92) return;
  const _0x3289ff = _0x498f92 instanceof Set ? _0x498f92 : Array['isArray'](_0x498f92) ? _0x498f92 : [];
  for (const _0x314801 of _0x3289ff) {
    addNodeAndChildren(_0x5d4c5d, _0x314801, _0x53503d);
  }
}
function collectActiveDragNodeIds({
  dragContext: _0x4d239c,
  selectedNodeIds: _0x4fc19c,
  parentToChildren: _0x57e310,
} = {}) {
  const _0x7d705e = new Set();
  if (!_0x4d239c?.['isDragging'] || _0x4d239c['isCommittingDrag'] === !![]) return _0x7d705e;
  const _0x676631 = _0x4d239c['targetNodeId'] || null,
    _0x3457d5 = Array['isArray'](_0x4fc19c) ? _0x4fc19c : [],
    _0x1926d9 = _0x676631 && _0x3457d5['includes'](_0x676631) ? _0x3457d5 : _0x676631 ? [_0x676631] : [];
  for (const _0x2c908d of _0x1926d9) {
    addNodeAndChildren(_0x7d705e, _0x2c908d, _0x57e310);
  }
  return _0x7d705e;
}
function omitNodeIds(_0x1d6b2e, _0x30559d) {
  if (!_0x30559d || _0x30559d['size'] === 0x0) return _0x1d6b2e;
  const _0x502187 = {};
  for (const [_0x2066d4, _0x4f2b94] of Object['entries'](_0x1d6b2e || {})) {
    if (!_0x30559d['has'](_0x2066d4)) _0x502187[_0x2066d4] = _0x4f2b94;
  }
  return _0x502187;
}
export function createRendererPanPreviewReconciler({
  canvasEl: _0xe7957b,
  svgWrapper: _0x126903,
  getSnapshot: _0x389716,
  hasPendingStoreRender: _0x71449a,
  markBusy: _0x4e41cf,
  renderViewport: _0x2caaad,
  renderNodes: _0x24491c,
  buildSelectionRelatedSets: _0xb593cc,
  normalizeSelectionRelatedHighlightColor: _0xb5f614,
  scheduleDeferredReconcile: _0x282dff,
  now: now = nowMs,
} = {}) {
  const _0x4c514c = getWindowLike(),
    _0x2fc930 = isRendererRuntimeDiagnosticsEnabled();
  let _0x16ea66 = null,
    _0x22db26 = null,
    _0x53bbcf = '',
    _0x7956d4 = 0x0,
    _0x32cec3 = null,
    _0x383cac = null,
    _0xc6f15d = 0x0;
  function _0x40c463() {
    (_0x16ea66 !== null && (cancelFrame(_0x16ea66), (_0x16ea66 = null)), (_0x22db26 = null));
  }
  function _0x40fbb2(_0x23eaee, _0x35fde3, { allowIdleViewportOnly: allowIdleViewportOnly = ![] } = {}) {
    if (!_0x23eaee || !_0x35fde3) return null;
    const _0x4c45cb = getInteractionRenderState(),
      _0x56bf1b = readViewportInteractionState({ interactionState: _0x4c45cb }),
      _0x24bced = _0x56bf1b['isViewportBusy']
        ? _0x56bf1b
        : readViewportInteractionState({ interactionState: _0x4c45cb, panPreviewActive: !![] });
    if (
      !allowIdleViewportOnly &&
      !_0x24bced['isPanning'] &&
      !_0x24bced['isZooming'] &&
      !_0x24bced['isViewportAnimating']
    )
      return null;
    const _0x33ddb2 =
        typeof _0x23eaee['_nodeCount'] === 'number'
          ? _0x23eaee['_nodeCount']
          : Object['keys'](_0x23eaee['nodes'] || {})['length'],
      _0x4b5059 = _0x24bced['isViewportAnimating'] || (_0x24bced['isZooming'] && !_0x24bced['isPanning']),
      _0x79fe5 = _0x24bced['isZooming'] && !_0x24bced['isPanning'] && !_0x24bced['isViewportAnimating'],
      _0x3d3a86 = _0x24bced['isPanning'] && !_0x4b5059,
      _0x5c0e20 = _0x3d3a86 ? getDensePanPreviewBucket(_0x35fde3, _0x33ddb2) : null;
    let _0x458cc9 = ![];
    if (_0x5c0e20 && _0x32cec3) {
      if (
        (_0x35fde3['zoom'] <= RENDERER_VIRTUALIZATION_CONFIG['veryDenseLowZoomThreshold'] ||
          now() - _0x7956d4 < PAN_MEDIA_LOOKAHEAD_REFRESH_MS) &&
        canReuseRendererViewportPreviewCoverage(_0x32cec3, {
          viewport: _0x35fde3,
          nodeCount: _0x33ddb2,
          snapshot: _0x23eaee,
        })
      )
        return (
          _0x2fc930 &&
            recordRendererRuntimeDiagnostic({
              kind: 'pan-preview-coverage-reuse',
              nodeCount: _0x33ddb2,
              viewport: { ..._0x35fde3 },
            }),
          { skipped: !![], hasPendingStructuralOps: ![], priorityMediaWork: ![], nodeCount: _0x33ddb2 }
        );
      ((_0x32cec3 = null), (_0x458cc9 = !![]));
    } else !_0x5c0e20 && (_0x32cec3 = null);
    if (_0x5c0e20) {
      const _0x3f4fc9 = now();
      if (
        !_0x458cc9 &&
        _0x5c0e20['key'] === _0x53bbcf &&
        _0x3f4fc9 - _0x7956d4 < DENSE_PAN_PREVIEW_RECONCILE_INTERVAL_MS
      )
        return (
          _0x2fc930 &&
            recordRendererRuntimeDiagnostic({
              kind: 'pan-preview-reconcile-skip',
              nodeCount: _0x33ddb2,
              bucketKey: _0x5c0e20['key'],
            }),
          { skipped: !![], hasPendingStructuralOps: ![], nodeCount: _0x33ddb2 }
        );
      ((_0x53bbcf = _0x5c0e20['key']), (_0x7956d4 = _0x3f4fc9));
    } else ((_0x53bbcf = ''), (_0x7956d4 = 0x0));
    (_0x4e41cf?.(), _0x2caaad?.(_0xe7957b, _0x35fde3, _0x23eaee['ui']?.['titleFollowsCanvasZoom'] === !![]));
    if (_0x126903?.['style']?.['display'] === 'none') _0x126903['style']['display'] = '';
    const _0x498938 = typeof now === 'function' ? now() : nowMs(),
      _0x43d197 = _0x498938 - _0xc6f15d;
    if (
      _0x79fe5 &&
      _0x383cac &&
      _0x43d197 >= 0x0 &&
      _0x43d197 < DENSE_ZOOM_PREVIEW_RECONCILE_INTERVAL_MS &&
      canReuseRendererViewportPreviewCoverage(_0x383cac, {
        viewport: _0x35fde3,
        nodeCount: _0x33ddb2,
        snapshot: _0x23eaee,
      })
    )
      return (
        _0x2fc930 &&
          recordRendererRuntimeDiagnostic({
            kind: 'zoom-preview-reconcile-skip',
            nodeCount: _0x33ddb2,
            elapsedMs: _0x43d197,
            viewport: { ..._0x35fde3 },
          }),
        { skipped: !![], hasPendingStructuralOps: ![], priorityMediaWork: ![], nodeCount: _0x33ddb2 }
      );
    !_0x79fe5 && ((_0x383cac = null), (_0xc6f15d = 0x0));
    const _0x4f0a0b =
        _0x23eaee['ui']?.['selectionRelatedHighlightEnabled'] === ![]
          ? { relatedNodeIds: new Set(), relatedEdgeIds: new Set() }
          : _0xb593cc?.(_0x23eaee['selectedNodeIds'], _0x23eaee['edges']) || {
              relatedNodeIds: new Set(),
              relatedEdgeIds: new Set(),
            },
      _0x7e040 = _0xb5f614?.(_0x23eaee['ui']?.['selectionRelatedHighlightColor']),
      _0x1f141a = collectActiveDragNodeIds({
        dragContext: _0x4c45cb,
        selectedNodeIds: _0x23eaee['selectedNodeIds'],
        parentToChildren: _0x23eaee['_parentToChildren'],
      }),
      _0x2a55f2 = omitNodeIds(_0x23eaee['nodes'], _0x1f141a),
      _0x2831b2 = ![],
      _0xad3d79 = ![],
      _0x2d324a = !![],
      _0x3e54a4 = _0x2fc930 ? nowMs() : 0x0,
      _0x22ff35 = _0x2fc930 ? nowMs() : 0x0,
      _0x2a4e9f = _0x24491c?.(
        _0xe7957b,
        _0x2a55f2,
        _0x23eaee['selectedNodeIds'],
        _0x4f0a0b['relatedNodeIds'],
        _0x7e040,
        _0x23eaee['connOverlay'],
        _0x23eaee['pickConnectMode'],
        _0x35fde3,
        _0x23eaee['edges'],
        _0x23eaee['_parentToChildren'],
        _0x23eaee['ui'] && typeof _0x23eaee['ui']['showVideoMeta'] === 'boolean'
          ? _0x23eaee['ui']['showVideoMeta']
          : ![],
        _0x23eaee,
        {
          deferParking: !![],
          previewOnly: _0x2d324a,
          mode: _0x4b5059 ? 'zoom-lod-preview' : 'pan-preview',
          lockRasterParticipation: !_0x4b5059,
          suspendNewMediaSrc: !_0xad3d79,
          viewportPriorityMediaOnly: _0xad3d79,
        },
      );
    _0x79fe5 && ((_0x383cac = _0x2a4e9f?.['previewCoverage'] || null), (_0xc6f15d = _0x498938));
    _0x5c0e20 && (_0x32cec3 = _0x2a4e9f?.['previewCoverage'] || null);
    if (_0x2fc930) {
      const _0x123428 = nowMs();
      recordRendererRuntimeDiagnostic({
        kind: 'pan-preview-reconcile',
        nodeCount: _0x33ddb2,
        previewOnly: _0x2d324a,
        priorityMediaWork: _0x2831b2,
        renderNodesMs: _0x123428 - _0x22ff35,
        durationMs: _0x123428 - _0x3e54a4,
        viewport: { ..._0x35fde3 },
      });
    }
    const _0x39fd83 = _0x2a4e9f?.['hasPendingStructuralOps'] === !![];
    return { hasPendingStructuralOps: _0x39fd83, priorityMediaWork: _0x2831b2, nodeCount: _0x33ddb2 };
  }
  function _0x699e46(_0x4fb092) {
    _0x22db26 = _0x4fb092 ? { ..._0x4fb092 } : null;
    if (_0x16ea66 !== null) return;
    _0x16ea66 = requestFrame(() => {
      _0x16ea66 = null;
      if (_0x71449a?.()) {
        const _0x330008 = _0x22db26;
        _0x22db26 = null;
        if (_0x330008) _0x699e46(_0x330008);
        return;
      }
      const _0x4e6e34 = _0x389716?.(),
        _0xe37b9f = _0x22db26;
      _0x22db26 = null;
      if (!_0x4e6e34) return;
      const _0x38e63 = normalizeViewport(_0xe37b9f || getViewportPanPreview(), _0x4e6e34['viewport']),
        _0x20a1df = _0x40fbb2(_0x4e6e34, _0x38e63);
      if (_0x20a1df?.['hasPendingStructuralOps']) _0x699e46(_0x38e63);
      else
        _0x20a1df &&
          _0x20a1df['skipped'] !== !![] &&
          _0x282dff?.(
            resolveViewportInteractionReconcileDelay({
              hasPriorityMediaWork: _0x20a1df['priorityMediaWork'] === !![],
              fallbackDelayMs: getRendererStructuralReconcileDelayMs(_0x20a1df['nodeCount']),
            }),
          );
    });
  }
  const _0xeb7b5b = (_0x3fb8e5) => {
    const _0x12745 = _0x3fb8e5?.['detail']?.['viewport'] || getViewportPanPreview() || null;
    if (!_0x12745) return;
    if (_0x71449a?.()) {
      _0x699e46(_0x12745);
      return;
    }
    _0x16ea66 !== null && (cancelFrame(_0x16ea66), (_0x16ea66 = null), (_0x22db26 = null));
    const _0x2ad7a9 = _0x389716?.();
    if (!_0x2ad7a9) return;
    const _0x4846b4 = normalizeViewport(_0x12745, _0x2ad7a9['viewport']),
      _0x15a7aa = _0x40fbb2(_0x2ad7a9, _0x4846b4);
    if (_0x15a7aa?.['hasPendingStructuralOps']) _0x699e46(_0x4846b4);
    else
      _0x15a7aa &&
        _0x15a7aa['skipped'] !== !![] &&
        _0x282dff?.(
          resolveViewportInteractionReconcileDelay({
            hasPriorityMediaWork: _0x15a7aa['priorityMediaWork'] === !![],
            fallbackDelayMs: getRendererStructuralReconcileDelayMs(_0x15a7aa['nodeCount']),
          }),
        );
  };
  return (
    _0x4c514c?.['addEventListener']?.(VIEWPORT_PAN_PREVIEW_FRAME_EVENT, _0xeb7b5b),
    {
      reconcileViewportOnly(_0x1195dd, _0x23bd05) {
        return _0x40fbb2(_0x1195dd, _0x23bd05, { allowIdleViewportOnly: !![] });
      },
      dispose() {
        (_0x40c463(),
          (_0x53bbcf = ''),
          (_0x7956d4 = 0x0),
          (_0x32cec3 = null),
          (_0x383cac = null),
          (_0xc6f15d = 0x0),
          _0x4c514c?.['removeEventListener']?.(VIEWPORT_PAN_PREVIEW_FRAME_EVENT, _0xeb7b5b));
      },
    }
  );
}
