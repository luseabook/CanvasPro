// Behavioural tests for the episode-split helpers exported by storyGenerationApi.
// Added as the safety net required before the episode-split block is moved out.
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createStoryEpisodeDefaultSplitParseContext,
  createStoryEpisodeExperimentalConcurrentBatches,
  createStoryEpisodeSplitBlueprintBatches,
  normalizeStoryEpisodeExperimentalSourceBeats,
  normalizeStoryEpisodeSplitSourceBeats,
} from './storyGenerationApi.js';

test('normalizeStoryEpisodeSplitSourceBeats splits each scene body into beats', () => {
  const beats = normalizeStoryEpisodeSplitSourceBeats({
    title: '第 1 集',
    script: {
      scenes: [
        { ref: 's1', heading: '开场', characters: ['林'], body: '第一句\n第二句' },
        { ref: 's2', heading: '转折', body: '第三句' },
      ],
    },
  });
  assert.deepEqual(
    beats.map((beat) => [beat.ref, beat.sourceSceneRef, beat.order, beat.body]),
    [
      ['s1-beat-1', 's1', 1, '第一句'],
      ['s1-beat-2', 's1', 2, '第二句'],
      ['s2-beat-1', 's2', 3, '第三句'],
    ]
  );
  assert.equal(beats[0].heading, '开场');
  assert.deepEqual(beats[0].characters, ['林']);
});

test('normalizeStoryEpisodeSplitSourceBeats falls back to full text sections', () => {
  const beats = normalizeStoryEpisodeSplitSourceBeats({ script: { fullText: '一段剧本正文。' } });
  assert.equal(beats.length, 1);
  assert.match(beats[0].ref, /^episode-1-source-section-1-beat-1$/);
  assert.equal(beats[0].body, '一段剧本正文。');
});

test('normalizeStoryEpisodeSplitSourceBeats throws when there is no usable text', () => {
  assert.throws(() => normalizeStoryEpisodeSplitSourceBeats({}), /没有找到可用的原文块/);
});

test('normalizeStoryEpisodeExperimentalSourceBeats keeps short inputs as-is', () => {
  const input = { script: { scenes: [{ ref: 's1', heading: '开场', body: '第一句' }] } };
  const beats = normalizeStoryEpisodeExperimentalSourceBeats(input);
  assert.equal(beats.length, 1);
  assert.equal(beats[0].ref, 's1-beat-1');
});

test('normalizeStoryEpisodeExperimentalSourceBeats merges into semantic beats for long inputs', () => {
  const scenes = Array.from({ length: 20 }, (_, index) => ({
    ref: 's' + (index + 1),
    heading: '第 ' + (index + 1) + ' 场',
    body: '内容 ' + (index + 1),
  }));
  const beats = normalizeStoryEpisodeExperimentalSourceBeats({ script: { scenes: scenes } });
  assert.ok(beats.length > 0);
  assert.ok(beats.every((beat) => beat.ref.includes('-semantic-beat-')));
  assert.ok(beats.every((beat) => beat.body.length > 0));
});

test('createStoryEpisodeSplitBlueprintBatches groups without losing items', () => {
  assert.deepEqual(createStoryEpisodeSplitBlueprintBatches([]), []);
  assert.deepEqual(createStoryEpisodeSplitBlueprintBatches([1, 2, 3]), [[1, 2, 3]]);
  const items = Array.from({ length: 20 }, (_, index) => index + 1);
  const groups = createStoryEpisodeSplitBlueprintBatches(items, { maxSize: 8 });
  assert.deepEqual(
    groups.map((group) => group.length),
    [7, 7, 6]
  );
  assert.deepEqual(
    groups.flat(),
    items
  );
  assert.ok(groups.every((group) => group.length <= 8));
});

test('createStoryEpisodeExperimentalConcurrentBatches respects count and duration caps', () => {
  assert.deepEqual(createStoryEpisodeExperimentalConcurrentBatches([]), []);
  const plans = [
    { id: 'a', targetDurationSec: 2 },
    { id: 'b', targetDurationSec: 2 },
    { id: 'c', targetDurationSec: 2 },
  ];
  const groups = createStoryEpisodeExperimentalConcurrentBatches(plans, { targetDurationSeconds: 5 });
  assert.deepEqual(
    groups.map((group) => group.map((plan) => plan.id)),
    [['a', 'b'], ['c']]
  );
  const byCount = createStoryEpisodeExperimentalConcurrentBatches(plans, { maxPlansPerBatch: 1 });
  assert.deepEqual(
    byCount.map((group) => group.length),
    [1, 1, 1]
  );
});

test('createStoryEpisodeDefaultSplitParseContext returns the documented defaults', () => {
  const context = createStoryEpisodeDefaultSplitParseContext({ episodeRef: 'ep-1' });
  assert.equal(context.episodeRef, 'ep-1');
  assert.equal(context.promptMode, 'seedance-2.0');
  assert.equal(context.minimumShotsPerClip, 1);
  assert.equal(context.maximumShotsPerClip, 0);
  assert.equal(context.enforceMaxDuration, false);
  assert.equal(context.repairMissingShotFields, true);
  assert.equal(context.allowEmptyAudio, true);
  assert.equal(context.completePlanSceneUsage, false);
  assert.equal(context.repackOverlongClips, false);
});

test('createStoryEpisodeDefaultSplitParseContext adapts to prompt mode', () => {
  const minimax = createStoryEpisodeDefaultSplitParseContext({
    promptMode: 'minimax-h3',
    constraints: { sceneMaxSeconds: 9 },
  });
  assert.equal(minimax.constraints.sceneMaxSeconds, 15);

  const continuous = createStoryEpisodeDefaultSplitParseContext({
    promptMode: 'seedance-2.5',
    clipDurationConstraints: { min: 2 },
  });
  assert.equal(continuous.repackOverlongClips, false);

  const standard = createStoryEpisodeDefaultSplitParseContext({
    promptMode: 'seedance-2.0',
    clipDurationConstraints: { min: 2 },
  });
  assert.equal(standard.repackOverlongClips, true);

  const replicated = createStoryEpisodeDefaultSplitParseContext({
    episode: { replication: { sourceAnalysis: {} } },
  });
  assert.equal(replicated.completeCharacterAssetUsages, false);
});
