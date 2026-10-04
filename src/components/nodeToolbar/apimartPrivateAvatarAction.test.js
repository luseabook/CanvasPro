import test from 'node:test';
import assert from 'node:assert/strict';
import { bindApimartPrivateAvatarAction } from './apimartPrivateAvatarAction.js';
import { APIMART_PRIVATE_AVATAR_ASSET_KEY } from '../../modules/apimartPrivateAvatarAssets.js';
function createClassList() {
  const map = new Set();
  return {
    add(value) {
      map.add(value);
    },
    remove(item) {
      map.delete(item);
    },
    toggle(key, index) {
      if (index) map.add(key);
      else map.delete(key);
    },
    contains(result) {
      return map.has(result);
    },
  };
}
function createButtonStub() {
  let data = null;
  const classList = createClassList(),
    button = {
      dataset: {},
      disabled: false,
      attrs: {},
      classList: createClassList(),
      addEventListener(options, target) {
        if (options === 'click') data = target;
      },
      querySelector(source) {
        if (source === 'svg') return { classList: classList };
        return null;
      },
      setAttribute(next, current) {
        this.attrs[next] = current;
      },
      click() {
        return data?.({ preventDefault() {}, stopPropagation() {} });
      },
    };
  return { button: button, svgClassList: classList };
}
function createToolbar(entry) {
  return {
    querySelector(record) {
      return record === '.act-apimart-face-detect' ? entry : null;
    },
  };
}
function withWindow(payload) {
  const handle = global.window;
  return (
    (global.window = { showToast() {} }),
    Promise.resolve()
      .then(payload)
      .finally(() => {
        global.window = handle;
      })
  );
}
(test('apimart private avatar action: processing state spins toolbar icon', () => {
  const { button: button2, svgClassList: svgClassList } = createButtonStub();
  (bindApimartPrivateAvatarAction({
    nodeId: 'node-1',
    toolbarEl: createToolbar(button2),
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
    assert.equal(button2.dataset.loading, 'true'),
    assert.equal(button2.disabled, true),
    assert.equal(button2.attrs['aria-busy'], 'true'),
    assert.equal(svgClassList.contains('v2-spinning'), true));
}),
  test('apimart private avatar action: click shows spinner until failure result', async () => {
    await withWindow(async () => {
      const { button: button3, svgClassList: svgClassList2 } = createButtonStub(),
        state = { id: 'node-1', imageUrl: '/output/face.png' },
        list = [];
      let run;
      const config = new Promise((scope) => {
          run = scope;
        }),
        bindApimartPrivateAvatarAction2 = bindApimartPrivateAvatarAction({
          nodeId: 'node-1',
          mediaKind: 'image',
          toolbarEl: createToolbar(button3),
          getStateSnapshot() {
            return { nodes: { 'node-1': state } };
          },
          store: {
            updateNodeData(id, patch) {
              (list.push({ id: id, patch: patch }), Object.assign(state, patch));
            },
            subscribeSelector() {
              return () => {};
            },
          },
          ensureConfig() {
            return config;
          },
          getProviderConfig() {
            return {};
          },
        });
      assert.equal(bindApimartPrivateAvatarAction2, undefined);
      const input = button3.click();
      (assert.equal(
        list.at(-1).patch.providerAssetRefs[APIMART_PRIVATE_AVATAR_ASSET_KEY].status,
        'processing',
      ),
        assert.equal(button3.dataset.loading, 'true'),
        assert.equal(svgClassList2.contains('v2-spinning'), true),
        run(),
        await input,
        assert.equal(list.at(-1).patch.providerAssetRefs[APIMART_PRIVATE_AVATAR_ASSET_KEY].status, 'failed'),
        assert.equal(button3.dataset.loading, 'false'),
        assert.equal(svgClassList2.contains('v2-spinning'), false));
    });
  }));
