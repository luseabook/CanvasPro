import test from 'node:test';
import assert from 'node:assert/strict';
import { startNodeResizePreview } from './nodeResizePreview.js';
import { getPerfProbeSnapshot, resetPerfProbeData, setPerfProbeEnabled } from '../perf/perfProbe.js';
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
function withFakeBrowser(handler) {
  const key = {
      window: globalThis.window,
      document: globalThis.document,
      requestAnimationFrame: globalThis.requestAnimationFrame,
      cancelAnimationFrame: globalThis.cancelAnimationFrame,
    },
    index = {
      window: Object.prototype.hasOwnProperty.call(globalThis, 'window'),
      document: Object.prototype.hasOwnProperty.call(globalThis, 'document'),
      requestAnimationFrame: Object.prototype.hasOwnProperty.call(globalThis, 'requestAnimationFrame'),
      cancelAnimationFrame: Object.prototype.hasOwnProperty.call(globalThis, 'cancelAnimationFrame'),
    },
    classList = createClassList(),
    classList2 = createClassList(),
    nodeEl = { style: {}, classList: classList2 },
    listeners = {},
    list3 = [],
    rendererCalls = [],
    sidePlusCalls = [];
  let result = 1,
    data = 0;
  ((globalThis.document = {
    body: { classList: classList },
    getElementById(options) {
      return options === 'node-1' ? nodeEl : null;
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
      _lastMx: 333,
      _lastMy: 444,
      v2Renderer: {
        previewNodeResizeGeometry(target) {
          rendererCalls.push(target);
        },
      },
      _v2UpdateSidePlusNow(x, y, options2) {
        sidePlusCalls.push({ x: x, y: y, options: options2 });
      },
      addEventListener(source, next) {
        listeners[source] = next;
      },
      removeEventListener(current, entry) {
        if (listeners[current] === entry) delete listeners[current];
      },
    }),
    (globalThis.requestAnimationFrame = (callback) => {
      const id = result;
      return ((result += 1), list3.push({ id: id, callback: callback, cancelled: false }), id);
    }),
    (globalThis.cancelAnimationFrame = (record) => {
      const payload = list3.find((item3) => item3.id === record);
      if (payload) payload.cancelled = true;
    }));
  const handle = {
    bodyClassList: classList,
    nodeClassList: classList2,
    nodeEl: nodeEl,
    listeners: listeners,
    rendererCalls: rendererCalls,
    sidePlusCalls: sidePlusCalls,
    flushRaf() {
      const state = list3.splice(0);
      for (const config of state) {
        if (config.cancelled) continue;
        ((data += 16), config.callback(data));
      }
    },
  };
  try {
    return handler(handle);
  } finally {
    for (const scope of Object.keys(key)) {
      if (index[scope]) globalThis[scope] = key[scope];
      else delete globalThis[scope];
    }
  }
}
(test('node resize preview updates DOM per frame and commits once', () => {
  withFakeBrowser(
    ({
      bodyClassList: bodyClassList,
      nodeClassList: nodeClassList,
      nodeEl: nodeEl2,
      listeners: listeners2,
      rendererCalls: rendererCalls2,
      sidePlusCalls: sidePlusCalls2,
      flushRaf: flushRaf2,
    }) => {
      const list4 = [];
      let input = 0,
        output = 0;
      const startNodeResizePreview2 = startNodeResizePreview({
        event: { clientX: 100, clientY: 100, preventDefault() {}, stopPropagation() {} },
        nodeId: 'node-1',
        getNode: () => ({ id: 'node-1', width: 200, height: 120 }),
        getViewport: () => ({ zoom: 2 }),
        resolveSize: ({ startWidth: startWidth, startHeight: startHeight, dx: dx, dy: dy }) => ({
          width: startWidth + dx,
          height: startHeight + dy,
        }),
        applyPatch: (value2) => list4.push(value2),
        onPreview: () => {
          output += 1;
        },
        commit: () => {
          input += 1;
        },
      });
      (assert.equal(startNodeResizePreview2, true),
        assert.equal(bodyClassList.contains('is-node-resizing'), true),
        assert.equal(nodeClassList.contains('is-resizing'), true),
        listeners2.pointermove({ clientX: 120, clientY: 110 }),
        listeners2.pointermove({ clientX: 160, clientY: 140 }),
        assert.deepEqual(list4, []),
        assert.deepEqual(nodeEl2.style, {}),
        flushRaf2(),
        assert.equal(nodeEl2.style.width, '230px'),
        assert.equal(nodeEl2.style.height, '140px'),
        assert.equal(output, 1),
        assert.deepEqual(rendererCalls2, [{ nodeId: 'node-1', width: 230, height: 140 }]),
        assert.equal(sidePlusCalls2.length, 1),
        assert.equal(sidePlusCalls2[0].x, 333),
        assert.equal(sidePlusCalls2[0].y, 444),
        assert.deepEqual(sidePlusCalls2[0].options.nodeSizeOverrides, {
          'node-1': { width: 230, height: 140 },
        }),
        listeners2.pointerup(),
        assert.deepEqual(list4, [{ width: 230, height: 140 }]),
        assert.equal(input, 1),
        assert.equal(rendererCalls2.length, 2),
        assert.deepEqual(rendererCalls2.at(-1), { nodeId: 'node-1', width: 230, height: 140 }),
        assert.equal(sidePlusCalls2.length, 2),
        assert.deepEqual(sidePlusCalls2.at(-1).options.nodeSizeOverrides, {
          'node-1': { width: 230, height: 140 },
        }),
        assert.equal(bodyClassList.contains('is-node-resizing'), false),
        assert.equal(nodeClassList.contains('is-resizing'), false),
        assert.equal(listeners2.pointermove, undefined));
    },
  );
}),
  test('node resize preview records resize fps sessions', () => {
    withFakeBrowser(({ listeners: listeners3, flushRaf: flushRaf3 }) => {
      (setPerfProbeEnabled(true),
        resetPerfProbeData(),
        startNodeResizePreview({
          event: { clientX: 0, clientY: 0, preventDefault() {}, stopPropagation() {} },
          nodeId: 'node-1',
          getNode: () => ({ id: 'node-1', width: 100, height: 100 }),
          getViewport: () => ({ zoom: 1 }),
          resolveSize: ({ startWidth: startWidth2, startHeight: startHeight2, dx: dx2, dy: dy2 }) => ({
            width: startWidth2 + dx2,
            height: startHeight2 + dy2,
          }),
          applyPatch() {},
          commit() {},
          label: 'test-resize',
        }),
        listeners3.pointermove({ clientX: 10, clientY: 10 }),
        flushRaf3(),
        flushRaf3(),
        listeners3.pointerup());
      const perfProbeSnapshot = getPerfProbeSnapshot();
      (assert.equal(perfProbeSnapshot.resizeFpsSessions.length, 1),
        assert.equal(perfProbeSnapshot.resizeFpsSessions[0].label, 'test-resize'),
        resetPerfProbeData(),
        setPerfProbeEnabled(false));
    });
  }));
