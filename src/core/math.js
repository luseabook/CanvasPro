export function generateId(_0x295c27 = 'id') {
  return _0x295c27 + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}
export function screenToWorld(_0x27bbce, _0x367a29, _0x3e6c66) {
  const { x: _0x3f56cd, y: _0x3315bc, zoom: _0x5f3616 } = _0x3e6c66;
  return { x: (_0x27bbce - _0x3f56cd) / _0x5f3616, y: (_0x367a29 - _0x3315bc) / _0x5f3616 };
}
export function worldToScreen(_0xd3bcde, _0x2745c2, _0x4f6604) {
  const { x: _0x122500, y: _0x2dbd0d, zoom: _0x1121a0 } = _0x4f6604;
  return { x: _0xd3bcde * _0x1121a0 + _0x122500, y: _0x2745c2 * _0x1121a0 + _0x2dbd0d };
}
export const CANVAS_GRID_SIZE = 20;
export function snapToCanvasGrid(_0x3634b3, _0x15bd4d = CANVAS_GRID_SIZE) {
  const _0xf991bd =
      Number.isFinite(Number(_0x15bd4d)) && Number(_0x15bd4d) > 0 ? Number(_0x15bd4d) : CANVAS_GRID_SIZE,
    _0x1f34a9 = Number(_0x3634b3);
  if (!Number.isFinite(_0x1f34a9)) return 0;
  return Math.round(_0x1f34a9 / _0xf991bd) * _0xf991bd;
}
export function isPointInRect(_0x420f3f, _0x38768a, _0x4ec975, _0x20600d, _0x4f7df0, _0x3e11d4) {
  return (
    _0x420f3f >= _0x4ec975 &&
    _0x420f3f <= _0x4ec975 + _0x4f7df0 &&
    _0x38768a >= _0x20600d &&
    _0x38768a <= _0x20600d + _0x3e11d4
  );
}
export function isRectIntersect(
  _0x2607c1,
  _0x45a637,
  _0x2db3f0,
  _0x1d5a5f,
  _0x289f20,
  _0x19105c,
  _0x5a281e,
  _0x2e235f,
) {
  return !(
    _0x289f20 >= _0x2607c1 + _0x2db3f0 ||
    _0x289f20 + _0x5a281e <= _0x2607c1 ||
    _0x19105c >= _0x45a637 + _0x1d5a5f ||
    _0x19105c + _0x2e235f <= _0x45a637
  );
}
export function findAvailablePosition(
  _0xc92ddd,
  _0x1c78fc,
  _0x3b8d8b,
  _0x29b130,
  _0x57cc56,
  _0x30712c = 20,
  _0x57ba92 = 'right',
) {
  let _0x3c1fe7 = _0x1c78fc,
    _0x406f72 = _0x3b8d8b;
  const _0x34a751 = Object.values(_0xc92ddd);
  if (_0x34a751.length === 0) return { x: _0x3c1fe7, y: _0x406f72 };
  let _0x10db3a = true;
  while (_0x10db3a) {
    _0x10db3a = false;
    for (const _0x2876ae of _0x34a751) {
      const _0x2cbc3c = _0x2876ae.x,
        _0x4a23d1 = _0x2876ae.y,
        _0x5e5dd5 = _0x2876ae.width || 100,
        _0x1795cd = _0x2876ae.height || 100;
      if (
        isRectIntersect(
          _0x3c1fe7,
          _0x406f72,
          _0x29b130,
          _0x57cc56,
          _0x2cbc3c,
          _0x4a23d1,
          _0x5e5dd5,
          _0x1795cd,
        )
      ) {
        if (_0x57ba92 === 'down') _0x406f72 = _0x4a23d1 + _0x1795cd + _0x30712c;
        else
          _0x57ba92 === 'left'
            ? (_0x3c1fe7 = _0x2cbc3c - _0x30712c - _0x29b130)
            : (_0x3c1fe7 = _0x2cbc3c + _0x5e5dd5 + _0x30712c);
        _0x10db3a = true;
        break;
      }
    }
  }
  return { x: _0x3c1fe7, y: _0x406f72 };
}
const ALIGN_SKIP_KEYS = [
  'isLocked',
  'locked',
  'isHidden',
  'hidden',
  'isTemp',
  'temp',
  'temporary',
  'ephemeral',
  'isDeleted',
  'deleted',
];
function _toFiniteNumber(_0x5564e2, _0x1a2827 = 0) {
  const _0x378624 = Number(_0x5564e2);
  return Number.isFinite(_0x378624) ? _0x378624 : _0x1a2827;
}
function _toAlignRatio(_0x1f1a64, _0x51ae92 = 0.5) {
  return Math.max(0, Math.min(1, _toFiniteNumber(_0x1f1a64, _0x51ae92)));
}
function _isAlignableNode(_0x3a52a1) {
  if (!_0x3a52a1 || typeof _0x3a52a1 !== 'object') return false;
  for (const _0x2d3c59 of ALIGN_SKIP_KEYS) {
    if (_0x3a52a1[_0x2d3c59]) return false;
  }
  return true;
}
export function getAlignableSelectionNodes(_0x40288c, _0x10ab4e) {
  if (!_0x40288c || typeof _0x40288c !== 'object') return [];
  if (!Array.isArray(_0x10ab4e) || _0x10ab4e.length === 0) return [];
  const _0x3d381d = [];
  for (const _0x3f4152 of _0x10ab4e) {
    const _0x45cda3 = _0x40288c[_0x3f4152];
    if (!_isAlignableNode(_0x45cda3)) continue;
    const _0x19e95d = _toFiniteNumber(_0x45cda3.x, 0),
      _0x4df0b9 = _toFiniteNumber(_0x45cda3.y, 0),
      _0x2cdef1 = Math.max(0, _toFiniteNumber(_0x45cda3.width, 0)),
      _0x125c6f = Math.max(0, _toFiniteNumber(_0x45cda3.height, 0)),
      _0x5c82d7 = _0x19e95d,
      _0x3b55e7 = _0x19e95d + _0x2cdef1,
      _0x2252a3 = _0x4df0b9,
      _0x1861a9 = _0x4df0b9 + _0x125c6f;
    _0x3d381d.push({
      id: _0x3f4152,
      node: _0x45cda3,
      x: _0x19e95d,
      y: _0x4df0b9,
      width: _0x2cdef1,
      height: _0x125c6f,
      left: _0x5c82d7,
      right: _0x3b55e7,
      top: _0x2252a3,
      bottom: _0x1861a9,
      cx: _0x5c82d7 + _0x2cdef1 / 2,
      cy: _0x2252a3 + _0x125c6f / 2,
    });
  }
  return _0x3d381d;
}
export function computeSelectionBounds(_0x116c25) {
  if (!Array.isArray(_0x116c25) || _0x116c25.length === 0) return null;
  let _0x364f7a = Infinity,
    _0xdb482f = Infinity,
    _0x39aec5 = -Infinity,
    _0x5a7a51 = -Infinity;
  for (const _0x20ad29 of _0x116c25) {
    ((_0x364f7a = Math.min(_0x364f7a, _0x20ad29.left)),
      (_0xdb482f = Math.min(_0xdb482f, _0x20ad29.top)),
      (_0x39aec5 = Math.max(_0x39aec5, _0x20ad29.right)),
      (_0x5a7a51 = Math.max(_0x5a7a51, _0x20ad29.bottom)));
  }
  if (!Number.isFinite(_0x364f7a) || !Number.isFinite(_0xdb482f)) return null;
  return {
    minX: _0x364f7a,
    maxX: _0x39aec5,
    minY: _0xdb482f,
    maxY: _0x5a7a51,
    width: _0x39aec5 - _0x364f7a,
    height: _0x5a7a51 - _0xdb482f,
    centerX: (_0x364f7a + _0x39aec5) / 2,
    centerY: (_0xdb482f + _0x5a7a51) / 2,
  };
}
export function computeNodesWorldBounds(_0x68fab1, _0x2c6997 = null) {
  const _0x372a57 = [];
  if (Array.isArray(_0x68fab1)) _0x372a57.push(..._0x68fab1.filter(Boolean));
  else {
    if (Array.isArray(_0x2c6997) && _0x2c6997.length > 0)
      for (const _0x11a160 of _0x2c6997) {
        const _0x3275f9 = _0x68fab1?.[_0x11a160];
        if (_0x3275f9) _0x372a57.push(_0x3275f9);
      }
    else _0x68fab1 && typeof _0x68fab1 === 'object' && _0x372a57.push(...Object.values(_0x68fab1));
  }
  if (_0x372a57.length === 0) return null;
  let _0x506c94 = Infinity,
    _0x4d9e47 = Infinity,
    _0x448edc = -Infinity,
    _0x288d5e = -Infinity;
  for (const _0x152ef0 of _0x372a57) {
    if (!_0x152ef0 || typeof _0x152ef0 !== 'object') continue;
    const _0x10d20d = _toFiniteNumber(_0x152ef0.x, 0),
      _0x395897 = _toFiniteNumber(_0x152ef0.y, 0),
      _0x389674 = Math.max(0, _toFiniteNumber(_0x152ef0.width, 0)),
      _0x574e22 = Math.max(0, _toFiniteNumber(_0x152ef0.height, 0));
    ((_0x506c94 = Math.min(_0x506c94, _0x10d20d)),
      (_0x4d9e47 = Math.min(_0x4d9e47, _0x395897)),
      (_0x448edc = Math.max(_0x448edc, _0x10d20d + _0x389674)),
      (_0x288d5e = Math.max(_0x288d5e, _0x395897 + _0x574e22)));
  }
  if (
    !Number.isFinite(_0x506c94) ||
    !Number.isFinite(_0x4d9e47) ||
    !Number.isFinite(_0x448edc) ||
    !Number.isFinite(_0x288d5e)
  )
    return null;
  return {
    minX: _0x506c94,
    minY: _0x4d9e47,
    maxX: _0x448edc,
    maxY: _0x288d5e,
    width: Math.max(0, _0x448edc - _0x506c94),
    height: Math.max(0, _0x288d5e - _0x4d9e47),
    centerX: (_0x506c94 + _0x448edc) / 2,
    centerY: (_0x4d9e47 + _0x288d5e) / 2,
  };
}
export function computeViewportForWorldBounds(_0x588aac, _0x322872, _0x4fcf44 = {}) {
  if (!_0x588aac || !_0x322872) return null;
  const _0x451606 = _toFiniteNumber(_0x322872.width, 0),
    _0x5d6770 = _toFiniteNumber(_0x322872.height, 0);
  if (!(_0x451606 > 0 && _0x5d6770 > 0)) return null;
  const _0x3d28a6 = Math.max(1, _toFiniteNumber(_0x588aac.width, 0)),
    _0x1b38d4 = Math.max(1, _toFiniteNumber(_0x588aac.height, 0)),
    _0x5af60e = _toFiniteNumber(_0x588aac.centerX, 0),
    _0x5b06c5 = _toFiniteNumber(_0x588aac.centerY, 0),
    _0x4642a5 = Math.max(0, _toFiniteNumber(_0x4fcf44.padding, 0)),
    _0x2997e2 = Math.max(0.0001, _toFiniteNumber(_0x4fcf44.minZoom, 0.2)),
    _0x592f3f = Math.max(_0x2997e2, _toFiniteNumber(_0x4fcf44.maxZoom, 2)),
    _0x41b775 = Number(_0x4fcf44.fixedZoom),
    _0x13d446 = _toAlignRatio(_0x4fcf44.alignX, 0.5),
    _0x53def5 = _toAlignRatio(_0x4fcf44.alignY, 0.5),
    _0x1325e5 = _toAlignRatio(_0x4fcf44.worldAlignX, _0x13d446),
    _0x4b1919 = _toAlignRatio(_0x4fcf44.worldAlignY, _0x53def5),
    _0x5be6d0 = _toAlignRatio(_0x4fcf44.viewportAlignX, _0x13d446),
    _0xa9ae55 = _toAlignRatio(_0x4fcf44.viewportAlignY, _0x53def5),
    _0x163d77 = Math.max(1, _0x451606 - _0x4642a5 * 2),
    _0x5f15dc = Math.max(1, _0x5d6770 - _0x4642a5 * 2),
    _0xdc66a3 = Number.isFinite(_0x41b775)
      ? Math.max(_0x2997e2, Math.min(_0x41b775, _0x592f3f))
      : Math.max(_0x2997e2, Math.min(_0x163d77 / _0x3d28a6, _0x5f15dc / _0x1b38d4, _0x592f3f)),
    _0x48489c = _toFiniteNumber(_0x322872.left, 0) + _0x451606 * _0x5be6d0,
    _0x445124 = _toFiniteNumber(_0x322872.top, 0) + _0x5d6770 * _0xa9ae55,
    _0x31fde2 = _toFiniteNumber(_0x588aac.minX, 0) + _0x3d28a6 * _0x1325e5,
    _0x3b8438 = _toFiniteNumber(_0x588aac.minY, 0) + _0x1b38d4 * _0x4b1919;
  return { x: _0x48489c - _0x31fde2 * _0xdc66a3, y: _0x445124 - _0x3b8438 * _0xdc66a3, zoom: _0xdc66a3 };
}
export function computeAlignTargets(_0x2a49b2, _0xc02b00, _0x281ef4) {
  if (!Array.isArray(_0x2a49b2) || _0x2a49b2.length === 0 || !_0x281ef4) return {};
  const _0x54b064 = {};
  for (const _0x3d0b2f of _0x2a49b2) {
    let _0x1d4293 = _0x3d0b2f.x,
      _0x4d88fd = _0x3d0b2f.y;
    if (_0xc02b00 === 'left') _0x1d4293 = _0x281ef4.minX;
    else {
      if (_0xc02b00 === 'h-center') _0x1d4293 = _0x281ef4.centerX - _0x3d0b2f.width / 2;
      else {
        if (_0xc02b00 === 'right') _0x1d4293 = _0x281ef4.maxX - _0x3d0b2f.width;
        else {
          if (_0xc02b00 === 'top') _0x4d88fd = _0x281ef4.minY;
          else {
            if (_0xc02b00 === 'v-center') _0x4d88fd = _0x281ef4.centerY - _0x3d0b2f.height / 2;
            else {
              if (_0xc02b00 === 'bottom') _0x4d88fd = _0x281ef4.maxY - _0x3d0b2f.height;
            }
          }
        }
      }
    }
    _0x54b064[_0x3d0b2f.id] = { x: _0x1d4293, y: _0x4d88fd };
  }
  return _0x54b064;
}
export function computeDistributeTargets(_0x9a1727, _0x10c212, _0xb85e1d = undefined) {
  if (!Array.isArray(_0x9a1727) || _0x9a1727.length < 2) return {};
  const _0x4aa4b1 = _0x10c212 === 'horizontal',
    _0x2a7e48 = [..._0x9a1727].sort((_0x4bfabf, _0x49b787) => {
      const _0x13313d = _0x4aa4b1 ? _0x4bfabf.left : _0x4bfabf.top,
        _0x524a44 = _0x4aa4b1 ? _0x49b787.left : _0x49b787.top;
      if (_0x13313d !== _0x524a44) return _0x13313d - _0x524a44;
      return String(_0x4bfabf.id).localeCompare(String(_0x49b787.id));
    }),
    _0x4170fb = {};
  for (const _0x1563b6 of _0x2a7e48) {
    _0x4170fb[_0x1563b6.id] = { x: _0x1563b6.x, y: _0x1563b6.y };
  }
  if (_0x2a7e48.length <= 1) return _0x4170fb;
  const _0x2caae4 = Number(_0xb85e1d);
  if (Number.isFinite(_0x2caae4) && _0x2caae4 >= 0) {
    let _0x3b8f5b = _0x4aa4b1 ? _0x2a7e48[0].left : _0x2a7e48[0].top;
    for (let _0x18b9ad = 0; _0x18b9ad < _0x2a7e48.length; _0x18b9ad += 1) {
      const _0x4e8be3 = _0x2a7e48[_0x18b9ad];
      if (_0x18b9ad === 0) {
        _0x3b8f5b += (_0x4aa4b1 ? _0x4e8be3.width : _0x4e8be3.height) + _0x2caae4;
        continue;
      }
      _0x4aa4b1
        ? ((_0x4170fb[_0x4e8be3.id] = { x: _0x3b8f5b, y: _0x4e8be3.y }),
          (_0x3b8f5b += _0x4e8be3.width + _0x2caae4))
        : ((_0x4170fb[_0x4e8be3.id] = { x: _0x4e8be3.x, y: _0x3b8f5b }),
          (_0x3b8f5b += _0x4e8be3.height + _0x2caae4));
    }
    return _0x4170fb;
  }
  if (_0x2a7e48.length <= 2) return _0x4170fb;
  const _0x1d4f57 = _0x2a7e48[0],
    _0x4f7f99 = _0x2a7e48[_0x2a7e48.length - 1],
    _0x54ea40 = _0x2a7e48.reduce(
      (_0x34a1eb, _0x3a154d) => _0x34a1eb + (_0x4aa4b1 ? _0x3a154d.width : _0x3a154d.height),
      0,
    ),
    _0x2fea1b = _0x4aa4b1
      ? Math.max(0, _0x4f7f99.right - _0x1d4f57.left)
      : Math.max(0, _0x4f7f99.bottom - _0x1d4f57.top),
    _0x42e808 = (_0x2fea1b - _0x54ea40) / (_0x2a7e48.length - 1);
  let _0x290f2e = _0x4aa4b1 ? _0x1d4f57.left : _0x1d4f57.top;
  for (let _0x2c78ab = 0; _0x2c78ab < _0x2a7e48.length; _0x2c78ab += 1) {
    const _0xa0188e = _0x2a7e48[_0x2c78ab];
    if (_0x2c78ab === 0 || _0x2c78ab === _0x2a7e48.length - 1) {
      _0x290f2e += (_0x4aa4b1 ? _0xa0188e.width : _0xa0188e.height) + _0x42e808;
      continue;
    }
    _0x4aa4b1
      ? ((_0x4170fb[_0xa0188e.id] = { x: _0x290f2e, y: _0xa0188e.y }),
        (_0x290f2e += _0xa0188e.width + _0x42e808))
      : ((_0x4170fb[_0xa0188e.id] = { x: _0xa0188e.x, y: _0x290f2e }),
        (_0x290f2e += _0xa0188e.height + _0x42e808));
  }
  return _0x4170fb;
}
function _sortLayoutItems(_0x34dd8d) {
  return [...(Array.isArray(_0x34dd8d) ? _0x34dd8d : [])].sort((_0x3ab16b, _0x15a5fa) => {
    const _0x50c8be = _toFiniteNumber(_0x3ab16b?.top ?? _0x3ab16b?.y, 0),
      _0x230be6 = _toFiniteNumber(_0x15a5fa?.top ?? _0x15a5fa?.y, 0);
    if (_0x50c8be !== _0x230be6) return _0x50c8be - _0x230be6;
    const _0x541371 = _toFiniteNumber(_0x3ab16b?.left ?? _0x3ab16b?.x, 0),
      _0x47f0b6 = _toFiniteNumber(_0x15a5fa?.left ?? _0x15a5fa?.x, 0);
    if (_0x541371 !== _0x47f0b6) return _0x541371 - _0x47f0b6;
    return String(_0x3ab16b?.id || '').localeCompare(String(_0x15a5fa?.id || ''));
  });
}
export function computeArrangeRowTargets(_0x2ded29, _0x1aeb5d = {}) {
  const _0x57093e = _sortLayoutItems(_0x2ded29);
  if (_0x57093e.length === 0) return {};
  const _0x4d0eb8 = computeSelectionBounds(_0x57093e);
  if (!_0x4d0eb8) return {};
  const _0x58dc = Math.max(0, _toFiniteNumber(_0x1aeb5d.gap, 40)),
    _0x27b13a = String(_0x1aeb5d.align || 'top');
  let _0x3a9b40 = _0x4d0eb8.minX;
  const _0x3f35d8 = {};
  for (const _0x1dab6a of _0x57093e) {
    let _0x5881d7 = _0x4d0eb8.minY;
    if (_0x27b13a === 'center' || _0x27b13a === 'middle')
      _0x5881d7 = _0x4d0eb8.centerY - _0x1dab6a.height / 2;
    else _0x27b13a === 'bottom' && (_0x5881d7 = _0x4d0eb8.maxY - _0x1dab6a.height);
    ((_0x3f35d8[_0x1dab6a.id] = { x: _0x3a9b40, y: _0x5881d7 }), (_0x3a9b40 += _0x1dab6a.width + _0x58dc));
  }
  return _0x3f35d8;
}
export function computeArrangeColumnTargets(_0x131562, _0x1a6491 = {}) {
  const _0x4e04c9 = _sortLayoutItems(_0x131562);
  if (_0x4e04c9.length === 0) return {};
  const _0x3fc0c7 = computeSelectionBounds(_0x4e04c9);
  if (!_0x3fc0c7) return {};
  const _0x13bf53 = Math.max(0, _toFiniteNumber(_0x1a6491.gap, 40)),
    _0x587c82 = String(_0x1a6491.align || 'left');
  let _0x353347 = _0x3fc0c7.minY;
  const _0x3c0b3c = {};
  for (const _0x3471f5 of _0x4e04c9) {
    let _0x1b8eb4 = _0x3fc0c7.minX;
    if (_0x587c82 === 'center' || _0x587c82 === 'middle') _0x1b8eb4 = _0x3fc0c7.centerX - _0x3471f5.width / 2;
    else _0x587c82 === 'right' && (_0x1b8eb4 = _0x3fc0c7.maxX - _0x3471f5.width);
    ((_0x3c0b3c[_0x3471f5.id] = { x: _0x1b8eb4, y: _0x353347 }), (_0x353347 += _0x3471f5.height + _0x13bf53));
  }
  return _0x3c0b3c;
}
export function computeArrangeGridTargets(_0x2106a6, _0x399b4b = {}) {
  const _0x400793 = _sortLayoutItems(_0x2106a6);
  if (_0x400793.length === 0) return {};
  const _0x2d4bc0 = computeSelectionBounds(_0x400793);
  if (!_0x2d4bc0) return {};
  const _0x138531 = Number(_0x399b4b.columns),
    _0x22208a =
      Number.isFinite(_0x138531) && _0x138531 > 0
        ? Math.max(1, Math.trunc(_0x138531))
        : Math.ceil(Math.sqrt(_0x400793.length)),
    _0x31fd5b = Math.max(0, _toFiniteNumber(_0x399b4b.gapX ?? _0x399b4b.gap, 40)),
    _0x3cd42c = Math.max(0, _toFiniteNumber(_0x399b4b.gapY ?? _0x399b4b.gap, 40)),
    _0x36d87b = _0x400793.reduce((_0x5d482d, _0x81d5b8) => Math.max(_0x5d482d, _0x81d5b8.width), 0),
    _0x10fa81 = _0x400793.reduce((_0x265eb4, _0x3911a5) => Math.max(_0x265eb4, _0x3911a5.height), 0),
    _0x53639b = {};
  return (
    _0x400793.forEach((_0x19885d, _0x8dded9) => {
      const _0x42d5fb = _0x8dded9 % _0x22208a,
        _0x1a88a4 = Math.floor(_0x8dded9 / _0x22208a);
      _0x53639b[_0x19885d.id] = {
        x: _0x2d4bc0.minX + _0x42d5fb * (_0x36d87b + _0x31fd5b),
        y: _0x2d4bc0.minY + _0x1a88a4 * (_0x10fa81 + _0x3cd42c),
      };
    }),
    _0x53639b
  );
}
export function computeMoveNearNodeTargets(_0x3adab4, _0x253527, _0x2e6e66 = {}) {
  const _0x22077e = Array.isArray(_0x3adab4) ? _0x3adab4.filter(Boolean) : [];
  if (_0x22077e.length === 0 || !_0x253527) return {};
  const _0x161b0a = computeSelectionBounds(_0x22077e);
  if (!_0x161b0a) return {};
  const _0x3f62c6 = Math.max(0, _toFiniteNumber(_0x2e6e66.gap, 40)),
    _0x3a3d17 = String(_0x2e6e66.placement || 'right');
  let _0x14be2d = _0x161b0a.minX,
    _0x16e87e = _0x161b0a.minY;
  if (_0x3a3d17 === 'left')
    ((_0x14be2d = _0x253527.left - _0x3f62c6 - _0x161b0a.width),
      (_0x16e87e = _0x253527.cy - _0x161b0a.height / 2));
  else {
    if (_0x3a3d17 === 'top')
      ((_0x14be2d = _0x253527.cx - _0x161b0a.width / 2),
        (_0x16e87e = _0x253527.top - _0x3f62c6 - _0x161b0a.height));
    else
      _0x3a3d17 === 'bottom'
        ? ((_0x14be2d = _0x253527.cx - _0x161b0a.width / 2), (_0x16e87e = _0x253527.bottom + _0x3f62c6))
        : ((_0x14be2d = _0x253527.right + _0x3f62c6), (_0x16e87e = _0x253527.cy - _0x161b0a.height / 2));
  }
  const _0xab1716 = _0x14be2d - _0x161b0a.minX,
    _0x3acb66 = _0x16e87e - _0x161b0a.minY,
    _0x32fac8 = {};
  for (const _0x201045 of _0x22077e) {
    _0x32fac8[_0x201045.id] = { x: _0x201045.x + _0xab1716, y: _0x201045.y + _0x3acb66 };
  }
  return _0x32fac8;
}
export function buildNodeOffsetPlan(_0x8795fb, _0x122daa) {
  if (!_0x8795fb || typeof _0x8795fb !== 'object') return {};
  if (!_0x122daa || typeof _0x122daa !== 'object') return {};
  const _0x5f4fa7 = {};
  for (const [_0x2840b6, _0xf0dd34] of Object.entries(_0x122daa)) {
    const _0x5535a2 = _0x8795fb[_0x2840b6];
    if (!_0x5535a2 || !_0xf0dd34) continue;
    const _0x5b8a0b = _toFiniteNumber(_0x5535a2.x, 0),
      _0x4f31ba = _toFiniteNumber(_0x5535a2.y, 0),
      _0x175661 = _toFiniteNumber(_0xf0dd34.x, _0x5b8a0b),
      _0x2e8bc1 = _toFiniteNumber(_0xf0dd34.y, _0x4f31ba),
      _0x3e0be2 = _0x175661 - _0x5b8a0b,
      _0x26a908 = _0x2e8bc1 - _0x4f31ba;
    if (Math.abs(_0x3e0be2) < 0.000001 && Math.abs(_0x26a908) < 0.000001) continue;
    _0x5f4fa7[_0x2840b6] = { dx: _0x3e0be2, dy: _0x26a908 };
  }
  return _0x5f4fa7;
}
export function resolveSnapThresholdInWorld(_0x2bedc4, _0x552ed2 = 8) {
  const _0x1799f5 = Number.isFinite(_0x2bedc4) && _0x2bedc4 > 0 ? _0x2bedc4 : 1,
    _0x3db144 = Number.isFinite(_0x552ed2) ? _0x552ed2 : 8;
  return _0x3db144 / _0x1799f5;
}
export function computeSingleNodeSnapGuides(_0x563977) {
  const {
      nodesById: _0x13916a,
      dragNodeId: _0x2d4e10,
      proposedX: _0x58a6d9,
      proposedY: _0x2e0fa7,
      width: _0x1c7a99,
      height: _0x518588,
      viewport: _0x436eb3,
      thresholdPx: thresholdPx = 8,
      spatialIndex: spatialIndex = null,
    } = _0x563977 || {},
    _0x3147b7 = _toFiniteNumber(_0x58a6d9, 0),
    _0x2d6e60 = _toFiniteNumber(_0x2e0fa7, 0),
    _0x39a8e2 = _toFiniteNumber(_0x436eb3?.x, 0),
    _0x35d4e3 = _toFiniteNumber(_0x436eb3?.y, 0),
    _0x5685d1 = _toFiniteNumber(_0x436eb3?.zoom, 1) || 1,
    _0x389083 = Math.max(0, _toFiniteNumber(_0x1c7a99, 200)),
    _0x3a5aaa = Math.max(0, _toFiniteNumber(_0x518588, 200)),
    _0x472555 = { snappedX: _0x3147b7, snappedY: _0x2d6e60, guideLines: [] };
  if (!_0x13916a || typeof _0x13916a !== 'object' || !_0x2d4e10 || !_0x13916a[_0x2d4e10]) return _0x472555;
  const _0x29f0c2 = resolveSnapThresholdInWorld(_0x5685d1, thresholdPx),
    _0x3d7af1 = _0x3147b7,
    _0x2bb4b2 = _0x3147b7 + _0x389083,
    _0x50b505 = _0x2d6e60,
    _0x1da1f8 = _0x2d6e60 + _0x3a5aaa;
  let _0x2df5f1 = null,
    _0x4246d2 = null,
    _0x227657 = null,
    _0x58d3e4 = null;
  const _0x19434d = spatialIndex
    ? getNodeSpatialQueryNodes(
        _0x13916a,
        collectSnapSearchCandidateIds(
          spatialIndex,
          { x: _0x3147b7, y: _0x2d6e60, width: _0x389083, height: _0x3a5aaa },
          _0x29f0c2,
        ),
      )
    : Object.values(_0x13916a);
  for (const _0xf80f4e of _0x19434d) {
    if (!_0xf80f4e || _0xf80f4e.id === _0x2d4e10) continue;
    const _0x33c7e4 = _toFiniteNumber(_0xf80f4e.x, 0),
      _0x2ed3ff = _0x33c7e4 + Math.max(0, _toFiniteNumber(_0xf80f4e.width, 200)),
      _0x809658 = _toFiniteNumber(_0xf80f4e.y, 0),
      _0x5b7a20 = _0x809658 + Math.max(0, _toFiniteNumber(_0xf80f4e.height, 200));
    if (_0x2df5f1 === null) {
      if (Math.abs(_0x3d7af1 - _0x33c7e4) < _0x29f0c2) ((_0x2df5f1 = _0x33c7e4), (_0x227657 = _0x33c7e4));
      else {
        if (Math.abs(_0x3d7af1 - _0x2ed3ff) < _0x29f0c2) ((_0x2df5f1 = _0x2ed3ff), (_0x227657 = _0x2ed3ff));
        else {
          if (Math.abs(_0x2bb4b2 - _0x33c7e4) < _0x29f0c2)
            ((_0x2df5f1 = _0x33c7e4 - _0x389083), (_0x227657 = _0x33c7e4));
          else
            Math.abs(_0x2bb4b2 - _0x2ed3ff) < _0x29f0c2 &&
              ((_0x2df5f1 = _0x2ed3ff - _0x389083), (_0x227657 = _0x2ed3ff));
        }
      }
    }
    if (_0x4246d2 === null) {
      if (Math.abs(_0x50b505 - _0x809658) < _0x29f0c2) ((_0x4246d2 = _0x809658), (_0x58d3e4 = _0x809658));
      else {
        if (Math.abs(_0x50b505 - _0x5b7a20) < _0x29f0c2) ((_0x4246d2 = _0x5b7a20), (_0x58d3e4 = _0x5b7a20));
        else {
          if (Math.abs(_0x1da1f8 - _0x809658) < _0x29f0c2)
            ((_0x4246d2 = _0x809658 - _0x3a5aaa), (_0x58d3e4 = _0x809658));
          else
            Math.abs(_0x1da1f8 - _0x5b7a20) < _0x29f0c2 &&
              ((_0x4246d2 = _0x5b7a20 - _0x3a5aaa), (_0x58d3e4 = _0x5b7a20));
        }
      }
    }
    if (_0x2df5f1 !== null && _0x4246d2 !== null) break;
  }
  const _0x773b43 = [],
    _0x4b8f81 = [];
  if (_0x2df5f1 !== null) {
    const _0x5eee31 = collectSnapMatchNodes(_0x13916a, _0x19434d, spatialIndex, 'x', _0x227657);
    for (const _0x3d59ed of _0x5eee31) {
      if (!_0x3d59ed || _0x3d59ed.id === _0x2d4e10) continue;
      const _0x47d33a = _toFiniteNumber(_0x3d59ed.x, 0),
        _0x3b63a1 = _0x47d33a + Math.max(0, _toFiniteNumber(_0x3d59ed.width, 200));
      (Math.abs(_0x47d33a - _0x227657) < SNAP_MATCH_EPSILON ||
        Math.abs(_0x3b63a1 - _0x227657) < SNAP_MATCH_EPSILON) &&
        _0x773b43.push(_0x3d59ed);
    }
  }
  if (_0x4246d2 !== null) {
    const _0x2f70c8 = collectSnapMatchNodes(_0x13916a, _0x19434d, spatialIndex, 'y', _0x58d3e4);
    for (const _0xebcbd6 of _0x2f70c8) {
      if (!_0xebcbd6 || _0xebcbd6.id === _0x2d4e10) continue;
      const _0x2618c6 = _toFiniteNumber(_0xebcbd6.y, 0),
        _0x325e5c = _0x2618c6 + Math.max(0, _toFiniteNumber(_0xebcbd6.height, 200));
      (Math.abs(_0x2618c6 - _0x58d3e4) < SNAP_MATCH_EPSILON ||
        Math.abs(_0x325e5c - _0x58d3e4) < SNAP_MATCH_EPSILON) &&
        _0x4b8f81.push(_0xebcbd6);
    }
  }
  if (_0x2df5f1 !== null) {
    _0x472555.snappedX = _0x2df5f1;
    const _0x20777a = _0x2d6e60 + (_0x4246d2 !== null ? _0x4246d2 - _0x2d6e60 : 0),
      _0x262080 = _0x20777a + _0x3a5aaa;
    let _0x4937d6 = _0x20777a,
      _0x225e12 = _0x262080;
    (_0x773b43.forEach((_0x2aa540) => {
      const _0x31ba29 = _toFiniteNumber(_0x2aa540.y, 0),
        _0x485ccb = Math.max(0, _toFiniteNumber(_0x2aa540.height, 200));
      ((_0x4937d6 = Math.min(_0x4937d6, _0x31ba29)),
        (_0x225e12 = Math.max(_0x225e12, _0x31ba29 + _0x485ccb)));
    }),
      _0x472555.guideLines.push({
        type: 'v',
        pos: _0x227657 * _0x5685d1 + _0x39a8e2,
        start: _0x4937d6 * _0x5685d1 + _0x35d4e3,
        end: _0x225e12 * _0x5685d1 + _0x35d4e3,
      }));
  }
  if (_0x4246d2 !== null) {
    _0x472555.snappedY = _0x4246d2;
    const _0x46293a = _0x3147b7 + (_0x2df5f1 !== null ? _0x2df5f1 - _0x3147b7 : 0),
      _0x15f1e2 = _0x46293a + _0x389083;
    let _0x4af0a3 = _0x46293a,
      _0x2206c8 = _0x15f1e2;
    (_0x4b8f81.forEach((_0x1adf5d) => {
      const _0x3ec7df = _toFiniteNumber(_0x1adf5d.x, 0),
        _0x3ab874 = Math.max(0, _toFiniteNumber(_0x1adf5d.width, 200));
      ((_0x4af0a3 = Math.min(_0x4af0a3, _0x3ec7df)),
        (_0x2206c8 = Math.max(_0x2206c8, _0x3ec7df + _0x3ab874)));
    }),
      _0x472555.guideLines.push({
        type: 'h',
        pos: _0x58d3e4 * _0x5685d1 + _0x35d4e3,
        start: _0x4af0a3 * _0x5685d1 + _0x39a8e2,
        end: _0x2206c8 * _0x5685d1 + _0x39a8e2,
      }));
  }
  return _0x472555;
}
export function computeMultiNodeSnapGuides(_0xf0e0b4) {
  const {
      nodesById: _0xc3feea,
      movingNodeIds: _0x18f069,
      proposedBounds: _0xfe7a3e,
      viewport: _0x3422e2,
      thresholdPx: thresholdPx = 8,
      spatialIndex: spatialIndex = null,
    } = _0xf0e0b4 || {},
    _0x40025f = _toFiniteNumber(_0xfe7a3e?.minX, 0),
    _0x4ac6b1 = _toFiniteNumber(_0xfe7a3e?.minY, 0),
    _0x235e91 = Math.max(0, _toFiniteNumber(_0xfe7a3e?.width, 0)),
    _0x56af87 = Math.max(0, _toFiniteNumber(_0xfe7a3e?.height, 0)),
    _0x2402f7 = _toFiniteNumber(_0x3422e2?.x, 0),
    _0x255af2 = _toFiniteNumber(_0x3422e2?.y, 0),
    _0x27a1ef = _toFiniteNumber(_0x3422e2?.zoom, 1) || 1,
    _0x570e17 = { snappedX: _0x40025f, snappedY: _0x4ac6b1, guideLines: [] };
  if (!_0xc3feea || typeof _0xc3feea !== 'object') return _0x570e17;
  const _0x37d4e2 = new Set(Array.isArray(_0x18f069) ? _0x18f069.filter(Boolean) : []);
  if (_0x37d4e2.size === 0) return _0x570e17;
  const _0x7cbf09 = resolveSnapThresholdInWorld(_0x27a1ef, thresholdPx),
    _0x1fbab2 = _0x40025f,
    _0x1d2ce1 = _0x40025f + _0x235e91,
    _0x57e9dd = _0x4ac6b1,
    _0x409834 = _0x4ac6b1 + _0x56af87;
  let _0x2649ac = null,
    _0x149771 = null,
    _0x1ebe5e = null,
    _0x3d4821 = null;
  const _0x4f9f61 = spatialIndex
    ? getNodeSpatialQueryNodes(
        _0xc3feea,
        collectSnapSearchCandidateIds(
          spatialIndex,
          { x: _0x40025f, y: _0x4ac6b1, width: _0x235e91, height: _0x56af87 },
          _0x7cbf09,
        ),
      )
    : Object.values(_0xc3feea);
  for (const _0x50af63 of _0x4f9f61) {
    if (!_0x50af63 || _0x37d4e2.has(_0x50af63.id)) continue;
    const _0x1c4284 = _toFiniteNumber(_0x50af63.x, 0),
      _0x1d8855 = _0x1c4284 + Math.max(0, _toFiniteNumber(_0x50af63.width, 200)),
      _0x29ffa8 = _toFiniteNumber(_0x50af63.y, 0),
      _0x5a404b = _0x29ffa8 + Math.max(0, _toFiniteNumber(_0x50af63.height, 200));
    if (_0x2649ac === null) {
      if (Math.abs(_0x1fbab2 - _0x1c4284) < _0x7cbf09) ((_0x2649ac = _0x1c4284), (_0x1ebe5e = _0x1c4284));
      else {
        if (Math.abs(_0x1fbab2 - _0x1d8855) < _0x7cbf09) ((_0x2649ac = _0x1d8855), (_0x1ebe5e = _0x1d8855));
        else {
          if (Math.abs(_0x1d2ce1 - _0x1c4284) < _0x7cbf09)
            ((_0x2649ac = _0x1c4284 - _0x235e91), (_0x1ebe5e = _0x1c4284));
          else
            Math.abs(_0x1d2ce1 - _0x1d8855) < _0x7cbf09 &&
              ((_0x2649ac = _0x1d8855 - _0x235e91), (_0x1ebe5e = _0x1d8855));
        }
      }
    }
    if (_0x149771 === null) {
      if (Math.abs(_0x57e9dd - _0x29ffa8) < _0x7cbf09) ((_0x149771 = _0x29ffa8), (_0x3d4821 = _0x29ffa8));
      else {
        if (Math.abs(_0x57e9dd - _0x5a404b) < _0x7cbf09) ((_0x149771 = _0x5a404b), (_0x3d4821 = _0x5a404b));
        else {
          if (Math.abs(_0x409834 - _0x29ffa8) < _0x7cbf09)
            ((_0x149771 = _0x29ffa8 - _0x56af87), (_0x3d4821 = _0x29ffa8));
          else
            Math.abs(_0x409834 - _0x5a404b) < _0x7cbf09 &&
              ((_0x149771 = _0x5a404b - _0x56af87), (_0x3d4821 = _0x5a404b));
        }
      }
    }
    if (_0x2649ac !== null && _0x149771 !== null) break;
  }
  const _0x3832aa = [],
    _0xd68f06 = [];
  if (_0x2649ac !== null) {
    const _0x536521 = collectSnapMatchNodes(_0xc3feea, _0x4f9f61, spatialIndex, 'x', _0x1ebe5e);
    for (const _0x32720a of _0x536521) {
      if (!_0x32720a || _0x37d4e2.has(_0x32720a.id)) continue;
      const _0xeb76a3 = _toFiniteNumber(_0x32720a.x, 0),
        _0x3e0e02 = _0xeb76a3 + Math.max(0, _toFiniteNumber(_0x32720a.width, 200));
      (Math.abs(_0xeb76a3 - _0x1ebe5e) < SNAP_MATCH_EPSILON ||
        Math.abs(_0x3e0e02 - _0x1ebe5e) < SNAP_MATCH_EPSILON) &&
        _0x3832aa.push(_0x32720a);
    }
  }
  if (_0x149771 !== null) {
    const _0x5cadfe = collectSnapMatchNodes(_0xc3feea, _0x4f9f61, spatialIndex, 'y', _0x3d4821);
    for (const _0x44f0f0 of _0x5cadfe) {
      if (!_0x44f0f0 || _0x37d4e2.has(_0x44f0f0.id)) continue;
      const _0x2f84e1 = _toFiniteNumber(_0x44f0f0.y, 0),
        _0x12e035 = _0x2f84e1 + Math.max(0, _toFiniteNumber(_0x44f0f0.height, 200));
      (Math.abs(_0x2f84e1 - _0x3d4821) < SNAP_MATCH_EPSILON ||
        Math.abs(_0x12e035 - _0x3d4821) < SNAP_MATCH_EPSILON) &&
        _0xd68f06.push(_0x44f0f0);
    }
  }
  if (_0x2649ac !== null) {
    _0x570e17.snappedX = _0x2649ac;
    const _0x3f1ec8 = _0x4ac6b1 + (_0x149771 !== null ? _0x149771 - _0x4ac6b1 : 0),
      _0x2b3a28 = _0x3f1ec8 + _0x56af87;
    let _0x921fe3 = _0x3f1ec8,
      _0x5ea505 = _0x2b3a28;
    (_0x3832aa.forEach((_0x36f634) => {
      const _0x385121 = _toFiniteNumber(_0x36f634.y, 0),
        _0x2b3d15 = Math.max(0, _toFiniteNumber(_0x36f634.height, 200));
      ((_0x921fe3 = Math.min(_0x921fe3, _0x385121)),
        (_0x5ea505 = Math.max(_0x5ea505, _0x385121 + _0x2b3d15)));
    }),
      _0x570e17.guideLines.push({
        type: 'v',
        pos: _0x1ebe5e * _0x27a1ef + _0x2402f7,
        start: _0x921fe3 * _0x27a1ef + _0x255af2,
        end: _0x5ea505 * _0x27a1ef + _0x255af2,
      }));
  }
  if (_0x149771 !== null) {
    _0x570e17.snappedY = _0x149771;
    const _0x3966ee = _0x40025f + (_0x2649ac !== null ? _0x2649ac - _0x40025f : 0),
      _0x5b4051 = _0x3966ee + _0x235e91;
    let _0x24537a = _0x3966ee,
      _0x2ed34f = _0x5b4051;
    (_0xd68f06.forEach((_0x1bc501) => {
      const _0x30ebff = _toFiniteNumber(_0x1bc501.x, 0),
        _0x39a959 = Math.max(0, _toFiniteNumber(_0x1bc501.width, 200));
      ((_0x24537a = Math.min(_0x24537a, _0x30ebff)),
        (_0x2ed34f = Math.max(_0x2ed34f, _0x30ebff + _0x39a959)));
    }),
      _0x570e17.guideLines.push({
        type: 'h',
        pos: _0x3d4821 * _0x27a1ef + _0x255af2,
        start: _0x24537a * _0x27a1ef + _0x2402f7,
        end: _0x2ed34f * _0x27a1ef + _0x2402f7,
      }));
  }
  return _0x570e17;
}
export function calcWorldBounds(_0x314019, _0x280218 = null) {
  const _0x2f408c = computeNodesWorldBounds(_0x314019);
  if (!_0x2f408c) {
    if (_0x280218) {
      const _0x1170e4 = 0x780,
        _0x55de59 = 0x438,
        _0x2b525b = -_0x280218.x / _0x280218.zoom,
        _0x1a74b8 = -_0x280218.y / _0x280218.zoom,
        _0x3248a3 = _0x1170e4 / _0x280218.zoom,
        _0x1964c4 = _0x55de59 / _0x280218.zoom,
        _0x109aa0 = 0x258;
      return {
        minX: _0x2b525b - _0x109aa0,
        minY: _0x1a74b8 - _0x109aa0,
        maxX: _0x2b525b + _0x3248a3 + _0x109aa0,
        maxY: _0x1a74b8 + _0x1964c4 + _0x109aa0,
        width: _0x3248a3 + _0x109aa0 * 2,
        height: _0x1964c4 + _0x109aa0 * 2,
      };
    }
    return { minX: 0, minY: 0, maxX: 0x7d0, maxY: 0x7d0, width: 0x7d0, height: 0x7d0 };
  }
  const _0x38af0e = 0x258,
    _0x5d2c0f = _0x2f408c.minX - _0x38af0e,
    _0x52b69b = _0x2f408c.minY - _0x38af0e,
    _0x2f3038 = _0x2f408c.maxX + _0x38af0e,
    _0x8c6fa7 = _0x2f408c.maxY + _0x38af0e;
  return {
    minX: _0x5d2c0f,
    minY: _0x52b69b,
    maxX: _0x2f3038,
    maxY: _0x8c6fa7,
    width: _0x2f3038 - _0x5d2c0f,
    height: _0x8c6fa7 - _0x52b69b,
  };
}
export function worldToMinimap(_0x314925, _0x5bcab4, _0x1aa136, _0x177641) {
  const _0x47035b = Math.max(_0x1aa136.width, _0x1aa136.height, 1),
    _0x82f1b6 = _0x177641 / _0x47035b,
    _0x1da819 = (_0x314925 - _0x1aa136.minX) * _0x82f1b6,
    _0x4ff78a = (_0x5bcab4 - _0x1aa136.minY) * _0x82f1b6;
  return { x: _0x1da819, y: _0x4ff78a, scale: _0x82f1b6 };
}
const DEFAULT_NODE_SPATIAL_INDEX_CELL_SIZE = 240,
  EMPTY_NODE_SPATIAL_QUERY_RESULT = Object.freeze([]),
  SNAP_MATCH_EPSILON = 0.1;
function getNodeSpatialCellCoord(_0x3afed7, _0x5e86f2) {
  return Math.floor(_0x3afed7 / _0x5e86f2);
}
function getNodeSpatialCellKey(_0x2d1ec7, _0x64adc1) {
  return _0x2d1ec7 + ',' + _0x64adc1;
}
function normalizeNodeSpatialCellBounds(_0x1daa24) {
  if (!_0x1daa24) return null;
  const _0x523e17 = Number(_0x1daa24.minX),
    _0x698f41 = Number(_0x1daa24.maxX),
    _0x4ac706 = Number(_0x1daa24.minY),
    _0x251b4f = Number(_0x1daa24.maxY);
  if (
    !Number.isFinite(_0x523e17) ||
    !Number.isFinite(_0x698f41) ||
    !Number.isFinite(_0x4ac706) ||
    !Number.isFinite(_0x251b4f)
  )
    return null;
  return { minX: _0x523e17, maxX: _0x698f41, minY: _0x4ac706, maxY: _0x251b4f };
}
function pushNodeIdToSpatialCell(_0x1d31a0, _0x1641b1, _0x542f21, _0x1716ee) {
  const _0x4c1cac = getNodeSpatialCellKey(_0x1641b1, _0x542f21),
    _0x11243d = _0x1d31a0.get(_0x4c1cac);
  if (_0x11243d) {
    _0x11243d.push(_0x1716ee);
    return;
  }
  _0x1d31a0.set(_0x4c1cac, [_0x1716ee]);
}
function normalizeNodeQueryRect(_0x3f0f55) {
  if (!_0x3f0f55 || typeof _0x3f0f55 !== 'object') return null;
  const _0x51285c = Number(_0x3f0f55.x),
    _0x30a449 = Number(_0x3f0f55.y),
    _0x1eec1b = Math.max(0, Number(_0x3f0f55.width) || 0),
    _0x294b3a = Math.max(0, Number(_0x3f0f55.height) || 0);
  if (!Number.isFinite(_0x51285c) || !Number.isFinite(_0x30a449)) return null;
  return { x: _0x51285c, y: _0x30a449, width: _0x1eec1b, height: _0x294b3a };
}
function finalizeNodeQueryRect(_0x429803, _0x2fcf37 = {}) {
  const _0x2e7701 = normalizeNodeQueryRect(_0x429803);
  if (!_0x2e7701) return null;
  return {
    ..._0x2e7701,
    right: _0x2e7701.x + _0x2e7701.width,
    bottom: _0x2e7701.y + _0x2e7701.height,
    cx: _0x2e7701.x + _0x2e7701.width / 2,
    cy: _0x2e7701.y + _0x2e7701.height / 2,
    ..._0x2fcf37,
  };
}
function defaultNodeQueryRectResolver(_0x508c35) {
  if (!_0x508c35 || typeof _0x508c35 !== 'object') return null;
  return { x: _0x508c35.x, y: _0x508c35.y, width: _0x508c35.width || 0, height: _0x508c35.height || 0 };
}
function normalizeNodeQueryOptions(_0x14b8a2 = false, _0x30d446 = undefined) {
  const _0x2dfadb =
    _0x14b8a2 && typeof _0x14b8a2 === 'object' ? { ..._0x14b8a2 } : { ignoreGroup: _0x14b8a2 === true };
  return (
    _0x30d446 && typeof _0x30d446 === 'object' && Object.assign(_0x2dfadb, _0x30d446),
    (_0x2dfadb.ignoreGroup = _0x2dfadb.ignoreGroup === true),
    (_0x2dfadb.resolveRect =
      typeof _0x2dfadb.resolveRect === 'function' ? _0x2dfadb.resolveRect : defaultNodeQueryRectResolver),
    (_0x2dfadb.candidateFilter =
      typeof _0x2dfadb.candidateFilter === 'function' ? _0x2dfadb.candidateFilter : null),
    (_0x2dfadb.spatialIndex = _0x2dfadb.spatialIndex || null),
    _0x2dfadb
  );
}
function resolveNodeQueryRect(_0x315708, _0x52ff1f, _0x4813bc, _0x3f1266 = null) {
  const _0x84ad60 = String(_0x315708?.id || _0x52ff1f || '').trim();
  if (!_0x84ad60) return null;
  const _0x42cbb2 = _0x3f1266?.nodeRects instanceof Map ? _0x3f1266.nodeRects.get(_0x84ad60) : null;
  if (_0x42cbb2) return _0x42cbb2;
  return finalizeNodeQueryRect(_0x4813bc(_0x315708, _0x84ad60));
}
function iterateNodeSpatialRing(_0xaeafec, _0x5e476a, _0x28c5f3, _0x16cda4) {
  if (_0x28c5f3 === 0) {
    _0x16cda4(_0xaeafec, _0x5e476a);
    return;
  }
  const _0x469944 = _0xaeafec - _0x28c5f3,
    _0x5b0972 = _0xaeafec + _0x28c5f3,
    _0x4c7760 = _0x5e476a - _0x28c5f3,
    _0x605fce = _0x5e476a + _0x28c5f3;
  for (let _0x18c3fd = _0x469944; _0x18c3fd <= _0x5b0972; _0x18c3fd += 1) {
    (_0x16cda4(_0x18c3fd, _0x4c7760), _0x16cda4(_0x18c3fd, _0x605fce));
  }
  for (let _0x1e3877 = _0x4c7760 + 1; _0x1e3877 < _0x605fce; _0x1e3877 += 1) {
    (_0x16cda4(_0x469944, _0x1e3877), _0x16cda4(_0x5b0972, _0x1e3877));
  }
}
function getPointToCellRectDistSq(_0x310655, _0x480762, _0xb4bf54, _0x484af9, _0x323763) {
  const _0x359489 = _0xb4bf54 * _0x323763,
    _0x2a0fd8 = _0x484af9 * _0x323763,
    _0x20e56c = _0x359489 + _0x323763,
    _0x3e0ffb = _0x2a0fd8 + _0x323763,
    _0x160a2a =
      _0x310655 < _0x359489 ? _0x359489 - _0x310655 : _0x310655 > _0x20e56c ? _0x310655 - _0x20e56c : 0,
    _0x4c4903 =
      _0x480762 < _0x2a0fd8 ? _0x2a0fd8 - _0x480762 : _0x480762 > _0x3e0ffb ? _0x480762 - _0x3e0ffb : 0;
  return _0x160a2a * _0x160a2a + _0x4c4903 * _0x4c4903;
}
function getNodeSpatialWorldBounds(_0x51a055) {
  const _0xe13d4e = normalizeNodeSpatialCellBounds(_0x51a055?.boundsCellBounds);
  if (!_0xe13d4e) return null;
  const _0x42ea77 = Number(_0x51a055?.cellSize);
  if (!Number.isFinite(_0x42ea77) || _0x42ea77 <= 0) return null;
  return {
    x: _0xe13d4e.minX * _0x42ea77,
    y: _0xe13d4e.minY * _0x42ea77,
    width: (_0xe13d4e.maxX - _0xe13d4e.minX + 1) * _0x42ea77,
    height: (_0xe13d4e.maxY - _0xe13d4e.minY + 1) * _0x42ea77,
  };
}
function getNodeSpatialStripeRect(_0x492ff, _0x4e4470, _0x2575df, _0x11a19, _0x666f26 = 0) {
  const _0x57d536 = getNodeSpatialWorldBounds(_0x492ff);
  if (!_0x57d536) return null;
  const _0x139d8b = Math.min(_toFiniteNumber(_0x2575df, 0), _toFiniteNumber(_0x11a19, 0)),
    _0x354198 = Math.max(_toFiniteNumber(_0x2575df, 0), _toFiniteNumber(_0x11a19, 0)),
    _0xd2cc71 = Math.max(0, _toFiniteNumber(_0x666f26, 0));
  if (_0x4e4470 === 'x')
    return {
      x: _0x139d8b - _0xd2cc71,
      y: _0x57d536.y,
      width: Math.max(0, _0x354198 - _0x139d8b) + _0xd2cc71 * 2,
      height: _0x57d536.height,
    };
  if (_0x4e4470 === 'y')
    return {
      x: _0x57d536.x,
      y: _0x139d8b - _0xd2cc71,
      width: _0x57d536.width,
      height: Math.max(0, _0x354198 - _0x139d8b) + _0xd2cc71 * 2,
    };
  return null;
}
function getNodeSpatialQueryNodes(_0x1a649d, _0x324d39) {
  if (!Array.isArray(_0x324d39) || _0x324d39.length === 0) return [];
  const _0x491a07 = [];
  for (const _0x4ab67a of _0x324d39) {
    const _0x5a4799 = _0x1a649d?.[_0x4ab67a];
    if (_0x5a4799) _0x491a07.push(_0x5a4799);
  }
  return _0x491a07;
}
function collectSnapSearchCandidateIds(_0x40c411, _0x5bc179, _0x272eab) {
  if (!_0x40c411 || !_0x5bc179) return EMPTY_NODE_SPATIAL_QUERY_RESULT;
  const _0x4b56cd = getNodeSpatialStripeRect(
      _0x40c411,
      'x',
      _0x5bc179.x,
      _0x5bc179.x + _0x5bc179.width,
      _0x272eab,
    ),
    _0x3e4b59 = getNodeSpatialStripeRect(
      _0x40c411,
      'y',
      _0x5bc179.y,
      _0x5bc179.y + _0x5bc179.height,
      _0x272eab,
    );
  if (!_0x4b56cd && !_0x3e4b59) return EMPTY_NODE_SPATIAL_QUERY_RESULT;
  const _0x20361f = new Set();
  if (_0x4b56cd)
    for (const _0x3973d6 of queryNodeSpatialIndexInRect(_0x40c411, _0x4b56cd)) {
      _0x20361f.add(_0x3973d6);
    }
  if (_0x3e4b59)
    for (const _0x2e9a3d of queryNodeSpatialIndexInRect(_0x40c411, _0x3e4b59)) {
      _0x20361f.add(_0x2e9a3d);
    }
  return _0x20361f.size > 0 ? Array.from(_0x20361f) : EMPTY_NODE_SPATIAL_QUERY_RESULT;
}
function collectSnapMatchNodes(_0x78b64a, _0x2edacc, _0x38bcf4, _0x300e23, _0x34729b) {
  if (!Number.isFinite(_0x34729b)) return [];
  if (!_0x38bcf4) return _0x2edacc;
  const _0xa8c3e5 = getNodeSpatialStripeRect(_0x38bcf4, _0x300e23, _0x34729b, _0x34729b, SNAP_MATCH_EPSILON);
  if (!_0xa8c3e5) return _0x2edacc;
  return getNodeSpatialQueryNodes(_0x78b64a, queryNodeSpatialIndexInRect(_0x38bcf4, _0xa8c3e5));
}
function getMinRingToCenterCellBounds(_0x3122b6, _0x2e1963, _0x5c5030) {
  if (!_0x5c5030) return 0;
  const _0x488973 =
      _0x3122b6 < _0x5c5030.minX
        ? _0x5c5030.minX - _0x3122b6
        : _0x3122b6 > _0x5c5030.maxX
          ? _0x3122b6 - _0x5c5030.maxX
          : 0,
    _0x3e7c51 =
      _0x2e1963 < _0x5c5030.minY
        ? _0x5c5030.minY - _0x2e1963
        : _0x2e1963 > _0x5c5030.maxY
          ? _0x2e1963 - _0x5c5030.maxY
          : 0;
  return Math.max(_0x488973, _0x3e7c51);
}
function doesRingCoverCenterCellBounds(_0x3b9c9b, _0x3909c6, _0x3e394b, _0x18f2d8) {
  if (!_0x18f2d8) return true;
  return (
    _0x3b9c9b - _0x3e394b <= _0x18f2d8.minX &&
    _0x3b9c9b + _0x3e394b >= _0x18f2d8.maxX &&
    _0x3909c6 - _0x3e394b <= _0x18f2d8.minY &&
    _0x3909c6 + _0x3e394b >= _0x18f2d8.maxY
  );
}
function getNextRingMinCenterDistSq(_0x1753d6, _0x2b9fa4, _0x581ccf, _0x1c95d2, _0x54b97b, _0x208597) {
  if (!_0x1753d6?.centerCellBounds) return Infinity;
  let _0x38d92d = Infinity;
  return (
    iterateNodeSpatialRing(_0x1c95d2, _0x54b97b, _0x208597, (_0x3dec13, _0xdb791a) => {
      if (
        _0x3dec13 < _0x1753d6.centerCellBounds.minX ||
        _0x3dec13 > _0x1753d6.centerCellBounds.maxX ||
        _0xdb791a < _0x1753d6.centerCellBounds.minY ||
        _0xdb791a > _0x1753d6.centerCellBounds.maxY
      )
        return;
      const _0x139e1c = getPointToCellRectDistSq(
        _0x2b9fa4,
        _0x581ccf,
        _0x3dec13,
        _0xdb791a,
        _0x1753d6.cellSize,
      );
      if (_0x139e1c < _0x38d92d) _0x38d92d = _0x139e1c;
    }),
    _0x38d92d
  );
}
function findNearestNodeRectInSpatialIndex(_0x3e747a, _0x1bf74c, _0x31d555, _0xb4bea6, _0x34c156 = {}) {
  if (
    !_0x3e747a ||
    !(_0x3e747a.centerCells instanceof Map) ||
    !(_0x3e747a.nodeRects instanceof Map) ||
    !_0x3e747a.centerCellBounds
  )
    return null;
  const _0x3740e8 = getNodeSpatialCellCoord(_0x31d555, _0x3e747a.cellSize),
    _0x5b42e9 = getNodeSpatialCellCoord(_0xb4bea6, _0x3e747a.cellSize),
    _0x2fc899 = getMinRingToCenterCellBounds(_0x3740e8, _0x5b42e9, _0x3e747a.centerCellBounds),
    _0x4d6f2e = _0x34c156.ignoreGroup === true,
    _0x3d5d20 = typeof _0x34c156.candidateFilter === 'function' ? _0x34c156.candidateFilter : null;
  let _0x2a7e86 = null,
    _0x8dcc48 = null,
    _0x2f170e = Infinity,
    _0x233680 = Infinity;
  for (let _0xa300c2 = _0x2fc899; ; _0xa300c2 += 1) {
    iterateNodeSpatialRing(_0x3740e8, _0x5b42e9, _0xa300c2, (_0xf9dc54, _0x4e6597) => {
      const _0x9108b1 = _0x3e747a.centerCells.get(getNodeSpatialCellKey(_0xf9dc54, _0x4e6597));
      if (!_0x9108b1 || _0x9108b1.length === 0) return;
      for (const _0x4ff459 of _0x9108b1) {
        const _0x1809da = _0x1bf74c?.[_0x4ff459];
        if (!_0x1809da) continue;
        if (_0x4d6f2e && _0x1809da?.type === 'group') continue;
        if (_0x3d5d20 && _0x3d5d20(_0x1809da, _0x4ff459) === false) continue;
        const _0xa4ada7 = _0x3e747a.nodeRects.get(_0x4ff459);
        if (!_0xa4ada7) continue;
        const _0x3fe735 = _0x31d555 - _0xa4ada7.cx,
          _0x2cd8aa = _0xb4bea6 - _0xa4ada7.cy,
          _0x17ee98 = _0x3fe735 * _0x3fe735 + _0x2cd8aa * _0x2cd8aa;
        (_0x17ee98 < _0x2f170e || (_0x17ee98 === _0x2f170e && _0xa4ada7.order < _0x233680)) &&
          ((_0x2a7e86 = _0x4ff459),
          (_0x8dcc48 = _0xa4ada7),
          (_0x2f170e = _0x17ee98),
          (_0x233680 = _0xa4ada7.order));
      }
    });
    if (doesRingCoverCenterCellBounds(_0x3740e8, _0x5b42e9, _0xa300c2, _0x3e747a.centerCellBounds)) break;
    if (_0x8dcc48) {
      const _0x35e871 = getNextRingMinCenterDistSq(
        _0x3e747a,
        _0x31d555,
        _0xb4bea6,
        _0x3740e8,
        _0x5b42e9,
        _0xa300c2 + 1,
      );
      if (_0x2f170e <= _0x35e871) break;
    }
  }
  return _0x2a7e86 && _0x8dcc48 ? { nodeId: _0x2a7e86, rect: _0x8dcc48 } : null;
}
export function createNodeSpatialIndex(_0x8f51e5, _0xcdc6d3 = {}) {
  const _0x323004 = Number(_0xcdc6d3?.cellSize),
    _0x198b14 =
      Number.isFinite(_0x323004) && _0x323004 > 0 ? _0x323004 : DEFAULT_NODE_SPATIAL_INDEX_CELL_SIZE,
    _0x9d69bb =
      typeof _0xcdc6d3?.resolveRect === 'function' ? _0xcdc6d3.resolveRect : defaultNodeQueryRectResolver,
    _0x14f01b = new Map(),
    _0x31fd3b = new Map(),
    _0x179e6d = new Map();
  let _0x5aae6b = Infinity,
    _0x3db034 = -Infinity,
    _0x416880 = Infinity,
    _0x3cf253 = -Infinity,
    _0x399fc5 = Infinity,
    _0x53e5ac = -Infinity,
    _0x4c618a = Infinity,
    _0x2bb71e = -Infinity,
    _0xd413fc = 0;
  for (const [_0x395ba0, _0x53d56d] of Object.entries(_0x8f51e5 || {})) {
    const _0x5ce62 = String(_0x53d56d?.id || _0x395ba0 || '').trim();
    if (!_0x5ce62) continue;
    const _0x10890c = finalizeNodeQueryRect(_0x9d69bb(_0x53d56d, _0x5ce62), { order: _0xd413fc });
    if (!_0x10890c) continue;
    const _0x1b0e27 = { nodeId: _0x5ce62, ..._0x10890c };
    (_0x179e6d.set(_0x5ce62, _0x1b0e27), (_0xd413fc += 1));
    const _0xdb6cb9 = getNodeSpatialCellCoord(_0x1b0e27.x, _0x198b14),
      _0x1b23a6 = getNodeSpatialCellCoord(_0x1b0e27.right, _0x198b14),
      _0x2e7f57 = getNodeSpatialCellCoord(_0x1b0e27.y, _0x198b14),
      _0x513398 = getNodeSpatialCellCoord(_0x1b0e27.bottom, _0x198b14);
    if (_0xdb6cb9 < _0x5aae6b) _0x5aae6b = _0xdb6cb9;
    if (_0x1b23a6 > _0x3db034) _0x3db034 = _0x1b23a6;
    if (_0x2e7f57 < _0x416880) _0x416880 = _0x2e7f57;
    if (_0x513398 > _0x3cf253) _0x3cf253 = _0x513398;
    for (let _0x24f3cb = _0xdb6cb9; _0x24f3cb <= _0x1b23a6; _0x24f3cb += 1) {
      for (let _0x21970d = _0x2e7f57; _0x21970d <= _0x513398; _0x21970d += 1) {
        pushNodeIdToSpatialCell(_0x14f01b, _0x24f3cb, _0x21970d, _0x5ce62);
      }
    }
    const _0x7ccead = getNodeSpatialCellCoord(_0x1b0e27.cx, _0x198b14),
      _0xd4760a = getNodeSpatialCellCoord(_0x1b0e27.cy, _0x198b14);
    pushNodeIdToSpatialCell(_0x31fd3b, _0x7ccead, _0xd4760a, _0x5ce62);
    if (_0x7ccead < _0x399fc5) _0x399fc5 = _0x7ccead;
    if (_0x7ccead > _0x53e5ac) _0x53e5ac = _0x7ccead;
    if (_0xd4760a < _0x4c618a) _0x4c618a = _0xd4760a;
    if (_0xd4760a > _0x2bb71e) _0x2bb71e = _0xd4760a;
  }
  const _0x15d825 =
      _0x399fc5 === Infinity ? null : { minX: _0x399fc5, maxX: _0x53e5ac, minY: _0x4c618a, maxY: _0x2bb71e },
    _0x57fbbf =
      _0x5aae6b === Infinity ? null : { minX: _0x5aae6b, maxX: _0x3db034, minY: _0x416880, maxY: _0x3cf253 };
  return {
    cellSize: _0x198b14,
    boundsCells: _0x14f01b,
    centerCells: _0x31fd3b,
    nodeRects: _0x179e6d,
    boundsCellBounds: _0x57fbbf,
    centerCellBounds: _0x15d825,
    nodeCount: _0x179e6d.size,
  };
}
export function queryNodeSpatialIndexAtWorldPoint(_0x285836, _0x2d7567, _0x42dba7) {
  if (
    !_0x285836 ||
    !(_0x285836.boundsCells instanceof Map) ||
    !Number.isFinite(_0x2d7567) ||
    !Number.isFinite(_0x42dba7) ||
    !Number.isFinite(_0x285836.cellSize) ||
    _0x285836.cellSize <= 0
  )
    return EMPTY_NODE_SPATIAL_QUERY_RESULT;
  const _0x4f6bf7 = getNodeSpatialCellCoord(_0x2d7567, _0x285836.cellSize),
    _0x55ddfb = getNodeSpatialCellCoord(_0x42dba7, _0x285836.cellSize);
  return (
    _0x285836.boundsCells.get(getNodeSpatialCellKey(_0x4f6bf7, _0x55ddfb)) || EMPTY_NODE_SPATIAL_QUERY_RESULT
  );
}
export function queryNodeSpatialIndexInRect(_0x56a03d, _0x20a16d) {
  const _0x82a88 = normalizeNodeQueryRect(_0x20a16d);
  if (
    !_0x82a88 ||
    !_0x56a03d ||
    !(_0x56a03d.boundsCells instanceof Map) ||
    !(_0x56a03d.nodeRects instanceof Map) ||
    !Number.isFinite(_0x56a03d.cellSize) ||
    _0x56a03d.cellSize <= 0
  )
    return EMPTY_NODE_SPATIAL_QUERY_RESULT;
  const _0x33f1f3 = getNodeSpatialCellCoord(_0x82a88.x, _0x56a03d.cellSize),
    _0x3f9dc6 = getNodeSpatialCellCoord(_0x82a88.x + _0x82a88.width, _0x56a03d.cellSize),
    _0x535d05 = getNodeSpatialCellCoord(_0x82a88.y, _0x56a03d.cellSize),
    _0x3d4133 = getNodeSpatialCellCoord(_0x82a88.y + _0x82a88.height, _0x56a03d.cellSize),
    _0x56ea87 = new Set();
  for (let _0x2b7ccb = _0x33f1f3; _0x2b7ccb <= _0x3f9dc6; _0x2b7ccb += 1) {
    for (let _0x3984e1 = _0x535d05; _0x3984e1 <= _0x3d4133; _0x3984e1 += 1) {
      const _0x177c8d = _0x56a03d.boundsCells.get(getNodeSpatialCellKey(_0x2b7ccb, _0x3984e1));
      if (!_0x177c8d || _0x177c8d.length === 0) continue;
      for (const _0x3df105 of _0x177c8d) _0x56ea87.add(_0x3df105);
    }
  }
  if (_0x56ea87.size === 0) return EMPTY_NODE_SPATIAL_QUERY_RESULT;
  return Array.from(_0x56ea87).sort((_0x5b8e25, _0x3b1119) => {
    const _0x5ecefd = _0x56a03d.nodeRects.get(_0x5b8e25)?.order ?? Infinity,
      _0x1eeae8 = _0x56a03d.nodeRects.get(_0x3b1119)?.order ?? Infinity;
    return _0x5ecefd - _0x1eeae8;
  });
}
export function getNodeScreenRect(_0x30933e, _0xbc1029) {
  const { x: _0x4dacc0, y: _0x512adf, zoom: _0x143f3c } = _0xbc1029,
    _0x4a3a16 = _0x30933e.x * _0x143f3c + _0x4dacc0,
    _0x5ab118 = _0x30933e.y * _0x143f3c + _0x512adf,
    _0xf5e466 = (_0x30933e.width || 0) * _0x143f3c,
    _0x2ed86e = (_0x30933e.height || 0) * _0x143f3c;
  return {
    left: _0x4a3a16,
    top: _0x5ab118,
    right: _0x4a3a16 + _0xf5e466,
    bottom: _0x5ab118 + _0x2ed86e,
    cx: _0x4a3a16 + _0xf5e466 / 2,
    cy: _0x5ab118 + _0x2ed86e / 2,
    width: _0xf5e466,
    height: _0x2ed86e,
  };
}
export function findClosestNode(
  _0x59dcbb,
  _0x17767c,
  _0x465ff8,
  _0x26ade0,
  _0x2e6f68 = false,
  _0x5b6c5f = undefined,
) {
  const { x: _0x443a9e, y: _0x2d4c17 } = screenToWorld(_0x59dcbb, _0x17767c, _0x26ade0),
    _0x5f49ee = normalizeNodeQueryOptions(_0x2e6f68, _0x5b6c5f),
    _0x587a45 = _0x5f49ee.spatialIndex
      ? queryNodeSpatialIndexAtWorldPoint(_0x5f49ee.spatialIndex, _0x443a9e, _0x2d4c17)
      : null;
  if (_0x587a45) {
    for (const _0xe94302 of _0x587a45) {
      const _0x28d3e7 = _0x465ff8?.[_0xe94302];
      if (!_0x28d3e7) continue;
      if (_0x5f49ee.ignoreGroup && _0x28d3e7?.type === 'group') continue;
      if (_0x5f49ee.candidateFilter && _0x5f49ee.candidateFilter(_0x28d3e7, _0xe94302) === false) continue;
      const _0x1e75a2 = resolveNodeQueryRect(
        _0x28d3e7,
        _0xe94302,
        _0x5f49ee.resolveRect,
        _0x5f49ee.spatialIndex,
      );
      if (!_0x1e75a2) continue;
      if (!isPointInRect(_0x443a9e, _0x2d4c17, _0x1e75a2.x, _0x1e75a2.y, _0x1e75a2.width, _0x1e75a2.height))
        continue;
      return { nodeId: _0xe94302, screenRect: getNodeScreenRect(_0x1e75a2, _0x26ade0), isInside: true };
    }
    const _0x14f213 = findNearestNodeRectInSpatialIndex(
      _0x5f49ee.spatialIndex,
      _0x465ff8,
      _0x443a9e,
      _0x2d4c17,
      _0x5f49ee,
    );
    return _0x14f213
      ? {
          nodeId: _0x14f213.nodeId,
          screenRect: getNodeScreenRect(_0x14f213.rect, _0x26ade0),
          isInside: false,
        }
      : null;
  }
  let _0x4f5a4d = null,
    _0x45ca17 = null,
    _0x5ee9c1 = Infinity;
  for (const [_0x15acfb, _0x580358] of Object.entries(_0x465ff8 || {})) {
    const _0x5e0236 = String(_0x580358?.id || _0x15acfb || '').trim();
    if (!_0x5e0236) continue;
    if (_0x5f49ee.ignoreGroup && _0x580358?.type === 'group') continue;
    if (_0x5f49ee.candidateFilter && _0x5f49ee.candidateFilter(_0x580358, _0x5e0236) === false) continue;
    const _0x59fae0 = resolveNodeQueryRect(
      _0x580358,
      _0x5e0236,
      _0x5f49ee.resolveRect,
      _0x5f49ee.spatialIndex,
    );
    if (!_0x59fae0) continue;
    const _0x584d57 = isPointInRect(
      _0x443a9e,
      _0x2d4c17,
      _0x59fae0.x,
      _0x59fae0.y,
      _0x59fae0.width,
      _0x59fae0.height,
    );
    if (_0x584d57)
      return { nodeId: _0x5e0236, screenRect: getNodeScreenRect(_0x59fae0, _0x26ade0), isInside: true };
    const _0x57ec8d = _0x443a9e - _0x59fae0.cx,
      _0x383eae = _0x2d4c17 - _0x59fae0.cy,
      _0x1c7575 = _0x57ec8d * _0x57ec8d + _0x383eae * _0x383eae;
    _0x1c7575 < _0x5ee9c1 && ((_0x5ee9c1 = _0x1c7575), (_0x4f5a4d = _0x5e0236), (_0x45ca17 = _0x59fae0));
  }
  return _0x4f5a4d
    ? { nodeId: _0x4f5a4d, screenRect: getNodeScreenRect(_0x45ca17, _0x26ade0), isInside: false }
    : null;
}
export function hitTestNode(
  _0x50ab62,
  _0x456731,
  _0x1abadc,
  _0x52b6a9,
  _0x100b15,
  _0x126373 = false,
  _0x3c5dc3 = undefined,
) {
  const { x: _0x7b165, y: _0x146c61 } = screenToWorld(_0x50ab62, _0x456731, _0x52b6a9),
    _0x1f8d5b = normalizeNodeQueryOptions(_0x126373, _0x3c5dc3),
    _0x42e5c0 = new Set(),
    _0x4fd573 = String(_0x100b15 || '').trim();
  if (_0x4fd573) _0x42e5c0.add(_0x4fd573);
  if (
    _0x1f8d5b.excludeIds &&
    typeof _0x1f8d5b.excludeIds !== 'string' &&
    typeof _0x1f8d5b.excludeIds[Symbol.iterator] === 'function'
  )
    for (const _0x584329 of _0x1f8d5b.excludeIds) {
      const _0xa7ea34 = String(_0x584329 || '').trim();
      if (_0xa7ea34) _0x42e5c0.add(_0xa7ea34);
    }
  let _0x51b4f2 = null,
    _0x180de7 = null;
  const _0x271e7f = _0x1f8d5b.spatialIndex
      ? queryNodeSpatialIndexAtWorldPoint(_0x1f8d5b.spatialIndex, _0x7b165, _0x146c61)
      : null,
    _0x1db86d = (_0x28e2c1, _0x10e089) => {
      if (_0x42e5c0.has(_0x28e2c1)) return;
      if (_0x1f8d5b.ignoreGroup && _0x10e089?.type === 'group') return;
      if (_0x1f8d5b.candidateFilter && _0x1f8d5b.candidateFilter(_0x10e089, _0x28e2c1) === false) return;
      const _0x5e17cb = resolveNodeQueryRect(
        _0x10e089,
        _0x28e2c1,
        _0x1f8d5b.resolveRect,
        _0x1f8d5b.spatialIndex,
      );
      if (!_0x5e17cb) return;
      if (!isPointInRect(_0x7b165, _0x146c61, _0x5e17cb.x, _0x5e17cb.y, _0x5e17cb.width, _0x5e17cb.height))
        return;
      _0x10e089?.type === 'group' ? (_0x51b4f2 = _0x28e2c1) : (_0x180de7 = _0x28e2c1);
    };
  if (_0x271e7f) {
    for (const _0x17b3aa of _0x271e7f) {
      const _0x175fd8 = _0x1abadc?.[_0x17b3aa];
      if (!_0x175fd8) continue;
      _0x1db86d(_0x17b3aa, _0x175fd8);
    }
    return _0x180de7 || _0x51b4f2 || null;
  }
  for (const [_0x37ab8b, _0x4fe0f9] of Object.entries(_0x1abadc || {})) {
    const _0x2e85fc = String(_0x4fe0f9?.id || _0x37ab8b || '').trim();
    if (!_0x2e85fc) continue;
    _0x1db86d(_0x2e85fc, _0x4fe0f9);
  }
  return _0x180de7 || _0x51b4f2 || null;
}
export function checkLineIntersection(
  _0x313b86,
  _0x2dce3e,
  _0x5f2ef1,
  _0x2dd876,
  _0x247567,
  _0x3c9043,
  _0x489ef0,
  _0x311adb,
) {
  let _0x2e2d11 = _0x5f2ef1 - _0x313b86,
    _0x40c784 = _0x2dd876 - _0x2dce3e,
    _0x16e71f = _0x489ef0 - _0x247567,
    _0x54c01f = _0x311adb - _0x3c9043,
    _0x575c6a = -_0x16e71f * _0x40c784 + _0x2e2d11 * _0x54c01f;
  if (_0x575c6a === 0) return false;
  let _0x50bf4f = (-_0x40c784 * (_0x313b86 - _0x247567) + _0x2e2d11 * (_0x2dce3e - _0x3c9043)) / _0x575c6a,
    _0x63d44a = (_0x16e71f * (_0x2dce3e - _0x3c9043) - _0x54c01f * (_0x313b86 - _0x247567)) / _0x575c6a;
  return _0x50bf4f >= 0 && _0x50bf4f <= 1 && _0x63d44a >= 0 && _0x63d44a <= 1;
}
export function checkBBoxIntersection(
  _0x2f8cd9,
  _0xb760bd,
  _0x2bb0de,
  _0x4805cd,
  _0x2275fb,
  _0x18e1ff,
  _0x2394dc,
  _0x4f3022,
) {
  const _0x37e9b1 = Math.min(_0x2f8cd9, _0x2bb0de),
    _0x223e6d = Math.max(_0x2f8cd9, _0x2bb0de),
    _0x16faaf = Math.min(_0xb760bd, _0x4805cd),
    _0x2a6133 = Math.max(_0xb760bd, _0x4805cd),
    _0x1960bc = Math.min(_0x2275fb, _0x2394dc),
    _0xe33baa = Math.max(_0x2275fb, _0x2394dc),
    _0x1854f7 = Math.min(_0x18e1ff, _0x4f3022),
    _0x2fac5f = Math.max(_0x18e1ff, _0x4f3022);
  return !(_0x223e6d < _0x1960bc || _0xe33baa < _0x37e9b1 || _0x2a6133 < _0x1854f7 || _0x2fac5f < _0x16faaf);
}
export * from './panoramaSceneMath.js';
