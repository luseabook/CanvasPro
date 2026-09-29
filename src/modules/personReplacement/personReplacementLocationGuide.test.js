import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyPersonReplacementLocationGuide,
  buildPersonReplacementLocationGuide,
} from './personReplacementLocationGuide.js';

test('personReplacementLocationGuide: apply is a no-op when the guide is disabled', () => {
  const request = { referenceImages: [{ role: 'person-location-guide', ref: 'old' }] };
  assert.equal(applyPersonReplacementLocationGuide(request, {}), request);
});

test('personReplacementLocationGuide: apply replaces the guide reference only', () => {
  const request = {
    locationGuide: true,
    referenceImages: [
      { role: 'person-location-guide', ref: 'old' },
      { role: 'other', ref: 'keep' },
    ],
  };
  const result = applyPersonReplacementLocationGuide(request, {
    dataUrl: 'data:image/png;base64,AAAA',
  });
  assert.deepEqual(result.referenceImages, [
    { role: 'person-location-guide', ref: 'data:image/png;base64,AAAA' },
    { role: 'other', ref: 'keep' },
  ]);
  assert.throws(() => applyPersonReplacementLocationGuide(request, { dataUrl: 'bad' }), Error);
});

test('personReplacementLocationGuide: build renders a PNG through the image and canvas adapters', async (t) => {
  const originalImage = globalThis.Image;
  const originalDocument = globalThis.document;
  t.after(() => {
    globalThis.Image = originalImage;
    globalThis.document = originalDocument;
  });
  class FakeImage {
    set src(value) {
      this.value = value;
      queueMicrotask(() => this.onload?.());
    }
  }
  globalThis.Image = FakeImage;
  globalThis.document = {
    createElement(tag) {
      assert.equal(tag, 'canvas');
      return {
        width: 0,
        height: 0,
        getContext() {
          return { drawImage() {} };
        },
        toDataURL() {
          return 'data:image/png;base64,AAAA';
        },
      };
    },
  };
  const result = await buildPersonReplacementLocationGuide({
    frame: { width: 16, height: 9 },
    people: [{ label: '1', bbox: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 } }],
  });
  assert.equal(result.width, 1200);
  assert.equal(result.height, 675);
  assert.equal(result.personCount, 1);
  assert.equal(result.dataUrl, 'data:image/png;base64,AAAA');
});

test('personReplacementLocationGuide: build rejects an empty people list', async () => {
  await assert.rejects(buildPersonReplacementLocationGuide({ people: [] }), Error);
});
