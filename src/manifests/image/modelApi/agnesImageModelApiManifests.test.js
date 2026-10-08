import test from 'node:test';
import assert from 'node:assert/strict';

import { agnesImageModelApiExecutionManifests } from './agnesImageModelApiManifests.js';
import { resolveMappedImageResponseValues } from '../../../../api/adapters/modelApiMappingEngine.js';

// A real 1x1 transparent PNG (its magic bytes are the PNG signature 89 50 4E 47 ...), so the
// extractor's magic-number sniffing exercises the genuine base64 decoding path.
const PNG_1X1_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function getAgnes25ResponseMapping() {
  const execution = agnesImageModelApiExecutionManifests.find(
    (item) => item.model === 'agnes-image-2.5-flash',
  );
  assert.ok(execution, 'agnes-image-2.5-flash execution manifest must exist');
  return execution.responseMapping;
}

test('agnesImageModelApiExecutionManifests: agnes-image-2.5-flash exposes base64 response paths', () => {
  const responseMapping = getAgnes25ResponseMapping();

  assert.ok(Array.isArray(responseMapping.base64Paths), 'base64Paths must be declared');
  assert.ok(
    responseMapping.base64Paths.includes('data[].b64_json'),
    'base64Paths must include data[].b64_json',
  );
  assert.equal(responseMapping.base64DefaultMimeType, 'image/png');
});

test('agnes i2i: base64_json response is decoded into a PNG data URL', () => {
  const responseMapping = getAgnes25ResponseMapping();
  const response = { data: [{ url: '', b64_json: PNG_1X1_BASE64 }] };

  const results = resolveMappedImageResponseValues(response, responseMapping);

  assert.ok(
    results.some((item) => item.startsWith('data:image/png;base64,')),
    'result must contain a data:image/png;base64, entry',
  );
  assert.ok(
    results.includes('data:image/png;base64,' + PNG_1X1_BASE64),
    'decoded entry must round-trip the original base64 payload',
  );
});

test('agnes t2i: url response still resolves (no regression on the url path)', () => {
  const responseMapping = getAgnes25ResponseMapping();
  const response = { data: [{ url: 'https://example.com/y.png' }] };

  const results = resolveMappedImageResponseValues(response, responseMapping);

  assert.deepEqual(results, ['https://example.com/y.png']);
});

test('agnes i2i: empty or invalid b64_json is filtered without throwing', () => {
  const responseMapping = getAgnes25ResponseMapping();

  assert.doesNotThrow(() => {
    assert.deepEqual(
      resolveMappedImageResponseValues({ data: [{ url: '', b64_json: '' }] }, responseMapping),
      [],
    );
    assert.deepEqual(
      resolveMappedImageResponseValues({ data: [{ url: '', b64_json: '!!!not-base64!!!' }] }, responseMapping),
      [],
    );
  });
});
