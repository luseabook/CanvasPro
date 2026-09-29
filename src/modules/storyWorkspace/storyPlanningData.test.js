import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STORY_CHARACTER_ASSET_PROMPT_PREFIX,
  buildStoryEpisodeClipPrompt,
  clearStoryPlanningForRebuild,
  ensureStoryVisualStylePrefix,
  ensureUniqueStoryEpisodeClipIds,
  formatStoryClockDuration,
  getNextStoryEpisodeScriptIndex,
  insertStoryEpisodeClip,
  invalidateStoryEpisodeScriptsFrom,
  isStoryEpisodeScriptComplete,
  mergeStoryEpisodePlans,
  mergeStoryEpisodeScript,
  mergeStoryPlanningAssets,
  normalizeDurationSeconds,
  normalizeStoryAssetDisplayName,
  normalizeStoryCharacterRole,
  normalizeStoryEpisodePlan,
  removeStoryEpisodeClip,
} from './storyPlanningData.js';

const ASSETS = [
  {
    id: 'story-asset-1',
    planningRef: 'asset-1',
    kind: 'character',
    name: 'Alice',
    role: '主角',
  },
  {
    id: 'story-asset-2',
    planningRef: 'asset-2',
    kind: 'scene',
    name: 'Room',
  },
];

test('storyPlanningData: normalizes labels, roles, styles, and durations', () => {
  assert.equal(normalizeStoryAssetDisplayName('姓名：Alice，主角', 'character', 0), 'Alice');
  assert.equal(normalizeStoryAssetDisplayName('', 'scene', 1), '场景 2');
  assert.equal(normalizeStoryCharacterRole('反派首领'), '反派');
  assert.equal(normalizeStoryCharacterRole('女主'), '主角');
  assert.equal(normalizeStoryCharacterRole('无名角色甲'), '路人');
  assert.equal(normalizeStoryCharacterRole('配角', '反派手下'), '反派');
  assert.equal(ensureStoryVisualStylePrefix('A room', 'Cinematic'), 'Cinematic\nA room');
  assert.equal(ensureStoryVisualStylePrefix('Cinematic\nA room', 'Cinematic'), 'Cinematic\nA room');
  assert.equal(normalizeDurationSeconds('12.5s'), 12.5);
  assert.equal(normalizeDurationSeconds('invalid'), 0);
  assert.equal(formatStoryClockDuration(3723), '01:02:03');
  assert.equal(formatStoryClockDuration(63), '01:03');
});

test('storyPlanningData: clears rebuild state and merges asset media', () => {
  const cleared = clearStoryPlanningForRebuild({
    projectId: 'project-a',
    assets: [{ id: 'old' }],
    episodes: [
      {
        id: 'episode-1',
        estimatedDurationSeconds: 65,
        clips: [{ id: 'clip-a' }],
      },
    ],
  });

  assert.equal(cleared.projectId, 'project-a');
  assert.deepEqual(cleared.assets, []);
  assert.deepEqual(cleared.episodes[0].clips, []);
  assert.equal(cleared.episodes[0].durationSec, 65);
  assert.equal(cleared.episodes[0].duration, '01:05');
  assert.equal(cleared.episodes[0].status, '待拆分');

  const merged = mergeStoryPlanningAssets(
    [
      {
        id: 'story-asset-1',
        planningRef: 'asset-1',
        kind: 'character',
        name: 'Alice',
        imageUrl: 'old.png',
        appearances: [
          {
            id: 'appearance-1',
            planningRef: 'asset-1-base',
            name: '基础形象',
            imageUrl: 'appearance.png',
          },
        ],
      },
      {
        id: 'unmatched',
        planningRef: 'asset-old',
        kind: 'prop',
        name: 'Old prop',
      },
    ],
    [
      {
        planningRef: 'asset-1',
        kind: 'character',
        name: 'Alice',
        description: 'Updated',
        prompt: 'standing',
      },
    ],
    {
      preserveMedia: true,
      retainUnmatched: true,
      visualStyle: 'Cinematic',
    },
  );

  assert.equal(merged.length, 2);
  assert.equal(merged[0].id, 'story-asset-1');
  assert.equal(merged[0].description, 'Updated');
  assert.equal(merged[0].imageUrl, 'old.png');
  assert.equal(merged[0].appearances[0].imageUrl, 'appearance.png');
  assert.ok(merged[0].prompt.startsWith(STORY_CHARACTER_ASSET_PROMPT_PREFIX));
  assert.match(merged[0].prompt, /Cinematic\nstanding/u);
});

test('storyPlanningData: normalizes and merges episode plans while preserving media', () => {
  const normalized = normalizeStoryEpisodePlan(
    {
      number: 2,
      synopsis: 'A turn',
      assetRefs: ['asset-1'],
      estimatedDurationSeconds: 65,
    },
    1,
    {
      assets: ASSETS,
      existingEpisode: {
        id: 'episode-2',
        coverUrl: 'cover.png',
        clips: [{ id: 'episode-2-clip-1', durationSec: 12 }],
      },
      preserveMedia: true,
    },
  );

  assert.equal(normalized.id, 'episode-2');
  assert.equal(normalized.title, '第 2 集');
  assert.equal(normalized.assetIds[0], 'story-asset-1');
  assert.equal(normalized.characterCount, 1);
  assert.equal(normalized.sceneCount, 0);
  assert.equal(normalized.clips.length, 1);
  assert.equal(normalized.durationSec, 12);
  assert.equal(normalized.duration, '00:12');
  assert.equal(normalized.coverUrl, '');

  const merged = mergeStoryEpisodePlans(
    [{ id: 'episode-2', number: 2, clips: [{ id: 'old-clip', durationSec: 10 }] }],
    [{ number: 2, title: 'New title' }],
    { assets: ASSETS, preserveMedia: true },
  );
  assert.equal(merged.length, 1);
  assert.equal(merged[0].id, 'episode-2');
  assert.equal(merged[0].title, 'New title');
  assert.equal(merged[0].clips[0].id, 'old-clip');
});

test('storyPlanningData: merges and invalidates scripts from a selected episode', () => {
  const merged = mergeStoryEpisodeScript(
    {
      id: 'episode-2',
      episodeRef: 'episode-2',
      continuityFacts: ['fact-a'],
      scriptDraft: { text: 'draft' },
    },
    {
      title: 'Episode 2',
      scenes: [{ ref: 'scene-1', heading: 'INT. ROOM', characters: ['Alice'], body: 'Alice enters.' }],
      fullText: 'INT. ROOM\nAlice enters.',
      continuityFacts: ['fact-a', 'fact-b'],
      endingState: {
        characters: ['Alice'],
        props: [],
        unresolvedThreads: ['question'],
      },
    },
  );

  assert.equal(Object.hasOwn(merged, 'scriptDraft'), false);
  assert.equal(merged.scriptStatus, 'completed');
  assert.deepEqual(merged.continuityFacts, ['fact-a', 'fact-b']);
  assert.equal(merged.script.scenes[0].heading, 'INT. ROOM');
  assert.equal(merged.endingState.unresolvedThreads[0], 'question');
  assert.equal(isStoryEpisodeScriptComplete(merged), true);
  assert.throws(
    () => mergeStoryEpisodeScript({}, { fullText: 'missing scenes' }),
    /完整分集剧本缺少场次或正文/u,
  );

  const episodes = [
    { id: 'episode-1', scriptStatus: 'completed', script: { fullText: 'ok', scenes: [{}] }, clips: [{ id: 'kept' }] },
    { id: 'episode-2', scriptStatus: 'completed', script: { fullText: 'old', scenes: [{}] }, clips: [{ id: 'removed' }] },
  ];
  assert.equal(getNextStoryEpisodeScriptIndex(episodes), 2);
  const invalidated = invalidateStoryEpisodeScriptsFrom(episodes, 1);
  assert.equal(invalidated[0].scriptStatus, 'completed');
  assert.equal(invalidated[1].scriptStatus, 'pending');
  assert.equal(invalidated[1].script, null);
  assert.deepEqual(invalidated[1].clips, []);
  assert.equal(invalidated[1].status, '待生成剧本');
});

test('storyPlanningData: inserts, removes, and prompts clips deterministically', () => {
  const deduplicated = ensureUniqueStoryEpisodeClipIds({
    id: 'episode-1',
    clips: [
      { id: 'clip-a', durationSec: 1, result: { videoUrl: 'a.mp4' } },
      { id: 'clip-a', durationSec: 2, result: { videoUrl: 'duplicate.mp4' } },
    ],
  });
  assert.equal(deduplicated.clips[0].id, 'clip-a');
  assert.equal(deduplicated.clips[1].id, 'episode-1-clip-2');
  assert.equal(Object.hasOwn(deduplicated.clips[1], 'result'), false);

  const inserted = insertStoryEpisodeClip(
    {
      id: 'episode-1',
      clips: [
        { id: 'clip-1', number: 1, durationSec: 2 },
        { id: 'clip-2', number: 2, durationSec: 3 },
      ],
    },
    'clip-1',
    { durationSec: 5, promptMode: 'seedance-2.0' },
  );
  assert.deepEqual(
    inserted.episode.clips.map((clip) => [clip.id, clip.number]),
    [
      ['clip-1', 1],
      ['episode-1-clip-manual-3', 2],
      ['clip-2', 3],
    ],
  );
  assert.equal(inserted.episode.durationSec, 10);
  assert.equal(inserted.clip.durationSec, 5);

  const removed = removeStoryEpisodeClip(inserted.episode, 'episode-1-clip-manual-3');
  assert.deepEqual(
    removed.episode.clips.map((clip) => [clip.id, clip.number]),
    [
      ['clip-1', 1],
      ['clip-2', 2],
    ],
  );
  assert.equal(removed.removedClip.id, 'episode-1-clip-manual-3');
  assert.equal(removed.nextClip.id, 'clip-2');
  assert.equal(removed.episode.durationSec, 5);

  assert.equal(
    buildStoryEpisodeClipPrompt({
      clip: { prompt: 'kept', promptLanguage: 'en', shots: [] },
      assets: [],
      visualStyle: 'Cinematic',
    }),
    'kept',
  );
  assert.equal(
    buildStoryEpisodeClipPrompt({
      clip: { prompt: 'A room', shots: [] },
      assets: [],
      visualStyle: 'Cinematic',
    }),
    'Cinematic\nA room',
  );
});
