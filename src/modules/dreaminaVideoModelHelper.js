import { getModelsByKind, normalizeProviderId, resolveModelExecution } from '../manifests/index.js';
import { translateManifestText } from '../i18n/manifestText.js';
import { t } from '../i18n/index.js';
export const DREAMINA_VIDEO_ROUTE_MODES = ['multimodal2video', 'frames2video', 'multiframe2video'];
export const DREAMINA_VIDEO_TASK_TYPES = [
  'text2video',
  'image2video',
  'frames2video',
  'multiframe2video',
  'multimodal2video',
];
export const DREAMINA_VIDEO_ALLOWED_RATIOS = ['1:1', '3:4', '16:9', '4:3', '9:16', '21:9'];
export const DREAMINA_VIDEO_ADAPTIVE_RATIO_OPTIONS = [
  { label: '1:1', w: 1, h: 1, calc: 1 / 1 },
  { label: '3:4', w: 3, h: 4, calc: 3 / 4 },
  { label: '16:9', w: 16, h: 9, calc: 16 / 9 },
  { label: '4:3', w: 4, h: 3, calc: 4 / 3 },
  { label: '9:16', w: 9, h: 16, calc: 9 / 16 },
  { label: '21:9', w: 21, h: 9, calc: 21 / 9 },
];
function getDreaminaStyleVideoExtension(value) {
  const item = value?.extensions?.dreaminaStyleVideo;
  return item && typeof item === 'object' ? item : null;
}
function getDreaminaStyleVideoCounterpartKey(key) {
  return String(getDreaminaStyleVideoExtension(key)?.counterpartKey || '').trim();
}
function normalizeStyleProvider(index) {
  const providerId = normalizeProviderId(index);
  return providerId === 'apimart' || providerId === 'dreamina' || providerId === 'volcengine'
    ? providerId
    : '';
}
function toDreaminaStyleVideoOption(model) {
  const subtitleByTaskType = getDreaminaStyleVideoExtension(model) || {};
  return Object.freeze({
    model: model.modelId,
    title: translateManifestText(subtitleByTaskType.title || model.displayName || model.modelId),
    subtitle: translateManifestText(subtitleByTaskType.subtitle || model.description || ''),
    subtitleByTaskType: subtitleByTaskType.subtitleByTaskType || Object.freeze({}),
    taskTypes: Array.isArray(subtitleByTaskType.taskTypes)
      ? Object.freeze(subtitleByTaskType.taskTypes.slice())
      : Object.freeze([]),
    order: Number(subtitleByTaskType.order || 0),
    counterpartKey: getDreaminaStyleVideoCounterpartKey(model),
    vip: model.vip === true,
  });
}
function getDreaminaStyleVideoOptions(result) {
  const styleProvider = normalizeStyleProvider(result);
  return getModelsByKind('video')
    .filter((item2) => {
      if (!getDreaminaStyleVideoExtension(item2)) return false;
      if (styleProvider && item2.provider !== styleProvider) return false;
      return true;
    })
    .sort((item3, data) => {
      const dreaminaStyleVideoExtension = getDreaminaStyleVideoExtension(item3) || {},
        dreaminaStyleVideoExtension2 = getDreaminaStyleVideoExtension(data) || {};
      return (
        (Number(dreaminaStyleVideoExtension.order || 0) || 0) -
        (Number(dreaminaStyleVideoExtension2.order || 0) || 0)
      );
    })
    .map(toDreaminaStyleVideoOption);
}
function resolveDreaminaStyleVideoManifest(options, target = '') {
  const enabled = String(options || '').trim(),
    styleProvider2 = normalizeStyleProvider(target),
    source = Array.from(new Set([styleProvider2, ''].filter(Boolean)));
  for (const providerHint of source) {
    const modelExecution = resolveModelExecution(enabled, { providerHint: providerHint }),
      enabled2 = modelExecution?.modelManifest || null;
    if (!enabled2 || !getDreaminaStyleVideoExtension(enabled2)) continue;
    if (styleProvider2 && enabled2.provider !== styleProvider2) continue;
    return enabled2;
  }
  if (!enabled) return null;
  const modelExecution2 = resolveModelExecution(enabled),
    enabled3 = modelExecution2?.modelManifest || null;
  if (!enabled3 || !getDreaminaStyleVideoExtension(enabled3)) return null;
  if (styleProvider2 && enabled3.provider !== styleProvider2) return null;
  return enabled3;
}
function getDefaultDreaminaStyleVideoModel(next, current) {
  const styleProvider3 = normalizeStyleProvider(current) || 'dreamina',
    entry = String(next || '').trim(),
    list = getDreaminaStyleVideoOptions(styleProvider3),
    record = list.find((item4) => {
      const dreaminaStyleVideoManifest = resolveDreaminaStyleVideoManifest(item4.model, styleProvider3),
        list2 = getDreaminaStyleVideoExtension(dreaminaStyleVideoManifest)?.defaultForTaskTypes || [];
      return Array.isArray(list2) && list2.includes(entry);
    });
  if (record) return record.model;
  const payload = list.find((item5) => item5.taskTypes.includes(entry));
  return payload?.model || '';
}
export const APIMART_DREAMINA_VIDEO_DEFAULT_MODEL = getDefaultDreaminaStyleVideoModel(
  'text2video',
  'apimart',
);
export const APIMART_DREAMINA_VIDEO_MODEL_OPTIONS = Object.freeze(getDreaminaStyleVideoOptions('apimart'));
export const VOLCENGINE_DREAMINA_VIDEO_MODEL_OPTIONS = Object.freeze(
  getDreaminaStyleVideoOptions('volcengine'),
);
export const DREAMINA_VIDEO_MODEL_OPTIONS = Object.freeze(getDreaminaStyleVideoOptions('dreamina'));
const IMAGE_ROUTE_EXTRA_MODELS = DREAMINA_VIDEO_MODEL_OPTIONS.filter((item6) =>
    item6.taskTypes.includes('image2video'),
  ),
  FRAMES_ROUTE_EXTRA_MODELS = DREAMINA_VIDEO_MODEL_OPTIONS.filter((item7) =>
    item7.taskTypes.includes('frames2video'),
  ),
  DREAMINA_VIDEO_MODEL_META = new Map(DREAMINA_VIDEO_MODEL_OPTIONS.map((item8) => [item8.model, item8])),
  APIMART_DREAMINA_VIDEO_MODEL_META = new Map(
    APIMART_DREAMINA_VIDEO_MODEL_OPTIONS.map((item9) => [item9.model, item9]),
  ),
  VOLCENGINE_DREAMINA_VIDEO_MODEL_META = new Map(
    VOLCENGINE_DREAMINA_VIDEO_MODEL_OPTIONS.map((item10) => [item10.model, item10]),
  ),
  DREAMINA_ROUTE_LABEL_KEYS = {
    multimodal2video: 'route.multimodal2video',
    frames2video: 'route.frames2video',
    multiframe2video: 'route.multiframe2video',
  },
  DREAMINA_TASK_LABEL_KEYS = {
    text2video: 'task.text2video',
    image2video: 'task.image2video',
    frames2video: 'task.frames2video',
    multiframe2video: 'task.multiframe2video',
    multimodal2video: 'task.multimodal2video',
  },
  DREAMINA_MODE_DISABLED_MAP = { multimodal2video: false, frames2video: false, multiframe2video: true };
function pickFirstNonEmpty(...args) {
  for (const handle of args) {
    const state = String(handle || '').trim();
    if (state) return state;
  }
  return '';
}
function pickCanonicalOptionValue(list3, config, scope) {
  if (!Array.isArray(list3) || list3.length === 0) return '';
  const firstNonEmpty = pickFirstNonEmpty(config, scope, list3[0]),
    input = firstNonEmpty.toLowerCase(),
    output = list3.find(
      (item11) =>
        String(item11 || '')
          .trim()
          .toLowerCase() === input,
    );
  return output || list3[0];
}
function dreaminaVideoText(value2, value3 = {}) {
  return t('dreaminaVideo.' + value2, value3);
}
export function isDreaminaVideoModel(value4, value5) {
  const styleProvider4 = normalizeStyleProvider(value5);
  if (styleProvider4 === 'dreamina') return true;
  return resolveDreaminaStyleVideoManifest(value4, 'dreamina') !== null;
}
export function isApimartDreaminaVideoModel(value6, value7) {
  const styleProvider5 = normalizeStyleProvider(value7);
  if (styleProvider5 === 'apimart' && !String(value6 || '').trim()) return true;
  return resolveDreaminaStyleVideoManifest(value6, 'apimart') !== null;
}
export function isDreaminaStyleVideoModel(value8, value9) {
  return (
    isDreaminaVideoModel(value8, value9) ||
    isApimartDreaminaVideoModel(value8, value9) ||
    resolveDreaminaStyleVideoManifest(value8, 'volcengine') !== null ||
    (normalizeStyleProvider(value9) === 'volcengine' &&
      resolveDreaminaStyleVideoManifest(value8, 'volcengine') !== null)
  );
}
export function resolveDreaminaStyleVideoProvider(value10, value11) {
  const styleProvider6 = normalizeStyleProvider(value11);
  if (styleProvider6) return styleProvider6;
  const dreaminaStyleVideoManifest2 = resolveDreaminaStyleVideoManifest(value10);
  return normalizeStyleProvider(dreaminaStyleVideoManifest2?.provider) || 'dreamina';
}
export function resolveDreaminaStyleVideoCounterpartModel(
  value12,
  value13,
  { taskType: taskType = '' } = {},
) {
  const dreaminaStyleVideoManifest3 = resolveDreaminaStyleVideoManifest(value12),
    dreaminaStyleVideoCounterpartKey = getDreaminaStyleVideoCounterpartKey(dreaminaStyleVideoManifest3),
    styleProvider7 = normalizeStyleProvider(value13);
  if (!dreaminaStyleVideoManifest3 || !dreaminaStyleVideoCounterpartKey || !styleProvider7) return '';
  const enabled4 = String(taskType || '').trim(),
    value14 = dreaminaStyleVideoManifest3.vip === true,
    modelsByKind = getModelsByKind('video')
      .filter((item12) => {
        if (item12.provider !== styleProvider7) return false;
        const dreaminaStyleVideoExtension3 = getDreaminaStyleVideoExtension(item12);
        if (!dreaminaStyleVideoExtension3) return false;
        if (getDreaminaStyleVideoCounterpartKey(item12) !== dreaminaStyleVideoCounterpartKey) return false;
        const list4 = Array.isArray(dreaminaStyleVideoExtension3.taskTypes)
          ? dreaminaStyleVideoExtension3.taskTypes
          : [];
        return !enabled4 || list4.includes(enabled4);
      })
      .sort((item13, value15) => {
        const value16 = item13.vip === value14 ? 0 : 1,
          value17 = value15.vip === value14 ? 0 : 1;
        if (value16 !== value17) return value16 - value17;
        const value18 = Number(getDreaminaStyleVideoExtension(item13)?.order || 0) || 0,
          value19 = Number(getDreaminaStyleVideoExtension(value15)?.order || 0) || 0;
        return value18 - value19;
      });
  return modelsByKind[0]?.modelId || '';
}
export function isDreaminaVideoRouteModeEnabled(value20) {
  const dreaminaVideoRouteMode = normalizeDreaminaVideoRouteMode(value20);
  return DREAMINA_MODE_DISABLED_MAP[dreaminaVideoRouteMode] !== true;
}
export function normalizeDreaminaVideoRouteMode(value21, value22 = '') {
  const value23 = String(value21 || '').trim();
  if (DREAMINA_VIDEO_ROUTE_MODES.includes(value23)) return value23;
  const value24 = String(value22 || '').trim();
  if (value24 === '首尾帧') return 'frames2video';
  if (value24 === '智能多帧') return 'multiframe2video';
  return 'multimodal2video';
}
export function normalizeDreaminaVideoModel(value25, value26) {
  const dreaminaStyleVideoManifest4 = resolveDreaminaStyleVideoManifest(value25, 'dreamina');
  if (dreaminaStyleVideoManifest4) return dreaminaStyleVideoManifest4.modelId;
  if (normalizeStyleProvider(value26) === 'dreamina')
    return getDefaultDreaminaStyleVideoModel('text2video', 'dreamina');
  return String(value25 || '').trim();
}
export function getDreaminaVideoModelVersion(value27, value28) {
  const dreaminaVideoModel = normalizeDreaminaVideoModel(value27, value28),
    dreaminaStyleVideoManifest5 = resolveDreaminaStyleVideoManifest(dreaminaVideoModel, 'dreamina');
  return dreaminaStyleVideoManifest5 ? dreaminaVideoModel.replace(/^dreamina\//, '').trim() : '';
}
export function getDreaminaVideoModelMeta(value29, value30) {
  const dreaminaVideoModel2 = normalizeDreaminaVideoModel(value29, value30);
  return DREAMINA_VIDEO_MODEL_META.get(dreaminaVideoModel2) || null;
}
export function getDreaminaVideoTaskDisplayName(value31) {
  return dreaminaVideoText(DREAMINA_TASK_LABEL_KEYS[String(value31 || '').trim()] || 'task.video');
}
export function getDreaminaVideoRouteDisplayName(value32) {
  return dreaminaVideoText(
    DREAMINA_ROUTE_LABEL_KEYS[normalizeDreaminaVideoRouteMode(value32)] || 'route.multimodal2video',
  );
}
export function buildDreaminaVideoRouteLabel(value33) {
  return getDreaminaVideoRouteDisplayName(value33);
}
export function resolveDreaminaVideoTaskType({
  routeMode: routeMode = 'multimodal2video',
  imageCount: imageCount = 0,
  videoCount: videoCount = 0,
  audioCount: audioCount = 0,
} = {}) {
  const dreaminaVideoRouteMode2 = normalizeDreaminaVideoRouteMode(routeMode),
    count = Number(imageCount) || 0,
    count2 = Number(videoCount) || 0,
    count3 = Number(audioCount) || 0;
  if (dreaminaVideoRouteMode2 === 'frames2video') {
    if (count >= 2) return 'frames2video';
    if (count === 1) return 'image2video';
    return 'text2video';
  }
  if (dreaminaVideoRouteMode2 === 'multiframe2video') return 'multiframe2video';
  if (count <= 0 && count2 <= 0) return count3 > 0 ? 'multimodal2video' : 'text2video';
  return 'multimodal2video';
}
export function getDreaminaVideoAllowedModels(value34) {
  const value35 = String(value34 || '').trim();
  return DREAMINA_VIDEO_MODEL_OPTIONS.filter((item14) => item14.taskTypes.includes(value35));
}
export function getDreaminaVideoDefaultModel(value36) {
  const value37 = String(value36 || '').trim();
  return getDefaultDreaminaStyleVideoModel(value37, 'dreamina');
}
export function isDreaminaVideoTaskModelSupported(value38, value39, value40) {
  const dreaminaVideoModel3 = normalizeDreaminaVideoModel(value39, value40);
  return getDreaminaVideoAllowedModels(value38).some((item15) => item15.model === dreaminaVideoModel3);
}
export function ensureDreaminaVideoModelForTask(value41, value42, value43) {
  const value44 = String(value41 || '').trim(),
    dreaminaVideoModel4 = normalizeDreaminaVideoModel(value42, value43);
  if (dreaminaVideoModel4 && isDreaminaVideoTaskModelSupported(value44, dreaminaVideoModel4, 'dreamina'))
    return dreaminaVideoModel4;
  return getDreaminaVideoDefaultModel(value44);
}
export function normalizeDreaminaVideoAspectRatio(value45, value46 = {}) {
  const value47 =
      value46 === true || (value46 && typeof value46 === 'object' && value46.preserveAdaptive === true),
    enabled5 = String(value45 || '').trim();
  if (!enabled5) return value47 ? '自适应' : '1:1';
  if (enabled5 === '自适应' || enabled5 === '自适应' || enabled5 === 'auto')
    return value47 ? '自适应' : '1:1';
  if (enabled5 === '5:4') return '4:3';
  if (enabled5 === '4:5') return '3:4';
  if (DREAMINA_VIDEO_ALLOWED_RATIOS.includes(enabled5)) return enabled5;
  return value47 ? '自适应' : '1:1';
}
export function pickClosestDreaminaVideoAdaptiveRatio(value48, value49) {
  const count4 = Number(value48),
    count5 = Number(value49);
  if (!(Number.isFinite(count4) && count4 > 0 && Number.isFinite(count5) && count5 > 0))
    return DREAMINA_VIDEO_ADAPTIVE_RATIO_OPTIONS[0];
  const value50 = count4 / count5;
  let value51 = DREAMINA_VIDEO_ADAPTIVE_RATIO_OPTIONS[0],
    value52 = Math.abs(value50 - value51.calc);
  for (let value53 = 1; value53 < DREAMINA_VIDEO_ADAPTIVE_RATIO_OPTIONS.length; value53 += 1) {
    const value54 = DREAMINA_VIDEO_ADAPTIVE_RATIO_OPTIONS[value53],
      value55 = Math.abs(value50 - value54.calc);
    value55 < value52 && ((value52 = value55), (value51 = value54));
  }
  return value51;
}
export function getDreaminaVideoTaskParamVisibility(value56) {
  const duration = String(value56 || '').trim();
  return {
    ratio: true,
    duration: duration !== 'multiframe2video',
    mode: true,
    model: true,
    multiframeAdvanced: false,
    ratioChoices: duration !== 'image2video' && duration !== 'frames2video',
  };
}
export function getDreaminaVideoResolutionOptions(value57, value58, value59) {
  const value60 = String(value57 || '').trim(),
    dreaminaVideoModelForTask = ensureDreaminaVideoModelForTask(value60, value58, value59),
    dreaminaStyleVideoManifest6 = resolveDreaminaStyleVideoManifest(dreaminaVideoModelForTask, 'dreamina'),
    list5 =
      getDreaminaStyleVideoExtension(dreaminaStyleVideoManifest6)?.resolutionOptionsByTaskType?.[value60];
  return Array.isArray(list5) ? list5.slice() : [];
}
export function normalizeDreaminaVideoResolution(value61, value62, value63, value64) {
  const list6 = getDreaminaVideoResolutionOptions(value61, value62, value64);
  if (!list6.length) return '';
  return pickCanonicalOptionValue(list6, value63, list6[0]);
}
export function getDreaminaVideoDurationRange(value65, value66, value67) {
  const value68 = String(value65 || '').trim();
  if (value68 === 'multiframe2video') return { min: 3, max: 3, step: 1 };
  const dreaminaVideoModelForTask2 = ensureDreaminaVideoModelForTask(value68, value66, value67),
    dreaminaStyleVideoManifest7 = resolveDreaminaStyleVideoManifest(dreaminaVideoModelForTask2, 'dreamina'),
    min = getDreaminaStyleVideoExtension(dreaminaStyleVideoManifest7)?.durationRangeByTaskType?.[value68];
  return min && typeof min === 'object'
    ? { min: min.min, max: min.max, step: min.step || 1 }
    : { min: 4, max: 15, step: 1 };
}
export function normalizeDreaminaVideoDuration(value69, value70, value71, value72) {
  const dreaminaVideoDurationRange = getDreaminaVideoDurationRange(value69, value70, value72),
    value73 = Number(value71);
  if (!Number.isFinite(value73)) return dreaminaVideoDurationRange.min;
  return Math.max(
    dreaminaVideoDurationRange.min,
    Math.min(dreaminaVideoDurationRange.max, Math.trunc(value73)),
  );
}
export function validateDreaminaVideoRouteSelection({
  routeMode: routeMode = 'multimodal2video',
  taskType: taskType = '',
  imageCount: imageCount = 0,
  videoCount: videoCount = 0,
  audioCount: audioCount = 0,
} = {}) {
  const dreaminaVideoRouteMode3 = normalizeDreaminaVideoRouteMode(routeMode),
    value74 = String(taskType || '').trim(),
    count6 = Number(imageCount) || 0,
    count7 = Number(videoCount) || 0,
    count8 = Number(audioCount) || 0;
  if (dreaminaVideoRouteMode3 === 'frames2video') {
    if (count7 > 0 || count8 > 0) return dreaminaVideoText('validation.framesOnlyImages');
  }
  if (value74 === 'text2video') return '';
  if (value74 === 'image2video') {
    if (count7 > 0 || count8 > 0) return dreaminaVideoText('validation.framesOnlyImages');
    if (count6 < 1) return dreaminaVideoText('validation.imageAtLeastOne');
    if (count6 > 1) return dreaminaVideoText('validation.imageAtMostOneSingle');
    return '';
  }
  if (value74 === 'frames2video') {
    if (count7 > 0 || count8 > 0) return dreaminaVideoText('validation.framesOnlyImages');
    if (count6 < 2) return dreaminaVideoText('validation.framesNeedTwo');
    if (count6 > 2) return dreaminaVideoText('validation.framesAtMostTwo');
    return '';
  }
  if (value74 === 'multimodal2video') {
    if (count6 <= 0 && count7 <= 0)
      return count8 > 0 ? dreaminaVideoText('validation.allReferenceNeedsVisual') : '';
    if (count6 > 9) return dreaminaVideoText('validation.allReferenceMaxImages');
    if (count7 > 3) return dreaminaVideoText('validation.allReferenceMaxVideos');
    if (count8 > 3) return dreaminaVideoText('validation.allReferenceMaxAudios');
    return '';
  }
  if (value74 === 'multiframe2video') {
    if (count7 > 0 || count8 > 0) return dreaminaVideoText('validation.multiframeOnlyImages');
    if (count6 < 2) return dreaminaVideoText('validation.multiframeAtLeastTwo');
    if (count6 > 20) return dreaminaVideoText('validation.multiframeMaxImages');
    return '';
  }
  return '';
}
export function normalizeDreaminaStyleVideoModel(value75, value76) {
  const dreaminaStyleVideoProvider = resolveDreaminaStyleVideoProvider(value75, value76);
  if (dreaminaStyleVideoProvider === 'dreamina') return normalizeDreaminaVideoModel(value75, value76);
  const dreaminaStyleVideoManifest8 = resolveDreaminaStyleVideoManifest(value75, dreaminaStyleVideoProvider);
  return (
    dreaminaStyleVideoManifest8?.modelId ||
    getDefaultDreaminaStyleVideoModel('text2video', dreaminaStyleVideoProvider)
  );
}
export function getDreaminaStyleVideoModelVersion(value77, value78) {
  const dreaminaStyleVideoProvider2 = resolveDreaminaStyleVideoProvider(value77, value78);
  if (dreaminaStyleVideoProvider2 === 'dreamina') return getDreaminaVideoModelVersion(value77, value78);
  const dreaminaStyleVideoModel = normalizeDreaminaStyleVideoModel(value77, dreaminaStyleVideoProvider2),
    dreaminaStyleVideoManifest9 = resolveDreaminaStyleVideoManifest(
      dreaminaStyleVideoModel,
      dreaminaStyleVideoProvider2,
    );
  return dreaminaStyleVideoManifest9
    ? dreaminaStyleVideoModel.replace(new RegExp('^' + dreaminaStyleVideoProvider2 + '/'), '').trim()
    : '';
}
export function getDreaminaStyleVideoModelMeta(value79, value80) {
  const dreaminaStyleVideoProvider3 = resolveDreaminaStyleVideoProvider(value79, value80);
  if (dreaminaStyleVideoProvider3 === 'dreamina') return getDreaminaVideoModelMeta(value79, value80);
  const dreaminaStyleVideoModel2 = normalizeDreaminaStyleVideoModel(value79, dreaminaStyleVideoProvider3);
  if (dreaminaStyleVideoProvider3 === 'apimart')
    return APIMART_DREAMINA_VIDEO_MODEL_META.get(dreaminaStyleVideoModel2) || null;
  if (dreaminaStyleVideoProvider3 === 'volcengine')
    return VOLCENGINE_DREAMINA_VIDEO_MODEL_META.get(dreaminaStyleVideoModel2) || null;
  return null;
}
export function getDreaminaStyleVideoAllowedModels(value81, value82) {
  const styleProvider8 = normalizeStyleProvider(value82) || 'dreamina';
  if (styleProvider8 === 'dreamina') return getDreaminaVideoAllowedModels(value81);
  const value83 = String(value81 || '').trim();
  return getDreaminaStyleVideoOptions(styleProvider8).filter((item16) => item16.taskTypes.includes(value83));
}
export function getDreaminaStyleVideoDefaultModel(value84, value85) {
  const styleProvider9 = normalizeStyleProvider(value85) || 'dreamina';
  if (styleProvider9 === 'dreamina') return getDreaminaVideoDefaultModel(value84);
  return getDefaultDreaminaStyleVideoModel(value84, styleProvider9);
}
export function isDreaminaStyleVideoTaskModelSupported(value86, value87, value88) {
  const dreaminaStyleVideoProvider4 = resolveDreaminaStyleVideoProvider(value87, value88),
    dreaminaStyleVideoModel3 = normalizeDreaminaStyleVideoModel(value87, dreaminaStyleVideoProvider4);
  return getDreaminaStyleVideoAllowedModels(value86, dreaminaStyleVideoProvider4).some(
    (item17) => item17.model === dreaminaStyleVideoModel3,
  );
}
export function ensureDreaminaStyleVideoModelForTask(value89, value90, value91) {
  const dreaminaStyleVideoProvider5 = resolveDreaminaStyleVideoProvider(value90, value91);
  if (dreaminaStyleVideoProvider5 === 'dreamina')
    return ensureDreaminaVideoModelForTask(value89, value90, value91);
  const value92 = String(value89 || '').trim(),
    dreaminaStyleVideoModel4 = normalizeDreaminaStyleVideoModel(value90, dreaminaStyleVideoProvider5);
  if (
    dreaminaStyleVideoModel4 &&
    isDreaminaStyleVideoTaskModelSupported(value92, dreaminaStyleVideoModel4, dreaminaStyleVideoProvider5)
  )
    return dreaminaStyleVideoModel4;
  return getDreaminaStyleVideoDefaultModel(value92, dreaminaStyleVideoProvider5);
}
export function getDreaminaStyleVideoResolutionOptions(value93, value94, value95) {
  const dreaminaStyleVideoProvider6 = resolveDreaminaStyleVideoProvider(value94, value95);
  if (dreaminaStyleVideoProvider6 === 'dreamina')
    return getDreaminaVideoResolutionOptions(value93, value94, value95);
  const value96 = String(value93 || '').trim(),
    dreaminaStyleVideoModelForTask = ensureDreaminaStyleVideoModelForTask(
      value96,
      value94,
      dreaminaStyleVideoProvider6,
    ),
    dreaminaStyleVideoManifest10 = resolveDreaminaStyleVideoManifest(
      dreaminaStyleVideoModelForTask,
      dreaminaStyleVideoProvider6,
    ),
    list7 = getDreaminaStyleVideoExtension(dreaminaStyleVideoManifest10)?.resolutionOptionsByTaskType?.[
      value96
    ];
  return Array.isArray(list7) ? list7.slice() : [];
}
export function normalizeDreaminaStyleVideoResolution(value97, value98, value99, value100) {
  const list8 = getDreaminaStyleVideoResolutionOptions(value97, value98, value100);
  if (!list8.length) return '';
  return pickCanonicalOptionValue(list8, value99, list8.includes('720p') ? '720p' : list8[0]);
}
export function getDreaminaStyleVideoDurationRange(value101, value102, value103) {
  const dreaminaStyleVideoProvider7 = resolveDreaminaStyleVideoProvider(value102, value103);
  if (dreaminaStyleVideoProvider7 === 'dreamina')
    return getDreaminaVideoDurationRange(value101, value102, value103);
  const value104 = String(value101 || '').trim();
  if (value104 === 'multiframe2video') return { min: 3, max: 3, step: 1 };
  const dreaminaStyleVideoModel5 = normalizeDreaminaStyleVideoModel(value102, dreaminaStyleVideoProvider7),
    dreaminaStyleVideoManifest11 = resolveDreaminaStyleVideoManifest(
      dreaminaStyleVideoModel5,
      dreaminaStyleVideoProvider7,
    ),
    min2 = getDreaminaStyleVideoExtension(dreaminaStyleVideoManifest11)?.durationRangeByTaskType?.[value104];
  return min2 && typeof min2 === 'object'
    ? { min: min2.min, max: min2.max, step: min2.step || 1 }
    : { min: 4, max: 15, step: 1 };
}
export function normalizeDreaminaStyleVideoDuration(value105, value106, value107, value108) {
  const dreaminaStyleVideoDurationRange = getDreaminaStyleVideoDurationRange(value105, value106, value108),
    value109 = Number(value107);
  if (!Number.isFinite(value109)) return dreaminaStyleVideoDurationRange.min;
  return Math.max(
    dreaminaStyleVideoDurationRange.min,
    Math.min(dreaminaStyleVideoDurationRange.max, Math.trunc(value109)),
  );
}
export function buildDreaminaStyleVideoNodeNormalizationPatch(value110) {
  const value111 = value110 && typeof value110 === 'object' ? value110 : {};
  if (!isDreaminaStyleVideoModel(value111.model, value111.provider)) return null;
  const dreaminaStyleVideoProvider8 = resolveDreaminaStyleVideoProvider(value111.model, value111.provider);
  if (dreaminaStyleVideoProvider8 === 'dreamina') return buildDreaminaVideoNodeNormalizationPatch(value110);
  const dreaminaStyleVideoModel6 = normalizeDreaminaStyleVideoModel(
      value111.model,
      dreaminaStyleVideoProvider8,
    ),
    routeMode2 = normalizeDreaminaVideoRouteMode(value111.dreaminaRouteMode, value111.mode),
    dreaminaVideoAspectRatio = normalizeDreaminaVideoAspectRatio(value111.aspectRatio, {
      preserveAdaptive: true,
    }),
    dreaminaVideoTaskType = resolveDreaminaVideoTaskType({ routeMode: routeMode2 }),
    dreaminaStyleVideoResolution = normalizeDreaminaStyleVideoResolution(
      dreaminaVideoTaskType,
      dreaminaStyleVideoModel6,
      value111.resolution || value111.videoSize,
      dreaminaStyleVideoProvider8,
    ),
    dreaminaStyleVideoDuration = normalizeDreaminaStyleVideoDuration(
      dreaminaVideoTaskType,
      dreaminaStyleVideoModel6,
      value111.duration,
      dreaminaStyleVideoProvider8,
    ),
    value112 = {};
  return (
    String(value111.provider || '')
      .trim()
      .toLowerCase() !== dreaminaStyleVideoProvider8 && (value112.provider = dreaminaStyleVideoProvider8),
    dreaminaStyleVideoModel6 &&
      dreaminaStyleVideoModel6 !== String(value111.model || '').trim() &&
      (value112.model = dreaminaStyleVideoModel6),
    routeMode2 !== String(value111.dreaminaRouteMode || '').trim() &&
      (value112.dreaminaRouteMode = routeMode2),
    dreaminaVideoAspectRatio !== String(value111.aspectRatio || '').trim() &&
      String(value111.aspectRatio || '').trim() &&
      (value112.aspectRatio = dreaminaVideoAspectRatio),
    dreaminaStyleVideoResolution &&
      dreaminaStyleVideoResolution !== String(value111.resolution || '').trim() &&
      (value112.resolution = dreaminaStyleVideoResolution),
    Number(dreaminaStyleVideoDuration) !== Number(value111.duration) &&
      (value112.duration = dreaminaStyleVideoDuration),
    Object.keys(value112).length > 0 ? value112 : null
  );
}
export function buildDreaminaVideoNodeNormalizationPatch(value113) {
  const value114 = value113 && typeof value113 === 'object' ? value113 : {};
  if (!isDreaminaVideoModel(value114.model, value114.provider)) return null;
  const dreaminaVideoModel5 = normalizeDreaminaVideoModel(value114.model, value114.provider),
    dreaminaVideoRouteMode4 = normalizeDreaminaVideoRouteMode(value114.dreaminaRouteMode, value114.mode),
    dreaminaVideoAspectRatio2 = normalizeDreaminaVideoAspectRatio(value114.aspectRatio, {
      preserveAdaptive: true,
    }),
    value115 = {};
  return (
    String(value114.provider || '')
      .trim()
      .toLowerCase() !== 'dreamina' && (value115.provider = 'dreamina'),
    dreaminaVideoModel5 &&
      dreaminaVideoModel5 !== String(value114.model || '').trim() &&
      (value115.model = dreaminaVideoModel5),
    dreaminaVideoRouteMode4 !== String(value114.dreaminaRouteMode || '').trim() &&
      (value115.dreaminaRouteMode = dreaminaVideoRouteMode4),
    dreaminaVideoAspectRatio2 !== String(value114.aspectRatio || '').trim() &&
      String(value114.aspectRatio || '').trim() &&
      (value115.aspectRatio = dreaminaVideoAspectRatio2),
    Object.keys(value115).length > 0 ? value115 : null
  );
}

export function getDreaminaStyleVideoInputLimits(value116, value117 = '') {
  const dreaminaStyleVideoManifest12 = resolveDreaminaStyleVideoManifest(value116, value117),
    handler = (value118, value119) => {
      const count9 = Number(value118);
      return Number.isFinite(count9) && count9 >= 0 ? Math.trunc(count9) : value119;
    };
  return Object.freeze({
    image: handler(dreaminaStyleVideoManifest12?.inputSlots?.maxByKind?.image, 9),
    video: handler(dreaminaStyleVideoManifest12?.inputSlots?.maxByKind?.video, 3),
    audio: handler(dreaminaStyleVideoManifest12?.inputSlots?.maxByKind?.audio, 3),
  });
}
