import test from 'node:test';
import assert from 'node:assert/strict';
import { createStorySummaryGenerationApi } from './storySummaryGeneration.js';

const STRUCTURED = { name: 'story_summary' };
const DIGEST_PARSE = (value) => value;
const SUMMARY_PARSE = (value) => value;

function makeDeps(overrides = {}) {
  const calls = { assert: [], strict: [], lifecycle: [], prompts: [], digestPrompts: [], split: [] };
  const deps = {
    generateText: async () => 'default-response',
    assertPlanningModel: (model, provider) => {
      calls.assert.push([model, provider]);
      if (!model || !provider) throw new Error('请先选择可用的文本模型。');
    },
    normalizeText: (value) => String(value || '').trim(),
    splitStorySourceText: (text) => {
      calls.split.push(text);
      return [text.slice(0, 5), text.slice(5)];
    },
    sourceChunkCharacters: 8,
    buildStorySourceDigestPrompt: (chunk, index, total) => {
      calls.digestPrompts.push([chunk, index, total]);
      return 'digest:' + chunk;
    },
    parseStorySourceDigest: DIGEST_PARSE,
    sourceDigestSystemPrompt: 'DIGEST_SYSTEM',
    summarySystemPrompt: 'SUMMARY_SYSTEM',
    textRequestTimeoutMs: 1000,
    textMaxOutputTokens: 2000,
    buildStoryTextProviderProfilePayload: (id) => (id ? { providerProfileId: id } : {}),
    requestStrictResult: async (args) => {
      calls.strict.push(args);
      return args.parse === DIGEST_PARSE ? { events: ['e' + calls.strict.length] } : { title: 'T' };
    },
    createStoryInvocationLifecycle: (label, onInvocation, options) => {
      calls.lifecycle.push([label, onInvocation, options]);
      return { lifecycleLabel: label };
    },
    getResultText: (value) => String(value),
    storySummaryBlueprint: {
      buildStorySummaryPrompt: (input) => {
        calls.prompts.push(input);
        return 'SUMMARY_PROMPT';
      },
      createStructuredOutput: () => STRUCTURED,
      parseStorySummaryResult: SUMMARY_PARSE,
    },
    defaultScriptMode: 'drama',
  };
  for (const [key, value] of Object.entries(overrides)) deps[key] = value;
  return { deps, calls };
}

test('returns a frozen api exposing generateStorySummary', () => {
  const api = createStorySummaryGenerationApi(makeDeps().deps);
  assert.ok(Object.isFrozen(api));
  assert.deepEqual(Object.keys(api), ['generateStorySummary']);
});

test('generate mode sends one summary request with the full payload', async () => {
  const { deps, calls } = makeDeps();
  const onInvocation = () => {};
  const progress = [];
  const request = async () => 'x';
  const result = await createStorySummaryGenerationApi(deps).generateStorySummary({
    idea: '一个点子',
    model: ' gpt ',
    provider: ' openai ',
    providerProfileId: 'p1',
    visualStyle: '水墨',
    request,
    onProgress: (event) => progress.push(event),
    onInvocation,
  });
  assert.deepEqual(result, { title: 'T' });
  assert.deepEqual(calls.assert, [[' gpt ', ' openai ']]);
  assert.deepEqual(progress, [{ stage: 'summarizing', current: 1, total: 1, message: '正在生成剧本摘要' }]);
  assert.deepEqual(calls.prompts, [
    {
      mode: 'generate',
      scriptMode: 'drama',
      idea: '一个点子',
      sourceText: '',
      fileName: '',
      sourceDigests: [],
      rewriteInstruction: '',
      visualStyle: '水墨',
      planning: {},
    },
  ]);
  assert.equal(calls.strict.length, 1);
  const [args] = calls.strict;
  assert.equal(args.request, request);
  assert.deepEqual(args.requestPayload, {
    model: 'gpt',
    provider: 'openai',
    providerProfileId: 'p1',
    prompt: 'SUMMARY_PROMPT',
    systemPrompt: 'SUMMARY_SYSTEM',
    structuredOutput: STRUCTURED,
    thinking: { type: 'disabled' },
    temperature: 0.65,
    timeoutMs: 1000,
    maxOutputTokens: 2000,
  });
  assert.equal(args.parse, SUMMARY_PARSE);
  assert.equal(args.retryTemperature, 0.2);
  assert.ok(args.repairInstruction.includes('故事蓝图'));
  assert.ok(args.outputContract.startsWith('title/storyType/targetAudience'));
  assert.equal(args.lifecycleLabel, 'summary');
  assert.equal(calls.lifecycle.length, 1);
  assert.equal(calls.lifecycle[0][0], 'summary');
  assert.equal(calls.lifecycle[0][1], onInvocation);
  assert.equal(calls.lifecycle[0][2].serializeResponse, deps.getResultText);
});

test('temperature follows the normalized mode', async () => {
  for (const [mode, temperature] of [
    ['upload', 0.25],
    ['rewrite', 0.45],
    ['generate', 0.65],
    ['unknown', 0.65],
  ]) {
    const { deps, calls } = makeDeps();
    await createStorySummaryGenerationApi(deps).generateStorySummary({ mode, model: 'm', provider: 'p' });
    assert.equal(calls.strict[0].requestPayload.temperature, temperature);
    assert.equal(calls.prompts[0].mode, mode === 'unknown' ? 'generate' : mode);
  }
});

test('the default request is the injected generateText', async () => {
  const { deps, calls } = makeDeps();
  await createStorySummaryGenerationApi(deps).generateStorySummary({ model: 'm', provider: 'p' });
  assert.equal(calls.strict[0].request, deps.generateText);
  assert.equal('providerProfileId' in calls.strict[0].requestPayload, false);
});

test('a missing planning model stops before any request', async () => {
  const { deps, calls } = makeDeps();
  await assert.rejects(createStorySummaryGenerationApi(deps).generateStorySummary({}), {
    message: '请先选择可用的文本模型。',
  });
  assert.equal(calls.strict.length, 0);
  assert.equal(calls.prompts.length, 0);
});

test('short source text is passed straight to the summary prompt', async () => {
  const { deps, calls } = makeDeps();
  await createStorySummaryGenerationApi(deps).generateStorySummary({
    mode: 'upload',
    sourceText: ' 短文本 ',
    fileName: 'a.txt',
    model: 'm',
    provider: 'p',
  });
  assert.equal(calls.split.length, 0);
  assert.equal(calls.strict.length, 1);
  assert.equal(calls.prompts[0].sourceText, '短文本');
  assert.equal(calls.prompts[0].fileName, 'a.txt');
});

test('long upload source is digested chunk by chunk before summarizing', async () => {
  const { deps, calls } = makeDeps();
  const progress = [];
  const onInvocation = () => {};
  await createStorySummaryGenerationApi(deps).generateStorySummary({
    mode: 'upload',
    sourceText: '0123456789',
    model: 'm',
    provider: 'p',
    providerProfileId: 'pp',
    onProgress: (event) => progress.push(event),
    onInvocation,
  });
  assert.deepEqual(calls.split, ['0123456789']);
  assert.deepEqual(calls.digestPrompts, [
    ['01234', 0, 2],
    ['56789', 1, 2],
  ]);
  assert.deepEqual(progress, [
    { stage: 'digesting', current: 1, total: 2, message: '正在整理原始剧本 1/2' },
    { stage: 'digesting', current: 2, total: 2, message: '正在整理原始剧本 2/2' },
    { stage: 'summarizing', current: 1, total: 1, message: '正在生成剧本摘要' },
  ]);
  assert.equal(calls.strict.length, 3);
  assert.deepEqual(calls.strict[0].requestPayload, {
    model: 'm',
    provider: 'p',
    providerProfileId: 'pp',
    prompt: 'digest:01234',
    systemPrompt: 'DIGEST_SYSTEM',
    temperature: 0.1,
    timeoutMs: 1000,
    maxOutputTokens: 2000,
  });
  assert.equal(calls.strict[0].parse, DIGEST_PARSE);
  assert.equal(
    calls.strict[0].outputContract,
    'characters/settings/events arrays and continuity/endingState strings',
  );
  assert.deepEqual(
    calls.lifecycle.map(([label, handler]) => [label, handler === onInvocation]),
    [
      ['source-digest:1', true],
      ['source-digest:2', true],
      ['summary', true],
    ],
  );
  assert.equal(calls.prompts[0].sourceText, '');
  assert.deepEqual(calls.prompts[0].sourceDigests, [
    { part: 1, events: ['e1'] },
    { part: 2, events: ['e2'] },
  ]);
});

test('rewrite mode labels digest progress as reference script', async () => {
  const { deps } = makeDeps();
  const progress = [];
  await createStorySummaryGenerationApi(deps).generateStorySummary({
    mode: 'rewrite',
    sourceText: '0123456789',
    model: 'm',
    provider: 'p',
    onProgress: (event) => progress.push(event.message),
  });
  assert.deepEqual(progress, ['正在整理参考剧本 1/2', '正在整理参考剧本 2/2', '正在生成剧本摘要']);
});

test('generate mode never digests long source text', async () => {
  const { deps, calls } = makeDeps();
  await createStorySummaryGenerationApi(deps).generateStorySummary({
    sourceText: '0123456789',
    model: 'm',
    provider: 'p',
  });
  assert.equal(calls.split.length, 0);
  assert.equal(calls.strict.length, 1);
  assert.equal(calls.prompts[0].sourceText, '0123456789');
});
