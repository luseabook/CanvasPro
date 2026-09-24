import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORY_SUMMARY_SCHEMA_VERSION,
  STORY_SUMMARY_MAX_CORE_CHARACTERS,
  STORY_SUMMARY_MAX_PLOT_BEATS,
  STORY_SUMMARY_SYSTEM_PROMPT,
  createStorySummaryBlueprint,
} from './storySummaryBlueprint.js';

function makeBlueprint(overrides = {}) {
  const planningCalls = [];
  const blueprint = createStorySummaryBlueprint({
    normalizeStoryScriptMode:
      'normalizeStoryScriptMode' in overrides
        ? overrides.normalizeStoryScriptMode
        : (mode) => (mode === 'narration' ? 'narration' : 'plot'),
    validateStoryPlanningConstraints:
      'validateStoryPlanningConstraints' in overrides
        ? overrides.validateStoryPlanningConstraints
        : (planning) => (planningCalls.push(planning), { episodeCount: planning?.episodeCount || 20 }),
    ...('continuityMaxFacts' in overrides ? { continuityMaxFacts: overrides.continuityMaxFacts } : {}),
  });
  return { blueprint, planningCalls };
}

const beat = (n) => ({ stage: '阶段' + n, event: '事件' + n, consequence: '结果' + n });
function validSummary(overrides = {}) {
  return {
    title: '雨夜',
    storyType: '悬疑',
    targetAudience: '成人',
    storySummary: '梗概',
    storyBackground: '背景',
    storySetting: '设定',
    coreHook: '卖点',
    logline: '一句话',
    storyContract: {
      protagonistGoal: '目标',
      centralConflict: '冲突',
      stakes: '代价',
      progressionDriver: '动力',
      constraints: '约束',
      climax: '高潮',
      ending: '结局',
    },
    plotBeats: [beat(1), beat(2), beat(3), beat(4)],
    continuityFacts: ['事实'],
    characters: [{ name: '张三', roleType: '主角', fixedTraits: '左手伤疤', coreTags: ['侦探'] }],
    ...overrides,
  };
}

test('exposes schema constants and an 11-rule system prompt', () => {
  assert.equal(STORY_SUMMARY_SCHEMA_VERSION, 4);
  assert.equal(STORY_SUMMARY_MAX_CORE_CHARACTERS, 8);
  assert.equal(STORY_SUMMARY_MAX_PLOT_BEATS, 8);
  const lines = STORY_SUMMARY_SYSTEM_PROMPT.split('\n');
  assert.equal(lines.length, 11);
  assert.equal(lines[0], '你是一名专业的短剧总编剧与故事策划。');
});

test('the factory requires both collaborators and returns a frozen api', () => {
  assert.throws(() => makeBlueprint({ normalizeStoryScriptMode: null }), {
    name: 'TypeError',
    message: 'Story Summary Blueprint 需要剧本模式规范化函数。',
  });
  assert.throws(() => makeBlueprint({ validateStoryPlanningConstraints: null }), {
    name: 'TypeError',
    message: 'Story Summary Blueprint 需要规划约束校验函数。',
  });
  assert.throws(() => createStorySummaryBlueprint(), TypeError);
  const { blueprint } = makeBlueprint();
  assert.ok(Object.isFrozen(blueprint));
  assert.deepEqual(Object.keys(blueprint), [
    'buildStorySummaryPrompt',
    'createStructuredOutput',
    'normalizeStoryContract',
    'normalizeStoryPlotBeat',
    'normalizeStorySummaryCharacter',
    'parseStorySummaryResult',
  ]);
});

test('character, contract and plot beat normalizers fill defaults', () => {
  const { blueprint } = makeBlueprint();
  assert.equal(blueprint.normalizeStorySummaryCharacter({ ref: 'x' }), null);
  assert.deepEqual(
    blueprint.normalizeStorySummaryCharacter({ name: ' 张三 ', role: '反派', coreTags: ['a', 'a', ' '] }, 1),
    {
      ref: 'character-2',
      name: '张三',
      roleType: '反派',
      fixedTraits: '',
      visualAppearance: '',
      voiceDescription: '',
      coreTags: ['a'],
      profile: '',
      motivation: '',
      relationships: '',
      personality: '',
      arc: '',
    },
  );
  assert.equal(blueprint.normalizeStorySummaryCharacter({ name: 'x' }).roleType, '其他角色');
  assert.deepEqual(Object.values(blueprint.normalizeStoryContract(['bad'])), ['', '', '', '', '', '', '']);
  assert.equal(blueprint.normalizeStoryPlotBeat({ ref: 'only-ref' }), null);
  assert.deepEqual(blueprint.normalizeStoryPlotBeat({ event: ' e ' }, 4), {
    ref: 'plot-beat-5',
    stage: '',
    event: 'e',
    consequence: '',
  });
});

test('parseStorySummaryResult normalizes and caps a valid blueprint', () => {
  const { blueprint } = makeBlueprint({ continuityMaxFacts: 2 });
  const beats = Array.from({ length: 10 }, (_, index) => beat(index + 1));
  const characters = Array.from({ length: 9 }, (_, index) => ({
    name: '人' + index,
    fixedTraits: 't',
    coreTags: ['c'],
  }));
  const result = blueprint.parseStorySummaryResult({
    text: JSON.stringify(
      validSummary({ plotBeats: beats, characters, continuityFacts: ['a', 'b', 'c', 'a'] }),
    ),
  });
  assert.equal(result.schemaVersion, 4);
  assert.equal(result.title, '雨夜');
  assert.equal(result.plotBeats.length, 8);
  assert.equal(result.plotBeats[0].ref, 'plot-beat-1');
  assert.equal(result.characters.length, 8);
  assert.deepEqual(result.continuityFacts, ['a', 'b']);
});

test('parseStorySummaryResult rejects incomplete blueprints', () => {
  const { blueprint } = makeBlueprint();
  const parse = (overrides) => () =>
    blueprint.parseStorySummaryResult(JSON.stringify(validSummary(overrides)));
  assert.throws(() => blueprint.parseStorySummaryResult(''), { message: 'Agent 未返回剧本摘要。' });
  assert.throws(parse({ title: '' }), { message: 'Agent 返回结果缺少故事标题。' });
  assert.throws(parse({ logline: ' ' }), { message: 'Agent 返回结果缺少一句话故事。' });
  assert.throws(parse({ storyContract: { ...validSummary().storyContract, stakes: '' } }), {
    message: 'Agent 返回结果缺少故事契约字段：stakes。',
  });
  assert.throws(parse({ plotBeats: [beat(1), beat(2), beat(3)] }), {
    message: 'Agent 返回结果缺少完整的因果剧情节点。',
  });
  assert.throws(parse({ plotBeats: [beat(1), beat(2), beat(3), { stage: 's', event: 'e' }] }), {
    message: 'Agent 返回的剧情节点缺少阶段、事件或结果。',
  });
  assert.throws(parse({ continuityFacts: [] }), { message: 'Agent 返回结果缺少连续性事实。' });
  assert.throws(parse({ characters: [{ ref: 'no-name' }] }), { message: 'Agent 返回结果缺少人物小传。' });
  assert.throws(parse({ characters: [{ name: '张三', fixedTraits: '伤疤', coreTags: [] }] }), {
    message: 'Agent 返回的人物“张三”缺少剧情固定特征或核心标签。',
  });
});

test('buildStorySummaryPrompt validates mode inputs', () => {
  const { blueprint } = makeBlueprint();
  assert.throws(() => blueprint.buildStorySummaryPrompt({ idea: ' ' }), { message: '请先输入故事设定。' });
  assert.throws(() => blueprint.buildStorySummaryPrompt({ mode: 'upload' }), {
    message: '没有可供整理的剧本文本。',
  });
  assert.throws(() => blueprint.buildStorySummaryPrompt({ mode: 'rewrite', sourceText: '原稿' }), {
    message: '请先填写改写要求。',
  });
  assert.doesNotThrow(() =>
    blueprint.buildStorySummaryPrompt({ mode: 'upload', sourceDigests: [{ part: 1 }] }),
  );
});

test('generate prompts carry the idea, planning limit and plot-mode rules', () => {
  const { blueprint, planningCalls } = makeBlueprint();
  const planning = { episodeCount: 12 };
  const prompt = JSON.parse(blueprint.buildStorySummaryPrompt({ mode: 'weird', idea: ' 点子 ', planning }));
  assert.deepEqual(planningCalls, [planning]);
  assert.equal(prompt.task, 'create_story_summary');
  assert.equal(prompt.schemaVersion, 4);
  assert.equal(prompt.mode, 'generate');
  assert.equal(prompt.scriptMode, 'plot');
  assert.equal(prompt.episodeLimit, 12);
  assert.deepEqual(prompt.input, { idea: '点子' });
  assert.equal(prompt.creativeDirection.selectedStyle, '');
  assert.equal(prompt.creativeDirection.instruction, '未指定额外风格，按原始创意本身确定故事气质。');
  assert.equal(prompt.requirements.length, 11);
  assert.equal(prompt.requirements[0], '未指定额外风格时，不要自行套用固定的画面风格或类型模板。');
  assert.ok(prompt.requirements.some((line) => line.startsWith('后续最多规划 12 集')));
  assert.ok(prompt.requirements.at(-1).startsWith('后续采用剧情模式'));
  assert.equal(prompt.outputSchema.characters.length, 1);
});

test('rewrite prompts add priority rules, instruction input and style direction', () => {
  const { blueprint } = makeBlueprint();
  const prompt = JSON.parse(
    blueprint.buildStorySummaryPrompt({
      mode: 'rewrite',
      scriptMode: 'narration',
      sourceText: ' 原稿 ',
      fileName: ' a.docx ',
      rewriteInstruction: ' 改成喜剧 ',
      visualStyle: '水墨',
    }),
  );
  assert.equal(prompt.mode, 'rewrite');
  assert.equal(prompt.scriptMode, 'narration');
  assert.deepEqual(prompt.input, {
    fileName: 'a.docx',
    sourceText: '原稿',
    sourceDigests: [],
    rewriteInstruction: '改成喜剧',
  });
  assert.equal(prompt.requirements.length, 12);
  assert.ok(prompt.requirements[0].startsWith('执行优先级为'));
  assert.ok(prompt.requirements[1].startsWith('围绕所选风格“水墨”设计故事本身'));
  assert.ok(prompt.requirements.at(-1).startsWith('后续采用解说模式'));
  assert.ok(prompt.creativeDirection.instruction.startsWith('把所选视觉风格作为改写要求的辅助制作方向'));
});

test('upload prompts omit the rewrite instruction', () => {
  const { blueprint } = makeBlueprint();
  const prompt = JSON.parse(
    blueprint.buildStorySummaryPrompt({ mode: 'upload', sourceText: '原文', rewriteInstruction: '忽略' }),
  );
  assert.deepEqual(prompt.input, { fileName: '', sourceText: '原文', sourceDigests: [] });
  assert.ok(prompt.modeInstruction.startsWith('忠于原文人物'));
});

test('planning validation errors propagate', () => {
  const { blueprint } = makeBlueprint({
    validateStoryPlanningConstraints: () => {
      throw new Error('集数超限');
    },
  });
  assert.throws(() => blueprint.buildStorySummaryPrompt({ idea: 'x' }), { message: '集数超限' });
});

test('structured output uses the configured continuity cap', () => {
  const output = makeBlueprint().blueprint.createStructuredOutput();
  assert.equal(output.name, 'story_summary_blueprint');
  assert.equal(output.strict, true);
  assert.equal(output.fallback, 'prompt');
  assert.equal(output.schema.properties.continuityFacts.maxItems, 12);
  assert.equal(output.schema.properties.plotBeats.minItems, 4);
  assert.equal(output.schema.properties.characters.maxItems, 8);
  assert.equal(output.schema.required.length, 12);
  const custom = makeBlueprint({ continuityMaxFacts: 5 }).blueprint.createStructuredOutput('custom');
  assert.equal(custom.name, 'custom');
  assert.equal(custom.schema.properties.continuityFacts.maxItems, 5);
});
