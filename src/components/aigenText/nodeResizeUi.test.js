import test from 'node:test';
import assert from 'node:assert/strict';
import { createNodeResizeHandle } from './nodeResizeUi.js';
function createClassList() {
  const _0x5637f7 = new Set();
  return {
    add(..._0x4adb6b) {
      _0x4adb6b.forEach((_0x2570c2) => _0x5637f7.add(String(_0x2570c2)));
    },
    remove(..._0x486820) {
      _0x486820.forEach((_0x394160) => _0x5637f7.delete(String(_0x394160)));
    },
    contains(_0x57cd1e) {
      return _0x5637f7.has(String(_0x57cd1e));
    },
  };
}
function createElement() {
  const _0x419152 = {};
  return {
    style: {},
    className: '',
    classList: createClassList(),
    addEventListener(_0x27d716, _0x8d3967) {
      _0x419152[_0x27d716] = _0x8d3967;
    },
    _listeners: _0x419152,
  };
}
function withFakeBrowser(_0x1a29ea) {
  const _0x2cebf3 = {
      window: globalThis.window,
      document: globalThis.document,
      requestAnimationFrame: globalThis.requestAnimationFrame,
      cancelAnimationFrame: globalThis.cancelAnimationFrame,
    },
    _0x19d659 = Object.fromEntries(
      Object.keys(_0x2cebf3).map((_0xc11709) => [
        _0xc11709,
        Object.prototype.hasOwnProperty.call(globalThis, _0xc11709),
      ]),
    ),
    _0x3a3f04 = {},
    _0x30168f = [],
    _0x1f4d05 = createElement();
  let _0x3e0f6e = 1;
  ((globalThis.document = {
    body: { classList: createClassList() },
    createElement: createElement,
    getElementById(_0x332f93) {
      return _0x332f93 === 'node-1' ? _0x1f4d05 : null;
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
      addEventListener(_0x330f9f, _0x58631f) {
        _0x3a3f04[_0x330f9f] = _0x58631f;
      },
      removeEventListener(_0x10983f, _0x165444) {
        if (_0x3a3f04[_0x10983f] === _0x165444) delete _0x3a3f04[_0x10983f];
      },
    }),
    (globalThis.requestAnimationFrame = (_0x1ce8a1) => {
      const _0x433703 = _0x3e0f6e;
      return (
        (_0x3e0f6e += 1),
        _0x30168f.push({ id: _0x433703, callback: _0x1ce8a1, cancelled: false }),
        _0x433703
      );
    }),
    (globalThis.cancelAnimationFrame = (_0x5f2c4d) => {
      const _0x227b22 = _0x30168f.find((_0xa9a84) => _0xa9a84.id === _0x5f2c4d);
      if (_0x227b22) _0x227b22.cancelled = true;
    }));
  const _0x10fbac = {
    listeners: _0x3a3f04,
    previewEl: _0x1f4d05,
    flushRaf() {
      const _0x44b264 = _0x30168f.splice(0);
      _0x44b264.forEach((_0x152905) => {
        if (!_0x152905.cancelled) _0x152905.callback(16);
      });
    },
  };
  try {
    return _0x1a29ea(_0x10fbac);
  } finally {
    Object.keys(_0x2cebf3).forEach((_0x4efe47) => {
      if (_0x19d659[_0x4efe47]) globalThis[_0x4efe47] = _0x2cebf3[_0x4efe47];
      else delete globalThis[_0x4efe47];
    });
  }
}
test('createNodeResizeHandle: honors custom minimum size', () => {
  withFakeBrowser(({ listeners: _0x3cb0f3, flushRaf: _0x36ef1b, previewEl: _0x3fffa3 }) => {
    const _0x48e930 = {
        id: 'node-1',
        width: 0x4b0,
        height: 0x2bc,
        resizeMinWidth: 0x400,
        resizeMinHeight: 0x240,
      },
      _0x3d34ed = [];
    let _0x4b9a11 = 0;
    const _0x218177 = createNodeResizeHandle(
      { nodeId: 'node-1', _data: _0x48e930 },
      {
        store: {
          updateNodeData(_0xea259d, _0x23e654) {
            (_0x3d34ed.push({ id: _0xea259d, patch: _0x23e654 }), Object.assign(_0x48e930, _0x23e654));
          },
        },
        getStateSnapshot: () => ({ viewport: { zoom: 1 }, nodes: { 'node-1': _0x48e930 } }),
        commit: () => {
          _0x4b9a11 += 1;
        },
        resolveMinSize: (_0x2662ba) => ({
          width: _0x2662ba.resizeMinWidth,
          height: _0x2662ba.resizeMinHeight,
        }),
      },
    );
    (_0x218177._listeners.pointerdown({ clientX: 0, clientY: 0, preventDefault() {}, stopPropagation() {} }),
      _0x3cb0f3.pointermove({ clientX: -0x1f4, clientY: -0x1f4 }),
      _0x36ef1b(),
      _0x3cb0f3.pointerup(),
      assert.equal(_0x3fffa3.style.width, '1024px'),
      assert.equal(_0x3fffa3.style.height, '576px'),
      assert.deepEqual(_0x3d34ed, [{ id: 'node-1', patch: { width: 0x400, height: 0x240 } }]),
      assert.equal(_0x4b9a11, 1));
  });
});
