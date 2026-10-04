import { resolvePersonReplacementPromptEnhancementModel } from './personReplacementPromptEnhancement.js';
export function createPersonReplacementPromptEnhancementIntegration({
  enhancePrompt: enhancePrompt,
  getSettings: getSettings = () => ({}),
} = {}) {
  const getPromptEnhancementModel = () =>
    resolvePersonReplacementPromptEnhancementModel(getSettings?.() || {});
  return Object['freeze']({
    enhancePrompt:
      typeof enhancePrompt === 'function'
        ? (args) => enhancePrompt({ ...args, settings: getSettings?.() || {} })
        : null,
    getPromptEnhancementModel: getPromptEnhancementModel,
  });
}
