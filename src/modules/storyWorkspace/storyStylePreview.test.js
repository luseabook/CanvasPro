import test from 'node:test';
import assert from 'node:assert/strict';
import { handleStoryStyleThumbnailError, STORY_STYLE_FALLBACK_URL } from './storyStylePreview.js';
test('a missing style preview uses an explicitly labelled local placeholder once', () => {
  const image = { matches: () => true, dataset: {}, src: 'missing.webp' };
  assert.equal(handleStoryStyleThumbnailError({ target: image }), true);
  assert.equal(image.src, STORY_STYLE_FALLBACK_URL);
  assert.match(image.title, /未提供/);
  handleStoryStyleThumbnailError({ target: image });
  assert.equal(image.hidden, true);
});
test('style preview fallback never changes unrelated media', () => {
  assert.equal(handleStoryStyleThumbnailError({ target: { matches: () => false } }), false);
  assert.equal(handleStoryStyleThumbnailError({ target: {} }), false);
});
