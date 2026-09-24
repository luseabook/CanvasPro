import test from 'node:test';
import assert from 'node:assert/strict';
import { parseComfyWorkflow, editableInputs, patchWorkflowInput, createComfyWorkflowNodeData, resultNodeId } from './comfyWorkflowModel.js';
const prompt = { '1': { class_type: 'Text', inputs: { text: 'hello', seed: 12, enabled: true } },
  '2': { class_type: 'SaveImage', inputs: { images: ['1', 0], filename_prefix: 'Canvas' } } };
test('accepts API graph and wrapper, never interprets UI JSON as runnable prompt', () => {
  assert.deepEqual(parseComfyWorkflow({ prompt }), prompt);
  assert.deepEqual(parseComfyWorkflow(JSON.stringify(prompt)), prompt);
  assert.throws(() => parseComfyWorkflow({ nodes: [], links: [] }));
  assert.throws(() => parseComfyWorkflow({ '1': { class_type: 'A', inputs: { x: ['missing', 0] } } }));
});
test('editing preserves graph links and previous snapshots', () => {
  const next = patchWorkflowInput(prompt, '1', 'seed', 42);
  assert.equal(prompt['1'].inputs.seed, 12); assert.equal(next['1'].inputs.seed, 42);
  assert.deepEqual(next['2'].inputs.images, ['1', 0]);
  assert.throws(() => patchWorkflowInput(prompt, '1', 'seed', NaN));
  assert.throws(() => patchWorkflowInput(prompt, '2', 'images', 'text'));
  assert.ok(editableInputs(prompt).every(f => f.input !== 'images'));
});
test('new node has no credentials and supports JSON round trip', () => {
  const node = createComfyWorkflowNodeData({ id: 'node-1' });
  assert.deepEqual(JSON.parse(JSON.stringify(node)), node);
  assert.equal(node.comfyWorkflow.token, undefined);
  assert.equal(resultNodeId('request', 'file'), resultNodeId('request', 'file'));
});
test('prototype keys and empty inputs are guarded', () => {
  assert.throws(() => parseComfyWorkflow('{"1":{"class_type":"X","inputs":{"__proto__":"bad"}}}'));
  assert.throws(() => parseComfyWorkflow({}));
});
