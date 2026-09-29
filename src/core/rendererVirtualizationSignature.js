import { RENDERER_VIRTUALIZATION_CONFIG } from './rendererVirtualization.js';
function normalizeSignaturePart(_0x56cabe) {
  if (_0x56cabe === null || _0x56cabe === undefined) return null;
  if (typeof _0x56cabe === 'number') return Number['isFinite'](_0x56cabe) ? _0x56cabe : null;
  if (typeof _0x56cabe === 'boolean') return _0x56cabe;
  if (typeof _0x56cabe === 'string') return _0x56cabe;
  if (Array['isArray'](_0x56cabe)) return _0x56cabe['map']((_0x49fd24) => normalizeSignaturePart(_0x49fd24));
  if (typeof _0x56cabe === 'object') {
    const _0x4b5220 = {};
    for (const _0x4634c5 of Object['keys'](_0x56cabe)['sort']()) {
      _0x4b5220[_0x4634c5] = normalizeSignaturePart(_0x56cabe[_0x4634c5]);
    }
    return _0x4b5220;
  }
  return String(_0x56cabe);
}
function toFiniteNumber(_0x3f84eb, _0x4a0602 = 0x0) {
  const _0x56a319 = Number(_0x3f84eb);
  return Number['isFinite'](_0x56a319) ? _0x56a319 : _0x4a0602;
}
function quantizeSigned(_0x1a466f, _0x3f4988) {
  const _0x4a3f40 = Math['max'](0x1, Number(_0x3f4988) || 0x1);
  return Math['trunc'](toFiniteNumber(_0x1a466f) / _0x4a3f40) * _0x4a3f40;
}
function normalizeViewportForSignature(_0x14ae9d, _0x4a2298) {
  const _0x27ded4 = toFiniteNumber(_0x14ae9d?.['zoom'], 0x1),
    _0x32fd4f = toFiniteNumber(_0x4a2298, 0x0),
    _0xe9c78d =
      _0x27ded4 <= RENDERER_VIRTUALIZATION_CONFIG['veryDenseLowZoomThreshold'] &&
      _0x32fd4f >= RENDERER_VIRTUALIZATION_CONFIG['veryDenseNodeCount'],
    _0x207819 =
      _0x27ded4 <= RENDERER_VIRTUALIZATION_CONFIG['denseLowZoomThreshold'] &&
      _0x32fd4f >= RENDERER_VIRTUALIZATION_CONFIG['denseNodeCount'],
    _0x562193 = _0xe9c78d ? 0x60 : _0x207819 ? 0x40 : 0x0,
    _0x204f77 = toFiniteNumber(_0x14ae9d?.['x'], 0x0),
    _0x2e8c84 = toFiniteNumber(_0x14ae9d?.['y'], 0x0);
  if (!(_0x562193 > 0x0)) return { x: _0x204f77, y: _0x2e8c84, zoom: _0x27ded4 };
  return {
    x: quantizeSigned(_0x204f77, _0x562193),
    y: quantizeSigned(_0x2e8c84, _0x562193),
    zoom: _0x27ded4,
  };
}
export function buildRendererVirtualizationSignature({
  snapshotRev: _0x3acf5f,
  nodeCount: _0x51b869,
  viewport: _0x27c58a,
  selectedNodeIds: _0x24e166,
  connOverlay: _0x3f2ec5,
  pickConnectMode: _0x508e2f,
  dragContext: _0x29c8e8,
  pinnedNodeIds: _0x5ea683,
  containerW: _0x3fb3ca,
  containerH: _0x2d1108,
} = {}) {
  const _0x25ee7d = Array['from'](
      _0x24e166 instanceof Set ? _0x24e166 : Array['isArray'](_0x24e166) ? _0x24e166 : [],
    )
      ['map']((_0x1b4894) => String(_0x1b4894))
      ['sort'](),
    _0x3a6b28 = Array['from'](
      _0x5ea683 instanceof Set ? _0x5ea683 : Array['isArray'](_0x5ea683) ? _0x5ea683 : [],
    )
      ['map']((_0x5bcf7d) => String(_0x5bcf7d))
      ['sort']();
  return JSON['stringify'](
    normalizeSignaturePart({
      snapshotRev: _0x3acf5f,
      nodeCount: _0x51b869,
      viewport: normalizeViewportForSignature(_0x27c58a, _0x51b869),
      selectedNodeIds: _0x25ee7d,
      connOverlay: { srcId: _0x3f2ec5?.['srcId'] ?? null, hoverId: _0x3f2ec5?.['hoverId'] ?? null },
      pickConnectMode: {
        active: !!_0x508e2f?.['active'],
        sourceNodeId: _0x508e2f?.['sourceNodeId'] ?? null,
        hoverNodeId: _0x508e2f?.['hoverNodeId'] ?? null,
        handleDirection: _0x508e2f?.['handleDirection'] ?? null,
      },
      dragContext: {
        isDragging: !!_0x29c8e8?.['isDragging'],
        targetNodeId: _0x29c8e8?.['targetNodeId'] ?? null,
        pendingDx: Number['isFinite'](_0x29c8e8?.['pendingDx']) ? _0x29c8e8['pendingDx'] : 0x0,
        pendingDy: Number['isFinite'](_0x29c8e8?.['pendingDy']) ? _0x29c8e8['pendingDy'] : 0x0,
      },
      pinnedNodeIds: _0x3a6b28,
      containerW: Number['isFinite'](_0x3fb3ca) ? _0x3fb3ca : 0x0,
      containerH: Number['isFinite'](_0x2d1108) ? _0x2d1108 : 0x0,
    }),
  );
}
