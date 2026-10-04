import { isDreaminaStyleVideoModel, normalizeDreaminaVideoRouteMode } from './dreaminaVideoModelHelper.js';
import {
  PERSON_REPLACE_V3_MODEL_ID,
  PERSON_REPLACE_V21_MODEL_ID,
  QWEN_IMAGE_EDIT_MODEL_ID,
  getModelManifest,
  normalizeProviderId,
  resolveModelExecution,
  resolveModelProvider,
} from '../manifests/index.js';
import { t } from '../i18n/index.js';
export const INPUT_KIND_ORDER = Object.freeze(['text', 'image', 'video', 'audio']);
export const INPUT_KIND_LABELS = Object.freeze({ text: '文本', image: '图片', video: '视频', audio: '音频' });
function modelInputPolicyText(value, item = {}) {
  return t('modelInputPolicy.' + value, item);
}
export function getInputKindLabel(key) {
  const inputKind = normalizeInputKind(key);
  if (!inputKind) return modelInputPolicyText('inputKinds.material');
  return modelInputPolicyText('inputKinds.' + inputKind);
}
export const RH_PERSON_REPLACE_V21_MODEL = PERSON_REPLACE_V21_MODEL_ID;
export const RH_QWEN_IMAGE_EDIT_MODEL = QWEN_IMAGE_EDIT_MODEL_ID;
const HAPPYHORSE_BODY_RESOLVERS = new Set(['apimartHappyHorseVideo', 'runninghubHappyHorseVideo']),
  SEEDANCE_2_BODY_RESOLVERS = new Set(['runninghubSeedance2Video', 'volcengineSeedance2Video']),
  APIMART_WAN27_MODEL_ID = 'apimart/wan2.7',
  APIMART_KLING_V3_OMNI_MODEL_ID = 'apimart/kling-v3-omni',
  APIMART_VIDU_Q3_MODEL_ID = 'apimart/viduq3',
  RH_PERSON_REPLACE_FIXED_IMAGE_SLOTS = Object.freeze(['replaceTarget', 'replacedImage']),
  INPUT_TARGET_NODE_TYPES = new Set([
    'ai-image',
    'ai-video',
    'ai-audio',
    'ai-text',
    'group',
    'media-clip',
    'panorama-360',
    'panorama_360',
    'panorama360',
    'storyboard',
    'storyboard-script',
  ]);
function normalizeText(index) {
  return String(index || '').trim();
}
export function isRhPersonReplaceV3Model(result) {
  return getModelManifest(result)?.modelId === PERSON_REPLACE_V3_MODEL_ID;
}
function hasExactPersonReplaceFixedImageSlotCapability(data) {
  const list = data?.capabilities?.fixedImageSlots;
  return (
    Array.isArray(list) &&
    list.length === RH_PERSON_REPLACE_FIXED_IMAGE_SLOTS.length &&
    list.every((item2, options) => item2 === RH_PERSON_REPLACE_FIXED_IMAGE_SLOTS[options])
  );
}
function hasPersonReplaceFixedImageInputSlots(target) {
  const list2 = target?.inputSlots?.fixedSlots;
  if (!Array.isArray(list2)) return false;
  return RH_PERSON_REPLACE_FIXED_IMAGE_SLOTS.every((item3) =>
    list2.some((item4) => item4?.id === item3 && item4?.kind === 'image'),
  );
}
function isDreaminaManifestOrModel(source, next = '') {
  return resolveTargetProvider(source, next) === 'dreamina';
}
function isHappyHorseVideoModel(current, providerHint = '') {
  const modelExecution =
      resolveModelExecution(current, { providerHint: providerHint }) || resolveModelExecution(current),
    text = normalizeText(modelExecution?.executionManifest?.extensions?.bodyResolver);
  return text && HAPPYHORSE_BODY_RESOLVERS.has(text);
}
function isSeedance2VideoModel(entry, providerHint2 = '') {
  const modelExecution2 =
      resolveModelExecution(entry, { providerHint: providerHint2 }) || resolveModelExecution(entry),
    text2 = normalizeText(modelExecution2?.executionManifest?.extensions?.bodyResolver);
  return text2 && SEEDANCE_2_BODY_RESOLVERS.has(text2);
}
function isApimartWan27VideoModel(record, providerHint3 = '') {
  const modelExecution3 =
      resolveModelExecution(record, { providerHint: providerHint3 }) || resolveModelExecution(record),
    payload = modelExecution3?.modelManifest || getModelManifest(record),
    text3 = normalizeText(modelExecution3?.canonicalModelId || payload?.modelId || record);
  if (text3 !== APIMART_WAN27_MODEL_ID) return false;
  const providerId = normalizeProviderId(payload?.provider) || resolveTargetProvider(record, providerHint3);
  return !providerId || providerId === 'apimart';
}
function isApimartKlingV3OmniVideoModel(handle, providerHint4 = '') {
  const modelExecution4 =
      resolveModelExecution(handle, { providerHint: providerHint4 }) || resolveModelExecution(handle),
    state = modelExecution4?.modelManifest || getModelManifest(handle),
    text4 = normalizeText(modelExecution4?.canonicalModelId || state?.modelId || handle);
  if (text4 !== APIMART_KLING_V3_OMNI_MODEL_ID) return false;
  const providerId2 = normalizeProviderId(state?.provider) || resolveTargetProvider(handle, providerHint4);
  return !providerId2 || providerId2 === 'apimart';
}
function isApimartViduQ3VideoModel(config, providerHint5 = '') {
  const modelExecution5 =
      resolveModelExecution(config, { providerHint: providerHint5 }) || resolveModelExecution(config),
    scope = modelExecution5?.modelManifest || getModelManifest(config),
    text5 = normalizeText(modelExecution5?.canonicalModelId || scope?.modelId || config);
  if (text5 !== APIMART_VIDU_Q3_MODEL_ID) return false;
  const providerId3 = normalizeProviderId(scope?.provider) || resolveTargetProvider(config, providerHint5);
  return !providerId3 || providerId3 === 'apimart';
}
function resolveTargetProvider(input, output = '') {
  const providerId4 = normalizeProviderId(output);
  if (providerId4) return providerId4;
  return (
    resolveModelProvider(input, '', { allowProviderHint: false, allowPrefixInference: false }) ||
    normalizeProviderId(getModelManifest(input)?.provider)
  );
}
export function isRhPersonReplaceWorkflowModel(value2) {
  const modelManifest = getModelManifest(value2);
  return (
    modelManifest?.kind === 'image' &&
    hasExactPersonReplaceFixedImageSlotCapability(modelManifest) &&
    hasPersonReplaceFixedImageInputSlots(modelManifest)
  );
}
export function isRhQwenImageEditModel(value3) {
  return normalizeText(value3) === RH_QWEN_IMAGE_EDIT_MODEL;
}
const VIDEO_PATH_RE = /\.(?:mp4|mov|m4v|webm|mkv|avi|mpeg|mpg|3gp)(?:[?#].*)?$/i,
  AUDIO_PATH_RE = /\.(?:mp3|wav|m4a|aac|flac|ogg|opus|wma)(?:[?#].*)?$/i,
  IMAGE_PATH_RE = /\.(?:png|jpe?g|webp|gif|bmp|tiff?|avif)(?:[?#].*)?$/i;
export function normalizeInputKind(value4) {
  const list3 = value4 && typeof value4 === 'object' ? normalizeText(value4.type) : normalizeText(value4);
  if (!list3) return '';
  if (list3 === 'text' || list3 === 'source-text' || list3 === 'ai-text') return 'text';
  if (list3 === 'image' || list3 === 'source-image' || list3 === 'ai-image') return 'image';
  if (list3 === 'video' || list3 === 'source-video' || list3 === 'ai-video') return 'video';
  if (list3 === 'audio' || list3 === 'source-audio' || list3 === 'ai-audio') return 'audio';
  if (list3.includes('text')) return 'text';
  if (list3.includes('video')) return 'video';
  if (list3.includes('audio')) return 'audio';
  if (list3.includes('image')) return 'image';
  return '';
}
function normalizeExplicitMediaKind(value5) {
  const text6 = normalizeText(value5).toLowerCase();
  if (!text6) return '';
  if (text6 === 'text' || text6 === 'source-text' || text6 === 'ai-text') return 'text';
  if (
    text6 === 'image' ||
    text6 === 'source-image' ||
    text6 === 'ai-image' ||
    text6 === 'asset-image' ||
    text6.startsWith('image/')
  )
    return 'image';
  if (
    text6 === 'video' ||
    text6 === 'source-video' ||
    text6 === 'ai-video' ||
    text6 === 'asset-video' ||
    text6.startsWith('video/')
  )
    return 'video';
  if (
    text6 === 'audio' ||
    text6 === 'source-audio' ||
    text6 === 'ai-audio' ||
    text6 === 'asset-audio' ||
    text6.startsWith('audio/')
  )
    return 'audio';
  return '';
}
function hasPathLikeValue(enabled, list4, handler) {
  if (!enabled || typeof enabled !== 'object') return false;
  return list4.some((item5) => handler(normalizeText(enabled?.[item5])));
}
function isVideoPath(value6) {
  return VIDEO_PATH_RE.test(normalizeText(value6));
}
function isAudioPath(value7) {
  return AUDIO_PATH_RE.test(normalizeText(value7));
}
function isImagePath(value8) {
  return IMAGE_PATH_RE.test(normalizeText(value8));
}
function hasExplicitKind(enabled2, value9) {
  if (!enabled2 || typeof enabled2 !== 'object') return false;
  const list5 = [
    'kind',
    'mediaKind',
    'mediaTaskKind',
    'asyncTaskKind',
    'assetKind',
    'assetType',
    'mediaType',
    'mimeType',
  ];
  return list5.some((item6) => normalizeExplicitMediaKind(enabled2?.[item6]) === value9);
}
function hasVideoEvidence(enabled3 = {}, value10 = null) {
  if (!enabled3 || typeof enabled3 !== 'object') return false;
  if (hasExplicitKind(enabled3, 'video')) return true;
  const list6 = Array.isArray(enabled3.videos) ? enabled3.videos : [];
  if (list6.some((item7) => getVideoSourceKey(item7) || hasExplicitKind(item7, 'video'))) return true;
  if (
    hasPathLikeValue(
      enabled3,
      [
        'videoUrl',
        'videoLocalPath',
        'originalVideoUrl',
        'localPath',
        'originalLocalPath',
        'displayLocalPath',
        'src',
        'url',
        'resultUrl',
        'sourceUrl',
      ],
      isVideoPath,
    )
  )
    return true;
  return hasPathLikeValue(value10, ['sourceMediaKey', 'videoUrl', 'localPath'], isVideoPath);
}
function hasAudioEvidence(enabled4 = {}, value11 = null) {
  if (!enabled4 || typeof enabled4 !== 'object') return false;
  if (hasExplicitKind(enabled4, 'audio')) return true;
  if (Array.isArray(enabled4.audios) && enabled4.audios.length > 0) return true;
  if (
    hasPathLikeValue(
      enabled4,
      [
        'audioUrl',
        'audioLocalPath',
        'localPath',
        'originalLocalPath',
        'displayLocalPath',
        'src',
        'url',
        'resultUrl',
        'sourceUrl',
      ],
      isAudioPath,
    )
  )
    return true;
  return hasPathLikeValue(value11, ['sourceMediaKey', 'audioUrl', 'localPath'], isAudioPath);
}
function hasImageEvidence(enabled5 = {}, value12 = null) {
  if (!enabled5 || typeof enabled5 !== 'object') return false;
  if (hasExplicitKind(enabled5, 'image')) return true;
  if (Array.isArray(enabled5.images) && enabled5.images.length > 0) return true;
  if (enabled5.thumbId || enabled5.thumbUrl || enabled5.imageUrl || enabled5.posterLocalPath) return true;
  if (
    hasPathLikeValue(
      enabled5,
      [
        'imageUrl',
        'localPath',
        'originalLocalPath',
        'displayLocalPath',
        'src',
        'url',
        'resultUrl',
        'sourceUrl',
      ],
      isImagePath,
    )
  )
    return true;
  return hasPathLikeValue(value12, ['sourceMediaKey', 'imageUrl', 'localPath'], isImagePath);
}
export function resolveEffectiveInputKind(enabled6, value13 = null) {
  if (!enabled6 || typeof enabled6 !== 'object') return normalizeInputKind(enabled6);
  const inputKind2 = normalizeInputKind(enabled6);
  if (hasVideoEvidence(enabled6, value13)) return 'video';
  if (hasAudioEvidence(enabled6, value13)) return 'audio';
  if (inputKind2) return inputKind2;
  if (hasImageEvidence(enabled6, value13)) return 'image';
  return '';
}
function makePolicy(value14, args = {}) {
  const map = new Set(
    ['text', ...(Array.isArray(value14) ? value14 : [])]
      .map((item8) => normalizeInputKind(item8))
      .filter(Boolean),
  );
  return {
    allowedKinds: INPUT_KIND_ORDER.filter((item9) => map.has(item9)),
    maxByKind: { ...args },
  };
}
function normalizePolicyCompareValue(value15) {
  return String(value15 ?? '')
    .trim()
    .toLowerCase();
}
function manifestPolicyConditionMatches(el, value16 = {}) {
  if (Array.isArray(el)) return el.some((item10) => manifestPolicyConditionMatches(item10, value16));
  if (!el || typeof el !== 'object') return false;
  if (Array.isArray(el.any)) return el.any.some((item11) => manifestPolicyConditionMatches(item11, value16));
  if (Array.isArray(el.all)) return el.all.every((item12) => manifestPolicyConditionMatches(item12, value16));
  const text7 = normalizeText(el.field ?? el.param);
  if (!text7) return false;
  const value17 = el.values !== undefined ? el.values : el.value,
    list7 = (Array.isArray(value17) ? value17 : [value17]).map(normalizePolicyCompareValue),
    enabled7 = list7.includes(normalizePolicyCompareValue(value16?.[text7]));
  return el.not === true ? !enabled7 : enabled7;
}
export function getActiveManifestInputPolicyVariant(value18, args2 = {}) {
  const list8 = Array.isArray(value18?.policyVariants) ? value18.policyVariants : [];
  if (list8.length === 0) return null;
  const args3 =
      args2?.generationParams &&
      typeof args2.generationParams === 'object' &&
      !Array.isArray(args2.generationParams)
        ? args2.generationParams
        : {},
    value19 = { ...args2, ...args3 };
  return list8.find((item13) => manifestPolicyConditionMatches(item13?.when, value19)) || null;
}
function makeManifestInputPolicy(enabled8, value20 = {}) {
  if (!enabled8 || typeof enabled8 !== 'object') return null;
  const activeManifestInputPolicyVariant = getActiveManifestInputPolicyVariant(enabled8, value20),
    list9 = Array.isArray(activeManifestInputPolicyVariant?.allowedKinds)
      ? activeManifestInputPolicyVariant.allowedKinds
      : Array.isArray(enabled8.allowedKinds)
        ? enabled8.allowedKinds
        : [];
  return {
    allowedKinds: INPUT_KIND_ORDER.filter((item14) => list9.includes(item14)),
    maxByKind: { ...(enabled8.maxByKind || {}), ...(activeManifestInputPolicyVariant?.maxByKind || {}) },
  };
}
export function manifestInputPolicyReferencesField(value21, value22) {
  const text8 = normalizeText(value22);
  if (!text8) return false;
  const run = (list10) => {
    if (Array.isArray(list10)) return list10.some(run);
    if (!list10 || typeof list10 !== 'object') return false;
    if (Array.isArray(list10.any) && list10.any.some(run)) return true;
    if (Array.isArray(list10.all) && list10.all.some(run)) return true;
    return normalizeText(list10.field ?? list10.param) === text8;
  };
  return (Array.isArray(value21?.policyVariants) ? value21.policyVariants : []).some((item15) =>
    run(item15?.when),
  );
}
function makeDreaminaStyleVideoPolicy(value23) {
  const value24 =
      value23?.generationParams && typeof value23.generationParams === 'object'
        ? value23.generationParams
        : {},
    dreaminaVideoRouteMode = normalizeDreaminaVideoRouteMode(
      value24.dreaminaRouteMode ?? value23?.dreaminaRouteMode,
      value23?.mode,
    );
  if (dreaminaVideoRouteMode === 'frames2video')
    return makePolicy(['text', 'image'], { image: 2, video: 0, audio: 0 });
  if (dreaminaVideoRouteMode === 'multiframe2video')
    return makePolicy(['text', 'image'], { image: 20, video: 0, audio: 0 });
  return makePolicy(['text', 'image', 'video', 'audio'], { image: 9, video: 3, audio: 3 });
}
function normalizeHappyHorseVideoMode(value25) {
  const text9 = normalizeText(value25).toLowerCase();
  return text9 === 'image' || text9 === 'reference' || text9 === 'edit' ? text9 : 'auto';
}
function getHappyHorseVideoMode(options2 = {}) {
  const value26 =
    options2?.generationParams && typeof options2.generationParams === 'object'
      ? options2.generationParams
      : {};
  return normalizeHappyHorseVideoMode(value26.happyhorse_mode ?? options2?.happyhorse_mode);
}
function makeHappyHorseVideoPolicy(value27) {
  const happyHorseVideoMode = getHappyHorseVideoMode(value27);
  if (happyHorseVideoMode === 'image') return makePolicy(['text', 'image'], { image: 1, video: 0, audio: 0 });
  if (happyHorseVideoMode === 'reference')
    return makePolicy(['text', 'image'], { image: 9, video: 0, audio: 0 });
  if (happyHorseVideoMode === 'edit')
    return makePolicy(['text', 'image', 'video'], { image: 5, video: 1, audio: 0 });
  return makePolicy(['text'], { image: 0, video: 0, audio: 0 });
}
function normalizeSeedance2VideoMode(value28, value29 = 'text2video') {
  const text10 = normalizeText(value28).toLowerCase();
  if (text10 === 'multimodal2video' || text10 === 'reference') return 'multimodal2video';
  if (text10 === 'frames2video' || text10 === 'frames') return 'frames2video';
  if (text10 === 'image2video' || text10 === 'image' || text10 === 'frame') return 'image2video';
  if (text10 === 'text2video' || text10 === 'text') return 'text2video';
  return value29 === 'multimodal2video' ? 'multimodal2video' : 'text2video';
}
function getSeedance2VideoMode(options3 = {}) {
  const value30 =
      options3?.generationParams && typeof options3.generationParams === 'object'
        ? options3.generationParams
        : {},
    text11 = normalizeText(options3?.provider).toLowerCase(),
    text12 = normalizeText(options3?.model).toLowerCase(),
    value31 = text11 === 'volcengine' || text12.startsWith('volcengine/');
  return normalizeSeedance2VideoMode(
    value30.rh_seedance_2_mode ??
      value30.volcengine_seedance_2_mode ??
      options3?.rh_seedance_2_mode ??
      options3?.volcengine_seedance_2_mode,
    value31 ? 'multimodal2video' : 'text2video',
  );
}
function makeSeedance2VideoPolicy(value32) {
  const seedance2VideoMode = getSeedance2VideoMode(value32);
  if (seedance2VideoMode === 'multimodal2video') {
    const value33 = value32?.model,
      providerHint6 = value32?.provider,
      modelExecution6 =
        resolveModelExecution(value33, { providerHint: providerHint6 }) || resolveModelExecution(value33),
      value34 = modelExecution6?.modelManifest || getModelManifest(value33),
      image = makeManifestInputPolicy(value34?.inputSlots, value32);
    return makePolicy(['text', 'image', 'video', 'audio'], {
      image: image?.maxByKind?.image ?? 9,
      video: image?.maxByKind?.video ?? 3,
      audio: image?.maxByKind?.audio ?? 3,
    });
  }
  if (seedance2VideoMode === 'frames2video')
    return makePolicy(['text', 'image'], { image: 2, video: 0, audio: 0 });
  if (seedance2VideoMode === 'image2video')
    return makePolicy(['text', 'image'], { image: 1, video: 0, audio: 0 });
  return makePolicy(['text'], { image: 0, video: 0, audio: 0 });
}
function normalizeWan27VideoMode(value35) {
  const text13 = normalizeText(value35).toLowerCase();
  return text13 === 'video' || text13 === 'reference' || text13 === 'edit' ? text13 : 'image';
}
function getWan27VideoMode(options4 = {}) {
  const value36 =
    options4?.generationParams && typeof options4.generationParams === 'object'
      ? options4.generationParams
      : {};
  return normalizeWan27VideoMode(value36.wan27_mode ?? options4?.wan27_mode);
}
function makeWan27VideoPolicy(value37) {
  const wan27VideoMode = getWan27VideoMode(value37);
  if (wan27VideoMode === 'video') return makePolicy(['text', 'video'], { image: 0, video: 1, audio: 0 });
  if (wan27VideoMode === 'reference')
    return makePolicy(['text', 'image', 'video', 'audio'], { image: 1, video: 1, audio: 1 });
  if (wan27VideoMode === 'edit') return makePolicy(['text', 'video'], { image: 0, video: 2, audio: 0 });
  return makePolicy(['text', 'image', 'audio'], { image: 2, video: 0, audio: 1 });
}
function normalizeKlingV3OmniVideoMode(value38) {
  const text14 = normalizeText(value38).toLowerCase();
  return text14 === 'reference' || text14 === 'edit' ? text14 : 'image';
}
function getKlingV3OmniVideoMode(options5 = {}) {
  const value39 =
    options5?.generationParams && typeof options5.generationParams === 'object'
      ? options5.generationParams
      : {};
  return normalizeKlingV3OmniVideoMode(value39.kling_v3_omni_mode ?? options5?.kling_v3_omni_mode);
}
function makeKlingV3OmniVideoPolicy(value40) {
  const klingV3OmniVideoMode = getKlingV3OmniVideoMode(value40);
  if (klingV3OmniVideoMode === 'reference')
    return makePolicy(['text', 'image', 'video'], { image: 1, video: 1, audio: 0 });
  if (klingV3OmniVideoMode === 'edit') return makePolicy(['text', 'video'], { image: 0, video: 1, audio: 0 });
  return makePolicy(['text', 'image'], { image: 2, video: 0, audio: 0 });
}
function normalizeViduQ3GenerationMode(value41) {
  const text15 = normalizeText(value41).toLowerCase();
  return text15 === 'reference' ? 'reference' : 'video';
}
function getViduQ3GenerationMode(options6 = {}) {
  const value42 =
    options6?.generationParams && typeof options6.generationParams === 'object'
      ? options6.generationParams
      : {};
  return normalizeViduQ3GenerationMode(value42.vidu_q3_generation_mode ?? options6?.vidu_q3_generation_mode);
}
function makeViduQ3VideoPolicy(value43) {
  const image2 = getViduQ3GenerationMode(value43);
  return makePolicy(['text', 'image'], { image: image2 === 'reference' ? 7 : 2, video: 0, audio: 0 });
}
export function getTargetInputPolicy(options7 = {}) {
  const text16 = normalizeText(options7?.type),
    text17 = normalizeText(options7?.model),
    text18 = normalizeText(options7?.provider).toLowerCase(),
    audio = normalizeText(options7?.audioWorkflowKey);
  if (text16 === 'ai-image') {
    const manifestInputPolicy = makeManifestInputPolicy(getModelManifest(text17)?.inputSlots, options7);
    if (manifestInputPolicy) return manifestInputPolicy;
    const image3 = isRhPersonReplaceWorkflowModel(text17)
      ? 2
      : isDreaminaManifestOrModel(text17, text18)
        ? 1
        : 9;
    return makePolicy(['text', 'image'], { image: image3, video: 0, audio: 0 });
  }
  if (text16 === 'ai-video') {
    if (isDreaminaStyleVideoModel(text17, text18)) return makeDreaminaStyleVideoPolicy(options7);
    if (isHappyHorseVideoModel(text17, text18)) return makeHappyHorseVideoPolicy(options7);
    if (isSeedance2VideoModel(text17, text18)) return makeSeedance2VideoPolicy(options7);
    if (isApimartWan27VideoModel(text17, text18)) return makeWan27VideoPolicy(options7);
    if (isApimartKlingV3OmniVideoModel(text17, text18)) return makeKlingV3OmniVideoPolicy(options7);
    if (isApimartViduQ3VideoModel(text17, text18)) return makeViduQ3VideoPolicy(options7);
    const manifestInputPolicy2 = makeManifestInputPolicy(getModelManifest(text17)?.inputSlots, options7);
    if (manifestInputPolicy2) return manifestInputPolicy2;
    return makePolicy(['text', 'image', 'video'], { audio: 0 });
  }
  if (text16 === 'ai-audio') {
    const manifestInputPolicy3 = makeManifestInputPolicy(
      getModelManifest(audio || text17)?.inputSlots,
      options7,
    );
    if (manifestInputPolicy3) return manifestInputPolicy3;
    return makePolicy(['text', 'audio'], {
      image: 0,
      video: 0,
      audio: audio === 'voice_convert' ? 2 : 1,
    });
  }
  if (text16 === 'ai-text') {
    const modelManifest2 = getModelManifest(text17),
      manifestInputPolicy4 = makeManifestInputPolicy(modelManifest2?.inputSlots, options7);
    if (manifestInputPolicy4) return manifestInputPolicy4;
    const targetProvider =
      resolveTargetProvider(text17, text18) || normalizeProviderId(modelManifest2?.provider);
    if (targetProvider === 'apimart') return makePolicy(['text', 'image'], { video: 0, audio: 0 });
    return makePolicy(['text', 'image', 'video', 'audio'], {});
  }
  if (text16 === 'media-clip') return { allowedKinds: ['image', 'video', 'audio'], maxByKind: { text: 0 } };
  if (text16 === 'whiteboard')
    return {
      allowedKinds: ['image'],
      maxByKind: { text: 0, image: 1, video: 0, audio: 0 },
    };
  if (text16 === 'storyboard-script') {
    const text19 = normalizeText(options7.storyboardScript?.model) || text17,
      manifestInputPolicy5 = makeManifestInputPolicy(getModelManifest(text19)?.inputSlots, options7);
    if (manifestInputPolicy5) return manifestInputPolicy5;
  }
  if (text16 === 'storyboard' || text16 === 'storyboard-script')
    return makePolicy(['text', 'image', 'video'], { audio: 0 });
  return makePolicy(['text', 'image', 'video', 'audio'], {});
}
export function canTargetReceiveInputs(options8 = {}) {
  return INPUT_TARGET_NODE_TYPES.has(normalizeText(options8?.type));
}
export function getVideoSourceKey(response) {
  if (!response || typeof response !== 'object') return '';
  return (
    normalizeText(response.localPath) ||
    normalizeText(response.displayLocalPath) ||
    normalizeText(response.originalLocalPath) ||
    normalizeText(response.videoLocalPath) ||
    normalizeText(response.videoUrl) ||
    normalizeText(response.src) ||
    normalizeText(response.url) ||
    normalizeText(response.resultUrl) ||
    normalizeText(response.sourceUrl)
  );
}
function isUnavailableVideoRecord(value44) {
  const videoSourceKey = getVideoSourceKey(value44);
  if (!videoSourceKey) return false;
  return (
    value44?.mediaUnavailable === true && normalizeText(value44?.mediaUnavailableSource) === videoSourceKey
  );
}
export function hasUsableInputNodeSource(options9 = {}, value45 = {}) {
  const value46 = value45?.edge || value45 || null,
    inputKind3 = normalizeInputKind(value45?.kind) || resolveEffectiveInputKind(options9, value46);
  if (!inputKind3) return false;
  if (inputKind3 !== 'video') return true;
  const list11 = Array.isArray(options9?.videos) ? options9.videos : [];
  if (list11.some((item16) => getVideoSourceKey(item16) && !isUnavailableVideoRecord(item16))) return true;
  if (getVideoSourceKey(options9) && !isUnavailableVideoRecord(options9)) return true;
  const isVideoPath2 = isVideoPath(value46?.sourceMediaKey) ? normalizeText(value46?.sourceMediaKey) : '';
  return Boolean(isVideoPath2);
}
export function isInputNodeCompatibleWithTarget(options10 = {}, value47 = {}, edge = null) {
  if (!canTargetReceiveInputs(value47)) return false;
  const kind = resolveEffectiveInputKind(options10, edge);
  if (!kind) return false;
  if (!isInputKindAllowed(getTargetInputPolicy(value47), kind)) return false;
  return hasUsableInputNodeSource(options10, { edge: edge, kind: kind });
}
export function canAppendInputKindWithinLimit(value48, value49, value50 = {}) {
  const inputKind4 = normalizeInputKind(value49);
  if (!inputKind4) return false;
  if (!isInputKindAllowed(value48, inputKind4)) return false;
  const count = Number(value48?.maxByKind?.[inputKind4]);
  if (!Number.isFinite(count)) return true;
  if (count <= 0) return false;
  return Number(value50?.[inputKind4] || 0) < count;
}
export function isInputKindAllowed(value51, value52) {
  const inputKind5 = normalizeInputKind(value52);
  if (!inputKind5) return false;
  const list12 = Array.isArray(value51?.allowedKinds) ? value51.allowedKinds : INPUT_KIND_ORDER;
  return list12.includes(inputKind5);
}
export function getInputLimitReason(value53, value54, value55 = {}) {
  const inputKind6 = normalizeInputKind(value54);
  if (!inputKind6) return '';
  if (!isInputKindAllowed(value53, inputKind6)) return modelInputPolicyText('unsupported');
  const max = Number(value53?.maxByKind?.[inputKind6]);
  if (!Number.isFinite(max)) return '';
  if (max <= 0) return modelInputPolicyText('unsupported');
  const value56 = Number(value55?.[inputKind6] || 0);
  if (value56 < max) return '';
  return modelInputPolicyText('limitReached', { max: max, type: getInputKindLabel(inputKind6) });
}
