import test from 'node:test';
import assert from 'node:assert/strict';
import { deferredMediaPreview, withDeferredMediaFiles } from './deferredMediaApi.js';

const HOST_OFFLINE_MESSAGE = '读取所选素材失败，请确认房主仍在线';

test('deferredMediaApi: preview only resolves deferred or hosted asset paths', () => {
  assert.deepEqual(deferredMediaPreview({ localPath: 'data/assets/_deferred/a.png' }), {
    localPath: 'data/assets/_deferred/a.png',
    url: '/data/assets/_deferred/a.png',
  });
  assert.deepEqual(deferredMediaPreview({ localPath: '/data/assets/_hosted/b.mp4' }), {
    localPath: 'data/assets/_hosted/b.mp4',
    url: '/data/assets/_hosted/b.mp4',
  });
  assert.equal(deferredMediaPreview({ localPath: 'data/assets/plain.png' }), null);
  assert.equal(deferredMediaPreview({ localPath: '/output/clip.mp4' }), null);
  assert.equal(deferredMediaPreview({}), null);
  assert.equal(deferredMediaPreview(), null);
});

test('deferredMediaApi: withDeferredMediaFiles short-circuits when nothing is deferred', async () => {
  const calls = [];
  const result = await withDeferredMediaFiles(
    { localPath: 'data/assets/a.png', nested: [{ url: '/output/x.mp4' }] },
    () => (calls.push('run'), 'ok'),
    (paths) => (calls.push(paths), Promise.resolve({ success: true })),
  );
  assert.equal(result, 'ok');
  assert.deepEqual(calls, ['run']);
});

test('deferredMediaApi: withDeferredMediaFiles resolves deferred paths before running', async () => {
  const requested = [];
  const result = await withDeferredMediaFiles(
    {
      a: 'data/assets/_deferred/a.png',
      b: ['/data/assets/_hosted/b.mp4', 'data/assets/plain.png', 'data/assets/_deferred/a.png'],
    },
    () => 'done',
    (paths) => (requested.push(paths), Promise.resolve({ success: true, data: {} })),
  );
  assert.equal(result, 'done');
  assert.deepEqual(requested, [['data/assets/_deferred/a.png', 'data/assets/_hosted/b.mp4']]);
});

test('deferredMediaApi: withDeferredMediaFiles tolerates cyclic payloads', async () => {
  const node = { name: 'x' };
  node.self = node;
  assert.equal(
    await withDeferredMediaFiles(
      node,
      () => 'ok',
      () => Promise.reject(new Error('resolver should not be used')),
    ),
    'ok',
  );
});

test('deferredMediaApi: withDeferredMediaFiles rejects when the host cannot resolve files', async () => {
  await assert.rejects(
    () =>
      withDeferredMediaFiles(
        { localPath: 'data/assets/_deferred/a.png' },
        () => 'unreachable',
        () => Promise.resolve({ success: false, message: HOST_OFFLINE_MESSAGE }),
      ),
    new RegExp(HOST_OFFLINE_MESSAGE),
  );
  await assert.rejects(
    () =>
      withDeferredMediaFiles(
        { localPath: 'data/assets/_hosted/a.png' },
        () => 'unreachable',
        () => Promise.resolve({ success: false }),
      ),
    new RegExp(HOST_OFFLINE_MESSAGE),
  );
});
