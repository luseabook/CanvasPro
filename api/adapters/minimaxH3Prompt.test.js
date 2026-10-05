import test from 'node:test';
import assert from 'node:assert/strict';

import { translateMinimaxH3EditorAssetMentions } from './minimaxH3Prompt.js';

test('minimaxH3Prompt: translates supported asset mentions', () => {
  const input = '@图片1 @图像2 @视频3 @声音4 @音频5 plain';

  assert.equal(
    translateMinimaxH3EditorAssetMentions(input),
    '<Picture 1> <Picture 2> <Video 3> <Audio 4> <Audio 5> plain',
  );
});

test('minimaxH3Prompt: leaves unrelated text untouched', () => {
  assert.equal(translateMinimaxH3EditorAssetMentions('@image1 @video2 hello'), '@image1 @video2 hello');
  assert.equal(translateMinimaxH3EditorAssetMentions(null), '');
});
