import test from 'node:test';
import assert from 'node:assert/strict';

import { ErrorType } from '../ApiError.js';
import { parseError, parseTaskError } from './ComfyUiErrorParser.js';

test('ComfyUiErrorParser: formats validation and node errors', () => {
  const raw = {
    error: {
      type: 'validation_error',
      message: 'Prompt validation failed',
      details: 'value 9 not in [1, 2, 3]',
      node_errors: {
        7: {
          class_type: 'KSampler',
          errors: [{ input_name: 'steps', details: 'value 9 not in [1, 2, 3]' }],
        },
      },
    },
  };
  const error = parseError(raw, 400);

  assert.equal(error.type, ErrorType.INVALID_PARAMS);
  assert.equal(error.provider, 'comfyui');
  assert.equal(error.status, 400);
  assert.equal(error.retryable, false);
  assert.match(error.message, /Prompt validation failed/);
  assert.match(error.message, /KSampler 7: steps: value 9 not in current ComfyUI list/);
});

test('ComfyUiErrorParser: preserves task failure semantics', () => {
  assert.equal(parseTaskError({ status: 'running', message: 'still running' }), null);

  const error = parseTaskError({
    status: 'failed',
    nodeErrors: { 2: { type: 'LoadImage', message: 'image missing' } },
  });
  assert.equal(error.type, ErrorType.TASK_FAILED);
  assert.equal(error.retryable, false);
  assert.match(error.message, /LoadImage 2: image missing/);
});

test('ComfyUiErrorParser: returns null when no HTTP or ComfyUI error is present', () => {
  assert.equal(parseError({}, 200), null);
  assert.equal(parseTaskError({ status: 'completed' }), null);
});
