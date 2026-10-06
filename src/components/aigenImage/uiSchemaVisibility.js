import { getModelManifest } from '../../manifests/index.js';
function getUiSchemaNodeFieldValue(options = {}, value = '', item = '') {
  const enabled = String(value || '').trim();
  if (!enabled) return item;
  const key =
    options?.generationParams &&
    typeof options.generationParams === 'object' &&
    !Array.isArray(options.generationParams)
      ? options.generationParams
      : {};
  if (key[enabled] !== undefined) return key[enabled];
  if (options && typeof options === 'object' && !Array.isArray(options) && options[enabled] !== undefined)
    return options[enabled];
  return item;
}
function collectVisibilityConditionFields(list, index) {
  if (Array.isArray(list))
    return (list.forEach((result) => collectVisibilityConditionFields(result, index)), index);
  if (!list || typeof list !== 'object') return index;
  Array.isArray(list.any) &&
    list.any.forEach((data) => collectVisibilityConditionFields(data, index));
  Array.isArray(list.all) &&
    list.all.forEach((target) => collectVisibilityConditionFields(target, index));
  const source = String(list.field || list.param || '').trim();
  if (source) index.add(source);
  return index;
}
function collectVisibilityDependencyFields(list2 = []) {
  const next = new Set();
  return (
    (Array.isArray(list2) ? list2 : []).forEach((current) => {
      (collectVisibilityConditionFields(current?.showWhen, next),
        collectVisibilityConditionFields(current?.hideWhen, next));
      const list3 = [
        ...(Array.isArray(current?.options) ? current.options : []),
        ...(Array.isArray(current?.advancedOptions) ? current.advancedOptions : []),
      ];
      list3.forEach((entry) => {
        collectVisibilityConditionFields(entry?.hideWhen, next);
      });
    }),
    next
  );
}
export function buildUiSchemaVisibilitySignature(record, payload = {}) {
  const modelId = String(record || payload?.model || '').trim(),
    modelManifest = getModelManifest(modelId),
    list4 = Array.isArray(modelManifest?.uiSchema?.fields)
      ? modelManifest.uiSchema.fields
      : [],
    args = collectVisibilityDependencyFields(list4),
    map = new Map(
      list4.map((handle) => [String(handle?.id || '').trim(), handle?.defaultValue]).filter(
        ([state]) => state,
      ),
    ),
    dependencies = [...args]
      .sort()
      .map((config) => [config, getUiSchemaNodeFieldValue(payload, config, map.get(config))]);
  return JSON.stringify({ modelId: modelId, dependencies: dependencies });
}
