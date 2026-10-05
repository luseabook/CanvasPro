export function stripPrefix(value, list) {
  const list2 = String(value || '')['trim']();
  return list2['startsWith'](list) ? list2['slice'](list['length']) : list2;
}
export function isPresentValue(item) {
  return item !== undefined && item !== null && String(item)['trim']() !== '';
}
export function normalizePositiveInteger(key, index) {
  const count = Number['parseInt'](String(key ?? '')['trim'](), 10);
  return Number['isFinite'](count) && count >= 0 ? count : index;
}
export function normalizeOptionalIntegerInRange(result, { min: min = null, max: max = null } = {}) {
  if (!isPresentValue(result)) return null;
  const data = Number(result);
  if (!Number['isFinite'](data)) return null;
  let options = Math['trunc'](data);
  const target = Number(min),
    source = Number(max);
  return (
    min !== null && Number['isFinite'](target) && (options = Math['max'](Math['trunc'](target), options)),
    max !== null && Number['isFinite'](source) && (options = Math['min'](Math['trunc'](source), options)),
    options
  );
}
export function normalizeInputList(list3) {
  return Array['isArray'](list3)
    ? list3['map']((next) => String(next || '')['trim']())['filter'](Boolean)
    : [];
}
export function normalizeInputUrlsBySlot(enabled) {
  if (!enabled || typeof enabled !== 'object' || Array['isArray'](enabled)) return {};
  return Object['fromEntries'](
    Object['entries'](enabled)
      ['map'](([current, entry]) => [String(current || '')['trim'](), String(entry || '')['trim']()])
      ['filter'](([record, payload]) => record && payload),
  );
}
export function appendUniqueUrl(list4, handle) {
  const state = String(handle || '')['trim']();
  if (state && !list4['includes'](state)) list4['push'](state);
}
export function normalizeKlingKeepOriginalSound(config) {
  if (config === true || config === false) return config;
  const scope = String(config ?? '')
    ['trim']()
    ['toLowerCase']();
  return scope === 'true' || scope === '1' || scope === 'yes';
}
export function replaceKlingO1PromptImageReferences(input, output) {
  const count2 = Math['max'](0, Math['trunc'](Number(output) || 0));
  if (count2 <= 0) return String(input || '');
  return String(input || '')['replace'](/@?\u56fe\u7247\s*([1-9]\d*)/g, (value2, value3) => {
    const count3 = Number['parseInt'](String(value3 || ''), 10);
    if (!Number['isFinite'](count3) || count3 < 1 || count3 > count2) return value2;
    return '<<<image_' + count3 + '>>>';
  });
}
