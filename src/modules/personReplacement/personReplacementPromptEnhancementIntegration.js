import { resolvePersonReplacementPromptEnhancementModel } from './personReplacementPromptEnhancement.js';
export function createPersonReplacementPromptEnhancementIntegration({
  enhancePrompt: _0x2347fa,
  getSettings: getSettings = () => ({}),
} = {}) {
  const _0x42a560 = () => resolvePersonReplacementPromptEnhancementModel(getSettings?.() || {});
  return Object['freeze']({
    enhancePrompt:
      typeof _0x2347fa === 'function'
        ? (_0x9d3582) => _0x2347fa({ ..._0x9d3582, settings: getSettings?.() || {} })
        : null,
    getPromptEnhancementModel: _0x42a560,
  });
}
