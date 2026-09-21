import test from 'node:test';
import assert from 'node:assert/strict';
import { initMinimap } from './minimap.js';
import { calcWorldBounds } from '../core/math.js';
import { getPerfProbeSnapshot, resetPerfProbeData, setPerfProbeEnabled } from './perf/perfProbe.js';
function createStyle() {
  return {
    removeProperty(_0xc0bee9) {
      delete this[String(_0xc0bee9 || '')];
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
  const _0x2c6bfa = new Map();
  return {
    id: id,
    style: createStyle(),
    className: '',
    children: [],
    clientWidth: width,
    clientHeight: height,
    parentNode: null,
    appendChild(_0x5f5916) {
      return (this.children.push(_0x5f5916), (_0x5f5916.parentNode = this), _0x5f5916);
    },
    removeChild(_0x5e778d) {
      const _0x5e8de6 = this.children.indexOf(_0x5e778d);
      if (_0x5e8de6 >= 0) this.children.splice(_0x5e8de6, 1);
      _0x5e778d.parentNode = null;
    },
    remove() {
      this.parentNode?.removeChild?.(this);
    },
    addEventListener(_0x2728d3, _0x3e4573) {
      const _0x3a8b25 = String(_0x2728d3 || ''),
        _0x17f2bc = _0x2c6bfa.get(_0x3a8b25) || [];
      (_0x17f2bc.push(_0x3e4573), _0x2c6bfa.set(_0x3a8b25, _0x17f2bc));
    },
    dispatch(_0x21b072, _0x13bee2 = {}) {
      const _0x4249a9 = _0x2c6bfa.get(String(_0x21b072 || '')) || [];
      for (const _0x2dc48e of _0x4249a9) _0x2dc48e(_0x13bee2);
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
  viewport: _0x5a0a5d,
  mapW: _0x19fdd4,
  mapH: _0x590268,
  innerWidth: _0x4cefd6,
  innerHeight: _0x1a6830,
}) {
  const _0x226c02 = calcWorldBounds({}, _0x5a0a5d),
    _0x2a0246 = Math.max(_0x226c02.width, 0x3e8),
    _0x57bda2 = Math.max(_0x226c02.height, 0x3e8),
    _0x56c43a = Math.min(_0x19fdd4 / _0x2a0246, _0x590268 / _0x57bda2),
    _0x4cb445 = (_0x19fdd4 - _0x2a0246 * _0x56c43a) / 2,
    _0x57d54f = (_0x590268 - _0x57bda2 * _0x56c43a) / 2,
    _0xe8f994 = _0x4cefd6 / _0x5a0a5d.zoom,
    _0x14fdb8 = _0x1a6830 / _0x5a0a5d.zoom,
    _0x1eba90 = -_0x5a0a5d.x / _0x5a0a5d.zoom,
    _0x591e07 = -_0x5a0a5d.y / _0x5a0a5d.zoom;
  return {
    bounds: _0x226c02,
    scale: _0x56c43a,
    offsetX: _0x4cb445,
    offsetY: _0x57d54f,
    left: _0x4cb445 + (_0x1eba90 - _0x226c02.minX) * _0x56c43a,
    top: _0x57d54f + (_0x591e07 - _0x226c02.minY) * _0x56c43a,
    width: _0xe8f994 * _0x56c43a,
    height: _0x14fdb8 * _0x56c43a,
  };
}
function createStore(_0x39c0f1) {
  let _0x133fd4 = _0x39c0f1;
  const _0x170082 = [],
    _0x32539e = [],
    _0x58fd90 = () => {
      _0x170082.forEach((_0xf7ebe5) => {
        const _0x30b556 = _0xf7ebe5.selector(_0x133fd4);
        if (Object.is(_0xf7ebe5.lastValue, _0x30b556)) return;
        ((_0xf7ebe5.lastValue = _0x30b556), _0xf7ebe5.callback(_0x30b556));
      });
    };
  return {
    getStateRaw() {
      return _0x133fd4;
    },
    subscribeSelector(_0x24844b, _0x1864cf) {
      const _0x338793 = { selector: _0x24844b, callback: _0x1864cf, lastValue: _0x24844b(_0x133fd4) };
      return (
        _0x170082.push(_0x338793),
        () => {
          const _0x49e338 = _0x170082.indexOf(_0x338793);
          if (_0x49e338 >= 0) _0x170082.splice(_0x49e338, 1);
        }
      );
    },
    setState(_0x124710 = {}) {
      ((_0x133fd4 = { ..._0x133fd4, ..._0x124710 }), _0x58fd90());
    },
    updateViewport(_0x3e09f2, _0x113284, _0x449c0b) {
      (_0x32539e.push({ x: _0x3e09f2, y: _0x113284, zoom: _0x449c0b }),
        (_0x133fd4 = { ..._0x133fd4, viewport: { x: _0x3e09f2, y: _0x113284, zoom: _0x449c0b } }),
        _0x58fd90());
    },
    getViewportUpdates() {
      return _0x32539e.slice();
    },
  };
}
function installMinimapDomStubs() {
  const _0x22fe14 = globalThis.window,
    _0x11d1b8 = globalThis.document,
    _0x31496d = globalThis.requestAnimationFrame,
    _0x17f972 = globalThis.cancelAnimationFrame,
    _0x5d12e1 = createFakeElement({ id: 'minimap', width: 200, height: 140, left: 10, top: 20 }),
    _0x26e074 = createFakeElement({ id: 'minimapViewport' }),
    _0x3d61f8 = createFakeElement({ id: 'minimapWrapper' }),
    _0x6766be = createFakeElement({ id: 'v2-wrap' }),
    _0x5c46d8 = new Map([
      ['minimapViewport', _0x26e074],
      ['minimapWrapper', _0x3d61f8],
      ['v2-wrap', _0x6766be],
    ]);
  return (
    (globalThis.window = { innerWidth: 0x4b0, innerHeight: 0x320, _v2MinimapScale: 0 }),
    (globalThis.document = {
      createElement() {
        return createFakeElement();
      },
      getElementById(_0x26eeea) {
        return _0x5c46d8.get(String(_0x26eeea || '')) || null;
      },
    }),
    (globalThis.requestAnimationFrame = (_0x595523) => {
      return (_0x595523(), 1);
    }),
    (globalThis.cancelAnimationFrame = () => {}),
    {
      minimap: _0x5d12e1,
      minimapViewport: _0x26e074,
      minimapWrapper: _0x3d61f8,
      restore() {
        if (typeof _0x22fe14 === 'undefined') delete globalThis.window;
        else globalThis.window = _0x22fe14;
        if (typeof _0x11d1b8 === 'undefined') delete globalThis.document;
        else globalThis.document = _0x11d1b8;
        (typeof _0x31496d === 'undefined'
          ? delete globalThis.requestAnimationFrame
          : (globalThis.requestAnimationFrame = _0x31496d),
          typeof _0x17f972 === 'undefined'
            ? delete globalThis.cancelAnimationFrame
            : (globalThis.cancelAnimationFrame = _0x17f972));
      },
    }
  );
}
(test('minimap: 空画布平移会刷新 viewport 框投影', () => {
  const _0x36720f = installMinimapDomStubs(),
    _0x159f21 = createStore({ nodes: {}, viewport: { x: 0, y: 0, zoom: 1 }, _persistRev: 0, _nodeCount: 0 });
  let _0xe93ffc = null;
  try {
    _0xe93ffc = initMinimap(_0x36720f.minimap, _0x159f21);
    const _0x1045a5 = computeExpectedViewportBox({
      viewport: _0x159f21.getStateRaw().viewport,
      mapW: _0x36720f.minimap.clientWidth,
      mapH: _0x36720f.minimap.clientHeight,
      innerWidth: globalThis.window.innerWidth,
      innerHeight: globalThis.window.innerHeight,
    });
    (assert.equal(_0x36720f.minimapViewport.style.left, _0x1045a5.left + 'px'),
      assert.equal(_0x36720f.minimapViewport.style.top, _0x1045a5.top + 'px'),
      _0x159f21.setState({ viewport: { x: 240, y: -120, zoom: 1 } }));
    const _0x1a1852 = computeExpectedViewportBox({
      viewport: _0x159f21.getStateRaw().viewport,
      mapW: _0x36720f.minimap.clientWidth,
      mapH: _0x36720f.minimap.clientHeight,
      innerWidth: globalThis.window.innerWidth,
      innerHeight: globalThis.window.innerHeight,
    });
    (assert.equal(_0x36720f.minimapViewport.style.left, _0x1a1852.left + 'px'),
      assert.equal(_0x36720f.minimapViewport.style.top, _0x1a1852.top + 'px'));
  } finally {
    (_0xe93ffc?.(), _0x36720f.restore());
  }
}),
  test('minimap: canvas pan preview throttles viewport box updates', () => {
    const _0x2b984e = globalThis.setTimeout,
      _0x282c09 = globalThis.clearTimeout,
      _0x543e4e = Object.prototype.hasOwnProperty.call(globalThis, 'performance'),
      _0x3bbba2 = globalThis.performance,
      _0x16b4c5 = [];
    let _0x3292e2 = 0x3e8;
    ((globalThis.setTimeout = (_0x295438, _0x5743e2) => {
      const _0x2ebacf = { callback: _0x295438, delay: _0x5743e2, cancelled: false };
      return (_0x16b4c5.push(_0x2ebacf), _0x2ebacf);
    }),
      (globalThis.clearTimeout = (_0xaf5ff7) => {
        if (_0xaf5ff7) _0xaf5ff7.cancelled = true;
      }),
      Object.defineProperty(globalThis, 'performance', {
        configurable: true,
        value: { now: () => _0x3292e2 },
      }));
    const _0x2e888b = installMinimapDomStubs(),
      _0x22a7eb = createStore({
        nodes: {},
        viewport: { x: 0, y: 0, zoom: 1 },
        _persistRev: 0,
        _nodeCount: 0,
      });
    let _0x14685e = null;
    try {
      _0x14685e = initMinimap(_0x2e888b.minimap, _0x22a7eb);
      const _0x1e29b8 = { x: 120, y: -60, zoom: 1 };
      globalThis.window._v2ScheduleMinimapViewportPreview(_0x1e29b8, { force: true });
      const _0x4c037b = _0x2e888b.minimapViewport.style.left,
        _0x223283 = _0x2e888b.minimapViewport.style.top;
      _0x3292e2 = 0x3fc;
      const _0x46d236 = { x: 0x104, y: -90, zoom: 1 };
      (globalThis.window._v2ScheduleMinimapViewportPreview(_0x46d236),
        assert.equal(_0x2e888b.minimapViewport.style.left, _0x4c037b),
        assert.equal(_0x2e888b.minimapViewport.style.top, _0x223283),
        assert.equal(_0x16b4c5.length, 1),
        assert.ok(_0x16b4c5[0].delay > 0),
        assert.ok(_0x16b4c5[0].delay <= 96),
        (_0x3292e2 = 0x44c),
        _0x16b4c5[0].callback());
      const _0x37dd5e = computeExpectedViewportBox({
        viewport: _0x46d236,
        mapW: _0x2e888b.minimap.clientWidth,
        mapH: _0x2e888b.minimap.clientHeight,
        innerWidth: globalThis.window.innerWidth,
        innerHeight: globalThis.window.innerHeight,
      });
      (assert.equal(_0x2e888b.minimapViewport.style.left, _0x37dd5e.left + 'px'),
        assert.equal(_0x2e888b.minimapViewport.style.top, _0x37dd5e.top + 'px'),
        assert.deepEqual(_0x22a7eb.getViewportUpdates(), []));
    } finally {
      (_0x14685e?.(),
        _0x2e888b.restore(),
        (globalThis.setTimeout = _0x2b984e),
        (globalThis.clearTimeout = _0x282c09),
        _0x543e4e
          ? Object.defineProperty(globalThis, 'performance', { configurable: true, value: _0x3bbba2 })
          : delete globalThis.performance);
    }
  }),
  test('minimap: viewport-only store updates do not refresh node dots', () => {
    const _0xa2cf49 = installMinimapDomStubs(),
      _0x52ecb3 = [];
    let _0x13843c = 1;
    ((globalThis.requestAnimationFrame = (_0x17e1fe) => {
      const _0x574eba = _0x13843c;
      return ((_0x13843c += 1), _0x52ecb3.push({ id: _0x574eba, callback: _0x17e1fe }), _0x574eba);
    }),
      (globalThis.cancelAnimationFrame = (_0x8c313) => {
        const _0x369123 = _0x52ecb3.findIndex((_0x350e59) => _0x350e59.id === _0x8c313);
        if (_0x369123 >= 0) _0x52ecb3.splice(_0x369123, 1);
      }));
    const _0x4bd9ae = () => {
        const _0x2f8865 = _0x52ecb3.splice(0);
        _0x2f8865.forEach((_0x4bc313) => _0x4bc313.callback?.());
      },
      _0x3b2074 = createStore({
        nodes: { node_a: { id: 'node_a', type: 'source-image', x: 100, y: 120, width: 240, height: 160 } },
        viewport: { x: 0, y: 0, zoom: 1 },
        _persistRev: 1,
        _nodeCount: 1,
      });
    let _0x4c3b93 = null;
    try {
      (setPerfProbeEnabled(true),
        (_0x4c3b93 = initMinimap(_0xa2cf49.minimap, _0x3b2074)),
        _0x4bd9ae(),
        resetPerfProbeData());
      let _0x49609b = 0;
      (Object.defineProperty(_0xa2cf49.minimap, 'clientWidth', {
        configurable: true,
        get() {
          return ((_0x49609b += 1), 200);
        },
      }),
        Object.defineProperty(_0xa2cf49.minimap, 'clientHeight', {
          configurable: true,
          get() {
            return ((_0x49609b += 1), 140);
          },
        }),
        _0x3b2074.setState({ viewport: { x: 80, y: -40, zoom: 1.2 } }),
        _0x4bd9ae());
      const _0x41bcb2 = getPerfProbeSnapshot().minimapUpdateSamples;
      (assert.equal(_0x41bcb2.length, 1),
        assert.equal(_0x41bcb2[0].mode, 'viewport'),
        assert.equal(_0x41bcb2[0].viewportOnly, true),
        assert.equal(_0x41bcb2[0].updatedCount, 0),
        assert.equal(_0x49609b, 0));
    } finally {
      (_0x4c3b93?.(), resetPerfProbeData(), setPerfProbeEnabled(false), _0xa2cf49.restore());
    }
  }),
  test('minimap: persist-only updates reuse node dot layout', () => {
    const _0x3c2679 = installMinimapDomStubs(),
      _0x57f22e = [];
    let _0x47d93e = 1;
    ((globalThis.requestAnimationFrame = (_0x36b396) => {
      const _0x58b209 = _0x47d93e;
      return ((_0x47d93e += 1), _0x57f22e.push({ id: _0x58b209, callback: _0x36b396 }), _0x58b209);
    }),
      (globalThis.cancelAnimationFrame = (_0x5041ab) => {
        const _0xa7f92 = _0x57f22e.findIndex((_0x1da15e) => _0x1da15e.id === _0x5041ab);
        if (_0xa7f92 >= 0) _0x57f22e.splice(_0xa7f92, 1);
      }));
    const _0x1b8c85 = () => {
        const _0x40426f = _0x57f22e.splice(0);
        _0x40426f.forEach((_0x1c95b5) => _0x1c95b5.callback?.());
      },
      _0x10cebb = createStore({
        nodes: { node_a: { id: 'node_a', type: 'source-video', x: 100, y: 120, width: 240, height: 160 } },
        viewport: { x: 0, y: 0, zoom: 1 },
        _persistRev: 1,
        _nodeCount: 1,
      });
    let _0x1bd1d9 = null;
    try {
      (setPerfProbeEnabled(true),
        (_0x1bd1d9 = initMinimap(_0x3c2679.minimap, _0x10cebb)),
        _0x1b8c85(),
        resetPerfProbeData(),
        _0x10cebb.setState({ _persistRev: 2, viewport: { x: 0, y: 0, zoom: 1 } }),
        _0x1b8c85());
      const _0x22d527 = getPerfProbeSnapshot().minimapUpdateSamples;
      (assert.equal(_0x22d527.length, 1),
        assert.equal(_0x22d527[0].mode, 'viewport'),
        assert.equal(_0x22d527[0].viewportOnly, true),
        assert.equal(_0x22d527[0].updatedCount, 0));
    } finally {
      (_0x1bd1d9?.(), resetPerfProbeData(), setPerfProbeEnabled(false), _0x3c2679.restore());
    }
  }),
  test('minimap: 空画布平移后点击小地图使用最新 bounds', () => {
    const _0x347767 = installMinimapDomStubs(),
      _0xd4c7ad = createStore({
        nodes: {},
        viewport: { x: 180, y: -60, zoom: 1.25 },
        _persistRev: 0,
        _nodeCount: 0,
      });
    let _0x356758 = null;
    try {
      _0x356758 = initMinimap(_0x347767.minimap, _0xd4c7ad);
      const _0x2e2088 = { clientX: 128, clientY: 104, pointerId: 7, stopPropagation() {} };
      _0x347767.minimapWrapper.dispatch('pointerdown', _0x2e2088);
      const _0x50f160 = computeExpectedViewportBox({
          viewport: { x: 180, y: -60, zoom: 1.25 },
          mapW: _0x347767.minimap.clientWidth,
          mapH: _0x347767.minimap.clientHeight,
          innerWidth: globalThis.window.innerWidth,
          innerHeight: globalThis.window.innerHeight,
        }),
        _0x33308c = _0x347767.minimap.getBoundingClientRect(),
        _0x90bba0 = _0x2e2088.clientX - _0x33308c.left - _0x50f160.offsetX,
        _0x2824e2 = _0x2e2088.clientY - _0x33308c.top - _0x50f160.offsetY,
        _0x2ce0f2 = _0x50f160.bounds.minX + _0x90bba0 / _0x50f160.scale,
        _0x537f30 = _0x50f160.bounds.minY + _0x2824e2 / _0x50f160.scale,
        _0x5516d2 = {
          x: globalThis.window.innerWidth / 2 - _0x2ce0f2 * 1.25,
          y: globalThis.window.innerHeight / 2 - _0x537f30 * 1.25,
          zoom: 1.25,
        },
        [_0x43d313] = _0xd4c7ad.getViewportUpdates();
      assert.deepEqual(_0x43d313, _0x5516d2);
    } finally {
      (_0x356758?.(), _0x347767.restore());
    }
  }));
