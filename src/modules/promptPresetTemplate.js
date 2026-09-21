export const PROMPT_PRESET_USER_INPUT_PLACEHOLDER = '{用户输入}';
export const PROMPT_PRESET_TEMPLATE_TYPE_STATIC = 'static';
export const PROMPT_PRESET_TEMPLATE_TYPE_CONDITIONAL_BY_IMAGE_INPUT = 'conditionalByImageInput';
const PROMPT_PRESET_USER_INPUT_PATTERN = /\{\{?\s*用户输入(?:\s*\|\|?\s*([^}]+))?\s*\}\}?/g;
function isPlainTemplateObject(_0x538c49) {
  return _0x538c49 !== null && typeof _0x538c49 === 'object' && !Array.isArray(_0x538c49);
}
function resolveContextFlag(_0x29f67e, _0x44ba9e) {
  const _0x4f4563 = _0x29f67e?.[_0x44ba9e];
  return typeof _0x4f4563 === 'function' ? !!_0x4f4563() : _0x4f4563 === true;
}
export function isConditionalPromptPresetTemplate(_0x480b28 = null) {
  return (
    isPlainTemplateObject(_0x480b28) &&
    _0x480b28.type === PROMPT_PRESET_TEMPLATE_TYPE_CONDITIONAL_BY_IMAGE_INPUT
  );
}
export function isStaticPromptPresetTemplate(_0x29b291 = null) {
  return isPlainTemplateObject(_0x29b291) && _0x29b291.type === PROMPT_PRESET_TEMPLATE_TYPE_STATIC;
}
export function isObjectPromptPresetTemplate(_0x866cf0 = null) {
  return isStaticPromptPresetTemplate(_0x866cf0) || isConditionalPromptPresetTemplate(_0x866cf0);
}
export function requiresPromptPresetInput(_0x42844b = null) {
  if (isConditionalPromptPresetTemplate(_0x42844b)) return true;
  if (isStaticPromptPresetTemplate(_0x42844b)) return _0x42844b.requireInput === true;
  return false;
}
export function hasPromptPresetTemplateContent(_0x5508a7 = null) {
  if (typeof _0x5508a7 === 'string') return _0x5508a7.trim().length > 0;
  if (isStaticPromptPresetTemplate(_0x5508a7)) return String(_0x5508a7.text || '').trim().length > 0;
  if (isConditionalPromptPresetTemplate(_0x5508a7))
    return (
      String(_0x5508a7.imageInputTemplate || '').trim().length > 0 ||
      String(_0x5508a7.textInputTemplate || '').trim().length > 0
    );
  return false;
}
export function getPromptPresetTemplateEmptyInputMessage(_0x32e042 = null) {
  return requiresPromptPresetInput(_0x32e042) ? String(_0x32e042.emptyInputMessage || '') : '';
}
export function resolvePromptPresetTemplate(_0x2b03ef = '', _0x5d85f8 = '', _0x935a73 = {}) {
  const _0x27fca8 = String(_0x5d85f8 ?? '').trim();
  if (isStaticPromptPresetTemplate(_0x2b03ef)) {
    const _0x383607 = resolveContextFlag(_0x935a73, 'hasImageInput');
    if (_0x2b03ef.requireInput === true && !_0x27fca8 && !_0x383607) return '';
    return resolvePromptPresetTemplate(_0x2b03ef.text || '', _0x27fca8, _0x935a73);
  }
  if (isConditionalPromptPresetTemplate(_0x2b03ef)) {
    const _0x5954fb = resolveContextFlag(_0x935a73, 'hasImageInput');
    if (_0x5954fb)
      return resolvePromptPresetTemplate(_0x2b03ef.imageInputTemplate || '', _0x27fca8, _0x935a73);
    if (_0x27fca8)
      return resolvePromptPresetTemplate(_0x2b03ef.textInputTemplate || '', _0x27fca8, _0x935a73);
    return '';
  }
  const _0x42d88d = String(_0x2b03ef ?? '');
  if (!_0x42d88d) return _0x27fca8;
  return _0x42d88d.replace(
    PROMPT_PRESET_USER_INPUT_PATTERN,
    (_0x925d1a, _0x42e4e4) => _0x27fca8 || _0x42e4e4 || '',
  );
}
