import test from 'node:test';
import assert from 'node:assert/strict';

import { createPersonReplacementPromptEnhancementIntegration } from './personReplacementPromptEnhancementIntegration.js';

const SETTINGS = { model: 'gemini-3.1-pro', provider: 'grsai' };

test('personReplacementPromptEnhancementIntegration: 返回冻结的集成对象', () => {
  const integration = createPersonReplacementPromptEnhancementIntegration();
  assert.equal(Object.isFrozen(integration), true);
  assert.deepEqual(Object.keys(integration).sort(), ['enhancePrompt', 'getPromptEnhancementModel']);
});

test('personReplacementPromptEnhancementIntegration: enhancePrompt 调用时会补上当前设置', () => {
  const seen = [];
  const integration = createPersonReplacementPromptEnhancementIntegration({
    enhancePrompt: (payload) => {
      seen.push(payload);
      return { ok: true, prompt: payload.prompt };
    },
    getSettings: () => SETTINGS,
  });

  assert.deepEqual(integration.enhancePrompt({ prompt: '把这段改写一下' }), {
    ok: true,
    prompt: '把这段改写一下',
  });
  assert.deepEqual(seen, [{ prompt: '把这段改写一下', settings: SETTINGS }]);
});

test('personReplacementPromptEnhancementIntegration: 设置里的同名字段会被当前设置覆盖', () => {
  const seen = [];
  const integration = createPersonReplacementPromptEnhancementIntegration({
    enhancePrompt: (payload) => {
      seen.push(payload);
      return null;
    },
    getSettings: () => SETTINGS,
  });

  integration.enhancePrompt({ settings: { model: '陈旧值' }, prompt: 'p' });
  assert.deepEqual(seen[0].settings, SETTINGS);
});

test('personReplacementPromptEnhancementIntegration: 没有 enhancePrompt 时该字段为 null', () => {
  const integration = createPersonReplacementPromptEnhancementIntegration({ getSettings: () => SETTINGS });
  assert.equal(integration.enhancePrompt, null);
});

test('personReplacementPromptEnhancementIntegration: 每次都重新取设置，不吃快照', () => {
  let current = { model: 'gemini-3.1-pro', provider: 'grsai' };
  const integration = createPersonReplacementPromptEnhancementIntegration({ getSettings: () => current });
  assert.equal(integration.getPromptEnhancementModel().modelId, 'gemini-3.1-pro');
  current = { model: 'zzz', provider: 'grsai' };
  assert.equal(integration.getPromptEnhancementModel().modelId, 'zzz');
  assert.equal(integration.getPromptEnhancementModel().configured, false);
});

test('personReplacementPromptEnhancementIntegration: 默认设置解析为未配置', () => {
  const integration = createPersonReplacementPromptEnhancementIntegration();
  const model = integration.getPromptEnhancementModel();
  assert.equal(model.configured, false);
  assert.equal(model.displayName, '未配置');
  assert.equal(model.supportsImage, false);
  assert.equal(model.maxImages, 0);
});
