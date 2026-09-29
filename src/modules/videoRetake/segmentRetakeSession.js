export const SEGMENT_RETAKE_MIN_DURATION_SECONDS = 0x4;
export const SEGMENT_RETAKE_MAX_DURATION_SECONDS = 0x1e;
function finiteNumber(_0x48c0bd, _0x2c1d7e = 0x0) {
  const _0x1ae54c = Number(_0x48c0bd);
  return Number['isFinite'](_0x1ae54c) ? _0x1ae54c : _0x2c1d7e;
}
function roundTime(_0x111205) {
  return Math['round'](finiteNumber(_0x111205) * 0x3e8) / 0x3e8;
}
export function normalizeSegmentRetakeRange(
  _0xb81ed4 = {},
  _0x51eba7 = 0x0,
  {
    minDurationSec: minDurationSec = SEGMENT_RETAKE_MIN_DURATION_SECONDS,
    maxDurationSec: maxDurationSec = SEGMENT_RETAKE_MAX_DURATION_SECONDS,
  } = {},
) {
  const _0x21a12c = Math['max'](0x0, finiteNumber(_0x51eba7));
  if (_0x21a12c <= 0x0) return { startSec: 0x0, endSec: 0x0, durationSec: 0x0 };
  const _0x207002 = Math['min'](_0x21a12c, Math['max'](0.1, finiteNumber(minDurationSec, 0x4))),
    _0xbf67f = Math['min'](_0x21a12c, Math['max'](_0x207002, finiteNumber(maxDurationSec, 0x1e)));
  let _0x5bebc7 = Math['max'](0x0, Math['min'](_0x21a12c, finiteNumber(_0xb81ed4['startSec']))),
    _0x3fb594 = Math['max'](_0x5bebc7, Math['min'](_0x21a12c, finiteNumber(_0xb81ed4['endSec'], _0x21a12c)));
  if (_0x3fb594 - _0x5bebc7 > _0xbf67f) _0x3fb594 = _0x5bebc7 + _0xbf67f;
  return (
    _0x3fb594 - _0x5bebc7 < _0x207002 &&
      ((_0x3fb594 = Math['min'](_0x21a12c, _0x5bebc7 + _0x207002)),
      (_0x5bebc7 = Math['max'](0x0, _0x3fb594 - _0x207002))),
    {
      startSec: roundTime(_0x5bebc7),
      endSec: roundTime(_0x3fb594),
      durationSec: roundTime(_0x3fb594 - _0x5bebc7),
    }
  );
}
function normalizeRawSegments(_0x1211ee, _0x60a402) {
  const _0xd68cb5 = Math['max'](0x0, finiteNumber(_0x60a402));
  return (Array['isArray'](_0x1211ee) ? _0x1211ee : [])
    ['map']((_0x12cd21) => {
      const _0x1003cf = Math['max'](0x0, Math['min'](_0xd68cb5, finiteNumber(_0x12cd21?.['start']))),
        _0x4fb52f = Math['max'](_0x1003cf, Math['min'](_0xd68cb5, finiteNumber(_0x12cd21?.['end'])));
      return { startSec: _0x1003cf, endSec: _0x4fb52f };
    })
    ['filter']((_0x3c7572) => _0x3c7572['endSec'] > _0x3c7572['startSec'])
    ['sort']((_0x255b97, _0x1b57b0) => _0x255b97['startSec'] - _0x1b57b0['startSec']);
}
export function normalizeSegmentRetakeSmartSegments(_0x501f00, _0x9272b, _0x2c7c95 = {}) {
  const _0x5aa424 = Math['max'](0x0, finiteNumber(_0x9272b));
  if (_0x5aa424 <= 0x0) return [];
  const _0x53800c = Math['min'](_0x5aa424, Math['max'](0.1, finiteNumber(_0x2c7c95['minDurationSec'], 0x4))),
    _0x398966 = Math['min'](
      _0x5aa424,
      Math['max'](_0x53800c, finiteNumber(_0x2c7c95['maxDurationSec'], 0x1e)),
    ),
    _0x4b1654 = normalizeRawSegments(_0x501f00, _0x5aa424);
  if (_0x4b1654['length'] === 0x0)
    return [normalizeSegmentRetakeRange({ startSec: 0x0, endSec: _0x5aa424 }, _0x5aa424, _0x2c7c95)];
  const _0x53e65e = [];
  for (const _0x25c134 of _0x4b1654) {
    const _0x4b1d82 = { ..._0x25c134 },
      _0xd254c3 = _0x53e65e[_0x53e65e['length'] - 0x1];
    if (
      _0xd254c3 &&
      (_0x4b1d82['endSec'] - _0x4b1d82['startSec'] < _0x53800c ||
        _0xd254c3['endSec'] - _0xd254c3['startSec'] < _0x53800c)
    ) {
      _0xd254c3['endSec'] = Math['max'](_0xd254c3['endSec'], _0x4b1d82['endSec']);
      continue;
    }
    _0x53e65e['push'](_0x4b1d82);
  }
  if (_0x53e65e['length'] > 0x1) {
    const _0xa05790 = _0x53e65e[_0x53e65e['length'] - 0x1];
    _0xa05790['endSec'] - _0xa05790['startSec'] < _0x53800c &&
      ((_0x53e65e[_0x53e65e['length'] - 0x2]['endSec'] = _0xa05790['endSec']), _0x53e65e['pop']());
  }
  const _0x2de350 = [];
  for (const _0x1f870b of _0x53e65e) {
    let _0x2dc540 = _0x1f870b['startSec'];
    while (_0x1f870b['endSec'] - _0x2dc540 > _0x398966) {
      (_0x2de350['push']({ startSec: _0x2dc540, endSec: _0x2dc540 + _0x398966 }), (_0x2dc540 += _0x398966));
    }
    if (_0x1f870b['endSec'] > _0x2dc540) {
      const _0x394740 = { startSec: _0x2dc540, endSec: _0x1f870b['endSec'] },
        _0x44a8d8 = _0x2de350[_0x2de350['length'] - 0x1];
      _0x44a8d8 &&
      _0x394740['endSec'] - _0x394740['startSec'] < _0x53800c &&
      _0x394740['endSec'] - _0x44a8d8['startSec'] <= _0x398966
        ? (_0x44a8d8['endSec'] = _0x394740['endSec'])
        : _0x2de350['push'](_0x394740);
    }
  }
  return _0x2de350['map']((_0x15e050) =>
    normalizeSegmentRetakeRange(_0x15e050, _0x5aa424, {
      minDurationSec: _0x53800c,
      maxDurationSec: _0x398966,
    }),
  );
}
export function isSegmentRetakeAnnotationInRange(_0xf4be79, _0xef8930) {
  const _0x40d8f8 = finiteNumber(_0xf4be79?.['timeSec'], -0x1),
    _0x47d7cd = finiteNumber(_0xef8930?.['startSec'], 0x0),
    _0x2f9897 = finiteNumber(_0xef8930?.['endSec'], 0x0);
  return _0x40d8f8 >= _0x47d7cd && _0x40d8f8 <= _0x2f9897;
}
export function resolveSegmentRetakeInputDirection(_0x100603) {
  return String(_0x100603 || '') === 'down' ? 'down' : 'left';
}
export function calcSegmentRetakeInputStart({
  targetNode: targetNode = {},
  itemWidth: _0x246547,
  itemHeight: _0x209476,
  index: index = 0x0,
  spacing: spacing = 0x78,
  direction: direction = 'right',
} = {}) {
  const _0x2d9cd3 = resolveSegmentRetakeInputDirection(direction),
    _0xfa18c = Math['max'](0x1, finiteNumber(_0x246547, 0x12c)),
    _0x39d064 = Math['max'](0x1, finiteNumber(_0x209476, 0x12c)),
    _0x522c8b = Math['max'](0x0, finiteNumber(spacing, 0x78)),
    _0x29a31a = Math['max'](0x0, Math['trunc'](finiteNumber(index))),
    _0x469dce = finiteNumber(targetNode['x']),
    _0x47056b = finiteNumber(targetNode['y']),
    _0x2f9090 = Math['max'](0x1, finiteNumber(targetNode['height'], 0x12c));
  return {
    x: _0x2d9cd3 === 'down' ? _0x469dce : _0x469dce - _0x522c8b - _0xfa18c,
    y:
      (_0x2d9cd3 === 'down' ? _0x47056b + _0x2f9090 + _0x522c8b : _0x47056b) +
      _0x29a31a * (_0x39d064 + _0x522c8b),
    direction: _0x2d9cd3,
  };
}
export function shouldDeleteManagedRetakeInputNode({
  node: _0x3a6ca1,
  nodeId: _0x272f5a,
  ownerEdgeId: _0x497b2d,
  edges: edges = [],
} = {}) {
  if (_0x3a6ca1?.['segmentRetakeManaged'] !== !![]) return ![];
  const _0x4cc479 = String(_0x272f5a || _0x3a6ca1?.['id'] || '')['trim']();
  if (!_0x4cc479) return ![];
  return !(Array['isArray'](edges) ? edges : [])['some'](
    (_0x496735) => _0x496735?.['sourceId'] === _0x4cc479 && _0x496735?.['id'] !== _0x497b2d,
  );
}
export function getOrphanedSegmentRetakeAnnotationIds({
  session: _0x37cc2c,
  nodes: nodes = {},
  edges: edges = {},
} = {}) {
  return (Array['isArray'](_0x37cc2c?.['annotations']) ? _0x37cc2c['annotations'] : [])
    ['filter']((_0x53ace1) => !nodes?.[_0x53ace1?.['nodeId']] || !edges?.[_0x53ace1?.['edgeId']])
    ['map']((_0x17374a) => _0x17374a?.['id'])
    ['filter'](Boolean);
}
export function getSegmentRetakeValidation(_0x173cac = {}) {
  const _0x4c1555 = _0x173cac['range'] || {},
    _0x29722a = finiteNumber(_0x4c1555['endSec']) - finiteNumber(_0x4c1555['startSec']);
  if (_0x29722a < SEGMENT_RETAKE_MIN_DURATION_SECONDS) return { ok: ![], reason: 'range-too-short' };
  if (_0x29722a > SEGMENT_RETAKE_MAX_DURATION_SECONDS) return { ok: ![], reason: 'range-too-long' };
  const _0x17bf86 = (Array['isArray'](_0x173cac['annotations']) ? _0x173cac['annotations'] : [])['filter'](
    (_0x48a387) => !isSegmentRetakeAnnotationInRange(_0x48a387, _0x4c1555),
  );
  if (_0x17bf86['length'] > 0x0)
    return {
      ok: ![],
      reason: 'annotation-outside-range',
      invalidAnnotationIds: _0x17bf86['map']((_0x31b90e) => _0x31b90e['id']),
    };
  return { ok: !![], reason: '' };
}
export function buildSegmentRetakePromptText(_0xe262be) {
  const _0x3e1501 = String(_0xe262be || '')['trim']();
  return _0x3e1501 ? '：' + _0x3e1501 : '';
}
export function buildSegmentRetakePromptTime(_0xb6d7f) {
  const _0x361dfb = Math['max'](0x0, finiteNumber(_0xb6d7f)),
    _0x340b9d = Math['floor'](_0x361dfb / 0x3c),
    _0x336960 = _0x361dfb - _0x340b9d * 0x3c;
  return String(_0x340b9d)['padStart'](0x2, '0') + ':' + _0x336960['toFixed'](0x2)['padStart'](0x5, '0');
}
