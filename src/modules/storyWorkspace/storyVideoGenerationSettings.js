import {
  resolveModelExecution,
  resolveModelProvider,
  sanitizeModelUiSchemaParams,
} from '../../manifests/index.js';
import { getFixedInputSlotConfigFromManifest, shouldHideFixedInputSlots } from '../fixedInputAssetRefs.js';
import { resolveModelProviderProfileId } from '../modelProviderProfileSelection.js';
import { normalizeStoryAspectRatio } from './storyProjectPlanning.js';
import { normalizeStoryPromptMode, resolveStoryPromptModeDefaultVideoModelId } from './storyPromptModes.js';
import { isStoryWorkspaceModelVisible, resolveStoryWorkspaceModelId } from './storyWorkspaceModelCatalog.js';
const STORY_VIDEO_REFERENCE_DEFAULT_MODE_FIELDS = Object.freeze({
  'apimart/wan3.0': 'generation_type',
  'apimart/minimax-h3': 'apimart_minimax_h3_mode',
  'minimax/hailuo-h3': 'minimax_h3_mode',
  'runninghub-model/hailuo-h3': 'rh_hailuo_h3_mode',
  'runninghub/2084286867645755393': 'rh_hailuo_h3_mode',
});
function normalizeText(value) {
  return String(value || '').trim();
}
export function resolveStoryVideoProvider(item, key = '') {
  return (
    resolveModelProvider(item, '', { allowProviderHint: false, allowPrefixInference: false }) ||
    resolveModelProvider(item, key)
  );
}
export function resolveStoryPromptModeForVideoModel(index, result = 'seedance-2.0') {
  const modelExecution = resolveModelExecution(index);
  return normalizeStoryPromptMode(
    modelExecution?.modelManifest?.extensions?.storyWorkspace?.promptMode || result,
    { allowDeveloperModes: true },
  );
}
export function syncStoryPromptModeForVideoModel(
  options = {},
  data = options?.models?.video,
  target = null,
) {
  const rememberStoryEpisodeVideoModelSelection2 = rememberStoryEpisodeVideoModelSelection(target, data),
    enabled = options?.data?.project;
  if (!enabled || typeof enabled !== 'object') return rememberStoryEpisodeVideoModelSelection2;
  const storyPromptMode = normalizeStoryPromptMode(enabled?.planning?.promptMode, {
      allowDeveloperModes: true,
    }),
    promptMode = resolveStoryPromptModeForVideoModel(data, storyPromptMode);
  if (promptMode === storyPromptMode) return rememberStoryEpisodeVideoModelSelection2;
  return ((enabled.planning = { ...(enabled.planning || {}), promptMode: promptMode }), true);
}
function getStoryVideoDurationSchemaField(source) {
  const modelExecution2 = resolveModelExecution(source),
    list = Array.isArray(modelExecution2?.modelManifest?.uiSchema?.fields)
      ? modelExecution2.modelManifest.uiSchema.fields
      : [];
  return list.find((next) => normalizeText(next?.id) === 'duration') || null;
}
function normalizeDurationSeconds(current) {
  const entry = String(current ?? '').match(/\d+(?:\.\d+)?/),
    count = Number(entry?.[0]);
  return Number.isFinite(count) && count > 0 ? Number(count.toFixed(1)) : 0;
}
export function resolveStoryVideoGenerationDurationSeconds(record, payload = {}) {
  const storyVideoDurationSchemaField = getStoryVideoDurationSchemaField(record);
  if (!storyVideoDurationSchemaField?.id) return 0;
  const storyVideoGenerationParams = normalizeStoryVideoGenerationParams(record, payload);
  return normalizeDurationSeconds(storyVideoGenerationParams[storyVideoDurationSchemaField.id]);
}
export function applyStoryVideoGenerationDurationSeconds(handle, state = {}, config = 0) {
  const storyVideoDurationSchemaField2 = getStoryVideoDurationSchemaField(handle),
    args = normalizeStoryVideoGenerationParams(handle, state),
    durationSeconds = normalizeDurationSeconds(config);
  if (!storyVideoDurationSchemaField2?.id || !durationSeconds) return args;
  const count2 = Number(resolveStoryVideoClipDurationConstraints(handle)?.maxSeconds) || 0,
    scope = count2 > 0 ? Math.min(durationSeconds, count2) : durationSeconds;
  return normalizeStoryVideoGenerationParams(handle, {
    ...args,
    [storyVideoDurationSchemaField2.id]: scope,
  });
}
export function getStoryClipVideoGenerationDurationOverride(options2 = {}) {
  return normalizeDurationSeconds(options2?.videoGenerationDurationSec);
}
export function resolveStoryVideoInitialGenerationDurationSeconds(input, output = 0) {
  const storyVideoDurationSchemaField3 = getStoryVideoDurationSchemaField(input),
    durationSeconds2 = normalizeDurationSeconds(output);
  if (!storyVideoDurationSchemaField3?.id || !durationSeconds2) return 0;
  const storyVideoClipDurationConstraints = resolveStoryVideoClipDurationConstraints(input),
    list2 = Array.isArray(storyVideoClipDurationConstraints?.allowedSeconds)
      ? storyVideoClipDurationConstraints.allowedSeconds
      : [];
  if (list2.length)
    return list2.find((value2) => value2 >= durationSeconds2) || list2.at(-1) || 0;
  const value3 = Number(storyVideoClipDurationConstraints?.minSeconds) || 0,
    count3 = Number(storyVideoClipDurationConstraints?.maxSeconds) || 0,
    count4 = Number(storyVideoClipDurationConstraints?.stepSeconds) || 0;
  let value4 = Math.max(value3, durationSeconds2);
  if (count4 > 0) {
    const value5 = value3 || 0;
    value4 = value5 + Math.ceil((value4 - value5 - 1e-9) / count4) * count4;
  }
  if (count3 > 0) value4 = Math.min(value4, count3);
  return normalizeDurationSeconds(value4);
}
export function initializeStoryClipVideoGenerationDuration(enabled2, value6) {
  if (!enabled2 || typeof enabled2 !== 'object') return false;
  if (getStoryClipVideoGenerationDurationOverride(enabled2)) return false;
  const durationSeconds3 = normalizeDurationSeconds(
      enabled2.durationSec || enabled2.durationSeconds || enabled2.duration,
    ),
    storyVideoInitialGenerationDurationSeconds = resolveStoryVideoInitialGenerationDurationSeconds(
      value6,
      durationSeconds3,
    );
  if (!storyVideoInitialGenerationDurationSeconds) return false;
  return ((enabled2.videoGenerationDurationSec = storyVideoInitialGenerationDurationSeconds), true);
}
export function initializeStoryEpisodeVideoGenerationDurations(enabled3, value7) {
  if (!enabled3 || typeof enabled3 !== 'object') return 0;
  return (Array.isArray(enabled3.clips) ? enabled3.clips : []).reduce(
    (value8, value9) => value8 + Number(initializeStoryClipVideoGenerationDuration(value9, value7)),
    0,
  );
}
export function setStoryClipVideoGenerationDurationOverride(enabled4, value10) {
  if (!enabled4 || typeof enabled4 !== 'object') return false;
  const durationSeconds4 = normalizeDurationSeconds(value10),
    storyClipVideoGenerationDurationOverride = getStoryClipVideoGenerationDurationOverride(enabled4);
  return (
    !durationSeconds4
      ? delete enabled4.videoGenerationDurationSec
      : (enabled4.videoGenerationDurationSec = durationSeconds4),
    storyClipVideoGenerationDurationOverride !== getStoryClipVideoGenerationDurationOverride(enabled4)
  );
}
export function resolveStoryClipVideoGenerationParams(value11, value12, value13 = {}) {
  const storyClipVideoGenerationDurationOverride2 = getStoryClipVideoGenerationDurationOverride(value11);
  return storyClipVideoGenerationDurationOverride2
    ? applyStoryVideoGenerationDurationSeconds(value12, value13, storyClipVideoGenerationDurationOverride2)
    : normalizeStoryVideoGenerationParams(value12, value13);
}
export function resolveStoryClipVideoGenerationDurationSeconds(value14, value15, value16 = {}) {
  return (
    resolveStoryVideoGenerationDurationSeconds(
      value15,
      resolveStoryClipVideoGenerationParams(value14, value15, value16),
    ) ||
    normalizeDurationSeconds(
      value14?.durationSec || value14?.durationSeconds || value14?.duration,
    )
  );
}
export function formatStoryClipVideoGenerationDuration(value17, value18, value19 = {}) {
  const storyClipVideoGenerationDurationSeconds = resolveStoryClipVideoGenerationDurationSeconds(
    value17,
    value18,
    value19,
  );
  return storyClipVideoGenerationDurationSeconds
    ? storyClipVideoGenerationDurationSeconds.toFixed(1) + 's'
    : '--';
}
export function reconcileStoryClipVideoGenerationDurationChange({
  clip: clip2,
  previousModelId: previousModelId = '',
  modelId: modelId = previousModelId,
  previousGenerationParams: previousGenerationParams = {},
  nextGenerationParams: nextGenerationParams = {},
  generationParamsChanged: generationParamsChanged = false,
  modelChanged: modelChanged = false,
} = {}) {
  const storyVideoGenerationParams2 = normalizeStoryVideoGenerationParams(
    previousModelId,
    previousGenerationParams,
  );
  let generationParams = normalizeStoryVideoGenerationParams(modelId, nextGenerationParams);
  if (!clip2 || modelChanged)
    return { generationParams: generationParams, durationChanged: false, overrideChanged: false };
  const storyVideoGenerationDurationSeconds = resolveStoryVideoGenerationDurationSeconds(
      previousModelId,
      storyVideoGenerationParams2,
    ),
    storyClipVideoGenerationDurationSeconds2 = resolveStoryClipVideoGenerationDurationSeconds(
      clip2,
      previousModelId,
      storyVideoGenerationParams2,
    ),
    storyVideoGenerationDurationSeconds2 = resolveStoryVideoGenerationDurationSeconds(
      modelId,
      generationParams,
    ),
    value20 = Boolean(getStoryClipVideoGenerationDurationOverride(clip2)),
    durationChanged =
      Boolean(generationParamsChanged) &&
      storyVideoGenerationDurationSeconds2 > 0 &&
      storyVideoGenerationDurationSeconds2 !== storyClipVideoGenerationDurationSeconds2,
    overrideChanged = durationChanged
      ? setStoryClipVideoGenerationDurationOverride(clip2, storyVideoGenerationDurationSeconds2)
      : false;
  return (
    storyVideoGenerationDurationSeconds > 0 &&
      (durationChanged || value20 || getStoryClipVideoGenerationDurationOverride(clip2)) &&
      (generationParams = applyStoryVideoGenerationDurationSeconds(
        modelId,
        generationParams,
        storyVideoGenerationDurationSeconds,
      )),
    { generationParams: generationParams, durationChanged: durationChanged, overrideChanged: overrideChanged }
  );
}
function getStoryVideoAspectRatioSchemaField(value21) {
  const modelExecution3 = resolveModelExecution(value21),
    list3 = Array.isArray(modelExecution3?.modelManifest?.uiSchema?.fields)
      ? modelExecution3.modelManifest.uiSchema.fields
      : [];
  return (
    list3.find(
      (value22) =>
        normalizeText(value22?.id) === 'aspectRatio' ||
        normalizeText(value22?.displayRole) === 'aspectRatio',
    ) || null
  );
}
function getStoryVideoSchemaOptionValues(value23) {
  return (Array.isArray(value23?.options) ? value23.options : [])
    .map((el) => normalizeText(el && typeof el === 'object' ? el.value : el))
    .filter(Boolean);
}
export function resolveStoryVideoClipDurationConstraints(value24) {
  const storyVideoDurationSchemaField4 = getStoryVideoDurationSchemaField(value24);
  if (!storyVideoDurationSchemaField4) return null;
  const allowedSeconds = [
      ...new Set(
        (Array.isArray(storyVideoDurationSchemaField4.options)
          ? storyVideoDurationSchemaField4.options
          : [])
          .map((el2) => Number(el2 && typeof el2 === 'object' ? el2.value : el2))
          .filter((count5) => Number.isFinite(count5) && count5 > 0),
      ),
    ].sort((value25, value26) => value25 - value26),
    count6 = Number(storyVideoDurationSchemaField4.min),
    count7 = Number(storyVideoDurationSchemaField4.max),
    count8 = Number(storyVideoDurationSchemaField4.step),
    value27 = {
      minSeconds: Number.isFinite(count6) && count6 > 0 ? count6 : allowedSeconds[0] || 0,
      maxSeconds: Number.isFinite(count7) && count7 > 0 ? count7 : allowedSeconds.at(-1) || 0,
      stepSeconds: Number.isFinite(count8) && count8 > 0 ? count8 : 0,
      allowedSeconds: allowedSeconds,
    };
  return value27.minSeconds || value27.maxSeconds || value27.allowedSeconds.length
    ? value27
    : null;
}
export function getStoryVideoFixedInputVisibilityKey(model, providerHint = '', generationParams2 = {}) {
  const manifest = resolveModelExecution(model, { providerHint: providerHint }),
    fixedInputSlotConfigFromManifest = getFixedInputSlotConfigFromManifest(
      { model: model, provider: providerHint, generationParams: generationParams2 },
      { manifest: manifest?.modelManifest || null },
    );
  if (shouldHideFixedInputSlots(fixedInputSlotConfigFromManifest)) return '';
  return normalizeText(fixedInputSlotConfigFromManifest?.visibilityLayoutKey);
}
export function applyStoryVideoInitialModeDefault(value28, value29 = {}) {
  const args2 = getStoryVideoInitialGenerationDefaults(value28);
  if (!Object.keys(args2).length) return value29;
  return { ...(value29 && typeof value29 === 'object' ? value29 : {}), ...args2 };
}
function getStoryVideoInitialGenerationDefaults(value30) {
  const value31 = STORY_VIDEO_REFERENCE_DEFAULT_MODE_FIELDS[value30],
    modelExecution4 = resolveModelExecution(value30),
    value32 =
      modelExecution4?.modelManifest?.extensions?.storyWorkspace?.defaultGenerationParams;
  return {
    ...(value31 ? { [value31]: 'reference' } : {}),
    ...(value32 && typeof value32 === 'object' && !Array.isArray(value32) ? value32 : {}),
  };
}
export function normalizeStoryVideoGenerationParams(value33, value34 = {}) {
  const args3 = value34 && typeof value34 === 'object' ? value34 : {},
    args4 = getStoryVideoInitialGenerationDefaults(value33),
    value35 = Object.keys(args4).some((value36) => !Object.hasOwn(args3, value36))
      ? { ...args4, ...args3 }
      : args3;
  return sanitizeModelUiSchemaParams(value33, value35, { includeDefaults: true });
}
export function applyStoryAspectRatioToVideoGenerationParams(value37, value38 = {}, value39 = '16:9') {
  const storyVideoAspectRatioSchemaField = getStoryVideoAspectRatioSchemaField(value37),
    args5 = normalizeStoryVideoGenerationParams(value37, value38);
  if (!storyVideoAspectRatioSchemaField?.id) return args5;
  const storyAspectRatio = normalizeStoryAspectRatio(value39),
    list4 = getStoryVideoSchemaOptionValues(storyVideoAspectRatioSchemaField);
  if (list4.length && !list4.includes(storyAspectRatio)) return args5;
  return normalizeStoryVideoGenerationParams(value37, {
    ...args5,
    [storyVideoAspectRatioSchemaField.id]: storyAspectRatio,
  });
}
export function seedStoryAspectRatioInVideoGenerationParams(value40, value41 = {}, value42 = '16:9') {
  const storyVideoAspectRatioSchemaField2 = getStoryVideoAspectRatioSchemaField(value40),
    storyVideoGenerationParams3 = normalizeStoryVideoGenerationParams(value40, value41);
  if (!storyVideoAspectRatioSchemaField2?.id) return storyVideoGenerationParams3;
  const text = normalizeText(value41?.[storyVideoAspectRatioSchemaField2.id]),
    list5 = getStoryVideoSchemaOptionValues(storyVideoAspectRatioSchemaField2);
  if (text && (!list5.length || list5.includes(text))) return storyVideoGenerationParams3;
  return applyStoryAspectRatioToVideoGenerationParams(value40, storyVideoGenerationParams3, value42);
}
export function recoverUnavailableStoryVideoModelState(
  providerProfileIdByModel = {},
  { clip: clip = null } = {},
) {
  const text2 = normalizeText(providerProfileIdByModel.models?.video),
    providerHint2 = normalizeText(providerProfileIdByModel.videoProvider),
    modelExecution5 =
      resolveModelExecution(text2) || resolveModelExecution(text2, { providerHint: providerHint2 });
  if (
    modelExecution5?.modelManifest?.kind === 'video' &&
    modelExecution5?.executionManifest?.kind === 'video' &&
    isStoryWorkspaceModelVisible('video', modelExecution5.modelManifest)
  ) {
    const text3 = normalizeText(modelExecution5.modelManifest.provider);
    if (text3 && text3 !== providerHint2) return ((providerProfileIdByModel.videoProvider = text3), true);
    return false;
  }
  const video = resolveStoryWorkspaceModelId('video'),
    modelExecution6 = resolveModelExecution(video);
  if (
    !video ||
    modelExecution6?.modelManifest?.kind !== 'video' ||
    modelExecution6?.executionManifest?.kind !== 'video'
  )
    return false;
  const args6 =
      providerProfileIdByModel.videoGenerationParamsByModel &&
      typeof providerProfileIdByModel.videoGenerationParamsByModel === 'object'
        ? providerProfileIdByModel.videoGenerationParamsByModel
        : {},
    value43 = args6[video] && typeof args6[video] === 'object' ? args6[video] : {},
    args7 = normalizeStoryVideoGenerationParams(
      video,
      seedStoryAspectRatioInVideoGenerationParams(
        video,
        value43,
        providerProfileIdByModel.data?.project?.aspectRatio,
      ),
      { clip: clip },
    );
  return (
    (providerProfileIdByModel.models = { ...(providerProfileIdByModel.models || {}), video: video }),
    (providerProfileIdByModel.videoProvider = normalizeText(modelExecution6.modelManifest.provider)),
    (providerProfileIdByModel.videoProviderProfileId = resolveModelProviderProfileId({
      model: video,
      providerProfileId: '',
      providerProfileIdByModel: providerProfileIdByModel.videoProviderProfileIdByModel,
    })),
    (providerProfileIdByModel.videoGenerationParams = args7),
    (providerProfileIdByModel.videoGenerationParamsByModel = { ...args6, [video]: { ...args7 } }),
    true
  );
}
export function applyStoryPromptModeVideoModelDefault(options3 = {}, value44 = 'seedance-2.0') {
  const storyPromptModeDefaultVideoModelId = resolveStoryPromptModeDefaultVideoModelId(value44);
  return applyStoryVideoModelDefault(options3, storyPromptModeDefaultVideoModelId);
}
export function applyStoryVideoModelDefault(providerProfileIdByModel2 = {}, value45 = '') {
  if (!normalizeText(value45)) return false;
  const video2 = resolveStoryWorkspaceModelId('video', value45);
  if (!video2 || video2 !== value45) return false;
  const modelExecution7 = resolveModelExecution(video2);
  if (
    modelExecution7?.modelManifest?.kind !== 'video' ||
    modelExecution7?.executionManifest?.kind !== 'video'
  )
    return false;
  const args8 =
      providerProfileIdByModel2.videoGenerationParamsByModel &&
      typeof providerProfileIdByModel2.videoGenerationParamsByModel === 'object'
        ? providerProfileIdByModel2.videoGenerationParamsByModel
        : {},
    value46 = args8[video2] && typeof args8[video2] === 'object' ? args8[video2] : {},
    args9 = applyStoryAspectRatioToVideoGenerationParams(
      video2,
      normalizeStoryVideoGenerationParams(video2, value46),
      providerProfileIdByModel2.data?.project?.aspectRatio,
    );
  return (
    (providerProfileIdByModel2.models = { ...(providerProfileIdByModel2.models || {}), video: video2 }),
    (providerProfileIdByModel2.videoProvider = resolveStoryVideoProvider(video2)),
    (providerProfileIdByModel2.videoProviderProfileId = resolveModelProviderProfileId({
      model: video2,
      providerProfileId: '',
      providerProfileIdByModel: providerProfileIdByModel2.videoProviderProfileIdByModel,
    })),
    (providerProfileIdByModel2.videoGenerationParams = args9),
    (providerProfileIdByModel2.videoGenerationParamsByModel = { ...args8, [video2]: { ...args9 } }),
    true
  );
}
export function applyStoryEpisodeVideoModelDefault(options4 = {}, value47 = {}) {
  const text4 =
    normalizeText(value47?.videoModelId) ||
    resolveStoryPromptModeDefaultVideoModelId(value47?.promptMode);
  return applyStoryVideoModelDefault(options4, text4);
}
export function rememberStoryEpisodeVideoModelSelection(enabled5 = {}, value48 = '') {
  if (!enabled5 || typeof enabled5 !== 'object' || Array.isArray(enabled5)) return false;
  const text5 = normalizeText(value48);
  if (
    !text5 ||
    resolveStoryWorkspaceModelId('video', text5) !== text5 ||
    normalizeText(enabled5.videoModelId) === text5
  )
    return false;
  return ((enabled5.videoModelId = text5), true);
}
export function resolveStoryClipVideoGenerationSettings(
  value49,
  value50 = {},
  { fallbackModelId: fallbackModelId = '', fallbackProvider: fallbackProvider = '' } = {},
) {
  const providerProfileId = value50.modelSettings || {},
    value51 = providerProfileId.models?.video || fallbackModelId,
    model2 = resolveStoryWorkspaceModelId('video', value51),
    provider = resolveStoryVideoProvider(model2, providerProfileId.videoProvider || fallbackProvider),
    value52 = providerProfileId.videoGenerationParamsByModel?.[model2],
    value53 = providerProfileId.videoGenerationParams,
    value54 =
      value53 && typeof value53 === 'object' && Object.keys(value53).length ? value53 : value52 || {},
    generationParams3 = resolveStoryClipVideoGenerationParams(
      value49,
      model2,
      seedStoryAspectRatioInVideoGenerationParams(
        model2,
        value54,
        value50.data?.project?.aspectRatio,
      ),
    ),
    providerProfileId2 = resolveModelProviderProfileId({
      model: model2,
      providerProfileId: providerProfileId.videoProviderProfileId,
      providerProfileIdByModel: providerProfileId.videoProviderProfileIdByModel,
    });
  return {
    modelId: model2,
    provider: provider,
    providerProfileId: providerProfileId2,
    generationParams: generationParams3,
  };
}
