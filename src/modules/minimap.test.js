import test from 'node:test';
import assert from 'node:assert/strict';
import { initMinimap } from './minimap.js';
import { calcWorldBounds } from '../core/math.js';
import { getPerfProbeSnapshot, resetPerfProbeData, setPerfProbeEnabled } from './perf/perfProbe.js';
function createStyle() {
  return {
    removeProperty(value) {
      delete this[String(value || '')];
    },
  };
}
function createFakeElement({
  id: id = '',
  width: width = 0,
  height: height = 0,
  left: left = 0,
  top: top = 0,
} = {}) {
  const map = new Map();
  return {
    id: id,
    style: createStyle(),
    className: '',
    children: [],
    clientWidth: width,
    clientHeight: height,
    parentNode: null,
    appendChild(el) {
      return (this.children.push(el), (el.parentNode = this), el);
    },
    removeChild(el2) {
      const count = this.children.indexOf(el2);
      if (count >= 0) this.children.splice(count, 1);
      el2.parentNode = null;
    },
    remove() {
      this.parentNode?.removeChild?.(this);
    },
    addEventListener(item, key) {
      const index = String(item || ''),
        list = map.get(index) || [];
      (list.push(key), map.set(index, list));
    },
    dispatch(result, data = {}) {
      const options = map.get(String(result || '')) || [];
      for (const run of options) run(data);
    },
    setPointerCapture() {},
    releasePointerCapture() {},
    getBoundingClientRect() {
      return {
        left: left,
        top: top,
        width: width,
        height: height,
        right: left + width,
        bottom: top + height,
      };
    },
  };
}
function computeExpectedViewportBox({
  viewport: viewport,
  mapW: mapW,
  mapH: mapH,
  innerWidth: innerWidth,
  innerHeight: innerHeight,
}) {
  const bounds = calcWorldBounds({}, viewport),
    target = Math.max(bounds.width, 0x3e8),
    source = Math.max(bounds.height, 0x3e8),
    scale = Math.min(mapW / target, mapH / source),
    offsetX = (mapW - target * scale) / 2,
    offsetY = (mapH - source * scale) / 2,
    width2 = innerWidth / viewport.zoom,
    height2 = innerHeight / viewport.zoom,
    next = -viewport.x / viewport.zoom,
    current = -viewport.y / viewport.zoom;
  return {
    bounds: bounds,
    scale: scale,
    offsetX: offsetX,
    offsetY: offsetY,
    left: offsetX + (next - bounds.minX) * scale,
    top: offsetY + (current - bounds.minY) * scale,
    width: width2 * scale,
    height: height2 * scale,
  };
}
function createStore(entry) {
  let args = entry;
  const list2 = [],
    list3 = [],
    handler = () => {
      list2.forEach((item2) => {
        const record = item2.selector(args);
        if (Object.is(item2.lastValue, record)) return;
        ((item2.lastValue = record), item2.callback(record));
      });
    };
  return {
    getStateRaw() {
      return args;
    },
    subscribeSelector(selector, callback) {
      const payload = { selector: selector, callback: callback, lastValue: selector(args) };
      return (
        list2.push(payload),
        () => {
          const count2 = list2.indexOf(payload);
          if (count2 >= 0) list2.splice(count2, 1);
        }
      );
    },
    setState(args2 = {}) {
      ((args = { ...args, ...args2 }), handler());
    },
    updateViewport(x, y, zoom) {
      (list3.push({ x: x, y: y, zoom: zoom }),
        (args = { ...args, viewport: { x: x, y: y, zoom: zoom } }),
        handler());
    },
    getViewportUpdates() {
      return list3.slice();
    },
  };
}
function installMinimapDomStubs() {
  const handle = globalThis.window,
    state = globalThis.document,
    config = globalThis.requestAnimationFrame,
    scope = globalThis.cancelAnimationFrame,
    minimap = createFakeElement({ id: 'minimap', width: 200, height: 140, left: 10, top: 20 }),
    minimapViewport = createFakeElement({ id: 'minimapViewport' }),
    minimapWrapper = createFakeElement({ id: 'minimapWrapper' }),
    fakeElement = createFakeElement({ id: 'v2-wrap' }),
    map2 = new Map([
      ['minimapViewport', minimapViewport],
      ['minimapWrapper', minimapWrapper],
      ['v2-wrap', fakeElement],
    ]);
  return (
    (globalThis.window = { innerWidth: 0x4b0, innerHeight: 0x320, _v2MinimapScale: 0 }),
    (globalThis.document = {
      createElement() {
        return createFakeElement();
      },
      getElementById(input) {
        return map2.get(String(input || '')) || null;
      },
    }),
    (globalThis.requestAnimationFrame = (handler2) => {
      return (handler2(), 1);
    }),
    (globalThis.cancelAnimationFrame = () => {}),
    {
      minimap: minimap,
      minimapViewport: minimapViewport,
      minimapWrapper: minimapWrapper,
      restore() {
        if (typeof handle === 'undefined') delete globalThis.window;
        else globalThis.window = handle;
        if (typeof state === 'undefined') delete globalThis.document;
        else globalThis.document = state;
        (typeof config === 'undefined'
          ? delete globalThis.requestAnimationFrame
          : (globalThis.requestAnimationFrame = config),
          typeof scope === 'undefined'
            ? delete globalThis.cancelAnimationFrame
            : (globalThis.cancelAnimationFrame = scope));
      },
    }
  );
}
(test('minimap: 空画布平移会刷新 viewport 框投影', () => {
  const mapW2 = installMinimapDomStubs(),
    viewport2 = createStore({ nodes: {}, viewport: { x: 0, y: 0, zoom: 1 }, _persistRev: 0, _nodeCount: 0 });
  let initMinimap2 = null;
  try {
    initMinimap2 = initMinimap(mapW2.minimap, viewport2);
    const box = computeExpectedViewportBox({
      viewport: viewport2.getStateRaw().viewport,
      mapW: mapW2.minimap.clientWidth,
      mapH: mapW2.minimap.clientHeight,
      innerWidth: globalThis.window.innerWidth,
      innerHeight: globalThis.window.innerHeight,
    });
    (assert.equal(mapW2.minimapViewport.style.left, box.left + 'px'),
      assert.equal(mapW2.minimapViewport.style.top, box.top + 'px'),
      viewport2.setState({ viewport: { x: 240, y: -120, zoom: 1 } }));
    const box2 = computeExpectedViewportBox({
      viewport: viewport2.getStateRaw().viewport,
      mapW: mapW2.minimap.clientWidth,
      mapH: mapW2.minimap.clientHeight,
      innerWidth: globalThis.window.innerWidth,
      innerHeight: globalThis.window.innerHeight,
    });
    (assert.equal(mapW2.minimapViewport.style.left, box2.left + 'px'),
      assert.equal(mapW2.minimapViewport.style.top, box2.top + 'px'));
  } finally {
    (initMinimap2?.(), mapW2.restore());
  }
}),
  test('minimap: canvas pan preview throttles viewport box updates', () => {
    const output = globalThis.setTimeout,
      value2 = globalThis.clearTimeout,
      value3 = Object.prototype.hasOwnProperty.call(globalThis, 'performance'),
      value4 = globalThis.performance,
      list4 = [];
    let value5 = 0x3e8;
    ((globalThis.setTimeout = (callback2, delay) => {
      const value6 = { callback: callback2, delay: delay, cancelled: false };
      return (list4.push(value6), value6);
    }),
      (globalThis.clearTimeout = (value7) => {
        if (value7) value7.cancelled = true;
      }),
      Object.defineProperty(globalThis, 'performance', {
        configurable: true,
        value: { now: () => value5 },
      }));
    const mapW3 = installMinimapDomStubs(),
      store = createStore({
        nodes: {},
        viewport: { x: 0, y: 0, zoom: 1 },
        _persistRev: 0,
        _nodeCount: 0,
      });
    let initMinimap3 = null;
    try {
      initMinimap3 = initMinimap(mapW3.minimap, store);
      const value8 = { x: 120, y: -60, zoom: 1 };
      globalThis.window._v2ScheduleMinimapViewportPreview(value8, { force: true });
      const value9 = mapW3.minimapViewport.style.left,
        value10 = mapW3.minimapViewport.style.top;
      value5 = 0x3fc;
      const viewport3 = { x: 0x104, y: -90, zoom: 1 };
      (globalThis.window._v2ScheduleMinimapViewportPreview(viewport3),
        assert.equal(mapW3.minimapViewport.style.left, value9),
        assert.equal(mapW3.minimapViewport.style.top, value10),
        assert.equal(list4.length, 1),
        assert.ok(list4[0].delay > 0),
        assert.ok(list4[0].delay <= 96),
        (value5 = 0x44c),
        list4[0].callback());
      const box3 = computeExpectedViewportBox({
        viewport: viewport3,
        mapW: mapW3.minimap.clientWidth,
        mapH: mapW3.minimap.clientHeight,
        innerWidth: globalThis.window.innerWidth,
        innerHeight: globalThis.window.innerHeight,
      });
      (assert.equal(mapW3.minimapViewport.style.left, box3.left + 'px'),
        assert.equal(mapW3.minimapViewport.style.top, box3.top + 'px'),
        assert.deepEqual(store.getViewportUpdates(), []));
    } finally {
      (initMinimap3?.(),
        mapW3.restore(),
        (globalThis.setTimeout = output),
        (globalThis.clearTimeout = value2),
        value3
          ? Object.defineProperty(globalThis, 'performance', { configurable: true, value: value4 })
          : delete globalThis.performance);
    }
  }),
  test('minimap: viewport-only store updates do not refresh node dots', () => {
    const ctx = installMinimapDomStubs(),
      list5 = [];
    let value11 = 1;
    ((globalThis.requestAnimationFrame = (callback3) => {
      const id2 = value11;
      return ((value11 += 1), list5.push({ id: id2, callback: callback3 }), id2);
    }),
      (globalThis.cancelAnimationFrame = (value12) => {
        const count3 = list5.findIndex((item3) => item3.id === value12);
        if (count3 >= 0) list5.splice(count3, 1);
      }));
    const run2 = () => {
        const list6 = list5.splice(0);
        list6.forEach((item4) => item4.callback?.());
      },
      store2 = createStore({
        nodes: { node_a: { id: 'node_a', type: 'source-image', x: 100, y: 120, width: 240, height: 160 } },
        viewport: { x: 0, y: 0, zoom: 1 },
        _persistRev: 1,
        _nodeCount: 1,
      });
    let initMinimap4 = null;
    try {
      (setPerfProbeEnabled(true),
        (initMinimap4 = initMinimap(ctx.minimap, store2)),
        run2(),
        resetPerfProbeData());
      let value13 = 0;
      (Object.defineProperty(ctx.minimap, 'clientWidth', {
        configurable: true,
        get() {
          return ((value13 += 1), 200);
        },
      }),
        Object.defineProperty(ctx.minimap, 'clientHeight', {
          configurable: true,
          get() {
            return ((value13 += 1), 140);
          },
        }),
        store2.setState({ viewport: { x: 80, y: -40, zoom: 1.2 } }),
        run2());
      const list7 = getPerfProbeSnapshot().minimapUpdateSamples;
      (assert.equal(list7.length, 1),
        assert.equal(list7[0].mode, 'viewport'),
        assert.equal(list7[0].viewportOnly, true),
        assert.equal(list7[0].updatedCount, 0),
        assert.equal(value13, 0));
    } finally {
      (initMinimap4?.(), resetPerfProbeData(), setPerfProbeEnabled(false), ctx.restore());
    }
  }),
  test('minimap: persist-only updates reuse node dot layout', () => {
    const ctx2 = installMinimapDomStubs(),
      list8 = [];
    let value14 = 1;
    ((globalThis.requestAnimationFrame = (callback4) => {
      const id3 = value14;
      return ((value14 += 1), list8.push({ id: id3, callback: callback4 }), id3);
    }),
      (globalThis.cancelAnimationFrame = (value15) => {
        const count4 = list8.findIndex((item5) => item5.id === value15);
        if (count4 >= 0) list8.splice(count4, 1);
      }));
    const run3 = () => {
        const list9 = list8.splice(0);
        list9.forEach((item6) => item6.callback?.());
      },
      store3 = createStore({
        nodes: { node_a: { id: 'node_a', type: 'source-video', x: 100, y: 120, width: 240, height: 160 } },
        viewport: { x: 0, y: 0, zoom: 1 },
        _persistRev: 1,
        _nodeCount: 1,
      });
    let initMinimap5 = null;
    try {
      (setPerfProbeEnabled(true),
        (initMinimap5 = initMinimap(ctx2.minimap, store3)),
        run3(),
        resetPerfProbeData(),
        store3.setState({ _persistRev: 2, viewport: { x: 0, y: 0, zoom: 1 } }),
        run3());
      const list10 = getPerfProbeSnapshot().minimapUpdateSamples;
      (assert.equal(list10.length, 1),
        assert.equal(list10[0].mode, 'viewport'),
        assert.equal(list10[0].viewportOnly, true),
        assert.equal(list10[0].updatedCount, 0));
    } finally {
      (initMinimap5?.(), resetPerfProbeData(), setPerfProbeEnabled(false), ctx2.restore());
    }
  }),
  test('minimap: 空画布平移后点击小地图使用最新 bounds', () => {
    const mapW4 = installMinimapDomStubs(),
      store4 = createStore({
        nodes: {},
        viewport: { x: 180, y: -60, zoom: 1.25 },
        _persistRev: 0,
        _nodeCount: 0,
      });
    let initMinimap6 = null;
    try {
      initMinimap6 = initMinimap(mapW4.minimap, store4);
      const event = { clientX: 128, clientY: 104, pointerId: 7, stopPropagation() {} };
      mapW4.minimapWrapper.dispatch('pointerdown', event);
      const box4 = computeExpectedViewportBox({
          viewport: { x: 180, y: -60, zoom: 1.25 },
          mapW: mapW4.minimap.clientWidth,
          mapH: mapW4.minimap.clientHeight,
          innerWidth: globalThis.window.innerWidth,
          innerHeight: globalThis.window.innerHeight,
        }),
        box5 = mapW4.minimap.getBoundingClientRect(),
        value16 = event.clientX - box5.left - box4.offsetX,
        value17 = event.clientY - box5.top - box4.offsetY,
        value18 = box4.bounds.minX + value16 / box4.scale,
        value19 = box4.bounds.minY + value17 / box4.scale,
        value20 = {
          x: globalThis.window.innerWidth / 2 - value18 * 1.25,
          y: globalThis.window.innerHeight / 2 - value19 * 1.25,
          zoom: 1.25,
        },
        [value21] = store4.getViewportUpdates();
      assert.deepEqual(value21, value20);
    } finally {
      (initMinimap6?.(), mapW4.restore());
    }
  }));
