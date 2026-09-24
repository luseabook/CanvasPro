import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_STORYBOARD_3D_IMAGE_MAX_BYTES,
  DEFAULT_STORYBOARD_3D_TEXTURE_MAX_DIMENSION,
  DEFAULT_STORYBOARD_3D_TEXTURE_MAX_PIXELS,
  applyStoryboard3DTexturePolicy,
  downsampleStoryboard3DTexture,
  inspectStoryboard3DSceneTextures,
  preflightStoryboard3DImageFile,
  releaseStoryboard3DTexturePolicyResource,
  resolveStoryboard3DTextureLimits,
  validateStoryboard3DImageFile,
} from './texturePolicy.js';

function textureOf({ image = null, isCompressedTexture = false, isDataTexture = false, ...rest } = {}) {
  const listeners = new Map();
  return {
    isTexture: true,
    isCompressedTexture,
    isDataTexture,
    colorSpace: 'srgb',
    flipY: false,
    image,
    needsUpdate: false,
    ...rest,
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    },
    removeEventListener(type, handler) {
      const handlers = listeners.get(type) || [];
      listeners.set(
        type,
        handlers.filter((entry) => entry !== handler),
      );
    },
    dispatch(type) {
      for (const handler of [...(listeners.get(type) || [])]) handler();
    },
  };
}

function imageOf(width, height) {
  return { naturalWidth: width, naturalHeight: height };
}

function sceneOf({ background = null, environment = null, objects = [] } = {}) {
  return {
    background,
    environment,
    traverse(callback) {
      for (const object of objects) callback(object);
    },
  };
}

function meshOf(name, material) {
  return { name, uuid: name + '-uuid', type: 'Mesh', material };
}

function abortErrorOf(reason = 'cancelled') {
  return Object.assign(new Error(String(reason)), { name: 'AbortError', code: 'ABORT_ERR' });
}

test('纹理策略：限制解析尊重硬件上限与策略下限', () => {
  assert.equal(DEFAULT_STORYBOARD_3D_TEXTURE_MAX_DIMENSION, 4096);
  assert.equal(DEFAULT_STORYBOARD_3D_TEXTURE_MAX_PIXELS, 4096 * 4096);
  assert.equal(DEFAULT_STORYBOARD_3D_IMAGE_MAX_BYTES, 64 * 1024 * 1024);

  assert.deepEqual(resolveStoryboard3DTextureLimits(), {
    maxDimension: 4096,
    maxPixels: 4096 * 4096,
    hardwareMaxTextureSize: null,
    policyMaxDimension: 4096,
  });

  const highEnd = resolveStoryboard3DTextureLimits({
    renderer: { capabilities: { maxTextureSize: 8192 } },
  });
  assert.equal(highEnd.maxDimension, 4096);
  assert.equal(highEnd.hardwareMaxTextureSize, 8192);

  const lowEnd = resolveStoryboard3DTextureLimits({
    renderer: { capabilities: { maxTextureSize: 1024 } },
  });
  assert.equal(lowEnd.maxDimension, 1024);
  assert.equal(lowEnd.hardwareMaxTextureSize, 1024);

  const policyBound = resolveStoryboard3DTextureLimits({
    renderer: { capabilities: { maxTextureSize: 8192 } },
    policyMaxDimension: 512,
    policyMaxPixels: 1000,
  });
  assert.equal(policyBound.maxDimension, 512);
  assert.equal(policyBound.maxPixels, 1000);
  assert.equal(policyBound.policyMaxDimension, 512);

  const invalidPolicy = resolveStoryboard3DTextureLimits({ policyMaxDimension: 0, policyMaxPixels: -5 });
  assert.equal(invalidPolicy.maxDimension, 4096);
  assert.equal(invalidPolicy.maxPixels, 4096 * 4096);

  const invalidHardware = resolveStoryboard3DTextureLimits({
    renderer: { capabilities: { maxTextureSize: Number.NaN } },
  });
  assert.equal(invalidHardware.hardwareMaxTextureSize, null);
  assert.equal(invalidHardware.maxDimension, 4096);
});

test('纹理策略：场景巡检区分保留、降采样与未知尺寸', () => {
  const background = textureOf({ image: imageOf(2048, 1024) });
  const environment = textureOf({ image: imageOf(4096, 4096) });
  const shared = textureOf({ image: imageOf(4096, 2048) });
  const oversizedBoth = textureOf({ image: imageOf(4096, 8192) });
  const unknown = textureOf({ image: null });
  const scene = sceneOf({
    background,
    environment,
    objects: [
      meshOf('shared-a', { map: shared }),
      meshOf('shared-b', { map: shared, normalMap: oversizedBoth }),
      meshOf('unknown-mesh', null),
      { name: 'nested', type: 'Mesh', material: [{ emissiveMap: unknown, color: 0xffffff }, null] },
    ],
  });

  const result = inspectStoryboard3DSceneTextures(scene);
  assert.equal(result.total, 5);
  assert.equal(result.oversized, 1);
  assert.equal(result.warnings, 1);
  assert.equal(result.limits.maxDimension, 4096);

  const byTexture = new Map(result.textures.map((entry) => [entry.texture, entry]));
  assert.equal(byTexture.get(background).action, 'keep');
  assert.deepEqual(byTexture.get(background).references, ['scene.background']);
  assert.equal(byTexture.get(environment).action, 'keep');
  assert.equal(byTexture.get(environment).pixelCount, 4096 * 4096);
  assert.deepEqual(byTexture.get(environment).reasons, []);

  const sharedEntry = byTexture.get(shared);
  assert.equal(sharedEntry.action, 'keep');
  assert.deepEqual(sharedEntry.references, ['shared-a.material[0]', 'shared-b.material[0]']);
  assert.equal(result.textures.filter((entry) => entry.texture === shared).length, 1);

  const oversizedEntry = byTexture.get(oversizedBoth);
  assert.equal(oversizedEntry.action, 'downsample');
  assert.deepEqual(oversizedEntry.reasons, [
    'TEXTURE_DIMENSION_EXCEEDS_LIMIT',
    'TEXTURE_PIXEL_COUNT_EXCEEDS_LIMIT',
  ]);
  assert.equal(oversizedEntry.targetWidth, 2048);
  assert.equal(oversizedEntry.targetHeight, 4096);
  assert.deepEqual(oversizedEntry.references, ['shared-b.material[0]']);

  const unknownEntry = byTexture.get(unknown);
  assert.equal(unknownEntry.action, 'warning');
  assert.deepEqual(unknownEntry.reasons, ['TEXTURE_DIMENSIONS_UNKNOWN']);
  assert.equal(unknownEntry.width, null);
  assert.equal(unknownEntry.targetWidth, null);
  assert.deepEqual(unknownEntry.references, ['nested.material[0]']);
});

test('纹理策略：仅像素超限时也判为降采样', () => {
  const pixelBound = textureOf({ image: imageOf(2000, 1000) });
  const result = inspectStoryboard3DSceneTextures(sceneOf({ objects: [meshOf('m', { map: pixelBound })] }), {
    policyMaxPixels: 1000000,
  });
  const [entry] = result.textures;
  assert.equal(entry.action, 'downsample');
  assert.deepEqual(entry.reasons, ['TEXTURE_PIXEL_COUNT_EXCEEDS_LIMIT']);
  assert.equal(entry.targetWidth, 1414);
  assert.equal(entry.targetHeight, 707);
});

test('纹理策略：图片来源支持数组、canvas、视频与嵌套 source', () => {
  const fromArray = textureOf({
    image: [imageOf(100, 100), imageOf(3000, 2000), imageOf(500, 500)],
  });
  const fromCanvas = textureOf({ image: { width: 300, height: 150 } });
  const fromVideo = textureOf({ image: { videoWidth: 640, videoHeight: 480 } });
  const nested = textureOf({ source: { data: imageOf(512, 256) } });
  const noTexture = { isTexture: false, image: imageOf(9000, 9000) };

  const result = inspectStoryboard3DSceneTextures(
    sceneOf({
      background: noTexture,
      objects: [
        meshOf('a', { map: fromArray }),
        meshOf('b', { map: fromCanvas }),
        meshOf('c', { map: fromVideo }),
        meshOf('d', { map: nested }),
      ],
    }),
  );
  assert.equal(result.total, 4);
  const dimensions = result.textures.map((entry) => [entry.width, entry.height]);
  assert.deepEqual(dimensions, [
    [3000, 2000],
    [300, 150],
    [640, 480],
    [512, 256],
  ]);
});

test('纹理策略：未托管的纹理释放返回 false', () => {
  assert.equal(releaseStoryboard3DTexturePolicyResource(textureOf({ image: imageOf(64, 64) })), false);
  assert.equal(releaseStoryboard3DTexturePolicyResource(null), false);
});

test('纹理策略：降采样以 createImageBitmap 为主路径并托管资源', async () => {
  let closed = 0;
  let captured = null;
  const texture = textureOf({ image: imageOf(4000, 2000), colorSpace: 'srgb-linear', flipY: true });
  const bitmap = {
    kind: 'bitmap',
    close() {
      closed += 1;
    },
  };
  const result = await downsampleStoryboard3DTexture(texture, {
    width: 512,
    height: 256,
    createImageBitmapFn: async (source, options) => {
      captured = { source, options };
      return bitmap;
    },
  });

  assert.equal(result.method, 'createImageBitmap');
  assert.equal(result.texture, texture);
  assert.equal(result.width, 512);
  assert.equal(result.height, 256);
  assert.equal(texture.image, bitmap);
  assert.equal(texture.needsUpdate, true);
  assert.equal(texture.colorSpace, 'srgb-linear');
  assert.equal(texture.flipY, true);
  assert.deepEqual(captured.options, { resizeWidth: 512, resizeHeight: 256, resizeQuality: 'high' });

  assert.equal(releaseStoryboard3DTexturePolicyResource(texture), true);
  assert.equal(closed, 1);
  assert.equal(releaseStoryboard3DTexturePolicyResource(texture), false);
});

test('纹理策略：dispose 事件释放托管资源', async () => {
  let closed = 0;
  const texture = textureOf({ image: imageOf(2048, 2048) });
  await downsampleStoryboard3DTexture(texture, {
    width: 256,
    height: 256,
    createImageBitmapFn: async () => ({
      close() {
        closed += 1;
      },
    }),
  });
  texture.dispatch('dispose');
  assert.equal(closed, 1);
  assert.equal(releaseStoryboard3DTexturePolicyResource(texture), false);
});

test('纹理策略：回退到离屏画布与普通画布', async () => {
  const transferred = {
    close() {
      transferredOps.push('close');
    },
  };
  const transferredOps = [];
  const offscreen = {
    width: 0,
    height: 0,
    getContext: (type) => (type === '2d' ? { drawImage: () => transferredOps.push('draw') } : null),
    transferToImageBitmap: () => {
      transferredOps.push('transfer');
      return transferred;
    },
  };
  const offscreenTexture = textureOf({ image: imageOf(3000, 3000) });
  const offscreenResult = await downsampleStoryboard3DTexture(offscreenTexture, {
    width: 300,
    height: 300,
    createImageBitmapFn: null,
    createCanvas: async () => offscreen,
  });
  assert.equal(offscreenResult.method, 'offscreen-canvas');
  assert.equal(offscreenTexture.image, transferred);
  assert.deepEqual(transferredOps, ['draw', 'transfer']);
  assert.equal(releaseStoryboard3DTexturePolicyResource(offscreenTexture), true);
  assert.deepEqual(transferredOps, ['draw', 'transfer', 'close']);

  const drawOps = [];
  const plain = {
    width: 0,
    height: 0,
    getContext: (type) => (type === '2d' ? { drawImage: (...args) => drawOps.push(args) } : null),
  };
  const plainTexture = textureOf({ image: imageOf(3000, 3000) });
  const plainResult = await downsampleStoryboard3DTexture(plainTexture, {
    width: 150,
    height: 150,
    createImageBitmapFn: null,
    createCanvas: async () => plain,
  });
  assert.equal(plainResult.method, 'canvas');
  assert.equal(plainTexture.image, plain);
  assert.equal(drawOps.length, 1);
  assert.equal(drawOps[0].length, 5);
  assert.equal(releaseStoryboard3DTexturePolicyResource(plainTexture), false);
});

test('纹理策略：降采样前置校验与不可用运行时报错', async () => {
  await assert.rejects(
    downsampleStoryboard3DTexture({ image: imageOf(10, 10) }, { width: 5, height: 5 }),
    (error) => error instanceof TypeError && error.message === 'A Three.js texture is required.',
  );

  await assert.rejects(
    downsampleStoryboard3DTexture(textureOf({ image: imageOf(10, 10) }), { width: 0, height: 5 }),
    (error) => error instanceof TypeError && error.message === 'Positive target dimensions are required.',
  );

  for (const texture of [
    textureOf({ image: [imageOf(10, 10)] }),
    textureOf({ image: imageOf(10, 10), isCompressedTexture: true }),
    textureOf({ image: imageOf(10, 10), isDataTexture: true }),
    textureOf({ image: null }),
  ]) {
    await assert.rejects(
      downsampleStoryboard3DTexture(texture, { width: 5, height: 5 }),
      (error) =>
        error.code === 'TEXTURE_DOWNSAMPLE_UNAVAILABLE' &&
        error.message === 'Texture source is not a drawable 2D image.',
    );
  }

  await assert.rejects(
    downsampleStoryboard3DTexture(textureOf({ image: imageOf(10, 10) }), {
      width: 5,
      height: 5,
      createImageBitmapFn: null,
      createCanvas: async () => ({ getContext: () => null }),
    }),
    (error) => {
      assert.equal(error.code, 'TEXTURE_DOWNSAMPLE_UNAVAILABLE');
      assert.equal(error.message, 'Texture cannot be downsampled in this runtime.');
      assert.equal(error.causes.length, 1);
      return true;
    },
  );

  await assert.rejects(
    downsampleStoryboard3DTexture(textureOf({ image: imageOf(10, 10) }), {
      width: 5,
      height: 5,
      createImageBitmapFn: null,
      OffscreenCanvasConstructor: null,
      documentObject: null,
    }),
    (error) => {
      assert.equal(error.code, 'TEXTURE_DOWNSAMPLE_UNAVAILABLE');
      assert.equal(error.causes.length, 1);
      assert.match(error.causes[0].message, /Canvas creation is unavailable/);
      return true;
    },
  );
});

test('纹理策略：降采样响应中止信号并回滚', async () => {
  const preAborted = { aborted: true, reason: 'early stop' };
  await assert.rejects(
    downsampleStoryboard3DTexture(textureOf({ image: imageOf(10, 10) }), {
      width: 5,
      height: 5,
      signal: preAborted,
      createImageBitmapFn: async () => ({ close() {} }),
    }),
    (error) => error.name === 'AbortError' && error.code === 'ABORT_ERR' && error.message === 'early stop',
  );

  const signal = { aborted: false };
  let closed = 0;
  await assert.rejects(
    downsampleStoryboard3DTexture(textureOf({ image: imageOf(10, 10) }), {
      width: 5,
      height: 5,
      signal,
      createImageBitmapFn: async () => {
        signal.aborted = true;
        return {
          close() {
            closed += 1;
          },
        };
      },
    }),
    (error) => error.name === 'AbortError' && error.message === 'Texture processing was cancelled',
  );
  assert.equal(closed, 1);
});

test('纹理策略：应用策略报告进度、优化与失败告警', async () => {
  const ok = textureOf({ image: imageOf(8192, 8192) });
  const failing = textureOf({ image: imageOf(4096, 8192) });
  const kept = textureOf({ image: imageOf(256, 256) });
  const scene = sceneOf({
    objects: [meshOf('ok', { map: ok }), meshOf('bad', { map: failing }), meshOf('kept', { map: kept })],
  });
  const progress = [];
  const bitmap = { close() {} };
  const outcome = await applyStoryboard3DTexturePolicy(scene, {
    createImageBitmapFn: async () => bitmap,
    onProgress: (entry) => progress.push(entry),
  });

  assert.equal(outcome.inspection.total, 3);
  assert.equal(outcome.inspection.oversized, 2);
  assert.equal(outcome.optimized.length, 2);
  assert.deepEqual(
    outcome.optimized.map((entry) => entry.method),
    ['createImageBitmap', 'createImageBitmap'],
  );
  assert.deepEqual(
    outcome.optimized.map((entry) => entry.targetWidth),
    [4096, 2048],
  );
  assert.deepEqual(progress, [
    { completed: 1, total: 2, progress: 0.5 },
    { completed: 2, total: 2, progress: 1 },
  ]);
  assert.deepEqual(outcome.warnings, []);
  assert.equal(ok.image, bitmap);
  assert.equal(kept.image.naturalWidth, 256);
  assert.equal(releaseStoryboard3DTexturePolicyResource(ok), true);
  assert.equal(releaseStoryboard3DTexturePolicyResource(failing), true);
  outcome.disposeOwnedResources();
  assert.equal(releaseStoryboard3DTexturePolicyResource(ok), false);
});

test('纹理策略：降采样失败记为告警且保留原纹理', async () => {
  const failing = textureOf({ image: imageOf(6000, 6000) });
  const scene = sceneOf({ objects: [meshOf('bad', { map: failing })] });
  const outcome = await applyStoryboard3DTexturePolicy(scene, {
    createImageBitmapFn: null,
    OffscreenCanvasConstructor: null,
    documentObject: null,
  });
  assert.equal(outcome.optimized.length, 0);
  assert.equal(outcome.warnings.length, 1);
  assert.equal(outcome.warnings[0].code, 'TEXTURE_DOWNSAMPLE_UNAVAILABLE');
  assert.equal(
    outcome.warnings[0].message,
    'Texture 6000x6000 exceeds the 4096px / 16777216 pixel policy but could not be downsampled.',
  );
  assert.deepEqual(outcome.warnings[0].references, ['bad.material[0]']);
  assert.ok(outcome.warnings[0].cause);
  assert.equal(failing.image.naturalWidth, 6000);
  assert.equal(releaseStoryboard3DTexturePolicyResource(failing), false);
});

test('纹理策略：未知尺寸纹理给出巡检告警', async () => {
  const unknown = textureOf({ image: null });
  const outcome = await applyStoryboard3DTexturePolicy(sceneOf({ objects: [meshOf('u', { map: unknown })] }));
  assert.equal(outcome.optimized.length, 0);
  assert.equal(outcome.warnings.length, 1);
  assert.equal(outcome.warnings[0].code, 'TEXTURE_DIMENSIONS_UNKNOWN');
  assert.equal(
    outcome.warnings[0].message,
    'Texture dimensions could not be determined; the texture was kept unchanged.',
  );
});

test('纹理策略：上传前文件校验累积错误', () => {
  assert.deepEqual(validateStoryboard3DImageFile({ name: 'a.png', type: 'image/png', size: 100 }), {
    ok: true,
    errors: [],
  });

  assert.deepEqual(
    validateStoryboard3DImageFile({ name: 'a.png', type: 'image/png', size: 2000000 }, { maxBytes: 1000000 }),
    {
      ok: false,
      errors: [
        {
          code: 'IMAGE_FILE_TOO_LARGE',
          message: 'The image file exceeds 1 MB.',
        },
      ],
    },
  );

  const invalid = validateStoryboard3DImageFile({ name: '  ', type: 'text/plain', size: 0 });
  assert.equal(invalid.ok, false);
  assert.deepEqual(
    invalid.errors.map((entry) => entry.code),
    ['IMAGE_FILE_NAME_REQUIRED', 'IMAGE_FILE_TYPE_INVALID', 'IMAGE_FILE_EMPTY'],
  );
  assert.equal(invalid.errors[1].message, 'The selected file is not an image.');
  assert.equal(invalid.errors[2].message, 'The image file is empty.');

  const missingSize = validateStoryboard3DImageFile({ name: 'a.webp', type: 'image/webp' });
  assert.deepEqual(
    missingSize.errors.map((entry) => entry.code),
    ['IMAGE_FILE_EMPTY'],
  );

  const defaultLimit = validateStoryboard3DImageFile({
    name: 'big.png',
    type: 'image/png',
    size: DEFAULT_STORYBOARD_3D_IMAGE_MAX_BYTES + 1,
  });
  assert.deepEqual(
    defaultLimit.errors.map((entry) => entry.code),
    ['IMAGE_FILE_TOO_LARGE'],
  );
});

test('纹理策略：上传前预检输出动作与目标尺寸', async () => {
  const file = { name: 'a.png', type: 'image/png', size: 1024 };
  const accepted = await preflightStoryboard3DImageFile(file, {
    decodeImageDimensions: async () => ({ width: 512, height: 512 }),
  });
  assert.equal(accepted.ok, true);
  assert.equal(accepted.action, 'accept');
  assert.deepEqual(accepted.errors, []);
  assert.deepEqual(accepted.warnings, []);
  assert.equal(accepted.width, 512);
  assert.equal(accepted.height, 512);
  assert.equal(accepted.targetWidth, 512);
  assert.equal(accepted.targetHeight, 512);
  assert.equal(accepted.limits.maxDimension, 4096);

  const downsampled = await preflightStoryboard3DImageFile(file, {
    decodeImageDimensions: async () => ({ width: 8000, height: 8000 }),
  });
  assert.equal(downsampled.action, 'downsample');
  assert.equal(downsampled.targetWidth, 4096);
  assert.equal(downsampled.targetHeight, 4096);
  assert.deepEqual(
    downsampled.warnings.map((entry) => entry.code),
    ['IMAGE_PIXELS_EXCEED_LIMIT'],
  );
  assert.equal(downsampled.warnings[0].message, 'Image 8000x8000 should be downsampled to 4096x4096.');

  const hardwareBound = await preflightStoryboard3DImageFile(file, {
    renderer: { capabilities: { maxTextureSize: 1024 } },
    decodeImageDimensions: async () => ({ width: 2000, height: 1000 }),
  });
  assert.equal(hardwareBound.limits.maxDimension, 1024);
  assert.equal(hardwareBound.action, 'downsample');
  assert.equal(hardwareBound.targetWidth, 1024);
  assert.equal(hardwareBound.targetHeight, 512);

  const rejected = await preflightStoryboard3DImageFile(
    { name: 'a.png', type: 'image/png', size: 2000000 },
    { maxBytes: 1000, decodeImageDimensions: async () => ({ width: 10, height: 10 }) },
  );
  assert.equal(rejected.ok, false);
  assert.equal(rejected.action, 'reject');
  assert.deepEqual(
    rejected.errors.map((entry) => entry.code),
    ['IMAGE_FILE_TOO_LARGE'],
  );
  assert.equal(rejected.width, null);
  assert.equal(rejected.targetWidth, null);
  assert.ok(rejected.limits);
});

test('纹理策略：预检读不出尺寸时降级为带告警接受', async () => {
  const file = { name: 'a.png', type: 'image/png', size: 1024 };
  const readFailed = await preflightStoryboard3DImageFile(file, {
    decodeImageDimensions: async () => {
      throw new Error('boom');
    },
  });
  assert.equal(readFailed.ok, true);
  assert.equal(readFailed.action, 'accept-with-warning');
  assert.deepEqual(
    readFailed.warnings.map((entry) => entry.code),
    ['IMAGE_DIMENSION_READ_FAILED'],
  );
  assert.equal(readFailed.warnings[0].message, 'Image pixel dimensions could not be checked before upload.');
  assert.equal(readFailed.width, null);

  const coded = await preflightStoryboard3DImageFile(file, {
    decodeImageDimensions: async () => {
      throw Object.assign(new Error('no decoder'), { code: 'IMAGE_DIMENSION_DECODER_UNAVAILABLE' });
    },
  });
  assert.equal(coded.warnings[0].code, 'IMAGE_DIMENSION_DECODER_UNAVAILABLE');

  const invalid = await preflightStoryboard3DImageFile(file, {
    decodeImageDimensions: async () => ({ width: 0, height: 0 }),
  });
  assert.equal(invalid.action, 'accept-with-warning');
  assert.equal(invalid.warnings[0].code, 'IMAGE_DIMENSION_READ_FAILED');

  await assert.rejects(
    preflightStoryboard3DImageFile(file, { signal: { aborted: true, reason: 'stop now' } }),
    (error) => error.name === 'AbortError' && error.message === 'stop now',
  );

  await assert.rejects(
    preflightStoryboard3DImageFile(file, {
      decodeImageDimensions: async () => {
        throw abortErrorOf('midway');
      },
    }),
    (error) => error.name === 'AbortError' && error.message === 'midway',
  );
});

test('纹理策略：预检可通过 createImageBitmap 解码尺寸', async () => {
  let closed = 0;
  const result = await preflightStoryboard3DImageFile(
    { name: 'a.png', type: 'image/png', size: 1024 },
    {
      createImageBitmapFn: async () => ({
        naturalWidth: 300,
        naturalHeight: 200,
        close() {
          closed += 1;
        },
      }),
    },
  );
  assert.equal(result.action, 'accept');
  assert.equal(result.width, 300);
  assert.equal(result.height, 200);
  assert.equal(closed, 1);

  const unavailable = await preflightStoryboard3DImageFile(
    { name: 'a.png', type: 'image/png', size: 1024 },
    { createImageBitmapFn: null },
  );
  assert.equal(unavailable.action, 'accept-with-warning');
  assert.equal(unavailable.warnings[0].code, 'IMAGE_DIMENSION_DECODER_UNAVAILABLE');
});
