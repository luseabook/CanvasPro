import test from 'node:test';
import assert from 'node:assert/strict';

import { getGenerationErrorMessage, isGenerationAbortError } from './generationTaskErrorState.js';

test('generationTaskErrorState: recognizes abort names and cancelled messages', () => {
  assert.equal(isGenerationAbortError(null), false);
  assert.equal(isGenerationAbortError({ name: 'AbortError' }), true);
  assert.equal(isGenerationAbortError({ message: '  CANCELLED  ' }), true);
  assert.equal(isGenerationAbortError({ message: 'cancelled' }), false);
});

test('generationTaskErrorState: extracts primitive and Error messages before falling back', () => {
  assert.equal(getGenerationErrorMessage('  failed  ', 'fallback'), 'failed');
  assert.equal(getGenerationErrorMessage(502, 'fallback'), '502');
  assert.equal(getGenerationErrorMessage(new Error('network down'), 'fallback'), 'network down');
  assert.equal(getGenerationErrorMessage({ message: '   ' }, '  fallback  '), 'fallback');
  assert.equal(getGenerationErrorMessage(null, '   '), '');
});
