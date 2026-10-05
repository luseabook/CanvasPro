function toFiniteNumber(value) {
  const item = Number(value);
  return Number['isFinite'](item) ? item : 0;
}
export function createViewportScreenFrame() {
  let _screenOriginX = { x: 0, y: 0 };
  return {
    set(key, index) {
      const box = { x: toFiniteNumber(key), y: toFiniteNumber(index) };
      if (_screenOriginX['x'] === box['x'] && _screenOriginX['y'] === box['y']) return false;
      return ((_screenOriginX = box), true);
    },
    attach(result) {
      return {
        ...(result || { x: 0, y: 0, zoom: 1 }),
        _screenOriginX: _screenOriginX['x'],
        _screenOriginY: _screenOriginX['y'],
      };
    },
    strip(data) {
      const options = { ...(data || {}) };
      return (delete options['_screenOriginX'], delete options['_screenOriginY'], options);
    },
  };
}
