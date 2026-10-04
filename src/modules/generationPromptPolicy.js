import { normalizeProviderId, resolveModelExecution } from '../manifests/index.js';
export const PROMPT_EMPTY_POLICIES = Object['freeze']({
  BLOCK: 'block',
  ALLOW_WITH_INPUT: 'allowWithInput',
  ALLOW: 'allow',
});
export const PROMPT_EMPTY_POLICY_VALUES = Object['freeze'](Object['values'](PROMPT_EMPTY_POLICIES));
const DEFAULT_PROMPT_MIN_LENGTH = 0x1;
function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array['isArray'](value);
}
function normalizePromptEmptyPolicy(value) {
  const normalized = String(value || '')['trim']();
  return PROMPT_EMPTY_POLICY_VALUES['includes'](normalized) ? normalized : '';
}
function normalizePromptMinLength(value) {
  if (value === undefined || value === null || value === '') return DEFAULT_PROMPT_MIN_LENGTH;
  const numeric = Number(value);
  return Number['isInteger'](numeric) && numeric >= 0x0 ? numeric : DEFAULT_PROMPT_MIN_LENGTH;
}
function resolveDefaultEmptyPolicy({
  modelManifest: modelManifest,
  executionManifest: executionManifest,
  provider: provider,
}) {
  const adapterType = String(modelManifest?.['adapterType'] || executionManifest?.['adapterType'] || '')[
      'trim'
    ](),
    providers = [provider, modelManifest?.['provider'], executionManifest?.['provider']]['map'](
      normalizeProviderId,
    );
  if (adapterType === 'workflow' && providers['includes']('runninghubwf'))
    return PROMPT_EMPTY_POLICIES['ALLOW'];
  return PROMPT_EMPTY_POLICIES['BLOCK'];
}
export function resolveGenerationPromptPolicy({
  model: model = '',
  provider: provider = '',
  modelManifest: modelManifest = null,
  executionManifest: executionManifest = null,
} = {}) {
  const resolved =
      modelManifest && executionManifest
        ? { modelManifest: modelManifest, executionManifest: executionManifest }
        : resolveModelExecution(model, { providerHint: provider }) || resolveModelExecution(model),
    manifest = modelManifest || resolved?.['modelManifest'] || null,
    execution = executionManifest || resolved?.['executionManifest'] || null,
    promptConfig = isPlainObject(manifest?.['prompt']) ? manifest['prompt'] : {},
    manifestPolicy = normalizePromptEmptyPolicy(promptConfig['emptyPolicy']),
    emptyPolicy =
      manifestPolicy ||
      resolveDefaultEmptyPolicy({
        modelManifest: manifest,
        executionManifest: execution,
        provider: provider,
      });
  return {
    emptyPolicy: emptyPolicy,
    minLength: normalizePromptMinLength(promptConfig['minLength']),
    modelManifest: manifest,
    executionManifest: execution,
    source: manifestPolicy ? 'manifest' : 'default',
  };
}
export function countPromptCharacters(text = '') {
  const normalized = String(text || '')['trim']();
  let count = normalized['length'];
  for (let index = 0x0; index < normalized['length'] - 0x1; index += 0x1) {
    const high = normalized['charCodeAt'](index);
    if (high < 0xd800 || high > 0xdbff) continue;
    const low = normalized['charCodeAt'](index + 0x1);
    if (low < 0xdc00 || low > 0xdfff) continue;
    ((count -= 0x1), (index += 0x1));
  }
  return count;
}
export function evaluateGenerationPromptBoundary({
  model: model = '',
  provider: provider = '',
  promptText: promptText = '',
  hasInput: hasInput = ![],
  modelManifest: modelManifest = null,
  executionManifest: executionManifest = null,
} = {}) {
  const policy = resolveGenerationPromptPolicy({
      model: model,
      provider: provider,
      modelManifest: modelManifest,
      executionManifest: executionManifest,
    }),
    promptLength = countPromptCharacters(promptText);
  if (promptLength >= policy['minLength'])
    return { ok: !![], reason: '', promptLength: promptLength, ...policy };
  if (promptLength > 0x0) return { ok: ![], reason: 'promptTooShort', promptLength: promptLength, ...policy };
  if (policy['emptyPolicy'] === PROMPT_EMPTY_POLICIES['ALLOW'])
    return { ok: !![], reason: '', promptLength: promptLength, ...policy };
  if (policy['emptyPolicy'] === PROMPT_EMPTY_POLICIES['ALLOW_WITH_INPUT'] && hasInput === !![])
    return { ok: !![], reason: '', promptLength: promptLength, ...policy };
  return {
    ok: ![],
    reason:
      policy['emptyPolicy'] === PROMPT_EMPTY_POLICIES['ALLOW_WITH_INPUT']
        ? 'promptOrInputRequired'
        : 'promptRequired',
    promptLength: promptLength,
    ...policy,
  };
}
