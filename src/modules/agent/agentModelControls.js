import { bindAIGenTextModelSelector } from '../../components/aigenText/modelSelector.js';
import { bindAIGenTextRuntimeParameterControls } from '../../components/aigenText/runtimeModelParameterControls.js';
import { buildModelGenerationParamsSelectionPatch } from '../modelGenerationParamMemory.js';
export function commitAgentModelSelection(value, item = {}) {
  const model = String(item['model'] || item['modelId'] || '')['trim'](),
    provider = String(item['provider'] || '')['trim']();
  if (!model) return null;
  const providerProfileId = String(item['providerProfileId'] || '')['trim'](),
    providerProfileIdByModel =
      item['providerProfileIdByModel'] && typeof item['providerProfileIdByModel'] === 'object'
        ? item['providerProfileIdByModel']
        : {},
    args = value?.['getSettings']?.() || {},
    args2 = {
      model: model,
      provider: provider,
      providerProfileId: providerProfileId,
      providerProfileIdByModel: providerProfileIdByModel,
      ...(typeof value?.['getSettings'] === 'function'
        ? buildModelGenerationParamsSelectionPatch(args, model)
        : {}),
    };
  return value?.['updateSettings']?.(args2) || { ...args, ...args2 };
}
export function bindAgentModelControls(
  key,
  {
    modelSettings: modelSettings,
    initialSettings: initialSettings = {},
    documentObject: documentObject = globalThis['document'],
  } = {},
) {
  const getState = () => modelSettings?.['getSettings']?.() || initialSettings;
  let bindAIGenTextRuntimeParameterControls2 = null;
  const bindAIGenTextModelSelector2 = bindAIGenTextModelSelector(key, {
    modelId: initialSettings['model'],
    provider: initialSettings['provider'],
    providerProfileId: initialSettings['providerProfileId'],
    providerProfileIdByModel: initialSettings['providerProfileIdByModel'],
    documentObject: documentObject,
    onChange: (index) => {
      const commitAgentModelSelection2 = commitAgentModelSelection(modelSettings, index);
      return (
        bindAIGenTextRuntimeParameterControls2?.['setModel']?.(commitAgentModelSelection2?.['model']),
        commitAgentModelSelection2
      );
    },
  });
  return (
    (bindAIGenTextRuntimeParameterControls2 = bindAIGenTextRuntimeParameterControls(key, {
      modelId: initialSettings['model'],
      getState: getState,
      onChange: (args3) => modelSettings?.['updateSettings']?.(args3) || { ...getState(), ...args3 },
    })),
    {
      sync(modelId = getState()) {
        (bindAIGenTextModelSelector2?.['setSelection']?.({
          modelId: modelId['model'],
          provider: modelId['provider'],
          providerProfileId: modelId['providerProfileId'],
          providerProfileIdByModel: modelId['providerProfileIdByModel'],
        }),
          bindAIGenTextRuntimeParameterControls2?.['sync']?.(modelId));
      },
      destroy() {
        (bindAIGenTextModelSelector2?.['destroy']?.(),
          bindAIGenTextRuntimeParameterControls2?.['destroy']?.());
      },
    }
  );
}
