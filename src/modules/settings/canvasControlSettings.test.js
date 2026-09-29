import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CANVAS_WHEEL_BEHAVIOR_PAN,
  CANVAS_WHEEL_BEHAVIOR_STORAGE_KEY,
  CANVAS_WHEEL_BEHAVIOR_ZOOM,
  initCanvasControlSettings,
  normalizeCanvasWheelBehavior,
  readCanvasWheelBehavior,
  setCanvasWheelBehavior,
} from './canvasControlSettings.js';

function withRuntime(run) {
  const store = new Map();
  const storage = {
    gets: 0,
    sets: [],
    getItem(key) {
      this.gets += 1;
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      this.sets.push([key, value]);
      store.set(key, value);
    },
  };
  const previous = globalThis.window;
  const fakeWindow = { localStorage: storage };
  globalThis.window = fakeWindow;
  try {
    return run({ fakeWindow, storage, store });
  } finally {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
}

test('常量与默认值', () => {
  assert.equal(CANVAS_WHEEL_BEHAVIOR_STORAGE_KEY, 'v2-canvas-wheel-behavior');
  assert.equal(CANVAS_WHEEL_BEHAVIOR_ZOOM, 'zoom');
  assert.equal(CANVAS_WHEEL_BEHAVIOR_PAN, 'pan');
});

test('normalizeCanvasWheelBehavior 只有 pan 例外，其余一律 zoom', () => {
  assert.equal(normalizeCanvasWheelBehavior('pan'), 'pan');
  assert.equal(normalizeCanvasWheelBehavior('zoom'), 'zoom');
  assert.equal(normalizeCanvasWheelBehavior('PAN'), 'zoom');
  assert.equal(normalizeCanvasWheelBehavior(''), 'zoom');
  assert.equal(normalizeCanvasWheelBehavior(undefined), 'zoom');
  assert.equal(normalizeCanvasWheelBehavior(null), 'zoom');
});

test('运行时字段已合法时直接返回且不查存储', () => {
  withRuntime(({ fakeWindow, storage }) => {
    fakeWindow.v2CanvasWheelBehavior = 'pan';
    assert.equal(readCanvasWheelBehavior(), 'pan');
    assert.equal(storage.gets, 0);
  });
});

test('运行时字段缺失时从存储读取并回写字段', () => {
  withRuntime(({ fakeWindow, storage, store }) => {
    store.set(CANVAS_WHEEL_BEHAVIOR_STORAGE_KEY, 'pan');
    assert.equal(readCanvasWheelBehavior(), 'pan');
    assert.equal(storage.gets, 1);
    assert.equal(fakeWindow.v2CanvasWheelBehavior, 'pan');
  });
});

test('运行时字段非法时忽略它，改用存储', () => {
  withRuntime(({ fakeWindow, store }) => {
    fakeWindow.v2CanvasWheelBehavior = 'bogus';
    store.set(CANVAS_WHEEL_BEHAVIOR_STORAGE_KEY, 'zoom');
    assert.equal(readCanvasWheelBehavior(), 'zoom');
    assert.equal(fakeWindow.v2CanvasWheelBehavior, 'zoom');
  });
});

test('存储为空时读回 zoom', () => {
  withRuntime(({ fakeWindow }) => {
    assert.equal(readCanvasWheelBehavior(), 'zoom');
    assert.equal(fakeWindow.v2CanvasWheelBehavior, 'zoom');
  });
});

test('setCanvasWheelBehavior 同时写运行时与存储并返回规范化结果', () => {
  withRuntime(({ fakeWindow, storage }) => {
    assert.equal(setCanvasWheelBehavior('pan'), 'pan');
    assert.equal(fakeWindow.v2CanvasWheelBehavior, 'pan');
    assert.deepEqual(storage.sets, [[CANVAS_WHEEL_BEHAVIOR_STORAGE_KEY, 'pan']]);
    assert.equal(setCanvasWheelBehavior('nonsense'), 'zoom');
    assert.equal(fakeWindow.v2CanvasWheelBehavior, 'zoom');
    assert.deepEqual(storage.sets[1], [CANVAS_WHEEL_BEHAVIOR_STORAGE_KEY, 'zoom']);
  });
});

test('存储抛出异常时读写都不影响返回', () => {
  withRuntime(({ fakeWindow, storage }) => {
    storage.getItem = () => {
      throw new Error('blocked');
    };
    storage.setItem = () => {
      throw new Error('blocked');
    };
    assert.equal(readCanvasWheelBehavior(), 'zoom');
    assert.equal(setCanvasWheelBehavior('pan'), 'pan');
    assert.equal(fakeWindow.v2CanvasWheelBehavior, 'pan');
  });
});

test('无 document 时 initCanvasControlSettings 直接返回', () => {
  assert.equal(typeof document, 'undefined');
  assert.equal(initCanvasControlSettings(), undefined);
});

test('initCanvasControlSettings 同步初始状态并给每个按钮挂点击', () => {
  withRuntime(({ store }) => {
    store.set(CANVAS_WHEEL_BEHAVIOR_STORAGE_KEY, 'pan');
    const buttons = [
      {
        dataset: { canvasWheelBehavior: 'zoom' },
        classList: { toggle() {} },
        attrs: {},
        setAttribute(n, v) {
          this.attrs[n] = v;
        },
        addEventListener(t, h) {
          this.handler = h;
        },
      },
      {
        dataset: { canvasWheelBehavior: 'pan' },
        classList: { toggle() {} },
        attrs: {},
        setAttribute(n, v) {
          this.attrs[n] = v;
        },
        addEventListener(t, h) {
          this.handler = h;
        },
      },
    ];
    const previous = globalThis.document;
    globalThis.document = { querySelectorAll: () => buttons };
    try {
      initCanvasControlSettings();
      assert.deepEqual(
        buttons.map((button) => button.attrs['aria-pressed']),
        ['false', 'true'],
      );
      buttons[0].handler();
      assert.equal(store.get(CANVAS_WHEEL_BEHAVIOR_STORAGE_KEY), 'zoom');
      assert.equal(globalThis.window.v2CanvasWheelBehavior, 'zoom');
    } finally {
      if (previous === undefined) delete globalThis.document;
      else globalThis.document = previous;
    }
  });
});

test('initCanvasControlSettings 在无匹配按钮时不做任何事', () => {
  withRuntime(({ fakeWindow }) => {
    const previous = globalThis.document;
    globalThis.document = { querySelectorAll: () => [] };
    try {
      assert.equal(initCanvasControlSettings(), undefined);
      assert.equal(fakeWindow.v2CanvasWheelBehavior, undefined);
    } finally {
      if (previous === undefined) delete globalThis.document;
      else globalThis.document = previous;
    }
  });
});

test('存储里的非法值经归一后回写运行时字段', () => {
  withRuntime(({ fakeWindow, store }) => {
    store.set(CANVAS_WHEEL_BEHAVIOR_STORAGE_KEY, 'bogus');
    assert.equal(readCanvasWheelBehavior(), 'zoom');
    assert.equal(fakeWindow.v2CanvasWheelBehavior, 'zoom');
  });
});
