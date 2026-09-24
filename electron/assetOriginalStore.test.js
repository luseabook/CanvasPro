import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import {
  AssetOriginalIntegrityError,
  createAssetOriginalStore,
  getExistingAssetOriginalFilename,
  materializeAssetOriginal,
} from './assetOriginalStore.js';

function sha256Of(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}
function createTempDir() {
  return mkdtempSync(path.join(tmpdir(), 'aic-asset-original-'));
}

test('getExistingAssetOriginalFilename only trusts sha-named files under data/assets/original', () => {
  const sha = 'a'.repeat(64);
  assert.equal(
    getExistingAssetOriginalFilename(sha, { originalLocalPath: `data/assets/original/${sha}.png` }),
    `${sha}.png`,
  );
  assert.equal(
    getExistingAssetOriginalFilename(sha, { originalLocalPath: `data/assets/original/${sha}` }),
    sha,
  );
  assert.equal(
    getExistingAssetOriginalFilename(sha, {
      originalLocalPath: `data\\assets\\original\\${sha}.webp`,
    }),
    `${sha}.webp`,
  );
  assert.equal(
    getExistingAssetOriginalFilename(sha, { originalLocalPath: `data/assets/derived/${sha}.png` }),
    '',
  );
  assert.equal(
    getExistingAssetOriginalFilename(sha, { originalLocalPath: `data/assets/original/${'b'.repeat(64)}.png` }),
    '',
  );
  assert.equal(
    getExistingAssetOriginalFilename(sha, { originalLocalPath: `data/assets/original/${sha}.toolongextension` }),
    '',
  );
  assert.equal(
    getExistingAssetOriginalFilename(sha, { originalLocalPath: `data/assets/original/${sha}.x.y` }),
    '',
  );
  assert.equal(getExistingAssetOriginalFilename('not-a-sha', { originalLocalPath: 'x' }), '');
  assert.equal(getExistingAssetOriginalFilename('', {}), '');
});

test('option validation rejects every malformed shape', () => {
  assert.throws(() => materializeAssetOriginal(null), /Asset original options must be an object/);
  assert.throws(
    () => materializeAssetOriginal({ expectedSha256: 'a'.repeat(64), expectedSize: 1, sourceBuffer: Buffer.from('x') }),
    /targetPath must be a non-empty string/,
  );
  assert.throws(
    () => materializeAssetOriginal({ targetPath: '  ', expectedSha256: 'a'.repeat(64), expectedSize: 1, sourceBuffer: Buffer.from('x') }),
    /targetPath must be a non-empty string/,
  );
  assert.throws(
    () => materializeAssetOriginal({ targetPath: 't', expectedSha256: 'nope', expectedSize: 1, sourceBuffer: Buffer.from('x') }),
    /expectedSha256 must be a 64-character hex string/,
  );
  assert.throws(
    () => materializeAssetOriginal({ targetPath: 't', expectedSha256: 'a'.repeat(64), expectedSize: -1, sourceBuffer: Buffer.from('x') }),
    /expectedSize must be a non-negative safe integer/,
  );
  assert.throws(
    () => materializeAssetOriginal({ targetPath: 't', expectedSha256: 'a'.repeat(64), expectedSize: 1 }),
    /Exactly one of sourcePath, sourceBuffer, sourceStream, or createSourceStream is required/,
  );
  assert.throws(
    () => materializeAssetOriginal({
      targetPath: 't',
      expectedSha256: 'a'.repeat(64),
      expectedSize: 1,
      sourceBuffer: Buffer.from('x'),
      sourcePath: 'p',
    }),
    /Exactly one of sourcePath/,
  );
  assert.throws(
    () => materializeAssetOriginal({ targetPath: 't', expectedSha256: 'a'.repeat(64), expectedSize: 1, sourcePath: 7 }),
    /sourcePath must be a string/,
  );
  assert.throws(
    () => materializeAssetOriginal({ targetPath: 't', expectedSha256: 'a'.repeat(64), expectedSize: 1, sourceBuffer: 'x' }),
    /sourceBuffer must be a Buffer, Uint8Array, or ArrayBuffer/,
  );
  assert.throws(
    () => materializeAssetOriginal({
      targetPath: 't',
      expectedSha256: 'a'.repeat(64),
      expectedSize: 1,
      createSourceStream: 'nope',
    }),
    /createSourceStream must be a function/,
  );
});

test('a brand new original is copied from a source path and verified', async () => {
  const dir = createTempDir(),
    sourcePath = path.join(dir, 'source.bin'),
    targetPath = path.join(dir, 'original', 'target.bin'),
    payload = Buffer.from('hello asset original');
  writeFileSync(sourcePath, payload);
  const result = await materializeAssetOriginal({
    targetPath: targetPath,
    expectedSha256: sha256Of(payload),
    expectedSize: payload.length,
    sourcePath: sourcePath,
  });
  assert.deepEqual(result, {
    targetPath: targetPath,
    sha256: sha256Of(payload),
    size: payload.length,
    reused: false,
    repaired: false,
    created: true,
  });
  assert.equal(readFileSync(targetPath, 'utf8'), 'hello asset original');
  assert.deepEqual(readdirSync(path.dirname(targetPath)), ['target.bin']);
});

test('an intact original is reused without touching the source again', async () => {
  const dir = createTempDir(),
    targetPath = path.join(dir, 'target.bin'),
    payload = Buffer.from('reusable');
  writeFileSync(targetPath, payload);
  let sourceReads = 0;
  const result = await materializeAssetOriginal({
    targetPath: targetPath,
    expectedSha256: sha256Of(payload),
    expectedSize: payload.length,
    createSourceStream: () => {
      sourceReads += 1;
      return Readable.from([payload]);
    },
  });
  assert.equal(result.reused, true);
  assert.equal(result.created, false);
  assert.equal(result.repaired, false);
  assert.equal(sourceReads, 0);
});

test('a truncated original is repaired in place and reported as repaired', async () => {
  const dir = createTempDir(),
    targetPath = path.join(dir, 'target.bin'),
    payload = Buffer.from('the real payload');
  writeFileSync(targetPath, payload.subarray(0, 4));
  const result = await materializeAssetOriginal({
    targetPath: targetPath,
    expectedSha256: sha256Of(payload),
    expectedSize: payload.length,
    sourceBuffer: payload,
  });
  assert.equal(result.repaired, true);
  assert.equal(result.created, false);
  assert.equal(result.reused, false);
  assert.equal(readFileSync(targetPath, 'utf8'), 'the real payload');
  assert.deepEqual(readdirSync(dir), ['target.bin']);
});

test('a corrupt original with the right size is repaired', async () => {
  const dir = createTempDir(),
    targetPath = path.join(dir, 'target.bin'),
    payload = Buffer.from('aaaaaaaa');
  writeFileSync(targetPath, Buffer.from('bbbbbbbb'));
  const result = await materializeAssetOriginal({
    targetPath: targetPath,
    expectedSha256: sha256Of(payload),
    expectedSize: payload.length,
    sourceBuffer: payload,
  });
  assert.equal(result.repaired, true);
  assert.equal(readFileSync(targetPath, 'utf8'), 'aaaaaaaa');
});

test('a mismatched source buffer raises AssetOriginalIntegrityError with both digests', async () => {
  const dir = createTempDir(),
    targetPath = path.join(dir, 'target.bin'),
    payload = Buffer.from('the payload');
  await assert.rejects(
    materializeAssetOriginal({
      targetPath: targetPath,
      expectedSha256: 'a'.repeat(64),
      expectedSize: payload.length,
      sourceBuffer: payload,
    }),
    (error) => {
      assert.ok(error instanceof AssetOriginalIntegrityError);
      assert.equal(error.name, 'AssetOriginalIntegrityError');
      assert.equal(error.code, 'ASSET_ORIGINAL_INTEGRITY_MISMATCH');
      assert.equal(error.expectedSha256, 'a'.repeat(64));
      assert.equal(error.actualSha256, sha256Of(payload));
      assert.equal(error.expectedSize, payload.length);
      assert.equal(error.actualSize, payload.length);
      assert.match(error.message, /Asset original integrity mismatch/);
      return true;
    },
  );
  assert.deepEqual(readdirSync(dir), []);
});

test('a source larger than the declared size aborts before the digest is available', async () => {
  const dir = createTempDir(),
    targetPath = path.join(dir, 'target.bin');
  await assert.rejects(
    materializeAssetOriginal({
      targetPath: targetPath,
      expectedSha256: sha256Of(Buffer.from('ab')),
      expectedSize: 2,
      sourceStream: Readable.from([Buffer.from('abcd')]),
    }),
    (error) => {
      assert.equal(error.code, 'ASSET_ORIGINAL_INTEGRITY_MISMATCH');
      assert.equal(error.actualSha256, null);
      assert.equal(error.actualSize, 4);
      return true;
    },
  );
  assert.deepEqual(readdirSync(dir), []);
});

test('a directory sitting at the target path fails with a dedicated code', async () => {
  const dir = createTempDir(),
    targetPath = path.join(dir, 'target.bin'),
    payload = Buffer.from('payload');
  mkdirSync(targetPath);
  await assert.rejects(
    materializeAssetOriginal({
      targetPath: targetPath,
      expectedSha256: sha256Of(payload),
      expectedSize: payload.length,
      sourceBuffer: payload,
    }),
    (error) => {
      assert.equal(error.code, 'ASSET_ORIGINAL_TARGET_NOT_FILE');
      assert.match(error.message, /exists but is not a regular file/);
      return true;
    },
  );
});

test('createSourceStream must return a readable source and is only called when needed', async () => {
  const dir = createTempDir(),
    targetPath = path.join(dir, 'target.bin'),
    payload = Buffer.from('streamed');
  await assert.rejects(
    materializeAssetOriginal({
      targetPath: targetPath,
      expectedSha256: sha256Of(payload),
      expectedSize: payload.length,
      createSourceStream: () => null,
    }),
    /createSourceStream must return a readable source/,
  );
  const result = await materializeAssetOriginal({
    targetPath: targetPath,
    expectedSha256: sha256Of(payload),
    expectedSize: payload.length,
    createSourceStream: async () => Readable.from([payload]),
  });
  assert.equal(result.created, true);
  assert.equal(readFileSync(targetPath, 'utf8'), 'streamed');
});

test('a null sourceStream is rejected but a real one is consumed', async () => {
  const dir = createTempDir(),
    targetPath = path.join(dir, 'target.bin'),
    payload = Buffer.from('viastream');
  await assert.rejects(
    materializeAssetOriginal({
      targetPath: targetPath,
      expectedSha256: sha256Of(payload),
      expectedSize: payload.length,
      sourceStream: null,
    }),
    /sourceStream must be a readable source/,
  );
  const stream = Readable.from([payload]);
  const result = await materializeAssetOriginal({
    targetPath: targetPath,
    expectedSha256: sha256Of(payload),
    expectedSize: payload.length,
    sourceStream: stream,
  });
  assert.equal(result.created, true);
  assert.equal(readFileSync(targetPath, 'utf8'), 'viastream');
});

test('an ArrayBuffer and a Uint8Array source are both accepted', async () => {
  const dir = createTempDir(),
    payload = Buffer.from('binary source'),
    arrayBuffer = payload.buffer.slice(payload.byteOffset, payload.byteOffset + payload.byteLength);
  const fromArrayBuffer = await materializeAssetOriginal({
    targetPath: path.join(dir, 'a.bin'),
    expectedSha256: sha256Of(payload),
    expectedSize: payload.length,
    sourceBuffer: arrayBuffer,
  });
  const fromView = await materializeAssetOriginal({
    targetPath: path.join(dir, 'b.bin'),
    expectedSha256: sha256Of(payload),
    expectedSize: payload.length,
    sourceBuffer: new Uint8Array(payload),
  });
  assert.equal(fromArrayBuffer.created, true);
  assert.equal(fromView.created, true);
  assert.equal(readFileSync(fromView.targetPath, 'utf8'), 'binary source');
});

test('concurrent writes to the same target are serialized and the second one reuses', async () => {
  const dir = createTempDir(),
    targetPath = path.join(dir, 'target.bin'),
    payload = Buffer.from('serialized payload'),
    store = createAssetOriginalStore();
  const [first, second] = await Promise.all([
    store.materialize({
      targetPath: targetPath,
      expectedSha256: sha256Of(payload),
      expectedSize: payload.length,
      sourceBuffer: payload,
    }),
    store.materialize({
      targetPath: targetPath,
      expectedSha256: sha256Of(payload),
      expectedSize: payload.length,
      sourceBuffer: payload,
    }),
  ]);
  assert.deepEqual([first.created, first.reused], [true, false]);
  assert.deepEqual([second.created, second.reused], [false, true]);
  assert.equal(readFileSync(targetPath, 'utf8'), 'serialized payload');
  assert.deepEqual(readdirSync(dir), ['target.bin']);
});

test('a failing writer leaves no part file behind', async () => {
  const dir = createTempDir(),
    targetPath = path.join(dir, 'target.bin'),
    payload = Buffer.from('x');
  await assert.rejects(
    materializeAssetOriginal({
      targetPath: targetPath,
      expectedSha256: 'f'.repeat(64),
      expectedSize: payload.length,
      sourceBuffer: payload,
    }),
    /Asset original integrity mismatch/,
  );
  assert.deepEqual(readdirSync(dir), []);
});
