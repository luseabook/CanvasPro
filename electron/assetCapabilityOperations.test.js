import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  buildAssetCapabilityResponse,
  createAssetCapabilityOperations,
} from './assetCapabilityOperations.js';

function sha256Of(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}
function createFakeImage({ width = 640, height = 480, empty = false } = {}) {
  return {
    getSize: () => ({ width: width, height: height }),
    isEmpty: () => empty,
    resize: ({ width: resizedWidth, height: resizedHeight }) => ({
      toPNG: () => Buffer.from(`resized:${resizedWidth}x${resizedHeight}`),
    }),
    toPNG: () => Buffer.from(`png:${width}x${height}`),
  };
}
function createRig(overrides = {}) {
  const assetsDir = mkdtempSync(path.join(tmpdir(), 'aic-asset-ops-')),
    calls = { enqueued: [], published: [], logged: [], warnings: [] };
  let tick = 0;
  const operations = createAssetCapabilityOperations({
    getAssetsDir: () => assetsDir,
    getMediaTaskQueue: () => ({
      get: () => undefined,
      enqueue: (payload) => {
        calls.enqueued.push(payload);
        return { taskId: payload.taskId, kind: payload.kind, status: 'waiting', progress: 0 };
      },
    }),
    createImageFromPath: overrides.createImageFromPath || (() => createFakeImage()),
    createImageDerivatives: overrides.createImageDerivatives || null,
    probeVideoPlaybackInfo:
      overrides.probeVideoPlaybackInfo ||
      (() => ({ codecName: 'h264', pixelFormat: 'yuv420p', width: 640, height: 480, duration: 3, fps: 30 })),
    publishAssetUpdate: (payload) => calls.published.push(payload),
    shouldBufferAssetUpdates: overrides.shouldBufferAssetUpdates || (() => false),
    isImportLoggingEnabled: overrides.isImportLoggingEnabled || (() => false),
    now: overrides.now || (() => new Date(1700000000000 + (tick += 1) * 1000).getTime()),
    createRandomHex: () => 'abcdef12',
    logInfo: (...args) => calls.logged.push(args),
    logWarning: (...args) => calls.warnings.push(args),
  });
  return { assetsDir, calls, operations };
}
function writeSourceFile(extension = '.png', contents = 'source-bytes') {
  const filePath = path.join(mkdtempSync(path.join(tmpdir(), 'aic-asset-src-')), 'source' + extension);
  writeFileSync(filePath, contents);
  return filePath;
}
function readIndex(assetsDir) {
  return JSON.parse(readFileSync(path.join(assetsDir, 'assets.index.json'), 'utf8'));
}
function writeProxyFile(assetsDir, assetId) {
  const proxyDir = path.join(assetsDir, 'derived', 'video');
  mkdirSync(proxyDir, { recursive: true });
  writeFileSync(path.join(proxyDir, `${assetId}.proxy-v2-1280.mp4`), 'proxy-bytes');
}

test('buildAssetCapabilityResponse exposes revision, updatedAt and proxy version', () => {
  const response = buildAssetCapabilityResponse(
    {
      assetId: 'id1',
      kind: 'video',
      assetRevision: 4.9,
      updatedAt: '2026-01-01T00:00:00.000Z',
      originalLocalPath: 'data/assets/original/id1.mp4',
      displayLocalPath: 'data/assets/derived/video/id1.proxy-v2-1280.mp4',
      thumbLocalPath: '',
      posterLocalPath: 'data/assets/derived/video/id1.poster.jpg',
      waveformLocalPath: '',
      originalName: 'clip.mp4',
      size: '2048',
      mimeType: 'video/mp4',
      status: 'ready',
      mediaTaskProgress: '0.5',
      videoProxyStatus: 'generated',
      videoProxyVersion: 'v2-1280',
      videoWidth: 1280,
      videoHeight: 720,
      videoDuration: 4.5,
      videoFps: 30,
    },
    { reused: 'yes', derivativeStatus: 'processing' },
  );
  assert.equal(response.success, true);
  assert.equal(response.assetRevision, 4);
  assert.equal(response.assetUpdatedAt, '2026-01-01T00:00:00.000Z');
  assert.equal(response.reused, true);
  assert.equal(response.derivativeStatus, 'processing');
  assert.equal(response.url, '/data/assets/derived/video/id1.proxy-v2-1280.mp4');
  assert.equal(response.storedFilename, 'id1.mp4');
  assert.equal(response.size, 2048);
  assert.equal(response.mediaTaskProgress, 0.5);
  assert.equal(response.videoProxyVersion, 'v2-1280');
  assert.equal(response.thumbLocalPath, 'data/assets/derived/video/id1.poster.jpg');
  assert.equal(response.thumbUrl, '/data/assets/derived/video/id1.poster.jpg');
  assert.equal(response.posterUrl, '/data/assets/derived/video/id1.poster.jpg');
  assert.equal(response.width, 1280);
  assert.equal(response.height, 720);
});

test('buildAssetCapabilityResponse prefers the original path for audio and image fallbacks', () => {
  const audio = buildAssetCapabilityResponse({
    assetId: 'a',
    kind: 'audio',
    originalLocalPath: 'data/assets/original/a.mp3',
    displayLocalPath: 'data/assets/derived/ignored.mp3',
  });
  assert.equal(audio.url, '/data/assets/original/a.mp3');
  const image = buildAssetCapabilityResponse({ assetId: 'i', kind: 'image', originalLocalPath: 'o.png' });
  assert.equal(image.url, '/o.png');
  assert.equal(image.displayUrl, '');
  assert.equal(image.thumbUrl, '');
  assert.equal(image.assetRevision, 0);
  assert.equal(image.reused, false);
});

test('every required dependency is enforced', () => {
  const base = {
    getAssetsDir: () => '',
    getMediaTaskQueue: () => ({}),
    createImageFromPath: () => ({}),
    probeVideoPlaybackInfo: () => ({}),
  };
  assert.throws(() => createAssetCapabilityOperations({}), /getAssetsDir must be a function/);
  assert.throws(
    () => createAssetCapabilityOperations({ ...base, getMediaTaskQueue: undefined }),
    /getMediaTaskQueue must be a function/,
  );
  assert.throws(
    () => createAssetCapabilityOperations({ ...base, createImageFromPath: undefined }),
    /createImageFromPath must be a function/,
  );
  assert.throws(
    () => createAssetCapabilityOperations({ ...base, probeVideoPlaybackInfo: undefined }),
    /probeVideoPlaybackInfo must be a function/,
  );
  assert.throws(
    () => createAssetCapabilityOperations({ ...base, now: 1 }),
    /now must be a function/,
  );
});

test('an image import writes both derivatives and returns a ready record', async () => {
  const { assetsDir, operations } = createRig(),
    sourcePath = writeSourceFile('.png', 'image-bytes'),
    id = sha256Of(Buffer.from('image-bytes')),
    response = await operations.importAssetToLibrary({ path: sourcePath, name: 'photo.png', type: 'image/png' });
  assert.equal(response.success, true);
  assert.equal(response.assetId, id);
  assert.equal(response.kind, 'image');
  assert.equal(response.status, 'ready');
  assert.equal(response.reused, false);
  assert.equal(response.assetRevision, 1);
  assert.equal(response.displayLocalPath, `data/assets/derived/image/${id}.display.png`);
  assert.equal(response.thumbLocalPath, `data/assets/derived/image/${id}.thumb.png`);
  assert.equal(response.url, `/data/assets/derived/image/${id}.display.png`);
  assert.ok(existsSync(path.join(assetsDir, 'derived', 'image', `${id}.display.png`)));
  assert.ok(existsSync(path.join(assetsDir, 'derived', 'image', `${id}.thumb.png`)));
  assert.equal(readIndex(assetsDir).assets[id].imageDerivativeVersion, 1);
  assert.equal(readIndex(assetsDir).assets[id].originalLocalPath, `data/assets/original/${id}.png`);
});

test('re-importing the same bytes is reported as reused and bumps the revision', async () => {
  let derivativeCalls = 0;
  const { assetsDir, operations } = createRig({
      createImageFromPath: () => {
        derivativeCalls += 1;
        return createFakeImage();
      },
    }),
    sourcePath = writeSourceFile('.png', 'stable-bytes'),
    first = await operations.importAssetToLibrary({ path: sourcePath, name: 'a.png', type: 'image/png' }),
    firstCreatedAt = readIndex(assetsDir).assets[first.assetId].createdAt,
    second = await operations.importAssetToLibrary({ path: sourcePath, name: 'a.png', type: 'image/png' });
  assert.equal(first.reused, false);
  assert.equal(second.reused, true);
  assert.equal(second.assetId, first.assetId);
  assert.equal(second.assetRevision, 2);
  assert.equal(derivativeCalls, 1);
  assert.equal(readIndex(assetsDir).assets[first.assetId].createdAt, firstCreatedAt);
  assert.notEqual(second.assetUpdatedAt, first.assetUpdatedAt);
});

test('an injected createImageDerivatives stub switches the derivative version to 2', async () => {
  const { assetsDir, operations } = createRig({
      createImageDerivatives: async () => ({
        originalWidth: 100,
        originalHeight: 50,
        displayPng: Buffer.from('display'),
        thumbPng: Buffer.from('thumb'),
      }),
    }),
    sourcePath = writeSourceFile('.png', 'derivative-v2'),
    id = sha256Of(Buffer.from('derivative-v2')),
    response = await operations.importAssetToLibrary({ path: sourcePath, name: 'a.png', type: 'image/png' });
  assert.equal(response.status, 'ready');
  assert.equal(readIndex(assetsDir).assets[id].imageDerivativeVersion, 2);
  assert.equal(readIndex(assetsDir).assets[id].originalWidth, 100);
  assert.equal(
    readFileSync(path.join(assetsDir, 'derived', 'image', `${id}.thumb.png`), 'utf8'),
    'thumb',
  );
});

test('incomplete derivatives fail the import into a partial record', async () => {
  const { assetsDir, calls, operations } = createRig({
      createImageDerivatives: async () => ({ originalWidth: 0, originalHeight: 0, displayPng: null, thumbPng: null }),
    }),
    sourcePath = writeSourceFile('.png', 'bad-derivatives'),
    id = sha256Of(Buffer.from('bad-derivatives')),
    response = await operations.importAssetToLibrary({ path: sourcePath, name: 'a.png', type: 'image/png' });
  assert.equal(response.status, 'partial');
  assert.equal(response.assetRevision, 1);
  assert.equal(calls.warnings.length, 1);
  assert.match(calls.warnings[0][0], /image asset derivative failed/);
  assert.equal(readIndex(assetsDir).assets[id].status, 'partial');
  assert.equal(readIndex(assetsDir).assets[id].imageDerivativeVersion, 0);
  assert.equal(readIndex(assetsDir).assets[id].error, 'Incomplete image derivatives');
});

test('an image with unusable dimensions degrades to an empty derivative set', async () => {
  const { operations } = createRig({ createImageFromPath: () => createFakeImage({ empty: true }) }),
    sourcePath = writeSourceFile('.jpg', 'empty-image'),
    response = await operations.importAssetToLibrary({ path: sourcePath, name: 'a.jpg', type: 'image/jpeg' });
  assert.equal(response.status, 'ready');
  assert.equal(response.displayLocalPath, '');
  assert.equal(response.thumbLocalPath, '');
});

test('an oversized image is downscaled through the injected factory', async () => {
  const resized = [];
  const { assetsDir, operations } = createRig({
      createImageFromPath: () => {
        const image = createFakeImage({ width: 4000, height: 2000 });
        return {
          ...image,
          resize: ({ width: resizedWidth, height: resizedHeight }) => {
            resized.push([resizedWidth, resizedHeight]);
            return { toPNG: () => Buffer.from('resized') };
          },
        };
      },
    }),
    sourcePath = writeSourceFile('.png', 'oversized'),
    id = sha256Of(Buffer.from('oversized')),
    response = await operations.importAssetToLibrary({ path: sourcePath, name: 'a.png', type: 'image/png' });
  assert.deepEqual(resized, [
    [1280, 640],
    [320, 160],
  ]);
  assert.equal(response.status, 'ready');
  assert.equal(readIndex(assetsDir).assets[id].originalWidth, 4000);
  assert.equal(readIndex(assetsDir).assets[id].originalHeight, 2000);
});

test('bytes payloads import without touching the filesystem source', async () => {
  const { operations } = createRig(),
    bytes = Buffer.from('in-memory-bytes'),
    id = sha256Of(bytes),
    response = await operations.importAssetToLibrary({ bytes: bytes, name: 'inline.webp', type: 'image/webp' });
  assert.equal(response.assetId, id);
  assert.equal(response.kind, 'image');
  assert.equal(response.size, bytes.length);
  assert.equal(response.filename, 'inline.webp');
});

test('bad import payloads are rejected with the original Chinese messages', async () => {
  const { operations } = createRig();
  await assert.rejects(operations.importAssetToLibrary({}), /缺少文件路径或文件内容/);
  await assert.rejects(
    operations.importAssetToLibrary({ path: path.join('relative', 'missing.png') }),
    /ENOENT/,
  );
  await assert.rejects(operations.importAssetToLibrary({ path: process.cwd() }), /只支持导入文件/);
});

test('a video needing a proxy stays in processing and clears the display path', async () => {
  const { calls, operations } = createRig({
      probeVideoPlaybackInfo: () => ({ codecName: 'hevc', pixelFormat: 'yuv420p', width: 1920, height: 1080, duration: 8, fps: 24 }),
    }),
    sourcePath = writeSourceFile('.mp4', 'video-needs-proxy'),
    response = await operations.importAssetToLibrary({ path: sourcePath, name: 'clip.mp4', type: 'video/mp4' });
  assert.equal(response.kind, 'video');
  assert.equal(response.status, 'processing');
  assert.equal(response.videoProxyStatus, 'processing');
  assert.equal(response.videoProxyVersion, '');
  assert.equal(response.displayLocalPath, '');
  assert.equal(response.videoCodec, 'hevc');
  assert.equal(response.videoWidth, 1920);
  assert.equal(response.videoDuration, 8);
  assert.equal(calls.enqueued[0].kind, 'videoPoster');
  assert.equal(response.mediaTaskKind, 'videoPoster');
});

test('a browser friendly video needs no proxy but still waits for its poster', async () => {
  const { calls, operations } = createRig({
      probeVideoPlaybackInfo: () => ({ codecName: 'h264', pixelFormat: 'yuv420p', width: 640, height: 360, duration: 2, fps: 30 }),
    }),
    sourcePath = writeSourceFile('.mp4', 'video-friendly'),
    response = await operations.importAssetToLibrary({ path: sourcePath, name: 'clip.mp4', type: 'video/mp4' });
  assert.equal(response.videoProxyStatus, 'not_required');
  assert.equal(response.videoProxyVersion, '');
  assert.equal(response.displayLocalPath, '');
  assert.equal(response.status, 'processing');
  assert.equal(response.mediaTaskKind, 'videoPoster');
  assert.equal(calls.enqueued[0].kind, 'videoPoster');
});

test('a metadata probe failure keeps the video in processing and logs a warning', async () => {
  const { calls, operations } = createRig({
      probeVideoPlaybackInfo: () => {
        throw new Error('ffprobe exploded');
      },
    }),
    sourcePath = writeSourceFile('.mp4', 'video-broken'),
    response = await operations.importAssetToLibrary({ path: sourcePath, name: 'clip.mp4', type: 'video/mp4' });
  assert.equal(response.status, 'processing');
  assert.equal(response.videoProxyStatus, 'processing');
  assert.equal(response.videoProxyVersion, '');
  assert.equal(response.mediaTaskError, '');
  assert.equal(calls.warnings.length, 1);
  assert.match(calls.warnings[0][0], /video asset metadata probe failed/);
});

test('an existing current proxy is reported as generated', async () => {
  const { assetsDir, operations } = createRig({
      probeVideoPlaybackInfo: () => ({ codecName: 'hevc', pixelFormat: 'yuv420p', width: 1920, height: 1080, duration: 8, fps: 24 }),
    }),
    sourcePath = writeSourceFile('.mp4', 'video-with-proxy'),
    payload = readFileSync(sourcePath),
    id = sha256Of(payload);
  writeProxyFile(assetsDir, id);
  writeFileSync(
    path.join(assetsDir, 'assets.index.json'),
    JSON.stringify({
      version: 1,
      assets: {
        [id]: {
          assetId: id,
          kind: 'video',
          videoProxyVersion: 'v2-1280',
          displayLocalPath: `data/assets/derived/video/${id}.proxy-v2-1280.mp4`,
          posterLocalPath: `data/assets/derived/video/${id}.poster.jpg`,
        },
      },
    }),
  );
  const response = await operations.importAssetToLibrary({ path: sourcePath, name: 'clip.mp4', type: 'video/mp4' });
  assert.equal(response.videoProxyStatus, 'generated');
  assert.equal(response.videoProxyVersion, 'v2-1280');
  assert.equal(response.status, 'ready');
  assert.equal(
    response.displayLocalPath,
    `data/assets/derived/video/${id}.proxy-v2-1280.mp4`,
  );
});

test('an audio import waits for its waveform and a plain file is ready', async () => {
  const { calls, operations } = createRig(),
    audioPath = writeSourceFile('.mp3', 'audio-bytes'),
    filePath = writeSourceFile('.txt', 'plain-bytes'),
    audio = await operations.importAssetToLibrary({ path: audioPath, name: 'voice.mp3', type: 'audio/mpeg' }),
    plain = await operations.importAssetToLibrary({ path: filePath, name: 'notes.txt', type: 'text/plain' });
  assert.equal(audio.kind, 'audio');
  assert.equal(audio.status, 'processing');
  assert.equal(calls.enqueued[0].kind, 'audioWaveform');
  assert.equal(plain.kind, 'file');
  assert.equal(plain.status, 'ready');
  assert.equal(calls.enqueued.length, 1);
});

test('a re-imported audio record keeps its waveform and is immediately ready', async () => {
  const { assetsDir, operations } = createRig(),
    sourcePath = writeSourceFile('.mp3', 'audio-with-waveform'),
    id = sha256Of(Buffer.from('audio-with-waveform'));
  writeFileSync(
    path.join(assetsDir, 'assets.index.json'),
    JSON.stringify({
      version: 1,
      assets: {
        [id]: {
          assetId: id,
          kind: 'audio',
          waveformLocalPath: 'data/assets/derived/audio/x.waveform.json',
          originalLocalPath: `data/assets/original/${id}.mp3`,
        },
      },
    }),
  );
  const response = await operations.importAssetToLibrary({
    path: sourcePath,
    name: 'voice.mp3',
    type: 'audio/mpeg',
  });
  assert.equal(response.status, 'ready');
  assert.equal(response.reused, false);
  assert.equal(response.waveformLocalPath, 'data/assets/derived/audio/x.waveform.json');
  assert.equal(response.mediaTaskKind, '');
  assert.equal(readIndex(assetsDir).assets[id].waveformLocalPath, 'data/assets/derived/audio/x.waveform.json');
});

test('updateAssetRecord patches through the coordinator and refreshes updatedAt', async () => {
  const { assetsDir, operations } = createRig(),
    sourcePath = writeSourceFile('.txt', 'patch-me'),
    imported = await operations.importAssetToLibrary({ path: sourcePath, name: 'a.txt', type: 'text/plain' }),
    patched = operations.updateAssetRecord(imported.assetId, { status: 'processing', mediaTaskId: 'task-1' });
  assert.equal(patched.assetRevision, 2);
  assert.equal(patched.mediaTaskId, 'task-1');
  assert.equal(patched.status, 'processing');
  assert.equal(readIndex(assetsDir).assets[imported.assetId].mediaTaskId, 'task-1');
  assert.equal(operations.updateAssetRecord('missing-asset', { status: 'ready' }), null);
});

test('asset updates are buffered, published and drained exactly once', async () => {
  const { calls, operations } = createRig({ shouldBufferAssetUpdates: () => true }),
    sourcePath = writeSourceFile('.txt', 'buffer-me'),
    imported = await operations.importAssetToLibrary({ path: sourcePath, name: 'a.txt', type: 'text/plain' });
  assert.equal(calls.published.length, 0);
  operations.sendAssetUpdated({ ...imported, status: 'ready' });
  operations.sendAssetUpdated({ ...imported, status: 'processing' });
  assert.equal(calls.published.length, 2);
  const drained = operations.consumeAssetUpdateEvents();
  assert.equal(drained.length, 2);
  assert.equal(drained[0].assetId, imported.assetId);
  assert.equal(drained[0].status, 'ready');
  assert.deepEqual(operations.consumeAssetUpdateEvents(), []);
});

test('the buffered event queue drops the oldest entries beyond 200', () => {
  const { operations } = createRig({ shouldBufferAssetUpdates: () => true });
  for (let i = 0; i < 205; i += 1) operations.sendAssetUpdated({ assetId: `asset-${i}`, kind: 'file' });
  const drained = operations.consumeAssetUpdateEvents();
  assert.equal(drained.length, 200);
  assert.equal(drained[0].assetId, 'asset-5');
  assert.equal(drained.at(-1).assetId, 'asset-204');
});

test('a null asset never publishes and buffering can be disabled', async () => {
  const { calls, operations } = createRig({ shouldBufferAssetUpdates: () => true });
  assert.equal(operations.sendAssetUpdated(null), undefined);
  assert.equal(operations.sendAssetUpdated(undefined), undefined);
  assert.deepEqual(calls.published, []);
  const other = createRig({ shouldBufferAssetUpdates: () => false });
  other.operations.sendAssetUpdated({ assetId: 'x', kind: 'file' });
  assert.deepEqual(other.operations.consumeAssetUpdateEvents(), []);
  assert.equal(other.calls.published.length, 1);
});

test('toAssetLocalPath and isVideoAssetReady follow the proxy contract', async () => {
  const { assetsDir, operations } = createRig();
  assert.equal(operations.toAssetLocalPath('derived', 'video', 'a.mp4'), 'data/assets/derived/video/a.mp4');
  assert.equal(operations.toAssetLocalPath('original', '', 'a.mp4'), 'data/assets/original/a.mp4');
  assert.equal(operations.isVideoAssetReady({ kind: 'image' }), false);
  assert.equal(operations.isVideoAssetReady({ kind: 'video' }), false);
  assert.equal(
    operations.isVideoAssetReady({ kind: 'video', posterLocalPath: 'p.jpg', videoProxyStatus: 'not_required' }),
    true,
  );
  const assetId = 'c'.repeat(64),
    asset = {
      assetId: assetId,
      kind: 'video',
      posterLocalPath: 'p.jpg',
      displayLocalPath: `data/assets/derived/video/${assetId}.proxy-v2-1280.mp4`,
      videoProxyStatus: 'generated',
      videoProxyVersion: 'v2-1280',
    };
  assert.equal(operations.isVideoAssetReady(asset), false);
  writeProxyFile(assetsDir, assetId);
  assert.equal(operations.isVideoAssetReady(asset), true);
  assert.equal(operations.isVideoAssetReady({ ...asset, videoProxyVersion: 'v1' }), false);
});

test('import logging stays quiet unless it is enabled', async () => {
  const quiet = createRig({ isImportLoggingEnabled: () => false }),
    loud = createRig({ isImportLoggingEnabled: () => true });
  await quiet.operations.importAssetToLibrary({
    bytes: Buffer.from('quiet'),
    name: 'a.txt',
    type: 'text/plain',
  });
  await loud.operations.importAssetToLibrary({
    bytes: Buffer.from('loud'),
    name: 'b.txt',
    type: 'text/plain',
  });
  assert.equal(quiet.calls.logged.length, 0);
  assert.equal(loud.calls.logged.length, 1);
  assert.equal(loud.calls.logged[0][0], '[asset-import] done');
  assert.equal(loud.calls.logged[0][1].assetId, sha256Of(Buffer.from('loud')));
  assert.equal(loud.calls.logged[0][1].kind, 'file');
  assert.equal(loud.calls.logged[0][1].reused, false);
});
