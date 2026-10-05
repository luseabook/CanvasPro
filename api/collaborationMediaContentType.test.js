import test from 'node:test';
import assert from 'node:assert/strict';

import { detectCollaborationMediaContentType } from './collaborationMediaContentType.js';

test('collaborationMediaContentType: detects common image, video, and audio signatures', async () => {
  const samples = [
    [new Uint8Array([137, 80, 78, 71, 0x0d, 0x0a, 26, 0x0a]), 'image/png'],
    [new Uint8Array([0xff, 216, 0xff, 219]), 'image/jpeg'],
    [new TextEncoder().encode('GIF89a'), 'image/gif'],
    [new TextEncoder().encode('RIFF0000WEBP'), 'image/webp'],
    [new TextEncoder().encode('RIFF0000WAVE'), 'audio/wav'],
    [
      (() => {
        const bytes = new Uint8Array(16);
        new DataView(bytes.buffer).setUint32(0, 16);
        bytes.set(new TextEncoder().encode('ftypisom'), 4);
        return bytes;
      })(),
      'video/mp4',
    ],
    [new TextEncoder().encode('fLaC0000'), 'audio/flac'],
    [new TextEncoder().encode('OggS0000'), 'audio/ogg'],
  ];

  const results = await Promise.all(
    samples.map(([bytes, type]) =>
      detectCollaborationMediaContentType(new Blob([bytes], { type: `application/octet-stream` })),
    ),
  );
  assert.deepEqual(
    results,
    samples.map(([, type]) => type),
  );
});

test('collaborationMediaContentType: rejects HTML error pages and returns empty for unknown data', async () => {
  await assert.rejects(
    detectCollaborationMediaContentType(new Blob(['<!doctype html><title>oops</title>'])),
    (error) => error.code === 'ASSET_TYPE',
  );
  assert.equal(await detectCollaborationMediaContentType(new Blob(['not media'])), '');
});
