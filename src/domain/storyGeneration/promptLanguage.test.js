import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STORY_PROMPT_LANGUAGES,
  buildStoryPromptLanguageRule,
  normalizeStoryPromptLanguage,
  prependStoryDialogueLanguageConstraint,
} from './promptLanguage.js';

test('promptLanguage: language normalization accepts only supported locale ids', () => {
  assert.equal(STORY_PROMPT_LANGUAGES.length, 11);
  assert.equal(normalizeStoryPromptLanguage('en-US'), 'en-US');
  assert.equal(normalizeStoryPromptLanguage('EN-US'), '');
  assert.equal(normalizeStoryPromptLanguage('unknown'), '');
});

test('promptLanguage: mismatched required dialogue language blocks stale prompts', () => {
  assert.throws(
    () =>
      prependStoryDialogueLanguageConstraint('prompt', {
        clip: { requiredDialogueLanguage: 'en-US' },
      }),
    Error,
  );
});

test('promptLanguage: dialogue constraints prepend once and skip Chinese/empty prompts', () => {
  const input = 'candidate text';
  const result = prependStoryDialogueLanguageConstraint(input, {
    clip: { promptLanguage: 'en-US' },
  });
  assert.notEqual(result, input);
  assert.ok(result.endsWith(input));
  assert.equal(prependStoryDialogueLanguageConstraint(result, { clip: { promptLanguage: 'en-US' } }), result);
  assert.equal(prependStoryDialogueLanguageConstraint(input, { clip: { promptLanguage: 'zh-CN' } }), input);
  assert.equal(prependStoryDialogueLanguageConstraint('', { clip: { promptLanguage: 'en-US' } }), '');
});

test('promptLanguage: language rules include target locale and translation-only mode', () => {
  assert.equal(buildStoryPromptLanguageRule('unknown'), '');
  const normal = buildStoryPromptLanguageRule('en-US');
  const translateOnly = buildStoryPromptLanguageRule('en-US', { translateOnly: true });
  assert.match(normal, /en-US/);
  assert.match(translateOnly, /en-US/);
  assert.notEqual(normal, translateOnly);
});
