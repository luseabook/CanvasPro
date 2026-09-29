function normalizeViewport(_0x4e55f9 = {}) {
  const _0x2563d9 = Number(_0x4e55f9?.['zoom']);
  return {
    x: Number['isFinite'](Number(_0x4e55f9?.['x'])) ? Number(_0x4e55f9['x']) : 0x0,
    y: Number['isFinite'](Number(_0x4e55f9?.['y'])) ? Number(_0x4e55f9['y']) : 0x0,
    zoom: Number['isFinite'](_0x2563d9) && _0x2563d9 > 0x0 ? _0x2563d9 : 0x1,
  };
}
export function createRendererViewportJumpDetector({
  panThreshold: panThreshold = 0xa0,
  zoomThreshold: zoomThreshold = 0.015,
} = {}) {
  let _0x5039f8 = null;
  return {
    consume(_0x598a54 = {}) {
      const _0x5bc893 = normalizeViewport(_0x598a54),
        _0x4b9605 = _0x5039f8;
      _0x5039f8 = _0x5bc893;
      if (!_0x4b9605) return ![];
      return (
        Math['abs'](_0x5bc893['x'] - _0x4b9605['x']) > panThreshold ||
        Math['abs'](_0x5bc893['y'] - _0x4b9605['y']) > panThreshold ||
        Math['abs'](_0x5bc893['zoom'] - _0x4b9605['zoom']) > zoomThreshold
      );
    },
    reset() {
      _0x5039f8 = null;
    },
  };
}
