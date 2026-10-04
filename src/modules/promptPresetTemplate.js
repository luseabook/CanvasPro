export const PROMPT_PRESET_USER_INPUT_PLACEHOLDER = '{用户输入}';
export const PROMPT_PRESET_TEMPLATE_TYPE_STATIC = 'static';
export const PROMPT_PRESET_TEMPLATE_TYPE_CONDITIONAL_BY_IMAGE_INPUT = 'conditionalByImageInput';
const PROMPT_PRESET_USER_INPUT_PATTERN = /\{\{?\s*用户输入(?:\s*\|\|?\s*([^}]+))?\s*\}\}?/g;
function isPlainTemplateObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function resolveContextFlag(item, key) {
  const run = item?.[key];
  return typeof run === 'function' ? !!run() : run === true;
}
export function isConditionalPromptPresetTemplate(value2 = null) {
  return (
    isPlainTemplateObject(value2) && value2.type === PROMPT_PRESET_TEMPLATE_TYPE_CONDITIONAL_BY_IMAGE_INPUT
  );
}
export function isStaticPromptPresetTemplate(value3 = null) {
  return isPlainTemplateObject(value3) && value3.type === PROMPT_PRESET_TEMPLATE_TYPE_STATIC;
}
export function isObjectPromptPresetTemplate(value4 = null) {
  return isStaticPromptPresetTemplate(value4) || isConditionalPromptPresetTemplate(value4);
}
export function requiresPromptPresetInput(value5 = null) {
  if (isConditionalPromptPresetTemplate(value5)) return true;
  if (isStaticPromptPresetTemplate(value5)) return value5.requireInput === true;
  return false;
}
export function hasPromptPresetTemplateContent(response = null) {
  if (typeof response === 'string') return response.trim().length > 0;
  if (isStaticPromptPresetTemplate(response)) return String(response.text || '').trim().length > 0;
  if (isConditionalPromptPresetTemplate(response))
    return (
      String(response.imageInputTemplate || '').trim().length > 0 ||
      String(response.textInputTemplate || '').trim().length > 0
    );
  return false;
}
export function getPromptPresetTemplateEmptyInputMessage(value6 = null) {
  return requiresPromptPresetInput(value6) ? String(value6.emptyInputMessage || '') : '';
}
export function resolvePromptPresetTemplate(response2 = '', index = '', result = {}) {
  const enabled = String(index ?? '').trim();
  if (isStaticPromptPresetTemplate(response2)) {
    const contextFlag = resolveContextFlag(result, 'hasImageInput');
    if (response2.requireInput === true && !enabled && !contextFlag) return '';
    return resolvePromptPresetTemplate(response2.text || '', enabled, result);
  }
  if (isConditionalPromptPresetTemplate(response2)) {
    const contextFlag2 = resolveContextFlag(result, 'hasImageInput');
    if (contextFlag2) return resolvePromptPresetTemplate(response2.imageInputTemplate || '', enabled, result);
    if (enabled) return resolvePromptPresetTemplate(response2.textInputTemplate || '', enabled, result);
    return '';
  }
  const enabled2 = String(response2 ?? '');
  if (!enabled2) return enabled;
  return enabled2.replace(PROMPT_PRESET_USER_INPUT_PATTERN, (data, options) => enabled || options || '');
}
