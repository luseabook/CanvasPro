const TAU = Math['PI'] * 0x2,
  STRAIGHT_BEND_EPSILON = 0.0001,
  finiteNumberOr = (_0x21c3d7, _0x25b354 = 0x0) => {
    const _0x47f20a = Number(_0x21c3d7);
    return Number['isFinite'](_0x47f20a) ? _0x47f20a : _0x25b354;
  },
  positiveAngle = (_0x120abe) => {
    const _0x3ad88f = _0x120abe % TAU;
    return _0x3ad88f < 0x0 ? _0x3ad88f + TAU : _0x3ad88f;
  },
  getArrowEndpoints = (_0x481856) => ({
    start: { x: finiteNumberOr(_0x481856?.['x1']), y: finiteNumberOr(_0x481856?.['y1']) },
    end: { x: finiteNumberOr(_0x481856?.['x2']), y: finiteNumberOr(_0x481856?.['y2']) },
  }),
  getLineGeometry = (_0x5b82e6, _0x419ee3) => {
    const _0x522faf = _0x419ee3['x'] - _0x5b82e6['x'],
      _0x282888 = _0x419ee3['y'] - _0x5b82e6['y'],
      _0x3b1d7a = Math['hypot'](_0x522faf, _0x282888),
      _0x3bce9e =
        _0x3b1d7a > 0x0 ? { x: _0x522faf / _0x3b1d7a, y: _0x282888 / _0x3b1d7a } : { x: 0x1, y: 0x0 };
    return {
      type: 'straight',
      start: _0x5b82e6,
      end: _0x419ee3,
      middle: { x: (_0x5b82e6['x'] + _0x419ee3['x']) / 0x2, y: (_0x5b82e6['y'] + _0x419ee3['y']) / 0x2 },
      length: _0x3b1d7a,
      startTangent: _0x3bce9e,
      endTangent: _0x3bce9e,
    };
  },
  getSegmentDistance = (_0x28b2d7, _0x45a31e, _0x9c1174) => {
    const _0xdd66df = _0x9c1174['x'] - _0x45a31e['x'],
      _0x4ed42a = _0x9c1174['y'] - _0x45a31e['y'],
      _0x592280 = _0xdd66df * _0xdd66df + _0x4ed42a * _0x4ed42a;
    if (_0x592280 <= 0x0)
      return Math['hypot'](_0x28b2d7['x'] - _0x45a31e['x'], _0x28b2d7['y'] - _0x45a31e['y']);
    const _0x2e3620 = Math['max'](
      0x0,
      Math['min'](
        0x1,
        ((_0x28b2d7['x'] - _0x45a31e['x']) * _0xdd66df + (_0x28b2d7['y'] - _0x45a31e['y']) * _0x4ed42a) /
          _0x592280,
      ),
    );
    return Math['hypot'](
      _0x28b2d7['x'] - (_0x45a31e['x'] + _0xdd66df * _0x2e3620),
      _0x28b2d7['y'] - (_0x45a31e['y'] + _0x4ed42a * _0x2e3620),
    );
  },
  getElbowGeometry = (_0x3148d7, _0x527257, _0x45a7fe = 0x0) => {
    const _0xf43806 = _0x527257['x'] - _0x3148d7['x'],
      _0x5cf5e2 = _0x527257['y'] - _0x3148d7['y'],
      _0x362d44 = Math['abs'](_0xf43806) >= Math['abs'](_0x5cf5e2),
      _0x5a800a = _0x362d44
        ? {
            x: (_0x3148d7['x'] + _0x527257['x']) / 0x2 + _0x45a7fe,
            y: (_0x3148d7['y'] + _0x527257['y']) / 0x2,
          }
        : {
            x: (_0x3148d7['x'] + _0x527257['x']) / 0x2,
            y: (_0x3148d7['y'] + _0x527257['y']) / 0x2 + _0x45a7fe,
          },
      _0x518302 = _0x362d44
        ? [
            _0x3148d7,
            { x: _0x5a800a['x'], y: _0x3148d7['y'] },
            { x: _0x5a800a['x'], y: _0x527257['y'] },
            _0x527257,
          ]
        : [
            _0x3148d7,
            { x: _0x3148d7['x'], y: _0x5a800a['y'] },
            { x: _0x527257['x'], y: _0x5a800a['y'] },
            _0x527257,
          ],
      _0x510ec8 = [];
    let _0xb84db3 = 0x0;
    for (let _0x348bfb = 0x1; _0x348bfb < _0x518302['length']; _0x348bfb += 0x1) {
      const _0x5200f4 = _0x518302[_0x348bfb]['x'] - _0x518302[_0x348bfb - 0x1]['x'],
        _0xedbde = _0x518302[_0x348bfb]['y'] - _0x518302[_0x348bfb - 0x1]['y'],
        _0x39ed2c = Math['hypot'](_0x5200f4, _0xedbde);
      if (_0x39ed2c <= STRAIGHT_BEND_EPSILON) continue;
      ((_0xb84db3 += _0x39ed2c),
        _0x510ec8['push']({ tangent: { x: _0x5200f4 / _0x39ed2c, y: _0xedbde / _0x39ed2c } }));
    }
    const _0x722131 = getLineGeometry(_0x3148d7, _0x527257)['startTangent'];
    return {
      type: 'elbow',
      start: _0x3148d7,
      end: _0x527257,
      middle: _0x5a800a,
      points: _0x518302,
      horizontalRoute: _0x362d44,
      length: _0xb84db3,
      startTangent: _0x510ec8[0x0]?.['tangent'] || _0x722131,
      endTangent: _0x510ec8['at'](-0x1)?.['tangent'] || _0x722131,
    };
  };
export function getArrowGeometry(_0x15e128) {
  const { start: _0x3fca35, end: _0x2308ff } = getArrowEndpoints(_0x15e128),
    _0x14d369 = getLineGeometry(_0x3fca35, _0x2308ff),
    _0x3be672 = String(_0x15e128?.['arrowKind'] || '')['trim']();
  if (_0x3be672 === 'elbow')
    return getElbowGeometry(_0x3fca35, _0x2308ff, finiteNumberOr(_0x15e128?.['elbowOffset']));
  if (_0x3be672 === 'straight') return _0x14d369;
  const _0x40a22d = finiteNumberOr(_0x15e128?.['bend']);
  if (_0x14d369['length'] <= STRAIGHT_BEND_EPSILON || Math['abs'](_0x40a22d) < STRAIGHT_BEND_EPSILON)
    return _0x14d369;
  const _0x4875a8 = _0x2308ff['x'] - _0x3fca35['x'],
    _0x13abb7 = _0x2308ff['y'] - _0x3fca35['y'],
    _0x475a78 = { x: -_0x13abb7 / _0x14d369['length'], y: _0x4875a8 / _0x14d369['length'] },
    _0x590785 = {
      x: _0x14d369['middle']['x'] + _0x475a78['x'] * _0x40a22d,
      y: _0x14d369['middle']['y'] + _0x475a78['y'] * _0x40a22d,
    },
    _0x11baa8 = _0x14d369['length'] / 0x2,
    _0x1d2177 = (_0x40a22d * _0x40a22d - _0x11baa8 * _0x11baa8) / (0x2 * _0x40a22d),
    _0x3008df = {
      x: _0x14d369['middle']['x'] + _0x475a78['x'] * _0x1d2177,
      y: _0x14d369['middle']['y'] + _0x475a78['y'] * _0x1d2177,
    },
    _0x2e5356 = Math['hypot'](_0x11baa8, _0x1d2177);
  if (!Number['isFinite'](_0x2e5356) || _0x2e5356 <= STRAIGHT_BEND_EPSILON) return _0x14d369;
  const _0x5e92ec = Math['atan2'](_0x3fca35['y'] - _0x3008df['y'], _0x3fca35['x'] - _0x3008df['x']),
    _0x8196eb = Math['atan2'](_0x2308ff['y'] - _0x3008df['y'], _0x2308ff['x'] - _0x3008df['x']),
    _0x5b2e1b = Math['atan2'](_0x590785['y'] - _0x3008df['y'], _0x590785['x'] - _0x3008df['x']),
    _0x39ec24 = positiveAngle(_0x8196eb - _0x5e92ec),
    _0x56627c = positiveAngle(_0x5b2e1b - _0x5e92ec),
    _0x140ad1 = _0x56627c > _0x39ec24 + STRAIGHT_BEND_EPSILON,
    _0x2aa015 = _0x140ad1 ? positiveAngle(_0x5e92ec - _0x8196eb) : _0x39ec24;
  if (!Number['isFinite'](_0x2aa015) || _0x2aa015 <= STRAIGHT_BEND_EPSILON) return _0x14d369;
  const _0x363f40 = _0x140ad1 ? -0x1 : 0x1,
    _0x1d6785 = (_0x405aef) => ({
      x: -Math['sin'](_0x405aef) * _0x363f40,
      y: Math['cos'](_0x405aef) * _0x363f40,
    });
  return {
    type: 'arc',
    start: _0x3fca35,
    end: _0x2308ff,
    middle: _0x590785,
    center: _0x3008df,
    radius: _0x2e5356,
    startAngle: _0x5e92ec,
    endAngle: _0x8196eb,
    anticlockwise: _0x140ad1,
    sweep: _0x2aa015,
    length: _0x2e5356 * _0x2aa015,
    startTangent: _0x1d6785(_0x5e92ec),
    endTangent: _0x1d6785(_0x8196eb),
  };
}
export function getArrowElbowOffsetFromPoint(_0x5ec9c5, _0x22dab9) {
  const { start: _0xb95501, end: _0x2cc3d1 } = getArrowEndpoints(_0x5ec9c5),
    _0x4752f9 = Math['abs'](_0x2cc3d1['x'] - _0xb95501['x']) >= Math['abs'](_0x2cc3d1['y'] - _0xb95501['y']);
  return _0x4752f9
    ? finiteNumberOr(_0x22dab9?.['x']) - (_0xb95501['x'] + _0x2cc3d1['x']) / 0x2
    : finiteNumberOr(_0x22dab9?.['y']) - (_0xb95501['y'] + _0x2cc3d1['y']) / 0x2;
}
export function getArrowBendFromPoint(_0x34be0d, _0x404035) {
  const { start: _0x28ab6b, end: _0x28dc6c } = getArrowEndpoints(_0x34be0d),
    _0x24e180 = _0x28dc6c['x'] - _0x28ab6b['x'],
    _0x21496f = _0x28dc6c['y'] - _0x28ab6b['y'],
    _0x476571 = Math['hypot'](_0x24e180, _0x21496f);
  if (_0x476571 <= STRAIGHT_BEND_EPSILON) return 0x0;
  const _0x1f3ea1 = {
      x: (_0x28ab6b['x'] + _0x28dc6c['x']) / 0x2,
      y: (_0x28ab6b['y'] + _0x28dc6c['y']) / 0x2,
    },
    _0x4c0d99 = { x: -_0x21496f / _0x476571, y: _0x24e180 / _0x476571 };
  return (
    (finiteNumberOr(_0x404035?.['x']) - _0x1f3ea1['x']) * _0x4c0d99['x'] +
    (finiteNumberOr(_0x404035?.['y']) - _0x1f3ea1['y']) * _0x4c0d99['y']
  );
}
export function getDistanceToArrowPath(_0x2f7b28, _0x1ac076) {
  const _0x3c7502 = getArrowGeometry(_0x1ac076),
    _0x4e92ed = finiteNumberOr(_0x2f7b28?.['x']),
    _0x5c10f4 = finiteNumberOr(_0x2f7b28?.['y']);
  if (_0x3c7502['type'] === 'straight')
    return getSegmentDistance({ x: _0x4e92ed, y: _0x5c10f4 }, _0x3c7502['start'], _0x3c7502['end']);
  if (_0x3c7502['type'] === 'elbow') {
    let _0x5cf1b3 = Number['POSITIVE_INFINITY'];
    for (let _0x5eb102 = 0x1; _0x5eb102 < _0x3c7502['points']['length']; _0x5eb102 += 0x1) {
      _0x5cf1b3 = Math['min'](
        _0x5cf1b3,
        getSegmentDistance(
          { x: _0x4e92ed, y: _0x5c10f4 },
          _0x3c7502['points'][_0x5eb102 - 0x1],
          _0x3c7502['points'][_0x5eb102],
        ),
      );
    }
    return _0x5cf1b3;
  }
  const _0x1ee5a2 = Math['atan2'](_0x5c10f4 - _0x3c7502['center']['y'], _0x4e92ed - _0x3c7502['center']['x']),
    _0x1b70d1 = _0x3c7502['anticlockwise']
      ? positiveAngle(_0x3c7502['startAngle'] - _0x1ee5a2)
      : positiveAngle(_0x1ee5a2 - _0x3c7502['startAngle']);
  if (_0x1b70d1 <= _0x3c7502['sweep'] + STRAIGHT_BEND_EPSILON)
    return Math['abs'](
      Math['hypot'](_0x4e92ed - _0x3c7502['center']['x'], _0x5c10f4 - _0x3c7502['center']['y']) -
        _0x3c7502['radius'],
    );
  return Math['min'](
    Math['hypot'](_0x4e92ed - _0x3c7502['start']['x'], _0x5c10f4 - _0x3c7502['start']['y']),
    Math['hypot'](_0x4e92ed - _0x3c7502['end']['x'], _0x5c10f4 - _0x3c7502['end']['y']),
  );
}
