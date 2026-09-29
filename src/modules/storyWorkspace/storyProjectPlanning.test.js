import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STORY_EPISODE_COUNT_MAX,
  STORY_EPISODE_COUNT_OPTIONS,
  applyGeneratedStoryResult,
  buildStoryHomeGenerationRequest,
  buildStorySummaryRegenerationRequest,
  createGeneratedStoryProjectData,
  createUploadedStoryProjectData,
  invalidateStoryPlanningDownstream,
  markStorySummaryDownstreamStale,
  normalizeGeneratedStoryContinuityFacts,
  normalizeGeneratedStoryContract,
  normalizeStoryAspectRatio,
  normalizeStoryEpisodeCount,
  normalizeStoryProjectPlanning,
  normalizeStorySceneMaxSeconds,
  resolveGeneratedProjectTitle,
} from './storyProjectPlanning.js';

test('storyProjectPlanning: normalizes planning values and validates home requests', () => {
  assert.equal(normalizeStoryEpisodeCount(12), 12);
  assert.equal(normalizeStoryEpisodeCount(9999), STORY_EPISODE_COUNT_OPTIONS[0]);
  assert.equal(normalizeStoryEpisodeCount('bad'), STORY_EPISODE_COUNT_OPTIONS[0]);
  assert.equal(normalizeStorySceneMaxSeconds(30), 30);
  assert.equal(normalizeStorySceneMaxSeconds(20), 15);
  assert.equal(normalizeStoryAspectRatio('4:3'), '4:3');
  assert.equal(normalizeStoryAspectRatio('bad'), '16:9');
  assert.deepEqual(
    normalizeStoryProjectPlanning({ planning: { episodeCount: 12, sceneMaxSeconds: 30 } }),
    { episodeCount: 12, sceneMaxSeconds: 30, promptMode: 'seedance-2.0' },
  );
  assert.equal(STORY_EPISODE_COUNT_MAX, 100);

  assert.deepEqual(buildStoryHomeGenerationRequest({ mode: 'collaborate' }), {
    ok: false,
    error: '请先在 AI 协作创作中确认正文，再进入制作。',
  });
  assert.equal(
    buildStoryHomeGenerationRequest({ mode: 'upload', scriptFileName: '', scriptText: 'body' }).ok,
    false,
  );
  assert.equal(
    buildStoryHomeGenerationRequest({ mode: 'generate', idea: '' }).ok,
    false,
  );
  assert.equal(
    buildStoryHomeGenerationRequest({
      mode: 'rewrite',
      scriptFileName: 'source.txt',
      scriptText: 'source',
      rewriteInstruction: '',
    }).ok,
    false,
  );

  const upload = buildStoryHomeGenerationRequest({
    mode: 'upload',
    scriptFileName: 'script.txt',
    scriptText: ' episode ',
    scriptMode: 'narration',
    aspectRatio: '4:3',
    episodeCount: 12,
    sceneMaxSeconds: 30,
  });
  assert.equal(upload.ok, true);
  assert.equal(upload.mode, 'upload');
  assert.equal(upload.scriptMode, 'plot');
  assert.equal(upload.scriptFileName, 'script.txt');
  assert.equal(upload.sourceText, ' episode ');
  assert.equal(upload.aspectRatio, '4:3');
  assert.equal(upload.episodeCount, undefined);
  assert.equal(upload.sceneMaxSeconds, 30);
});

test('storyProjectPlanning: builds summary regeneration requests for each source mode', () => {
  assert.equal(buildStorySummaryRegenerationRequest({}).ok, false);
  assert.equal(
    buildStorySummaryRegenerationRequest({
      sourceDocument: { text: 'source' },
      sourceMode: 'upload-rewrite',
      rewriteInstruction: '',
    }).ok,
    false,
  );

  const regenerated = buildStorySummaryRegenerationRequest(
    {
      sourceDocument: { fileName: 'source.txt', text: 'source text' },
      sourceMode: 'upload-rewrite',
      rewriteInstruction: 'tighten it',
      scriptMode: 'narration',
      planning: { episodeCount: 12, sceneMaxSeconds: 30, promptMode: 'seedance-2.0' },
    },
    { modelId: 'model-1', provider: 'runninghub', providerProfileId: 'profile-1' },
  );

  assert.equal(regenerated.ok, true);
  assert.equal(regenerated.mode, 'rewrite');
  assert.equal(regenerated.fileName, 'source.txt');
  assert.equal(regenerated.sourceText, 'source text');
  assert.equal(regenerated.providerProfileId, 'runninghub');
  assert.equal(regenerated.planning.episodeCount, 12);
});

test('storyProjectPlanning: applies generated summaries and invalidates downstream state', () => {
  assert.equal(resolveGeneratedProjectTitle({ generatedTitle: 'Generated' }), 'Generated');
  assert.equal(
    resolveGeneratedProjectTitle({ currentTitle: 'Manual', generatedTitle: 'Generated', userEdited: true }),
    'Manual',
  );
  assert.deepEqual(normalizeGeneratedStoryContinuityFacts(['A', ' A ', '', 'B']), ['A', 'B']);
  assert.deepEqual(normalizeGeneratedStoryContract({ protagonistGoal: ' win ' }), {
    protagonistGoal: 'win',
    centralConflict: '',
    stakes: '',
    progressionDriver: '',
    constraints: '',
    climax: '',
    ending: '',
  });

  const result = applyGeneratedStoryResult(
    { project: { title: 'Original', summaryRevision: 2 }, assets: [{ id: 'a' }], episodes: [] },
    {
      title: 'Generated',
      storySummary: 'Summary',
      storyContract: { protagonistGoal: 'Goal' },
      chapters: [
        { title: 'One', content: 'Body' },
        { title: 'Empty', content: ' ' },
      ],
      continuityFacts: ['A', 'A', 'B'],
    },
  );
  assert.equal(result.project.title, 'Generated');
  assert.equal(result.project.summaryRevision, 3);
  assert.equal(result.project.chapters.length, 1);
  assert.equal(result.project.plotScript, 'One\nBody');
  assert.equal(result.project.storyContract.protagonistGoal, 'Goal');

  const invalidated = invalidateStoryPlanningDownstream(
    {
      assetExtractionDraft: { id: 'draft' },
      project: {
        chapters: [{ id: 'chapter', content: 'body' }],
        compiledScript: { revision: 1 },
        outlineStatus: 'completed',
        storyFacts: ['fact'],
      },
      assets: [{ id: 'asset' }],
      episodes: [{ id: 'episode-1', script: { fullText: 'script' }, clips: [{ id: 'clip' }] }],
    },
    { clearEpisodeOutlines: true },
  );
  assert.equal('assetExtractionDraft' in invalidated, false);
  assert.deepEqual(invalidated.project.chapters, []);
  assert.equal(invalidated.project.compiledScript, null);
  assert.equal(invalidated.project.outlineStatus, 'pending');
  assert.deepEqual(invalidated.assets, []);
  assert.deepEqual(invalidated.episodes, []);

  const staleProject = {
    project: { summaryRevision: 0, outlineStatus: 'completed' },
    episodes: [{ id: 'episode-1' }],
  };
  assert.equal(markStorySummaryDownstreamStale(staleProject), true);
  assert.equal(staleProject.project.summaryRevision, 1);
  assert.equal(staleProject.project.outlineStatus, 'stale');
  assert.equal(markStorySummaryDownstreamStale({}), false);
});

test('storyProjectPlanning: creates generated and uploaded project data', () => {
  const generated = createGeneratedStoryProjectData(
    { title: 'Generated', chapters: [{ title: 'Chapter', content: 'Body' }] },
    {
      projectId: 'story-a',
      request: {
        mode: 'generate',
        idea: 'An idea',
        aspectRatio: '4:3',
        episodeCount: 12,
        sceneMaxSeconds: 30,
      },
    },
  );
  assert.equal(generated.project.id, 'story-a');
  assert.equal(generated.project.title, 'Generated');
  assert.equal(generated.project.originalCreative, 'An idea');
  assert.equal(generated.project.planning.episodeCount, 12);
  assert.equal(generated.project.summaryStatus, 'pending');

  const uploaded = createUploadedStoryProjectData({
    projectId: 'story-b',
    request: {
      mode: 'upload',
      scriptFileName: 'source.txt',
      sourceText: 'Episode one body',
    },
  });
  assert.equal(uploaded.project.id, 'story-b');
  assert.equal(uploaded.project.sourceMode, 'upload-original');
  assert.equal(uploaded.project.summaryStatus, 'skipped');
  assert.equal(uploaded.project.outlineStatus, 'completed');
  assert.ok(uploaded.project.compiledScript);
  assert.equal(uploaded.episodes.length, 1);
});
