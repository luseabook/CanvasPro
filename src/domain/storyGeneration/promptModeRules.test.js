import test from 'node:test';
import assert from 'node:assert/strict';

import {
  appendStoryEpisodePromptModeSystemPrompt,
  getStoryClipPromptModeRewriteRequirements,
  getStoryEpisodeClipGroupingRequirements,
  getStoryEpisodePromptModePlanningRequirements,
  getStorySpatialContinuityPromptLines,
  isStoryEpisodeTimelineGuidance,
  resolveStoryPromptModeClipMaxSeconds,
} from './promptModeRules.js';

test('promptModeRules: only Seedance 2.0 receives clip grouping requirements', () => {
  assert.equal(getStoryEpisodeClipGroupingRequirements('seedance-2.0').length, 1);
  assert.deepEqual(getStoryEpisodeClipGroupingRequirements('seedance-2.5'), []);
  assert.deepEqual(getStoryEpisodeClipGroupingRequirements('wan-3.0'), []);
});

test('promptModeRules: planning requirements vary by prompt mode', () => {
  assert.equal(getStoryEpisodePromptModePlanningRequirements('seedance-2.5').length, 5);
  assert.equal(getStoryEpisodePromptModePlanningRequirements('wan-3.0').length, 4);
  assert.equal(getStoryEpisodePromptModePlanningRequirements('minimax-h3').length, 5);
  assert.equal(
    getStoryEpisodePromptModePlanningRequirements('seedance-2.5').some((entry) =>
      isStoryEpisodeTimelineGuidance(entry),
    ),
    true,
  );
});

test('promptModeRules: system prompt append is opt-in and preserves the base prompt', () => {
  assert.equal(appendStoryEpisodePromptModeSystemPrompt('base', 'unknown').startsWith('base'), true);
  const result = appendStoryEpisodePromptModeSystemPrompt('base', 'seedance-2.5', {
    announceTimelineContract: true,
  });
  assert.equal(result.startsWith('base'), true);
  assert.match(result, /startSec/);
});

test('promptModeRules: MiniMax caps clips at 15 seconds', () => {
  assert.equal(resolveStoryPromptModeClipMaxSeconds('minimax-h3', 30), 15);
  assert.equal(resolveStoryPromptModeClipMaxSeconds('wan-3.0', 30), 30);
});

test('promptModeRules: rewrite and spatial requirements adapt to assets and source evidence', () => {
  assert.equal(getStoryClipPromptModeRewriteRequirements('minimax-h3', { hasAssetRefs: true }).length, 4);
  assert.equal(getStoryClipPromptModeRewriteRequirements('wan-3.0').length, 3);
  assert.equal(getStoryClipPromptModeRewriteRequirements('seedance-2.0').length, 3);
  const sourceLines = getStorySpatialContinuityPromptLines({ sourceEvidence: true });
  const referenceLines = getStorySpatialContinuityPromptLines();
  assert.equal(sourceLines.length, 2);
  assert.notDeepEqual(sourceLines, referenceLines);
});
