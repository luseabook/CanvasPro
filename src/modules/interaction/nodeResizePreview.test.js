import test from 'node:test';
import assert from 'node:assert/strict';
import { startNodeResizePreview } from './nodeResizePreview.js';
import { getPerfProbeSnapshot, resetPerfProbeData, setPerfProbeEnabled } from '../perf/perfProbe.js';
function createClassList() {
  const _0x46f2f9 = new Set();
  return {
    add(..._0x2002cf) {
      _0x2002cf.forEach((_0x539811) => _0x46f2f9.add(String(_0x539811)));
    },
    remove(..._0x274986) {
      _0x274986.forEach((_0x4205e7) => _0x46f2f9.delete(String(_0x4205e7)));
    },
    contains(_0x597b36) {
      return _0x46f2f9.has(String(_0x597b36));
    },
  };
}
function withFakeBrowser(_0x124af8) {
  const _0x287884 = {
      window: globalThis.window,
      document: globalThis.document,
      requestAnimationFrame: globalThis.requestAnimationFrame,
      cancelAnimationFrame: globalThis.cancelAnimationFrame,
    },
    _0x13d1f4 = {
      window: Object.prototype.hasOwnProperty.call(globalThis, 'window'),
      document: Object.prototype.hasOwnProperty.call(globalThis, 'document'),
      requestAnimationFrame: Object.prototype.hasOwnProperty.call(globalThis, 'requestAnimationFrame'),
      cancelAnimationFrame: Object.prototype.hasOwnProperty.call(globalThis, 'cancelAnimationFrame'),
    },
    _0x117aa0 = createClassList(),
    _0x539fa9 = createClassList(),
    _0x41c157 = { style: {}, classList: _0x539fa9 },
    _0x2f4062 = {},
    _0x50e2bb = [],
    _0x50a310 = [],
    _0x5d2f22 = [];
  let _0x3c1351 = 1,
    _0x1400c0 = 0;
  ((globalThis.document = {
    body: { classList: _0x117aa0 },
    getElementById(_0x579513) {
      return _0x579513 === 'node-1' ? _0x41c157 : null;
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
      _lastMx: 0x14d,
      _lastMy: 0x1bc,
      v2Renderer: {
        previewNodeResizeGeometry(_0x26c818) {
          _0x50a310.push(_0x26c818);
        },
      },
      _v2UpdateSidePlusNow(_0x4c6e73, _0x1b6330, _0x569b56) {
        _0x5d2f22.push({ x: _0x4c6e73, y: _0x1b6330, options: _0x569b56 });
      },
      addEventListener(_0x42671a, _0x33c6d9) {
        _0x2f4062[_0x42671a] = _0x33c6d9;
      },
      removeEventListener(_0x322235, _0x5c1ae1) {
        if (_0x2f4062[_0x322235] === _0x5c1ae1) delete _0x2f4062[_0x322235];
      },
    }),
    (globalThis.requestAnimationFrame = (_0x3ec6c3) => {
      const _0x3f8121 = _0x3c1351;
      return (
        (_0x3c1351 += 1),
        _0x50e2bb.push({ id: _0x3f8121, callback: _0x3ec6c3, cancelled: false }),
        _0x3f8121
      );
    }),
    (globalThis.cancelAnimationFrame = (_0x3c0282) => {
      const _0x4c68ea = _0x50e2bb.find((_0x3bec7d) => _0x3bec7d.id === _0x3c0282);
      if (_0x4c68ea) _0x4c68ea.cancelled = true;
    }));
  const _0x231bc5 = {
    bodyClassList: _0x117aa0,
    nodeClassList: _0x539fa9,
    nodeEl: _0x41c157,
    listeners: _0x2f4062,
    rendererCalls: _0x50a310,
    sidePlusCalls: _0x5d2f22,
    flushRaf() {
      const _0x37785f = _0x50e2bb.splice(0);
      for (const _0x89d16d of _0x37785f) {
        if (_0x89d16d.cancelled) continue;
        ((_0x1400c0 += 16), _0x89d16d.callback(_0x1400c0));
      }
    },
  };
  try {
    return _0x124af8(_0x231bc5);
  } finally {
    for (const _0x2a772e of Object.keys(_0x287884)) {
      if (_0x13d1f4[_0x2a772e]) globalThis[_0x2a772e] = _0x287884[_0x2a772e];
      else delete globalThis[_0x2a772e];
    }
  }
}
(test('node resize preview updates DOM per frame and commits once', () => {
  withFakeBrowser(
    ({
      bodyClassList: _0x4664df,
      nodeClassList: _0x444087,
      nodeEl: _0x24dd60,
      listeners: _0x4ebcd4,
      rendererCalls: _0xdbd50f,
      sidePlusCalls: _0x261953,
      flushRaf: _0x240fd1,
    }) => {
      const _0x49fdaa = [];
      let _0x1136ae = 0,
        _0x46de82 = 0;
      const _0x1c1a96 = startNodeResizePreview({
        event: { clientX: 100, clientY: 100, preventDefault() {}, stopPropagation() {} },
        nodeId: 'node-1',
        getNode: () => ({ id: 'node-1', width: 200, height: 120 }),
        getViewport: () => ({ zoom: 2 }),
        resolveSize: ({ startWidth: _0x458b89, startHeight: _0x36ec2e, dx: _0xad584a, dy: _0x40ddf0 }) => ({
          width: _0x458b89 + _0xad584a,
          height: _0x36ec2e + _0x40ddf0,
        }),
        applyPatch: (_0x4fdd91) => _0x49fdaa.push(_0x4fdd91),
        onPreview: () => {
          _0x46de82 += 1;
        },
        commit: () => {
          _0x1136ae += 1;
        },
      });
      (assert.equal(_0x1c1a96, true),
        assert.equal(_0x4664df.contains('is-node-resizing'), true),
        assert.equal(_0x444087.contains('is-resizing'), true),
        _0x4ebcd4.pointermove({ clientX: 120, clientY: 110 }),
        _0x4ebcd4.pointermove({ clientX: 160, clientY: 140 }),
        assert.deepEqual(_0x49fdaa, []),
        assert.deepEqual(_0x24dd60.style, {}),
        _0x240fd1(),
        assert.equal(_0x24dd60.style.width, '230px'),
        assert.equal(_0x24dd60.style.height, '140px'),
        assert.equal(_0x46de82, 1),
        assert.deepEqual(_0xdbd50f, [{ nodeId: 'node-1', width: 230, height: 140 }]),
        assert.equal(_0x261953.length, 1),
        assert.equal(_0x261953[0].x, 0x14d),
        assert.equal(_0x261953[0].y, 0x1bc),
        assert.deepEqual(_0x261953[0].options.nodeSizeOverrides, { 'node-1': { width: 230, height: 140 } }),
        _0x4ebcd4.pointerup(),
        assert.deepEqual(_0x49fdaa, [{ width: 230, height: 140 }]),
        assert.equal(_0x1136ae, 1),
        assert.equal(_0xdbd50f.length, 2),
        assert.deepEqual(_0xdbd50f.at(-1), { nodeId: 'node-1', width: 230, height: 140 }),
        assert.equal(_0x261953.length, 2),
        assert.deepEqual(_0x261953.at(-1).options.nodeSizeOverrides, {
          'node-1': { width: 230, height: 140 },
        }),
        assert.equal(_0x4664df.contains('is-node-resizing'), false),
        assert.equal(_0x444087.contains('is-resizing'), false),
        assert.equal(_0x4ebcd4.pointermove, undefined));
    },
  );
}),
  test('node resize preview records resize fps sessions', () => {
    withFakeBrowser(({ listeners: _0x544a3a, flushRaf: _0x18ca80 }) => {
      (setPerfProbeEnabled(true),
        resetPerfProbeData(),
        startNodeResizePreview({
          event: { clientX: 0, clientY: 0, preventDefault() {}, stopPropagation() {} },
          nodeId: 'node-1',
          getNode: () => ({ id: 'node-1', width: 100, height: 100 }),
          getViewport: () => ({ zoom: 1 }),
          resolveSize: ({ startWidth: _0x272abf, startHeight: _0x48fd9a, dx: _0x45429e, dy: _0x2462cc }) => ({
            width: _0x272abf + _0x45429e,
            height: _0x48fd9a + _0x2462cc,
          }),
          applyPatch() {},
          commit() {},
          label: 'test-resize',
        }),
        _0x544a3a.pointermove({ clientX: 10, clientY: 10 }),
        _0x18ca80(),
        _0x18ca80(),
        _0x544a3a.pointerup());
      const _0x54dc74 = getPerfProbeSnapshot();
      (assert.equal(_0x54dc74.resizeFpsSessions.length, 1),
        assert.equal(_0x54dc74.resizeFpsSessions[0].label, 'test-resize'),
        resetPerfProbeData(),
        setPerfProbeEnabled(false));
    });
  }));
