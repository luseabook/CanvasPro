const DEFAULT_CELL_SIZE = 0x400,
  DEFAULT_NODE_WIDTH = 160,
  DEFAULT_NODE_HEIGHT = 120;
let cachedSpatialIndexSignature = '',
  cachedSpatialIndex = null;
function finiteNumber(_0x29a3ba, _0x2de07b = 0) {
  const _0x14dab9 = Number(_0x29a3ba);
  return Number.isFinite(_0x14dab9) ? _0x14dab9 : _0x2de07b;
}
function normalizeNodeBounds(_0x2eee9b) {
  const _0x317479 = finiteNumber(_0x2eee9b?.x, 0),
    _0x5427e4 = finiteNumber(_0x2eee9b?.y, 0),
    _0x5bebee = Math.max(1, finiteNumber(_0x2eee9b?.width, DEFAULT_NODE_WIDTH)),
    _0x5aaca4 = Math.max(1, finiteNumber(_0x2eee9b?.height, DEFAULT_NODE_HEIGHT));
  return { minX: _0x317479, minY: _0x5427e4, maxX: _0x317479 + _0x5bebee, maxY: _0x5427e4 + _0x5aaca4 };
}
function cellRangeForBounds(_0x146d56, _0x52217a) {
  return {
    minCellX: Math.floor(_0x146d56.minX / _0x52217a),
    maxCellX: Math.floor(_0x146d56.maxX / _0x52217a),
    minCellY: Math.floor(_0x146d56.minY / _0x52217a),
    maxCellY: Math.floor(_0x146d56.maxY / _0x52217a),
  };
}
function cellKey(_0x2bf2b8, _0x24bd13) {
  return _0x2bf2b8 + ':' + _0x24bd13;
}
function intersectsBounds(_0x5068ae, _0xe656f9) {
  return (
    _0x5068ae.maxX > _0xe656f9.minX &&
    _0x5068ae.minX < _0xe656f9.maxX &&
    _0x5068ae.maxY > _0xe656f9.minY &&
    _0x5068ae.minY < _0xe656f9.maxY
  );
}
function getViewportWorldCenter(_0x56001e, _0x5f2e07, _0x48c095) {
  const _0x34ba96 = screenViewportToWorldBounds({
    viewport: _0x56001e,
    containerWidth: _0x5f2e07,
    containerHeight: _0x48c095,
    padding: 0,
  });
  return { x: (_0x34ba96.minX + _0x34ba96.maxX) / 2, y: (_0x34ba96.minY + _0x34ba96.maxY) / 2 };
}
function getNodeDistanceSqToCenter(_0x39d690, _0x1c2112) {
  if (!_0x39d690 || !_0x1c2112) return 0;
  const _0x530c7a = normalizeNodeBounds(_0x39d690),
    _0x43e69d = (_0x530c7a.minX + _0x530c7a.maxX) / 2,
    _0x5c08dd = (_0x530c7a.minY + _0x530c7a.maxY) / 2,
    _0x3e4d6f = _0x43e69d - _0x1c2112.x,
    _0x2386f1 = _0x5c08dd - _0x1c2112.y;
  return _0x3e4d6f * _0x3e4d6f + _0x2386f1 * _0x2386f1;
}
export function screenViewportToWorldBounds({
  viewport: _0x5dbefa,
  containerWidth: _0x49b713,
  containerHeight: _0xb9c051,
  padding: padding = 0,
} = {}) {
  const _0x563822 = Math.max(0.0001, finiteNumber(_0x5dbefa?.zoom, 1)),
    _0x59345f = finiteNumber(_0x5dbefa?.x, 0),
    _0x25fc15 = finiteNumber(_0x5dbefa?.y, 0),
    _0x8b48b1 = Math.max(1, finiteNumber(_0x49b713, 1)),
    _0x188f08 = Math.max(1, finiteNumber(_0xb9c051, 1)),
    _0xb848ed = Math.max(0, finiteNumber(padding, 0));
  return {
    minX: (-_0xb848ed - _0x59345f) / _0x563822,
    minY: (-_0xb848ed - _0x25fc15) / _0x563822,
    maxX: (_0x8b48b1 + _0xb848ed - _0x59345f) / _0x563822,
    maxY: (_0x188f08 + _0xb848ed - _0x25fc15) / _0x563822,
  };
}
export function createRendererSpatialIndex(_0x113bba, { cellSize: cellSize = DEFAULT_CELL_SIZE } = {}) {
  const _0x23e84f = Object.values(_0x113bba || {}),
    _0x2fa854 = new Map(),
    _0x41722d = new Map(),
    _0x18b5aa = new Set(),
    _0x4847d4 = Math.max(128, finiteNumber(cellSize, DEFAULT_CELL_SIZE));
  for (const _0x53d8ca of _0x23e84f) {
    const _0x59daf1 = String(_0x53d8ca?.id || '').trim();
    if (!_0x59daf1) continue;
    const _0x907039 = normalizeNodeBounds(_0x53d8ca),
      _0x326ee6 = cellRangeForBounds(_0x907039, _0x4847d4);
    (_0x41722d.set(_0x59daf1, { node: _0x53d8ca, bounds: _0x907039 }), _0x18b5aa.add(_0x59daf1));
    for (let _0x85381 = _0x326ee6.minCellX; _0x85381 <= _0x326ee6.maxCellX; _0x85381 += 1) {
      for (let _0x24e281 = _0x326ee6.minCellY; _0x24e281 <= _0x326ee6.maxCellY; _0x24e281 += 1) {
        const _0x3b7db8 = cellKey(_0x85381, _0x24e281);
        let _0x48e978 = _0x2fa854.get(_0x3b7db8);
        (!_0x48e978 && ((_0x48e978 = new Set()), _0x2fa854.set(_0x3b7db8, _0x48e978)),
          _0x48e978.add(_0x59daf1));
      }
    }
  }
  return {
    cellSize: _0x4847d4,
    cells: _0x2fa854,
    nodesById: _0x41722d,
    nodeIds: _0x18b5aa,
    nodeCount: _0x18b5aa.size,
  };
}
export function queryRendererSpatialIndex(_0x252b1f, _0x57b541) {
  if (!_0x252b1f || !_0x57b541) return [];
  const _0x2853c7 = cellRangeForBounds(_0x57b541, _0x252b1f.cellSize || DEFAULT_CELL_SIZE),
    _0x4bb22c = new Set(),
    _0x210b34 = [];
  for (let _0x469576 = _0x2853c7.minCellX; _0x469576 <= _0x2853c7.maxCellX; _0x469576 += 1) {
    for (let _0x5aab46 = _0x2853c7.minCellY; _0x5aab46 <= _0x2853c7.maxCellY; _0x5aab46 += 1) {
      const _0x19d6a = _0x252b1f.cells?.get?.(cellKey(_0x469576, _0x5aab46));
      if (!_0x19d6a) continue;
      for (const _0x1bfbbe of _0x19d6a) {
        if (_0x4bb22c.has(_0x1bfbbe)) continue;
        _0x4bb22c.add(_0x1bfbbe);
        const _0x511de8 = _0x252b1f.nodesById?.get?.(_0x1bfbbe);
        if (!_0x511de8 || !intersectsBounds(_0x511de8.bounds, _0x57b541)) continue;
        _0x210b34.push(_0x511de8.node);
      }
    }
  }
  return _0x210b34;
}
export function queryRendererSpatialIndexIds(_0x514a0a, _0x529448) {
  return new Set(queryRendererSpatialIndex(_0x514a0a, _0x529448).map((_0xd97164) => _0xd97164.id));
}
export function clearRendererSpatialIndexCache() {
  ((cachedSpatialIndexSignature = ''), (cachedSpatialIndex = null));
}
export function getCachedRendererSpatialIndex(
  _0x4b3aba,
  { snapshotRev: _0x1ab41e, nodeCount: _0x12a250, denseNodeCount: denseNodeCount = 80 } = {},
) {
  const _0x86a5aa = Number.isFinite(_0x12a250) ? _0x12a250 : Object.keys(_0x4b3aba || {}).length;
  if (_0x86a5aa < denseNodeCount) return (clearRendererSpatialIndexCache(), null);
  const _0x4cde70 = (Number.isFinite(_0x1ab41e) ? _0x1ab41e : 0) + '|' + _0x86a5aa;
  if (cachedSpatialIndex && cachedSpatialIndexSignature === _0x4cde70) return cachedSpatialIndex;
  return (
    (cachedSpatialIndex = createRendererSpatialIndex(_0x4b3aba)),
    (cachedSpatialIndexSignature = _0x4cde70),
    cachedSpatialIndex
  );
}
export function collectVirtualizedRenderNodes({
  nodes: _0x27e76f,
  virtualizationResult: _0x3b0eed,
  spatialIndex: _0x2c2740,
  mountedNodeIds: _0x27488f,
  viewport: _0x2e254f,
  containerWidth: _0x256b8d,
  containerHeight: _0x4021c1,
} = {}) {
  const _0x3a4387 = Object.values(_0x27e76f || {});
  if (!_0x2c2740) return _0x3a4387;
  const _0x2d7e88 = new Set();
  for (const _0x30e8cc of _0x3b0eed?.mountCandidateIds || []) {
    _0x2d7e88.add(_0x30e8cc);
  }
  const _0x2a17a2 = _0x27488f instanceof Set ? _0x27488f : Array.isArray(_0x27488f) ? _0x27488f : [];
  for (const _0x4a044e of _0x2a17a2) {
    _0x2d7e88.add(_0x4a044e);
  }
  const _0x2a0e65 = [];
  for (const _0x33c049 of _0x2d7e88) {
    const _0x18aa25 = _0x27e76f?.[_0x33c049];
    if (_0x18aa25?.id) _0x2a0e65.push(_0x18aa25);
  }
  const _0x17816b = _0x2e254f && Number.isFinite(Number(_0x256b8d)) && Number.isFinite(Number(_0x4021c1));
  if (!_0x17816b || _0x2a0e65.length < 2) return _0x2a0e65;
  const _0xc393ba = getViewportWorldCenter(_0x2e254f, _0x256b8d, _0x4021c1),
    _0x5ee612 = _0x3b0eed?.mountCandidateIds || new Set(),
    _0x258855 = _0x3b0eed?.keepAliveNodeIds || new Set(),
    _0x291187 = new Map(_0x3a4387.map((_0x294cf3, _0x21ebf6) => [String(_0x294cf3?.id || ''), _0x21ebf6]));
  return _0x2a0e65.sort((_0x2ef8f9, _0x4c37ca) => {
    const _0x1aa652 = String(_0x2ef8f9?.id || ''),
      _0x3fee6e = String(_0x4c37ca?.id || ''),
      _0x562e0b = _0x5ee612.has(_0x1aa652),
      _0x5b461c = _0x5ee612.has(_0x3fee6e);
    if (_0x562e0b !== _0x5b461c) return _0x562e0b ? -1 : 1;
    const _0x42cfc0 = _0x258855.has(_0x1aa652),
      _0x44b8ff = _0x258855.has(_0x3fee6e);
    if (_0x42cfc0 !== _0x44b8ff) return _0x42cfc0 ? -1 : 1;
    const _0x43cd5f =
      getNodeDistanceSqToCenter(_0x2ef8f9, _0xc393ba) - getNodeDistanceSqToCenter(_0x4c37ca, _0xc393ba);
    if (_0x43cd5f !== 0) return _0x43cd5f;
    return (_0x291187.get(_0x1aa652) ?? 0) - (_0x291187.get(_0x3fee6e) ?? 0);
  });
}
