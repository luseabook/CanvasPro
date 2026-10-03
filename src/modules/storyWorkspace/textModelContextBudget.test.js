import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_TEXT_MODEL_CONTEXT_TOKENS,
  TEXT_MODEL_CONTEXT_FAMILY_FLOOR_TOKENS,
  estimateCharactersForTokens,
  estimateTextTokens,
  computeStoryInputBudget,
  resolveTextModelContextWindow,
} from './textModelContextBudget.js';

test('context budget: a manifest value wins over every fallback', () => {
  const resolved = resolveTextModelContextWindow('anything-unknown', {
    manifest: { extensions: { textMenu: { contextWindow: 0x40000 } } },
  });
  assert.equal(resolved.tokens, 0x40000);
  assert.equal(resolved.known, true);
  assert.equal(resolved.source, 'manifest');
});

test('context budget: a direct manifest field is honoured too', () => {
  assert.equal(resolveTextModelContextWindow('x', { manifest: { contextWindow: 0x10000 } }).tokens, 0x10000);
});

test('context budget: an exact override beats the family floor', () => {
  const resolved = resolveTextModelContextWindow('gpt-5.4-mini');
  assert.equal(resolved.tokens, 0x20000);
  assert.equal(resolved.source, 'override');
});

test('context budget: a known family gets the conservative floor', () => {
  for (const id of ['claude-opus-5', 'gemini-3.8-flash', 'deepseek-v4-pro', 'qwen/qwen3.6-plus', 'bytedance/doubao-seed-2.0-pro', 'glm-5.3']) {
    const resolved = resolveTextModelContextWindow(id);
    assert.equal(resolved.tokens, TEXT_MODEL_CONTEXT_FAMILY_FLOOR_TOKENS, id);
    assert.equal(resolved.source, 'family', id);
  }
});

test('context budget: an unknown model falls back to the conservative default', () => {
  const resolved = resolveTextModelContextWindow('totally-made-up-model');
  assert.equal(resolved.tokens, DEFAULT_TEXT_MODEL_CONTEXT_TOKENS);
  assert.equal(resolved.known, false);
  assert.equal(resolved.source, 'default');
});

test('context budget: no model at all still resolves to the default', () => {
  assert.equal(resolveTextModelContextWindow('').tokens, DEFAULT_TEXT_MODEL_CONTEXT_TOKENS);
});

test('context budget: token estimation is conservative and handles empty input', () => {
  assert.equal(estimateTextTokens(''), 0);
  assert.equal(estimateTextTokens(null), 0);
  assert.equal(estimateTextTokens('中文十个字符测试'), 8);
  assert.equal(estimateTextTokens('a'.repeat(1000)), 1000);
});

test('context budget: characters are the inverse of tokens', () => {
  assert.equal(estimateCharactersForTokens(0), 0);
  assert.equal(estimateCharactersForTokens(-5), 0);
  assert.equal(estimateCharactersForTokens(1000), 1000);
});

test('context budget: output reserve and carried digests both shrink the chunk', () => {
  const base = computeStoryInputBudget({ modelId: 'claude-opus-5' });
  assert.equal(base.contextTokens, TEXT_MODEL_CONTEXT_FAMILY_FLOOR_TOKENS);
  assert.equal(base.outputReserveTokens, Math.floor(TEXT_MODEL_CONTEXT_FAMILY_FLOOR_TOKENS * 0.25));

  const carried = computeStoryInputBudget({ modelId: 'claude-opus-5', carriedTokens: 10000 });
  assert.ok(carried.usableTokens < base.usableTokens, 'carried digests must reduce the budget');

  const templated = computeStoryInputBudget({ modelId: 'claude-opus-5', templateTokens: 4000 });
  assert.ok(templated.usableTokens < base.usableTokens, 'template overhead must reduce the budget');
});

test('context budget: an explicit window overrides model resolution', () => {
  const budget = computeStoryInputBudget({ modelId: 'claude-opus-5', contextTokens: 8000 });
  assert.equal(budget.contextTokens, 8000);
  assert.equal(budget.known, true);
  assert.equal(budget.source, 'explicit');
});

test('context budget: a window smaller than its overhead yields no chunk space', () => {
  const budget = computeStoryInputBudget({ contextTokens: 1000, carriedTokens: 5000 });
  assert.equal(budget.availableTokens, 0);
  assert.equal(budget.usableTokens, 0);
  assert.equal(budget.usableCharacters, 0);
});

test('context budget: a 100k character novel needs many chunks on the default window', () => {
  const budget = computeStoryInputBudget({ modelId: 'totally-made-up-model', templateTokens: 2000 });
  assert.ok(budget.usableCharacters > 0);
  assert.ok(budget.usableCharacters < 100000, 'the default window cannot hold the whole novel');
  const chunks = Math.ceil(100000 / budget.usableCharacters);
  assert.ok(chunks > 1, 'the novel must be split');
});
