import test from 'node:test';
import assert from 'node:assert/strict';
import { bindApimartPrivateAvatarAction } from './apimartPrivateAvatarAction.js';
import { APIMART_PRIVATE_AVATAR_ASSET_KEY } from '../../modules/apimartPrivateAvatarAssets.js';
function createClassList() {
  const _0x40dd4f = new Set();
  return {
    add(_0x564788) {
      _0x40dd4f.add(_0x564788);
    },
    remove(_0xabb51f) {
      _0x40dd4f.delete(_0xabb51f);
    },
    toggle(_0xd0d96c, _0xbff5e1) {
      if (_0xbff5e1) _0x40dd4f.add(_0xd0d96c);
      else _0x40dd4f.delete(_0xd0d96c);
    },
    contains(_0x42e882) {
      return _0x40dd4f.has(_0x42e882);
    },
  };
}
function createButtonStub() {
  let _0x445bc9 = null;
  const _0x2f054d = createClassList(),
    _0x55157c = {
      dataset: {},
      disabled: false,
      attrs: {},
      classList: createClassList(),
      addEventListener(_0x1eee0e, _0x59ae4c) {
        if (_0x1eee0e === 'click') _0x445bc9 = _0x59ae4c;
      },
      querySelector(_0x16804b) {
        if (_0x16804b === 'svg') return { classList: _0x2f054d };
        return null;
      },
      setAttribute(_0x35d717, _0x5bb13f) {
        this.attrs[_0x35d717] = _0x5bb13f;
      },
      click() {
        return _0x445bc9?.({ preventDefault() {}, stopPropagation() {} });
      },
    };
  return { button: _0x55157c, svgClassList: _0x2f054d };
}
function createToolbar(_0x28ab1d) {
  return {
    querySelector(_0x111434) {
      return _0x111434 === '.act-apimart-face-detect' ? _0x28ab1d : null;
    },
  };
}
function withWindow(_0x1cb299) {
  const _0x2dad42 = global.window;
  return (
    (global.window = { showToast() {} }),
    Promise.resolve()
      .then(_0x1cb299)
      .finally(() => {
        global.window = _0x2dad42;
      })
  );
}
(test('apimart private avatar action: processing state spins toolbar icon', () => {
  const { button: _0x294ef9, svgClassList: _0x55d5d0 } = createButtonStub();
  (bindApimartPrivateAvatarAction({
    nodeId: 'node-1',
    toolbarEl: createToolbar(_0x294ef9),
    getStateSnapshot() {
      return {
        nodes: {
          'node-1': { providerAssetRefs: { [APIMART_PRIVATE_AVATAR_ASSET_KEY]: { status: 'processing' } } },
        },
      };
    },
    store: {
      subscribeSelector() {
        return () => {};
      },
    },
  }),
    assert.equal(_0x294ef9.dataset.loading, 'true'),
    assert.equal(_0x294ef9.disabled, true),
    assert.equal(_0x294ef9.attrs['aria-busy'], 'true'),
    assert.equal(_0x55d5d0.contains('v2-spinning'), true));
}),
  test('apimart private avatar action: click shows spinner until failure result', async () => {
    await withWindow(async () => {
      const { button: _0x271697, svgClassList: _0x1f4775 } = createButtonStub(),
        _0x28ddcf = { id: 'node-1', imageUrl: '/output/face.png' },
        _0x312451 = [];
      let _0x4dd252;
      const _0x5b4699 = new Promise((_0x293c38) => {
          _0x4dd252 = _0x293c38;
        }),
        _0x17369c = bindApimartPrivateAvatarAction({
          nodeId: 'node-1',
          mediaKind: 'image',
          toolbarEl: createToolbar(_0x271697),
          getStateSnapshot() {
            return { nodes: { 'node-1': _0x28ddcf } };
          },
          store: {
            updateNodeData(_0x4bdc3a, _0x49329f) {
              (_0x312451.push({ id: _0x4bdc3a, patch: _0x49329f }), Object.assign(_0x28ddcf, _0x49329f));
            },
            subscribeSelector() {
              return () => {};
            },
          },
          ensureConfig() {
            return _0x5b4699;
          },
          getProviderConfig() {
            return {};
          },
        });
      assert.equal(_0x17369c, undefined);
      const _0x111eea = _0x271697.click();
      (assert.equal(
        _0x312451.at(-1).patch.providerAssetRefs[APIMART_PRIVATE_AVATAR_ASSET_KEY].status,
        'processing',
      ),
        assert.equal(_0x271697.dataset.loading, 'true'),
        assert.equal(_0x1f4775.contains('v2-spinning'), true),
        _0x4dd252(),
        await _0x111eea,
        assert.equal(
          _0x312451.at(-1).patch.providerAssetRefs[APIMART_PRIVATE_AVATAR_ASSET_KEY].status,
          'failed',
        ),
        assert.equal(_0x271697.dataset.loading, 'false'),
        assert.equal(_0x1f4775.contains('v2-spinning'), false));
    });
  }));
