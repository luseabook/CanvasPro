import test from 'node:test';
import assert from 'node:assert/strict';

import { GPT_IMAGE_2_5_MODE_FIELD } from './gptImage25Fields.js';

test('gptImage25Fields: exposes the mode selector contract', () => {
  assert.equal(Object.isFrozen(GPT_IMAGE_2_5_MODE_FIELD), true);
  assert.equal(GPT_IMAGE_2_5_MODE_FIELD.id, 'mode');
  assert.equal(GPT_IMAGE_2_5_MODE_FIELD.defaultValue, 'flare');
  assert.deepEqual(
    GPT_IMAGE_2_5_MODE_FIELD.options.map((option) => option.value),
    ['flare', 'sunburst'],
  );
});
