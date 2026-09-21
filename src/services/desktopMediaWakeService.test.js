import test from 'node:test';
import assert from 'node:assert/strict';
import { __desktopMediaWakeServiceForTest, initDesktopMediaWakeService } from './desktopMediaWakeService.js';
class FakeCustomEvent {
  constructor(_0x499e81, _0x34b3c2 = {}) {
    ((this.type = _0x499e81), (this.detail = _0x34b3c2.detail));
  }
}
(test('desktop media wake: init emits wake notifications without media source resets', () => {
  const _0x5cd299 = globalThis.window,
    _0x3d8364 = globalThis.document,
    _0x209bb1 = globalThis.CustomEvent,
    _0xaa9932 = new Map(),
    _0x346311 = new Map(),
    _0x3bb8e6 = [];
  try {
    ((globalThis.CustomEvent = FakeCustomEvent),
      (globalThis.window = {
        electronAPI: {},
        addEventListener(_0x49af19, _0x5bf94e) {
          _0xaa9932.set(_0x49af19, _0x5bf94e);
        },
        dispatchEvent(_0x1308ee) {
          _0x3bb8e6.push(_0x1308ee);
        },
      }),
      (globalThis.document = {
        visibilityState: 'visible',
        addEventListener(_0x3e9447, _0x41e6a5) {
          _0x346311.set(_0x3e9447, _0x41e6a5);
        },
      }),
      initDesktopMediaWakeService(),
      assert.deepEqual([..._0xaa9932.keys()].sort(), ['focus', 'pageshow']),
      assert.deepEqual([..._0x346311.keys()], ['visibilitychange']),
      assert.equal(_0xaa9932.has('pause'), false),
      assert.equal(_0xaa9932.has('pointerover'), false),
      assert.equal(_0x346311.has('pause'), false),
      assert.equal(_0x346311.has('pointerover'), false),
      _0xaa9932.get('focus')(),
      _0xaa9932.get('pageshow')(),
      _0x346311.get('visibilitychange')(),
      assert.deepEqual(
        _0x3bb8e6.map((_0x5575da) => [_0x5575da.type, _0x5575da.detail.reason]),
        [
          ['aicanvas:desktop-media-wake', 'focus'],
          ['aicanvas:desktop-media-wake', 'pageshow'],
          ['aicanvas:desktop-media-wake', 'visibilitychange'],
        ],
      ));
  } finally {
    if (typeof _0x5cd299 === 'undefined') delete globalThis.window;
    else globalThis.window = _0x5cd299;
    if (typeof _0x3d8364 === 'undefined') delete globalThis.document;
    else globalThis.document = _0x3d8364;
    if (typeof _0x209bb1 === 'undefined') delete globalThis.CustomEvent;
    else globalThis.CustomEvent = _0x209bb1;
  }
}),
  test('desktop media wake: direct notification carries reason', () => {
    const _0x274ca1 = globalThis.window,
      _0x2fe584 = globalThis.CustomEvent,
      _0x2fae50 = [];
    try {
      ((globalThis.CustomEvent = FakeCustomEvent),
        (globalThis.window = {
          dispatchEvent(_0x2f1663) {
            _0x2fae50.push(_0x2f1663);
          },
        }),
        __desktopMediaWakeServiceForTest.dispatchRendererWake('manual'),
        assert.equal(_0x2fae50.length, 1),
        assert.equal(_0x2fae50[0].type, 'aicanvas:desktop-media-wake'),
        assert.equal(_0x2fae50[0].detail.reason, 'manual'));
    } finally {
      if (typeof _0x274ca1 === 'undefined') delete globalThis.window;
      else globalThis.window = _0x274ca1;
      if (typeof _0x2fe584 === 'undefined') delete globalThis.CustomEvent;
      else globalThis.CustomEvent = _0x2fe584;
    }
  }));
