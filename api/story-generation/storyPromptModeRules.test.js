import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getStoryEpisodePromptModePlanningRequirements,
  resolveStoryPromptModeClipMaxSeconds,
} from './storyPromptModeRules.js';

test('storyPromptModeRules: exposes the story-generation prompt mode contract', () => {
  assert.equal(getStoryEpisodePromptModePlanningRequirements('minimax-h3').length, 5);
  assert.equal(resolveStoryPromptModeClipMaxSeconds('minimax-h3', 30), 15);
});
