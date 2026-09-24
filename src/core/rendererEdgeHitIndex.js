const DEFAULT_CELL_SIZE = 0x100,
  DEFAULT_SUBDIVISION_FLATNESS = 0x8,
  DEFAULT_MAX_SUBDIVISION_DEPTH = 0x8,
  DEFAULT_DISTANCE_SAMPLES = 0x20,
  DEFAULT_DISTANCE_REFINEMENTS = 0xe;
function normalizeNumber(_0x21e388, _0x25239d = 0x0) {
  const _0x4950a7 = Number(_0x21e388);
  return Number['isFinite'](_0x4950a7) ? _0x4950a7 : _0x25239d;
}
function normalizeGeometry(_0x5df6b5) {
  if (!_0x5df6b5) return null;
  const _0x1c7aad = Array['isArray'](_0x5df6b5['hitPoints'])
    ? _0x5df6b5['hitPoints']
        ['map']((_0x500c85) => ({
          x: normalizeNumber(_0x500c85?.['x'], Number['NaN']),
          y: normalizeNumber(_0x500c85?.['y'], Number['NaN']),
        }))
        ['filter']((_0x4f2d20) => Number['isFinite'](_0x4f2d20['x']) && Number['isFinite'](_0x4f2d20['y']))
    : null;
  return {
    pathStyle: String(_0x5df6b5['pathStyle'] || 'curve'),
    startX: normalizeNumber(_0x5df6b5['startX']),
    startY: normalizeNumber(_0x5df6b5['startY']),
    control1X: normalizeNumber(_0x5df6b5['control1X']),
    control1Y: normalizeNumber(_0x5df6b5['control1Y']),
    control2X: normalizeNumber(_0x5df6b5['control2X']),
    control2Y: normalizeNumber(_0x5df6b5['control2Y']),
    endX: normalizeNumber(_0x5df6b5['endX']),
    endY: normalizeNumber(_0x5df6b5['endY']),
    hitPoints: _0x1c7aad && _0x1c7aad['length'] >= 0x2 ? _0x1c7aad : null,
  };
}
export function evaluateCubicBezier(_0x228092, _0x56874b) {
  const _0x267537 = normalizeGeometry(_0x228092);
  if (!_0x267537) return null;
  const _0x535a62 = Math['min'](0x1, Math['max'](0x0, normalizeNumber(_0x56874b))),
    _0xd5a05e = 0x1 - _0x535a62,
    _0x9af4b3 = _0xd5a05e * _0xd5a05e,
    _0x35aa9d = _0x535a62 * _0x535a62;
  return {
    x:
      _0x9af4b3 * _0xd5a05e * _0x267537['startX'] +
      0x3 * _0x9af4b3 * _0x535a62 * _0x267537['control1X'] +
      0x3 * _0xd5a05e * _0x35aa9d * _0x267537['control2X'] +
      _0x35aa9d * _0x535a62 * _0x267537['endX'],
    y:
      _0x9af4b3 * _0xd5a05e * _0x267537['startY'] +
      0x3 * _0x9af4b3 * _0x535a62 * _0x267537['control1Y'] +
      0x3 * _0xd5a05e * _0x35aa9d * _0x267537['control2Y'] +
      _0x35aa9d * _0x535a62 * _0x267537['endY'],
  };
}
function distanceSquaredAt(_0x4dd772, _0x266dac, _0x2da88f, _0x42b61f) {
  const _0x105b3b = evaluateCubicBezier(_0x4dd772, _0x42b61f);
  if (!_0x105b3b) return Number['POSITIVE_INFINITY'];
  const _0x4f4040 = _0x105b3b['x'] - _0x266dac,
    _0x2e6909 = _0x105b3b['y'] - _0x2da88f;
  return _0x4f4040 * _0x4f4040 + _0x2e6909 * _0x2e6909;
}
export function distanceToCubicBezierSquared(
  _0x446554,
  _0x194cdb,
  _0x499583,
  {
    samples: samples = DEFAULT_DISTANCE_SAMPLES,
    refinements: refinements = DEFAULT_DISTANCE_REFINEMENTS,
  } = {},
) {
  const _0xaad6ea = normalizeNumber(_0x194cdb),
    _0x5881ae = normalizeNumber(_0x499583),
    _0x598c83 = Math['max'](0x8, Math['floor'](normalizeNumber(samples, 0x20)));
  let _0x20b03c = 0x0,
    _0x519d14 = Number['POSITIVE_INFINITY'];
  for (let _0x74234a = 0x0; _0x74234a <= _0x598c83; _0x74234a += 0x1) {
    const _0x3de3af = distanceSquaredAt(_0x446554, _0xaad6ea, _0x5881ae, _0x74234a / _0x598c83);
    _0x3de3af < _0x519d14 && ((_0x519d14 = _0x3de3af), (_0x20b03c = _0x74234a));
  }
  let _0x514413 = Math['max'](0x0, (_0x20b03c - 0x1) / _0x598c83),
    _0x1d470f = Math['min'](0x1, (_0x20b03c + 0x1) / _0x598c83);
  const _0x2a5527 = Math['max'](
    0x0,
    Math['floor'](normalizeNumber(refinements, DEFAULT_DISTANCE_REFINEMENTS)),
  );
  for (let _0x326a4b = 0x0; _0x326a4b < _0x2a5527; _0x326a4b += 0x1) {
    const _0x132260 = _0x514413 + (_0x1d470f - _0x514413) / 0x3,
      _0x4e6881 = _0x1d470f - (_0x1d470f - _0x514413) / 0x3;
    distanceSquaredAt(_0x446554, _0xaad6ea, _0x5881ae, _0x132260) <=
    distanceSquaredAt(_0x446554, _0xaad6ea, _0x5881ae, _0x4e6881)
      ? (_0x1d470f = _0x4e6881)
      : (_0x514413 = _0x132260);
  }
  return Math['min'](
    _0x519d14,
    distanceSquaredAt(_0x446554, _0xaad6ea, _0x5881ae, (_0x514413 + _0x1d470f) / 0x2),
  );
}
function pointLineDistanceSquared(_0x1751b3, _0x8ee851, _0x20474c, _0x1b7e45, _0x1047e7, _0x189032) {
  const _0x285db8 = _0x1047e7 - _0x20474c,
    _0x376c5b = _0x189032 - _0x1b7e45,
    _0x1f11eb = _0x285db8 * _0x285db8 + _0x376c5b * _0x376c5b;
  if (_0x1f11eb <= Number['EPSILON']) {
    const _0x20e6d8 = _0x1751b3 - _0x20474c,
      _0x3250af = _0x8ee851 - _0x1b7e45;
    return _0x20e6d8 * _0x20e6d8 + _0x3250af * _0x3250af;
  }
  const _0x34ccf6 =
    _0x376c5b * _0x1751b3 - _0x285db8 * _0x8ee851 + _0x1047e7 * _0x1b7e45 - _0x189032 * _0x20474c;
  return (_0x34ccf6 * _0x34ccf6) / _0x1f11eb;
}
function pointSegmentDistanceSquared(_0xc82f17, _0xdedc15, _0xddc98c, _0x441e39, _0x3a5f22, _0xc0caca) {
  const _0x2f7402 = _0x3a5f22 - _0xddc98c,
    _0x51a8cd = _0xc0caca - _0x441e39,
    _0x21fa3c = _0x2f7402 * _0x2f7402 + _0x51a8cd * _0x51a8cd;
  if (_0x21fa3c <= Number['EPSILON']) {
    const _0x28ffd9 = _0xc82f17 - _0xddc98c,
      _0x3164ec = _0xdedc15 - _0x441e39;
    return _0x28ffd9 * _0x28ffd9 + _0x3164ec * _0x3164ec;
  }
  const _0x4dfe1c = Math['max'](
      0x0,
      Math['min'](
        0x1,
        ((_0xc82f17 - _0xddc98c) * _0x2f7402 + (_0xdedc15 - _0x441e39) * _0x51a8cd) / _0x21fa3c,
      ),
    ),
    _0x2de274 = _0xddc98c + _0x4dfe1c * _0x2f7402,
    _0x1a0350 = _0x441e39 + _0x4dfe1c * _0x51a8cd,
    _0x1b04ad = _0xc82f17 - _0x2de274,
    _0x3dd814 = _0xdedc15 - _0x1a0350;
  return _0x1b04ad * _0x1b04ad + _0x3dd814 * _0x3dd814;
}
export function distanceToPolylineSquared(_0x13f582, _0x52145d, _0x4bd10e) {
  if (!Array['isArray'](_0x13f582) || _0x13f582['length'] < 0x2) return Number['POSITIVE_INFINITY'];
  const _0x5f4918 = normalizeNumber(_0x52145d),
    _0x24228f = normalizeNumber(_0x4bd10e);
  let _0x4f3060 = Number['POSITIVE_INFINITY'];
  for (let _0x1af055 = 0x1; _0x1af055 < _0x13f582['length']; _0x1af055 += 0x1) {
    const _0x4a21c3 = _0x13f582[_0x1af055 - 0x1],
      _0x3528d9 = _0x13f582[_0x1af055];
    _0x4f3060 = Math['min'](
      _0x4f3060,
      pointSegmentDistanceSquared(
        _0x5f4918,
        _0x24228f,
        normalizeNumber(_0x4a21c3?.['x']),
        normalizeNumber(_0x4a21c3?.['y']),
        normalizeNumber(_0x3528d9?.['x']),
        normalizeNumber(_0x3528d9?.['y']),
      ),
    );
  }
  return _0x4f3060;
}
function getCurveFlatnessSquared(_0x408068) {
  return Math['max'](
    pointLineDistanceSquared(
      _0x408068['control1X'],
      _0x408068['control1Y'],
      _0x408068['startX'],
      _0x408068['startY'],
      _0x408068['endX'],
      _0x408068['endY'],
    ),
    pointLineDistanceSquared(
      _0x408068['control2X'],
      _0x408068['control2Y'],
      _0x408068['startX'],
      _0x408068['startY'],
      _0x408068['endX'],
      _0x408068['endY'],
    ),
  );
}
function midpoint(_0x156a40, _0x112a19) {
  return (_0x156a40 + _0x112a19) / 0x2;
}
function subdivideCurve(_0x2046da) {
  const _0xc194d9 = midpoint(_0x2046da['startX'], _0x2046da['control1X']),
    _0x558ee5 = midpoint(_0x2046da['startY'], _0x2046da['control1Y']),
    _0x1b87f3 = midpoint(_0x2046da['control1X'], _0x2046da['control2X']),
    _0x5ac9cd = midpoint(_0x2046da['control1Y'], _0x2046da['control2Y']),
    _0xac647f = midpoint(_0x2046da['control2X'], _0x2046da['endX']),
    _0x139b1f = midpoint(_0x2046da['control2Y'], _0x2046da['endY']),
    _0x4b06cf = midpoint(_0xc194d9, _0x1b87f3),
    _0x472b41 = midpoint(_0x558ee5, _0x5ac9cd),
    _0xccddf4 = midpoint(_0x1b87f3, _0xac647f),
    _0xaf155 = midpoint(_0x5ac9cd, _0x139b1f),
    _0xc94293 = midpoint(_0x4b06cf, _0xccddf4),
    _0x5a6de6 = midpoint(_0x472b41, _0xaf155);
  return [
    {
      startX: _0x2046da['startX'],
      startY: _0x2046da['startY'],
      control1X: _0xc194d9,
      control1Y: _0x558ee5,
      control2X: _0x4b06cf,
      control2Y: _0x472b41,
      endX: _0xc94293,
      endY: _0x5a6de6,
    },
    {
      startX: _0xc94293,
      startY: _0x5a6de6,
      control1X: _0xccddf4,
      control1Y: _0xaf155,
      control2X: _0xac647f,
      control2Y: _0x139b1f,
      endX: _0x2046da['endX'],
      endY: _0x2046da['endY'],
    },
  ];
}
function collectCurveBounds(_0x31e8ab, _0xb41861, _0x15de3e, _0x56786d, _0x52d9f4 = 0x0) {
  if (_0x52d9f4 >= _0x56786d || getCurveFlatnessSquared(_0x31e8ab) <= _0x15de3e) {
    _0xb41861['push']({
      minX: Math['min'](
        _0x31e8ab['startX'],
        _0x31e8ab['control1X'],
        _0x31e8ab['control2X'],
        _0x31e8ab['endX'],
      ),
      minY: Math['min'](
        _0x31e8ab['startY'],
        _0x31e8ab['control1Y'],
        _0x31e8ab['control2Y'],
        _0x31e8ab['endY'],
      ),
      maxX: Math['max'](
        _0x31e8ab['startX'],
        _0x31e8ab['control1X'],
        _0x31e8ab['control2X'],
        _0x31e8ab['endX'],
      ),
      maxY: Math['max'](
        _0x31e8ab['startY'],
        _0x31e8ab['control1Y'],
        _0x31e8ab['control2Y'],
        _0x31e8ab['endY'],
      ),
    });
    return;
  }
  const [_0x372069, _0x3344d6] = subdivideCurve(_0x31e8ab);
  (collectCurveBounds(_0x372069, _0xb41861, _0x15de3e, _0x56786d, _0x52d9f4 + 0x1),
    collectCurveBounds(_0x3344d6, _0xb41861, _0x15de3e, _0x56786d, _0x52d9f4 + 0x1));
}
function cellCoordinate(_0x3766b0, _0x586cc3) {
  return Math['floor'](_0x3766b0 / _0x586cc3);
}
function cellKey(_0x1df09d, _0x501a4c) {
  return _0x1df09d + ':' + _0x501a4c;
}
export function createEdgeHitSpatialIndex({
  cellSize: cellSize = DEFAULT_CELL_SIZE,
  subdivisionFlatness: subdivisionFlatness = DEFAULT_SUBDIVISION_FLATNESS,
  maxSubdivisionDepth: maxSubdivisionDepth = DEFAULT_MAX_SUBDIVISION_DEPTH,
} = {}) {
  const _0x379e6b = Math['max'](0x20, normalizeNumber(cellSize, 0x100)),
    _0x5882d4 = Math['max'](0.5, normalizeNumber(subdivisionFlatness, 0x8)) ** 0x2,
    _0x34cfa5 = Math['max'](0x1, Math['floor'](normalizeNumber(maxSubdivisionDepth, 0x8))),
    _0x5f0a55 = new Map(),
    _0x59b28e = new Map(),
    _0x8a5624 = new Map();
  function _0x49f408(_0xcfd817) {
    const _0x527322 = _0x8a5624['get'](_0xcfd817);
    if (_0x527322)
      for (const _0x3fe3c0 of _0x527322) {
        const _0x1019da = _0x5f0a55['get'](_0x3fe3c0);
        _0x1019da?.['delete'](_0xcfd817);
        if (_0x1019da?.['size'] === 0x0) _0x5f0a55['delete'](_0x3fe3c0);
      }
    return (_0x8a5624['delete'](_0xcfd817), _0x59b28e['delete'](_0xcfd817));
  }
  function _0x8e7457({ edgeId: _0x4d5e51, geometry: _0x4f6be9, order: order = 0x0 } = {}) {
    const _0x1f8b53 = String(_0x4d5e51 || ''),
      _0x54c894 = normalizeGeometry(_0x4f6be9);
    if (!_0x1f8b53 || !_0x54c894) return ![];
    _0x49f408(_0x1f8b53);
    const _0x2397be = { edgeId: _0x1f8b53, geometry: _0x54c894, order: normalizeNumber(order) },
      _0x515591 = [];
    if (_0x54c894['hitPoints'])
      for (let _0x3a7864 = 0x1; _0x3a7864 < _0x54c894['hitPoints']['length']; _0x3a7864 += 0x1) {
        const _0x4de2ca = _0x54c894['hitPoints'][_0x3a7864 - 0x1],
          _0x3625bc = _0x54c894['hitPoints'][_0x3a7864];
        _0x515591['push']({
          minX: Math['min'](_0x4de2ca['x'], _0x3625bc['x']),
          minY: Math['min'](_0x4de2ca['y'], _0x3625bc['y']),
          maxX: Math['max'](_0x4de2ca['x'], _0x3625bc['x']),
          maxY: Math['max'](_0x4de2ca['y'], _0x3625bc['y']),
        });
      }
    else collectCurveBounds(_0x54c894, _0x515591, _0x5882d4, _0x34cfa5);
    const _0x3cb491 = new Set();
    for (const _0x30da4f of _0x515591) {
      const _0x488a3e = cellCoordinate(_0x30da4f['minX'], _0x379e6b),
        _0x504607 = cellCoordinate(_0x30da4f['minY'], _0x379e6b),
        _0x40ad45 = cellCoordinate(_0x30da4f['maxX'], _0x379e6b),
        _0x2df183 = cellCoordinate(_0x30da4f['maxY'], _0x379e6b);
      for (let _0x58db76 = _0x488a3e; _0x58db76 <= _0x40ad45; _0x58db76 += 0x1) {
        for (let _0x269e58 = _0x504607; _0x269e58 <= _0x2df183; _0x269e58 += 0x1) {
          const _0x45185 = cellKey(_0x58db76, _0x269e58);
          let _0xcd31bc = _0x5f0a55['get'](_0x45185);
          (!_0xcd31bc && ((_0xcd31bc = new Map()), _0x5f0a55['set'](_0x45185, _0xcd31bc)),
            _0xcd31bc['set'](_0x1f8b53, _0x2397be),
            _0x3cb491['add'](_0x45185));
        }
      }
    }
    return (_0x59b28e['set'](_0x1f8b53, _0x2397be), _0x8a5624['set'](_0x1f8b53, _0x3cb491), !![]);
  }
  function _0x3e3411(_0x482be1, _0xcfcf5, _0x1a629a = 0x0) {
    const _0x28e5a3 = normalizeNumber(_0x482be1),
      _0xd30ce7 = normalizeNumber(_0xcfcf5),
      _0x1f1651 = Math['max'](0x0, normalizeNumber(_0x1a629a)),
      _0x17d4f8 = cellCoordinate(_0x28e5a3 - _0x1f1651, _0x379e6b),
      _0xc1b1d4 = cellCoordinate(_0xd30ce7 - _0x1f1651, _0x379e6b),
      _0x1dd10d = cellCoordinate(_0x28e5a3 + _0x1f1651, _0x379e6b),
      _0x318338 = cellCoordinate(_0xd30ce7 + _0x1f1651, _0x379e6b),
      _0x29c6d5 = new Map();
    for (let _0x566707 = _0x17d4f8; _0x566707 <= _0x1dd10d; _0x566707 += 0x1) {
      for (let _0x26229b = _0xc1b1d4; _0x26229b <= _0x318338; _0x26229b += 0x1) {
        const _0x601367 = _0x5f0a55['get'](cellKey(_0x566707, _0x26229b));
        if (!_0x601367) continue;
        for (const [_0x206e06, _0x5acac4] of _0x601367) {
          _0x29c6d5['set'](_0x206e06, _0x5acac4);
        }
      }
    }
    return Array['from'](_0x29c6d5['values']())['sort'](
      (_0x4d27c9, _0x244e08) =>
        _0x244e08['order'] - _0x4d27c9['order'] || _0x244e08['edgeId']['localeCompare'](_0x4d27c9['edgeId']),
    );
  }
  function _0x3f4391(_0x15ca02, _0xb11858, _0x304f95) {
    const _0x4a0df5 = Math['max'](0x0, normalizeNumber(_0x304f95)) ** 0x2;
    for (const _0xd05bcf of _0x3e3411(_0x15ca02, _0xb11858, _0x304f95)) {
      const _0x5a92d9 = _0xd05bcf['geometry']['hitPoints']
        ? distanceToPolylineSquared(_0xd05bcf['geometry']['hitPoints'], _0x15ca02, _0xb11858)
        : distanceToCubicBezierSquared(_0xd05bcf['geometry'], _0x15ca02, _0xb11858);
      if (_0x5a92d9 <= _0x4a0df5) return _0xd05bcf;
    }
    return null;
  }
  function _0x2d2c0a() {
    (_0x5f0a55['clear'](), _0x59b28e['clear'](), _0x8a5624['clear']());
  }
  function _0x595f69() {
    return {
      edgeCount: _0x59b28e['size'],
      cellCount: _0x5f0a55['size'],
      membershipCount: Array['from'](_0x8a5624['values']())['reduce'](
        (_0x1bcfec, _0x2c4ff6) => _0x1bcfec + _0x2c4ff6['size'],
        0x0,
      ),
    };
  }
  return {
    clear: _0x2d2c0a,
    getStats: _0x595f69,
    hitTest: _0x3f4391,
    queryCandidates: _0x3e3411,
    remove: _0x49f408,
    upsert: _0x8e7457,
  };
}
