import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGenerationCancelledPatch,
  buildGenerationFailurePatch,
  buildGenerationSuccessPatch,
} from './generationTaskLifecycle.js';
(test('generationTaskLifecycle: null duration falls back to startedAt', () => {
  const startedAt = Date.now() - 50,
    generationSuccessPatch = buildGenerationSuccessPatch({ startedAt: startedAt, duration: null });
  (assert.equal(generationSuccessPatch.jobStatus, 'success'),
    assert.ok(generationSuccessPatch.generationDuration > 0));
}),
  test('generationTaskLifecycle: explicit duration is preserved', () => {
    (assert.equal(buildGenerationSuccessPatch({ duration: 0 }).generationDuration, 0),
      assert.equal(buildGenerationFailurePatch({ error: 'failed', duration: 123 }).generationDuration, 123),
      assert.equal(buildGenerationCancelledPatch({ duration: 0x1c8 }).generationDuration, 0x1c8));
  }),
  test('generationTaskLifecycle: missing duration and startedAt omits duration', () => {
    const generationFailurePatch = buildGenerationFailurePatch({ error: 'failed' });
    (assert.equal(generationFailurePatch.jobStatus, 'error'),
      assert.equal(
        Object.prototype.hasOwnProperty.call(generationFailurePatch, 'generationDuration'),
        false,
      ));
  }));
