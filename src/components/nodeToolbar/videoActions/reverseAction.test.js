import test from 'node:test';
import assert from 'node:assert/strict';
import { bindVideoReverseAction } from './reverseAction.js';
function createClassList() {
  const _0x1cc0ca = new Set();
  return {
    toggle(_0x2e46e2, _0x3e4887) {
      if (_0x3e4887) _0x1cc0ca.add(_0x2e46e2);
      else _0x1cc0ca.delete(_0x2e46e2);
    },
    contains(_0x4cab69) {
      return _0x1cc0ca.has(_0x4cab69);
    },
  };
}
function createButtonStub() {
  let _0x5ad505 = null;
  const _0x385e49 = createClassList(),
    _0x355592 = {
      dataset: { tooltip: 'Video reverse' },
      disabled: false,
      attrs: {},
      addEventListener(_0x2d6b93, _0x539761) {
        if (_0x2d6b93 === 'click') _0x5ad505 = _0x539761;
      },
      querySelector(_0x3a6b0f) {
        if (_0x3a6b0f === 'svg') return { classList: _0x385e49 };
        return null;
      },
      setAttribute(_0x265463, _0x98f45d) {
        this.attrs[_0x265463] = _0x98f45d;
        if (_0x265463 === 'data-tooltip') this.dataset.tooltip = _0x98f45d;
      },
      getAttribute(_0x5410ef) {
        if (_0x5410ef === 'data-tooltip') return this.dataset.tooltip || null;
        return this.attrs[_0x5410ef] ?? null;
      },
      removeAttribute(_0x5a6a85) {
        delete this.attrs[_0x5a6a85];
        if (_0x5a6a85 === 'data-tooltip') delete this.dataset.tooltip;
      },
      click() {
        return _0x5ad505?.({ stopPropagation() {} });
      },
    };
  return { button: _0x355592, svgClassList: _0x385e49 };
}
function createToolbar(_0x42754c) {
  return {
    querySelector(_0x2c25f8) {
      return _0x2c25f8 === '.act-reverse' ? _0x42754c : null;
    },
  };
}
function createDeferred() {
  let _0x5a0bad, _0xe748c3;
  const _0x5601a6 = new Promise((_0x11ecd8, _0x3eec13) => {
    ((_0x5a0bad = _0x11ecd8), (_0xe748c3 = _0x3eec13));
  });
  return { promise: _0x5601a6, resolve: _0x5a0bad, reject: _0xe748c3 };
}
function withWindow(_0x58e7b8) {
  const _0x5055fc = global.window,
    _0x36cc86 = [];
  return (
    (global.window = {
      showToast(_0x4e77c1, _0x43ccaf) {
        _0x36cc86.push({ message: _0x4e77c1, type: _0x43ccaf });
      },
    }),
    Promise.resolve()
      .then(() => _0x58e7b8(_0x36cc86))
      .finally(() => {
        global.window = _0x5055fc;
      })
  );
}
function bindReverseForTest({
  button: _0x4b3219,
  state: state = { videoClip: { active: false }, videoKeying: { active: false } },
  runVideoReverseFromNode: runVideoReverseFromNode = async () => null,
  exits: exits = [],
} = {}) {
  bindVideoReverseAction({
    toolbarEl: createToolbar(_0x4b3219),
    nodeData: { id: 'video-1' },
    getStateSnapshot() {
      return state;
    },
    VideoClipController: {
      exit(_0x38adfd) {
        exits.push({ controller: 'clip', args: _0x38adfd });
      },
    },
    VideoKeyingController: {
      exit(_0x474a1b) {
        exits.push({ controller: 'keying', args: _0x474a1b });
      },
    },
    runVideoReverseFromNode: runVideoReverseFromNode,
  });
}
(test('video reverse action: spins toolbar icon until runner settles', async () => {
  await withWindow(async () => {
    const { button: _0x44408c, svgClassList: _0x5df044 } = createButtonStub(),
      _0x241e39 = createDeferred();
    let _0x5003d4 = 0;
    bindReverseForTest({
      button: _0x44408c,
      runVideoReverseFromNode(_0x455c1a) {
        return ((_0x5003d4 += 1), assert.equal(_0x455c1a, 'video-1'), _0x241e39.promise);
      },
    });
    const _0x154492 = _0x44408c.click();
    (assert.equal(_0x5003d4, 1),
      assert.equal(_0x44408c.dataset.loading, 'true'),
      assert.equal(_0x44408c.disabled, true),
      assert.equal(_0x44408c.attrs['aria-busy'], 'true'),
      assert.equal(_0x44408c.dataset.tooltip, 'Video reverse中...'),
      assert.equal(_0x5df044.contains('v2-spinning'), true),
      await _0x44408c.click(),
      assert.equal(_0x5003d4, 1),
      _0x241e39.resolve(null),
      await _0x154492,
      assert.equal(_0x44408c.dataset.loading, 'false'),
      assert.equal(_0x44408c.disabled, false),
      assert.equal(_0x44408c.getAttribute('aria-busy'), null),
      assert.equal(_0x44408c.dataset.tooltip, 'Video reverse'),
      assert.equal(_0x5df044.contains('v2-spinning'), false));
  });
}),
  test('video reverse action: restores toolbar icon when runner rejects', async () => {
    await withWindow(async (_0x14c3c0) => {
      const { button: _0x269c10, svgClassList: _0x3b058d } = createButtonStub();
      (bindReverseForTest({
        button: _0x269c10,
        async runVideoReverseFromNode() {
          throw new Error('boom');
        },
      }),
        await _0x269c10.click(),
        assert.equal(_0x269c10.dataset.loading, 'false'),
        assert.equal(_0x269c10.disabled, false),
        assert.equal(_0x269c10.getAttribute('aria-busy'), null),
        assert.equal(_0x3b058d.contains('v2-spinning'), false),
        assert.deepEqual(_0x14c3c0.at(-1), { message: '视频倒放失败: boom', type: 'error' }));
    });
  }),
  test('video reverse action: does not spin or run while clip mode is active', async () => {
    await withWindow(async (_0x56a7d5) => {
      const { button: _0x3be043, svgClassList: _0x12fe74 } = createButtonStub(),
        _0x91aa5 = [];
      let _0xaeaaf5 = 0;
      (bindReverseForTest({
        button: _0x3be043,
        exits: _0x91aa5,
        state: { videoClip: { active: true }, videoKeying: { active: false } },
        async runVideoReverseFromNode() {
          _0xaeaaf5 += 1;
        },
      }),
        await _0x3be043.click(),
        assert.equal(_0xaeaaf5, 0),
        assert.deepEqual(_0x91aa5, []),
        assert.notEqual(_0x3be043.dataset.loading, 'true'),
        assert.equal(_0x3be043.disabled, false),
        assert.equal(_0x12fe74.contains('v2-spinning'), false),
        assert.deepEqual(_0x56a7d5.at(-1), { message: '请先退出裁剪视频模式', type: 'info' }));
    });
  }),
  test('video reverse action: does not spin or run while keying mode is active', async () => {
    await withWindow(async (_0x45f743) => {
      const { button: _0x68e89d, svgClassList: _0x314baf } = createButtonStub(),
        _0x11a153 = [];
      let _0x2173f8 = 0;
      (bindReverseForTest({
        button: _0x68e89d,
        exits: _0x11a153,
        state: { videoClip: { active: false }, videoKeying: { active: true } },
        async runVideoReverseFromNode() {
          _0x2173f8 += 1;
        },
      }),
        await _0x68e89d.click(),
        assert.equal(_0x2173f8, 0),
        assert.deepEqual(_0x11a153, []),
        assert.notEqual(_0x68e89d.dataset.loading, 'true'),
        assert.equal(_0x68e89d.disabled, false),
        assert.equal(_0x314baf.contains('v2-spinning'), false),
        assert.deepEqual(_0x45f743.at(-1), { message: '请先退出当前视频编辑模式', type: 'info' }));
    });
  }));
