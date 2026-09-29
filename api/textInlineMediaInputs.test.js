import test from 'node:test';
import assert from 'node:assert/strict';

import { encodeTextMediaInputs } from './textInlineMediaInputs.js';

test('textInlineMediaInputs: keeps matching data URLs without loading them', async () => {
  let loads = 0;
  const result = await encodeTextMediaInputs(
    ['data:image/png;base64,AQID', 'https://cdn.test/image.png'],
    'image',
    async (url) => {
      loads += 1;
      assert.equal(url, 'https://cdn.test/image.png');
      return {
        type: 'image/jpeg',
        size: 2,
        arrayBuffer: async () => new Uint8Array([4, 5]).buffer,
      };
    },
  );

  assert.equal(loads, 1);
  assert.deepEqual(result, ['data:image/png;base64,AQID', 'data:image/jpeg;base64,BAU=']);
});

test('textInlineMediaInputs: infers a MIME type from the source extension', async () => {
  const result = await encodeTextMediaInputs(['asset.webp'], 'image', async () => ({
    type: 'application/octet-stream',
    size: 1,
    arrayBuffer: async () => new Uint8Array([255]).buffer,
  }));

  assert.deepEqual(result, ['data:image/webp;base64,/w==']);
});

test('textInlineMediaInputs: rejects missing media or mismatched MIME types', async () => {
  await assert.rejects(
    encodeTextMediaInputs(['asset.bin'], 'image', async () => ({
      type: 'image/png',
      size: 0,
      arrayBuffer: async () => new ArrayBuffer(0),
    })),
    /Invalid image input/,
  );
  await assert.rejects(
    encodeTextMediaInputs(['asset.png'], 'image', async () => ({
      type: 'video/mp4',
      size: 1,
      arrayBuffer: async () => new Uint8Array([1]).buffer,
    })),
    /Invalid image input/,
  );
});
