import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeTextResultSources, normalizeTextToolUsage } from './textResultMetadata.js';

test('textResultMetadata: sources accept only safe HTTP URLs and de-duplicate', () => {
  const longTitle = 'x'.repeat(600);
  const result = normalizeTextResultSources([
    { url: 'https://example.com/a', title: longTitle },
    { url: 'https://example.com/a', title: 'duplicate' },
    { url: 'ftp://example.com/a' },
    { url: 'https://user:pass@example.com/private' },
    { url: 'https://example.com/b' },
    { url: 'not a url' },
  ]);
  assert.equal(result.length, 2);
  assert.equal(result[0].url, 'https://example.com/a');
  assert.equal(result[0].title.length, 500);
  assert.deepEqual(result[1], { url: 'https://example.com/b', title: 'example.com' });
});

test('textResultMetadata: source normalization caps the result count', () => {
  const sources = Array.from({ length: 105 }, (_, index) => ({
    url: 'https://example.com/' + index,
  }));
  assert.equal(normalizeTextResultSources(sources).length, 100);
  assert.deepEqual(normalizeTextResultSources('invalid'), []);
});

test('textResultMetadata: tool usage keeps known non-negative integer counts only', () => {
  assert.deepEqual(
    normalizeTextToolUsage({
      web_search: { count: 2 },
      web_extractor: { count: 0 },
      image_search: { count: -1 },
      web_search_image: { count: 1.5 },
      unknown: { count: 4 },
    }),
    {
      web_search: { count: 2 },
      web_extractor: { count: 0 },
    },
  );
  assert.equal(normalizeTextToolUsage([]), null);
  assert.equal(normalizeTextToolUsage(null), null);
});
