import test from 'node:test';
import assert from 'node:assert/strict';
import { createZoomController } from './ZoomController.js';
function createClassList() {
  const map = new Set();
  return {
    add(...list) {
      list.forEach((item) => map.add(String(item)));
    },
    remove(...list2) {
      list2.forEach((item2) => map.delete(String(item2)));
    },
    toggle(value, enabled) {
      const key = String(value),
        index = enabled === undefined ? !map.has(key) : !!enabled;
      if (index) map.add(key);
      else map.delete(key);
      return index;
    },
    contains(result) {
      return map.has(String(result));
    },
  };
}
function withFakeBrowser(handler) {
  const data = Object.prototype.hasOwnProperty.call(globalThis, 'window'),
    options = Object.prototype.hasOwnProperty.call(globalThis, 'document'),
    target = Object.prototype.hasOwnProperty.call(globalThis, 'requestAnimationFrame'),
    source = Object.prototype.hasOwnProperty.call(globalThis, 'cancelAnimationFrame'),
    next = Object.prototype.hasOwnProperty.call(globalThis, 'setTimeout'),
    current = Object.prototype.hasOwnProperty.call(globalThis, 'clearTimeout'),
    entry = globalThis.window,
    record = globalThis.document,
    payload = globalThis.requestAnimationFrame,
    handle = globalThis.cancelAnimationFrame,
    state = globalThis.setTimeout,
    config = globalThis.clearTimeout,
    classList = createClassList(),
    plusCalls = [],
    list3 = [],
    list4 = [];
  let scope = 0,
    input = 1,
    output = 1;
  ((globalThis.document = { body: { classList: classList } }),
    (globalThis.window = {
      _lastMx: 150,
      _lastMy: 160,
      __perfProbeEnabled: false,
      location: { href: 'http://127.0.0.1/' },
      document: { querySelectorAll: () => [] },
      performance: { getEntriesByType: () => [] },
      _v2UpdateSidePlusNow(x, y) {
        plusCalls.push({ x: x, y: y });
      },
    }),
    (globalThis.requestAnimationFrame = (callback) => {
      const id = input;
      return ((input += 1), list3.push({ id: id, callback: callback, cancelled: false }), id);
    }),
    (globalThis.cancelAnimationFrame = (value2) => {
      const value3 = list3.find((item3) => item3.id === value2);
      if (value3) value3.cancelled = true;
    }),
    (globalThis.setTimeout = (callback2, ms) => {
      const id2 = output;
      return ((output += 1), list4.push({ id: id2, callback: callback2, ms: ms, cancelled: false }), id2);
    }),
    (globalThis.clearTimeout = (value4) => {
      const value5 = list4.find((item4) => item4.id === value4);
      if (value5) value5.cancelled = true;
    }));
  const value6 = {
    classList: classList,
    plusCalls: plusCalls,
    flushRaf() {
      const value7 = list3.splice(0);
      for (const value8 of value7) {
        if (value8.cancelled) continue;
        ((scope += 16), value8.callback(scope));
      }
    },
    runTimers() {
      const value9 = list4.splice(0);
      for (const enabled2 of value9) {
        if (!enabled2.cancelled) enabled2.callback();
      }
    },
  };
  try {
    return handler(value6);
  } finally {
    if (data) globalThis.window = entry;
    else delete globalThis.window;
    if (options) globalThis.document = record;
    else delete globalThis.document;
    if (target) globalThis.requestAnimationFrame = payload;
    else delete globalThis.requestAnimationFrame;
    if (source) globalThis.cancelAnimationFrame = handle;
    else delete globalThis.cancelAnimationFrame;
    if (next) globalThis.setTimeout = state;
    else delete globalThis.setTimeout;
    if (current) globalThis.clearTimeout = config;
    else delete globalThis.clearTimeout;
  }
}
function createStore(args = { x: 0, y: 0, zoom: 1 }) {
  const state2 = { viewport: { ...args }, edges: {} },
    updates = [],
    order = [];
  return {
    state: state2,
    updates: updates,
    order: order,
    persistCount: 0,
    store: {
      getStateRaw() {
        return state2;
      },
      updateViewport(x2, y2, zoom) {
        (updates.push({ x: x2, y: y2, zoom: zoom }),
          order.push('update'),
          (state2.viewport = { x: x2, y: y2, zoom: zoom }));
      },
      markViewportPersist() {
        (order.push('persist'), (this.persistCount += 1));
      },
    },
  };
}
(test('ZoomController batches wheel viewport updates into one frame', () => {
  withFakeBrowser(
    ({ classList: classList2, plusCalls: plusCalls2, flushRaf: flushRaf2, runTimers: runTimers2 }) => {
      const store = createStore(),
        zoomController = createZoomController({ store: store.store });
      (zoomController.handleWheel(100, 100, -1),
        zoomController.handleWheel(100, 100, -1),
        assert.equal(store.updates.length, 0),
        assert.equal(classList2.contains('is-zooming'), true),
        flushRaf2(),
        assert.equal(store.updates.length, 1),
        assert.equal(Math.round(store.updates[0].zoom * 100), 121),
        assert.equal(Math.round(store.updates[0].x), -21),
        assert.equal(Math.round(store.updates[0].y), -21),
        assert.deepEqual(plusCalls2, [{ x: 150, y: 160 }]),
        runTimers2(),
        assert.equal(classList2.contains('is-zooming'), false),
        assert.deepEqual(store.order, ['update', 'persist']));
    },
  );
}),
  test('ZoomController flushes pending viewport before zoom-end persist', () => {
    withFakeBrowser(({ classList: classList3, flushRaf: flushRaf3, runTimers: runTimers3 }) => {
      const store2 = createStore(),
        zoomController2 = createZoomController({ store: store2.store });
      (zoomController2.handleWheel(100, 100, -1),
        runTimers3(),
        assert.equal(store2.updates.length, 1),
        assert.deepEqual(store2.order, ['update', 'persist']),
        assert.equal(classList3.contains('is-zooming'), false),
        flushRaf3(),
        assert.equal(store2.updates.length, 1));
    });
  }));
