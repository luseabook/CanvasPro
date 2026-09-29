import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { buildClipboardMediaSignature, clipboardImageBlobFromBase64 } from './clipboardMediaSignature.js';

function blobOf(bytes, type) {
  return {
    type,
    async arrayBuffer() {
      return new Uint8Array(bytes).buffer;
    },
  };
}

function hexOf(bytes) {
  return createHash('sha256').update(new Uint8Array(bytes)).digest('hex');
}

test('prefixes the media type and the lowercase sha256 digest', async () => {
  const bytes = [1, 2, 3, 4, 5];
  const signature = await buildClipboardMediaSignature(blobOf(bytes, 'image/png'));
  assert.equal(signature, `media:image/png|sha256:${hexOf(bytes)}`);
});

test('lowercases the declared media type', async () => {
  const signature = await buildClipboardMediaSignature(blobOf([9], 'IMAGE/PNG'));
  assert.equal(signature, `media:image/png|sha256:${hexOf([9])}`);
});

test('defaults the media type to the blob type and allows an override', async () => {
  const bytes = [7, 7, 7];
  assert.equal(
    await buildClipboardMediaSignature(blobOf(bytes, 'video/mp4')),
    `media:video/mp4|sha256:${hexOf(bytes)}`,
  );
  assert.equal(
    await buildClipboardMediaSignature(blobOf(bytes, 'video/mp4'), 'Video/Mp4'),
    `media:video/mp4|sha256:${hexOf(bytes)}`,
  );
});

test('stringifies a non-string media type', async () => {
  const signature = await buildClipboardMediaSignature(blobOf([4], 'x'), 7);
  assert.equal(signature, `media:7|sha256:${hexOf([4])}`);
});

test('pads single-digit digest bytes to two hex characters', async () => {
  let chosen = null;
  for (let value = 0; value < 512 && !chosen; value += 1) {
    const hex = hexOf([value]);
    for (let index = 0; index < hex.length; index += 2) {
      if (hex[index] === '0') {
        chosen = { value, hex };
        break;
      }
    }
  }
  assert.ok(chosen, 'expected at least one digest byte below 16');
  const signature = await buildClipboardMediaSignature(blobOf([chosen.value], 'image/png'));
  assert.equal(signature, `media:image/png|sha256:${chosen.hex}`);
  assert.equal(signature.split('sha256:')[1].length, 64);
});

test('returns an empty signature for a missing blob', async () => {
  assert.equal(await buildClipboardMediaSignature(null), '');
  assert.equal(await buildClipboardMediaSignature(undefined), '');
});

test('returns an empty signature when arrayBuffer rejects', async () => {
  const signature = await buildClipboardMediaSignature({
    type: 'image/png',
    async arrayBuffer() {
      throw new Error('detached');
    },
  });
  assert.equal(signature, '');
});

test('returns an empty signature when the subtle crypto API is unavailable', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });
  try {
    assert.equal(await buildClipboardMediaSignature(blobOf([1], 'image/png')), '');
  } finally {
    Object.defineProperty(globalThis, 'crypto', descriptor);
  }
});

test('builds a blob from base64 bytes with the default png type', async () => {
  const blob = clipboardImageBlobFromBase64(btoa('Hi'));
  assert.equal(blob.type, 'image/png');
  assert.equal(blob.size, 2);
  assert.equal(await blob.text(), 'Hi');
});

test('builds a blob with an explicit media type', () => {
  const blob = clipboardImageBlobFromBase64(btoa('abc'), 'image/webp');
  assert.equal(blob.type, 'image/webp');
  assert.equal(blob.size, 3);
});

test('yields an empty blob for nullish base64 input', () => {
  assert.equal(clipboardImageBlobFromBase64(null).size, 0);
  assert.equal(clipboardImageBlobFromBase64(undefined).size, 0);
  assert.equal(clipboardImageBlobFromBase64('').size, 0);
});
