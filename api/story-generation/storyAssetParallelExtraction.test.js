import test from 'node:test';
import assert from 'node:assert/strict';
import { createParallelStoryAssetExtractor } from './storyAssetParallelExtraction.js';
import { STORY_ASSET_FOCUSED_MAX_OUTPUT_TOKENS } from './storyAssetHybridBudget.js';
import {
  STORY_ASSET_EXTRACTION_KINDS,
  STORY_ASSET_EXTRACTION_SCHEMA_VERSION,
  normalizeStoryAssetReference,
} from './storyAssetExtractionResult.js';
import { getResultText } from './storyTextRequest.js';
import { normalizeText } from '../utils/storyGenerationValues.js';

const PROJECT = { title: '雨夜', chapters: [{ id: 'c1' }, { id: 'c2' }] };
const asset = (kind, ref = kind + '-a', appearances = [{ ref: 'look' }]) => ({
  kind,
  ref,
  name: kind,
  appearances,
});
const ok = (kind, assets = [asset(kind)]) => JSON.stringify({ assets });

// Parsers and the single-kind extractor are injected collaborators; these doubles record how the
// parallel coordinator drives them. The project normalizer comes from src/domain, which this repo lacks.
function makeHarness({ responses = {}, errors = {}, preErrors = {}, rejectParse = [] } = {}) {
  const calls = { extract: [], requests: [], parse: [] };
  const parse = (mode) => (text, options) => {
    calls.parse.push({ mode, options });
    const data = JSON.parse(text);
    if (data.invalid || rejectParse.includes(data.assets?.[0]?.kind)) throw new Error('资产返回格式无效');
    return { assets: data.assets, ...(data.decisions ? { decisions: data.decisions } : {}) };
  };
  const parseVerbose = parse('verbose');
  const parseCompact = parse('compact');
  const request = async (payload) => {
    calls.requests.push(payload);
    if (errors[payload.kind]) throw errors[payload.kind];
    return Object.hasOwn(responses, payload.kind) ? responses[payload.kind] : ok(payload.kind);
  };
  const extract = createParallelStoryAssetExtractor({
    schemaVersion: STORY_ASSET_EXTRACTION_SCHEMA_VERSION,
    assetKinds: STORY_ASSET_EXTRACTION_KINDS,
    generateText: async () => assert.fail('default request must not be used'),
    normalizeText,
    getResultText,
    normalizeStoryProjectInput: (project) => ({
      title: normalizeText(project?.title),
      chapters: Array.isArray(project?.chapters) ? project.chapters : [],
      aspectRatio: project?.aspectRatio || '16:9',
      visualStyle: project?.visualStyle || '',
    }),
    normalizeAssetReference: normalizeStoryAssetReference,
    parseStoryAssetExtractionResult: parseVerbose,
    parseStoryAssetCompactExtractionResult: parseCompact,
    extractStoryAssets: async (options) => {
      calls.extract.push(options);
      const kind = options.assetKinds[0];
      if (preErrors[kind]) throw preErrors[kind];
      const response = await options.request({ kind, stage: 'first' });
      return (options.compactOutput ? parseCompact : parseVerbose)(getResultText(response), { kind });
    },
  });
  const run = async (options = {}) => {
    const checkpoints = [];
    const progress = [];
    try {
      const result = await extract({
        project: PROJECT,
        model: 'm',
        provider: 'p',
        request,
        onCheckpoint: (draft) => checkpoints.push(draft),
        onProgress: (event) => progress.push(event),
        ...options,
      });
      return { result, checkpoints, progress, draft: checkpoints.at(-1) };
    } catch (error) {
      return { error, checkpoints, progress, draft: error.assetExtractionDraft || checkpoints.at(-1) };
    }
  };
  return { calls, run };
}

test('all three kinds are extracted in parallel and checkpointed', async () => {
  const harness = makeHarness();
  const { result, checkpoints, progress, draft } = await harness.run({ providerProfileId: 'pp' });
  assert.deepEqual(result, {
    schemaVersion: 2,
    extractionStrategy: 'kind-detailed-parallel',
    assets: [
      asset('character'),
      { ...asset('scene'), appearances: [{ ref: 'scene-a-appearance-1-2' }] },
      { ...asset('prop'), appearances: [{ ref: 'prop-a-appearance-1-2' }] },
    ],
  });
  assert.deepEqual(
    harness.calls.extract.map((options) => options.assetKinds),
    [['character'], ['scene'], ['prop']],
  );
  const first = harness.calls.extract[0];
  assert.equal(first.maxOutputTokens, STORY_ASSET_FOCUSED_MAX_OUTPUT_TOKENS);
  assert.equal(first.compactOutput, false);
  assert.equal(first.providerProfileId, 'pp');
  assert.equal(first.allowOversizedPrompt, true);
  assert.equal(first.structuredOutputFallback, 'prompt');
  assert.equal(progress[0].message, '正在并行提取角色、场景与道具');
  assert.equal(progress.at(-1).message, '资产提取完成：3 个');
  assert.equal(draft.strategy, 'kind-detailed-parallel-v1');
  assert.equal(draft.status, 'completed');
  assert.equal(draft.responseMode, 'verbose');
  assert.equal(draft.totalRequestCount, 3);
  assert.deepEqual(draft.completedKinds, ['character', 'scene', 'prop']);
  assert.deepEqual(draft.failures, []);
  assert.match(draft.sourceFingerprint, /^2-[0-9a-f]{8}-\d+$/);
  for (const kind of STORY_ASSET_EXTRACTION_KINDS) {
    assert.equal(draft.kindStates[kind].status, 'succeeded');
    assert.equal(draft.kindStates[kind].requestCount, 1);
    assert.equal(draft.submissionStatesByKind[kind].status, 'validated');
    assert.equal(draft.rawResponsesByKind[kind], ok(kind));
    assert.equal(draft.contractSnapshotByKind[kind].responseSchemaVersion, 1);
  }
  assert.ok(checkpoints.length >= 10);
});

test('duplicate asset and appearance refs are made unique across kinds', async () => {
  const shared = (kind) =>
    ok(kind, [asset(kind, 'hero', [{ ref: 'look' }, { ref: '' }]), asset(kind, '', [])]);
  const harness = makeHarness({
    responses: { character: shared('character'), scene: shared('scene'), prop: ok('prop', []) },
  });
  const { result } = await harness.run();
  assert.deepEqual(
    result.assets.map((item) => [item.ref, item.appearances.map((appearance) => appearance.ref)]),
    [
      ['hero', ['look', 'hero-appearance-2']],
      ['character-2', []],
      ['scene-1-2', ['scene-1-2-appearance-1-2', 'scene-1-2-appearance-2']],
      ['scene-2', []],
    ],
  );
});

test('video replication projects route requests through the streaming policy', async () => {
  const harness = makeHarness();
  await harness.run({ project: { ...PROJECT, sourceMode: 'video-replication' } });
  assert.equal(harness.calls.requests.length, 3);
  for (const payload of harness.calls.requests) {
    assert.equal(payload.stream, true);
    assert.deepEqual(payload.streamTimeouts, { idleMs: 180000, totalMs: 1800000 });
  }
});

test('compact lanes with nothing to extract finish locally without a request', async () => {
  const harness = makeHarness();
  const { result, progress, draft } = await harness.run({
    compactOutputByKind: { character: 'verbose', scene: 'compact', prop: 'verbose' },
    requiredAssetNamesByKind: { character: [], scene: [], prop: ['钥匙'] },
  });
  assert.deepEqual(
    harness.calls.requests.map((payload) => payload.kind),
    ['character', 'prop'],
  );
  assert.ok(progress.some((event) => event.message === '场景无待提取资产，已在本地完成'));
  assert.equal(draft.responseMode, 'mixed');
  assert.equal(draft.kindStates.scene.responseMode, 'compact');
  assert.equal(draft.requestedContractSnapshotByKind.scene.responseSchemaVersion, 2);
  assert.deepEqual(
    draft.requestedContractSnapshotByKind.prop.requiredAssets.map((item) => item.name),
    ['钥匙'],
  );
  assert.equal(result.assets.length, 2);
});

test('pre-submission failures are classified and keep other kinds', async () => {
  const harness = makeHarness({
    preErrors: {
      character: new Error('fetch failed'),
      scene: Object.assign(new Error('boom'), { code: 'ENOTFOUND' }),
      prop: new Error('too many states in schema'),
    },
  });
  const { error, draft } = await harness.run();
  assert.equal(error.message, '角色提取失败：fetch failed');
  assert.equal(error.type, undefined);
  assert.equal(harness.calls.requests.length, 0);
  assert.equal(draft.status, 'failed');
  assert.deepEqual(
    draft.failures.map((failure) => [failure.kind, failure.errorType]),
    [
      ['character', 'network-error'],
      ['scene', 'dns-error'],
      ['prop', 'schema-complexity'],
    ],
  );
  assert.deepEqual(draft.submissionStatesByKind, {});
});

test('confirmed uncharged rejections fail only their lane', async () => {
  const harness = makeHarness({
    errors: { scene: Object.assign(new Error('unauthorized'), { status: 401 }) },
  });
  const { error, draft, progress } = await harness.run();
  assert.equal(error.message, '场景提取失败：unauthorized');
  assert.equal(error.type, undefined);
  assert.equal(error.cause.status, 401);
  assert.equal(draft.status, 'partial');
  assert.deepEqual(draft.completedKinds, ['character', 'prop']);
  assert.equal(draft.kindStates.scene.status, 'failed');
  assert.equal(draft.kindStates.scene.errorType, 'request-error');
  assert.equal(draft.submissionStatesByKind.scene.status, 'rejected-confirmed');
  assert.equal(progress.at(-1).message, '已保留 2/3 路付费结果；仅需重试失败项');
});

test('ambiguous submissions block automatic retries', async () => {
  const harness = makeHarness({ errors: { prop: new Error('request timeout') } });
  const { error, draft } = await harness.run();
  assert.equal(error.type, 'ASSET_SUBMISSION_AMBIGUOUS');
  assert.deepEqual(error.blockedKinds, ['prop']);
  assert.equal(draft.status, 'blocked');
  assert.equal(draft.kindStates.prop.status, 'blocked-ambiguous-submission');
  assert.equal(draft.kindStates.prop.errorType, 'ambiguous-submission');
  assert.equal(draft.submissionStatesByKind.prop.status, 'ambiguous');
  assert.equal(draft.submissionStatesByKind.prop.errorType, 'timeout');
});

test('paid responses that fail validation or come back empty are protected', async () => {
  const invalid = makeHarness({ responses: { character: JSON.stringify({ invalid: true }) } });
  const first = await invalid.run();
  assert.equal(first.error.type, 'ASSET_PAID_RESULT_BLOCKED');
  assert.deepEqual(first.error.blockedKinds, ['character']);
  assert.equal(first.draft.kindStates.character.status, 'blocked-paid-response');
  assert.equal(first.draft.kindStates.character.errorType, 'paid-result-validation');
  assert.equal(first.draft.rawResponsesByKind.character, '{"invalid":true}');
  assert.equal(first.draft.paidResponseReceivedByKind.character, true);
  const empty = makeHarness({ responses: { scene: '   ' } });
  const second = await empty.run();
  assert.equal(second.error.message, '场景提取失败：场景付费请求返回空内容；需要明确授权后才能重新请求。');
  assert.equal(second.draft.kindStates.scene.errorType, 'empty-paid-response');
  assert.equal(second.draft.submissionStatesByKind.scene.status, 'blocked-paid-response');
});

test('a resumed draft only retries lanes that did not succeed', async () => {
  const failing = makeHarness({
    errors: { scene: Object.assign(new Error('bad request'), { status: 400 }) },
  });
  const { draft } = await failing.run();
  const harness = makeHarness();
  const { result, progress } = await harness.run({ resumeDraft: draft });
  assert.deepEqual(
    harness.calls.requests.map((payload) => payload.kind),
    ['scene'],
  );
  assert.equal(progress[0].current, 2);
  assert.equal(result.assets.length, 3);
});

test('saved paid responses are replayed locally or stay blocked', async () => {
  const { draft } = await makeHarness({ rejectParse: ['character'] }).run();
  const recovered = makeHarness();
  const replay = await recovered.run({ resumeDraft: draft });
  assert.equal(recovered.calls.requests.length, 0);
  assert.deepEqual(recovered.calls.parse[0].options, {
    chapterIds: ['c1', 'c2'],
    allowedKinds: ['character'],
    allowEmptyResult: false,
  });
  assert.ok(replay.progress.some((event) => event.message === '角色已从上次付费结果恢复：1 个'));
  assert.equal(replay.result.assets.length, 3);
  const stillBad = makeHarness({ rejectParse: ['character'] });
  const blocked = await stillBad.run({ resumeDraft: draft });
  assert.equal(blocked.error.type, 'ASSET_PAID_RESULT_BLOCKED');
  assert.equal(blocked.error.message, '已付费的角色结果未通过合同校验；已保留原始返回且未自动重新请求。');
  assert.equal(stillBad.calls.requests.length, 0);
});

test('authorized reruns archive the paid lane before requesting again', async () => {
  const invalid = JSON.stringify({ invalid: true, assets: [asset('character')] });
  const { draft } = await makeHarness({ responses: { character: invalid } }).run();
  const harness = makeHarness();
  const { result, draft: next } = await harness.run({
    resumeDraft: draft,
    paidRerunAuthorization: { confirmed: true, authorizedKinds: ['character'] },
  });
  assert.deepEqual(
    harness.calls.requests.map((payload) => payload.kind),
    ['character'],
  );
  assert.equal(result.assets.length, 3);
  const [archived] = next.paidResponseHistoryByKind.character;
  assert.equal(archived.reason, 'authorized-invalid-paid-response-rerun');
  assert.equal(archived.rawResponse, invalid);
  assert.equal(archived.responseMode, 'verbose');
  assert.equal(next.kindStates.character.requestCount, 2);
  const unconfirmed = makeHarness();
  const blocked = await unconfirmed.run({
    resumeDraft: draft,
    paidRerunAuthorization: { authorizedKinds: ['character'] },
  });
  assert.equal(blocked.error.type, 'ASSET_PAID_RESULT_BLOCKED');
});

test('ambiguous drafts are blocked on resume unless a rerun is authorized', async () => {
  const { draft } = await makeHarness({ errors: { prop: new Error('socket hang up') } }).run();
  const blockedRun = makeHarness();
  const blocked = await blockedRun.run({ resumeDraft: draft });
  assert.equal(blocked.error.type, 'ASSET_SUBMISSION_AMBIGUOUS');
  assert.equal(blocked.error.message, '道具请求的计费状态不明确；未自动重新请求。');
  assert.equal(blockedRun.calls.requests.length, 0);
  const authorized = makeHarness();
  const rerun = await authorized.run({
    resumeDraft: draft,
    paidRerunAuthorization: { confirmed: true, authorizedKinds: ['prop'] },
  });
  assert.deepEqual(
    authorized.calls.requests.map((payload) => payload.kind),
    ['prop'],
  );
  assert.equal(rerun.draft.paidResponseHistoryByKind.prop[0].reason, 'authorized-ambiguous-submission-rerun');
});

test('source changes block paid lanes unless the old fingerprint is aliased', async () => {
  const { draft } = await makeHarness().run();
  const changed = { ...PROJECT, chapters: [{ id: 'c1' }] };
  const blockedRun = makeHarness();
  const blocked = await blockedRun.run({ project: changed, resumeDraft: draft });
  assert.equal(blocked.error.type, 'ASSET_CONTRACT_INCOMPATIBLE');
  assert.equal(blocked.error.message, '已付费的角色、场景、道具结果与当前合同不兼容；未自动重新请求。');
  assert.deepEqual(blocked.error.blockedKinds, ['character', 'scene', 'prop']);
  assert.match(blocked.draft.kindStates.scene.errorMessage, /剧本来源或草稿版本/);
  assert.notEqual(blocked.draft.sourceFingerprint, draft.sourceFingerprint);
  assert.equal(blockedRun.calls.requests.length, 0);
  const again = await makeHarness().run({ project: changed, resumeDraft: blocked.draft });
  assert.equal(again.error.type, 'ASSET_CONTRACT_INCOMPATIBLE');
  assert.match(again.draft.kindStates.scene.errorMessage, /缺少其原始合同快照/);
  const aliased = makeHarness();
  const resumed = await aliased.run({
    project: changed,
    resumeDraft: draft,
    resumeSourceFingerprintAliases: [draft.sourceFingerprint],
  });
  assert.equal(aliased.calls.requests.length, 0);
  assert.equal(resumed.result.assets.length, 3);
  assert.notEqual(resumed.draft.sourceFingerprint, draft.sourceFingerprint);
});

test('contract changes block saved paid lanes', async () => {
  const { draft } = await makeHarness().run();
  const harness = makeHarness();
  const { error, draft: next } = await harness.run({
    resumeDraft: draft,
    requiredAssetsByKind: { character: [{ name: '张三' }] },
  });
  assert.equal(error.type, 'ASSET_CONTRACT_INCOMPATIBLE');
  assert.deepEqual(error.blockedKinds, ['character']);
  assert.match(next.kindStates.character.errorMessage, /资产合同版本/);
  const allowed = makeHarness();
  const revalidated = await allowed.run({
    resumeDraft: draft,
    requiredAssetsByKind: { character: [{ name: '张三' }] },
    allowSavedPaidResultContractRevalidation: true,
  });
  assert.equal(revalidated.result.assets.length, 3);
  assert.equal(allowed.calls.requests.length, 0);
});

test('quality rerun blocks require explicit authorization', async () => {
  const { draft } = await makeHarness().run();
  draft.kindStates.scene.status = 'blocked-quality-rerun';
  const blocked = await makeHarness().run({ resumeDraft: structuredClone(draft) });
  assert.equal(blocked.error.type, 'ASSET_VISUAL_QUALITY_RERUN_REQUIRED');
  assert.equal(blocked.error.message, '已付费的场景结果未通过视觉质量合同；未自动重新请求。');
  assert.equal(blocked.draft.kindStates.scene.errorType, 'quality-rerun-required');
  const harness = makeHarness();
  const rerun = await harness.run({
    resumeDraft: structuredClone(draft),
    paidRerunAuthorization: { confirmed: true, authorizedKinds: ['scene'] },
  });
  assert.deepEqual(
    harness.calls.requests.map((payload) => payload.kind),
    ['scene'],
  );
  assert.equal(rerun.draft.paidResponseHistoryByKind.scene[0].reason, 'authorized-quality-rerun');
});

test('drafts from another strategy are ignored', async () => {
  const harness = makeHarness();
  const { result } = await harness.run({
    resumeDraft: { strategy: 'other', kindStates: { character: { status: 'succeeded' } } },
  });
  assert.equal(harness.calls.requests.length, 3);
  assert.equal(result.assets.length, 3);
});
