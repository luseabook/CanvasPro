import test from 'node:test';
import assert from 'node:assert/strict';

import { ErrorType } from '../ApiError.js';
import { parseError } from './VolcengineSpeechErrorParser.js';

test('VolcengineSpeechErrorParser: maps denied Audio 1.0 resources to FORBIDDEN', () => {
  const raw = {
    error: {
      message: 'resource_id=volc.service_type.10074 requested resource not granted for this API key',
    },
  };
  const error = parseError(raw, 403);

  assert.equal(error.name, 'ApiError');
  assert.equal(error.type, ErrorType.FORBIDDEN);
  assert.equal(error.provider, 'volcengine-speech');
  assert.equal(error.status, 403);
  assert.equal(error.retryable, false);
  assert.equal(error.raw, raw);
  assert.match(error.message, /Audio 1\.0 接口权限未开通/);
  assert.match(error.message, /X-Api-Key/);
});

test('VolcengineSpeechErrorParser: ignores unrelated speech errors', () => {
  assert.equal(parseError('resource not granted'), null);
  assert.equal(parseError(null), null);
});
