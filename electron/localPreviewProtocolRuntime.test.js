import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  createLocalPreviewProtocolRuntime,
  getLocalPreviewMimeType,
  isPreviewableLocalMedia,
  parseLocalPreviewRange,
} from './localPreviewProtocolRuntime.js';

const SCHEME = 'aic-local-preview';
const APP_ORIGIN = 'http://127.0.0.1:8123';

class FakeResponse {
  constructor(body, init) {
    this.body = body;
    this.init = init || {};
  }
}

function createHarness(overrides = {}) {
  const state = { files: new Map(), handles: [], warnings: [], nowValue: 0, tokenSeq: 0 };
  const measureStat = (target) => {
    const entry = state.files.get(target);
    if (!entry) throw new Error('ENOENT ' + target);
    return entry;
  };
  const config = {
    protocol: {
      handle(scheme, handler) {
        state.handles.push({ scheme: scheme, handler: handler });
      },
    },
    scheme: SCHEME,
    appOrigin: APP_ORIGIN,
    ttlMs: 1000,
    resolveLocalVirtualPath: (value) => (value ? path.resolve('/virtual', value) : ''),
    now: () => state.nowValue,
    createToken: () => {
      state.tokenSeq += 1;
      return 'token' + state.tokenSeq;
    },
    resolveRealPath: (value) => value,
    statFile: measureStat,
    createFileReadStream: (target, options) => ({ path: target, options: options }),
    toWebStream: (stream) => ({ stream: stream }),
    ResponseCtor: FakeResponse,
    logWarning: (...args) => state.warnings.push(args),
  };
  return { runtime: createLocalPreviewProtocolRuntime({ ...config, ...overrides }), state: state };
}

function registerFile(state, target, size = 64) {
  state.files.set(target, { size: size, isFile: () => true });
  return target;
}

function registerNonFile(state, target) {
  state.files.set(target, { size: 0, isFile: () => false });
  return target;
}

function handleRequest(harness, url, rangeHeader = null) {
  return harness.state.handles[0].handler({
    url: url,
    headers: { get: (name) => (name === 'range' ? rangeHeader : null) },
  });
}

test('createLocalPreviewProtocolRuntime rejects a protocol without handle', () => {
  assert.throws(() => createLocalPreviewProtocolRuntime({}), {
    name: 'TypeError',
    message: /protocol\.handle must be a function/,
  });
  assert.throws(() => createLocalPreviewProtocolRuntime({ protocol: {} }), {
    name: 'TypeError',
    message: /protocol\.handle must be a function/,
  });
});

test('createLocalPreviewProtocolRuntime requires its injected collaborators', () => {
  const protocol = { handle() {} };
  assert.throws(
    () => createLocalPreviewProtocolRuntime({ protocol: protocol, resolveLocalVirtualPath: null }),
    { name: 'TypeError', message: /resolveLocalVirtualPath must be a function/ },
  );
  assert.throws(
    () =>
      createLocalPreviewProtocolRuntime({
        protocol: protocol,
        resolveLocalVirtualPath: (value) => value,
        now: null,
      }),
    { name: 'TypeError', message: /now must be a function/ },
  );
  assert.throws(
    () =>
      createLocalPreviewProtocolRuntime({
        protocol: protocol,
        resolveLocalVirtualPath: (value) => value,
        createToken: null,
      }),
    { name: 'TypeError', message: /createToken must be a function/ },
  );
});

test('parseLocalPreviewRange parses bounded, open-ended and suffix ranges', () => {
  assert.deepEqual(parseLocalPreviewRange('bytes=0-9', 100), { start: 0, end: 9 });
  assert.deepEqual(parseLocalPreviewRange('bytes=10-', 100), { start: 10, end: 99 });
  assert.deepEqual(parseLocalPreviewRange('bytes=-10', 100), { start: 90, end: 99 });
  assert.deepEqual(parseLocalPreviewRange('bytes=0-', 1), { start: 0, end: 0 });
});

test('parseLocalPreviewRange clamps a range that runs past the end', () => {
  assert.deepEqual(parseLocalPreviewRange('bytes=95-200', 100), { start: 95, end: 99 });
  assert.deepEqual(parseLocalPreviewRange('bytes=-500', 100), { start: 0, end: 99 });
});

test('parseLocalPreviewRange rejects malformed or unsatisfiable ranges', () => {
  assert.equal(parseLocalPreviewRange(undefined, 100), null);
  assert.equal(parseLocalPreviewRange('items=0-9', 100), null);
  assert.equal(parseLocalPreviewRange('bytes=abc-def', 100), null);
  assert.equal(parseLocalPreviewRange('bytes=100-', 100), null);
  assert.equal(parseLocalPreviewRange('bytes=20-10', 100), null);
  assert.equal(parseLocalPreviewRange('bytes=-0', 100), null);
});

test('parseLocalPreviewRange rejects invalid sizes', () => {
  assert.equal(parseLocalPreviewRange('bytes=0-9', 0), null);
  assert.equal(parseLocalPreviewRange('bytes=0-9', 'x'), null);
  assert.equal(parseLocalPreviewRange('bytes=0-9', 10.5), null);
  assert.equal(parseLocalPreviewRange('bytes=0-9', Number.MAX_SAFE_INTEGER + 2), null);
});

test('isPreviewableLocalMedia trusts an image, video or audio mime type', () => {
  assert.equal(isPreviewableLocalMedia({ type: 'IMAGE/PNG' }, ''), true);
  assert.equal(isPreviewableLocalMedia({ type: 'video/mp4' }, ''), true);
  assert.equal(isPreviewableLocalMedia({ type: 'audio/mpeg' }, ''), true);
  assert.equal(isPreviewableLocalMedia({ type: 'application/pdf' }, ''), false);
});

test('isPreviewableLocalMedia falls back to the media file extension', () => {
  assert.equal(isPreviewableLocalMedia({}, '/tmp/Clip.MP4'), true);
  assert.equal(isPreviewableLocalMedia({}, path.join('/tmp', 'voice.flac')), true);
  assert.equal(isPreviewableLocalMedia({}, '/tmp/notes.txt'), false);
  assert.equal(isPreviewableLocalMedia({}, ''), false);
  assert.equal(isPreviewableLocalMedia(), false);
});

test('getLocalPreviewMimeType prefers an explicit mime type', () => {
  assert.equal(getLocalPreviewMimeType('/tmp/x.bin', 'image/png'), 'image/png');
  assert.equal(getLocalPreviewMimeType('/tmp/x.mov', 'video/quicktime'), 'video/quicktime');
});

test('getLocalPreviewMimeType maps known extensions case-insensitively', () => {
  assert.equal(getLocalPreviewMimeType('/tmp/x.PNG'), 'image/png');
  assert.equal(getLocalPreviewMimeType('/tmp/x.m4v'), 'video/mp4');
  assert.equal(getLocalPreviewMimeType('/tmp/x.flac'), 'audio/flac');
  assert.equal(getLocalPreviewMimeType('/tmp/x.unknown'), 'application/octet-stream');
  assert.equal(getLocalPreviewMimeType(''), 'application/octet-stream');
});

test('createUrl registers an absolute file and returns a preview url', () => {
  const harness = createHarness();
  const target = registerFile(harness.state, path.resolve('/assets', 'clip one.mp4'), 2048);
  harness.state.nowValue = 100;
  const url = harness.runtime.createUrl({ path: target, type: 'video/mp4' });
  assert.equal(url, SCHEME + '://preview/token1/clip%20one.mp4');
  assert.equal(harness.state.tokenSeq, 1);
});

test('createUrl resolves a virtual path through the injected resolver', () => {
  const harness = createHarness();
  const resolved = path.resolve('/virtual', 'clip.mp4');
  registerFile(harness.state, resolved);
  const url = harness.runtime.createUrl({ src: 'clip.mp4' });
  assert.equal(url, SCHEME + '://preview/token1/clip.mp4');
  assert.equal(url.includes(encodeURIComponent(path.basename(resolved))), true);
});

test('createUrl prefers an explicit path over virtual resolution', () => {
  const harness = createHarness();
  const target = registerFile(harness.state, path.resolve('/assets', 'explicit.png'));
  const url = harness.runtime.createUrl({ path: target, localPath: 'ignored.png' });
  assert.equal(url, SCHEME + '://preview/token1/explicit.png');
});

test('createUrl rejects unresolved, relative, non-file and non-media requests', () => {
  const harness = createHarness();
  registerNonFile(harness.state, path.resolve('/assets'));
  registerFile(harness.state, path.resolve('/assets', 'notes.txt'));
  assert.throws(() => harness.runtime.createUrl({}), { message: '缺少文件路径' });
  assert.throws(() => harness.runtime.createUrl({ path: 'media/clip.mp4' }), {
    message: '文件路径必须是绝对路径',
  });
  assert.throws(() => harness.runtime.createUrl({ path: path.resolve('/assets') }), {
    message: '只支持预览文件',
  });
  assert.throws(() => harness.runtime.createUrl({ path: path.resolve('/assets', 'notes.txt') }), {
    message: '只支持图片或视频快速预览',
  });
});

test('createUrl rejects an empty token', () => {
  const harness = createHarness({ createToken: () => '   ' });
  const target = registerFile(harness.state, path.resolve('/assets', 'a.png'));
  assert.throws(() => harness.runtime.createUrl({ path: target }), { message: '无法创建预览令牌' });
});

test('createUrl bumps the url whenever a token is minted', () => {
  const harness = createHarness();
  const target = registerFile(harness.state, path.resolve('/assets', 'a.png'));
  const first = harness.runtime.createUrl({ path: target });
  const second = harness.runtime.createUrl({ path: target });
  assert.equal(first, SCHEME + '://preview/token1/a.png');
  assert.equal(second, SCHEME + '://preview/token2/a.png');
});

test('install registers the scheme once and is idempotent', () => {
  const harness = createHarness();
  assert.equal(harness.runtime.install(), true);
  assert.equal(harness.runtime.install(), false);
  assert.equal(harness.state.handles.length, 1);
  assert.equal(harness.state.handles[0].scheme, SCHEME);
});

test('clearExpired drops entries exactly at their ttl and keeps earlier ones', () => {
  const harness = createHarness();
  const target = registerFile(harness.state, path.resolve('/assets', 'a.png'));
  harness.runtime.install();
  const url = harness.runtime.createUrl({ path: target });
  harness.state.nowValue = 999;
  harness.runtime.clearExpired();
  assert.equal(handleRequest(harness, url).init.status, 200);
  harness.state.nowValue = 1000;
  harness.runtime.clearExpired();
  assert.equal(handleRequest(harness, url).init.status, 404);
});

test('expired entries are swept when the next url is minted', () => {
  const harness = createHarness();
  const target = registerFile(harness.state, path.resolve('/assets', 'a.png'));
  harness.runtime.install();
  const stale = harness.runtime.createUrl({ path: target });
  harness.state.nowValue = 1000;
  const fresh = harness.runtime.createUrl({ path: target });
  assert.equal(handleRequest(harness, stale).init.status, 404);
  assert.equal(handleRequest(harness, fresh).init.status, 200);
});

test('the protocol handler streams a full file with cors and cache headers', () => {
  const harness = createHarness();
  const target = registerFile(harness.state, path.resolve('/assets', 'a.png'), 64);
  harness.runtime.install();
  const url = harness.runtime.createUrl({ path: target, type: 'image/png' });
  const response = handleRequest(harness, url);
  assert.equal(response.init.status, 200);
  assert.deepEqual(response.init.headers, {
    'Content-Type': 'image/png',
    'Accept-Ranges': 'bytes',
    'Access-Control-Allow-Origin': APP_ORIGIN,
    'Cache-Control': 'private, max-age=1, immutable',
    'Content-Length': '64',
  });
  assert.equal(response.body.stream.path, target);
  assert.equal(response.body.stream.options, undefined);
});

test('the protocol handler answers a byte range with 206 and a partial stream', () => {
  const harness = createHarness();
  const target = registerFile(harness.state, path.resolve('/assets', 'a.mp4'), 64);
  harness.runtime.install();
  const url = harness.runtime.createUrl({ path: target, type: 'video/mp4' });
  const response = handleRequest(harness, url, 'bytes=8-15');
  assert.equal(response.init.status, 206);
  assert.equal(response.init.headers['Content-Range'], 'bytes 8-15/64');
  assert.equal(response.init.headers['Content-Length'], '8');
  assert.deepEqual(response.body.stream.options, { start: 8, end: 15 });
});

test('the protocol handler floors the cache max-age from the ttl', () => {
  const harness = createHarness({ ttlMs: 0 });
  const target = registerFile(harness.state, path.resolve('/assets', 'a.png'));
  harness.runtime.install();
  const url = harness.runtime.createUrl({ path: target });
  const response = handleRequest(harness, url);
  assert.equal(response.init.headers['Cache-Control'], 'private, max-age=0, immutable');
});

test('the protocol handler returns 404 for an unknown preview token', () => {
  const harness = createHarness();
  harness.runtime.install();
  const response = handleRequest(harness, SCHEME + '://preview/missing/a.png');
  assert.equal(response.init.status, 404);
  assert.equal(response.body, 'Preview not found');
});

test('the protocol handler drops an entry whose target stopped being a file', () => {
  const harness = createHarness();
  const target = registerFile(harness.state, path.resolve('/assets', 'a.png'));
  harness.runtime.install();
  const url = harness.runtime.createUrl({ path: target });
  registerNonFile(harness.state, target);
  assert.equal(handleRequest(harness, url).init.status, 404);
  assert.equal(handleRequest(harness, url).init.status, 404);
  assert.equal(harness.state.warnings.length, 0);
});

test('the protocol handler logs and answers 500 when streaming fails', () => {
  const harness = createHarness({
    createFileReadStream: () => {
      throw new Error('boom');
    },
  });
  const target = registerFile(harness.state, path.resolve('/assets', 'a.png'));
  harness.runtime.install();
  const url = harness.runtime.createUrl({ path: target });
  const response = handleRequest(harness, url);
  assert.equal(response.init.status, 500);
  assert.equal(response.body, 'Preview failed');
  assert.equal(harness.state.warnings.length, 1);
  assert.equal(harness.state.warnings[0][0], '[electron] local preview failed:');
  assert.equal(harness.state.warnings[0][1].message, 'boom');
});
