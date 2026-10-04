import test from 'node:test';
import assert from 'node:assert/strict';
import { createNodeResizeHandle } from './nodeResizeUi.js';
function createClassList() {
  const map = new Set();
  return {
    add(...list) {
      list.forEach((item) => map.add(String(item)));
    },
    remove(...list2) {
      list2.forEach((item2) => map.delete(String(item2)));
    },
    contains(value) {
      return map.has(String(value));
    },
  };
}
function createElement() {
  const _listeners = {};
  return {
    style: {},
    className: '',
    classList: createClassList(),
    addEventListener(key, index) {
      _listeners[key] = index;
    },
    _listeners: _listeners,
  };
}
function withFakeBrowser(handler) {
  const result = {
      window: globalThis.window,
      document: globalThis.document,
      requestAnimationFrame: globalThis.requestAnimationFrame,
      cancelAnimationFrame: globalThis.cancelAnimationFrame,
    },
    data = Object.fromEntries(
      Object.keys(result).map((item3) => [item3, Object.prototype.hasOwnProperty.call(globalThis, item3)]),
    ),
    listeners = {},
    list3 = [],
    previewEl = createElement();
  let options = 1;
  ((globalThis.document = {
    body: { classList: createClassList() },
    createElement: createElement,
    getElementById(target) {
      return target === 'node-1' ? previewEl : null;
    },
    querySelectorAll() {
      return [];
    },
  }),
    (globalThis.window = {
      __perfProbeEnabled: false,
      location: { href: 'http://127.0.0.1/' },
      document: globalThis.document,
      performance: { getEntriesByType: () => [] },
      addEventListener(source, next) {
        listeners[source] = next;
      },
      removeEventListener(current, entry) {
        if (listeners[current] === entry) delete listeners[current];
      },
    }),
    (globalThis.requestAnimationFrame = (callback) => {
      const id = options;
      return ((options += 1), list3.push({ id: id, callback: callback, cancelled: false }), id);
    }),
    (globalThis.cancelAnimationFrame = (record) => {
      const payload = list3.find((item4) => item4.id === record);
      if (payload) payload.cancelled = true;
    }));
  const handle = {
    listeners: listeners,
    previewEl: previewEl,
    flushRaf() {
      const list4 = list3.splice(0);
      list4.forEach((enabled) => {
        if (!enabled.cancelled) enabled.callback(16);
      });
    },
  };
  try {
    return handler(handle);
  } finally {
    Object.keys(result).forEach((item5) => {
      if (data[item5]) globalThis[item5] = result[item5];
      else delete globalThis[item5];
    });
  }
}
test('createNodeResizeHandle: honors custom minimum size', () => {
  withFakeBrowser(({ listeners: listeners2, flushRaf: flushRaf2, previewEl: previewEl2 }) => {
    const _data = {
        id: 'node-1',
        width: 0x4b0,
        height: 0x2bc,
        resizeMinWidth: 0x400,
        resizeMinHeight: 0x240,
      },
      list5 = [];
    let state = 0;
    const nodeResizeHandle = createNodeResizeHandle(
      { nodeId: 'node-1', _data: _data },
      {
        store: {
          updateNodeData(id2, patch) {
            (list5.push({ id: id2, patch: patch }), Object.assign(_data, patch));
          },
        },
        getStateSnapshot: () => ({ viewport: { zoom: 1 }, nodes: { 'node-1': _data } }),
        commit: () => {
          state += 1;
        },
        resolveMinSize: (width) => ({
          width: width.resizeMinWidth,
          height: width.resizeMinHeight,
        }),
      },
    );
    (nodeResizeHandle._listeners.pointerdown({
      clientX: 0,
      clientY: 0,
      preventDefault() {},
      stopPropagation() {},
    }),
      listeners2.pointermove({ clientX: -0x1f4, clientY: -0x1f4 }),
      flushRaf2(),
      listeners2.pointerup(),
      assert.equal(previewEl2.style.width, '1024px'),
      assert.equal(previewEl2.style.height, '576px'),
      assert.deepEqual(list5, [{ id: 'node-1', patch: { width: 0x400, height: 0x240 } }]),
      assert.equal(state, 1));
  });
});
