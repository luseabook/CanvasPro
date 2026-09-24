import test from 'node:test';
import assert from 'node:assert/strict';
import { createAIGenerateNodeTaskOrchestrationModule } from './taskOrchestrationModule.js';

// Independent from the legacy suite's absent tests/testPreviewDom.js fixture.
// Only recovery policy and a stubbed explicit run are exercised: no DOM, storage or vendor API.
function fixture(batch = true) {
  const data = { id: 'node-a', provider: 'apimart', model: 'apimart/nano-banana-2', asyncTaskStatus: 'pending',
    ...(batch ? { storyMediaBatch: { version: 1, batchId: 'batch-a', state: 'attempted' } } : {}) };
  const proto = createAIGenerateNodeTaskOrchestrationModule({ store: { getState: () => ({ nodes: { 'node-a': data } }) } });
  let called = 0;
  const ctx = Object.assign(Object.create(proto), { nodeId: data.id, _data: data,
    _inferProviderFromModel: () => 'apimart', _hasImageGenerationResult: () => false,
    _onGenerate: async () => { called++; } });
  return { data, proto, ctx, called: () => called };
}
test('workroom batch recovery cannot fallback to a paid resubmission without task id', async () => {
  const f = fixture(); assert.equal(await f.proto._maybeFallbackRegenerateAsyncTask.call(f.ctx), false);
  assert.equal(f.called(), 0);
});
test('current store batch marker also blocks a partial cached recovery record', () => {
  const f = fixture(); f.data.storyMediaBatch.state = 'held';
  assert.equal(f.proto._shouldFallbackRegenerateAsyncTask.call(f.ctx, {
    provider: 'apimart', model: 'apimart/nano-banana-2', asyncTaskStatus: 'pending',
  }), false);
});
test('ordinary untagged image node fallback policy remains unchanged', () => {
  const f = fixture(false); assert.equal(f.proto._shouldFallbackRegenerateAsyncTask.call(f.ctx), true);
});
test('an explicit manual run remains available on a marked node', async () => {
  const f = fixture(); await f.proto.runGeneration.call(f.ctx, {}); assert.equal(f.called(), 1);
});
