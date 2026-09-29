import test from 'node:test';
import assert from 'node:assert/strict';

import { translateMinimaxH3EditorAssetMentions } from './minimaxH3Prompt.js';

test('minimaxH3Prompt: translates supported asset mentions', () => {
  const input = '@\u56fe\u72471 @\u56fe\u50cf2 @\u89c6\u98913 @\u58f0\u97f34 @\u97f3\u98915 plain';

  assert.equal(
    translateMinimaxH3EditorAssetMentions(input),
    '<Picture 1> <Picture 2> <Video 3> <Audio 4> <Audio 5> plain',
  );
});

test('minimaxH3Prompt: leaves unrelated text untouched', () => {
  assert.equal(translateMinimaxH3EditorAssetMentions('@image1 @video2 hello'), '@image1 @video2 hello');
  assert.equal(translateMinimaxH3EditorAssetMentions(null), '');
});
