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
function modelInputPolicyText(_0x4d3bbf, _0x18f991 = {}) {
  return t('modelInputPolicy.' + _0x4d3bbf, _0x18f991);
}
export function getInputKindLabel(_0x178493) {
  const _0x359b50 = normalizeInputKind(_0x178493);
  if (!_0x359b50) return modelInputPolicyText('inputKinds.material');
  return modelInputPolicyText('inputKinds.' + _0x359b50);
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
function normalizeText(_0x1edf4b) {
  return String(_0x1edf4b || '').trim();
}
export function isRhPersonReplaceV3Model(_0x2ca372) {
  return getModelManifest(_0x2ca372)?.modelId === PERSON_REPLACE_V3_MODEL_ID;
}
function hasExactPersonReplaceFixedImageSlotCapability(_0x2780a1) {
  const _0x52eec8 = _0x2780a1?.capabilities?.fixedImageSlots;
  return (
    Array.isArray(_0x52eec8) &&
    _0x52eec8.length === RH_PERSON_REPLACE_FIXED_IMAGE_SLOTS.length &&
    _0x52eec8.every((_0x6a9bf4, _0x50ff93) => _0x6a9bf4 === RH_PERSON_REPLACE_FIXED_IMAGE_SLOTS[_0x50ff93])
  );
}
function hasPersonReplaceFixedImageInputSlots(_0x142304) {
  const _0x5c00a5 = _0x142304?.inputSlots?.fixedSlots;
  if (!Array.isArray(_0x5c00a5)) return false;
  return RH_PERSON_REPLACE_FIXED_IMAGE_SLOTS.every((_0x254e2c) =>
    _0x5c00a5.some((_0x370909) => _0x370909?.id === _0x254e2c && _0x370909?.kind === 'image'),
  );
}
function isDreaminaManifestOrModel(_0x146855, _0x4ea3b7 = '') {
  return resolveTargetProvider(_0x146855, _0x4ea3b7) === 'dreamina';
}
function isHappyHorseVideoModel(_0x1fd337, _0x5be303 = '') {
  const _0x15fb60 =
      resolveModelExecution(_0x1fd337, { providerHint: _0x5be303 }) || resolveModelExecution(_0x1fd337),
    _0x355af8 = normalizeText(_0x15fb60?.executionManifest?.extensions?.bodyResolver);
  return _0x355af8 && HAPPYHORSE_BODY_RESOLVERS.has(_0x355af8);
}
function isSeedance2VideoModel(_0x47473, _0xde6f29 = '') {
  const _0x3f14ef =
      resolveModelExecution(_0x47473, { providerHint: _0xde6f29 }) || resolveModelExecution(_0x47473),
    _0x5a9d17 = normalizeText(_0x3f14ef?.executionManifest?.extensions?.bodyResolver);
  return _0x5a9d17 && SEEDANCE_2_BODY_RESOLVERS.has(_0x5a9d17);
}
function isApimartWan27VideoModel(_0x18ab3b, _0x58165a = '') {
  const _0x520459 =
      resolveModelExecution(_0x18ab3b, { providerHint: _0x58165a }) || resolveModelExecution(_0x18ab3b),
    _0x5d910e = _0x520459?.modelManifest || getModelManifest(_0x18ab3b),
    _0x384581 = normalizeText(_0x520459?.canonicalModelId || _0x5d910e?.modelId || _0x18ab3b);
  if (_0x384581 !== APIMART_WAN27_MODEL_ID) return false;
  const _0x5b08f7 = normalizeProviderId(_0x5d910e?.provider) || resolveTargetProvider(_0x18ab3b, _0x58165a);
  return !_0x5b08f7 || _0x5b08f7 === 'apimart';
}
function isApimartKlingV3OmniVideoModel(_0x5ce851, _0x4ee3e2 = '') {
  const _0x36e5da =
      resolveModelExecution(_0x5ce851, { providerHint: _0x4ee3e2 }) || resolveModelExecution(_0x5ce851),
    _0x410218 = _0x36e5da?.modelManifest || getModelManifest(_0x5ce851),
    _0x3935a7 = normalizeText(_0x36e5da?.canonicalModelId || _0x410218?.modelId || _0x5ce851);
  if (_0x3935a7 !== APIMART_KLING_V3_OMNI_MODEL_ID) return false;
  const _0x5c3187 = normalizeProviderId(_0x410218?.provider) || resolveTargetProvider(_0x5ce851, _0x4ee3e2);
  return !_0x5c3187 || _0x5c3187 === 'apimart';
}
function isApimartViduQ3VideoModel(_0x57daae, _0x549427 = '') {
  const _0x5a1103 =
      resolveModelExecution(_0x57daae, { providerHint: _0x549427 }) || resolveModelExecution(_0x57daae),
    _0x32cdc1 = _0x5a1103?.modelManifest || getModelManifest(_0x57daae),
    _0x54e4bc = normalizeText(_0x5a1103?.canonicalModelId || _0x32cdc1?.modelId || _0x57daae);
  if (_0x54e4bc !== APIMART_VIDU_Q3_MODEL_ID) return false;
  const _0x532930 = normalizeProviderId(_0x32cdc1?.provider) || resolveTargetProvider(_0x57daae, _0x549427);
  return !_0x532930 || _0x532930 === 'apimart';
}
function resolveTargetProvider(_0xe6da2, _0x258b1b = '') {
  const _0x1df24a = normalizeProviderId(_0x258b1b);
  if (_0x1df24a) return _0x1df24a;
  return (
    resolveModelProvider(_0xe6da2, '', { allowProviderHint: false, allowPrefixInference: false }) ||
    normalizeProviderId(getModelManifest(_0xe6da2)?.provider)
  );
}
export function isRhPersonReplaceWorkflowModel(_0x181cf1) {
  const _0x15720 = getModelManifest(_0x181cf1);
  return (
    _0x15720?.kind === 'image' &&
    hasExactPersonReplaceFixedImageSlotCapability(_0x15720) &&
    hasPersonReplaceFixedImageInputSlots(_0x15720)
  );
}
export function isRhQwenImageEditModel(_0x1c2757) {
  return normalizeText(_0x1c2757) === RH_QWEN_IMAGE_EDIT_MODEL;
}
const VIDEO_PATH_RE = /\.(?:mp4|mov|m4v|webm|mkv|avi|mpeg|mpg|3gp)(?:[?#].*)?$/i,
  AUDIO_PATH_RE = /\.(?:mp3|wav|m4a|aac|flac|ogg|opus|wma)(?:[?#].*)?$/i,
  IMAGE_PATH_RE = /\.(?:png|jpe?g|webp|gif|bmp|tiff?|avif)(?:[?#].*)?$/i;
export function normalizeInputKind(_0x23f852) {
  const _0x2c95e0 =
    _0x23f852 && typeof _0x23f852 === 'object' ? normalizeText(_0x23f852.type) : normalizeText(_0x23f852);
  if (!_0x2c95e0) return '';
  if (_0x2c95e0 === 'text' || _0x2c95e0 === 'source-text' || _0x2c95e0 === 'ai-text') return 'text';
  if (_0x2c95e0 === 'image' || _0x2c95e0 === 'source-image' || _0x2c95e0 === 'ai-image') return 'image';
  if (_0x2c95e0 === 'video' || _0x2c95e0 === 'source-video' || _0x2c95e0 === 'ai-video') return 'video';
  if (_0x2c95e0 === 'audio' || _0x2c95e0 === 'source-audio' || _0x2c95e0 === 'ai-audio') return 'audio';
  if (_0x2c95e0.includes('text')) return 'text';
  if (_0x2c95e0.includes('video')) return 'video';
  if (_0x2c95e0.includes('audio')) return 'audio';
  if (_0x2c95e0.includes('image')) return 'image';
  return '';
}
function normalizeExplicitMediaKind(_0x42293b) {
  const _0x101755 = normalizeText(_0x42293b).toLowerCase();
  if (!_0x101755) return '';
  if (_0x101755 === 'text' || _0x101755 === 'source-text' || _0x101755 === 'ai-text') return 'text';
  if (
    _0x101755 === 'image' ||
    _0x101755 === 'source-image' ||
    _0x101755 === 'ai-image' ||
    _0x101755 === 'asset-image' ||
    _0x101755.startsWith('image/')
  )
    return 'image';
  if (
    _0x101755 === 'video' ||
    _0x101755 === 'source-video' ||
    _0x101755 === 'ai-video' ||
    _0x101755 === 'asset-video' ||
    _0x101755.startsWith('video/')
  )
    return 'video';
  if (
    _0x101755 === 'audio' ||
    _0x101755 === 'source-audio' ||
    _0x101755 === 'ai-audio' ||
    _0x101755 === 'asset-audio' ||
    _0x101755.startsWith('audio/')
  )
    return 'audio';
  return '';
}
function hasPathLikeValue(_0x954199, _0x319eba, _0x2548d6) {
  if (!_0x954199 || typeof _0x954199 !== 'object') return false;
  return _0x319eba.some((_0x123a0b) => _0x2548d6(normalizeText(_0x954199?.[_0x123a0b])));
}
function isVideoPath(_0x29f6aa) {
  return VIDEO_PATH_RE.test(normalizeText(_0x29f6aa));
}
function isAudioPath(_0x31d2df) {
  return AUDIO_PATH_RE.test(normalizeText(_0x31d2df));
}
function isImagePath(_0x47c737) {
  return IMAGE_PATH_RE.test(normalizeText(_0x47c737));
}
function hasExplicitKind(_0x3f8f7d, _0x38434e) {
  if (!_0x3f8f7d || typeof _0x3f8f7d !== 'object') return false;
  const _0x1d753c = [
    'kind',
    'mediaKind',
    'mediaTaskKind',
    'asyncTaskKind',
    'assetKind',
    'assetType',
    'mediaType',
    'mimeType',
  ];
  return _0x1d753c.some((_0x53048) => normalizeExplicitMediaKind(_0x3f8f7d?.[_0x53048]) === _0x38434e);
}
function hasVideoEvidence(_0x2ff5f3 = {}, _0x3e6cd1 = null) {
  if (!_0x2ff5f3 || typeof _0x2ff5f3 !== 'object') return false;
  if (hasExplicitKind(_0x2ff5f3, 'video')) return true;
  const _0x3ec90b = Array.isArray(_0x2ff5f3.videos) ? _0x2ff5f3.videos : [];
  if (_0x3ec90b.some((_0x4c6834) => getVideoSourceKey(_0x4c6834) || hasExplicitKind(_0x4c6834, 'video')))
    return true;
  if (
    hasPathLikeValue(
      _0x2ff5f3,
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
  return hasPathLikeValue(_0x3e6cd1, ['sourceMediaKey', 'videoUrl', 'localPath'], isVideoPath);
}
function hasAudioEvidence(_0x3f6d65 = {}, _0x1964e2 = null) {
  if (!_0x3f6d65 || typeof _0x3f6d65 !== 'object') return false;
  if (hasExplicitKind(_0x3f6d65, 'audio')) return true;
  if (Array.isArray(_0x3f6d65.audios) && _0x3f6d65.audios.length > 0) return true;
  if (
    hasPathLikeValue(
      _0x3f6d65,
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
  return hasPathLikeValue(_0x1964e2, ['sourceMediaKey', 'audioUrl', 'localPath'], isAudioPath);
}
function hasImageEvidence(_0x59d65a = {}, _0x4ed2bb = null) {
  if (!_0x59d65a || typeof _0x59d65a !== 'object') return false;
  if (hasExplicitKind(_0x59d65a, 'image')) return true;
  if (Array.isArray(_0x59d65a.images) && _0x59d65a.images.length > 0) return true;
  if (_0x59d65a.thumbId || _0x59d65a.thumbUrl || _0x59d65a.imageUrl || _0x59d65a.posterLocalPath) return true;
  if (
    hasPathLikeValue(
      _0x59d65a,
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
  return hasPathLikeValue(_0x4ed2bb, ['sourceMediaKey', 'imageUrl', 'localPath'], isImagePath);
}
export function resolveEffectiveInputKind(_0x15bbb1, _0x4ced6 = null) {
  if (!_0x15bbb1 || typeof _0x15bbb1 !== 'object') return normalizeInputKind(_0x15bbb1);
  const _0x58185d = normalizeInputKind(_0x15bbb1);
  if (hasVideoEvidence(_0x15bbb1, _0x4ced6)) return 'video';
  if (hasAudioEvidence(_0x15bbb1, _0x4ced6)) return 'audio';
  if (_0x58185d) return _0x58185d;
  if (hasImageEvidence(_0x15bbb1, _0x4ced6)) return 'image';
  return '';
}
function makePolicy(_0x3f68c5, _0x54605a = {}) {
  const _0x37fa45 = new Set(
    ['text', ...(Array.isArray(_0x3f68c5) ? _0x3f68c5 : [])]
      .map((_0x10d27a) => normalizeInputKind(_0x10d27a))
      .filter(Boolean),
  );
  return {
    allowedKinds: INPUT_KIND_ORDER.filter((_0x28c476) => _0x37fa45.has(_0x28c476)),
    maxByKind: { ..._0x54605a },
  };
}
function makeManifestInputPolicy(_0x3c9671) {
  if (!_0x3c9671 || typeof _0x3c9671 !== 'object') return null;
  const _0xab5035 = Array.isArray(_0x3c9671.allowedKinds) ? _0x3c9671.allowedKinds : [];
  return {
    allowedKinds: INPUT_KIND_ORDER.filter((_0x240ba6) => _0xab5035.includes(_0x240ba6)),
    maxByKind: { ...(_0x3c9671.maxByKind || {}) },
  };
}
function makeDreaminaStyleVideoPolicy(_0x150ca4) {
  const _0x46af14 =
      _0x150ca4?.generationParams && typeof _0x150ca4.generationParams === 'object'
        ? _0x150ca4.generationParams
        : {},
    _0x2d3631 = normalizeDreaminaVideoRouteMode(
      _0x46af14.dreaminaRouteMode ?? _0x150ca4?.dreaminaRouteMode,
      _0x150ca4?.mode,
    );
  if (_0x2d3631 === 'frames2video') return makePolicy(['text', 'image'], { image: 2, video: 0, audio: 0 });
  if (_0x2d3631 === 'multiframe2video')
    return makePolicy(['text', 'image'], { image: 20, video: 0, audio: 0 });
  return makePolicy(['text', 'image', 'video', 'audio'], { image: 9, video: 3, audio: 3 });
}
function normalizeHappyHorseVideoMode(_0x42adc7) {
  const _0x53bcdb = normalizeText(_0x42adc7).toLowerCase();
  return _0x53bcdb === 'image' || _0x53bcdb === 'reference' || _0x53bcdb === 'edit' ? _0x53bcdb : 'auto';
}
function getHappyHorseVideoMode(_0x5ae57c = {}) {
  const _0x259683 =
    _0x5ae57c?.generationParams && typeof _0x5ae57c.generationParams === 'object'
      ? _0x5ae57c.generationParams
      : {};
  return normalizeHappyHorseVideoMode(_0x259683.happyhorse_mode ?? _0x5ae57c?.happyhorse_mode);
}
function makeHappyHorseVideoPolicy(_0x14d6e4) {
  const _0x3793fb = getHappyHorseVideoMode(_0x14d6e4);
  if (_0x3793fb === 'image') return makePolicy(['text', 'image'], { image: 1, video: 0, audio: 0 });
  if (_0x3793fb === 'reference') return makePolicy(['text', 'image'], { image: 9, video: 0, audio: 0 });
  if (_0x3793fb === 'edit') return makePolicy(['text', 'image', 'video'], { image: 5, video: 1, audio: 0 });
  return makePolicy(['text'], { image: 0, video: 0, audio: 0 });
}
function normalizeSeedance2VideoMode(_0x36947a, _0x7f5559 = 'text2video') {
  const _0x16ad64 = normalizeText(_0x36947a).toLowerCase();
  if (_0x16ad64 === 'multimodal2video' || _0x16ad64 === 'reference') return 'multimodal2video';
  if (_0x16ad64 === 'frames2video' || _0x16ad64 === 'frames') return 'frames2video';
  if (_0x16ad64 === 'image2video' || _0x16ad64 === 'image' || _0x16ad64 === 'frame') return 'image2video';
  if (_0x16ad64 === 'text2video' || _0x16ad64 === 'text') return 'text2video';
  return _0x7f5559 === 'multimodal2video' ? 'multimodal2video' : 'text2video';
}
function getSeedance2VideoMode(_0x26b282 = {}) {
  const _0x126c94 =
      _0x26b282?.generationParams && typeof _0x26b282.generationParams === 'object'
        ? _0x26b282.generationParams
        : {},
    _0x388e52 = normalizeText(_0x26b282?.provider).toLowerCase(),
    _0x2dfbbd = normalizeText(_0x26b282?.model).toLowerCase(),
    _0xb3a77a = _0x388e52 === 'volcengine' || _0x2dfbbd.startsWith('volcengine/');
  return normalizeSeedance2VideoMode(
    _0x126c94.rh_seedance_2_mode ??
      _0x126c94.volcengine_seedance_2_mode ??
      _0x26b282?.rh_seedance_2_mode ??
      _0x26b282?.volcengine_seedance_2_mode,
    _0xb3a77a ? 'multimodal2video' : 'text2video',
  );
}
function makeSeedance2VideoPolicy(_0x4aebab) {
  const _0x2ecea9 = getSeedance2VideoMode(_0x4aebab);
  if (_0x2ecea9 === 'multimodal2video')
    return makePolicy(['text', 'image', 'video', 'audio'], { image: 9, video: 3, audio: 3 });
  if (_0x2ecea9 === 'frames2video') return makePolicy(['text', 'image'], { image: 2, video: 0, audio: 0 });
  if (_0x2ecea9 === 'image2video') return makePolicy(['text', 'image'], { image: 1, video: 0, audio: 0 });
  return makePolicy(['text'], { image: 0, video: 0, audio: 0 });
}
function normalizeWan27VideoMode(_0x36b7f6) {
  const _0x34485a = normalizeText(_0x36b7f6).toLowerCase();
  return _0x34485a === 'video' || _0x34485a === 'reference' || _0x34485a === 'edit' ? _0x34485a : 'image';
}
function getWan27VideoMode(_0x397295 = {}) {
  const _0x2b7f64 =
    _0x397295?.generationParams && typeof _0x397295.generationParams === 'object'
      ? _0x397295.generationParams
      : {};
  return normalizeWan27VideoMode(_0x2b7f64.wan27_mode ?? _0x397295?.wan27_mode);
}
function makeWan27VideoPolicy(_0x29a6a3) {
  const _0x2038c8 = getWan27VideoMode(_0x29a6a3);
  if (_0x2038c8 === 'video') return makePolicy(['text', 'video'], { image: 0, video: 1, audio: 0 });
  if (_0x2038c8 === 'reference')
    return makePolicy(['text', 'image', 'video', 'audio'], { image: 1, video: 1, audio: 1 });
  if (_0x2038c8 === 'edit') return makePolicy(['text', 'video'], { image: 0, video: 2, audio: 0 });
  return makePolicy(['text', 'image', 'audio'], { image: 2, video: 0, audio: 1 });
}
function normalizeKlingV3OmniVideoMode(_0x3fb7d6) {
  const _0x27f269 = normalizeText(_0x3fb7d6).toLowerCase();
  return _0x27f269 === 'reference' || _0x27f269 === 'edit' ? _0x27f269 : 'image';
}
function getKlingV3OmniVideoMode(_0x4317fe = {}) {
  const _0x4c65a2 =
    _0x4317fe?.generationParams && typeof _0x4317fe.generationParams === 'object'
      ? _0x4317fe.generationParams
      : {};
  return normalizeKlingV3OmniVideoMode(_0x4c65a2.kling_v3_omni_mode ?? _0x4317fe?.kling_v3_omni_mode);
}
function makeKlingV3OmniVideoPolicy(_0x3be5da) {
  const _0x278047 = getKlingV3OmniVideoMode(_0x3be5da);
  if (_0x278047 === 'reference')
    return makePolicy(['text', 'image', 'video'], { image: 1, video: 1, audio: 0 });
  if (_0x278047 === 'edit') return makePolicy(['text', 'video'], { image: 0, video: 1, audio: 0 });
  return makePolicy(['text', 'image'], { image: 2, video: 0, audio: 0 });
}
function normalizeViduQ3GenerationMode(_0x43318c) {
  const _0x420172 = normalizeText(_0x43318c).toLowerCase();
  return _0x420172 === 'reference' ? 'reference' : 'video';
}
function getViduQ3GenerationMode(_0x48da77 = {}) {
  const _0x42a48f =
    _0x48da77?.generationParams && typeof _0x48da77.generationParams === 'object'
      ? _0x48da77.generationParams
      : {};
  return normalizeViduQ3GenerationMode(
    _0x42a48f.vidu_q3_generation_mode ?? _0x48da77?.vidu_q3_generation_mode,
  );
}
function makeViduQ3VideoPolicy(_0x147e3d) {
  const _0x43e0b1 = getViduQ3GenerationMode(_0x147e3d);
  return makePolicy(['text', 'image'], { image: _0x43e0b1 === 'reference' ? 7 : 2, video: 0, audio: 0 });
}
export function getTargetInputPolicy(_0x1526f0 = {}) {
  const _0x32f7fc = normalizeText(_0x1526f0?.type),
    _0x506028 = normalizeText(_0x1526f0?.model),
    _0x49a58a = normalizeText(_0x1526f0?.provider).toLowerCase(),
    _0x379dc6 = normalizeText(_0x1526f0?.audioWorkflowKey);
  if (_0x32f7fc === 'ai-image') {
    const _0x172ecb = makeManifestInputPolicy(getModelManifest(_0x506028)?.inputSlots);
    if (_0x172ecb) return _0x172ecb;
    const _0x24ebc9 = isRhPersonReplaceWorkflowModel(_0x506028)
      ? 2
      : isDreaminaManifestOrModel(_0x506028, _0x49a58a)
        ? 1
        : 9;
    return makePolicy(['text', 'image'], { image: _0x24ebc9, video: 0, audio: 0 });
  }
  if (_0x32f7fc === 'ai-video') {
    if (isDreaminaStyleVideoModel(_0x506028, _0x49a58a)) return makeDreaminaStyleVideoPolicy(_0x1526f0);
    if (isHappyHorseVideoModel(_0x506028, _0x49a58a)) return makeHappyHorseVideoPolicy(_0x1526f0);
    if (isSeedance2VideoModel(_0x506028, _0x49a58a)) return makeSeedance2VideoPolicy(_0x1526f0);
    if (isApimartWan27VideoModel(_0x506028, _0x49a58a)) return makeWan27VideoPolicy(_0x1526f0);
    if (isApimartKlingV3OmniVideoModel(_0x506028, _0x49a58a)) return makeKlingV3OmniVideoPolicy(_0x1526f0);
    if (isApimartViduQ3VideoModel(_0x506028, _0x49a58a)) return makeViduQ3VideoPolicy(_0x1526f0);
    const _0x39bbef = makeManifestInputPolicy(getModelManifest(_0x506028)?.inputSlots);
    if (_0x39bbef) return _0x39bbef;
    return makePolicy(['text', 'image', 'video'], { audio: 0 });
  }
  if (_0x32f7fc === 'ai-audio') {
    const _0x1e80a9 = makeManifestInputPolicy(getModelManifest(_0x379dc6 || _0x506028)?.inputSlots);
    if (_0x1e80a9) return _0x1e80a9;
    return makePolicy(['text', 'audio'], {
      image: 0,
      video: 0,
      audio: _0x379dc6 === 'voice_convert' ? 2 : 1,
    });
  }
  if (_0x32f7fc === 'ai-text') {
    const _0xad477d = getModelManifest(_0x506028),
      _0x37bae8 = resolveTargetProvider(_0x506028, _0x49a58a) || normalizeProviderId(_0xad477d?.provider);
    if (_0x37bae8 === 'apimart') return makePolicy(['text', 'image'], { video: 0, audio: 0 });
    return makePolicy(['text', 'image', 'video', 'audio'], {});
  }
  if (_0x32f7fc === 'media-clip')
    return { allowedKinds: ['image', 'video', 'audio'], maxByKind: { text: 0 } };
  if (_0x32f7fc === 'storyboard' || _0x32f7fc === 'storyboard-script')
    return makePolicy(['text', 'image', 'video'], { audio: 0 });
  return makePolicy(['text', 'image', 'video', 'audio'], {});
}
export function canTargetReceiveInputs(_0x193845 = {}) {
  return INPUT_TARGET_NODE_TYPES.has(normalizeText(_0x193845?.type));
}
function getVideoSourceKey(_0x52c3ce) {
  if (!_0x52c3ce || typeof _0x52c3ce !== 'object') return '';
  return (
    normalizeText(_0x52c3ce.localPath) ||
    normalizeText(_0x52c3ce.displayLocalPath) ||
    normalizeText(_0x52c3ce.originalLocalPath) ||
    normalizeText(_0x52c3ce.videoLocalPath) ||
    normalizeText(_0x52c3ce.videoUrl) ||
    normalizeText(_0x52c3ce.src) ||
    normalizeText(_0x52c3ce.url) ||
    normalizeText(_0x52c3ce.resultUrl) ||
    normalizeText(_0x52c3ce.sourceUrl)
  );
}
function isUnavailableVideoRecord(_0xf8f554) {
  const _0x550e54 = getVideoSourceKey(_0xf8f554);
  if (!_0x550e54) return false;
  return (
    _0xf8f554?.mediaUnavailable === true && normalizeText(_0xf8f554?.mediaUnavailableSource) === _0x550e54
  );
}
export function hasUsableInputNodeSource(_0x2d03cf = {}, _0xb2bad2 = {}) {
  const _0x4cd2f6 = _0xb2bad2?.edge || _0xb2bad2 || null,
    _0x54bb6c = normalizeInputKind(_0xb2bad2?.kind) || resolveEffectiveInputKind(_0x2d03cf, _0x4cd2f6);
  if (!_0x54bb6c) return false;
  if (_0x54bb6c !== 'video') return true;
  const _0x1fdf78 = Array.isArray(_0x2d03cf?.videos) ? _0x2d03cf.videos : [];
  if (_0x1fdf78.some((_0x5b274b) => getVideoSourceKey(_0x5b274b) && !isUnavailableVideoRecord(_0x5b274b)))
    return true;
  if (getVideoSourceKey(_0x2d03cf) && !isUnavailableVideoRecord(_0x2d03cf)) return true;
  const _0x76b236 = isVideoPath(_0x4cd2f6?.sourceMediaKey) ? normalizeText(_0x4cd2f6?.sourceMediaKey) : '';
  return Boolean(_0x76b236);
}
export function isInputNodeCompatibleWithTarget(_0xbf43f7 = {}, _0x5267e6 = {}, _0x1b98ec = null) {
  if (!canTargetReceiveInputs(_0x5267e6)) return false;
  const _0x5a0757 = resolveEffectiveInputKind(_0xbf43f7, _0x1b98ec);
  if (!_0x5a0757) return false;
  if (!isInputKindAllowed(getTargetInputPolicy(_0x5267e6), _0x5a0757)) return false;
  return hasUsableInputNodeSource(_0xbf43f7, { edge: _0x1b98ec, kind: _0x5a0757 });
}
export function canAppendInputKindWithinLimit(_0x335300, _0x3f0b6b, _0x12d9b6 = {}) {
  const _0x202a18 = normalizeInputKind(_0x3f0b6b);
  if (!_0x202a18) return false;
  if (!isInputKindAllowed(_0x335300, _0x202a18)) return false;
  const _0x54f28a = Number(_0x335300?.maxByKind?.[_0x202a18]);
  if (!Number.isFinite(_0x54f28a)) return true;
  if (_0x54f28a <= 0) return false;
  return Number(_0x12d9b6?.[_0x202a18] || 0) < _0x54f28a;
}
export function isInputKindAllowed(_0x36fbb1, _0x172464) {
  const _0x224a98 = normalizeInputKind(_0x172464);
  if (!_0x224a98) return false;
  const _0x7a904f = Array.isArray(_0x36fbb1?.allowedKinds) ? _0x36fbb1.allowedKinds : INPUT_KIND_ORDER;
  return _0x7a904f.includes(_0x224a98);
}
export function getInputLimitReason(_0x42eff4, _0x53f441, _0x2c577e = {}) {
  const _0x5af408 = normalizeInputKind(_0x53f441);
  if (!_0x5af408) return '';
  if (!isInputKindAllowed(_0x42eff4, _0x5af408)) return modelInputPolicyText('unsupported');
  const _0x358c86 = Number(_0x42eff4?.maxByKind?.[_0x5af408]);
  if (!Number.isFinite(_0x358c86)) return '';
  if (_0x358c86 <= 0) return modelInputPolicyText('unsupported');
  const _0x214b78 = Number(_0x2c577e?.[_0x5af408] || 0);
  if (_0x214b78 < _0x358c86) return '';
  return modelInputPolicyText('limitReached', { max: _0x358c86, type: getInputKindLabel(_0x5af408) });
}
