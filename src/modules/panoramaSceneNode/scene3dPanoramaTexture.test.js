import test from 'node:test';
import assert from 'node:assert/strict';
import * as threeRuntime from './threeRuntime.js';
import { configureInsideSpherePanoramaTexture, loadPanoramaTextureSource } from './scene3dPanoramaTexture.js';

const usableBlob = () => ({ arrayBuffer: async () => new ArrayBuffer(0) });

const bitmap = (width = 8, height = 8) => {
  const state = { closed: 0, width, height };
  state.close = () => {
    state.closed += 1;
  };
  return state;
};

test('scene3dPanoramaTexture: 地址为空或只有空白时直接报错', async () => {
  await assert.rejects(() => loadPanoramaTextureSource(''), /Panorama texture URL is empty/);
  await assert.rejects(() => loadPanoramaTextureSource('   '), /Panorama texture URL is empty/);
  await assert.rejects(() => loadPanoramaTextureSource(), /Panorama texture URL is empty/);
});

test('scene3dPanoramaTexture: 信号已中止时走 AbortError', async () => {
  await assert.rejects(
    () => loadPanoramaTextureSource('http://cdn/p.jpg', { signal: { aborted: true } }),
    (error) => error.name === 'AbortError',
  );
});

test('scene3dPanoramaTexture: 走位图分支时返回翻转过的纹理，并在释放时关掉位图', async () => {
  const loaded = bitmap(16, 8);
  const fetched = [];
  const texture = await loadPanoramaTextureSource('  http://cdn/p.jpg  ', {
    fetchBlobImpl: async (url, options) => {
      fetched.push([url, options]);
      return usableBlob();
    },
    createImageBitmapImpl: async () => loaded,
    timeout: 1234,
  });

  assert.deepEqual(fetched, [['http://cdn/p.jpg', { signal: undefined, timeout: 1234 }]]);
  assert.equal(texture instanceof threeRuntime.Texture, true);
  assert.equal(texture.image, loaded);
  assert.equal(texture.flipY, false);
  assert.equal(loaded.closed, 0, '纹理还在用时不能提前关位图');

  texture.dispatchEvent({ type: 'dispose' });
  assert.equal(loaded.closed, 1);
  texture.dispatchEvent({ type: 'dispose' });
  assert.equal(loaded.closed, 1, '重复释放只关一次');
});

test('scene3dPanoramaTexture: 位图尺寸非法时关掉位图并退到纹理加载器', async () => {
  const invalid = bitmap(0, 8);
  const loaderCalls = [];
  const fallbackTexture = { name: 'fallback' };

  const result = await loadPanoramaTextureSource('http://cdn/p.jpg', {
    fetchBlobImpl: async () => usableBlob(),
    createImageBitmapImpl: async () => invalid,
    textureLoader: {
      load(url, onLoad) {
        loaderCalls.push(url);
        onLoad(fallbackTexture);
      },
    },
  });

  assert.deepEqual(loaderCalls, ['http://cdn/p.jpg']);
  assert.equal(result, fallbackTexture);
  assert.equal(invalid.closed > 0, true, '无效位图必须被关掉');
});

test('scene3dPanoramaTexture: 没有纹理加载器时，位图分支的错误会被原样抛出', async () => {
  await assert.rejects(
    () =>
      loadPanoramaTextureSource('http://cdn/p.jpg', {
        fetchBlobImpl: async () => usableBlob(),
        createImageBitmapImpl: async () => bitmap(0, 0),
      }),
    /Panorama texture bitmap is invalid/,
  );
});

test('scene3dPanoramaTexture: 取流失败后退到纹理加载器；加载器也失败时抛最先的错误', async () => {
  const firstError = new Error('fetch exploded');
  await assert.rejects(
    () =>
      loadPanoramaTextureSource('http://cdn/p.jpg', {
        fetchBlobImpl: async () => {
          throw firstError;
        },
        createImageBitmapImpl: async () => bitmap(),
        textureLoader: {
          load(url, onLoad, onProgress, onError) {
            onError(new Error('loader exploded'));
          },
        },
      }),
    (error) => error === firstError,
  );
});

test('scene3dPanoramaTexture: 加载器缺失时抛的是加载器不可用', async () => {
  await assert.rejects(
    () => loadPanoramaTextureSource('http://cdn/p.jpg', { timeout: 10 }),
    /Panorama texture loader is unavailable/,
  );
});

test('scene3dPanoramaTexture: 加载中途收到中止事件会以 AbortError 结束', async () => {
  const listeners = new Map();
  const signal = {
    aborted: false,
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    removeEventListener(type) {
      listeners.delete(type);
    },
  };

  const pending = loadPanoramaTextureSource('http://cdn/p.jpg', {
    signal,
    textureLoader: { load() {} },
  });
  assert.equal(typeof listeners.get('abort'), 'function');

  listeners.get('abort')();
  await assert.rejects(() => pending, (error) => error.name === 'AbortError');
  assert.equal(listeners.has('abort'), false, '结束时会摘掉监听');
});

test('scene3dPanoramaTexture: 中止后到达的纹理会被立刻释放', async () => {
  const listeners = new Map();
  const signal = {
    aborted: false,
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    removeEventListener(type) {
      listeners.delete(type);
    },
  };
  let disposals = 0;
  let deliver;
  const texture = {
    dispose() {
      disposals += 1;
    },
  };

  const pending = loadPanoramaTextureSource('http://cdn/p.jpg', {
    signal,
    textureLoader: {
      load(url, onLoad) {
        deliver = onLoad;
      },
    },
  });

  listeners.get('abort')();
  deliver(texture);
  await assert.rejects(() => pending, (error) => error.name === 'AbortError');
  assert.equal(disposals, 1, '迟到纹理直接释放');
});

test('scene3dPanoramaTexture: 加载失败给的不是 Error 时包成 Error', async () => {
  await assert.rejects(
    () =>
      loadPanoramaTextureSource('http://cdn/p.jpg', {
        textureLoader: {
          load(url, onLoad, onProgress, onError) {
            onError('plain string');
          },
        },
      }),
    /Panorama texture load failed/,
  );
});

test('scene3dPanoramaTexture: 配置函数对空纹理是空操作', () => {
  assert.equal(configureInsideSpherePanoramaTexture(null, null), undefined);
  assert.equal(configureInsideSpherePanoramaTexture(undefined, {}), undefined);
});

test('scene3dPanoramaTexture: 正式模式开 mipmap、按能力取各向异性并翻转球面朝向', () => {
  const repeat = [];
  const offset = [];
  const texture = {
    repeat: { set: (...args) => repeat.push(args) },
    offset: { set: (...args) => offset.push(args) },
  };
  const renderer = { capabilities: { getMaxAnisotropy: () => 16 } };

  configureInsideSpherePanoramaTexture(texture, renderer, { isPreview: false });

  assert.equal(texture.colorSpace, threeRuntime.SRGBColorSpace);
  assert.equal(texture.minFilter, threeRuntime.LinearMipmapLinearFilter);
  assert.equal(texture.magFilter, threeRuntime.LinearFilter);
  assert.equal(texture.generateMipmaps, true);
  assert.equal(texture.anisotropy, 8, '各向异性封顶在 8');
  assert.deepEqual(repeat, [[-1, 1]]);
  assert.deepEqual(offset, [[1, 0]]);
  assert.equal(texture.needsUpdate, true);
});

test('scene3dPanoramaTexture: 预览模式关掉 mipmap、各向异性固定为 1', () => {
  const texture = {
    repeat: { set() {} },
    offset: { set() {} },
  };

  configureInsideSpherePanoramaTexture(texture, { capabilities: { getMaxAnisotropy: () => 16 } }, { isPreview: true });

  assert.equal(texture.minFilter, threeRuntime.LinearFilter);
  assert.equal(texture.generateMipmaps, false);
  assert.equal(texture.anisotropy, 1);
  assert.equal(texture.needsUpdate, true);
});

test('scene3dPanoramaTexture: 渲染器没有能力查询时各向异性退回 1', () => {
  const texture = { repeat: { set() {} }, offset: { set() {} } };
  configureInsideSpherePanoramaTexture(texture, {}, { isPreview: false });
  assert.equal(texture.anisotropy, 1);
});
