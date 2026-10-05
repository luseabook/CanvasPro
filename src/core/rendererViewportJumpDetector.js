function normalizeViewport(box = {}) {
  const count = Number(box?.['zoom']);
  return {
    x: Number['isFinite'](Number(box?.['x'])) ? Number(box['x']) : 0,
    y: Number['isFinite'](Number(box?.['y'])) ? Number(box['y']) : 0,
    zoom: Number['isFinite'](count) && count > 0 ? count : 1,
  };
}
export function createRendererViewportJumpDetector({
  panThreshold: panThreshold = 160,
  zoomThreshold: zoomThreshold = 0.015,
} = {}) {
  let value = null;
  return {
    consume(options = {}) {
      const box2 = normalizeViewport(options),
        box3 = value;
      value = box2;
      if (!box3) return ![];
      return (
        Math['abs'](box2['x'] - box3['x']) > panThreshold ||
        Math['abs'](box2['y'] - box3['y']) > panThreshold ||
        Math['abs'](box2['zoom'] - box3['zoom']) > zoomThreshold
      );
    },
    reset() {
      value = null;
    },
  };
}
