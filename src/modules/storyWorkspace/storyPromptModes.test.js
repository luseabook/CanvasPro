import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STORY_PROMPT_MODE_SEEDANCE_2_0,
  getStoryPromptModeLabel,
  normalizeStoryPromptMode,
} from './storyPromptModes.js';

test('storyPromptModes: re-exports the shared prompt mode contract', () => {
  assert.equal(STORY_PROMPT_MODE_SEEDANCE_2_0, 'seedance-2.0');
  assert.equal(normalizeStoryPromptMode('unknown'), 'seedance-2.0');
  assert.equal(getStoryPromptModeLabel('seedance-2.0'), 'Seedance 2.0');
});
