import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvasOnboardingState, hasConfiguredApi } from './emptyCanvasOnboarding.js';
test('hasConfiguredApi treats any non-empty provider key as configured', () => {
  assert.equal(hasConfiguredApi({}), false);
  assert.equal(hasConfiguredApi({ providers: {} }), false);
  assert.equal(hasConfiguredApi({ providers: { a: { apiKey: '   ' } } }), false);
  assert.equal(hasConfiguredApi({ providers: { a: { apiKey: 'key' } } }), true);
  assert.equal(hasConfiguredApi({ providers: { a: { modelApiKey: 'key' } } }), true);
});
test('createCanvasOnboardingState keeps the guide until a model is configured and a node exists', () => {
  const state = createCanvasOnboardingState();
  assert.deepEqual(state.update({}, 0), { visible: true, configured: false });
  assert.deepEqual(state.update({ providers: { a: { apiKey: 'key' } } }, 0), {
    visible: true,
    configured: true,
  });
  assert.deepEqual(state.onNodesChanged(1), { visible: false, configured: true });
});
test('createCanvasOnboardingState reopens the guide when the model config is cleared', () => {
  const state = createCanvasOnboardingState();
  state.update({ providers: { a: { modelApiKey: 'key' } } }, 0);
  state.onNodesChanged(2);
  assert.deepEqual(state.update({}, 2), { visible: true, configured: false });
  assert.deepEqual(state.onNodesChanged(0), { visible: true, configured: false });
});
