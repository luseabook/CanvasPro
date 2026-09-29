import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STORY_ASSET_REFERENCE_PROMPT_SUFFIX,
  STORY_ASSET_STYLE_REFERENCE_MENTION,
  appendStoryAssetReferencePrompt,
  buildStoryAssetAppearanceGenerationTasks,
  clearStoryAssetAppearanceReferenceImage,
  compileStoryAssetReferencePrompt,
  ensureStoryAssetBaseAppearance,
  getStoryAssetAppearanceStats,
  getStoryAssetBaseAppearance,
  getPreferredStoryAssetBaseAppearance,
  isStoryAssetBaseAppearance,
  normalizeStoryAsset,
  normalizeStoryWorkspaceAssetData,
  runStoryAssetAppearanceGenerationTasks,
  setStoryAssetAppearanceReferenceImage,
  setStoryAssetBaseAppearance,
  shouldGenerateStoryAssetBaseAppearanceFirst,
} from './storyAssetAppearances.js';

test('storyAssetAppearances: reference prompt helpers are idempotent and compile the style mention', () => {
  const prompt = 'A hero standing in the rain';
  const appended = appendStoryAssetReferencePrompt(prompt);

  assert.equal(appended, `${prompt}\n${STORY_ASSET_REFERENCE_PROMPT_SUFFIX}`);
  assert.equal(appendStoryAssetReferencePrompt(appended), appended);

  const compiled = compileStoryAssetReferencePrompt(
    `before ${STORY_ASSET_STYLE_REFERENCE_MENTION} after`,
  );
  assert.equal(compiled.includes(STORY_ASSET_STYLE_REFERENCE_MENTION), false);
  assert.match(compiled, /@.+2/u);
});

test('storyAssetAppearances: sets and clears a reference image without duplicating prompt state', () => {
  const appearance = { prompt: 'A hero' };

  assert.equal(setStoryAssetAppearanceReferenceImage(appearance, 'https://cdn.example/hero.png'), true);
  assert.equal(appearance.referenceImage, null);
  assert.equal(appearance.referenceImageUrl, 'https://cdn.example/hero.png');
  assert.equal(appearance.prompt, appendStoryAssetReferencePrompt('A hero'));
  assert.equal(appearance.error, '');

  assert.equal(clearStoryAssetAppearanceReferenceImage(appearance), true);
  assert.equal(appearance.referenceImageUrl, '');
  assert.equal(appearance.referenceImage, null);
  assert.equal(appearance.prompt, 'A hero');

  assert.equal(setStoryAssetAppearanceReferenceImage(null, 'x'), false);
  assert.equal(setStoryAssetAppearanceReferenceImage({}, ''), false);
});

test('storyAssetAppearances: normalizes assets, appearances, and workspace state', () => {
  const asset = normalizeStoryAsset(
    {
      id: 'hero',
      kind: 'character',
      name: 'Alice',
      description: 'desc',
      prompt: 'prompt',
      appearances: [
        { id: 'alt', name: '', prompt: 'alternate' },
        { id: 'base', name: 'Base', isBaseAppearance: true, imageUrl: 'base.png' },
      ],
    },
    0,
  );

  assert.equal(asset.id, 'hero');
  assert.equal(asset.kind, 'character');
  assert.equal(asset.appearances.length, 2);
  assert.equal(asset.appearances[0].id, 'alt');
  assert.ok(asset.appearances[0].name);
  assert.equal(asset.appearances[0].prompt, 'alternate');
  assert.equal(asset.baseAppearanceId, 'base');

  const workspace = normalizeStoryWorkspaceAssetData({
    assets: [{ id: 'chair', kind: 'prop', name: 'Chair' }],
    episodes: [{ id: 'episode-1', clips: [{ id: 'clip-1', dialogue: '' }] }],
    clipFrames: [{ id: 'frame-1', mediaType: 'image', imageUrl: 'frame.png' }],
  });

  assert.equal(workspace.assets.length, 1);
  assert.equal(workspace.assets[0].appearances.length, 1);
  assert.equal(workspace.episodes[0].clips.length, 1);
  assert.equal(workspace.clipFrames[0].id, 'frame-1');
});

test('storyAssetAppearances: resolves base appearances, stats, and generation order', () => {
  const asset = {
    id: 'hero',
    kind: 'character',
    name: 'Alice',
    appearances: [
      { id: 'hero-alt', name: 'Alt' },
      { id: 'hero-base', name: 'Base' },
    ],
  };

  assert.deepEqual(getStoryAssetAppearanceStats(asset), {
    total: 2,
    generated: 0,
    failed: 0,
    pending: 2,
  });
  assert.equal(getStoryAssetBaseAppearance(asset), null);
  assert.equal(getPreferredStoryAssetBaseAppearance(asset).id, 'hero-alt');
  assert.equal(isStoryAssetBaseAppearance(asset, { id: 'hero-base' }), false);

  assert.equal(setStoryAssetBaseAppearance(asset, 'hero-base'), true);
  assert.equal(asset.baseAppearanceId, 'hero-base');
  assert.equal(getStoryAssetBaseAppearance(asset).id, 'hero-base');
  assert.equal(isStoryAssetBaseAppearance(asset, { id: 'hero-base' }), true);
  assert.equal(shouldGenerateStoryAssetBaseAppearanceFirst(asset), true);

  asset.baseAppearanceId = '';
  assert.equal(ensureStoryAssetBaseAppearance(asset), true);
  assert.equal(asset.baseAppearanceId, 'hero-alt');

  const tasks = buildStoryAssetAppearanceGenerationTasks([asset]);
  assert.deepEqual(
    tasks.map(({ appearance }) => appearance.id),
    ['hero-alt', 'hero-base'],
  );
});

test('storyAssetAppearances: runs each asset generation lane serially and honors stop checks', async () => {
  const asset = {
    id: 'hero',
    kind: 'character',
    name: 'Alice',
    baseAppearanceId: 'hero-base',
    appearances: [
      { id: 'hero-alt', name: 'Alt' },
      { id: 'hero-base', name: 'Base' },
    ],
  };
  const tasks = buildStoryAssetAppearanceGenerationTasks([asset]);
  const calls = [];

  const results = await runStoryAssetAppearanceGenerationTasks(
    tasks,
    async (task, meta) => {
      calls.push({
        appearanceId: task.appearance.id,
        laneIndex: meta.laneIndex,
        remaining: meta.remainingTasks.map((item) => item.appearance.id),
      });
      return task.appearance.id;
    },
  );

  assert.deepEqual(
    calls.map((call) => call.appearanceId),
    ['hero-base', 'hero-alt'],
  );
  assert.deepEqual(calls[0].remaining, ['hero-alt']);
  assert.deepEqual(results, ['hero-base', 'hero-alt']);

  const stopped = [];
  const stoppedResults = await runStoryAssetAppearanceGenerationTasks(
    tasks,
    async (task) => {
      stopped.push(task.appearance.id);
      return task.appearance.id;
    },
    { shouldStop: ({ laneIndex }) => laneIndex >= 1 },
  );

  assert.deepEqual(stopped, ['hero-base']);
  assert.equal(stoppedResults[0], 'hero-base');
  assert.equal(1 in stoppedResults, false);
});
