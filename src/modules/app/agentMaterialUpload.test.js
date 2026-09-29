import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgentMaterialUploader } from './agentMaterialUpload.js';

function fixture(over = {}) {
  const calls = [];
  const node = { id: 'n-9', name: 'created' };
  const canvasNodeFlows = {
    async createMediaNodeFromBlob(blob, type, options) {
      calls.push({ blob, type, options });
      return 'result' in over ? over.result : node;
    },
  };
  const graphStore = {
    getState: () => ('state' in over ? over.state : { selectedNodeIds: ['n-9'], nodes: { 'n-9': node } }),
  };
  const uploader = createAgentMaterialUploader({
    canvasNodeFlows,
    graphStore,
    getBaseName: over.getBaseName,
  });
  return { uploader, calls, node };
}

test('a blob without a type is refused before any flow call', async () => {
  const { uploader, calls } = fixture();
  assert.equal(await uploader(null), null);
  assert.equal(await uploader(undefined), null);
  assert.equal(await uploader({}), null);
  assert.equal(await uploader({ name: 'a.png' }), null);
  assert.equal(calls.length, 0);
});

test('forwards the blob, its type and the frozen placement options', async () => {
  const { uploader, calls, node } = fixture();
  const blob = { type: 'image/png', name: 'shot.png' };
  const result = await uploader(blob);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].blob, blob);
  assert.equal(calls[0].type, 'image/png');
  assert.deepEqual(calls[0].options, {
    placement: 'viewport-center-sequence',
    sequenceKey: 'agent-upload',
    name: 'shot.png',
  });
  assert.equal(result, node);
});

test('the base-name hook wins over the raw blob name', async () => {
  const { uploader, calls } = fixture({ getBaseName: () => 'mat-01' });
  await uploader({ type: 'video/mp4', name: 'raw.mp4' });
  assert.equal(calls[0].options.name, 'mat-01');
});

test('an empty base name falls back to the blob name then to empty string', async () => {
  const { uploader, calls } = fixture({ getBaseName: () => '' });
  await uploader({ type: 'video/mp4', name: 'raw.mp4' });
  assert.equal(calls[0].options.name, 'raw.mp4');
  await uploader({ type: 'video/mp4' });
  assert.equal(calls[1].options.name, '');
});

test('a missing base-name hook is optional', async () => {
  const { uploader, calls } = fixture();
  await uploader({ type: 'audio/mpeg', name: 'take.wav' });
  assert.equal(calls[0].options.name, 'take.wav');
});

test('a falsy flow result short-circuits to null', async () => {
  for (const result of [null, undefined, false, 0, '']) {
    const { uploader } = fixture({ result });
    assert.equal(await uploader({ type: 'image/png' }), null);
  }
});

test('returns the last selected node from the store snapshot', async () => {
  const first = { id: 'n-1' };
  const second = { id: 'n-2' };
  const { uploader } = fixture({
    result: true,
    state: { selectedNodeIds: ['n-1', 'n-2'], nodes: { 'n-1': first, 'n-2': second } },
  });
  assert.equal(await uploader({ type: 'image/png' }), second);
});

test('falls back to getStateRaw when getState is absent', async () => {
  const node = { id: 'n-7' };
  const uploader = createAgentMaterialUploader({
    canvasNodeFlows: { createMediaNodeFromBlob: async () => true },
    graphStore: { getStateRaw: () => ({ selectedNodeIds: ['n-7'], nodes: { 'n-7': node } }) },
  });
  assert.equal(await uploader({ type: 'image/png' }), node);
});

test('a non-array selection is treated as empty', async () => {
  for (const selectedNodeIds of [undefined, null, 'n-1', {}, 5]) {
    const { uploader } = fixture({ result: true, state: { selectedNodeIds, nodes: { 'n-1': {} } } });
    assert.equal(await uploader({ type: 'image/png' }), null);
  }
});

test('an empty selection yields null', async () => {
  const { uploader } = fixture({ result: true, state: { selectedNodeIds: [], nodes: {} } });
  assert.equal(await uploader({ type: 'image/png' }), null);
});

test('a selected id that is missing from nodes yields null', async () => {
  const { uploader } = fixture({ result: true, state: { selectedNodeIds: ['ghost'], nodes: {} } });
  assert.equal(await uploader({ type: 'image/png' }), null);
});

test('a store snapshot without nodes is tolerated', async () => {
  const { uploader } = fixture({ result: true, state: { selectedNodeIds: ['n-9'] } });
  assert.equal(await uploader({ type: 'image/png' }), null);
});

test('a missing canvas flow resolves to null instead of throwing', async () => {
  const uploader = createAgentMaterialUploader({ graphStore: { getState: () => ({}) } });
  assert.equal(await uploader({ type: 'image/png', name: 'a.png' }), null);
  const bare = createAgentMaterialUploader();
  assert.equal(await bare({ type: 'image/png' }), null);
});
