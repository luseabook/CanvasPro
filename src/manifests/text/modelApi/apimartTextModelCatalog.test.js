import test from 'node:test';
import assert from 'node:assert/strict';

import { apimartAdditionalTextModels } from './apimartTextModelCatalog.js';

test('apimartTextModelCatalog: exports additional text models with stable IDs', () => {
  assert.equal(apimartAdditionalTextModels.length, 13);
  const byModel = new Map(apimartAdditionalTextModels.map((model) => [model.model, model]));

  assert.equal(byModel.get('gpt-6-astra').executionId, 'apimart.model-api.text.gpt-6-astra.v1');
  assert.equal(byModel.get('gpt-6-astra').reasoningEffortMode, 'openai');
  assert.equal(byModel.get('gemini-3.8-flash').videoInput, true);
  assert.equal(byModel.get('glm-5.3').mediaPolicy, 'text-only');
  assert.equal(byModel.get('kimi-k3').structuredOutputMode, 'json_object');
  assert.equal(byModel.get('deepseek-v4.1-flash').order, 102);
});
