import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STORY_PROMPT_MODE_MINIMAX_H3,
  STORY_PROMPT_MODE_MINIMAX_H3_DEFAULT_VIDEO_MODEL_ID,
  STORY_PROMPT_MODE_OPTIONS,
  STORY_PROMPT_MODE_SEEDANCE_2_0,
  STORY_PROMPT_MODE_SEEDANCE_2_0_DEFAULT_VIDEO_MODEL_ID,
  STORY_PROMPT_MODE_SEEDANCE_2_5,
  STORY_PROMPT_MODE_SEEDANCE_2_5_DEFAULT_VIDEO_MODEL_ID,
  STORY_PROMPT_MODE_WAN_3_0,
  STORY_PROMPT_MODE_WAN_3_0_DEFAULT_VIDEO_MODEL_ID,
  getStoryPromptModeLabel,
  isStoryContinuousTimelinePromptMode,
  isStoryMinimaxH3PromptMode,
  isStorySeedance25PromptMode,
  isStoryWan30PromptMode,
  normalizeStoryMinimaxH3OfficialTags,
  normalizeStoryPromptMode,
  resolveStoryPromptModeDefaultVideoModelId,
  serializeStoryPromptForMode,
} from './promptModes.js';

test('promptModes: normalizes supported ids and falls back to Seedance 2.0', () => {
  assert.equal(normalizeStoryPromptMode(' MINIMAX-H3 '), STORY_PROMPT_MODE_MINIMAX_H3);
  assert.equal(normalizeStoryPromptMode('seedance-2.5'), STORY_PROMPT_MODE_SEEDANCE_2_5);
  assert.equal(normalizeStoryPromptMode('unknown'), STORY_PROMPT_MODE_SEEDANCE_2_0);
  assert.equal(STORY_PROMPT_MODE_OPTIONS.length, 4);
});

test('promptModes: labels and predicates follow the configured options', () => {
  assert.equal(getStoryPromptModeLabel('seedance-2.0'), 'Seedance 2.0');
  assert.equal(getStoryPromptModeLabel('unknown'), 'Seedance 2.0');
  assert.equal(isStorySeedance25PromptMode(' Seedance-2.5 '), true);
  assert.equal(isStoryWan30PromptMode('wan-3.0'), true);
  assert.equal(isStoryMinimaxH3PromptMode('minimax-h3'), true);
  assert.equal(isStoryContinuousTimelinePromptMode('seedance-2.5'), true);
  assert.equal(isStoryContinuousTimelinePromptMode('minimax-h3'), false);
});

test('promptModes: default video model ids are mode-specific', () => {
  assert.equal(
    resolveStoryPromptModeDefaultVideoModelId('seedance-2.0'),
    STORY_PROMPT_MODE_SEEDANCE_2_0_DEFAULT_VIDEO_MODEL_ID,
  );
  assert.equal(
    resolveStoryPromptModeDefaultVideoModelId('seedance-2.5'),
    STORY_PROMPT_MODE_SEEDANCE_2_5_DEFAULT_VIDEO_MODEL_ID,
  );
  assert.equal(
    resolveStoryPromptModeDefaultVideoModelId('wan-3.0'),
    STORY_PROMPT_MODE_WAN_3_0_DEFAULT_VIDEO_MODEL_ID,
  );
  assert.equal(
    resolveStoryPromptModeDefaultVideoModelId('minimax-h3'),
    STORY_PROMPT_MODE_MINIMAX_H3_DEFAULT_VIDEO_MODEL_ID,
  );
  assert.equal(resolveStoryPromptModeDefaultVideoModelId('unknown'), '');
});

test('promptModes: official MiniMax tags are normalized with stable section names', () => {
  const result = normalizeStoryMinimaxH3OfficialTags('<subject 1>hero\n## Summary: text\n<video 2>clip');
  assert.match(result, /<Subject 1>hero/);
  assert.match(result, /summary: text/);
  assert.match(result, /<Video 2>clip/);
  assert.doesNotMatch(result, /## Summary/);
});

test('promptModes: Wan serialization removes image/video/audio mention sigils', () => {
  const input = '@图片1 @视频1 @音频1';
  const result = serializeStoryPromptForMode(input, 'wan-3.0');
  assert.equal(result, '图1 视频1 音频1');
});

test('promptModes: MiniMax serialization keeps reference prompts and converts T2VA sections', () => {
  const reference = serializeStoryPromptForMode('<Picture 1> scene\nsummary: s', 'minimax-h3');
  assert.match(reference, /<Picture 1> scene/);
  const t2va = serializeStoryPromptForMode(
    'detailed_description:\nA\n\noverall_soundscape:\nB\n\nnon_diegetic_music:\nC',
    'minimax-h3',
  );
  assert.match(t2va, /^integrated_multimodal_description:/);
  assert.match(t2va, /overall_soundscape:\nB/);
});
