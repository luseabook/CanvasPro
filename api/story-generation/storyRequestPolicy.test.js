import test from 'node:test';
import assert from 'node:assert/strict';
import { withStoryRequestPolicy, withReplicationRequestPolicy } from './storyRequestPolicy.js';

test('withStoryRequestPolicy forces streaming with idle/total timeouts', () => {
  const payload = { model: 'm', prompt: 'p', stream: false };
  const result = withStoryRequestPolicy(payload);
  assert.deepEqual(result, {
    model: 'm',
    prompt: 'p',
    stream: true,
    streamTimeouts: { idleMs: 180000, totalMs: 1800000 },
  });
  assert.notEqual(result, payload);
  assert.equal(payload.stream, false);
});

test('withStoryRequestPolicy overrides caller-supplied streamTimeouts', () => {
  const result = withStoryRequestPolicy({ streamTimeouts: { idleMs: 1 } });
  assert.deepEqual(result.streamTimeouts, { idleMs: 180000, totalMs: 1800000 });
});

test('withReplicationRequestPolicy wraps the request only for video-replication', async () => {
  const seen = [];
  const request = async (payload) => {
    seen.push(payload);
    return 'ok';
  };
  const wrapped = withReplicationRequestPolicy(request, { sourceMode: 'video-replication' });
  assert.notEqual(wrapped, request);
  assert.equal(await wrapped({ prompt: 'x' }), 'ok');
  assert.deepEqual(seen, [
    { prompt: 'x', stream: true, streamTimeouts: { idleMs: 180000, totalMs: 1800000 } },
  ]);
});

test('withReplicationRequestPolicy returns the same function for other modes', () => {
  const request = () => {};
  assert.equal(withReplicationRequestPolicy(request, { sourceMode: 'idea' }), request);
  assert.equal(withReplicationRequestPolicy(request, {}), request);
  assert.equal(withReplicationRequestPolicy(request), request);
});

test('withReplicationRequestPolicy rejects a null options object', () => {
  assert.throws(() => withReplicationRequestPolicy(() => {}, null), TypeError);
});

test('withStoryRequestPolicy works without a payload', () => {
  assert.deepEqual(withStoryRequestPolicy(), {
    stream: true,
    streamTimeouts: { idleMs: 180000, totalMs: 1800000 },
  });
});
