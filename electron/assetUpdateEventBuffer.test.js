import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ASSET_UPDATE_EVENT_LIMIT,
  createAssetUpdateEventBuffer,
} from './assetUpdateEventBuffer.js';

test('the buffer keeps pushes in order and drains them once', () => {
  const buffer = createAssetUpdateEventBuffer();
  buffer.push({ assetId: 'a' });
  buffer.push({ assetId: 'b' });
  assert.deepEqual(buffer.consume(), [{ assetId: 'a' }, { assetId: 'b' }]);
  assert.deepEqual(buffer.consume(), []);
});

test('the buffer ignores falsy events so a failed send cannot add a hole', () => {
  const buffer = createAssetUpdateEventBuffer();
  buffer.push(null);
  buffer.push(undefined);
  buffer.push('');
  buffer.push({ assetId: 'a' });
  assert.deepEqual(buffer.consume(), [{ assetId: 'a' }]);
});

test('the buffer drops the oldest event past the bound', () => {
  const buffer = createAssetUpdateEventBuffer({ limit: 200 });
  for (let index = 0; index < 205; index += 1) buffer.push({ assetId: String(index) });
  const drained = buffer.consume();
  assert.equal(drained.length, 200);
  assert.deepEqual(drained[0], { assetId: '5' });
  assert.deepEqual(drained.at(-1), { assetId: '204' });
  assert.equal(ASSET_UPDATE_EVENT_LIMIT, 200);
});

test('a non-positive or non-numeric limit falls back to the default bound', () => {
  const zero = createAssetUpdateEventBuffer({ limit: 0 });
  for (let index = 0; index < ASSET_UPDATE_EVENT_LIMIT + 1; index += 1) zero.push({ index });
  assert.equal(zero.consume().length, ASSET_UPDATE_EVENT_LIMIT);

  const nan = createAssetUpdateEventBuffer({ limit: Number.NaN });
  nan.push({ index: 0 });
  assert.deepEqual(nan.consume(), [{ index: 0 }]);
});

test('each buffer owns its events', () => {
  const first = createAssetUpdateEventBuffer();
  const second = createAssetUpdateEventBuffer();
  first.push({ assetId: 'a' });
  assert.deepEqual(second.consume(), []);
  assert.deepEqual(first.consume(), [{ assetId: 'a' }]);
});
