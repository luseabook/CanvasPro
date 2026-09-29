import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STORY_CLIP_ADJUSTMENT_SCOPES,
  STORY_CLIP_PROMPT_HISTORY_LIMIT,
  applyStoryClipAdjustmentCandidate,
  buildStoryClipAdjustmentCandidateText,
  buildStoryClipAdjustmentGenerationKey,
  clearStoryClipAdjustmentUndo,
  createStoryClipPromptHistoryEntry,
  discardStoryClipAdjustmentCandidate,
  getStoryClipPromptLockedTokens,
  isStoryClipAdjustmentGenerating,
  normalizeStoryClipPromptHistory,
  restoreStoryClipPromptHistoryEntry,
  saveCurrentStoryClipPromptToHistory,
  serializeStoryClipPromptElement,
  setStoryClipAdjustmentCandidate,
  undoStoryClipAdjustment,
} from './storyClipAdjustment.js';

function createFakeNode({
  nodeType = 1,
  tagName = 'div',
  textContent = '',
  className = '',
  dataset = {},
  childNodes = [],
  querySelectorAll,
} = {}) {
  const classes = new Set(String(className || '').split(/\s+/).filter(Boolean));
  return {
    nodeType,
    tagName,
    textContent,
    dataset,
    childNodes,
    querySelectorAll,
    classList: {
      contains: (name) => classes.has(name),
    },
    getAttribute: (name) => dataset[name] || '',
  };
}

test('storyClipAdjustment: generation keys require project, clip, and adjustment ids', () => {
  assert.deepEqual(STORY_CLIP_ADJUSTMENT_SCOPES, ['selection', 'prompt', 'clip']);
  assert.equal(STORY_CLIP_PROMPT_HISTORY_LIMIT, 20);
  assert.equal(
    buildStoryClipAdjustmentGenerationKey(' project ', ' clip ', ' job '),
    JSON.stringify(['project', 'clip', 'job']),
  );
  assert.equal(buildStoryClipAdjustmentGenerationKey('project', '', 'job'), '');

  const key = buildStoryClipAdjustmentGenerationKey('project', 'clip', 'job');
  assert.equal(
    isStoryClipAdjustmentGenerating(
      { data: { project: { id: 'project' } }, clipAdjustmentGeneratingIds: [key] },
      { id: 'clip' },
      { id: 'job' },
    ),
    true,
  );
  assert.equal(isStoryClipAdjustmentGenerating({}, { id: 'clip' }, { id: 'job' }), false);
});

test('storyClipAdjustment: prompt history normalizes values and deduplicates revisions', () => {
  const history = normalizeStoryClipPromptHistory([
    {
      id: 'kept-id',
      promptHtml: '  first prompt  ',
      promptMode: 'WAN-3.0',
      promptLanguage: 'en-US',
      durationSec: '3.5s',
      savedAt: 123.9,
      instruction: '  tighten  ',
      source: '',
    },
    {
      prompt: 'first prompt',
      promptMode: 'wan-3.0',
      promptLanguage: 'en-US',
      duration: 3.5,
      savedAt: 500,
    },
    {
      promptHtml: 'second prompt',
      promptMode: 'unknown',
      savedAt: -1,
    },
    null,
  ]);

  assert.equal(history.length, 2);
  assert.deepEqual(history[0], {
    id: 'kept-id',
    promptHtml: 'first prompt',
    promptMode: 'wan-3.0',
    promptLanguage: 'en-US',
    durationSec: 3.5,
    duration: '3.5s',
    instruction: 'tighten',
    source: 'ai-adjustment',
    savedAt: 123,
  });
  assert.equal(history[1].promptMode, 'seedance-2.0');
  assert.equal(history[1].savedAt, 0);
  assert.equal(history[1].duration, '');
  assert.match(history[1].id, /^prompt-history-0-/);
});

test('storyClipAdjustment: save and restore keep a restorable prompt snapshot', () => {
  const clip = {
    prompt: 'original prompt',
    promptMode: 'seedance-2.0',
    promptLanguage: 'zh-CN',
    durationSec: 2,
    duration: '2.0s',
    promptHistory: [],
  };
  const entry = createStoryClipPromptHistoryEntry(clip, {
    instruction: ' improve ',
    promptMode: 'wan-3.0',
    source: 'manual',
    savedAt: 1000,
  });
  assert.equal(entry.promptHtml, 'original prompt');
  assert.equal(entry.promptMode, 'wan-3.0');
  assert.equal(entry.instruction, 'improve');
  assert.equal(entry.source, 'manual');

  assert.deepEqual(
    saveCurrentStoryClipPromptToHistory(clip, {
      instruction: 'improve',
      promptMode: 'wan-3.0',
      source: 'manual',
      savedAt: 1000,
    }),
    entry,
  );
  assert.equal(clip.promptHistory.length, 1);
  assert.deepEqual(restoreStoryClipPromptHistoryEntry(clip, entry.id, 2000), entry);
  assert.equal(clip.prompt, 'original prompt');
  assert.equal(clip.promptMode, 'wan-3.0');
  assert.equal(clip.promptHistory.length, 1);
  assert.equal(clip.promptHistory[0].instruction, '恢复历史版本前自动保存');
  assert.equal(clip.promptHistory[0].source, 'history-restore');
});

test('storyClipAdjustment: candidate text validates scope and stale selections', () => {
  assert.throws(
    () => buildStoryClipAdjustmentCandidateText({ sourcePromptText: '', generatedText: 'new' }),
    /当前片段还没有可调整的视频提示词/,
  );
  assert.throws(
    () =>
      buildStoryClipAdjustmentCandidateText({
        sourcePromptText: 'old prompt',
        generatedText: '   ',
      }),
    /AI 没有返回可用的候选内容/,
  );
  assert.equal(
    buildStoryClipAdjustmentCandidateText({
      sourcePromptText: 'old prompt',
      generatedText: 'new prompt',
    }),
    'new prompt',
  );
  assert.equal(
    buildStoryClipAdjustmentCandidateText({
      sourcePromptText: 'hello world',
      generatedText: 'ELLO',
      scope: 'selection',
      selection: { start: 1, end: 5 },
    }),
    'hELLO world',
  );
  assert.throws(
    () =>
      buildStoryClipAdjustmentCandidateText({
        sourcePromptText: 'short',
        generatedText: 'replacement',
        scope: 'selection',
        selection: { start: 2, end: 20 },
      }),
    /选中文字已经变化/,
  );
});

test('storyClipAdjustment: applying and undoing a candidate preserves previous values', () => {
  const clip = {
    prompt: 'old prompt',
    promptMode: 'seedance-2.0',
    promptLanguage: 'zh-CN',
    durationSec: 5,
    duration: '5.0s',
  };
  const candidate = {
    promptHtml: 'new prompt',
    targetLanguage: 'en-US',
    targetPromptMode: 'wan-3.0',
    candidateDurationSeconds: 3.4,
    instruction: 'shorten',
    scope: 'clip',
  };

  assert.equal(discardStoryClipAdjustmentCandidate(clip), false);
  assert.equal(setStoryClipAdjustmentCandidate(clip, candidate), true);
  assert.deepEqual(clip.promptAdjustment.candidate, candidate);
  assert.equal(applyStoryClipAdjustmentCandidate(clip, 1234), true);
  assert.equal(clip.prompt, 'new prompt');
  assert.equal(clip.promptMode, 'wan-3.0');
  assert.equal(clip.promptLanguage, 'en-US');
  assert.equal(clip.durationSec, 3.4);
  assert.equal(clip.duration, '3.4s');
  assert.equal(clip.promptHistory.length, 1);
  assert.equal(clip.promptHistory[0].promptHtml, 'old prompt');
  assert.equal(clip.promptAdjustment.lastApplied.scope, 'clip');
  assert.equal(undoStoryClipAdjustment(clip), true);
  assert.equal(clip.prompt, 'old prompt');
  assert.equal(clip.promptMode, 'seedance-2.0');
  assert.equal(clip.promptLanguage, 'zh-CN');
  assert.equal(clip.durationSec, 5);
  assert.equal(clip.promptAdjustment.lastApplied, null);
});

test('storyClipAdjustment: prompt serialization preserves reference and time pills', () => {
  const assetPill = createFakeNode({
    tagName: 'span',
    className: 'ref-pill',
    textContent: '@Alice',
    dataset: { label: 'Alice', promptPillKind: 'asset' },
  });
  const timePill = createFakeNode({
    tagName: 'span',
    className: 'ref-pill',
    textContent: '00:01.000',
    dataset: { label: '00:01.000', promptPillKind: 'time' },
  });
  const root = createFakeNode({
    tagName: 'div',
    childNodes: [
      createFakeNode({ nodeType: 3, textContent: 'Hello ' }),
      assetPill,
      createFakeNode({ nodeType: 3, textContent: ' ' }),
      timePill,
    ],
    querySelectorAll: () => [assetPill, timePill],
  });

  assert.equal(
    serializeStoryClipPromptElement(root),
    'Hello @Alice ⏱ 00:01.000',
  );
  const tokens = getStoryClipPromptLockedTokens(root);
  assert.deepEqual(tokens.assetTokens, ['@Alice']);
  assert.equal(tokens.durationTokens.includes('00:01.000'), true);
  assert.equal(clearStoryClipAdjustmentUndo({}), false);
});
