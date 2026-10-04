import {
  DREAMINA_VIDEO_ALLOWED_RATIOS,
  ensureDreaminaStyleVideoModelForTask,
  isDreaminaVideoRouteModeEnabled,
  normalizeDreaminaStyleVideoDuration,
  normalizeDreaminaStyleVideoResolution,
  normalizeDreaminaVideoAspectRatio,
  normalizeDreaminaVideoRouteMode,
  resolveDreaminaStyleVideoCounterpartModel,
  resolveDreaminaStyleVideoProvider,
  resolveDreaminaVideoTaskType,
  isDreaminaStyleVideoTaskModelSupported,
} from '../../modules/dreaminaVideoModelHelper.js';
import { getPlainGenerationParams } from './runningHubVideoUiSchema.js';
export const DREAMINA_VIDEO_PARAM_FIELD_IDS = new Set([
  'dreaminaRouteMode',
  'aspectRatio',
  'resolution',
  'duration',
]);
const DREAMINA_ROUTE_MODEL_MEMORY_FIELD = 'dreaminaModelByRouteMode';
function hasOwnParam(value, item) {
  return Object.prototype.hasOwnProperty.call(value || {}, item);
}
export function getDreaminaEffectiveNodeData(options = {}) {
  const args = options && typeof options === 'object' ? options : {},
    args2 = getPlainGenerationParams(args.generationParams),
    key = { ...args };
  DREAMINA_VIDEO_PARAM_FIELD_IDS.forEach((item2) => {
    hasOwnParam(args2, item2) && (key[item2] = args2[item2]);
  });
  const dreaminaVideoRouteMode = normalizeDreaminaVideoRouteMode(key.dreaminaRouteMode, key.mode);
  if (dreaminaVideoRouteMode) key.dreaminaRouteMode = dreaminaVideoRouteMode;
  hasOwnParam(args2, 'resolution') && (key.videoSize = args2.resolution);
  const index = { ...args2 };
  !hasOwnParam(index, 'dreaminaRouteMode') &&
    dreaminaVideoRouteMode &&
    (index.dreaminaRouteMode = dreaminaVideoRouteMode);
  !hasOwnParam(index, 'aspectRatio') && (index.aspectRatio = key.aspectRatio || '自适应');
  if (!hasOwnParam(index, 'resolution')) {
    const result = key.resolution || key.videoSize;
    if (result) index.resolution = result;
  }
  return (
    !hasOwnParam(index, 'duration') && key.duration !== undefined && (index.duration = key.duration),
    (key.generationParams = index),
    key
  );
}
export function buildDreaminaParamPatch(options2 = {}, data = {}) {
  const generationParams = getPlainGenerationParams(options2?.generationParams);
  Object.entries(data || {}).forEach(([target, source]) => {
    if (!DREAMINA_VIDEO_PARAM_FIELD_IDS.has(target)) return;
    generationParams[target] = source;
  });
  const next = { generationParams: generationParams },
    current = String(options2?.model || '').trim();
  return (
    current &&
      (next.generationParamsByModel = {
        ...getPlainGenerationParams(options2?.generationParamsByModel),
        [current]: generationParams,
      }),
    next
  );
}
function buildDreaminaModelParamSnapshot(options3 = {}) {
  const dreaminaEffectiveNodeData = getDreaminaEffectiveNodeData(options3),
    args3 = getPlainGenerationParams(dreaminaEffectiveNodeData?.generationParams),
    entry = { ...args3 };
  return (
    DREAMINA_VIDEO_PARAM_FIELD_IDS.forEach((item3) => {
      if (entry[item3] !== undefined) return;
      dreaminaEffectiveNodeData?.[item3] !== undefined && (entry[item3] = dreaminaEffectiveNodeData[item3]);
    }),
    entry.resolution === undefined &&
      dreaminaEffectiveNodeData?.videoSize !== undefined &&
      (entry.resolution = dreaminaEffectiveNodeData.videoSize),
    entry[DREAMINA_ROUTE_MODEL_MEMORY_FIELD] === undefined &&
      dreaminaEffectiveNodeData?.[DREAMINA_ROUTE_MODEL_MEMORY_FIELD] !== undefined &&
      (entry[DREAMINA_ROUTE_MODEL_MEMORY_FIELD] = getPlainGenerationParams(
        dreaminaEffectiveNodeData[DREAMINA_ROUTE_MODEL_MEMORY_FIELD],
      )),
    entry.dreaminaRouteMode !== undefined &&
      (entry.dreaminaRouteMode = normalizeDreaminaVideoRouteMode(
        entry.dreaminaRouteMode,
        dreaminaEffectiveNodeData?.mode,
      )),
    entry
  );
}
function getDreaminaRouteModelMemory(options4 = {}) {
  const plainGenerationParams = getPlainGenerationParams(options4?.generationParams),
    plainGenerationParams2 = getPlainGenerationParams(options4?.generationParamsByModel),
    args4 = {};
  return (
    Object.values(plainGenerationParams2).forEach((item4) => {
      Object.assign(args4, getPlainGenerationParams(item4?.[DREAMINA_ROUTE_MODEL_MEMORY_FIELD]));
    }),
    {
      ...args4,
      ...getPlainGenerationParams(plainGenerationParams[DREAMINA_ROUTE_MODEL_MEMORY_FIELD]),
      ...getPlainGenerationParams(options4?.[DREAMINA_ROUTE_MODEL_MEMORY_FIELD]),
    }
  );
}
function getDreaminaRouteModelMemoryKey(record, payload) {
  const handle = String(record || 'dreamina')
      .trim()
      .toLowerCase(),
    dreaminaVideoRouteMode2 = normalizeDreaminaVideoRouteMode(payload);
  return handle + ':' + dreaminaVideoRouteMode2;
}
function rememberDreaminaRouteModel(state, config, scope, input) {
  const output = state && typeof state === 'object' ? state : {},
    enabled = String(input || '').trim();
  if (!enabled) return output;
  return ((output[getDreaminaRouteModelMemoryKey(config, scope)] = enabled), output);
}
function getRememberedDreaminaRouteModel(value2, value3, value4) {
  const value5 = value2?.[getDreaminaRouteModelMemoryKey(value3, value4)];
  return String(value5 || '').trim();
}
function ensureSupportedRouteModel(value6, value7, value8) {
  const enabled2 = String(value7 || '').trim();
  if (!enabled2) return '';
  if (!isDreaminaStyleVideoTaskModelSupported(value6, enabled2, value8)) return '';
  return ensureDreaminaStyleVideoModelForTask(value6, enabled2, value8);
}
function getSavedDreaminaProviderRouteModel(
  options5 = {},
  { provider: provider, routeMode: routeMode, taskType: taskType, fallbackModel: fallbackModel } = {},
) {
  const plainGenerationParams3 = getPlainGenerationParams(options5?.generationParamsByModel),
    list = [];
  Object.entries(plainGenerationParams3).forEach(([value9, value10]) => {
    const enabled3 = String(value9 || '').trim();
    if (!enabled3) return;
    const dreaminaStyleVideoProvider = resolveDreaminaStyleVideoProvider(enabled3, provider);
    if (dreaminaStyleVideoProvider !== provider) return;
    const supportedRouteModel = ensureSupportedRouteModel(taskType, enabled3, provider);
    if (!supportedRouteModel) return;
    const dreaminaVideoRouteMode3 = normalizeDreaminaVideoRouteMode(
      value10?.dreaminaRouteMode,
      options5?.mode,
    );
    if (dreaminaVideoRouteMode3 !== routeMode) return;
    list.push(supportedRouteModel);
  });
  if (!list.length) return '';
  const supportedRouteModel2 = ensureSupportedRouteModel(taskType, fallbackModel, provider),
    value11 = list
      .slice()
      .reverse()
      .find((item5) => item5 !== supportedRouteModel2);
  return value11 || list[list.length - 1] || '';
}
export function resolveDreaminaRememberedRouteModel(
  options6 = {},
  { provider: provider2, routeMode: routeMode2, taskType: taskType2, fallbackModel: fallbackModel2 } = {},
) {
  const dreaminaEffectiveNodeData2 = getDreaminaEffectiveNodeData(options6),
    provider3 = resolveDreaminaStyleVideoProvider(
      fallbackModel2,
      provider2 || dreaminaEffectiveNodeData2?.provider,
    ),
    routeMode3 = normalizeDreaminaVideoRouteMode(
      routeMode2 || dreaminaEffectiveNodeData2?.dreaminaRouteMode,
      dreaminaEffectiveNodeData2?.mode,
    ),
    taskType3 = String(taskType2 || '').trim() || resolveDreaminaVideoTaskType({ routeMode: routeMode3 }),
    rememberedDreaminaRouteModel = getRememberedDreaminaRouteModel(
      getDreaminaRouteModelMemory(dreaminaEffectiveNodeData2),
      provider3,
      routeMode3,
    ),
    supportedRouteModel3 = ensureSupportedRouteModel(taskType3, rememberedDreaminaRouteModel, provider3);
  if (supportedRouteModel3) return supportedRouteModel3;
  const value12 = String(dreaminaEffectiveNodeData2?.model || '').trim(),
    dreaminaStyleVideoProvider2 = resolveDreaminaStyleVideoProvider(
      value12,
      dreaminaEffectiveNodeData2?.provider,
    ),
    value13 =
      dreaminaStyleVideoProvider2 === provider3
        ? ensureSupportedRouteModel(taskType3, value12, provider3)
        : '';
  if (value13) return value13;
  const savedDreaminaProviderRouteModel = getSavedDreaminaProviderRouteModel(dreaminaEffectiveNodeData2, {
    provider: provider3,
    routeMode: routeMode3,
    taskType: taskType3,
    fallbackModel: fallbackModel2,
  });
  if (savedDreaminaProviderRouteModel) return savedDreaminaProviderRouteModel;
  const dreaminaStyleVideoCounterpartModel = resolveDreaminaStyleVideoCounterpartModel(value12, provider3, {
      taskType: taskType3,
    }),
    supportedRouteModel4 = ensureSupportedRouteModel(
      taskType3,
      dreaminaStyleVideoCounterpartModel,
      provider3,
    );
  if (supportedRouteModel4) return supportedRouteModel4;
  return ensureDreaminaStyleVideoModelForTask(taskType3, fallbackModel2, provider3);
}
export function buildDreaminaModelSelectionParamPatch(
  options7 = {},
  {
    model: model,
    provider: provider4,
    taskType: taskType4,
    fallbackValues: fallbackValues = {},
    restoreTargetParams: restoreTargetParams = true,
    rememberCurrentModel: rememberCurrentModel = true,
  } = {},
) {
  const dreaminaEffectiveNodeData3 = getDreaminaEffectiveNodeData(options7),
    enabled4 = String(model || '').trim();
  if (!enabled4) return {};
  const dreaminaStyleVideoProvider3 = resolveDreaminaStyleVideoProvider(
      enabled4,
      provider4 || dreaminaEffectiveNodeData3?.provider,
    ),
    generationParamsByModel = getPlainGenerationParams(dreaminaEffectiveNodeData3?.generationParamsByModel),
    value14 = String(dreaminaEffectiveNodeData3?.model || '').trim(),
    dreaminaStyleVideoProvider4 = resolveDreaminaStyleVideoProvider(
      value14,
      dreaminaEffectiveNodeData3?.provider,
    ),
    dreaminaVideoRouteMode4 = normalizeDreaminaVideoRouteMode(
      dreaminaEffectiveNodeData3?.dreaminaRouteMode,
      dreaminaEffectiveNodeData3?.mode,
    ),
    dreaminaRouteModelMemory = getDreaminaRouteModelMemory(dreaminaEffectiveNodeData3),
    plainGenerationParams4 = getPlainGenerationParams(generationParamsByModel[enabled4]);
  Object.assign(
    dreaminaRouteModelMemory,
    getPlainGenerationParams(plainGenerationParams4[DREAMINA_ROUTE_MODEL_MEMORY_FIELD]),
  );
  value14 &&
    rememberCurrentModel &&
    (rememberDreaminaRouteModel(
      dreaminaRouteModelMemory,
      dreaminaStyleVideoProvider4,
      dreaminaVideoRouteMode4,
      value14,
    ),
    (generationParamsByModel[value14] = {
      ...buildDreaminaModelParamSnapshot(dreaminaEffectiveNodeData3),
      [DREAMINA_ROUTE_MODEL_MEMORY_FIELD]: dreaminaRouteModelMemory,
    }));
  const args5 = {
      ...buildDreaminaModelParamSnapshot(dreaminaEffectiveNodeData3),
      ...getPlainGenerationParams(fallbackValues),
    },
    args6 = restoreTargetParams ? plainGenerationParams4 : {},
    routeMode4 = normalizeDreaminaVideoRouteMode(args5.dreaminaRouteMode, dreaminaEffectiveNodeData3?.mode),
    value15 = String(taskType4 || '').trim(),
    value16 = value15 || resolveDreaminaVideoTaskType({ routeMode: routeMode4 }),
    value17 = { ...args5, ...args6, dreaminaRouteMode: routeMode4 },
    aspectRatio = normalizeDreaminaVideoAspectRatio(value17.aspectRatio, { preserveAdaptive: true }),
    dreaminaStyleVideoResolution = normalizeDreaminaStyleVideoResolution(
      value16,
      enabled4,
      value17.resolution,
      dreaminaStyleVideoProvider3,
    ),
    duration = normalizeDreaminaStyleVideoDuration(
      value16,
      enabled4,
      value17.duration,
      dreaminaStyleVideoProvider3,
    ),
    generationParams2 = {
      ...args6,
      dreaminaRouteMode: routeMode4,
      aspectRatio: aspectRatio,
      duration: duration,
      [DREAMINA_ROUTE_MODEL_MEMORY_FIELD]: dreaminaRouteModelMemory,
    };
  if (dreaminaStyleVideoResolution) generationParams2.resolution = dreaminaStyleVideoResolution;
  return (
    rememberDreaminaRouteModel(dreaminaRouteModelMemory, dreaminaStyleVideoProvider3, routeMode4, enabled4),
    (generationParamsByModel[enabled4] = generationParams2),
    {
      dreaminaRouteMode: routeMode4,
      [DREAMINA_ROUTE_MODEL_MEMORY_FIELD]: dreaminaRouteModelMemory,
      generationParams: generationParams2,
      generationParamsByModel: generationParamsByModel,
    }
  );
}
export function buildDreaminaStorePatchFromNormalization(options8 = {}, value18 = {}) {
  const args7 = getDreaminaEffectiveNodeData(options8),
    args8 = {},
    value19 = {};
  Object.entries(value18 || {}).forEach(([value20, value21]) => {
    DREAMINA_VIDEO_PARAM_FIELD_IDS.has(value20) ? (value19[value20] = value21) : (args8[value20] = value21);
  });
  const args9 = Object.keys(value19).length ? buildDreaminaParamPatch({ ...args7, ...args8 }, value19) : {};
  return { ...args8, ...args9 };
}
export function buildDreaminaRouteModeUpdate({
  nextRouteMode: nextRouteMode,
  baseNodeData: baseNodeData = {},
  incoming: incoming = [],
  nodes: nodes = {},
} = {}) {
  const routeMode5 = normalizeDreaminaVideoRouteMode(nextRouteMode),
    nodeData = getDreaminaEffectiveNodeData(baseNodeData);
  if (!routeMode5) return { nodeData: nodeData, patch: {}, edgeIdsToRemove: [] };
  if (!isDreaminaVideoRouteModeEnabled(routeMode5))
    return { disabled: true, nodeData: nodeData, patch: {}, edgeIdsToRemove: [] };
  const run = (value22) => {
      const count = Number(value22?.createdAt);
      if (Number.isFinite(count) && count > 0) return count;
      const value23 = String(value22?.id || ''),
        list2 = value23.match(/(\d{10,})/g);
      return list2 && list2.length ? Number(list2[list2.length - 1]) || 0 : 0;
    },
    imageCount = [],
    videoCount = [],
    audioCount = [],
    edgeIdsToRemove = [];
  for (const value24 of incoming || []) {
    const value25 = nodes?.[value24.sourceId],
      list3 = String(value25?.type || '').toLowerCase();
    if (list3.includes('image')) imageCount.push(value24);
    else {
      if (list3.includes('video')) videoCount.push(value24);
      else {
        if (list3.includes('audio')) audioCount.push(value24);
        else {
          if (routeMode5 === 'frames2video') edgeIdsToRemove.push(value24.id);
        }
      }
    }
  }
  if (routeMode5 === 'frames2video') {
    (videoCount.forEach((item6) => edgeIdsToRemove.push(item6.id)),
      audioCount.forEach((item7) => edgeIdsToRemove.push(item7.id)),
      imageCount.sort((item8, value26) => run(item8) - run(value26)));
    while (imageCount.length > 2) {
      const value27 = imageCount.shift();
      if (value27?.id) edgeIdsToRemove.push(value27.id);
    }
  } else {
    if (routeMode5 === 'multimodal2video') {
      (imageCount.sort((item9, value28) => run(item9) - run(value28)),
        videoCount.sort((item10, value29) => run(item10) - run(value29)),
        audioCount.sort((item11, value30) => run(item11) - run(value30)));
      while (imageCount.length > 9) {
        const value31 = imageCount.shift();
        if (value31?.id) edgeIdsToRemove.push(value31.id);
      }
      while (videoCount.length > 3) {
        const value32 = videoCount.shift();
        if (value32?.id) edgeIdsToRemove.push(value32.id);
      }
      while (audioCount.length > 3) {
        const value33 = audioCount.shift();
        if (value33?.id) edgeIdsToRemove.push(value33.id);
      }
    }
  }
  const imageCount2 = {
      imageCount: imageCount.length,
      videoCount: videoCount.length,
      audioCount: audioCount.length,
    },
    taskType5 = resolveDreaminaVideoTaskType({
      routeMode: routeMode5,
      imageCount: imageCount2.imageCount,
      videoCount: imageCount2.videoCount,
      audioCount: imageCount2.audioCount,
    }),
    provider5 = resolveDreaminaStyleVideoProvider(nodeData?.model, nodeData?.provider),
    args10 = { provider: provider5 },
    generationParamsByModel2 = getPlainGenerationParams(nodeData?.generationParamsByModel),
    dreaminaRouteModelMemory2 = getDreaminaRouteModelMemory(nodeData),
    dreaminaVideoRouteMode5 = normalizeDreaminaVideoRouteMode(nodeData?.dreaminaRouteMode, nodeData?.mode),
    value34 = String(nodeData?.model || '').trim();
  value34 &&
    (rememberDreaminaRouteModel(dreaminaRouteModelMemory2, provider5, dreaminaVideoRouteMode5, value34),
    (generationParamsByModel2[value34] = {
      ...buildDreaminaModelParamSnapshot(nodeData),
      [DREAMINA_ROUTE_MODEL_MEMORY_FIELD]: dreaminaRouteModelMemory2,
    }));
  const rememberedDreaminaRouteModel2 = getRememberedDreaminaRouteModel(
      dreaminaRouteModelMemory2,
      provider5,
      routeMode5,
    ),
    value35 =
      rememberedDreaminaRouteModel2 &&
      isDreaminaStyleVideoTaskModelSupported(taskType5, rememberedDreaminaRouteModel2, provider5)
        ? ensureDreaminaStyleVideoModelForTask(taskType5, rememberedDreaminaRouteModel2, provider5)
        : '',
    model2 = value35 || ensureDreaminaStyleVideoModelForTask(taskType5, nodeData?.model, provider5);
  if (model2) args10.model = model2;
  const dreaminaStyleVideoResolution2 = normalizeDreaminaStyleVideoResolution(
      taskType5,
      model2,
      nodeData?.resolution || nodeData?.videoSize,
      provider5,
    ),
    duration2 = normalizeDreaminaStyleVideoDuration(taskType5, model2, nodeData?.duration, provider5),
    fallbackValues2 = { dreaminaRouteMode: routeMode5, duration: duration2 };
  if (dreaminaStyleVideoResolution2) fallbackValues2.resolution = dreaminaStyleVideoResolution2;
  const args11 = buildDreaminaModelSelectionParamPatch(
      {
        ...nodeData,
        ...args10,
        generationParamsByModel: generationParamsByModel2,
        [DREAMINA_ROUTE_MODEL_MEMORY_FIELD]: dreaminaRouteModelMemory2,
      },
      {
        model: model2,
        provider: provider5,
        taskType: taskType5,
        fallbackValues: fallbackValues2,
        rememberCurrentModel: false,
      },
    ),
    patch = { ...args10, ...args11 };
  return {
    disabled: false,
    edgeIdsToRemove: edgeIdsToRemove,
    nodeData: getDreaminaEffectiveNodeData({ ...nodeData, ...patch }),
    patch: patch,
  };
}
export function buildDreaminaParamSchemaFields({
  routeMode: routeMode6,
  currentRatio: currentRatio,
  currentResolution: currentResolution,
  currentDuration: currentDuration,
  durationRange: durationRange,
  resolutionOptions: resolutionOptions,
} = {}) {
  const defaultValue = normalizeDreaminaVideoRouteMode(routeMode6),
    options9 = ['自适应', '1:1', '9:16', '16:9', '3:4', '4:3', '3:2', '2:3', '5:4', '4:5', '21:9'].map(
      (value36) => ({
        value: value36,
        label: value36,
        disabled: value36 !== '自适应' && !DREAMINA_VIDEO_ALLOWED_RATIOS.includes(value36),
      }),
    ),
    list4 = Array.isArray(resolutionOptions) ? resolutionOptions.filter(Boolean) : [],
    options10 = list4.length ? list4 : currentResolution ? [currentResolution] : ['720p'];
  return {
    mode: {
      id: 'dreaminaRouteMode',
      type: 'segmented',
      label: '模式',
      defaultValue: defaultValue || 'multimodal2video',
      variant: 'pillMenu',
      options: [
        { value: 'multimodal2video', label: '全能参考', selectedLabel: '全能参考' },
        { value: 'frames2video', label: '首尾帧', selectedLabel: '首尾帧' },
      ],
    },
    resolution: {
      id: 'resolution',
      type: 'segmented',
      label: '分辨率',
      defaultValue: currentResolution || options10[0] || '720p',
      options: options10.map((value37) => ({
        value: value37,
        label: value37,
        disabled: options10.length === 1,
      })),
    },
    aspectRatio: {
      id: 'aspectRatio',
      type: 'segmented',
      label: '比例',
      defaultValue: currentRatio || '自适应',
      options: options9,
    },
    duration: {
      id: 'duration',
      type: 'slider',
      label: '视频时长',
      defaultValue: Number(currentDuration) || Number(durationRange?.min) || 5,
      min: Number(durationRange?.min) || 4,
      max: Number(durationRange?.max) || 15,
      step: Number(durationRange?.step) || 1,
      variant: 'durationPill',
    },
  };
}
