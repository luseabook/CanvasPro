import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPersonReplacementSourcePlaybackProxyRef,
  getPersonReplacementSourceAssetId,
  hydratePersonReplacementSourcePlaybackRefs,
  resolvePersonReplacementSourcePlaybackRef,
} from './personReplacementSourcePlayback.js';

const ID = 'a1b2c3d4'.repeat(8);
const PROXY = `data/assets/derived/video/${ID}.proxy-v2-1280.mp4`;

test('getPersonReplacementSourceAssetId prefers a canonical assetId', () => {
  assert.equal(getPersonReplacementSourceAssetId({ assetId: ID }), ID);
  assert.equal(getPersonReplacementSourceAssetId({ assetId: ID.toUpperCase() }), ID);
  assert.equal(getPersonReplacementSourceAssetId({ assetId: 'not-an-id' }), '');
  assert.equal(getPersonReplacementSourceAssetId({}), '');
  assert.equal(getPersonReplacementSourceAssetId(), '');
});

test('getPersonReplacementSourceAssetId falls back to a canonical original ref', () => {
  assert.equal(getPersonReplacementSourceAssetId({ videoRef: `/data/assets/original/${ID}.mp4` }), ID);
  assert.equal(getPersonReplacementSourceAssetId({ videoRef: `data/assets/original/${ID}.mov?v=2` }), ID);
  assert.equal(
    getPersonReplacementSourceAssetId({ videoRef: `/data/assets/original/${ID.toUpperCase()}.MP4` }),
    ID,
  );
  assert.equal(getPersonReplacementSourceAssetId({ videoRef: 'https://cdn.example/model.mp4' }), '');
  assert.equal(
    getPersonReplacementSourceAssetId({ assetId: 'x', videoRef: `/data/assets/original/${ID}.mp4` }),
    ID,
  );
});

test('buildPersonReplacementSourcePlaybackProxyRef names the versioned proxy', () => {
  assert.equal(buildPersonReplacementSourcePlaybackProxyRef({ assetId: ID }), PROXY);
  assert.equal(buildPersonReplacementSourcePlaybackProxyRef({}), '');
});

test('resolvePersonReplacementSourcePlaybackRef follows the documented priority', () => {
  const resolve = resolvePersonReplacementSourcePlaybackRef;
  assert.equal(
    resolve({
      runtimePreviewRef: 'runtime.mp4',
      source: { playbackVideoRef: 'playback.mp4', displayLocalPath: 'display.mp4', videoRef: 'video.mp4' },
      sourceShot: { sourceVideoRef: 'shot.mp4' },
    }),
    'runtime.mp4',
  );
  assert.equal(
    resolve({ source: { playbackVideoRef: 'playback.mp4', videoRef: 'video.mp4' } }),
    'playback.mp4',
  );
  assert.equal(
    resolve({ source: { displayLocalPath: 'display.mp4', videoRef: 'video.mp4' } }),
    'display.mp4',
  );
  assert.equal(
    resolve({ source: { videoRef: 'video.mp4' }, sourceShot: { sourceVideoRef: 'shot.mp4' } }),
    'video.mp4',
  );
  assert.equal(resolve({ sourceShot: { sourceVideoRef: 'shot.mp4' } }), 'shot.mp4');
  assert.equal(resolve({ runtimePreviewRef: '   ' }), '');
  assert.equal(resolve(), '');
});

test('hydratePersonReplacementSourcePlaybackRefs bails out on unusable input', async () => {
  const checkMediaExists = async () => true;
  assert.deepEqual(await hydratePersonReplacementSourcePlaybackRefs(null, { checkMediaExists }), {
    project: null,
    changed: false,
  });
  const project = { sources: [] };
  assert.deepEqual(await hydratePersonReplacementSourcePlaybackRefs(project, {}), {
    project,
    changed: false,
  });
  assert.deepEqual(await hydratePersonReplacementSourcePlaybackRefs(project, { checkMediaExists: 'x' }), {
    project,
    changed: false,
  });
  assert.deepEqual(await hydratePersonReplacementSourcePlaybackRefs({ sources: 'x' }, { checkMediaExists }), {
    project: { sources: 'x' },
    changed: false,
  });
});

test('hydratePersonReplacementSourcePlaybackRefs installs an existing proxy', async () => {
  const project = { sources: [{ assetId: ID }] };
  const result = await hydratePersonReplacementSourcePlaybackRefs(project, {
    checkMediaExists: async () => true,
  });

  assert.equal(result.changed, true);
  assert.notEqual(result.project, project);
  assert.deepEqual(result.project.sources[0], { assetId: ID, playbackVideoRef: PROXY });
});

test('hydratePersonReplacementSourcePlaybackRefs keeps an existing proxy reference untouched', async () => {
  const withSlash = { assetId: ID, playbackVideoRef: `/data/assets/derived/video/${ID}.proxy-v2-1280.mp4` };
  const withBackslash = {
    assetId: ID,
    playbackVideoRef: `data\\assets\\derived\\video\\${ID}.proxy-v2-1280.mp4`,
  };
  const project = { sources: [withSlash, withBackslash] };
  const result = await hydratePersonReplacementSourcePlaybackRefs(project, {
    checkMediaExists: async () => true,
  });

  assert.equal(result.changed, false);
  assert.equal(result.project, project);
});

test('hydratePersonReplacementSourcePlaybackRefs keeps a foreign playback reference when the proxy exists', async () => {
  const project = { sources: [{ assetId: ID, playbackVideoRef: 'custom/edit.mp4' }] };
  const result = await hydratePersonReplacementSourcePlaybackRefs(project, {
    checkMediaExists: async () => true,
  });

  assert.equal(result.changed, false);
  assert.equal(result.project, project);
});

test('hydratePersonReplacementSourcePlaybackRefs clears a stale proxy when the media is gone', async () => {
  const project = { sources: [{ assetId: ID, playbackVideoRef: PROXY }] };
  const result = await hydratePersonReplacementSourcePlaybackRefs(project, {
    checkMediaExists: async () => false,
  });

  assert.equal(result.changed, true);
  assert.deepEqual(result.project.sources[0], { assetId: ID, playbackVideoRef: '' });
});

test('hydratePersonReplacementSourcePlaybackRefs leaves missing media without a proxy reference alone', async () => {
  const project = {
    sources: [{ assetId: ID }, { notASource: true }, { assetId: ID, playbackVideoRef: 'custom/edit.mp4' }],
  };
  const result = await hydratePersonReplacementSourcePlaybackRefs(project, {
    checkMediaExists: async () => false,
  });

  assert.equal(result.changed, false);
  assert.equal(result.project, project);
});

test('hydratePersonReplacementSourcePlaybackRefs memoizes existence checks and treats failures as missing', async () => {
  const seen = [];
  const project = {
    sources: [{ assetId: ID }, { assetId: ID }, { videoRef: `/data/assets/original/${ID}.mp4` }],
  };
  const result = await hydratePersonReplacementSourcePlaybackRefs(project, {
    checkMediaExists: (ref) => {
      seen.push(ref);
      return 'yes';
    },
  });

  assert.deepEqual(seen, [PROXY]);
  assert.equal(result.changed, false);

  const throwing = await hydratePersonReplacementSourcePlaybackRefs(
    { sources: [{ assetId: ID, playbackVideoRef: PROXY }] },
    { checkMediaExists: () => Promise.reject(new Error('boom')) },
  );
  assert.equal(throwing.changed, true);
  assert.equal(throwing.project.sources[0].playbackVideoRef, '');
});
