import test from 'node:test';
import assert from 'node:assert/strict';
import { createZoomController } from './ZoomController.js';
function createClassList() {
  const _0x4a17f3 = new Set();
  return {
    add(..._0x4e459d) {
      _0x4e459d.forEach((_0x1dc6e7) => _0x4a17f3.add(String(_0x1dc6e7)));
    },
    remove(..._0x454b84) {
      _0x454b84.forEach((_0x4bf0b0) => _0x4a17f3.delete(String(_0x4bf0b0)));
    },
    toggle(_0x1198fa, _0x251809) {
      const _0x5953c7 = String(_0x1198fa),
        _0x43d6da = _0x251809 === undefined ? !_0x4a17f3.has(_0x5953c7) : !!_0x251809;
      if (_0x43d6da) _0x4a17f3.add(_0x5953c7);
      else _0x4a17f3.delete(_0x5953c7);
      return _0x43d6da;
    },
    contains(_0x487737) {
      return _0x4a17f3.has(String(_0x487737));
    },
  };
}
function withFakeBrowser(_0x421eb1) {
  const _0x23e9b3 = Object.prototype.hasOwnProperty.call(globalThis, 'window'),
    _0x35f240 = Object.prototype.hasOwnProperty.call(globalThis, 'document'),
    _0x536b33 = Object.prototype.hasOwnProperty.call(globalThis, 'requestAnimationFrame'),
    _0x146289 = Object.prototype.hasOwnProperty.call(globalThis, 'cancelAnimationFrame'),
    _0x297e22 = Object.prototype.hasOwnProperty.call(globalThis, 'setTimeout'),
    _0x5af58e = Object.prototype.hasOwnProperty.call(globalThis, 'clearTimeout'),
    _0x185138 = globalThis.window,
    _0x30c650 = globalThis.document,
    _0x268802 = globalThis.requestAnimationFrame,
    _0x4e37c8 = globalThis.cancelAnimationFrame,
    _0x33fcdd = globalThis.setTimeout,
    _0x225f3b = globalThis.clearTimeout,
    _0x57b726 = createClassList(),
    _0x2e6148 = [],
    _0x4e327c = [],
    _0x3a1191 = [];
  let _0x1d7540 = 0,
    _0x30d837 = 1,
    _0x466001 = 1;
  ((globalThis.document = { body: { classList: _0x57b726 } }),
    (globalThis.window = {
      _lastMx: 150,
      _lastMy: 160,
      __perfProbeEnabled: false,
      location: { href: 'http://127.0.0.1/' },
      document: { querySelectorAll: () => [] },
      performance: { getEntriesByType: () => [] },
      _v2UpdateSidePlusNow(_0x1f932a, _0x2e155f) {
        _0x2e6148.push({ x: _0x1f932a, y: _0x2e155f });
      },
    }),
    (globalThis.requestAnimationFrame = (_0x446f91) => {
      const _0x3c5d54 = _0x30d837;
      return (
        (_0x30d837 += 1),
        _0x4e327c.push({ id: _0x3c5d54, callback: _0x446f91, cancelled: false }),
        _0x3c5d54
      );
    }),
    (globalThis.cancelAnimationFrame = (_0x1d0264) => {
      const _0x4b8a4d = _0x4e327c.find((_0x369a6c) => _0x369a6c.id === _0x1d0264);
      if (_0x4b8a4d) _0x4b8a4d.cancelled = true;
    }),
    (globalThis.setTimeout = (_0x519e7f, _0x2ff352) => {
      const _0x3b34b5 = _0x466001;
      return (
        (_0x466001 += 1),
        _0x3a1191.push({ id: _0x3b34b5, callback: _0x519e7f, ms: _0x2ff352, cancelled: false }),
        _0x3b34b5
      );
    }),
    (globalThis.clearTimeout = (_0x596768) => {
      const _0x81369a = _0x3a1191.find((_0x3ad5a8) => _0x3ad5a8.id === _0x596768);
      if (_0x81369a) _0x81369a.cancelled = true;
    }));
  const _0x2e37a2 = {
    classList: _0x57b726,
    plusCalls: _0x2e6148,
    flushRaf() {
      const _0x14fde4 = _0x4e327c.splice(0);
      for (const _0xaae74f of _0x14fde4) {
        if (_0xaae74f.cancelled) continue;
        ((_0x1d7540 += 16), _0xaae74f.callback(_0x1d7540));
      }
    },
    runTimers() {
      const _0x5b93ce = _0x3a1191.splice(0);
      for (const _0x15ae90 of _0x5b93ce) {
        if (!_0x15ae90.cancelled) _0x15ae90.callback();
      }
    },
  };
  try {
    return _0x421eb1(_0x2e37a2);
  } finally {
    if (_0x23e9b3) globalThis.window = _0x185138;
    else delete globalThis.window;
    if (_0x35f240) globalThis.document = _0x30c650;
    else delete globalThis.document;
    if (_0x536b33) globalThis.requestAnimationFrame = _0x268802;
    else delete globalThis.requestAnimationFrame;
    if (_0x146289) globalThis.cancelAnimationFrame = _0x4e37c8;
    else delete globalThis.cancelAnimationFrame;
    if (_0x297e22) globalThis.setTimeout = _0x33fcdd;
    else delete globalThis.setTimeout;
    if (_0x5af58e) globalThis.clearTimeout = _0x225f3b;
    else delete globalThis.clearTimeout;
  }
}
function createStore(_0x2bc198 = { x: 0, y: 0, zoom: 1 }) {
  const _0x4456e9 = { viewport: { ..._0x2bc198 }, edges: {} },
    _0x13477a = [],
    _0x244413 = [];
  return {
    state: _0x4456e9,
    updates: _0x13477a,
    order: _0x244413,
    persistCount: 0,
    store: {
      getStateRaw() {
        return _0x4456e9;
      },
      updateViewport(_0x541e7e, _0x3a05e4, _0x45041c) {
        (_0x13477a.push({ x: _0x541e7e, y: _0x3a05e4, zoom: _0x45041c }),
          _0x244413.push('update'),
          (_0x4456e9.viewport = { x: _0x541e7e, y: _0x3a05e4, zoom: _0x45041c }));
      },
      markViewportPersist() {
        (_0x244413.push('persist'), (this.persistCount += 1));
      },
    },
  };
}
(test('ZoomController batches wheel viewport updates into one frame', () => {
  withFakeBrowser(
    ({ classList: _0x4ca5ec, plusCalls: _0x560b07, flushRaf: _0x194e29, runTimers: _0x33489c }) => {
      const _0x26ec81 = createStore(),
        _0x15b268 = createZoomController({ store: _0x26ec81.store });
      (_0x15b268.handleWheel(100, 100, -1),
        _0x15b268.handleWheel(100, 100, -1),
        assert.equal(_0x26ec81.updates.length, 0),
        assert.equal(_0x4ca5ec.contains('is-zooming'), true),
        _0x194e29(),
        assert.equal(_0x26ec81.updates.length, 1),
        assert.equal(Math.round(_0x26ec81.updates[0].zoom * 100), 121),
        assert.equal(Math.round(_0x26ec81.updates[0].x), -21),
        assert.equal(Math.round(_0x26ec81.updates[0].y), -21),
        assert.deepEqual(_0x560b07, [{ x: 150, y: 160 }]),
        _0x33489c(),
        assert.equal(_0x4ca5ec.contains('is-zooming'), false),
        assert.deepEqual(_0x26ec81.order, ['update', 'persist']));
    },
  );
}),
  test('ZoomController flushes pending viewport before zoom-end persist', () => {
    withFakeBrowser(({ classList: _0x6f040d, flushRaf: _0x1e01da, runTimers: _0x481a6d }) => {
      const _0x102f9a = createStore(),
        _0x5841e6 = createZoomController({ store: _0x102f9a.store });
      (_0x5841e6.handleWheel(100, 100, -1),
        _0x481a6d(),
        assert.equal(_0x102f9a.updates.length, 1),
        assert.deepEqual(_0x102f9a.order, ['update', 'persist']),
        assert.equal(_0x6f040d.contains('is-zooming'), false),
        _0x1e01da(),
        assert.equal(_0x102f9a.updates.length, 1));
    });
  }));
