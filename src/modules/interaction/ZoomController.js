import { beginZoomFpsSession, endZoomFpsSession } from '../perf/perfProbe.js';
export function createZoomController({ store: store }) {
  let setTimeout2 = 0,
    value = 0,
    item = 0,
    key = 0,
    index = 0,
    enabled = null;
  const result = 'is-edge-interaction-lite',
    data = 0.24,
    options = 0.48,
    target = 3,
    source = 160;
  function run(next, current) {
    const entry = Object.keys(next?.edges || {}).length,
      record = typeof window !== 'undefined' ? window._edgeDomCache : null;
    return current >= data && current <= options && entry >= target && record && record.size > 0;
  }
  function run2(enabled2) {
    if (typeof document === 'undefined' || !document?.body?.classList) return;
    document.body.classList.toggle(result, !!enabled2);
  }
  function run3(payload) {
    if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(payload);
    return setTimeout(payload, 0);
  }
  function run4() {
    item = 0;
    if (!enabled) return;
    const { x: x, y: y, zoom: zoom } = enabled;
    ((enabled = null), store.updateViewport(x, y, zoom));
  }
  function run5(handle) {
    enabled = handle;
    if (item) return;
    item = run3(run4);
  }
  function run6(state) {
    const box = enabled || state?.viewport || {},
      zoom2 = Number.isFinite(box.zoom) && box.zoom > 0 ? box.zoom : 1;
    return {
      x: Number.isFinite(box.x) ? box.x : 0,
      y: Number.isFinite(box.y) ? box.y : 0,
      zoom: zoom2,
    };
  }
  function handleWheel(config, scope, count) {
    const input = store.getStateRaw(),
      output = typeof document !== 'undefined' && document && document.body;
    if (output) document.body.classList.add('is-zooming');
    beginZoomFpsSession('wheel-zoom');
    const box2 = run6(input),
      value2 = count > 0 ? 0.9 : 1.1,
      zoom3 = Math.min(2, Math.max(0.2, box2.zoom * value2)),
      x2 = config - (config - box2.x) * (zoom3 / box2.zoom),
      y2 = scope - (scope - box2.y) * (zoom3 / box2.zoom);
    (run5({ x: x2, y: y2, zoom: zoom3 }), run2(run(input, zoom3)));
    if (setTimeout2) clearTimeout(setTimeout2);
    setTimeout2 = setTimeout(() => {
      ((setTimeout2 = 0), run4());
      if (output) document.body.classList.remove('is-zooming');
      (run2(false), endZoomFpsSession('wheel-zoom'), store.markViewportPersist());
    }, source);
    const value3 = typeof window !== 'undefined' ? window : null;
    ((key = value3?._lastMx || config), (index = value3?._lastMy || scope));
    if (value) return;
    value = run3(() => {
      value = 0;
      const run7 =
        typeof value3?._v2UpdateSidePlusNow === 'function'
          ? value3._v2UpdateSidePlusNow
          : value3?._v2UpdateSidePlus;
      typeof run7 === 'function' && run7(key, index);
    });
  }
  return { handleWheel: handleWheel };
}
