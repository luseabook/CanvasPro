import { normalizeProviderId, resolveModelExecution } from '../manifests/index.js';
export const PROMPT_EMPTY_POLICIES = Object['freeze']({
  BLOCK: 'block',
  ALLOW_WITH_INPUT: 'allowWithInput',
  ALLOW: 'allow',
});
export const PROMPT_EMPTY_POLICY_VALUES = Object['freeze'](Object['values'](PROMPT_EMPTY_POLICIES));
const DEFAULT_PROMPT_MIN_LENGTH = 0x1;
function isPlainObject(enabled) {
  return !!enabled && typeof enabled === 'object' && !Array['isArray'](enabled);
}
function normalizePromptEmptyPolicy(value) {
  const item = String(value || '')['trim']();
  return PROMPT_EMPTY_POLICY_VALUES['includes'](item) ? item : '';
}
function normalizePromptMinLength(key) {
  if (key === undefined || key === null || key === '') return DEFAULT_PROMPT_MIN_LENGTH;
  const count = Number(key);
  return Number['isInteger'](count) && count >= 0x0 ? count : DEFAULT_PROMPT_MIN_LENGTH;
}
function resolveDefaultEmptyPolicy({
  modelManifest: modelManifest2,
  executionManifest: executionManifest2,
  provider: provider2,
}) {
  const index = String(modelManifest2?.['adapterType'] || executionManifest2?.['adapterType'] || '')[
      'trim'
    ](),
    list = [provider2, modelManifest2?.['provider'], executionManifest2?.['provider']]['map'](
      normalizeProviderId,
    );
  if (index === 'workflow' && list['includes']('runninghubwf')) return PROMPT_EMPTY_POLICIES['ALLOW'];
  return PROMPT_EMPTY_POLICIES['BLOCK'];
}
export function resolveGenerationPromptPolicy({
  model: model = '',
  provider: provider = '',
  modelManifest: modelManifest = null,
  executionManifest: executionManifest = null,
} = {}) {
  const result =
      modelManifest && executionManifest
        ? { modelManifest: modelManifest, executionManifest: executionManifest }
        : resolveModelExecution(model, { providerHint: provider }) || resolveModelExecution(model),
    modelManifest3 = modelManifest || result?.['modelManifest'] || null,
    executionManifest3 = executionManifest || result?.['executionManifest'] || null,
    isPlainObject2 = isPlainObject(modelManifest3?.['prompt']) ? modelManifest3['prompt'] : {},
    source = normalizePromptEmptyPolicy(isPlainObject2['emptyPolicy']),
    emptyPolicy =
      source ||
      resolveDefaultEmptyPolicy({
        modelManifest: modelManifest3,
        executionManifest: executionManifest3,
        provider: provider,
      });
  return {
    emptyPolicy: emptyPolicy,
    minLength: normalizePromptMinLength(isPlainObject2['minLength']),
    modelManifest: modelManifest3,
    executionManifest: executionManifest3,
    source: source ? 'manifest' : 'default',
  };
}
export function countPromptCharacters(data = '') {
  const list2 = String(data || '')['trim']();
  let options = list2['length'];
  for (let target = 0x0; target < list2['length'] - 0x1; target += 0x1) {
    const count2 = list2['charCodeAt'](target);
    if (count2 < 0xd800 || count2 > 0xdbff) continue;
    const count3 = list2['charCodeAt'](target + 0x1);
    if (count3 < 0xdc00 || count3 > 0xdfff) continue;
    ((options -= 0x1), (target += 0x1));
  }
  return options;
}
export function evaluateGenerationPromptBoundary({
  model: model = '',
  provider: provider = '',
  promptText: promptText = '',
  hasInput: hasInput = ![],
  modelManifest: modelManifest = null,
  executionManifest: executionManifest = null,
} = {}) {
  const reason = resolveGenerationPromptPolicy({
      model: model,
      provider: provider,
      modelManifest: modelManifest,
      executionManifest: executionManifest,
    }),
    promptLength = countPromptCharacters(promptText);
  if (promptLength >= reason['minLength'])
    return { ok: !![], reason: '', promptLength: promptLength, ...reason };
  if (promptLength > 0x0) return { ok: ![], reason: 'promptTooShort', promptLength: promptLength, ...reason };
  if (reason['emptyPolicy'] === PROMPT_EMPTY_POLICIES['ALLOW'])
    return { ok: !![], reason: '', promptLength: promptLength, ...reason };
  if (reason['emptyPolicy'] === PROMPT_EMPTY_POLICIES['ALLOW_WITH_INPUT'] && hasInput === !![])
    return { ok: !![], reason: '', promptLength: promptLength, ...reason };
  return {
    ok: ![],
    reason:
      reason['emptyPolicy'] === PROMPT_EMPTY_POLICIES['ALLOW_WITH_INPUT']
        ? 'promptOrInputRequired'
        : 'promptRequired',
    promptLength: promptLength,
    ...reason,
  };
}
