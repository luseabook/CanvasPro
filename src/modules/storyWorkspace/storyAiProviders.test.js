import test from 'node:test';
import assert from 'node:assert/strict';
import { STORY_AI_PROVIDERS, normalizeStoryAiModel, assertStoryAiModelAvailable, collectStoryAiModels } from './storyAiProviderModel.js';
import { createStoryAiClient } from './storyAiClient.js';
import { createStoryWorkspace } from './storyWorkspaceModel.js';
import { createStoryAiQueueBatch, serializeStoryAiQueue, parseStoryAiQueueSnapshot } from './storyAiQueueModel.js';
import { createStoryAiQueueRunner } from './storyAiQueueRunner.js';

const defaultModel = { provider: 'volcengine', model: 'volcengine/test' };
const task = { prompt: '剧本正文', systemPrompt: '只返回JSON' };
function manifest(provider = 'ppio', modelId = 'shared') {
  return { modelManifest: { provider, modelId, kind: 'text', adapterType: 'modelApi', outputType: 'text',
    inputSlots: { allowedKinds: ['text', 'image'], minByKind: { text: 0, image: 0 } } },
  executionManifest: { provider, kind: 'text', adapterType: 'modelApi', endpointMode: 'chat-completion' } };
}
function resolver(model, { providerHint }) { return manifest(providerHint, model); }
function jobsFor(model = defaultModel) {
  const workspace = createStoryWorkspace(); workspace.episodes[0].script = '正文';
  return createStoryAiQueueBatch(workspace, [workspace.episodes[0].id], model, { count: 1 });
}
function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }

test('all supported provider identities whitelist only provider and model', () => {
  for (const provider of Object.keys(STORY_AI_PROVIDERS)) {
    const model = provider === 'volcengine' ? 'volcengine/test' : 'model-name';
    assert.deepEqual(normalizeStoryAiModel({ provider, model, apiKey: 'SECRET', apiUrl: 'secret', label: 'local' }), { provider, model });
  }
});
test('unknown, prototype and non-string providers are rejected', () => {
  for (const provider of ['other', '__proto__', 'constructor', '', null, {}, ['openai']]) assert.throws(() => normalizeStoryAiModel({ provider, model: 'x' }));
});
test('empty, URL-like, whitespace and oversized model IDs are rejected', () => {
  for (const model of ['', ' a', 'a\nb', 'https://invalid.test/model', 'x'.repeat(301), null]) assert.throws(() => normalizeStoryAiModel({ provider: 'openai', model }));
  assert.throws(() => normalizeStoryAiModel({ provider: 'volcengine', model: 'no-prefix' }));
});
test('compatible custom model tokens preserve case, slashes and fine-tune colons', () => {
  assert.equal(normalizeStoryAiModel({ provider: 'custom', model: 'org/ft:Model-1' }).model, 'org/ft:Model-1');
});
test('known text execution supports chat-completion and responses', () => {
  for (const mode of ['chat-completion', 'responses']) {
    const entry = manifest(); entry.executionManifest.endpointMode = mode;
    assert.deepEqual(assertStoryAiModelAvailable({ provider: 'ppio', model: 'shared' }, () => entry), { provider: 'ppio', model: 'shared' });
  }
});
test('missing model never falls back to a default provider', () => {
  assert.throws(() => assertStoryAiModelAvailable(defaultModel, () => null));
});
test('cross-provider manifest resolution is rejected', () => {
  assert.throws(() => assertStoryAiModelAvailable({ provider: 'ppio', model: 'shared' }, () => manifest('grsai')));
  const entry = manifest(); entry.executionManifest.provider = 'grsai';
  assert.throws(() => assertStoryAiModelAvailable({ provider: 'ppio', model: 'shared' }, () => entry));
});
test('image and workflow manifests cannot enter text execution', () => {
  for (const [part, field, value] of [['modelManifest', 'kind', 'image'], ['executionManifest', 'kind', 'video'], ['modelManifest', 'adapterType', 'workflow'], ['executionManifest', 'adapterType', 'workflow'], ['modelManifest', 'outputType', 'image']]) {
    const entry = manifest(); entry[part][field] = value;
    assert.throws(() => assertStoryAiModelAvailable({ provider: 'ppio', model: 'shared' }, () => entry));
  }
});
test('image-required CV and unrecognized endpoint modes are excluded', () => {
  const entry = manifest('runninghub'); entry.executionManifest.endpointMode = 'image-to-text';
  assert.throws(() => assertStoryAiModelAvailable({ provider: 'runninghub', model: 'cv' }, () => entry));
});
test('required media or malformed minimum counts fail pure-text eligibility', () => {
  for (const minimum of [{ image: 1 }, { video: 1 }, { audio: 1 }, { image: 'required' }]) {
    const entry = manifest(); entry.modelManifest.inputSlots.minByKind = minimum;
    assert.throws(() => assertStoryAiModelAvailable({ provider: 'ppio', model: 'shared' }, () => entry));
  }
});
test('a manifest without text input capability is rejected', () => {
  const entry = manifest(); entry.modelManifest.inputSlots.allowedKinds = ['image'];
  assert.throws(() => assertStoryAiModelAvailable({ provider: 'ppio', model: 'shared' }, () => entry));
});
test('openai and custom are explicit compatibility modes without fabricated manifests', () => {
  for (const provider of ['openai', 'custom']) assert.doesNotThrow(() => assertStoryAiModelAvailable({ provider, model: 'own-model' }, () => { throw new Error('must not resolve'); }));
});
test('catalog keeps default first, deduplicates identity but not equal names across providers', () => {
  const models = collectStoryAiModels({ defaultModel, resolveExecution: resolver,
    nodes: { a: { type: 'ai-text', provider: 'ppio', model: 'shared' } },
    manifests: [manifest('ppio').modelManifest, manifest('grsai').modelManifest, manifest('volcengine', 'volcengine/test').modelManifest] });
  assert.equal(models.length, 3); assert.equal(models[0].provider, 'volcengine');
  assert.deepEqual(models.slice(1).map(m => m.provider), ['ppio', 'grsai']);
});
test('catalog accepts existing text node custom choices, not image nodes or invented custom lists', () => {
  const models = collectStoryAiModels({ defaultModel, resolveExecution: resolver,
    nodes: { a: { type: 'ai-text', provider: 'custom', model: 'my-model', apiKey: 'SECRET' }, b: { type: 'image', provider: 'custom', model: 'not-text' } },
    manifests: [manifest('custom', 'not-a-node').modelManifest] });
  assert.deepEqual(models.map(m => m.model), ['volcengine/test', 'my-model']); assert.ok(!JSON.stringify(models).includes('SECRET'));
});
test('catalog skips unavailable candidates without mutating nodes or manifests', () => {
  const node = Object.freeze({ type: 'storyboard-script', storyboardScript: Object.freeze(defaultModel) });
  assert.deepEqual(collectStoryAiModels({ defaultModel, nodes: { a: node }, resolveExecution: () => null }), []);
});
test('client forwards only whitelisted text and empty media arrays', async () => {
  let sent; const client = createStoryAiClient({ resolveExecution: resolver, execute: async payload => { sent = payload; return { text: 'ok' }; } });
  await client.request({ ...task, apiKey: 'SECRET', apiUrl: 'https://invalid.test', inputUrls: ['private'], generationParams: { token: 'SECRET' } }, { ...defaultModel, apiKey: 'SECRET' });
  assert.deepEqual(sent, { ...defaultModel, ...task, inputUrls: [], inputImageUrls: [], inputVideoUrls: [] });
});
test('invalid model is blocked before the executor, with no lock left pending', () => {
  let calls = 0; const client = createStoryAiClient({ resolveExecution: () => null, execute: async () => { calls++; } });
  assert.throws(() => client.request(task, defaultModel)); assert.equal(calls, 0); assert.equal(client.isPending(), false);
});
test('invalid and oversized prompts are blocked before the executor', () => {
  let calls = 0; const client = createStoryAiClient({ resolveExecution: resolver, execute: async () => { calls++; } });
  for (const invalid of [{}, { ...task, prompt: ' ' }, { ...task, prompt: 'x'.repeat(48001) }, { ...task, systemPrompt: 'x'.repeat(8001) }]) assert.throws(() => client.request(invalid, defaultModel));
  assert.equal(calls, 0);
});
test('one shared client gate blocks concurrent calls even across different providers', async () => {
  const pending = deferred(); let calls = 0;
  const client = createStoryAiClient({ resolveExecution: resolver, execute: () => { calls++; return pending.promise; } });
  const first = client.request(task, defaultModel); assert.equal(client.isPending(), true);
  await assert.rejects(client.request(task, { provider: 'openai', model: 'own' })); assert.equal(calls, 1);
  pending.resolve({ text: 'done' }); await first; assert.equal(client.isPending(), false);
});
test('a provider failure does not trigger retry or a fallback provider', async () => {
  let calls = 0; const client = createStoryAiClient({ resolveExecution: resolver, execute: async () => { calls++; throw new Error('network'); } });
  await assert.rejects(client.request(task, defaultModel)); assert.equal(calls, 1); assert.equal(client.isPending(), false);
});
test('queue snapshots preserve provider identity and exclude credential fields', () => {
  const jobs = jobsFor({ provider: 'custom', model: 'own-model', apiKey: 'SECRET', apiUrl: 'private' });
  const raw = serializeStoryAiQueue('owner', jobs), restored = parseStoryAiQueueSnapshot(raw, 'owner');
  assert.deepEqual(restored[0].model, { provider: 'custom', model: 'own-model' }); assert.equal(restored[0].status, 'held'); assert.ok(!raw.includes('SECRET'));
});
test('old volcengine snapshots and unknown outcomes retain safe restore semantics', () => {
  const jobs = jobsFor(); jobs[0].status = 'running'; jobs[0].attempts = 1;
  const restored = parseStoryAiQueueSnapshot(serializeStoryAiQueue('owner', jobs), 'owner');
  assert.deepEqual(restored[0].model, defaultModel); assert.equal(restored[0].status, 'unknown');
});
test('unavailable manifest does not prevent exporting a preserved queue result', () => {
  const jobs = jobsFor({ provider: 'ppio', model: 'removed-model' }); jobs[0].raw = 'retained'; jobs[0].status = 'invalid';
  assert.ok(serializeStoryAiQueue('owner', jobs).includes('retained'));
  assert.throws(() => assertStoryAiModelAvailable(jobs[0].model, () => null));
});
test('queue preflight rejects a removed model before incrementing attempts or dispatch', async () => {
  let calls = 0; const queue = createStoryAiQueueRunner({ ownerId: 'owner', execute: async () => { calls++; },
    beforeRequest: job => assertStoryAiModelAvailable(job.model, () => null) });
  queue.replace(jobsFor({ provider: 'ppio', model: 'removed' })); await queue.start();
  assert.equal(calls, 0); assert.equal(queue.getJobs()[0].attempts, 0); assert.equal(queue.getJobs()[0].status, 'blocked'); queue.dispose();
});
