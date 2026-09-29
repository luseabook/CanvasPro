import test from 'node:test';
import assert from 'node:assert/strict';

import { ErrorType } from '../ApiError.js';
import { parseError } from './VolcengineErrorParser.js';

test('VolcengineErrorParser: maps model activation failures to unavailable models', () => {
  const error = parseError(
    {
      error: {
        message:
          'Your account has not activated the model doubao-seedance. Please activate the model service first. request id: req-123',
      },
    },
    403,
  );

  assert.ok(error);
  assert.equal(error.type, ErrorType.MODEL_UNAVAILABLE);
  assert.equal(error.provider, 'volcengine');
  assert.equal(error.status, 403);
  assert.equal(error.retryable, false);
  assert.match(error.message, /doubao-seedance/);
  assert.match(error.message, /req-123/);
});

test('VolcengineErrorParser: ignores unrelated errors', () => {
  assert.equal(parseError('rate limit exceeded', 429), null);
  assert.equal(parseError(null, 500), null);
});
