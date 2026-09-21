import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGenerationCancelledPatch,
  buildGenerationFailurePatch,
  buildGenerationSuccessPatch,
} from './generationTaskLifecycle.js';
(test('generationTaskLifecycle: null duration falls back to startedAt', () => {
  const _0x819bbb = Date.now() - 50,
    _0x51173f = buildGenerationSuccessPatch({ startedAt: _0x819bbb, duration: null });
  (assert.equal(_0x51173f.jobStatus, 'success'), assert.ok(_0x51173f.generationDuration > 0));
}),
  test('generationTaskLifecycle: explicit duration is preserved', () => {
    (assert.equal(buildGenerationSuccessPatch({ duration: 0 }).generationDuration, 0),
      assert.equal(buildGenerationFailurePatch({ error: 'failed', duration: 123 }).generationDuration, 123),
      assert.equal(buildGenerationCancelledPatch({ duration: 0x1c8 }).generationDuration, 0x1c8));
  }),
  test('generationTaskLifecycle: missing duration and startedAt omits duration', () => {
    const _0x3d5314 = buildGenerationFailurePatch({ error: 'failed' });
    (assert.equal(_0x3d5314.jobStatus, 'error'),
      assert.equal(Object.prototype.hasOwnProperty.call(_0x3d5314, 'generationDuration'), false));
  }));
