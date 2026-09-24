import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORY_EPISODE_SCRIPT_SYSTEM_PROMPT,
  STORY_EPISODE_SCRIPT_REPAIR_SYSTEM_PROMPT,
  STORY_EPISODE_SCRIPT_CONTENT_REVISION_SYSTEM_PROMPT,
  createStoryEpisodeScriptPromptApi,
} from './storyEpisodeScriptPrompt.js';

const normalizeText = (value) => String(value || '').trim();
const normalizeStringArray = (value) => [
  ...new Set((Array.isArray(value) ? value : []).map(normalizeText).filter(Boolean)),
];

function makeApi() {
  return createStoryEpisodeScriptPromptApi({
    normalizeText,
    normalizeStringArray,
    normalizePositiveNumber: (value) => (Number(value) > 0 ? Number(value) : 0),
    normalizeStoryScriptMode: (value) => (value === 'narration' ? 'narration' : 'drama'),
    normalizeStorySummaryCharacter: (value) =>
      value?.name
        ? { ref: value.ref || '', name: value.name, roleType: value.roleType || '', extra: 'dropped' }
        : null,
    normalizeStoryContinuityFacts: (value) => normalizeStringArray(value),
    normalizeStoryContinuityState: (value) => (value && typeof value === 'object' ? value : {}),
    createStoryEpisodeScriptRuntimeGuidance: (episode) => ({
      estimate: episode?.estimatedDurationSeconds || null,
    }),
    schemaVersion: 7,
    narrationMode: 'narration',
  });
}

const PROJECT = {
  title: '雨夜',
  storySummary: '一段摘要',
  logline: '一句话',
  storyBackground: '背景',
  storyContract: { climax: ' 高潮 ' },
  plotBeats: [{ ref: 'b1', stage: '开端', event: '相遇' }, { ref: 'b2' }],
  continuityFacts: ['事实A'],
  storyFacts: ['事实B', '事实A'],
  characters: [{ ref: 'c1', name: '张三', roleType: '主角' }, { ref: 'c2' }],
};

const EPISODE = { ref: 'ep-1', number: 1, title: '第一集', synopsis: '简介', estimatedDurationSeconds: 90 };

test('system prompts are newline-joined rule lists', () => {
  const main = STORY_EPISODE_SCRIPT_SYSTEM_PROMPT.split('\n');
  assert.equal(main.length, 13);
  assert.equal(main[0], '你是一名专业的短剧分集编剧。');
  assert.ok(main.some((line) => line.includes('scriptMode 为 narration')));
  const repair = STORY_EPISODE_SCRIPT_REPAIR_SYSTEM_PROMPT.split('\n');
  assert.equal(repair.length, 5);
  assert.equal(repair[0], '你是短剧分集剧本返回修复助手。');
  const revision = STORY_EPISODE_SCRIPT_CONTENT_REVISION_SYSTEM_PROMPT.split('\n');
  assert.equal(revision.length, 5);
  assert.ok(revision[1].startsWith('只修复 timingReview 已定位'));
});

test('the factory returns buildPrompt and buildContentRevisionPrompt', () => {
  const api = makeApi();
  assert.deepEqual(Object.keys(api), ['buildPrompt', 'buildContentRevisionPrompt']);
});

test('buildPrompt requires a generated story summary', () => {
  const { buildPrompt } = makeApi();
  assert.throws(() => buildPrompt(), { message: '请先生成剧本摘要。' });
  assert.throws(() => buildPrompt({ project: { ...PROJECT, logline: '' }, episode: EPISODE }), {
    message: '请先生成剧本摘要。',
  });
});

test('buildPrompt requires an episode title and synopsis', () => {
  const { buildPrompt } = makeApi();
  assert.throws(() => buildPrompt({ project: PROJECT, episode: { title: '第一集' } }), {
    message: '当前分集缺少标题或简介，无法生成完整剧本。',
  });
});

test('later episodes require the previous episode script', () => {
  const { buildPrompt } = makeApi();
  assert.throws(() => buildPrompt({ project: PROJECT, episode: { ...EPISODE, number: 2 } }), {
    message: '必须先完成第 1 集剧本，才能生成第 2 集。',
  });
});

test('buildPrompt serializes normalized summary, episode and drama requirements', () => {
  const prompt = JSON.parse(makeApi().buildPrompt({ project: PROJECT, episode: EPISODE }));
  assert.equal(prompt.task, 'write_story_episode_script');
  assert.equal(prompt.schemaVersion, 7);
  assert.equal(prompt.scriptMode, 'drama');
  assert.equal(prompt.storySummary.summary, '一段摘要');
  assert.equal(prompt.storySummary.background, '背景');
  assert.deepEqual(prompt.storySummary.storyContract, {
    protagonistGoal: '',
    centralConflict: '',
    stakes: '',
    progressionDriver: '',
    constraints: '',
    climax: '高潮',
    ending: '',
  });
  assert.deepEqual(prompt.storySummary.plotBeats, [
    { ref: 'b1', stage: '开端', event: '相遇', consequence: '' },
  ]);
  assert.deepEqual(prompt.storySummary.storyFacts, ['事实A', '事实B']);
  assert.deepEqual(prompt.storySummary.characters, [{ ref: 'c1', name: '张三', roleType: '主角' }]);
  assert.deepEqual(prompt.currentEpisode, {
    ref: 'ep-1',
    number: 1,
    title: '第一集',
    synopsis: '简介',
    hook: '',
    coreBeat: '',
    endingEvent: '',
    outlineEstimateSeconds: 90,
    continuityFacts: [],
    requiredEndingState: {},
  });
  assert.deepEqual(prompt.runtimeGuidance, { estimate: 90 });
  assert.deepEqual(prompt.continuity, { previousEpisode: null, nextEpisode: null });
  assert.equal(prompt.requirements.length, 15);
  assert.ok(prompt.requirements.at(-1).startsWith('以人物行动、关系碰撞和对白推进剧情'));
  assert.equal(prompt.outputSchema.episodeRef, 'ep-1');
  assert.equal(prompt.outputSchema.scenes[0].ref, 'ep-1-scene-1');
  assert.ok(prompt.outputSchema.scenes[0].body.startsWith('包含动作'));
});

test('episode refs fall back to planningRef, id and then the number', () => {
  const { buildPrompt } = makeApi();
  const refOf = (episode) => JSON.parse(buildPrompt({ project: PROJECT, episode })).currentEpisode.ref;
  assert.equal(refOf({ title: 't', synopsis: 's', planningRef: 'plan-1', id: 'id-1' }), 'plan-1');
  assert.equal(refOf({ title: 't', synopsis: 's', id: 'id-1' }), 'id-1');
  assert.equal(refOf({ title: 't', synopsis: 's', number: 0 }), 'episode-1');
});

test('narration mode swaps in the narration requirements and schema body', () => {
  const prompt = JSON.parse(
    makeApi().buildPrompt({ project: { ...PROJECT, scriptMode: 'narration' }, episode: EPISODE }),
  );
  assert.equal(prompt.scriptMode, 'narration');
  assert.equal(prompt.requirements.length, 21);
  assert.ok(prompt.requirements[14].startsWith('以第三人称旁白为主要叙事载体'));
  assert.ok(prompt.outputSchema.scenes[0].body.startsWith('以“旁白：”为主体'));
});

test('previous episode context keeps the last non-empty scene tail', () => {
  const body = '甲'.repeat(100) + '乙'.repeat(800);
  const prompt = JSON.parse(
    makeApi().buildPrompt({
      project: PROJECT,
      episode: { ...EPISODE, number: 2 },
      previousEpisode: {
        number: 1,
        title: '上集',
        endingState: { props: ['剑'] },
        script: {
          fullText: '全文',
          scenes: [
            { heading: '夜 内 客厅', characters: ['张三', '张三'], body },
            { heading: '空场', body: '   ' },
          ],
        },
      },
      nextEpisode: { title: '下集', synopsis: '下集简介' },
    }),
  );
  assert.deepEqual(prompt.continuity.previousEpisode, {
    number: 1,
    title: '上集',
    synopsis: '',
    hook: '',
    continuityFacts: [],
    endingState: { props: ['剑'] },
    endingScene: { heading: '夜 内 客厅', characters: ['张三'], body: '乙'.repeat(800) },
  });
  assert.deepEqual(prompt.continuity.nextEpisode, {
    number: 3,
    title: '下集',
    synopsis: '下集简介',
    coreBeat: '',
    continuityFacts: [],
  });
});

test('previous episode without scenes falls back to an ending excerpt', () => {
  const prompt = JSON.parse(
    makeApi().buildPrompt({
      project: PROJECT,
      episode: { ...EPISODE, number: 3 },
      previousEpisode: { fullScript: ' 上集全文 ' },
    }),
  );
  assert.equal(prompt.continuity.previousEpisode.number, 2);
  assert.equal(prompt.continuity.previousEpisode.endingExcerpt, '上集全文');
  assert.equal('endingScene' in prompt.continuity.previousEpisode, false);
});

test('content revision prompt normalizes script and timing review', () => {
  const prompt = JSON.parse(
    makeApi().buildContentRevisionPrompt({
      grounding: { scriptMode: 'drama', storySummary: { title: 't' }, ignored: true },
      script: { episodeRef: ' ep-1 ', title: '标题', scenes: [{ ref: 's' }], continuityFacts: ['f', 'f'] },
      timingReview: {
        verdict: ' too_long ',
        naturalDurationSeconds: '95',
        reasonableRangeSeconds: [60, 80],
        findings: ['重复解释', ''],
      },
    }),
  );
  assert.equal(prompt.task, 'revise_story_episode_script_content');
  assert.deepEqual(prompt.grounding, { scriptMode: 'drama', storySummary: { title: 't' } });
  assert.deepEqual(prompt.currentScript, {
    episodeRef: 'ep-1',
    title: '标题',
    scenes: [{ ref: 's' }],
    continuityFacts: ['f'],
    endingState: {},
  });
  assert.deepEqual(prompt.timingReview, {
    verdict: 'too_long',
    naturalDurationSeconds: 95,
    reasonableRangeSeconds: [60, 80],
    reason: '',
    findings: ['重复解释'],
  });
  assert.equal(prompt.requirements.length, 5);
});

test('content revision prompt tolerates missing input', () => {
  const prompt = JSON.parse(makeApi().buildContentRevisionPrompt());
  assert.deepEqual(prompt.grounding, {});
  assert.deepEqual(prompt.currentScript, {
    episodeRef: '',
    title: '',
    scenes: [],
    continuityFacts: [],
    endingState: {},
  });
  assert.deepEqual(prompt.timingReview, {
    verdict: '',
    naturalDurationSeconds: null,
    reason: '',
    findings: [],
  });
});
