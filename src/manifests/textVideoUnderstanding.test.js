import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assertVideoAnalysisModel,
  getVideoAnalysisModelIds,
  isVideoAnalysisModel,
} from './textVideoUnderstanding.js';

test('textVideoUnderstanding: identifies text models that accept video inputs', () => {
  assert.equal(
    isVideoAnalysisModel({
      kind: 'text',
      inputSlots: { allowedKinds: ['text', 'video'], maxByKind: { video: 1 } },
    }),
    true,
  );
  assert.equal(
    isVideoAnalysisModel({
      kind: 'text',
      inputSlots: { allowedKinds: ['text'], maxByKind: { video: 0 } },
    }),
    false,
  );
  assert.equal(isVideoAnalysisModel(null), false);
});

test('textVideoUnderstanding: exposes registry IDs and asserts eligibility', () => {
  const ids = getVideoAnalysisModelIds();
  assert.ok(Array.isArray(ids));
  assert.ok(ids.every((id) => typeof id === 'string' && id.length > 0));

  assert.doesNotThrow(() =>
    assertVideoAnalysisModel({
      kind: 'text',
      inputSlots: { allowedKinds: ['video'], maxByKind: { video: 1 } },
    }),
  );
  assert.throws(() => assertVideoAnalysisModel({ kind: 'image' }), Error);
});
