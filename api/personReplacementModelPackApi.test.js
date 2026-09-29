import test from 'node:test';
import assert from 'node:assert/strict';

import {
  detectPersonReplacementPeople,
  getPersonReplacementModelPackStatus,
  identifyPersonReplacementPeople,
} from './personReplacementModelPackApi.js';

test('personReplacementModelPackApi: normalizes installed status and progress', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        success: true,
        installed: true,
        packId: ' pack-1 ',
        version: '1.2.0',
        requiredVersion: '1.3.0',
        downloadBytes: -4,
        model: { id: 'model-1' },
        installProgress: {
          downloadedBytes: 5,
          totalBytes: 10,
          currentSource: ' mirror ',
          completedSources: 1.9,
          totalSources: 2.2,
        },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );

  try {
    const status = await getPersonReplacementModelPackStatus();
    assert.equal(status.installed, true);
    assert.equal(status.packId, 'pack-1');
    assert.equal(status.downloadBytes, 0);
    assert.deepEqual(status.models, [{ id: 'model-1' }]);
    assert.deepEqual(status.installProgress, {
      state: '',
      downloadedBytes: 5,
      totalBytes: 10,
      percent: 50,
      currentSource: 'mirror',
      completedSources: 1,
      totalSources: 2,
      message: '',
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('personReplacementModelPackApi: normalizes detections and validates image refs', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        success: true,
        modelId: ' detector ',
        frame: { width: -1, height: 720 },
        people: [
          {
            bbox: { x: -1, y: 2, width: 0.5, height: 0.5 },
            confidence: 2,
            className: '',
            orientation: 'left',
            orientationConfidence: 0.9,
          },
        ],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );

  try {
    await assert.rejects(() => detectPersonReplacementPeople(''), /图片/);
    const result = await detectPersonReplacementPeople('image-1');
    assert.equal(result.modelId, 'detector');
    assert.deepEqual(result.frame, { width: 0, height: 720 });
    assert.deepEqual(result.people[0], {
      bbox: { x: 0, y: 1, width: 0.5, height: 0.5 },
      confidence: 1,
      classId: 0,
      className: 'person',
      orientation: 'left',
      orientationConfidence: 0.9,
      orientationModelId: '',
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('personReplacementModelPackApi: skips identify calls without usable shots', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
  };

  try {
    assert.deepEqual(await identifyPersonReplacementPeople([]), {
      modelId: '',
      identities: [],
      assignments: [],
      stats: { sampleCount: 0, trackletCount: 0, identityCount: 0, reviewCount: 0 },
    });
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
