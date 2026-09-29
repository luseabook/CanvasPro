function toFiniteNumber(_0x2e59e5) {
  const _0x466b7a = Number(_0x2e59e5);
  return Number['isFinite'](_0x466b7a) ? _0x466b7a : 0x0;
}
export function createViewportScreenFrame() {
  let _0x11b411 = { x: 0x0, y: 0x0 };
  return {
    set(_0x4123f2, _0x493b29) {
      const _0x335a27 = { x: toFiniteNumber(_0x4123f2), y: toFiniteNumber(_0x493b29) };
      if (_0x11b411['x'] === _0x335a27['x'] && _0x11b411['y'] === _0x335a27['y']) return ![];
      return ((_0x11b411 = _0x335a27), !![]);
    },
    attach(_0x119fdf) {
      return {
        ...(_0x119fdf || { x: 0x0, y: 0x0, zoom: 0x1 }),
        _screenOriginX: _0x11b411['x'],
        _screenOriginY: _0x11b411['y'],
      };
    },
    strip(_0x881331) {
      const _0x5d53de = { ...(_0x881331 || {}) };
      return (delete _0x5d53de['_screenOriginX'], delete _0x5d53de['_screenOriginY'], _0x5d53de);
    },
  };
}
