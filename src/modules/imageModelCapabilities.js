import {
  QWEN_IMAGE_EDIT_MODEL_ID,
  getModelsByKind,
  isWorkflowModel,
  normalizeProviderId as normalizeProviderId_2,
  resolveModelExecution,
} from '../manifests/index.js';
import { NANO_BANANA_FAMILIES, resolveNanoBananaSelectionFromModel } from './nanoBananaModeRules.js';
const RH_QWEN_IMAGE_EDIT_MODEL = QWEN_IMAGE_EDIT_MODEL_ID;
function normalizeModelId(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}
function normalizeProviderId(item) {
  return normalizeProviderId_2(item);
}
function inferProviderHintFromModelId(key) {
  const list = normalizeModelId(key);
  if (!list.includes('/')) return '';
  return normalizeProviderId(list.split('/')[0]);
}
function normalizeImageSizeValue(index) {
  return String(index || '')
    .trim()
    .toUpperCase();
}
function collectStringValues(list2, list3 = []) {
  if (typeof list2 === 'string') {
    const modelId = normalizeModelId(list2);
    if (modelId) list3.push(modelId);
    return list3;
  }
  if (Array.isArray(list2)) return (list2.forEach((item2) => collectStringValues(item2, list3)), list3);
  return (
    list2 &&
      typeof list2 === 'object' &&
      Object.values(list2).forEach((item3) => collectStringValues(item3, list3)),
    list3
  );
}
function getExecutionModelTokens(result) {
  return collectStringValues([
    result?.model,
    result?.routeModels,
    result?.modeModels,
    result?.imageSizeModels,
  ]);
}
function resolveImageModelFromExecutionToken(data, options = '') {
  const list4 = normalizeModelId(data);
  if (!list4 || list4.includes('/')) return null;
  const providerId = normalizeProviderId(options),
    list5 = getModelsByKind('image').filter((item4) => {
      return !providerId || normalizeProviderId(item4?.provider) === providerId;
    }),
    list6 = list5
      .map((modelManifest) => ({
        modelManifest: modelManifest,
        executionManifest: resolveModelExecution(modelManifest?.modelId)?.executionManifest,
      }))
      .filter((item5) => item5.executionManifest),
    target = list6.find(
      ({ executionManifest: executionManifest }) => normalizeModelId(executionManifest?.model) === list4,
    ),
    modelManifest2 =
      target ||
      list6.find(({ executionManifest: executionManifest2 }) =>
        getExecutionModelTokens(executionManifest2).includes(list4),
      );
  if (!modelManifest2) return null;
  return {
    modelManifest: modelManifest2.modelManifest,
    executionManifest: modelManifest2.executionManifest,
    canonicalModelId: modelManifest2.modelManifest.modelId,
    source: 'execution-model-token',
  };
}
function resolveImageModelContext(source, next = '') {
  const providerHint = normalizeProviderId(next) || inferProviderHintFromModelId(source),
    modelExecution =
      resolveModelExecution(source, { providerHint: providerHint }) ||
      resolveImageModelFromExecutionToken(source, providerHint) ||
      (providerHint ? null : resolveModelExecution(source)),
    modelManifest3 = modelExecution?.modelManifest || null,
    executionManifest3 = modelExecution?.executionManifest || null;
  return {
    modelManifest: modelManifest3,
    executionManifest: executionManifest3,
    provider: normalizeProviderId(modelManifest3?.provider || providerHint),
    modelId: normalizeModelId(modelExecution?.canonicalModelId || modelManifest3?.modelId || source),
  };
}
function getImageSizePolicy(current, entry = '') {
  const context = resolveImageModelContext(current, entry),
    policy = context.modelManifest?.extensions?.imageSizePolicy;
  return policy && typeof policy === 'object'
    ? { context: context, policy: policy }
    : { context: context, policy: null };
}
function normalizePolicySizes(list7) {
  return Array.isArray(list7) ? list7.map(normalizeImageSizeValue).filter(Boolean) : [];
}
function getGrsaiNanoBananaSelection(record, payload = '', handle = '2K') {
  const nanoBananaSelectionFromModel = resolveNanoBananaSelectionFromModel(record, handle, payload);
  if (!nanoBananaSelectionFromModel || nanoBananaSelectionFromModel.provider !== 'grsai') return null;
  if (nanoBananaSelectionFromModel.family === NANO_BANANA_FAMILIES.GPT_IMAGE_2) return null;
  return nanoBananaSelectionFromModel;
}
export function isRunningHubModelWithoutImageSizeParam(state) {
  const { context: context2, policy: policy2 } = getImageSizePolicy(state);
  return context2.provider === 'runninghub' && policy2?.omitRequestParam === true;
}
export function isRunningHubGptImage2OfficialModel(config, scope = '') {
  const { context: context3, policy: policy3 } = getImageSizePolicy(config, scope);
  return context3.provider === 'runninghub' && policy3?.officialVariant === true;
}
export function isRhQwenImageEditModel(input) {
  return normalizeModelId(input) === normalizeModelId(RH_QWEN_IMAGE_EDIT_MODEL);
}
export function normalizeImageSizeForProviderModel({
  model: model,
  provider: provider = '',
  imageSize: imageSize = '',
} = {}) {
  const imageSizeValue = normalizeImageSizeValue(imageSize),
    { policy: policy4 } = getImageSizePolicy(model, provider),
    grsaiNanoBananaSelection = getGrsaiNanoBananaSelection(model, provider, imageSizeValue || '2K');
  if (grsaiNanoBananaSelection) {
    const imageSizeValue2 = normalizeImageSizeValue(policy4?.fixedSize);
    if (imageSizeValue2) return imageSizeValue2;
    if (imageSizeValue === '4K' && policy4?.allow4KSelection === true) return '4K';
    return imageSizeValue === '1K' ? '1K' : '2K';
  }
  if (isRunningHubGptImage2OfficialModel(model, provider)) {
    const list8 = normalizePolicySizes(policy4?.allowedSizes);
    if (list8.includes(imageSizeValue)) return imageSizeValue;
    return normalizeImageSizeValue(policy4?.defaultSize) || '2K';
  }
  return '';
}
export function isImageSizeOptionDisabledForProviderModel({
  model: model2,
  provider: provider = '',
  imageSize: imageSize = '',
} = {}) {
  const imageSizeValue3 = normalizeImageSizeValue(imageSize),
    { policy: policy5 } = getImageSizePolicy(model2, provider),
    grsaiNanoBananaSelection2 = getGrsaiNanoBananaSelection(model2, provider, imageSizeValue3 || '2K');
  if (grsaiNanoBananaSelection2) {
    const imageSizeValue4 = normalizeImageSizeValue(policy5?.fixedSize);
    if (imageSizeValue4) return imageSizeValue3 !== imageSizeValue4;
    return imageSizeValue3 === '4K' && policy5?.allow4KSelection !== true;
  }
  if (isRhQwenImageEditModel(model2) && imageSizeValue3 === '4K') return true;
  const list9 = normalizePolicySizes(policy5?.disabledSizes);
  return list9.includes(imageSizeValue3);
}
export function isGrsaiModelWithoutImageSizeParam(output) {
  const { context: context4, policy: policy6 } = getImageSizePolicy(output);
  return context4.provider === 'grsai' && policy6?.omitRequestParam === true;
}
export function shouldOmitImageSizeParam(value2) {
  return getImageSizePolicy(value2).policy?.omitRequestParam === true;
}
export function shouldDisableImageSizeControl(value3, value4 = '') {
  const providerId2 = normalizeProviderId(value4);
  if (providerId2 === 'grsai' && isGrsaiModelWithoutImageSizeParam(value3)) return false;
  return shouldOmitImageSizeParam(value3);
}
export function shouldHideImageSizeInMainRatioLabel(value5, value6 = '') {
  if (isRhQwenImageEditModel(value5)) return false;
  const providerId3 = normalizeProviderId(value6),
    { context: context5, policy: policy7 } = getImageSizePolicy(value5, value6),
    value7 =
      providerId3 === 'runninghubwf' ||
      context5.executionManifest?.adapterType === 'workflow' ||
      isWorkflowModel(value5, providerId3),
    value8 = providerId3 === 'grsai' && context5.provider === 'grsai' && policy7?.omitRequestParam === true;
  if (value7) return true;
  if (value8) return false;
  return policy7?.hideInMainRatioLabel === true || policy7?.omitRequestParam === true;
}
export function buildMainImageRatioLabel({
  model: model3,
  provider: provider = '',
  aspectRatio: aspectRatio = '自适应',
  imageSize: imageSize = '',
} = {}) {
  const value9 = String(aspectRatio || '自适应').trim() || '自适应',
    { context: context6, policy: policy8 } = getImageSizePolicy(model3, provider),
    value10 =
      context6.provider === 'grsai' && policy8?.omitRequestParam === true
        ? normalizeImageSizeValue(policy8?.defaultLabelSize) || '1K'
        : '2K',
    imageSizeForProviderModel = normalizeImageSizeForProviderModel({
      model: model3,
      provider: provider,
      imageSize: imageSize,
    }),
    value11 =
      imageSizeForProviderModel ||
      String(imageSize || value10)
        .trim()
        .toUpperCase() ||
      value10;
  if (shouldHideImageSizeInMainRatioLabel(model3, provider)) return value9;
  return value9 + ' · ' + value11;
}
