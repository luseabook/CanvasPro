const EPSILON = 0.000001,
  finiteNumberOr = (_0x3ea2c7, _0x4ff238 = 0x0) => {
    const _0x4a5b88 = Number(_0x3ea2c7);
    return Number['isFinite'](_0x4a5b88) ? _0x4a5b88 : _0x4ff238;
  },
  toPoint = (_0x45c1ce) => ({ x: finiteNumberOr(_0x45c1ce?.['x']), y: finiteNumberOr(_0x45c1ce?.['y']) }),
  cross = (_0xd38b2b, _0x159fbd, _0x55d318) =>
    (_0x159fbd['x'] - _0xd38b2b['x']) * (_0x55d318['y'] - _0xd38b2b['y']) -
    (_0x159fbd['y'] - _0xd38b2b['y']) * (_0x55d318['x'] - _0xd38b2b['x']),
  isPointOnSegment = (_0x5b9635, _0x4b3a5c, _0x3f661d) =>
    Math['abs'](cross(_0x4b3a5c, _0x3f661d, _0x5b9635)) <= EPSILON &&
    _0x5b9635['x'] >= Math['min'](_0x4b3a5c['x'], _0x3f661d['x']) - EPSILON &&
    _0x5b9635['x'] <= Math['max'](_0x4b3a5c['x'], _0x3f661d['x']) + EPSILON &&
    _0x5b9635['y'] >= Math['min'](_0x4b3a5c['y'], _0x3f661d['y']) - EPSILON &&
    _0x5b9635['y'] <= Math['max'](_0x4b3a5c['y'], _0x3f661d['y']) + EPSILON,
  segmentsIntersect = (_0x263acd, _0x15028d, _0x59d0f3, _0x1b44cd) => {
    const _0x418bbe = cross(_0x263acd, _0x15028d, _0x59d0f3),
      _0x22297d = cross(_0x263acd, _0x15028d, _0x1b44cd),
      _0x279775 = cross(_0x59d0f3, _0x1b44cd, _0x263acd),
      _0xb2f1b3 = cross(_0x59d0f3, _0x1b44cd, _0x15028d);
    if (
      ((_0x418bbe > EPSILON && _0x22297d < -EPSILON) || (_0x418bbe < -EPSILON && _0x22297d > EPSILON)) &&
      ((_0x279775 > EPSILON && _0xb2f1b3 < -EPSILON) || (_0x279775 < -EPSILON && _0xb2f1b3 > EPSILON))
    )
      return !![];
    return (
      (Math['abs'](_0x418bbe) <= EPSILON && isPointOnSegment(_0x59d0f3, _0x263acd, _0x15028d)) ||
      (Math['abs'](_0x22297d) <= EPSILON && isPointOnSegment(_0x1b44cd, _0x263acd, _0x15028d)) ||
      (Math['abs'](_0x279775) <= EPSILON && isPointOnSegment(_0x263acd, _0x59d0f3, _0x1b44cd)) ||
      (Math['abs'](_0xb2f1b3) <= EPSILON && isPointOnSegment(_0x15028d, _0x59d0f3, _0x1b44cd))
    );
  };
export function snapWhiteboardPointToAngle(_0x543a7b, _0x2f7259, _0x24c27d = Math['PI'] / 0xc) {
  const _0x1095ab = toPoint(_0x543a7b),
    _0x590407 = toPoint(_0x2f7259),
    _0x2c0fb3 = _0x590407['x'] - _0x1095ab['x'],
    _0x2d7b3f = _0x590407['y'] - _0x1095ab['y'],
    _0x2b8316 = Math['hypot'](_0x2c0fb3, _0x2d7b3f);
  if (_0x2b8316 <= EPSILON) return { ..._0x1095ab };
  const _0x436748 = Math['max'](EPSILON, Math['abs'](finiteNumberOr(_0x24c27d, Math['PI'] / 0xc))),
    _0x3f5a5f = Math['round'](Math['atan2'](_0x2d7b3f, _0x2c0fb3) / _0x436748) * _0x436748;
  return {
    x: _0x1095ab['x'] + Math['cos'](_0x3f5a5f) * _0x2b8316,
    y: _0x1095ab['y'] + Math['sin'](_0x3f5a5f) * _0x2b8316,
  };
}
export function getPointToSegmentDistance(_0x414d1e, _0x57c276, _0x586a61) {
  const _0x4de49f = toPoint(_0x414d1e),
    _0x4fc2bb = toPoint(_0x57c276),
    _0x47b4e2 = toPoint(_0x586a61),
    _0x56845a = _0x47b4e2['x'] - _0x4fc2bb['x'],
    _0x16cb71 = _0x47b4e2['y'] - _0x4fc2bb['y'],
    _0x10cad3 = _0x56845a * _0x56845a + _0x16cb71 * _0x16cb71;
  if (_0x10cad3 <= EPSILON)
    return Math['hypot'](_0x4de49f['x'] - _0x4fc2bb['x'], _0x4de49f['y'] - _0x4fc2bb['y']);
  const _0x4a4e22 = Math['max'](
    0x0,
    Math['min'](
      0x1,
      ((_0x4de49f['x'] - _0x4fc2bb['x']) * _0x56845a + (_0x4de49f['y'] - _0x4fc2bb['y']) * _0x16cb71) /
        _0x10cad3,
    ),
  );
  return Math['hypot'](
    _0x4de49f['x'] - (_0x4fc2bb['x'] + _0x56845a * _0x4a4e22),
    _0x4de49f['y'] - (_0x4fc2bb['y'] + _0x16cb71 * _0x4a4e22),
  );
}
export function getSegmentToSegmentDistance(_0x247d57, _0x5252bb, _0x3faf06, _0x3b600b) {
  const _0x1a3f95 = toPoint(_0x247d57),
    _0x225491 = toPoint(_0x5252bb),
    _0x5a9e15 = toPoint(_0x3faf06),
    _0x147b86 = toPoint(_0x3b600b);
  if (segmentsIntersect(_0x1a3f95, _0x225491, _0x5a9e15, _0x147b86)) return 0x0;
  return Math['min'](
    getPointToSegmentDistance(_0x1a3f95, _0x5a9e15, _0x147b86),
    getPointToSegmentDistance(_0x225491, _0x5a9e15, _0x147b86),
    getPointToSegmentDistance(_0x5a9e15, _0x1a3f95, _0x225491),
    getPointToSegmentDistance(_0x147b86, _0x1a3f95, _0x225491),
  );
}
export function doesSegmentHitPolyline(_0x1f4292, _0x555c48, _0x1ab9b6, _0x4d411 = 0x0) {
  const _0x185836 = (Array['isArray'](_0x1ab9b6) ? _0x1ab9b6 : [])['map'](toPoint);
  if (_0x185836['length'] === 0x0) return ![];
  const _0x47eb9a = Math['max'](0x0, finiteNumberOr(_0x4d411));
  if (_0x185836['length'] === 0x1)
    return getPointToSegmentDistance(_0x185836[0x0], _0x1f4292, _0x555c48) <= _0x47eb9a;
  for (let _0x105a89 = 0x1; _0x105a89 < _0x185836['length']; _0x105a89 += 0x1) {
    if (
      getSegmentToSegmentDistance(_0x1f4292, _0x555c48, _0x185836[_0x105a89 - 0x1], _0x185836[_0x105a89]) <=
      _0x47eb9a
    )
      return !![];
  }
  return ![];
}
export function getPolylineBounds(_0x51c552, _0x87149a = 0x0) {
  let _0x52a593 = Infinity,
    _0x4a81ba = Infinity,
    _0x5074b1 = -Infinity,
    _0x273b3b = -Infinity;
  (Array['isArray'](_0x51c552) ? _0x51c552 : [])['forEach']((_0x25f7f5) => {
    const _0xa4265f = Number(_0x25f7f5?.['x']),
      _0x3ee064 = Number(_0x25f7f5?.['y']);
    if (!Number['isFinite'](_0xa4265f) || !Number['isFinite'](_0x3ee064)) return;
    ((_0x52a593 = Math['min'](_0x52a593, _0xa4265f)),
      (_0x4a81ba = Math['min'](_0x4a81ba, _0x3ee064)),
      (_0x5074b1 = Math['max'](_0x5074b1, _0xa4265f)),
      (_0x273b3b = Math['max'](_0x273b3b, _0x3ee064)));
  });
  if (!Number['isFinite'](_0x52a593) || !Number['isFinite'](_0x4a81ba)) return null;
  const _0x2e18c5 = Math['max'](0x0, finiteNumberOr(_0x87149a));
  return {
    x: _0x52a593 - _0x2e18c5,
    y: _0x4a81ba - _0x2e18c5,
    width: _0x5074b1 - _0x52a593 + _0x2e18c5 * 0x2,
    height: _0x273b3b - _0x4a81ba + _0x2e18c5 * 0x2,
  };
}
const isPointInBounds = (_0x402d14, _0x144a60) =>
  _0x402d14['x'] >= _0x144a60['x'] &&
  _0x402d14['x'] <= _0x144a60['x'] + _0x144a60['width'] &&
  _0x402d14['y'] >= _0x144a60['y'] &&
  _0x402d14['y'] <= _0x144a60['y'] + _0x144a60['height'];
export function doesSegmentHitBounds(_0x36e275, _0x3a23b3, _0x16dcaa, _0x318e58 = 0x0) {
  const _0x33f65e = Math['max'](0x0, finiteNumberOr(_0x318e58)),
    _0x519e95 = {
      x: finiteNumberOr(_0x16dcaa?.['x']) - _0x33f65e,
      y: finiteNumberOr(_0x16dcaa?.['y']) - _0x33f65e,
      width: Math['max'](0x0, finiteNumberOr(_0x16dcaa?.['width'])) + _0x33f65e * 0x2,
      height: Math['max'](0x0, finiteNumberOr(_0x16dcaa?.['height'])) + _0x33f65e * 0x2,
    },
    _0x36bb8b = toPoint(_0x36e275),
    _0xa31e3b = toPoint(_0x3a23b3);
  if (isPointInBounds(_0x36bb8b, _0x519e95) || isPointInBounds(_0xa31e3b, _0x519e95)) return !![];
  const _0x1fc9f9 = { x: _0x519e95['x'], y: _0x519e95['y'] },
    _0x198110 = { x: _0x519e95['x'] + _0x519e95['width'], y: _0x519e95['y'] },
    _0x203004 = { x: _0x519e95['x'] + _0x519e95['width'], y: _0x519e95['y'] + _0x519e95['height'] },
    _0x24388e = { x: _0x519e95['x'], y: _0x519e95['y'] + _0x519e95['height'] };
  return [
    [_0x1fc9f9, _0x198110],
    [_0x198110, _0x203004],
    [_0x203004, _0x24388e],
    [_0x24388e, _0x1fc9f9],
  ]['some'](([_0x5c5311, _0xda4c86]) => segmentsIntersect(_0x36bb8b, _0xa31e3b, _0x5c5311, _0xda4c86));
}
export function doesSegmentHitCircle(_0x176f48, _0x3b2f9f, _0xefac72, _0x4d9b45) {
  return (
    getPointToSegmentDistance(_0xefac72, _0x176f48, _0x3b2f9f) <= Math['max'](0x0, finiteNumberOr(_0x4d9b45))
  );
}
const isPointInPolygon = (_0xac5cd7, _0x7396c1) => {
  let _0x1cdb87 = ![];
  for (
    let _0x4080dd = 0x0, _0xf5fc8 = _0x7396c1['length'] - 0x1;
    _0x4080dd < _0x7396c1['length'];
    _0xf5fc8 = _0x4080dd++
  ) {
    const _0x413ec1 = _0x7396c1[_0x4080dd],
      _0x17169a = _0x7396c1[_0xf5fc8],
      _0x29ef0d =
        _0x413ec1['y'] > _0xac5cd7['y'] !== _0x17169a['y'] > _0xac5cd7['y'] &&
        _0xac5cd7['x'] <
          ((_0x17169a['x'] - _0x413ec1['x']) * (_0xac5cd7['y'] - _0x413ec1['y'])) /
            (_0x17169a['y'] - _0x413ec1['y'] || EPSILON) +
            _0x413ec1['x'];
    if (_0x29ef0d) _0x1cdb87 = !_0x1cdb87;
  }
  return _0x1cdb87;
};
export function doesSegmentHitPolygon(_0x2d4333, _0x1b2696, _0x17a341, _0x4946a1 = 0x0) {
  const _0x138a3e = (Array['isArray'](_0x17a341) ? _0x17a341 : [])['map'](toPoint);
  if (_0x138a3e['length'] < 0x2) return ![];
  const _0xc19af6 = toPoint(_0x2d4333),
    _0x305e27 = toPoint(_0x1b2696);
  if (isPointInPolygon(_0xc19af6, _0x138a3e) || isPointInPolygon(_0x305e27, _0x138a3e)) return !![];
  const _0x3faf6e = Math['max'](0x0, finiteNumberOr(_0x4946a1));
  for (let _0x1a3f54 = 0x0; _0x1a3f54 < _0x138a3e['length']; _0x1a3f54 += 0x1) {
    const _0x1fd500 = _0x138a3e[_0x1a3f54],
      _0xae5831 = _0x138a3e[(_0x1a3f54 + 0x1) % _0x138a3e['length']];
    if (getSegmentToSegmentDistance(_0xc19af6, _0x305e27, _0x1fd500, _0xae5831) <= _0x3faf6e) return !![];
  }
  return ![];
}
