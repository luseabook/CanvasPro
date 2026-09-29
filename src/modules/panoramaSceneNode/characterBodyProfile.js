const DEFAULT_CHARACTER_BODY_HEIGHT = 1.92;
function finiteBodyValue(_0x425c5b, _0x27c901, _0x44cf2e, _0x12a831) {
  const _0x48403a = Number(_0x425c5b);
  return Number['isFinite'](_0x48403a)
    ? Math['max'](_0x44cf2e, Math['min'](_0x12a831, _0x48403a))
    : _0x27c901;
}
export function captureCharacterModelBodyProfileBase(_0x255f4e) {
  const _0x1d829d = _0x255f4e?.['getObjectByName']?.('Head');
  return {
    rootScale: {
      x: Number(_0x255f4e?.['scale']?.['x']) || 0x1,
      y: Number(_0x255f4e?.['scale']?.['y']) || 0x1,
      z: Number(_0x255f4e?.['scale']?.['z']) || 0x1,
    },
    headScale: _0x1d829d?.['scale']
      ? {
          x: Number(_0x1d829d['scale']['x']) || 0x1,
          y: Number(_0x1d829d['scale']['y']) || 0x1,
          z: Number(_0x1d829d['scale']['z']) || 0x1,
        }
      : null,
  };
}
export function applyCharacterBodyProfile(_0x469955, _0x47cdf4 = {}) {
  if (!_0x469955) return;
  const _0x59506b = finiteBodyValue(_0x47cdf4?.['height'], DEFAULT_CHARACTER_BODY_HEIGHT, 0.55, 2.3),
    _0xef77ef = _0x59506b / DEFAULT_CHARACTER_BODY_HEIGHT,
    _0x3fd269 = finiteBodyValue(_0x47cdf4?.['shoulderScale'], 0x1, 0.65, 1.35),
    _0x4a0aa6 = finiteBodyValue(_0x47cdf4?.['hipScale'], 0x1, 0.65, 1.35),
    _0x4e2536 = (_0x3fd269 + _0x4a0aa6) / 0x2,
    _0x34ca37 = finiteBodyValue(_0x47cdf4?.['depthScale'], 0x1, 0.75, 1.25),
    _0x4953ce = finiteBodyValue(_0x47cdf4?.['headScale'], 0x1, 0.85, 1.45);
  (_0x469955['proxyRoot']?.['scale']?.['set']?.(_0xef77ef * _0x4e2536, _0xef77ef, _0xef77ef * _0x34ca37),
    _0x469955['parts']?.['head']?.['scale']?.['multiplyScalar']?.(_0x4953ce));
  if (!_0x469955['modelRoot']) return;
  !_0x469955['modelBodyProfileBase'] &&
    (_0x469955['modelBodyProfileBase'] = captureCharacterModelBodyProfileBase(_0x469955['modelRoot']));
  const _0x2aef98 = _0x469955['modelBodyProfileBase'];
  _0x469955['modelRoot']['scale']['set'](
    _0x2aef98['rootScale']['x'] * _0xef77ef * _0x4e2536,
    _0x2aef98['rootScale']['y'] * _0xef77ef,
    _0x2aef98['rootScale']['z'] * _0xef77ef * _0x34ca37,
  );
  const _0x3782f6 = _0x469955['modelRoot']['getObjectByName']?.('Head');
  (_0x3782f6?.['scale'] &&
    _0x2aef98['headScale'] &&
    _0x3782f6['scale']['set'](
      _0x2aef98['headScale']['x'] * _0x4953ce,
      _0x2aef98['headScale']['y'] * _0x4953ce,
      _0x2aef98['headScale']['z'] * _0x4953ce,
    ),
    _0x469955['modelRoot']['updateMatrixWorld']?.(!![]));
}
