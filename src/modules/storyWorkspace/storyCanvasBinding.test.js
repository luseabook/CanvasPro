import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStoryClipCanvasBindingKey, buildStoryLinkedCanvasName } from './storyCanvasBinding.js';

test('linked canvas names append a positive episode number', () => {
  assert.equal(buildStoryLinkedCanvasName({ title: ' 雨夜 ' }, { number: 2.7 }), '雨夜 · 第 2 集');
  assert.equal(buildStoryLinkedCanvasName({ title: '雨夜' }, { number: 0 }), '雨夜');
  assert.equal(buildStoryLinkedCanvasName({ title: '  ' }), '剧本项目');
  assert.equal(buildStoryLinkedCanvasName(undefined, null), '剧本项目');
});

test('clip binding keys prefer ids, then planning refs, then positions', () => {
  assert.equal(
    buildStoryClipCanvasBindingKey({
      episode: { id: 'e1', planningRef: 'episode-9' },
      clip: { planningRef: ' clip-a ' },
    }),
    'episode:e1:clip:clip-a',
  );
  assert.equal(
    buildStoryClipCanvasBindingKey({ episodeIndex: 2, clipIndex: -3 }),
    'episode:episode-3:clip:clip-1',
  );
  assert.equal(
    buildStoryClipCanvasBindingKey({ episode: { id: '  ' }, clipIndex: 'x' }),
    'episode:episode-1:clip:clip-1',
  );
  assert.equal(buildStoryClipCanvasBindingKey(), 'episode:episode-1:clip:clip-1');
});
