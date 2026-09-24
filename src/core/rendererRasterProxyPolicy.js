function toIdSet(_0x1bcfe1) {
  if (_0x1bcfe1 instanceof Set) return new Set(_0x1bcfe1);
  if (Array['isArray'](_0x1bcfe1)) return new Set(_0x1bcfe1);
  return new Set();
}
function createNodeAccessor(_0x288fb4) {
  if (_0x288fb4 instanceof Map) return (_0x1338b3) => _0x288fb4['get'](_0x1338b3);
  if (Array['isArray'](_0x288fb4)) {
    let _0x8ecde4 = null;
    return (_0x2715c7) => {
      if (!_0x8ecde4) {
        _0x8ecde4 = new Map();
        for (const _0x1fc6dc of _0x288fb4) {
          if (!_0x1fc6dc || typeof _0x1fc6dc !== 'object') continue;
          const _0x2421c8 = _0x1fc6dc['id'];
          if (_0x2421c8 == null || _0x2421c8 === '') continue;
          _0x8ecde4['set'](_0x2421c8, _0x1fc6dc);
        }
      }
      return _0x8ecde4['get'](_0x2715c7);
    };
  }
  if (_0x288fb4 && typeof _0x288fb4 === 'object')
    return (_0x4a4c05) => {
      if (!Object['prototype']['hasOwnProperty']['call'](_0x288fb4, _0x4a4c05)) return undefined;
      const _0x48c639 = _0x288fb4[_0x4a4c05];
      return _0x48c639 && typeof _0x48c639 === 'object' ? _0x48c639 : undefined;
    };
  return () => undefined;
}
function clampUnit(_0x4c4ecb) {
  const _0x54bfae = Number(_0x4c4ecb);
  if (!Number['isFinite'](_0x54bfae)) return 0x0;
  return Math['max'](0x0, Math['min'](0x1, _0x54bfae));
}
function smoothstep(_0x58617e, _0x23680c, _0x38400b) {
  if (_0x38400b <= _0x58617e) return 0x0;
  if (_0x38400b >= _0x23680c) return 0x1;
  const _0x17c364 = (_0x38400b - _0x58617e) / (_0x23680c - _0x58617e);
  return _0x17c364 * _0x17c364 * (0x3 - 0x2 * _0x17c364);
}
const DENSE_RASTER_FULL_STRENGTH_ZOOM = 0.4,
  DENSE_RASTER_EXIT_ZOOM = 0.55;
export function calculateDenseLowZoomRasterStrength(_0x17113a, _0x2a5c69) {
  const _0x243fff = clampUnit(_0x17113a),
    _0x2f5c8a = Number(_0x2a5c69?.['zoom']),
    _0x4f42d8 = Number['isFinite'](_0x2f5c8a) && _0x2f5c8a > 0x0 ? _0x2f5c8a : 0x1,
    _0x7b1d77 = 0x1 - smoothstep(DENSE_RASTER_FULL_STRENGTH_ZOOM, DENSE_RASTER_EXIT_ZOOM, _0x4f42d8);
  return _0x243fff * _0x7b1d77;
}
function addId(_0x50390f, _0x53b4db) {
  if (_0x53b4db != null && _0x53b4db !== '') _0x50390f['add'](_0x53b4db);
}
function addIds(_0x5582d3, _0x2212c8) {
  for (const _0x1d7394 of toIdSet(_0x2212c8)) addId(_0x5582d3, _0x1d7394);
}
function collectDomRequiredIds({
  selectedNodeIds: _0x32452d,
  hoveredNodeIds: _0x12741e,
  hoverNodeId: _0xf1210f,
  dragNodeIds: _0x47382e,
  dragTargets: _0x34323f,
  connectingNodeIds: _0x2a1a26,
  connOverlay: _0x393c63,
  pickNodeIds: _0x5cbc7e,
  pickConnectMode: _0x45b495,
  activeMediaNodeIds: _0x30e19a,
  activeNodeIds: _0x4f4941,
  domRequiredNodeIds: _0x3e1416,
} = {}) {
  const _0x4118a1 = new Set();
  return (
    [_0x32452d, _0x12741e, _0x47382e, _0x34323f, _0x2a1a26, _0x5cbc7e, _0x30e19a, _0x4f4941, _0x3e1416][
      'forEach'
    ]((_0x383796) => addIds(_0x4118a1, _0x383796)),
    addId(_0x4118a1, _0xf1210f),
    addId(_0x4118a1, _0x393c63?.['srcId']),
    addId(_0x4118a1, _0x393c63?.['hoverId']),
    addIds(_0x4118a1, _0x393c63?.['activeNodeIds']),
    _0x45b495?.['active'] === !![] &&
      (addId(_0x4118a1, _0x45b495['sourceNodeId']),
      addId(_0x4118a1, _0x45b495['srcId']),
      addId(_0x4118a1, _0x45b495['hoverNodeId']),
      addId(_0x4118a1, _0x45b495['hoverId']),
      addIds(_0x4118a1, _0x45b495['activeNodeIds'])),
    _0x4118a1
  );
}
function isRasterSupported(_0x47a7b1, _0x42bb2d, _0x2a01a0, _0x22b7c8) {
  if (_0x2a01a0['has'](_0x47a7b1)) return !![];
  const _0x11947a = String(_0x42bb2d?.['type'] || '')
    ['trim']()
    ['toLowerCase']();
  return !!_0x11947a && _0x22b7c8['has'](_0x11947a);
}
function getProjectedMetrics(_0x255ac5, _0x5c3168, _0x58dabf) {
  const _0x40002e = Math['max'](0x1, Number(_0x255ac5?.['width']) || 0xa0) * _0x5c3168,
    _0x5c0056 = Math['max'](0x1, Number(_0x255ac5?.['height']) || 0x78) * _0x5c3168,
    _0x4f80e4 = _0x40002e * _0x5c0056,
    _0x43d1cc = 0xbb8 + (0x1f40 - 0xbb8) * _0x58dabf,
    _0x3a13f5 = 0x36b0 + (0x9c40 - 0x36b0) * _0x58dabf;
  return { area: _0x4f80e4, compactness: 0x1 - smoothstep(_0x43d1cc, _0x3a13f5, _0x4f80e4) };
}
function buildCoverageSignature(_0x3555ca, _0x4618e8, _0x364824) {
  const _0x3541aa = (_0x1b138a) => [..._0x1b138a]['map'](String)['sort']();
  return ['full', ..._0x3541aa(_0x3555ca), 'raster', ..._0x3541aa(_0x4618e8), 'dom', ..._0x3541aa(_0x364824)][
    'join'
  ]('\x1f');
}
export function planRendererRasterProxies({
  nodes: nodes = [],
  fullSurfaceIds: _0x5f159b,
  proxySurfaceIds: _0x53f94a,
  exactVisibleIds: _0x222056,
  rasterSupportedNodeIds: _0x4aef7b,
  rasterSupportedNodeTypes: _0x43d985,
  previousRasterIds: _0x4b8ee7,
  viewport: _0x332869,
  scenePressure: scenePressure = 0x0,
  ..._0x3073b2
} = {}) {
  const _0xcc87cc = createNodeAccessor(nodes),
    _0x59d001 = toIdSet(_0x5f159b),
    _0x25d363 = new Set([...toIdSet(_0x53f94a)]['filter']((_0xcc888b) => !_0x59d001['has'](_0xcc888b))),
    _0x4ee0b5 = toIdSet(_0x222056),
    _0x849ca5 = toIdSet(_0x4aef7b),
    _0x331282 = new Set(
      [...toIdSet(_0x43d985)]['map']((_0x371be5) =>
        String(_0x371be5 || '')
          ['trim']()
          ['toLowerCase'](),
      ),
    ),
    _0x517ed3 = toIdSet(_0x4b8ee7),
    _0x4d18eb = collectDomRequiredIds(_0x3073b2),
    _0x2c567f = new Set(),
    _0xb939d0 = new Set(),
    _0x5bf69d = [];
  let _0x1c32e7 = 0x0,
    _0xae145d = 0x0,
    _0x216474 = 0x0;
  const _0xcfc2a5 = Number(_0x332869?.['zoom']),
    _0x2e5a09 = Number['isFinite'](_0xcfc2a5) && _0xcfc2a5 > 0x0 ? _0xcfc2a5 : 0x1,
    _0x5a6949 = clampUnit(scenePressure),
    _0x34104d = calculateDenseLowZoomRasterStrength(_0x5a6949, _0x332869);
  for (const _0x341e50 of _0x25d363) {
    if (_0x4d18eb['has'](_0x341e50)) {
      (_0xb939d0['add'](_0x341e50), (_0x1c32e7 += 0x1));
      continue;
    }
    const _0x3c0077 = _0xcc87cc(_0x341e50);
    if (!isRasterSupported(_0x341e50, _0x3c0077, _0x849ca5, _0x331282)) {
      (_0xb939d0['add'](_0x341e50), (_0xae145d += 0x1));
      continue;
    }
    const _0x5d709b = getProjectedMetrics(_0x3c0077, _0x2e5a09, _0x34104d);
    if (_0x5d709b['compactness'] < 0.2) {
      (_0xb939d0['add'](_0x341e50), (_0x216474 += 0x1));
      continue;
    }
    _0x5bf69d['push']({
      id: _0x341e50,
      ..._0x5d709b,
      exactVisible: _0x4ee0b5['has'](_0x341e50),
      retained: _0x517ed3['has'](_0x341e50),
    });
  }
  const _0xe20e32 = smoothstep(0xc, 0x48, _0x25d363['size']),
    _0x519743 = 0x1 - (0x1 - _0x5a6949) * (0x1 - _0xe20e32),
    _0xc8606e =
      _0x5bf69d['length'] > 0x0
        ? _0x5bf69d['reduce']((_0x8a2d0a, _0x53f94c) => _0x8a2d0a + _0x53f94c['compactness'], 0x0) /
          _0x5bf69d['length']
        : 0x0,
    _0x50d7d9 = _0x519743 * _0xc8606e,
    _0x183fd9 = smoothstep(0.32, 0.78, _0x50d7d9),
    _0x460a90 = _0x517ed3['size'] > 0x0 ? 0.24 : 0.32,
    _0x194ccd = Math['min'](_0x5bf69d['length'], _0x50d7d9 >= _0x460a90 ? _0x5bf69d['length'] : 0x0);
  _0x5bf69d['sort']((_0x1ac6ff, _0x33aa32) => {
    const _0x2b9a1f = Number(!_0x1ac6ff['exactVisible']) - Number(!_0x33aa32['exactVisible']);
    if (_0x2b9a1f !== 0x0) return _0x2b9a1f;
    const _0x4a53c9 = _0x1ac6ff['compactness'] + (_0x1ac6ff['retained'] ? 0.08 : 0x0),
      _0x3f1c2b = _0x33aa32['compactness'] + (_0x33aa32['retained'] ? 0.08 : 0x0);
    if (_0x4a53c9 !== _0x3f1c2b) return _0x3f1c2b - _0x4a53c9;
    if (_0x1ac6ff['area'] !== _0x33aa32['area']) return _0x1ac6ff['area'] - _0x33aa32['area'];
    return String(_0x1ac6ff['id'])['localeCompare'](String(_0x33aa32['id']));
  });
  for (const _0x4c8451 of _0x5bf69d['slice'](0x0, _0x194ccd)) {
    _0x2c567f['add'](_0x4c8451['id']);
  }
  for (const _0x2f994d of _0x5bf69d['slice'](_0x194ccd)) {
    _0xb939d0['add'](_0x2f994d['id']);
  }
  let _0x4eeacc = 'mixed-raster-dom';
  if (_0x25d363['size'] === 0x0) _0x4eeacc = 'no-proxy-candidates';
  else {
    if (_0x5bf69d['length'] === 0x0) _0x4eeacc = 'dom-required-only';
    else {
      if (_0x2c567f['size'] === 0x0) _0x4eeacc = 'below-raster-load';
      else _0xb939d0['size'] === 0x0 && (_0x4eeacc = 'rasterized-all-proxies');
    }
  }
  let _0x5cb176 = 0x0;
  for (const _0x48967a of _0x4ee0b5) {
    (_0x59d001['has'](_0x48967a) || _0x2c567f['has'](_0x48967a) || _0xb939d0['has'](_0x48967a)) &&
      (_0x5cb176 += 0x1);
  }
  const _0x5e7758 = buildCoverageSignature(_0x59d001, _0x2c567f, _0xb939d0);
  return {
    active: _0x2c567f['size'] > 0x0,
    rasterIds: _0x2c567f,
    domProxyIds: _0xb939d0,
    reason: _0x4eeacc,
    signature: _0x5e7758,
    coverageSignature: _0x5e7758,
    stats: {
      scenePressure: _0x5a6949,
      denseRasterStrength: _0x34104d,
      proxyPressure: _0xe20e32,
      activationSignal: _0x50d7d9,
      activationFloor: _0x460a90,
      rasterShare: _0x183fd9,
      proxyCount: _0x25d363['size'],
      rasterCandidateCount: _0x5bf69d['length'],
      rasterCount: _0x2c567f['size'],
      domProxyCount: _0xb939d0['size'],
      interactiveDomCount: _0x1c32e7,
      unsupportedDomCount: _0xae145d,
      projectedDomCount: _0x216474,
      exactVisibleCount: _0x4ee0b5['size'],
      exactVisibleCoveredCount: _0x5cb176,
      exactVisibleMissingCount: _0x4ee0b5['size'] - _0x5cb176,
    },
  };
}
