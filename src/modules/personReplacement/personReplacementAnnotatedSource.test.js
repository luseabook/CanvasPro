import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyPersonReplacementAnnotatedSource,
  buildPersonReplacementAnnotatedSource,
} from './personReplacementAnnotatedSource.js';

test('applyPersonReplacementAnnotatedSource is a no-op when disabled', () => {
  const request = { referenceImages: [{ role: 'source-keyframe', ref: 'old' }] };
  assert.equal(applyPersonReplacementAnnotatedSource(request, {}), request);
});

test('applyPersonReplacementAnnotatedSource replaces only the source keyframe', () => {
  const request = {
    annotatedSource: { sourceRef: 'data/assets/source.png' },
    referenceImages: [
      { role: 'source-keyframe', ref: 'old' },
      { role: 'other', ref: 'keep' },
    ],
  };
  const result = applyPersonReplacementAnnotatedSource(request, {
    dataUrl: 'data:image/png;base64,AAAA',
  });
  assert.deepEqual(result.referenceImages, [
    {
      role: 'source-keyframe',
      originalRef: 'data/assets/source.png',
      ref: 'data:image/png;base64,AAAA',
    },
    { role: 'other', ref: 'keep' },
  ]);
  assert.throws(
    () => applyPersonReplacementAnnotatedSource(request, { dataUrl: 'bad' }),
    /带框原图未生成/,
  );
});

test('buildPersonReplacementAnnotatedSource draws labels and returns a PNG data URL', async (t) => {
  const originalImage = globalThis.Image;
  const originalDocument = globalThis.document;
  const originalGetComputedStyle = globalThis.getComputedStyle;
  const calls = [];
  t.after(() => {
    globalThis.Image = originalImage;
    globalThis.document = originalDocument;
    globalThis.getComputedStyle = originalGetComputedStyle;
  });

  class FakeImage {
    set src(value) {
      this.value = value;
      this.naturalWidth = 200;
      this.naturalHeight = 100;
      queueMicrotask(() => this.onload?.());
    }
  }

  const context = {
    set strokeStyle(value) {
      this._strokeStyle = value;
    },
    get strokeStyle() {
      return this._strokeStyle;
    },
    set fillStyle(value) {
      this._fillStyle = value;
    },
    get fillStyle() {
      return this._fillStyle;
    },
    lineWidth: 0,
    font: '',
    textBaseline: '',
    drawImage(...args) {
      calls.push(['drawImage', ...args]);
    },
    strokeRect(...args) {
      calls.push(['strokeRect', ...args]);
    },
    fillRect(...args) {
      calls.push(['fillRect', ...args]);
    },
    fillText(...args) {
      calls.push(['fillText', ...args]);
    },
    measureText(text) {
      return { width: text.length * 8 };
    },
  };

  globalThis.Image = FakeImage;
  globalThis.document = {
    documentElement: {},
    createElement(tag) {
      assert.equal(tag, 'canvas');
      return {
        width: 0,
        height: 0,
        getContext(kind) {
          assert.equal(kind, '2d');
          return context;
        },
        toDataURL(type) {
          assert.equal(type, 'image/png');
          return 'data:image/png;base64,AAAA';
        },
      };
    },
  };
  globalThis.getComputedStyle = () => ({
    getPropertyValue(name) {
      return (
        {
          '--annotate-red': '#ff0000',
          '--cyan': '#00ffff',
          '--canvas-black': '#000000',
        }[name] || ''
      );
    },
  });

  const result = await buildPersonReplacementAnnotatedSource({
    sourceRef: 'data/assets/source.png',
    people: [
      { label: 'A', referenceSlot: 1, markerIndex: 0, bbox: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 } },
      { label: 'B', referenceSlot: 2, markerIndex: 1, bbox: { x: 0.5, y: 0.1, width: 0.2, height: 0.5 } },
    ],
  });

  assert.deepEqual(result, {
    dataUrl: 'data:image/png;base64,AAAA',
    width: 200,
    height: 100,
  });
  assert.equal(calls.filter(([name]) => name === 'drawImage').length, 1);
  assert.equal(calls.filter(([name]) => name === 'strokeRect').length, 2);
  assert.deepEqual(
    calls.filter(([name]) => name === 'fillText').map((entry) => entry[1]),
    ['A → 图1', 'B → 图2'],
  );
});

test('buildPersonReplacementAnnotatedSource rejects missing input', async () => {
  await assert.rejects(
    buildPersonReplacementAnnotatedSource({ sourceRef: '', people: [] }),
    /测试模式缺少原图或绑定人物框/,
  );
});
