export const MANY_EDGES_THRESHOLD = 0x60;
export const EDGE_RENDER_ALL_LOW_ZOOM_THRESHOLD = 0.22;
export const EDGE_RENDER_ALL_MAX_EDGE_COUNT = 0x12c;
const EDGE_VISIBILITY_CELL_SIZE = 0x400,
  MAX_EDGE_VISIBILITY_CELLS = 0x40;
let cachedEdgeVisibilityIndexSignature = '',
  cachedEdgeVisibilityIndexNodes = null,
  cachedEdgeVisibilityIndex = null,
  cachedEdgeGeometrySignatureKey = '',
  cachedEdgeGeometrySignatureNodes = null,
  cachedEdgeGeometrySignature = '';
function formatEdgeSignatureNumber(_0x370572) {
  const _0x4930d3 = Number(_0x370572);
  return Number['isFinite'](_0x4930d3) ? _0x4930d3['toFixed'](0x1) : '0.0';
}
function updateStringHash(_0x59db1c, _0x3c6b60) {
  const _0x579103 = String(_0x3c6b60);
  let _0x1a8b7f = _0x59db1c >>> 0x0;
  for (let _0x5b3f55 = 0x0; _0x5b3f55 < _0x579103['length']; _0x5b3f55 += 0x1) {
    ((_0x1a8b7f ^= _0x579103['charCodeAt'](_0x5b3f55)),
      (_0x1a8b7f = Math['imul'](_0x1a8b7f, 0x1000193) >>> 0x0));
  }
  return _0x1a8b7f;
}
function appendSortedSetSignature(_0x38fa9e, _0x52f891, _0x3ccb43) {
  if (!(_0x3ccb43 instanceof Set) || _0x3ccb43['size'] === 0x0) {
    _0x38fa9e['push'](_0x52f891 + ':');
    return;
  }
  _0x38fa9e['push'](_0x52f891 + ':' + Array['from'](_0x3ccb43)['sort']()['join'](','));
}
function normalizeEdgeLodZoom(_0x33a9c3) {
  const _0x43b73c = Number(_0x33a9c3?.['zoom']);
  return Number['isFinite'](_0x43b73c) && _0x43b73c > 0x0 ? _0x43b73c : 0x1;
}
export function shouldRenderAllEdgesAtLowZoom({
  edgeCount: _0x24d455,
  viewport: _0x5c3aaa,
  maxEdgeCount: maxEdgeCount = EDGE_RENDER_ALL_MAX_EDGE_COUNT,
  lowZoomThreshold: lowZoomThreshold = EDGE_RENDER_ALL_LOW_ZOOM_THRESHOLD,
} = {}) {
  const _0x191d1d = Number(_0x24d455) || 0x0;
  if (_0x191d1d <= 0x0 || _0x191d1d > maxEdgeCount) return ![];
  return normalizeEdgeLodZoom(_0x5c3aaa) <= lowZoomThreshold;
}
function edgeVisibilityCellCoord(_0x49da70, _0x5b93a2 = EDGE_VISIBILITY_CELL_SIZE) {
  return Math['floor']((Number(_0x49da70) || 0x0) / _0x5b93a2);
}
function edgeVisibilityCellKey(_0x1a407e, _0x52a50d) {
  return _0x1a407e + ':' + _0x52a50d;
}
function pushEdgeVisibilityCell(_0x186c84, _0x5137de, _0x530bb1, _0x2da3f2) {
  const _0x5851db = edgeVisibilityCellKey(_0x5137de, _0x530bb1);
  let _0x25429b = _0x186c84['get'](_0x5851db);
  (!_0x25429b && ((_0x25429b = []), _0x186c84['set'](_0x5851db, _0x25429b)), _0x25429b['push'](_0x2da3f2));
}
function intersectsEdgeVisibilityBounds(_0x3942b3, _0x176118) {
  return (
    _0x3942b3['maxX'] > _0x176118['minX'] &&
    _0x3942b3['minX'] < _0x176118['maxX'] &&
    _0x3942b3['maxY'] > _0x176118['minY'] &&
    _0x3942b3['minY'] < _0x176118['maxY']
  );
}
function computeEdgeWorldBounds(_0x32c3f3, _0x1529de) {
  if (!_0x32c3f3?.['id']) return null;
  const _0x41393f = _0x1529de?.[_0x32c3f3['sourceId']],
    _0x540f90 = _0x1529de?.[_0x32c3f3['targetId']];
  if (!_0x41393f || !_0x540f90) return null;
  const _0x1a5141 = Number(_0x41393f['x'] || 0x0),
    _0x2dab93 = Number(_0x41393f['y'] || 0x0),
    _0x33d499 = Number(_0x540f90['x'] || 0x0),
    _0x18f5c4 = Number(_0x540f90['y'] || 0x0),
    _0x39ad4d = _0x1a5141 + Number(_0x41393f['width'] ?? 0x0),
    _0x45f85a = _0x2dab93 + Number(_0x41393f['height'] ?? 0x0) / 0x2,
    _0x507e74 = _0x33d499,
    _0x3f174a = _0x18f5c4 + Number(_0x540f90['height'] ?? 0x0) / 0x2,
    _0x53b25c = Math['max'](Math['abs'](_0x507e74 - _0x39ad4d) * 0.5, 0x3c);
  return {
    minX: Math['min'](_0x39ad4d, _0x507e74, _0x39ad4d + _0x53b25c, _0x507e74 - _0x53b25c),
    maxX: Math['max'](_0x39ad4d, _0x507e74, _0x39ad4d + _0x53b25c, _0x507e74 - _0x53b25c),
    minY: Math['min'](_0x45f85a, _0x3f174a),
    maxY: Math['max'](_0x45f85a, _0x3f174a),
  };
}
export function createEdgeVisibilityIndex(_0xc28903, _0x218afc) {
  const _0x45fe4c = new Map(),
    _0x5cc3a7 = new Set(),
    _0x40fa04 = new Map(),
    _0x3ab1f8 = new Map(),
    _0x37bf16 = new Map();
  let _0xa54a2c = 0x0;
  for (const _0x57bed0 of _0xc28903 || []) {
    const _0x1fd681 = String(_0x57bed0?.['id'] || '')['trim']();
    if (!_0x1fd681) continue;
    const _0x5ec5ab = computeEdgeWorldBounds(_0x57bed0, _0x218afc);
    if (!_0x5ec5ab) continue;
    (_0x40fa04['set'](_0x1fd681, _0x5ec5ab),
      _0x3ab1f8['set'](_0x1fd681, _0x57bed0),
      _0x37bf16['set'](_0x1fd681, _0xa54a2c),
      (_0xa54a2c += 0x1));
    const _0x478e93 = edgeVisibilityCellCoord(_0x5ec5ab['minX']),
      _0x4a4421 = edgeVisibilityCellCoord(_0x5ec5ab['maxX']),
      _0x133825 = edgeVisibilityCellCoord(_0x5ec5ab['minY']),
      _0x378016 = edgeVisibilityCellCoord(_0x5ec5ab['maxY']);
    if ((_0x4a4421 - _0x478e93 + 0x1) * (_0x378016 - _0x133825 + 0x1) > MAX_EDGE_VISIBILITY_CELLS) {
      _0x5cc3a7['add'](_0x1fd681);
      continue;
    }
    for (let _0x4e0ff0 = _0x478e93; _0x4e0ff0 <= _0x4a4421; _0x4e0ff0 += 0x1) {
      for (let _0x546616 = _0x133825; _0x546616 <= _0x378016; _0x546616 += 0x1) {
        pushEdgeVisibilityCell(_0x45fe4c, _0x4e0ff0, _0x546616, _0x1fd681);
      }
    }
  }
  return {
    cellSize: EDGE_VISIBILITY_CELL_SIZE,
    cells: _0x45fe4c,
    spanningEdgeIds: _0x5cc3a7,
    edgeBounds: _0x40fa04,
    edgesById: _0x3ab1f8,
    edgeOrder: _0x37bf16,
    edgeCount: _0x37bf16['size'],
  };
}
export function clearCachedEdgeVisibilityIndex() {
  ((cachedEdgeVisibilityIndexSignature = ''),
    (cachedEdgeVisibilityIndexNodes = null),
    (cachedEdgeVisibilityIndex = null),
    (cachedEdgeGeometrySignatureKey = ''),
    (cachedEdgeGeometrySignatureNodes = null),
    (cachedEdgeGeometrySignature = ''));
}
export function getCachedEdgeGeometrySignature(
  _0x188732,
  _0x3e3031,
  { edgesRev: edgesRev = 0x0, geometryRev: geometryRev = 0x0 } = {},
) {
  const _0x31e8fa = Array['isArray'](_0x188732) ? _0x188732['length'] : 0x0,
    _0x1f3071 =
      _0x31e8fa +
      ':' +
      (Number['isFinite'](edgesRev) ? edgesRev : 0x0) +
      ':' +
      (Number['isFinite'](geometryRev) ? geometryRev : 0x0);
  if (
    cachedEdgeGeometrySignature &&
    cachedEdgeGeometrySignatureKey === _0x1f3071 &&
    cachedEdgeGeometrySignatureNodes === _0x3e3031
  )
    return cachedEdgeGeometrySignature;
  const _0x32eae9 = Number['isFinite'](edgesRev) ? edgesRev : 0x0,
    _0x4a253a = Number['isFinite'](geometryRev) ? geometryRev : 0x0;
  let _0x3e4a92 = 0x811c9dc5;
  _0x3e4a92 = updateStringHash(_0x3e4a92, 'geom:' + _0x31e8fa + ':' + _0x32eae9 + ':' + _0x4a253a);
  for (const _0x33150a of _0x188732 || []) {
    if (!_0x33150a?.['id']) continue;
    const _0x57ef71 = _0x3e3031?.[_0x33150a['sourceId']],
      _0x5db5ff = _0x3e3031?.[_0x33150a['targetId']];
    if (!_0x57ef71 || !_0x5db5ff) {
      _0x3e4a92 = updateStringHash(
        _0x3e4a92,
        'e:' +
          _0x33150a['id'] +
          ':' +
          (_0x33150a['sourceId'] || '') +
          ':' +
          (_0x33150a['targetId'] || '') +
          ':missing',
      );
      continue;
    }
    const _0xbfc26a = Number(_0x57ef71['x'] || 0x0) + Number(_0x57ef71['width'] ?? 0x0),
      _0x548c2c = Number(_0x57ef71['y'] || 0x0) + Number(_0x57ef71['height'] ?? 0x0) / 0x2,
      _0x145ef8 = Number(_0x5db5ff['x'] || 0x0),
      _0x3ac210 = Number(_0x5db5ff['y'] || 0x0) + Number(_0x5db5ff['height'] ?? 0x0) / 0x2;
    _0x3e4a92 = updateStringHash(
      _0x3e4a92,
      'e:' +
        _0x33150a['id'] +
        ':' +
        (_0x33150a['sourceId'] || '') +
        ':' +
        (_0x33150a['targetId'] || '') +
        ':' +
        formatEdgeSignatureNumber(_0xbfc26a) +
        ':' +
        formatEdgeSignatureNumber(_0x548c2c) +
        ':' +
        formatEdgeSignatureNumber(_0x145ef8) +
        ':' +
        formatEdgeSignatureNumber(_0x3ac210),
    );
  }
  return (
    (cachedEdgeGeometrySignatureKey = _0x1f3071),
    (cachedEdgeGeometrySignatureNodes = _0x3e3031 || null),
    (cachedEdgeGeometrySignature =
      'geom:' + _0x31e8fa + ':' + _0x32eae9 + ':' + _0x4a253a + ':' + _0x3e4a92['toString'](0x24)),
    cachedEdgeGeometrySignature
  );
}
export function getCachedEdgeVisibilityIndex(
  _0x229e21,
  _0x4c0897,
  {
    edgesRev: edgesRev = 0x0,
    geometryRev: geometryRev = 0x0,
    threshold: threshold = MANY_EDGES_THRESHOLD,
    geometrySignature: geometrySignature = '',
  } = {},
) {
  const _0x278e54 = Array['isArray'](_0x229e21) ? _0x229e21['length'] : 0x0;
  if (_0x278e54 < threshold) return (clearCachedEdgeVisibilityIndex(), null);
  const _0x4acdde =
      typeof geometrySignature === 'string' && geometrySignature
        ? geometrySignature
        : String(Number['isFinite'](geometryRev) ? geometryRev : 0x0),
    _0x13c24d = _0x278e54 + ':' + (Number['isFinite'](edgesRev) ? edgesRev : 0x0) + ':' + _0x4acdde;
  if (
    cachedEdgeVisibilityIndex &&
    cachedEdgeVisibilityIndexSignature === _0x13c24d &&
    cachedEdgeVisibilityIndexNodes === _0x4c0897
  )
    return cachedEdgeVisibilityIndex;
  return (
    (cachedEdgeVisibilityIndex = createEdgeVisibilityIndex(_0x229e21, _0x4c0897)),
    (cachedEdgeVisibilityIndexSignature = _0x13c24d),
    (cachedEdgeVisibilityIndexNodes = _0x4c0897 || null),
    cachedEdgeVisibilityIndex
  );
}
export function queryEdgeVisibilityIndex(_0x2aa71d, _0x5aeb93) {
  if (!_0x2aa71d || !_0x5aeb93 || !(_0x2aa71d['cells'] instanceof Map)) return [];
  const _0x159d5f = edgeVisibilityCellCoord(_0x5aeb93['minX'], _0x2aa71d['cellSize']),
    _0xb67140 = edgeVisibilityCellCoord(_0x5aeb93['maxX'], _0x2aa71d['cellSize']),
    _0x511a18 = edgeVisibilityCellCoord(_0x5aeb93['minY'], _0x2aa71d['cellSize']),
    _0x2dfeb0 = edgeVisibilityCellCoord(_0x5aeb93['maxY'], _0x2aa71d['cellSize']),
    _0x21cb15 = new Set(),
    _0x5ab00a = (_0xfc4322) => {
      if (_0x21cb15['has'](_0xfc4322)) return;
      const _0x581e66 = _0x2aa71d['edgeBounds']?.['get']?.(_0xfc4322);
      if (_0x581e66 && intersectsEdgeVisibilityBounds(_0x581e66, _0x5aeb93)) _0x21cb15['add'](_0xfc4322);
    },
    _0x4a07dc = (_0xb67140 - _0x159d5f + 0x1) * (_0x2dfeb0 - _0x511a18 + 0x1);
  if (_0x4a07dc > Math['max'](MAX_EDGE_VISIBILITY_CELLS, _0x2aa71d['cells']['size'])) {
    for (const _0x50ffc2 of _0x2aa71d['edgeBounds']['keys']()) _0x5ab00a(_0x50ffc2);
  } else {
    for (const _0x22ec75 of _0x2aa71d['spanningEdgeIds'] || []) _0x5ab00a(_0x22ec75);
    for (let _0x555c49 = _0x159d5f; _0x555c49 <= _0xb67140; _0x555c49 += 0x1) {
      for (let _0x3890e8 = _0x511a18; _0x3890e8 <= _0x2dfeb0; _0x3890e8 += 0x1) {
        const _0x24706e = _0x2aa71d['cells']['get'](edgeVisibilityCellKey(_0x555c49, _0x3890e8));
        if (!_0x24706e || _0x24706e['length'] === 0x0) continue;
        for (const _0x2be50b of _0x24706e) _0x5ab00a(_0x2be50b);
      }
    }
  }
  return Array['from'](_0x21cb15)['sort']((_0x240729, _0x534d25) => {
    const _0x5a5a65 = _0x2aa71d['edgeOrder']?.['get']?.(_0x240729) ?? Infinity,
      _0x4c8cca = _0x2aa71d['edgeOrder']?.['get']?.(_0x534d25) ?? Infinity;
    return _0x5a5a65 - _0x4c8cca;
  });
}
export function buildFullEdgeRenderSignature({
  edgeEntries: _0x19a4db,
  nodes: _0x3b9ed7,
  viewport: _0x45dce3,
  dragOffsetCtx: _0x566b71,
  relatedEdgeIds: _0x35409e,
  containerW: _0x4cee8e,
  containerH: _0x186f83,
  edgesRev: edgesRev = 0x0,
  geometryRev: geometryRev = 0x0,
  threshold: threshold = MANY_EDGES_THRESHOLD,
  geometrySignature: geometrySignature = '',
  edgePathStyle: edgePathStyle = 'curve',
}) {
  const _0x24fecc = _0x45dce3 || { x: 0x0, y: 0x0, zoom: 0x1 },
    _0x4e6b0a = _0x566b71?.['movedNodeIds'] instanceof Set ? _0x566b71['movedNodeIds'] : null,
    _0x289157 = Number['isFinite'](_0x566b71?.['dx']) ? _0x566b71['dx'] : 0x0,
    _0x151a7a = Number['isFinite'](_0x566b71?.['dy']) ? _0x566b71['dy'] : 0x0,
    _0x3ef2dc = Array['isArray'](_0x19a4db) ? _0x19a4db['length'] : 0x0,
    _0x3fd44f = (_0x4e6b0a && _0x4e6b0a['size'] > 0x0) || _0x289157 !== 0x0 || _0x151a7a !== 0x0,
    _0x142a44 = [
      'edge-full',
      'vp:' +
        formatEdgeSignatureNumber(_0x24fecc['x']) +
        ':' +
        formatEdgeSignatureNumber(_0x24fecc['y']) +
        ':' +
        formatEdgeSignatureNumber(_0x24fecc['zoom'] || 0x1),
      'box:' + formatEdgeSignatureNumber(_0x4cee8e) + ':' + formatEdgeSignatureNumber(_0x186f83),
      'drag:' + formatEdgeSignatureNumber(_0x289157) + ':' + formatEdgeSignatureNumber(_0x151a7a),
      'path:' + String(edgePathStyle || 'curve'),
    ];
  (appendSortedSetSignature(_0x142a44, 'dragIds', _0x4e6b0a),
    appendSortedSetSignature(_0x142a44, 'highlight', _0x35409e));
  if (_0x3ef2dc >= threshold && !_0x3fd44f) {
    const _0x4f209b =
      typeof geometrySignature === 'string' && geometrySignature
        ? geometrySignature
        : getCachedEdgeGeometrySignature(_0x19a4db, _0x3b9ed7, {
            edgesRev: edgesRev,
            geometryRev: geometryRev,
          });
    return (
      _0x142a44['push'](
        'compact:' + _0x3ef2dc + ':' + (Number['isFinite'](edgesRev) ? edgesRev : 0x0) + ':' + _0x4f209b,
      ),
      _0x142a44['join']('|')
    );
  }
  for (const _0x398d08 of _0x19a4db || []) {
    if (!_0x398d08?.['id']) continue;
    const _0x1919f2 = _0x3b9ed7?.[_0x398d08['sourceId']],
      _0x22a9dc = _0x3b9ed7?.[_0x398d08['targetId']];
    if (!_0x1919f2 || !_0x22a9dc) {
      _0x142a44['push'](
        'e:' +
          _0x398d08['id'] +
          ':' +
          (_0x398d08['sourceId'] || '') +
          ':' +
          (_0x398d08['targetId'] || '') +
          ':missing',
      );
      continue;
    }
    const _0xb8c782 = _0x4e6b0a && _0x4e6b0a['has'](_0x398d08['sourceId']) ? _0x289157 : 0x0,
      _0xe99414 = _0x4e6b0a && _0x4e6b0a['has'](_0x398d08['sourceId']) ? _0x151a7a : 0x0,
      _0xed383d = _0x4e6b0a && _0x4e6b0a['has'](_0x398d08['targetId']) ? _0x289157 : 0x0,
      _0xfbb3a3 = _0x4e6b0a && _0x4e6b0a['has'](_0x398d08['targetId']) ? _0x151a7a : 0x0,
      _0x59aea7 = Number(_0x1919f2['x'] || 0x0) + _0xb8c782,
      _0x2772e8 = Number(_0x1919f2['y'] || 0x0) + _0xe99414,
      _0x220a8f = Number(_0x22a9dc['x'] || 0x0) + _0xed383d,
      _0x475537 = Number(_0x22a9dc['y'] || 0x0) + _0xfbb3a3,
      _0x5e92f3 = _0x59aea7 + Number(_0x1919f2['width'] ?? 0x0),
      _0x96c1c3 = _0x2772e8 + Number(_0x1919f2['height'] ?? 0x0) / 0x2,
      _0x4997f1 = _0x220a8f,
      _0x55dcb0 = _0x475537 + Number(_0x22a9dc['height'] ?? 0x0) / 0x2;
    _0x142a44['push'](
      'e:' +
        _0x398d08['id'] +
        ':' +
        (_0x398d08['sourceId'] || '') +
        ':' +
        (_0x398d08['targetId'] || '') +
        ':' +
        formatEdgeSignatureNumber(_0x5e92f3) +
        ':' +
        formatEdgeSignatureNumber(_0x96c1c3) +
        ':' +
        formatEdgeSignatureNumber(_0x4997f1) +
        ':' +
        formatEdgeSignatureNumber(_0x55dcb0),
    );
  }
  return _0x142a44['join']('|');
}
