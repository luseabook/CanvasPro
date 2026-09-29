import test from 'node:test';
import assert from 'node:assert/strict';

import { prepareCliTextImageInputs } from './cliTextInputs.js';

test('cliTextInputs: deduplicates image URLs while preserving order', async () => {
  const result = await prepareCliTextImageInputs(
    {
      inputImageUrls: [' https://cdn.test/a.png ', 'https://cdn.test/b.png'],
      inputUrls: ['https://cdn.test/a.png'],
    },
    { inputSlots: { maxByKind: { image: 4 } } },
  );

  assert.deepEqual(result, ['https://cdn.test/a.png', 'https://cdn.test/b.png']);
});

test('cliTextInputs: rejects video and audio references', async () => {
  const manifest = { inputSlots: { maxByKind: { image: 4 } } };
  await assert.rejects(
    prepareCliTextImageInputs({ inputVideoUrls: ['https://cdn.test/a.mp4'] }, manifest),
    /不支持视频或音频/,
  );
  await assert.rejects(
    prepareCliTextImageInputs({ inputAudioUrls: ['data:audio/mp3;base64,AA=='] }, manifest),
    /不支持视频或音频/,
  );
});

test('cliTextInputs: enforces the image limit and expands blob URLs', async () => {
  const originalFetch = globalThis.fetch;
  const bytes = new Uint8Array([1, 2, 3, 4]);
  globalThis.fetch = async () => ({
    ok: true,
    blob: async () => new Blob([bytes], { type: 'image/png' }),
  });

  try {
    await assert.rejects(
      prepareCliTextImageInputs(
        { inputImageUrls: ['https://cdn.test/a.png', 'https://cdn.test/b.png'] },
        { inputSlots: { maxByKind: { image: 1 } } },
      ),
      /最多支持 1 张参考图/,
    );

    const result = await prepareCliTextImageInputs(
      { inputImageUrls: ['blob:https://app.test/image-1'] },
      { inputSlots: { maxByKind: { image: 1 } } },
    );
    assert.deepEqual(result, ['data:image/png;base64,AQIDBA==']);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
