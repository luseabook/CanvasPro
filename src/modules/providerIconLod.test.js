import test from 'node:test';
import assert from 'node:assert/strict';

import {
  installProviderIconLodController,
  isProviderLogoSrc,
  preloadProviderIconAssets,
  resetProviderIconPreloadForTests,
} from './providerIconLod.js';

function createImageFactory() {
  const created = [];
  const factory = (url) => {
    const record = { url, src: '', decoding: '', loading: '', fetchPriority: '', decoded: 0 };
    const image = {
      ...record,
      get src() {
        return record.src;
      },
      set src(value) {
        record.src = value;
      },
      get decoding() {
        return record.decoding;
      },
      set decoding(value) {
        record.decoding = value;
      },
      get loading() {
        return record.loading;
      },
      set loading(value) {
        record.loading = value;
      },
      get fetchPriority() {
        return record.fetchPriority;
      },
      set fetchPriority(value) {
        record.fetchPriority = value;
      },
      decode() {
        record.decoded += 1;
        return Promise.resolve();
      },
    };
    record.image = image;
    created.push(record);
    return image;
  };
  return { factory, created };
}

test('providerIconPreload: 四个 provider 图标都发起预热，并带上高优先级提示', () => {
  resetProviderIconPreloadForTests();
  const { factory, created } = createImageFactory();
  const started = preloadProviderIconAssets({ imageFactory: factory });
  assert.equal(started, 4);
  assert.deepEqual(
    created.map((item) => item.url),
    ['images/RH.png', 'images/jimeng.png', 'images/grsai.png', 'images/ppio.png']
  );
  for (const item of created) {
    // src 必须原样等于页面里 <img> 用的那个字符串，否则命中不了同一份缓存。
    assert.equal(item.src, item.url);
    assert.equal(item.decoding, 'async');
    assert.equal(item.loading, 'eager');
    assert.equal(item.fetchPriority, 'high');
    assert.equal(item.decoded, 1);
  }
  resetProviderIconPreloadForTests();
});

test('providerIconPreload: 重复调用只补新 URL，不会每次都重建 Image', () => {
  resetProviderIconPreloadForTests();
  const first = createImageFactory();
  assert.equal(preloadProviderIconAssets({ imageFactory: first.factory }), 4);
  const second = createImageFactory();
  assert.equal(preloadProviderIconAssets({ imageFactory: second.factory }), 0);
  assert.equal(second.created.length, 0);
  // 清掉记录后才会重新预热（这条同时守住 reset 钩子的存在意义）。
  resetProviderIconPreloadForTests();
  const third = createImageFactory();
  assert.equal(preloadProviderIconAssets({ imageFactory: third.factory }), 4);
  resetProviderIconPreloadForTests();
});

test('providerIconPreload: 没有 Image 构造函数时安静跳过，不抛错', () => {
  resetProviderIconPreloadForTests();
  const previousImage = globalThis.Image;
  delete globalThis.Image;
  try {
    assert.equal(preloadProviderIconAssets(), 0);
  } finally {
    if (previousImage !== undefined) globalThis.Image = previousImage;
    resetProviderIconPreloadForTests();
  }
});

test('providerIconPreload: 单个图元构造抛错不影响其余图标', () => {
  resetProviderIconPreloadForTests();
  const created = [];
  const started = preloadProviderIconAssets({
    imageFactory: (url) => {
      created.push(url);
      if (url.includes('jimeng')) throw new Error('boom');
      return { decode: () => Promise.resolve() };
    },
  });
  assert.equal(created.length, 4, '四个都试过了');
  assert.equal(started, 3, '抛错的那个不计入');
  resetProviderIconPreloadForTests();
});

test('providerIconPreload: 安装 LOD 控制器时会预热（接线没断）', () => {
  resetProviderIconPreloadForTests();
  const previousImage = globalThis.Image;
  const created = [];
  globalThis.Image = function FakeImage() {
    const record = { src: '' };
    created.push(record);
    return record;
  };
  const listeners = [];
  const rootEl = {
    querySelectorAll: () => [],
    getElementById: () => null,
    addEventListener: (type) => listeners.push(type),
    removeEventListener() {},
  };
  try {
    const controller = installProviderIconLodController({ rootEl, store: null });
    assert.equal(created.length, 4, '控制器安装时没预热图标');
    controller.disconnect();
  } finally {
    if (previousImage === undefined) delete globalThis.Image;
    else globalThis.Image = previousImage;
    resetProviderIconPreloadForTests();
  }
});

test('providerIconPreload: 图标 URL 判定没被预加载列表带偏', () => {
  assert.equal(isProviderLogoSrc('images/RH.png'), true);
  assert.equal(isProviderLogoSrc('images/ppio.png?v=2'), true);
  assert.equal(isProviderLogoSrc('images/unknown.png'), false);
});
