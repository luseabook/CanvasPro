function toPositiveFinite(_0x27f2f0) {
  const _0x4c2740 = Number(_0x27f2f0);
  return Number['isFinite'](_0x4c2740) && _0x4c2740 > 0x0 ? _0x4c2740 : 0x0;
}
function normalizeRect(_0x4d5331) {
  if (!_0x4d5331) return null;
  const _0x1b9d77 = Number(_0x4d5331['left']),
    _0x11bfcf = Number(_0x4d5331['top']),
    _0xc75587 = toPositiveFinite(_0x4d5331['width']),
    _0x2569b5 = toPositiveFinite(_0x4d5331['height']);
  if (!Number['isFinite'](_0x1b9d77) || !Number['isFinite'](_0x11bfcf) || !_0xc75587 || !_0x2569b5)
    return null;
  return { left: _0x1b9d77, top: _0x11bfcf, width: _0xc75587, height: _0x2569b5 };
}
function buildVideoProjection(_0x32c785) {
  const _0x3be0b8 = normalizeRect(_0x32c785?.['rect']),
    _0x3346af = toPositiveFinite(_0x32c785?.['elementWidth']),
    _0x4d0285 = toPositiveFinite(_0x32c785?.['elementHeight']),
    _0x3b2bdd = toPositiveFinite(_0x32c785?.['mediaWidth']),
    _0x39d697 = toPositiveFinite(_0x32c785?.['mediaHeight']);
  if (!_0x3be0b8 || !_0x3346af || !_0x4d0285 || !_0x3b2bdd || !_0x39d697) return null;
  const _0x341846 = _0x32c785?.['objectFit'] === 'cover' ? 'cover' : 'contain',
    _0x2cc4dd =
      _0x341846 === 'cover'
        ? Math['max'](_0x3346af / _0x3b2bdd, _0x4d0285 / _0x39d697)
        : Math['min'](_0x3346af / _0x3b2bdd, _0x4d0285 / _0x39d697),
    _0x31a33c = _0x3be0b8['width'] / _0x3346af,
    _0x3f9e4d = _0x3be0b8['height'] / _0x4d0285;
  if (
    !Number['isFinite'](_0x2cc4dd) ||
    _0x2cc4dd <= 0x0 ||
    !Number['isFinite'](_0x31a33c) ||
    _0x31a33c <= 0x0 ||
    !Number['isFinite'](_0x3f9e4d) ||
    _0x3f9e4d <= 0x0
  )
    return null;
  const _0x1d6c08 = _0x3b2bdd * _0x2cc4dd,
    _0xf4a36b = _0x39d697 * _0x2cc4dd;
  return Object['freeze']({
    rect: _0x3be0b8,
    ew: _0x3346af,
    eh: _0x4d0285,
    vw: _0x3b2bdd,
    vh: _0x39d697,
    fit: _0x341846,
    scale: _0x2cc4dd,
    dw: _0x1d6c08,
    dh: _0xf4a36b,
    ox: (_0x3346af - _0x1d6c08) / 0x2,
    oy: (_0x4d0285 - _0xf4a36b) / 0x2,
    sx: _0x31a33c,
    sy: _0x3f9e4d,
  });
}
function buildLayerProjection(_0x49d645) {
  const _0xe425f4 = normalizeRect(_0x49d645?.['rect']),
    _0x476bb3 = toPositiveFinite(_0x49d645?.['width']),
    _0x301c74 = toPositiveFinite(_0x49d645?.['height']);
  if (!_0xe425f4 || !_0x476bb3 || !_0x301c74) return null;
  const _0x4bf444 = _0xe425f4['width'] / _0x476bb3,
    _0xe54f86 = _0xe425f4['height'] / _0x301c74;
  if (
    !Number['isFinite'](_0x4bf444) ||
    _0x4bf444 <= 0x0 ||
    !Number['isFinite'](_0xe54f86) ||
    _0xe54f86 <= 0x0
  )
    return null;
  return Object['freeze']({ rect: _0xe425f4, lw: _0x476bb3, lh: _0x301c74, sx: _0x4bf444, sy: _0xe54f86 });
}
function clampNormalized(_0x26b10f) {
  return Math['max'](0x0, Math['min'](0x1, Number(_0x26b10f) || 0x0));
}
export function createVideoKeyingProjection({ video: _0xd9120f, layer: layer = null } = {}) {
  const _0x1d862e = buildVideoProjection(_0xd9120f);
  if (!_0x1d862e) return null;
  const _0x139e9a = buildLayerProjection(layer),
    _0x5b9a11 = (_0x3d91ea, _0x3c6208) => {
      const _0x1c5d32 = (Number(_0x3d91ea) - _0x1d862e['rect']['left']) / _0x1d862e['sx'],
        _0x357e5c = (Number(_0x3c6208) - _0x1d862e['rect']['top']) / _0x1d862e['sy'];
      if (!Number['isFinite'](_0x1c5d32) || !Number['isFinite'](_0x357e5c)) return null;
      if (
        _0x1d862e['fit'] !== 'cover' &&
        (_0x1c5d32 < _0x1d862e['ox'] ||
          _0x1c5d32 > _0x1d862e['ox'] + _0x1d862e['dw'] ||
          _0x357e5c < _0x1d862e['oy'] ||
          _0x357e5c > _0x1d862e['oy'] + _0x1d862e['dh'])
      )
        return null;
      const _0x117077 = (_0x1c5d32 - _0x1d862e['ox']) / _0x1d862e['scale'],
        _0x198313 = (_0x357e5c - _0x1d862e['oy']) / _0x1d862e['scale'];
      if (!Number['isFinite'](_0x117077) || !Number['isFinite'](_0x198313)) return null;
      return {
        nx: clampNormalized(_0x117077 / _0x1d862e['vw']),
        ny: clampNormalized(_0x198313 / _0x1d862e['vh']),
        videoProjection: _0x1d862e,
      };
    },
    _0x55da35 = (_0x4cbdcc, _0x37d6b1) => {
      if (!_0x139e9a) return null;
      const _0x3e86a9 = _0x1d862e['ox'] + clampNormalized(_0x4cbdcc) * _0x1d862e['vw'] * _0x1d862e['scale'],
        _0x38f375 = _0x1d862e['oy'] + clampNormalized(_0x37d6b1) * _0x1d862e['vh'] * _0x1d862e['scale'],
        _0x397176 = _0x1d862e['rect']['left'] + _0x3e86a9 * _0x1d862e['sx'],
        _0x44c7e5 = _0x1d862e['rect']['top'] + _0x38f375 * _0x1d862e['sy'],
        _0x29c1f3 = (_0x397176 - _0x139e9a['rect']['left']) / _0x139e9a['sx'],
        _0x4068e3 = (_0x44c7e5 - _0x139e9a['rect']['top']) / _0x139e9a['sy'];
      if (!Number['isFinite'](_0x29c1f3) || !Number['isFinite'](_0x4068e3)) return null;
      return { x: _0x29c1f3, y: _0x4068e3 };
    },
    _0x13017e = () => {
      const _0x55fdc7 = _0x55da35(0x0, 0x0),
        _0x237d1b = _0x55da35(0x1, 0x1);
      if (!_0x55fdc7 || !_0x237d1b) return null;
      return {
        x: _0x55fdc7['x'],
        y: _0x55fdc7['y'],
        width: Math['max'](0x1, _0x237d1b['x'] - _0x55fdc7['x']),
        height: Math['max'](0x1, _0x237d1b['y'] - _0x55fdc7['y']),
      };
    };
  return Object['freeze']({
    video: _0x1d862e,
    layer: _0x139e9a,
    pickClientPoint: _0x5b9a11,
    normalizedToLayerPoint: _0x55da35,
    getVideoRectInLayer: _0x13017e,
  });
}
function readObjectFit(_0x3ab5c0) {
  const _0x5c1824 = _0x3ab5c0?.['ownerDocument']?.['defaultView'] || globalThis['window'];
  return _0x5c1824?.['getComputedStyle']?.(_0x3ab5c0)?.['objectFit'] || 'contain';
}
export function measureVideoKeyingProjection({
  videoElement: _0x50bc32,
  layerElement: layerElement = null,
} = {}) {
  if (!_0x50bc32?.['getBoundingClientRect']) return null;
  const _0x2dd022 = layerElement?.['getBoundingClientRect']
    ? {
        rect: layerElement['getBoundingClientRect'](),
        width: Number(layerElement['offsetWidth']) || Number(layerElement['clientWidth']),
        height: Number(layerElement['offsetHeight']) || Number(layerElement['clientHeight']),
      }
    : null;
  return createVideoKeyingProjection({
    video: {
      rect: _0x50bc32['getBoundingClientRect'](),
      elementWidth: _0x50bc32['offsetWidth'],
      elementHeight: _0x50bc32['offsetHeight'],
      mediaWidth: _0x50bc32['videoWidth'],
      mediaHeight: _0x50bc32['videoHeight'],
      objectFit: readObjectFit(_0x50bc32),
    },
    layer: _0x2dd022,
  });
}
